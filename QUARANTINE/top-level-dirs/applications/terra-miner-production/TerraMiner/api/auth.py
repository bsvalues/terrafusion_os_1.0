"""
Authentication middleware and API key management functions.
"""
import logging
import functools
from flask import Blueprint, jsonify, request, current_app, g
from werkzeug.exceptions import Unauthorized

from models import APIKey, db

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Authentication middleware
def api_key_required(permissions=None):
    """
    Decorator for routes that require API key authentication.
    
    Args:
        permissions (list, optional): List of permissions required to access the route
        
    Returns:
        function: Decorated function
    """
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            # Get API key from request
            api_key = None
            
            # Check Authorization header
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                api_key = auth_header[7:].strip()  # Remove 'Bearer ' prefix
            
            # Check X-API-Key header if no Authorization header
            if not api_key:
                api_key = request.headers.get('X-API-Key')
            
            # Check query parameter if no header
            if not api_key:
                api_key = request.args.get('api_key')
            
            # Validate API key
            if not api_key:
                logger.warning(f"API key auth failed: No API key provided. Endpoint: {request.path}")
                return jsonify({
                    "success": False,
                    "error": "API key required"
                }), 401
            
            # Check if API key is valid
            key = APIKey.validate_key(api_key)
            if not key:
                logger.warning(f"API key auth failed: Invalid API key. Endpoint: {request.path}")
                return jsonify({
                    "success": False,
                    "error": "Invalid API key"
                }), 401
            
            # Check permissions if specified
            if permissions:
                if not key.has_any_permission(permissions):
                    logger.warning(f"API key auth failed: Insufficient permissions. Endpoint: {request.path}")
                    return jsonify({
                        "success": False,
                        "error": "Insufficient permissions"
                    }), 403
            
            # Store API key on g for later use
            g.api_key = key
            
            # Call the actual function
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# API routes for API key management
@auth_bp.route('/keys', methods=['POST'])
@api_key_required(['admin'])  # Only admins can create new API keys
def create_api_key():
    """
    Create a new API key.
    
    Request JSON:
        name (str): Name of the API key
        permissions (dict, optional): Permissions for the API key
        expiry_days (int, optional): Number of days until key expires
        created_by (str, optional): User who created the key
    
    Returns:
        JSON: API key information
    """
    try:
        data = request.get_json()
        
        if not data or "name" not in data:
            return jsonify({
                "success": False,
                "error": "Missing required parameter: name"
            }), 400
        
        name = data["name"]
        permissions = data.get("permissions", {})
        expiry_days = data.get("expiry_days")
        created_by = data.get("created_by")
        
        # Create new API key
        api_key, full_key = APIKey.create_key(
            name=name,
            permissions=permissions,
            expiry_days=expiry_days,
            created_by=created_by
        )
        
        return jsonify({
            "success": True,
            "message": "API key created successfully",
            "api_key": {
                "id": api_key.id,
                "name": api_key.name,
                "key": full_key,  # Only returned once on creation
                "prefix": api_key.key_prefix,
                "permissions": api_key.permissions,
                "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
                "created_at": api_key.created_at.isoformat(),
                "created_by": api_key.created_by
            }
        })
    except Exception as e:
        logger.exception(f"Error creating API key: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_bp.route('/keys', methods=['GET'])
@api_key_required(['admin'])  # Only admins can list API keys
def list_api_keys():
    """
    List all API keys.
    
    Returns:
        JSON: List of API keys
    """
    try:
        api_keys = APIKey.query.all()
        
        return jsonify({
            "success": True,
            "api_keys": [{
                "id": key.id,
                "name": key.name,
                "prefix": key.key_prefix,
                "permissions": key.permissions,
                "is_active": key.is_active,
                "expires_at": key.expires_at.isoformat() if key.expires_at else None,
                "created_at": key.created_at.isoformat(),
                "created_by": key.created_by,
                "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None
            } for key in api_keys]
        })
    except Exception as e:
        logger.exception(f"Error listing API keys: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_bp.route('/keys/<int:key_id>', methods=['PUT'])
@api_key_required(['admin'])  # Only admins can update API keys
def update_api_key(key_id):
    """
    Update an API key.
    
    Args:
        key_id (int): ID of the API key to update
    
    Request JSON:
        name (str, optional): New name for the API key
        permissions (dict, optional): New permissions for the API key
        is_active (bool, optional): Whether the API key is active
    
    Returns:
        JSON: Updated API key information
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "No update data provided"
            }), 400
        
        # Find API key
        api_key = APIKey.query.get(key_id)
        if not api_key:
            return jsonify({
                "success": False,
                "error": f"API key with ID {key_id} not found"
            }), 404
        
        # Update fields
        if "name" in data:
            api_key.name = data["name"]
        if "permissions" in data:
            api_key.permissions = data["permissions"]
        if "is_active" in data:
            api_key.is_active = data["is_active"]
        
        # Save changes
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "API key updated successfully",
            "api_key": {
                "id": api_key.id,
                "name": api_key.name,
                "prefix": api_key.key_prefix,
                "permissions": api_key.permissions,
                "is_active": api_key.is_active,
                "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
                "created_at": api_key.created_at.isoformat(),
                "created_by": api_key.created_by,
                "last_used_at": api_key.last_used_at.isoformat() if api_key.last_used_at else None
            }
        })
    except Exception as e:
        logger.exception(f"Error updating API key: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_bp.route('/keys/<int:key_id>', methods=['DELETE'])
@api_key_required(['admin'])  # Only admins can delete API keys
def delete_api_key(key_id):
    """
    Delete an API key.
    
    Args:
        key_id (int): ID of the API key to delete
    
    Returns:
        JSON: Success status
    """
    try:
        # Find API key
        api_key = APIKey.query.get(key_id)
        if not api_key:
            return jsonify({
                "success": False,
                "error": f"API key with ID {key_id} not found"
            }), 404
        
        # Delete API key
        db.session.delete(api_key)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"API key {key_id} deleted successfully"
        })
    except Exception as e:
        logger.exception(f"Error deleting API key: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_bp.route('/keys/<int:key_id>/deactivate', methods=['POST'])
@api_key_required(['admin'])  # Only admins can deactivate API keys
def deactivate_api_key(key_id):
    """
    Deactivate an API key.
    
    Args:
        key_id (int): ID of the API key to deactivate
    
    Returns:
        JSON: Success status
    """
    try:
        # Find API key
        api_key = APIKey.query.get(key_id)
        if not api_key:
            return jsonify({
                "success": False,
                "error": f"API key with ID {key_id} not found"
            }), 404
        
        # Deactivate API key
        api_key.is_active = False
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"API key {key_id} deactivated successfully"
        })
    except Exception as e:
        logger.exception(f"Error deactivating API key: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_bp.route('/keys/<int:key_id>/activate', methods=['POST'])
@api_key_required(['admin'])  # Only admins can activate API keys
def activate_api_key(key_id):
    """
    Activate an API key.
    
    Args:
        key_id (int): ID of the API key to activate
    
    Returns:
        JSON: Success status
    """
    try:
        # Find API key
        api_key = APIKey.query.get(key_id)
        if not api_key:
            return jsonify({
                "success": False,
                "error": f"API key with ID {key_id} not found"
            }), 404
        
        # Activate API key
        api_key.is_active = True
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"API key {key_id} activated successfully"
        })
    except Exception as e:
        logger.exception(f"Error activating API key: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@auth_bp.route('/keys/test', methods=['GET'])
@api_key_required()  # Any valid API key can test authentication
def test_api_key():
    """
    Test an API key.
    
    Returns:
        JSON: API key information
    """
    try:
        api_key = g.api_key
        
        return jsonify({
            "success": True,
            "message": "API key is valid",
            "api_key": {
                "id": api_key.id,
                "name": api_key.name,
                "prefix": api_key.key_prefix,
                "permissions": api_key.permissions,
                "is_active": api_key.is_active,
                "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
                "created_at": api_key.created_at.isoformat(),
                "created_by": api_key.created_by,
                "last_used_at": api_key.last_used_at.isoformat() if api_key.last_used_at else None
            }
        })
    except Exception as e:
        logger.exception(f"Error testing API key: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Function to register blueprint with Flask app
def register_auth_blueprint(app):
    """Register the authentication blueprint with the Flask app."""
    app.register_blueprint(auth_bp)
    logger.info("Registered authentication API blueprint")