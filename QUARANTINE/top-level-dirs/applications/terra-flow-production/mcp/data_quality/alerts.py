"""
Data Quality Alert System

This module provides functionality for managing and triggering data quality alerts
based on configurable threshold criteria.
"""

import logging
import json
import datetime
import uuid
from typing import Dict, List, Any, Optional

from mcp.integrators.data_quality_integrator import data_quality_integrator
from app import db

# Configure logging
logger = logging.getLogger(__name__)

class QualityAlert:
    """Data Quality Alert definition"""
    def __init__(
        self,
        id: Optional[str] = None,
        name: str = "",
        description: str = "",
        check_type: str = "",
        parameters: Optional[Dict[str, Any]] = None,
        threshold: float = 0.95,
        severity: str = "medium",
        notification_channels: Optional[List[str]] = None,
        enabled: bool = True
    ):
        """Initialize a quality alert"""
        self.id = id or str(uuid.uuid4())
        self.name = name
        self.description = description
        self.check_type = check_type
        self.parameters = parameters if parameters is not None else {}
        self.threshold = threshold
        self.severity = severity
        self.notification_channels = notification_channels if notification_channels is not None else ["log"]
        self.enabled = enabled
        self.last_checked = None
        self.last_status = None
        self.last_value = None
        self.last_error = None
        self.triggered_count = 0
        self.created_date = datetime.datetime.now()
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert alert to dictionary for storage"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "check_type": self.check_type,
            "parameters": self.parameters,
            "threshold": self.threshold,
            "severity": self.severity,
            "notification_channels": self.notification_channels,
            "enabled": self.enabled,
            "last_checked": self.last_checked.isoformat() if self.last_checked else None,
            "last_status": self.last_status,
            "last_value": self.last_value,
            "last_error": self.last_error,
            "triggered_count": self.triggered_count,
            "created_date": self.created_date.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'QualityAlert':
        """Create alert from dictionary"""
        alert = cls(
            id=data.get("id"),
            name=data.get("name", ""),
            description=data.get("description", ""),
            check_type=data.get("check_type", ""),
            parameters=data.get("parameters", {}),
            threshold=data.get("threshold", 0.95),
            severity=data.get("severity", "medium"),
            notification_channels=data.get("notification_channels", ["log"]),
            enabled=data.get("enabled", True)
        )
        
        # Handle datetime fields
        if data.get("last_checked"):
            if isinstance(data["last_checked"], str):
                alert.last_checked = datetime.datetime.fromisoformat(data["last_checked"])
            else:
                alert.last_checked = data["last_checked"]
                
        if data.get("created_date"):
            if isinstance(data["created_date"], str):
                alert.created_date = datetime.datetime.fromisoformat(data["created_date"])
            else:
                alert.created_date = data["created_date"]
        
        # Set other fields
        alert.last_status = data.get("last_status")
        alert.last_value = data.get("last_value")
        alert.last_error = data.get("last_error")
        alert.triggered_count = data.get("triggered_count", 0)
        
        return alert

