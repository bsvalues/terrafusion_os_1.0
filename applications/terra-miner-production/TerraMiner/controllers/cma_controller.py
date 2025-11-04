"""
Controller for Comparative Market Analysis (CMA) features.

This module provides routes for generating and viewing CMA reports.
"""

import logging
import json
from flask import Blueprint, render_template, request, redirect, url_for, flash, abort, jsonify, g, current_app
from werkzeug.exceptions import BadRequest

from services.cma_service import CMAService
from ai.rag.property_retriever import PropertyRetriever

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint with a unique name to avoid conflicts with the API blueprint
cma_bp = Blueprint('cma_ui', __name__, url_prefix='/cma')

# Create CMA service
cma_service = CMAService()

# Create property retriever
property_retriever = PropertyRetriever()

@cma_bp.route('/', methods=['GET'])
def cma_home():
    """CMA home page."""
    return render_template('cma_home.html')

@cma_bp.route('/generator', methods=['GET', 'POST'])
def cma_generator():
    """CMA generator page."""
    # Sample properties for different locations
    sample_properties = {
        "walla_walla": {
            'subject_address': '4234 OLD MILTON HWY',
            'subject_city': 'WALLA WALLA',
            'subject_state': 'WA',
            'subject_zip': '99362',
            'subject_beds': 4,
            'subject_baths': 3.5,
            'subject_sqft': 2426,
            'subject_lot_size': 14000,
            'subject_year_built': 2008,
            'subject_property_type': 'Single Family',
            'subject_price': 789000
        },
        "seattle": {
            'subject_address': '123 QUEEN ANNE AVE N',
            'subject_city': 'SEATTLE',
            'subject_state': 'WA',
            'subject_zip': '98109',
            'subject_beds': 3,
            'subject_baths': 2.5,
            'subject_sqft': 1850,
            'subject_lot_size': 3200,
            'subject_year_built': 2005,
            'subject_property_type': 'Condo',
            'subject_price': 950000
        },
        "spokane": {
            'subject_address': '456 SOUTH HILL BLVD',
            'subject_city': 'SPOKANE',
            'subject_state': 'WA',
            'subject_zip': '99203',
            'subject_beds': 4,
            'subject_baths': 3.0,
            'subject_sqft': 2750,
            'subject_lot_size': 9500,
            'subject_year_built': 1995,
            'subject_property_type': 'Single Family',
            'subject_price': 625000
        }
    }
    
    if request.method == 'POST':
        try:
            # Get form data
            data = {
                'subject_address': request.form.get('subject_address'),
                'subject_city': request.form.get('subject_city'),
                'subject_state': request.form.get('subject_state'),
                'subject_zip': request.form.get('subject_zip'),
                'subject_beds': int(request.form.get('subject_beds', 3)),
                'subject_baths': float(request.form.get('subject_baths', 2)),
                'subject_sqft': int(request.form.get('subject_sqft', 1800)),
                'subject_lot_size': int(request.form.get('subject_lot_size', 5000)),
                'subject_year_built': int(request.form.get('subject_year_built', 2000)),
                'subject_property_type': request.form.get('subject_property_type', 'Single Family'),
                'subject_price': int(request.form.get('subject_price', 0)) if request.form.get('subject_price') else None
            }
            
            # Validate required fields
            required_fields = ['subject_address', 'subject_city', 'subject_state', 'subject_zip']
            for field in required_fields:
                if not data.get(field):
                    flash(f"Missing required field: {field.replace('subject_', '')}", 'error')
                    return render_template('cma_generator.html', form_data=data, sample_properties=sample_properties)
            
            # Create report
            report_id = cma_service.create_report(data)
            
            # Generate report
            cma_service.generate_report(report_id)
            
            # Redirect to report page
            flash('CMA report generated successfully', 'success')
            return redirect(url_for('cma_ui.view_report', report_id=report_id))
            
        except Exception as e:
            logger.exception(f"Error generating CMA report: {str(e)}")
            flash(f"Error generating CMA report: {str(e)}", 'error')
            return render_template('cma_generator.html', form_data=request.form, sample_properties=sample_properties)
    
    # GET request, show form
    property_id = request.args.get('property_id')
    template_id = request.args.get('template')
    form_data = {}
    
    # If template ID is provided, use a sample property template
    if template_id and template_id in sample_properties:
        form_data = sample_properties[template_id]
        flash(f'Sample property from {form_data["subject_city"]} loaded successfully', 'success')
    
    # If property_id provided, try to get property details
    elif property_id:
        try:
            # Get property details from Zillow service
            property_data = cma_service.zillow_service.get_property_details(property_id)
            
            if property_data:
                # Map property fields to form data
                form_data = {
                    'subject_address': property_data.get('address'),
                    'subject_city': property_data.get('city'),
                    'subject_state': property_data.get('state'),
                    'subject_zip': property_data.get('zip_code'),
                    'subject_beds': property_data.get('beds', 3),
                    'subject_baths': property_data.get('baths', 2),
                    'subject_sqft': property_data.get('sqft', 1800),
                    'subject_lot_size': property_data.get('lot_size', 5000),
                    'subject_year_built': property_data.get('year_built', 2000),
                    'subject_property_type': property_data.get('property_type', 'Single Family'),
                    'subject_price': property_data.get('price')
                }
                flash('Property details loaded successfully', 'success')
            else:
                flash('Property not found, try using one of our sample properties instead', 'warning')
        except Exception as e:
            logger.exception(f"Error loading property details: {str(e)}")
            flash(f"Error loading property details. Try using a sample property instead.", 'warning')
    
    return render_template('cma_generator.html', form_data=form_data, sample_properties=sample_properties)

