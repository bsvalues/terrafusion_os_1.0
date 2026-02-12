"""
Sales Verification Routes

This module provides web routes for the Sales Verification functionality.
"""

import os
import logging
import json
import datetime
from flask import Blueprint, render_template, request, jsonify, current_app, session, flash, redirect, url_for
from werkzeug.utils import secure_filename
import pandas as pd
import numpy as np

from app import db
from auth import login_required, permission_required, role_required
from mcp import mcp
from sync_service.sales_gis_validator import SalesGISValidator
from sync_service.models.data_quality import DataQualityAlert

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
sales_verification_bp = Blueprint('sales_verification', __name__, url_prefix='/sales-verification')

# Initialize GIS validator
gis_validator = SalesGISValidator()

@sales_verification_bp.route('/')
@login_required
def index():
    """Sales Verification Dashboard"""
    return render_template(
        'sales_verification/index.html',
        page_title="Sales Verification Dashboard"
    )

@sales_verification_bp.route('/verify', methods=['GET', 'POST'])
@login_required
@permission_required('verify_sales')
def verify_sale():
    """Verify a single sale"""
    if request.method == 'POST':
        # Get sale data from form
        sale_data = {
            "sale_id": request.form.get('sale_id'),
            "property_id": request.form.get('property_id'),
            "parcel_number": request.form.get('parcel_number'),
            "sale_date": request.form.get('sale_date'),
            "sale_price": request.form.get('sale_price'),
            "buyer_name": request.form.get('buyer_name'),
            "seller_name": request.form.get('seller_name'),
            "deed_type": request.form.get('deed_type'),
            "sale_type": request.form.get('sale_type'),
            "property_address": request.form.get('property_address')
        }
        
        # Use MCP to delegate to the Sales Verification Agent
        try:
            if mcp.has_agent('sales_verification'):
                task_data = {
                    "task_type": "verify_sale",
                    "sale_data": sale_data
                }
                
                result = mcp.delegate_task('sales_verification', task_data)
                
                if result.get('status') == 'verified':
                    flash(f"Sale {sale_data['sale_id']} verified successfully", 'success')
                else:
                    flash(f"Sale {sale_data['sale_id']} verification issues detected", 'warning')
                
                return render_template(
                    'sales_verification/verify_result.html',
                    page_title="Sale Verification Result",
                    result=result,
                    sale_data=sale_data
                )
            else:
                flash("Sales Verification Agent not available", 'error')
                logger.error("Sales Verification Agent not registered with MCP")
                return redirect(url_for('sales_verification.index'))
        except Exception as e:
            flash(f"Error verifying sale: {str(e)}", 'error')
            logger.error(f"Error in sale verification: {str(e)}")
            return redirect(url_for('sales_verification.index'))
    
    # GET request - show the verification form
    return render_template(
        'sales_verification/verify_form.html',
        page_title="Verify Sale"
    )

@sales_verification_bp.route('/batch-verify', methods=['GET', 'POST'])
@login_required
@permission_required('verify_sales')
def batch_verify_sales():
    """Batch verify sales from uploaded file"""
    if request.method == 'POST':
        # Check if file was uploaded
        if 'sales_file' not in request.files:
            flash('No file selected', 'error')
            return redirect(request.url)
        
        file = request.files['sales_file']
        
        if file.filename == '':
            flash('No file selected', 'error')
            return redirect(request.url)
        
        if file:
            try:
                # Process the uploaded file
                filename = secure_filename(file.filename)
                file_ext = os.path.splitext(filename)[1].lower()
                
                # Read data based on file type
                if file_ext == '.csv':
                    df = pd.read_csv(file)
                elif file_ext in ['.xlsx', '.xls']:
                    df = pd.read_excel(file)
                else:
                    flash('Unsupported file type. Please upload CSV or Excel file.', 'error')
                    return redirect(request.url)
                
                # Convert DataFrame to list of dictionaries
                sales_data = df.to_dict('records')
                
                # Use MCP to delegate to the Sales Verification Agent
                if mcp.has_agent('sales_verification'):
                    task_data = {
                        "task_type": "batch_verify_sales",
                        "sales_data": sales_data
                    }
                    
                    result = mcp.delegate_task('sales_verification', task_data)
                    
                    return render_template(
                        'sales_verification/batch_result.html',
                        page_title="Batch Verification Results",
                        result=result,
                        summary=result.get('summary', {})
                    )
                else:
                    flash("Sales Verification Agent not available", 'error')
                    logger.error("Sales Verification Agent not registered with MCP")
            except Exception as e:
                flash(f"Error processing file: {str(e)}", 'error')
                logger.error(f"Error in batch verification: {str(e)}")
        
        return redirect(request.url)
    
    # GET request - show the upload form
    return render_template(
        'sales_verification/batch_form.html',
        page_title="Batch Verify Sales"
    )

