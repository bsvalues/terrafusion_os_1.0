"""
Data Source Manager Controller

This module provides routes for managing data sources in the TerraMiner application.
"""

import os
import json
import logging
from datetime import datetime
from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash, current_app

from etl.real_estate_data_connector import RealEstateDataConnector
from models.property import Property, DataSourceStatus
from db import db

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a blueprint for data source routes
data_source_bp = Blueprint('data_sources', __name__, url_prefix='/data-sources')

@data_source_bp.route('/')
def index():
    """
    Render the data source manager dashboard.
    
    This page allows users to view and manage all connected data sources.
    """
    # Get real estate data connector
    real_estate_connector = _get_real_estate_connector()
    
    # Fetch all registered data sources with metrics
    data_sources = _get_all_data_sources(real_estate_connector)
    
    # Get database statistics
    property_count = _get_property_count()
    location_count = _get_location_count()
    
    # Get last sync timestamp
    last_sync = _get_last_sync_time()
    
    # Calculate number of active sources
    active_sources = sum(1 for source in data_sources if source['status'] == 'healthy')
    
    # Get global settings
    global_settings = _get_global_settings()
    
    # Render the template
    return render_template(
        'data_sources/manager.html',
        data_sources=data_sources,
        property_count=property_count,
        location_count=location_count,
        last_sync=last_sync,
        active_sources=active_sources,
        failover_timeout=global_settings.get('failover_timeout', 10),
        max_retry_attempts=global_settings.get('max_retry_attempts', 3),
        enable_circuit_breakers=global_settings.get('enable_circuit_breakers', True)
    )

@data_source_bp.route('/api/<source_name>/test', methods=['POST'])
def test_source(source_name):
    """
    Test the connection to a specific data source.
    
    This endpoint attempts to connect to the specified data source
    and returns the results of the test.
    
    Args:
        source_name (str): Name of the data source to test
    
    Returns:
        JSON with test results
    """
    try:
        # Get real estate data connector
        real_estate_connector = _get_real_estate_connector()
        
        # Check if the source exists
        if source_name not in real_estate_connector.connectors:
            return jsonify({
                'success': False,
                'message': f"Data source '{source_name}' not found"
            }), 404
        
        # Get the connector
        connector = real_estate_connector.connectors[source_name]
        
        # Test the connection by performing a simple search
        search_results = connector.search_properties('Seattle, WA', limit=1)
        
        # Determine success based on results
        if 'error' in search_results:
            return jsonify({
                'success': False,
                'message': search_results['error']
            })
        
        # Update the connector's health status in the database
        _update_source_status(source_name, connector)
        
        return jsonify({
            'success': True,
            'message': 'Connection test successful',
            'details': {
                'properties_found': len(search_results.get('listings', [])),
                'health_status': connector.get_health_status()['status']
            }
        })
    
    except Exception as e:
        logger.error(f"Error testing data source '{source_name}': {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Error testing connection: {str(e)}"
        }), 500

@data_source_bp.route('/api/<source_name>/configure', methods=['POST'])
def configure_source(source_name):
    """
    Configure a specific data source.
    
    This endpoint updates the configuration of a data source,
    including credentials and settings.
    
    Args:
        source_name (str): Name of the data source to configure
    
    Expected JSON request:
    {
        "priority": "primary",
        "credentials": {
            "apiKey": "...",
            "username": "...",
            "password": "..."
        },
        "settings": {
            "timeout": 10,
            "retries": 3
        }
    }
    
    Returns:
        JSON with configuration results
    """
    try:
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Get real estate data connector
        real_estate_connector = _get_real_estate_connector()
        
        # Check if the source exists
        if source_name not in real_estate_connector.connectors:
            return jsonify({
                'success': False,
                'message': f"Data source '{source_name}' not found"
            }), 404
        
        # Extract configuration data
        priority = data.get('priority')
        credentials = data.get('credentials', {})
        settings = data.get('settings', {})
        
        # Apply source-specific configuration
        if source_name == 'zillow' or source_name == 'realtor':
            api_key = credentials.get('apiKey')
            if api_key:
                # Update the RapidAPI key in environment variables
                _update_env_var('RAPIDAPI_KEY', api_key)
        
        elif source_name == 'pacmls':
            username = credentials.get('username')
            password = credentials.get('password')
            if username and password:
                # Update PACMLS credentials in environment variables
                _update_env_var('PACMLS_USERNAME', username)
                _update_env_var('PACMLS_PASSWORD', password)
        
        # Update priority if specified
        if priority:
            _update_env_var(f'{source_name.upper()}_PRIORITY', priority)
        
        # Update the source status in the database
        with current_app.app_context():
            # Get or create the status record
            status = DataSourceStatus.query.filter_by(source_name=source_name).first()
            if not status:
                status = DataSourceStatus(source_name=source_name)
            
            # Update fields
            status.priority = priority
            status.credentials_configured = True
            
            # Additional settings
            timeout = settings.get('timeout')
            retries = settings.get('retries')
            
            if timeout:
                _update_env_var(f'{source_name.upper()}_TIMEOUT', str(timeout))
            
            if retries:
                _update_env_var(f'{source_name.upper()}_RETRIES', str(retries))
            
            # Save changes
            db.session.add(status)
            db.session.commit()
        
        # Return success
        return jsonify({
            'success': True,
            'message': f"Configuration for '{source_name}' saved successfully",
            'requires_restart': True
        })
    
    except Exception as e:
        logger.error(f"Error configuring data source '{source_name}': {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Error saving configuration: {str(e)}"
        }), 500

