from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from auth.service import AuthService
from auth.jwt_service import JWTService, get_current_user
from auth.oauth_service import OAuthService
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


@router.get("/google/callback")
def google_callback(code: str = None, error: str = None):
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
