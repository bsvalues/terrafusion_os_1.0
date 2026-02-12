"""
Unit tests for the Enhanced Notification/Alerting System
"""
import unittest
import datetime
from unittest.mock import patch, MagicMock, call

from app import db, app
from sync_service.notification_system import (
    NotificationChannel, EmailChannel, SMSChannel, SlackChannel, LogChannel,
    SyncNotificationManager, SyncNotificationLog, 
    notify, notify_job_success, notify_job_failure, notify_conflicts
)
from sync_service.models import SyncJob, SyncLog, SyncConflict


class TestNotificationChannel(unittest.TestCase):
    """Test suite for notification channels"""
    
    def setUp(self):
        """Set up test environment"""
        self.app_context = app.app_context()
        self.app_context.push()
    
    def tearDown(self):
        """Clean up after tests"""
        self.app_context.pop()
    
    def test_base_channel(self):
        """Test base notification channel"""
        # The base class should raise NotImplementedError for send
        channel = NotificationChannel("test")
        with self.assertRaises(NotImplementedError):
            channel.send("Subject", "Message")
        
        # Test format message
        formatted = channel.format_message(
            subject="Test Subject",
            message="Test Message",
            severity="info",
            metadata={"key": "value"}
        )
        
        self.assertIn("Test Subject", formatted)
        self.assertIn("Test Message", formatted)
        self.assertIn("key: value", formatted)
        
        # Test repr
        self.assertIn("test", repr(channel))
    
    @patch('smtplib.SMTP')
    def test_email_channel(self, mock_smtp):
        """Test email notification channel"""
        # Setup mock
        mock_smtp_instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_smtp_instance
        
        # Create channel with config
        channel = EmailChannel("email", {
            "smtp_server": "smtp.example.com",
            "smtp_port": 587,
            "username": "user",
            "password": "pass",
            "from_address": "sender@example.com",
            "to_addresses": ["recipient@example.com"]
        })
        
        # Test sending
        result = channel.send(
            subject="Test Subject",
            message="Test Message",
            severity="warning",
            metadata={"key": "value"}
        )
        
        # Verify SMTP was used correctly
        mock_smtp.assert_called_with("smtp.example.com", 587)
        mock_smtp_instance.starttls.assert_called_once()
        mock_smtp_instance.login.assert_called_with("user", "pass")
        mock_smtp_instance.send_message.assert_called_once()
        
        # Verify result
        self.assertTrue(result)
        
        # Test without recipients
        channel_no_recipients = EmailChannel("email", {
            "smtp_server": "smtp.example.com"
        })
        
        result = channel_no_recipients.send("Subject", "Message")
        self.assertFalse(result)
    
    @patch('requests.post')
    def test_sms_channel(self, mock_post):
        """Test SMS notification channel"""
        # Setup mock
        mock_response = MagicMock()
        mock_response.ok = True
        mock_post.return_value = mock_response
        
        # Create channel with config
        channel = SMSChannel("sms", {
            "api_url": "https://sms-api.example.com/send",
            "api_key": "api-key",
            "api_secret": "api-secret",
            "from_number": "12345",
            "to_numbers": ["67890", "98765"]
        })
        
        # Test sending
        result = channel.send(
            subject="Test Subject",
            message="Test Message",
            severity="error",
            metadata={"job_id": "job-123"}
        )
        
        # Verify API was called correctly
        mock_post.assert_called()
        call_args = mock_post.call_args_list
        
        # Should have two calls (one for each recipient)
        self.assertEqual(len(call_args), 2)
        
        # Verify headers and payload
        for args in call_args:
            self.assertEqual(args[0][0], "https://sms-api.example.com/send")
            self.assertIn("Authorization", args[1]["headers"])
            self.assertIn("api_secret", args[1]["json"])
            self.assertEqual(args[1]["json"]["from"], "12345")
            self.assertIn(args[1]["json"]["to"], ["67890", "98765"])
            self.assertIn("[ERROR]", args[1]["json"]["text"])
            self.assertIn("Test Subject", args[1]["json"]["text"])
            self.assertIn("job-123", args[1]["json"]["text"])
        
        # Verify result
        self.assertTrue(result)
        
        # Test with missing config
        channel_missing_config = SMSChannel("sms", {})
        result = channel_missing_config.send("Subject", "Message")
        self.assertFalse(result)
        
        # Test with API error
        mock_response.ok = False
        result = channel.send("Subject", "Message")
        self.assertFalse(result)
    
    @patch('requests.post')
    def test_slack_channel(self, mock_post):
        """Test Slack notification channel"""
        # Setup mock
        mock_response = MagicMock()
        mock_response.ok = True
        mock_post.return_value = mock_response
        
        # Create channel with config
        channel = SlackChannel("slack", {
            "webhook_url": "https://hooks.slack.com/services/test",
            "channel": "#alerts",
            "username": "Sync Bot"
        })
        
        # Test sending
        result = channel.send(
            subject="Test Subject",
            message="Test Message",
            severity="critical",
            metadata={"job_id": "job-123"}
        )
        
        # Verify webhook was called correctly
        mock_post.assert_called_with(
            "https://hooks.slack.com/services/test",
            json={
                "text": mock_post.call_args[1]["json"]["text"],
                "username": "Sync Bot",
                "channel": "#alerts"
            }
        )
        
        # Check message content
        text = mock_post.call_args[1]["json"]["text"]
        self.assertIn("Test Subject", text)
        self.assertIn("Test Message", text)
        self.assertIn("job-123", text)
        
        # Verify result
        self.assertTrue(result)
        
        # Test with missing webhook URL
        channel_missing_url = SlackChannel("slack", {})
        result = channel_missing_url.send("Subject", "Message")
        self.assertFalse(result)
        
        # Test with API error
        mock_response.ok = False
        result = channel.send("Subject", "Message")
        self.assertFalse(result)
    
    @patch('logging.Logger.info')
    @patch('logging.Logger.warning')
    @patch('logging.Logger.error')
    @patch('logging.Logger.critical')
    def test_log_channel(self, mock_critical, mock_error, mock_warning, mock_info):
        """Test log notification channel"""
        # Create channel
        channel = LogChannel("log")
        
        # Test info level
        result = channel.send("Info Subject", "Info Message", "info")
        mock_info.assert_called()
        self.assertTrue(result)
        
        # Test warning level
        result = channel.send("Warning Subject", "Warning Message", "warning")
        mock_warning.assert_called()
        self.assertTrue(result)
        
        # Test error level
        result = channel.send("Error Subject", "Error Message", "error")
        mock_error.assert_called()
        self.assertTrue(result)
        
        # Test critical level
        result = channel.send("Critical Subject", "Critical Message", "critical")
        mock_critical.assert_called()
        self.assertTrue(result)


