from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from services.KeywordGenerationService import KeywordGenerationService
from services.long_tail_keyword_service import LongTailKeywordService
from db.models.Schemas import AdvancedKeywordGenerationRequest, KeywordSimpleObject, AdvancedKeywordGenerationResponse
from db.database import get_db
from db.models.keyword import Keyword as KeywordModel
from db.models.Schemas import KeywordResponse
import uuid

router = APIRouter(prefix="/keyword", tags=["keyword"])

class KeywordGenerationRequest(BaseModel):
    seed: str
    lang: Optional[str] = 'en'
    country: Optional[str] = 'us'

class KeywordGenerationResponse(BaseModel):
    keywords: List[str]

class SaveKeywordRequest(BaseModel):
    id: str
    keyword: str
    search_volume: Optional[str] = None
    keyword_difficulty: Optional[str] = None
    competitive_density: Optional[str] = None
    intent: Optional[str] = None
    project_id: str

@router.get("/available-languages")
def available_languages():
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

@router.post("/generate", response_model=KeywordGenerationResponse)
def generate_keywords_simple(request: KeywordGenerationRequest):
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
    keyword_objs = [
        KeywordSimpleObject(
            keyword=kw["keyword"],
            search_volume=kw["search_volume"],
            keyword_difficulty=kw["keyword_difficulty"],
            competitive_density=kw["competitive_density"],
            intent=kw["intent"]
        )
        for kw in keywords
    ]
    return AdvancedKeywordGenerationResponse(keywords=keyword_objs, metadata=metadata)

@router.post("/save", response_model=KeywordResponse)
def save_keyword(request: SaveKeywordRequest, db=Depends(get_db)):
    # Generate a UUID for the keyword id if not provided
    keyword_id = request.id or str(uuid.uuid4())
    existing = db.query(KeywordModel).filter(KeywordModel.id == keyword_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Keyword with this id already exists.")
    # Create and save the keyword
    keyword = KeywordModel(
        id=keyword_id,
        keyword=request.keyword,
        search_volume=request.search_volume,
        keyword_difficulty=request.keyword_difficulty,
        competitive_density=request.competitive_density,
        intent=request.intent,
        project_id=request.project_id
    )
    db.add(keyword)
    db.commit()
    db.refresh(keyword)
    return keyword

@router.delete("/delete/{keyword_id}")
def delete_keyword(keyword_id: str, db=Depends(get_db)):
    keyword = db.query(KeywordModel).filter(KeywordModel.id == keyword_id).first()
    if not keyword:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found.")
    db.delete(keyword)
    db.commit()
    return {"detail": f"Keyword with id {keyword_id} deleted successfully."}

@router.get("/saved/{project_id}", response_model=List[KeywordResponse])
def get_saved_keywords(project_id: str, db=Depends(get_db)):
    keywords = db.query(KeywordModel).filter(KeywordModel.project_id == project_id).all()
    return keywords 