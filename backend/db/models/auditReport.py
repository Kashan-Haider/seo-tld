from sqlalchemy import Column, String, ForeignKey, DateTime, Float, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base

class AuditReport(Base):
    __tablename__ = "audit_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_type = Column(String(50), default="full")  # full, technical, content, etc.
    
    # PageSpeed Data
    mobile_performance_score = Column(Integer)
    desktop_performance_score = Column(Integer)
    mobile_fcp = Column(Float)
    mobile_lcp = Column(Float)
    mobile_cls = Column(Float)
    desktop_fcp = Column(Float)
    desktop_lcp = Column(Float)
    desktop_cls = Column(Float)
    
    # Overall Scores
    overall_score = Column(Integer)
    
    # Detailed data (JSON fields)
    pagespeed_data = Column(JSON)
    recommendations = Column(JSON)
    lighthouse_mobile = Column(JSON)
    lighthouse_desktop = Column(JSON)
    
    # Audit metadata
    audit_date_start = Column(DateTime(timezone=True))
    audit_date_end = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Foreign Keys
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="audits")