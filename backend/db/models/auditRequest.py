from pydantic import BaseModel

class AuditRequest(BaseModel):
    project_id: str
    audit_type: str = "full"