"""
Supabase Configuration Routes

This module provides routes for configuring Supabase environments
and managing the application's connection to Supabase.
"""

import os
import logging
import json
from typing import Dict, Any, Optional, List, Tuple

try:
    from flask import Blueprint, request, render_template, redirect, url_for, flash, jsonify
    from werkzeug.security import generate_password_hash, check_password_hash
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False

from verify_supabase_env import (
    check_environment_variables,
    check_supabase_connection,
    check_supabase_auth,
    check_supabase_storage,
    check_postgis_extension,
    test_migration_readiness,
    run_all_checks
)
from set_supabase_env import (
    get_current_environment,
    check_environment_configuration,
    set_environment_variables,
    create_environment_if_needed
)
from supabase_connection_pool import get_pool_stats

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
VALID_ENVIRONMENTS = ["development", "training", "production"]

# Blueprint setup
supabase_config = Blueprint('supabase_config', __name__, url_prefix='/supabase')

# Route handlers
@supabase_config.route('/')
def index():
    """Render the Supabase configuration dashboard."""
    current_env = get_current_environment()
    environments = {}
    
    for env in VALID_ENVIRONMENTS:
        _, config = check_environment_configuration(env)
        environments[env] = config
    
    return render_template(
        'supabase/index.html',
        title="Supabase Configuration",
        current_env=current_env,
        environments=environments
    )

@supabase_config.route('/configure', methods=['GET', 'POST'])
def configure():
    """Configure a Supabase environment."""
    if request.method == 'POST':
        environment = request.form.get('environment')
        url = request.form.get('url')
        key = request.form.get('key')
        service_key = request.form.get('service_key')
        set_active = 'set_active' in request.form
        
        if not environment or not url or not key:
            flash('Environment, URL, and API key are required', 'danger')
            return redirect(url_for('supabase_config.configure'))
        
        if environment not in VALID_ENVIRONMENTS:
            flash(f'Invalid environment: {environment}', 'danger')
            return redirect(url_for('supabase_config.configure'))
        
        try:
            # Set environment variables
            env_url_var = f"SUPABASE_URL_{environment.upper()}"
            env_key_var = f"SUPABASE_KEY_{environment.upper()}"
            env_service_key_var = f"SUPABASE_SERVICE_KEY_{environment.upper()}"
            
            # Set environment variables
            os.environ[env_url_var] = url
            os.environ[env_key_var] = key
            
            if service_key:
                os.environ[env_service_key_var] = service_key
            
            # Set as active if requested
            if set_active:
                set_environment_variables(environment)
                flash(f'Environment {environment} configured and set as active', 'success')
            else:
                flash(f'Environment {environment} configured', 'success')
            
            return redirect(url_for('supabase_config.index'))
        except Exception as e:
            logger.error(f"Error configuring environment: {str(e)}")
            flash(f'Error configuring environment: {str(e)}', 'danger')
            
            return redirect(url_for('supabase_config.configure'))
    
    # GET request
    current_env = get_current_environment()
    
    return render_template(
        'supabase/configure.html',
        title="Configure Supabase Environment",
        current_env=current_env,
        environments=VALID_ENVIRONMENTS
    )

@supabase_config.route('/environment/<env_name>')
def environment_details(env_name):
    """Show details for a specific environment."""
    if env_name not in VALID_ENVIRONMENTS:
        flash(f'Invalid environment: {env_name}', 'danger')
        return redirect(url_for('supabase_config.index'))
    
    current_env = get_current_environment()
    _, env_info = check_environment_configuration(env_name)
    
    return render_template(
        'supabase/environment.html',
        title=f"{env_name.capitalize()} Environment",
        environment=env_name,
        env_info=env_info,
        is_current=(env_name == current_env)
    )

@supabase_config.route('/set_active', methods=['POST'])
def set_active():
    """Set the active Supabase environment."""
    environment = request.form.get('environment')
    
    if not environment or environment not in VALID_ENVIRONMENTS:
        flash('Invalid environment', 'danger')
        return redirect(url_for('supabase_config.index'))
    
    is_configured, config = check_environment_configuration(environment)
    
    if not is_configured:
        flash(f'Environment {environment} is not configured', 'danger')
        return redirect(url_for('supabase_config.index'))
    
    if set_environment_variables(environment):
        flash(f'Environment {environment} is now active', 'success')
    else:
        flash(f'Failed to set {environment} as active environment', 'danger')
    
    return redirect(url_for('supabase_config.index'))

@supabase_config.route('/test')
def test():
    """Test Supabase connection."""
    current_env = get_current_environment()
    
    return render_template(
        'supabase/test.html',
        title="Test Supabase Connection",
        current_env=current_env
    )

