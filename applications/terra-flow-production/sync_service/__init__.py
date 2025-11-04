"""
Benton County Data Hub Sync Service

This module provides functionality for synchronizing data between
production databases and the training environment through the Data Hub API Gateway.
It also includes property export functionality for executing the ExportPropertyAccess
stored procedure against SQL Server.

Features include:
- Scheduled synchronization through APScheduler
- Bidirectional sync capabilities
- Conflict detection and resolution
- Data sanitization for protecting sensitive information
- Enhanced notification/alerting system for monitoring sync operations
"""
import logging
import threading

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Basic imports that don't cause circular dependencies
import os
import logging
from flask import Blueprint

# Create logger
logger = logging.getLogger(__name__)

# Create the blueprints - these will be registered by the app
sync_bp = Blueprint('sync', __name__, url_prefix='/sync')

def create_routes():
    """Create routes for sync_bp. This must be called before registering the blueprint."""
    # Local import to avoid circular dependencies
    from sync_service.routes_module import register_sync_routes
    
    # Register the routes with the blueprint
    register_sync_routes(sync_bp)
    
    # Initialize scheduler and other components
    def init_services_in_thread():
        try:
            from sync_service.app_context import with_app_context
            from sync_service.scheduler import init_scheduler
            from sync_service.notification_system import configure_notification_manager, notification_manager
            from sync_service.data_quality_notifications import notification_manager as dq_notification_manager, check_data_quality_alerts
            from app import db
            
            # Make sure we run initialization in an app context
            @with_app_context
            def initialize_notification_manager():
                try:
                    # Initialize notification manager first in its own transaction
                    logger.info("Configuring notification manager...")
                    configure_notification_manager()
                    logger.info(f"Notification manager configured with {len(notification_manager.channels)} channels")
                    # Explicitly commit and close the session
                    db.session.commit()
                except Exception as e:
                    logger.error(f"Error initializing notification manager: {str(e)}")
                    # Make sure to rollback
                    try:
                        db.session.rollback()
                    except:
                        pass
            
            @with_app_context
            def initialize_scheduler():
                try:
                    # Then initialize scheduler in a separate transaction
                    logger.info("Initializing scheduler...")
                    scheduler = init_scheduler()
                    logger.info(f"Scheduler initialized with {len(scheduler.get_jobs())} jobs")
                    # Explicitly commit and close the session
                    db.session.commit()
                    return scheduler
                except Exception as e:
                    logger.error(f"Error initializing scheduler: {str(e)}")
                    # Make sure to rollback
                    try:
                        db.session.rollback()
                    except:
                        pass
                    return None
            
            @with_app_context
            def schedule_data_quality_alerts():
                try:
                    # Add a scheduled job to run manually without the pickle serialization 
                    # This is a workaround for pickle/serialization issues with scheduler
                    # We will manually check alerts every 15 minutes using cron-like syntax
                    logger.info("Setting up data quality alert checking schedule...")
                    
                    # Run the check manually on startup
                    from sync_service.data_quality_notifications import check_data_quality_alerts
                    logger.info("Running initial data quality alert check...")
                    check_data_quality_alerts()
                    logger.info("Initial data quality alert check completed")
                    
                    # Note: We're not using scheduler due to pickle serialization issues
                    # Instead, we'll rely on server.py custom scheduler code
                    db.session.commit()
                    
                    # Store scheduling info in a database record
                    # We won't use global settings due to the entity mapping issue
                    # Instead, we'll just rely on the hardcoded interval value of 15 minutes
                    # This is a simplification for the alert check schedule
                        
                    logger.info("Data quality alert check interval set to 15 minutes")
                except Exception as e:
                    logger.error(f"Error scheduling data quality alerts: {str(e)}")
                    try:
                        db.session.rollback()
                    except:
                        pass
            
            # Run each initialization separately with clean transaction state
            initialize_notification_manager()
            scheduler = initialize_scheduler()
            schedule_data_quality_alerts()
            
        except Exception as e:
            logger.error(f"Error initializing services: {str(e)}")
    
    # Start initialization in a separate thread after a short delay
    # to ensure the database is fully initialized
    thread = threading.Timer(5.0, init_services_in_thread)
    thread.daemon = True
    thread.start()
    
