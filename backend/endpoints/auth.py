from fastapi import APIRouter, Depends, HTTPException, status, Request, Header, Body
from sqlalchemy.orm import Session
from db.models.user import User
from db.database import get_db
from pydantic import BaseModel, EmailStr, constr, Field
from core.hashing import Hasher
from core import jwt as jwt_utils
from typing import Optional
from datetime import timedelta, datetime, timezone
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.responses import RedirectResponse
import os
from dotenv import load_dotenv
import secrets
from services.EmailService import EmailService
from fastapi.responses import RedirectResponse
import logging

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenValidationResponse(BaseModel):
    valid: bool
    payload: Optional[dict] = None
    user_id: Optional[str] = None
    email: Optional[str] = None
    message: Optional[str] = None

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

VERIFICATION_TOKEN_EXPIRE_HOURS = int(os.getenv("VERIFICATION_TOKEN_EXPIRE_HOURS", "3"))
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# In-memory rate limit store: {email: [timestamps]}
resend_verification_attempts = {}

@router.post("/signup")
def signup(user: SignupRequest, db: Session = Depends(get_db)):
    email = user.email.lower()
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_username = db.query(User).filter(User.username == user.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    verification_token = secrets.token_urlsafe(32)
    verification_token_expiry = datetime.now(timezone.utc) + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
    hashed_password = Hasher.get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_verified=False,
        verification_token=verification_token,
        verification_token_expiry=verification_token_expiry
    )
    db.add(db_user)
    try:
        verification_link = f"{BACKEND_URL}/auth/verify-email?token={verification_token}"
        EmailService.send_verification_email(email, verification_link)
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to send verification email: {str(e)}")
    return {"message": "Signup successful. Please check your email to verify your account."}

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    email = request.email.lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not Hasher.verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bool(user.is_verified):
        raise HTTPException(status_code=403, detail="Please verify your email before logging in.")
    access_token = jwt_utils.create_access_token({"sub": user.id, "email": user.email})
    refresh_token = jwt_utils.create_refresh_token({"sub": user.id, "email": user.email})
    user.__setattr__('refresh_token', refresh_token)
    user.__setattr__('refresh_token_expiry', datetime.now(timezone.utc) + timedelta(minutes=jwt_utils.REFRESH_TOKEN_EXPIRE_MINUTES))
    db.commit()
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

config = Config(environ=os.environ)
oauth = OAuth(config)

oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

@router.get('/google-login')
async def google_login(request: Request):
    try:
        # Use environment variable for redirect URI
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", f"http://localhost:8000/auth/google-auth")
        if oauth.google is None:
            logging.error("Google OAuth client not configured.")
            return
        logging.info(f"Initiating Google OAuth login, redirect_uri={redirect_uri}")
        return await oauth.google.authorize_redirect(request, redirect_uri)
    except Exception as e:
        logging.error(f"Google login failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Google login failed: {str(e)}")

