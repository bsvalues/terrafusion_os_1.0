"""
County Property Data API

This module provides API endpoints to access property data from various counties
using the county scrapers.
"""

import logging
from flask import Blueprint, jsonify, request
from etl.scrapers.county_factory import get_county_scraper, list_supported_counties

# Configure logging
logger = logging.getLogger(__name__)

# Create a Flask Blueprint for the county API
county_api = Blueprint('county_api', __name__, url_prefix='/api/county')

@county_api.route('/supported', methods=['GET'])
def get_supported_counties():
    """
    Get a list of supported counties.
    
    Returns:
        JSON: List of supported counties and their states
    """
    counties = list_supported_counties()
    
    return jsonify({
        'status': 'success',
        'data': {
            'count': len(counties),
            'counties': [{'name': county, 'state': state} for county, state in counties.items()]
        }
    })

@county_api.route('/<county_name>/<state>/search', methods=['GET'])
def search_properties(county_name, state):
    """
    Search for properties in a specific county.
    
    Args:
        county_name (str): Name of the county (in URL)
        state (str): Two-letter state code (in URL)
        
    Query Parameters:
        q (str): Search query (required)
        limit (int): Maximum number of results to return (default: 10)
        search_type (str): Type of search (address, owner, parcel) (default: auto-detect)
    
    Returns:
        JSON: Search results or error message
    """
    # Get the search query from the query parameter
    query = request.args.get('q')
    if not query:
        return jsonify({
            'status': 'error',
            'message': "Search query is required. Use the 'q' query parameter to specify your search."
        }), 400
    
    # Get optional parameters
    limit = request.args.get('limit', default=10, type=int)
    search_type = request.args.get('search_type', default='auto')
    
    # Get the county scraper
    scraper = get_county_scraper(county_name, state)
    
    if not scraper:
        return jsonify({
            'status': 'error',
            'message': f"Unsupported county: {county_name}, {state}",
            'hint': "Use /api/county/supported to get a list of supported counties."
        }), 404
    
    # Perform the search
    try:
        search_results = scraper.search_properties(
            query=query, 
            limit=limit,
            search_type=search_type
        )
        
        # Check if there was an error
        if isinstance(search_results, dict) and 'error' in search_results:
            return jsonify({
                'status': 'error',
                'message': search_results.get('message', 'Unknown error'),
                'error_code': search_results.get('error', 'unknown_error'),
                'data_compliance': search_results.get('data_compliance', '')
            }), 500
        
        # Return the successful results
        return jsonify({
            'status': 'success',
            'data': search_results
        })
    
    except Exception as e:
        logger.error(f"Error searching properties in {county_name}, {state}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Error performing property search: {str(e)}"
        }), 500

@county_api.route('/<county_name>/<state>/property/<property_id>', methods=['GET'])
def get_property_details(county_name, state, property_id):
    """
    Get detailed information for a specific property.
    
    Args:
        county_name (str): Name of the county (in URL)
        state (str): Two-letter state code (in URL)
        property_id (str): Property identifier (in URL)
    
    Returns:
        JSON: Property details or error message
    """
    # Get the county scraper
    scraper = get_county_scraper(county_name, state)
    
    if not scraper:
        return jsonify({
            'status': 'error',
            'message': f"Unsupported county: {county_name}, {state}",
            'hint': "Use /api/county/supported to get a list of supported counties."
        }), 404
    
    # Get the property details
    try:
        property_details = scraper.get_property_details(property_id)
        
        # Check if there was an error
        if isinstance(property_details, dict) and 'error' in property_details:
            return jsonify({
                'status': 'error',
                'message': property_details.get('message', 'Unknown error'),
                'error_code': property_details.get('error', 'unknown_error'),
                'data_compliance': property_details.get('data_compliance', '')
            }), 404 if property_details.get('error') == 'property_not_found' else 500
        
        # Return the successful results
        return jsonify({
            'status': 'success',
            'data': property_details
        })
    
    except Exception as e:
        logger.error(f"Error getting property details in {county_name}, {state}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Error retrieving property details: {str(e)}"
        }), 500

@county_api.route('/<county_name>/<state>/property/<property_id>/history', methods=['GET'])
def get_property_history(county_name, state, property_id):
    """
    Get historical data for a specific property.
    
    Args:
        county_name (str): Name of the county (in URL)
        state (str): Two-letter state code (in URL)
        property_id (str): Property identifier (in URL)
    
    Returns:
        JSON: Property history or error message
    """
    # Get the county scraper
    scraper = get_county_scraper(county_name, state)
    
    if not scraper:
        return jsonify({
            'status': 'error',
            'message': f"Unsupported county: {county_name}, {state}",
            'hint': "Use /api/county/supported to get a list of supported counties."
        }), 404
    
    # Get the property history
    try:
        property_history = scraper.get_property_history(property_id)
        
        # Check if there was an error
        if isinstance(property_history, dict) and 'error' in property_history:
            return jsonify({
                'status': 'error',
                'message': property_history.get('message', 'Unknown error'),
                'error_code': property_history.get('error', 'unknown_error'),
                'data_compliance': property_history.get('data_compliance', '')
            }), 404 if property_history.get('error') == 'property_not_found' else 500
        
        # Return the successful results
        return jsonify({
            'status': 'success',
            'data': property_history
        })
    
    except Exception as e:
        logger.error(f"Error getting property history in {county_name}, {state}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Error retrieving property history: {str(e)}"
        }), 500