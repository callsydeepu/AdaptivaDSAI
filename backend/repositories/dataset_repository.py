import json
import os
from core.database import db, db_connected

METADATA_FILE = "data/metadata.json"


class DatasetRepository:

    @staticmethod
    def save_dataset(dataset_metadata, user_id=None):
        if user_id:
            dataset_metadata["user_id"] = user_id
            
        # Phase 1: Write to MongoDB (if available)
        if db_connected and db is not None:
            try:
                doc = dataset_metadata.copy()
                doc["_id"] = doc["dataset_id"]
                db.datasets.replace_one({"_id": doc["_id"]}, doc, upsert=True)
            except Exception as e:
                print(f"Error writing to MongoDB datasets collection: {e}")

        # Write to existing JSON
        os.makedirs(os.path.dirname(METADATA_FILE), exist_ok=True)
        datasets = []
        if os.path.exists(METADATA_FILE):
            try:
                with open(METADATA_FILE, "r") as f:
                    datasets = json.load(f)
            except Exception:
                datasets = []

        datasets = [item for item in datasets if item.get("dataset_id") != dataset_metadata["dataset_id"]]
        datasets.append(dataset_metadata)

        with open(METADATA_FILE, "w") as f:
            json.dump(datasets, f, indent=4)

    @staticmethod
    def get_all_datasets(user_id=None):
        # Phase 2: Read from MongoDB first
        if db_connected and db is not None:
            try:
                query = {"user_id": user_id} if user_id else {}
                docs = list(db.datasets.find(query))
                for doc in docs:
                    doc.pop("_id", None)
                return docs
            except Exception as e:
                print(f"Error reading from MongoDB datasets: {e}. Falling back to JSON.")

        # Fallback to JSON
        if os.path.exists(METADATA_FILE):
            try:
                with open(METADATA_FILE, "r") as f:
                    datasets = json.load(f)
                if user_id:
                    return [item for item in datasets if item.get("user_id") == user_id]
                return datasets
            except Exception:
                return []
        return []

    @staticmethod
    def get_dataset_by_id(dataset_id, user_id=None):
        # Phase 2: Read from MongoDB first
        if db_connected and db is not None:
            try:
                query = {"_id": dataset_id}
                if user_id:
                    query["user_id"] = user_id
                doc = db.datasets.find_one(query)
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                print(f"Error reading dataset {dataset_id} from MongoDB: {e}. Falling back to JSON.")

        # Fallback to JSON
        if os.path.exists(METADATA_FILE):
            try:
                with open(METADATA_FILE, "r") as f:
                    datasets = json.load(f)
                for dataset in datasets:
                    if dataset["dataset_id"] == dataset_id:
                        if user_id is None or dataset.get("user_id") == user_id:
                            return dataset
            except Exception:
                return None
        return None

    @staticmethod
    def delete_dataset(dataset_id, user_id=None):
        deleted_db = False
        deleted_json = False

        # Delete from MongoDB
        if db_connected and db is not None:
            try:
                query = {"_id": dataset_id}
                if user_id:
                    query["user_id"] = user_id
                res = db.datasets.delete_one(query)
                deleted_db = res.deleted_count > 0
            except Exception as e:
                print(f"Error deleting dataset {dataset_id} from MongoDB: {e}")

        # Delete from JSON
        if os.path.exists(METADATA_FILE):
            try:
                with open(METADATA_FILE, "r") as f:
                    datasets = json.load(f)
                initial_len = len(datasets)
                
                datasets = [
                    item for item in datasets 
                    if not (item["dataset_id"] == dataset_id and (user_id is None or item.get("user_id") == user_id))
                ]
                deleted_json = len(datasets) < initial_len

                with open(METADATA_FILE, "w") as f:
                    json.dump(datasets, f, indent=4)
            except Exception:
                pass

        return deleted_db or deleted_json
