"""
Middleware for API monitoring and metrics collection.
"""
import time
import logging
import json
from flask import request, g, current_app
from functools import wraps

from app import db
# Import models when needed to avoid circular imports
# from models import APIUsageLog, SystemMetric

# Set up logging
logger = logging.getLogger(__name__)

def log_api_request(f):
    """Decorator to log API requests and response times."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip logging for monitoring endpoints to avoid recursion
        if request.endpoint and (
            request.endpoint.startswith('monitoring_api') or 
            request.endpoint == 'health_check' or
            request.endpoint == 'static'
        ):
            return f(*args, **kwargs)
        
        # Record start time
        start_time = time.time()
        
        # Store start time in g for possible use in the view
        g.request_start_time = start_time
        
        # Attempt to get the request payload
        request_payload = None
        if request.method in ['POST', 'PUT'] and request.is_json:
            try:
                # Make a copy of the request data to avoid consuming it
                request_payload = json.dumps(request.get_json())
            except:
                # If we can't get JSON data, ignore it
                pass
        
        # Execute the request
        response = f(*args, **kwargs)
        
        # Calculate response time
        response_time = time.time() - start_time
        
        try:
            # Import models here to avoid circular imports
            from models import APIUsageLog, SystemMetric
            
            # Create log entry
            log = APIUsageLog(
                endpoint=request.path,
                method=request.method,
                status_code=response.status_code,
                response_time=response_time,
                user_agent=request.user_agent.string if request.user_agent else None,
                ip_address=request.remote_addr,
                request_payload=request_payload
            )
            
            # Add and commit to database
            db.session.add(log)
            db.session.commit()
            
            # If this is a slow request (>1s), record it as a metric too
            if response_time > 1.0:
                metric = SystemMetric(
                    metric_name="slow_request",
                    metric_value=response_time,
                    metric_unit="seconds",
                    category="performance",
                    component="api"
                )
                db.session.add(metric)
                db.session.commit()
            
        except Exception as e:
            logger.error(f"Error logging API request: {str(e)}")
            db.session.rollback()
        
        return response
    
    return decorated_function

def setup_monitoring(app):
    """
    Setup monitoring middleware on a Flask app.
    
    This adds request timing, API usage logging, and basic error tracking.
    """
    # Register before_request handler for timing
    @app.before_request
    def before_request():
        g.request_start_time = time.time()
    
    # Register after_request handler for monitoring
    @app.after_request
    def after_request(response):
        # Skip logging for static files and monitoring endpoints
        if request.endpoint and (
            request.endpoint.startswith('static') or 
            request.endpoint.startswith('monitoring_api') or
            request.endpoint == 'health_check'
        ):
            return response
        
        # Calculate response time if before_request was executed
        if hasattr(g, 'request_start_time'):
            response_time = time.time() - g.request_start_time
            
            # Add response time header
            response.headers['X-Response-Time'] = f"{response_time:.6f}s"
            
            # Log slow responses (>1s)
            if response_time > 1.0:
                logger.warning(f"Slow request: {request.method} {request.path} took {response_time:.2f}s")
        
        return response
    
    # Register error handler for 500 errors
    @app.errorhandler(500)
    def internal_server_error(error):
        try:
            # Import models here to avoid circular imports
            from models import SystemMetric
            
            # Record server error as a metric
            metric = SystemMetric(
                metric_name="server_error",
                metric_value=1.0,
                category="errors",
                component="api"
            )
            db.session.add(metric)
            db.session.commit()
            
            # Log the error
            logger.error(f"Server error: {str(error)}")
            
        except Exception as e:
            logger.error(f"Error recording error metric: {str(e)}")
            db.session.rollback()
        
        # Return the original error response
        return error
    
    logger.info("API monitoring middleware initialized")
    return app