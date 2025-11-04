#!/usr/bin/env python
"""
Logging Configuration for GeoAssessmentPro

This module provides environment-specific logging configuration,
including structured JSON logging for production and detailed logging for development.
"""

import os
import sys
import logging
import json
import time
import datetime
import socket
import traceback
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from flask import request, has_request_context, current_app
from pythonjsonlogger import jsonlogger
from typing import Dict, Any, Optional

# Constants
DEFAULT_LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DEFAULT_JSON_FORMAT = "%(timestamp)s %(level)s %(name)s %(message)s %(pathname)s %(lineno)d"
DEFAULT_LOG_LEVEL = "INFO"
LOG_DIRECTORY = "logs"
MAX_BYTES = 10 * 1024 * 1024  # 10 MB
BACKUP_COUNT = 10

class RequestFormatter(logging.Formatter):
    """Custom formatter to add request info to log records"""
    
    def format(self, record):
        """Format log record with request info"""
        if has_request_context():
            record.url = request.url
            record.remote_addr = request.remote_addr
            record.method = request.method
            record.path = request.path
            
            # Add user info if available
            if hasattr(current_app, 'login_manager') and hasattr(current_app.login_manager, 'current_user'):
                user = current_app.login_manager.current_user
                if user and hasattr(user, 'is_authenticated') and user.is_authenticated:
                    record.user_id = user.id
                    record.username = user.username
                else:
                    record.user_id = None
                    record.username = None
            else:
                record.user_id = None
                record.username = None
        else:
            record.url = None
            record.remote_addr = None
            record.method = None
            record.path = None
            record.user_id = None
            record.username = None
        
        return super().format(record)

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional fields"""
    
    def add_fields(self, log_record, record, message_dict):
        """Add custom fields to the log record"""
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp
        log_record['timestamp'] = datetime.datetime.utcnow().isoformat()
        log_record['level'] = record.levelname
        
        # Add application info
        log_record['app'] = "geoassessmentpro"
        log_record['hostname'] = socket.gethostname()
        
        # Add environment info
        if hasattr(current_app, 'config'):
            log_record['environment'] = current_app.config.get('ENV_MODE', 'development')
        else:
            log_record['environment'] = os.environ.get('ENV_MODE', 'development')
        
        # Add request info if available
        if hasattr(record, 'url') and record.url:
            log_record['request'] = {
                'url': record.url,
                'method': record.method,
                'path': record.path,
                'remote_addr': record.remote_addr
            }
        
        # Add user info if available
        if hasattr(record, 'user_id') and record.user_id:
            log_record['user'] = {
                'id': record.user_id,
                'username': record.username
            }
        
        # Add exception info if available
        if record.exc_info:
            log_record['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }

def get_development_config() -> Dict[str, Any]:
    """
    Get logging configuration for development environment
    
    Returns:
        Dict with logging configuration
    """
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': DEFAULT_LOG_FORMAT
            },
            'colored': {
                '()': 'colorlog.ColoredFormatter',
                'format': '%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                'log_colors': {
                    'DEBUG': 'cyan',
                    'INFO': 'green',
                    'WARNING': 'yellow',
                    'ERROR': 'red',
                    'CRITICAL': 'red,bg_white'
                }
            },
            'request': {
                '()': RequestFormatter,
                'format': '%(asctime)s - %(name)s - %(levelname)s - [%(method)s %(url)s] - %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': 'DEBUG',
                'formatter': 'colored',
                'stream': 'ext://sys.stdout'
            },
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'DEBUG',
                'formatter': 'standard',
                'filename': os.path.join(LOG_DIRECTORY, 'development.log'),
                'maxBytes': MAX_BYTES,
                'backupCount': BACKUP_COUNT
            },
            'request_file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'INFO',
                'formatter': 'request',
                'filename': os.path.join(LOG_DIRECTORY, 'requests.log'),
                'maxBytes': MAX_BYTES,
                'backupCount': BACKUP_COUNT
            }
        },
        'loggers': {
            '': {
                'handlers': ['console', 'file'],
                'level': 'DEBUG',
                'propagate': True
            },
            'werkzeug': {
                'handlers': ['console', 'request_file'],
                'level': 'INFO',
                'propagate': False
            },
            'sqlalchemy.engine': {
                'handlers': ['console', 'file'],
                'level': 'INFO',
                'propagate': False
            }
        }
    }
    
    return config

def get_training_config() -> Dict[str, Any]:
    """
    Get logging configuration for training environment
    
    Returns:
        Dict with logging configuration
    """
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': DEFAULT_LOG_FORMAT
            },
            'request': {
                '()': RequestFormatter,
                'format': '%(asctime)s - %(name)s - %(levelname)s - [%(method)s %(url)s] - %(message)s'
            },
            'json': {
                '()': CustomJsonFormatter,
                'format': DEFAULT_JSON_FORMAT
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': 'INFO',
                'formatter': 'standard',
                'stream': 'ext://sys.stdout'
            },
            'file': {
                'class': 'logging.handlers.TimedRotatingFileHandler',
                'level': 'INFO',
                'formatter': 'standard',
                'filename': os.path.join(LOG_DIRECTORY, 'training.log'),
                'when': 'midnight',
                'interval': 1,
                'backupCount': 30
            },
            'request_file': {
                'class': 'logging.handlers.TimedRotatingFileHandler',
                'level': 'INFO',
                'formatter': 'request',
                'filename': os.path.join(LOG_DIRECTORY, 'requests.log'),
                'when': 'midnight',
                'interval': 1,
                'backupCount': 30
            },
            'error_file': {
                'class': 'logging.handlers.TimedRotatingFileHandler',
                'level': 'ERROR',
                'formatter': 'json',
                'filename': os.path.join(LOG_DIRECTORY, 'errors.log'),
                'when': 'midnight',
                'interval': 1,
                'backupCount': 30
            }
        },
        'loggers': {
            '': {
                'handlers': ['console', 'file', 'error_file'],
                'level': 'INFO',
                'propagate': True
            },
            'werkzeug': {
                'handlers': ['console', 'request_file'],
                'level': 'INFO',
                'propagate': False
            },
            'sqlalchemy.engine': {
                'handlers': ['file'],
                'level': 'WARNING',
                'propagate': False
            }
        }
    }
    
    return config

def get_production_config() -> Dict[str, Any]:
    """
    Get logging configuration for production environment
    
    Returns:
        Dict with logging configuration
    """
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': DEFAULT_LOG_FORMAT
            },
            'json': {
                '()': CustomJsonFormatter,
                'format': DEFAULT_JSON_FORMAT
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': 'WARNING',
                'formatter': 'json',
                'stream': 'ext://sys.stdout'
            },
            'file': {
                'class': 'logging.handlers.TimedRotatingFileHandler',
                'level': 'INFO',
                'formatter': 'json',
                'filename': os.path.join(LOG_DIRECTORY, 'production.log'),
                'when': 'midnight',
                'interval': 1,
                'backupCount': 90
            },
            'error_file': {
                'class': 'logging.handlers.TimedRotatingFileHandler',
                'level': 'ERROR',
                'formatter': 'json',
                'filename': os.path.join(LOG_DIRECTORY, 'errors.log'),
                'when': 'midnight',
                'interval': 1,
                'backupCount': 90
            }
        },
        'loggers': {
            '': {
                'handlers': ['console', 'file', 'error_file'],
                'level': 'INFO',
                'propagate': True
            },
            'werkzeug': {
                'handlers': ['file'],
                'level': 'WARNING',
                'propagate': False
            },
            'sqlalchemy.engine': {
                'handlers': ['file'],
                'level': 'WARNING',
                'propagate': False
            }
        }
    }
    
    return config

def configure_logging(environment: Optional[str] = None) -> None:
    """
    Configure logging based on environment
    
    Args:
        environment: Environment to configure logging for (development, training, production)
                    If None, will use ENV_MODE from environment variable or default to development
    """
    # Get environment
    if environment is None:
        environment = os.environ.get("ENV_MODE", "development")
    
    # Create log directory if it doesn't exist
    if not os.path.exists(LOG_DIRECTORY):
        os.makedirs(LOG_DIRECTORY, exist_ok=True)
    
    # Get configuration based on environment
    if environment == "production":
        config = get_production_config()
    elif environment == "training":
        config = get_training_config()
    else:
        config = get_development_config()
    
    # Configure logging
    import logging.config
    logging.config.dictConfig(config)
    
    # Log configuration
    logger = logging.getLogger(__name__)
    logger.info(f"Configured logging for {environment} environment")

def get_logger(name: str) -> logging.Logger:
    """
    Get logger with given name
    
    Args:
        name: Logger name
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)

