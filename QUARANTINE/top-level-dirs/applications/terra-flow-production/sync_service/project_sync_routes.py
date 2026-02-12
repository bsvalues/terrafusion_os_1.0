"""
Project Sync Service Routes

This module provides Flask routes for the enhanced DatabaseProjectSyncService,
allowing users to configure, initiate, and monitor database project synchronization.
"""
import datetime
import json
from flask import (
    Blueprint, render_template, request, jsonify, 
    session, flash, redirect, url_for, current_app
)

from app import db
from sync_service.models import (
    SyncJob, TableConfiguration, FieldConfiguration, 
    SyncLog, SyncConflict, GlobalSetting
)
from sync_service.database_project_sync import DatabaseProjectSyncService
from sync_service.data_type_handlers import (
    get_handler_for_column, register_handler, DataTypeHandler
)
from auth import login_required, permission_required, role_required

import logging
import sqlalchemy as sa
from sqlalchemy.sql import text

# Create logger
logger = logging.getLogger(__name__)

# Create the blueprint
project_sync_bp = Blueprint('project_sync', __name__, url_prefix='/project-sync')

# Active sync services
active_syncs = {}

@project_sync_bp.route('/')
@login_required
@role_required('administrator')
def dashboard():
    """Project sync dashboard."""
    # Get recent project sync jobs
    recent_jobs = SyncJob.query.filter_by(
        job_type='project_sync'
    ).order_by(SyncJob.created_at.desc()).limit(10).all()
    
    # Get project tables configuration
    project_tables = TableConfiguration.query.filter_by(
        sync_enabled=True,
        config_type='project'
    ).all()
    
    # Count pending conflicts
    pending_conflicts = SyncConflict.query.filter_by(
        resolution_status='pending'
    ).count()
    
    # Calculate some statistics
    total_jobs = SyncJob.query.filter_by(job_type='project_sync').count()
    successful_jobs = SyncJob.query.filter_by(job_type='project_sync', status='completed').count()
    failed_jobs = SyncJob.query.filter_by(job_type='project_sync', status='failed').count()
    
    # Calculate success rate
    success_rate = (successful_jobs / total_jobs * 100) if total_jobs > 0 else 0
    
    # Get global settings
    global_settings = GlobalSetting.query.first()
    
    # Current time for calculating "time ago"
    now = datetime.datetime.utcnow()
    
    return render_template(
        'sync/project_sync_dashboard.html',
        recent_jobs=recent_jobs,
        project_tables=project_tables,
        pending_conflicts=pending_conflicts,
        total_jobs=total_jobs,
        successful_jobs=successful_jobs,
        failed_jobs=failed_jobs,
        success_rate=success_rate,
        global_settings=global_settings,
        now=now
    )

@project_sync_bp.route('/jobs')
@login_required
@role_required('administrator')
def job_list():
    """List all project sync jobs."""
    # Get pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Get filter parameters
    status = request.args.get('status')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    # Base query
    query = SyncJob.query.filter_by(job_type='project_sync')
    
    # Apply filters
    if status:
        query = query.filter_by(status=status)
    
    if date_from:
        try:
            from_date = datetime.datetime.strptime(date_from, '%Y-%m-%d')
            query = query.filter(SyncJob.created_at >= from_date)
        except ValueError:
            flash('Invalid date format for "From Date"', 'error')
    
    if date_to:
        try:
            to_date = datetime.datetime.strptime(date_to, '%Y-%m-%d')
            to_date = to_date + datetime.timedelta(days=1)  # Include the entire day
            query = query.filter(SyncJob.created_at <= to_date)
        except ValueError:
            flash('Invalid date format for "To Date"', 'error')
    
    # Execute query with pagination
    jobs_pagination = query.order_by(SyncJob.created_at.desc()).paginate(
        page=page, per_page=per_page
    )
    
    return render_template(
        'sync/project_sync_jobs.html',
        jobs=jobs_pagination.items,
        pagination=jobs_pagination,
        status=status,
        date_from=date_from,
        date_to=date_to
    )

