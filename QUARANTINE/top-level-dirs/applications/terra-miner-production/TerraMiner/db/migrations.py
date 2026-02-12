"""
Database migration functions for maintaining schema and performance optimizations.
This module contains functions to be run periodically to ensure database health.
"""
import logging
from sqlalchemy import text
from core import db

logger = logging.getLogger(__name__)

def create_performance_indexes():
    """
    Create database indexes to improve query performance.
    Can be run multiple times safely due to IF NOT EXISTS clause.
    """
    try:
        logger.info("Creating performance indexes...")
        
        # Create index on system_metric table
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_system_metric_component_timestamp 
            ON system_metric (component, timestamp DESC);
        """))
        
        # Create index on etl_schedule table
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_etl_schedule_enabled_next_run 
            ON etl_schedule (enabled, next_run);
        """))
        
        # Create index on monitoring_alert table
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_monitoring_alert_status_created_at 
            ON monitoring_alert (status, created_at DESC);
        """))
        
        # Create index on api_usage_log table
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_api_usage_log_timestamp 
            ON api_usage_log (timestamp DESC);
        """))
        
        # Create index on report_execution table
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_report_execution_status_execution_start 
            ON report_execution (status, execution_start DESC);
        """))
        
        db.session.commit()
        logger.info("Performance indexes created successfully")
        return True
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating performance indexes: {str(e)}")
        return False

def run_migrations():
    """
    Run all database migrations in the correct order.
    """
    try:
        logger.info("Running database migrations...")
        
        # Create indexes for performance
        create_performance_indexes()
        
        logger.info("Database migrations completed successfully")
        return True
    except Exception as e:
        logger.error(f"Error during database migrations: {str(e)}")
        return False