def register_blueprints(app):
    """
    Register all blueprints with the Flask app.
    This is called by the main app to initialize the module.
    """
    try:
        # Create routes before registering the blueprints
        create_routes()
        
        # Import verification and data quality blueprints
        from sync_service.verification_routes import verification_bp
        
        # Try to import sales verification routes
        try:
            from sync_service.sales_verification_routes import sales_verification_bp
            has_sales_verification = True
            logger.info("Sales Verification module loaded successfully")
        except ImportError as e:
            logger.warning(f"Could not load Sales Verification module: {e}")
            has_sales_verification = False
        
        # Try to import data quality routes
        try:
            from sync_service.data_quality_routes import data_quality_bp, register_data_quality_blueprint
            from sync_service.quality_report_routes import quality_report_bp, register_blueprint as register_quality_report_blueprint
            has_data_quality = True
            logger.info("Data Quality module loaded successfully")
        except ImportError as e:
            logger.warning(f"Could not load Data Quality module: {e}")
            has_data_quality = False
        
        # Try to import integration hub routes
        try:
            from sync_service.integration_routes import integration_bp, register_integration_blueprint
            has_integration_hub = True
            logger.info("Integration Hub module loaded successfully")
        except ImportError as e:
            logger.warning(f"Could not load Integration Hub module: {e}")
            has_integration_hub = False
            
        # Try to import enhanced ETL routes
        try:
            from sync_service.etl_routes import register_etl_routes
            has_enhanced_etl = True
            logger.info("Enhanced ETL module loaded successfully")
        except ImportError as e:
            logger.warning(f"Could not load Enhanced ETL module: {e}")
            has_enhanced_etl = False
            
        # Try to import field mapping routes
        try:
            from sync_service.mapping_routes import register_mapping_routes
            has_field_mapping = True
            logger.info("Field Mapping module loaded successfully")
        except ImportError as e:
            logger.warning(f"Could not load Field Mapping module: {e}")
            has_field_mapping = False
            
        # Try to import project sync routes
        try:
            from sync_service.project_sync_routes import register_project_sync_blueprint
            has_project_sync = True
            logger.info("Project Sync module loaded successfully")
        except ImportError as e:
            logger.warning(f"Could not load Project Sync module: {e}")
            has_project_sync = False
        
        # Register the blueprints
        app.register_blueprint(sync_bp)
        app.register_blueprint(verification_bp)
        
        # Register sales verification blueprint if available
        if has_sales_verification:
            app.register_blueprint(sales_verification_bp)
            logger.info("Sales Verification blueprint registered")
        
        # Register data quality blueprint if available
        if has_data_quality:
            register_data_quality_blueprint(app)
            register_quality_report_blueprint(app)
            
        # Register integration hub blueprint if available
        if has_integration_hub:
            register_integration_blueprint(app)
            
        # Register enhanced ETL blueprint if available
        if has_enhanced_etl:
            register_etl_routes(app)
            logger.info("Enhanced ETL routes registered successfully")
            
        # Register field mapping blueprint if available
        if has_field_mapping:
            register_mapping_routes(app)
            logger.info("Field Mapping routes registered successfully")
            
        # Register project sync blueprint if available
        if has_project_sync:
            register_project_sync_blueprint(app)
            logger.info("Project Sync routes registered successfully")
        
        # Initialize models
        with app.app_context():
            # Import the models from the correct modules
            from sync_service.models import (
                SyncJob, SyncLog, TableConfiguration, FieldConfiguration,
                GlobalSetting, SyncConflict, SyncSchedule, 
                FieldSanitizationRule, NotificationConfig
            )
            # These models are defined in their respective modules but registered through models/__init__.py
            from sync_service.models import SanitizationLog, SyncNotificationLog
            
            # Create tables if they don't exist
            from app import db
            db.create_all()
            
            # Log initialization
            logger.info("Sync service database tables initialized")
        
        return True
    except Exception as e:
        logger.error(f"Error registering sync service blueprints: {str(e)}")
        return False