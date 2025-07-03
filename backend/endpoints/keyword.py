from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.KeywordGenerationService import KeywordGenerationService
from services.long_tail_keyword_service import LongTailKeywordService
from db.models.Schemas import AdvancedKeywordGenerationRequest, AdvancedKeywordGenerationResponse, AdvancedKeywordObject

router = APIRouter(prefix="/keyword", tags=["keyword"])

class KeywordGenerationRequest(BaseModel):
    seed: str
    lang: Optional[str] = 'en'
    country: Optional[str] = 'us'

class KeywordGenerationResponse(BaseModel):
    keywords: List[str]

@router.get("/available-languages")
def available_languages():
    # Static list for now, can be replaced with dynamic fetch if API is enabled
    return [
        {"id": 1000, "name": "English"},
        {"id": 1003, "name": "French"},
        {"id": 1005, "name": "German"},
        {"id": 1014, "name": "Italian"},
        {"id": 1002, "name": "Spanish"},
        {"id": 1017, "name": "Japanese"},
        {"id": 1018, "name": "Korean"},
        {"id": 1020, "name": "Portuguese"},
        {"id": 1019, "name": "Polish"},
        {"id": 1021, "name": "Russian"},
    ]

@router.get("/available-locations")
def available_locations():
    # Static list for now, can be replaced with dynamic fetch if API is enabled
    return [
        {"id": 2840, "name": "United States"},
        {"id": 2036, "name": "Canada"},
        {"id": 2250, "name": "United Kingdom"},
        {"id": 1000, "name": "Argentina"},
        {"id": 2076, "name": "Australia"},
        {"id": 2004, "name": "Brazil"},
        {"id": 2124, "name": "France"},
        {"id": 2276, "name": "Germany"},
        {"id": 2384, "name": "India"},
        {"id": 2392, "name": "Italy"},
        {"id": 2128, "name": "Spain"},
        {"id": 2112, "name": "Japan"},
    ]

@router.post("/generate-long-tail-keywords", response_model=KeywordGenerationResponse)
def generate_keywords(request: KeywordGenerationRequest):
    keywords = LongTailKeywordService.generate_long_tail_keywords(
        seed=request.seed,
        lang=request.lang or 'en',
        country=request.country or 'us'
    )
    return KeywordGenerationResponse(keywords=sorted(list(keywords))) 

@router.post("/generate-advanced", response_model=AdvancedKeywordGenerationResponse)
def generate_advanced_keywords(request: AdvancedKeywordGenerationRequest):
    result = KeywordGenerationService.generate_advanced_keywords(
        seed=request.seed,
        lang=request.lang or 'en',
        country=request.country or 'us',
        top_n=request.top_n or 20
    )
    keywords = result["keywords"]
    metadata = result["metadata"]
    # Ensure output is a list of AdvancedKeywordObject with all new fields and correct types
    keyword_objs = [
        AdvancedKeywordObject(
            keyword=str(kw["keyword"]),
            search_volume=int(kw["search_volume"]),
            keyword_difficulty=int(kw["keyword_difficulty"]),
            cpc_usd=float(kw["cpc_usd"]),
            competitive_density=float(kw["competitive_density"]),
            intent=str(kw["intent"]),
            features=list(kw["features"]) if not isinstance(kw["features"], str) else [kw["features"]]
        )
        for kw in keywords
    ]
    return AdvancedKeywordGenerationResponse(keywords=keyword_objs, metadata=metadata) 