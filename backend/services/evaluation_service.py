import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from services.dataset_service import DatasetService
from services.problem_detection_service import ProblemDetectionService
from repositories.training_repository import TrainingRepository
from core.config import MODEL_DIR, PROCESSED_DIR
from core.logger import logger


class EvaluationService:

    @staticmethod
    def evaluate_dataset(dataset_id: str, experiment_id: str = None, user_id: str = None):
        # 1. Load Dataset Metadata
        dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=user_id)
        if dataset is None:
            return None

        # 2. Load Experiment Settings if applicable
        target_column = None
        split_ratio = 0.8
        if experiment_id is not None:
            from repositories.experiment_repository import ExperimentRepository
            experiment = ExperimentRepository.get_experiment(experiment_id, user_id=user_id)
            if experiment:
                target_column = experiment.get("target_column")
                split_ratio = experiment.get("split_ratio", 0.8)

        # 3. Load Processed Dataset
        suffix = f"_{experiment_id}" if experiment_id else ""
        processed_path = os.path.join(PROCESSED_DIR, f"{dataset_id}{suffix}.csv")
        if not os.path.exists(processed_path):
            raise FileNotFoundError("Processed dataset not found")

        df = pd.read_csv(processed_path)
        if df.empty or len(df.columns) == 0 or len(df) == 0:
            raise ValueError("Dataset empty")

        # 4. Scan for Trained Models
        logger.info(f"Starting model evaluation for dataset {dataset_id} (experiment {experiment_id})")
        trained_models_dir = MODEL_DIR
        if not os.path.exists(trained_models_dir):
            raise FileNotFoundError("Training results not found")

        supported_model_names = [
            "LogisticRegression", "RandomForestClassifier", "DecisionTreeClassifier",
            "LinearRegression", "RandomForestRegressor", "DecisionTreeRegressor"
        ]
        model_files = []
        for f in os.listdir(trained_models_dir):
            if not f.endswith(".pkl"):
                continue
            if experiment_id is not None:
                prefix = f"{dataset_id}_{experiment_id}_"
            else:
                prefix = f"{dataset_id}_"
            if f.startswith(prefix):
                remainder = f[len(prefix):-4]
                if remainder in supported_model_names:
                    model_files.append(f)
        if not model_files:
            raise FileNotFoundError("Training results not found")

        # 5. Load or Infer Target Column & Problem Details
        if target_column is None:
            target_column = df.columns[-1]
        elif target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset")

        if experiment_id is not None:
            # Infer problem type dynamically
            y_col = df[target_column]
            if not pd.api.types.is_numeric_dtype(y_col):
                problem_type = "Classification"
                num_classes = y_col.nunique()
                classification_type = "Binary" if num_classes == 2 else "Multi-Class"
            else:
                num_classes = y_col.nunique()
                if num_classes <= 5 and pd.api.types.is_integer_dtype(y_col):
                    problem_type = "Classification"
                    classification_type = "Binary" if num_classes == 2 else "Multi-Class"
                else:
                    problem_type = "Regression"
                    classification_type = "N/A"
        else:
            problem_info = ProblemDetectionService.detect_problem(dataset_id, user_id=user_id)
            if problem_info is None:
                return None
            problem_type = problem_info.get("problem_type")
            classification_type = problem_info.get("classification_type")

        # 6. Split Test Data (identical to training split)
        X = df.drop(columns=[target_column])
        y = df[target_column]

        test_size = float(1.0 - split_ratio)
        _, X_test, _, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        detailed_results = {}

        # 7. Evaluate Each Model
        prefix = f"{dataset_id}_{experiment_id}_" if experiment_id else f"{dataset_id}_"
        for file_name in model_files:
            # File name pattern: <dataset_id>_<experiment_id>_<model_name>.pkl or <dataset_id>_<model_name>.pkl
            model_name = file_name[len(prefix):-4]
            model_path = os.path.join(trained_models_dir, file_name)

            try:
                model = joblib.load(model_path)
                y_pred = model.predict(X_test)
                metrics = {}
                weaknesses = []
                feat_imp = {}

                if problem_type == "Classification":
                    acc = float(accuracy_score(y_test, y_pred))
                    metrics["accuracy"] = acc

                    if classification_type == "Binary":
                        prec = float(precision_score(y_test, y_pred, zero_division=0))
                        rec = float(recall_score(y_test, y_pred, zero_division=0))
                        f1 = float(f1_score(y_test, y_pred, zero_division=0))
                    else:
                        prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
                        rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
                        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

                    metrics["precision"] = prec
                    metrics["recall"] = rec
                    metrics["f1_score"] = f1

                    cm = confusion_matrix(y_test, y_pred).tolist()
                    rep = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

                    if rec < 0.70:
                        weaknesses.append(f"Low recall ({rec:.2f}). Model misses a significant portion of actual positive cases.")
                    if prec < 0.70:
                        weaknesses.append(f"Low precision ({prec:.2f}). Model produces a relatively high number of false positives.")
                    if acc < 0.70:
                        weaknesses.append(f"Low overall accuracy ({acc:.2f}). Model may underfit the dataset.")

                    detailed_results[model_name] = {
                        "metrics": metrics,
                        "confusion_matrix": cm,
                        "classification_report": rep,
                        "weaknesses": weaknesses,
                    }
                else:
                    mae_val = float(mean_absolute_error(y_test, y_pred))
                    rmse_val = float(np.sqrt(mean_squared_error(y_test, y_pred)))
                    r2_val = float(r2_score(y_test, y_pred))

                    metrics["mae"] = mae_val
                    metrics["rmse"] = rmse_val
                    metrics["r2_score"] = r2_val

                    residuals = y_test - y_pred
                    residuals_stats = {
                        "mean": float(residuals.mean()),
                        "median": float(residuals.median()),
                        "std": float(residuals.std(ddof=0)),
                        "min": float(residuals.min()),
                        "max": float(residuals.max()),
                    }

                    if r2_val < 0.50:
                        weaknesses.append(f"Low R² score ({r2_val:.2f}). Model struggles to explain dataset variance.")
                    y_mean = y_test.abs().mean()
                    if y_mean > 0 and residuals_stats["std"] / y_mean > 0.5:
                        weaknesses.append("High residual standard deviation relative to target mean, indicating high prediction variance.")

                    detailed_results[model_name] = {
                        "metrics": metrics,
                        "residual_statistics": residuals_stats,
                        "weaknesses": weaknesses,
                    }

                if hasattr(model, "feature_importances_"):
                    importances = model.feature_importances_
                    feature_names = X.columns.tolist()
                    feat_imp = {
                        name: float(imp)
                        for name, imp in zip(feature_names, importances)
                    }
                    feat_imp = dict(
                        sorted(feat_imp.items(), key=lambda item: item[1], reverse=True)
                    )
                    detailed_results[model_name]["feature_importance"] = feat_imp
            except Exception as e:
                logger.error(f"Error evaluating model {model_name}: {e}", exc_info=True)
                continue

        if not detailed_results:
            raise RuntimeError("No models were successfully evaluated")

        # 8. Comparison and Best Model
        model_comparison = []
        best_model = None
        best_metric_val = -float("inf")

        for m_name, m_eval in detailed_results.items():
            if problem_type == "Classification":
                metric_val = m_eval["metrics"]["accuracy"]
                model_comparison.append({
                    "model": m_name,
                    "accuracy": metric_val,
                    "f1_score": m_eval["metrics"]["f1_score"]
                })
            else:
                metric_val = m_eval["metrics"]["r2_score"]
                model_comparison.append({
                    "model": m_name,
                    "r2_score": metric_val,
                    "mae": m_eval["metrics"]["mae"]
                })

            if metric_val > best_metric_val:
                best_metric_val = metric_val
                best_model = m_name

        compare_key = "accuracy" if problem_type == "Classification" else "r2_score"
        model_comparison = sorted(
            model_comparison, key=lambda x: x[compare_key], reverse=True
        )

        top_feature_importance = {}
        for m_name in [
            best_model,
            "RandomForestClassifier",
            "RandomForestRegressor",
            "DecisionTreeClassifier",
            "DecisionTreeRegressor",
        ]:
            if m_name in detailed_results and "feature_importance" in detailed_results[m_name]:
                top_feature_importance = detailed_results[m_name]["feature_importance"]
                break

        evaluation_data = {
            "dataset_id": dataset_id,
            "experiment_id": experiment_id,
            "problem_type": problem_type,
            "best_model": best_model,
            "model_comparison": model_comparison,
            "feature_importance": top_feature_importance,
            "detailed_results": detailed_results,
        }

        # 9. Storage
        TrainingRepository.save_evaluation_result(evaluation_data, user_id=user_id)
        logger.info(f"Model evaluation completed successfully for dataset {dataset_id} (experiment {experiment_id}). Best model: {best_model}")

        return evaluation_data

