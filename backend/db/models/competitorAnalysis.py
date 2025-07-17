from sqlalchemy import Column, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base
import uuid

class CompetitorAnalysis(Base):
    __tablename__ = "competitor_analyses"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    user_url = Column(String(500), nullable=False)
    competitor_urls = Column(JSON, nullable=False)  # List of URLs
    competitor_keywords = Column(JSON, nullable=False)  # {url: [keywords]}
    content_gaps = Column(JSON, nullable=False)  # List of gaps
    recommendations = Column(JSON, nullable=False)  # List of recs
    analysis_type = Column(String(50), nullable=False, default="full")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="competitor_analyses")