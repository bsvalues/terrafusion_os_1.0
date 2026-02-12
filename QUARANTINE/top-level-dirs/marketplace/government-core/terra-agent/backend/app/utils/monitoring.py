"""
Monitoring utilities for TerraAgent backend
Production-grade logging, metrics, and query tracking
"""

import logging
import structlog
import datetime
import time
from prometheus_client import Counter, Histogram, Gauge
from flask import request, session
from app.models.query_log import QueryLog
from app import db

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.dev.ConsoleRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# Prometheus metrics
QUERY_COUNTER = Counter('terraagent_queries_total', 'Total queries processed', ['query_type', 'status'])
QUERY_DURATION = Histogram('terraagent_query_duration_seconds', 'Query processing time')
ACTIVE_CONNECTIONS = Gauge('terraagent_active_connections', 'Active database connections')
ERROR_COUNTER = Counter('terraagent_errors_total', 'Total errors', ['error_type'])

def setup_logging():
    """Setup production-grade logging configuration"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('terraagent.log')
        ]
    )
    
    # Create structured logger
    logger = structlog.get_logger("terraagent")
    
    return logger

def log_query(query_text, query_type=None, response_text=None, response_time=None, 
              status="success", error_message=None, confidence_score=None):
    """Log query with performance metrics"""
    try:
        # Get request context
        user_session = session.get('user_id', 'anonymous') if session else 'system'
        ip_address = request.remote_addr if request else '127.0.0.1'
        user_agent = request.headers.get('User-Agent') if request else 'system'
        
        # Create query log entry
        query_log = QueryLog(
            query_text=query_text,
            query_type=query_type or 'general',
            response_text=response_text,
            response_time=response_time,
            status=status,
            error_message=error_message,
            user_session=user_session,
            ip_address=ip_address,
            user_agent=user_agent,
            confidence_score=confidence_score,
            timestamp=datetime.datetime.utcnow()
        )
        
        db.session.add(query_log)
        db.session.commit()
        
        # Update Prometheus metrics
        QUERY_COUNTER.labels(query_type=query_type or 'general', status=status).inc()
        
        if response_time:
            QUERY_DURATION.observe(response_time)
        
        if status == 'error':
            ERROR_COUNTER.labels(error_type=query_type or 'general').inc()
        
    except Exception as e:
        # Don't let logging errors break the application
        logging.error(f"Failed to log query: {str(e)}")

def monitor_performance(func):
    """Decorator to monitor function performance"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            end_time = time.time()
            
            # Log successful execution
            log_query(
                query_text=f"Function: {func.__name__}",
                query_type="function_call",
                response_time=end_time - start_time,
                status="success"
            )
            
            return result
            
        except Exception as e:
            end_time = time.time()
            
            # Log error
            log_query(
                query_text=f"Function: {func.__name__}",
                query_type="function_call",
                response_time=end_time - start_time,
                status="error",
                error_message=str(e)
            )
            
            raise
    
    return wrapper

def get_system_health():
    """Get system health metrics"""
    try:
        # Database health
        db_health = True
        try:
            db.session.execute('SELECT 1')
        except:
            db_health = False
        
        # Query statistics
        recent_queries = QueryLog.query.filter(
            QueryLog.timestamp >= datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        ).count()
        
        error_rate = 0
        if recent_queries > 0:
            recent_errors = QueryLog.query.filter(
                QueryLog.timestamp >= datetime.datetime.utcnow() - datetime.timedelta(hours=1),
                QueryLog.status == 'error'
            ).count()
            error_rate = (recent_errors / recent_queries) * 100
        
        # Average response time
        avg_response_time = db.session.query(
            db.func.avg(QueryLog.response_time)
        ).filter(
            QueryLog.timestamp >= datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        ).scalar() or 0
        
        return {
            'database_healthy': db_health,
            'recent_queries': recent_queries,
            'error_rate_percent': round(error_rate, 2),
            'avg_response_time': round(avg_response_time, 3),
            'timestamp': datetime.datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            'database_healthy': False,
            'error': str(e),
            'timestamp': datetime.datetime.utcnow().isoformat()
        }

class QueryTimer:
    """Context manager for timing queries"""
    
    def __init__(self, query_text, query_type=None):
        self.query_text = query_text
        self.query_type = query_type
        self.start_time = None
        self.end_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.time()
        
        if exc_type is None:
            # Success
            log_query(
                query_text=self.query_text,
                query_type=self.query_type,
                response_time=self.end_time - self.start_time,
                status="success"
            )
        else:
            # Error occurred
            log_query(
                query_text=self.query_text,
                query_type=self.query_type,
                response_time=self.end_time - self.start_time,
                status="error",
                error_message=str(exc_val)
            )
