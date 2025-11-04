import os
import sys
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the current directory to the path to ensure imports work correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import app directly - we've fixed the circular imports in db_utils
try:
    from app import app
    logger.info("Successfully imported app")
except Exception as e:
    logger.error(f"Failed to import app: {str(e)}")
    raise
from db.database import save_to_database
from utils.logger import setup_logger
from utils.config import load_config
from utils.api_monitoring import setup_monitoring
from utils.system_monitor import start_monitoring
from ai.api.prompt_endpoints import register_endpoints as register_prompt_endpoints
from ai.api.learning_endpoints import register_endpoints as register_learning_endpoints
from ai.api.integration_endpoints import register_endpoints as register_integration_endpoints
from ai.api.monitoring_endpoints import register_endpoints as register_monitoring_endpoints
from controllers.property_record_controller import register_blueprint

# Register AI endpoints
register_prompt_endpoints(app)
register_learning_endpoints(app)
register_integration_endpoints(app)
register_monitoring_endpoints(app)

# Register property record controller
try:
    register_blueprint(app)
    logger.info("Registered Property Record Card blueprint")
except Exception as e:
    logger.error(f"Failed to register Property Record Card blueprint: {str(e)}")
    
# Register property views
try:
    from views import register_property_views
    register_property_views(app)
    logger.info("Registered Property Views blueprint")
except Exception as e:
    logger.error(f"Failed to register Property Views blueprint: {str(e)}")

# Register Real Estate API blueprint
try:
    from api.real_estate_api import real_estate_api
    app.register_blueprint(real_estate_api)
    logger.info("Registered Real Estate API blueprint")
except Exception as e:
    logger.error(f"Failed to register Real Estate API blueprint: {str(e)}")

# Register County Property API blueprint
try:
    from api.county_api import county_api
    app.register_blueprint(county_api)
    logger.info("Registered County Property API blueprint")
except Exception as e:
    logger.error(f"Failed to register County Property API blueprint: {str(e)}")

# Register PACMLS API blueprint
try:
    from api.pacmls_api import pacmls_api
    app.register_blueprint(pacmls_api)
    logger.info("Registered PACMLS API blueprint")
except Exception as e:
    logger.error(f"Failed to register PACMLS API blueprint: {str(e)}")

# Register PACMLS Controller blueprint
try:
    from controllers.pacmls_controller import pacmls_controller
    app.register_blueprint(pacmls_controller)
    logger.info("Registered PACMLS Controller blueprint")
except Exception as e:
    logger.error(f"Failed to register PACMLS Controller blueprint: {str(e)}")

# Register Data Source Manager blueprint
try:
    from controllers.data_source_controller import register_blueprint as register_data_source_blueprint
    register_data_source_blueprint(app)
    logger.info("Registered Data Source Manager blueprint")
except Exception as e:
    logger.error(f"Failed to register Data Source Manager blueprint: {str(e)}")

# Register API Credential Manager blueprint
try:
    from controllers.api_credential_controller import register_blueprint as register_api_credential_blueprint
    register_api_credential_blueprint(app)
    logger.info("Registered API Credential Manager blueprint")
except Exception as e:
    logger.error(f"Failed to register API Credential Manager blueprint: {str(e)}")

# Setup data synchronization
try:
    from etl.data_sync_job import setup_sync_schedule
    setup_sync_schedule(app)
    logger.info("Data synchronization scheduler started")
except Exception as e:
    logger.error(f"Failed to setup data synchronization: {str(e)}")

# Setup API monitoring
setup_monitoring(app)

# Import property models to ensure they're created in the database
try:
    from models.property import Property, PropertyListing, PropertyHistory, DataSourceStatus
    logger.info("Imported property models successfully")
    
    # Create database tables if they don't exist
    with app.app_context():
        from core import db
        db.create_all()
        logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Failed to import property models: {str(e)}")

# Start system monitoring (collect metrics every 5 minutes)
with app.app_context():
    start_monitoring(interval=300)

# Set up logging
setup_logger()
logger = logging.getLogger(__name__)

# The ETL workflow is now imported from core.py to avoid circular dependencies

# Run with Flask app if executed directly
if __name__ == "__main__":
    with app.app_context():
        run_etl_workflow()
