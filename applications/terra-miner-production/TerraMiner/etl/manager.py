"""
ETL job manager for coordinating ETL processes within the application.

This module provides functionality to schedule and execute ETL jobs,
track their status, and integrate with the application's monitoring system.
"""

# Import SQL Alchemy utilities for database operations
from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
import logging
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Callable

from etl.__main__ import discover_plugins, create_plugin_instance, get_plugin_by_name

# Configure logger
logger = logging.getLogger(__name__)

class JobStatus:
    """Constants for job status values."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class ETLJobManager:
    """
    Manager for ETL job execution, scheduling, and status tracking.
    """
    
    def __init__(self):
        """Initialize the ETL manager."""
        self.active_jobs = {}
        self.job_history = []
        self.lock = threading.Lock()
        
    def start_job(self, 
                 plugin_name: str, 
                 config: Optional[Dict[str, Any]] = None,
                 async_execution: bool = True,
                 callback: Optional[Callable[[Dict[str, Any]], None]] = None,
                 scheduled_id: Optional[int] = None) -> str:
        """
        Start an ETL job.
        
        Args:
            plugin_name (str): Name of the ETL plugin to run
            config (Dict[str, Any], optional): Configuration for the ETL plugin
            async_execution (bool): Whether to run the job asynchronously
            callback (Callable, optional): Function to call with results when job completes
            scheduled_id (int, optional): ID of the scheduled job that triggered this execution
            
        Returns:
            str: A job ID that can be used to check job status
        """
        if async_execution:
            return self.run_job(plugin_name, config, callback, scheduled_id)
        else:
            # Run synchronously
            job_id = f"{plugin_name}_{int(time.time())}"
            
            try:
                # Create and run the ETL plugin
                plugin = create_plugin_instance(plugin_name, config)
                result = plugin.run()
                
                # Create job record and add to history
                job_record = {
                    "id": job_id,
                    "plugin_name": plugin_name,
                    "config": config or {},
                    "status": JobStatus.COMPLETED,
                    "start_time": datetime.now(),
                    "end_time": datetime.now(),
                    "result": result,
                    "error": None,
                    "scheduled_id": scheduled_id
                }
                
                with self.lock:
                    self.job_history.append(job_record)
                
                logger.info(f"ETL job {job_id} completed successfully (synchronous)")
                
                # Call callback if provided
                if callback:
                    try:
                        callback(result)
                    except Exception as e:
                        logger.error(f"Error in ETL job callback: {str(e)}")
                
                return job_id
                
            except Exception as e:
                logger.exception(f"Error running ETL job {job_id} (synchronous): {str(e)}")
                
                # Create failed job record and add to history
                job_record = {
                    "id": job_id,
                    "plugin_name": plugin_name,
                    "config": config or {},
                    "status": JobStatus.FAILED,
                    "start_time": datetime.now(),
                    "end_time": datetime.now(),
                    "result": None,
                    "error": str(e),
                    "scheduled_id": scheduled_id
                }
                
                with self.lock:
                    self.job_history.append(job_record)
                
                # Call callback if provided
                if callback:
                    try:
                        callback({"success": False, "error": str(e)})
                    except Exception as callback_error:
                        logger.error(f"Error in ETL job callback: {str(callback_error)}")
                
                return job_id
        
    def run_job(self, 
               plugin_name: str, 
               config: Optional[Dict[str, Any]] = None,
               callback: Optional[Callable[[Dict[str, Any]], None]] = None,
               scheduled_id: Optional[int] = None) -> str:
        """
        Run an ETL job asynchronously.
        
        Args:
            plugin_name (str): Name of the ETL plugin to run
            config (Dict[str, Any], optional): Configuration for the ETL plugin
            callback (Callable, optional): Function to call with results when job completes
            
        Returns:
            str: A job ID that can be used to check job status
        """
        job_id = f"{plugin_name}_{int(time.time())}"
        
        # Create job record
        job_record = {
            "id": job_id,
            "plugin_name": plugin_name,
            "config": config or {},
            "status": JobStatus.PENDING,
            "start_time": None,
            "end_time": None,
            "result": None,
            "error": None
        }
        
        # Add to active jobs
        with self.lock:
            self.active_jobs[job_id] = job_record
        
        # Start job in a separate thread
        thread = threading.Thread(
            target=self._run_job_thread,
            args=(job_id, plugin_name, config, callback),
            daemon=True
        )
        thread.start()
        
        return job_id
    
    def _run_job_thread(self, 
                       job_id: str, 
                       plugin_name: str, 
                       config: Optional[Dict[str, Any]], 
                       callback: Optional[Callable]):
        """
        Thread function to execute an ETL job.
        
        Args:
            job_id (str): The ID of the job
            plugin_name (str): Name of the ETL plugin to run
            config (Dict[str, Any], optional): Configuration for the ETL plugin
            callback (Callable, optional): Function to call with results when job completes
        """
        try:
            # Update job status to running
            with self.lock:
                self.active_jobs[job_id]["status"] = JobStatus.RUNNING
                self.active_jobs[job_id]["start_time"] = datetime.now()
            
            # Create and run the ETL plugin
            plugin = create_plugin_instance(plugin_name, config)
            result = plugin.run()
            
            # Update job record with results
            with self.lock:
                self.active_jobs[job_id]["status"] = JobStatus.COMPLETED
                self.active_jobs[job_id]["end_time"] = datetime.now()
                self.active_jobs[job_id]["result"] = result
                
                # Add to history and remove from active jobs
                self.job_history.append(self.active_jobs[job_id])
                
            logger.info(f"ETL job {job_id} completed successfully")
            
            # Call callback if provided
            if callback:
                try:
                    callback(result)
                except Exception as e:
                    logger.error(f"Error in ETL job callback: {str(e)}")
                
        except Exception as e:
            logger.exception(f"Error running ETL job {job_id}: {str(e)}")
            
            # Update job record with error
            with self.lock:
                self.active_jobs[job_id]["status"] = JobStatus.FAILED
                self.active_jobs[job_id]["end_time"] = datetime.now()
                self.active_jobs[job_id]["error"] = str(e)
                
                # Add to history
                self.job_history.append(self.active_jobs[job_id])
                
            # Call callback if provided
            if callback:
                try:
                    callback({"success": False, "error": str(e)})
                except Exception as callback_error:
                    logger.error(f"Error in ETL job callback: {str(callback_error)}")
        finally:
            # Remove from active jobs
            with self.lock:
                if job_id in self.active_jobs:
                    del self.active_jobs[job_id]
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get the status of a job by ID.
        
        Args:
            job_id (str): The ID of the job
            
        Returns:
            Dict[str, Any]: Job status record
            
        Raises:
            ValueError: If no job with the specified ID is found
        """
        # Check active jobs
        with self.lock:
            if job_id in self.active_jobs:
                return self.active_jobs[job_id]
            
            # Check job history
            for job in self.job_history:
                if job["id"] == job_id:
                    return job
        
        raise ValueError(f"No ETL job found with ID: {job_id}")
    
    def get_active_jobs(self) -> List[Dict[str, Any]]:
        """
        Get a list of all active jobs.
        
        Returns:
            List[Dict[str, Any]]: List of active job records
        """
        with self.lock:
            return list(self.active_jobs.values())
    
    def get_job_history(self, 
                      limit: int = 100, 
                      plugin_name: Optional[str] = None, 
                      status: Optional[str] = None,
                      since: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Get job history with optional filtering.
        
        Args:
            limit (int, optional): Maximum number of records to return
            plugin_name (str, optional): Filter by ETL plugin name
            status (str, optional): Filter by job status
            since (datetime, optional): Filter to jobs since this datetime
            
        Returns:
            List[Dict[str, Any]]: List of job history records matching the filters
        """
        with self.lock:
            # Apply filters
            filtered_history = self.job_history.copy()
            
            if plugin_name:
                filtered_history = [j for j in filtered_history if j["plugin_name"] == plugin_name]
                
            if status:
                filtered_history = [j for j in filtered_history if j["status"] == status]
                
            if since:
                filtered_history = [j for j in filtered_history if j["start_time"] and j["start_time"] >= since]
            
            # Sort by start time (most recent first) and apply limit
            sorted_history = sorted(
                filtered_history,
                key=lambda j: j["start_time"] if j["start_time"] else datetime.min,
                reverse=True
            )
            
            return sorted_history[:limit]
    
    def get_available_plugins(self) -> List[Dict[str, Any]]:
        """
        Get information about all available ETL plugins.
        
        Returns:
            List[Dict[str, Any]]: List of plugin information dictionaries
        """
        plugins = discover_plugins()
        plugin_info = []
        
        for plugin_class in plugins:
            info = {
                "name": plugin_class.__name__,
                "description": plugin_class.__doc__ or "No description available",
                "module": plugin_class.__module__
            }
            plugin_info.append(info)
            
        return plugin_info
    
    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a running job.
        
        Args:
            job_id (str): The ID of the job to cancel
            
        Returns:
            bool: True if job was found and canceled, False otherwise
            
        Note:
            This only marks the job as failed, it does not actually
            stop the thread execution. The ETL plugin should check
            for cancellation signals if long-running operations are involved.
        """
        with self.lock:
            if job_id in self.active_jobs:
                self.active_jobs[job_id]["status"] = JobStatus.FAILED
                self.active_jobs[job_id]["end_time"] = datetime.now()
                self.active_jobs[job_id]["error"] = "Job canceled by user"
                
                # Add to history
                self.job_history.append(self.active_jobs[job_id])
                
                # Remove from active jobs
                del self.active_jobs[job_id]
                
                logger.info(f"ETL job {job_id} canceled")
                return True
        
        return False

# Create a singleton instance of the ETL job manager
etl_manager = ETLJobManager()