@project_sync_bp.route('/job/<job_id>')
@login_required
@role_required('administrator')
def job_details(job_id):
    """View details of a specific sync job."""
    job = SyncJob.query.filter_by(job_id=job_id).first_or_404()
    
    # Get logs for this job
    logs = SyncLog.query.filter_by(job_id=job_id).order_by(SyncLog.timestamp.asc()).all()
    
    # Get conflicts for this job
    conflicts = SyncConflict.query.filter_by(job_id=job_id).all()
    
    # Check if this job is active
    is_active = job_id in active_syncs and active_syncs[job_id].sync_in_progress
    
    # Get real-time status if available
    status = None
    if is_active:
        status = active_syncs[job_id].get_status()
    
    return render_template(
        'sync/project_sync_job_details.html',
        job=job,
        logs=logs,
        conflicts=conflicts,
        is_active=is_active,
        status=status
    )
    
@project_sync_bp.route('/settings', methods=['GET', 'POST'])
@login_required
@role_required('administrator')
def settings():
    """Configure global settings for project sync."""
    # Get global settings
    global_settings = GlobalSetting.query.first()
    
    if not global_settings:
        global_settings = GlobalSetting()
        db.session.add(global_settings)
        db.session.commit()
    
    if request.method == 'POST':
        # Update settings
        settings_data = {}
        
        # Sync behavior settings
        settings_data['default_conflict_strategy'] = request.form.get('default_conflict_strategy')
        settings_data['default_batch_size'] = request.form.get('default_batch_size', type=int)
        settings_data['schema_validation'] = 'schema_validation' in request.form
        settings_data['auto_migration'] = 'auto_migration' in request.form
        
        # Database connections
        settings_data['default_source_connection'] = request.form.get('default_source_connection')
        settings_data['default_target_connection'] = request.form.get('default_target_connection')
        
        # Notification settings
        settings_data['email_notifications'] = 'email_notifications' in request.form
        settings_data['notification_level'] = request.form.get('notification_level')
        
        # Schedule settings
        settings_data['enable_scheduled_sync'] = 'enable_scheduled_sync' in request.form
        settings_data['schedule_type'] = request.form.get('schedule_type')
        settings_data['schedule_time'] = request.form.get('schedule_time')
        settings_data['scheduled_job_name'] = request.form.get('scheduled_job_name')
        
        if settings_data['schedule_type'] == 'weekly':
            settings_data['schedule_day'] = request.form.get('schedule_day')
        elif settings_data['schedule_type'] == 'monthly':
            settings_data['schedule_date'] = request.form.get('schedule_date')
        
        # Update global settings
        if not global_settings.settings:
            global_settings.settings = {}
        
        # Update project_sync section
        if 'project_sync' not in global_settings.settings:
            global_settings.settings['project_sync'] = {}
            
        global_settings.settings['project_sync'] = settings_data
        db.session.commit()
        
        # If scheduled sync is enabled, configure the scheduler
        if settings_data['enable_scheduled_sync']:
            # Implement scheduler configuration here
            pass
        
        flash('Project sync settings updated successfully', 'success')
        return redirect(url_for('project_sync.settings'))
    
    # Get database connections
    connections = []
    if global_settings.connection_strings:
        for name, conn_str in global_settings.connection_strings.items():
            # Mask password in connection string
            masked_conn = conn_str
            if 'password=' in masked_conn.lower():
                parts = masked_conn.split('password=')
                if ';' in parts[1]:
                    password_part = parts[1].split(';')[0]
                else:
                    password_part = parts[1]
                masked_conn = masked_conn.replace(f'password={password_part}', 'password=*****')
            
            connections.append({
                'name': name,
                'type': 'postgresql',  # Default type, would be determined from the connection string
                'connection_string_masked': masked_conn,
                'connected': True  # This would be determined by testing the connection
            })
    
    # Get settings from global settings
    settings = {}
    if global_settings.settings and 'project_sync' in global_settings.settings:
        settings = global_settings.settings['project_sync']
    
    return render_template(
        'sync/project_sync_settings.html',
        settings=settings,
        connections=connections
    )

