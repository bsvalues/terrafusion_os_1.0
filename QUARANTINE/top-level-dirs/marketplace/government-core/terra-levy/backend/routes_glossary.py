"""
Routes for the tax terminology glossary.

This module provides:
1. Route for the comprehensive glossary page
2. Tooltip-based contextual explanations throughout the app
"""

from flask import Blueprint, render_template
from utils.tooltip_utils import TAX_TERMINOLOGY

# Create blueprint
glossary_bp = Blueprint('glossary', __name__, url_prefix='/glossary')

@glossary_bp.route('/')
def glossary():
    """
    Display a comprehensive glossary of tax terminology.
    """
    # Categorize terms for the categorical view
    levy_terms = []
    assessment_terms = []
    special_terms = []
    admin_terms = []
    statistical_terms = []
    advanced_terms = []
    
    # These lists help classify terms into categories
    levy_keywords = ['levy', 'tax code', 'tax district', 'rate', 'banked', 'statutory', 'lid']
    assessment_keywords = ['assessed', 'assessment', 'value', 'market', 'collection', 'fair']
    special_keywords = ['special', 'excess', 'bond', 'regular', 'm&o', 'enhancement']
    admin_keywords = ['roll', 'millage', 'mill', 'abatement', 'tif', 'exemption', 'deferral', 'appeal']
    statistical_keywords = ['mean', 'median', 'variance', 'standard deviation', 'coefficient', 'z-score', 'average']
    advanced_keywords = ['bill impact', 'forecast', 'confidence', 'moving', 'distribution', 'threshold']
    
    # Categorize each term
    for term, definition in TAX_TERMINOLOGY.items():
        term_lower = term.lower()
        
        if any(keyword in term_lower for keyword in levy_keywords):
            levy_terms.append((term, definition))
        elif any(keyword in term_lower for keyword in assessment_keywords):
            assessment_terms.append((term, definition))
        elif any(keyword in term_lower for keyword in special_keywords):
            special_terms.append((term, definition))
        elif any(keyword in term_lower for keyword in admin_keywords):
            admin_terms.append((term, definition))
        elif any(keyword in term_lower for keyword in statistical_keywords):
            statistical_terms.append((term, definition))
        elif any(keyword in term_lower for keyword in advanced_keywords):
            advanced_terms.append((term, definition))
        else:
            # Default to levy terms if unclassified
            levy_terms.append((term, definition))
    
    # Sort terms within categories
    levy_terms.sort(key=lambda x: x[0].lower())
    assessment_terms.sort(key=lambda x: x[0].lower())
    special_terms.sort(key=lambda x: x[0].lower())
    admin_terms.sort(key=lambda x: x[0].lower())
    statistical_terms.sort(key=lambda x: x[0].lower())
    advanced_terms.sort(key=lambda x: x[0].lower())
    
    # Use the correct template path
    return render_template(
        'public/glossary.html',
        tax_terminology=TAX_TERMINOLOGY,
        levy_terms=levy_terms,
        assessment_terms=assessment_terms,
        special_terms=special_terms,
        admin_terms=admin_terms,
        statistical_terms=statistical_terms,
        advanced_terms=advanced_terms
    )

def init_glossary_routes(app):
    """
    Initialize glossary routes with the Flask app.
    """
    app.register_blueprint(glossary_bp)
    app.logger.info('Glossary routes initialized')