#!/usr/bin/env python
"""
Health Check System for GeoAssessmentPro

This module provides comprehensive health checking capabilities for the application,
including component-level checks and self-healing mechanisms.
"""

import os
import sys
import time
import logging
import json
import datetime
import threading
import requests
import socket
import psutil
from typing import Dict, List, Any, Tuple, Optional
from sqlalchemy.exc import SQLAlchemyError
from flask import Blueprint, jsonify, current_app, request

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
CHECK_INTERVAL = 60  # seconds
CACHE_TTL = 30       # seconds
RETRY_ATTEMPTS = 3
RETRY_DELAY = 2      # seconds
SERVICE_TIMEOUT = 5  # seconds

# Health check status constants
STATUS_OK = "ok"
STATUS_DEGRADED = "degraded"
STATUS_DOWN = "down"
STATUS_UNKNOWN = "unknown"

# Cache for health check results
health_cache = {
    "timestamp": 0,
    "results": {},
    "overall_status": STATUS_UNKNOWN
}

# Blueprint for health check routes
health_bp = Blueprint("health_check", __name__, url_prefix="/health")

class ComponentCheck:
    """Base class for component health checks"""
    
    def __init__(self, name: str, critical: bool = False):
        """
        Initialize component check
        
        Args:
            name: Name of the component
            critical: Whether this component is critical for the application
        """
        self.name = name
        self.critical = critical
        self.last_check_time = 0
        self.last_status = STATUS_UNKNOWN
        self.details = {}
        
    def check_health(self) -> Dict[str, Any]:
        """
        Check component health and return status
        
        Returns:
            Dict with health check results
        """
        try:
            start_time = time.time()
            status, details = self._perform_check()
            end_time = time.time()
            response_time = end_time - start_time
            
            result = {
                "status": status,
                "response_time_ms": int(response_time * 1000),
                "critical": self.critical,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "details": details if details else {}
            }
            
            self.last_check_time = time.time()
            self.last_status = status
            self.details = details if details else {}
            
            return result
        except Exception as e:
            logger.error(f"Error checking health of {self.name}: {str(e)}")
            return {
                "status": STATUS_DOWN,
                "critical": self.critical,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "details": {"error": str(e)}
            }
    
    def _perform_check(self) -> Tuple[str, Dict[str, Any]]:
        """
        Perform the actual health check
        
        Returns:
            Tuple of (status, details)
        """
        # To be implemented by subclasses
        return STATUS_UNKNOWN, {"message": "Not implemented"}
    
    def heal(self) -> bool:
        """
        Attempt to heal the component if it's down
        
        Returns:
            True if healing was successful, False otherwise
        """
        # To be implemented by subclasses
        return False

class DatabaseCheck(ComponentCheck):
    """Health check for database connectivity"""
    
    def __init__(self, critical: bool = True):
        """Initialize database health check"""
        super().__init__("database", critical)
        
    def _perform_check(self) -> Tuple[str, Dict[str, Any]]:
        """
        Check database connectivity
        
        Returns:
            Tuple of (status, details)
        """
        from flask import current_app
        from app import db
        
        try:
            # Try to execute a simple query
            result = db.session.execute("SELECT 1").fetchone()
            if result and result[0] == 1:
                # Also check connection pool stats
                engine = db.engine
                pool_size = engine.pool.size()
                pool_checkedin = engine.pool.checkedin()
                pool_overflow = engine.pool.overflow()
                pool_checkedout = engine.pool.checkedout()
                
                return STATUS_OK, {
                    "connection_pool": {
                        "size": pool_size,
                        "checkedin": pool_checkedin,
                        "checkedout": pool_checkedout,
                        "overflow": pool_overflow
                    },
                    "database_url": "****", # Redacted for security
                    "engine": str(engine.dialect.name)
                }
            else:
                return STATUS_DOWN, {"message": "Database query did not return expected result"}
        except SQLAlchemyError as e:
            return STATUS_DOWN, {"error": str(e)}
        except Exception as e:
            return STATUS_DOWN, {"error": str(e)}
    
    def heal(self) -> bool:
        """
        Attempt to heal database connection issues
        
        Returns:
            True if healing was successful, False otherwise
        """
        from app import db
        
        try:
            # Try to dispose and recreate engine connections
            db.engine.dispose()
            
            # Test if it worked
            result = db.session.execute("SELECT 1").fetchone()
            if result and result[0] == 1:
                logger.info("Successfully healed database connection")
                return True
            
            return False
        except Exception as e:
            logger.error(f"Failed to heal database connection: {str(e)}")
            return False

