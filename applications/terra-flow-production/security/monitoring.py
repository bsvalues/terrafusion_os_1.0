"""
Comprehensive Monitoring and Auditing Framework

This module implements multi-layered monitoring and auditing infrastructure
for Benton County Washington Assessor's Office, including real-time activity monitoring,
anomaly detection, and immutable audit logging.
"""

import os
import logging
import json
import hashlib
import datetime
import uuid
import time
from typing import Dict, List, Any, Optional, Union, Tuple, Set

logger = logging.getLogger(__name__)

class SecurityMonitor:
    """
    Comprehensive security monitoring system that provides real-time
    activity tracking, anomaly detection, and security incident alerting.
    """
    
    def __init__(self):
        """Initialize the security monitor"""
        # Configure activity monitoring
        self.activity_types = {
            'authentication': {
                'severity_levels': {
                    'login_success': 'info',
                    'login_failure': 'warning',
                    'multi_factor_success': 'info',
                    'multi_factor_failure': 'warning',
                    'password_change': 'info',
                    'password_reset': 'info',
                    'account_lockout': 'warning'
                },
                'thresholds': {
                    'login_failure': 5,  # Alert after 5 failures in time_window
                    'multi_factor_failure': 3,  # Alert after 3 failures in time_window
                    'account_lockout': 1  # Alert on any account lockout
                },
                'time_window': 30  # minutes
            },
            'data_access': {
                'severity_levels': {
                    'read_public': 'info',
                    'read_internal': 'info',
                    'read_confidential': 'info',
                    'read_restricted': 'warning',
                    'write_public': 'info',
                    'write_internal': 'info',
                    'write_confidential': 'warning',
                    'write_restricted': 'warning',
                    'delete_public': 'warning',
                    'delete_internal': 'warning',
                    'delete_confidential': 'alert',
                    'delete_restricted': 'alert',
                    'bulk_export': 'warning'
                },
                'thresholds': {
                    'read_restricted': 10,  # Alert after 10 accesses in time_window
                    'write_confidential': 20,
                    'write_restricted': 5,
                    'delete_public': 10,
                    'delete_internal': 5,
                    'delete_confidential': 1,
                    'delete_restricted': 1,
                    'bulk_export': 2
                },
                'time_window': 60  # minutes
            },
            'admin_activity': {
                'severity_levels': {
                    'user_create': 'info',
                    'user_modify': 'info',
                    'user_delete': 'warning',
                    'role_create': 'info',
                    'role_modify': 'info',
                    'role_delete': 'warning',
                    'permission_change': 'warning',
                    'system_config': 'warning',
                    'security_change': 'alert'
                },
                'thresholds': {
                    'user_delete': 3,
                    'role_delete': 2,
                    'permission_change': 5,
                    'security_change': 2
                },
                'time_window': 1440  # minutes (24 hours)
            }
        }
        
        # Activity cache for anomaly detection
        self.activity_cache = {}
        
        # Alerting thresholds
        self.alert_thresholds = {
            'info': 0,       # No alerts for info level
            'warning': 10,   # Alert after 10 warnings
            'alert': 1,      # Alert on any alert level
            'critical': 1    # Alert on any critical level
        }
        
        # Known baselines for anomaly detection
        self.activity_baselines = {}
        
        logger.info("Security Monitor initialized")
    
    def log_activity(self, activity_type: str, activity_subtype: str, 
                    user_id: int, details: Dict[str, Any], 
                    ip_address: str = None, source: str = None) -> str:
        """
        Log a security-relevant activity for monitoring.
        
        Args:
            activity_type: Type of activity (authentication, data_access, admin_activity)
            activity_subtype: Specific activity subtype
            user_id: User ID performing the activity
            details: Additional activity details
            ip_address: IP address of the client
            source: Source of the activity (e.g., 'web', 'api', 'batch')
            
        Returns:
            Activity ID for reference
        """
        # Generate unique activity ID
        activity_id = str(uuid.uuid4())
        
        # Get current timestamp
        timestamp = datetime.datetime.now()
        
        # Determine severity level
        severity = 'info'  # Default
        if activity_type in self.activity_types and activity_subtype in self.activity_types[activity_type]['severity_levels']:
            severity = self.activity_types[activity_type]['severity_levels'][activity_subtype]
        
        # Create activity record
        activity = {
            'id': activity_id,
            'timestamp': timestamp,
            'activity_type': activity_type,
            'activity_subtype': activity_subtype,
            'user_id': user_id,
            'details': details,
            'ip_address': ip_address,
            'source': source,
            'severity': severity
        }
        
        # Store in cache for anomaly detection
        cache_key = f"{activity_type}_{activity_subtype}_{user_id}"
        if cache_key not in self.activity_cache:
            self.activity_cache[cache_key] = []
        self.activity_cache[cache_key].append(activity)
        
        # Check for anomalies
        self._check_activity_threshold(activity_type, activity_subtype, user_id)
        self._check_activity_pattern(activity)
        
        # Log the activity
        log_message = f"SECURITY: {activity_type}.{activity_subtype} by user {user_id}"
        if severity == 'info':
            logger.info(log_message)
        elif severity == 'warning':
            logger.warning(log_message)
        else:
            logger.critical(log_message)
        
        # Return activity ID for reference
        return activity_id
    
    def _check_activity_threshold(self, activity_type: str, activity_subtype: str, user_id: int) -> None:
        """
        Check if activity exceeds defined thresholds for alerting.
        
        Args:
            activity_type: Type of activity
            activity_subtype: Specific activity subtype
            user_id: User ID to check
        """
        # Skip if activity type or subtype not monitored
        if (activity_type not in self.activity_types or 
            activity_subtype not in self.activity_types[activity_type]['severity_levels']):
            return
        
        # Check if this activity has a threshold defined
        if activity_subtype not in self.activity_types[activity_type]['thresholds']:
            return
        
        # Get threshold and time window
        threshold = self.activity_types[activity_type]['thresholds'][activity_subtype]
        time_window = self.activity_types[activity_type]['time_window']
        
        # Calculate time threshold
        now = datetime.datetime.now()
        time_threshold = now - datetime.timedelta(minutes=time_window)
        
        # Count activities within time window
        cache_key = f"{activity_type}_{activity_subtype}_{user_id}"
        recent_activities = [
            activity for activity in self.activity_cache.get(cache_key, [])
            if activity['timestamp'] >= time_threshold
        ]
        count = len(recent_activities)
        
        # Check if threshold exceeded
        if count >= threshold:
            severity = self.activity_types[activity_type]['severity_levels'][activity_subtype]
            alert_message = (
                f"SECURITY ALERT: Threshold exceeded for {activity_type}.{activity_subtype} "
                f"by user {user_id}. {count} occurrences in the last {time_window} minutes."
            )
            
            # Log alert
            logger.warning(alert_message)
            
            # Additional alerting would happen here in a real implementation
            # (email, SMS, integration with security tools, etc.)
    
    def _check_activity_pattern(self, activity: Dict[str, Any]) -> None:
        """
        Check for unusual activity patterns that might indicate security issues.
        
        Args:
            activity: Activity record to check
        """
        # In a real implementation, this would use machine learning models
        # for anomaly detection. For now, we'll use simple heuristics.
        
        # Example: Check for activities outside normal hours
        hour = activity['timestamp'].hour
        if hour < 6 or hour > 20:  # Outside 6am-8pm
            # Only alert for sensitive operations
            if activity['severity'] in ['warning', 'alert', 'critical']:
                alert_message = (
                    f"SECURITY ALERT: After-hours {activity['activity_type']}.{activity['activity_subtype']} "
                    f"by user {activity['user_id']} at {activity['timestamp'].strftime('%H:%M:%S')}."
                )
                logger.warning(alert_message)
        
        # Example: Check for activities from unusual locations
        if activity['ip_address'] and not self._is_known_location(activity['ip_address'], activity['user_id']):
            alert_message = (
                f"SECURITY ALERT: Activity from unusual location - {activity['activity_type']}.{activity['activity_subtype']} "
                f"by user {activity['user_id']} from IP {activity['ip_address']}."
            )
            logger.warning(alert_message)
    
    def _is_known_location(self, ip_address: str, user_id: int) -> bool:
        """
        Check if an IP address is a known location for a user.
        
        Args:
            ip_address: IP address to check
            user_id: User ID
            
        Returns:
            True if known location, False otherwise
        """
        # In a real implementation, this would check a database of known user locations
        # For now, we'll just consider localhost and private IP ranges as known
        if ip_address.startswith('127.0.0.') or ip_address == '::1':
            return True
        if ip_address.startswith('10.') or ip_address.startswith('192.168.'):
            return True
        if ip_address.startswith('172.') and 16 <= int(ip_address.split('.')[1]) <= 31:
            return True
        
        # Consider all other IPs as unknown
        return False


