"""
API routes for Comparative Market Analysis (CMA) functionality.

This module provides API endpoints for generating and retrieving CMA reports.
"""

import logging
import json
from functools import wraps
from typing import Dict, List, Any, Optional

from flask import Blueprint, request, jsonify, current_app
from werkzeug.exceptions import BadRequest, NotFound, Unauthorized, InternalServerError

from services.cma_service import CMAService
from api.auth import api_key_required

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
cma_bp = Blueprint('cma_api', __name__, url_prefix='/api/cma')

# Create CMA service
cma_service = CMAService()

# Cache for in-progress operations
report_generation_tasks = {}

# Apply decorator before route to avoid name conflicts
@api_key_required()  # Call the function to get the decorator
@cma_bp.route('/reports', methods=['POST'])
def create_cma_report():
    """Create a new CMA report."""
    try:
        # Get request data
        data = request.json
        if not data:
            raise BadRequest("Missing request data")
        
        # Check required fields
        required_fields = ['subject_address', 'subject_city', 'subject_state', 'subject_zip']
        for field in required_fields:
            if field not in data:
                raise BadRequest(f"Missing required field: {field}")
        
        # Create report
        report_id = cma_service.create_report(data)
        
        # Return report ID
        return jsonify({
            'success': True,
            'report_id': report_id,
            'message': 'CMA report created successfully'
        })
        
    except BadRequest as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
        
    except Exception as e:
        logger.exception(f"Error creating CMA report: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"An error occurred: {str(e)}"
        }), 500

@api_key_required()  # Call the function to get the decorator
@cma_bp.route('/reports/<int:report_id>/generate', methods=['POST'])
def generate_cma_report(report_id):
    """Generate a CMA report."""
    try:
        # Start the report generation
        report = cma_service.generate_report(report_id)
        
        # Return the report
        return jsonify({
            'success': True,
            'report': report,
            'message': 'CMA report generated successfully'
        })
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 404
        
    except Exception as e:
        logger.exception(f"Error generating CMA report: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"An error occurred: {str(e)}"
        }), 500

@api_key_required()  # Call the function to get the decorator
@cma_bp.route('/reports/<int:report_id>', methods=['GET'])
def get_cma_report(report_id):
    """Get a CMA report by ID."""
    try:
        # Get the report
        report = cma_service.get_report(report_id)
        
        # Return the report
        return jsonify({
            'success': True,
            'report': report
        })
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 404
        
    except Exception as e:
        logger.exception(f"Error getting CMA report: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"An error occurred: {str(e)}"
        }), 500

@api_key_required()  # Call the function to get the decorator
@cma_bp.route('/reports', methods=['GET'])
def get_cma_reports():
    """Get a list of CMA reports."""
    try:
        # Get query parameters
        user_id = request.args.get('user_id')
        limit = int(request.args.get('limit', 10))
        
        # Get reports
        reports = cma_service.get_reports(user_id, limit)
        
        # Return reports
        return jsonify({
            'success': True,
            'reports': reports,
            'count': len(reports)
        })
        
    except Exception as e:
        logger.exception(f"Error getting CMA reports: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"An error occurred: {str(e)}"
        }), 500

@api_key_required()  # Call the function to get the decorator
@cma_bp.route('/reports/<int:report_id>', methods=['DELETE'])
def delete_cma_report(report_id):
    """Delete a CMA report."""
    try:
        # Delete the report
        success = cma_service.delete_report(report_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'CMA report deleted successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Report not found'
            }), 404
        
    except Exception as e:
        logger.exception(f"Error deleting CMA report: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"An error occurred: {str(e)}"
        }), 500

@api_key_required()  # Call the function to get the decorator
@cma_bp.route('/one-click', methods=['POST'])
def one_click_cma():
    """
    Generate a one-click CMA report.
    
    This endpoint creates and generates a CMA report in a single step.
    """
    try:
        # Get request data
        data = request.json
        if not data:
            raise BadRequest("Missing request data")
        
        # Check required fields
        required_fields = ['subject_address', 'subject_city', 'subject_state', 'subject_zip']
        for field in required_fields:
            if field not in data:
                raise BadRequest(f"Missing required field: {field}")
        
        # Create report
        report_id = cma_service.create_report(data)
        
        # Generate report
        report = cma_service.generate_report(report_id)
        
        # Return the report
        return jsonify({
            'success': True,
            'report_id': report_id,
            'report': report,
            'message': 'CMA report generated successfully'
        })
        
    except BadRequest as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
        
    except Exception as e:
        logger.exception(f"Error generating one-click CMA report: {str(e)}")
        return jsonify({
            'success': False,
            'error': f"An error occurred: {str(e)}"
        }), 500

def register_routes(app):
    """Register the CMA routes with the Flask app."""
    app.register_blueprint(cma_bp)
    logger.info("Registered CMA API blueprint")