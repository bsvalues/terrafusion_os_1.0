"""
Routes for examples and components demonstration.

This module provides routes for showcasing UI components,
interactive elements, and design patterns.
"""

from flask import Blueprint, render_template

examples_bp = Blueprint('examples', __name__, url_prefix='/examples')

@examples_bp.route('/')
def index():
    """Main examples page showcasing available component demos."""
    return render_template('examples/index.html')

@examples_bp.route('/forms')
def forms_demo():
    """Demo page for interactive form elements."""
    return render_template('examples/form_demo.html')
    
@examples_bp.route('/cards')
def cards_demo():
    """Demo page for Keras-style carousel cards."""
    return render_template('examples/cards_demo.html')

@examples_bp.route('/loading-animations')
def loading_animations_demo():
    """Demo page for tax-themed loading animations."""
    return render_template('examples/loading_animations.html')