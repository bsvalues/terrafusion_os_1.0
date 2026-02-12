"""
Monitoring Module

This module provides monitoring and health check capabilities for the application.
"""

from flask import Flask
from .health_routes import health_monitoring_bp

def init_monitoring(app: Flask) -> None:
    """
    Initialize monitoring for the application.
    
    Args:
        app: Flask application
    """
    # Register health check routes
    app.register_blueprint(health_monitoring_bp)
    
    # Log initialization
    app.logger.info("Monitoring routes registered")