@project_sync_bp.route('/add-connection', methods=['POST'])
@login_required
@role_required('administrator')
def add_connection():
    """Add a new database connection."""
    connection_name = request.form.get('connection_name')
    connection_type = request.form.get('connection_type')
    connection_string = request.form.get('connection_string')
    test_connection = 'test_connection' in request.form
    
    if not connection_name or not connection_string:
        flash('Connection name and string are required', 'error')
        return redirect(url_for('project_sync.settings'))
    
    # Get global settings
    global_settings = GlobalSetting.query.first()
    
    if not global_settings:
        global_settings = GlobalSetting()
        db.session.add(global_settings)
        db.session.commit()
    
    # Initialize connection_strings if needed
    if not global_settings.connection_strings:
        global_settings.connection_strings = {}
    
    # Check if connection name already exists
    if connection_name in global_settings.connection_strings:
        flash(f'Connection with name {connection_name} already exists', 'error')
        return redirect(url_for('project_sync.settings'))
    
    # Test connection if requested
    if test_connection:
        # Test connection logic here
        test_successful = True  # Replace with actual test
        
        if not test_successful:
            flash('Connection test failed', 'error')
            return redirect(url_for('project_sync.settings'))
    
    # Add connection
    global_settings.connection_strings[connection_name] = connection_string
    db.session.commit()
    
    flash(f'Connection {connection_name} added successfully', 'success')
    return redirect(url_for('project_sync.settings'))

@project_sync_bp.route('/edit-connection', methods=['POST'])
@login_required
@role_required('administrator')
def edit_connection():
    """Edit an existing database connection."""
    original_name = request.form.get('connection_name_original')
    new_name = request.form.get('connection_name')
    connection_type = request.form.get('connection_type')
    connection_string = request.form.get('connection_string')
    test_connection = 'test_connection' in request.form
    
    if not original_name or not new_name:
        flash('Connection name is required', 'error')
        return redirect(url_for('project_sync.settings'))
    
    # Get global settings
    global_settings = GlobalSetting.query.first()
    
    if not global_settings or not global_settings.connection_strings:
        flash('No connections found', 'error')
        return redirect(url_for('project_sync.settings'))
    
    # Check if original connection exists
    if original_name not in global_settings.connection_strings:
        flash(f'Connection {original_name} not found', 'error')
        return redirect(url_for('project_sync.settings'))
    
    # If changing name, check if new name already exists
    if original_name != new_name and new_name in global_settings.connection_strings:
        flash(f'Connection with name {new_name} already exists', 'error')
        return redirect(url_for('project_sync.settings'))
    
    # Get current connection string
    current_connection_string = global_settings.connection_strings[original_name]
    
    # Update connection string if provided
    if connection_string and not connection_string.startswith('Existing connection string'):
        # Test new connection if requested
        if test_connection:
            # Test connection logic here
            test_successful = True  # Replace with actual test
            
            if not test_successful:
                flash('Connection test failed', 'error')
                return redirect(url_for('project_sync.settings'))
                
        new_connection_string = connection_string
    else:
        new_connection_string = current_connection_string
    
    # Update connection
    if original_name != new_name:
        # Remove old connection and add new one with new name
        global_settings.connection_strings.pop(original_name)
        global_settings.connection_strings[new_name] = new_connection_string
    else:
        # Just update the connection string
        global_settings.connection_strings[original_name] = new_connection_string
    
    db.session.commit()
    
    flash(f'Connection {new_name} updated successfully', 'success')
    return redirect(url_for('project_sync.settings'))

@project_sync_bp.route('/delete-connection', methods=['POST'])
@login_required
@role_required('administrator')
def delete_connection():
    """Delete a database connection."""
    connection_name = request.form.get('connection_name')
    
    if not connection_name:
        flash('Connection name is required', 'error')
        return redirect(url_for('project_sync.settings'))
    
    # Get global settings
    global_settings = GlobalSetting.query.first()
    
    if not global_settings or not global_settings.connection_strings:
        flash('No connections found', 'error')
        return redirect(url_for('project_sync.settings'))
    
    # Check if connection exists
    if connection_name not in global_settings.connection_strings:
        flash(f'Connection {connection_name} not found', 'error')
        return redirect(url_for('project_sync.settings'))
    
    # Remove connection
    global_settings.connection_strings.pop(connection_name)
    db.session.commit()
    
    flash(f'Connection {connection_name} deleted successfully', 'success')
    return redirect(url_for('project_sync.settings'))

@project_sync_bp.route('/tables')
@login_required
@role_required('administrator')
def table_config():
    """Configure tables for project synchronization."""
    # Get all table configurations
    tables = TableConfiguration.query.filter_by(
        config_type='project'
    ).order_by(TableConfiguration.name).all()
    
    return render_template(
        'sync/project_sync_tables.html',
        tables=tables
    )

