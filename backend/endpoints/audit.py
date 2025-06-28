from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from db.models.Schemas import AuditRequest, AuditResult, AuditReportResponse
from db.models.user import User
from services.AuditService import AuditService
from db.database import get_db
from endpoints.auth import get_current_user
import traceback

audit_service = AuditService()
router = APIRouter(prefix="/audit", tags=["audit"])

@router.post("", response_model=AuditResult)
async def create_audit(
    request: AuditRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await audit_service.generate_audit(request, db)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Audit generation failed: {str(e)}"
        )

@router.get("/user-audits")
async def get_user_audits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return {
            "message": "User audits endpoint - implementation pending",
            "user_id": current_user.id,
            "audits": []
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user audits: {str(e)}"
        )

@router.get("/project/{project_id}", response_model=list[AuditReportResponse])
async def get_project_audits(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        audits = audit_service.get_audit_history(project_id, db)
        return audits
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve project audits: {str(e)}"
        )

@router.get("/get-latest-audit/{project_id}", response_model=AuditReportResponse)
async def get_latest_audit(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        audits = audit_service.get_audit_history(project_id, db)
        if not audits:
            raise HTTPException(status_code=404, detail="No audits found for this project")
        return audits[0]  # audits are ordered by created_at desc
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve latest audit: {str(e)}"
        )

@router.get("/get-all-audits/{project_id}", response_model=list[AuditReportResponse])
async def get_all_audits(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        audits = audit_service.get_audit_history(project_id, db)
        return audits
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve all audits: {str(e)}"
        )