class FlaskAppLoggerConfigurator:
    """Configure Flask app logger"""
    
    @staticmethod
    def init_app(app) -> None:
        """
        Initialize Flask app logger
        
        Args:
            app: Flask application
        """
        # Get environment
        environment = app.config.get("ENV_MODE", "development")
        
        # Configure logging
        configure_logging(environment)
        
        # Update Flask logger
        app.logger.setLevel(logging.INFO)
        
        # Add request info to logs
        @app.before_request
        def log_request_info():
            """Log request info"""
            if environment != "production":  # Don't log all requests in production
                app.logger.debug(f"Request: {request.method} {request.path}")
        
        @app.after_request
        def log_response_info(response):
            """Log response info"""
            if environment != "production" or response.status_code >= 400:
                app.logger.info(f"Response: {request.method} {request.path} {response.status_code}")
            return response
        
        app.logger.info(f"Flask app logger configured for {environment} environment")

def register_logging_with_app(app) -> None:
    """
    Register logging with Flask app
    
    Args:
        app: Flask application
    """
    FlaskAppLoggerConfigurator.init_app(app)

if __name__ == "__main__":
    # This is mainly for testing
    configure_logging("development")
    logger = get_logger("test")
    
    logger.debug("This is a debug message")
    logger.info("This is an info message")
    logger.warning("This is a warning message")
    logger.error("This is an error message")
    
    try:
        raise ValueError("Test exception")
    except Exception as e:
        logger.exception("This is an exception message")