from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from db.models.user import User
from db.database import get_db
from pydantic import BaseModel, EmailStr
from core.hashing import Hasher
from core import jwt as jwt_utils
from typing import Optional
from datetime import timedelta
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.responses import RedirectResponse
import os

router = APIRouter(prefix="/auth", tags=["auth"])

# --- Signup/Login Schemas ---
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
    token_type: str = "bearer"

# --- Signup Endpoint ---
@router.post("/signup", response_model=TokenResponse)
def signup(user: SignupRequest, db: Session = Depends(get_db)):
    db_user_by_email = db.query(User).filter(User.email == user.email).first()
    if db_user_by_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user_by_username = db.query(User).filter(User.username == user.username).first()
    if db_user_by_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=Hasher.get_password_hash(user.password),
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = jwt_utils.create_access_token({"sub": new_user.id, "email": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Login Endpoint ---
@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not Hasher.verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = jwt_utils.create_access_token({"sub": user.id, "email": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Google OAuth Setup ---
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
    redirect_uri = request.url_for('google_auth')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get('/google-auth')
async def google_auth(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = await oauth.google.parse_id_token(request, token)
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to retrieve user info from Google")
    email = user_info['email']
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create user if doesn't exist
        user = User(
            username=email.split('@')[0],
            email=email,
            hashed_password=Hasher.get_password_hash(os.urandom(16).hex()),
            full_name=user_info.get('name')
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    access_token = jwt_utils.create_access_token({"sub": user.id, "email": user.email})
    # Redirect or return token
    return {"access_token": access_token, "token_type": "bearer"} 