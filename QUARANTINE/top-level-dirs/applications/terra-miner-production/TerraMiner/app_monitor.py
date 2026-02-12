"""
Monitoring and alerts routes and functionality.
"""
import json
import logging
from datetime import datetime, timedelta

from flask import (
    Blueprint, render_template, request, redirect, 
    url_for, flash, jsonify, abort, current_app
)
from sqlalchemy import func

# Import alert manager but use models within functions to avoid circular imports
from utils.alert_manager import AlertManager

# Set up logger
logger = logging.getLogger(__name__)

# Helper function to get db session to avoid circular imports
def get_db():
    from app import db
    return db

# Create a Blueprint for monitoring routes
monitor_bp = Blueprint('monitor', __name__, url_prefix='/monitor')

# Set up logger
logger = logging.getLogger(__name__)

#
# Alert and Notification Channel Management Routes
#

@monitor_bp.route('/alerts/manage', methods=['GET'])
def manage_alerts():
    """Page for managing alerts and notification channels."""
    # Import models locally to avoid circular imports
    from models import AlertRule, NotificationChannel, AlertNotificationMap, MonitoringAlert
    
    # Get active alert rules
    alert_rules = AlertRule.query.order_by(AlertRule.name).all()
    
    # Get notification channels
    notification_channels = NotificationChannel.query.order_by(NotificationChannel.name).all()
    
    # Get notification mappings
    notification_mappings = AlertNotificationMap.query.all()
    
    # Get active alerts for reference
    active_alerts = MonitoringAlert.query.filter_by(status='active').order_by(
        MonitoringAlert.severity, 
        MonitoringAlert.created_at.desc()
    ).limit(10).all()
    
    return render_template(
        'monitoring_alerts_manage.html',
        alert_rules=alert_rules,
        notification_channels=notification_channels,
        notification_mappings=notification_mappings,
        active_alerts=active_alerts
    )

@monitor_bp.route('/notification-channels', methods=['GET', 'POST'])
def notification_channels():
    """Page for managing notification channels."""
    # Import models locally to avoid circular imports
    from models import NotificationChannel
    if request.method == 'POST':
        try:
            # Get form data
            name = request.form.get('name')
            channel_type = request.form.get('channel_type')
            is_active = 'is_active' in request.form
            config_data = {}
            
            # Validate inputs
            if not name or not channel_type:
                flash('Name and channel type are required.', 'danger')
                return redirect(url_for('monitor.notification_channels'))
            
            # Process configuration based on channel type
            if channel_type == 'slack':
                channel_id = request.form.get('slack_channel_id')
                if not channel_id:
                    flash('Slack channel ID is required.', 'danger')
                    return redirect(url_for('monitor.notification_channels'))
                config_data = {
                    'channel_id': channel_id
                }
            elif channel_type == 'email':
                recipients = request.form.get('email_recipients', '')
                if not recipients:
                    flash('Email recipients are required.', 'danger')
                    return redirect(url_for('monitor.notification_channels'))
                # Parse recipients (comma-separated)
                recipient_list = [r.strip() for r in recipients.split(',') if r.strip()]
                config_data = {
                    'recipients': recipient_list
                }
            elif channel_type == 'sms':
                recipients = request.form.get('sms_recipients', '')
                if not recipients:
                    flash('SMS recipients are required.', 'danger')
                    return redirect(url_for('monitor.notification_channels'))
                # Parse recipients (comma-separated)
                recipient_list = [r.strip() for r in recipients.split(',') if r.strip()]
                config_data = {
                    'recipients': recipient_list
                }
            else:
                flash(f'Unsupported channel type: {channel_type}', 'danger')
                return redirect(url_for('monitor.notification_channels'))
            
            # Create new notification channel
            channel = NotificationChannel(
                name=name,
                channel_type=channel_type,
                config=json.dumps(config_data),
                is_active=is_active
            )
            
            db = get_db()
            db.session.add(channel)
            db.session.commit()
            
            flash(f'Notification channel "{name}" created successfully.', 'success')
            return redirect(url_for('monitor.notification_channels'))
            
        except Exception as e:
            db = get_db()
            db.session.rollback()
            logger.error(f"Error creating notification channel: {str(e)}")
            flash(f'Error creating notification channel: {str(e)}', 'danger')
            return redirect(url_for('monitor.notification_channels'))
    
    # GET request - show list of channels
    channels = NotificationChannel.query.order_by(NotificationChannel.name).all()
    
    return render_template(
        'monitoring_notification_channels.html',
        channels=channels
    )

