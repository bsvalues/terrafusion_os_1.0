"""
UI Components Routes Module

This module provides Flask routes for UI components demonstration and documentation.
"""
from flask import render_template, Blueprint

# Create a blueprint for UI components routes
ui_components_bp = Blueprint('ui_components', __name__)

@ui_components_bp.route('/form-components')
def form_components_demo():
    """Form components demo page"""
    return render_template('form_components_demo.html')

@ui_components_bp.route('/design-system')
def design_system():
    """Design system documentation page"""
    return render_template('design_system.html')

def register_ui_components_routes(app):
    """Register UI components routes with the Flask app"""
    # Import form_components template
    try:
        with app.app_context():
            app.register_blueprint(ui_components_bp)
    except Exception as e:
        import logging
        logging.error(f"Error registering UI components routes: {e}")
        # Continue without ui components routes
        pass