class CacheCheck(ComponentCheck):
    """Health check for cache service"""
    
    def __init__(self, critical: bool = False):
        """Initialize cache health check"""
        super().__init__("cache", critical)
        
    def _perform_check(self) -> Tuple[str, Dict[str, Any]]:
        """
        Check cache connectivity
        
        Returns:
            Tuple of (status, details)
        """
        # Check if cache is configured
        if not hasattr(current_app, 'cache'):
            return STATUS_UNKNOWN, {"message": "Cache not configured"}
        
        try:
            # Try to set and get a value
            test_key = f"health_check_{time.time()}"
            test_value = str(time.time())
            
            current_app.cache.set(test_key, test_value, timeout=10)
            retrieved_value = current_app.cache.get(test_key)
            
            if retrieved_value == test_value:
                # Get cache stats if available
                stats = {}
                if hasattr(current_app.cache, 'get_stats'):
                    stats = current_app.cache.get_stats()
                
                return STATUS_OK, {"stats": stats}
            else:
                return STATUS_DEGRADED, {"message": "Cache set/get test failed"}
        except Exception as e:
            return STATUS_DOWN, {"error": str(e)}
    
    def heal(self) -> bool:
        """
        Attempt to heal cache connection issues
        
        Returns:
            True if healing was successful, False otherwise
        """
        # Typically no healing is possible for cache, but we could clear it
        if not hasattr(current_app, 'cache'):
            return False
        
        try:
            # Try to clear the cache
            current_app.cache.clear()
            
            # Test if it works
            test_key = f"health_check_{time.time()}"
            test_value = str(time.time())
            current_app.cache.set(test_key, test_value, timeout=10)
            retrieved_value = current_app.cache.get(test_key)
            
            if retrieved_value == test_value:
                logger.info("Successfully healed cache")
                return True
            
            return False
        except Exception as e:
            logger.error(f"Failed to heal cache: {str(e)}")
            return False

class SuperabaseCheck(ComponentCheck):
    """Health check for Supabase connection"""
    
    def __init__(self, critical: bool = False):
        """Initialize Supabase health check"""
        super().__init__("supabase", critical)
        
    def _perform_check(self) -> Tuple[str, Dict[str, Any]]:
        """
        Check Supabase connectivity
        
        Returns:
            Tuple of (status, details)
        """
        from config_loader import is_supabase_enabled
        
        if not is_supabase_enabled():
            return STATUS_UNKNOWN, {"message": "Supabase not enabled"}
        
        try:
            # Import here to avoid circular imports
            from supabase_client import get_supabase_client
            
            client = get_supabase_client()
            if not client:
                return STATUS_DOWN, {"message": "Could not get Supabase client"}
            
            # Try a simple query
            response = client.table('app_settings').select('*').limit(1).execute()
            
            if hasattr(response, 'data'):
                # Success, get some stats about the connection
                return STATUS_OK, {
                    "supabase_url": "****",  # Redacted for security
                    "tables_available": True
                }
            else:
                return STATUS_DEGRADED, {"message": "Supabase query did not return expected result"}
        except Exception as e:
            return STATUS_DOWN, {"error": str(e)}
    
    def heal(self) -> bool:
        """
        Attempt to heal Supabase connection issues
        
        Returns:
            True if healing was successful, False otherwise
        """
        try:
            # Try to reinitialize the Supabase client
            from supabase_client import initialize_supabase
            
            result = initialize_supabase()
            
            if result:
                # Test if it works
                from supabase_client import get_supabase_client
                client = get_supabase_client()
                if not client:
                    return False
                
                response = client.table('app_settings').select('*').limit(1).execute()
                if hasattr(response, 'data'):
                    logger.info("Successfully healed Supabase connection")
                    return True
            
            return False
        except Exception as e:
            logger.error(f"Failed to heal Supabase connection: {str(e)}")
            return False

