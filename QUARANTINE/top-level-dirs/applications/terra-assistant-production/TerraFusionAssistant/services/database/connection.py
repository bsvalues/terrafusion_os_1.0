"""
Database Connection Module

This module provides a centralized database connection management system for the TerraFusion platform.
It handles connection pooling, session management, and transaction handling.
"""

import os
import logging
from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection settings
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise EnvironmentError("DATABASE_URL environment variable is not set")

# Engine configuration
engine_config = {
    'pool_size': 5,
    'max_overflow': 10,
    'pool_timeout': 30,
    'pool_recycle': 1800,
    'pool_pre_ping': True,
    'echo': False
}

# Create database engine
engine = create_engine(DATABASE_URL, poolclass=QueuePool, **engine_config)

# Create session factory
SessionFactory = sessionmaker(bind=engine)

# Create scoped session
Session = scoped_session(SessionFactory)


def get_db_session():
    """
    Get a database session.
    
    This function should be used as a context manager:
    
    with get_db_session() as session:
        # Do database operations
        
    Returns:
        SQLAlchemy Session
    """
    session = Session()
    try:
        yield session
    finally:
        session.close()


def init_db():
    """
    Initialize the database by creating all tables.
    
    This should be called during application startup.
    """
    from .models import Base
    
    try:
        Base.metadata.create_all(engine)
        logger.info("Database tables created successfully")
    except SQLAlchemyError as e:
        logger.error(f"Error creating database tables: {e}")
        raise


def close_db_connections():
    """
    Close all database connections.
    
    This should be called during application shutdown.
    """
    Session.remove()
    if engine is not None:
        engine.dispose()
        logger.info("Closed all database connections")


def get_connection_status():
    """
    Check the status of the database connection.
    
    Returns:
        dict: Connection status information
    """
    status = {
        'connected': False,
        'pool_size': engine.pool.size(),
        'checkedin': engine.pool.checkedin(),
        'checkedout': engine.pool.checkedout(),
        'overflow': engine.pool.overflow(),
        'error': None
    }
    
    try:
        # Try a simple query to check connection
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        status['connected'] = True
    except SQLAlchemyError as e:
        status['error'] = str(e)
    
    return status