class TestNotificationManager(unittest.TestCase):
    """Test suite for notification manager"""
    
    def setUp(self):
        """Set up test environment"""
        self.app_context = app.app_context()
        self.app_context.push()
        
        # Mock database
        self.patcher = patch('sync_service.notification_system.db')
        self.mock_db = self.patcher.start()
        
        # Create manager
        self.manager = SyncNotificationManager()
        
        # Create mock channels
        self.mock_log_channel = MagicMock()
        self.mock_log_channel.name = "log"
        self.mock_log_channel.send.return_value = True
        
        self.mock_email_channel = MagicMock()
        self.mock_email_channel.name = "email"
        self.mock_email_channel.send.return_value = True
        
        self.mock_sms_channel = MagicMock()
        self.mock_sms_channel.name = "sms"
        self.mock_sms_channel.send.return_value = True
        
        self.mock_slack_channel = MagicMock()
        self.mock_slack_channel.name = "slack"
        self.mock_slack_channel.send.return_value = True
        
        # Register mock channels
        self.manager.channels = {
            "log": self.mock_log_channel,
            "email": self.mock_email_channel,
            "sms": self.mock_sms_channel,
            "slack": self.mock_slack_channel
        }
        
        # Patch SyncJob, SyncLog, and SyncConflict query
        self.job_patcher = patch('sync_service.notification_system.SyncJob')
        self.mock_job = self.job_patcher.start()
        
        self.log_patcher = patch('sync_service.notification_system.SyncLog')
        self.mock_log = self.log_patcher.start()
        
        self.conflict_patcher = patch('sync_service.notification_system.SyncConflict')
        self.mock_conflict = self.conflict_patcher.start()
        
        # Setup test job
        self.mock_job_instance = MagicMock()
        self.mock_job_instance.job_id = "test-job-123"
        self.mock_job_instance.name = "Test Job"
        self.mock_job_instance.job_type = "test"
        self.mock_job_instance.total_records = 100
        self.mock_job_instance.processed_records = 90
        self.mock_job_instance.error_records = 10
        self.mock_job_instance.duration_seconds = 60
        self.mock_job_instance.error_details = {"message": "Test error"}
        
        # Configure job query
        self.mock_job.query.filter_by.return_value.first.return_value = self.mock_job_instance
        
        # Setup error logs
        self.mock_error_logs = [
            MagicMock(message="Error 1"),
            MagicMock(message="Error 2")
        ]
        
        # Configure log query
        self.mock_log.query.filter_by.return_value.order_by.return_value.limit.return_value.all.return_value = self.mock_error_logs
        
        # Setup conflicts
        self.mock_conflicts = [
            MagicMock(table_name="table1"),
            MagicMock(table_name="table1"),
            MagicMock(table_name="table2")
        ]
        
        # Configure conflict query
        self.mock_conflict.query.filter_by.return_value.all.return_value = self.mock_conflicts
    
    def tearDown(self):
        """Clean up after tests"""
        self.patcher.stop()
        self.job_patcher.stop()
        self.log_patcher.stop()
        self.conflict_patcher.stop()
        self.app_context.pop()
    
    def test_register_channel(self):
        """Test registering a channel"""
        # Create a new manager without mocked channels
        manager = SyncNotificationManager()
        
        # Only log channel should be registered by default
        self.assertIn("log", manager.channels)
        self.assertEqual(len(manager.channels), 1)
        
        # Register a new channel
        channel = MagicMock()
        channel.name = "test_channel"
        manager.register_channel(channel)
        
        # Verify channel was added
        self.assertIn("test_channel", manager.channels)
        self.assertEqual(manager.channels["test_channel"], channel)
    
    def test_configure_channels(self):
        """Test channel configuration methods"""
        # Create a new manager without mocked channels
        manager = SyncNotificationManager()
        
        # Test email configuration
        manager.configure_email({
            "smtp_server": "smtp.example.com",
            "to_addresses": ["test@example.com"]
        })
        
        self.assertIn("email", manager.channels)
        self.assertIsInstance(manager.channels["email"], EmailChannel)
        
        # Test SMS configuration
        manager.configure_sms({
            "api_url": "https://api.example.com",
            "to_numbers": ["12345"]
        })
        
        self.assertIn("sms", manager.channels)
        self.assertIsInstance(manager.channels["sms"], SMSChannel)
        
        # Test Slack configuration
        manager.configure_slack({
            "webhook_url": "https://hooks.slack.com/test"
        })
        
        self.assertIn("slack", manager.channels)
        self.assertIsInstance(manager.channels["slack"], SlackChannel)
    
    def test_set_severity_routes(self):
        """Test setting severity routes"""
        # Define custom routes
        routes = {
            "info": ["log"],
            "warning": ["log", "slack"],
            "error": ["log", "email", "slack"],
            "critical": ["log", "email", "sms", "slack"]
        }
        
        # Set routes
        self.manager.set_severity_routes(routes)
        
        # Verify routes were set
        self.assertEqual(self.manager.severity_routes, routes)
    
    def test_notify(self):
        """Test sending notifications"""
        # Patch log_notification method
        with patch.object(self.manager, '_log_notification') as mock_log_notification:
            # Test info notification (should only use log channel)
            result = self.manager.notify(
                subject="Info Subject",
                message="Info Message",
                severity="info",
                job_id="test-job-123",
                metadata={"test": "value"}
            )
            
            # Verify correct channel was used
            self.mock_log_channel.send.assert_called_with(
                "Info Subject", "Info Message", "info", {"test": "value", "job_id": "test-job-123"}
            )
            
            # Verify logging
            mock_log_notification.assert_called()
            
            # Verify result
            self.assertTrue(result)
            
            # Reset mocks
            self.mock_log_channel.reset_mock()
            self.mock_email_channel.reset_mock()
            self.mock_slack_channel.reset_mock()
            self.mock_sms_channel.reset_mock()
            mock_log_notification.reset_mock()
            
            # Test critical notification (should use all channels)
            result = self.manager.notify(
                subject="Critical Subject",
                message="Critical Message",
                severity="critical"
            )
            
            # Verify all channels were used
            self.mock_log_channel.send.assert_called()
            self.mock_email_channel.send.assert_called()
            self.mock_slack_channel.send.assert_called()
            self.mock_sms_channel.send.assert_called()
            
            # Verify result
            self.assertTrue(result)
            
            # Test with non-existent channel
            self.manager.severity_routes["test"] = ["non_existent"]
            
            result = self.manager.notify(
                subject="Test Subject",
                message="Test Message",
                severity="test"
            )
            
            # Should fallback to log channel
            self.mock_log_channel.send.assert_called()
            
            # Test with all channels failing
            self.mock_log_channel.send.return_value = False
            self.mock_email_channel.send.return_value = False
            self.mock_slack_channel.send.return_value = False
            self.mock_sms_channel.send.return_value = False
            
            result = self.manager.notify(
                subject="Fail Subject",
                message="Fail Message",
                severity="critical"
            )
            
            # Verify result
            self.assertFalse(result)
    
    def test_notify_job_success(self):
        """Test job success notification"""
        # Patch notify method
        with patch.object(self.manager, 'notify') as mock_notify:
            # Set notify return value
            mock_notify.return_value = True
            
            # Call notify_job_success
            result = self.manager.notify_job_success("test-job-123")
            
            # Verify job was queried
            self.mock_job.query.filter_by.assert_called_with(job_id="test-job-123")
            
            # Verify notify was called correctly
            mock_notify.assert_called_once()
            args = mock_notify.call_args[0]
            kwargs = mock_notify.call_args[1]
            
            self.assertIn("Test Job", args[0])  # Subject should include job name
            self.assertIn("test", args[1])  # Message should include job type
            self.assertEqual("info", args[2])  # Severity should be info
            self.assertEqual("test-job-123", kwargs["job_id"])  # Job ID
            
            # Verify result
            self.assertTrue(result)
            
            # Test with job not found
            self.mock_job.query.filter_by.return_value.first.return_value = None
            
            result = self.manager.notify_job_success("non-existent-job")
            
            # Verify result
            self.assertFalse(result)
    
    def test_notify_job_failure(self):
        """Test job failure notification"""
        # Patch notify method
        with patch.object(self.manager, 'notify') as mock_notify:
            # Set notify return value
            mock_notify.return_value = True
            
            # Call notify_job_failure
            result = self.manager.notify_job_failure("test-job-123")
            
            # Verify job was queried
            self.mock_job.query.filter_by.assert_called_with(job_id="test-job-123")
            
            # Verify error logs were queried
            self.mock_log.query.filter_by.assert_called_with(job_id="test-job-123", level="ERROR")
            
            # Verify notify was called correctly
            mock_notify.assert_called_once()
            args = mock_notify.call_args[0]
            kwargs = mock_notify.call_args[1]
            
            self.assertIn("Test Job", args[0])  # Subject should include job name
            self.assertIn("failed", args[1])  # Message should mention failure
            self.assertIn("Test error", args[1])  # Should include error details
            self.assertIn("Error 1", args[1])  # Should include error logs
            self.assertEqual("error", args[2])  # Severity should be error
            self.assertEqual("test-job-123", kwargs["job_id"])  # Job ID
            
            # Verify result
            self.assertTrue(result)
            
            # Test with job not found
            self.mock_job.query.filter_by.return_value.first.return_value = None
            
            result = self.manager.notify_job_failure("non-existent-job")
            
            # Verify result
            self.assertFalse(result)
    
    def test_notify_conflicts(self):
        """Test conflicts notification"""
        # Patch notify method
        with patch.object(self.manager, 'notify') as mock_notify:
            # Set notify return value
            mock_notify.return_value = True
            
            # Call notify_conflicts
            result = self.manager.notify_conflicts("test-job-123")
            
            # Verify job was queried
            self.mock_job.query.filter_by.assert_called_with(job_id="test-job-123")
            
            # Verify conflicts were queried
            self.mock_conflict.query.filter_by.assert_called_with(job_id="test-job-123", resolution_status="pending")
            
            # Verify notify was called correctly
            mock_notify.assert_called_once()
            args = mock_notify.call_args[0]
            kwargs = mock_notify.call_args[1]
            
            self.assertIn("Test Job", args[0])  # Subject should include job name
            self.assertIn("conflicts", args[1])  # Message should mention conflicts
            self.assertIn("table1", args[1])  # Should include table name
            self.assertIn("table2", args[1])  # Should include another table name
            
            # Severity should be info (small number of conflicts)
            self.assertEqual("info", args[2])
            
            self.assertEqual("test-job-123", kwargs["job_id"])  # Job ID
            
            # Verify result
            self.assertTrue(result)
            
            # Test with no conflicts
            self.mock_conflict.query.filter_by.return_value.all.return_value = []
            
            result = self.manager.notify_conflicts("test-job-123")
            
            # Verify result
            self.assertFalse(result)
            
            # Test with job not found
            self.mock_job.query.filter_by.return_value.first.return_value = None
            
            result = self.manager.notify_conflicts("non-existent-job")
            
            # Verify result
            self.assertFalse(result)
    
    def test_log_notification(self):
        """Test logging notifications"""
        # Call _log_notification
        self.manager._log_notification(
            subject="Test Subject",
            message="Test Message",
            severity="info",
            channel="log",
            success=True,
            job_id="test-job-123",
            metadata={"test": "value"}
        )
        
        # Verify log entries were created
        self.mock_db.session.add.assert_called()
        self.mock_db.session.commit.assert_called()
        
        # Should be called twice (for notification log and sync log)
        self.assertEqual(self.mock_db.session.add.call_count, 2)
        
        # Test with exception
        self.mock_db.session.add.side_effect = Exception("Test exception")
        
        # Should not raise exception
        self.manager._log_notification(
            subject="Test Subject",
            message="Test Message",
            severity="info",
            channel="log",
            success=True
        )