class FileSystemCheck(ComponentCheck):
    """Health check for file system"""
    
    def __init__(self, critical: bool = True):
        """Initialize file system health check"""
        super().__init__("filesystem", critical)
        
    def _perform_check(self) -> Tuple[str, Dict[str, Any]]:
        """
        Check file system health
        
        Returns:
            Tuple of (status, details)
        """
        try:
            # Check if upload directory exists and is writable
            upload_dir = current_app.config.get("UPLOAD_FOLDER", "uploads")
            
            if not os.path.exists(upload_dir):
                return STATUS_DOWN, {"message": f"Upload directory {upload_dir} does not exist"}
            
            if not os.access(upload_dir, os.W_OK):
                return STATUS_DOWN, {"message": f"Upload directory {upload_dir} is not writable"}
            
            # Check disk space
            disk_usage = psutil.disk_usage(upload_dir)
            free_space_mb = disk_usage.free / (1024 * 1024)
            total_space_mb = disk_usage.total / (1024 * 1024)
            used_space_mb = disk_usage.used / (1024 * 1024)
            percent_used = disk_usage.percent
            
            # If less than 5% or 100MB free, it's degraded
            if percent_used > 95 or free_space_mb < 100:
                return STATUS_DEGRADED, {
                    "message": "Low disk space",
                    "free_mb": round(free_space_mb, 2),
                    "total_mb": round(total_space_mb, 2),
                    "used_mb": round(used_space_mb, 2),
                    "percent_used": percent_used
                }
            
            # Write a test file to ensure write capability
            test_file = os.path.join(upload_dir, ".health_check_test")
            with open(test_file, "w") as f:
                f.write("test")
            
            # Read the test file to ensure read capability
            with open(test_file, "r") as f:
                content = f.read()
            
            # Delete the test file
            os.remove(test_file)
            
            if content != "test":
                return STATUS_DEGRADED, {"message": "File read/write test failed"}
            
            return STATUS_OK, {
                "directory": upload_dir,
                "free_mb": round(free_space_mb, 2),
                "total_mb": round(total_space_mb, 2),
                "used_mb": round(used_space_mb, 2),
                "percent_used": percent_used
            }
        except Exception as e:
            return STATUS_DOWN, {"error": str(e)}
    
    def heal(self) -> bool:
        """
        Attempt to heal file system issues
        
        Returns:
            True if healing was successful, False otherwise
        """
        try:
            # Try to create upload directory if it doesn't exist
            upload_dir = current_app.config.get("UPLOAD_FOLDER", "uploads")
            
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir, exist_ok=True)
                logger.info(f"Created upload directory {upload_dir}")
            
            # Check if upload directory is writable
            if not os.access(upload_dir, os.W_OK):
                # Try to change permissions
                os.chmod(upload_dir, 0o755)
                logger.info(f"Changed permissions for upload directory {upload_dir}")
            
            # Test if it works
            test_file = os.path.join(upload_dir, ".health_check_test")
            with open(test_file, "w") as f:
                f.write("test")
            
            # Read the test file to ensure read capability
            with open(test_file, "r") as f:
                content = f.read()
            
            # Delete the test file
            os.remove(test_file)
            
            if content == "test":
                logger.info("Successfully healed file system")
                return True
            
            return False
        except Exception as e:
            logger.error(f"Failed to heal file system: {str(e)}")
            return False

class SystemResourcesCheck(ComponentCheck):
    """Health check for system resources"""
    
    def __init__(self, critical: bool = False):
        """Initialize system resources health check"""
        super().__init__("system_resources", critical)
        
    def _perform_check(self) -> Tuple[str, Dict[str, Any]]:
        """
        Check system resources health
        
        Returns:
            Tuple of (status, details)
        """
        try:
            # Check CPU usage
            cpu_percent = psutil.cpu_percent(interval=0.5)
            
            # Check memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available_mb = memory.available / (1024 * 1024)
            memory_total_mb = memory.total / (1024 * 1024)
            memory_used_mb = memory.used / (1024 * 1024)
            
            # If CPU or memory usage is high, it's degraded
            status = STATUS_OK
            message = "System resources are healthy"
            
            if cpu_percent > 90:
                status = STATUS_DEGRADED
                message = "High CPU usage"
            
            if memory_percent > 90:
                status = STATUS_DEGRADED
                message = "High memory usage"
            
            if memory_available_mb < 100:
                status = STATUS_DEGRADED
                message = "Low available memory"
            
            return status, {
                "message": message,
                "cpu": {
                    "percent": cpu_percent
                },
                "memory": {
                    "percent": memory_percent,
                    "available_mb": round(memory_available_mb, 2),
                    "total_mb": round(memory_total_mb, 2),
                    "used_mb": round(memory_used_mb, 2)
                }
            }
        except Exception as e:
            return STATUS_DOWN, {"error": str(e)}
    
    def heal(self) -> bool:
        """
        Attempt to heal system resources issues
        
        Returns:
            True if healing was successful, False otherwise
        """
        # Not much we can do to heal system resources, but we could
        # try to free up memory by suggesting garbage collection
        try:
            import gc
            gc.collect()
            
            # Check if it helped
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            if memory_percent < 90:
                logger.info("Successfully freed up memory")
                return True
            
            return False
        except Exception as e:
            logger.error(f"Failed to heal system resources: {str(e)}")
            return False