@router.get('/google-auth')
async def google_auth(request: Request, db: Session = Depends(get_db)):
    try:
        code = request.query_params.get('code')
        if not code:
            logging.error("No authorization code received from Google.")
            raise HTTPException(status_code=400, detail="No authorization code received from Google")
        if oauth.google is None:
            logging.error("Google OAuth client not configured.")
            return
        token = await oauth.google.authorize_access_token(request)
        try:
            resp = await oauth.google.get('https://www.googleapis.com/oauth2/v2/userinfo', token=token)
            user_info = resp.json()
        except Exception as api_error:
            if 'userinfo' in token:
                user_info = token['userinfo']
            else:
                logging.error(f"Failed to retrieve user info from Google: {api_error}")
                raise HTTPException(status_code=400, detail="Failed to retrieve user info from Google")
        if not user_info or 'email' not in user_info:
            logging.error("Failed to retrieve user info from Google (missing email)")
            raise HTTPException(status_code=400, detail="Failed to retrieve user info from Google")
        email = user_info['email'].lower()
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # New Google user: create and mark as verified
            username = email.split('@')[0]
            counter = 1
            original_username = username
            while db.query(User).filter(User.username == username).first():
                username = f"{original_username}{counter}"
                counter += 1
            user = User(
                username=username,
                email=email,
                hashed_password=Hasher.get_password_hash(os.urandom(16).hex()),
                full_name=user_info.get('name', ''),
            )
            setattr(user, 'is_verified', True)
            setattr(user, 'auth_provider', 'google')
            db.add(user)
            db.commit()
            db.refresh(user)
            logging.info(f"Created new Google user: {email}")
        else:
            # Existing user: check provider and verification
            if getattr(user, 'auth_provider', None) != 'google':
                logging.warning(f"User {email} exists with provider {user.auth_provider}. Consider account linking.")
            if not getattr(user, 'is_verified', False):
                setattr(user, 'is_verified', True)
                db.commit()
                logging.info(f"Marked existing user {email} as verified via Google login.")
            # Update provider if missing or not google
            if not getattr(user, 'auth_provider', None) or getattr(user, 'auth_provider', None) != 'google':
                setattr(user, 'auth_provider', 'google')
                db.commit()
        # Issue tokens
        access_token = jwt_utils.create_access_token({"sub": user.id, "email": user.email})
        refresh_token = jwt_utils.create_refresh_token({"sub": user.id, "email": user.email})
        user.__setattr__('refresh_token', refresh_token)
        user.__setattr__('refresh_token_expiry', datetime.now(timezone.utc) + timedelta(minutes=jwt_utils.REFRESH_TOKEN_EXPIRE_MINUTES))
        db.commit()
        # Use environment variable for frontend URL
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url}/auth/callback?token={access_token}&refresh_token={refresh_token}"
        logging.info(f"Google login successful for {email}, redirecting to frontend.")
        return RedirectResponse(url=redirect_url)
    except Exception as e:
        logging.error(f"OAuth authentication failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"OAuth authentication failed: {str(e)}")

@router.post("/validate-token", response_model=TokenValidationResponse)
def validate_token(Authorization: str = Header(...), db: Session = Depends(get_db)):
    try:
        if not Authorization.startswith("Bearer "):
            return TokenValidationResponse(valid=False, message="Invalid authorization header format. Expected 'Bearer <token>'")
        token = Authorization.replace("Bearer ", "")
        payload = jwt_utils.verify_access_token(token)
        if not payload:
            return TokenValidationResponse(valid=False, message="Invalid or expired token")
        user_id = payload.get("sub")
        email = payload.get("email")
        if not user_id or not email:
            return TokenValidationResponse(valid=False, message="Token payload missing required user information")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return TokenValidationResponse(valid=False, message="User no longer exists in database")
        if user.email != email:
            return TokenValidationResponse(valid=False, message="User email mismatch")
        exp_timestamp = payload.get("exp")
        if exp_timestamp:
            exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
            now = datetime.now(timezone.utc)
            if now > exp_datetime:
                return TokenValidationResponse(valid=False, message="Token has expired")
        return TokenValidationResponse(valid=True, payload=payload, user_id=user_id, email=email, message="Token is valid")
    except Exception as e:
        return TokenValidationResponse(valid=False, message=f"Token validation error: {str(e)}")

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh-token", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        if not request.refresh_token or len(request.refresh_token) < 10:
            logging.warning("Refresh token is too short or empty")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token format")
        payload = jwt_utils.verify_refresh_token(request.refresh_token)
        if not payload:
            logging.warning("JWT refresh token verification failed")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")
        user_id = payload.get("sub")
        email = payload.get("email")
        if not user_id or not email:
            logging.warning("Missing user_id or email in refresh token payload")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token payload missing required user information")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logging.warning("User not found for refresh token")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")
        if user.email != email:
            logging.warning(f"Email mismatch: {user.email} != {email}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User email mismatch")
        # Check if refresh token matches and is not expired
        if getattr(user, 'refresh_token') != request.refresh_token:
            logging.warning("Refresh token does not match stored token")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token does not match")
        expiry = getattr(user, 'refresh_token_expiry')
        if expiry is None or datetime.now(timezone.utc) > expiry:
            logging.warning("Refresh token expired")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")
        # Issue new tokens
        new_access_token = jwt_utils.create_access_token({"sub": user_id, "email": email})
        new_refresh_token = jwt_utils.create_refresh_token({"sub": user_id, "email": email})
        user.__setattr__('refresh_token', new_refresh_token)
        user.__setattr__('refresh_token_expiry', datetime.now(timezone.utc) + timedelta(minutes=jwt_utils.REFRESH_TOKEN_EXPIRE_MINUTES))
        db.commit()
        return TokenResponse(access_token=new_access_token, refresh_token=new_refresh_token, token_type="bearer")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Exception in refresh-token: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Token refresh error: {str(e)}")

