from sqlalchemy import Column, String, DateTime, Float, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200))
    is_premium = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True)
    verification_token_expiry = Column(DateTime(timezone=True), nullable=True)
    reset_password_token = Column(String(255), nullable=True)
    reset_password_token_expiry = Column(DateTime(timezone=True), nullable=True)
    refresh_token = Column(String(512), nullable=True)
    refresh_token_expiry = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    auth_provider = Column(String(32), default='local', nullable=False)  # 'local' or 'google'
    
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")

    # Always store email in lowercase
    def __init__(self, *args, **kwargs):
        if 'email' in kwargs and kwargs['email']:
            kwargs['email'] = kwargs['email'].lower()
        super().__init__(*args, **kwargs)