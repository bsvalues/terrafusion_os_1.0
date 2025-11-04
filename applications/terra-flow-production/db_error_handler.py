#!/usr/bin/env python
"""
Database Error Handler for GeoAssessmentPro

This module provides specialized error handling for database operations,
with detailed logging and recovery strategies for common database issues.
"""

import os
import sys
import logging
import time
import traceback
import functools
from typing import Dict, Any, Optional, Callable, TypeVar, cast

# SQLAlchemy imports
try:
    from sqlalchemy.exc import SQLAlchemyError, OperationalError, DatabaseError, DisconnectionError
    from sqlalchemy.engine import Engine
    from sqlalchemy.pool import Pool
    from flask_sqlalchemy import SQLAlchemy
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False

# Type variables for function signatures
F = TypeVar('F', bound=Callable[..., Any])
T = TypeVar('T')

# Configure logger
logger = logging.getLogger(__name__)

# Default retry settings
DEFAULT_MAX_RETRIES = 3
DEFAULT_RETRY_DELAY = 0.5  # seconds
DEFAULT_RETRY_BACKOFF = 2.0  # Exponential backoff multiplier

class DatabaseErrorHandler:
    """Handler for database errors with retry logic and detailed logging"""
    
    def __init__(self, db: Optional[SQLAlchemy] = None):
        """
        Initialize database error handler
        
        Args:
            db: SQLAlchemy database instance
        """
        self.db = db
        self.max_retries = int(os.environ.get("DB_MAX_RETRIES", DEFAULT_MAX_RETRIES))
        self.retry_delay = float(os.environ.get("DB_RETRY_DELAY", DEFAULT_RETRY_DELAY))
        self.retry_backoff = float(os.environ.get("DB_RETRY_BACKOFF", DEFAULT_RETRY_BACKOFF))
        
        # Register event listeners if SQLAlchemy is available
        if SQLALCHEMY_AVAILABLE and db is not None:
            self._register_sqlalchemy_event_listeners(db)
    
    def _register_sqlalchemy_event_listeners(self, db: SQLAlchemy) -> None:
        """
        Register SQLAlchemy event listeners for connection errors
        
        Args:
            db: SQLAlchemy database instance
        """
        if not SQLALCHEMY_AVAILABLE:
            logger.warning("SQLAlchemy not available, cannot register event listeners")
            return
        
        try:
            from sqlalchemy import event
            
            # Handle checkout failures (connection checkout from pool)
            @event.listens_for(db.engine.pool, 'checkout')
            def handle_checkout(dbapi_connection, connection_record, connection_proxy):
                try:
                    # Verify connection is active
                    cursor = dbapi_connection.cursor()
                    cursor.execute('SELECT 1')
                    cursor.close()
                except Exception as e:
                    # Connection failed, log detailed information
                    logger.error(
                        f"Connection checkout failed: {str(e)}",
                        extra={
                            'db_operation': 'connection_checkout',
                            'db_connection_info': self._get_sanitized_connection_info(db.engine)
                        },
                        exc_info=True
                    )
                    
                    # Let SQLAlchemy handle the reconnection
                    raise
            
            # Handle engine connect events
            @event.listens_for(db.engine, 'connect')
            def handle_connect(dbapi_connection, connection_record):
                logger.debug(
                    f"New database connection established",
                    extra={'db_operation': 'connect'}
                )
            
            # Handle engine disconnect events
            @event.listens_for(db.engine, 'disconnect')
            def handle_disconnect(dbapi_connection, connection_record):
                logger.info(
                    f"Database connection closed",
                    extra={'db_operation': 'disconnect'}
                )
            
            logger.info("Registered SQLAlchemy event listeners for database connections")
        except Exception as e:
            logger.warning(f"Failed to register SQLAlchemy event listeners: {str(e)}")
    
    def _get_sanitized_connection_info(self, engine: Engine) -> Dict[str, Any]:
        """
        Get sanitized connection information from SQLAlchemy engine
        
        Args:
            engine: SQLAlchemy engine
            
        Returns:
            Dict with sanitized connection information
        """
        if not SQLALCHEMY_AVAILABLE:
            return {}
        
        try:
            conn_info = {}
            
            # Get URL components
            if hasattr(engine, 'url'):
                url = engine.url
                conn_info['dialect'] = url.get_dialect().name
                conn_info['driver'] = url.get_driver_name()
                conn_info['username'] = url.username
                conn_info['database'] = url.database
                conn_info['host'] = url.host
                conn_info['port'] = url.port
                
                # Include SSL mode if present
                if hasattr(engine, 'dialect') and hasattr(engine.dialect, 'connect_args'):
                    connect_args = engine.dialect.connect_args
                    if 'sslmode' in connect_args:
                        conn_info['sslmode'] = connect_args['sslmode']
            
            return conn_info
        except Exception as e:
            logger.warning(f"Failed to get connection info: {str(e)}")
            return {}
    
    def retry_on_db_error(self, max_retries: Optional[int] = None, 
                         retry_delay: Optional[float] = None,
                         retry_backoff: Optional[float] = None) -> Callable[[F], F]:
        """
        Decorator to retry database operations on transient errors
        
        Args:
            max_retries: Maximum number of retries (default: self.max_retries)
            retry_delay: Initial delay between retries in seconds (default: self.retry_delay)
            retry_backoff: Backoff multiplier for each retry (default: self.retry_backoff)
            
        Returns:
            Decorator function
        """
        # Use instance defaults if not specified
        max_retries = max_retries if max_retries is not None else self.max_retries
        retry_delay = retry_delay if retry_delay is not None else self.retry_delay
        retry_backoff = retry_backoff if retry_backoff is not None else self.retry_backoff
        
        def decorator(func: F) -> F:
            @functools.wraps(func)
            def wrapper(*args: Any, **kwargs: Any) -> Any:
                retries = 0
                delay = retry_delay
                last_error = None
                
                # Get function info for logging
                func_name = func.__name__
                func_module = func.__module__
                
                while retries <= max_retries:
                    try:
                        return func(*args, **kwargs)
                    except Exception as e:
                        # Only retry on database errors that might be transient
                        if SQLALCHEMY_AVAILABLE and isinstance(e, (OperationalError, DisconnectionError)):
                            last_error = e
                            retries += 1
                            
                            # Log retry attempt
                            if retries <= max_retries:
                                logger.warning(
                                    f"Database operation failed, retrying ({retries}/{max_retries}): {str(e)}",
                                    extra={
                                        'db_operation': func_name,
                                        'db_retry_count': retries,
                                        'db_retry_max': max_retries,
                                        'db_retry_delay': delay,
                                        'feature': f"{func_module}.{func_name}"
                                    },
                                    exc_info=True
                                )
                                
                                # Wait before retrying
                                time.sleep(delay)
                                
                                # Increase delay for next retry (exponential backoff)
                                delay *= retry_backoff
                            else:
                                # Max retries exceeded, log error
                                logger.error(
                                    f"Database operation failed after {max_retries} retries: {str(e)}",
                                    extra={
                                        'db_operation': func_name,
                                        'db_retry_count': retries,
                                        'db_retry_max': max_retries,
                                        'feature': f"{func_module}.{func_name}"
                                    },
                                    exc_info=True
                                )
                                raise
                        else:
                            # Not a retriable error, re-raise
                            raise
                
                # Should never reach here, but just in case
                if last_error:
                    raise last_error
                
                # Return None if no error occurred but also no return value
                return None
            
            return cast(F, wrapper)
        
        return decorator
    
    def handle_db_error(self, e: Exception, operation: str, 
                       table: Optional[str] = None, 
                       query: Optional[str] = None) -> None:
        """
        Handle database error with detailed logging
        
        Args:
            e: Exception to handle
            operation: Database operation that failed
            table: Database table (optional)
            query: Database query (optional)
        """
        # Get error details
        error_cls = e.__class__.__name__
        error_msg = str(e)
        
        # Log error with detailed information
        logger.error(
            f"Database error in {operation}: {error_cls}: {error_msg}",
            extra={
                'db_operation': operation,
                'db_table': table,
                'db_query': query,
                'db_connection_info': self._get_sanitized_connection_info(self.db.engine) if self.db else {}
            },
            exc_info=True
        )
        
        # Provide recovery hints based on error type
        if SQLALCHEMY_AVAILABLE:
            if isinstance(e, DisconnectionError):
                logger.info("Disconnection detected, engine will automatically reconnect")
            elif isinstance(e, OperationalError):
                if "SSL" in error_msg:
                    logger.warning(
                        "SSL connection error detected. Check SSL configuration and ensure"
                        " DB_USE_SSL environment variable is set correctly."
                    )
                elif "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                    logger.warning("Connection timeout detected. Check network settings and database load.")
                elif "connection" in error_msg.lower():
                    logger.warning("Connection error detected. Check database availability and credentials.")

# Create a global instance for use throughout the application
db_error_handler = DatabaseErrorHandler()

def setup_error_handler(db: SQLAlchemy) -> DatabaseErrorHandler:
    """
    Set up the database error handler with a SQLAlchemy instance
    
    Args:
        db: SQLAlchemy database instance
        
    Returns:
        Configured DatabaseErrorHandler instance
    """
    global db_error_handler
    db_error_handler = DatabaseErrorHandler(db)
    return db_error_handler

# Export decorator for easy use
retry_on_db_error = db_error_handler.retry_on_db_error