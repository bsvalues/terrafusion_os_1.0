"""
Authentication API Module

This module provides API endpoints for authentication and token management.
It supports both session-based and token-based authentication for the API.
"""

from flask import Blueprint, request, jsonify, current_app, session
import logging
import time
import json
import secrets
import datetime
from functools import wraps
from typing import Dict, Any, List

from auth import login_required, is_authenticated, authenticate_user, has_permission
from app import db

# Create blueprint
auth_api = Blueprint('auth_api', __name__)

# Setup logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('auth_api')

# Token expiration in seconds (24 hours by default)
TOKEN_EXPIRATION = int(current_app.config.get('API_TOKEN_EXPIRATION', 24 * 60 * 60))


def validate_token(token):
    """Validate an API token"""
    from models import ApiToken
    
    # Get the token from the database
    token_record = ApiToken.query.filter_by(token=token, revoked=False).first()
    if not token_record:
        return False
        
    # Check if the token is expired
    now = datetime.datetime.utcnow()
    if token_record.expires_at < now:
        # Token expired, mark as revoked
        token_record.revoked = True
        db.session.commit()
        return False
    
    # Update last used time
    token_record.last_used_at = now
    db.session.commit()
    
    # Create token data for the request
    token_data = {
        'user_id': token_record.user_id,
        'token_id': token_record.id,
        'username': token_record.user.username,
        'token': token
    }
    
    return token_data


def get_token_from_request():
    """Extract token from request (header or query param)"""
    # Check Authorization header first
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    
    # Then check query parameter
    return request.args.get('api_token')


