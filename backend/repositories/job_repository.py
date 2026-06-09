import json
import os
from core.database import db, db_connected

JOBS_FILE = "data/jobs.json"

class JobRepository:
    @staticmethod
    def save_job(job_data):
        if db_connected and db is not None:
            try:
                doc = job_data.copy()
                doc["_id"] = doc["job_id"]
                db.training_jobs.replace_one({"_id": doc["_id"]}, doc, upsert=True)
            except Exception as e:
                print(f"Error writing job to MongoDB: {e}")

        # Local JSON write
        os.makedirs(os.path.dirname(JOBS_FILE), exist_ok=True)
        jobs = []
        if os.path.exists(JOBS_FILE):
            try:
                with open(JOBS_FILE, "r") as f:
                    jobs = json.load(f)
            except Exception:
                jobs = []
        
        jobs = [j for j in jobs if j.get("job_id") != job_data["job_id"]]
        jobs.append(job_data)
        
        try:
            with open(JOBS_FILE, "w") as f:
                json.dump(jobs, f, indent=4)
        except Exception as e:
            print(f"Error writing job to local JSON: {e}")

    @staticmethod
    def get_job_by_id(job_id):
        if db_connected and db is not None:
            try:
                doc = db.training_jobs.find_one({"_id": job_id})
                if doc and "job_id" in doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                print(f"Error reading job from MongoDB: {e}")

        # Fallback to local JSON
        if os.path.exists(JOBS_FILE):
            try:
                with open(JOBS_FILE, "r") as f:
                    jobs = json.load(f)
                for j in jobs:
                    if j.get("job_id") == job_id:
                        return j
            except Exception:
                pass
        return None

    @staticmethod
    def get_all_jobs():
        if db_connected and db is not None:
            try:
                docs = list(db.training_jobs.find())
                result = []
                for doc in docs:
                    if "job_id" in doc:
                        doc.pop("_id", None)
                        result.append(doc)
                return result
            except Exception as e:
                print(f"Error reading all jobs from MongoDB: {e}")

        # Fallback to local JSON
        if os.path.exists(JOBS_FILE):
            try:
                with open(JOBS_FILE, "r") as f:
                    jobs = json.load(f)
                return [j for j in jobs if "job_id" in j]
            except Exception:
                pass
        return []
