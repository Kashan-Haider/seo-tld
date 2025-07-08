from fastapi import APIRouter, Depends, HTTPException, status, Request
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
from typing import List, Optional
from services.KeywordGenerationService import KeywordGenerationService
from services.long_tail_keyword_service import LongTailKeywordService
from db.models.Schemas import KeywordSuggestionRequest, KeywordSuggestion, KeywordSuggestionResponse, LongTailKeywordRequest, LongTailKeywordResponse, KeywordResponse, SaveKeywordRequest
from db.database import get_db
from db.models.keyword import Keyword as KeywordModel
import uuid

router = APIRouter(prefix="/keywords", tags=["keywords"])

@router.post("/long-tail", response_model=LongTailKeywordResponse)
def generate_long_tail_keywords(request: LongTailKeywordRequest):
    keywords = LongTailKeywordService.generate_long_tail_keywords(
        seed=request.seed,
        lang=request.lang or 'en',
        country=request.country or 'us'
    )
    return LongTailKeywordResponse(keywords=sorted(list(keywords)))

@router.post("/suggestions", response_model=KeywordSuggestionResponse)
def generate_keyword_suggestions(request: KeywordSuggestionRequest):
    result = KeywordGenerationService.generate_keyword_suggestions(
        seed=request.seed,
        lang=request.lang or 'en',
        country=request.country or 'us',
        top_n=request.top_n or 20
    )
    keywords = result["keywords"]
    metadata = result["metadata"]
    keyword_objs = [
        KeywordSuggestion(
            keyword=kw["keyword"],
            search_volume=kw["search_volume"],
            keyword_difficulty=kw["keyword_difficulty"],
            competitive_density=kw["competitive_density"],
            intent=kw["intent"]
        )
        for kw in keywords
    ]
    return KeywordSuggestionResponse(keywords=keyword_objs, metadata=metadata)

@router.get("/generate-advanced-stream")
async def generate_keywords_stream(seed: str, lang: str = 'en', country: str = 'us', top_n: int = 10):
    def event_generator():
        for event in KeywordGenerationService.generate_keyword_suggestions_stream(seed, lang, country, top_n):
            yield f"data: {event}\n\n"
    return EventSourceResponse(event_generator())

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

# Add import for Celery keyword task

def safe_import_generate_keyword_suggestions_task():
    try:
        from tasks.keyword_tasks import generate_keyword_suggestions_task
        return generate_keyword_suggestions_task
    except Exception as e:
        print(f"Failed to import generate_keyword_suggestions_task: {e}")
        return None

generate_keyword_suggestions_task = safe_import_generate_keyword_suggestions_task()

from endpoints.auth import get_current_user
from db.models.user import User
from fastapi import Depends

@router.post("/suggestions-async", response_model=dict)
async def queue_keyword_suggestions(
    request: KeywordSuggestionRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        if not generate_keyword_suggestions_task:
            raise HTTPException(status_code=500, detail="Celery task not available")
        task = generate_keyword_suggestions_task.delay(request.dict(), str(current_user.id))
        return {
            "message": "Keyword generation started",
            "task_id": task.id,
            "status": "PENDING"
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to start keyword generation: {str(e)}")

@router.get("/task-status/{task_id}")
async def get_keyword_task_status(task_id: str, current_user: User = Depends(get_current_user)):
    if not generate_keyword_suggestions_task:
        raise HTTPException(status_code=500, detail="Celery task not available")
    task = generate_keyword_suggestions_task.AsyncResult(task_id)
    info = task.info if isinstance(task.info, dict) else {}
    if task.state == "PENDING":
        return {
            "state": task.state,
            "status": "Task is pending...",
            "current": 0,
            "total": 6,
        }
    elif task.state == "PROGRESS":
        return {
            "state": task.state,
            "status": info.get("status", "In progress"),
            "current": info.get("current", 0),
            "total": info.get("total", 6),
            "meta": info,
        }
    elif task.state == "SUCCESS":
        return {
            "state": task.state,
            "result": info.get("result"),
            "current": info.get("current", 6),
            "total": info.get("total", 6),
        }
    elif task.state == "FAILURE":
        return {
            "state": task.state,
            "error": str(info),
        }
    else:
        return {
            "state": task.state,
            "info": info,
        } 