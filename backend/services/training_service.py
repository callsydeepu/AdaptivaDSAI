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
    def train_models(dataset_id: str):
        # 1. Load Dataset Metadata
        dataset = DatasetService.get_dataset_by_id(dataset_id)
        if dataset is None:
            return None

        # 2. Load Processed Dataset
        processed_path = os.path.join(PROCESSED_DIR, f"{dataset_id}.csv")
        if not os.path.exists(processed_path):
            raise FileNotFoundError("Processed dataset not found")

        df = pd.read_csv(processed_path)
        if df.empty or len(df.columns) == 0 or len(df) == 0:
            raise ValueError("Dataset empty")

        # 3. Load Problem Details
        problem_info = ProblemDetectionService.detect_problem(dataset_id)
        if problem_info is None:
            return None

        problem_type = problem_info.get("problem_type")
        classification_type = problem_info.get("classification_type")

        # 4. Load Recommended Models
        rec_info = ModelRecommendationService.recommend_models(dataset_id)
        if rec_info is None:
            return None

        recommended_models = rec_info.get("recommended_models", [])

        # Filter supported models
        supported_class_models = ["LogisticRegression", "RandomForestClassifier", "DecisionTreeClassifier"]
        supported_reg_models = ["LinearRegression", "RandomForestRegressor", "DecisionTreeRegressor"]

        models_to_train = []
        for m in recommended_models:
            model_name = m["model"]
            if problem_type == "Classification" and model_name in supported_class_models:
                models_to_train.append(model_name)
            elif problem_type == "Regression" and model_name in supported_reg_models:
                models_to_train.append(model_name)

        if not models_to_train:
            if problem_type == "Classification":
                models_to_train = supported_class_models.copy()
            else:
                models_to_train = supported_reg_models.copy()

        # 5. Split Data
        target_column = df.columns[-1]
        X = df.drop(columns=[target_column])
        y = df[target_column]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        logger.info(f"Training models for dataset {dataset_id}. Models to train: {models_to_train}")
        model_results = []
        trained_models_dir = MODEL_DIR
        os.makedirs(trained_models_dir, exist_ok=True)

        # 6. Fit & Evaluate Models
        for model_name in models_to_train:
            if model_name == "LogisticRegression":
                model = LogisticRegression(max_iter=1000, random_state=42)
            elif model_name == "RandomForestClassifier":
                model = RandomForestClassifier(random_state=42)
            elif model_name == "DecisionTreeClassifier":
                model = DecisionTreeClassifier(random_state=42)
            elif model_name == "LinearRegression":
                model = LinearRegression()
            elif model_name == "RandomForestRegressor":
                model = RandomForestRegressor(random_state=42)
            elif model_name == "DecisionTreeRegressor":
                model = DecisionTreeRegressor(random_state=42)
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

            # Save model to disk
            model_file_name = f"{dataset_id}_{model_name}.pkl"
            model_path = os.path.join(trained_models_dir, model_file_name)
            joblib.dump(model, model_path)

            model_results.append(metrics)

        if not model_results:
            raise RuntimeError("No models were successfully trained")

        # 7. Determine Best Model
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
            "problem_type": problem_type,
            "models": model_results,
            "best_model": best_model_name
        }

        TrainingRepository.save_training_job(results)
        logger.info(f"Model training completed for dataset {dataset_id}. Best model: {best_model_name}")

        return results
