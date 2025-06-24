from sqlalchemy import Column, String, ForeignKey, DateTime, Float, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base

class KeywordRanking(Base):
    __tablename__ = "keyword_rankings"
    
    id = Column(Integer, primary_key=True, index=True)
    position = Column(Integer)
    url = Column(String(500))
    search_volume = Column(Integer)
    clicks = Column(Integer)
    impressions = Column(Integer)
    ctr = Column(Float)
    date_tracked = Column(DateTime(timezone=True), server_default=func.now())
    
    # Foreign Keys
    keyword_id = Column(Integer, ForeignKey("keywords.id"), nullable=False)
    
    # Relationships
    keyword = relationship("Keyword", back_populates="rankings")
