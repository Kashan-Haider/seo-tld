from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.models import User
from db.database import get_db
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from core.hashing import Hasher

router = APIRouter(prefix="/user", tags=["user"])

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_premium: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    is_premium: bool
    class Config:
        from_attributes = True

@router.post("/create-user", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
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
    return new_user

@router.get("/get-user/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/all-users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@router.put("/update-user/{user_id}", response_model=UserResponse)
def update_user(user_id: str, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user_update.username is not None:
        setattr(user, 'username', user_update.username)
    if user_update.email is not None:
        setattr(user, 'email', user_update.email)
    if user_update.password is not None:
        setattr(user, 'hashed_password', Hasher.get_password_hash(user_update.password))
    if user_update.full_name is not None:
        setattr(user, 'full_name', user_update.full_name)
    if user_update.is_premium is not None:
        setattr(user, 'is_premium', user_update.is_premium)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/delete-user/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": f"User with id {user_id} deleted successfully."} 