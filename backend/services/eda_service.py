import json
import pandas as pd

METADATA_FILE = "data/metadata.json"


class EDAService:

    @staticmethod
    def analyze_dataset(dataset_id):

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