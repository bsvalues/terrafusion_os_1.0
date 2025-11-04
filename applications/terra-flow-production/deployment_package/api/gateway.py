"""
API Gateway Module

This module provides the main API Gateway functionality, registering all API endpoints
and handling basic API operations like authentication, routing, and error handling.
"""

import datetime
import json
import logging
import os
import uuid
from functools import wraps

from flask import Blueprint, jsonify, request, session, current_app

from auth import is_authenticated
from models import User, db

logger = logging.getLogger(__name__)

# Create the API blueprint
api_gateway = Blueprint('api', __name__, url_prefix='/api')

# API Token storage (in-memory for development, should use DB in production)
api_tokens = {}

def api_login_required(f):
    """Decorator to require login for API endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for API token in header or query param
        auth_header = request.headers.get('Authorization')
        token = None
        
        if auth_header:
            # Get token from header
            if auth_header.startswith('Bearer '):
                token = auth_header.split('Bearer ')[1]
        else:
            # Get token from query param
            token = request.args.get('api_token')
            
        if token and token in api_tokens:
            # Token exists and is valid
            token_data = api_tokens[token]
            # Check if token is expired
            if token_data['expires_at'] > datetime.datetime.now():
                # Valid token, allow access
                return f(*args, **kwargs)
            else:
                # Token expired
                return jsonify({'error': 'API token expired. Please refresh your token.'}), 401
        elif is_authenticated():
            # User is authenticated via session
            return f(*args, **kwargs)
        else:
            # No valid token or session
            return jsonify({'error': 'Authentication required. Please provide a valid API token.'}), 401
            
    return decorated_function

# API Routes
@api_gateway.route('/')
def api_index():
    """API index route providing information about the API"""
    return jsonify({
        'name': 'Benton County Data Hub API',
        'version': '1.0.0',
        'base_url': '/api',
        'documentation_url': '/api/docs',
        'endpoints': [
            {'path': '/', 'method': 'GET', 'description': 'API information'},
            {'path': '/docs', 'method': 'GET', 'description': 'API documentation'},
            {'path': '/auth/token', 'method': 'POST', 'description': 'Generate API token'},
            {'path': '/auth/refresh', 'method': 'POST', 'description': 'Refresh API token'},
            {'path': '/auth/revoke', 'method': 'POST', 'description': 'Revoke API token'},
            {'path': '/auth/user', 'method': 'GET', 'description': 'Get user information'},
            {'path': '/spatial/layers', 'method': 'GET', 'description': 'List GIS layers'},
            {'path': '/data/sources', 'method': 'GET', 'description': 'List data sources'},
            {'path': '/search', 'method': 'POST', 'description': 'Search data using RAG'},
        ]
    })

@api_gateway.route('/docs')
def api_docs():
    """API documentation endpoint"""
    return jsonify({
        'name': 'Benton County Data Hub API Documentation',
        'version': '1.0.0',
        'description': 'This API provides access to Benton County Data Hub functionality.',
        'base_url': '/api',
        'authentication': {
            'type': 'Bearer Token',
            'endpoint': '/api/auth/token',
            'method': 'POST',
            'body': {
                'username': 'your_username',
                'password': 'your_password'
            },
            'response': {
                'token': 'your_api_token',
                'expires_at': 'token_expiry_date'
            }
        },
        'endpoints': [
            {
                'path': '/auth/token',
                'method': 'POST',
                'description': 'Generate API token',
                'parameters': [
                    {'name': 'username', 'type': 'string', 'required': True},
                    {'name': 'password', 'type': 'string', 'required': True}
                ],
                'response': {
                    'token': 'your_api_token',
                    'expires_at': 'token_expiry_date'
                }
            },
            {
                'path': '/auth/refresh',
                'method': 'POST',
                'description': 'Refresh API token',
                'parameters': [
                    {'name': 'token', 'type': 'string', 'required': True}
                ],
                'response': {
                    'token': 'your_new_api_token',
                    'expires_at': 'new_token_expiry_date'
                }
            },
            {
                'path': '/spatial/layers',
                'method': 'GET',
                'description': 'List GIS layers',
                'parameters': [
                    {'name': 'format', 'type': 'string', 'required': False, 'default': 'json'},
                    {'name': 'type', 'type': 'string', 'required': False}
                ],
                'response': {
                    'layers': [
                        {
                            'id': 'layer_id',
                            'name': 'Layer Name',
                            'type': 'geojson/shapefile/etc',
                            'features': 'feature_count',
                            'attributes': ['attr1', 'attr2']
                        }
                    ]
                }
            },
            {
                'path': '/data/sources',
                'method': 'GET',
                'description': 'List data sources',
                'parameters': [
                    {'name': 'type', 'type': 'string', 'required': False}
                ],
                'response': {
                    'sources': [
                        {
                            'id': 'source_id',
                            'name': 'Source Name',
                            'type': 'sql/csv/excel',
                            'tables': ['table1', 'table2']
                        }
                    ]
                }
            },
            {
                'path': '/search',
                'method': 'POST',
                'description': 'Search data using RAG',
                'parameters': [
                    {'name': 'query', 'type': 'string', 'required': True}
                ],
                'response': {
                    'results': [
                        {
                            'id': 'result_id',
                            'title': 'Result Title',
                            'source': 'Source',
                            'content': 'Content'
                        }
                    ],
                    'answer': 'Generated answer based on the query'
                }
            }
        ]
    })

@api_gateway.route('/auth/token', methods=['POST'])
def create_api_token():
    """Create a new API token using username and password"""
    username = request.json.get('username')
    password = request.json.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Check for development bypass
    if os.environ.get('BYPASS_LDAP', 'false').lower() == 'true':
        # Create a token for the test user
        token = str(uuid.uuid4())
        expires_at = datetime.datetime.now() + datetime.timedelta(days=1)
        
        # Store token
        api_tokens[token] = {
            'username': 'dev_user',
            'user_id': 1,
            'created_at': datetime.datetime.now(),
            'expires_at': expires_at
        }
        
        return jsonify({
            'token': token,
            'expires_at': expires_at.isoformat()
        })
    
    # In a real implementation, check user credentials against LDAP
    # and generate a token
    
    # For demo only
    return jsonify({'error': 'Authentication failed'}), 401

@api_gateway.route('/auth/refresh', methods=['POST'])
@api_login_required
def refresh_api_token():
    """Refresh an existing API token"""
    auth_header = request.headers.get('Authorization')
    old_token = None
    
    if auth_header and auth_header.startswith('Bearer '):
        old_token = auth_header.split('Bearer ')[1]
    else:
        old_token = request.json.get('token')
        
    if not old_token or old_token not in api_tokens:
        return jsonify({'error': 'Invalid token'}), 400
        
    # Create a new token
    token = str(uuid.uuid4())
    expires_at = datetime.datetime.now() + datetime.timedelta(days=1)
    
    # Copy user data from old token
    api_tokens[token] = api_tokens[old_token].copy()
    api_tokens[token]['created_at'] = datetime.datetime.now()
    api_tokens[token]['expires_at'] = expires_at
    
    # Remove old token
    del api_tokens[old_token]
    
    return jsonify({
        'token': token,
        'expires_at': expires_at.isoformat()
    })

@api_gateway.route('/auth/revoke', methods=['POST'])
@api_login_required
def revoke_api_token():
    """Revoke an API token"""
    auth_header = request.headers.get('Authorization')
    token = None
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split('Bearer ')[1]
    else:
        token = request.json.get('token')
        
    if not token or token not in api_tokens:
        return jsonify({'error': 'Invalid token'}), 400
        
    # Remove token
    del api_tokens[token]
    
    return jsonify({'message': 'Token revoked successfully'})

@api_gateway.route('/auth/user')
@api_login_required
def get_api_user():
    """Get information about the authenticated user"""
    auth_header = request.headers.get('Authorization')
    token = None
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split('Bearer ')[1]
        
    if token and token in api_tokens:
        # Return user info from token
        token_data = api_tokens[token]
        return jsonify({
            'username': token_data['username'],
            'user_id': token_data['user_id']
        })
    elif is_authenticated():
        # Return user info from session
        return jsonify({
            'username': session['user']['username'],
            'user_id': session['user']['id']
        })
    else:
        return jsonify({'error': 'Not authenticated'}), 401

# API error handling
@api_gateway.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@api_gateway.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@api_gateway.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@api_gateway.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Server error'}), 500

# Register API endpoint modules
def register_api_endpoint_modules(app):
    """Register all API endpoint modules with the Flask app"""
    try:
        # Import API modules first
        from api.spatial import spatial_bp
        from api.data_query import data_bp
        
        # Register sub-blueprints to main API blueprint
        api_gateway.register_blueprint(spatial_bp)
        api_gateway.register_blueprint(data_bp)
        
        # Register the main API Blueprint with Flask app
        app.register_blueprint(api_gateway)
        
        logger.info("API Gateway registered successfully")
        return True
    except Exception as e:
        logger.error(f"Error registering API modules: {e}")
        return False