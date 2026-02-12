"""
Application Context Utilities for Sync Service

This module provides utilities for managing Flask application context
for background tasks and scheduled jobs.
"""
import logging
import functools
from typing import Callable, Any

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def with_app_context(func: Callable) -> Callable:
    """
    Decorator to ensure a function runs within a Flask application context.
    
    This decorator checks if a Flask application context is already active,
    and if not, creates one for the duration of the function call.
    
    Args:
        func: The function to wrap with an application context
        
    Returns:
        A wrapped function that ensures an application context is present
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            # Import here to avoid circular imports
            from flask import has_app_context, current_app
            
            if has_app_context():
                # If we already have an app context, just run the function
                return func(*args, **kwargs)
            else:
                # Otherwise, create an app context for this function call
                from app import app
                logger.debug(f"Creating app context for {func.__name__}")
                with app.app_context():
                    return func(*args, **kwargs)
                    
        except Exception as e:
            logger.error(f"Error in app context wrapper for {func.__name__}: {str(e)}")
            # Re-raise the exception after logging
            raise
            
    return wrapper

def handle_job_exception(job_id: str, exception: Exception) -> None:
    """
    Handle exceptions that occur during job execution.
    
    This function ensures proper logging and database updates when a job fails,
    even if it fails due to context issues.
    
    Args:
        job_id: The ID of the job that encountered an exception
        exception: The exception that occurred
    """
    @with_app_context
    def _update_job_status():
        try:
            # Now we can safely use database operations
            from sync_service.models import SyncJob, SyncLog
            from app import db
            
            # Update job status
            job = SyncJob.query.filter_by(job_id=job_id).first()
            if job:
                job.status = 'error'
                job.error_details = str(exception)
                
                # Create error log
                log = SyncLog()
                log.job_id = job_id
                log.level = 'error'
                log.message = f"Job failed: {str(exception)}"
                log.details = {'traceback': str(exception)}
                db.session.add(log)
                db.session.commit()
                
            logger.error(f"Job {job_id} failed: {str(exception)}")
                
        except Exception as e:
            # Last resort error handling if even our error handler fails
            logger.critical(f"Critical error handling job exception: {str(e)}")
    
    # Execute the update with proper context
    try:
        _update_job_status()
    except Exception as e:
        logger.critical(f"Failed to handle job exception: {str(e)}")