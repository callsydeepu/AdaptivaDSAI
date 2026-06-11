import json
import os
from core.database import db, db_connected

EXPERIMENTS_FILE = "data/experiments.json"

class ExperimentRepository:
    """
    Repository for managing custom training experiments. 
    Persists documents in MongoDB collection 'experiments' and falls back to data/experiments.json.
    """

    @staticmethod
    def save_experiment(experiment_data: dict, user_id=None) -> dict:
        if user_id:
            experiment_data["user_id"] = user_id
        experiment_id = experiment_data["experiment_id"]
        
        # 1. MongoDB Save
        if db_connected and db is not None:
            try:
                doc = experiment_data.copy()
                doc["_id"] = experiment_id
                db.experiments.replace_one({"_id": experiment_id}, doc, upsert=True)
            except Exception as e:
                print(f"Error saving experiment to MongoDB: {e}")

        # 2. Local JSON Write
        os.makedirs(os.path.dirname(EXPERIMENTS_FILE), exist_ok=True)
        experiments = []
        if os.path.exists(EXPERIMENTS_FILE):
            try:
                with open(EXPERIMENTS_FILE, "r") as f:
                    experiments = json.load(f)
            except Exception:
                experiments = []
        
        experiments = [e for e in experiments if e.get("experiment_id") != experiment_id]
        experiments.append(experiment_data)

        try:
            with open(EXPERIMENTS_FILE, "w") as f:
                json.dump(experiments, f, indent=4)
        except Exception as e:
            print(f"Error saving experiment locally: {e}")

        return experiment_data

    @staticmethod
    def get_experiment(experiment_id: str, user_id=None) -> dict:
        # 1. MongoDB Read
        if db_connected and db is not None:
            try:
                query = {"_id": experiment_id}
                if user_id:
                    query["user_id"] = user_id
                doc = db.experiments.find_one(query)
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                print(f"Error loading experiment {experiment_id} from MongoDB: {e}")

        # 2. Local JSON Read
        if os.path.exists(EXPERIMENTS_FILE):
            try:
                with open(EXPERIMENTS_FILE, "r") as f:
                    experiments = json.load(f)
                for e in experiments:
                    if e.get("experiment_id") == experiment_id:
                        if user_id is None or e.get("user_id") == user_id:
                            return e
            except Exception:
                return None
        return None

    @staticmethod
    def get_experiments_by_dataset(dataset_id: str, user_id=None) -> list:
        # 1. MongoDB Read
        if db_connected and db is not None:
            try:
                query = {"dataset_id": dataset_id}
                if user_id:
                    query["user_id"] = user_id
                cursor = db.experiments.find(query).sort("created_at", -1)
                experiments = list(cursor)
                for e in experiments:
                    e.pop("_id", None)
                return experiments
            except Exception as e:
                print(f"Error loading experiments for dataset {dataset_id} from MongoDB: {e}")

        # 2. Local JSON Read
        if os.path.exists(EXPERIMENTS_FILE):
            try:
                with open(EXPERIMENTS_FILE, "r") as f:
                    experiments = json.load(f)
                filtered = [
                    e for e in experiments 
                    if e.get("dataset_id") == dataset_id and (user_id is None or e.get("user_id") == user_id)
                ]
                filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                return filtered
            except Exception:
                return []
        return []
