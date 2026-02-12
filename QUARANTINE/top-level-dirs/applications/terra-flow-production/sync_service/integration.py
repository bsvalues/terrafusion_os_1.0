"""
Database Project Sync Service Integration Module.

This module provides the integration point between the existing application and 
both the original DatabaseProjectSyncService and the enhanced TerraFusion architecture.
"""

import os
import logging
from typing import Dict, Any

from flask import Flask, Blueprint, current_app

# Initialize logging
logger = logging.getLogger(__name__)

def initialize_sync_services(app: Flask) -> Dict[str, Any]:
    """
    Initialize all sync services and register them with the Flask app.
    
    Args:
        app: Flask application
        
    Returns:
        Dictionary with initialization results
    """
    results = {}
    
    # Initialize the original DatabaseProjectSyncService routes
    try:
        from sync_service.project_sync_routes import project_sync_bp
        app.register_blueprint(project_sync_bp)
        logger.info("Registered original DatabaseProjectSyncService routes")
        results['legacy_sync'] = {
            'status': 'success',
            'message': 'Original DatabaseProjectSyncService registered successfully'
        }
    except Exception as e:
        logger.error(f"Error initializing original DatabaseProjectSyncService: {str(e)}")
        results['legacy_sync'] = {
            'status': 'error',
            'message': f"Error initializing original DatabaseProjectSyncService: {str(e)}"
        }
    
    # Initialize the enhanced TerraFusion Sync Service
    try:
        from sync_service.terra_fusion.main import initialize_terra_fusion
        terra_fusion_result = initialize_terra_fusion(app)
        results['terra_fusion'] = terra_fusion_result
    except Exception as e:
        logger.error(f"Error initializing TerraFusion Sync Service: {str(e)}")
        results['terra_fusion'] = {
            'status': 'error',
            'message': f"Error initializing TerraFusion Sync Service: {str(e)}"
        }
    
    return results