@data_source_bp.route('/api/config', methods=['POST'])
def save_global_config():
    """
    Save global data source configuration.
    
    This endpoint updates the global configuration for all data sources,
    including priority order and global settings.
    
    Expected JSON request:
    {
        "priority_order": ["zillow", "realtor", "pacmls"],
        "enabled_sources": ["zillow", "realtor"],
        "settings": {
            "failover_timeout": 10,
            "max_retry_attempts": 3,
            "enable_circuit_breakers": true
        }
    }
    
    Returns:
        JSON with configuration results
    """
    try:
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Extract configuration data
        priority_order = data.get('priority_order', [])
        enabled_sources = data.get('enabled_sources', [])
        settings = data.get('settings', {})
        
        # Update global settings in environment variables
        if 'failover_timeout' in settings:
            _update_env_var('FAILOVER_TIMEOUT', str(settings['failover_timeout']))
        
        if 'max_retry_attempts' in settings:
            _update_env_var('MAX_RETRY_ATTEMPTS', str(settings['max_retry_attempts']))
        
        if 'enable_circuit_breakers' in settings:
            _update_env_var('ENABLE_CIRCUIT_BREAKERS', 'true' if settings['enable_circuit_breakers'] else 'false')
        
        # Update priority for each source based on order
        with current_app.app_context():
            for i, source_name in enumerate(priority_order):
                # Get or create the status record
                status = DataSourceStatus.query.filter_by(source_name=source_name).first()
                if not status:
                    status = DataSourceStatus(source_name=source_name)
                
                # Update priority based on position (1-based)
                if i == 0:
                    status.priority = 'primary'
                elif i == 1:
                    status.priority = 'secondary'
                elif i == 2:
                    status.priority = 'tertiary'
                else:
                    status.priority = 'fallback'
                
                # Update enabled status
                status.is_active = source_name in enabled_sources
                
                # Save changes
                db.session.add(status)
            
            # Commit all changes
            db.session.commit()
        
        # Return success
        return jsonify({
            'success': True,
            'message': "Global configuration saved successfully",
            'requires_restart': True
        })
    
    except Exception as e:
        logger.error(f"Error saving global data source configuration: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Error saving configuration: {str(e)}"
        }), 500

@data_source_bp.route('/api/logs', methods=['GET'])
def get_logs():
    """
    Get logs for all data sources.
    
    Query Parameters:
        source (str): Filter logs by source name
        level (str): Filter logs by log level (error, warning, info, debug)
        limit (int): Maximum number of logs to return
    
    Returns:
        JSON with log entries
    """
    try:
        # Get query parameters
        source = request.args.get('source')
        level = request.args.get('level')
        limit = request.args.get('limit', 100, type=int)
        
        # Get logs from the database
        logs = _get_source_logs(source, level, limit)
        
        return jsonify({
            'success': True,
            'logs': logs
        })
    
    except Exception as e:
        logger.error(f"Error getting data source logs: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Error getting logs: {str(e)}"
        }), 500

