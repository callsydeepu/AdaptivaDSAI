import pandas as pd
from services.dataset_service import DatasetService


class ProblemDetectionService:

    @staticmethod
    def detect_problem(dataset_id: str, user_id=None):

        df = DatasetService.get_dataframe(dataset_id, user_id=user_id)

        if df is None:
            return None

        if df.empty or len(df.columns) == 0 or len(df) == 0:
            raise ValueError("Dataset empty")

        target_column = df.columns[-1]
        target = df[target_column]

        is_numeric = pd.api.types.is_numeric_dtype(target)
        unique_values = int(target.nunique())

        if not is_numeric or unique_values <= 20:
            problem_type = "Classification"
            classification_type = "Binary" if unique_values == 2 else "Multi-Class"
            num_classes = unique_values
        else:
            problem_type = "Regression"
            classification_type = None
            num_classes = None

        return {
            "dataset_id": dataset_id,
            "target_column": target_column,
            "problem_type": problem_type,
            "classification_type": classification_type,
            "num_classes": num_classes
        }