class TestHelperFunctions(unittest.TestCase):
    """Test suite for helper functions"""
    
    def setUp(self):
        """Set up test environment"""
        self.app_context = app.app_context()
        self.app_context.push()
        
        # Patch notification manager
        self.patcher = patch('sync_service.notification_system.notification_manager')
        self.mock_manager = self.patcher.start()
    
    def tearDown(self):
        """Clean up after tests"""
        self.patcher.stop()
        self.app_context.pop()
    
    def test_notify(self):
        """Test notify helper function"""
        # Set return value
        self.mock_manager.notify.return_value = True
        
        # Call notify
        result = notify(
            subject="Test Subject",
            message="Test Message",
            severity="info",
            job_id="test-job-123",
            metadata={"test": "value"}
        )
        
        # Verify manager method was called
        self.mock_manager.notify.assert_called_with(
            "Test Subject", "Test Message", "info", "test-job-123", {"test": "value"}
        )
        
        # Verify result
        self.assertTrue(result)
    
    def test_notify_job_success(self):
        """Test notify_job_success helper function"""
        # Set return value
        self.mock_manager.notify_job_success.return_value = True
        
        # Call notify_job_success
        result = notify_job_success("test-job-123")
        
        # Verify manager method was called
        self.mock_manager.notify_job_success.assert_called_with("test-job-123")
        
        # Verify result
        self.assertTrue(result)
    
    def test_notify_job_failure(self):
        """Test notify_job_failure helper function"""
        # Set return value
        self.mock_manager.notify_job_failure.return_value = True
        
        # Call notify_job_failure
        result = notify_job_failure("test-job-123")
        
        # Verify manager method was called
        self.mock_manager.notify_job_failure.assert_called_with("test-job-123")
        
        # Verify result
        self.assertTrue(result)
    
    def test_notify_conflicts(self):
        """Test notify_conflicts helper function"""
        # Set return value
        self.mock_manager.notify_conflicts.return_value = True
        
        # Call notify_conflicts
        result = notify_conflicts("test-job-123")
        
        # Verify manager method was called
        self.mock_manager.notify_conflicts.assert_called_with("test-job-123")
        
        # Verify result
        self.assertTrue(result)


if __name__ == '__main__':
    unittest.main()