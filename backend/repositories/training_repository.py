import json
import os
from core.database import db, db_connected
from core.config import EVALUATION_RESULTS_DIR


class TrainingRepository:

    @staticmethod
    def save_training_job(training_job_data):
        # Write to MongoDB (if available)
        if db_connected and db is not None:
            try:
                doc = training_job_data.copy()
                doc["_id"] = doc["dataset_id"]
                db.training_jobs.replace_one({"_id": doc["_id"]}, doc, upsert=True)
            except Exception as e:
                print(f"Error writing to MongoDB training_jobs collection: {e}")

    @staticmethod
    def save_evaluation_result(evaluation_result_data):
        dataset_id = evaluation_result_data["dataset_id"]

        # Phase 1: Write to MongoDB (if available)
        if db_connected and db is not None:
            try:
                doc = evaluation_result_data.copy()
                doc["_id"] = dataset_id
                db.evaluation_results.replace_one({"_id": doc["_id"]}, doc, upsert=True)
            except Exception as e:
                print(f"Error writing to MongoDB evaluation_results collection: {e}")

        # Write to existing JSON
        os.makedirs(EVALUATION_RESULTS_DIR, exist_ok=True)
        results_path = os.path.join(EVALUATION_RESULTS_DIR, f"{dataset_id}.json")
        with open(results_path, "w") as f:
            json.dump(evaluation_result_data, f, indent=4)

    @staticmethod
    def get_evaluation_result(dataset_id):
        # Phase 2: Read from MongoDB first
        if db_connected and db is not None:
            try:
                doc = db.evaluation_results.find_one({"_id": dataset_id})
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                print(f"Error reading evaluation result {dataset_id} from MongoDB: {e}. Falling back to JSON.")

        # Fallback to JSON
        results_path = os.path.join(EVALUATION_RESULTS_DIR, f"{dataset_id}.json")
        if os.path.exists(results_path):
            try:
                with open(results_path, "r") as f:
                    return json.load(f)
            except Exception:
                return None
        return None
