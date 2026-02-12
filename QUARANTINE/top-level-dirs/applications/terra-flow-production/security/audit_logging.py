"""
Audit Logging Module

This module provides comprehensive audit logging capabilities for security
and compliance purposes, tracking user actions and system changes.
"""

import logging
import datetime
import json
import uuid
import os
from typing import Dict, List, Any, Optional

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class AuditLogger:
    """
    Audit logger for tracking security-relevant events and user actions
    for compliance and forensic purposes.
    """
    
    def __init__(self, log_to_db: bool = True, log_to_file: bool = True):
        """
        Initialize the audit logger.
        
        Args:
            log_to_db: Whether to log events to database
            log_to_file: Whether to log events to file
        """
        self.log_to_db = log_to_db
        self.log_to_file = log_to_file
        
        # Set up file logging if enabled
        self.log_directory = os.environ.get("AUDIT_LOG_DIR", "logs/audit")
        self.current_log_file = None
        
        if self.log_to_file:
            # Create log directory if it doesn't exist
            os.makedirs(self.log_directory, exist_ok=True)
            
            # Set up initial log file
            self._setup_log_file()
        
        logger.info("Audit Logger initialized")
        
    def is_initialized(self) -> bool:
        """
        Check if the audit logger is properly initialized.
        
        Returns:
            True if initialized, False otherwise
        """
        return True
    
    def _setup_log_file(self) -> None:
        """Set up the audit log file."""
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        self.current_log_file = f"{self.log_directory}/audit_{today}.log"
    
    def log_event(self, event_type: str, user_id: Optional[int] = None, 
                  resource_type: Optional[str] = None, resource_id: Optional[str] = None,
                  action: Optional[str] = None, details: Optional[Dict[str, Any]] = None,
                  ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> str:
        """
        Log an audit event.
        
        Args:
            event_type: Type of event (authentication, data_access, admin_action, etc.)
            user_id: User ID performing the action
            resource_type: Type of resource being accessed or modified
            resource_id: ID of the resource
            action: Action being performed (create, read, update, delete, etc.)
            details: Additional event details
            ip_address: IP address of the client
            user_agent: User agent of the client
            
        Returns:
            Audit event ID
        """
        # Generate event ID
        event_id = str(uuid.uuid4())
        
        # Create event record
        event = {
            "id": event_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "event_type": event_type,
            "user_id": user_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "action": action,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent
        }
        
        # Log to database if enabled
        if self.log_to_db:
            try:
                self._log_to_database(event)
            except Exception as e:
                logger.error(f"Error logging to database: {str(e)}")
        
        # Log to file if enabled
        if self.log_to_file:
            try:
                self._log_to_file(event)
            except Exception as e:
                logger.error(f"Error logging to file: {str(e)}")
        
        logger.info(f"Audit event logged: {event_type}")
        
        return event_id
    
    def _log_to_database(self, event: Dict[str, Any]) -> None:
        """
        Log event to database.
        
        Args:
            event: Event data
        """
        try:
            from app import db
            from models import AuditLog
            
            # Create AuditLog record
            audit_log = AuditLog(
                user_id=event.get("user_id"),
                action=event.get("action") or event.get("event_type"),
                resource_type=event.get("resource_type"),
                resource_id=event.get("resource_id"),
                details=event.get("details"),
                ip_address=event.get("ip_address"),
                user_agent=event.get("user_agent")
            )
            
            # Add and commit
            db.session.add(audit_log)
            db.session.commit()
            
            logger.debug(f"Audit event logged to database: {event.get('id')}")
        
        except ImportError:
            logger.warning("Could not import database models, skipping database logging")
        
        except Exception as e:
            logger.error(f"Error logging to database: {str(e)}")
            # Don't re-raise, just log the error
    
    def _log_to_file(self, event: Dict[str, Any]) -> None:
        """
        Log event to file.
        
        Args:
            event: Event data
        """
        # Check if we need to rotate log file
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        expected_log_file = f"{self.log_directory}/audit_{today}.log"
        
        if self.current_log_file != expected_log_file:
            self.current_log_file = expected_log_file
        
        # Serialize event to JSON
        event_json = json.dumps(event)
        
        # Write to log file
        with open(self.current_log_file, "a") as f:
            f.write(f"{event_json}\n")
        
        logger.debug(f"Audit event logged to file: {event.get('id')}")
    
    def query_events(self, filters: Optional[Dict[str, Any]] = None, 
                     limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Query audit events from the database.
        
        Args:
            filters: Filters to apply
            limit: Maximum number of events to return
            offset: Offset for pagination
            
        Returns:
            List of audit events
        """
        try:
            from app import db
            from models import AuditLog
            from sqlalchemy import desc
            
            # Start with base query
            query = AuditLog.query
            
            # Apply filters
            if filters:
                if "user_id" in filters:
                    query = query.filter(AuditLog.user_id == filters["user_id"])
                
                if "action" in filters:
                    query = query.filter(AuditLog.action == filters["action"])
                
                if "resource_type" in filters:
                    query = query.filter(AuditLog.resource_type == filters["resource_type"])
                
                if "resource_id" in filters:
                    query = query.filter(AuditLog.resource_id == filters["resource_id"])
                
                if "start_date" in filters:
                    query = query.filter(AuditLog.timestamp >= filters["start_date"])
                
                if "end_date" in filters:
                    query = query.filter(AuditLog.timestamp <= filters["end_date"])
            
            # Order by timestamp (most recent first)
            query = query.order_by(desc(AuditLog.timestamp))
            
            # Apply limit and offset
            query = query.limit(limit).offset(offset)
            
            # Execute query
            results = query.all()
            
            # Convert to dictionaries
            events = []
            for result in results:
                events.append({
                    "id": result.id,
                    "timestamp": result.timestamp.isoformat() if result.timestamp else None,
                    "user_id": result.user_id,
                    "action": result.action,
                    "resource_type": result.resource_type,
                    "resource_id": result.resource_id,
                    "details": result.details,
                    "ip_address": result.ip_address,
                    "user_agent": result.user_agent
                })
            
            return events
        
        except ImportError:
            logger.warning("Could not import database models, returning empty list")
            return []
        
        except Exception as e:
            logger.error(f"Error querying audit events: {str(e)}")
            return []

# Create singleton instance
audit_logger = AuditLogger()

# Convenience functions
def log_audit_event(event_type: str, user_id: Optional[int] = None, 
                   resource_type: Optional[str] = None, resource_id: Optional[str] = None,
                   action: Optional[str] = None, details: Optional[Dict[str, Any]] = None,
                   ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> str:
    """
    Log an audit event using the singleton audit logger.
    
    Args:
        event_type: Type of event
        user_id: User ID
        resource_type: Type of resource
        resource_id: ID of resource
        action: Action performed
        details: Additional details
        ip_address: IP address
        user_agent: User agent
        
    Returns:
        Audit event ID
    """
    return audit_logger.log_event(
        event_type=event_type,
        user_id=user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        action=action,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )