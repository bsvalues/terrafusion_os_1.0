"""
Routes for the Sync Service module.

These routes provide API endpoints for configuring, controlling, and monitoring
the synchronization process.
"""
import datetime
import json
from flask import render_template, request, jsonify, session, flash, redirect, url_for
from app import db
from sync_service.models import (
    SyncJob, TableConfiguration, FieldConfiguration, SyncLog, GlobalSetting,
    FieldSanitizationRule, NotificationConfig
)
from sync_service.data_sanitization import SanitizationLog, DataSanitizer
from sync_service.notification_system import SyncNotificationManager, SyncNotificationLog
from sync_service.sync_engine import SyncEngine
from sync_service.bidirectional_sync import DataSynchronizer
from sync_service.scheduler import SyncSchedule
from auth import login_required, permission_required, role_required, is_authenticated

def register_sync_routes(bp):
    """Register routes with the provided blueprint."""
    
    # Status dashboard
    @bp.route('/')
    @login_required
    def index():
        """Sync service dashboard."""
        # Get recent jobs
        recent_jobs = SyncJob.query.order_by(SyncJob.created_at.desc()).limit(10).all()
        
        # Get global settings
        global_settings = GlobalSetting.query.first()
        
        # Get table configurations
        tables = TableConfiguration.query.order_by(TableConfiguration.order).all()
        
        return render_template('sync/index.html', 
                              recent_jobs=recent_jobs, 
                              global_settings=global_settings,
                              tables=tables)

    # Job management
    @bp.route('/jobs')
    @login_required
    def jobs():
        """List sync jobs."""
        jobs = SyncJob.query.order_by(SyncJob.created_at.desc()).all()
        return render_template('sync/jobs.html', jobs=jobs)

    @bp.route('/jobs/<job_id>')
    @login_required
    def job_details(job_id):
        """Show details for a specific job."""
        job = SyncJob.query.filter_by(job_id=job_id).first_or_404()
        logs = SyncLog.query.filter_by(job_id=job_id).order_by(SyncLog.created_at.desc()).limit(100).all()
        
        return render_template('sync/job_details.html', job=job, logs=logs)

    @bp.route('/jobs/<job_id>/logs')
    @login_required
    def job_logs(job_id):
        """Show logs for a specific job."""
        job = SyncJob.query.filter_by(job_id=job_id).first_or_404()
        level = request.args.get('level', None)
        limit = request.args.get('limit', 100, type=int)
        
        logs = DataSynchronizer.get_job_logs(job_id, level, limit)
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify(logs)
        
        return render_template('sync/job_logs.html', job=job, logs=logs)

    # Configuration management
    @bp.route('/config')
    @login_required
    @role_required('administrator')
    def configuration():
        """Manage sync configuration."""
        tables = TableConfiguration.query.order_by(TableConfiguration.order).all()
        return render_template('sync/config.html', tables=tables)

    @bp.route('/config/tables')
    @login_required
    @role_required('administrator')
    def table_configurations():
        """List table configurations."""
        tables = TableConfiguration.query.order_by(TableConfiguration.order).all()
        return render_template('sync/table_configurations.html', tables=tables)

    @bp.route('/config/tables/<table_name>')
    @login_required
    @role_required('administrator')
    def table_details(table_name):
        """Show details for a specific table configuration."""
        table = TableConfiguration.query.filter_by(name=table_name).first_or_404()
        fields = FieldConfiguration.query.filter_by(table_name=table_name).all()
        
        return render_template('sync/table_details.html', table=table, fields=fields)

    # API endpoints
    @bp.route('/api/start-sync', methods=['POST'])
    @login_required
    @role_required('administrator')
    def api_start_sync():
        """Start a sync job."""
        sync_type = request.json.get('type', 'incremental')
        user_id = session['user']['id']
        
        if sync_type == 'full':
            job_id = DataSynchronizer.start_full_sync(user_id)
        else:
            job_id = DataSynchronizer.start_incremental_sync(user_id)
        
        return jsonify({
            'job_id': job_id,
            'status': 'started',
            'message': f"{sync_type.capitalize()} sync job started successfully."
        })

    @bp.route('/api/job-status/<job_id>')
    @login_required
    def api_job_status(job_id):
        """Get status for a specific job."""
        status = DataSynchronizer.get_job_status(job_id)
        return jsonify(status)

    @bp.route('/api/job-logs/<job_id>')
    @login_required
    def api_job_logs(job_id):
        """Get logs for a specific job."""
        level = request.args.get('level', None)
        limit = request.args.get('limit', 100, type=int)
        
        logs = DataSynchronizer.get_job_logs(job_id, level, limit)
        return jsonify(logs)

    # Manual actions
    @bp.route('/run/incremental')
    @login_required
    @role_required('administrator')
    def run_incremental_sync():
        """Run an incremental sync job."""
        job_id = DataSynchronizer.start_incremental_sync(session['user']['id'])
        flash(f'Incremental sync job started. Job ID: {job_id}', 'success')
        return redirect(url_for('sync.job_details', job_id=job_id))

    @bp.route('/run/full')
    @login_required
    @role_required('administrator')
    def run_full_sync():
        """Run a full sync job."""
        job_id = DataSynchronizer.start_full_sync(session['user']['id'])
        flash(f'Full sync job started. Job ID: {job_id}', 'success')
        return redirect(url_for('sync.job_details', job_id=job_id))

    # Property Export Routes
    @bp.route('/property-export')
    @login_required
    @role_required('administrator')
    def property_export():
        """Property export form."""
        recent_jobs = SyncJob.query.filter_by(job_type='property_export').order_by(SyncJob.created_at.desc()).limit(5).all()
        return render_template('sync/property_export.html', recent_jobs=recent_jobs)

    @bp.route('/run/property-export', methods=['POST'])
    @login_required
    @role_required('administrator')
    def run_property_export():
        """Run a property export job."""
        database_name = request.form.get('database_name', '')
        num_years = int(request.form.get('num_years', -1))
        min_bill_years = int(request.form.get('min_bill_years', 2))
        
        job_id = DataSynchronizer.start_property_export(
            session['user']['id'], 
            database_name, 
            num_years, 
            min_bill_years
        )
        
        flash(f'Property export job started. Job ID: {job_id}', 'success')
        return redirect(url_for('sync.job_details', job_id=job_id))

    @bp.route('/api/start-property-export', methods=['POST'])
    @login_required
    @role_required('administrator')
    def api_start_property_export():
        """Start a property export job via API."""
        database_name = request.json.get('database_name', '')
        num_years = request.json.get('num_years', -1)
        min_bill_years = request.json.get('min_bill_years', 2)
        user_id = session['user']['id']
        
        job_id = DataSynchronizer.start_property_export(
            user_id,
            database_name,
            num_years,
            min_bill_years
        )
        
        return jsonify({
            'job_id': job_id,
            'status': 'started',
            'message': f"Property export job started successfully."
        })
        
    # New bi-directional sync routes
    @bp.route('/bidirectional-sync')
    @login_required
    @role_required('administrator')
    def bidirectional_sync():
        """Bi-directional sync dashboard."""
        # Get recent bidirectional sync jobs
        recent_jobs = SyncJob.query.filter(
            SyncJob.job_type.in_(['up_sync', 'down_sync'])
        ).order_by(SyncJob.created_at.desc()).limit(10).all()
        
        # Get global settings
        global_settings = GlobalSetting.query.first()
        
        # Get current time for calculating "hours ago"
        now = datetime.datetime.utcnow()
        
        return render_template('sync/bidirectional_sync.html', 
                              recent_jobs=recent_jobs,
                              global_settings=global_settings,
                              now=now)
        
    @bp.route('/run/up-sync')
    @login_required
    @role_required('administrator')
    def run_up_sync():
        """Run an up-sync job (training to production)."""
        job_id = DataSynchronizer.start_up_sync(session['user']['id'])
        flash(f'Up-sync job started. Job ID: {job_id}', 'success')
        return redirect(url_for('sync.job_details', job_id=job_id))
        
    @bp.route('/run/down-sync')
    @login_required
    @role_required('administrator')
    def run_down_sync():
        """Run a down-sync job (production to training)."""
        job_id = DataSynchronizer.start_down_sync(session['user']['id'])
        flash(f'Down-sync job started. Job ID: {job_id}', 'success')
        return redirect(url_for('sync.job_details', job_id=job_id))
        
    @bp.route('/api/start-up-sync', methods=['POST'])
    @login_required
    @role_required('administrator')
    def api_start_up_sync():
        """Start an up-sync job via API."""
        user_id = session['user']['id']
        job_id = DataSynchronizer.start_up_sync(user_id)
        
        return jsonify({
            'job_id': job_id,
            'status': 'started',
            'message': "Up-sync job started successfully."
        })
        
    @bp.route('/api/start-down-sync', methods=['POST'])
    @login_required
    @role_required('administrator')
    def api_start_down_sync():
        """Start a down-sync job via API."""
        user_id = session['user']['id']
        job_id = DataSynchronizer.start_down_sync(user_id)
        
        return jsonify({
            'job_id': job_id,
            'status': 'started',
            'message': "Down-sync job started successfully."
        })
        
    @bp.route('/api/pending-changes-count')
    @login_required
    @role_required('administrator')
    def api_pending_changes_count():
        """Get the count of pending changes for up-sync."""
        from sync_service.bidirectional_sync import DataSynchronizer
        count = DataSynchronizer.get_pending_changes_count()
        
        return jsonify({
            'count': count,
            'message': f"{count} pending change{'s' if count != 1 else ''} found"
        })
        
    # Scheduler management routes
    @bp.route('/schedules')
    @login_required
    @role_required('administrator')
    def schedules():
        """List all sync schedules."""
        from sync_service.scheduler import get_job_next_run
        
        # Get all schedules
        schedules = SyncSchedule.query.order_by(SyncSchedule.created_at.desc()).all()
        
        # Add next run time to each schedule
        for schedule in schedules:
            if schedule.job_id:
                schedule.next_run = get_job_next_run(schedule.job_id)
            else:
                schedule.next_run = None
                
        return render_template('sync/schedules.html', schedules=schedules)
    
    @bp.route('/schedules/add', methods=['POST'])
    @login_required
    @role_required('administrator')
    def add_schedule():
        """Add a new sync schedule."""
        from sync_service.scheduler import add_job_from_schedule
        
        try:
            # Create new schedule from form data
            schedule = SyncSchedule(
                name=request.form.get('name'),
                description=request.form.get('description'),
                job_type=request.form.get('job_type'),
                schedule_type=request.form.get('schedule_type'),
                created_by=session['user']['id']
            )
            
            # Set schedule details based on type
            if schedule.schedule_type == 'cron':
                schedule.cron_expression = request.form.get('cron_expression')
            else:  # interval
                schedule.interval_hours = int(request.form.get('interval_hours', 24))
            
            # For property export, add additional parameters
            if schedule.job_type == 'property_export':
                schedule.parameters = {
                    'database_name': request.form.get('database_name', 'web_internet_benton'),
                    'num_years': request.form.get('num_years', -1),
                    'min_bill_years': request.form.get('min_bill_years', 2)
                }
            
            # Save to database
            db.session.add(schedule)
            db.session.commit()
            
            # Add to scheduler
            if add_job_from_schedule(schedule):
                flash(f"Schedule '{schedule.name}' created successfully.", 'success')
            else:
                flash(f"Schedule saved but could not be activated.", 'warning')
                
            return redirect(url_for('sync.schedules'))
            
        except Exception as e:
            db.session.rollback()
            flash(f"Error creating schedule: {str(e)}", 'danger')
            return redirect(url_for('sync.schedules'))
    
    @bp.route('/schedules/<int:schedule_id>/edit', methods=['GET', 'POST'])
    @login_required
    @role_required('administrator')
    def edit_schedule(schedule_id):
        """Edit an existing sync schedule."""
        from sync_service.scheduler import update_job_schedule
        
        schedule = SyncSchedule.query.get_or_404(schedule_id)
        
        if request.method == 'POST':
            try:
                # Update schedule from form data
                schedule.name = request.form.get('name')
                schedule.description = request.form.get('description')
                schedule.job_type = request.form.get('job_type')
                schedule.schedule_type = request.form.get('schedule_type')
                
                # Set schedule details based on type
                if schedule.schedule_type == 'cron':
                    schedule.cron_expression = request.form.get('cron_expression')
                    schedule.interval_hours = None
                else:  # interval
                    schedule.interval_hours = int(request.form.get('interval_hours', 24))
                    schedule.cron_expression = None
                
                # For property export, add additional parameters
                if schedule.job_type == 'property_export':
                    schedule.parameters = {
                        'database_name': request.form.get('database_name', 'web_internet_benton'),
                        'num_years': request.form.get('num_years', -1),
                        'min_bill_years': request.form.get('min_bill_years', 2)
                    }
                else:
                    schedule.parameters = {}
                
                # Update last_updated timestamp
                schedule.last_updated = datetime.datetime.utcnow()
                
                # Save to database
                db.session.commit()
                
                # Update in scheduler
                if update_job_schedule(schedule):
                    flash(f"Schedule '{schedule.name}' updated successfully.", 'success')
                else:
                    flash(f"Schedule saved but could not be updated in the scheduler.", 'warning')
                    
                return redirect(url_for('sync.schedules'))
                
            except Exception as e:
                db.session.rollback()
                
    # Data Sanitization routes
    @bp.route('/data-sanitization')
    @login_required
    @role_required('administrator')
    def data_sanitization():
        """Configure and monitor data sanitization."""
        # Get all sanitization rules
        rules = FieldSanitizationRule.query.order_by(FieldSanitizationRule.table_name, FieldSanitizationRule.field_name).all()
        
        # Get tables for configuration
        tables = TableConfiguration.query.order_by(TableConfiguration.name).all()
        
        # Get recent sanitization logs
        logs = SanitizationLog.query.order_by(SanitizationLog.created_at.desc()).limit(50).all()
        
        return render_template('sync/data_sanitization_config.html', 
                              table_sanitization_rules=rules,
                              tables=tables,
                              sanitization_logs=logs)
    
    @bp.route('/get_table_fields/<table_name>')
    @login_required
    @role_required('administrator')
    def get_table_fields(table_name):
        """Get fields for a specific table."""
        fields = FieldConfiguration.query.filter_by(table_name=table_name).all()
        field_list = [{'name': field.name, 'type': field.data_type or field.type} for field in fields]
        
        return jsonify({'fields': field_list})
    
    @bp.route('/add_sanitization_rule', methods=['POST'])
    @login_required
    @role_required('administrator')
    def add_sanitization_rule():
        """Add a new sanitization rule."""
        try:
            # Create a new rule
            rule = FieldSanitizationRule()
            rule.table_name = request.form.get('table_name')
            rule.field_name = request.form.get('field_name')
            rule.field_type = request.form.get('field_type')
            rule.strategy = request.form.get('strategy')
            rule.description = request.form.get('description')
            rule.is_active = True
            rule.created_by = session['user']['id'] if is_authenticated() else None
            rule.created_at = datetime.datetime.utcnow()
            rule.updated_at = datetime.datetime.utcnow()
            
            # Add and commit to database
            db.session.add(rule)
            db.session.commit()
            
            flash(f"Sanitization rule for {rule.table_name}.{rule.field_name} added successfully.", 'success')
            return redirect(url_for('sync.data_sanitization'))
            
        except Exception as e:
            db.session.rollback()
            flash(f"Error adding sanitization rule: {str(e)}", 'danger')
            return redirect(url_for('sync.data_sanitization'))
    
    @bp.route('/delete_sanitization_rule/<int:rule_id>', methods=['POST'])
    @login_required
    @role_required('administrator')
    def delete_sanitization_rule(rule_id):
        """Delete a sanitization rule."""
        try:
            rule = FieldSanitizationRule.query.get_or_404(rule_id)
            db.session.delete(rule)
            db.session.commit()
            
            return jsonify({'success': True})
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': str(e)})
    
    @bp.route('/sanitization_logs')
    @login_required
    @role_required('administrator')
    def get_sanitization_logs():
        """Get recent sanitization logs as JSON."""
        logs = SanitizationLog.query.order_by(SanitizationLog.created_at.desc()).limit(50).all()
        
        log_list = [{
            'id': log.id,
            'job_id': log.job_id,
            'table_name': log.table_name,
            'field_name': log.field_name,
            'record_id': log.record_id,
            'sanitization_type': log.sanitization_type,
            'was_modified': log.was_modified,
            'created_at': log.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for log in logs]
        
        return jsonify({'logs': log_list})
    
    # Notification Configuration routes
    @bp.route('/notification-config')
    @login_required
    @role_required('administrator')
    def notification_config():
        """Configure notification settings."""
        # Get email configuration
        email_config = NotificationConfig.query.filter_by(channel_type='email').first()
        
        # Get slack configuration
        slack_config = NotificationConfig.query.filter_by(channel_type='slack').first()
        
        # Get notification routing configuration
        routing_config = {}
        for severity in ['info', 'warning', 'error', 'critical']:
            routing_config[severity] = []
            for channel in ['email', 'slack', 'sms']:
                channel_config = NotificationConfig.query.filter_by(channel_type=channel).first()
                if channel_config and channel_config.enabled:
                    # Check if this channel is enabled for this severity
                    channel_config_json = channel_config.config or {}
                    severity_routes = channel_config_json.get('severity_routes', {})
                    if severity_routes.get(severity, False):
                        routing_config[severity].append(channel)
        
        # Get recent notification logs
        notification_logs = SyncNotificationLog.query.order_by(SyncNotificationLog.created_at.desc()).limit(50).all()
        
        return render_template('sync/notification_config.html',
                              email_config=email_config.config if email_config else None,
                              slack_config=slack_config.config if slack_config else None,
                              routing_config=routing_config,
                              notification_logs=notification_logs)
    
    @bp.route('/configure_email_notifications', methods=['POST'])
    @login_required
    @role_required('administrator')
    def configure_email_notifications():
        """Configure email notification settings."""
        try:
            # Get or create email configuration
            email_config = NotificationConfig.query.filter_by(channel_type='email').first()
            if not email_config:
                email_config = NotificationConfig()
                email_config.channel_type = 'email'
                email_config.enabled = False
                email_config.config = {}
                email_config.created_at = datetime.datetime.utcnow()
                email_config.updated_at = datetime.datetime.utcnow()
                email_config.updated_by = session['user']['id'] if is_authenticated() else None
                db.session.add(email_config)
            
            # Update configuration
            email_config.enabled = 'email_enabled' in request.form
            
            # Build config dictionary
            config = {
                'smtp_server': request.form.get('smtp_server', ''),
                'smtp_port': request.form.get('smtp_port', '587'),
                'smtp_security': request.form.get('smtp_security', 'tls'),
                'smtp_username': request.form.get('smtp_username', ''),
                'from_address': request.form.get('from_address', ''),
                'default_recipients': request.form.get('default_recipients', '')
            }
            
            # Only update password if provided
            if request.form.get('smtp_password'):
                config['smtp_password'] = request.form.get('smtp_password')
            elif email_config.config and 'smtp_password' in email_config.config:
                config['smtp_password'] = email_config.config['smtp_password']
            
            email_config.config = config
            email_config.updated_at = datetime.datetime.utcnow()
            email_config.updated_by = session['user']['id'] if is_authenticated() else None
            
            db.session.commit()
            
            # Update notification manager
            from sync_service.notification_system import notification_manager, configure_notification_manager
            configure_notification_manager()
            
            flash("Email notification settings updated successfully.", 'success')
            return redirect(url_for('sync.notification_config'))
            
        except Exception as e:
            db.session.rollback()
            flash(f"Error updating email notification settings: {str(e)}", 'danger')
            return redirect(url_for('sync.notification_config'))
    
    @bp.route('/configure_slack_notifications', methods=['POST'])
    @login_required
    @role_required('administrator')
    def configure_slack_notifications():
        """Configure Slack notification settings."""
        try:
            # Get or create Slack configuration
            slack_config = NotificationConfig.query.filter_by(channel_type='slack').first()
            if not slack_config:
                slack_config = NotificationConfig()
                slack_config.channel_type = 'slack'
                slack_config.enabled = False
                slack_config.config = {}
                slack_config.created_at = datetime.datetime.utcnow()
                slack_config.updated_at = datetime.datetime.utcnow()
                slack_config.updated_by = session['user']['id'] if is_authenticated() else None
                db.session.add(slack_config)
            
            # Update configuration
            slack_config.enabled = 'slack_enabled' in request.form
            
            # Build config dictionary
            config = {
                'webhook_url': request.form.get('webhook_url', ''),
                'default_channel': request.form.get('default_channel', '#sync-notifications'),
                'username': request.form.get('username', 'Sync Bot'),
                'icon_emoji': request.form.get('icon_emoji', ':sync:')
            }
            
            slack_config.config = config
            slack_config.updated_at = datetime.datetime.utcnow()
            slack_config.updated_by = session['user']['id'] if is_authenticated() else None
            
            db.session.commit()
            
            # Update notification manager
            from sync_service.notification_system import notification_manager, configure_notification_manager
            configure_notification_manager()
            
            flash("Slack notification settings updated successfully.", 'success')
            return redirect(url_for('sync.notification_config'))
            
        except Exception as e:
            db.session.rollback()
            flash(f"Error updating Slack notification settings: {str(e)}", 'danger')
            return redirect(url_for('sync.notification_config'))
    
    @bp.route('/configure_notification_routing', methods=['POST'])
    @login_required
    @role_required('administrator')
    def configure_notification_routing():
        """Configure notification routing by severity."""
        try:
            # Process each notification channel
            for channel_type in ['email', 'slack', 'sms']:
                channel_config = NotificationConfig.query.filter_by(channel_type=channel_type).first()
                if not channel_config:
                    continue
                
                # Get the current config
                config = channel_config.config or {}
                
                # Update severity routing
                severity_routes = {}
                for severity in ['info', 'warning', 'error', 'critical']:
                    route_key = f'route_{severity}_{channel_type}'
                    severity_routes[severity] = route_key in request.form
                
                # Update config
                config['severity_routes'] = severity_routes
                channel_config.config = config
                channel_config.updated_at = datetime.datetime.utcnow()
                channel_config.updated_by = session['user']['id'] if is_authenticated() else None
            
            db.session.commit()
            
            # Update notification manager
            from sync_service.notification_system import notification_manager, configure_notification_manager
            configure_notification_manager()
            
            flash("Notification routing settings updated successfully.", 'success')
            return redirect(url_for('sync.notification_config'))
            
        except Exception as e:
            db.session.rollback()
            flash(f"Error updating notification routing: {str(e)}", 'danger')
            return redirect(url_for('sync.notification_config'))
    
    @bp.route('/test_email_notification', methods=['POST'])
    @login_required
    @role_required('administrator')
    def test_email_notification():
        """Send a test email notification."""
        try:
            from sync_service.notification_system import notification_manager
            
            # Get form data
            recipient = request.form.get('recipient')
            subject = request.form.get('subject')
            message = request.form.get('message')
            
            # Create a test metadata dictionary
            metadata = {
                'test': True,
                'recipient': recipient
            }
            
            # Send through notification manager
            result = notification_manager.notify(
                subject=subject,
                message=message,
                severity='info',
                job_id=None,
                metadata=metadata,
                channel='email',
                recipient=recipient
            )
            
            if result:
                flash("Test email sent successfully!", 'success')
            else:
                flash("Failed to send test email. Check email configuration and logs.", 'danger')
                
            return redirect(url_for('sync.notification_config'))
            
        except Exception as e:
            flash(f"Error sending test email: {str(e)}", 'danger')
            return redirect(url_for('sync.notification_config'))
    
    @bp.route('/test_slack_notification', methods=['POST'])
    @login_required
    @role_required('administrator')
    def test_slack_notification():
        """Send a test Slack notification."""
        try:
            from sync_service.notification_system import notification_manager
            
            # Get form data
            channel = request.form.get('channel')
            message = request.form.get('message')
            
            # Create a test metadata dictionary
            metadata = {
                'test': True,
                'channel': channel
            }
            
            # Send through notification manager
            result = notification_manager.notify(
                subject="Test Notification",
                message=message,
                severity='info',
                job_id=None,
                metadata=metadata,
                channel='slack',
                slack_channel=channel
            )
            
            if result:
                flash("Test Slack message sent successfully!", 'success')
            else:
                flash("Failed to send test Slack message. Check Slack configuration and logs.", 'danger')
                
            return redirect(url_for('sync.notification_config'))
            
        except Exception as e:
            flash(f"Error sending test Slack message: {str(e)}", 'danger')
            return redirect(url_for('sync.notification_config'))
    
    @bp.route('/notification_logs')
    @login_required
    @role_required('administrator')
    def get_notification_logs():
        """Get recent notification logs as JSON."""
        logs = SyncNotificationLog.query.order_by(SyncNotificationLog.created_at.desc()).limit(50).all()
        
        log_list = [{
            'id': log.id,
            'job_id': log.job_id,
            'subject': log.subject,
            'message': log.message[:50] + '...' if len(log.message) > 50 else log.message,
            'severity': log.severity,
            'channel': log.channel,
            'recipient': log.recipient,
            'success': log.success,
            'created_at': log.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for log in logs]
        
        return jsonify({'logs': log_list})
    
    @bp.route('/schedules/<int:schedule_id>/delete')
    @login_required
    @role_required('administrator')
    def delete_schedule(schedule_id):
        """Delete a sync schedule."""
        from sync_service.scheduler import remove_scheduled_job
        
        try:
            schedule = SyncSchedule.query.get_or_404(schedule_id)
            
            # Remove from scheduler if active
            if schedule.is_active and schedule.job_id:
                remove_scheduled_job(schedule_id)
            
            # Get the name before deleting
            schedule_name = schedule.name
            
            # Remove from database
            db.session.delete(schedule)
            db.session.commit()
            
            flash(f"Schedule '{schedule_name}' deleted successfully.", 'success')
            
        except Exception as e:
            db.session.rollback()
            flash(f"Error deleting schedule: {str(e)}", 'danger')
            
        return redirect(url_for('sync.schedules'))
    
    @bp.route('/schedules/<int:schedule_id>/pause')
    @login_required
    @role_required('administrator')
    def pause_schedule(schedule_id):
        """Pause a sync schedule."""
        from sync_service.scheduler import pause_scheduled_job
        
        try:
            if pause_scheduled_job(schedule_id):
                flash("Schedule paused successfully.", 'success')
            else:
                flash("Could not pause schedule.", 'warning')
                
        except Exception as e:
            flash(f"Error pausing schedule: {str(e)}", 'danger')
            
        return redirect(url_for('sync.schedules'))
    
    @bp.route('/schedules/<int:schedule_id>/resume')
    @login_required
    @role_required('administrator')
    def resume_schedule(schedule_id):
        """Resume a paused sync schedule."""
        from sync_service.scheduler import resume_scheduled_job
        
        try:
            if resume_scheduled_job(schedule_id):
                flash("Schedule resumed successfully.", 'success')
            else:
                flash("Could not resume schedule.", 'warning')
                
        except Exception as e:
            flash(f"Error resuming schedule: {str(e)}", 'danger')
            
        return redirect(url_for('sync.schedules'))
    
    @bp.route('/schedules/<int:schedule_id>/run-now')
    @login_required
    @role_required('administrator')
    def run_schedule_now(schedule_id):
        """Run a schedule immediately."""
        try:
            schedule = SyncSchedule.query.get_or_404(schedule_id)
            
            # Get the user ID
            user_id = session['user']['id']
            
            # Run the appropriate job based on job type
            if schedule.job_type == 'up_sync':
                job_id = DataSynchronizer.start_up_sync(user_id)
            elif schedule.job_type == 'down_sync':
                job_id = DataSynchronizer.start_down_sync(user_id)
            elif schedule.job_type == 'full_sync':
                job_id = DataSynchronizer.start_full_sync(user_id)
            elif schedule.job_type == 'incremental_sync':
                job_id = DataSynchronizer.start_incremental_sync(user_id)
            elif schedule.job_type == 'property_export':
                params = schedule.parameters or {}
                database_name = params.get('database_name', 'web_internet_benton')
                num_years = int(params.get('num_years', -1))
                min_bill_years = int(params.get('min_bill_years', 2))
                
                job_id = DataSynchronizer.start_property_export(
                    user_id,
                    database_name,
                    num_years,
                    min_bill_years
                )
            else:
                flash(f"Unknown job type: {schedule.job_type}", 'danger')
                return redirect(url_for('sync.schedules'))
            
            # Update the schedule with the last run information
            schedule.last_run = datetime.datetime.utcnow()
            schedule.last_job_id = job_id
            db.session.commit()
            
            flash(f"Schedule '{schedule.name}' run initiated successfully. Job ID: {job_id}", 'success')
            return redirect(url_for('sync.job_details', job_id=job_id))
            
        except Exception as e:
            flash(f"Error running schedule: {str(e)}", 'danger')
            return redirect(url_for('sync.schedules'))