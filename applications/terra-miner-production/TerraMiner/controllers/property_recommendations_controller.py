"""
Controller for AI-powered property recommendations.

This module provides routes for accessing property recommendations
based on user preferences and interaction history.
"""

import logging
import uuid

from flask import Blueprint, render_template, request, redirect, url_for, jsonify, current_app, g, session

from app import render_template_with_fallback

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
property_rec_controller = Blueprint('property_recommendations', __name__)


@property_rec_controller.route('/property-recommendations')
def property_recommendations_page():
    """
    Render the AI-powered property recommendations page.
    
    This page showcases personalized property recommendations for users based on
    their preferences, search history, and property characteristics.
    
    Returns:
        Rendered template for the property recommendations page
    """
    try:
        # Generate page ID for tracking
        page_id = str(uuid.uuid4())
        logger.info(f"Property recommendations page accessed (ID: {page_id})")
        
        # Get any query parameters to pre-fill the preferences form
        location = request.args.get('location', '')
        property_type = request.args.get('property_type', '')
        min_price = request.args.get('min_price', '')
        max_price = request.args.get('max_price', '')
        min_bedrooms = request.args.get('min_bedrooms', '')
        
        return render_template_with_fallback('property_recommendations.html', 
            page_title="AI Property Recommendations",
            meta_description="Get personalized property recommendations based on your preferences and search history.",
            page_id=page_id,
            location=location,
            property_type=property_type,
            min_price=min_price,
            max_price=max_price,
            min_bedrooms=min_bedrooms
        )
    except Exception as e:
        # Generate error ID for tracking
        error_id = str(uuid.uuid4())
        logger.error(f"Error rendering property recommendations page (ID: {error_id}): {str(e)}", exc_info=True)
        
        # Render error page with tracking ID
        return render_template_with_fallback('error.html',
            error_title="Property Recommendations Unavailable",
            error_message="We're sorry, but the property recommendations feature is currently unavailable. Please try again later.",
            error_id=error_id,
            page_title="Error - Property Recommendations"
        ), 500