"""
Database initialization script for the Sync Service.

This script creates the necessary database tables and initializes the basic 
configuration for the sync service. It should be run once when setting up the
sync service for the first time.
"""
import os
import sys
import datetime
import logging
from sqlalchemy import text

# Add the parent directory to the path so we can import from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import db, app
from sync_service.models import (
    TableConfiguration, FieldConfiguration, FieldDefaultValue, PrimaryKeyColumn,
    LookupTableConfiguration, GlobalSetting, SyncJob
)

logger = logging.getLogger(__name__)

def create_tables():
    """Create all necessary tables in the database."""
    with app.app_context():
        try:
            # Create tables
            db.create_all()
            logger.info("Created all tables successfully")
            return True
        except Exception as e:
            logger.error(f"Error creating tables: {str(e)}")
            return False

def initialize_global_settings():
    """Initialize global settings."""
    with app.app_context():
        try:
            # Check if global settings already exist
            if GlobalSetting.query.first():
                logger.info("Global settings already exist, skipping initialization")
                return True
            
            # Create default global settings
            global_settings = GlobalSetting(
                cama_cloud_state="initialized",
                last_sync_time=datetime.datetime.utcnow(),
                last_down_sync_time=datetime.datetime.utcnow(),
                image_upload_completed_time=datetime.datetime.utcnow(),
                current_table=0,
                total_tables=0,
                total_photo_pages=0,
                current_photo_page=0,
                total_number_of_lookup_tables=0,
                current_lookup_tables_uploaded=0,
                is_property_table_complete=False,
                has_photos=False,
                is_finalized=False,
                last_change_id=0,
                relink_assignment_group=False
            )
            
            db.session.add(global_settings)
            db.session.commit()
            logger.info("Initialized global settings")
            return True
        except Exception as e:
            logger.error(f"Error initializing global settings: {str(e)}")
            db.session.rollback()
            return False

def import_table_configurations():
    """Import table configurations from SQL files."""
    with app.app_context():
        try:
            # Check if table configurations already exist
            if TableConfiguration.query.first():
                logger.info("Table configurations already exist, skipping import")
                return True
                
            # Example: Import the main property table configuration
            property_table = TableConfiguration(
                name="property",
                join_table=None,
                join_sql=None,
                order=1,
                total_pages=0,
                current_page=0,
                is_flat=True,
                is_lookup=False,
                is_controller=True,
                sub_select=None,
                order_by_sql="property_id ASC"
            )
            
            db.session.add(property_table)
            db.session.commit()
            
            # Add primary key columns
            property_pk = PrimaryKeyColumn(
                table_name="property",
                name="property_id",
                order=1
            )
            
            db.session.add(property_pk)
            db.session.commit()
            
            # Add field configurations for the property table
            property_fields = [
                FieldConfiguration(table_name="property", name="property_id", policy_type=1, type="int", label="Property ID"),
                FieldConfiguration(table_name="property", name="parcel_number", policy_type=1, type="string", length=50, label="Parcel Number"),
                FieldConfiguration(table_name="property", name="address", policy_type=1, type="string", length=255, label="Address"),
                FieldConfiguration(table_name="property", name="owner_name", policy_type=1, type="string", length=255, label="Owner Name"),
                FieldConfiguration(table_name="property", name="property_class", policy_type=1, type="string", length=50, label="Property Class"),
                FieldConfiguration(table_name="property", name="last_modified", policy_type=1, type="datetime", label="Last Modified")
            ]
            
            for field in property_fields:
                db.session.add(field)
            
            db.session.commit()
            logger.info("Imported table configurations")
            return True
        except Exception as e:
            logger.error(f"Error importing table configurations: {str(e)}")
            db.session.rollback()
            return False

def import_lookup_tables():
    """Import lookup table configurations."""
    with app.app_context():
        try:
            # Check if lookup configurations already exist
            if LookupTableConfiguration.query.first():
                logger.info("Lookup table configurations already exist, skipping import")
                return True
                
            # Example: Import property class lookup table
            property_class_lookup = LookupTableConfiguration(
                name="property_class_lookup",
                code_column_name="code",
                desc_column_name="description",
                where_condition=None,
                join_condition=None,
                order_by_sql="code ASC",
                is_transferred=False,
                has_none=True,
                null_code="NONE",
                null_description="None"
            )
            
            db.session.add(property_class_lookup)
            db.session.commit()
            
            logger.info("Imported lookup table configurations")
            return True
        except Exception as e:
            logger.error(f"Error importing lookup table configurations: {str(e)}")
            db.session.rollback()
            return False

def main():
    """Main initialization function."""
    logger.info("Starting sync service database initialization")
    
    # Create tables
    if not create_tables():
        logger.error("Failed to create tables, exiting")
        return False
    
    # Initialize global settings
    if not initialize_global_settings():
        logger.error("Failed to initialize global settings, exiting")
        return False
    
    # Import table configurations
    if not import_table_configurations():
        logger.error("Failed to import table configurations, exiting")
        return False
    
    # Import lookup tables
    if not import_lookup_tables():
        logger.error("Failed to import lookup tables, exiting")
        return False
    
    logger.info("Sync service database initialization completed successfully")
    return True

if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    success = main()
    sys.exit(0 if success else 1)