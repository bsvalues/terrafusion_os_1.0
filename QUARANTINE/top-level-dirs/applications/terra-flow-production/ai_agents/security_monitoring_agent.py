"""
Security Monitoring Agent

This agent monitors security-related aspects of the system, including access patterns,
authentication attempts, data encryption status, and potential security threats.
"""

import os
import logging
import time
import json
import datetime
import uuid
import threading
import re
import ipaddress
from typing import Dict, List, Any, Optional, Union, Tuple

from sqlalchemy import text
from ai_agents.base_agent import AIAgent

logger = logging.getLogger(__name__)

class SecurityMonitoringAgent(AIAgent):
    """
    Agent responsible for monitoring security aspects of the property assessment system.
    Detects unusual access patterns, authentication issues, and encryption status.
    """
    
    def __init__(self, agent_id: str = None, name: str = "SecurityMonitoringAgent", 
                description: str = "Monitors system security and access patterns", 
                capabilities: List[str] = None, **kwargs):
        """
        Initialize the security monitoring agent.
        
        Args:
            agent_id: Unique identifier for the agent
            name: Name of the agent
            description: Description of the agent
            capabilities: Agent capabilities
            **kwargs: Additional configuration
        """
        # Default capabilities
        default_capabilities = [
            "access_pattern_monitoring",
            "authentication_monitoring",
            "encryption_verification",
            "privilege_escalation_detection",
            "suspicious_activity_detection",
            "security_policy_enforcement"
        ]
        
        capabilities = capabilities or default_capabilities
        
        # Initialize base agent
        super().__init__(agent_id, name, description, capabilities)
        
        # Agent configuration
        self.config = {
            "monitoring_interval": kwargs.get("monitoring_interval", 300),  # 5 minutes
            "alert_threshold": kwargs.get("alert_threshold", "medium"),  # low, medium, high
            "monitored_activities": kwargs.get("monitored_activities", [
                "login", "logout", "data_access", "configuration_change", 
                "encryption_status", "permission_change"
            ]),
            "blacklisted_ips": kwargs.get("blacklisted_ips", []),
            "notify_on_security_event": kwargs.get("notify_on_security_event", True),
            "log_all_events": kwargs.get("log_all_events", True)
        }
        
        # Security state tracking
        self.security_events = []
        self.user_access_patterns = {}
        self.ip_access_patterns = {}
        self.encryption_status = {}
        self.authentication_failures = {}
        
        # Last monitoring time
        self.last_monitoring_time = None
        
        # Background monitoring task
        self.monitoring_thread = None
        self.monitoring_running = False
        
        # Initialize threat intelligence data
        self._initialize_threat_intelligence()
        
        logger.info(f"Security Monitoring Agent '{self.name}' initialized")
    
    def _initialize_threat_intelligence(self):
        """Initialize threat intelligence data"""
        # This would typically load threat intelligence data from a service
        # For demonstration, using minimal hardcoded data
        self.threat_intelligence = {
            "suspicious_ip_ranges": [
                str(ipaddress.IPv4Network("185.180.0.0/16")),
                str(ipaddress.IPv4Network("194.5.0.0/16")),
                str(ipaddress.IPv4Network("45.227.0.0/16")),
                str(ipaddress.IPv4Network("46.161.0.0/16"))
            ],
            "suspicious_user_agents": [
                "sqlmap",
                "nikto",
                "nmap",
                "masscan",
                "zgrab"
            ],
            "attack_patterns": [
                {
                    "pattern": "SELECT.*FROM",
                    "context": "url_parameter",
                    "threat": "SQL Injection"
                },
                {
                    "pattern": "<script.*>",
                    "context": "form_input",
                    "threat": "Cross-Site Scripting (XSS)"
                },
                {
                    "pattern": "../",
                    "context": "url_path",
                    "threat": "Path Traversal"
                }
            ]
        }
    
    def start(self):
        """Start the agent and the background monitoring thread"""
        super().start()
        
        # Start background monitoring
        self.monitoring_running = True
        self.monitoring_thread = threading.Thread(target=self._background_monitoring_loop)
        self.monitoring_thread.daemon = True
        self.monitoring_thread.start()
        
        logger.info(f"Security Monitoring Agent '{self.name}' monitoring started")
    
    def stop(self):
        """Stop the agent and the background monitoring thread"""
        # Stop background monitoring
        self.monitoring_running = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=2.0)
        
        super().stop()
        logger.info(f"Security Monitoring Agent '{self.name}' stopped")
    
    def _background_monitoring_loop(self):
        """Background loop for periodic security monitoring"""
        while self.monitoring_running:
            try:
                # Skip if agent is paused
                if self.status != "running":
                    time.sleep(1)
                    continue
                
                # Check if it's time for monitoring
                current_time = time.time()
                if (self.last_monitoring_time is None or 
                    current_time - self.last_monitoring_time >= self.config["monitoring_interval"]):
                    
                    # Perform monitoring
                    self._perform_security_monitoring()
                    
                    # Update last monitoring time
                    self.last_monitoring_time = current_time
                
                # Sleep briefly before checking again
                time.sleep(10)
            except Exception as e:
                logger.error(f"Error in security monitoring loop: {str(e)}")
                time.sleep(5)  # Sleep briefly after error
    
    def _perform_security_monitoring(self):
        """Perform security monitoring across various aspects of the system"""
        logger.info(f"Starting security monitoring cycle")
        
        try:
            # Monitor each security aspect
            for activity in self.config["monitored_activities"]:
                if activity == "login":
                    self._monitor_authentication_activity()
                elif activity == "data_access":
                    self._monitor_data_access_patterns()
                elif activity == "configuration_change":
                    self._monitor_configuration_changes()
                elif activity == "encryption_status":
                    self._monitor_encryption_status()
                elif activity == "permission_change":
                    self._monitor_permission_changes()
            
            logger.info(f"Completed security monitoring cycle")
        except Exception as e:
            logger.error(f"Error performing security monitoring: {str(e)}")
    
    def _monitor_authentication_activity(self):
        """Monitor authentication-related activity"""
        from app import db
        
        try:
            # Determine cutoff time for recent activity
            if self.last_monitoring_time:
                cutoff_time = datetime.datetime.fromtimestamp(self.last_monitoring_time)
            else:
                # First time, use recent timeframe
                cutoff_time = datetime.datetime.now() - datetime.timedelta(minutes=30)
            
            # Query to get recent authentication events
            query = """
                SELECT * FROM security_events
                WHERE event_type IN ('login', 'logout', 'login_failure')
                AND event_time >= :cutoff_time
                ORDER BY event_time DESC
            """
            
            # Execute query safely
            result = db.session.execute(
                text(query),
                {"cutoff_time": cutoff_time}
            )
            auth_events = result.fetchall()
            
            if not auth_events:
                return
            
            # Process authentication events
            for event in auth_events:
                event_dict = dict(zip(result.keys(), event))
                self._process_authentication_event(event_dict)
            
            # Check for suspicious authentication patterns
            self._check_authentication_patterns()
        
        except Exception as e:
            logger.error(f"Error monitoring authentication activity: {str(e)}")
    
    def _process_authentication_event(self, event):
        """
        Process an authentication event.
        
        Args:
            event: Authentication event data
        """
        event_type = event.get("event_type")
        user_id = event.get("user_id")
        ip_address = event.get("ip_address")
        
        # Track failures by user and IP
        if event_type == "login_failure":
            # Track by user
            if user_id:
                if user_id not in self.authentication_failures:
                    self.authentication_failures[user_id] = {
                        "count": 0,
                        "first_failure": None,
                        "last_failure": None,
                        "ip_addresses": set()
                    }
                
                user_failures = self.authentication_failures[user_id]
                user_failures["count"] += 1
                user_failures["last_failure"] = event.get("event_time")
                if user_failures["first_failure"] is None:
                    user_failures["first_failure"] = event.get("event_time")
                if ip_address:
                    user_failures["ip_addresses"].add(ip_address)
            
            # Track by IP
            if ip_address:
                if ip_address not in self.authentication_failures:
                    self.authentication_failures[ip_address] = {
                        "count": 0,
                        "first_failure": None,
                        "last_failure": None,
                        "user_ids": set()
                    }
                
                ip_failures = self.authentication_failures[ip_address]
                ip_failures["count"] += 1
                ip_failures["last_failure"] = event.get("event_time")
                if ip_failures["first_failure"] is None:
                    ip_failures["first_failure"] = event.get("event_time")
                if user_id:
                    ip_failures["user_ids"].add(user_id)
        
        # Reset failures on successful login
        elif event_type == "login" and user_id:
            if user_id in self.authentication_failures:
                del self.authentication_failures[user_id]
    
    def _check_authentication_patterns(self):
        """Check for suspicious authentication patterns"""
        current_time = datetime.datetime.now()
        
        # Check each user's failures
        for user_id, failures in list(self.authentication_failures.items()):
            # Skip IP addresses in the user failures check
            if isinstance(user_id, str) and re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", user_id):
                continue
            
            # Check for brute force attempts (many failures in short period)
            if failures["count"] >= 5:
                # Calculate time period of failures
                if failures["first_failure"] and failures["last_failure"]:
                    time_period = (failures["last_failure"] - failures["first_failure"]).total_seconds()
                    
                    # If 5+ failures within 10 minutes, consider it suspicious
                    if time_period <= 600:
                        self._handle_security_event({
                            "event_type": "suspicious_authentication",
                            "user_id": user_id,
                            "ip_addresses": list(failures["ip_addresses"]),
                            "failure_count": failures["count"],
                            "time_period": time_period,
                            "severity": "high",
                            "description": f"Possible brute force attempt for user {user_id}: {failures['count']} failures in {time_period/60:.1f} minutes",
                            "timestamp": datetime.datetime.now().isoformat()
                        })
        
        # Check each IP's failures
        for ip_address, failures in list(self.authentication_failures.items()):
            # Skip user IDs in the IP failures check
            if not isinstance(ip_address, str) or not re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", ip_address):
                continue
            
            # Check for distributed brute force attempts (trying many users from one IP)
            if failures["count"] >= 10 or len(failures.get("user_ids", set())) >= 3:
                self._handle_security_event({
                    "event_type": "suspicious_authentication",
                    "ip_address": ip_address,
                    "user_ids": list(failures.get("user_ids", set())),
                    "failure_count": failures["count"],
                    "severity": "high",
                    "description": f"Possible distributed brute force from IP {ip_address}: {failures['count']} failures across {len(failures.get('user_ids', set()))} users",
                    "timestamp": datetime.datetime.now().isoformat()
                })
        
        # Clean up old entries
        thirty_minutes_ago = current_time - datetime.timedelta(minutes=30)
        for key, failures in list(self.authentication_failures.items()):
            if failures["last_failure"] and failures["last_failure"] < thirty_minutes_ago:
                del self.authentication_failures[key]
    
    def _monitor_data_access_patterns(self):
        """Monitor data access patterns"""
        from app import db
        
        try:
            # Determine cutoff time for recent activity
            if self.last_monitoring_time:
                cutoff_time = datetime.datetime.fromtimestamp(self.last_monitoring_time)
            else:
                # First time, use recent timeframe
                cutoff_time = datetime.datetime.now() - datetime.timedelta(hours=1)
            
            # Query to get recent data access events
            query = """
                SELECT * FROM access_logs
                WHERE event_time >= :cutoff_time
                ORDER BY event_time DESC
            """
            
            # Execute query safely
            result = db.session.execute(
                text(query),
                {"cutoff_time": cutoff_time}
            )
            access_events = result.fetchall()
            
            if not access_events:
                return
            
            # Process access events
            for event in access_events:
                event_dict = dict(zip(result.keys(), event))
                self._process_access_event(event_dict)
            
            # Check for suspicious access patterns
            self._check_access_patterns()
        
        except Exception as e:
            logger.error(f"Error monitoring data access patterns: {str(e)}")
    
    def _process_access_event(self, event):
        """
        Process a data access event.
        
        Args:
            event: Data access event
        """
        user_id = event.get("user_id")
        resource_type = event.get("resource_type")
        resource_id = event.get("resource_id")
        ip_address = event.get("ip_address")
        event_time = event.get("event_time")
        
        # Skip events with missing key data
        if not user_id or not resource_type:
            return
        
        # Track by user
        if user_id not in self.user_access_patterns:
            self.user_access_patterns[user_id] = {
                "resources_accessed": {},
                "access_count": 0,
                "first_access": None,
                "last_access": None,
                "resource_types": set(),
                "ip_addresses": set()
            }
        
        user_pattern = self.user_access_patterns[user_id]
        user_pattern["access_count"] += 1
        user_pattern["last_access"] = event_time
        user_pattern["resource_types"].add(resource_type)
        
        if user_pattern["first_access"] is None:
            user_pattern["first_access"] = event_time
        
        if ip_address:
            user_pattern["ip_addresses"].add(ip_address)
        
        # Track resources accessed by this user
        resource_key = f"{resource_type}:{resource_id}" if resource_id else resource_type
        if resource_key not in user_pattern["resources_accessed"]:
            user_pattern["resources_accessed"][resource_key] = 0
        user_pattern["resources_accessed"][resource_key] += 1
        
        # Track by IP
        if ip_address:
            if ip_address not in self.ip_access_patterns:
                self.ip_access_patterns[ip_address] = {
                    "user_ids": set(),
                    "access_count": 0,
                    "first_access": None,
                    "last_access": None,
                    "resource_types": set()
                }
            
            ip_pattern = self.ip_access_patterns[ip_address]
            ip_pattern["access_count"] += 1
            ip_pattern["last_access"] = event_time
            ip_pattern["user_ids"].add(user_id)
            ip_pattern["resource_types"].add(resource_type)
            
            if ip_pattern["first_access"] is None:
                ip_pattern["first_access"] = event_time
    
    def _check_access_patterns(self):
        """Check for suspicious access patterns"""
        current_time = datetime.datetime.now()
        
        # Check for suspicious access patterns by user
        for user_id, pattern in list(self.user_access_patterns.items()):
            # Skip patterns with minimal activity
            if pattern["access_count"] < 20:
                continue
            
            # Calculate access rate
            if pattern["first_access"] and pattern["last_access"]:
                time_period = (pattern["last_access"] - pattern["first_access"]).total_seconds()
                if time_period <= 0:
                    time_period = 1  # Avoid division by zero
                
                access_rate = pattern["access_count"] / time_period
                
                # Check for high access rate
                if access_rate >= 1.0:  # More than 1 access per second
                    self._handle_security_event({
                        "event_type": "suspicious_access_pattern",
                        "user_id": user_id,
                        "access_count": pattern["access_count"],
                        "time_period": time_period,
                        "access_rate": access_rate,
                        "severity": "medium",
                        "description": f"High access rate for user {user_id}: {pattern['access_count']} accesses in {time_period:.1f} seconds ({access_rate:.2f}/s)",
                        "timestamp": datetime.datetime.now().isoformat()
                    })
            
            # Check for unusual resource access patterns
            for resource_key, count in pattern["resources_accessed"].items():
                if count >= 100:
                    self._handle_security_event({
                        "event_type": "suspicious_resource_access",
                        "user_id": user_id,
                        "resource": resource_key,
                        "access_count": count,
                        "severity": "medium",
                        "description": f"Unusual number of accesses to {resource_key} by user {user_id}: {count} accesses",
                        "timestamp": datetime.datetime.now().isoformat()
                    })
            
            # Check for unusual IP switching
            if len(pattern["ip_addresses"]) >= 3:
                self._handle_security_event({
                    "event_type": "suspicious_ip_switching",
                    "user_id": user_id,
                    "ip_addresses": list(pattern["ip_addresses"]),
                    "severity": "medium",
                    "description": f"User {user_id} accessed resources from {len(pattern['ip_addresses'])} different IP addresses",
                    "timestamp": datetime.datetime.now().isoformat()
                })
        
        # Check for suspicious access patterns by IP
        for ip_address, pattern in list(self.ip_access_patterns.items()):
            # Skip patterns with minimal activity
            if pattern["access_count"] < 20:
                continue
            
            # Check if the IP is suspicious
            ip_obj = ipaddress.ip_address(ip_address)
            is_suspicious = False
            
            for suspicious_range in self.threat_intelligence["suspicious_ip_ranges"]:
                if ip_obj in ipaddress.ip_network(suspicious_range):
                    is_suspicious = True
                    break
            
            # Check for multiple users from one IP
            if len(pattern["user_ids"]) >= 5:
                self._handle_security_event({
                    "event_type": "suspicious_multi_user_access",
                    "ip_address": ip_address,
                    "user_ids": list(pattern["user_ids"]),
                    "severity": "high" if is_suspicious else "medium",
                    "description": f"IP {ip_address} accessed resources as {len(pattern['user_ids'])} different users",
                    "timestamp": datetime.datetime.now().isoformat()
                })
            
            # Calculate access rate
            if pattern["first_access"] and pattern["last_access"]:
                time_period = (pattern["last_access"] - pattern["first_access"]).total_seconds()
                if time_period <= 0:
                    time_period = 1  # Avoid division by zero
                
                access_rate = pattern["access_count"] / time_period
                
                # Check for high access rate
                if access_rate >= 2.0:  # More than 2 accesses per second
                    self._handle_security_event({
                        "event_type": "suspicious_access_rate",
                        "ip_address": ip_address,
                        "access_count": pattern["access_count"],
                        "time_period": time_period,
                        "access_rate": access_rate,
                        "severity": "high" if is_suspicious else "medium",
                        "description": f"High access rate from IP {ip_address}: {pattern['access_count']} accesses in {time_period:.1f} seconds ({access_rate:.2f}/s)",
                        "timestamp": datetime.datetime.now().isoformat()
                    })
        
        # Clean up old entries
        six_hours_ago = current_time - datetime.timedelta(hours=6)
        for user_id, pattern in list(self.user_access_patterns.items()):
            if pattern["last_access"] and pattern["last_access"] < six_hours_ago:
                del self.user_access_patterns[user_id]
        
        for ip_address, pattern in list(self.ip_access_patterns.items()):
            if pattern["last_access"] and pattern["last_access"] < six_hours_ago:
                del self.ip_access_patterns[ip_address]
    
    def _monitor_configuration_changes(self):
        """Monitor configuration changes"""
        from app import db
        
        try:
            # Determine cutoff time for recent activity
            if self.last_monitoring_time:
                cutoff_time = datetime.datetime.fromtimestamp(self.last_monitoring_time)
            else:
                # First time, use recent timeframe
                cutoff_time = datetime.datetime.now() - datetime.timedelta(hours=24)
            
            # Query to get recent configuration changes
            query = """
                SELECT * FROM system_audit_logs
                WHERE event_type = 'configuration_change'
                AND event_time >= :cutoff_time
                ORDER BY event_time DESC
            """
            
            # Execute query safely
            result = db.session.execute(
                text(query),
                {"cutoff_time": cutoff_time}
            )
            config_changes = result.fetchall()
            
            if not config_changes:
                return
            
            # Process configuration changes
            for change in config_changes:
                change_dict = dict(zip(result.keys(), change))
                self._process_configuration_change(change_dict)
        
        except Exception as e:
            logger.error(f"Error monitoring configuration changes: {str(e)}")
    
    def _process_configuration_change(self, change):
        """
        Process a configuration change event.
        
        Args:
            change: Configuration change event
        """
        user_id = change.get("user_id")
        component = change.get("component")
        change_description = change.get("change_description")
        
        # Check for critical configuration changes
        is_critical = False
        critical_components = ["security", "authentication", "authorization", "encryption"]
        critical_keywords = ["password", "secret", "key", "certificate", "policy"]
        
        if component in critical_components:
            is_critical = True
        
        if not is_critical and change_description:
            for keyword in critical_keywords:
                if keyword in change_description.lower():
                    is_critical = True
                    break
        
        if is_critical:
            self._handle_security_event({
                "event_type": "critical_configuration_change",
                "user_id": user_id,
                "component": component,
                "change_description": change_description,
                "severity": "high",
                "description": f"Critical configuration change to {component} by user {user_id}",
                "timestamp": datetime.datetime.now().isoformat()
            })
    
    def _monitor_encryption_status(self):
        """Monitor encryption status"""
        from app import db
        
        try:
            # Query to get encryption status
            query = """
                SELECT component, is_encrypted, last_checked, encryption_method
                FROM encryption_status
                ORDER BY last_checked DESC
            """
            
            # Execute query safely
            result = db.session.execute(text(query))
            statuses = result.fetchall()
            
            if not statuses:
                return
            
            # Process encryption statuses
            for status in statuses:
                status_dict = dict(zip(result.keys(), status))
                self._process_encryption_status(status_dict)
        
        except Exception as e:
            logger.error(f"Error monitoring encryption status: {str(e)}")
    
    def _process_encryption_status(self, status):
        """
        Process an encryption status update.
        
        Args:
            status: Encryption status data
        """
        component = status.get("component")
        is_encrypted = status.get("is_encrypted")
        last_checked = status.get("last_checked")
        encryption_method = status.get("encryption_method")
        
        # Update stored encryption status
        self.encryption_status[component] = {
            "is_encrypted": is_encrypted,
            "last_checked": last_checked,
            "encryption_method": encryption_method
        }
        
        # Check for unencrypted components
        if not is_encrypted:
            self._handle_security_event({
                "event_type": "unencrypted_component",
                "component": component,
                "last_checked": last_checked.isoformat() if last_checked else None,
                "severity": "critical",
                "description": f"Component {component} is not encrypted",
                "timestamp": datetime.datetime.now().isoformat()
            })
        
        # Check for outdated encryption methods
        weak_encryption_methods = ["DES", "3DES", "RC4", "MD5", "SHA1"]
        if encryption_method and any(method in encryption_method for method in weak_encryption_methods):
            self._handle_security_event({
                "event_type": "weak_encryption",
                "component": component,
                "encryption_method": encryption_method,
                "severity": "high",
                "description": f"Component {component} uses weak encryption: {encryption_method}",
                "timestamp": datetime.datetime.now().isoformat()
            })
    
    def _monitor_permission_changes(self):
        """Monitor permission changes"""
        from app import db
        
        try:
            # Determine cutoff time for recent activity
            if self.last_monitoring_time:
                cutoff_time = datetime.datetime.fromtimestamp(self.last_monitoring_time)
            else:
                # First time, use recent timeframe
                cutoff_time = datetime.datetime.now() - datetime.timedelta(hours=24)
            
            # Query to get recent permission changes
            query = """
                SELECT * FROM system_audit_logs
                WHERE event_type = 'permission_change'
                AND event_time >= :cutoff_time
                ORDER BY event_time DESC
            """
            
            # Execute query safely
            result = db.session.execute(
                text(query),
                {"cutoff_time": cutoff_time}
            )
            permission_changes = result.fetchall()
            
            if not permission_changes:
                return
            
            # Process permission changes
            for change in permission_changes:
                change_dict = dict(zip(result.keys(), change))
                self._process_permission_change(change_dict)
        
        except Exception as e:
            logger.error(f"Error monitoring permission changes: {str(e)}")
    
    def _process_permission_change(self, change):
        """
        Process a permission change event.
        
        Args:
            change: Permission change event
        """
        user_id = change.get("user_id")
        target_user_id = change.get("target_user_id")
        permission = change.get("permission")
        change_type = change.get("change_type")  # 'grant' or 'revoke'
        
        # Check for privilege escalation
        sensitive_permissions = ["admin", "security_admin", "data_admin", "config_admin"]
        
        if change_type == "grant" and permission in sensitive_permissions:
            self._handle_security_event({
                "event_type": "sensitive_permission_granted",
                "user_id": user_id,
                "target_user_id": target_user_id,
                "permission": permission,
                "severity": "high",
                "description": f"Sensitive permission '{permission}' granted to user {target_user_id} by {user_id}",
                "timestamp": datetime.datetime.now().isoformat()
            })
        
        # Check for self-permission changes
        if user_id == target_user_id:
            self._handle_security_event({
                "event_type": "self_permission_change",
                "user_id": user_id,
                "permission": permission,
                "change_type": change_type,
                "severity": "high",
                "description": f"User {user_id} {change_type}ed permission '{permission}' for themselves",
                "timestamp": datetime.datetime.now().isoformat()
            })
    
    def _handle_security_event(self, event):
        """
        Handle a detected security event.
        
        Args:
            event: Security event data
        """
        # Add event ID
        event["id"] = str(uuid.uuid4())
        
        # Store the event
        self.security_events.append(event)
        
        # Limit stored events to prevent memory issues
        if len(self.security_events) > 1000:
            self.security_events = self.security_events[-1000:]
        
        # Log the event
        severity = event.get("severity", "medium")
        if severity == "low":
            logger.info(f"Security event: {event.get('description')}")
        elif severity == "medium":
            logger.warning(f"Security event: {event.get('description')}")
        else:
            logger.error(f"Security event: {event.get('description')}")
        
        # Send notifications if enabled
        if self.config["notify_on_security_event"]:
            # Check if this event should trigger notification based on threshold
            alert_threshold = self.config["alert_threshold"]
            
            if (
                (alert_threshold == "low") or
                (alert_threshold == "medium" and severity in ["medium", "high", "critical"]) or
                (alert_threshold == "high" and severity in ["high", "critical"])
            ):
                self._send_security_event_notification(event)
        
        # Store event in the database if log_all_events is enabled
        if self.config["log_all_events"]:
            try:
                self._store_security_event(event)
            except Exception as e:
                logger.error(f"Error storing security event: {str(e)}")
    
    def _send_security_event_notification(self, event):
        """
        Send notification for a security event.
        
        Args:
            event: Security event data
        """
        try:
            from data_governance.notification_manager import send_security_notification
            
            # Determine recipients based on severity
            severity = event.get("severity", "medium")
            recipients = ["security_team"]
            
            if severity in ("high", "critical"):
                recipients.append("security_admin")
            
            if severity == "critical":
                recipients.append("executive_team")
            
            # Create notification
            notification = {
                "title": f"{severity.upper()} security event: {event.get('event_type')}",
                "message": event.get("description"),
                "severity": severity,
                "event_data": event,
                "timestamp": datetime.datetime.now().isoformat()
            }
            
            # Send notification
            send_security_notification(
                recipients=recipients,
                notification_data=notification
            )
            
            logger.info(f"Sent security notification for {severity} event")
        except Exception as e:
            logger.error(f"Error sending security event notification: {str(e)}")
    
    def _store_security_event(self, event):
        """
        Store a security event in the database.
        
        Args:
            event: Security event data
        """
        from app import db
        from security.models import SecurityEvent
        
        # Create database record
        db_event = SecurityEvent(
            event_type=event.get("event_type"),
            description=event.get("description"),
            severity=event.get("severity", "medium"),
            user_id=event.get("user_id"),
            ip_address=event.get("ip_address"),
            event_data=json.dumps(event),
            event_time=datetime.datetime.now()
        )
        
        # Add to database
        db.session.add(db_event)
        db.session.commit()
        
        logger.info(f"Stored security event in database: {event.get('event_type')}")
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task.
        
        Args:
            task_data: Task data
            
        Returns:
            Task result
        """
        task_type = task_data.get("type")
        
        if task_type == "get_security_events":
            # Get security events
            filters = task_data.get("filters", {})
            
            # Apply filters
            filtered_events = self.security_events
            
            if "severity" in filters:
                filtered_events = [e for e in filtered_events if e.get("severity") == filters["severity"]]
            
            if "event_type" in filters:
                filtered_events = [e for e in filtered_events if e.get("event_type") == filters["event_type"]]
            
            if "user_id" in filters:
                filtered_events = [e for e in filtered_events if e.get("user_id") == filters["user_id"]]
            
            if "since" in filters:
                since = datetime.datetime.fromisoformat(filters["since"])
                filtered_events = [
                    e for e in filtered_events 
                    if datetime.datetime.fromisoformat(e.get("timestamp", "2000-01-01T00:00:00")) >= since
                ]
            
            # Sort by timestamp
            filtered_events.sort(
                key=lambda e: e.get("timestamp", "2000-01-01T00:00:00"),
                reverse=True
            )
            
            # Limit results
            limit = task_data.get("limit", 100)
            filtered_events = filtered_events[:limit]
            
            return {
                "status": "success",
                "events": filtered_events,
                "count": len(filtered_events),
                "total": len(self.security_events)
            }
        
        elif task_type == "check_encryption_status":
            # Check encryption status
            component = task_data.get("component")
            
            if component:
                if component in self.encryption_status:
                    return {
                        "status": "success",
                        "component": component,
                        "encryption_status": self.encryption_status[component]
                    }
                else:
                    return {
                        "status": "error",
                        "message": f"No encryption status for component {component}"
                    }
            else:
                return {
                    "status": "success",
                    "encryption_status": self.encryption_status
                }
        
        elif task_type == "check_user_access_patterns":
            # Check access patterns for a user
            user_id = task_data.get("user_id")
            
            if not user_id:
                return {
                    "status": "error",
                    "message": "No user_id specified"
                }
            
            if user_id in self.user_access_patterns:
                return {
                    "status": "success",
                    "user_id": user_id,
                    "access_patterns": self.user_access_patterns[user_id]
                }
            else:
                return {
                    "status": "error",
                    "message": f"No access patterns for user {user_id}"
                }
        
        elif task_type == "check_ip_access_patterns":
            # Check access patterns for an IP
            ip_address = task_data.get("ip_address")
            
            if not ip_address:
                return {
                    "status": "error",
                    "message": "No ip_address specified"
                }
            
            if ip_address in self.ip_access_patterns:
                return {
                    "status": "success",
                    "ip_address": ip_address,
                    "access_patterns": self.ip_access_patterns[ip_address]
                }
            else:
                return {
                    "status": "error",
                    "message": f"No access patterns for IP {ip_address}"
                }
        
        elif task_type == "check_authentication_failures":
            # Check authentication failures
            id_value = task_data.get("id")
            
            if not id_value:
                return {
                    "status": "error",
                    "message": "No id specified"
                }
            
            if id_value in self.authentication_failures:
                return {
                    "status": "success",
                    "id": id_value,
                    "failures": self.authentication_failures[id_value]
                }
            else:
                return {
                    "status": "error",
                    "message": f"No authentication failures for {id_value}"
                }
        
        elif task_type == "update_config":
            # Update agent configuration
            config_updates = task_data.get("config", {})
            
            for key, value in config_updates.items():
                if key in self.config:
                    self.config[key] = value
            
            return {
                "status": "success",
                "message": "Configuration updated",
                "config": self.config
            }
        
        elif task_type == "add_blacklisted_ips":
            # Add IPs to blacklist
            ips = task_data.get("ips", [])
            
            if not ips:
                return {
                    "status": "error",
                    "message": "No IPs specified"
                }
            
            # Add to blacklist
            self.config["blacklisted_ips"].extend(ips)
            
            # Remove duplicates
            self.config["blacklisted_ips"] = list(set(self.config["blacklisted_ips"]))
            
            return {
                "status": "success",
                "message": f"Added {len(ips)} IPs to blacklist",
                "blacklisted_ips": self.config["blacklisted_ips"]
            }
        
        else:
            return {
                "status": "error",
                "error": f"Unknown task type: {task_type}"
            }