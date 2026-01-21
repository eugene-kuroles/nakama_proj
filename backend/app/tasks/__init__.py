"""
Celery tasks module - background task processing
"""
from app.tasks.celery_app import celery
from app.tasks.sync_tasks import sync_all_projects, sync_project, process_excel_upload

__all__ = [
    "celery",
    "sync_all_projects",
    "sync_project",
    "process_excel_upload",
]
