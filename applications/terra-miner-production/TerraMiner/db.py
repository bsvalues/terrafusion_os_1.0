"""
Database configuration and initialization module.
This module defines the SQLAlchemy instance and provides helper functions
for working with the database while avoiding circular imports.
"""

import os
import logging
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.declarative import declarative_base

# Initialize logger
logger = logging.getLogger(__name__)

# Create a new base class for declarative models
Base = declarative_base()
    pass

# Create the SQLAlchemy extension instance
db = SQLAlchemy(model_class=Base)

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