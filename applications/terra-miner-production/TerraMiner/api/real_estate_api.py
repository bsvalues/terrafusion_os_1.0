"""
Real Estate Data API routes using the unified data connector
"""
import os
import json
import logging
from flask import Blueprint, jsonify, request, current_app

from etl.real_estate_data_connector import RealEstateDataConnector

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a Flask Blueprint
real_estate_api = Blueprint('real_estate_api', __name__, url_prefix='/api/real-estate')

# Initialize the data connector (will be created per-request)
def get_connector():
    """Get a real estate data connector instance"""
    primary_source = request.args.get('source', 'zillow')
    try:
        return RealEstateDataConnector(primary_source=primary_source)
    except Exception as e:
        logger.error(f"Failed to initialize real estate data connector: {e}")
        return None

@real_estate_api.route('/search', methods=['GET'])
def search_properties():
    """
    Search for properties in a specific location.
    
    Query Parameters:
        - location (required): Location to search (city, zip code, address)
        - page: Page number (default: 1)
        - property_type: Type of property (house, apartment, etc.)
        - min_price: Minimum price
        - max_price: Maximum price
        - beds: Minimum number of bedrooms
        - baths: Minimum number of bathrooms
        - source: Primary data source to use (default: zillow)
    
    Returns:
        JSON with search results
    """
    # Get required parameters
    location = request.args.get('location')
    if not location:
        return jsonify({
            'error': 'Missing required parameter: location',
            'status': 'error'
        }), 400
    
    # Get optional parameters
    params = {}
    for param in ['page', 'property_type', 'min_price', 'max_price', 'beds', 'baths']:
        if param in request.args:
            # Convert numeric values from strings
            value = request.args.get(param)
            if param in ['page', 'min_price', 'max_price', 'beds', 'baths'] and value is not None:
                try:
                    value = int(str(value))
                except (ValueError, TypeError):
                    # Skip conversion if value is not a valid integer
                    pass
            params[param] = value
    
    # Get the data connector
    connector = get_connector()
    if not connector:
        return jsonify({
            'error': 'Unable to initialize real estate data connector',
            'status': 'error'
        }), 500
    
    try:
        # Execute the search
        results = connector.search_properties(location, **params)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error searching properties: {e}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@real_estate_api.route('/property/<property_id>', methods=['GET'])
def get_property_details(property_id):
    """
    Get detailed information for a specific property.
    
    Path Parameters:
        - property_id: Property identifier
    
    Query Parameters:
        - source: Data source to use (default: primary source)
    
    Returns:
        JSON with property details
    """
    # Get the specified source if any
    source = request.args.get('source')
    
    # Get the data connector
    connector = get_connector()
    if not connector:
        return jsonify({
            'error': 'Unable to initialize real estate data connector',
            'status': 'error'
        }), 500
    
    try:
        # Get property details
        details = connector.get_property_details(property_id, source=source)
        return jsonify(details)
    except Exception as e:
        logger.error(f"Error getting property details: {e}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@real_estate_api.route('/market-trends/<location>', methods=['GET'])
def get_market_trends(location):
    """
    Get market trends for a specific location.
    
    Path Parameters:
        - location: Location to analyze (city, zip code, etc.)
    
    Query Parameters:
        - period: Time period for trends (e.g., '1year', '5year', '10year')
        - source: Data source to use (default: primary source)
    
    Returns:
        JSON with market trend data
    """
    # Get optional parameters
    params = {}
    if 'period' in request.args:
        params['period'] = request.args.get('period')
    
    # Get the data connector
    connector = get_connector()
    if not connector:
        return jsonify({
            'error': 'Unable to initialize real estate data connector',
            'status': 'error'
        }), 500
    
    try:
        # Get market trends
        trends = connector.get_market_trends(location, **params)
        return jsonify(trends)
    except Exception as e:
        logger.error(f"Error getting market trends: {e}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@real_estate_api.route('/status', methods=['GET'])
def get_status():
    """
    Get the status of the real estate data API and available sources.
    
    Returns:
        JSON with API status information
    """
    try:
        # Try to initialize the connector to check available sources
        connector = get_connector()
        if not connector:
            return jsonify({
                'status': 'error',
                'message': 'Unable to initialize real estate data connector'
            }), 500
        
        # Return information about available sources
        return jsonify({
            'status': 'ok',
            'available_sources': list(connector.connectors.keys()),
            'primary_source': connector.primary_source
        })
    except Exception as e:
        logger.error(f"Error checking API status: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500