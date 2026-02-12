"""
Voice API routes module
"""
import logging
from flask import Blueprint

from api.voice.process import voice_process_api

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint
voice_api = Blueprint('voice_api', __name__)

def register_voice_api_blueprint(app):
    """Register voice API blueprints with the app."""
    # Register voice process API
    app.register_blueprint(voice_process_api)
    
    # Register main voice API (if needed in the future)
    app.register_blueprint(voice_api)
    
    logger.info("Registered voice API blueprint")