def token_required(f):
    """Decorator to require a valid token for an endpoint"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_request()
        
        if not token:
            return jsonify({
                "status": "error",
                "message": "Missing API token"
            }), 401
        
        token_data = validate_token(token)
        if not token_data:
            return jsonify({
                "status": "error",
                "message": "Invalid or expired API token"
            }), 401
        
        # Set the user from the token
        request.token_data = token_data
        
        # Log the API access
        try:
            from models import AuditLog, User
            
            user = User.query.get(token_data['user_id'])
            if user:
                audit_log = AuditLog(
                    user_id=user.id,
                    action='api_access',
                    resource_type='api',
                    details={
                        'endpoint': request.path,
                        'method': request.method,
                        'token_id': token_data.get('token_id')
                    },
                    ip_address=request.remote_addr,
                    user_agent=request.user_agent.string
                )
                db.session.add(audit_log)
                db.session.commit()
        except Exception as e:
            logger.warning(f"Error logging API access: {str(e)}")
        
        return f(*args, **kwargs)
    return decorated_function


def api_permission_required(permission_name):
    """Decorator to require a specific permission for an API endpoint"""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated_function(*args, **kwargs):
            from models import User
            
            # Get user from token
            user_id = request.token_data['user_id']
            user = User.query.get(user_id)
            
            if not user or not user.has_permission(permission_name):
                return jsonify({
                    "status": "error",
                    "message": f"Missing required permission: {permission_name}"
                }), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator


@auth_api.route('/token', methods=['POST'])
def create_token():
    """Create a new API token using username and password"""
    data = request.get_json()
    
    if not data:
        return jsonify({
            "status": "error",
            "message": "Missing request body"
        }), 400
    
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({
            "status": "error",
            "message": "Missing username or password"
        }), 400
    
    # Authenticate the user
    auth_result = authenticate_user(username, password)
    if not auth_result:
        return jsonify({
            "status": "error",
            "message": "Invalid credentials"
        }), 401
    
    # Get the user info
    from models import User, ApiToken, AuditLog
    
    user = User.query.filter_by(username=username).first()
    if not user:
        # This shouldn't happen with our enhanced authentication system
        # But handle it gracefully just in case
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404
    
    # Check if the user has permission to create API tokens
    if not user.has_permission('access_api'):
        return jsonify({
            "status": "error",
            "message": "You do not have permission to create API tokens"
        }), 403
    
    # Generate a token
    token_value = secrets.token_hex(32)
    token_name = data.get('token_name', f"API Token {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    # Calculate expiration
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(seconds=TOKEN_EXPIRATION)
    
    # Create token record in database
    token = ApiToken(
        token=token_value,
        name=token_name,
        user_id=user.id,
        created_at=datetime.datetime.utcnow(),
        expires_at=expires_at
    )
    
    db.session.add(token)
    
    # Log token creation
    audit_log = AuditLog(
        user_id=user.id,
        action='token_created',
        resource_type='api_token',
        resource_id=token.id,
        details={
            'token_name': token_name,
            'expires_at': expires_at.isoformat()
        },
        ip_address=request.remote_addr,
        user_agent=request.user_agent.string
    )
    
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "token": token_value,
        "token_id": token.id,
        "name": token_name,
        "expires_at": expires_at.isoformat(),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "roles": [role.name for role in user.roles],
            "permissions": user.get_permissions()
        }
    })


@auth_api.route('/token/refresh', methods=['POST'])
@token_required
def refresh_token():
    """Refresh an existing API token"""
    token = get_token_from_request()
    token_data = request.token_data
    
    from models import ApiToken, AuditLog
    
    # Get the token from the database
    token_record = ApiToken.query.filter_by(token=token, revoked=False).first()
    if not token_record:
        return jsonify({
            "status": "error",
            "message": "Token not found"
        }), 404
    
    # Update expiration time
    new_expires_at = datetime.datetime.utcnow() + datetime.timedelta(seconds=TOKEN_EXPIRATION)
    token_record.expires_at = new_expires_at
    token_record.last_used_at = datetime.datetime.utcnow()
    
    # Log token refresh
    audit_log = AuditLog(
        user_id=token_record.user_id,
        action='token_refreshed',
        resource_type='api_token',
        resource_id=token_record.id,
        details={
            'token_name': token_record.name,
            'new_expires_at': new_expires_at.isoformat()
        },
        ip_address=request.remote_addr,
        user_agent=request.user_agent.string
    )
    
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "token": token,
        "token_id": token_record.id,
        "name": token_record.name,
        "expires_at": new_expires_at.isoformat(),
        "user": {
            "id": token_record.user.id,
            "username": token_record.user.username
        }
    })


@auth_api.route('/token/revoke', methods=['POST'])
@token_required
def revoke_token():
    """Revoke an API token"""
    token = get_token_from_request()
    token_data = request.token_data
    
    from models import ApiToken, AuditLog
    
    # Get the token from the database
    token_record = ApiToken.query.filter_by(token=token).first()
    if not token_record:
        return jsonify({
            "status": "error",
            "message": "Token not found"
        }), 404
    
    # Revoke the token
    token_record.revoked = True
    
    # Log token revocation
    audit_log = AuditLog(
        user_id=token_record.user_id,
        action='token_revoked',
        resource_type='api_token',
        resource_id=token_record.id,
        details={
            'token_name': token_record.name
        },
        ip_address=request.remote_addr,
        user_agent=request.user_agent.string
    )
    
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "message": "Token revoked successfully"
    })


@auth_api.route('/tokens', methods=['GET'])
@login_required
def list_user_tokens():
    """List all API tokens for the authenticated user"""
    user_id = session['user']['id']
    
    from models import ApiToken
    
    # Get all tokens for the user
    tokens = ApiToken.query.filter_by(user_id=user_id).order_by(ApiToken.created_at.desc()).all()
    
    return jsonify({
        "status": "success",
        "tokens": [{
            "id": token.id,
            "name": token.name,
            "created_at": token.created_at.isoformat(),
            "expires_at": token.expires_at.isoformat(),
            "last_used_at": token.last_used_at.isoformat() if token.last_used_at else None,
            "revoked": token.revoked
        } for token in tokens]
    })


@auth_api.route('/me', methods=['GET'])
@token_required
def get_user_info():
    """Get information about the authenticated user"""
    token_data = request.token_data
    
    # Get the user from the database
    from models import User
    
    user = User.query.get(token_data['user_id'])
    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found"
        }), 404
    
    return jsonify({
        "status": "success",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "department": user.department,
            "roles": [role.name for role in user.roles],
            "permissions": user.get_permissions()
        }
    })