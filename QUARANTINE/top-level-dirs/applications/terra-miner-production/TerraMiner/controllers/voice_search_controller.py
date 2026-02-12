"""
Controller for voice-activated property search functionality.

This module provides the routes and views for the voice search interface.
"""

import logging
import uuid

from flask import Blueprint, render_template, request, redirect, url_for, jsonify, current_app

from app import render_template_with_fallback

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
voice_search_bp = Blueprint('voice_search', __name__)


@voice_search_bp.route('/voice-search')
def voice_search_page():
    """
    Render the voice-activated property search page.
    
    This page allows users to search for properties using voice commands
    processed with natural language understanding.
    
    Returns:
        Rendered template for the voice search page
    """
    try:
        # Generate page ID for tracking
        page_id = str(uuid.uuid4())
        logger.info(f"Voice search page accessed (ID: {page_id})")
        
        return render_template_with_fallback('voice_search.html', 
            page_title="Voice-Activated Property Search",
            meta_description="Search for properties using your voice with natural language understanding.",
            page_id=page_id
        )
    except Exception as e:
        # Generate error ID for tracking
        error_id = str(uuid.uuid4())
        logger.error(f"Error rendering voice search page (ID: {error_id}): {str(e)}", exc_info=True)
        
        # Render error page with tracking ID
        return render_template_with_fallback('error.html',
            error_title="Voice Search Unavailable",
            error_message="We're sorry, but the voice search feature is currently unavailable. Please try again later.",
            error_id=error_id,
            page_title="Error - Voice Search"
        ), 500