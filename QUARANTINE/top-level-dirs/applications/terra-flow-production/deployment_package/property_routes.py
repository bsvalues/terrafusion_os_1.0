"""
Property Routes Module

This module provides Flask routes for property management:
- Property listing and searching
- Property details, creation, editing, and deletion
- Property assessments
- Property files and documents
"""

import os
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, send_file
from werkzeug.utils import secure_filename
from flask_login import login_required, current_user

from auth import permission_required, is_authenticated
import property_model as pm
from property_model import get_user_id

logger = logging.getLogger(__name__)

# Blueprint Configuration
property_bp = Blueprint(
    'property', 
    __name__, 
    url_prefix='/property',
    template_folder='templates'
)

# Constants
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'zip'}
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'property_files')

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Property Routes

@property_bp.route('/')
@login_required
def property_list():
    """Render the property list page"""
    return render_template('property/property_list.html')


@property_bp.route('/api/list')
@login_required
def property_api_list():
    """Get properties API endpoint"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    
    # Get filter parameters from request
    filters = {}
    filter_params = [
        'parcel_id', 'address_like', 'city', 'state', 'zip_code', 
        'property_class', 'status', 'total_value_gte', 'total_value_lte',
        'year_built_gte', 'year_built_lte'
    ]
    
    for param in filter_params:
        value = request.args.get(param)
        if value:
            filters[param] = value
    
    # Get properties with pagination
    result = pm.get_properties(filters, page, per_page)
    
    # Convert property objects to dictionaries
    if result['success'] and result['data']:
        result['data'] = [p.to_dict() for p in result['data']]
    
    return jsonify(result)


@property_bp.route('/<property_id>')
@login_required
def property_detail(property_id):
    """Render the property detail page"""
    property_obj = pm.get_property(property_id)
    
    if not property_obj:
        flash('Property not found.', 'error')
        return redirect(url_for('property.property_list'))
    
    return render_template('property/property_detail.html', property=property_obj)


@property_bp.route('/create', methods=['GET', 'POST'])
@login_required
@permission_required('property.create')
def property_create():
    """Create a new property"""
    if request.method == 'POST':
        # Get form data
        property_data = {
            'parcel_id': request.form.get('parcel_id'),
            'account_number': request.form.get('account_number'),
            'address': request.form.get('address'),
            'city': request.form.get('city'),
            'state': request.form.get('state'),
            'zip_code': request.form.get('zip_code'),
            'property_class': request.form.get('property_class'),
            'zoning': request.form.get('zoning'),
            'legal_description': request.form.get('legal_description'),
            'land_area': request.form.get('land_area'),
            'lot_size': request.form.get('lot_size'),
            'status': request.form.get('status'),
            'owner_name': request.form.get('owner_name'),
            'owner_address': request.form.get('owner_address'),
            'owner_city': request.form.get('owner_city'),
            'owner_state': request.form.get('owner_state'),
            'owner_zip': request.form.get('owner_zip'),
            'year_built': request.form.get('year_built'),
            'living_area': request.form.get('living_area'),
            'bedrooms': request.form.get('bedrooms'),
            'bathrooms': request.form.get('bathrooms'),
            'latitude': request.form.get('latitude'),
            'longitude': request.form.get('longitude'),
            'land_value': request.form.get('land_value'),
            'improvement_value': request.form.get('improvement_value'),
            'total_value': request.form.get('total_value'),
            'last_sale_date': request.form.get('last_sale_date'),
            'last_sale_price': request.form.get('last_sale_price'),
            'last_sale_document': request.form.get('last_sale_document')
        }
        
        # Remove empty values
        property_data = {k: v for k, v in property_data.items() if v}
        
        # Create property
        result = pm.create_property(property_data)
        
        if result['success']:
            flash('Property created successfully.', 'success')
            return redirect(url_for('property.property_detail', property_id=result['data'].id))
        else:
            flash(f'Error creating property: {result["error"]}', 'error')
    
    # GET request - render empty form
    property_obj = pm.Property()
    return render_template('property/property_form.html', property=property_obj)


@property_bp.route('/<property_id>/edit', methods=['GET', 'POST'])
@login_required
@permission_required('property.edit')
def property_edit(property_id):
    """Edit a property"""
    property_obj = pm.get_property(property_id)
    
    if not property_obj:
        flash('Property not found.', 'error')
        return redirect(url_for('property.property_list'))
    
    if request.method == 'POST':
        # Get form data
        property_data = {
            'parcel_id': request.form.get('parcel_id'),
            'account_number': request.form.get('account_number'),
            'address': request.form.get('address'),
            'city': request.form.get('city'),
            'state': request.form.get('state'),
            'zip_code': request.form.get('zip_code'),
            'property_class': request.form.get('property_class'),
            'zoning': request.form.get('zoning'),
            'legal_description': request.form.get('legal_description'),
            'land_area': request.form.get('land_area'),
            'lot_size': request.form.get('lot_size'),
            'status': request.form.get('status'),
            'owner_name': request.form.get('owner_name'),
            'owner_address': request.form.get('owner_address'),
            'owner_city': request.form.get('owner_city'),
            'owner_state': request.form.get('owner_state'),
            'owner_zip': request.form.get('owner_zip'),
            'year_built': request.form.get('year_built'),
            'living_area': request.form.get('living_area'),
            'bedrooms': request.form.get('bedrooms'),
            'bathrooms': request.form.get('bathrooms'),
            'latitude': request.form.get('latitude'),
            'longitude': request.form.get('longitude'),
            'land_value': request.form.get('land_value'),
            'improvement_value': request.form.get('improvement_value'),
            'total_value': request.form.get('total_value'),
            'last_sale_date': request.form.get('last_sale_date'),
            'last_sale_price': request.form.get('last_sale_price'),
            'last_sale_document': request.form.get('last_sale_document')
        }
        
        # Remove empty values
        property_data = {k: v for k, v in property_data.items() if v}
        
        # Update property
        result = pm.update_property(property_id, property_data)
        
        if result['success']:
            flash('Property updated successfully.', 'success')
            return redirect(url_for('property.property_detail', property_id=property_id))
        else:
            flash(f'Error updating property: {result["error"]}', 'error')
    
    # GET request - render form with property data
    return render_template('property/property_form.html', property=property_obj)


@property_bp.route('/<property_id>/delete', methods=['POST'])
@login_required
@permission_required('property.delete')
def property_delete(property_id):
    """Delete a property"""
    result = pm.delete_property(property_id)
    
    if result['success']:
        flash('Property deleted successfully.', 'success')
        return redirect(url_for('property.property_list'))
    else:
        flash(f'Error deleting property: {result["error"]}', 'error')
        return redirect(url_for('property.property_detail', property_id=property_id))


# Assessment Routes

@property_bp.route('/<property_id>/assessments')
@login_required
def property_assessments(property_id):
    """Render the property assessments page"""
    property_obj = pm.get_property(property_id)
    
    if not property_obj:
        flash('Property not found.', 'error')
        return redirect(url_for('property.property_list'))
    
    # Get assessments
    assessments = pm.get_property_assessments(property_id)
    
    # Sort assessments by tax year descending
    assessments.sort(key=lambda a: a.tax_year if a.tax_year else 0, reverse=True)
    
    # Latest and second latest assessment for comparison
    latest_assessment = assessments[0] if assessments else None
    second_latest_assessment = assessments[1] if len(assessments) > 1 else None
    
    return render_template(
        'property/property_assessments.html', 
        property=property_obj, 
        assessments=assessments,
        latest_assessment=latest_assessment,
        second_latest_assessment=second_latest_assessment
    )


@property_bp.route('/<property_id>/assessments/api')
@login_required
def property_assessments_api(property_id):
    """Get property assessments API endpoint"""
    assessments = pm.get_property_assessments(property_id)
    assessments_dict = [a.to_dict() for a in assessments]
    
    return jsonify({
        'success': True,
        'data': assessments_dict,
        'total': len(assessments_dict)
    })


@property_bp.route('/<property_id>/assessments/create', methods=['GET', 'POST'])
@login_required
@permission_required('property.assessment.create')
def assessment_create(property_id):
    """Create a new assessment for a property"""
    property_obj = pm.get_property(property_id)
    
    if not property_obj:
        flash('Property not found.', 'error')
        return redirect(url_for('property.property_list'))
    
    if request.method == 'POST':
        # Get form data
        assessment_data = {
            'property_id': property_id,
            'tax_year': request.form.get('tax_year'),
            'assessment_date': request.form.get('assessment_date'),
            'land_value': request.form.get('land_value'),
            'improvement_value': request.form.get('improvement_value'),
            'total_value': request.form.get('total_value'),
            'exemption_value': request.form.get('exemption_value', 0),
            'taxable_value': request.form.get('taxable_value'),
            'assessment_type': request.form.get('assessment_type', 'standard'),
            'assessment_status': request.form.get('assessment_status', 'pending'),
            'notes': request.form.get('notes')
        }
        
        # Remove empty values
        assessment_data = {k: v for k, v in assessment_data.items() if v}
        
        # Create assessment
        result = pm.create_assessment(assessment_data)
        
        if result['success']:
            flash('Assessment created successfully.', 'success')
            return redirect(url_for('property.property_assessments', property_id=property_id))
        else:
            flash(f'Error creating assessment: {result["error"]}', 'error')
    
    # GET request - render empty form
    assessment = pm.PropertyAssessment()
    assessment.property_id = property_id
    
    # Set default values
    current_year = datetime.now().year
    today_date = datetime.now().strftime('%Y-%m-%d')
    
    return render_template(
        'property/assessment_form.html', 
        property=property_obj, 
        assessment=assessment,
        current_year=current_year,
        today_date=today_date
    )


@property_bp.route('/<property_id>/assessments/<assessment_id>/edit', methods=['GET', 'POST'])
@login_required
@permission_required('property.assessment.edit')
def assessment_edit(property_id, assessment_id):
    """Edit a property assessment"""
    property_obj = pm.get_property(property_id)
    
    if not property_obj:
        flash('Property not found.', 'error')
        return redirect(url_for('property.property_list'))
    
    assessment = pm.get_assessment(assessment_id)
    
    if not assessment:
        flash('Assessment not found.', 'error')
        return redirect(url_for('property.property_assessments', property_id=property_id))
    
    if request.method == 'POST':
        # Get form data
        assessment_data = {
            'tax_year': request.form.get('tax_year'),
            'assessment_date': request.form.get('assessment_date'),
            'land_value': request.form.get('land_value'),
            'improvement_value': request.form.get('improvement_value'),
            'total_value': request.form.get('total_value'),
            'exemption_value': request.form.get('exemption_value', 0),
            'taxable_value': request.form.get('taxable_value'),
            'assessment_type': request.form.get('assessment_type', 'standard'),
            'assessment_status': request.form.get('assessment_status', 'pending'),
            'notes': request.form.get('notes')
        }
        
        # Remove empty values
        assessment_data = {k: v for k, v in assessment_data.items() if v}
        
        # Update assessment
        result = pm.update_assessment(assessment_id, assessment_data)
        
        if result['success']:
            flash('Assessment updated successfully.', 'success')
            return redirect(url_for('property.property_assessments', property_id=property_id))
        else:
            flash(f'Error updating assessment: {result["error"]}', 'error')
    
    # GET request - render form with assessment data
    current_year = datetime.now().year
    today_date = datetime.now().strftime('%Y-%m-%d')
    
    return render_template(
        'property/assessment_form.html', 
        property=property_obj, 
        assessment=assessment,
        current_year=current_year,
        today_date=today_date
    )


@property_bp.route('/<property_id>/assessments/<assessment_id>/delete', methods=['POST'])
@login_required
@permission_required('property.assessment.delete')
def assessment_delete(property_id, assessment_id):
    """Delete a property assessment"""
    result = pm.delete_assessment(assessment_id)
    
    if result['success']:
        flash('Assessment deleted successfully.', 'success')
    else:
        flash(f'Error deleting assessment: {result["error"]}', 'error')
    
    return redirect(url_for('property.property_assessments', property_id=property_id))


# Property Files Routes

@property_bp.route('/<property_id>/files')
@login_required
def property_files(property_id):
    """Render the property files page"""
    property_obj = pm.get_property(property_id)
    
    if not property_obj:
        flash('Property not found.', 'error')
        return redirect(url_for('property.property_list'))
    
    # Get files
    files = pm.get_property_files(property_id)
    
    return render_template(
        'property/property_files.html', 
        property=property_obj, 
        files=files
    )


@property_bp.route('/<property_id>/files/upload', methods=['POST'])
@login_required
@permission_required('property.file.upload')
def property_file_upload(property_id):
    """Upload a file for a property"""
    property_obj = pm.get_property(property_id)
    
    if not property_obj:
        flash('Property not found.', 'error')
        return redirect(url_for('property.property_list'))
    
    # Check if file is provided
    if 'file' not in request.files:
        flash('No file selected.', 'error')
        return redirect(url_for('property.property_files', property_id=property_id))
    
    file = request.files['file']
    
    if file.filename == '':
        flash('No file selected.', 'error')
        return redirect(url_for('property.property_files', property_id=property_id))
    
    if not allowed_file(file.filename):
        flash('File type not allowed.', 'error')
        return redirect(url_for('property.property_files', property_id=property_id))
    
    # Get file data
    file_data = {
        'property_id': property_id,
        'file_name': request.form.get('file_name') or secure_filename(file.filename),
        'file_size': len(file.read()),
        'file_type': file.content_type,
        'file_category': request.form.get('file_category', 'other'),
        'description': request.form.get('description')
    }
    
    # Reset file pointer to beginning
    file.seek(0)
    
    # Upload file to storage and save metadata
    result = pm.create_property_file(file_data, file)
    
    if result['success']:
        flash('File uploaded successfully.', 'success')
    else:
        flash(f'Error uploading file: {result["error"]}', 'error')
    
    return redirect(url_for('property.property_files', property_id=property_id))


@property_bp.route('/files/<file_id>/delete', methods=['POST'])
@login_required
@permission_required('property.file.delete')
def property_file_delete(file_id):
    """Delete a property file"""
    file_obj = pm.get_file(file_id)
    
    if not file_obj:
        flash('File not found.', 'error')
        return redirect(url_for('property.property_list'))
    
    property_id = file_obj.property_id
    
    result = pm.delete_property_file(file_id)
    
    if result['success']:
        flash('File deleted successfully.', 'success')
    else:
        flash(f'Error deleting file: {result["error"]}', 'error')
    
    return redirect(url_for('property.property_files', property_id=property_id))


# Register Blueprint

def register_property_routes(app):
    """Register property routes with the app"""
    app.register_blueprint(property_bp)
    
    # Add template utility functions
    @app.context_processor
    def utility_processor():
        return {
            'format_currency': format_currency,
            'format_date': format_date,
        }


def format_currency(value, show_zero=True):
    """Format a value as currency"""
    if value is None:
        return '' if not show_zero else '$0'
    
    try:
        return '${:,.2f}'.format(float(value))
    except (ValueError, TypeError):
        return '' if not show_zero else '$0'


def format_date(value, format='%m/%d/%Y'):
    """Format a date value"""
    if not value:
        return ''
    
    if isinstance(value, str):
        try:
            date_obj = datetime.fromisoformat(value.replace('Z', '+00:00'))
            return date_obj.strftime(format)
        except (ValueError, TypeError):
            return value
    
    try:
        return value.strftime(format)
    except (ValueError, TypeError, AttributeError):
        return str(value)