"""
ETL job scheduler module.

This module handles the scheduling and execution of ETL jobs
according to their defined schedules.
"""

import logging
import threading
import time
from datetime import datetime, timedelta

from app import db
from etl.manager import etl_manager
from models import ETLSchedule

logger = logging.getLogger(__name__)

class ETLScheduler:
    """
    ETL job scheduler.
    
    This class manages the scheduling and execution of ETL jobs
    according to their defined schedules in the database.
    """
    
    def __init__(self, check_interval=60):
        """
        Initialize the ETL scheduler.
        
        Args:
            check_interval (int): Interval in seconds to check for jobs to run
        """
        self.check_interval = check_interval
        self.running = False
        self.thread = None
        self.job_manager = etl_manager
        logger.info("ETL Scheduler initialized")
    
    def start(self):
        """Start the scheduler."""
        if self.running:
            logger.warning("Scheduler is already running")
            return
        
        logger.info("Starting ETL Scheduler")
        self.running = True
        self.thread = threading.Thread(target=self._scheduler_loop)
        self.thread.daemon = True
        self.thread.start()
    
    def stop(self):
        """Stop the scheduler."""
        if not self.running:
            logger.warning("Scheduler is not running")
            return
        
        logger.info("Stopping ETL Scheduler")
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=self.check_interval + 5)
    
    def _scheduler_loop(self):
        """Main scheduler loop."""
        logger.info("Scheduler loop started")
        
        # Import Flask app to get the application context
        from app import app
        
        while self.running:
            try:
                # Run within Flask application context
                with app.app_context():
                    self._run_due_jobs()
            except Exception as e:
                logger.exception(f"Error in scheduler loop: {str(e)}")
            
            # Sleep for the check interval
            time.sleep(self.check_interval)
    
    def _run_due_jobs(self):
        """Find and run jobs that are due to be executed."""
        now = datetime.now()
        logger.debug(f"Checking for due jobs at {now}")
        
        # Find jobs that are:
        # 1. Enabled
        # 2. Have a next_run time that is in the past
        due_jobs = ETLSchedule.query.filter(
            ETLSchedule.enabled == True,
            ETLSchedule.next_run <= now
        ).all()
        
        if due_jobs:
            logger.info(f"Found {len(due_jobs)} jobs due for execution")
            
            for job in due_jobs:
                try:
                    self._execute_job(job)
                except Exception as e:
                    logger.exception(f"Error executing scheduled job {job.id}: {str(e)}")
                    
                    # Update job status even if it failed
                    job.last_run = now
                    job.last_status = 'error'
                    job.last_error = str(e)
                    job.next_run = job.calculate_next_run_time()
                    db.session.commit()
        else:
            logger.debug("No jobs due for execution")
    
    def _execute_job(self, job):
        """
        Execute a scheduled job.
        
        Args:
            job (ETLSchedule): The job to execute
        """
        now = datetime.now()
        logger.info(f"Executing scheduled job: {job.name} (ID: {job.id})")
        
        # Update job status to running
        job.last_run = now
        job.last_status = 'running'
        job.last_error = None
        db.session.commit()
        
        try:
            # Start the job asynchronously
            job_id = self.job_manager.start_job(
                plugin_name=job.plugin_name,
                config=job.config or {},
                async_execution=True,
                scheduled_id=job.id
            )
            
            logger.info(f"Started job {job_id} for scheduled job {job.id}")
            
            # The status will be updated by the ETL job manager when the job completes
            # For now, just update the next run time
            job.next_run = job.calculate_next_run_time()
            db.session.commit()
            
        except Exception as e:
            logger.exception(f"Error starting job for scheduled job {job.id}: {str(e)}")
            job.last_status = 'error'
            job.last_error = str(e)
            job.next_run = job.calculate_next_run_time()
            db.session.commit()
            raise

# Global scheduler instance
scheduler = ETLScheduler()

def start_scheduler():
    """Start the global ETL scheduler."""
    scheduler.start()

def stop_scheduler():
    """Stop the global ETL scheduler."""
    scheduler.stop()

def update_job_status(job_id, status, error=None):
    """
    Update the status of a scheduled job.
    
    Args:
        job_id (int): The ID of the scheduled job
        status (str): The new status ('success', 'error', 'running')
        error (str, optional): Error message if status is 'error'
    """
    job = ETLSchedule.query.get(job_id)
    if job:
        job.last_status = status
        job.last_error = error
        db.session.commit()
        logger.info(f"Updated scheduled job {job_id} status to {status}")
    else:
        logger.warning(f"Could not find scheduled job with ID {job_id} to update status")