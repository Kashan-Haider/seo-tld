from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from typing import Optional
from dotenv import load_dotenv
import os
import logging
import uuid

load_dotenv()

SECRET_KEY_ENV = os.getenv("SECRET_KEY")
if not SECRET_KEY_ENV:
    raise RuntimeError("SECRET_KEY environment variable must be set!")
SECRET_KEY: str = SECRET_KEY_ENV
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "1440"))

def generate_jti():
    return str(uuid.uuid4())

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    to_encode["token_type"] = "access"
    to_encode["jti"] = generate_jti()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    to_encode["token_type"] = "refresh"
    to_encode["jti"] = generate_jti()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("token_type") != "access":
            logging.warning("Token type is not access")
            return None
        return payload
    except JWTError as e:
        logging.error(f"JWT access token verification failed: {e}")
        return None

def verify_refresh_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("token_type") != "refresh":
            logging.warning("Token type is not refresh")
            return None
        return payload
    except JWTError as e:
        logging.error(f"JWT refresh token verification failed: {e}")
        return None 