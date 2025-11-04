"""
Enhanced Notification/Alerting System for Sync Service

This module provides a configurable notification system that supports multiple
channels (email, SMS, Slack, system logs) with severity-based routing.
"""
import logging
import datetime
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from typing import Dict, Any, List, Callable, Optional, Union, Set, Tuple

from app import db
from sync_service.models import SyncJob, SyncLog, SyncConflict, GlobalSetting
from sync_service.app_context import with_app_context

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class NotificationChannel:
    """Base class for notification channels"""
    
    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None):
        """Initialize a notification channel
        
        Args:
            name: Name of the channel
            config: Configuration for the channel
        """
        self.name = name
        self.config = config or {}
    
    def send(self, 
           subject: str, 
           message: str, 
           severity: str = 'info',
           metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Send a notification message
        
        Args:
            subject: Subject line
            message: Message body
            severity: Severity level ('info', 'warning', 'error', 'critical')
            metadata: Additional metadata
            
        Returns:
            True if message was sent successfully, False otherwise
        """
        raise NotImplementedError("Subclasses must implement send")
    
    def format_message(self, 
                     subject: str, 
                     message: str, 
                     severity: str,
                     metadata: Optional[Dict[str, Any]]) -> str:
        """Format a message for this channel
        
        Args:
            subject: Subject line
            message: Message body
            severity: Severity level
            metadata: Additional metadata
            
        Returns:
            Formatted message
        """
        formatted_msg = f"{subject}\n\n{message}"
        
        if metadata:
            formatted_msg += "\n\nMetadata:\n"
            for key, value in metadata.items():
                formatted_msg += f"  {key}: {value}\n"
        
        return formatted_msg
    
    def __repr__(self):
        return f"<NotificationChannel {self.name}>"


class EmailChannel(NotificationChannel):
    """Email notification channel"""
    
    def send(self, 
           subject: str, 
           message: str, 
           severity: str = 'info',
           metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Send a notification via email
        
        Args:
            subject: Subject line
            message: Message body
            severity: Severity level
            metadata: Additional metadata
            
        Returns:
            True if message was sent successfully, False otherwise
        """
        try:
            # Get configuration
            smtp_server = self.config.get('smtp_server', 'localhost')
            smtp_port = self.config.get('smtp_port', 587)
            username = self.config.get('username')
            password = self.config.get('password')
            from_addr = self.config.get('from_address', 'sync-service@example.com')
            to_addrs = self.config.get('to_addresses', [])
            
            if not to_addrs:
                logger.error("No recipient addresses configured for email notifications")
                return False
            
            # Format the message
            formatted_msg = self.format_message(subject, message, severity, metadata)
            
            # Create a MIME message
            msg = MIMEMultipart()
            msg['From'] = from_addr
            msg['To'] = ', '.join(to_addrs)
            msg['Subject'] = f"[{severity.upper()}] {subject}"
            
            # Attach message body
            msg.attach(MIMEText(formatted_msg, 'plain'))
            
            # Connect to SMTP server and send message
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                if username and password:
                    server.starttls()
                    server.login(username, password)
                
                server.send_message(msg)
            
            logger.info(f"Sent email notification: {subject} to {to_addrs}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email notification: {str(e)}")
            return False


class SMSChannel(NotificationChannel):
    """SMS notification channel (via API)"""
    
    def send(self, 
           subject: str, 
           message: str, 
           severity: str = 'info',
           metadata: Dict[str, Any] = None) -> bool:
        """Send a notification via SMS
        
        Args:
            subject: Subject line
            message: Message body
            severity: Severity level
            metadata: Additional metadata
            
        Returns:
            True if message was sent successfully, False otherwise
        """
        try:
            # Get configuration
            api_url = self.config.get('api_url')
            api_key = self.config.get('api_key')
            api_secret = self.config.get('api_secret')
            from_number = self.config.get('from_number')
            to_numbers = self.config.get('to_numbers', [])
            
            if not api_url or not to_numbers:
                logger.error("Missing SMS API configuration")
                return False
            
            # Format the message (keep it short for SMS)
            sms_text = f"[{severity.upper()}] {subject}: {message[:100]}"
            if len(message) > 100:
                sms_text += "..."
            
            # Add most important metadata
            if metadata and 'job_id' in metadata:
                sms_text += f" (Job: {metadata['job_id']})"
            
            # Send SMS via API
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {api_key}"
            }
            
            success = True
            for to_number in to_numbers:
                payload = {
                    'from': from_number,
                    'to': to_number,
                    'text': sms_text
                }
                
                if api_secret:
                    payload['api_secret'] = api_secret
                
                response = requests.post(api_url, json=payload, headers=headers)
                
                if not response.ok:
                    logger.error(f"SMS API error: {response.status_code} {response.text}")
                    success = False
            
            if success:
                logger.info(f"Sent SMS notifications to {len(to_numbers)} recipients")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to send SMS notification: {str(e)}")
            return False


