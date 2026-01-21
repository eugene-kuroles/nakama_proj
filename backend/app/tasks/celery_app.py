"""
Celery application configuration
"""
from celery import Celery
from celery.schedules import crontab

from app.config import settings

# Get Redis URL from settings or environment
REDIS_URL = getattr(settings, 'redis_url', 'redis://localhost:6379/0')

# Create Celery app
celery = Celery(
    'spellit',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        'app.tasks.sync_tasks',
    ]
)

# Celery configuration
celery.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task execution settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Result settings
    result_expires=3600,  # Results expire after 1 hour
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
    
    # Retry settings
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,
)

# Beat schedule for periodic tasks
celery.conf.beat_schedule = {
    'sync-all-projects-every-5-minutes': {
        'task': 'app.tasks.sync_tasks.sync_all_projects',
        'schedule': crontab(minute='*/5'),
        'options': {'queue': 'sync'},
    },
}

# Task routing
celery.conf.task_routes = {
    'app.tasks.sync_tasks.*': {'queue': 'sync'},
}
