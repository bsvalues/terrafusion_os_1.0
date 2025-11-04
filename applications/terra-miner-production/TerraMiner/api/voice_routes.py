"""
Voice command processing API routes
"""
import logging
import re
import json
from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest

from services.property_service import PropertyService
from services.zillow_service import ZillowService
from ai.voice_analyzer import VoiceCommandAnalyzer

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint
voice_api = Blueprint('voice_api', __name__)

# Initialize services
property_service = PropertyService()
zillow_service = ZillowService()
voice_analyzer = VoiceCommandAnalyzer()


@voice_api.route('/api/voice/process', methods=['POST'])
def process_voice_command():
    """Process a voice command and determine the appropriate action."""
    try:
        # Get command from request
        data = request.get_json()
        
        if not data or 'command' not in data:
            raise BadRequest('Missing command in request')
        
        command = data['command']
        logger.info(f"Processing voice command: {command}")
        
        # Use the AI-powered analyzer to process the command
        result = voice_analyzer.analyze(command)
        logger.info(f"Command analysis result: {result}")
        
        return jsonify(result)
    
    except Exception as e:
        logger.exception(f"Error processing voice command: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error processing voice command. Please try again.'
        }), 500


@voice_api.route('/api/voice/search', methods=['POST'])
def search_properties():
    """Search for properties based on voice command parameters."""
    try:
        # Get search parameters from request
        data = request.get_json()
        
        if not data:
            raise BadRequest('Missing search parameters in request')
        
        # Get search parameters
        location = data.get('location')
        property_type = data.get('propertyType')
        beds = data.get('beds')
        baths = data.get('baths')
        max_price = data.get('maxPrice')
        
        # Validate required parameters
        if not location:
            return jsonify({
                'success': False,
                'error': 'Location is required for property search',
                'message': 'Please specify a location for your search.'
            }), 400
        
        # Search for properties
        logger.info(f"Searching for properties with parameters: {data}")
        properties = property_service.search_properties(
            location=location,
            property_type=property_type,
            min_beds=beds,
            min_baths=baths,
            max_price=max_price
        )
        
        return jsonify({
            'success': True,
            'properties': properties,
            'count': len(properties)
        })
    
    except Exception as e:
        logger.exception(f"Error searching properties: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error searching for properties. Please try again.'
        }), 500


@voice_api.route('/api/voice/market-trends', methods=['POST'])
def get_market_trends():
    """Get market trends for a specific location."""
    try:
        # Get parameters from request
        data = request.get_json()
        
        if not data or 'location' not in data:
            raise BadRequest('Missing location in request')
        
        location = data['location']
        property_type = data.get('propertyType', 'All')
        timeframe = data.get('timeframe', 90)  # Default to 90 days
        
        # Get market trends
        logger.info(f"Getting market trends for location: {location}, "
                   f"property_type: {property_type}, timeframe: {timeframe}")
        
        trends = zillow_service.get_market_trends(
            location=location,
            property_type=property_type,
            days=timeframe
        )
        
        return jsonify({
            'success': True,
            'trends': trends,
            'location': location,
            'propertyType': property_type,
            'timeframe': timeframe
        })
    
    except Exception as e:
        logger.exception(f"Error getting market trends: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error retrieving market trends. Please try again.'
        }), 500


def register_voice_api_blueprint(app):
    """Register the voice API blueprint with the app."""
    app.register_blueprint(voice_api)
    logger.info("Registered voice API blueprint")