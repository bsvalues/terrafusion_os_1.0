"""
Direct property search and display views.

This module provides direct Flask routes for property searching and display,
avoiding circular imports by keeping these views separate from controllers.
"""

import logging
import datetime
from flask import (
    render_template, request, redirect, url_for, flash, 
    Blueprint, current_app as app, jsonify
)

# Try to import from regional API, but provide fallback if it fails
try:
    from regional.assessment_api import (
        get_supported_counties,
        get_assessment_data,
        search_assessment_properties
    )
    ASSESSMENT_API_AVAILABLE = True
except ImportError:
    logger = logging.getLogger(__name__)
    logger.warning("Assessment API not available, using fallback behavior")
    ASSESSMENT_API_AVAILABLE = False
    
    # Provide fallback functions
    def get_supported_counties():
        return {
            'benton': {
                'name': 'Benton County',
                'state': 'WA',
                'default_data_source': 'GIS'
            },
            'franklin': {
                'name': 'Franklin County',
                'state': 'WA',
                'default_data_source': None
            },
            'walla_walla': {
                'name': 'Walla Walla County',
                'state': 'WA',
                'default_data_source': None
            }
        }
    
    def get_assessment_data(property_id, county='benton'):
        return {
            'error': 'api_unavailable',
            'message': 'The property assessment API is currently unavailable.',
            'data_source': 'None (API Unavailable)'
        }
    
    def search_assessment_properties(query, county='benton', limit=10):
        return {
            'error': 'api_unavailable',
            'message': 'The property assessment API is currently unavailable.',
            'count': 0,
            'properties': []
        }

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint with URL prefix to avoid conflicts with app.py routes
property_views_bp = Blueprint('property_views', __name__, url_prefix='/assess')

@property_views_bp.route('/property/search', methods=['GET', 'POST'])
def property_search():
    """
    Handle property search requests.
    
    GET: Display search form
    POST: Process search and redirect to results or property details
    """
    # Set default counties in case the API import fails
    counties = {
        'benton': {
            'name': 'Benton County',
            'state': 'WA',
            'default_data_source': 'GIS'
        },
        'franklin': {
            'name': 'Franklin County',
            'state': 'WA',
            'default_data_source': None
        },
        'walla_walla': {
            'name': 'Walla Walla County',
            'state': 'WA',
            'default_data_source': None
        }
    }
    
    # Try to get counties from API
    try:
        counties = get_supported_counties()
    except Exception as e:
        logger.error(f"Error getting supported counties: {str(e)}")
        # Continue with default counties
    
    if request.method == 'POST':
        property_id = request.form.get('property_id')
        county = request.form.get('county', 'benton')
        
        # If a specific property ID was entered, go directly to the property details
        if property_id:
            return redirect(url_for('property_views.property_details', 
                                  property_id=property_id, 
                                  county=county))
        
        # If a search query was entered, redirect to the search results
        search_query = request.form.get('search_query')
        if search_query:
            return redirect(url_for('property_views.property_search_results',
                                  query=search_query,
                                  county=county))
        
        # If neither was provided, flash an error and redisplay the form
        flash('Please enter a property ID or search query.', 'error')
        
    # For GET requests or if we get here after a POST (e.g., validation failed)
    return render_template('property_search.html', counties=counties)

@property_views_bp.route('/property/results')
def property_search_results():
    """Display property search results."""
    search_query = request.args.get('query', '')
    county = request.args.get('county', 'benton')
    limit = request.args.get('limit', 10, type=int)
    
    if not search_query:
        flash('Please enter a search query.', 'error')
        return redirect(url_for('property_views.property_search'))
    
    # Perform the search
    results = search_assessment_properties(search_query, county, limit)
    
    # Check for errors
    if 'error' in results:
        flash(f"Search error: {results['message']}", 'error')
        return render_template('property_search_results.html', 
                              query=search_query,
                              results=None,
                              county=county,
                              error=results['message'])
    
    return render_template('property_search_results.html',
                          query=search_query,
                          results=results,
                          county=county)

@property_views_bp.route('/property/<property_id>')
def property_details(property_id):
    """Display detailed property information."""
    county = request.args.get('county', 'benton')
    
    # Get property data
    property_data = get_assessment_data(property_id, county)
    
    # Check for errors
    if 'error' in property_data:
        # Generate timestamp for error template
        current_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        return render_template('property_record_error.html',
                              property_id=property_id,
                              county=county,
                              error=property_data['message'],
                              data_source=property_data.get('data_source', 'Unknown'),
                              timestamp=current_time)
    
    # Render property record card
    return render_template('property_record_card.html',
                          property_id=property_id,
                          property_data=property_data['property_data'],
                          county=county,
                          data_source=property_data['data_source'])

@property_views_bp.route('/api/property/<property_id>')
def api_property_details(property_id):
    """API endpoint for property details."""
    from flask import jsonify
    
    county = request.args.get('county', 'benton')
    
    # Get property data
    property_data = get_assessment_data(property_id, county)
    
    # Return as JSON
    return jsonify(property_data)

@property_views_bp.route('/api/property/search')
def api_property_search():
    """API endpoint for property search."""
    from flask import jsonify
    
    search_query = request.args.get('query', '')
    county = request.args.get('county', 'benton')
    limit = request.args.get('limit', 10, type=int)
    
    if not search_query:
        return jsonify({
            'error': 'missing_query',
            'message': 'Search query is required.'
        }), 400
    
    # Perform the search
    results = search_assessment_properties(search_query, county, limit)
    
    # Return as JSON
    return jsonify(results)

def register_views(app):
    """Register the property views with the Flask app."""
    app.register_blueprint(property_views_bp)
    logger.info("Registered Property Views blueprint")