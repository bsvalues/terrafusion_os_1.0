"""
Visualizations Package

This package provides visualization modules and routes for the TerraFlow application,
including real-time geographic data visualizations and dashboards.
"""

import os
import sys

# Add the parent directory to sys.path to avoid import issues
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from flask import Blueprint

# Create a visualizations blueprint for registering with the main application
visualizations_bp = Blueprint('visualizations', __name__, url_prefix='/visualizations')

# Import route modules
from .dashboard_routes import dashboard_bp

# Register child blueprints
visualizations_bp.register_blueprint(dashboard_bp)

# Function for registering the visualizations blueprint with a Flask app
def register_blueprint(app):
    """Register visualizations blueprint with the main Flask app.
    
    Args:
        app: Flask application instance
    """
    app.register_blueprint(visualizations_bp)
    return True