@sales_verification_bp.route('/gis-validation/<parcel_id>')
@login_required
@permission_required('verify_sales')
def gis_validation(parcel_id):
    """GIS validation for a parcel"""
    try:
        # Validate parcel geometry
        geometry_result = gis_validator.validate_parcel_geometry(parcel_id)
        
        # Get location attributes
        location_result = gis_validator.verify_location_attributes(parcel_id)
        
        return render_template(
            'sales_verification/gis_validation.html',
            page_title=f"GIS Validation - Parcel {parcel_id}",
            parcel_id=parcel_id,
            geometry_result=geometry_result,
            location_result=location_result
        )
    except Exception as e:
        flash(f"Error in GIS validation: {str(e)}", 'error')
        logger.error(f"Error in GIS validation: {str(e)}")
        return redirect(url_for('sales_verification.index'))

@sales_verification_bp.route('/trends')
@login_required
@permission_required('view_sales_trends')
def sales_trends():
    """Sales trend analysis dashboard"""
    # Get filter parameters
    area_id = request.args.get('area_id')
    property_type = request.args.get('property_type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Use MCP to delegate to the Sales Verification Agent
    try:
        if mcp.has_agent('sales_verification'):
            task_data = {
                "task_type": "analyze_sales_trends",
                "area_id": area_id,
                "property_type": property_type,
                "start_date": start_date,
                "end_date": end_date
            }
            
            result = mcp.delegate_task('sales_verification', task_data)
            
            return render_template(
                'sales_verification/trends.html',
                page_title="Sales Trends Analysis",
                result=result,
                trends=result.get('trends', {}),
                filters={
                    'area_id': area_id,
                    'property_type': property_type,
                    'start_date': start_date,
                    'end_date': end_date
                }
            )
        else:
            flash("Sales Verification Agent not available", 'error')
            logger.error("Sales Verification Agent not registered with MCP")
            return redirect(url_for('sales_verification.index'))
    except Exception as e:
        flash(f"Error analyzing sales trends: {str(e)}", 'error')
        logger.error(f"Error in sales trend analysis: {str(e)}")
        return redirect(url_for('sales_verification.index'))

# API Routes
@sales_verification_bp.route('/api/verify', methods=['POST'])
@login_required
@permission_required('verify_sales')
def api_verify_sale():
    """API: Verify a single sale"""
    data = request.get_json()
    
    if not data:
        return jsonify({
            "status": "error",
            "message": "No data provided"
        })
    
    try:
        if mcp.has_agent('sales_verification'):
            task_data = {
                "task_type": "verify_sale",
                "sale_data": data
            }
            
            result = mcp.delegate_task('sales_verification', task_data)
            return jsonify(result)
        else:
            return jsonify({
                "status": "error",
                "message": "Sales Verification Agent not available"
            })
    except Exception as e:
        logger.error(f"API error in sale verification: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error verifying sale: {str(e)}"
        })

@sales_verification_bp.route('/api/batch-verify', methods=['POST'])
@login_required
@permission_required('verify_sales')
def api_batch_verify_sales():
    """API: Batch verify sales"""
    data = request.get_json()
    
    if not data or not isinstance(data.get('sales_data'), list):
        return jsonify({
            "status": "error",
            "message": "Invalid data format. Expected 'sales_data' array."
        })
    
    try:
        if mcp.has_agent('sales_verification'):
            task_data = {
                "task_type": "batch_verify_sales",
                "sales_data": data.get('sales_data', [])
            }
            
            result = mcp.delegate_task('sales_verification', task_data)
            return jsonify(result)
        else:
            return jsonify({
                "status": "error",
                "message": "Sales Verification Agent not available"
            })
    except Exception as e:
        logger.error(f"API error in batch verification: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error in batch verification: {str(e)}"
        })

@sales_verification_bp.route('/api/gis-validation/<parcel_id>', methods=['GET'])
@login_required
@permission_required('verify_sales')
def api_gis_validation(parcel_id):
    """API: GIS validation for a parcel"""
    try:
        # Validate parcel geometry
        geometry_result = gis_validator.validate_parcel_geometry(parcel_id)
        
        # Get location attributes
        location_result = gis_validator.verify_location_attributes(parcel_id)
        
        return jsonify({
            "status": "success",
            "parcel_id": parcel_id,
            "geometry_validation": geometry_result,
            "location_attributes": location_result
        })
    except Exception as e:
        logger.error(f"API error in GIS validation: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error in GIS validation: {str(e)}"
        })

@sales_verification_bp.route('/api/trends', methods=['GET'])
@login_required
@permission_required('view_sales_trends')
def api_sales_trends():
    """API: Sales trend analysis"""
    # Get filter parameters
    area_id = request.args.get('area_id')
    property_type = request.args.get('property_type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    try:
        if mcp.has_agent('sales_verification'):
            task_data = {
                "task_type": "analyze_sales_trends",
                "area_id": area_id,
                "property_type": property_type,
                "start_date": start_date,
                "end_date": end_date
            }
            
            result = mcp.delegate_task('sales_verification', task_data)
            return jsonify(result)
        else:
            return jsonify({
                "status": "error",
                "message": "Sales Verification Agent not available"
            })
    except Exception as e:
        logger.error(f"API error in sales trend analysis: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error analyzing sales trends: {str(e)}"
        })