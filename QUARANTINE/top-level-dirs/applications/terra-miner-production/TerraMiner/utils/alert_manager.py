"""
Alert manager for handling alerts and notifications.
"""
import json
import logging
from datetime import datetime, timedelta

from app import db
from models import MonitoringAlert, AlertRule, AlertNotificationMap, NotificationChannel
from utils.notification_service import NotificationService

# Set up logger
logger = logging.getLogger(__name__)

class AlertManager:
    """
    Alert manager for handling the creation, updating, and notification of alerts.
    """
    
    @staticmethod
    def create_alert(alert_type, severity, component, message, details=None, rule_id=None):
        """
        Create a new alert in the database and send notifications.
        
        Args:
            alert_type (str): Type of alert, e.g., 'high_cpu_usage'
            severity (str): Severity level, e.g., 'critical', 'error', 'warning', 'info'
            component (str): Component that generated the alert, e.g., 'system', 'api', 'database'
            message (str): Brief message describing the alert
            details (str, optional): Detailed information about the alert
            rule_id (int, optional): ID of the alert rule that triggered this alert
            
        Returns:
            MonitoringAlert: The created alert, or None if creation failed
        """
        try:
            # Check if a similar active alert already exists (prevent duplicates)
            existing_alert = MonitoringAlert.query.filter_by(
                alert_type=alert_type,
                component=component,
                status='active'
            ).first()
            
            if existing_alert:
                # If an alert with the same type and component is already active,
                # only create a new one if it's been more than 1 hour or if the severity increased
                one_hour_ago = datetime.now() - timedelta(hours=1)
                severity_levels = {'info': 1, 'warning': 2, 'error': 3, 'critical': 4}
                
                existing_severity = severity_levels.get(existing_alert.severity.lower(), 0)
                new_severity = severity_levels.get(severity.lower(), 0)
                
                if existing_alert.created_at >= one_hour_ago and new_severity <= existing_severity:
                    logger.info(f"Similar alert already exists (ID: {existing_alert.id}). Skipping creation.")
                    return existing_alert
            
            # Create a new alert
            alert = MonitoringAlert(
                alert_type=alert_type,
                severity=severity,
                component=component,
                message=message,
                details=details,
                rule_id=rule_id,
                status='active',
                created_at=datetime.now()
            )
            
            db.session.add(alert)
            db.session.commit()
            
            logger.info(f"Created alert (ID: {alert.id}) of type {alert_type} with severity {severity}")
            
            # Send notifications for the new alert
            AlertManager.send_alert_notifications(alert)
            
            return alert
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating alert: {str(e)}")
            return None
    
    @staticmethod
    def acknowledge_alert(alert_id):
        """
        Acknowledge an alert.
        
        Args:
            alert_id (int): ID of the alert to acknowledge
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            alert = MonitoringAlert.query.get(alert_id)
            if not alert:
                logger.error(f"Alert with ID {alert_id} not found")
                return False
            
            if alert.status == 'resolved':
                logger.warning(f"Alert with ID {alert_id} is already resolved")
                return False
                
            alert.status = 'acknowledged'
            alert.acknowledged_at = datetime.now()
            db.session.commit()
            
            logger.info(f"Acknowledged alert with ID {alert_id}")
            return True
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error acknowledging alert: {str(e)}")
            return False
    
    @staticmethod
    def resolve_alert(alert_id):
        """
        Resolve an alert.
        
        Args:
            alert_id (int): ID of the alert to resolve
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            alert = MonitoringAlert.query.get(alert_id)
            if not alert:
                logger.error(f"Alert with ID {alert_id} not found")
                return False
                
            alert.status = 'resolved'
            alert.resolved_at = datetime.now()
            
            # If the alert was not acknowledged, set the acknowledged_at timestamp
            if not alert.acknowledged_at:
                alert.acknowledged_at = alert.resolved_at
                
            db.session.commit()
            
            logger.info(f"Resolved alert with ID {alert_id}")
            return True
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error resolving alert: {str(e)}")
            return False
    
    @staticmethod
    def check_alert_rules():
        """
        Check all active alert rules against the current system state.
        
        Returns:
            int: Number of alerts generated
        """
        try:
            # Get all active alert rules
            rules = AlertRule.query.filter_by(is_active=True).all()
            
            if not rules:
                logger.debug("No active alert rules found")
                return 0
                
            alerts_generated = 0
            
            for rule in rules:
                try:
                    # Parse condition configuration
                    condition_config = json.loads(rule.condition_config)
                    
                    # Check if the rule is in cooldown
                    if rule.last_triggered:
                        cooldown_minutes = rule.cooldown_minutes or 60
                        cooldown_until = rule.last_triggered + timedelta(minutes=cooldown_minutes)
                        
                        if datetime.now() < cooldown_until:
                            # Rule is in cooldown, skip it
                            logger.debug(f"Rule {rule.id} ({rule.name}) is in cooldown until {cooldown_until}")
                            continue
                    
                    # Check if the rule condition is met based on condition type
                    if rule.condition_type == 'threshold':
                        # Handle threshold condition
                        from models import SystemMetric
                        
                        metric_name = condition_config.get('metric_name')
                        threshold = condition_config.get('threshold')
                        operator = condition_config.get('operator')
                        
                        if not metric_name or threshold is None or not operator:
                            logger.warning(f"Invalid threshold condition for rule {rule.id} ({rule.name})")
                            continue
                            
                        # Get the latest metric value
                        metric = SystemMetric.query.filter_by(
                            metric_name=metric_name,
                            component=rule.component
                        ).order_by(SystemMetric.timestamp.desc()).first()
                        
                        if not metric:
                            logger.debug(f"No metric found for {metric_name} in component {rule.component}")
                            continue
                            
                        metric_value = metric.metric_value
                        
                        # Check the condition based on the operator
                        condition_met = False
                        if operator == '>':
                            condition_met = metric_value > threshold
                        elif operator == '>=':
                            condition_met = metric_value >= threshold
                        elif operator == '<':
                            condition_met = metric_value < threshold
                        elif operator == '<=':
                            condition_met = metric_value <= threshold
                        elif operator == '==':
                            condition_met = metric_value == threshold
                        elif operator == '!=':
                            condition_met = metric_value != threshold
                            
                        if condition_met:
                            # Generate an alert
                            alert = AlertManager.create_alert(
                                alert_type=rule.alert_type,
                                severity=rule.severity,
                                component=rule.component,
                                message=rule.description or f"{metric_name} {operator} {threshold}",
                                details=f"Metric {metric_name} value {metric_value} {operator} threshold {threshold}",
                                rule_id=rule.id
                            )
                            
                            if alert:
                                alerts_generated += 1
                                
                                # Update the rule's last_triggered timestamp
                                rule.last_triggered = datetime.now()
                                
                    elif rule.condition_type == 'pattern':
                        # Handle pattern matching condition
                        # This would require logs or other text data sources to search for patterns
                        # Not implemented in this version
                        pass
                        
                    elif rule.condition_type == 'frequency':
                        # Handle frequency condition (e.g., number of errors in a time period)
                        from models import APIUsageLog
                        
                        event_type = condition_config.get('event_type')
                        count = condition_config.get('count')
                        period_minutes = condition_config.get('period_minutes')
                        
                        if not event_type or count is None or period_minutes is None:
                            logger.warning(f"Invalid frequency condition for rule {rule.id} ({rule.name})")
                            continue
                            
                        # Calculate the time range
                        period_start = datetime.now() - timedelta(minutes=period_minutes)
                        
                        # Count events based on event type
                        actual_count = 0
                        
                        if event_type == 'api_error':
                            # Count API errors
                            actual_count = APIUsageLog.query.filter(
                                APIUsageLog.timestamp >= period_start,
                                APIUsageLog.status_code >= 400
                            ).count()
                        elif event_type == 'job_failure':
                            # Count job failures
                            from models import JobRun
                            actual_count = JobRun.query.filter(
                                JobRun.start_time >= period_start,
                                JobRun.status == 'failed'
                            ).count()
                            
                        # Check if the condition is met
                        if actual_count >= count:
                            # Generate an alert
                            alert = AlertManager.create_alert(
                                alert_type=rule.alert_type,
                                severity=rule.severity,
                                component=rule.component,
                                message=rule.description or f"{event_type} frequency exceeded",
                                details=f"Detected {actual_count} {event_type} events in the last {period_minutes} minutes (threshold: {count})",
                                rule_id=rule.id
                            )
                            
                            if alert:
                                alerts_generated += 1
                                
                                # Update the rule's last_triggered timestamp
                                rule.last_triggered = datetime.now()
                                
                except Exception as e:
                    logger.error(f"Error checking rule {rule.id} ({rule.name}): {str(e)}")
                    continue
                
            # Commit any changes to rules (last_triggered timestamps)
            db.session.commit()
            
            return alerts_generated
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error checking alert rules: {str(e)}")
            return 0
    
    @staticmethod
    def send_alert_notifications(alert):
        """
        Send notifications for an alert.
        
        Args:
            alert (MonitoringAlert): The alert to send notifications for
            
        Returns:
            int: Number of notifications sent
        """
        try:
            # Get notification mappings that match this alert
            mappings = AlertNotificationMap.query.filter(
                AlertNotificationMap.is_active == True,
                (
                    (AlertNotificationMap.alert_type == '*') |
                    (AlertNotificationMap.alert_type == alert.alert_type)
                )
            ).all()
            
            if not mappings:
                logger.debug(f"No notification mappings found for alert {alert.id}")
                return 0
                
            # Map severity levels for comparison
            severity_levels = {'info': 1, 'warning': 2, 'error': 3, 'critical': 4}
            alert_severity = severity_levels.get(alert.severity.lower(), 0)
            
            sent_count = 0
            
            for mapping in mappings:
                try:
                    # Check if the alert meets the minimum severity requirement
                    mapping_min_severity = severity_levels.get(mapping.min_severity.lower(), 0)
                    
                    if alert_severity < mapping_min_severity:
                        logger.debug(f"Alert {alert.id} severity {alert.severity} does not meet mapping {mapping.id} min severity {mapping.min_severity}")
                        continue
                        
                    # Get the notification channel
                    channel = NotificationChannel.query.get(mapping.channel_id)
                    
                    if not channel or not channel.is_active:
                        logger.warning(f"Notification channel {mapping.channel_id} not found or not active")
                        continue
                        
                    # Format the alert message
                    alert_time = alert.created_at.strftime("%Y-%m-%d %H:%M:%S")
                    message = f"""
ALERT [{alert.severity.upper()}]: {alert.message}
Time: {alert_time}
Component: {alert.component}
Type: {alert.alert_type}
ID: {alert.id}
                    """
                    
                    if alert.details:
                        message += f"\nDetails: {alert.details}"
                        
                    # Send the notification based on channel type
                    notification_service = NotificationService()
                    
                    if channel.channel_type == 'slack':
                        # Send Slack notification
                        config = json.loads(channel.config)
                        slack_channel_id = config.get('channel_id')
                        
                        if not slack_channel_id:
                            logger.warning(f"Slack channel ID not found in channel {channel.id} config")
                            continue
                            
                        success = notification_service.send_slack_notification(
                            message=message,
                            channel_id=slack_channel_id,
                            severity=alert.severity
                        )
                        
                        if success:
                            sent_count += 1
                            
                    elif channel.channel_type == 'email':
                        # Send email notification
                        config = json.loads(channel.config)
                        recipients = config.get('recipients', [])
                        
                        if not recipients:
                            logger.warning(f"No recipients found in channel {channel.id} config")
                            continue
                            
                        email_subject = f"[{alert.severity.upper()}] Alert: {alert.message}"
                        
                        success = notification_service.send_email_notification(
                            subject=email_subject,
                            message=message,
                            recipients=recipients,
                            severity=alert.severity
                        )
                        
                        if success:
                            sent_count += 1
                            
                    elif channel.channel_type == 'sms':
                        # Send SMS notification
                        config = json.loads(channel.config)
                        recipients = config.get('recipients', [])
                        
                        if not recipients:
                            logger.warning(f"No recipients found in channel {channel.id} config")
                            continue
                            
                        # Truncate message for SMS
                        short_message = f"{alert.severity.upper()}: {alert.message} - {alert.component}"
                        
                        success = notification_service.send_sms_notification(
                            message=short_message,
                            recipients=recipients
                        )
                        
                        if success:
                            sent_count += 1
                            
                except Exception as e:
                    logger.error(f"Error sending notification for mapping {mapping.id}: {str(e)}")
                    continue
                    
            return sent_count
            
        except Exception as e:
            logger.error(f"Error sending alert notifications: {str(e)}")
            return 0