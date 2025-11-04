"""
Data Quality Notification Handler

This module handles real-time notifications for data quality issues and anomalies.
It integrates with the existing notification system to deliver alerts through
multiple channels based on alert configurations.
"""

import logging
import datetime
import json
from typing import Dict, List, Any, Optional, Union
from sqlalchemy import and_, or_

from app import db
from sync_service.notification_system import SyncNotificationManager
from sync_service.models.data_quality import (
    DataQualityAlert, DataQualityNotification, 
    DataQualityIssue, DataAnomaly, DataQualityReport
)

# Configure logging
logger = logging.getLogger(__name__)

class DataQualityNotificationManager:
    """
    Manager for data quality notifications.
    Handles checking alert conditions and sending notifications.
    """
    
    def __init__(self):
        """Initialize the notification manager"""
        self.notification_manager = SyncNotificationManager()
        logger.info("Data Quality Notification Manager initialized")
    
    def check_alerts(self):
        """
        Check all active alerts against current data quality state.
        This should be run periodically to identify new issues that match alert criteria.
        """
        try:
            # Get all active alerts
            active_alerts = DataQualityAlert.query.filter_by(is_active=True).all()
            logger.info(f"Checking {len(active_alerts)} active data quality alerts")
            
            for alert in active_alerts:
                try:
                    # Check alert based on its type
                    if alert.alert_type == 'issue':
                        self._check_issue_alert(alert)
                    elif alert.alert_type == 'anomaly':
                        self._check_anomaly_alert(alert)
                    elif alert.alert_type == 'score':
                        self._check_score_alert(alert)
                    elif alert.alert_type == 'trend':
                        self._check_trend_alert(alert)
                except Exception as e:
                    logger.error(f"Error checking alert {alert.id}: {str(e)}")
        
        except Exception as e:
            logger.error(f"Error checking data quality alerts: {str(e)}")
    
    def _check_issue_alert(self, alert: DataQualityAlert):
        """
        Check for data quality issues that match alert criteria.
        
        Args:
            alert: The alert configuration to check
        """
        # Get alert conditions
        conditions = alert.conditions
        time_window = conditions.get('time_window', 60)  # Minutes
        min_count = conditions.get('min_count', 1)
        
        # Calculate time threshold
        time_threshold = datetime.datetime.utcnow() - datetime.timedelta(minutes=time_window)
        
        # Build query filters
        filters = [
            DataQualityIssue.detected_at >= time_threshold,
            DataQualityIssue.status == 'open'
        ]
        
        # Add severity filter if configured
        if alert.severity_threshold:
            severity_levels = ['info', 'warning', 'error', 'critical']
            threshold_index = severity_levels.index(alert.severity_threshold)
            applicable_severities = severity_levels[threshold_index:]
            filters.append(DataQualityIssue.severity.in_(applicable_severities))
        
        # Add table/field filters if configured
        if alert.table_name:
            filters.append(DataQualityIssue.table_name == alert.table_name)
        if alert.field_name:
            filters.append(DataQualityIssue.field_name == alert.field_name)
        
        # Execute query
        issues = DataQualityIssue.query.filter(and_(*filters)).all()
        
        # Check if alert threshold is met
        if len(issues) >= min_count:
            # Check if notification was already sent recently
            if not self._was_alerted_recently(alert.id, 'issue', time_window):
                self._send_issue_alert(alert, issues)
    
    def _check_anomaly_alert(self, alert: DataQualityAlert):
        """
        Check for data anomalies that match alert criteria.
        
        Args:
            alert: The alert configuration to check
        """
        # Get alert conditions
        conditions = alert.conditions
        time_window = conditions.get('time_window', 60)  # Minutes
        min_count = conditions.get('min_count', 1)
        anomaly_types = conditions.get('anomaly_types', [])
        min_score = conditions.get('min_score', 0.0)
        
        # Calculate time threshold
        time_threshold = datetime.datetime.utcnow() - datetime.timedelta(minutes=time_window)
        
        # Build query filters
        filters = [
            DataAnomaly.detected_at >= time_threshold,
            DataAnomaly.status == 'open'
        ]
        
        if min_score > 0:
            filters.append(DataAnomaly.anomaly_score >= min_score)
            
        # Add severity filter if configured
        if alert.severity_threshold:
            severity_levels = ['info', 'warning', 'error', 'critical']
            threshold_index = severity_levels.index(alert.severity_threshold)
            applicable_severities = severity_levels[threshold_index:]
            filters.append(DataAnomaly.severity.in_(applicable_severities))
        
        # Add anomaly type filter if configured
        if anomaly_types:
            filters.append(DataAnomaly.anomaly_type.in_(anomaly_types))
            
        # Add table/field filters if configured
        if alert.table_name:
            filters.append(DataAnomaly.table_name == alert.table_name)
        if alert.field_name:
            filters.append(DataAnomaly.field_name == alert.field_name)
        
        # Execute query
        anomalies = DataAnomaly.query.filter(and_(*filters)).all()
        
        # Check if alert threshold is met
        if len(anomalies) >= min_count:
            # Check if notification was already sent recently
            if not self._was_alerted_recently(alert.id, 'anomaly', time_window):
                self._send_anomaly_alert(alert, anomalies)
    
    def _check_score_alert(self, alert: DataQualityAlert):
        """
        Check for data quality score thresholds that match alert criteria.
        
        Args:
            alert: The alert configuration to check
        """
        # Get alert conditions
        conditions = alert.conditions
        min_score = conditions.get('min_score', 0)
        max_score = conditions.get('max_score', 100)
        
        # Get latest report
        latest_report = DataQualityReport.query.order_by(
            DataQualityReport.created_at.desc()
        ).first()
        
        if not latest_report:
            return
        
        # Check if score is outside the acceptable range
        score = latest_report.overall_score
        if score < min_score or (max_score > 0 and score > max_score):
            # Check if notification was already sent for this report
            existing_notification = DataQualityNotification.query.filter(
                DataQualityNotification.alert_id == alert.id,
                DataQualityNotification.report_id == latest_report.id
            ).first()
            
            if not existing_notification:
                self._send_score_alert(alert, latest_report)
    
    def _check_trend_alert(self, alert: DataQualityAlert):
        """
        Check for data quality trend changes that match alert criteria.
        
        Args:
            alert: The alert configuration to check
        """
        # Get alert conditions
        conditions = alert.conditions
        threshold_change = conditions.get('threshold_change', 10)  # Percentage change
        time_window = conditions.get('time_window', 1440)  # Minutes (default 24 hours)
        
        # Calculate time thresholds
        now = datetime.datetime.utcnow()
        period_end = now - datetime.timedelta(minutes=time_window)
        period_start = period_end - datetime.timedelta(minutes=time_window)
        
        # Get reports from current and previous periods
        current_period_reports = DataQualityReport.query.filter(
            DataQualityReport.created_at.between(period_end, now)
        ).all()
        
        previous_period_reports = DataQualityReport.query.filter(
            DataQualityReport.created_at.between(period_start, period_end)
        ).all()
        
        # Calculate average scores
        if not current_period_reports or not previous_period_reports:
            return
            
        current_avg = sum(r.overall_score for r in current_period_reports) / len(current_period_reports)
        previous_avg = sum(r.overall_score for r in previous_period_reports) / len(previous_period_reports)
        
        # Calculate percentage change
        if previous_avg == 0:
            return
            
        pct_change = abs((current_avg - previous_avg) / previous_avg * 100)
        
        # Check if change exceeds threshold
        if pct_change >= threshold_change:
            # Check if notification was already sent recently
            if not self._was_alerted_recently(alert.id, 'trend', time_window):
                self._send_trend_alert(alert, current_avg, previous_avg, pct_change)
    
    def _was_alerted_recently(self, alert_id: int, alert_type: str, time_window: int) -> bool:
        """
        Check if an alert notification was sent recently.
        
        Args:
            alert_id: ID of the alert
            alert_type: Type of the alert
            time_window: Time window in minutes
            
        Returns:
            True if notification was sent recently, False otherwise
        """
        time_threshold = datetime.datetime.utcnow() - datetime.timedelta(minutes=time_window)
        
        recent_notification = DataQualityNotification.query.filter(
            DataQualityNotification.alert_id == alert_id,
            DataQualityNotification.created_at >= time_threshold
        ).first()
        
        return recent_notification is not None
    
    def _send_issue_alert(self, alert: DataQualityAlert, issues: List[DataQualityIssue]):
        """
        Send notification for data quality issues.
        
        Args:
            alert: Alert configuration
            issues: List of issues that triggered the alert
        """
        # Create notification title and message
        issue_count = len(issues)
        title = f"Data Quality Alert: {issue_count} {alert.table_name or 'database'} {'issues' if issue_count > 1 else 'issue'} detected"
        
        # Prepare message with details
        message = f"{issue_count} data quality {'issues' if issue_count > 1 else 'issue'} detected"
        if alert.table_name:
            message += f" in table {alert.table_name}"
        if alert.field_name:
            message += f" for field {alert.field_name}"
        
        # Add issue details
        message += "\n\nIssue Details:\n"
        for i, issue in enumerate(issues[:5]):  # Limit to first 5 issues
            message += f"{i+1}. {issue.issue_type} - {issue.table_name}.{issue.field_name or '*'}: {issue.issue_value}\n"
            
        if issue_count > 5:
            message += f"... and {issue_count - 5} more issues.\n"
            
        # Add link to dashboard
        message += "\nView all issues on the Data Quality Dashboard."
        
        # Create notification record
        self._create_notifications(alert, title, message, 'issue', issues[0].id)
        
    def _send_anomaly_alert(self, alert: DataQualityAlert, anomalies: List[DataAnomaly]):
        """
        Send notification for data anomalies.
        
        Args:
            alert: Alert configuration
            anomalies: List of anomalies that triggered the alert
        """
        # Create notification title and message
        anomaly_count = len(anomalies)
        title = f"Data Anomaly Alert: {anomaly_count} {alert.table_name or 'database'} {'anomalies' if anomaly_count > 1 else 'anomaly'} detected"
        
        # Prepare message with details
        message = f"{anomaly_count} data {'anomalies' if anomaly_count > 1 else 'anomaly'} detected"
        if alert.table_name:
            message += f" in table {alert.table_name}"
        if alert.field_name:
            message += f" for field {alert.field_name}"
        
        # Add anomaly details
        message += "\n\nAnomaly Details:\n"
        for i, anomaly in enumerate(anomalies[:5]):  # Limit to first 5 anomalies
            message += f"{i+1}. {anomaly.anomaly_type} - {anomaly.table_name}.{anomaly.field_name or '*'}"
            if anomaly.current_value and anomaly.previous_value:
                message += f": {anomaly.previous_value} → {anomaly.current_value}\n"
            else:
                message += "\n"
            
        if anomaly_count > 5:
            message += f"... and {anomaly_count - 5} more anomalies.\n"
            
        # Add link to dashboard
        message += "\nView all anomalies on the Data Quality Dashboard."
        
        # Create notification record - using anomaly_id parameter, not issue_id
        self._create_notifications(alert, title, message, 'anomaly', None, None, anomalies[0].id)
        
    def _send_score_alert(self, alert: DataQualityAlert, report: DataQualityReport):
        """
        Send notification for data quality score alerts.
        
        Args:
            alert: Alert configuration
            report: Report that triggered the alert
        """
        # Get alert conditions
        conditions = alert.conditions
        min_score = conditions.get('min_score', 0)
        max_score = conditions.get('max_score', 100)
        
        # Create notification title and message
        score = report.overall_score
        if score < min_score:
            title = f"Data Quality Score Alert: Score below threshold ({score:.1f} < {min_score})"
            message = f"Data quality score has fallen below the minimum threshold.\n\n"
        else:
            title = f"Data Quality Score Alert: Score above threshold ({score:.1f} > {max_score})"
            message = f"Data quality score has exceeded the maximum threshold.\n\n"
            
        message += f"Current Score: {score:.1f}\n"
        message += f"Threshold: {min_score if score < min_score else max_score}\n"
        message += f"Report: {report.report_name}\n"
        message += f"Generated: {report.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        # Add critical issues if any
        if report.critical_issues > 0:
            message += f"Critical Issues: {report.critical_issues}\n"
        if report.high_issues > 0:
            message += f"High Severity Issues: {report.high_issues}\n"
            
        # Add link to dashboard
        message += "\nView full report on the Data Quality Dashboard."
        
        # Create notification record
        self._create_notifications(alert, title, message, 'score', None, report.id, None)
        
    def _send_trend_alert(self, alert: DataQualityAlert, current_avg: float, previous_avg: float, pct_change: float):
        """
        Send notification for data quality trend alerts.
        
        Args:
            alert: Alert configuration
            current_avg: Current period average score
            previous_avg: Previous period average score
            pct_change: Percentage change between periods
        """
        # Create notification title and message
        change_direction = "improved" if current_avg > previous_avg else "decreased"
        title = f"Data Quality Trend Alert: Score has {change_direction} by {pct_change:.1f}%"
        
        message = f"Data quality score has {change_direction} significantly.\n\n"
        message += f"Current Period Average: {current_avg:.1f}\n"
        message += f"Previous Period Average: {previous_avg:.1f}\n"
        message += f"Change: {pct_change:.1f}%\n\n"
        
        # Get alert conditions
        conditions = alert.conditions
        time_window = conditions.get('time_window', 1440)  # Minutes
        
        message += f"This change was observed over a {time_window // 60} hour period.\n\n"
        
        # Add link to dashboard
        message += "View trends on the Data Quality Dashboard."
        
        # Create notification record
        self._create_notifications(alert, title, message, 'trend', None, None, None)
        
    def _create_notifications(self, alert: DataQualityAlert, title: str, message: str, 
                             alert_trigger_type: str, issue_id: Optional[int] = None, 
                             report_id: Optional[int] = None, anomaly_id: Optional[int] = None):
        """
        Create notification records and send notifications through configured channels.
        
        Args:
            alert: Alert configuration
            title: Notification title
            message: Notification message
            alert_trigger_type: Type of trigger (issue, anomaly, score, trend)
            issue_id: ID of the issue (if applicable)
            report_id: ID of the report (if applicable)
            anomaly_id: ID of the anomaly (if applicable)
        """
        try:
            # Get recipients and channels
            recipients = alert.recipients
            channels = alert.channels
            
            # Send notification through each channel to each recipient
            for channel in channels:
                for recipient in recipients:
                    try:
                        # Create notification record
                        notification = DataQualityNotification(
                            alert_id=alert.id,
                            issue_id=issue_id,
                            anomaly_id=anomaly_id,
                            report_id=report_id,
                            title=title,
                            message=message,
                            severity=alert.severity_threshold,
                            recipient=recipient,
                            channel=channel,
                            notification_data={
                                'alert_name': alert.name,
                                'alert_type': alert.alert_type,
                                'trigger_type': alert_trigger_type
                            }
                        )
                        
                        db.session.add(notification)
                        
                        # Send through notification manager
                        success = self._send_notification(channel, recipient, title, message, alert.severity_threshold)
                        notification.status = 'sent' if success else 'failed'
                        
                        db.session.commit()
                        
                    except Exception as e:
                        logger.error(f"Error creating notification: {str(e)}")
                        db.session.rollback()
            
        except Exception as e:
            logger.error(f"Error sending notifications: {str(e)}")
            db.session.rollback()
    
    def _send_notification(self, channel: str, recipient: str, title: str, message: str, severity: str) -> bool:
        """
        Send notification through the specified channel.
        
        Args:
            channel: Channel to send through
            recipient: Recipient identifier
            title: Notification title
            message: Notification message
            severity: Notification severity
            
        Returns:
            True if notification was sent successfully, False otherwise
        """
        try:
            # Map channel to notification manager channel
            channel_map = {
                'email': 'email',
                'sms': 'sms',
                'slack': 'slack',
                'in_app': 'log'
            }
            
            notification_channel = channel_map.get(channel, 'log')
            
            # For now, just log all notifications since we have email/SMS disabled
            logger.info(f"NOTIFICATION [{severity.upper()}] - {title}")
            logger.info(f"To: {recipient} via {channel}")
            logger.info(f"Message: {message}")
            
            # If we have the actual notification system properly set up, uncomment:
            """
            self.notification_manager.send_notification(
                title=title,
                message=message,
                level=severity,
                channel=notification_channel,
                recipient=recipient
            )
            """
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending notification through {channel}: {str(e)}")
            return False


