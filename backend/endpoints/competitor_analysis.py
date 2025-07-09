from fastapi import APIRouter, HTTPException, Depends, status, Body
from sqlalchemy.orm import Session
from db.database import get_db
from endpoints.auth import get_current_user
from db.models.user import User
from services.CompetitorAnalysisService import CompetitorAnalysisService
from pydantic import BaseModel
from typing import List
from tasks.competitor_analysis_tasks import scrape_competitor_keywords
from celery.result import AsyncResult
from tasks.competitor_analysis_tasks import analyze_content_gap_task
import logging

router = APIRouter(prefix="/competitor-analysis", tags=["competitor-analysis"])

class KeywordRequest(BaseModel):
    keywords: List[str]

@router.post("/competitors", response_model=List[str])
async def get_competitors(
    request: KeywordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        competitors = await CompetitorAnalysisService.get_duckduckgo_competitors(request.keywords)
        return competitors
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CompetitorUrlsRequest(BaseModel):
    urls: List[str]

@router.post("/keywords-for-competitors", response_model=dict)
async def keywords_for_competitors(
    request: CompetitorUrlsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        task = scrape_competitor_keywords.delay(request.urls)
        return {"task_id": task.id, "status": "PENDING"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/keywords-task-status/{task_id}", response_model=dict)
async def keywords_task_status(task_id: str):
    try:
        result = AsyncResult(task_id)
        if result.state == "PENDING":
            return {"status": "PENDING"}
        elif result.state == "SUCCESS":
            return {"status": "SUCCESS", "result": result.result}
        elif result.state == "FAILURE":
            return {"status": "FAILURE", "error": str(result.result)}
        else:
            return {"status": result.state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ContentGapRequest(BaseModel):
    user_keywords: List[str]
    competitor_keywords_dict: dict

@router.post("/content-gap-analysis", response_model=dict)
async def content_gap_analysis(
    request: ContentGapRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        task = analyze_content_gap_task.delay(request.user_keywords, request.competitor_keywords_dict)
        return {"task_id": task.id, "status": "PENDING"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/content-gap-task-status/{task_id}", response_model=dict)
async def content_gap_task_status(task_id: str):
    try:
        result = AsyncResult(task_id)
        if result.state == "PENDING":
            return {"status": "PENDING"}
        elif result.state == "SUCCESS":
            return {"status": "SUCCESS", "result": result.result}
        elif result.state == "FAILURE":
            return {"status": "FAILURE", "error": str(result.result)}
        else:
            return {"status": result.state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ExtractKeywordsRequest(BaseModel):
    url: str

@router.post("/extract-keywords", response_model=dict)
async def extract_keywords(
    request: ExtractKeywordsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        logging.info(f"Received extract-keywords request: {request}")
        keywords = await CompetitorAnalysisService.extract_keywords_from_url(request.url)
        return {"keywords": keywords}
    except Exception as e:
        logging.error(f"Error in extract-keywords: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 