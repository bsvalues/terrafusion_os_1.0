import os
import logging
import time
import threading
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Union, Callable
import pandas as pd
import numpy as np
import queue

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('sync_service')

class BatchConfiguration:
    """Configuration for synchronization batch processing."""
    
    def __init__(
        self,
        initial_size: int = 50,
        min_size: int = 10,
        max_size: int = 500,
        increment_factor: float = 1.2,
        decrement_factor: float = 0.8,
        cpu_threshold: float = 80.0,
        memory_threshold: float = 80.0,
        target_latency: float = 0.5
    ):
        """
        Initialize batch configuration parameters.
        
        Args:
            initial_size: Initial batch size
            min_size: Minimum allowed batch size
            max_size: Maximum allowed batch size
            increment_factor: Factor to increase batch size by
            decrement_factor: Factor to decrease batch size by
            cpu_threshold: CPU usage threshold (percentage)
            memory_threshold: Memory usage threshold (percentage)
            target_latency: Target latency for batch processing (seconds)
        """
        self.initial_size = initial_size
        self.min_size = min_size
        self.max_size = max_size
        self.increment_factor = increment_factor
        self.decrement_factor = decrement_factor
        self.cpu_threshold = cpu_threshold
        self.memory_threshold = memory_threshold
        self.target_latency = target_latency

