"""
API Package for GeoAssessmentPro

This package provides API endpoints for the GeoAssessmentPro platform,
including RESTful services, WebSocket connections, and integrations.
"""

from flask import Blueprint, jsonify, current_app
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create main API blueprint with a unique name to avoid conflicts
geo_api_bp = Blueprint("geo_api", __name__, url_prefix="/api/v1")

@geo_api_bp.route("/", methods=["GET"])
def api_index():
    """API index endpoint"""
    return jsonify({
        "service": "GeoAssessmentPro API",
        "version": "1.0.0",
        "endpoints": [
            {
                "path": "/api/v1/spatial",
                "description": "Spatial data services including vector tiles and analysis"
            },
            {
                "path": "/api/v1/property",
                "description": "Property data services"
            },
            {
                "path": "/api/v1/anomaly",
                "description": "Data anomaly detection and visualization services"
            },
            {
                "path": "/api/v1/agents",
                "description": "AI agent management and coordination"
            }
        ]
    })

def register_apis(app):
    """Register all API blueprints with the Flask app"""
    # Check if there's already an API blueprint registered to avoid conflicts
    has_api_conflict = False
    for bp in getattr(app, 'blueprints', {}).values():
        if bp.url_prefix == '/api':
            logger.info(f"Found existing API blueprint: {bp.name}")
            has_api_conflict = True
            break
    
    # Register main API blueprint if no conflict
    if not has_api_conflict:
        app.register_blueprint(geo_api_bp)
        logger.info("Registered main GeoAssessmentPro API blueprint")
    else:
        logger.warning("Skipping main API blueprint registration to avoid conflicts")
    
    # Register individual service blueprints
    try:
        # Spatial service blueprint with a unique prefix
        from api.spatial_service import register_blueprint as register_spatial_bp
        register_spatial_bp(app)
        logger.info("Registered spatial service API")
    except ImportError as e:
        logger.info(f"Spatial service API not available: {str(e)}")
    except Exception as e:
        logger.warning(f"Error registering spatial service: {str(e)}")
    
    # Import and register other API blueprints as they become available
    try:
        from api.agent_service import register_blueprint as register_agent_bp
        register_agent_bp(app)
        logger.info("Registered agent service API")
    except ImportError as e:
        logger.info(f"Agent service API not available: {str(e)}")
    except Exception as e:
        logger.warning(f"Error registering agent service: {str(e)}")
    
    # Log successful registration
    logger.info("API services registration completed")