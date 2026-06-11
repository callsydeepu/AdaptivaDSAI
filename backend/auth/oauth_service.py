import os
from urllib.parse import quote

import requests
from fastapi import HTTPException
from core.logger import logger

GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"
DEFAULT_GOOGLE_REDIRECT_URI = "http://localhost:8000/auth/google/callback"
LEGACY_DRIVE_REDIRECT_URI = "http://localhost:8000/auth/google/drive/callback"


class OAuthService:
    @staticmethod
    def resolve_google_redirect_uri(for_drive: bool = False) -> str:
        """
        Login uses GOOGLE_REDIRECT_URI.
        Colab/Drive export uses GOOGLE_DRIVE_REDIRECT_URI when set, otherwise the same URI as login
        so Google Cloud Console only needs one authorized redirect URI.
        """
        login_uri = os.environ.get("GOOGLE_REDIRECT_URI", DEFAULT_GOOGLE_REDIRECT_URI)
        if for_drive:
            return os.environ.get("GOOGLE_DRIVE_REDIRECT_URI") or login_uri
        return login_uri

    @staticmethod
    def _log_oauth_redirect(flow: str, redirect_uri: str) -> None:
        logger.info("[OAuth] flow=%s redirect_uri=%s", flow, redirect_uri)

    @staticmethod
    def _google_client_config() -> tuple[str, str]:
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
        if not client_id or not client_secret:
            raise HTTPException(status_code=400, detail="Google client credentials are not configured.")
        return client_id, client_secret

    @staticmethod
    def exchange_google_code(code: str, redirect_uri: str) -> dict:
        """Exchange an authorization code for Google tokens. Tokens are ephemeral — never persisted."""
        client_id, client_secret = OAuthService._google_client_config()
        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        res = requests.post(token_url, data=payload, timeout=15)
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to exchange Google OAuth code: {res.text}")
        return res.json()

    @staticmethod
    def get_google_auth_url(include_drive: bool = False) -> str:
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        redirect_uri = OAuthService.resolve_google_redirect_uri(for_drive=False)
        if not client_id:
            raise HTTPException(status_code=400, detail="Google Client ID is not configured in environment variables.")

        OAuthService._log_oauth_redirect("google_login", redirect_uri)

        scopes = ["openid", "email", "profile"]
        if include_drive:
            scopes.append(GOOGLE_DRIVE_SCOPE)

        scope_param = quote(" ".join(scopes))
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"response_type=code&"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"scope={scope_param}&"
            f"access_type=online&"
            f"prompt=consent"
        )

    @staticmethod
    def get_google_drive_auth_url(state: str) -> str:
        """OAuth URL for one-time Drive upload during Colab export."""
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        redirect_uri = OAuthService.resolve_google_redirect_uri(for_drive=True)
        if not client_id:
            raise HTTPException(status_code=400, detail="Google Client ID is not configured in environment variables.")

        OAuthService._log_oauth_redirect("colab_drive_export", redirect_uri)

        scopes = quote(f"openid email profile {GOOGLE_DRIVE_SCOPE}")
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"response_type=code&"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"scope={scopes}&"
            f"access_type=online&"
            f"prompt=consent&"
            f"state={quote(state)}"
        )

    @staticmethod
    def get_google_user_info(code: str) -> dict:
        redirect_uri = OAuthService.resolve_google_redirect_uri(for_drive=False)
        token_data = OAuthService.exchange_google_code(code, redirect_uri)
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Google OAuth did not return an access token.")

        userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        user_res = requests.get(userinfo_url, headers=headers, timeout=10)
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user profile info.")

        user_data = user_res.json()
        return {
            "email": user_data.get("email"),
            "username": user_data.get("name", user_data.get("email", "").split("@")[0]),
            "avatar_url": user_data.get("picture"),
            "id": user_data.get("sub"),
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
