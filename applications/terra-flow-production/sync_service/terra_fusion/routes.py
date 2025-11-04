"""
Flask Routes for TerraFusion Sync Service.

This module provides Flask routes for integrating the TerraFusion Sync Service
with the main application.
"""

import os
import logging
import datetime
from typing import Dict, Any, Optional

from flask import Blueprint, Flask, render_template, redirect, url_for, request, flash, jsonify
from flask.views import MethodView
from flask_login import login_required
from werkzeug.exceptions import NotFound

from sync_service.terra_fusion.flask_integration import get_sync_service, active_sync_services

# Initialize logging
logger = logging.getLogger(__name__)

def _get_sync_service(job_id: str) -> Any:
    """
    Get an active sync service by job ID.
    
    Args:
        job_id: ID of the sync job
        
    Returns:
        TerraFusionSyncService instance
    
    Raises:
        NotFound: If job ID not found
    """
    sync_service = get_sync_service(job_id)
    if not sync_service:
        raise NotFound(f"Sync job not found: {job_id}")
    return sync_service

def register_blueprint(app: Flask) -> Dict[str, Any]:
    """
    Register the TerraFusion UI blueprint with a Flask app.
    
    Args:
        app: Flask application
        
    Returns:
        Dict with registration results
    """
    try:
        # Create the UI blueprint
        ui_bp = Blueprint('terra_fusion_ui', __name__, url_prefix='/sync/terra_fusion')
        
        # Dashboard
        @ui_bp.route('/', methods=['GET'])
        @ui_bp.route('/dashboard', methods=['GET'])
        @login_required
        def dashboard():
            """Render the TerraFusion Sync dashboard."""
            # Get all active sync jobs
            jobs = list(active_sync_services.values())
            
            # Render the dashboard template
            return render_template(
                'sync/terra_fusion/dashboard.html',
                jobs=jobs,
                active_count=len(jobs),
                title="TerraFusion Sync Dashboard"
            )
        
        # Job details
        @ui_bp.route('/job/<job_id>', methods=['GET'])
        @login_required
        def job_details(job_id):
            """Render the job details page."""
            try:
                # Get the sync service
                sync_service = _get_sync_service(job_id)
                
                # Render the job details template
                return render_template(
                    'sync/terra_fusion/job_details.html',
                    job=sync_service,
                    title=f"Job Details: {job_id}"
                )
                
            except NotFound as e:
                flash(str(e), 'error')
                return redirect(url_for('terra_fusion_ui.dashboard'))
        
        # Conflicts page
        @ui_bp.route('/conflicts/<job_id>', methods=['GET'])
        @login_required
        def conflicts_page(job_id):
            """Render the conflicts page."""
            try:
                # Get the sync service
                sync_service = _get_sync_service(job_id)
                
                # Get conflicts
                conflicts = sync_service.get('conflicts', [])
                
                # Render the conflicts template
                return render_template(
                    'sync/terra_fusion/conflicts.html',
                    job=sync_service,
                    conflicts=conflicts,
                    title=f"Conflicts: {job_id}"
                )
                
            except NotFound as e:
                flash(str(e), 'error')
                return redirect(url_for('terra_fusion_ui.dashboard'))
        
        # New job form
        @ui_bp.route('/new', methods=['GET', 'POST'])
        @login_required
        def new_job():
            """Render the new job form."""
            if request.method == 'POST':
                # Process form submission
                source_connection = request.form.get('source_connection')
                target_connection = request.form.get('target_connection')
                sync_type = request.form.get('sync_type', 'full')
                
                if not source_connection or not target_connection:
                    flash('Source and target connections are required', 'error')
                    return render_template(
                        'sync/terra_fusion/new_job.html',
                        title="New Sync Job"
                    )
                
                # Create job
                try:
                    # Build request data
                    data = {
                        'source_connection': source_connection,
                        'target_connection': target_connection,
                        'config': {
                            'batch_size': int(request.form.get('batch_size', 1000)),
                            'detection_strategy': request.form.get('detection_strategy', 'hash'),
                            'conflict_strategy': request.form.get('conflict_strategy', 'source_wins'),
                            'max_parallel_tables': int(request.form.get('max_parallel_tables', 1)),
                            'max_parallel_operations': int(request.form.get('max_parallel_operations', 5)),
                            'audit_level': request.form.get('audit_level', 'standard')
                        }
                    }
                    
                    # Make API request
                    import requests
                    
                    if sync_type == 'full':
                        endpoint = '/api/sync/full'
                    else:
                        endpoint = '/api/sync/incremental'
                    
                    # Since we're already in Flask, use internal method instead of HTTP request
                    from flask import current_app
                    import importlib
                    
                    if sync_type == 'full':
                        module = importlib.import_module('sync_service.terra_fusion.flask_integration')
                        result = module.start_full_sync()
                    else:
                        module = importlib.import_module('sync_service.terra_fusion.flask_integration')
                        result = module.start_incremental_sync()
                    
                    # Get job ID
                    job_id = result.json['job_id']
                    
                    flash(f"Sync job created successfully: {job_id}", 'success')
                    return redirect(url_for('terra_fusion_ui.job_details', job_id=job_id))
                    
                except Exception as e:
                    flash(f"Error creating sync job: {str(e)}", 'error')
                    logger.error(f"Error creating sync job: {str(e)}")
                    return render_template(
                        'sync/terra_fusion/new_job.html',
                        title="New Sync Job"
                    )
            
            # Show form
            return render_template(
                'sync/terra_fusion/new_job.html',
                title="New Sync Job"
            )
        
        # Audit page
        @ui_bp.route('/audit/<job_id>', methods=['GET'])
        @login_required
        def audit_page(job_id):
            """Render the audit page."""
            try:
                # Get the sync service
                sync_service = _get_sync_service(job_id)
                
                # Get audit events
                audit_events = sync_service.get('audit_events', [])
                
                # Render the audit template
                return render_template(
                    'sync/terra_fusion/audit.html',
                    job=sync_service,
                    audit_events=audit_events,
                    title=f"Audit: {job_id}"
                )
                
            except NotFound as e:
                flash(str(e), 'error')
                return redirect(url_for('terra_fusion_ui.dashboard'))
        
        # Schema validation page
        @ui_bp.route('/schema/<job_id>', methods=['GET'])
        @login_required
        def schema_page(job_id):
            """Render the schema validation page."""
            try:
                # Get the sync service
                sync_service = _get_sync_service(job_id)
                
                # Get tables
                tables = sync_service.get('tables', [])
                
                # Render the schema template
                return render_template(
                    'sync/terra_fusion/schema.html',
                    job=sync_service,
                    tables=tables,
                    title=f"Schema Validation: {job_id}"
                )
                
            except NotFound as e:
                flash(str(e), 'error')
                return redirect(url_for('terra_fusion_ui.dashboard'))
        
        # Control actions
        @ui_bp.route('/control/<job_id>/<action>', methods=['POST'])
        @login_required
        def control_job(job_id, action):
            """Control a sync job."""
            try:
                # Get the sync service
                sync_service = _get_sync_service(job_id)
                
                # Perform action
                if action == 'start':
                    sync_service['status'] = 'running'
                    sync_service['updated_at'] = datetime.datetime.utcnow().isoformat()
                    flash(f"Job started: {job_id}", 'success')
                    
                elif action == 'stop':
                    sync_service['status'] = 'stopped'
                    sync_service['updated_at'] = datetime.datetime.utcnow().isoformat()
                    flash(f"Job stopped: {job_id}", 'success')
                    
                elif action == 'resume':
                    sync_service['status'] = 'running'
                    sync_service['updated_at'] = datetime.datetime.utcnow().isoformat()
                    flash(f"Job resumed: {job_id}", 'success')
                    
                elif action == 'delete':
                    if job_id in active_sync_services:
                        del active_sync_services[job_id]
                    flash(f"Job deleted: {job_id}", 'success')
                    return redirect(url_for('terra_fusion_ui.dashboard'))
                    
                else:
                    flash(f"Unknown action: {action}", 'error')
                    
                return redirect(url_for('terra_fusion_ui.job_details', job_id=job_id))
                
            except NotFound as e:
                flash(str(e), 'error')
                return redirect(url_for('terra_fusion_ui.dashboard'))
        
        # Register the blueprint with the app
        app.register_blueprint(ui_bp)
        logger.info(f"Registered TerraFusion UI routes at {ui_bp.url_prefix}")
        
        return {
            'status': 'success',
            'message': 'TerraFusion UI routes registered successfully'
        }
        
    except Exception as e:
        logger.error(f"Error registering TerraFusion UI routes: {str(e)}")
        return {
            'status': 'error',
            'message': f'Error registering TerraFusion UI routes: {str(e)}'
        }