"""
Mobile Routes Module

This module provides mobile-optimized routes and device detection for the application.
"""

import re
from flask import request, redirect, url_for, render_template, Blueprint, current_app, g

# Create blueprint
mobile_bp = Blueprint('mobile', __name__, url_prefix='/mobile')

# Regular expression for detecting mobile user agents
MOBILE_AGENT_REGEX = r"Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini"

def detect_mobile():
    """
    Detect if the request is coming from a mobile device.
    
    Returns:
        bool: True if the request is from a mobile device, False otherwise
    """
    user_agent = request.headers.get('User-Agent', '')
    return bool(re.search(MOBILE_AGENT_REGEX, user_agent))

@mobile_bp.before_app_request
def before_request():
    """
    Before any request, check if it's from a mobile device and set a flag.
    """
    is_mobile = detect_mobile()
    request.MOBILE = is_mobile
    g.MOBILE = is_mobile

# Mobile routes
@mobile_bp.route('/')
def index():
    """Mobile-optimized home page"""
    return render_template('mobile/index.html')

@mobile_bp.route('/assessment-map')
def assessment_map():
    """Mobile-optimized property assessment map"""
    return render_template('mobile/assessment_map.html')

@mobile_bp.route('/property/<property_id>')
def property_detail(property_id):
    """Mobile-optimized property detail view"""
    return render_template('mobile/property_detail.html', property_id=property_id)

@mobile_bp.route('/property/<property_id>/assessment')
def property_assessment(property_id):
    """Mobile-optimized property assessment form"""
    return render_template('mobile/property_assessment.html', property_id=property_id)

# Route handlers that override main app routes for mobile devices
def handle_assessment_map():
    """
    Handle the assessment map page, redirecting to mobile version if on a mobile device.
    """
    if detect_mobile():
        return redirect(url_for('mobile.assessment_map'))
    return None

def handle_property_detail(property_id):
    """
    Handle the property detail page, redirecting to mobile version if on a mobile device.
    """
    if detect_mobile():
        return redirect(url_for('mobile.property_detail', property_id=property_id))
    return None

def handle_property_assessment(property_id):
    """
    Handle the property assessment page, redirecting to mobile version if on a mobile device.
    """
    if detect_mobile():
        return redirect(url_for('mobile.property_assessment', property_id=property_id))
    return None

def register_mobile_handlers(app):
    """
    Register mobile handlers with the main Flask app.
    
    Args:
        app: The Flask application instance
    """
    # Register the blueprint
    app.register_blueprint(mobile_bp)
    
    # Add before_request handlers for main app routes to redirect to mobile versions
    original_assessment_map_view = app.view_functions['assessment_map']
    
    def assessment_map_wrapper(*args, **kwargs):
        mobile_result = handle_assessment_map()
        if mobile_result:
            return mobile_result
        return original_assessment_map_view(*args, **kwargs)
    
    app.view_functions['assessment_map'] = assessment_map_wrapper