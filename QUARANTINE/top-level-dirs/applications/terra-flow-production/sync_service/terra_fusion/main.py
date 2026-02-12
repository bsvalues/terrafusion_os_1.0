"""
Main Entry Point for TerraFusion Sync Service.

This module provides the main entry point for integrating the TerraFusion Sync Service
with the Flask application.
"""

import os
import logging
from typing import Dict, Any

from flask import Flask

from sync_service.terra_fusion.flask_integration import register_blueprint as register_api
from sync_service.terra_fusion.routes import register_blueprint as register_ui

# Initialize logging
logger = logging.getLogger(__name__)


def initialize_terra_fusion(app: Flask) -> Dict[str, Any]:
    """
    Initialize the TerraFusion Sync Service and register it with the Flask app.
    
    Args:
        app: Flask application
        
    Returns:
        Dictionary with initialization results
    """
    try:
        # Initialize TerraFusion Sync Service
        logger.info("Initializing TerraFusion Sync Service")
        
        # Register API endpoints
        register_api(app)
        
        # Register UI routes
        register_ui(app)
        
        # Return initialization status
        return {
            'status': 'success',
            'message': 'TerraFusion Sync Service initialized successfully'
        }
        
    except Exception as e:
        logger.error(f"Error initializing TerraFusion Sync Service: {str(e)}")
        return {
            'status': 'error',
            'message': f"Error initializing TerraFusion Sync Service: {str(e)}"
        }