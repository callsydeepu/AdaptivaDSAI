import json
import pandas as pd

METADATA_FILE = "data/metadata.json"


class StatisticsService:

    @staticmethod
    def get_statistics(dataset_id):

        with open(METADATA_FILE, "r") as f:
            datasets = json.load(f)

        dataset = None

        for item in datasets:

            if item["dataset_id"] == dataset_id:
                dataset = item
                break

        if dataset is None:
            return None

        file_path = f"uploads/{dataset['stored_filename']}"

        df = pd.read_csv(file_path)

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