from sqlalchemy import Column, String, ForeignKey, DateTime, Float, Integer, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base

class Keyword(Base):
    __tablename__ = "keywords"
    
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(500), nullable=False)
    search_volume = Column(Integer)
    difficulty = Column(Float)
    cpc = Column(Float)
    current_position = Column(Integer)
    target_position = Column(Integer)
    url_ranking = Column(String(500))
    is_tracking = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    
    project = relationship("Project", back_populates="keywords")
    rankings = relationship("KeywordRanking", back_populates="keyword", cascade="all, delete-orphan")