@project_sync_bp.route('/tables/add', methods=['GET', 'POST'])
@login_required
@role_required('administrator')
def add_table():
    """Add a new table configuration."""
    if request.method == 'POST':
        name = request.form.get('name')
        description = request.form.get('description')
        sync_enabled = 'sync_enabled' in request.form
        
        # Check if table already exists
        existing = TableConfiguration.query.filter_by(name=name).first()
        if existing:
            flash(f'Table configuration for {name} already exists', 'error')
            return redirect(url_for('project_sync.table_config'))
        
        # Create new table configuration
        table = TableConfiguration(
            name=name,
            description=description,
            sync_enabled=sync_enabled,
            config_type='project'
        )
        db.session.add(table)
        db.session.commit()
        
        flash(f'Table configuration for {name} added successfully', 'success')
        return redirect(url_for('project_sync.edit_table', table_id=table.id))
    
    return render_template('sync/project_sync_add_table.html')

@project_sync_bp.route('/tables/edit/<int:table_id>', methods=['GET', 'POST'])
@login_required
@role_required('administrator')
def edit_table(table_id):
    """Edit a table configuration."""
    table = TableConfiguration.query.get_or_404(table_id)
    
    if request.method == 'POST':
        table.name = request.form.get('name')
        table.description = request.form.get('description')
        table.sync_enabled = 'sync_enabled' in request.form
        
        db.session.commit()
        flash(f'Table configuration for {table.name} updated successfully', 'success')
        return redirect(url_for('project_sync.table_config'))
    
    # Get fields for this table
    fields = FieldConfiguration.query.filter_by(
        table_id=table_id
    ).order_by(FieldConfiguration.name).all()
    
    return render_template(
        'sync/project_sync_edit_table.html',
        table=table,
        fields=fields
    )

@project_sync_bp.route('/tables/delete/<int:table_id>', methods=['POST'])
@login_required
@role_required('administrator')
def delete_table(table_id):
    """Delete a table configuration."""
    table = TableConfiguration.query.get_or_404(table_id)
    
    db.session.delete(table)
    db.session.commit()
    
    flash(f'Table configuration for {table.name} deleted successfully', 'success')
    return redirect(url_for('project_sync.table_config'))

@project_sync_bp.route('/fields/add/<int:table_id>', methods=['POST'])
@login_required
@role_required('administrator')
def add_field(table_id):
    """Add a field configuration to a table."""
    table = TableConfiguration.query.get_or_404(table_id)
    
    name = request.form.get('name')
    description = request.form.get('description')
    sync_enabled = 'sync_enabled' in request.form
    is_pk = 'is_pk' in request.form
    
    # Check if field already exists
    existing = FieldConfiguration.query.filter_by(
        table_id=table_id, name=name
    ).first()
    
    if existing:
        flash(f'Field {name} already exists for table {table.name}', 'error')
    else:
        field = FieldConfiguration(
            table_id=table_id,
            name=name,
            description=description,
            sync_enabled=sync_enabled,
            is_primary_key=is_pk
        )
        db.session.add(field)
        db.session.commit()
        
        flash(f'Field {name} added successfully to table {table.name}', 'success')
    
    return redirect(url_for('project_sync.edit_table', table_id=table_id))

@project_sync_bp.route('/fields/delete/<int:field_id>', methods=['POST'])
@login_required
@role_required('administrator')
def delete_field(field_id):
    """Delete a field configuration."""
    field = FieldConfiguration.query.get_or_404(field_id)
    table_id = field.table_id
    
    db.session.delete(field)
    db.session.commit()
    
    flash(f'Field {field.name} deleted successfully', 'success')
    return redirect(url_for('project_sync.edit_table', table_id=table_id))

@project_sync_bp.route('/conflicts')
@login_required
@role_required('administrator')
def conflict_list():
    """List all sync conflicts."""
    # Get pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Get filter parameters
    status = request.args.get('status', 'pending')
    table_name = request.args.get('table_name')
    
    # Base query
    query = SyncConflict.query
    
    # Apply filters
    if status:
        query = query.filter_by(resolution_status=status)
    
    if table_name:
        query = query.filter_by(table_name=table_name)
    
    # Execute query with pagination
    conflicts_pagination = query.order_by(SyncConflict.created_at.desc()).paginate(
        page=page, per_page=per_page
    )
    
    # Get unique table names for the filter dropdown
    table_names = db.session.query(SyncConflict.table_name).distinct().all()
    table_names = [t[0] for t in table_names]
    
    return render_template(
        'sync/project_sync_conflicts.html',
        conflicts=conflicts_pagination.items,
        pagination=conflicts_pagination,
        status=status,
        table_name=table_name,
        table_names=table_names
    )

