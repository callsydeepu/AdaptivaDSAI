import uuid
import json
import os
from datetime import datetime
from fastapi import HTTPException, status
from core.database import db, db_connected
from auth.password_service import PasswordService

USERS_FILE = "data/users.json"


class AuthService:
    @staticmethod
    def _save_user_to_file(user_data: dict):
        os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
        users = []
        if os.path.exists(USERS_FILE):
            try:
                with open(USERS_FILE, "r") as f:
                    users = json.load(f)
            except Exception:
                users = []
        
        # Remove old duplicate if exists
        users = [u for u in users if u["_id"] != user_data["_id"]]
        users.append(user_data)
        
        try:
            with open(USERS_FILE, "w") as f:
                json.dump(users, f, indent=4)
        except Exception as e:
            print(f"Error saving user to fallback JSON: {e}")

    @staticmethod
    def _get_user_from_file_by_email(email: str) -> dict:
        if os.path.exists(USERS_FILE):
            try:
                with open(USERS_FILE, "r") as f:
                    users = json.load(f)
                for u in users:
                    if u.get("email") == email:
                        return u
            except Exception:
                pass
        return None

    @staticmethod
    def _get_user_from_file_by_id(user_id: str) -> dict:
        if os.path.exists(USERS_FILE):
            try:
                with open(USERS_FILE, "r") as f:
                    users = json.load(f)
                for u in users:
                    if u.get("_id") == user_id:
                        return u
            except Exception:
                pass
        return None

    @staticmethod
    def register_user(email: str, username: str, password: str = None, provider: str = "local", avatar_url: str = None) -> dict:
        email = email.lower().strip()
        
        # 1. Check if user already exists
        existing_user = None
        if db_connected and db is not None:
            try:
                existing_user = db.users.find_one({"email": email})
            except Exception:
                pass
        else:
            existing_user = AuthService._get_user_from_file_by_email(email)
            
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already registered"
            )
            
        # 2. Hash password if local provider
        password_hash = None
        if provider == "local" and password:
            password_hash = PasswordService.hash_password(password)
            
        user_id = str(uuid.uuid4())
        user_data = {
            "_id": user_id,
            "email": email,
            "username": username,
            "password_hash": password_hash,
            "provider": provider,
            "avatar_url": avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={username}",
            "created_at": datetime.now().isoformat(),
            "last_login": datetime.now().isoformat(),
            "is_active": True
        }
        
        # 3. Save to MongoDB
        if db_connected and db is not None:
            try:
                db.users.insert_one(user_data)
            except Exception as e:
                print(f"Error saving user to MongoDB: {e}")
                
        # 4. Save to JSON fallback
        AuthService._save_user_to_file(user_data)
        
        return user_data

    @staticmethod
    def login_user(email: str, password: str) -> dict:
        email = email.lower().strip()
        
        # 1. Find user
        user_data = None
        if db_connected and db is not None:
            try:
                user_data = db.users.find_one({"email": email})
            except Exception:
                pass
        else:
            user_data = AuthService._get_user_from_file_by_email(email)
            
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password credentials"
            )
            
        if user_data.get("provider") != "local":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This account is configured to log in with {user_data.get('provider').capitalize()} OAuth."
            )
            
        # 2. Check password
        if not PasswordService.verify_password(password, user_data.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password credentials"
            )
            
        if not user_data.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated"
            )
            
        # 3. Update last login
        user_data["last_login"] = datetime.now().isoformat()
        if db_connected and db is not None:
            try:
                db.users.replace_one({"_id": user_data["_id"]}, user_data)
            except Exception:
                pass
        AuthService._save_user_to_file(user_data)
        
        return user_data

    @staticmethod
    def authenticate_oauth_user(email: str, username: str, provider: str, avatar_url: str = None) -> dict:
        email = email.lower().strip()
        
        # 1. Look up user by email
        user_data = None
        if db_connected and db is not None:
            try:
                user_data = db.users.find_one({"email": email})
            except Exception:
                pass
        else:
            user_data = AuthService._get_user_from_file_by_email(email)
            
        if user_data:
            # User exists, verify provider or update it
            if user_data.get("provider") != provider:
                user_data["provider"] = provider  # Link to OAuth
            if avatar_url:
                user_data["avatar_url"] = avatar_url
            user_data["last_login"] = datetime.now().isoformat()
            
            if db_connected and db is not None:
                try:
                    db.users.replace_one({"_id": user_data["_id"]}, user_data)
                except Exception:
                    pass
            AuthService._save_user_to_file(user_data)
            return user_data
        else:
            # Create new OAuth user
            return AuthService.register_user(
                email=email,
                username=username,
                password=None,
                provider=provider,
                avatar_url=avatar_url
            )