@cma_bp.route('/reports', methods=['GET'])
def list_reports():
    """List CMA reports."""
    # Get reports
    reports = cma_service.get_reports(limit=20)
    
    return render_template('cma_reports.html', reports=reports)

@cma_bp.route('/reports/<int:report_id>', methods=['GET'])
def view_report(report_id):
    """View a CMA report."""
    try:
        # Get report
        report = cma_service.get_report(report_id)
        
        # Render template
        return render_template('cma_report.html', report=report)
        
    except ValueError as e:
        flash(f"Report not found: {str(e)}", 'error')
        return redirect(url_for('cma_ui.list_reports'))
        
    except Exception as e:
        logger.exception(f"Error viewing CMA report: {str(e)}")
        flash(f"Error viewing CMA report: {str(e)}", 'error')
        return redirect(url_for('cma_ui.list_reports'))

@cma_bp.route('/api/lookup-property', methods=['GET'])
def lookup_property():
    """API endpoint to lookup a property by address."""
    try:
        # Get address from query parameters
        address = request.args.get('address', '')
        
        if not address or len(address) < 3:
            return jsonify({'error': 'Address must be at least 3 characters long'}), 400
        
        # Hard-coded sample properties to return based on search terms
        hard_coded_properties = [
            {
                'id': 'ww1',
                'address': '4234 OLD MILTON HWY',
                'city': 'WALLA WALLA',
                'state': 'WA',
                'zip_code': '99362',
                'beds': 4,
                'baths': 3.5,
                'sqft': 2426,
                'lot_size': 14000,
                'year_built': 2008,
                'property_type': 'Single Family',
                'price': 789000
            },
            {
                'id': 'seattle1',
                'address': '123 QUEEN ANNE AVE N',
                'city': 'SEATTLE',
                'state': 'WA',
                'zip_code': '98109',
                'beds': 3,
                'baths': 2.5,
                'sqft': 1850,
                'lot_size': 3200,
                'year_built': 2005,
                'property_type': 'Condo',
                'price': 950000
            },
            {
                'id': 'spokane1',
                'address': '456 SOUTH HILL BLVD',
                'city': 'SPOKANE',
                'state': 'WA',
                'zip_code': '99203',
                'beds': 4,
                'baths': 3.0,
                'sqft': 2750,
                'lot_size': 9500,
                'year_built': 1995,
                'property_type': 'Single Family',
                'price': 625000
            },
            {
                'id': 'richland1',
                'address': '106 OAKMONT CT',
                'city': 'RICHLAND',
                'state': 'WA',
                'zip_code': '99352',
                'beds': 3,
                'baths': 2.0,
                'sqft': 1800,
                'lot_size': 5000,
                'year_built': 2000,
                'property_type': 'Single Family',
                'price': 450000
            }
        ]
            
        # Filter properties based on the search string
        address_lower = address.lower()
        matching_properties = [
            prop for prop in hard_coded_properties 
            if address_lower in prop['address'].lower() or 
               address_lower in prop['city'].lower() or
               address_lower in prop['zip_code'].lower()
        ]
        
        # If none of our hard-coded properties match, try the database
        if not matching_properties:
            logger.info(f"No matching hard-coded properties for '{address}', trying database")
            # Use the property retriever to search for properties by address
            db_properties = property_retriever.retrieve_by_address(address, limit=5)
            
            # Format the results from the database
            if db_properties:
                formatted_properties = []
                for prop in db_properties:
                    # Convert property data to the format expected by the CMA form
                    formatted_property = {
                        'id': prop.get('id'),
                        'address': prop.get('address', ''),
                        'city': prop.get('city', ''),
                        'state': prop.get('state', ''),
                        'zip_code': prop.get('zip_code', ''),
                        'beds': prop.get('beds', 0) or prop.get('bedrooms', 0) or 3,
                        'baths': prop.get('baths', 0) or prop.get('bathrooms', 0) or 2,
                        'sqft': prop.get('sqft', 0) or prop.get('square_feet', 0) or 1800,
                        'lot_size': prop.get('lot_size', 0) or prop.get('lot_square_feet', 0) or 5000,
                        'year_built': prop.get('year_built', 0) or 2000,
                        'property_type': prop.get('property_type', 'Single Family'),
                        'price': prop.get('price', 0) or prop.get('estimated_value', 0)
                    }
                    formatted_properties.append(formatted_property)
                
                matching_properties = formatted_properties
        
        logger.info(f"Found {len(matching_properties)} properties matching '{address}'")
        return jsonify({'properties': matching_properties}), 200
        
    except Exception as e:
        logger.exception(f"Error looking up property: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cma_bp.route('/reports/<int:report_id>/delete', methods=['POST'])
def delete_report(report_id):
    """Delete a CMA report."""
    try:
        # Delete report
        success = cma_service.delete_report(report_id)
        
        if success:
            flash('CMA report deleted successfully', 'success')
        else:
            flash('Report not found', 'error')
        
        # Redirect to reports list
        return redirect(url_for('cma_ui.list_reports'))
        
    except Exception as e:
        logger.exception(f"Error deleting CMA report: {str(e)}")
        flash(f"Error deleting CMA report: {str(e)}", 'error')
        return redirect(url_for('cma_ui.list_reports'))

# Function to register blueprint with Flask app
def register_cma_blueprint(app):
    """Register the CMA blueprint with the Flask app."""
    try:
        # Import here to avoid circular imports
        from core import register_blueprint_once
        
        # Register blueprint only once
        if register_blueprint_once(app, cma_bp):
            logger.info("CMA controller registered successfully")
        else:
            logger.info("CMA controller was already registered")
    except Exception as e:
        # If there's an error with the blueprint registration, log it
        logger.warning(f"CMA controller blueprint registration issue: {str(e)}")