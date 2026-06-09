import os
import uuid
import json
import pandas as pd
from datetime import datetime

UPLOAD_DIR = "uploads"
METADATA_FILE = "data/metadata.json"

os.makedirs("data", exist_ok=True)

if not os.path.exists(METADATA_FILE):
    with open(METADATA_FILE, "w") as f:
        json.dump([], f)


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

        with open(METADATA_FILE, "r") as f:
            datasets = json.load(f)

        datasets.append(metadata)

        with open(METADATA_FILE, "w") as f:
            json.dump(datasets, f, indent=4)

        return metadata
    @staticmethod
    def get_all_datasets():

        if not os.path.exists(METADATA_FILE):
            return []

        with open(METADATA_FILE, "r") as f:
            datasets = json.load(f)

        return datasets
    @staticmethod
    def get_dataset_by_id(dataset_id):

        with open(METADATA_FILE, "r") as f:
            datasets = json.load(f)

        for dataset in datasets:

            if dataset["dataset_id"] == dataset_id:
                return dataset

        return None
    @staticmethod
    def delete_dataset(dataset_id):

        with open(METADATA_FILE, "r") as f:
            datasets = json.load(f)

        dataset_to_delete = None

        for dataset in datasets:

            if dataset["dataset_id"] == dataset_id:
                dataset_to_delete = dataset
                break

        if dataset_to_delete is None:
            return False

        file_path = os.path.join(
            UPLOAD_DIR,
            dataset_to_delete["stored_filename"]
        )

        if os.path.exists(file_path):
            os.remove(file_path)

        datasets.remove(dataset_to_delete)

        with open(METADATA_FILE, "w") as f:
            json.dump(datasets, f, indent=4)

        return True
    
    @staticmethod
    def get_dataframe(dataset_id):

        with open(METADATA_FILE, "r") as f:
            datasets = json.load(f)

        dataset = None

        for item in datasets:

            if item["dataset_id"] == dataset_id:
                dataset = item
                break

        if dataset is None:
            return None

        file_path = os.path.join(
            UPLOAD_DIR,
            dataset["stored_filename"]
        )

        return pd.read_csv(file_path)