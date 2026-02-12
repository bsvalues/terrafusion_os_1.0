"""
API Endpoints Module

This module provides RESTful API endpoints for third-party applications
and microservices to interact with the Benton County GIS system.
"""

import os
import logging
import json
from typing import Dict, Any, List, Optional, Union
from flask import Blueprint, request, jsonify, current_app
from functools import wraps
import datetime
import traceback

# Configure logging
logger = logging.getLogger(__name__)

# Import database API
from api.database import db_api

# Import auth utilities
from auth import is_authenticated, has_permission
from config_loader import get_config

# Create Blueprint
api_bp = Blueprint('api_gateway', __name__, url_prefix='/api/v1')

# API Key validation
def api_key_required(f):
    """Decorator to require API key for API endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for API key in header or query param
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            api_key = request.args.get('api_key')
            
        if not api_key:
            return jsonify({"error": "API key is required"}), 401
            
        # Check if API key is valid
        valid_api_keys = current_app.config.get('API_KEYS', [])
        if isinstance(valid_api_keys, str):
            # If it's a comma-separated string, split it
            valid_api_keys = [k.strip() for k in valid_api_keys.split(',')]
            
        # Environment variable takes precedence
        env_api_keys = os.environ.get('API_KEYS', '')
        if env_api_keys:
            valid_api_keys = [k.strip() for k in env_api_keys.split(',')]
        
        if api_key not in valid_api_keys:
            return jsonify({"error": "Invalid API key"}), 401
            
        return f(*args, **kwargs)
    return decorated_function

def authenticated_api_required(f):
    """Decorator to require user authentication for API endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

def permission_api_required(permission_name):
    """Decorator to require specific permission for API endpoints"""
    def decorator(f):
        @wraps(f)
        @authenticated_api_required
        def decorated_function(*args, **kwargs):
            if not has_permission(permission_name):
                return jsonify({"error": f"Permission denied: {permission_name} required"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Error handling
@api_bp.errorhandler(Exception)
def handle_error(e):
    """Handle exceptions in API endpoints"""
    logger.error(f"API error: {str(e)}\n{traceback.format_exc()}")
    return jsonify({"error": str(e)}), 500

# API endpoints

@api_bp.route('/status', methods=['GET'])
def api_status():
    """API status endpoint"""
    return jsonify({
        "status": "operational",
        "version": "1.0",
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

@api_bp.route('/data/<table_name>', methods=['GET'])
@api_key_required
def get_data(table_name):
    """Get data from a specific table"""
    # Extract query parameters
    limit = request.args.get('limit', type=int)
    offset = request.args.get('offset', type=int)
    order_by = request.args.get('order_by')
    order_dir = request.args.get('order_dir', 'asc')
    
    # Extract filter parameters (all non-standard query params)
    filter_params = {}
    standard_params = ['limit', 'offset', 'order_by', 'order_dir', 'api_key']
    for key, value in request.args.items():
        if key not in standard_params:
            filter_params[key] = value
    
    # Query the database
    result = db_api.query(
        table_name=table_name,
        filter_params=filter_params,
        limit=limit,
        offset=offset,
        order_by=order_by,
        order_dir=order_dir
    )
    
    if "error" in result:
        return jsonify(result), 400
    
    return jsonify(result)

@api_bp.route('/data/<table_name>', methods=['POST'])
@api_key_required
@permission_api_required('api_write')
def create_data(table_name):
    """Create new data in a specific table"""
    # Get JSON data from request
    data = request.json
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
    
    # Insert into database
    result = db_api.insert(table_name=table_name, data=data)
    
    if "error" in result:
        return jsonify(result), 400
    
    return jsonify(result), 201

@api_bp.route('/data/<table_name>/<id_value>', methods=['PUT', 'PATCH'])
@api_key_required
@permission_api_required('api_write')
def update_data(table_name, id_value):
    """Update data in a specific table"""
    # Get JSON data from request
    data = request.json
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
    
    # Get ID column name from query parameter or use default "id"
    id_column = request.args.get('id_column', 'id')
    
    # Update in database
    result = db_api.update(
        table_name=table_name,
        id_value=id_value,
        data=data,
        id_column=id_column
    )
    
    if "error" in result:
        return jsonify(result), 400
    
    return jsonify(result)

@api_bp.route('/data/<table_name>/<id_value>', methods=['DELETE'])
@api_key_required
@permission_api_required('api_delete')
def delete_data(table_name, id_value):
    """Delete data from a specific table"""
    # Get ID column name from query parameter or use default "id"
    id_column = request.args.get('id_column', 'id')
    
    # Delete from database
    result = db_api.delete(
        table_name=table_name,
        id_value=id_value,
        id_column=id_column
    )
    
    if "error" in result:
        return jsonify(result), 400
    
    return jsonify(result)

@api_bp.route('/query', methods=['POST'])
@api_key_required
@permission_api_required('api_query')
def execute_query():
    """Execute a custom query"""
    # Get query from request
    data = request.json
    if not data or 'query' not in data:
        return jsonify({"error": "No query provided"}), 400
    
    # Extract query and parameters
    query = data['query']
    params = data.get('params', {})
    
    # Execute the query
    result = db_api.execute_raw_query(query=query, params=params)
    
    if "error" in result:
        return jsonify(result), 400
    
    return jsonify(result)

@api_bp.route('/schema', methods=['GET'])
@api_key_required
def get_schema():
    """Get database schema information"""
    # Get optional table name from query parameter
    table_name = request.args.get('table')
    
    # Get schema from database API
    result = db_api.get_schema(table_name=table_name)
    
    if "error" in result:
        return jsonify(result), 400
    
    return jsonify(result)

@api_bp.route('/files/<file_id>', methods=['GET'])
@api_key_required
def get_file(file_id):
    """Get file information and URL"""
    from file_handlers import get_file_download_url
    
    # Query database for file record
    result = db_api.query(
        table_name="files",
        filter_params={"id": file_id}
    )
    
    if "error" in result:
        return jsonify(result), 400
    
    if not result.get("data"):
        return jsonify({"error": "File not found"}), 404
    
    # Get file URL
    file_data = result["data"][0]
    file_url = get_file_download_url(file_id)
    
    # Add URL to response
    file_data["url"] = file_url
    
    return jsonify({"data": file_data})

@api_bp.route('/gis/<layer_name>', methods=['GET'])
@api_key_required
def get_gis_data(layer_name):
    """Get GIS data for a specific layer"""
    # Placeholder for GIS data API
    # In a real implementation, this would call into GIS-specific functionality
    
    # For now, return a placeholder message
    return jsonify({
        "message": f"GIS data endpoint for layer: {layer_name}",
        "warning": "This endpoint is not yet implemented"
    })

# Register blueprint with Flask app
def register_api_endpoints(app):
    """Register API endpoints with Flask app"""
    app.register_blueprint(api_bp)
    logger.info("API endpoints registered")
    return api_bp