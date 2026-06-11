import os
import pandas as pd
from services.problem_detection_service import ProblemDetectionService
from services.feature_engineering_service import FeatureEngineeringService


class ModelRecommendationService:

    @staticmethod
    def recommend_models(dataset_id: str, user_id=None):
        # 1. Load Problem Detection Output
        problem_info = ProblemDetectionService.detect_problem(dataset_id, user_id=user_id)
        if problem_info is None:
            return None

        problem_type = problem_info.get("problem_type")
        classification_type = problem_info.get("classification_type")

        if not problem_type or problem_type not in ["Classification", "Regression"]:
            raise ValueError("Problem type not detected")

        # 2. Load Processed Dataset
        processed_path = os.path.join("processed", f"{dataset_id}.csv")
        if not os.path.exists(processed_path):
            # Trigger feature engineering dynamically
            fe_res = FeatureEngineeringService.process_dataset(dataset_id, user_id=user_id)
            if fe_res is None:
                return None

        # Load processed dataframe to get size and features
        try:
            df = pd.read_csv(processed_path)
        except Exception:
            raise ValueError("Dataset empty")

        if df.empty or len(df.columns) == 0 or len(df) == 0:
            raise ValueError("Dataset empty")

        rows = len(df)

        # 3. Dynamic recommendation rules
        recommended_models = []

        if problem_type == "Classification":
            if classification_type == "Binary":
                if rows < 1000:
                    recommended_models = [
                        {
                            "model": "LogisticRegression",
                            "priority": 1,
                            "reason": f"Good baseline model for small datasets ({rows} rows). Highly interpretable and less prone to overfitting."
                        },
                        {
                            "model": "RandomForestClassifier",
                            "priority": 2,
                            "reason": "Robust ensemble method that handles non-linear relationships and tabular data well."
                        },
                        {
                            "model": "XGBoostClassifier",
                            "priority": 3,
                            "reason": "Highly powerful boosting algorithm but might overfit on small tabular datasets without parameter tuning."
                        }
                    ]
                else:
                    recommended_models = [
                        {
                            "model": "XGBoostClassifier",
                            "priority": 1,
                            "reason": f"State-of-the-art accuracy and training speed for large tabular datasets ({rows} rows)."
                        },
                        {
                            "model": "RandomForestClassifier",
                            "priority": 2,
                            "reason": "Handles large feature spaces well and reduces variance through ensemble bagging."
                        },
                        {
                            "model": "LogisticRegression",
                            "priority": 3,
                            "reason": "Fast baseline model, though likely to underperform compared to tree-based ensembles on complex datasets."
                        }
                    ]
            else:  # Multi-Class
                if rows < 1000:
                    recommended_models = [
                        {
                            "model": "RandomForestClassifier",
                            "priority": 1,
                            "reason": f"Excellent bagger that handles multi-class decision boundaries robustly on small datasets ({rows} rows)."
                        },
                        {
                            "model": "DecisionTreeClassifier",
                            "priority": 2,
                            "reason": "Simple baseline model with direct decision path interpretability."
                        },
                        {
                            "model": "XGBoostClassifier",
                            "priority": 3,
                            "reason": "Powerful boosting algorithm, but requires careful tuning to prevent overfitting on smaller datasets."
                        }
                    ]
                else:
                    recommended_models = [
                        {
                            "model": "XGBoostClassifier",
                            "priority": 1,
                            "reason": f"Extremely accurate and scalable gradient booster for large multi-class tabular datasets ({rows} rows)."
                        },
                        {
                            "model": "RandomForestClassifier",
                            "priority": 2,
                            "reason": "Robust ensemble that handles high feature dimensionality and class interactions well."
                        },
                        {
                            "model": "DecisionTreeClassifier",
                            "priority": 3,
                            "reason": "Fast baseline, but highly prone to high variance on larger datasets compared to ensembles."
                        }
                    ]
        elif problem_type == "Regression":
            if rows < 1000:
                recommended_models = [
                    {
                        "model": "LinearRegression",
                        "priority": 1,
                        "reason": f"Highly interpretable and simple baseline, ideal for small regression tasks ({rows} rows)."
                    },
                    {
                        "model": "RandomForestRegressor",
                        "priority": 2,
                        "reason": "Robust tree ensemble that models complex non-linear numeric relations with low overfitting risk."
                    },
                    {
                        "model": "XGBoostRegressor",
                        "priority": 3,
                        "reason": "State-of-the-art boosting regressor, but requires regularization for small datasets."
                    }
                ]
            else:
                recommended_models = [
                    {
                        "model": "XGBoostRegressor",
                        "priority": 1,
                        "reason": f"Exceptional gradient boosted regression performance on large tabular datasets ({rows} rows)."
                    },
                    {
                        "model": "RandomForestRegressor",
                        "priority": 2,
                        "reason": "Handles complex non-linear relations and reduces variance via ensemble aggregation."
                    },
                    {
                        "model": "LinearRegression",
                        "priority": 3,
                        "reason": "Fast simple baseline, but exhibits high bias on large datasets with non-linear patterns."
                    }
                ]

        return {
            "dataset_id": dataset_id,
            "problem_type": problem_type,
            "recommended_models": recommended_models
        }
