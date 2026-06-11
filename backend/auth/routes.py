from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from auth.service import AuthService
from auth.jwt_service import JWTService, get_current_user
from auth.oauth_service import OAuthService
from services.export.colab_drive_exporter import ColabDriveExporter
from core.logger import logger
from urllib.parse import quote
import os

router = APIRouter(prefix="/auth", tags=["auth"])

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


# Request schemas
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register")
def register(request: RegisterRequest):
    user = AuthService.register_user(
        email=request.email,
        username=request.username,
        password=request.password,
        provider="local"
    )
    access_token = JWTService.create_access_token(user["_id"], user["email"], "local")
    refresh_token = JWTService.create_refresh_token(user["_id"], user["email"], "local")
    
    return {
        "user": {
            "user_id": user["_id"],
            "email": user["email"],
            "username": user["username"],
            "provider": user["provider"],
            "avatar_url": user["avatar_url"]
        },
        "access_token": access_token,
        "refresh_token": refresh_token
    }


@router.post("/login")
def login(request: LoginRequest):
    user = AuthService.login_user(
        email=request.email,
        password=request.password
    )
    access_token = JWTService.create_access_token(user["_id"], user["email"], "local")
    refresh_token = JWTService.create_refresh_token(user["_id"], user["email"], "local")
    
    return {
        "user": {
            "user_id": user["_id"],
            "email": user["email"],
            "username": user["username"],
            "provider": user["provider"],
            "avatar_url": user["avatar_url"]
        },
        "access_token": access_token,
        "refresh_token": refresh_token
    }


@router.post("/logout")
def logout():
    # Stateles JWT token deletion is handled client-side.
    return {"message": "Logged out successfully"}


@router.post("/refresh")
def refresh_token(request: TokenRefreshRequest):
    payload = JWTService.verify_token(request.refresh_token)
    
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Invalid token type")
        
    user_id = payload.get("sub")
    email = payload.get("email")
    provider = payload.get("provider")
    
    access_token = JWTService.create_access_token(user_id, email, provider)
    return {"access_token": access_token}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


# Google OAuth Endpoints
@router.get("/google/login")
def google_login():
    auth_url = OAuthService.get_google_auth_url()
    return RedirectResponse(auth_url)


def _complete_drive_colab_export(code: str, state: str, redirect_uri: str):
    export_state = JWTService.verify_export_state_token(state)
    token_data = OAuthService.exchange_google_code(code, redirect_uri)
    access_token = token_data.get("access_token")
    if not access_token:
        return RedirectResponse(
            f"{FRONTEND_URL}/#/colab-launch?error={quote('Google did not return a Drive access token')}"
        )

    exporter = ColabDriveExporter()
    result = exporter.export(
        dataset_id=export_state["dataset_id"],
        user_id=export_state["sub"],
        mode=export_state.get("mode", "clean"),
        access_token=access_token,
    )

    colab_url = quote(result.colab_url or "", safe="")
    file_id = quote(result.file_id or "", safe="")
    web_view = quote(result.web_view_link or "", safe="")
    redirect_target = (
        f"{FRONTEND_URL}/#/colab-launch?colab_url={colab_url}&file_id={file_id}&web_view_link={web_view}"
    )
    logger.info(
        "[ColabExport] redirect file_id=%s colab_url=%s redirect_url=%s",
        result.file_id,
        result.colab_url,
        redirect_target,
    )
    return RedirectResponse(redirect_target)


@router.get("/google/callback")
def google_callback(code: str = None, error: str = None, state: str = None):
    # Colab export: same redirect URI as login, distinguished by signed state JWT
    if state:
        if error or not code:
            message = quote(error or "Google Drive authentication cancelled")
            return RedirectResponse(f"{FRONTEND_URL}/#/colab-launch?error={message}")
        redirect_uri = OAuthService.resolve_google_redirect_uri(for_drive=True)
        logger.info("[OAuth] drive_callback redirect_uri=%s (unified /google/callback)", redirect_uri)
        try:
            return _complete_drive_colab_export(code, state, redirect_uri)
        except PermissionError as exc:
            return RedirectResponse(f"{FRONTEND_URL}/#/colab-launch?error={quote(str(exc))}")
        except Exception as exc:
            logger.error(f"Google Drive Colab export failed: {exc}")
            return RedirectResponse(f"{FRONTEND_URL}/#/colab-launch?error={quote(str(exc))}")

    if error or not code:
        # Redirect to login with error parameter
        return RedirectResponse(f"{FRONTEND_URL}/#/login?error=Google authentication cancelled")
        
    try:
        info = OAuthService.get_google_user_info(code)
        if not info.get("email"):
            return RedirectResponse(f"{FRONTEND_URL}/#/login?error=Google account is missing verified email address")
            
        user = AuthService.authenticate_oauth_user(
            email=info["email"],
            username=info["username"],
            provider="google",
            avatar_url=info["avatar_url"]
        )
        access_token = JWTService.create_access_token(user["_id"], user["email"], "google")
        refresh_token = JWTService.create_refresh_token(user["_id"], user["email"], "google")
        
        # Redirect to OAuth callback handler in React Router
        return RedirectResponse(f"{FRONTEND_URL}/#/oauth-callback?token={access_token}&refresh={refresh_token}")
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/#/login?error={str(e)}")


@router.get("/google/drive/callback")
def google_drive_callback(code: str = None, state: str = None, error: str = None):
    """
    One-time Drive OAuth callback for Colab export.
    Google access tokens are used immediately and never stored.
    """
    if error or not code or not state:
        message = quote(error or "Google Drive authentication cancelled")
        return RedirectResponse(f"{FRONTEND_URL}/#/colab-launch?error={message}")

    redirect_uri = os.environ.get(
        "GOOGLE_DRIVE_REDIRECT_URI",
        "http://localhost:8000/auth/google/drive/callback",
    )
    logger.info("[OAuth] drive_callback redirect_uri=%s (legacy /google/drive/callback)", redirect_uri)

    try:
        return _complete_drive_colab_export(code, state, redirect_uri)
    except PermissionError as exc:
        return RedirectResponse(f"{FRONTEND_URL}/#/colab-launch?error={quote(str(exc))}")
    except Exception as exc:
        logger.error(f"Google Drive Colab export failed: {exc}")
        return RedirectResponse(f"{FRONTEND_URL}/#/colab-launch?error={quote(str(exc))}")


# GitHub OAuth Endpoints
@router.get("/github/login")
def github_login():
    auth_url = OAuthService.get_github_auth_url()
    return RedirectResponse(auth_url)


@router.get("/github/callback")
def github_callback(code: str = None, error: str = None):
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/#/login?error=GitHub authentication cancelled")
        
    try:
        info = OAuthService.get_github_user_info(code)
        if not info.get("email"):
            return RedirectResponse(f"{FRONTEND_URL}/#/login?error=GitHub account is missing verified primary email address")
            
        user = AuthService.authenticate_oauth_user(
            email=info["email"],
            username=info["username"],
            provider="github",
            avatar_url=info["avatar_url"]
        )
        access_token = JWTService.create_access_token(user["_id"], user["email"], "github")
        refresh_token = JWTService.create_refresh_token(user["_id"], user["email"], "github")
        
        return RedirectResponse(f"{FRONTEND_URL}/#/oauth-callback?token={access_token}&refresh={refresh_token}")
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/#/login?error={str(e)}")
