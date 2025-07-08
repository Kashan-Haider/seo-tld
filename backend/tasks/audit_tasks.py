print('Loaded audit_tasks.py')

from celery_app import celery_app
from db.database import SessionLocal
from services.AuditService import AuditService
from db.models.Schemas import AuditRequest
from db.models.project import Project
import traceback

@celery_app.task(bind=True)
def generate_audit_task(self, audit_request_dict, user_id):
    print('generate_audit_task CALLED')
    db = SessionLocal()
    try:
        self.update_state(state="PROGRESS", meta={"current": 0, "total": 100, "status": "Starting audit..."})
        request = AuditRequest(**audit_request_dict)
        audit_service = AuditService()
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            self.update_state(state="PROGRESS", meta={"current": 10, "total": 100, "status": "Fetching project info..."})
            project = db.query(Project).filter(Project.id == request.project_id).first()
            if not project:
                raise Exception("Project not found")
            categories = ["performance", "accessibility", "best-practices", "seo", "pwa"]
            self.update_state(state="PROGRESS", meta={"current": 20, "total": 100, "status": "Running mobile audit..."})
            mobile_lighthouse = loop.run_until_complete(
                audit_service.pagespeed.analyze_page(str(project.website_url), "mobile", categories=categories)
            )
            self.update_state(state="PROGRESS", meta={"current": 50, "total": 100, "status": "Running desktop audit..."})
            desktop_lighthouse = loop.run_until_complete(
                audit_service.pagespeed.analyze_page(str(project.website_url), "desktop", categories=categories)
            )
            self.update_state(state="PROGRESS", meta={"current": 70, "total": 100, "status": "Processing results..."})
            result = loop.run_until_complete(
                audit_service.generate_audit(request, db, mobile_lighthouse=mobile_lighthouse, desktop_lighthouse=desktop_lighthouse)
            )
            self.update_state(state="PROGRESS", meta={"current": 100, "total": 100, "status": "Audit complete."})
        finally:
            loop.close()
        return {"status": "SUCCESS", "result": result.dict(), "current": 100, "total": 100}
    except Exception as e:
        traceback.print_exc()
        return {"status": "FAILURE", "error": str(e)}
    finally:
        db.close() 