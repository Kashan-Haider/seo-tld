from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from db.models.Schemas import AuditRequest, AuditResult
from services.AuditService import AuditService
from db.database import get_db
import traceback

audit_service = AuditService()
router = APIRouter(prefix="/audit", tags=["audit"])

@router.post("", response_model=AuditResult)
async def create_audit(request: AuditRequest, db: Session = Depends(get_db)):
    try:
        result = await audit_service.generate_audit(request, db)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) 