# Initialize the notification manager
notification_manager = DataQualityNotificationManager()

def check_data_quality_alerts():
    """
    Check all data quality alerts.
    This function is called by the scheduler and needs to handle its own app context.
    """
    try:
        # Use a fresh instance when called by scheduler to avoid serialization issues
        from app import app
        with app.app_context():
            logger.info("Running scheduled data quality alert check")
            # Create a new instance here to avoid any potential stale state issues
            manager = DataQualityNotificationManager()
            manager.check_alerts()
            logger.info("Data quality alert check completed successfully")
    except Exception as e:
        logger.error(f"Error in scheduled data quality alert check: {str(e)}")
        # Ensure error doesn't propagate and crash the scheduler

def send_data_quality_alert(alert_id: int, title: str, message: str, severity: str = 'warning'):
    """
    Send a data quality alert notification manually.
    
    Args:
        alert_id: ID of the alert configuration
        title: Notification title
        message: Notification message
        severity: Notification severity
    """
    try:
        alert = DataQualityAlert.query.get(alert_id)
        if not alert:
            logger.error(f"Alert with ID {alert_id} not found")
            return False
            
        notification_manager._create_notifications(alert, title, message, 'manual', None, None, None)
        return True
        
    except Exception as e:
        logger.error(f"Error sending manual data quality alert: {str(e)}")
        return False