"""
PACMLS API routes for integration and connection testing.

This module provides API endpoints for managing PACMLS credentials,
testing the connection, and retrieving PACMLS data.
"""

import os
import json
import logging
from flask import Blueprint, jsonify, request, current_app
from dotenv import load_dotenv

from etl.pacmls_connector import PacMlsConnector

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a Flask Blueprint
pacmls_api = Blueprint('pacmls_api', __name__, url_prefix='/api/pacmls')

@pacmls_api.route('/status', methods=['GET'])
def get_status():
    """
    Get the current status of the PACMLS integration.
    
    Returns:
        JSON with PACMLS integration status
    """
    # Load environment variables to ensure we have the latest values
    load_dotenv()
    
    # Check if credentials are available
    username = os.environ.get('PACMLS_USERNAME')
    password = os.environ.get('PACMLS_PASSWORD')
    
    # Initialize response data
    data = {
        'credentials_configured': bool(username and password),
        'status': 'inactive',
        'priority': os.environ.get('PACMLS_PRIORITY', 'secondary'),
        'message': 'PACMLS integration is not configured'
    }
    
    # If credentials are available, check if connection works
    if username and password:
        try:
            # Try to initialize the connector and authenticate
            connector = PacMlsConnector(username, password)
            authenticated = connector._authenticate()
            
            if authenticated:
                data['status'] = 'active'
                data['message'] = 'PACMLS integration is active and working'
            else:
                data['status'] = 'error'
                data['message'] = 'PACMLS credentials are configured but authentication failed'
            
            # Close the connector
            connector.close()
            
        except Exception as e:
            logger.error(f"Error checking PACMLS status: {e}")
            data['status'] = 'error'
            data['message'] = f"Error testing PACMLS connection: {str(e)}"
    
    return jsonify(data)

@pacmls_api.route('/test-connection', methods=['POST'])
def test_connection():
    """
    Test the PACMLS connection with provided credentials.
    
    Expected JSON request body:
        username (str): PACMLS username
        password (str): PACMLS password
    
    Returns:
        JSON with connection test results
    """
    try:
        # Get credentials from request body
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided in request'
            }), 400
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Both username and password are required'
            }), 400
        
        # Try to initialize the connector and authenticate
        connector = PacMlsConnector(username, password)
        authenticated = connector._authenticate()
        
        if authenticated:
            result = {
                'success': True,
                'message': 'Connection successful! PACMLS authentication is working properly.'
            }
        else:
            result = {
                'success': False,
                'message': 'Authentication failed. Please check your credentials.'
            }
        
        # Close the connector
        connector.close()
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error testing PACMLS connection: {e}")
        return jsonify({
            'success': False,
            'message': f"Error: {str(e)}"
        }), 500

@pacmls_api.route('/save-config', methods=['POST'])
def save_config():
    """
    Save PACMLS configuration to the environment.
    
    Expected form data:
        pacmls_username (str): PACMLS username
        pacmls_password (str): PACMLS password
        pacmls_priority (str): Data source priority ('primary' or 'secondary')
    
    Returns:
        JSON with configuration save results
    """
    try:
        # Get form data
        username = request.form.get('pacmls_username')
        password = request.form.get('pacmls_password')
        priority = request.form.get('pacmls_priority', 'secondary')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Both username and password are required'
            }), 400
        
        # Load existing environment variables
        load_dotenv()
        
        # Path to .env file
        env_path = os.path.join(os.getcwd(), '.env')
        
        # Read existing content
        env_content = ""
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                env_content = f.read()
        
        # Check if the variables already exist in the file
        lines = env_content.splitlines()
        new_lines = []
        username_added = False
        password_added = False
        priority_added = False
        
        for line in lines:
            if line.startswith('PACMLS_USERNAME='):
                new_lines.append(f'PACMLS_USERNAME={username}')
                username_added = True
            elif line.startswith('PACMLS_PASSWORD='):
                new_lines.append(f'PACMLS_PASSWORD={password}')
                password_added = True
            elif line.startswith('PACMLS_PRIORITY='):
                new_lines.append(f'PACMLS_PRIORITY={priority}')
                priority_added = True
            else:
                new_lines.append(line)
        
        # Add variables if not already in the file
        if not username_added:
            new_lines.append(f'PACMLS_USERNAME={username}')
        if not password_added:
            new_lines.append(f'PACMLS_PASSWORD={password}')
        if not priority_added:
            new_lines.append(f'PACMLS_PRIORITY={priority}')
        
        # Write updated content back to .env file
        with open(env_path, 'w') as f:
            f.write('\n'.join(new_lines))
        
        # Reload environment variables
        load_dotenv()
        
        return jsonify({
            'success': True,
            'message': 'PACMLS configuration saved successfully'
        })
        
    except Exception as e:
        logger.error(f"Error saving PACMLS configuration: {e}")
        return jsonify({
            'success': False,
            'message': f"Error: {str(e)}"
        }), 500

