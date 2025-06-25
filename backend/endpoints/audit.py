from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from db.models.Schemas import AuditRequest, AuditResult, AuditReportResponse
from db.models.user import User
from services.AuditService import AuditService
from db.database import get_db
from endpoints.auth import get_current_user
import traceback
from db.models.auditReport import AuditReport

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
        # Store audit in DB
        audit_report = AuditReport(
            project_id=request.project_id,
            audit_type=request.audit_type,
            mobile_performance_score=result.pagespeed_mobile.performance_score,
            desktop_performance_score=result.pagespeed_desktop.performance_score,
            mobile_fcp=result.pagespeed_mobile.fcp,
            mobile_lcp=result.pagespeed_mobile.lcp,
            mobile_cls=result.pagespeed_mobile.cls,
            desktop_fcp=result.pagespeed_desktop.fcp,
            desktop_lcp=result.pagespeed_desktop.lcp,
            desktop_cls=result.pagespeed_desktop.cls,
            overall_score=result.overall_score,
            pagespeed_data={
                "mobile": result.pagespeed_mobile.dict(),
                "desktop": result.pagespeed_desktop.dict()
            },
            recommendations=result.recommendations,
            lighthouse_mobile=result.lighthouse_mobile.dict() if result.lighthouse_mobile else None,
            lighthouse_desktop=result.lighthouse_desktop.dict() if result.lighthouse_desktop else None,
            audit_date_start=result.timestamp,
            audit_date_end=result.timestamp
        )
        db.add(audit_report)
        db.commit()
        db.refresh(audit_report)
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
