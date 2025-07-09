# models/schemas.py
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Optional, Any
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

# Competitor Analysis Schemas (new, full analysis)
class CompetitorAnalysisBase(BaseModel):
    user_url: str
    competitor_urls: List[str]
    competitor_keywords: Dict[str, List[str]]
    content_gaps: List[Any]
    recommendations: List[Any]
    analysis_type: str = "full"
    project_id: str

class CompetitorAnalysisCreate(CompetitorAnalysisBase):
    pass

class CompetitorAnalysisResponse(CompetitorAnalysisBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Keyword Schemas
class KeywordBase(BaseModel):
    id: Optional[str] = None
    keyword: str
    search_volume: Optional[str] = None
    keyword_difficulty: Optional[str] = None
    competitive_density: Optional[str] = None
    intent: Optional[str] = None
    project_id: Optional[str] = None

class KeywordCreate(KeywordBase):
    pass

class KeywordResponse(KeywordBase):
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

# Keyword Suggestion Schemas
class LongTailKeywordRequest(BaseModel):
    seed: str
    lang: Optional[str] = 'en'
    country: Optional[str] = 'us'

class LongTailKeywordResponse(BaseModel):
    keywords: List[str]

class KeywordSuggestionRequest(BaseModel):
    seed: str
    lang: Optional[str] = 'en'
    country: Optional[str] = 'us'
    top_n: Optional[int] = 20

class KeywordSuggestion(BaseModel):
    keyword: str
    search_volume: str
    keyword_difficulty: str
    competitive_density: str
    intent: str

class KeywordSuggestionResponse(BaseModel):
    keywords: List[KeywordSuggestion]
    metadata: dict

class SaveKeywordRequest(BaseModel):
    id: Optional[str] = None
    keyword: str
    search_volume: Optional[str] = None
    keyword_difficulty: Optional[str] = None
    competitive_density: Optional[str] = None
    intent: Optional[str] = None
    project_id: str