@project_sync_bp.route('/conflicts/<int:conflict_id>', methods=['GET', 'POST'])
@login_required
@role_required('administrator')
def resolve_conflict(conflict_id):
    """View and resolve a specific conflict."""
    conflict = SyncConflict.query.get_or_404(conflict_id)
    
    if request.method == 'POST':
        resolution_type = request.form.get('resolution_type')
        resolution_notes = request.form.get('resolution_notes')
        
        if resolution_type == 'source_wins':
            resolved_data = conflict.source_data
        elif resolution_type == 'target_wins':
            resolved_data = conflict.target_data
        elif resolution_type == 'ignore':
            # Just ignore the conflict
            conflict.resolution_status = 'ignored'
            conflict.resolution_type = 'ignored'
            conflict.resolved_by = session.get('user_id')
            conflict.resolved_at = datetime.datetime.utcnow()
            conflict.resolution_notes = resolution_notes
            
            db.session.commit()
            flash('Conflict ignored successfully', 'success')
            return redirect(url_for('project_sync.conflict_list'))
        elif resolution_type == 'manual':
            # For manual resolution, the form will include all field values
            resolved_data = {}
            for key in list(conflict.source_data.keys()) + list(conflict.target_data.keys()):
                field_source = request.form.get(f'field_{key}')
                if field_source == 'source' and key in conflict.source_data:
                    resolved_data[key] = conflict.source_data[key]
                elif field_source == 'target' and key in conflict.target_data:
                    resolved_data[key] = conflict.target_data[key]
                elif field_source == 'custom':
                    custom_value = request.form.get(f'custom_{key}')
                    if custom_value:
                        resolved_data[key] = custom_value
        else:
            flash('Invalid resolution type', 'error')
            return redirect(url_for('project_sync.resolve_conflict', conflict_id=conflict_id))
        
        # Update the conflict
        conflict.resolution_status = 'resolved'
        conflict.resolution_type = resolution_type
        conflict.resolved_by = session.get('user_id')
        conflict.resolved_at = datetime.datetime.utcnow()
        conflict.resolution_notes = resolution_notes
        conflict.resolved_data = resolved_data
        
        db.session.commit()
        
        # Apply the resolved data to the target database if needed
        if resolution_type != 'target_wins' and resolution_type != 'ignored':
            try:
                # Get the global settings to find the connection
                global_settings = GlobalSetting.query.first()
                
                if global_settings and global_settings.settings and 'project_sync' in global_settings.settings:
                    settings = global_settings.settings['project_sync']
                    target_conn_name = settings.get('default_target_connection')
                    
                    if target_conn_name and global_settings.connection_strings and target_conn_name in global_settings.connection_strings:
                        target_conn_string = global_settings.connection_strings[target_conn_name]
                        
                        # Use the sync service to apply the changes with proper data type handling
                        job_id = None
                        
                        # Check if this conflict is part of a job
                        if conflict.job_id:
                            job_id = conflict.job_id
                            
                        # Create a sync service with the target connection
                        sync_service = DatabaseProjectSyncService(
                            source_connection_string=target_conn_string,  # Source doesn't matter for conflict resolution
                            target_connection_string=target_conn_string,
                            job_id=job_id
                        )
                        
                        # Map the resolution type to the expected format
                        if resolution_type == 'source_select':
                            resolution_strategy = 'source'
                        elif resolution_type == 'target_select':
                            resolution_strategy = 'target'
                        elif resolution_type == 'manual':
                            resolution_strategy = 'custom'
                        else:
                            resolution_strategy = resolution_type
                            
                        # Use the new method to handle conflict resolution with data type awareness
                        success = sync_service.resolve_manual_conflict(
                            conflict_id=conflict.id,
                            resolution=resolution_strategy,
                            custom_values=resolved_data if resolution_strategy == 'custom' else None
                        )
                        
                        if not success:
                            logger.warning(f"Conflict {conflict.id} marked as resolved but database update failed")
                
            except Exception as e:
                logger.error(f"Error in database update after conflict resolution: {str(e)}")
                # We don't want to fail the resolution if the database update fails
                # The conflict is marked as resolved in our system
        
        flash('Conflict resolved successfully', 'success')
        return redirect(url_for('project_sync.conflict_list'))
    
    return render_template(
        'sync/project_sync_resolve_conflict.html',
        conflict=conflict
    )
    
