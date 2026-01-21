"""
Sync tasks - background tasks for data synchronization
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

from celery import shared_task
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker
from app.models.project import Project
from app.integrations.nakama.client import NakamaAPIClient
from app.integrations.nakama.sync import NakamaSyncService
from app.services.upload import UploadService

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async code in sync context."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@shared_task(
    name='app.tasks.sync_tasks.sync_all_projects',
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def sync_all_projects(self):
    """
    Synchronize all active projects with nakama.
    Runs every 5 minutes via Celery Beat.
    """
    logger.info("Starting sync_all_projects task")
    
    async def _sync_all():
        async with async_session_maker() as db:
            # Get all projects with nakama_project_id
            result = await db.execute(
                select(Project).where(
                    Project.nakama_project_id.isnot(None)
                )
            )
            projects = result.scalars().all()
            
            total_synced = 0
            total_errors = 0
            
            async with NakamaAPIClient() as client:
                for project in projects:
                    try:
                        sync_service = NakamaSyncService(client, db)
                        
                        # Sync calls from last 24 hours
                        since = datetime.utcnow() - timedelta(hours=24)
                        
                        result = await sync_service.sync_project(
                            local_project_id=project.id,
                            nakama_project_id=project.nakama_project_id,
                            since=since,
                        )
                        
                        total_synced += result.synced
                        total_errors += len(result.errors)
                        
                        logger.info(
                            f"Project {project.id}: synced={result.synced}, "
                            f"skipped={result.skipped}, errors={len(result.errors)}"
                        )
                        
                    except Exception as e:
                        logger.error(f"Error syncing project {project.id}: {e}")
                        total_errors += 1
            
            return {
                'projects_processed': len(projects),
                'total_synced': total_synced,
                'total_errors': total_errors,
            }
    
    try:
        result = run_async(_sync_all())
        logger.info(f"sync_all_projects completed: {result}")
        return result
    except Exception as exc:
        logger.error(f"sync_all_projects failed: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    name='app.tasks.sync_tasks.sync_project',
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def sync_project(self, project_id: int, since_hours: Optional[int] = None):
    """
    Synchronize a specific project with nakama.
    
    Args:
        project_id: Local project ID
        since_hours: Only sync calls from last N hours (default: all)
    """
    logger.info(f"Starting sync_project task for project {project_id}")
    
    async def _sync_project():
        async with async_session_maker() as db:
            # Get project
            result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()
            
            if not project:
                raise ValueError(f"Project {project_id} not found")
            
            if not project.nakama_project_id:
                raise ValueError(f"Project {project_id} has no nakama_project_id")
            
            async with NakamaAPIClient() as client:
                sync_service = NakamaSyncService(client, db)
                
                since = None
                if since_hours:
                    since = datetime.utcnow() - timedelta(hours=since_hours)
                
                result = await sync_service.sync_project(
                    local_project_id=project.id,
                    nakama_project_id=project.nakama_project_id,
                    since=since,
                )
                
                return {
                    'project_id': project_id,
                    'synced': result.synced,
                    'skipped': result.skipped,
                    'errors': len(result.errors),
                    'error_details': [
                        {'item_set_id': e.item_set_id, 'error': e.error}
                        for e in result.errors
                    ],
                }
    
    try:
        result = run_async(_sync_project())
        logger.info(f"sync_project {project_id} completed: {result}")
        return result
    except Exception as exc:
        logger.error(f"sync_project {project_id} failed: {exc}")
        raise self.retry(exc=exc)


@shared_task(
    name='app.tasks.sync_tasks.process_excel_upload',
    bind=True,
    max_retries=2,
    default_retry_delay=30,
)
def process_excel_upload(self, file_path: str, project_id: int):
    """
    Process an uploaded Excel file.
    
    Args:
        file_path: Path to uploaded Excel file
        project_id: Project ID to import data into
    """
    logger.info(f"Starting process_excel_upload for {file_path}, project {project_id}")
    
    async def _process_upload():
        async with async_session_maker() as db:
            upload_service = UploadService(db)
            
            result = await upload_service.process_file(
                file_path=file_path,
                project_id=project_id,
            )
            
            return {
                'project_id': project_id,
                'file_path': file_path,
                'criteria_count': result.criteria_count,
                'calls_count': result.calls_count,
                'success': result.success,
                'errors': result.errors,
            }
    
    try:
        result = run_async(_process_upload())
        logger.info(f"process_excel_upload completed: {result}")
        return result
    except Exception as exc:
        logger.error(f"process_excel_upload failed: {exc}")
        raise self.retry(exc=exc)
