import os
import json
import pandas as pd
from services.dataset_service import DatasetService


class FeatureEngineeringService:

    @staticmethod
    def process_dataset(dataset_id: str):
        # 1. Load dataset
        df = DatasetService.get_dataframe(dataset_id)

        if df is None:
            return None

        if df.empty or len(df.columns) == 0 or len(df) == 0:
            raise ValueError("Dataset empty")

        df = df.copy()

        # 2. Identify target column and column roles
        target_column = df.columns[-1]
        categorical_cols = [col for col in df.columns if not pd.api.types.is_numeric_dtype(df[col])]
        numeric_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]

        # 3. Handle Missing Values
        for col in numeric_cols:
            if df[col].isnull().any():
                median_val = df[col].median()
                if pd.isnull(median_val):
                    median_val = 0.0
                df[col] = df[col].fillna(median_val)

        for col in categorical_cols:
            if df[col].isnull().any():
                mode_series = df[col].mode()
                if not mode_series.empty:
                    mode_val = mode_series.iloc[0]
                else:
                    mode_val = "Unknown"
                df[col] = df[col].fillna(mode_val)

        # 4. Categorical Encoding (Label Encoding)
        mappings = {}
        for col in categorical_cols:
            unique_vals = sorted(df[col].unique())
            mapping = {val: idx for idx, val in enumerate(unique_vals)}
            df[col] = df[col].map(mapping)
            mappings[col] = {str(k): v for k, v in mapping.items()}

        # 5. Feature Scaling (StandardScaler)
        scaled_cols = [col for col in numeric_cols if col != target_column]
        for col in scaled_cols:
            mean_val = df[col].mean()
            std_val = df[col].std(ddof=0)
            if std_val > 0:
                df[col] = (df[col] - mean_val) / std_val
            else:
                df[col] = 0.0

        # 6. Save Processed Dataset and Mapping Information
        processed_dir = "processed"
        os.makedirs(processed_dir, exist_ok=True)

        processed_file_path = os.path.join(processed_dir, f"{dataset_id}.csv")
        df.to_csv(processed_file_path, index=False)

        mapping_file_path = os.path.join(processed_dir, f"{dataset_id}_mappings.json")
        with open(mapping_file_path, "w") as f:
            json.dump(mappings, f, indent=4)

        # 7. Return metadata
        return {
            "dataset_id": dataset_id,
            "rows": len(df),
            "columns": len(df.columns),
            "missing_values_fixed": True,
            "encoded_columns": categorical_cols,
            "scaled_columns": scaled_cols
        }
