"""
Database migration script to create sync service tables.

This script creates all the necessary tables for the sync service.
"""

from app import db, app
from sync_service.models import *
import logging

logger = logging.getLogger(__name__)

def create_sync_tables():
    """
    Create all sync service tables in the database.
    """
    with app.app_context():
        try:
            logger.info("Creating sync service tables...")
            # Create all tables defined in the models
            db.create_all()
            logger.info("Sync service tables created successfully.")
            return True
        except Exception as e:
            logger.error(f"Error creating sync service tables: {str(e)}")
            return False

def drop_sync_tables():
    """
    Drop all sync service tables from the database.
    """
    with app.app_context():
        try:
            logger.info("Dropping sync service tables...")
            # Drop all tables defined in the models
            models = [
                GlobalSetting, 
                ParcelChangeIndexLog, 
                UpSyncDataChangeArchive,
                UpSyncDataChange, 
                DataChangeMap, 
                PhotoMap,
                ParcelMap, 
                PrimaryKeyColumn, 
                FieldDefaultValue,
                FieldConfiguration, 
                LookupTableConfiguration,
                TableConfiguration
            ]
            
            for model in models:
                model.__table__.drop(db.engine, checkfirst=True)
                
            logger.info("Sync service tables dropped successfully.")
            return True
        except Exception as e:
            logger.error(f"Error dropping sync service tables: {str(e)}")
            return False

def reset_sync_tables():
    """
    Reset all sync service tables (drop and recreate).
    """
    drop_sync_tables()
    create_sync_tables()
    logger.info("Sync service tables reset successfully.")
    
if __name__ == "__main__":
    create_sync_tables()