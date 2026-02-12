"""
TerraFusion SyncService Logging Configuration

This module provides centralized logging configuration for the TerraFusion SyncService platform.
"""

import os
import logging
from logging.handlers import RotatingFileHandler

# Directory for log files
LOG_DIR = os.path.join(os.getcwd(), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

# Log file paths
API_GATEWAY_LOG = os.path.join(LOG_DIR, 'api_gateway.log')
SYNC_SERVICE_LOG = os.path.join(LOG_DIR, 'sync_service.log')
MONITORING_LOG = os.path.join(LOG_DIR, 'monitoring.log')
DATABASE_LOG = os.path.join(LOG_DIR, 'database.log')

# Log rotation settings (7 days, 100MB per file)
MAX_LOG_SIZE = 100 * 1024 * 1024  # 100 MB
BACKUP_COUNT = 7


def configure_logger(name, log_file=None, level=logging.INFO):
    """
    Configure a logger with the standard format and optional file output.
    
    Args:
        name: Name of the logger
        log_file: Path to the log file (optional)
        level: Logging level
        
    Returns:
        Configured logger
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Clear existing handlers to avoid duplicates
    if logger.hasHandlers():
        logger.handlers.clear()
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Create file handler if log file specified
    if log_file:
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=MAX_LOG_SIZE,
            backupCount=BACKUP_COUNT,
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


def configure_api_gateway_logging():
    """Configure logging for the API Gateway."""
    return configure_logger('api_gateway', API_GATEWAY_LOG)


def configure_sync_service_logging():
    """Configure logging for the SyncService."""
    return configure_logger('sync_service', SYNC_SERVICE_LOG)


def configure_monitoring_logging():
    """Configure logging for the monitoring service."""
    return configure_logger('monitoring_service', MONITORING_LOG)


def configure_database_logging():
    """Configure logging for database operations."""
    # Database logging at debug level for detailed SQL
    return configure_logger('sqlalchemy.engine', DATABASE_LOG, logging.WARNING)