# models/schemas.py
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    is_verified: Optional[bool] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_premium: bool
    created_at: datetime
    is_verified: Optional[bool] = None
    
    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    website_url: str

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Keyword Schemas
class KeywordBase(BaseModel):
    keyword: str
    search_volume: Optional[int] = None
    difficulty: Optional[float] = None
    cpc: Optional[float] = None
    target_position: Optional[int] = None

class KeywordCreate(KeywordBase):
    project_id: int

class KeywordResponse(KeywordBase):
    id: int
    project_id: int
    current_position: Optional[int] = None
    url_ranking: Optional[str] = None
    is_tracking: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Competitor Analysis Schemas
class CompetitorAnalysisBase(BaseModel):
    competitor_name: str
    competitor_url: str
    analysis_type: str

class CompetitorAnalysisCreate(CompetitorAnalysisBase):
    project_id: int

class CompetitorAnalysisResponse(CompetitorAnalysisBase):
    id: int
    project_id: int
    domain_authority: Optional[float] = None
    organic_keywords: Optional[int] = None
    organic_traffic: Optional[int] = None
    analysis_data: Optional[Dict] = None
    keyword_overlap_score: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# PageSpeed Data Schema
class Opportunity(BaseModel):
    title: str
    description: str
    savings_ms: float

class Diagnostic(BaseModel):
    title: str
    description: str
    score: float

class PageSpeedData(BaseModel):
    performance_score: int
    fcp: float
    lcp: float
    cls: float
    fid: float
    ttfb: float
    opportunities: List[Opportunity]
    diagnostics: List[Diagnostic]

class LighthouseCategory(BaseModel):
    score: Optional[float]
    title: str
    description: Optional[str] = None

class LighthouseData(BaseModel):
    finalUrl: str
    fetchTime: str
    categories: Dict[str, LighthouseCategory]
    configSettings: Dict
    environment: Dict
    runWarnings: Optional[List[str]] = None
    categoryGroups: Optional[Dict] = None
    auditRefs: Optional[Dict] = None

# Audit Schemas (no Search Console)
class AuditResult(BaseModel):
    url: str
    timestamp: datetime
    pagespeed_mobile: PageSpeedData
    pagespeed_desktop: PageSpeedData
    overall_score: int
    recommendations: List[str]
    lighthouse_mobile: Optional[LighthouseData] = None
    lighthouse_desktop: Optional[LighthouseData] = None

class AuditRequest(BaseModel):
    project_id: str
    audit_type: str = "full"

class AuditReportResponse(BaseModel):
    id: int
    project_id: str
    audit_type: str
    overall_score: Optional[int] = None
    mobile_performance_score: Optional[int] = None
    desktop_performance_score: Optional[int] = None
    recommendations: Optional[List[str]] = None
    created_at: datetime
    url: Optional[str] = None
    timestamp: Optional[datetime] = None
    pagespeed_data: Optional[dict] = None
    lighthouse_mobile: Optional[dict] = None
    lighthouse_desktop: Optional[dict] = None
    
    class Config:
        from_attributes = True