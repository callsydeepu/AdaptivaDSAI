import os
import requests
from fastapi import HTTPException

class OAuthService:
    @staticmethod
    def get_google_auth_url() -> str:
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
        if not client_id:
            raise HTTPException(status_code=400, detail="Google Client ID is not configured in environment variables.")
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"response_type=code&"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"scope=openid%20email%20profile"
        )

    @staticmethod
    def get_google_user_info(code: str) -> dict:
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
        redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
        
        if not client_id or not client_secret:
            raise HTTPException(status_code=400, detail="Google client credentials are not configured.")

        # 1. Exchange code for access token
        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        res = requests.post(token_url, data=payload, timeout=5)
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to exchange Google OAuth code: {res.text}")
            
        access_token = res.json().get("access_token")
        
        # 2. Get user profile details
        userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        user_res = requests.get(userinfo_url, headers=headers, timeout=5)
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user profile info.")
            
        user_data = user_res.json()
        return {
            "email": user_data.get("email"),
            "username": user_data.get("name", user_data.get("email", "").split("@")[0]),
            "avatar_url": user_data.get("picture"),
            "id": user_data.get("sub")
        }

    @staticmethod
    def get_github_auth_url() -> str:
        client_id = os.environ.get("GITHUB_CLIENT_ID", "")
        redirect_uri = os.environ.get("GITHUB_REDIRECT_URI", "http://localhost:8000/auth/github/callback")
        if not client_id:
            raise HTTPException(status_code=400, detail="GitHub Client ID is not configured in environment variables.")
        return (
            f"https://github.com/login/oauth/authorize?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"scope=user:email"
        )

    @staticmethod
    def get_github_user_info(code: str) -> dict:
        client_id = os.environ.get("GITHUB_CLIENT_ID", "")
        client_secret = os.environ.get("GITHUB_CLIENT_SECRET", "")
        redirect_uri = os.environ.get("GITHUB_REDIRECT_URI", "http://localhost:8000/auth/github/callback")

        if not client_id or not client_secret:
            raise HTTPException(status_code=400, detail="GitHub client credentials are not configured.")

        # 1. Exchange code for access token
        token_url = "https://github.com/login/oauth/access_token"
        payload = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri
        }
        headers = {"Accept": "application/json"}
        res = requests.post(token_url, json=payload, headers=headers, timeout=5)
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to exchange GitHub OAuth code: {res.text}")
            
        access_token = res.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail=f"GitHub OAuth error: {res.json().get('error_description', 'No access token returned')}")
            
        # 2. Get user details
        user_url = "https://api.github.com/user"
        auth_headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        user_res = requests.get(user_url, headers=auth_headers, timeout=5)
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch GitHub user details.")
            
        user_data = user_res.json()
        
        # 3. Get user email if not public in profile
        email = user_data.get("email")
        if not email:
            email_url = "https://api.github.com/user/emails"
            emails_res = requests.get(email_url, headers=auth_headers, timeout=5)
            if emails_res.status_code == 200:
                # Find primary email
                emails = emails_res.json()
                primary_email = next((e.get("email") for e in emails if e.get("primary")), None)
                email = primary_email if primary_email else (emails[0].get("email") if emails else None)

        return {
            "email": email,
            "username": user_data.get("login"),
            "avatar_url": user_data.get("avatar_url"),
            "id": str(user_data.get("id"))
        }
