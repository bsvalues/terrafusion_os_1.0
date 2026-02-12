"""
ETL monitoring and metrics collection module.

This module provides utilities for tracking ETL job performance,
collecting metrics, and generating reports.
"""

import logging
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union

from app import db
from models import SystemMetric

# Configure logger
logger = logging.getLogger(__name__)

class ETLMetricsCollector:
    """Utility for collecting ETL job metrics."""
    
    @staticmethod
    def record_job_execution(
        job_id: str,
        plugin_name: str,
        status: str,
        start_time: datetime,
        end_time: Optional[datetime] = None,
        records_processed: int = 0,
        error: Optional[str] = None
    ) -> None:
        """
        Record ETL job execution metrics.
        
        Args:
            job_id (str): The ID of the ETL job
            plugin_name (str): Name of the ETL plugin
            status (str): Execution status ('success', 'error', 'running')
            start_time (datetime): When the job started
            end_time (datetime, optional): When the job ended
            records_processed (int): Number of records processed
            error (str, optional): Error message if status is 'error'
        """
        try:
            # Calculate duration
            duration = (end_time - start_time).total_seconds() if end_time else None
            
            # Record execution time metric
            if duration is not None:
                SystemMetric(
                    metric_name=f"etl_job_execution_time",
                    metric_value=duration,
                    metric_unit="seconds",
                    category="performance",
                    component=f"etl.{plugin_name}"
                ).save()
            
            # Record records processed metric
            if records_processed > 0:
                SystemMetric(
                    metric_name=f"etl_records_processed",
                    metric_value=records_processed,
                    metric_unit="records",
                    category="usage",
                    component=f"etl.{plugin_name}"
                ).save()
            
            # Record job status metric
            status_value = 1 if status == 'success' else 0
            SystemMetric(
                metric_name=f"etl_job_success",
                metric_value=status_value,
                metric_unit="boolean",
                category="reliability",
                component=f"etl.{plugin_name}"
            ).save()
            
            # Record error if applicable
            if error:
                SystemMetric(
                    metric_name=f"etl_job_error",
                    metric_value=1,
                    metric_unit="count",
                    category="errors",
                    component=f"etl.{plugin_name}",
                    metadata=json.dumps({"error": error, "job_id": job_id})
                ).save()
            
            logger.debug(f"Recorded metrics for ETL job {job_id}")
            
        except Exception as e:
            logger.exception(f"Error recording ETL metrics: {str(e)}")
    
    @staticmethod
    def get_job_metrics(
        plugin_name: Optional[str] = None,
        time_range: Optional[int] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get ETL job metrics.
        
        Args:
            plugin_name (str, optional): Filter by ETL plugin name
            time_range (int, optional): Time range in hours
            limit (int): Maximum number of records to return
            
        Returns:
            List[Dict[str, Any]]: List of ETL job metrics
        """
        try:
            query = SystemMetric.query.filter(
                SystemMetric.category.in_(['performance', 'usage', 'reliability', 'errors']),
                SystemMetric.component.like('etl.%')
            )
            
            if plugin_name:
                query = query.filter(SystemMetric.component == f"etl.{plugin_name}")
            
            if time_range:
                start_time = datetime.now() - timedelta(hours=time_range)
                query = query.filter(SystemMetric.timestamp >= start_time)
            
            query = query.order_by(SystemMetric.timestamp.desc()).limit(limit)
            
            return [metric.to_dict() for metric in query.all()]
            
        except Exception as e:
            logger.exception(f"Error getting ETL metrics: {str(e)}")
            return []
    
    @staticmethod
    def get_plugin_performance_summary(
        time_range: Optional[int] = 24
    ) -> List[Dict[str, Any]]:
        """
        Get performance summary for each ETL plugin.
        
        Args:
            time_range (int, optional): Time range in hours
            
        Returns:
            List[Dict[str, Any]]: List of plugin performance summaries
        """
        try:
            from sqlalchemy import func, desc
            
            # Calculate time range
            start_time = datetime.now() - timedelta(hours=time_range)
            
            # Get all plugin names
            component_query = db.session.query(
                SystemMetric.component
            ).filter(
                SystemMetric.component.like('etl.%'),
                SystemMetric.timestamp >= start_time
            ).distinct()
            
            components = [c[0] for c in component_query.all()]
            
            results = []
            for component in components:
                plugin_name = component.split('.')[1] if '.' in component else component
                
                # Get average execution time
                avg_time_query = db.session.query(
                    func.avg(SystemMetric.metric_value).label('avg_value')
                ).filter(
                    SystemMetric.component == component,
                    SystemMetric.metric_name == 'etl_job_execution_time',
                    SystemMetric.timestamp >= start_time
                )
                avg_time = avg_time_query.scalar() or 0
                
                # Get success rate
                success_count = db.session.query(
                    func.count(SystemMetric.id)
                ).filter(
                    SystemMetric.component == component,
                    SystemMetric.metric_name == 'etl_job_success',
                    SystemMetric.metric_value == 1,
                    SystemMetric.timestamp >= start_time
                ).scalar() or 0
                
                total_count = db.session.query(
                    func.count(SystemMetric.id)
                ).filter(
                    SystemMetric.component == component,
                    SystemMetric.metric_name == 'etl_job_success',
                    SystemMetric.timestamp >= start_time
                ).scalar() or 0
                
                success_rate = (success_count / total_count * 100) if total_count > 0 else 0
                
                # Get total records processed
                records_query = db.session.query(
                    func.sum(SystemMetric.metric_value).label('total_records')
                ).filter(
                    SystemMetric.component == component,
                    SystemMetric.metric_name == 'etl_records_processed',
                    SystemMetric.timestamp >= start_time
                )
                total_records = records_query.scalar() or 0
                
                # Get error count
                error_count = db.session.query(
                    func.count(SystemMetric.id)
                ).filter(
                    SystemMetric.component == component,
                    SystemMetric.metric_name == 'etl_job_error',
                    SystemMetric.timestamp >= start_time
                ).scalar() or 0
                
                # Add to results
                results.append({
                    'plugin_name': plugin_name,
                    'component': component,
                    'avg_execution_time': round(avg_time, 2),
                    'success_rate': round(success_rate, 2),
                    'total_records_processed': int(total_records),
                    'error_count': error_count,
                    'job_count': total_count
                })
            
            # Sort by job count (most active plugins first)
            results.sort(key=lambda x: x['job_count'], reverse=True)
            
            return results
            
        except Exception as e:
            logger.exception(f"Error getting plugin performance summary: {str(e)}")
            return []
    
    @staticmethod
    def monitor_etl_job(func):
        """
        Decorator for monitoring ETL job execution.
        
        Example usage:
            @ETLMetricsCollector.monitor_etl_job
            def run_etl_job(plugin_name, config=None):
                # Job implementation
                return result
        """
        import functools
        
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            job_id = kwargs.get('job_id', f"job_{datetime.now().timestamp()}")
            plugin_name = kwargs.get('plugin_name', 'unknown')
            
            start_time = datetime.now()
            error = None
            records_processed = 0
            
            try:
                # Run the job
                result = func(*args, **kwargs)
                
                # Extract metrics from result
                if result and isinstance(result, dict):
                    status = 'success' if result.get('success', False) else 'error'
                    records_processed = result.get('records_processed', 0)
                    error = result.get('error')
                else:
                    status = 'success'
                
                return result
                
            except Exception as e:
                status = 'error'
                error = str(e)
                raise
                
            finally:
                # Record metrics
                end_time = datetime.now()
                ETLMetricsCollector.record_job_execution(
                    job_id=job_id,
                    plugin_name=plugin_name,
                    status=status,
                    start_time=start_time,
                    end_time=end_time,
                    records_processed=records_processed,
                    error=error
                )
        
        return wrapper