@project_sync_bp.route('/bulk-resolve-conflicts', methods=['POST'])
@login_required
@role_required('administrator')
def bulk_resolve_conflicts():
    """Resolve multiple conflicts in bulk, using data type handlers for proper data processing."""
    resolution_type = request.form.get('resolution_type')
    resolution_notes = request.form.get('resolution_notes')
    
    if not resolution_type:
        flash('Resolution strategy is required', 'error')
        return redirect(url_for('project_sync.conflict_list'))
        
    # Get pending conflicts
    conflicts = SyncConflict.query.filter_by(resolution_status='pending').all()
    
    if not conflicts:
        flash('No pending conflicts found', 'info')
        return redirect(url_for('project_sync.conflict_list'))
    
    # Get the global settings to find the database connections
    global_settings = GlobalSetting.query.first()
    target_conn_string = None
    
    if global_settings and global_settings.settings and 'project_sync' in global_settings.settings:
        settings = global_settings.settings['project_sync']
        target_conn_name = settings.get('default_target_connection')
        
        if target_conn_name and global_settings.connection_strings and target_conn_name in global_settings.connection_strings:
            target_conn_string = global_settings.connection_strings[target_conn_name]
    
    # If we can't get connection string, just update the conflict records without applying to DB
    if not target_conn_string:
        logger.warning("No target connection string found, conflicts will be marked as resolved but not applied to database")
        
    count = 0
    
    # Process each conflict
    for conflict in conflicts:
        # Determine appropriate resolution strategy
        if resolution_type == 'source_wins':
            db_resolution_strategy = 'source'
            resolved_data = conflict.source_data
        elif resolution_type == 'target_wins':
            db_resolution_strategy = 'target'
            resolved_data = conflict.target_data
        elif resolution_type == 'newer_wins':
            # Compare timestamps if available
            source_time = None
            target_time = None
            
            for field in ['modified_at', 'updated_at', 'last_modified']:
                if field in conflict.source_data and field in conflict.target_data:
                    source_time = conflict.source_data[field]
                    target_time = conflict.target_data[field]
                    break
                    
            if source_time and target_time:
                if source_time > target_time:
                    db_resolution_strategy = 'source'
                    resolved_data = conflict.source_data
                else:
                    db_resolution_strategy = 'target'
                    resolved_data = conflict.target_data
            else:
                # Default to source if no timestamps
                db_resolution_strategy = 'source'
                resolved_data = conflict.source_data
        elif resolution_type == 'ignore':
            # Just mark as ignored
            conflict.resolution_status = 'ignored'
            conflict.resolution_type = 'ignored'
            conflict.resolved_by = session.get('user_id')
            conflict.resolved_at = datetime.datetime.utcnow()
            conflict.resolution_notes = resolution_notes
            count += 1
            continue
        else:
            # Skip this conflict if resolution type not supported in bulk
            continue
            
        # Update the conflict record in our database
        conflict.resolution_status = 'resolved'
        conflict.resolution_type = resolution_type
        conflict.resolved_by = session.get('user_id')
        conflict.resolved_at = datetime.datetime.utcnow()
        conflict.resolution_notes = resolution_notes
        conflict.resolved_data = resolved_data
        
        # Try to apply the resolution to the target database if we have connection
        if target_conn_string:
            try:
                # Create sync service
                sync_service = DatabaseProjectSyncService(
                    source_connection_string=target_conn_string,  # Source doesn't matter for conflict resolution
                    target_connection_string=target_conn_string,
                    job_id=conflict.job_id  # Use the original job ID if available
                )
                
                # Use the data type-aware conflict resolution method
                sync_service.resolve_manual_conflict(
                    conflict_id=conflict.id,
                    resolution=db_resolution_strategy,
                    custom_values=None  # We don't support custom values in bulk resolution
                )
            except Exception as e:
                logger.error(f"Error applying bulk resolution for conflict {conflict.id}: {str(e)}")
                # We continue processing other conflicts even if one fails
        
        count += 1
        
    # Commit all conflict record updates
    db.session.commit()
    
    flash(f'Successfully resolved {count} conflicts', 'success')
    return redirect(url_for('project_sync.conflict_list'))

