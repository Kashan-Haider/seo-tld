from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from db.models.Schemas import AuditRequest, AuditResult, AuditReportResponse
from db.models.user import User
from services.AuditService import AuditService
from db.database import get_db
from endpoints.auth import get_current_user
import traceback
# Add import for Celery audit task
def safe_import_generate_audit_task():
    try:
        from tasks.audit_tasks import generate_audit_task
        return generate_audit_task
    except Exception as e:
        print(f"Failed to import generate_audit_task: {e}")
        return None

audit_service = AuditService()
router = APIRouter(prefix="/audit", tags=["audit"])

generate_audit_task = safe_import_generate_audit_task()

@router.post("", response_model=dict)
async def create_audit(
    request: AuditRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if not generate_audit_task:
            raise HTTPException(status_code=500, detail="Celery task not available")
        # Queue the audit as a background task
        task = generate_audit_task.delay(request.dict(), str(current_user.id))
        return {
            "message": "Audit generation started",
            "task_id": task.id,
            "status": "PENDING"
            # Frontend should poll /audit/task-status/{task_id} for results
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to start audit generation: {str(e)}"
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

@router.get("/by-id/{audit_id}", response_model=AuditReportResponse)
async def get_audit_by_id(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        audit = audit_service.get_audit_by_id(audit_id, db)
        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found")
        return audit
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve audit: {str(e)}"
        )

@router.delete("/{audit_id}")
async def delete_audit(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        success = audit_service.delete_audit(audit_id, db)
        if not success:
            raise HTTPException(status_code=404, detail="Audit not found")
        return {"message": f"Audit {audit_id} deleted successfully"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete audit: {str(e)}"
        )

@router.get("/task-status/{task_id}")
async def get_audit_task_status(task_id: str, current_user: User = Depends(get_current_user)):
    """
    Poll the status/result of a Celery audit task.
    """
    if not generate_audit_task:
        raise HTTPException(status_code=500, detail="Celery task not available")
    task = generate_audit_task.AsyncResult(task_id)
    info = task.info if isinstance(task.info, dict) else {}
    if task.state == "PENDING":
        return {
            "state": task.state,
            "status": "Task is pending...",
            "current": 0,
            "total": 100,
        }
    elif task.state == "PROGRESS":
        # Celery stores progress in the 'meta' dict (task.info)
        return {
            "state": task.state,
            "status": info.get("status", "In progress"),
            "current": info.get("current", 0),
            "total": info.get("total", 100),
            "meta": info,
        }
    elif task.state == "SUCCESS":
        return {
            "state": task.state,
            "result": info.get("result"),
            "current": info.get("current", 100),
            "total": info.get("total", 100),
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