class SlackChannel(NotificationChannel):
    """Slack notification channel (via webhooks)"""
    
    def send(self, 
           subject: str, 
           message: str, 
           severity: str = 'info',
           metadata: Dict[str, Any] = None) -> bool:
        """Send a notification via Slack webhook
        
        Args:
            subject: Subject line
            message: Message body
            severity: Severity level
            metadata: Additional metadata
            
        Returns:
            True if message was sent successfully, False otherwise
        """
        try:
            # Get configuration
            webhook_url = self.config.get('webhook_url')
            channel = self.config.get('channel')
            username = self.config.get('username', 'Sync Service')
            
            if not webhook_url:
                logger.error("Missing Slack webhook URL")
                return False
            
            # Determine emoji based on severity
            emoji = {
                'info': ':information_source:',
                'warning': ':warning:',
                'error': ':x:',
                'critical': ':sos:'
            }.get(severity.lower(), ':bell:')
            
            # Format the message for Slack
            slack_text = f"{emoji} *{subject}*\n{message}"
            
            # Add metadata as a code block
            if metadata:
                meta_text = json.dumps(metadata, indent=2)
                slack_text += f"\n```{meta_text}```"
            
            # Prepare payload
            payload = {
                'text': slack_text,
                'username': username
            }
            
            if channel:
                payload['channel'] = channel
            
            # Send to Slack webhook
            response = requests.post(webhook_url, json=payload)
            
            if not response.ok:
                logger.error(f"Slack API error: {response.status_code} {response.text}")
                return False
            
            logger.info(f"Sent Slack notification: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {str(e)}")
            return False


class LogChannel(NotificationChannel):
    """System log notification channel"""
    
    def send(self, 
           subject: str, 
           message: str, 
           severity: str = 'info',
           metadata: Dict[str, Any] = None) -> bool:
        """Send a notification to system logs
        
        Args:
            subject: Subject line
            message: Message body
            severity: Severity level
            metadata: Additional metadata
            
        Returns:
            True if message was sent successfully, False otherwise
        """
        try:
            # Format the message
            formatted_msg = self.format_message(subject, message, severity, metadata)
            
            # Log at the appropriate level
            if severity.lower() == 'critical':
                logger.critical(formatted_msg)
            elif severity.lower() == 'error':
                logger.error(formatted_msg)
            elif severity.lower() == 'warning':
                logger.warning(formatted_msg)
            else:
                logger.info(formatted_msg)
            
            return True
            
        except Exception as e:
            # Fallback to error log
            logger.error(f"Failed to log notification: {str(e)}")
            return False


class SyncNotificationLog(db.Model):
    """Log of notifications sent"""
    __tablename__ = 'sync_notification_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(50), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    subject = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(50), nullable=False)
    
    channel = db.Column(db.String(50), nullable=False)
    recipient = db.Column(db.String(255))
    success = db.Column(db.Boolean, default=False)
    
    meta_data = db.Column(db.JSON)  # Changed from metadata to meta_data
    
    def __repr__(self):
        return f"<SyncNotificationLog {self.id} [{self.severity}] {self.channel}>"


