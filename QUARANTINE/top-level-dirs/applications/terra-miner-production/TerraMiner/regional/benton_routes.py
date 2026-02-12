"""
Benton County regional routes.

This module provides routes specific to Benton County property assessment data,
ensuring all data is authentic and complies with IAAO and USPAP standards.
"""

import logging
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from regional.assessment_api import (
    get_assessment_data,
    search_assessment_properties,
    get_supported_counties
)

logger = logging.getLogger(__name__)

# Create blueprint
benton_blueprint = Blueprint('benton', __name__)

@benton_blueprint.route('/property/search', methods=['GET', 'POST'])
def property_search():
    """
    Handle property search requests.
    
    GET: Display search form
    POST: Process search and redirect to results or property details
    """
    if request.method == 'POST':
        property_id = request.form.get('property_id')
        county = request.form.get('county', 'benton')
        
        # If a specific property ID was entered, go directly to the property details
        if property_id:
            return redirect(url_for('benton.property_details', 
                                    property_id=property_id, 
                                    county=county))
        
        # If a search query was entered, redirect to the search results
        search_query = request.form.get('search_query')
        if search_query:
            return redirect(url_for('benton.property_search_results',
                                    query=search_query,
                                    county=county))
        
        # If neither was provided, flash an error and redisplay the form
        flash('Please enter a property ID or search query.', 'error')
        
    # For GET requests or if we get here after a POST (e.g., validation failed)
    counties = get_supported_counties()
    return render_template('property_search.html', counties=counties)

@benton_blueprint.route('/property/results')
def property_search_results():
    """Display property search results."""
    search_query = request.args.get('query', '')
    county = request.args.get('county', 'benton')
    limit = request.args.get('limit', 10, type=int)
    
    if not search_query:
        flash('Please enter a search query.', 'error')
        return redirect(url_for('benton.property_search'))
    
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

@benton_blueprint.route('/property/<property_id>')
def property_details(property_id):
    """Display detailed property information."""
    county = request.args.get('county', 'benton')
    
    # Get property data
    property_data = get_assessment_data(property_id, county)
    
    # Check for errors
    if 'error' in property_data:
        return render_template('property_record_error.html',
                              property_id=property_id,
                              county=county,
                              error=property_data['message'],
                              data_source=property_data.get('data_source', 'Unknown'))
    
    # Render property record card
    return render_template('property_record_card.html',
                          property_id=property_id,
                          property_data=property_data['property_data'],
                          county=county,
                          data_source=property_data['data_source'])

@benton_blueprint.route('/api/property/<property_id>')
def api_property_details(property_id):
    """API endpoint for property details."""
    county = request.args.get('county', 'benton')
    
    # Get property data
    property_data = get_assessment_data(property_id, county)
    
    # Return as JSON
    return jsonify(property_data)

@benton_blueprint.route('/api/property/search')
def api_property_search():
    """API endpoint for property search."""
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

def register_blueprint(app):
    """Register the blueprint with the Flask app."""
    app.register_blueprint(benton_blueprint, url_prefix='/benton')
    logger.info("Registered Benton County Property blueprint")