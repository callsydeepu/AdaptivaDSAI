import json
import os
from core.database import db, db_connected

REPORT_METADATA_FILE = "data/report_metadata.json"


class ReportRepository:

    @staticmethod
    def save_report_metadata(report_metadata, user_id=None):
        if user_id:
            report_metadata["user_id"] = user_id
            
        # Phase 1: Write to MongoDB (if available)
        if db_connected and db is not None:
            try:
                doc = report_metadata.copy()
                doc["_id"] = doc["dataset_id"]
                db.generated_reports.replace_one({"_id": doc["_id"]}, doc, upsert=True)
            except Exception as e:
                print(f"Error writing to MongoDB generated_reports collection: {e}")

        # Write to existing JSON
        os.makedirs(os.path.dirname(REPORT_METADATA_FILE), exist_ok=True)
        reports = []
        if os.path.exists(REPORT_METADATA_FILE):
            try:
                with open(REPORT_METADATA_FILE, "r") as f:
                    reports = json.load(f)
            except Exception:
                reports = []

        reports = [item for item in reports if item.get("dataset_id") != report_metadata["dataset_id"]]
        reports.append(report_metadata)

        with open(REPORT_METADATA_FILE, "w") as f:
            json.dump(reports, f, indent=4)

    @staticmethod
    def get_report_metadata(dataset_id, user_id=None):
        # Phase 2: Read from MongoDB first
        if db_connected and db is not None:
            try:
                query = {"_id": dataset_id}
                if user_id:
                    query["user_id"] = user_id
                doc = db.generated_reports.find_one(query)
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                print(f"Error reading report metadata {dataset_id} from MongoDB: {e}. Falling back to JSON.")

        # Fallback to JSON
        if os.path.exists(REPORT_METADATA_FILE):
            try:
                with open(REPORT_METADATA_FILE, "r") as f:
                    reports = json.load(f)
                for report in reports:
                    if report["dataset_id"] == dataset_id:
                        if user_id is None or report.get("user_id") == user_id:
                            return report
            except Exception:
                return None
        return None
