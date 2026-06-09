import os
import uuid
import pandas as pd
from datetime import datetime
from repositories.dataset_repository import DatasetRepository
from core.config import UPLOAD_DIR
from core.logger import logger


class DatasetService:

    @staticmethod
    async def upload_dataset(file):

        dataset_id = str(uuid.uuid4())

        filename = f"{dataset_id}_{file.filename}"

        file_path = os.path.join(
            UPLOAD_DIR,
            filename
        )

        contents = await file.read()

        with open(file_path, "wb") as f:
            f.write(contents)

        df = pd.read_csv(file_path)

        metadata = {
            "dataset_id": dataset_id,
            "filename": file.filename,
            "stored_filename": filename,
            "rows": len(df),
            "columns": len(df.columns), 
            "uploaded_at": datetime.now().isoformat()
        }

        DatasetRepository.save_dataset(metadata)
        logger.info(f"Dataset uploaded successfully: {file.filename} as {filename} ({dataset_id})")

        return metadata

    @staticmethod
    def get_all_datasets():
        return DatasetRepository.get_all_datasets()

    @staticmethod
    def get_dataset_by_id(dataset_id):
        return DatasetRepository.get_dataset_by_id(dataset_id)

    @staticmethod
    def delete_dataset(dataset_id):
        dataset_to_delete = DatasetRepository.get_dataset_by_id(dataset_id)

        if dataset_to_delete is None:
            return False

        file_path = os.path.join(
            UPLOAD_DIR,
            dataset_to_delete["stored_filename"]
        )

        if os.path.exists(file_path):
            os.remove(file_path)

        logger.info(f"Dataset deleted successfully: {dataset_id}")
        return DatasetRepository.delete_dataset(dataset_id)
    
    @staticmethod
    def get_dataframe(dataset_id):
        dataset = DatasetRepository.get_dataset_by_id(dataset_id)

        if dataset is None:
            return None

        file_path = os.path.join(
            UPLOAD_DIR,
            dataset["stored_filename"]
        )

        return pd.read_csv(file_path)