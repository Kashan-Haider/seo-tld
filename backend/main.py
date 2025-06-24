# main.py
from fastapi import FastAPI
from db.database import engine, Base
from contextlib import asynccontextmanager
import db.models
from endpoints.project import router as project_router
from endpoints.audit import router as audit_router
from endpoints.user import router as user_router
from endpoints.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="SEO Audit API", version="1.0.0", lifespan=lifespan)
app.include_router(project_router)
app.include_router(audit_router)
app.include_router(user_router)
app.include_router(auth_router)