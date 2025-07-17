# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from db.database import engine, Base
from contextlib import asynccontextmanager
import db.models
from endpoints.project import router as project_router
from endpoints.audit import router as audit_router
from endpoints.user import router as user_router
from endpoints.auth import router as auth_router
from endpoints.keyword import router as keyword_router
from endpoints.competitor_analysis import router as competitor_analysis_router
from dotenv import load_dotenv
import os
import tasks.competitor_analysis_tasks

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="SEO Audit API", version="1.0.0", lifespan=lifespan)

# Add Session middleware for OAuth support
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("JWT_SECRET_KEY", "your-secret-key-here-change-in-production")  # Change this in production
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(project_router)
app.include_router(audit_router)
app.include_router(user_router)
app.include_router(auth_router)
app.include_router(keyword_router)
app.include_router(competitor_analysis_router)