@project_sync_bp.route('/run', methods=['GET', 'POST'])
@login_required
@role_required('administrator')
def run_sync():
    """Run a new project sync job."""
    if request.method == 'POST':
        source_connection = request.form.get('source_connection')
        target_connection = request.form.get('target_connection')
        conflict_strategy = request.form.get('conflict_strategy', 'source_wins')
        schema_validation = 'schema_validation' in request.form
        auto_migration = 'auto_migration' in request.form
        batch_size = int(request.form.get('batch_size', 1000))
        
        # Create and start the sync service
        sync_service = DatabaseProjectSyncService(
            source_connection_string=source_connection,
            target_connection_string=target_connection,
            user_id=session.get('user_id'),
            conflict_strategy=conflict_strategy,
            schema_validation=schema_validation,
            auto_migration=auto_migration,
            batch_size=batch_size
        )
        
        job_id = sync_service.start_sync(async_mode=True)
        
        # Store the sync service in active_syncs
        active_syncs[job_id] = sync_service
        
        flash(f'Project sync job started. Job ID: {job_id}', 'success')
        return redirect(url_for('project_sync.job_details', job_id=job_id))
    
    # Get available connections from global settings
    connections = []
    global_settings = GlobalSetting.query.first()
    
    if global_settings and global_settings.connection_strings:
        for name, conn in global_settings.connection_strings.items():
            # Mask password in connection string for display
            masked_conn = conn
            if 'password=' in masked_conn.lower():
                parts = masked_conn.split('password=')
                password_part = parts[1].split(';')[0] if ';' in parts[1] else parts[1]
                masked_conn = masked_conn.replace(f'password={password_part}', 'password=*****')
            
            connections.append({
                'name': name,
                'connection_string': masked_conn
            })
    
    return render_template(
        'sync/project_sync_run.html',
        connections=connections
    )

@project_sync_bp.route('/status/<job_id>')
@login_required
def job_status(job_id):
    """Get the current status of a sync job."""
    if job_id in active_syncs:
        return jsonify(active_syncs[job_id].get_status())
    
    # If not in active_syncs, return job info from database
    job = SyncJob.query.filter_by(job_id=job_id).first()
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Return basic job info
    return jsonify({
        'job_id': job.job_id,
        'status': job.status,
        'progress': {
            'records': {
                'total': job.total_records,
                'processed': job.processed_records,
                'errors': job.error_records
            }
        },
        'timing': {
            'start': job.start_time.isoformat() if job.start_time else None,
            'end': job.end_time.isoformat() if job.end_time else None,
            'duration': job.duration_seconds
        }
    })

@project_sync_bp.route('/cancel/<job_id>', methods=['POST'])
@login_required
@role_required('administrator')
def cancel_job(job_id):
    """Cancel a running sync job."""
    # Implementation would depend on how we handle cancellation
    # For now, we'll just mark the job as cancelled in the database
    
    job = SyncJob.query.filter_by(job_id=job_id).first()
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    if job.status in ['pending', 'running']:
        job.status = 'cancelled'
        job.end_time = datetime.datetime.utcnow()
        
        if job.start_time:
            job.duration_seconds = int((job.end_time - job.start_time).total_seconds())
        
        db.session.commit()
        
        # If job is in active_syncs, we would need to signal the thread to stop
        # For now, just remove it from active_syncs
        if job_id in active_syncs:
            active_syncs.pop(job_id, None)
        
        flash(f'Job {job_id} has been cancelled', 'success')
    else:
        flash(f'Cannot cancel job {job_id} with status {job.status}', 'error')
    
    return redirect(url_for('project_sync.job_details', job_id=job_id))

# API endpoints for programmatic access

