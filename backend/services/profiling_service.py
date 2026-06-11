from services.dataset_service import DatasetService

class ProfilingService:

    @staticmethod
    def profile_dataset(dataset_id, user_id=None):

        df = DatasetService.get_dataframe(dataset_id, user_id=user_id)

        if df is None:
            return None

        profile = {
            "rows": len(df),
            "columns": len(df.columns),
            "missing_values": int(df.isnull().sum().sum()),
            "duplicate_rows": int(df.duplicated().sum()),
            "numeric_columns": len(
                df.select_dtypes(include="number").columns
            ),
            "categorical_columns": len(
                df.select_dtypes(include="object").columns
            )
        }

        return profile