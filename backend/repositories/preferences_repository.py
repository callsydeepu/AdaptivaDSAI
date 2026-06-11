import json
import os
from core.database import db, db_connected

PREFERENCES_FILE = "data/user_preferences.json"

DEFAULT_PREFERENCES = {
    "name": "Alex Carter",
    "email": "alex.carter@example.com",
    "profile_photo": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    "ai_response_style": "balanced",
    "notebook_export_style": "clean",
    "default_export_format": "notebook",
    "auto_open_colab": True,
    "notifications": {
        "training_completed": True,
        "report_generated": True,
        "dataset_upload_completed": True,
        "export_completed": True
    },
    "dashboard": {
        "default_dataset": "",
        "auto_refresh": True,
        "show_ai_insights": True
    }
}


class PreferencesRepository:

    @staticmethod
    def get_preferences(user_id=None) -> dict:
        key = user_id or "default_user"
        # 1. Read from MongoDB (if available)
        if db_connected and db is not None:
            try:
                doc = db.user_preferences.find_one({"_id": key})
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception as e:
                print(f"Error reading user preferences from MongoDB: {e}")

        # 2. Fallback to local JSON
        if os.path.exists(PREFERENCES_FILE):
            try:
                with open(PREFERENCES_FILE, "r") as f:
                    data = json.load(f)
                
                # Check if data is structured as multi-user
                if isinstance(data, dict) and key in data:
                    user_pref = data[key]
                elif isinstance(data, dict) and ("email" in data or "name" in data):
                    # Old format, treat as default user
                    if key == "default_user":
                        user_pref = data
                    else:
                        user_pref = {}
                else:
                    user_pref = {}

                # Merge with default to ensure all keys exist
                merged = DEFAULT_PREFERENCES.copy()
                merged.update(user_pref)
                return merged
            except Exception:
                return DEFAULT_PREFERENCES.copy()
        
        return DEFAULT_PREFERENCES.copy()

    @staticmethod
    def save_preferences(preferences: dict, user_id=None) -> dict:
        # Ensure _id is not inside the dict before operations
        preferences.pop("_id", None)
        key = user_id or "default_user"

        # 1. Write to MongoDB (if available)
        if db_connected and db is not None:
            try:
                doc = preferences.copy()
                doc["_id"] = key
                db.user_preferences.replace_one({"_id": key}, doc, upsert=True)
            except Exception as e:
                print(f"Error writing user preferences to MongoDB: {e}")

        # 2. Write to local JSON
        os.makedirs(os.path.dirname(PREFERENCES_FILE), exist_ok=True)
        try:
            data = {}
            if os.path.exists(PREFERENCES_FILE):
                try:
                    with open(PREFERENCES_FILE, "r") as f:
                        existing = json.load(f)
                    if isinstance(existing, dict) and not ("email" in existing or "name" in existing):
                        data = existing
                    elif isinstance(existing, dict):
                        # Convert old format to multi-user format
                        data = {"default_user": existing}
                except Exception:
                    data = {}

            data[key] = preferences

            with open(PREFERENCES_FILE, "w") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            print(f"Error writing user preferences to file: {e}")

        return preferences