@data_source_bp.route('/api/metrics', methods=['GET'])
def get_metrics():
    """
    Get performance metrics for all data sources.
    
    Returns:
        JSON with metrics data
    """
    try:
        # Get real estate data connector
        real_estate_connector = _get_real_estate_connector()
        
        # Fetch all registered data sources with metrics
        data_sources = _get_all_data_sources(real_estate_connector)
        
        return jsonify({
            'success': True,
            'metrics': {
                'sources': data_sources,
                'timestamp': datetime.utcnow().isoformat()
            }
        })
    
    except Exception as e:
        logger.error(f"Error getting data source metrics: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Error getting metrics: {str(e)}"
        }), 500

# Helper functions

def _get_real_estate_connector():
    """
    Get or create a RealEstateDataConnector instance.
    
    Returns:
        RealEstateDataConnector: The connector instance
    """
    # Check if the connector is already in the app context
    connector = getattr(current_app, '_real_estate_connector', None)
    if connector is None:
        # Create a new connector
        connector = RealEstateDataConnector()
        # Store it in the app context
        current_app._real_estate_connector = connector
    return connector

def _get_all_data_sources(connector):
    """
    Get information about all registered data sources.
    
    Args:
        connector (RealEstateDataConnector): The real estate data connector
    
    Returns:
        list: List of data source information dictionaries
    """
    data_sources = []
    
    # Check database for source status records
    source_status_dict = {}
    with current_app.app_context():
        status_records = DataSourceStatus.query.all()
        for record in status_records:
            source_status_dict[record.source_name] = {
                'priority': record.priority,
                'is_active': record.is_active,
                'status': record.status,
                'last_check': record.last_check,
                'success_rate': record.success_rate
            }
    
    # Get information from active connectors
    for name, source_connector in connector.connectors.items():
        # Skip None connectors (not yet implemented or failed to initialize)
        if source_connector is None:
            # Create a basic info object from database status
            db_status = source_status_dict.get(name, {})
            status = db_status.get('status', 'unavailable')
            source_info = {
                'name': name,
                'status': status,
                'priority': db_status.get('priority', 'unknown'),
                'priority_num': 999,  # Sort at the end
                'enabled': db_status.get('is_active', False),
                'data_types': [],
                'success_rate': 0,
                'metrics': {
                    'requests': 0,
                    'errors': 0,
                    'avg_response_time': 0
                },
                'message': 'Connector not implemented or failed to initialize'
            }
            data_sources.append(source_info)
            continue

        # Get health and metrics for active connectors
        health = source_connector.get_health_status()
        metrics = source_connector.get_metrics()
        
        # Get status from database if available, otherwise use connector health
        db_status = source_status_dict.get(name, {})
        
        # Data types provided by this source
        data_types = ['listings', 'details']
        if hasattr(source_connector, 'get_market_trends'):
            data_types.append('market_trends')
        
        # Map priority to a numeric value for sorting and display
        priority = db_status.get('priority', source_connector.source_priority)
        if priority == 'primary':
            priority_num = 1
        elif priority == 'secondary':
            priority_num = 2
        elif priority == 'tertiary':
            priority_num = 3
        else:
            priority_num = 4
        
        # Create source info
        source_info = {
            'name': name,
            'status': db_status.get('status', health['status']),
            'priority': priority,
            'priority_num': priority_num,
            'enabled': db_status.get('is_active', True),
            'data_types': data_types,
            'success_rate': db_status.get('success_rate', 100 * (1 - metrics.get('error_rate', 0))),
            'metrics': metrics
        }
        
        data_sources.append(source_info)
    
    # Sort by priority
    data_sources.sort(key=lambda x: x['priority_num'])
    
    return data_sources

def _get_property_count():
    """
    Get the total number of properties in the database.
    
    Returns:
        int: Number of properties
    """
    try:
        with current_app.app_context():
            return Property.query.count()
    except Exception as e:
        logger.error(f"Error getting property count: {str(e)}")
        return 0

def _get_location_count():
    """
    Get the number of unique locations (cities) in the database.
    
    Returns:
        int: Number of unique locations
    """
    try:
        with current_app.app_context():
            return db.session.query(Property.city).distinct().count()
    except Exception as e:
        logger.error(f"Error getting location count: {str(e)}")
        return 0

def _get_last_sync_time():
    """
    Get the timestamp of the last data synchronization.
    
    Returns:
        str: Formatted timestamp of the last sync
    """
    try:
        with current_app.app_context():
            latest_property = Property.query.order_by(Property.updated_at.desc()).first()
            if latest_property and latest_property.updated_at:
                return latest_property.updated_at.strftime('%Y-%m-%d %H:%M:%S')
    except Exception as e:
        logger.error(f"Error getting last sync time: {str(e)}")
    
    return 'Never'

