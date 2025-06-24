from sqlalchemy import Column, String, ForeignKey, DateTime, Float, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base

class CompetitorAnalysis(Base):
    __tablename__ = "competitor_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    competitor_name = Column(String(200), nullable=False)
    competitor_url = Column(String(500), nullable=False)
    analysis_type = Column(String(50), nullable=False)  # keywords, backlinks, content, etc.
    
    # Competitor metrics
    domain_authority = Column(Float)
    page_authority = Column(Float)
    total_backlinks = Column(Integer)
    referring_domains = Column(Integer)
    organic_keywords = Column(Integer)
    organic_traffic = Column(Integer)
    paid_keywords = Column(Integer)
    
    # Analysis results (JSON field for flexible data storage)
    analysis_data = Column(JSON)
    
    # Comparison scores
    keyword_overlap_score = Column(Float)
    content_similarity_score = Column(Float)
    backlink_gap_score = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Foreign Keys
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="competitor_analyses")