@monitor_bp.route('/notification-channels/<int:channel_id>/edit', methods=['GET', 'POST'])
def edit_notification_channel(channel_id):
    """Edit a notification channel."""
    # Import models locally to avoid circular imports
    from models import NotificationChannel
    
    # Get channel
    channel = NotificationChannel.query.get_or_404(channel_id)
    
    if request.method == 'POST':
        try:
            # Get form data
            name = request.form.get('name')
            is_active = 'is_active' in request.form
            
            # Validate inputs
            if not name:
                flash('Name is required.', 'danger')
                return redirect(url_for('monitor.edit_notification_channel', channel_id=channel_id))
            
            # Parse existing config
            config_data = json.loads(channel.config)
            
            # Process configuration based on channel type
            if channel.channel_type == 'slack':
                channel_id_value = request.form.get('slack_channel_id')
                if not channel_id_value:
                    flash('Slack channel ID is required.', 'danger')
                    return redirect(url_for('monitor.edit_notification_channel', channel_id=channel_id))
                config_data['channel_id'] = channel_id_value
            elif channel.channel_type in ['email', 'sms']:
                recipients = request.form.get(f'{channel.channel_type}_recipients', '')
                if not recipients:
                    flash(f'{channel.channel_type.capitalize()} recipients are required.', 'danger')
                    return redirect(url_for('monitor.edit_notification_channel', channel_id=channel_id))
                # Parse recipients (comma-separated)
                recipient_list = [r.strip() for r in recipients.split(',') if r.strip()]
                config_data['recipients'] = recipient_list
            
            # Update channel
            channel.name = name
            channel.config = json.dumps(config_data)
            channel.is_active = is_active
            channel.updated_at = datetime.now()
            
            db.session.commit()
            
            flash(f'Notification channel "{name}" updated successfully.', 'success')
            return redirect(url_for('monitor.notification_channels'))
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating notification channel: {str(e)}")
            flash(f'Error updating notification channel: {str(e)}', 'danger')
            return redirect(url_for('monitor.edit_notification_channel', channel_id=channel_id))
    
    # Parse configuration for display
    config = json.loads(channel.config)
    
    # Format configuration for display based on channel type
    formatted_config = {}
    if channel.channel_type == 'slack':
        formatted_config['channel_id'] = config.get('channel_id', '')
    elif channel.channel_type in ['email', 'sms']:
        recipients = config.get('recipients', [])
        formatted_config['recipients'] = ', '.join(recipients)
    
    return render_template(
        'monitoring_notification_channel_edit.html',
        channel=channel,
        config=formatted_config
    )

@monitor_bp.route('/notification-channels/<int:channel_id>/delete', methods=['POST'])
def delete_notification_channel(channel_id):
    """Delete a notification channel."""
    # Import models locally to avoid circular imports
    from models import NotificationChannel, AlertNotificationMap
    
    # Get channel
    channel = NotificationChannel.query.get_or_404(channel_id)
    
    try:
        # Check if channel is being used in any alert mappings
        mappings = AlertNotificationMap.query.filter_by(channel_id=channel_id).count()
        if mappings > 0:
            flash(f'Cannot delete channel "{channel.name}" because it is used in {mappings} alert mappings.', 'danger')
            return redirect(url_for('monitor.notification_channels'))
        
        # Delete channel
        db.session.delete(channel)
        db.session.commit()
        
        flash(f'Notification channel "{channel.name}" deleted successfully.', 'success')
        return redirect(url_for('monitor.notification_channels'))
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting notification channel: {str(e)}")
        flash(f'Error deleting notification channel: {str(e)}', 'danger')
        return redirect(url_for('monitor.notification_channels'))