class SyncNotificationManager:
    """Manages notifications for the sync service"""
    
    def __init__(self):
        """Initialize the notification manager"""
        self.channels: Dict[str, NotificationChannel] = {}
        self.severity_routes: Dict[str, List[str]] = {
            'info': ['log'],
            'warning': ['log', 'email'],
            'error': ['log', 'email', 'slack'],
            'critical': ['log', 'email', 'slack', 'sms']
        }
        
        # Register default channels
        self.register_channel(LogChannel('log'))
    
    def register_channel(self, channel: NotificationChannel) -> None:
        """Register a notification channel
        
        Args:
            channel: The channel to register
        """
        self.channels[channel.name] = channel
        logger.info(f"Registered notification channel: {channel.name}")
    
    def configure_email(self, config: Dict[str, Any]) -> None:
        """Configure the email notification channel
        
        Args:
            config: Email configuration
        """
        self.register_channel(EmailChannel('email', config))
    
    def configure_sms(self, config: Dict[str, Any]) -> None:
        """Configure the SMS notification channel
        
        Args:
            config: SMS configuration
        """
        self.register_channel(SMSChannel('sms', config))
    
    def configure_slack(self, config: Dict[str, Any]) -> None:
        """Configure the Slack notification channel
        
        Args:
            config: Slack configuration
        """
        self.register_channel(SlackChannel('slack', config))
    
    def set_severity_routes(self, routes: Dict[str, List[str]]) -> None:
        """Set the severity routing configuration
        
        Args:
            routes: Mapping of severity levels to channel names
        """
        self.severity_routes = routes
    
    @with_app_context
    def notify(self, 
             subject: str, 
             message: str, 
             severity: str = 'info',
             job_id: str = None,
             metadata: Dict[str, Any] = None) -> bool:
        """Send a notification
        
        Args:
            subject: Subject line
            message: Message body
            severity: Severity level ('info', 'warning', 'error', 'critical')
            job_id: ID of the related sync job
            metadata: Additional metadata
            
        Returns:
            True if at least one notification was sent successfully
        """
        if metadata is None:
            metadata = {}
            
        if job_id:
            metadata['job_id'] = job_id
        
        # Get channels for this severity level
        channel_names = self.severity_routes.get(severity.lower(), ['log'])
        
        # Send to each channel
        success = False
        for channel_name in channel_names:
            channel = self.channels.get(channel_name)
            
            if not channel:
                logger.warning(f"Notification channel not found: {channel_name}")
                continue
            
            # Send notification
            result = channel.send(subject, message, severity, metadata)
            
            # Log the notification
            self._log_notification(
                subject=subject,
                message=message,
                severity=severity,
                channel=channel_name,
                success=result,
                job_id=job_id,
                metadata=metadata
            )
            
            if result:
                success = True
        
        return success
    
    @with_app_context
    def notify_job_success(self, job_id: str) -> bool:
        """Send notification for successful job completion
        
        Args:
            job_id: ID of the completed job
            
        Returns:
            True if notification was sent successfully
        """
        # Get job details
        job = SyncJob.query.filter_by(job_id=job_id).first()
        
        if not job:
            logger.warning(f"Cannot notify job success: Job {job_id} not found")
            return False
        
        # Build notification
        subject = f"Sync job completed successfully: {job.name}"
        message = f"The sync job of type '{job.job_type}' has completed successfully."
        
        if job.total_records > 0:
            message += f"\n\nRecords processed: {job.processed_records}/{job.total_records}"
            
        # Include duration if available
        if job.duration_seconds:
            minutes, seconds = divmod(job.duration_seconds, 60)
            duration = f"{minutes}m {seconds}s"
            message += f"\nDuration: {duration}"
        
        # Send notification
        metadata = {
            'job_type': job.job_type,
            'total_records': job.total_records,
            'processed_records': job.processed_records,
            'error_records': job.error_records,
            'duration_seconds': job.duration_seconds
        }
        
        return self.notify(subject, message, 'info', job_id, metadata)
    
    @with_app_context
    def notify_job_failure(self, job_id: str) -> bool:
        """Send notification for job failure
        
        Args:
            job_id: ID of the failed job
            
        Returns:
            True if notification was sent successfully
        """
        # Get job details
        job = SyncJob.query.filter_by(job_id=job_id).first()
        
        if not job:
            logger.warning(f"Cannot notify job failure: Job {job_id} not found")
            return False
        
        # Get error details
        error_logs = SyncLog.query.filter_by(
            job_id=job_id, 
            level='ERROR'
        ).order_by(SyncLog.created_at.desc()).limit(5).all()
        
        # Build notification
        subject = f"Sync job failed: {job.name}"
        message = f"The sync job of type '{job.job_type}' has failed."
        
        if job.error_details:
            if isinstance(job.error_details, dict):
                error_msg = job.error_details.get('message', 'Unknown error')
            else:
                error_msg = str(job.error_details)
            
            message += f"\n\nError details: {error_msg}"
        
        if error_logs:
            message += "\n\nRecent error logs:"
            for log in error_logs:
                message += f"\n- {log.message}"
        
        # Send notification
        metadata = {
            'job_type': job.job_type,
            'total_records': job.total_records,
            'processed_records': job.processed_records,
            'error_records': job.error_records,
            'error_details': job.error_details
        }
        
        return self.notify(subject, message, 'error', job_id, metadata)
    
    @with_app_context
    def notify_conflicts(self, job_id: str) -> bool:
        """Send notification about synchronization conflicts
        
        Args:
            job_id: ID of the job with conflicts
            
        Returns:
            True if notification was sent successfully
        """
        # Get job details
        job = SyncJob.query.filter_by(job_id=job_id).first()
        
        if not job:
            logger.warning(f"Cannot notify conflicts: Job {job_id} not found")
            return False
        
        # Get conflict details
        conflicts = SyncConflict.query.filter_by(
            job_id=job_id, 
            resolution_status='pending'
        ).all()
        
        if not conflicts:
            logger.info(f"No pending conflicts found for job {job_id}")
            return False
        
        # Group conflicts by table
        conflicts_by_table = {}
        for conflict in conflicts:
            if conflict.table_name not in conflicts_by_table:
                conflicts_by_table[conflict.table_name] = []
            conflicts_by_table[conflict.table_name].append(conflict)
        
        # Build notification
        subject = f"Sync conflicts detected: {job.name}"
        message = f"The sync job of type '{job.job_type}' has detected {len(conflicts)} data conflicts that require resolution."
        
        message += "\n\nConflicts by table:"
        for table_name, table_conflicts in conflicts_by_table.items():
            message += f"\n- {table_name}: {len(table_conflicts)} conflicts"
        
        message += "\n\nPlease review and resolve these conflicts in the conflict resolution interface."
        
        # Determine severity based on conflict count
        severity = 'info'
        if len(conflicts) > 50:
            severity = 'warning'
        if len(conflicts) > 100:
            severity = 'error'
        
        # Send notification
        metadata = {
            'job_type': job.job_type,
            'conflict_count': len(conflicts),
            'tables_affected': len(conflicts_by_table)
        }
        
        return self.notify(subject, message, severity, job_id, metadata)
    
    @with_app_context
    def _log_notification(self, 
                        subject: str, 
                        message: str,
                        severity: str,
                        channel: str,
                        success: bool,
                        job_id: str = None,
                        metadata: Dict[str, Any] = None) -> None:
        """Log a notification
        
        Args:
            subject: Subject line
            message: Message body
            severity: Severity level
            channel: Channel name
            success: Whether the notification was sent successfully
            job_id: ID of the related sync job
            metadata: Additional metadata
        """
        try:
            # Create notification log entry
            log_entry = SyncNotificationLog(
                job_id=job_id,
                subject=subject,
                message=message,
                severity=severity,
                channel=channel,
                success=success,
                meta_data=metadata
            )
            
            # Add to session and commit
            db.session.add(log_entry)
            db.session.commit()
            
            # Also add to sync log if job ID is provided
            if job_id:
                # Create a new SyncLog instance
                sync_log = SyncLog()
                sync_log.job_id = job_id
                sync_log.level = 'INFO'
                sync_log.message = f"Notification sent via {channel}: {subject}"
                sync_log.component = 'NotificationManager'
                
                db.session.add(sync_log)
                db.session.commit()
                
        except Exception as e:
            logger.error(f"Failed to log notification: {str(e)}")


