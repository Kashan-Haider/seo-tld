from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Boolean, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base
import uuid

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    description = Column(Text)
    website_url = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Foreign Keys
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="projects")
    keywords = relationship("Keyword", back_populates="project", cascade="all, delete-orphan")
    audits = relationship("AuditReport", back_populates="project", cascade="all, delete-orphan")
    competitor_analyses = relationship("CompetitorAnalysis", back_populates="project", cascade="all, delete-orphan")