class SyncMetrics:
    """Class for tracking synchronization metrics."""
    
    def __init__(self):
        """Initialize sync metrics."""
        self.reset()
    
    def reset(self):
        """Reset all metrics."""
        self.start_time = time.time()
        self.end_time = None
        self.total_items = 0
        self.successful_items = 0
        self.failed_items = 0
        self.skipped_items = 0
        self.batch_counts = []
        self.batch_times = []
        self.errors = []
        self.current_batch_size = 0
        self.cpu_usage = []
        self.memory_usage = []
        self.network_usage = []
        self.disk_usage = []
    
    def record_batch(self, size: int, duration: float):
        """
        Record batch processing metrics.
        
        Args:
            size: Batch size
            duration: Processing duration in seconds
        """
        self.batch_counts.append(size)
        self.batch_times.append(duration)
        self.current_batch_size = size
    
    def record_result(self, success_count: int, fail_count: int, skip_count: int):
        """
        Record processing results.
        
        Args:
            success_count: Number of successful items
            fail_count: Number of failed items
            skip_count: Number of skipped items
        """
        self.total_items += success_count + fail_count + skip_count
        self.successful_items += success_count
        self.failed_items += fail_count
        self.skipped_items += skip_count
    
    def record_error(self, error: str):
        """
        Record an error.
        
        Args:
            error: Error message
        """
        self.errors.append(error)
    
    def record_system_metrics(self, cpu: float, memory: float, network: float, disk: float):
        """
        Record system resource metrics.
        
        Args:
            cpu: CPU usage percentage
            memory: Memory usage percentage
            network: Network usage (MB/s)
            disk: Disk usage percentage
        """
        self.cpu_usage.append(cpu)
        self.memory_usage.append(memory)
        self.network_usage.append(network)
        self.disk_usage.append(disk)
    
    def complete(self):
        """Mark metrics collection as complete."""
        self.end_time = time.time()
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get all collected metrics.
        
        Returns:
            Dictionary of metrics
        """
        duration = (self.end_time or time.time()) - self.start_time
        
        avg_batch_time = sum(self.batch_times) / len(self.batch_times) if self.batch_times else 0
        avg_batch_size = sum(self.batch_counts) / len(self.batch_counts) if self.batch_counts else 0
        
        throughput = self.successful_items / duration if duration > 0 else 0
        error_rate = self.failed_items / self.total_items if self.total_items > 0 else 0
        
        avg_cpu = sum(self.cpu_usage) / len(self.cpu_usage) if self.cpu_usage else 0
        avg_memory = sum(self.memory_usage) / len(self.memory_usage) if self.memory_usage else 0
        
        return {
            "duration_seconds": duration,
            "total_items": self.total_items,
            "successful_items": self.successful_items,
            "failed_items": self.failed_items,
            "skipped_items": self.skipped_items,
            "throughput_items_per_second": throughput,
            "error_rate": error_rate,
            "avg_batch_size": avg_batch_size,
            "avg_batch_time_seconds": avg_batch_time,
            "current_batch_size": self.current_batch_size,
            "avg_cpu_usage": avg_cpu,
            "avg_memory_usage": avg_memory,
            "error_count": len(self.errors),
            "recent_errors": self.errors[-5:] if self.errors else []
        }
    
    def get_time_series_data(self) -> Dict[str, List[Any]]:
        """
        Get time series data for metrics visualization.
        
        Returns:
            Dictionary of time series data
        """
        timestamps = [self.start_time + i * 5 for i in range(len(self.cpu_usage))]
        
        return {
            "timestamps": timestamps,
            "cpu_usage": self.cpu_usage,
            "memory_usage": self.memory_usage,
            "network_usage": self.network_usage,
            "disk_usage": self.disk_usage,
            "batch_sizes": self.batch_counts,
            "batch_times": self.batch_times
        }

class PerformanceOptimizer:
    """Optimizer for sync performance based on system metrics."""
    
    def __init__(self, batch_config: BatchConfiguration):
        """
        Initialize performance optimizer.
        
        Args:
            batch_config: Batch configuration parameters
        """
        self.batch_config = batch_config
        self.current_batch_size = batch_config.initial_size
    
    def adjust_batch_size(self, resource_metrics: Dict[str, Any], latency: float) -> int:
        """
        Adjust batch size based on system metrics.
        
        Args:
            resource_metrics: Dictionary of resource metrics
            latency: Current batch processing latency
        
        Returns:
            New batch size
        """
        cpu_usage = resource_metrics.get("cpu", 0)
        memory_usage = resource_metrics.get("memory", 0)
        
        # Decrease batch size if resources are constrained
        if cpu_usage > self.batch_config.cpu_threshold or memory_usage > self.batch_config.memory_threshold:
            new_size = max(
                int(self.current_batch_size * self.batch_config.decrement_factor),
                self.batch_config.min_size
            )
            logger.info(f"Decreasing batch size to {new_size} due to resource constraints")
            self.current_batch_size = new_size
            return new_size
        
        # Adjust based on latency
        if latency > self.batch_config.target_latency * 1.5:
            # Processing is too slow, decrease batch size
            new_size = max(
                int(self.current_batch_size * self.batch_config.decrement_factor),
                self.batch_config.min_size
            )
            logger.info(f"Decreasing batch size to {new_size} due to high latency")
            self.current_batch_size = new_size
            return new_size
        elif latency < self.batch_config.target_latency * 0.5 and cpu_usage < self.batch_config.cpu_threshold * 0.7:
            # Processing is fast and resources are available, increase batch size
            new_size = min(
                int(self.current_batch_size * self.batch_config.increment_factor),
                self.batch_config.max_size
            )
            logger.info(f"Increasing batch size to {new_size} due to low latency and available resources")
            self.current_batch_size = new_size
            return new_size
        
        # Keep current batch size
        return self.current_batch_size
    
    def get_current_batch_size(self) -> int:
        """
        Get current batch size.
        
        Returns:
            Current batch size
        """
        return self.current_batch_size
    
    def reset(self):
        """Reset to initial batch size."""
        self.current_batch_size = self.batch_config.initial_size

class SyncService:
    """
    Service for managing synchronization operations between systems.
    
    This service handles batched synchronization operations with adaptive
    batch sizing based on system performance and resource usage.
    """
    
    def __init__(
        self,
        batch_config: Optional[BatchConfiguration] = None,
        resource_monitor: Optional[Callable[[], Dict[str, Any]]] = None,
        config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the sync service.
        
        Args:
            batch_config: Batch configuration parameters
            resource_monitor: Function to monitor system resources
            config: Additional configuration parameters
        """
        self.batch_config = batch_config or BatchConfiguration()
        self.resource_monitor = resource_monitor or self._default_resource_monitor
        self.optimizer = PerformanceOptimizer(self.batch_config)
        self.metrics = SyncMetrics()
        self.config = config or {}
        
        self._running = False
        self._paused = False
        self._worker_thread = None
        self._queue = queue.Queue()
        self._lock = threading.Lock()
        self._metrics_thread = None
        
        # Initialize additional metrics for dashboard integration
        self._last_sync_result = {
            "success": False,
            "records_processed": 0,
            "start_time": None,
            "end_time": None,
            "performance_metrics": {}
        }
    
    def _default_resource_monitor(self) -> Dict[str, Any]:
        """
        Default resource monitoring implementation.
        
        Returns:
            Dictionary of resource metrics
        """
        # Simulate resource metrics with random values
        # In a real implementation, this would use platform-specific APIs
        return {
            "cpu": 30 + 20 * np.random.random(),  # 30-50% CPU usage
            "memory": 40 + 20 * np.random.random(),  # 40-60% memory usage
            "network": 5 + 5 * np.random.random(),  # 5-10 MB/s network usage
            "disk": 30 + 10 * np.random.random(),  # 30-40% disk usage
        }
    
    def start(self):
        """Start the sync service."""
        with self._lock:
            if self._running:
                logger.warning("Sync service is already running")
                return
            
            self._running = True
            self._paused = False
            self.metrics.reset()
            
            # Start worker thread
            self._worker_thread = threading.Thread(target=self._worker_loop)
            self._worker_thread.daemon = True
            self._worker_thread.start()
            
            # Start metrics collection thread
            self._metrics_thread = threading.Thread(target=self._collect_metrics)
            self._metrics_thread.daemon = True
            self._metrics_thread.start()
            
            logger.info("Sync service started")
    
    def stop(self):
        """Stop the sync service."""
        with self._lock:
            if not self._running:
                logger.warning("Sync service is not running")
                return
            
            self._running = False
            self._paused = False
            
            # Wait for worker thread to terminate
            if self._worker_thread and self._worker_thread.is_alive():
                self._worker_thread.join(timeout=5.0)
            
            # Wait for metrics thread to terminate
            if self._metrics_thread and self._metrics_thread.is_alive():
                self._metrics_thread.join(timeout=5.0)
            
            # Complete metrics collection
            self.metrics.complete()
            
            logger.info("Sync service stopped")
    
    def pause(self):
        """Pause the sync service."""
        with self._lock:
            if not self._running:
                logger.warning("Sync service is not running")
                return
            
            self._paused = True
            logger.info("Sync service paused")
    
    def resume(self):
        """Resume the sync service."""
        with self._lock:
            if not self._running:
                logger.warning("Sync service is not running")
                return
            
            self._paused = False
            logger.info("Sync service resumed")
    
    def is_running(self) -> bool:
        """
        Check if the sync service is running.
        
        Returns:
            True if running, False otherwise
        """
        with self._lock:
            return self._running
    
    def is_paused(self) -> bool:
        """
        Check if the sync service is paused.
        
        Returns:
            True if paused, False otherwise
        """
        with self._lock:
            return self._paused
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get current sync metrics.
        
        Returns:
            Dictionary of metrics
        """
        return self.metrics.get_metrics()
    
    def get_time_series_data(self) -> Dict[str, List[Any]]:
        """
        Get time series data for metrics visualization.
        
        Returns:
            Dictionary of time series data
        """
        return self.metrics.get_time_series_data()
    
    def get_current_batch_size(self) -> int:
        """
        Get current batch size.
        
        Returns:
            Current batch size
        """
        return self.optimizer.get_current_batch_size()
    
    def set_batch_config(self, config: BatchConfiguration):
        """
        Set new batch configuration.
        
        Args:
            config: New batch configuration
        """
        with self._lock:
            self.batch_config = config
            self.optimizer = PerformanceOptimizer(config)
    
    def _worker_loop(self):
        """Main worker loop for processing sync operations."""
        while self._running:
            if self._paused:
                time.sleep(0.5)
                continue
            
            try:
                # Get current batch size
                batch_size = self.optimizer.get_current_batch_size()
                
                # Simulate batch processing
                batch_start_time = time.time()
                
                # Simulate processing success/failure
                success_count = int(batch_size * (0.9 + 0.1 * np.random.random()))
                fail_count = int(batch_size * 0.05 * np.random.random())
                skip_count = batch_size - success_count - fail_count
                
                # Simulate processing time (proportional to batch size but with some randomness)
                processing_time = 0.01 * batch_size * (0.8 + 0.4 * np.random.random())
                time.sleep(processing_time)
                
                batch_end_time = time.time()
                batch_duration = batch_end_time - batch_start_time
                
                # Record metrics
                self.metrics.record_batch(batch_size, batch_duration)
                self.metrics.record_result(success_count, fail_count, skip_count)
                
                # Simulate occasional errors
                if np.random.random() < 0.1:
                    error_message = f"Simulated error in batch processing: {np.random.choice(['network timeout', 'API error', 'data validation failure'])}"
                    self.metrics.record_error(error_message)
                
                # Get resource metrics
                resource_metrics = self.resource_monitor()
                
                # Update batch size based on performance
                self.optimizer.adjust_batch_size(resource_metrics, batch_duration)
                
                # Short sleep to prevent tight loop
                time.sleep(0.1)
            
            except Exception as e:
                logger.error(f"Error in worker loop: {str(e)}")
                time.sleep(1.0)
    
    def _collect_metrics(self):
        """Thread for collecting system metrics."""
        while self._running:
            try:
                # Collect system metrics
                resource_metrics = self.resource_monitor()
                
                # Record system metrics
                self.metrics.record_system_metrics(
                    resource_metrics.get("cpu", 0),
                    resource_metrics.get("memory", 0),
                    resource_metrics.get("network", 0),
                    resource_metrics.get("disk", 0)
                )
                
                # Collect metrics every 5 seconds
                time.sleep(5.0)
            
            except Exception as e:
                logger.error(f"Error collecting metrics: {str(e)}")
                time.sleep(5.0)

# Dashboard integration methods
    def get_performance_metrics(self) -> Dict[str, Any]:
        """
        Get performance metrics for dashboard display.
        
        Returns:
            Dictionary of performance metrics
        """
        # Get current system resource metrics
        resources = self.resource_monitor()
        
        # Format metrics for dashboard
        system_resources = {
            "cpu_percent": resources.get("cpu", 0),
            "memory_percent": resources.get("memory", 0),
            "disk_io_percent": resources.get("disk", 0),
            "memory_used_mb": 1024 * resources.get("memory", 0) / 100,  # Simulated
            "network_throughput_mbps": resources.get("network", 0)
        }
        
        # Calculate health status based on resource usage
        system_health = self._interpret_system_health(system_resources)
        
        # Calculate optimal batch sizes based on system resources
        optimal_batch_sizes = self._calculate_optimal_batch_sizes(system_resources)
        
        # Get processing metrics
        processing_metrics = {
            "batch_size": self.get_current_batch_size(),
            "throughput_items_per_second": self.metrics.get_metrics().get("throughput_items_per_second", 0),
            "error_rate": self.metrics.get_metrics().get("error_rate", 0),
            "total_items_processed": self.metrics.get_metrics().get("total_items", 0),
            "successful_items": self.metrics.get_metrics().get("successful_items", 0),
            "failed_items": self.metrics.get_metrics().get("failed_items", 0)
        }
        
        # Get repository metrics (simulated)
        repository_metrics = self._get_repository_metrics()
        
        # Return consolidated metrics
        return {
            "system_resources": system_resources,
            "interpretation": {
                "system_health": system_health
            },
            "optimal_batch_sizes": optimal_batch_sizes,
            "processing": processing_metrics,
            "repository": repository_metrics,
            "timestamp": time.time()
        }
    
    def _interpret_system_health(self, system_resources: Dict[str, Any]) -> Dict[str, Any]:
        """
        Interpret system health based on resource metrics.
        
        Args:
            system_resources: Dictionary of system resource metrics
            
        Returns:
            Dictionary of health interpretations
        """
        cpu_percent = system_resources.get("cpu_percent", 0)
        memory_percent = system_resources.get("memory_percent", 0)
        disk_io_percent = system_resources.get("disk_io_percent", 0)
        
        # Determine health status for each component
        cpu_status = "healthy"
        if cpu_percent > 85:
            cpu_status = "critical"
        elif cpu_percent > 70:
            cpu_status = "warning"
        elif cpu_percent > 50:
            cpu_status = "elevated"
            
        memory_status = "healthy"
        if memory_percent > 90:
            memory_status = "critical"
        elif memory_percent > 75:
            memory_status = "warning"
        elif memory_percent > 60:
            memory_status = "elevated"
            
        disk_status = "healthy"
        if disk_io_percent > 80:
            disk_status = "critical"
        elif disk_io_percent > 60:
            disk_status = "warning"
        elif disk_io_percent > 40:
            disk_status = "elevated"
            
        # Determine overall health
        overall_status = "healthy"
        if cpu_status == "critical" or memory_status == "critical" or disk_status == "critical":
            overall_status = "critical"
        elif cpu_status == "warning" or memory_status == "warning" or disk_status == "warning":
            overall_status = "warning"
        elif cpu_status == "elevated" or memory_status == "elevated" or disk_status == "elevated":
            overall_status = "elevated"
            
        # Generate interpretations
        interpretations = []
        if cpu_status != "healthy":
            interpretations.append(f"CPU usage is {cpu_percent:.1f}%, which may impact sync performance.")
        if memory_status != "healthy":
            interpretations.append(f"Memory usage is {memory_percent:.1f}%, which may limit batch processing capabilities.")
        if disk_status != "healthy":
            interpretations.append(f"Disk I/O usage is {disk_io_percent:.1f}%, which may slow down data reading/writing operations.")
            
        if not interpretations:
            interpretations.append("All systems operating within optimal parameters. Batch sizes can be maximized.")
            
        return {
            "overall": overall_status,
            "components": {
                "cpu": cpu_status,
                "memory": memory_status,
                "disk_io": disk_status
            },
            "resource_interpretations": interpretations
        }
    
    def _calculate_optimal_batch_sizes(self, system_resources: Dict[str, Any], repository_metrics: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Calculate optimal batch sizes based on system resources.
        
        Args:
            system_resources: Dictionary of system resource metrics
            repository_metrics: Optional repository metrics
            
        Returns:
            Dictionary of optimal batch sizes and explanations
        """
        cpu_percent = system_resources.get("cpu_percent", 0)
        memory_percent = system_resources.get("memory_percent", 0)
        disk_io_percent = system_resources.get("disk_io_percent", 0)
        
        # Base batch sizes for different operations
        base_sizes = {
            "full_sync": 100,
            "incremental_sync": 200,
            "selective_sync": 150
        }
        
        # Calculate adjustment factors
        cpu_factor = max(0.2, 1.0 - (cpu_percent / 100) * 0.8)
        memory_factor = max(0.2, 1.0 - (memory_percent / 100) * 0.8)
        disk_factor = max(0.2, 1.0 - (disk_io_percent / 100) * 0.8)
        
        # Combined factor
        combined_factor = min(cpu_factor, memory_factor, disk_factor)
        
        # Calculate adjusted batch sizes
        adjusted_sizes = {}
        for op_type, base_size in base_sizes.items():
            adjusted_sizes[op_type] = max(10, int(base_size * combined_factor))
        
        # Generate explanations
        explanations = []
        limiting_factor = "none"
        min_factor = min(cpu_factor, memory_factor, disk_factor)
        
        if abs(min_factor - cpu_factor) < 0.01:
            limiting_factor = "CPU"
            explanations.append(f"CPU usage ({cpu_percent:.1f}%) is the limiting factor for batch sizing.")
        elif abs(min_factor - memory_factor) < 0.01:
            limiting_factor = "Memory"
            explanations.append(f"Memory usage ({memory_percent:.1f}%) is the limiting factor for batch sizing.")
        elif abs(min_factor - disk_factor) < 0.01:
            limiting_factor = "Disk I/O"
            explanations.append(f"Disk I/O usage ({disk_io_percent:.1f}%) is the limiting factor for batch sizing.")
            
        explanations.append(f"Combined adjustment factor: {combined_factor:.2f}")
        
        if combined_factor > 0.8:
            explanations.append("System resources are optimal, batch sizes can be maximized.")
        elif combined_factor > 0.5:
            explanations.append("System resources are good, moderate batch sizes recommended.")
        else:
            explanations.append("System resources are constrained, smaller batch sizes recommended to prevent overload.")
        
        return {
            "batch_sizes": adjusted_sizes,
            "adjustment_factor": combined_factor,
            "limiting_factor": limiting_factor,
            "adjustment_explanations": explanations
        }
    
    def _get_repository_metrics(self) -> Dict[str, Any]:
        """
        Get repository metrics (simulated).
        
        Returns:
            Dictionary of repository metrics
        """
        return {
            "total_repositories": 5,
            "total_files": 1200 + int(300 * np.random.random()),
            "average_file_size_kb": 25 + int(10 * np.random.random()),
            "total_size_mb": 30 + int(5 * np.random.random()),
            "connection_latency_ms": 50 + int(20 * np.random.random()),
            "repositories": [
                {
                    "name": "code_repositories",
                    "file_count": 450 + int(50 * np.random.random()),
                    "size_mb": 12 + int(2 * np.random.random())
                },
                {
                    "name": "workflow_patterns",
                    "file_count": 180 + int(20 * np.random.random()),
                    "size_mb": 5 + int(1 * np.random.random())
                },
                {
                    "name": "architecture_templates",
                    "file_count": 75 + int(10 * np.random.random()),
                    "size_mb": 3 + int(0.5 * np.random.random())
                },
                {
                    "name": "code_metrics",
                    "file_count": 320 + int(30 * np.random.random()),
                    "size_mb": 8 + int(1.5 * np.random.random())
                },
                {
                    "name": "performance_data",
                    "file_count": 175 + int(25 * np.random.random()),
                    "size_mb": 2 + int(0.5 * np.random.random())
                }
            ]
        }
    
    # Sync operation methods
    def full_sync(self) -> Dict[str, Any]:
        """
        Perform a full synchronization operation.
        
        Returns:
            Dictionary with operation results
        """
        # Start the service if not already running
        if not self.is_running():
            self.start()
        
        # Simulate a full sync operation
        start_time = time.time()
        
        # Simulate processing time
        time.sleep(1.0)
        
        # Generate result
        records_processed = 1000 + int(200 * np.random.random())
        end_time = time.time()
        
        # Create result data
        result = {
            "success": True,
            "records_processed": records_processed,
            "start_time": start_time,
            "end_time": end_time,
            "duration": end_time - start_time,
            "performance_metrics": self.get_metrics()
        }
        
        # Store last result
        self._last_sync_result = result
        
        return result
    
    def incremental_sync(self) -> Dict[str, Any]:
        """
        Perform an incremental synchronization operation.
        
        Returns:
            Dictionary with operation results
        """
        # Start the service if not already running
        if not self.is_running():
            self.start()
        
        # Simulate an incremental sync operation
        start_time = time.time()
        
        # Simulate processing time (faster than full sync)
        time.sleep(0.5)
        
        # Generate result
        records_processed = 200 + int(100 * np.random.random())
        end_time = time.time()
        
        # Create result data
        result = {
            "success": True,
            "records_processed": records_processed,
            "start_time": start_time,
            "end_time": end_time,
            "duration": end_time - start_time,
            "performance_metrics": self.get_metrics()
        }
        
        # Store last result
        self._last_sync_result = result
        
        return result
    
    def selective_sync(self, collections: List[str]) -> Dict[str, Any]:
        """
        Perform a selective synchronization operation.
        
        Args:
            collections: List of collections to synchronize
            
        Returns:
            Dictionary with operation results
        """
        # Start the service if not already running
        if not self.is_running():
            self.start()
        
        # Simulate a selective sync operation
        start_time = time.time()
        
        # Simulate processing time (based on number of collections)
        time.sleep(0.2 * len(collections))
        
        # Generate result
        records_per_collection = 100 + int(50 * np.random.random())
        records_processed = len(collections) * records_per_collection
        end_time = time.time()
        
        # Create result data
        result = {
            "success": True,
            "records_processed": records_processed,
            "collections": collections,
            "start_time": start_time,
            "end_time": end_time,
            "duration": end_time - start_time,
            "performance_metrics": self.get_metrics()
        }
        
        # Store last result
        self._last_sync_result = result
        
        return result

# Singleton instance for global access
_default_service = None

def get_sync_service() -> SyncService:
    """
    Get the default sync service instance.
    
    Returns:
        Default sync service instance
    """
    global _default_service
    
    if _default_service is None:
        _default_service = SyncService()
    
    return _default_service