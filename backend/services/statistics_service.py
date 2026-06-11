import json
import pandas as pd

METADATA_FILE = "data/metadata.json"


class StatisticsService:

    @staticmethod
    def get_statistics(dataset_id, user_id=None):
        from services.dataset_service import DatasetService
        df = DatasetService.get_dataframe(dataset_id, user_id=user_id)
        if df is None:
            return None

        numeric_df = df.select_dtypes(include="number")

        stats = {}

        for column in numeric_df.columns:

            stats[column] = {
                "mean": float(numeric_df[column].mean()),
                "median": float(numeric_df[column].median()),
                "mode": float(
                    numeric_df[column].mode().iloc[0]
                ) if not numeric_df[column].mode().empty else None,
                "min": float(numeric_df[column].min()),
                "max": float(numeric_df[column].max()),
                "std": float(numeric_df[column].std()),
                "variance": float(numeric_df[column].var())
            }

        return stats