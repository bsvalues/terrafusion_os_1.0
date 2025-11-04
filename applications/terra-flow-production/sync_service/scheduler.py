"""
Scheduler Module for Database Project Sync Service

This module provides functionality for scheduling and managing automated
synchronization jobs for the DatabaseProjectSyncService.
"""

import datetime
import logging
import threading
import time
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from flask import current_app

from .database_project_sync import DatabaseProjectSyncService, GlobalSetting
from app import db

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None
# Lock for thread-safe operations
scheduler_lock = threading.Lock()


def initialize_scheduler(app):
    """
    Initialize the scheduler with the Flask application context.
    
    Args:
        app: Flask application instance
    """
    global scheduler
    
    with scheduler_lock:
        if scheduler is not None:
            logger.info("Scheduler already initialized")
            return
        
        logger.info("Initializing Project Sync scheduler")
        
        # Create the job store using the same database as the application
        jobstore = SQLAlchemyJobStore(url=app.config['SQLALCHEMY_DATABASE_URI'])
        
        # Create scheduler with SQLAlchemy job store
        scheduler = BackgroundScheduler(
            jobstores={'default': jobstore},
            job_defaults={
                'coalesce': True,
                'misfire_grace_time': 15*60  # 15 minutes
            }
        )
        
        # Start the scheduler
        scheduler.start()
        
        # Load existing schedules from the global settings
        _load_schedules(app)
        
        logger.info("Project Sync scheduler initialized successfully")


def _load_schedules(app):
    """
    Load and configure job schedules from global settings.
    
    Args:
        app: Flask application instance
    """
    with app.app_context():
        try:
            # Get global settings
            global_settings = GlobalSetting.query.first()
            
            if not global_settings or not global_settings.settings or 'project_sync' not in global_settings.settings:
                logger.info("No project sync settings found for scheduling")
                return
                
            settings = global_settings.settings['project_sync']
            
            # Check if scheduled sync is enabled
            if not settings.get('enable_scheduled_sync', False):
                logger.info("Scheduled sync is disabled in settings")
                return
                
            # Get schedule parameters
            schedule_type = settings.get('schedule_type', 'daily')
            schedule_time = settings.get('schedule_time', '03:00')
            schedule_day = settings.get('schedule_day')
            schedule_date = settings.get('schedule_date')
            job_name = settings.get('scheduled_job_name', 'Scheduled Project Sync')
            
            # Parse time
            hour, minute = schedule_time.split(':')
            hour, minute = int(hour), int(minute)
            
            # Build cron trigger based on schedule type
            if schedule_type == 'daily':
                trigger = CronTrigger(hour=hour, minute=minute)
                trigger_description = f"daily at {schedule_time}"
            elif schedule_type == 'weekly':
                day_of_week = int(schedule_day) if schedule_day else 0
                trigger = CronTrigger(day_of_week=day_of_week, hour=hour, minute=minute)
                days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                day_name = days[day_of_week]
                trigger_description = f"weekly on {day_name} at {schedule_time}"
            elif schedule_type == 'monthly':
                if schedule_date == 'last':
                    # Last day of month
                    trigger = CronTrigger(day='last', hour=hour, minute=minute)
                    trigger_description = f"monthly on the last day at {schedule_time}"
                else:
                    day = int(schedule_date) if schedule_date else 1
                    trigger = CronTrigger(day=day, hour=hour, minute=minute)
                    trigger_description = f"monthly on day {day} at {schedule_time}"
            else:
                logger.error(f"Unknown schedule type: {schedule_type}")
                return
                
            # Get default connections from settings
            source_connection = settings.get('default_source_connection')
            target_connection = settings.get('default_target_connection')
            
            if not source_connection or not target_connection:
                logger.error("Missing default connections for scheduled sync")
                return
                
            # Get connection strings
            if not global_settings.connection_strings:
                logger.error("No connection strings configured")
                return
                
            source_connection_string = global_settings.connection_strings.get(source_connection)
            target_connection_string = global_settings.connection_strings.get(target_connection)
            
            if not source_connection_string or not target_connection_string:
                logger.error("Could not find connection strings for scheduled sync")
                return
                
            # Add the job to the scheduler
            scheduler.add_job(
                func=_run_scheduled_sync,
                trigger=trigger,
                args=[
                    source_connection_string,
                    target_connection_string,
                    settings.get('default_conflict_strategy', 'source_wins'),
                    settings.get('schema_validation', True),
                    settings.get('auto_migration', True),
                    settings.get('default_batch_size', 1000),
                    job_name
                ],
                id='project_sync_scheduled_job',
                name=job_name,
                replace_existing=True
            )
            
            logger.info(f"Scheduled project sync job configured to run {trigger_description}")
            
        except Exception as e:
            logger.error(f"Error loading project sync schedules: {str(e)}")


def _run_scheduled_sync(source_conn_string, target_conn_string, conflict_strategy,
                       schema_validation, auto_migration, batch_size, job_name):
    """
    Function that runs the scheduled sync job.
    
    Args:
        source_conn_string: Connection string for source database
        target_conn_string: Connection string for target database
        conflict_strategy: Strategy for conflict resolution
        schema_validation: Whether to validate schema
        auto_migration: Whether to apply automatic migration
        batch_size: Batch size for processing
        job_name: Name of the job
    """
    # We need an application context
    with current_app.app_context():
        try:
            logger.info(f"Starting scheduled sync job: {job_name}")
            
            # Create sync service instance
            sync_service = DatabaseProjectSyncService(
                source_connection_string=source_conn_string,
                target_connection_string=target_conn_string,
                user_id=None,  # System job has no user
                conflict_strategy=conflict_strategy,
                schema_validation=schema_validation,
                auto_migration=auto_migration,
                batch_size=batch_size
            )
            
            # Start sync operation (non-async)
            job_id = sync_service.start_sync(async_mode=False)
            
            logger.info(f"Scheduled sync job completed. Job ID: {job_id}")
            
        except Exception as e:
            logger.error(f"Error running scheduled sync job: {str(e)}")


def update_schedule(app):
    """
    Update the scheduler with the latest settings.
    
    Args:
        app: Flask application instance
    """
    global scheduler
    
    with scheduler_lock:
        if scheduler is None:
            logger.error("Scheduler not initialized")
            return
            
        # Remove existing schedule
        try:
            scheduler.remove_job('project_sync_scheduled_job')
            logger.info("Removed existing scheduled job")
        except Exception:
            # Job might not exist yet
            pass
            
        # Load new schedule
        _load_schedules(app)


def shutdown_scheduler():
    """Shut down the scheduler."""
    global scheduler
    
    with scheduler_lock:
        if scheduler is not None:
            scheduler.shutdown()
            scheduler = None
            logger.info("Project Sync scheduler has been shut down")