@project_sync_bp.route('/api/start-sync', methods=['POST'])
@login_required
@role_required('administrator')
def api_start_sync():
    """Start a project sync job via API."""
    data = request.get_json()
    
    source_connection = data.get('source_connection')
    target_connection = data.get('target_connection')
    conflict_strategy = data.get('conflict_strategy', 'source_wins')
    schema_validation = data.get('schema_validation', True)
    auto_migration = data.get('auto_migration', True)
    batch_size = int(data.get('batch_size', 1000))
    
    if not source_connection or not target_connection:
        return jsonify({
            'error': 'Source and target connection strings are required'
        }), 400
    
    # Create and start the sync service
    sync_service = DatabaseProjectSyncService(
        source_connection_string=source_connection,
        target_connection_string=target_connection,
        user_id=session.get('user_id'),
        conflict_strategy=conflict_strategy,
        schema_validation=schema_validation,
        auto_migration=auto_migration,
        batch_size=batch_size
    )
    
    job_id = sync_service.start_sync(async_mode=True)
    
    # Store the sync service in active_syncs
    active_syncs[job_id] = sync_service
    
    return jsonify({
        'job_id': job_id,
        'status': 'started',
        'message': "Project sync job started successfully."
    })

@project_sync_bp.route('/api/status/<job_id>')
@login_required
def api_job_status(job_id):
    """Get the current status of a sync job via API."""
    return job_status(job_id)

@project_sync_bp.route('/api/jobs')
@login_required
def api_jobs():
    """Get list of sync jobs via API."""
    # Get filter parameters
    status = request.args.get('status')
    limit = request.args.get('limit', 10, type=int)
    
    # Base query
    query = SyncJob.query.filter_by(job_type='project_sync')
    
    # Apply filters
    if status:
        query = query.filter_by(status=status)
    
    # Execute query
    jobs = query.order_by(SyncJob.created_at.desc()).limit(limit).all()
    
    # Convert to dictionary
    result = []
    for job in jobs:
        result.append({
            'job_id': job.job_id,
            'name': job.name,
            'status': job.status,
            'created_at': job.created_at.isoformat(),
            'start_time': job.start_time.isoformat() if job.start_time else None,
            'end_time': job.end_time.isoformat() if job.end_time else None,
            'duration_seconds': job.duration_seconds,
            'total_records': job.total_records,
            'processed_records': job.processed_records,
            'error_records': job.error_records
        })
    
    return jsonify(result)

@project_sync_bp.route('/api/conflicts')
@login_required
def api_conflicts():
    """Get list of conflicts via API."""
    # Get filter parameters
    status = request.args.get('status', 'pending')
    table_name = request.args.get('table_name')
    limit = request.args.get('limit', 10, type=int)
    
    # Base query
    query = SyncConflict.query
    
    # Apply filters
    if status:
        query = query.filter_by(resolution_status=status)
    
    if table_name:
        query = query.filter_by(table_name=table_name)
    
    # Execute query
    conflicts = query.order_by(SyncConflict.created_at.desc()).limit(limit).all()
    
    # Convert to dictionary
    result = []
    for conflict in conflicts:
        result.append({
            'id': conflict.id,
            'job_id': conflict.job_id,
            'table_name': conflict.table_name,
            'record_id': conflict.record_id,
            'resolution_status': conflict.resolution_status,
            'created_at': conflict.created_at.isoformat()
        })
    
    return jsonify(result)

@project_sync_bp.route('/api/tables')
@login_required
def api_tables():
    """Get list of table configurations via API."""
    tables = TableConfiguration.query.filter_by(
        config_type='project'
    ).order_by(TableConfiguration.name).all()
    
    result = []
    for table in tables:
        result.append({
            'id': table.id,
            'name': table.name,
            'description': table.description,
            'sync_enabled': table.sync_enabled
        })
    
    return jsonify(result)

def register_project_sync_blueprint(app):
    """Register the project sync blueprint with the Flask app."""
    # Import built-in modules
    import threading
    import logging
    
    # Create logger
    logger = logging.getLogger(__name__)
    
    # Register routes
    app.register_blueprint(project_sync_bp)
    
    # Initialize the project sync scheduler in a delayed thread
    # to ensure the database is fully initialized
    def init_project_sync_scheduler():
        try:
            # Import our scheduler module
            from .scheduler import initialize_scheduler
            
            # Only initialize scheduler in production/development, not in testing
            if not app.config.get('TESTING', False):
                initialize_scheduler(app)
                logger.info("Project sync scheduler initialized")
        except Exception as e:
            logger.error(f"Error initializing project sync scheduler: {str(e)}")
    
    # Start initialization in a separate thread after a short delay
    # to ensure the database is fully initialized
    thread = threading.Timer(5.0, init_project_sync_scheduler)
    thread.daemon = True
    thread.start()
    
    logger.info("Project sync blueprint registered")
    return True