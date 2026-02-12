"""
Voice search controller module
"""
import logging
from flask import Blueprint, render_template, jsonify, request

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint
voice_blueprint = Blueprint('voice', __name__, template_folder='templates')

@voice_blueprint.route('/voice-search')
def voice_search():
    """Render the voice search page."""
    logger.info("Rendering voice search page")
    
    # Example voice commands for the UI
    example_commands = [
        "Find properties in Seattle with 3 bedrooms",
        "Show homes in San Francisco under 750k",
        "Search for houses in Austin with 2 bathrooms",
        "Find condos in Chicago with 2 beds under 500k",
        "Show market trends for Boston",
        "Get property details at 123 Main Street"
    ]
    
    return render_template(
        'voice_search.html',
        title="Voice-Activated Property Search",
        example_commands=example_commands
    )

def register_voice_blueprint(app):
    """Register the voice blueprint with the app."""
    app.register_blueprint(voice_blueprint)
    logger.info("Registered voice controller blueprint")