class ExternalApiCheck(ComponentCheck):
    """Health check for external API connections"""
    
    def __init__(self, name: str, url: str, method: str = "GET", 
                expected_status: int = 200, timeout: int = SERVICE_TIMEOUT, 
                headers: Dict[str, str] = None, data: Dict[str, Any] = None,
                critical: bool = False):
        """
        Initialize external API health check
        
        Args:
            name: Name of the external API
            url: URL to check
            method: HTTP method to use
            expected_status: Expected HTTP status code
            timeout: Request timeout in seconds
            headers: HTTP headers to send
            data: Request data to send
            critical: Whether this component is critical for the application
        """
        super().__init__(f"external_api_{name}", critical)
        self.url = url
        self.method = method
        self.expected_status = expected_status
        self.timeout = timeout
        self.headers = headers or {}
        self.data = data or {}
        
    def _perform_check(self) -> Tuple[str, Dict[str, Any]]:
        """
        Check external API health
        
        Returns:
            Tuple of (status, details)
        """
        try:
            # Make the request
            response = requests.request(
                method=self.method,
                url=self.url,
                headers=self.headers,
                json=self.data,
                timeout=self.timeout
            )
            
            # Check the status code
            if response.status_code == self.expected_status:
                return STATUS_OK, {
                    "status_code": response.status_code,
                    "url": self.url,
                    "method": self.method
                }
            else:
                return STATUS_DEGRADED, {
                    "message": f"Unexpected status code: {response.status_code}",
                    "expected": self.expected_status,
                    "url": self.url,
                    "method": self.method
                }
        except requests.exceptions.Timeout:
            return STATUS_DEGRADED, {
                "message": "Request timed out",
                "url": self.url,
                "method": self.method
            }
        except requests.exceptions.ConnectionError:
            return STATUS_DOWN, {
                "message": "Connection error",
                "url": self.url,
                "method": self.method
            }
        except Exception as e:
            return STATUS_DOWN, {
                "error": str(e),
                "url": self.url,
                "method": self.method
            }
    
    def heal(self) -> bool:
        """
        Attempt to heal external API connection issues
        
        Returns:
            True if healing was successful, False otherwise
        """
        # For external APIs, we can just retry the request a few times
        for attempt in range(RETRY_ATTEMPTS):
            try:
                logger.info(f"Healing attempt {attempt + 1} for {self.name}")
                
                # Make the request
                response = requests.request(
                    method=self.method,
                    url=self.url,
                    headers=self.headers,
                    json=self.data,
                    timeout=self.timeout
                )
                
                # Check the status code
                if response.status_code == self.expected_status:
                    logger.info(f"Successfully healed {self.name}")
                    return True
                
                # Wait before retry
                time.sleep(RETRY_DELAY)
            except Exception as e:
                logger.error(f"Healing attempt {attempt + 1} failed: {str(e)}")
                time.sleep(RETRY_DELAY)
        
        return False

class HealthCheckManager:
    """Manager for health checks"""
    
    def __init__(self):
        """Initialize health check manager"""
        self.components = {}
        self.lock = threading.Lock()
        
    def register_component(self, component: ComponentCheck) -> None:
        """
        Register a component health check
        
        Args:
            component: Component health check
        """
        with self.lock:
            self.components[component.name] = component
            logger.info(f"Registered health check for component: {component.name}")
    
    def check_component(self, component_name: str) -> Dict[str, Any]:
        """
        Check a specific component's health
        
        Args:
            component_name: Name of the component to check
            
        Returns:
            Dict with health check results
        """
        with self.lock:
            if component_name not in self.components:
                return {
                    "status": STATUS_UNKNOWN,
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                    "details": {"message": f"Component {component_name} not registered"}
                }
            
            component = self.components[component_name]
            return component.check_health()
    
    def check_all_components(self) -> Dict[str, Dict[str, Any]]:
        """
        Check health of all registered components
        
        Returns:
            Dict with health check results for all components
        """
        results = {}
        with self.lock:
            for name, component in self.components.items():
                results[name] = component.check_health()
        
        return results
    
    def get_overall_status(self, results: Dict[str, Dict[str, Any]]) -> str:
        """
        Get overall health status based on component results
        
        Args:
            results: Dict with health check results for all components
            
        Returns:
            Overall health status
        """
        # If any critical component is down, overall status is down
        for name, result in results.items():
            if result.get("critical", False) and result.get("status") == STATUS_DOWN:
                return STATUS_DOWN
        
        # If any component is down, or any critical component is degraded, overall status is degraded
        for name, result in results.items():
            if result.get("status") == STATUS_DOWN:
                return STATUS_DEGRADED
            
            if result.get("critical", False) and result.get("status") == STATUS_DEGRADED:
                return STATUS_DEGRADED
        
        # If all components are OK, overall status is OK
        all_ok = True
        for name, result in results.items():
            if result.get("status") != STATUS_OK and result.get("status") != STATUS_UNKNOWN:
                all_ok = False
                break
        
        if all_ok:
            return STATUS_OK
        
        # Otherwise, overall status is degraded
        return STATUS_DEGRADED
    
    def heal_component(self, component_name: str) -> bool:
        """
        Attempt to heal a specific component
        
        Args:
            component_name: Name of the component to heal
            
        Returns:
            True if healing was successful, False otherwise
        """
        with self.lock:
            if component_name not in self.components:
                return False
            
            component = self.components[component_name]
            return component.heal()
    
    def heal_all_components(self) -> Dict[str, bool]:
        """
        Attempt to heal all components that are down
        
        Returns:
            Dict with healing results for all components
        """
        results = {}
        with self.lock:
            # First check all components
            check_results = self.check_all_components()
            
            # Then try to heal components that are down
            for name, result in check_results.items():
                if result.get("status") == STATUS_DOWN:
                    component = self.components[name]
                    results[name] = component.heal()
                else:
                    results[name] = True
        
        return results

