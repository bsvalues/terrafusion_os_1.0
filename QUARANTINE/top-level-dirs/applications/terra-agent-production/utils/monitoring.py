import os
import logging
from logging.handlers import RotatingFileHandler
from prometheus_client import Counter, Gauge

# Define Prometheus metrics
QUERY_COUNTER = Counter(
    "pacs_queries_total",
    "Total number of queries processed by the PACS assistant",
    ["query_type"]  # Label for different query types
)

ERROR_COUNTER = Counter(
    "pacs_errors_total", 
    "Total number of errors encountered",
    ["error_type"]  # Label for different error types
)

RESPONSE_TIME = Gauge(
    "pacs_response_time_seconds",
    "Response time for queries in seconds",
    ["query_type"]  # Label for different query types
)

def setup_logging():
    """
    Set up structured logging for the application.
    
    Returns:
        logging.Logger: Configured logger
    """
    # Create logger
    logger = logging.getLogger("pacs_assistant")
    
    # Set log level from environment variable or default to INFO
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logger.setLevel(getattr(logging, log_level))
    
    # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Create file handler
    file_handler = RotatingFileHandler(
        "assistant.log",
        maxBytes=10485760,  # 10 MB
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    
    # Create formatter and add it to the handlers
    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    
    # Add handlers to logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    # Log startup info
    logger.info("Logging initialized")
    return logger

def record_query(query_type="general"):
    """
    Record a query in Prometheus metrics.
    
    Args:
        query_type (str): Type of query (general, rag, dbatools, levy, trends)
    """
    QUERY_COUNTER.labels(query_type=query_type).inc()

def record_error(error_type="general"):
    """
    Record an error in Prometheus metrics.
    
    Args:
        error_type (str): Type of error
    """
    ERROR_COUNTER.labels(error_type=error_type).inc()

def record_response_time(seconds, query_type="general"):
    """
    Record query response time in Prometheus metrics.
    
    Args:
        seconds (float): Response time in seconds
        query_type (str): Type of query
    """
    RESPONSE_TIME.labels(query_type=query_type).set(seconds)
