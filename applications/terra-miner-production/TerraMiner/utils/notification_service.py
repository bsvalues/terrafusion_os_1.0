"""
Notification service for sending alerts through various channels.
"""
import os
import json
import logging
import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import requests

from app import db
from models import NotificationChannel, AlertNotificationMap

# Set up logger
logger = logging.getLogger(__name__)

class NotificationService:
    """
    Service for sending notifications through various channels.
    """
    
    def send_alert_notification(self, alert):
        """
        Send notification for a new alert through configured channels.
        
        Args:
            alert (MonitoringAlert): The alert to notify about
            
        Returns:
            bool: True if at least one notification was sent successfully
        """
        try:
            # Get notification channels that match the alert
            channels = self._get_channels_for_alert(alert)
            
            if not channels:
                logger.info(f"No notification channels configured for alert {alert.id}")
                return False
            
            success = False
            
            for channel in channels:
                try:
                    # Parse channel config
                    config = json.loads(channel.config) if channel.config else {}
                    
                    # Send notification based on channel type
                    if channel.channel_type == 'slack':
                        result = self.send_slack_notification(
                            message=alert.message,
                            severity=alert.severity,
                            component=alert.component,
                            details=alert.details,
                            webhook_url=config.get('webhook_url'),
                            channel_id=config.get('channel_id'),
                            bot_token=config.get('bot_token')
                        )
                        
                        if result:
                            logger.info(f"Sent Slack notification for alert {alert.id} to channel {channel.id}")
                            success = True
                        
                    elif channel.channel_type == 'email':
                        recipients = config.get('recipients', [])
                        
                        if recipients:
                            result = self.send_email_notification(
                                subject=f"[{alert.severity.upper()}] Alert: {alert.message}",
                                message=self._format_alert_email(alert),
                                recipients=recipients,
                                severity=alert.severity
                            )
                            
                            if result:
                                logger.info(f"Sent email notification for alert {alert.id} to channel {channel.id}")
                                success = True
                        
                    elif channel.channel_type == 'sms':
                        phone_numbers = config.get('phone_numbers', [])
                        
                        if phone_numbers:
                            result = self.send_sms_notification(
                                message=f"[{alert.severity.upper()}] {alert.message}",
                                phone_numbers=phone_numbers,
                                severity=alert.severity
                            )
                            
                            if result:
                                logger.info(f"Sent SMS notification for alert {alert.id} to channel {channel.id}")
                                success = True
                    
                    elif channel.channel_type == 'webhook':
                        result = self.send_webhook_notification(
                            alert=alert,
                            webhook_url=config.get('webhook_url'),
                            headers=config.get('headers', {})
                        )
                        
                        if result:
                            logger.info(f"Sent webhook notification for alert {alert.id} to channel {channel.id}")
                            success = True
                    
                except Exception as e:
                    logger.error(f"Error sending notification for channel {channel.id}: {str(e)}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending alert notification: {str(e)}")
            return False
    
    def _get_channels_for_alert(self, alert):
        """
        Get notification channels that should receive this alert.
        
        Args:
            alert (MonitoringAlert): The alert
            
        Returns:
            list: List of NotificationChannel objects
        """
        try:
            # Get all mappings that match this alert
            severity_levels = {
                'critical': 4,
                'error': 3,
                'warning': 2,
                'info': 1
            }
            
            alert_severity_level = severity_levels.get(alert.severity, 0)
            
            channels_query = (
                db.session.query(NotificationChannel)
                .join(
                    AlertNotificationMap, 
                    NotificationChannel.id == AlertNotificationMap.channel_id
                )
                .filter(
                    NotificationChannel.is_active == True,
                    AlertNotificationMap.is_active == True
                )
                .filter(
                    db.or_(
                        AlertNotificationMap.alert_type == '*',
                        AlertNotificationMap.alert_type == alert.alert_type
                    )
                )
            )
            
            # Filter by severity level (alert severity level must be >= the min_severity level)
            for severity, level in severity_levels.items():
                if level <= alert_severity_level:
                    channels_query = channels_query.filter(
                        db.or_(
                            AlertNotificationMap.min_severity == severity,
                            AlertNotificationMap.min_severity == '*'
                        )
                    )
            
            return channels_query.all()
            
        except Exception as e:
            logger.error(f"Error getting channels for alert: {str(e)}")
            return []
    
    def send_slack_notification(self, message, severity='info', component=None, details=None, webhook_url=None, channel_id=None, bot_token=None):
        """
        Send a notification to Slack.
        
        Args:
            message (str): The notification message
            severity (str): Severity level ('critical', 'error', 'warning', 'info')
            component (str, optional): Component that triggered the notification
            details (str, optional): Additional details as JSON string
            webhook_url (str, optional): Slack webhook URL
            channel_id (str, optional): Slack channel ID (requires bot_token)
            bot_token (str, optional): Slack bot token (requires channel_id)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Determine color based on severity
            color_map = {
                'critical': '#FF0000',  # Red
                'error': '#FF0000',     # Red
                'warning': '#FFA500',   # Orange
                'info': '#0000FF'       # Blue
            }
            color = color_map.get(severity, '#808080')  # Default: Gray
            
            # Parse details if provided
            details_dict = {}
            if details:
                try:
                    details_dict = json.loads(details)
                except:
                    details_dict = {'raw': details}
            
            # Build attachment fields
            fields = []
            
            if component:
                fields.append({
                    'title': 'Component',
                    'value': component,
                    'short': True
                })
            
            if details_dict:
                for key, value in details_dict.items():
                    # Skip internal fields
                    if key in ['rule_id', 'check_time', 'raw']:
                        continue
                        
                    # Format value
                    if isinstance(value, (int, float)):
                        value = str(value)
                    elif isinstance(value, dict):
                        value = json.dumps(value)
                        
                    fields.append({
                        'title': key.replace('_', ' ').title(),
                        'value': value,
                        'short': True
                    })
            
            # Build message payload
            attachment = {
                'color': color,
                'title': f"[{severity.upper()}] {message}",
                'text': '',
                'fields': fields,
                'footer': 'Monitoring System',
                'ts': int(time.time())
            }
            
            payload = {
                'attachments': [attachment]
            }
            
            # Use bot API if token and channel provided
            if bot_token and channel_id:
                # Use environment variable if available
                if bot_token == 'env':
                    bot_token = os.environ.get('SLACK_BOT_TOKEN')
                
                if not bot_token:
                    logger.error("Slack bot token not provided")
                    return False
                
                payload['channel'] = channel_id
                
                # Make API request
                response = requests.post(
                    'https://slack.com/api/chat.postMessage',
                    headers={
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': f'Bearer {bot_token}'
                    },
                    json=payload
                )
                
                if response.status_code == 200:
                    response_data = response.json()
                    if response_data.get('ok', False):
                        return True
                    else:
                        logger.error(f"Slack API error: {response_data.get('error', 'Unknown error')}")
                        return False
                else:
                    logger.error(f"Slack API HTTP error: {response.status_code}")
                    return False
            
            # Use webhook if provided
            elif webhook_url:
                # Use environment variable if available
                if webhook_url == 'env':
                    webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
                
                if not webhook_url:
                    logger.error("Slack webhook URL not provided")
                    return False
                
                # Make webhook request
                response = requests.post(
                    webhook_url,
                    headers={'Content-Type': 'application/json'},
                    json=payload
                )
                
                if response.status_code >= 200 and response.status_code < 300:
                    return True
                else:
                    logger.error(f"Slack webhook HTTP error: {response.status_code}")
                    return False
            
            else:
                logger.error("No Slack webhook URL or bot token provided")
                return False
            
        except Exception as e:
            logger.error(f"Error sending Slack notification: {str(e)}")
            return False
    
    def send_email_notification(self, subject, message, recipients, severity='info', attachments=None):
        """
        Send a notification email.
        
        Args:
            subject (str): Email subject
            message (str): Email message (HTML)
            recipients (list): List of email addresses
            severity (str): Severity level ('critical', 'error', 'warning', 'info')
            attachments (dict, optional): Dictionary of attachments with filename and content
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Try SendGrid first if available
            if self._send_email_sendgrid(subject, message, recipients, attachments):
                return True
            
            # Fall back to SMTP
            return self._send_email_smtp(subject, message, recipients, attachments)
            
        except Exception as e:
            logger.error(f"Error sending email notification: {str(e)}")
            return False
    
    def _send_email_sendgrid(self, subject, message, recipients, attachments=None):
        """
        Send email using SendGrid.
        
        Args:
            subject (str): Email subject
            message (str): Email message (HTML)
            recipients (list): List of email addresses
            attachments (dict, optional): Dictionary of attachments with filename and content
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Check if SendGrid is available
            sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
            if not sendgrid_api_key:
                return False
            
            # Import SendGrid here to avoid dependency if not used
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
            import base64
            
            # Create message
            mail = Mail(
                from_email=os.environ.get('SENDGRID_FROM_EMAIL', 'alerts@monitoring.system'),
                to_emails=recipients,
                subject=subject,
                html_content=message
            )
            
            # Add attachments if provided
            if attachments:
                for filename, content in attachments.items():
                    encoded_content = base64.b64encode(content).decode()
                    
                    attachment = Attachment()
                    attachment.file_content = FileContent(encoded_content)
                    attachment.file_name = FileName(filename)
                    
                    # Determine file type based on extension
                    file_type = 'application/octet-stream'
                    if filename.endswith('.pdf'):
                        file_type = 'application/pdf'
                    elif filename.endswith('.csv'):
                        file_type = 'text/csv'
                    elif filename.endswith('.xlsx'):
                        file_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    
                    attachment.file_type = FileType(file_type)
                    attachment.disposition = Disposition('attachment')
                    
                    mail.add_attachment(attachment)
            
            # Send email
            sg = SendGridAPIClient(sendgrid_api_key)
            response = sg.send(mail)
            
            if response.status_code >= 200 and response.status_code < 300:
                logger.info(f"Sent email via SendGrid to {len(recipients)} recipients")
                return True
            else:
                logger.error(f"SendGrid HTTP error: {response.status_code}")
                return False
            
        except Exception as e:
            logger.error(f"Error sending email via SendGrid: {str(e)}")
            return False
    
    def _send_email_smtp(self, subject, message, recipients, attachments=None):
        """
        Send email using SMTP.
        
        Args:
            subject (str): Email subject
            message (str): Email message (HTML)
            recipients (list): List of email addresses
            attachments (dict, optional): Dictionary of attachments with filename and content
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Get SMTP settings from environment variables
            smtp_host = os.environ.get('SMTP_HOST')
            smtp_port = os.environ.get('SMTP_PORT')
            smtp_username = os.environ.get('SMTP_USERNAME')
            smtp_password = os.environ.get('SMTP_PASSWORD')
            from_email = os.environ.get('SMTP_FROM_EMAIL', 'alerts@monitoring.system')
            
            if not all([smtp_host, smtp_port, smtp_username, smtp_password]):
                logger.error("SMTP settings not configured")
                return False
            
            # Create message
            for recipient in recipients:
                try:
                    msg = MIMEMultipart('alternative')
                    msg['Subject'] = subject
                    msg['From'] = from_email
                    msg['To'] = recipient
                    
                    # Attach HTML content
                    html_part = MIMEText(message, 'html')
                    msg.attach(html_part)
                    
                    # Add attachments if provided
                    if attachments:
                        for filename, content in attachments.items():
                            attachment = MIMEApplication(content)
                            attachment['Content-Disposition'] = f'attachment; filename="{filename}"'
                            msg.attach(attachment)
                    
                    # Connect to SMTP server
                    with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
                        server.starttls()
                        server.login(smtp_username, smtp_password)
                        server.sendmail(from_email, recipient, msg.as_string())
                    
                    logger.info(f"Sent email via SMTP to {recipient}")
                    
                except Exception as e:
                    logger.error(f"Error sending email to {recipient}: {str(e)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending email via SMTP: {str(e)}")
            return False
    
    def send_sms_notification(self, message, phone_numbers, severity='info'):
        """
        Send an SMS notification.
        
        Args:
            message (str): The notification message
            phone_numbers (list): List of phone numbers
            severity (str): Severity level ('critical', 'error', 'warning', 'info')
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Check if Twilio is available
            twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
            twilio_auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
            twilio_phone_number = os.environ.get('TWILIO_PHONE_NUMBER')
            
            if not all([twilio_account_sid, twilio_auth_token, twilio_phone_number]):
                logger.error("Twilio settings not configured")
                return False
            
            # Import Twilio here to avoid dependency if not used
            from twilio.rest import Client
            
            # Create Twilio client
            client = Client(twilio_account_sid, twilio_auth_token)
            
            # Only send SMS for critical and error alerts
            if severity not in ['critical', 'error'] and os.environ.get('SMS_ALL_SEVERITIES') != 'true':
                logger.info(f"Skipping SMS for {severity} alert")
                return True
            
            # Truncate message if too long
            max_length = 160
            if len(message) > max_length:
                message = message[:max_length-3] + '...'
            
            # Send SMS to each phone number
            success = False
            for phone_number in phone_numbers:
                try:
                    message_obj = client.messages.create(
                        body=message,
                        from_=twilio_phone_number,
                        to=phone_number
                    )
                    
                    logger.info(f"Sent SMS to {phone_number} (SID: {message_obj.sid})")
                    success = True
                    
                except Exception as e:
                    logger.error(f"Error sending SMS to {phone_number}: {str(e)}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending SMS notification: {str(e)}")
            return False
    
    def send_webhook_notification(self, alert, webhook_url, headers=None):
        """
        Send a notification to a webhook.
        
        Args:
            alert (MonitoringAlert): The alert to send
            webhook_url (str): Webhook URL
            headers (dict, optional): Additional headers to include
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not webhook_url:
                logger.error("Webhook URL not provided")
                return False
            
            # Build payload
            payload = {
                'id': alert.id,
                'type': alert.alert_type,
                'severity': alert.severity,
                'component': alert.component,
                'message': alert.message,
                'status': alert.status,
                'created_at': alert.created_at.isoformat(),
                'details': json.loads(alert.details) if alert.details else None
            }
            
            # Set default headers
            request_headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'Monitoring-System/1.0'
            }
            
            # Add custom headers
            if headers:
                request_headers.update(headers)
            
            # Send request
            response = requests.post(
                webhook_url,
                headers=request_headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code >= 200 and response.status_code < 300:
                logger.info(f"Sent webhook notification for alert {alert.id}")
                return True
            else:
                logger.error(f"Webhook HTTP error: {response.status_code}")
                return False
            
        except Exception as e:
            logger.error(f"Error sending webhook notification: {str(e)}")
            return False
    
    def _format_alert_email(self, alert):
        """
        Format an alert as an HTML email.
        
        Args:
            alert (MonitoringAlert): The alert
            
        Returns:
            str: HTML email content
        """
        try:
            # Parse details if available
            details_dict = {}
            if alert.details:
                try:
                    details_dict = json.loads(alert.details)
                except:
                    details_dict = {'raw': alert.details}
            
            # Determine color based on severity
            color_map = {
                'critical': '#FF0000',  # Red
                'error': '#FF0000',     # Red
                'warning': '#FFA500',   # Orange
                'info': '#0000FF'       # Blue
            }
            color = color_map.get(alert.severity, '#808080')  # Default: Gray
            
            # Build HTML
            html = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Alert Notification</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: {color}; color: white; padding: 10px 20px; margin-bottom: 20px; }}
                    .content {{ padding: 0 20px; }}
                    .footer {{ background-color: #f8f9fa; padding: 10px 20px; margin-top: 20px; font-size: 12px; color: #666; }}
                    table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
                    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                    th {{ background-color: #f2f2f2; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>[{alert.severity.upper()}] Alert Notification</h2>
                    </div>
                    
                    <div class="content">
                        <h3>{alert.message}</h3>
                        
                        <table>
                            <tr>
                                <th>ID</th>
                                <td>{alert.id}</td>
                            </tr>
                            <tr>
                                <th>Type</th>
                                <td>{alert.alert_type}</td>
                            </tr>
                            <tr>
                                <th>Component</th>
                                <td>{alert.component}</td>
                            </tr>
                            <tr>
                                <th>Severity</th>
                                <td>{alert.severity.upper()}</td>
                            </tr>
                            <tr>
                                <th>Status</th>
                                <td>{alert.status.upper()}</td>
                            </tr>
                            <tr>
                                <th>Created At</th>
                                <td>{alert.created_at.strftime('%Y-%m-%d %H:%M:%S')}</td>
                            </tr>
                        </table>
            """
            
            # Add details if available
            if details_dict:
                html += """
                        <h4>Details</h4>
                        <table>
                """
                
                for key, value in details_dict.items():
                    # Skip internal fields
                    if key in ['rule_id', 'raw']:
                        continue
                        
                    # Format value
                    if isinstance(value, (dict, list)):
                        value = json.dumps(value, indent=2)
                        html += f"""
                            <tr>
                                <th>{key.replace('_', ' ').title()}</th>
                                <td><pre>{value}</pre></td>
                            </tr>
                        """
                    else:
                        html += f"""
                            <tr>
                                <th>{key.replace('_', ' ').title()}</th>
                                <td>{value}</td>
                            </tr>
                        """
                
                html += """
                        </table>
                """
            
            # Close HTML
            html += """
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated message from the Monitoring System.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            return html
            
        except Exception as e:
            logger.error(f"Error formatting alert email: {str(e)}")
            
            # Return simple fallback HTML
            return f"""
            <html>
            <body>
                <h2>[{alert.severity.upper()}] {alert.message}</h2>
                <p>Alert ID: {alert.id}</p>
                <p>Component: {alert.component}</p>
                <p>Type: {alert.alert_type}</p>
                <p>Status: {alert.status}</p>
                <p>Created: {alert.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
            </body>
            </html>
            """