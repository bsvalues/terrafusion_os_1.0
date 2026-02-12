"""
System monitoring utilities for collecting and recording system performance metrics.
"""
import os
import time
import logging
import threading
import psutil
import platform
from datetime import datetime
import sqlalchemy
from sqlalchemy.sql import text

from app import db
# Import models when needed to avoid circular imports
# from models import SystemMetric, MonitoringAlert

# Set up logging
logger = logging.getLogger(__name__)

class SystemMonitor:
    """
    System monitoring class that periodically collects system metrics
    and records them in the database.
    """
    
    def __init__(self, interval=300):
        """
        Initialize the system monitor.
        
        Args:
            interval (int): Collection interval in seconds (default: 300 = 5 minutes)
        """
        self.interval = interval
        self.thread = None
        self.running = False
        self.stop_event = threading.Event()
    
    def start(self):
        """Start the system monitoring thread."""
        if self.running:
            logger.warning("System monitor is already running")
            return False
        
        self.running = True
        self.stop_event.clear()
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()
        logger.info(f"System monitor started with interval of {self.interval} seconds")
        return True
    
    def stop(self):
        """Stop the system monitoring thread."""
        if not self.running:
            logger.warning("System monitor is not running")
            return False
        
        self.running = False
        self.stop_event.set()
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=10)
        logger.info("System monitor stopped")
        return True
    
    def _monitor_loop(self):
        """Main monitoring loop that collects metrics periodically."""
        try:
            from app import app
            
            # Collect metrics immediately on start with app context
            with app.app_context():
                self._collect_metrics()
            
            # Then collect at regular intervals
            while self.running and not self.stop_event.is_set():
                # Wait for the specified interval or until stopped
                if self.stop_event.wait(self.interval):
                    break
                
                # Collect metrics with proper app context
                with app.app_context():
                    self._collect_metrics()
                
        except Exception as e:
            logger.error(f"Error in system monitoring loop: {str(e)}")
            self.running = False
    
    def _collect_metrics(self):
        """Collect and record various system metrics."""
        try:
            # Record CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            self._record_metric("cpu_usage", cpu_percent, "percent", "performance", "system")
            
            # Record memory usage
            memory = psutil.virtual_memory()
            self._record_metric("memory_usage", memory.percent, "percent", "performance", "system")
            self._record_metric("memory_used", memory.used / (1024 * 1024), "MB", "performance", "system")
            self._record_metric("memory_available", memory.available / (1024 * 1024), "MB", "performance", "system")
            
            # Record disk usage
            disk = psutil.disk_usage('/')
            self._record_metric("disk_usage", disk.percent, "percent", "performance", "system")
            self._record_metric("disk_used", disk.used / (1024 * 1024 * 1024), "GB", "performance", "system")
            self._record_metric("disk_free", disk.free / (1024 * 1024 * 1024), "GB", "performance", "system")
            
            # Record system load average (on unix systems)
            if platform.system() != "Windows":
                load_avg = os.getloadavg()
                self._record_metric("load_avg_1min", load_avg[0], None, "performance", "system")
                self._record_metric("load_avg_5min", load_avg[1], None, "performance", "system")
                self._record_metric("load_avg_15min", load_avg[2], None, "performance", "system")
            
            # Record number of processes
            processes = len(psutil.pids())
            self._record_metric("process_count", processes, "count", "performance", "system")
            
            # Record database metrics
            self._collect_database_metrics()
            
            # Check for alert conditions
            self._check_alert_conditions(cpu_percent, memory.percent, disk.percent)
            
            logger.debug("System metrics collected successfully")
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {str(e)}")
    
    def _record_metric(self, name, value, unit, category, component):
        """Record a metric in the database."""
        try:
            # Import models here to avoid circular imports
            from models import SystemMetric
            
            metric = SystemMetric(
                metric_name=name,
                metric_value=float(value),
                metric_unit=unit,
                category=category,
                component=component
            )
            
            db.session.add(metric)
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error recording metric {name}: {str(e)}")
            db.session.rollback()
    
    def _collect_database_metrics(self):
        """Collect and record database-specific metrics."""
        try:
            # Use SQLAlchemy raw connection to execute database-specific metrics queries
            connection = db.engine.connect()
            
            # Get database size (PostgreSQL specific)
            try:
                result = connection.execute(text("""
                    SELECT pg_database_size(current_database()) as db_size;
                """))
                row = result.fetchone()
                if row:
                    db_size_bytes = row[0]
                    db_size_mb = db_size_bytes / (1024 * 1024)
                    self._record_metric("database_size", db_size_mb, "MB", "performance", "database")
            except:
                logger.warning("Could not get database size")
            
            # Get connection count (PostgreSQL specific)
            try:
                result = connection.execute(text("""
                    SELECT count(*) FROM pg_stat_activity;
                """))
                row = result.fetchone()
                if row:
                    connection_count = row[0]
                    self._record_metric("connection_count", connection_count, "connections", "performance", "database")
            except:
                logger.warning("Could not get connection count")
            
            # Get table statistics (PostgreSQL specific)
            try:
                result = connection.execute(text("""
                    SELECT sum(n_tup_ins) as inserts, 
                           sum(n_tup_upd) as updates, 
                           sum(n_tup_del) as deletes
                    FROM pg_stat_user_tables;
                """))
                row = result.fetchone()
                if row:
                    self._record_metric("db_inserts", row[0] or 0, "operations", "usage", "database")
                    self._record_metric("db_updates", row[1] or 0, "operations", "usage", "database")
                    self._record_metric("db_deletes", row[2] or 0, "operations", "usage", "database")
            except:
                logger.warning("Could not get table statistics")
            
            # Finally close the connection
            connection.close()
            
        except Exception as e:
            logger.error(f"Error collecting database metrics: {str(e)}")
    
    def _check_alert_conditions(self, cpu_percent, memory_percent, disk_percent):
        """Check metric values against thresholds and create alerts if needed."""
        try:
            # Set thresholds for various metrics
            cpu_high = 90
            cpu_medium = 75
            memory_high = 90
            memory_medium = 80
            disk_high = 90
            disk_medium = 80
            
            # Check CPU usage
            if cpu_percent >= cpu_high:
                self._create_alert(
                    "high_cpu_usage",
                    "high",
                    "system",
                    f"CPU usage is critically high at {cpu_percent}%",
                    f"High CPU usage could indicate excessive load or resource constraints."
                )
            elif cpu_percent >= cpu_medium:
                self._create_alert(
                    "elevated_cpu_usage",
                    "medium",
                    "system",
                    f"CPU usage is elevated at {cpu_percent}%",
                    f"Elevated CPU usage detected."
                )
            
            # Check memory usage
            if memory_percent >= memory_high:
                self._create_alert(
                    "high_memory_usage",
                    "high",
                    "system",
                    f"Memory usage is critically high at {memory_percent}%",
                    f"High memory usage could lead to swapping and performance degradation."
                )
            elif memory_percent >= memory_medium:
                self._create_alert(
                    "elevated_memory_usage",
                    "medium",
                    "system",
                    f"Memory usage is elevated at {memory_percent}%",
                    f"Elevated memory usage detected."
                )
            
            # Check disk usage
            if disk_percent >= disk_high:
                self._create_alert(
                    "high_disk_usage",
                    "high",
                    "system",
                    f"Disk usage is critically high at {disk_percent}%",
                    f"High disk usage could lead to write failures and system instability."
                )
            elif disk_percent >= disk_medium:
                self._create_alert(
                    "elevated_disk_usage",
                    "medium",
                    "system",
                    f"Disk usage is elevated at {disk_percent}%",
                    f"Elevated disk usage detected."
                )
            
        except Exception as e:
            logger.error(f"Error checking alert conditions: {str(e)}")
    
    def _create_alert(self, alert_type, severity, component, message, details=None):
        """Create a new alert in the database if one doesn't already exist."""
        try:
            # Import models here to avoid circular imports
            from models import MonitoringAlert
            
            # Check if there's already an active alert of this type
            existing_alert = MonitoringAlert.query.filter(
                MonitoringAlert.alert_type == alert_type,
                MonitoringAlert.status == 'active'
            ).first()
            
            if existing_alert:
                # Alert already exists, don't create another one
                logger.debug(f"Alert of type {alert_type} already exists (ID: {existing_alert.id})")
                return
            
            # Create a new alert
            alert = MonitoringAlert(
                alert_type=alert_type,
                severity=severity,
                component=component,
                message=message,
                details=details,
                status='active'
            )
            
            db.session.add(alert)
            db.session.commit()
            
            logger.warning(f"Created new alert: {severity} {alert_type} - {message}")
            
        except Exception as e:
            logger.error(f"Error creating alert: {str(e)}")
            db.session.rollback()

# Singleton instance
_monitor_instance = None

def get_monitor():
    """Get the system monitor singleton instance."""
    global _monitor_instance
    if _monitor_instance is None:
        _monitor_instance = SystemMonitor()
    return _monitor_instance

def start_monitoring(interval=300):
    """Start the system monitoring thread with the specified interval."""
    monitor = get_monitor()
    return monitor.start()

def stop_monitoring():
    """Stop the system monitoring thread."""
    monitor = get_monitor()
    return monitor.stop()