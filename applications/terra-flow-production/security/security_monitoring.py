"""
Security Monitoring Module

This module provides monitoring capabilities for security-related events,
including anomaly detection, intrusion detection, and security auditing.
"""

import os
import logging
import json
import datetime
import uuid
from typing import Dict, List, Any, Optional, Tuple

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class SecurityMonitoringManager:
    """
    Manager class for security monitoring that integrates with other components
    of the application for comprehensive security monitoring.
    """
    
    def __init__(self):
        """Initialize the security monitoring manager."""
        self.monitors = {}
        self.active = True
        self.last_scan_time = None
        self.scan_interval = 3600  # Default scan interval (1 hour)
        self._is_running = True
        logger.info("Security Monitoring Manager initialized")
        
    def is_running(self) -> bool:
        """
        Check if security monitoring is running.
        
        Returns:
            True if running, False otherwise
        """
        return self._is_running
    
    def register_monitor(self, name: str, monitor: Any) -> None:
        """
        Register a security monitor.
        
        Args:
            name: Monitor name
            monitor: Monitor instance
        """
        self.monitors[name] = monitor
        logger.info(f"Registered security monitor: {name}")
    
    def scan_system(self) -> Dict[str, Any]:
        """
        Perform a comprehensive security scan of the system.
        
        Returns:
            Scan results
        """
        if not self.active:
            logger.warning("Security monitoring is not active")
            return {"status": "inactive", "message": "Security monitoring is not active"}
        
        logger.info("Starting security scan")
        self.last_scan_time = datetime.datetime.now()
        
        scan_results = {}
        
        # Run each monitor
        for name, monitor in self.monitors.items():
            try:
                if hasattr(monitor, 'scan') and callable(monitor.scan):
                    scan_results[name] = monitor.scan()
                    logger.info(f"Security scan completed for {name}")
                else:
                    logger.warning(f"Monitor {name} does not have a scan method")
                    scan_results[name] = {"status": "error", "message": "Monitor does not support scanning"}
            except Exception as e:
                logger.error(f"Error running security scan for {name}: {str(e)}")
                scan_results[name] = {"status": "error", "message": str(e)}
        
        # Aggregate results
        overall_status = "ok"
        issues_found = 0
        
        for name, result in scan_results.items():
            if result.get("status") == "error":
                overall_status = "error"
                issues_found += 1
            elif result.get("status") == "warning":
                if overall_status != "error":
                    overall_status = "warning"
                issues_found += 1
        
        return {
            "status": overall_status,
            "issues_found": issues_found,
            "scan_time": self.last_scan_time.isoformat(),
            "results": scan_results
        }
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get the current status of security monitoring.
        
        Returns:
            Status information
        """
        return {
            "active": self.active,
            "last_scan_time": self.last_scan_time.isoformat() if self.last_scan_time else None,
            "scan_interval": self.scan_interval,
            "monitors": list(self.monitors.keys())
        }
    
    def set_scan_interval(self, interval: int) -> None:
        """
        Set the security scan interval.
        
        Args:
            interval: Scan interval in seconds
        """
        self.scan_interval = interval
        logger.info(f"Security scan interval set to {interval} seconds")
    
    def activate(self) -> None:
        """Activate security monitoring."""
        self.active = True
        logger.info("Security monitoring activated")
    
    def deactivate(self) -> None:
        """Deactivate security monitoring."""
        self.active = False
        logger.info("Security monitoring deactivated")

class SecurityMonitor:
    """
    Security monitoring system that tracks security events and detects potential
    security issues across the application.
    """
    
    def __init__(self):
        """Initialize the security monitor."""
        self.events = []
        self.alert_thresholds = {
            'info': 0,       # No alerts for info level
            'warning': 10,   # Alert after 10 warnings
            'alert': 1,      # Alert on any alert level
            'critical': 1    # Alert on any critical level
        }
        logger.info("Security Monitor initialized")
    
    def track_event(self, event_type: str, details: Dict[str, Any], 
                   severity: str = "info", user_id: Optional[int] = None) -> str:
        """
        Track a security event.
        
        Args:
            event_type: Type of security event
            details: Event details
            severity: Severity level (info, warning, alert, critical)
            user_id: User ID associated with the event
            
        Returns:
            Event ID
        """
        # Generate event ID
        event_id = str(uuid.uuid4())
        
        # Create event record
        event = {
            "id": event_id,
            "event_type": event_type,
            "details": details,
            "severity": severity,
            "user_id": user_id,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        # Add to events list
        self.events.append(event)
        
        # Log event
        logger.info(f"Security event tracked: {event_type} [{severity}]")
        
        # Handle event based on severity
        if severity == "critical":
            logger.critical(f"Critical security event: {event_type} - {json.dumps(details)}")
        elif severity == "alert":
            logger.error(f"Security alert: {event_type} - {json.dumps(details)}")
        elif severity == "warning":
            logger.warning(f"Security warning: {event_type} - {json.dumps(details)}")
        
        return event_id
    
    def get_events(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Get security events with optional filtering.
        
        Args:
            filters: Filters to apply (event_type, severity, user_id, etc.)
            
        Returns:
            List of matching security events
        """
        if not filters:
            return self.events.copy()
        
        filtered_events = self.events
        
        # Apply filters
        if "event_type" in filters:
            filtered_events = [e for e in filtered_events if e["event_type"] == filters["event_type"]]
        
        if "severity" in filters:
            filtered_events = [e for e in filtered_events if e["severity"] == filters["severity"]]
        
        if "user_id" in filters:
            filtered_events = [e for e in filtered_events if e["user_id"] == filters["user_id"]]
        
        if "since" in filters:
            since = filters["since"]
            if isinstance(since, str):
                since = datetime.datetime.fromisoformat(since)
            filtered_events = [
                e for e in filtered_events 
                if datetime.datetime.fromisoformat(e["timestamp"]) >= since
            ]
        
        return filtered_events
    
    def clear_events(self, older_than: Optional[datetime.datetime] = None) -> int:
        """
        Clear security events from memory.
        
        Args:
            older_than: Clear events older than this datetime
            
        Returns:
            Number of events cleared
        """
        if not older_than:
            # Clear all events
            count = len(self.events)
            self.events = []
            return count
        
        # Clear events older than the specified datetime
        original_count = len(self.events)
        self.events = [
            e for e in self.events 
            if datetime.datetime.fromisoformat(e["timestamp"]) >= older_than
        ]
        return original_count - len(self.events)
    
    def get_security_status(self) -> Dict[str, Any]:
        """
        Get the overall security status.
        
        Returns:
            Security status information
        """
        # Count events by severity
        severity_counts = {}
        for event in self.events:
            severity = event["severity"]
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Determine overall status
        status = "normal"
        if severity_counts.get("critical", 0) > 0:
            status = "critical"
        elif severity_counts.get("alert", 0) > 0:
            status = "alert"
        elif severity_counts.get("warning", 0) >= self.alert_thresholds["warning"]:
            status = "warning"
        
        return {
            "status": status,
            "total_events": len(self.events),
            "severity_counts": severity_counts,
            "last_updated": datetime.datetime.now().isoformat()
        }

# Create singleton instances
security_monitor = SecurityMonitor()
security_monitoring_manager = SecurityMonitoringManager()