# API routes
@supabase_config.route('/api/test_connection', methods=['POST'])
def api_test_connection():
    """API endpoint to test Supabase connection."""
    data = request.json or {}
    environment = data.get('environment', '')
    
    if environment and environment not in VALID_ENVIRONMENTS:
        return jsonify({
            'success': False,
            'message': f'Invalid environment: {environment}',
            'environment': environment
        })
    
    # Use current environment if none specified
    if not environment:
        environment = get_current_environment()
    
    # If environment is not the current one, temporarily set it
    current_env = get_current_environment()
    temp_env_switch = (environment != current_env)
    
    if temp_env_switch:
        original_env_vars = {}
        for var in ["SUPABASE_URL", "SUPABASE_KEY", "SUPABASE_SERVICE_KEY"]:
            original_env_vars[var] = os.environ.get(var)
        
        set_environment_variables(environment)
    
    try:
        # Run connection tests
        variables = check_environment_variables()
        connection = check_supabase_connection()
        auth = check_supabase_auth()
        storage = check_supabase_storage()
        postgis = check_postgis_extension()
        
        # Build response
        response = {
            'success': all([
                variables.get('success', False),
                connection.get('success', False),
                auth.get('success', False),
                storage.get('success', False)
            ]),
            'message': 'Connection test completed',
            'environment': environment,
            'variables': variables,
            'connection': connection,
            'auth': auth,
            'storage': storage,
            'postgis': postgis
        }
        
        return jsonify(response)
    finally:
        # Restore original environment if we temporarily switched
        if temp_env_switch:
            for var, value in original_env_vars.items():
                if value:
                    os.environ[var] = value
            
            set_environment_variables(current_env)

@supabase_config.route('/api/test_all_environments')
def api_test_all_environments():
    """API endpoint to test all Supabase environments."""
    results = {}
    
    for env in VALID_ENVIRONMENTS:
        # Check if environment is configured
        is_configured, config = check_environment_configuration(env)
        
        if not is_configured:
            results[env] = {
                'success': False,
                'message': f'Environment {env} is not configured',
                'environment': env
            }
            continue
        
        # Temporarily set environment to run tests
        current_env = get_current_environment()
        temp_env_switch = (env != current_env)
        
        if temp_env_switch:
            original_env_vars = {}
            for var in ["SUPABASE_URL", "SUPABASE_KEY", "SUPABASE_SERVICE_KEY"]:
                original_env_vars[var] = os.environ.get(var)
            
            set_environment_variables(env)
        
        try:
            # Run connection tests
            variables = check_environment_variables()
            connection = check_supabase_connection()
            auth = check_supabase_auth()
            storage = check_supabase_storage()
            postgis = check_postgis_extension()
            
            # Build response
            results[env] = {
                'success': all([
                    variables.get('success', False),
                    connection.get('success', False),
                    auth.get('success', False),
                    storage.get('success', False)
                ]),
                'message': 'Connection test completed',
                'environment': env,
                'variables': variables,
                'connection': connection,
                'auth': auth,
                'storage': storage,
                'postgis': postgis
            }
        finally:
            # Restore original environment if we temporarily switched
            if temp_env_switch:
                for var, value in original_env_vars.items():
                    if value:
                        os.environ[var] = value
                
                set_environment_variables(current_env)
    
    return jsonify(results)

@supabase_config.route('/api/pool_stats')
def api_pool_stats():
    """API endpoint to get connection pool statistics."""
    try:
        stats = get_pool_stats()
        
        return jsonify({
            'success': True,
            'message': 'Connection pool statistics retrieved',
            'stats': stats
        })
    except Exception as e:
        logger.error(f"Error getting pool stats: {str(e)}")
        
        return jsonify({
            'success': False,
            'message': f'Error getting pool stats: {str(e)}',
            'stats': None
        })

@supabase_config.route('/api/migration_readiness', methods=['POST'])
def api_migration_readiness():
    """API endpoint to check if an environment is ready for migration."""
    data = request.json or {}
    environment = data.get('environment', '')
    
    if environment and environment not in VALID_ENVIRONMENTS:
        return jsonify({
            'success': False,
            'message': f'Invalid environment: {environment}',
            'environment': environment
        })
    
    # Use current environment if none specified
    if not environment:
        environment = get_current_environment()
    
    # If environment is not the current one, temporarily set it
    current_env = get_current_environment()
    temp_env_switch = (environment != current_env)
    
    if temp_env_switch:
        original_env_vars = {}
        for var in ["SUPABASE_URL", "SUPABASE_KEY", "SUPABASE_SERVICE_KEY"]:
            original_env_vars[var] = os.environ.get(var)
        
        set_environment_variables(environment)
    
    try:
        # Check migration readiness
        readiness = test_migration_readiness()
        
        return jsonify({
            'success': readiness.get('success', False),
            'message': readiness.get('message', ''),
            'environment': environment,
            'details': readiness.get('details', {})
        })
    finally:
        # Restore original environment if we temporarily switched
        if temp_env_switch:
            for var, value in original_env_vars.items():
                if value:
                    os.environ[var] = value
            
            set_environment_variables(current_env)

def register_routes(app):
    """Register Supabase configuration routes with the Flask app."""
    if not FLASK_AVAILABLE:
        logger.warning("Flask not available, cannot register Supabase configuration routes")
        return
    
    app.register_blueprint(supabase_config)
    logger.info("Supabase config routes registered successfully")