@monitor_bp.route('/alert-rules', methods=['GET', 'POST'])
def alert_rules():
    """Page for managing alert rules."""
    if request.method == 'POST':
        try:
            # Get form data
            name = request.form.get('name')
            description = request.form.get('description')
            alert_type = request.form.get('alert_type')
            severity = request.form.get('severity')
            condition_type = request.form.get('condition_type')
            component = request.form.get('component')
            is_active = 'is_active' in request.form
            cooldown_minutes = int(request.form.get('cooldown_minutes', 60))
            
            # Validate inputs
            if not name or not alert_type or not severity or not condition_type or not component:
                flash('Name, alert type, severity, condition type, and component are required.', 'danger')
                return redirect(url_for('monitor.alert_rules'))
            
            # Process condition configuration based on condition type
            condition_config = {}
            if condition_type == 'threshold':
                metric_name = request.form.get('metric_name')
                threshold_value = request.form.get('threshold_value')
                operator = request.form.get('operator')
                
                if not metric_name or not threshold_value or not operator:
                    flash('Metric name, threshold value, and operator are required for threshold conditions.', 'danger')
                    return redirect(url_for('monitor.alert_rules'))
                    
                try:
                    threshold_value = float(threshold_value)
                except ValueError:
                    flash('Threshold value must be a number.', 'danger')
                    return redirect(url_for('monitor.alert_rules'))
                
                condition_config = {
                    'metric_name': metric_name,
                    'threshold': threshold_value,
                    'operator': operator
                }
            elif condition_type == 'pattern':
                pattern = request.form.get('pattern')
                source = request.form.get('source')
                
                if not pattern or not source:
                    flash('Pattern and source are required for pattern conditions.', 'danger')
                    return redirect(url_for('monitor.alert_rules'))
                
                condition_config = {
                    'pattern': pattern,
                    'source': source
                }
            elif condition_type == 'frequency':
                event_type = request.form.get('event_type')
                count = request.form.get('count')
                period_minutes = request.form.get('period_minutes')
                
                if not event_type or not count or not period_minutes:
                    flash('Event type, count, and period are required for frequency conditions.', 'danger')
                    return redirect(url_for('monitor.alert_rules'))
                    
                try:
                    count = int(count)
                    period_minutes = int(period_minutes)
                except ValueError:
                    flash('Count and period must be integers.', 'danger')
                    return redirect(url_for('monitor.alert_rules'))
                
                condition_config = {
                    'event_type': event_type,
                    'count': count,
                    'period_minutes': period_minutes
                }
            else:
                flash(f'Unsupported condition type: {condition_type}', 'danger')
                return redirect(url_for('monitor.alert_rules'))
            
            # Create new alert rule
            rule = AlertRule(
                name=name,
                description=description,
                alert_type=alert_type,
                severity=severity,
                condition_type=condition_type,
                condition_config=json.dumps(condition_config),
                component=component,
                is_active=is_active,
                cooldown_minutes=cooldown_minutes
            )
            
            db.session.add(rule)
            db.session.commit()
            
            flash(f'Alert rule "{name}" created successfully.', 'success')
            return redirect(url_for('monitor.alert_rules'))
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating alert rule: {str(e)}")
            flash(f'Error creating alert rule: {str(e)}', 'danger')
            return redirect(url_for('monitor.alert_rules'))
    
    # GET request - show list of alert rules
    rules = AlertRule.query.order_by(AlertRule.name).all()
    
    # Get available metrics for dropdowns
    metric_names = db.session.query(SystemMetric.metric_name).distinct().all()
    metric_names = [m[0] for m in metric_names]
    
    # Get available components for dropdowns
    components = db.session.query(SystemMetric.component).distinct().all()
    components = [c[0] for c in components]
    
    return render_template(
        'monitoring_alert_rules.html',
        rules=rules,
        metric_names=metric_names,
        components=components
    )

