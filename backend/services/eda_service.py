import json
import pandas as pd

METADATA_FILE = "data/metadata.json"


class EDAService:

    @staticmethod
    def analyze_dataset(dataset_id, user_id=None):
        from services.dataset_service import DatasetService
        df = DatasetService.get_dataframe(dataset_id, user_id=user_id)
        if df is None:
            return None

        numeric_df = df.select_dtypes(include="number")

        correlation_matrix = numeric_df.corr().fillna(0)

        outliers = {}

        for column in numeric_df.columns:

            q1 = numeric_df[column].quantile(0.25)
            q3 = numeric_df[column].quantile(0.75)

            iqr = q3 - q1

            lower_bound = q1 - (1.5 * iqr)
            upper_bound = q3 + (1.5 * iqr)

            count = (
                (
                    numeric_df[column] < lower_bound
                ) |
                (
                    numeric_df[column] > upper_bound
                )
            ).sum()

            outliers[column] = int(count)

        return {
            "correlation_matrix":
                correlation_matrix.to_dict(),

            "outliers":
                outliers,

            "numeric_columns":
                list(
                    numeric_df.columns
                ),

            "categorical_columns":
                list(
                    df.select_dtypes(
                        include="object"
                    ).columns
                )
        }