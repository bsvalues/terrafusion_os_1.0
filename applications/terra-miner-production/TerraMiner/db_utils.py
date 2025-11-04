"""
Database configuration and initialization module.
This module provides helper functions for working with the database
while avoiding circular imports.
"""

import os
import logging

# Import the database instance from core module
from core import db

# Initialize logger
logger = logging.getLogger(__name__)

# Function to get the database instance
def get_db():
    """Return the SQLAlchemy instance."""
    return db

def init_db(app):
    """Initialize the database with the Flask app."""
    # Configure database
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # Initialize the SQLAlchemy extension with the app
    db.init_app(app)
    
    # Create all tables that don't already exist
    with app.app_context():
        # Import models here to ensure they're registered before creating tables
        try:
            import models
            logger.info("Imported models successfully")
        except ImportError as e:
            logger.error(f"Failed to import models: {str(e)}")
        
        # Create tables
        db.create_all()
        logger.info("Database tables created/verified")