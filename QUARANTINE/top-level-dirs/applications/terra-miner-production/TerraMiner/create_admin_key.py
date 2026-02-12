"""
Script to create an initial admin API key for ETL API access.

This script should be run once to create the first admin API key.
"""
import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from flask import Flask
    from app import db
    from models.api_keys import APIKey
except ImportError as e:
    logger.error(f"Failed to import required modules: {e}")
    sys.exit(1)

def create_admin_key():
    """Create an admin API key for ETL API access."""
    try:
        # Create a minimal Flask app context
        app = Flask(__name__)
        app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
        app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        db.init_app(app)
        
        with app.app_context():
            # Check if there are already API keys in the database 
            # We'll check all keys and look for admin permission in the JSON
            existing_keys = APIKey.query.all()
            admin_keys = [k for k in existing_keys if k.permissions and k.permissions.get('admin')]
            
            if admin_keys:
                logger.warning("Admin API key already exists. To create a new one, use the API.")
                return
            
            # Create admin API key
            permissions = {
                'admin': True,
                'etl:read': True,
                'etl:write': True
            }
            
            api_key, full_key = APIKey.create_key(
                name="Admin API Key",
                permissions=permissions,
                created_by="system",
                expiry_days=None  # No expiration
            )
            
            logger.info(f"Created admin API key with ID: {api_key.id}")
            logger.info(f"API Key: {full_key}")
            logger.info("IMPORTANT: This key will only be shown once, please save it securely.")
            
            return full_key
    
    except Exception as e:
        logger.error(f"Error creating admin API key: {e}")
        return None

if __name__ == "__main__":
    create_admin_key()