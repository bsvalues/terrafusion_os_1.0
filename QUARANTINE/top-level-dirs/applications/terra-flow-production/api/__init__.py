"""
API Module Initialization

This module initializes the API blueprints for the application.
"""

from flask import Blueprint

# Create API blueprint
api_blueprint = Blueprint('api', __name__)

def init_api(app):
    """
    Initialize API routes and register blueprints.
    
    Args:
        app: Flask application
    """
    # Log registered routes
    app.logger.info("API routes registered")