# Create health check manager
health_manager = HealthCheckManager()

@health_bp.route("/", methods=["GET"])
def health_check():
    """
    Health check endpoint
    
    Returns:
        JSON response with health check results
    """
    global health_cache
    
    # Check if cached result is still valid
    now = time.time()
    if now - health_cache["timestamp"] < CACHE_TTL:
        return jsonify({
            "status": health_cache["overall_status"],
            "components": health_cache["results"],
            "timestamp": datetime.datetime.utcfromtimestamp(health_cache["timestamp"]).isoformat(),
            "cached": True
        })
    
    # Get fresh results
    results = health_manager.check_all_components()
    overall_status = health_manager.get_overall_status(results)
    
    # Update cache
    health_cache = {
        "timestamp": now,
        "results": results,
        "overall_status": overall_status
    }
    
    return jsonify({
        "status": overall_status,
        "components": results,
        "timestamp": datetime.datetime.utcfromtimestamp(now).isoformat(),
        "cached": False
    })

@health_bp.route("/<component_name>", methods=["GET"])
def component_health_check(component_name):
    """
    Health check endpoint for a specific component
    
    Args:
        component_name: Name of the component to check
        
    Returns:
        JSON response with health check results
    """
    result = health_manager.check_component(component_name)
    
    return jsonify({
        "status": result.get("status", STATUS_UNKNOWN),
        "component": component_name,
        "details": result.get("details", {}),
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

@health_bp.route("/heal", methods=["POST"])
def heal_all_components():
    """
    Endpoint to attempt healing all components
    
    Returns:
        JSON response with healing results
    """
    results = health_manager.heal_all_components()
    
    return jsonify({
        "results": results,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

@health_bp.route("/heal/<component_name>", methods=["POST"])
def heal_component(component_name):
    """
    Endpoint to attempt healing a specific component
    
    Args:
        component_name: Name of the component to heal
        
    Returns:
        JSON response with healing result
    """
    result = health_manager.heal_component(component_name)
    
    return jsonify({
        "success": result,
        "component": component_name,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

def initialize_health_checks():
    """Initialize health checks"""
    # Register default components
    health_manager.register_component(DatabaseCheck())
    health_manager.register_component(FileSystemCheck())
    health_manager.register_component(SystemResourcesCheck())
    
    # Register Supabase check if enabled
    from config_loader import is_supabase_enabled
    if is_supabase_enabled():
        health_manager.register_component(SuperabaseCheck(critical=True))
    
    # Register cache check if configured
    if hasattr(current_app, 'cache'):
        health_manager.register_component(CacheCheck())
    
    logger.info("Health check system initialized")
    
    return health_manager

def register_blueprint(app):
    """
    Register health check blueprint with the application
    
    Args:
        app: Flask application
        
    Returns:
        Health check manager
    """
    app.register_blueprint(health_bp)
    
    # Initialize health checks
    with app.app_context():
        return initialize_health_checks()

if __name__ == "__main__":
    # This is mainly for testing
    from app import app
    
    with app.app_context():
        manager = initialize_health_checks()
        results = manager.check_all_components()
        
        print(json.dumps(results, indent=2))