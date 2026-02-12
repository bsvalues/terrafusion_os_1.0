"""
Field Mapping Routes Module

This module provides Flask routes for field mapping management.
"""

import logging
from flask import Blueprint, jsonify, request
from sync_service.mapping_loader import get_mapping_loader

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create mapping blueprint
mapping_bp = Blueprint('mapping', __name__, url_prefix='/api/etl/mappings')

@mapping_bp.route('/<data_type>', methods=['GET'])
def get_mappings(data_type):
    """
    Get all mappings for a data type
    
    Args:
        data_type: Data type (property, sales, valuation, tax)
        
    Returns:
        JSON response with mapping names
    """
    try:
        mapping_loader = get_mapping_loader()
        mappings = mapping_loader.list_mappings(data_type)
        
        mapping_names = mappings.get(data_type, [])
        
        return jsonify({
            "success": True,
            "data_type": data_type,
            "mappings": mapping_names
        })
    except Exception as e:
        logger.error(f"Error getting mappings for {data_type}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error getting mappings: {str(e)}"
        }), 500

@mapping_bp.route('/<data_type>/<mapping_name>', methods=['GET'])
def get_mapping(data_type, mapping_name):
    """
    Get a specific mapping
    
    Args:
        data_type: Data type (property, sales, valuation, tax)
        mapping_name: Name of the mapping
        
    Returns:
        JSON response with mapping
    """
    try:
        mapping_loader = get_mapping_loader()
        mapping = mapping_loader.get_mapping(data_type, mapping_name)
        
        if mapping:
            return jsonify({
                "success": True,
                "data_type": data_type,
                "mapping_name": mapping_name,
                "mapping": mapping
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Mapping not found: {data_type}/{mapping_name}"
            }), 404
    except Exception as e:
        logger.error(f"Error getting mapping {data_type}/{mapping_name}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error getting mapping: {str(e)}"
        }), 500

@mapping_bp.route('', methods=['POST'])
def create_mapping():
    """
    Create a new mapping
    
    Request body:
        data_type: Data type (property, sales, valuation, tax)
        mapping_name: Name of the mapping
        mapping: Dictionary with field mappings
        
    Returns:
        JSON response with result
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400
        
        data_type = data.get('data_type')
        mapping_name = data.get('mapping_name')
        mapping = data.get('mapping')
        
        if not data_type or not mapping_name or not mapping:
            return jsonify({
                "success": False,
                "message": "Missing required fields: data_type, mapping_name, mapping"
            }), 400
        
        mapping_loader = get_mapping_loader()
        
        # Check if mapping already exists
        existing_mappings = mapping_loader.list_mappings(data_type)
        if data_type in existing_mappings and mapping_name in existing_mappings[data_type]:
            return jsonify({
                "success": False,
                "message": f"Mapping already exists: {data_type}/{mapping_name}"
            }), 409
        
        # Create mapping
        success = mapping_loader.create_mapping(data_type, mapping_name, mapping)
        
        if success:
            return jsonify({
                "success": True,
                "message": f"Mapping created successfully: {data_type}/{mapping_name}"
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Error creating mapping: {data_type}/{mapping_name}"
            }), 500
    except Exception as e:
        logger.error(f"Error creating mapping: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error creating mapping: {str(e)}"
        }), 500

@mapping_bp.route('/<data_type>/<mapping_name>', methods=['PUT'])
def update_mapping(data_type, mapping_name):
    """
    Update an existing mapping
    
    Args:
        data_type: Data type (property, sales, valuation, tax)
        mapping_name: Name of the mapping
        
    Request body:
        mapping: Dictionary with field mappings
        
    Returns:
        JSON response with result
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400
        
        mapping = data.get('mapping')
        
        if not mapping:
            return jsonify({
                "success": False,
                "message": "Missing required field: mapping"
            }), 400
        
        mapping_loader = get_mapping_loader()
        
        # Check if mapping exists
        existing_mapping = mapping_loader.get_mapping(data_type, mapping_name)
        if not existing_mapping:
            return jsonify({
                "success": False,
                "message": f"Mapping not found: {data_type}/{mapping_name}"
            }), 404
        
        # Update mapping
        success = mapping_loader.update_mapping(data_type, mapping_name, mapping)
        
        if success:
            return jsonify({
                "success": True,
                "message": f"Mapping updated successfully: {data_type}/{mapping_name}"
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Error updating mapping: {data_type}/{mapping_name}"
            }), 500
    except Exception as e:
        logger.error(f"Error updating mapping {data_type}/{mapping_name}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error updating mapping: {str(e)}"
        }), 500

@mapping_bp.route('/<data_type>/<mapping_name>', methods=['DELETE'])
def delete_mapping(data_type, mapping_name):
    """
    Delete a mapping
    
    Args:
        data_type: Data type (property, sales, valuation, tax)
        mapping_name: Name of the mapping
        
    Returns:
        JSON response with result
    """
    try:
        mapping_loader = get_mapping_loader()
        
        # Check if mapping exists
        existing_mapping = mapping_loader.get_mapping(data_type, mapping_name)
        if not existing_mapping:
            return jsonify({
                "success": False,
                "message": f"Mapping not found: {data_type}/{mapping_name}"
            }), 404
        
        # Delete mapping
        success = mapping_loader.delete_mapping(data_type, mapping_name)
        
        if success:
            return jsonify({
                "success": True,
                "message": f"Mapping deleted successfully: {data_type}/{mapping_name}"
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Error deleting mapping: {data_type}/{mapping_name}"
            }), 500
    except Exception as e:
        logger.error(f"Error deleting mapping {data_type}/{mapping_name}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error deleting mapping: {str(e)}"
        }), 500

def register_mapping_routes(app):
    """
    Register mapping routes with the application
    
    Args:
        app: Flask application
    """
    app.register_blueprint(mapping_bp)
    logger.info("Field mapping routes registered successfully")