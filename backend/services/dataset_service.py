import os
import uuid
import pandas as pd
from datetime import datetime
from repositories.dataset_repository import DatasetRepository
from core.config import UPLOAD_DIR
from core.logger import logger


class DatasetService:

    @staticmethod
    async def upload_dataset(file, user_id=None):

        dataset_id = str(uuid.uuid4())

        filename = f"{dataset_id}_{file.filename}"

        file_path = os.path.join(
            UPLOAD_DIR,
            filename
        )

        contents = await file.read()

        with open(file_path, "wb") as f:
            f.write(contents)

        # 1. Heuristic to check if CSV has a header row
        has_header_row = True
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                sample = "".join(f.readline() for _ in range(15))
            if sample:
                import csv
                has_header_row = csv.Sniffer().has_header(sample)
        except Exception:
            pass

        # 2. Backup check: if the first row is 100% numeric, it is definitely a data row, not headers
        try:
            df_no_header = pd.read_csv(file_path, header=None)
            if len(df_no_header) > 0:
                first_row = df_no_header.iloc[0]
                numeric_count = 0
                for val in first_row:
                    try:
                        float(str(val))
                        numeric_count += 1
                    except ValueError:
                        pass
                if len(first_row) > 0 and numeric_count == len(first_row):
                    has_header_row = False
        except Exception:
            pass

        # 3. Apply fallback headers or clean existing ones
        if not has_header_row:
            logger.info(f"No header row detected in {file.filename}. Applying fallback headers: feature_1, feature_2...")
            df = pd.read_csv(file_path, header=None)
            df.columns = [f"feature_{i+1}" for i in range(len(df.columns))]
            df.to_csv(file_path, index=False)
        else:
            df = pd.read_csv(file_path)
            df.columns = [str(c) if not str(c).startswith("Unnamed:") else f"feature_{i+1}" for i, c in enumerate(df.columns)]
            df.to_csv(file_path, index=False)

        metadata = {
            "dataset_id": dataset_id,
            "filename": file.filename,
            "stored_filename": filename,
            "rows": len(df),
            "columns": len(df.columns), 
            "uploaded_at": datetime.now().isoformat()
        }
        if user_id:
            metadata["user_id"] = user_id

        DatasetRepository.save_dataset(metadata, user_id=user_id)
        logger.info(f"Dataset uploaded successfully: {file.filename} as {filename} ({dataset_id})")

        return metadata


    @staticmethod
    def get_all_datasets(user_id=None):
        return DatasetRepository.get_all_datasets(user_id=user_id)

    @staticmethod
    def get_dataset_by_id(dataset_id, user_id=None):
        return DatasetRepository.get_dataset_by_id(dataset_id, user_id=user_id)

    @staticmethod
    def delete_dataset(dataset_id, user_id=None):
        dataset_to_delete = DatasetRepository.get_dataset_by_id(dataset_id, user_id=user_id)

        if dataset_to_delete is None:
            return False

        file_path = os.path.join(
            UPLOAD_DIR,
            dataset_to_delete["stored_filename"]
        )

        if os.path.exists(file_path):
            os.remove(file_path)

        logger.info(f"Dataset deleted successfully: {dataset_id}")
        return DatasetRepository.delete_dataset(dataset_id, user_id=user_id)
    
    @staticmethod
    def get_dataframe(dataset_id, user_id=None):
        dataset = DatasetRepository.get_dataset_by_id(dataset_id, user_id=user_id)

        if dataset is None:
            return None

        file_path = os.path.join(
            UPLOAD_DIR,
            dataset["stored_filename"]
        )

        return pd.read_csv(file_path)