class DataQualityAlertManager:
    """Manager for data quality alerts"""
    def __init__(self):
        """Initialize the alert manager"""
        self.alerts = {}
        self.notification_manager = None
        
        # Load existing alerts from database
        self._load_alerts()
        
        logger.info("Data Quality Alert Manager initialized")
    
    def set_notification_manager(self, notification_manager):
        """Set the notification manager for sending alerts"""
        self.notification_manager = notification_manager
        logger.info("Notification manager set for quality alerts")
    
    def add_alert(self, alert: QualityAlert) -> bool:
        """
        Add a new data quality alert
        
        Args:
            alert: The quality alert to add
            
        Returns:
            True if added successfully, False otherwise
        """
        try:
            # Validate the alert configuration
            validation = data_quality_integrator.validate_data_quality_alert(alert.to_dict())
            
            if not validation.get("valid", False):
                logger.error(f"Invalid alert configuration: {validation.get('error')}")
                return False
            
            # Add the alert to the in-memory collection
            self.alerts[alert.id] = alert
            
            # Save to database
            self._save_alerts()
            
            logger.info(f"Added quality alert: {alert.name} [{alert.id}]")
            return True
        
        except Exception as e:
            logger.error(f"Error adding quality alert: {str(e)}")
            return False
    
    def update_alert(self, alert_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update an existing data quality alert
        
        Args:
            alert_id: ID of the alert to update
            updates: Dictionary of updates to apply
            
        Returns:
            True if updated successfully, False otherwise
        """
        try:
            if alert_id not in self.alerts:
                logger.error(f"Alert not found: {alert_id}")
                return False
            
            alert = self.alerts[alert_id]
            
            # Update alert attributes
            for key, value in updates.items():
                if hasattr(alert, key):
                    setattr(alert, key, value)
            
            # Validate if check_type or parameters changed
            if "check_type" in updates or "parameters" in updates:
                validation = data_quality_integrator.validate_data_quality_alert(alert.to_dict())
                
                if not validation.get("valid", False):
                    logger.error(f"Invalid alert configuration: {validation.get('error')}")
                    return False
            
            # Save to database
            self._save_alerts()
            
            logger.info(f"Updated quality alert: {alert.name} [{alert.id}]")
            return True
        
        except Exception as e:
            logger.error(f"Error updating quality alert: {str(e)}")
            return False
    
    def delete_alert(self, alert_id: str) -> bool:
        """
        Delete a data quality alert
        
        Args:
            alert_id: ID of the alert to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            if alert_id not in self.alerts:
                logger.error(f"Alert not found: {alert_id}")
                return False
            
            # Remove from in-memory collection
            alert_name = self.alerts[alert_id].name
            del self.alerts[alert_id]
            
            # Save to database
            self._save_alerts()
            
            logger.info(f"Deleted quality alert: {alert_name} [{alert_id}]")
            return True
        
        except Exception as e:
            logger.error(f"Error deleting quality alert: {str(e)}")
            return False
    
    def get_alert(self, alert_id: str) -> Optional[QualityAlert]:
        """
        Get a specific data quality alert
        
        Args:
            alert_id: ID of the alert to retrieve
            
        Returns:
            The quality alert or None if not found
        """
        return self.alerts.get(alert_id)
    
    def get_all_alerts(self) -> List[QualityAlert]:
        """
        Get all data quality alerts
        
        Returns:
            List of all quality alerts
        """
        return list(self.alerts.values())
    
    def check_alert(self, alert_id: str) -> Dict[str, Any]:
        """
        Check a specific data quality alert
        
        Args:
            alert_id: ID of the alert to check
            
        Returns:
            Check result with alert status
        """
        try:
            if alert_id not in self.alerts:
                return {
                    "success": False,
                    "error": f"Alert not found: {alert_id}"
                }
            
            alert = self.alerts[alert_id]
            
            # Skip disabled alerts
            if not alert.enabled:
                return {
                    "success": True,
                    "alert_id": alert_id,
                    "status": "skipped",
                    "reason": "Alert is disabled",
                    "checked_at": datetime.datetime.now().isoformat()
                }
            
            # Perform the check
            result = self._perform_quality_check(alert)
            
            # Update alert status
            alert.last_checked = datetime.datetime.now()
            alert.last_status = result.get("status")
            alert.last_value = result.get("value")
            alert.last_error = result.get("error")
            
            if result.get("status") == "triggered":
                alert.triggered_count += 1
                
                # Send notification if a notification manager is set
                if self.notification_manager:
                    self._send_alert_notification(alert, result)
            
            # Save changes
            self._save_alerts()
            
            return {
                "success": True,
                "alert_id": alert_id,
                "name": alert.name,
                "status": result.get("status"),
                "value": result.get("value"),
                "threshold": alert.threshold,
                "checked_at": alert.last_checked.isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error checking quality alert {alert_id}: {str(e)}")
            return {
                "success": False,
                "alert_id": alert_id,
                "error": f"Check failed: {str(e)}"
            }
    
    def check_all_alerts(self) -> Dict[str, Any]:
        """
        Check all enabled data quality alerts
        
        Returns:
            Check results for all alerts
        """
        results = {
            "success": True,
            "total_alerts": len(self.alerts),
            "enabled_alerts": len([a for a in self.alerts.values() if a.enabled]),
            "triggered_alerts": 0,
            "passed_alerts": 0,
            "skipped_alerts": 0,
            "failed_alerts": 0,
            "alerts": []
        }
        
        for alert_id in self.alerts:
            result = self.check_alert(alert_id)
            
            if not result.get("success"):
                results["failed_alerts"] += 1
            elif result.get("status") == "triggered":
                results["triggered_alerts"] += 1
            elif result.get("status") == "passed":
                results["passed_alerts"] += 1
            elif result.get("status") == "skipped":
                results["skipped_alerts"] += 1
            
            results["alerts"].append(result)
        
        logger.info(f"Checked {results['enabled_alerts']} alerts: {results['triggered_alerts']} triggered, {results['failed_alerts']} failed")
        return results
    
    def _perform_quality_check(self, alert: QualityAlert) -> Dict[str, Any]:
        """
        Perform the actual quality check for an alert
        
        Args:
            alert: The quality alert to check
            
        Returns:
            Check result with status (triggered, passed, error)
        """
        try:
            # Map alert check type to integrator request type
            check_mapping = {
                "completeness": "completeness_check",
                "format": "format_validation",
                "range": "range_validation",
                "consistency": "consistency_check",
                "outlier": "outlier_detection",
                "valuation": "valuation_validation"
            }
            
            request_type = check_mapping.get(alert.check_type)
            if not request_type:
                return {
                    "status": "error",
                    "error": f"Unknown check type: {alert.check_type}"
                }
            
            # Make the quality check request
            result = data_quality_integrator.process_quality_request(
                request_type=request_type,
                data=alert.parameters
            )
            
            if not result.get("success"):
                return {
                    "status": "error",
                    "error": result.get("error", "Unknown error in quality check")
                }
            
            # Determine if the alert is triggered based on threshold
            threshold_field = self._get_threshold_field(alert.check_type)
            current_value = result.get(threshold_field, 0)
            
            # For some metrics, higher is better (completeness, compliance)
            # For others, lower is better (issues count, outliers)
            comparison_type = self._get_comparison_type(alert.check_type)
            
            triggered = False
            if comparison_type == "higher_better":
                triggered = current_value < alert.threshold
            else:  # lower_better
                triggered = current_value > alert.threshold
            
            # Return the check result
            return {
                "status": "triggered" if triggered else "passed",
                "value": current_value,
                "details": result
            }
        
        except Exception as e:
            logger.error(f"Error in quality check: {str(e)}")
            return {
                "status": "error",
                "error": f"Check failed: {str(e)}"
            }
    
    def _get_threshold_field(self, check_type: str) -> str:
        """Get the field to compare against threshold for a check type"""
        field_mapping = {
            "completeness": "completeness_score",
            "format": "format_compliance_score",
            "range": "range_compliance_score",
            "consistency": "consistency_score",
            "outlier": "outliers_found",
            "valuation": "validation_passed"
        }
        
        return field_mapping.get(check_type, "value")
    
    def _get_comparison_type(self, check_type: str) -> str:
        """Get the comparison type for a check type (higher or lower is better)"""
        # For most quality metrics, higher scores are better
        higher_better = ["completeness", "format", "range", "consistency"]
        
        # For issue counts, lower is better
        lower_better = ["outlier"]
        
        # Special case for validation, it's boolean
        special_cases = ["valuation"]
        
        if check_type in higher_better:
            return "higher_better"
        elif check_type in lower_better:
            return "lower_better"
        else:
            # Default to higher is better
            return "higher_better"
    
    def _send_alert_notification(self, alert: QualityAlert, result: Dict[str, Any]):
        """
        Send notification for triggered alert
        
        Args:
            alert: The triggered alert
            result: The check result
        """
        try:
            if not self.notification_manager:
                logger.warning("Cannot send notification - notification manager not set")
                return
            
            # Build notification message
            message = {
                "title": f"Data Quality Alert: {alert.name}",
                "message": f"Data quality issue detected: {alert.description}",
                "details": {
                    "alert_id": alert.id,
                    "check_type": alert.check_type,
                    "current_value": result.get("value"),
                    "threshold": alert.threshold,
                    "triggered_at": datetime.datetime.now().isoformat()
                },
                "severity": alert.severity
            }
            
            # Send to each configured channel
            for channel in alert.notification_channels:
                self.notification_manager.send_notification(
                    channel=channel,
                    message=message
                )
            
            logger.info(f"Sent alert notification for {alert.name} to {len(alert.notification_channels)} channels")
        
        except Exception as e:
            logger.error(f"Error sending alert notification: {str(e)}")
    
    def _load_alerts(self):
        """Load alerts from database"""
        client = None
        try:
            # First, try to load from SQLAlchemy
            try:
                from mcp.data_quality.models import QualityAlertModel
                from app import db, app
                
                # Use the app context to ensure we're in an application context
                with app.app_context():
                    # Query all alerts from the database
                    alert_models = QualityAlertModel.query.all()
                    
                    if alert_models:
                        # Convert models to alert objects
                        for model in alert_models:
                            alert_dict = model.to_dict()
                            alert = QualityAlert.from_dict(alert_dict)
                            self.alerts[alert.id] = alert
                        
                        logger.info(f"Loaded {len(self.alerts)} quality alerts from SQLAlchemy")
                        return
                    else:
                        logger.info("No alerts found in SQLAlchemy database, trying Supabase")
            except Exception as sa_error:
                logger.warning(f"Error loading alerts from SQLAlchemy: {str(sa_error)}")
            
            # If SQLAlchemy fails, try Supabase as a fallback
            from supabase_client import get_supabase_client
            client = get_supabase_client()
            
            if not client:
                logger.error("Failed to get Supabase client")
                # Fallback to sample alerts if we can't get a client
                self._load_sample_alerts()
                return
            
            # Try loading alerts from the Supabase table
            try:
                # Try the table name that matches our SQLAlchemy model
                table_name = 'data_quality_alert'
                response = client.table(table_name).select('*').execute()
                logger.info(f"Successfully queried {table_name} table")
            except Exception as primary_error:
                logger.warning(f"Error querying primary table: {str(primary_error)}")
                
                try:
                    # If that fails, try the old format
                    table_name = 'data_quality_alerts'
                    response = client.table(table_name).select('*').execute()
                    logger.info(f"Successfully queried {table_name} table")
                except Exception as secondary_error:
                    # Tables failed to be accessed
                    logger.error(f"Error accessing alerts tables: {str(secondary_error)}")
                    
                    # Use sample alerts instead
                    logger.warning("Using fallback sample alerts in memory")
                    self._load_sample_alerts()
                    return
            
            # Process response from Supabase if available
            if response and hasattr(response, 'data') and response.data:
                # Convert data to alert objects
                for alert_data in response.data:
                    alert = QualityAlert.from_dict(alert_data)
                    self.alerts[alert.id] = alert
                
                logger.info(f"Loaded {len(self.alerts)} quality alerts from Supabase")
            else:
                # If no alerts exist, load sample alerts and save them to the database
                logger.info("No alerts found in database, loading samples")
                self._load_sample_alerts()
                
                # Try to save the sample alerts to the database
                logger.info("Saving sample alerts to database")
                self._save_alerts()
        
        except Exception as e:
            logger.error(f"Error loading quality alerts: {str(e)}")
            # Fallback to sample alerts
            self._load_sample_alerts()
        
        finally:
            # Release the Supabase client back to the connection pool
            if client:
                try:
                    from supabase_client import release_supabase_client
                    release_supabase_client(client)
                except Exception as release_error:
                    logger.error(f"Error releasing Supabase client: {str(release_error)}")
    
    def _load_sample_alerts(self):
        """Load sample alerts for testing"""
        try:
            # Open space valuation alerting on very low values
            open_space_alert = QualityAlert(
                name="Open Space Valuation Check",
                description="Alerts when open space valuation is unexpectedly low",
                check_type="valuation",
                parameters={
                    "valuation_type": "current_use",
                    "property_data": {
                        "current_use_category": "open_space"
                    }
                },
                threshold=0.5,
                severity="medium",
                notification_channels=["log", "email"]
            )
            
            # Missing property data alert
            missing_data_alert = QualityAlert(
                name="Property Data Completeness Check",
                description="Monitors for missing required property data fields",
                check_type="completeness",
                parameters={
                    "table_name": "properties"
                },
                threshold=0.98,
                severity="high",
                notification_channels=["log"]
            )
            
            # Add sample alerts to collection
            self.alerts[open_space_alert.id] = open_space_alert
            self.alerts[missing_data_alert.id] = missing_data_alert
            
            logger.info(f"Loaded {len(self.alerts)} sample quality alerts")
        
        except Exception as e:
            logger.error(f"Error loading sample quality alerts: {str(e)}")
    
    def _save_alerts(self):
        """Save alerts to database"""
        try:
            # First try to save using SQLAlchemy
            try:
                from mcp.data_quality.models import QualityAlertModel
                from app import db, app
                
                # Use the app context to ensure we're in an application context
                with app.app_context():
                    # Start a session 
                    db.session.query(QualityAlertModel).delete()
                    
                    # Create new alert models
                    for alert in self.alerts.values():
                        alert_dict = alert.to_dict()
                        model = QualityAlertModel.from_dict(alert_dict)
                        db.session.add(model)
                    
                    # Commit changes
                    db.session.commit()
                    
                logger.info(f"Saved {len(self.alerts)} quality alerts to database using SQLAlchemy")
                return True
            except Exception as sa_error:
                logger.warning(f"Error saving alerts using SQLAlchemy: {str(sa_error)}")
                logger.info("Falling back to Supabase storage")
            
            # If SQLAlchemy fails, try Supabase as a fallback
            client = None
            try:
                # Get a Supabase client from the connection pool
                from supabase_client import get_supabase_client
                client = get_supabase_client()
                
                if not client:
                    logger.error("Failed to get Supabase client")
                    return False
                
                # Prepare data for database
                alert_data = [alert.to_dict() for alert in self.alerts.values()]
                
                # Try to use the table name that matches our SQLAlchemy model
                table_name = 'data_quality_alert'
                
                # Check if the table exists
                try:
                    # Try to query the table to check if it exists
                    response = client.table(table_name).select('*').limit(1).execute()
                    logger.info(f"Found {table_name} table in Supabase")
                except Exception as table_error:
                    logger.warning(f"Table {table_name} not found: {str(table_error)}")
                    
                    # Try with the old table name
                    try:
                        table_name = 'data_quality_alerts'
                        response = client.table(table_name).select('*').limit(1).execute()
                        logger.info(f"Found {table_name} table in Supabase")
                    except Exception as old_table_error:
                        logger.warning(f"Table {table_name} not found: {str(old_table_error)}")
                        logger.info("Using memory-only storage for quality alerts for now")
                        return True
                
                # Save to Supabase
                try:
                    # First delete all existing alerts
                    client.table(table_name).delete().neq('id', 'dummy_id').execute()
                    
                    # Then insert all current alerts if there are any
                    if alert_data:
                        client.table(table_name).insert(alert_data).execute()
                    
                    logger.info(f"Saved {len(self.alerts)} quality alerts to database using Supabase")
                    return True
                    
                except Exception as save_error:
                    logger.error(f"Error saving to {table_name}: {str(save_error)}")
                    return False
            
            except Exception as e:
                logger.error(f"Error saving quality alerts: {str(e)}")
                return False
            
            finally:
                # Release the Supabase client back to the connection pool
                if client:
                    from supabase_client import release_supabase_client
                    release_supabase_client(client)
        
        except Exception as e:
            logger.error(f"Error in _save_alerts: {str(e)}")
            return False

# Singleton instance
alert_manager = DataQualityAlertManager()