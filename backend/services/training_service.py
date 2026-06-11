import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from services.dataset_service import DatasetService
from services.problem_detection_service import ProblemDetectionService
from services.model_recommendation_service import ModelRecommendationService
from repositories.training_repository import TrainingRepository
from core.config import MODEL_DIR, PROCESSED_DIR
from core.logger import logger


class TrainingService:

    @staticmethod
    def train_models(
        dataset_id: str,
        experiment_id: str = None,
        target_column: str = None,
        split_ratio: float = 0.8,
        selected_models: list = None,
        hyperparameters: dict = None,
        user_id: str = None
    ):
        # 1. Load Dataset Metadata
        dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=user_id)
        if dataset is None:
            return None

        # 2. Load Processed Dataset
        suffix = f"_{experiment_id}" if experiment_id else ""
        processed_path = os.path.join(PROCESSED_DIR, f"{dataset_id}{suffix}.csv")
        if not os.path.exists(processed_path):
            if not experiment_id:
                logger.info(f"Processed dataset not found for dataset {dataset_id}. Triggering feature engineering dynamically.")
                from services.feature_engineering_service import FeatureEngineeringService
                fe_res = FeatureEngineeringService.process_dataset(dataset_id, user_id=user_id)
                if fe_res is None or not os.path.exists(processed_path):
                    raise FileNotFoundError("Processed dataset not found")
            else:
                raise FileNotFoundError("Processed dataset not found for custom experiment")

        df = pd.read_csv(processed_path)
        if df.empty or len(df.columns) == 0 or len(df) == 0:
            raise ValueError("Dataset empty")

        # 3. Load or Infer Target Column
        if target_column is None:
            target_column = df.columns[-1]
        elif target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset")

        # 4. Load or Infer Problem Details
        if experiment_id is not None:
            # Infer problem type for target column dynamically
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

        # 5. Filter supported models
        supported_class_models = ["LogisticRegression", "RandomForestClassifier", "DecisionTreeClassifier"]
        supported_reg_models = ["LinearRegression", "RandomForestRegressor", "DecisionTreeRegressor"]

        models_to_train = []
        candidates = selected_models if selected_models else (supported_class_models if problem_type == "Classification" else supported_reg_models)
        
        for model_name in candidates:
            if problem_type == "Classification" and model_name in supported_class_models:
                models_to_train.append(model_name)
            elif problem_type == "Regression" and model_name in supported_reg_models:
                models_to_train.append(model_name)

        if not models_to_train:
            if problem_type == "Classification":
                models_to_train = supported_class_models.copy()
            else:
                models_to_train = supported_reg_models.copy()

        # 6. Split Data
        X = df.drop(columns=[target_column])
        y = df[target_column]

        test_size = float(1.0 - split_ratio)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        logger.info(f"Training models for dataset {dataset_id} (experiment {experiment_id}). Models to train: {models_to_train}")
        model_results = []
        trained_models_dir = MODEL_DIR
        os.makedirs(trained_models_dir, exist_ok=True)

        # 7. Fit & Evaluate Models
        for model_name in models_to_train:
            if model_name == "LogisticRegression":
                params = hyperparameters.get("LogisticRegression", {}) if hyperparameters else {}
                max_iter = params.get("max_iter", 1000)
                C = params.get("C", 1.0)
                try:
                    max_iter = int(max_iter) if max_iter is not None else 1000
                except ValueError:
                    max_iter = 1000
                try:
                    C = float(C) if C is not None else 1.0
                except ValueError:
                    C = 1.0
                model = LogisticRegression(max_iter=max_iter, C=C, random_state=42)
            elif model_name == "RandomForestClassifier":
                params = hyperparameters.get("RandomForestClassifier", {}) if hyperparameters else {}
                n_estimators = params.get("n_estimators", 100)
                max_depth = params.get("max_depth", None)
                try:
                    n_estimators = int(n_estimators) if n_estimators is not None else 100
                except ValueError:
                    n_estimators = 100
                try:
                    max_depth = int(max_depth) if (max_depth is not None and str(max_depth).strip() != "" and str(max_depth).lower() != "none") else None
                except ValueError:
                    max_depth = None
                model = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
            elif model_name == "DecisionTreeClassifier":
                params = hyperparameters.get("DecisionTreeClassifier", {}) if hyperparameters else {}
                max_depth = params.get("max_depth", None)
                try:
                    max_depth = int(max_depth) if (max_depth is not None and str(max_depth).strip() != "" and str(max_depth).lower() != "none") else None
                except ValueError:
                    max_depth = None
                model = DecisionTreeClassifier(max_depth=max_depth, random_state=42)
            elif model_name == "LinearRegression":
                params = hyperparameters.get("LinearRegression", {}) if hyperparameters else {}
                fit_intercept = params.get("fit_intercept", True)
                if isinstance(fit_intercept, str):
                    fit_intercept = fit_intercept.lower() == "true"
                else:
                    fit_intercept = bool(fit_intercept)
                model = LinearRegression(fit_intercept=fit_intercept)
            elif model_name == "RandomForestRegressor":
                params = hyperparameters.get("RandomForestRegressor", {}) if hyperparameters else {}
                n_estimators = params.get("n_estimators", 100)
                max_depth = params.get("max_depth", None)
                try:
                    n_estimators = int(n_estimators) if n_estimators is not None else 100
                except ValueError:
                    n_estimators = 100
                try:
                    max_depth = int(max_depth) if (max_depth is not None and str(max_depth).strip() != "" and str(max_depth).lower() != "none") else None
                except ValueError:
                    max_depth = None
                model = RandomForestRegressor(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
            elif model_name == "DecisionTreeRegressor":
                params = hyperparameters.get("DecisionTreeRegressor", {}) if hyperparameters else {}
                max_depth = params.get("max_depth", None)
                try:
                    max_depth = int(max_depth) if (max_depth is not None and str(max_depth).strip() != "" and str(max_depth).lower() != "none") else None
                except ValueError:
                    max_depth = None
                model = DecisionTreeRegressor(max_depth=max_depth, random_state=42)
            else:
                continue

            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)

            metrics = {"model": model_name}
            if problem_type == "Classification":
                metrics["accuracy"] = float(accuracy_score(y_test, y_pred))
                if classification_type == "Binary":
                    metrics["precision"] = float(precision_score(y_test, y_pred, zero_division=0))
                    metrics["recall"] = float(recall_score(y_test, y_pred, zero_division=0))
                    metrics["f1_score"] = float(f1_score(y_test, y_pred, zero_division=0))
                else:
                    metrics["precision"] = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
                    metrics["recall"] = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
                    metrics["f1_score"] = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
            else:
                metrics["mae"] = float(mean_absolute_error(y_test, y_pred))
                metrics["rmse"] = float(np.sqrt(mean_squared_error(y_test, y_pred)))
                metrics["r2_score"] = float(r2_score(y_test, y_pred))

            # Save model to disk with experiment suffix if applicable
            model_file_name = f"{dataset_id}{suffix}_{model_name}.pkl"
            model_path = os.path.join(trained_models_dir, model_file_name)
            joblib.dump(model, model_path)

            model_results.append(metrics)

        if not model_results:
            raise RuntimeError("No models were successfully trained")

        # 8. Determine Best Model
        best_model_name = None
        best_metric_val = -float("inf")

        for m_result in model_results:
            if problem_type == "Classification":
                metric_val = m_result["accuracy"]
            else:
                metric_val = m_result["r2_score"]

            if metric_val > best_metric_val:
                best_metric_val = metric_val
                best_model_name = m_result["model"]

        results = {
            "dataset_id": dataset_id,
            "experiment_id": experiment_id,
            "problem_type": problem_type,
            "models": model_results,
            "best_model": best_model_name,
            "target_column": target_column,
            "split_ratio": split_ratio
        }

        TrainingRepository.save_training_job(results, user_id=user_id)
        logger.info(f"Model training completed for dataset {dataset_id} (experiment {experiment_id}). Best model: {best_model_name}")

        return results

