from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from typing import Optional
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "1440"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
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
        return payload
    except JWTError as e:
        print(f"JWT verification failed: {e}")
        return None

def verify_token_for_refresh(token: str):
    """
    Verify token for refresh purposes - allows expired tokens within a reasonable window
    """
    try:
        # First try normal verification
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        if "expired" in str(e).lower():
            # Token is expired, but let's check if it's within refresh window
            try:
                # Decode without verification to get payload
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
                
                # Check if token expired within last 15 minutes
                exp_timestamp = payload.get("exp")
                if exp_timestamp:
                    exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
                    now = datetime.now(timezone.utc)
                    time_since_expiry = now - exp_datetime
                    
                    if time_since_expiry <= timedelta(minutes=15):
                        print(f"Token expired {time_since_expiry} ago, allowing refresh")
                        return payload
                    else:
                        print(f"Token too old for refresh. Expired {time_since_expiry} ago")
                        return None
                return payload
            except JWTError as decode_error:
                print(f"Failed to decode expired token: {decode_error}")
                return None
        else:
            print(f"JWT verification failed: {e}")
            return None 