@pacmls_api.route('/search', methods=['GET'])
def search_properties():
    """
    Search for properties using PACMLS.
    
    Query Parameters:
        location (str): Location to search for
        limit (int): Maximum number of results to return (default: 10)
        beds (int): Minimum number of bedrooms
        baths (int): Minimum number of bathrooms
        min_price (int): Minimum price
        max_price (int): Maximum price
        property_type (str): Type of property
    
    Returns:
        JSON with search results
    """
    try:
        # Load environment variables
        load_dotenv()
        
        # Get credentials
        username = os.environ.get('PACMLS_USERNAME')
        password = os.environ.get('PACMLS_PASSWORD')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'PACMLS integration is not configured. Please set up credentials.'
            }), 400
        
        # Get search parameters
        location = request.args.get('location')
        if not location:
            return jsonify({
                'success': False,
                'message': 'Location parameter is required'
            }), 400
        
        # Optional parameters
        limit = request.args.get('limit', 10, type=int)
        beds = request.args.get('beds', type=int)
        baths = request.args.get('baths', type=int)
        min_price = request.args.get('min_price', type=int)
        max_price = request.args.get('max_price', type=int)
        property_type = request.args.get('property_type')
        
        # Build search parameters
        search_params = {
            'limit': limit if isinstance(limit, int) else 10
        }
        
        if beds:
            search_params['beds'] = beds
        if baths:
            search_params['baths'] = baths
        if min_price:
            search_params['min_price'] = min_price
        if max_price:
            search_params['max_price'] = max_price
        if property_type:
            search_params['property_type'] = property_type
        
        # Initialize connector and search
        connector = PacMlsConnector(username, password)
        results = connector.search_properties(location, **search_params)
        
        # Add metadata
        results['success'] = True
        results['api_version'] = '1.0'
        results['data_source'] = 'pacmls'
        
        # Close the connector
        connector.close()
        
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"Error searching PACMLS properties: {e}")
        return jsonify({
            'success': False,
            'message': f"Error: {str(e)}"
        }), 500

@pacmls_api.route('/property/<property_id>', methods=['GET'])
def get_property_details(property_id):
    """
    Get detailed property information from PACMLS.
    
    Path Parameters:
        property_id (str): PACMLS property identifier
    
    Returns:
        JSON with property details
    """
    try:
        # Load environment variables
        load_dotenv()
        
        # Get credentials
        username = os.environ.get('PACMLS_USERNAME')
        password = os.environ.get('PACMLS_PASSWORD')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'PACMLS integration is not configured. Please set up credentials.'
            }), 400
        
        # Initialize connector and get property details
        connector = PacMlsConnector(username, password)
        property_data = connector.get_property_details(property_id)
        
        # Add metadata
        if 'metadata' not in property_data:
            property_data['metadata'] = {}
        
        property_data['metadata']['success'] = True
        property_data['metadata']['api_version'] = '1.0'
        property_data['metadata']['data_source'] = 'pacmls'
        
        # Close the connector
        connector.close()
        
        return jsonify(property_data)
        
    except Exception as e:
        logger.error(f"Error getting PACMLS property details: {e}")
        return jsonify({
            'success': False,
            'message': f"Error: {str(e)}"
        }), 500