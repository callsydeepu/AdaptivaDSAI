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


class EvaluationService:

    @staticmethod
    def evaluate_dataset(dataset_id: str):
        # 1. Load Dataset Metadata
        dataset = DatasetService.get_dataset_by_id(dataset_id)
        if dataset is None:
            return None

        # 2. Load Processed Dataset
        processed_path = os.path.join("processed", f"{dataset_id}.csv")
        if not os.path.exists(processed_path):
            raise FileNotFoundError("Processed dataset not found")

        df = pd.read_csv(processed_path)
        if df.empty or len(df.columns) == 0 or len(df) == 0:
            raise ValueError("Dataset empty")

        # 3. Scan for Trained Models
        trained_models_dir = "trained_models"
        if not os.path.exists(trained_models_dir):
            raise FileNotFoundError("Training results not found")

        model_files = [
            f for f in os.listdir(trained_models_dir)
            if f.startswith(f"{dataset_id}_") and f.endswith(".pkl")
        ]
        if not model_files:
            raise FileNotFoundError("Training results not found")

        # 4. Load Problem Details
        problem_info = ProblemDetectionService.detect_problem(dataset_id)
        if problem_info is None:
            return None

        problem_type = problem_info.get("problem_type")
        classification_type = problem_info.get("classification_type")

        # 5. Split Test Data (identical to training split)
        target_column = df.columns[-1]
        X = df.drop(columns=[target_column])
        y = df[target_column]

        _, X_test, _, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        detailed_results = {}

        # 6. Evaluate Each Model
        for file_name in model_files:
            # File name pattern: <dataset_id>_<model_name>.pkl
            # Strip dataset_id and extension to get model name
            model_name = file_name[len(dataset_id) + 1:-4]
            model_path = os.path.join(trained_models_dir, file_name)

            try:
                model = joblib.load(model_path)
            except Exception:
                continue

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

                # Visuals
                cm = confusion_matrix(y_test, y_pred).tolist()
                rep = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

                # Weaknesses detection
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

                # Residuals statistics
                residuals = y_test - y_pred
                residuals_stats = {
                    "mean": float(residuals.mean()),
                    "median": float(residuals.median()),
                    "std": float(residuals.std(ddof=0)),
                    "min": float(residuals.min()),
                    "max": float(residuals.max()),
                }

                # Weaknesses
                if r2_val < 0.50:
                    weaknesses.append(f"Low R² score ({r2_val:.2f}). Model struggles to explain dataset variance.")
                # If std is large compared to mean absolute target value
                y_mean = y_test.abs().mean()
                if y_mean > 0 and residuals_stats["std"] / y_mean > 0.5:
                    weaknesses.append("High residual standard deviation relative to target mean, indicating high prediction variance.")

                detailed_results[model_name] = {
                    "metrics": metrics,
                    "residual_statistics": residuals_stats,
                    "weaknesses": weaknesses,
                }

            # Feature Importance
            if hasattr(model, "feature_importances_"):
                importances = model.feature_importances_
                feature_names = X.columns.tolist()
                feat_imp = {
                    name: float(imp)
                    for name, imp in zip(feature_names, importances)
                }
                # Sort descending
                feat_imp = dict(
                    sorted(feat_imp.items(), key=lambda item: item[1], reverse=True)
                )
                detailed_results[model_name]["feature_importance"] = feat_imp

        if not detailed_results:
            raise RuntimeError("No models were successfully evaluated")

        # 7. Comparison and Best Model
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

        # Sort comparison list descending
        compare_key = "accuracy" if problem_type == "Classification" else "r2_score"
        model_comparison = sorted(
            model_comparison, key=lambda x: x[compare_key], reverse=True
        )

        # 8. Feature Importance at top level (extract from best tree model or any tree model)
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
            "problem_type": problem_type,
            "best_model": best_model,
            "model_comparison": model_comparison,
            "feature_importance": top_feature_importance,
            "detailed_results": detailed_results,
        }

        # 9. Storage
        results_dir = "evaluation_results"
        os.makedirs(results_dir, exist_ok=True)
        results_path = os.path.join(results_dir, f"{dataset_id}.json")
        with open(results_path, "w") as f:
            json.dump(evaluation_data, f, indent=4)

        return evaluation_data
