from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.models import Project
from db.database import get_db
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/project", tags=["project"])

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    website_url: str
    owner_id: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    owner_id: Optional[str] = None

@router.post("/create-project")
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    db_project = Project(
        name=project.name,
        description=project.description,
        website_url=project.website_url,
        owner_id=project.owner_id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return {
        "id": db_project.id,
        "name": db_project.name,
        "description": db_project.description,
        "website_url": db_project.website_url,
        "owner_id": db_project.owner_id,
        "created_at": db_project.created_at,
        "updated_at": db_project.updated_at
    }

@router.put("/update-project/{project_id}")
def update_project(project_id: str, project_update: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in project_update.dict(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "website_url": project.website_url,
        "owner_id": project.owner_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at
    }

@router.get("/get-project/{project_id}")
def get_project_by_id(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "website_url": project.website_url,
        "owner_id": project.owner_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at
    }

@router.delete("/delete-project/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"detail": f"Project with id {project_id} deleted successfully."}

@router.get("/all-projects")
def get_all_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return [
        {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "website_url": project.website_url,
            "owner_id": project.owner_id,
            "created_at": project.created_at,
            "updated_at": project.updated_at
        }
        for project in projects
    ] 