@monitor_bp.route('/alert-notification-mappings', methods=['GET', 'POST'])
def alert_notification_mappings():
    """Page for managing alert notification mappings."""
    if request.method == 'POST':
        try:
            # Get form data
            alert_type = request.form.get('alert_type')
            min_severity = request.form.get('min_severity')
            channel_id = request.form.get('channel_id')
            is_active = 'is_active' in request.form
            
            # Validate inputs
            if not alert_type or not min_severity or not channel_id:
                flash('Alert type, minimum severity, and notification channel are required.', 'danger')
                return redirect(url_for('monitor.alert_notification_mappings'))
            
            # Create new mapping
            mapping = AlertNotificationMap(
                alert_type=alert_type,
                min_severity=min_severity,
                channel_id=channel_id,
                is_active=is_active
            )
            
            db.session.add(mapping)
            db.session.commit()
            
            flash('Alert notification mapping created successfully.', 'success')
            return redirect(url_for('monitor.alert_notification_mappings'))
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating alert notification mapping: {str(e)}")
            flash(f'Error creating alert notification mapping: {str(e)}', 'danger')
            return redirect(url_for('monitor.alert_notification_mappings'))
    
    # GET request - show list of mappings
    mappings = AlertNotificationMap.query.all()
    
    # Get notification channels for dropdown
    channels = NotificationChannel.query.filter_by(is_active=True).order_by(NotificationChannel.name).all()
    
    # Get alert types from rules for dropdown
    alert_types = db.session.query(AlertRule.alert_type).distinct().all()
    alert_types = [t[0] for t in alert_types]
    alert_types.append('*')  # Add wildcard option
    
    # Severity levels
    severities = ['critical', 'error', 'warning', 'info']
    
    return render_template(
        'monitoring_alert_notification_mappings.html',
        mappings=mappings,
        channels=channels,
        alert_types=alert_types,
        severities=severities
    )

#
# Alert Action Routes
#

@monitor_bp.route('/alerts/<int:alert_id>/acknowledge', methods=['POST'])
def acknowledge_alert(alert_id):
    """Acknowledge an alert."""
    # Call alert manager to acknowledge alert
    result = AlertManager.acknowledge_alert(alert_id)
    
    if result:
        flash('Alert acknowledged successfully.', 'success')
    else:
        flash('Failed to acknowledge alert.', 'danger')
    
    # Redirect back to referring page or alerts page
    next_url = request.form.get('next') or url_for('monitoring_alerts_active')
    return redirect(next_url)

@monitor_bp.route('/alerts/<int:alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id):
    """Resolve an alert."""
    # Call alert manager to resolve alert
    result = AlertManager.resolve_alert(alert_id)
    
    if result:
        flash('Alert resolved successfully.', 'success')
    else:
        flash('Failed to resolve alert.', 'danger')
    
    # Redirect back to referring page or alerts page
    next_url = request.form.get('next') or url_for('monitoring_alerts_active')
    return redirect(next_url)

#
# API Routes for Alerts
#

@monitor_bp.route('/api/alerts', methods=['GET'])
def api_get_alerts():
    """API endpoint to get alerts."""
    try:
        # Get query parameters
        status = request.args.get('status')
        severity = request.args.get('severity')
        component = request.args.get('component')
        limit = request.args.get('limit', type=int, default=100)
        
        # Build query
        query = MonitoringAlert.query
        
        if status:
            query = query.filter_by(status=status)
        
        if severity:
            query = query.filter_by(severity=severity)
        
        if component:
            query = query.filter_by(component=component)
        
        # Execute query with sorting and limit
        alerts = query.order_by(MonitoringAlert.created_at.desc()).limit(limit).all()
        
        # Format alerts for JSON response
        alerts_data = []
        for alert in alerts:
            alert_data = {
                'id': alert.id,
                'alert_type': alert.alert_type,
                'severity': alert.severity,
                'component': alert.component,
                'message': alert.message,
                'status': alert.status,
                'created_at': alert.created_at.isoformat(),
                'acknowledged_at': alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
                'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None
            }
            alerts_data.append(alert_data)
        
        return jsonify({
            'status': 'success',
            'count': len(alerts_data),
            'alerts': alerts_data
        })
    
    except Exception as e:
        logger.error(f"Error getting alerts: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@monitor_bp.route('/api/alerts/create', methods=['POST'])
def api_create_alert():
    """API endpoint to create an alert."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['alert_type', 'severity', 'component', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create alert using alert manager
        alert = AlertManager.create_alert(
            alert_type=data['alert_type'],
            severity=data['severity'],
            component=data['component'],
            message=data['message'],
            details=data.get('details'),
            rule_id=data.get('rule_id')
        )
        
        if not alert:
            return jsonify({
                'status': 'error',
                'message': 'Failed to create alert'
            }), 500
        
        return jsonify({
            'status': 'success',
            'alert_id': alert.id,
            'message': f'Alert created successfully with ID {alert.id}'
        })
    
    except Exception as e:
        logger.error(f"Error creating alert: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Register the blueprint to the main app in app.py