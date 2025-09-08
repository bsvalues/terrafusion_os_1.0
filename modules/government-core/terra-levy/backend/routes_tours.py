"""
Routes for guided tours in the Levy Calculation System.

This module defines routes for the guided tour functionality of the application.
"""

from flask import Blueprint, render_template, jsonify, request, redirect, url_for, session, current_app
from flask_login import login_required


# Create blueprint
tours_bp = Blueprint('tours', __name__, url_prefix='/tours')

# Define tour configurations
TOUR_CONFIGS = {
    'dashboard': {
        'id': 'dashboard',
        'name': 'Dashboard Tour',
        'description': 'Learn how to use the dashboard and understand key metrics.',
        'route': 'dashboard.index',
        'steps': 6
    },
    'levy_calculator': {
        'id': 'levy_calculator',
        'name': 'Levy Calculator Tour',
        'description': 'Discover how to calculate property tax levies with our calculator.',
        'route': 'levy_calculator.calculator',
        'steps': 5
    },
    'data_import': {
        'id': 'data_import',
        'name': 'Data Import Tour',
        'description': 'Learn how to import tax district and property data.',
        'route': 'data_management.import_data',
        'steps': 4
    },
    'property_search': {
        'id': 'property_search',
        'name': 'Property Search Tour',
        'description': 'Explore how to search for properties and view their details.',
        'route': 'data_management.property_lookup',
        'steps': 4
    },
    'admin-dashboard': {
        'id': 'admin-dashboard',
        'name': 'Admin Dashboard Tour',
        'description': 'Learn how to manage users, districts, and system settings as an administrator.',
        'route': 'admin.dashboard',
        'steps': 5
    },
    'public-lookup': {
        'id': 'public-lookup',
        'name': 'Public Lookup Tour',
        'description': 'Discover how to use the public property tax lookup portal.',
        'route': 'public.lookup',
        'steps': 4
    },
    'reports': {
        'id': 'reports',
        'name': 'Reports Tour',
        'description': 'Learn how to generate and customize reports about tax data.',
        'route': 'reports.index',
        'steps': 5
    },
    'levy-calculation': {
        'id': 'levy-calculation',
        'name': 'Levy Calculation Tour',
        'description': 'Master the levy calculation process with this guided tour.',
        'route': 'levy_calculator.calculator',
        'steps': 6
    }
}


@tours_bp.route('/')
@login_required
def tour_index():
    """Show available tours in the system."""
    return render_template('tours/index.html', tours=list(TOUR_CONFIGS.values()))


@tours_bp.route('/start/<tour_name>')
@login_required
def start_tour(tour_name):
    """
    Route to start a specific guided tour.
    
    Args:
        tour_name: Name of the tour to start
        
    Returns:
        Redirects to the page for the specified tour with tour param
    """
    # Check if the tour exists
    if tour_name not in TOUR_CONFIGS:
        return render_template('simple_404.html', 
                              error_code=404, 
                              error_title="Tour Not Found",
                              error_message="The requested tour does not exist."), 404
    
    # Get the tour configuration
    tour = TOUR_CONFIGS[tour_name]
    
    # Set the session variable to indicate the tour should be shown
    session['current_tour'] = tour_name
    
    # Redirect to the page for this tour
    return redirect(url_for(tour['route'], tour=tour_name))


@tours_bp.route('/settings', methods=['GET', 'POST'])
@login_required
def tour_settings():
    """Manage tour settings (enable/disable auto-tours)."""
    if request.method == 'POST':
        # Handle setting update
        enable_auto_tours = request.form.get('enable_auto_tours', 'true') == 'true'
        
        # Save to session
        session['enable_auto_tours'] = enable_auto_tours
        
        # Return JSON response if it's an API request
        if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'status': 'success', 'message': 'Tour settings updated'})
        
        # Redirect to tours page if it's a form submission
        return redirect(url_for('tours.tour_index'))
    
    # GET request - show settings page
    return render_template('tours/settings.html')


@tours_bp.route('/reset', methods=['POST'])
@login_required
def reset_tours():
    """Reset tour completion status."""
    # Clear all tour completion status from session
    for key in list(session.keys()):
        if key.startswith('tour_') and key.endswith('_completed'):
            session.pop(key, None)
    
    # Return JSON response
    return jsonify({'status': 'success', 'message': 'Tour completion status has been reset'})


def register_routes(app):
    """Register the tours blueprint with the application."""
    # The blueprint is registered in app.py, no need to register again here
    app.logger.info('Tours blueprint registered')