class AuditLogger:
    """
    Immutable audit logging system that provides tamper-proof records
    of all security-relevant activities.
    """
    
    def __init__(self):
        """Initialize the audit logger"""
        # Configuration for audit logging
        self.log_categories = {
            'user_authentication': True,
            'data_access': True,
            'data_modification': True,
            'administrative': True,
            'security_events': True,
            'system_events': True
        }
        
        # Hash chain for ensuring log integrity
        self.previous_hash = self._calculate_initial_hash()
        self.log_sequence = 0
        
        # Set up log storage
        self.log_directory = os.environ.get('AUDIT_LOG_DIR', 'audit_logs')
        os.makedirs(self.log_directory, exist_ok=True)
        
        # Current log file
        self.current_log_file = self._initialize_log_file()
        
        logger.info("Audit Logger initialized")
    
    def log_event(self, category: str, event_type: str, user_id: int, 
                 details: Dict[str, Any], metadata: Dict[str, Any] = None) -> str:
        """
        Log an audit event with cryptographic integrity protection.
        
        Args:
            category: Event category (must be one of log_categories)
            event_type: Specific event type
            user_id: User ID responsible for the event
            details: Event details
            metadata: Additional metadata about the event
            
        Returns:
            Event ID for reference
        """
        # Skip if category not enabled
        if category not in self.log_categories or not self.log_categories[category]:
            return None
        
        # Generate unique event ID
        event_id = str(uuid.uuid4())
        
        # Increment sequence number
        self.log_sequence += 1
        
        # Get current timestamp with microsecond precision
        timestamp = datetime.datetime.now().isoformat()
        
        # Create event record
        event = {
            'id': event_id,
            'sequence': self.log_sequence,
            'timestamp': timestamp,
            'category': category,
            'event_type': event_type,
            'user_id': user_id,
            'details': details,
            'metadata': metadata or {},
            'previous_hash': self.previous_hash
        }
        
        # Calculate cryptographic hash of this event
        event_json = json.dumps(event, sort_keys=True)
        event_hash = hashlib.sha256(event_json.encode()).hexdigest()
        
        # Update event with its hash
        event['hash'] = event_hash
        
        # Update previous hash for chain
        self.previous_hash = event_hash
        
        # Write to log file
        self._write_event_to_log(event)
        
        # Return event ID for reference
        return event_id
    
    def _calculate_initial_hash(self) -> str:
        """
        Calculate initial hash for the audit log chain.
        
        Returns:
            Initial hash value
        """
        # Use a combination of installation ID and timestamp for initial hash
        installation_id = os.environ.get('INSTALLATION_ID', 'benton_county_assessor')
        timestamp = datetime.datetime.now().isoformat()
        initial_data = f"{installation_id}:{timestamp}"
        
        return hashlib.sha256(initial_data.encode()).hexdigest()
    
    def _initialize_log_file(self) -> str:
        """
        Initialize a new audit log file.
        
        Returns:
            Path to log file
        """
        # Create log file name based on date
        today = datetime.datetime.now().strftime('%Y%m%d')
        log_file = os.path.join(self.log_directory, f"audit_{today}.jsonl")
        
        # Write header record if file doesn't exist
        if not os.path.exists(log_file):
            header = {
                'type': 'header',
                'version': '1.0',
                'created_at': datetime.datetime.now().isoformat(),
                'installation_id': os.environ.get('INSTALLATION_ID', 'benton_county_assessor'),
                'initial_hash': self.previous_hash
            }
            
            with open(log_file, 'w') as f:
                f.write(json.dumps(header) + '\n')
        
        return log_file
    
    def _write_event_to_log(self, event: Dict[str, Any]) -> None:
        """
        Write an event to the audit log file.
        
        Args:
            event: Event record to write
        """
        # Check if we need to roll over to a new log file
        today = datetime.datetime.now().strftime('%Y%m%d')
        expected_log_file = os.path.join(self.log_directory, f"audit_{today}.jsonl")
        
        if expected_log_file != self.current_log_file:
            # Write trailer record to current log
            trailer = {
                'type': 'trailer',
                'version': '1.0',
                'closed_at': datetime.datetime.now().isoformat(),
                'record_count': self.log_sequence,
                'final_hash': self.previous_hash
            }
            
            with open(self.current_log_file, 'a') as f:
                f.write(json.dumps(trailer) + '\n')
            
            # Update current log file
            self.current_log_file = expected_log_file
            
            # Initialize new log file if needed
            if not os.path.exists(self.current_log_file):
                self._initialize_log_file()
        
        # Write event to log file
        with open(self.current_log_file, 'a') as f:
            f.write(json.dumps(event) + '\n')
    
    def verify_log_integrity(self, log_file: str = None) -> Dict[str, Any]:
        """
        Verify the integrity of an audit log file by checking the hash chain.
        
        Args:
            log_file: Path to log file (if None, checks current log)
            
        Returns:
            Dictionary with verification results
        """
        # Use current log file if none specified
        if log_file is None:
            log_file = self.current_log_file
        
        # Check if file exists
        if not os.path.exists(log_file):
            return {
                'verified': False,
                'error': f"Log file {log_file} does not exist"
            }
        
        # Read all events from log file
        events = []
        try:
            with open(log_file, 'r') as f:
                for line in f:
                    events.append(json.loads(line))
        except Exception as e:
            return {
                'verified': False,
                'error': f"Error reading log file: {str(e)}"
            }
        
        # Extract header and trailer
        header = events[0] if events and events[0]['type'] == 'header' else None
        trailer = events[-1] if events and events[-1]['type'] == 'trailer' else None
        
        # Only process actual event records (not header/trailer)
        audit_events = [e for e in events if 'type' not in e or e['type'] not in ['header', 'trailer']]
        
        # Verify event count
        if trailer and trailer['record_count'] != len(audit_events):
            return {
                'verified': False,
                'error': f"Event count mismatch: expected {trailer['record_count']}, found {len(audit_events)}"
            }
        
        # Verify hash chain
        previous_hash = header['initial_hash'] if header else None
        for event in audit_events:
            # Skip if missing required fields
            if 'previous_hash' not in event or 'hash' not in event:
                return {
                    'verified': False,
                    'error': f"Event {event.get('id', 'unknown')} missing hash fields"
                }
            
            # Verify previous hash matches
            if previous_hash and event['previous_hash'] != previous_hash:
                return {
                    'verified': False,
                    'error': f"Hash chain broken at event {event['id']}: expected {previous_hash}, found {event['previous_hash']}"
                }
            
            # Verify event hash
            event_copy = event.copy()
            recorded_hash = event_copy.pop('hash')
            event_json = json.dumps(event_copy, sort_keys=True)
            calculated_hash = hashlib.sha256(event_json.encode()).hexdigest()
            
            if calculated_hash != recorded_hash:
                return {
                    'verified': False,
                    'error': f"Event {event['id']} hash mismatch: calculated {calculated_hash}, recorded {recorded_hash}"
                }
            
            # Update previous hash for next iteration
            previous_hash = recorded_hash
        
        # Verify final hash matches trailer
        if trailer and previous_hash != trailer['final_hash']:
            return {
                'verified': False,
                'error': f"Final hash mismatch: calculated {previous_hash}, recorded {trailer['final_hash']}"
            }
        
        # All verifications passed
        return {
            'verified': True,
            'event_count': len(audit_events),
            'start_time': audit_events[0]['timestamp'] if audit_events else None,
            'end_time': audit_events[-1]['timestamp'] if audit_events else None
        }

# Create singleton instances
security_monitor = SecurityMonitor()
audit_logger = AuditLogger()