def _get_global_settings():
    """
    Get global data source settings.
    
    Returns:
        dict: Global settings
    """
    return {
        'failover_timeout': int(os.environ.get('FAILOVER_TIMEOUT', 10)),
        'max_retry_attempts': int(os.environ.get('MAX_RETRY_ATTEMPTS', 3)),
        'enable_circuit_breakers': os.environ.get('ENABLE_CIRCUIT_BREAKERS', 'true').lower() == 'true'
    }

def _update_source_status(source_name, connector):
    """
    Update the status of a data source in the database.
    
    Args:
        source_name (str): Name of the data source
        connector (BaseApiConnector): The connector instance
    """
    try:
        with current_app.app_context():
            # Get health and metrics from the connector
            health = connector.get_health_status()
            metrics = connector.get_metrics()
            
            # Get or create the status record
            status = DataSourceStatus.query.filter_by(source_name=source_name).first()
            if not status:
                status = DataSourceStatus(source_name=source_name)
            
            # Update fields
            status.status = health['status']
            status.last_check = datetime.utcnow()
            status.success_rate = 100 * (1 - metrics.get('error_rate', 0))
            status.avg_response_time = metrics.get('avg_response_time', 0)
            status.error_count = metrics.get('errors', 0)
            
            # Update rate limit information
            if 'rate_limit' in health and health['rate_limit']['remaining'] is not None:
                status.rate_limit_remaining = health['rate_limit']['remaining']
                if health['rate_limit']['reset']:
                    status.rate_limit_reset = datetime.fromtimestamp(health['rate_limit']['reset'])
            
            # Save changes
            db.session.add(status)
            db.session.commit()
    
    except Exception as e:
        logger.error(f"Error updating source status: {str(e)}")

def _update_env_var(key, value):
    """
    Update an environment variable and the .env file.
    
    Args:
        key (str): Environment variable name
        value (str): Environment variable value
    """
    # Update the environment variable
    os.environ[key] = value
    
    # Update the .env file
    env_path = os.path.join(os.getcwd(), '.env')
    
    # Read existing content
    env_content = ""
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            env_content = f.read()
    
    # Check if the variable already exists in the file
    lines = env_content.splitlines()
    new_lines = []
    var_added = False
    
    for line in lines:
        if line.startswith(f'{key}='):
            new_lines.append(f'{key}={value}')
            var_added = True
        else:
            new_lines.append(line)
    
    # Add the variable if it doesn't exist
    if not var_added:
        new_lines.append(f'{key}={value}')
    
    # Write updated content back to .env file
    with open(env_path, 'w') as f:
        f.write('\n'.join(new_lines))

def _get_source_logs(source=None, level=None, limit=100):
    """
    Get logs for data sources from the log file.
    
    Args:
        source (str, optional): Filter logs by source name
        level (str, optional): Filter logs by log level
        limit (int, optional): Maximum number of logs to return
    
    Returns:
        list: Log entries
    """
    logs = []
    log_path = os.path.join(os.getcwd(), 'logs', 'etl.log')
    
    if not os.path.exists(log_path):
        return logs
    
    # Read the log file and parse entries
    try:
        with open(log_path, 'r') as f:
            for line in f:
                # Parse log line
                try:
                    parts = line.split(' - ', 2)
                    if len(parts) >= 3:
                        timestamp, log_level, message = parts
                        
                        # Extract source from message if possible
                        source_name = 'unknown'
                        for connector_name in ['zillow', 'realtor', 'pacmls', 'county']:
                            if connector_name in message.lower():
                                source_name = connector_name
                                break
                        
                        # Apply filters
                        if source and source != 'all' and source_name != source:
                            continue
                        
                        if level and level != 'all' and log_level.lower() != level.lower():
                            continue
                        
                        logs.append({
                            'timestamp': timestamp.strip(),
                            'level': log_level.strip(),
                            'message': message.strip(),
                            'source': source_name
                        })
                except Exception:
                    # Skip malformed log lines
                    continue
    except Exception as e:
        logger.error(f"Error reading log file: {str(e)}")
    
    # Return the most recent logs up to the limit
    return sorted(logs, key=lambda x: x['timestamp'], reverse=True)[:limit]

# Register the blueprint with the main application
def register_blueprint(app):
    """
    Register the data source blueprint with the Flask app.
    
    Args:
        app: Flask application instance
    """
    app.register_blueprint(data_source_bp)