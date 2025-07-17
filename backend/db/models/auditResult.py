from pydantic import BaseModel
from typing import List
from datetime import datetime
from .pageSpeedData import PageSpeedData

class AuditResult(BaseModel):
    url: str
    timestamp: datetime
    pagespeed_mobile: PageSpeedData
    pagespeed_desktop: PageSpeedData
    overall_score: int
    recommendations: List[str]