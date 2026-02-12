"""
Valuation Routes Module

This module provides Flask routes for accessing the valuation services.
"""

import os
import json
import logging
from datetime import datetime
from flask import Blueprint, request, render_template, jsonify, redirect, url_for

from mcp.valuation import (
    current_use_service,
    historic_property_service,
    senior_exemption_service
)
from mcp.integrators.valuation_integrator import valuation_integrator
from auth import login_required, permission_required

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
valuation_bp = Blueprint('valuation', __name__, url_prefix='/valuation')

@valuation_bp.route('/', methods=['GET'])
@login_required
def valuation_dashboard():
    """Render the valuation dashboard page"""
    return render_template(
        'valuation_dashboard.html',
        title="Valuation Services Dashboard",
        description="Tax law compliant property valuation tools for Washington State"
    )

@valuation_bp.route('/current-use', methods=['GET', 'POST'])
@login_required
@permission_required('valuation_access')
def current_use_calculator():
    """Current use valuation calculator page"""
    if request.method == 'POST':
        try:
            # Get form data
            soil_type = int(request.form.get('soil_type', 1))
            acres = float(request.form.get('acres', 0))
            irrigated = request.form.get('irrigated') == 'true'
            year = int(request.form.get('year', datetime.now().year))
            
            # Calculate valuation
            result = current_use_service.calculate_farm_land_value(
                soil_type=soil_type,
                acres=acres,
                irrigated=irrigated,
                assessment_year=year
            )
            
            # Return result
            return render_template(
                'current_use_calculator.html',
                title="Current Use Valuation",
                result=result,
                form_data={
                    'soil_type': soil_type,
                    'acres': acres,
                    'irrigated': irrigated,
                    'year': year
                }
            )
        except Exception as e:
            logger.error(f"Error in current use calculation: {str(e)}")
            return render_template(
                'current_use_calculator.html',
                title="Current Use Valuation",
                error=f"Calculation error: {str(e)}",
                form_data=request.form
            )
    
    # GET request - show calculator form
    return render_template(
        'current_use_calculator.html',
        title="Current Use Valuation"
    )

@valuation_bp.route('/historic-property', methods=['GET', 'POST'])
@login_required
@permission_required('valuation_access')
def historic_property_calculator():
    """Historic property special valuation calculator page"""
    if request.method == 'POST':
        try:
            # Get form data
            property_value = float(request.form.get('property_value', 0))
            rehabilitation_costs = float(request.form.get('rehabilitation_costs', 0))
            rehabilitation_date_str = request.form.get('rehabilitation_date')
            historic_register = request.form.get('historic_register')
            
            # Parse date
            rehabilitation_date = datetime.strptime(rehabilitation_date_str, '%Y-%m-%d')
            
            # Calculate valuation
            result = historic_property_service.calculate_special_valuation(
                property_value=property_value,
                rehabilitation_costs=rehabilitation_costs,
                rehabilitation_date=rehabilitation_date,
                historic_register=historic_register
            )
            
            # Return result
            return render_template(
                'historic_property_calculator.html',
                title="Historic Property Valuation",
                result=result,
                form_data={
                    'property_value': property_value,
                    'rehabilitation_costs': rehabilitation_costs,
                    'rehabilitation_date': rehabilitation_date_str,
                    'historic_register': historic_register
                }
            )
        except Exception as e:
            logger.error(f"Error in historic property calculation: {str(e)}")
            return render_template(
                'historic_property_calculator.html',
                title="Historic Property Valuation",
                error=f"Calculation error: {str(e)}",
                form_data=request.form
            )
    
    # GET request - show calculator form
    return render_template(
        'historic_property_calculator.html',
        title="Historic Property Valuation"
    )

@valuation_bp.route('/senior-exemption', methods=['GET', 'POST'])
@login_required
@permission_required('valuation_access')
def senior_exemption_calculator():
    """Senior/disabled exemption calculator page"""
    if request.method == 'POST':
        try:
            # Get form data
            property_value = float(request.form.get('property_value', 0))
            income = float(request.form.get('income', 0))
            age = request.form.get('age')
            age = int(age) if age else None
            is_disabled = request.form.get('is_disabled') == 'true'
            is_veteran = request.form.get('is_veteran') == 'true'
            is_widow_widower = request.form.get('is_widow_widower') == 'true'
            year = int(request.form.get('year', datetime.now().year))
            
            # Calculate exemption
            result = senior_exemption_service.calculate_exemption(
                property_value=property_value,
                income=income,
                age=age,
                is_disabled=is_disabled,
                is_veteran=is_veteran,
                is_widow_widower=is_widow_widower,
                assessment_year=year
            )
            
            # Return result
            return render_template(
                'senior_exemption_calculator.html',
                title="Senior/Disabled Exemption",
                result=result,
                form_data={
                    'property_value': property_value,
                    'income': income,
                    'age': age,
                    'is_disabled': is_disabled,
                    'is_veteran': is_veteran,
                    'is_widow_widower': is_widow_widower,
                    'year': year
                }
            )
        except Exception as e:
            logger.error(f"Error in senior exemption calculation: {str(e)}")
            return render_template(
                'senior_exemption_calculator.html',
                title="Senior/Disabled Exemption",
                error=f"Calculation error: {str(e)}",
                form_data=request.form
            )
    
    # GET request - show calculator form
    return render_template(
        'senior_exemption_calculator.html',
        title="Senior/Disabled Exemption"
    )

# API routes for valuation services

@valuation_bp.route('/api/current-use', methods=['POST'])
@login_required
@permission_required('valuation_api_access')
def api_current_use():
    """API endpoint for current use valuation"""
    try:
        # Get JSON data
        data = request.json
        
        # Process with integrator
        result = valuation_integrator.process_valuation_request("current_use", data)
        
        # Return result
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in current use API: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"API error: {str(e)}"
        }), 400

@valuation_bp.route('/api/historic-property', methods=['POST'])
@login_required
@permission_required('valuation_api_access')
def api_historic_property():
    """API endpoint for historic property valuation"""
    try:
        # Get JSON data
        data = request.json
        
        # Process with integrator
        result = valuation_integrator.process_valuation_request("historic_property", data)
        
        # Return result
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in historic property API: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"API error: {str(e)}"
        }), 400

@valuation_bp.route('/api/senior-exemption', methods=['POST'])
@login_required
@permission_required('valuation_api_access')
def api_senior_exemption():
    """API endpoint for senior/disabled exemption"""
    try:
        # Get JSON data
        data = request.json
        
        # Process with integrator
        result = valuation_integrator.process_valuation_request("senior_exemption", data)
        
        # Return result
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in senior exemption API: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"API error: {str(e)}"
        }), 400