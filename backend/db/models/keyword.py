from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base
import uuid

class Keyword(Base):
    __tablename__ = "keywords"
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    keyword = Column(String(500), nullable=False)
    search_volume = Column(String(20))
    keyword_difficulty = Column(String(20))
    competitive_density = Column(String(20))
    intent = Column(String(30))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    project = relationship("Project", back_populates="keywords")