# Create a singleton instance of the notification manager
notification_manager = SyncNotificationManager()


# Configure notification manager from settings
@with_app_context
def configure_notification_manager() -> None:
    """Configure the notification manager from global settings"""
    try:
        # Get global settings
        settings = GlobalSetting.query.first()
        
        if not settings:
            logger.warning("No global settings found for notification configuration")
            return
        
        # Configure email if enabled
        if hasattr(settings, 'notification_email') and settings.notification_email:
            notification_manager.configure_email({
                'smtp_server': getattr(settings, 'smtp_server', 'localhost'),
                'smtp_port': getattr(settings, 'smtp_port', 587),
                'username': getattr(settings, 'smtp_username', None),
                'password': getattr(settings, 'smtp_password', None),
                'from_address': getattr(settings, 'notification_from_email', 'sync-service@example.com'),
                'to_addresses': [settings.notification_email]
            })
        
        # Configure SMS if enabled
        sms_enabled = getattr(settings, 'sms_notifications_enabled', False)
        if sms_enabled:
            notification_manager.configure_sms({
                'api_url': getattr(settings, 'sms_api_url', None),
                'api_key': getattr(settings, 'sms_api_key', None),
                'api_secret': getattr(settings, 'sms_api_secret', None),
                'from_number': getattr(settings, 'sms_from_number', None),
                'to_numbers': getattr(settings, 'sms_to_numbers', [])
            })
        
        # Configure Slack if enabled
        slack_enabled = getattr(settings, 'slack_notifications_enabled', False)
        if slack_enabled:
            notification_manager.configure_slack({
                'webhook_url': getattr(settings, 'slack_webhook_url', None),
                'channel': getattr(settings, 'slack_channel', None),
                'username': getattr(settings, 'slack_username', 'Sync Service')
            })
        
        logger.info("Notification manager configured successfully")
        
    except Exception as e:
        logger.error(f"Failed to configure notification manager: {str(e)}")


# Helper functions

def notify(subject: str, 
         message: str, 
         severity: str = 'info',
         job_id: str = None,
         metadata: Dict[str, Any] = None) -> bool:
    """Send a notification using the notification manager
    
    Args:
        subject: Subject line
        message: Message body
        severity: Severity level ('info', 'warning', 'error', 'critical')
        job_id: ID of the related sync job
        metadata: Additional metadata
        
    Returns:
        True if at least one notification was sent successfully
    """
    return notification_manager.notify(subject, message, severity, job_id, metadata)


def notify_job_success(job_id: str) -> bool:
    """Send notification for successful job completion
    
    Args:
        job_id: ID of the completed job
        
    Returns:
        True if notification was sent successfully
    """
    return notification_manager.notify_job_success(job_id)


def notify_job_failure(job_id: str) -> bool:
    """Send notification for job failure
    
    Args:
        job_id: ID of the failed job
        
    Returns:
        True if notification was sent successfully
    """
    return notification_manager.notify_job_failure(job_id)


def notify_conflicts(job_id: str) -> bool:
    """Send notification about synchronization conflicts
    
    Args:
        job_id: ID of the job with conflicts
        
    Returns:
        True if notification was sent successfully
    """
    return notification_manager.notify_conflicts(job_id)