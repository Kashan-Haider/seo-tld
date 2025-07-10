import os
from celery import Celery
from dotenv import load_dotenv
import urllib.parse

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "seo_agent",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks.audit_tasks", "tasks.keyword_tasks", "tasks.competitor_analysis_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=24 * 60 * 60,  # 24 hours
    task_soft_time_limit=23 * 60 * 60,  # 23 hours
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    result_expires=3600,
    task_routes={
        "tasks.audit_tasks.*": {"queue": "audit"},
        "tasks.keyword_tasks.*": {"queue": "keyword"},
        "tasks.competitor_analysis_tasks.*": {"queue": "competitor_analysis"},
    },
    task_default_queue="competitor_analysis",
) 