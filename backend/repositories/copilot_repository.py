import json
import os
import uuid
from datetime import datetime
from core.database import db, db_connected

HISTORY_FILE = "data/copilot_history.json"
SESSIONS_FILE = "data/copilot_sessions.json"

class CopilotRepository:
    """
    Repository for managing conversation logs and session metadata for the AI Copilot.
    Persists data in MongoDB collection 'copilot_conversations' and 'copilot_sessions',
    falling back to local JSON files.
    """

    @staticmethod
    def create_session(dataset_id: str, user_id=None) -> dict:
        session_id = str(uuid.uuid4())
        session_data = {
            "session_id": session_id,
            "dataset_id": dataset_id,
            "created_at": datetime.now().isoformat()
        }
        if user_id:
            session_data["user_id"] = user_id

        # 1. Save to MongoDB
        if db_connected and db is not None:
            try:
                doc = session_data.copy()
                doc["_id"] = session_id
                db.copilot_sessions.replace_one({"_id": session_id}, doc, upsert=True)
            except Exception as e:
                print(f"Error writing to MongoDB copilot_sessions: {e}")

        # 2. Save to local JSON file
        os.makedirs("data", exist_ok=True)
        sessions = []
        if os.path.exists(SESSIONS_FILE):
            try:
                with open(SESSIONS_FILE, "r") as f:
                    sessions = json.load(f)
            except Exception:
                sessions = []
        sessions.append(session_data)
        try:
            with open(SESSIONS_FILE, "w") as f:
                json.dump(sessions, f, indent=4)
        except Exception as e:
            print(f"Error writing local copilot sessions: {e}")

        return session_data

    @staticmethod
    def get_sessions(dataset_id: str, user_id=None) -> list:
        # Try MongoDB first
        if db_connected and db is not None:
            try:
                query = {"dataset_id": dataset_id}
                if user_id:
                    query["user_id"] = user_id
                cursor = db.copilot_sessions.find(query).sort("created_at", -1)
                sessions = list(cursor)
                for s in sessions:
                    s.pop("_id", None)
                return sessions
            except Exception as e:
                print(f"Error reading sessions from MongoDB: {e}. Falling back to JSON.")

        # Fallback to local JSON
        if os.path.exists(SESSIONS_FILE):
            try:
                with open(SESSIONS_FILE, "r") as f:
                    sessions = json.load(f)
                filtered = [
                    s for s in sessions 
                    if s.get("dataset_id") == dataset_id and (user_id is None or s.get("user_id") == user_id)
                ]
                filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                return filtered
            except Exception:
                return []
        return []

    @staticmethod
    def save_chat(dataset_id: str, session_id: str, question: str, answer: str, user_id=None) -> dict:
        chat_id = str(uuid.uuid4())
        chat_data = {
            "chat_id": chat_id,
            "dataset_id": dataset_id,
            "session_id": session_id,
            "question": question,
            "answer": answer,
            "created_at": datetime.now().isoformat()
        }
        if user_id:
            chat_data["user_id"] = user_id
        
        # 1. Save to MongoDB (if connected)
        if db_connected and db is not None:
            try:
                doc = chat_data.copy()
                doc["_id"] = chat_id
                db.copilot_conversations.replace_one({"_id": chat_id}, doc, upsert=True)
            except Exception as e:
                print(f"Error writing to MongoDB copilot_conversations: {e}")
                
        # 2. Dual-write to local JSON file
        os.makedirs("data", exist_ok=True)
        history = []
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, "r") as f:
                    history = json.load(f)
            except Exception:
                history = []
                
        history.append(chat_data)
        
        try:
            with open(HISTORY_FILE, "w") as f:
                json.dump(history, f, indent=4)
        except Exception as e:
            print(f"Error writing local copilot history: {e}")
            
        return chat_data

    @staticmethod
    def get_session_history(session_id: str, user_id=None) -> list:
        """
        Retrieves message logs belonging to the target session.
        """
        # Read from MongoDB first
        if db_connected and db is not None:
            try:
                query = {"session_id": session_id}
                if user_id:
                    query["user_id"] = user_id
                cursor = db.copilot_conversations.find(query).sort("created_at", 1)
                history = list(cursor)
                for h in history:
                    h.pop("_id", None)
                return history
            except Exception as e:
                print(f"Error reading session history from MongoDB: {e}. Falling back to JSON.")
                
        # Fallback read from local JSON
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, "r") as f:
                    history = json.load(f)
                filtered = [
                    h for h in history 
                    if h.get("session_id") == session_id and (user_id is None or h.get("user_id") == user_id)
                ]
                filtered.sort(key=lambda x: x.get("created_at", ""))
                return filtered
            except Exception:
                return []
        return []