def get_current_user(Authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    try:
        if not Authorization.startswith("Bearer "):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header format. Expected 'Bearer <token>'")
        token = Authorization.replace("Bearer ", "")
        payload = jwt_utils.verify_access_token(token)
        if not payload:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
        user_id = payload.get("sub")
        email = payload.get("email")
        if not user_id or not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token payload missing required user information")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists in database")
        if user.email != email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User email mismatch")
        exp_timestamp = payload.get("exp")
        if exp_timestamp:
            exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
            now = datetime.now(timezone.utc)
            if now > exp_datetime:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Authentication error: {str(e)}")

@router.get("/me", response_model=dict)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_premium": current_user.is_premium,
        "created_at": current_user.created_at.isoformat() if current_user.created_at is not None else None
    }

@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    frontend_url = f"{FRONTEND_URL}/auth/verify"
    if user is None:
        logging.info(f"Email verification failed: invalid token {token}")
        return RedirectResponse(url=f"{frontend_url}?status=error&reason=invalid_token")
    expiry = getattr(user, 'verification_token_expiry', None)
    if expiry is None or datetime.now(timezone.utc) > expiry:
        logging.info(f"Email verification failed: expired token for user {user.email}")
        return RedirectResponse(url=f"{frontend_url}?status=error&reason=expired_token")
    user.is_verified = True #type:ignore
    user.verification_token = None #type:ignore
    user.verification_token_expiry = None #type:ignore
    db.commit()
    logging.info(f"Email verification success for user {user.email}")
    access_token = jwt_utils.create_access_token({"sub": user.id, "email": user.email})
    return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={access_token}")

@router.post("/resend-verification")
def resend_verification(request: ResendVerificationRequest, db: Session = Depends(get_db)):
    email = request.email.lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email does not exist.")
    if bool(user.is_verified):
        return {"message": "User is already verified."}
    # Rate limiting
    now = datetime.now(timezone.utc)
    attempts = resend_verification_attempts.get(email, [])
    # Remove attempts older than 1 hour
    attempts = [t for t in attempts if (now - t).total_seconds() < 3600]
    if len(attempts) >= 3:
        logging.warning(f"Resend verification rate limit hit for {email}")
        raise HTTPException(status_code=429, detail="Too many resend attempts. Please try again later.")
    attempts.append(now)
    resend_verification_attempts[email] = attempts
    verification_token = secrets.token_urlsafe(32)
    verification_token_expiry = now + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
    setattr(user, 'verification_token', verification_token)
    setattr(user, 'verification_token_expiry', verification_token_expiry)
    try:
        verification_link = f"{BACKEND_URL}/auth/verify-email?token={verification_token}"
        EmailService.send_verification_email(getattr(user, 'email'), verification_link)
        db.commit()
        logging.info(f"Resent verification email to {email}")
    except Exception as e:
        db.rollback()
        logging.error(f"Failed to send verification email to {email}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send verification email: {str(e)}")
    return {"message": "Verification email resent. Please check your inbox."}

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = request.email.lower()
    user = db.query(User).filter(User.email == email).first()
    # Always return generic message
    message = "If an account with that email exists, a password reset link has been sent."
    if not user:
        return {"message": message}
    reset_token = secrets.token_urlsafe(32)
    expiry = datetime.now(timezone.utc) + timedelta(hours=1)
    user.reset_password_token = reset_token #type:ignore
    user.reset_password_token_expiry = expiry #type:ignore
    try:
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        EmailService.send_password_reset_email(str(getattr(user, 'email')), reset_link)
        db.commit()
    except Exception as e:
        db.rollback()
        return {"message": message}
    return {"message": message}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_password_token == request.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    expiry = getattr(user, 'reset_password_token_expiry', None)
    if expiry is None or datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    # Set new password
    user.hashed_password = Hasher.get_password_hash(request.new_password) #type:ignore
    user.reset_password_token = None #type:ignore
    user.reset_password_token_expiry = None #type:ignore
    db.commit()
    return {"message": "Password has been reset successfully. You can now log in."}

@router.post("/logout")
def logout(Authorization: str = Header(...), db: Session = Depends(get_db)):
    try:
        if not Authorization.startswith("Bearer "):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header format. Expected 'Bearer <token>'")
        token = Authorization.replace("Bearer ", "")
        payload = jwt_utils.verify_access_token(token)
        if not payload:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        # Revoke refresh token
        user.__setattr__('refresh_token', None)
        user.__setattr__('refresh_token_expiry', None)
        db.commit()
        return {"message": "Logged out successfully."}
    except Exception as e:
        logging.error(f"Logout error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Logout error")
