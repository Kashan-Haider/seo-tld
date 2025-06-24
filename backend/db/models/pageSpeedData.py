from pydantic import BaseModel
from typing import List, Dict

class PageSpeedData(BaseModel):
    performance_score: int
    fcp: float
    lcp: float
    cls: float
    fid: float
    ttfb: float
    opportunities: List[Dict]
    diagnostics: List[Dict]