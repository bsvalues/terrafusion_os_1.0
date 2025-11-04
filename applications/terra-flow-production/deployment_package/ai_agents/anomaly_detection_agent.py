"""
Anomaly Detection Agent

This agent monitors property assessment data for anomalies and outliers,
using statistical and machine learning techniques to identify potential issues.
"""

import os
import logging
import time
import json
import datetime
import numpy as np
import uuid
import threading
from typing import Dict, List, Any, Optional, Union, Tuple

from sqlalchemy import text
from ai_agents.base_agent import AIAgent

logger = logging.getLogger(__name__)

class AnomalyDetectionAgent(AIAgent):
    """
    Agent responsible for detecting anomalies in property assessment data.
    Supports multiple detection algorithms and continuous monitoring.
    """
    
    def __init__(self, agent_id: str = None, name: str = "AnomalyDetectionAgent", 
                description: str = "Detects data anomalies in property assessment data", 
                capabilities: List[str] = None, **kwargs):
        """
        Initialize the anomaly detection agent.
        
        Args:
            agent_id: Unique identifier for the agent
            name: Name of the agent
            description: Description of the agent
            capabilities: Agent capabilities
            **kwargs: Additional configuration
        """
        # Default capabilities
        default_capabilities = [
            "outlier_detection",
            "pattern_detection",
            "trend_analysis",
            "rule_based_anomaly_detection",
            "statistical_anomaly_detection",
            "machine_learning_anomaly_detection"
        ]
        
        capabilities = capabilities or default_capabilities
        
        # Initialize base agent
        super().__init__(agent_id, name, description, capabilities)
        
        # Agent configuration
        self.config = {
            "scan_interval": kwargs.get("scan_interval", 60),  # seconds
            "detection_methods": kwargs.get("detection_methods", ["statistical", "rule_based"]),
            "sensitivity": kwargs.get("sensitivity", "medium"),
            "tables_to_monitor": kwargs.get("tables_to_monitor", ["properties", "parcels", "assessments"]),
            "notify_on_detection": kwargs.get("notify_on_detection", True),
            "auto_classify": kwargs.get("auto_classify", True),
            "learning_enabled": kwargs.get("learning_enabled", True)
        }
        
        # Anomaly tracking
        self.detected_anomalies = []
        self.last_scan_time = None
        
        # Detection models and baselines
        self.statistical_baselines = {}
        self.detection_rules = self._initialize_detection_rules()
        
        # Background scan task
        self.scan_thread = None
        self.scan_running = False
        
        logger.info(f"Anomaly Detection Agent '{self.name}' initialized")
    
    def _setup_agent(self):
        """Set up the agent and initialize baselines"""
        # Initialize statistical baselines for monitored tables
        self._initialize_statistical_baselines()
        
    def _initialize_statistical_baselines(self):
        """Initialize statistical baselines for monitored tables"""
        # This would typically load historical data and compute baseline statistics
        # For demonstration, using empty placeholders
        for table in self.config["tables_to_monitor"]:
            self.statistical_baselines[table] = {
                "last_updated": time.time(),
                "field_stats": {},  # Will be populated with field-level statistics
                "correlation_matrix": None,  # Will track correlation patterns
                "value_distributions": {}  # Will track distributions of values
            }
    
    def _initialize_detection_rules(self):
        """Initialize rule-based detection logic"""
        # These rules would be customized based on domain knowledge
        # and specific requirements for the Benton County data
        return {
            "properties": [
                {
                    "name": "assessed_value_outlier",
                    "description": "Detect outliers in property assessed values",
                    "condition": "value > mean + (3 * std_dev) OR value < mean - (3 * std_dev)",
                    "fields": ["assessed_value", "land_value", "improvement_value"],
                    "severity": "medium"
                },
                {
                    "name": "suspicious_value_change",
                    "description": "Detect suspiciously large changes in property values",
                    "condition": "percent_change > 50%",
                    "fields": ["assessed_value", "land_value"],
                    "severity": "high"
                }
            ],
            "parcels": [
                {
                    "name": "invalid_geometry",
                    "description": "Detect invalid parcel geometries",
                    "condition": "NOT ST_IsValid(geometry)",
                    "fields": ["geometry"],
                    "severity": "high"
                },
                {
                    "name": "unordered_vertices",
                    "description": "Detect unordered geometry vertices",
                    "condition": "NOT ST_OrderingEquals(geometry, ST_MakeValid(geometry))",
                    "fields": ["geometry"],
                    "severity": "medium"
                }
            ],
            "assessments": [
                {
                    "name": "missing_required_fields",
                    "description": "Detect missing required assessment fields",
                    "condition": "field IS NULL",
                    "fields": ["assessment_date", "assessor_id", "property_id"],
                    "severity": "high"
                },
                {
                    "name": "future_dated_assessment",
                    "description": "Detect assessments dated in the future",
                    "condition": "assessment_date > CURRENT_DATE",
                    "fields": ["assessment_date"],
                    "severity": "medium"
                }
            ]
        }
    
    def start(self):
        """Start the agent and the background scan thread"""
        super().start()
        
        # Start background scanning
        self.scan_running = True
        self.scan_thread = threading.Thread(target=self._background_scan_loop)
        self.scan_thread.daemon = True
        self.scan_thread.start()
        
        logger.info(f"Anomaly Detection Agent '{self.name}' scanning started")
    
    def stop(self):
        """Stop the agent and the background scan thread"""
        # Stop background scanning
        self.scan_running = False
        if self.scan_thread:
            self.scan_thread.join(timeout=2.0)
        
        super().stop()
        logger.info(f"Anomaly Detection Agent '{self.name}' stopped")
    
    def _background_tasks(self):
        """Perform background tasks"""
        # Update baselines periodically (every 24 hours)
        current_time = time.time()
        for table, baseline in self.statistical_baselines.items():
            if current_time - baseline["last_updated"] > 86400:  # 24 hours
                try:
                    self._update_statistical_baseline(table)
                except Exception as e:
                    logger.error(f"Error updating baseline for {table}: {str(e)}")
    
    def _background_scan_loop(self):
        """Background loop for periodic data scanning"""
        while self.scan_running:
            try:
                # Skip if agent is paused
                if self.status != "running":
                    time.sleep(1)
                    continue
                
                # Perform scan
                self._perform_data_scan()
                
                # Update last scan time
                self.last_scan_time = time.time()
                
                # Sleep until next scan
                time.sleep(self.config["scan_interval"])
            except Exception as e:
                logger.error(f"Error in anomaly scan loop: {str(e)}")
                time.sleep(5)  # Sleep briefly after error
    
    def _perform_data_scan(self):
        """Perform a scan for anomalies across monitored tables"""
        from app import db
        
        try:
            # Scan each monitored table
            for table in self.config["tables_to_monitor"]:
                # Determine which detection methods to use
                for method in self.config["detection_methods"]:
                    if method == "statistical":
                        anomalies = self._statistical_anomaly_scan(table)
                    elif method == "rule_based":
                        anomalies = self._rule_based_anomaly_scan(table)
                    else:
                        logger.warning(f"Unknown detection method: {method}")
                        continue
                    
                    # Process detected anomalies
                    self._process_detected_anomalies(table, method, anomalies)
        except Exception as e:
            logger.error(f"Error performing data scan: {str(e)}")
    
    def _statistical_anomaly_scan(self, table):
        """
        Perform statistical anomaly detection on a table.
        
        Args:
            table: Name of the table to scan
            
        Returns:
            List of detected anomalies
        """
        from app import db
        anomalies = []
        
        try:
            # Get baseline stats for the table
            baseline = self.statistical_baselines.get(table, {})
            if not baseline or not baseline.get("field_stats"):
                # No baseline yet, so create one
                self._update_statistical_baseline(table)
                return []
            
            # Get recent records for analysis
            query = f"""
                SELECT * FROM {table}
                ORDER BY created_at DESC LIMIT 1000
            """
            
            # Execute query safely
            result = db.session.execute(text(query))
            rows = result.fetchall()
            
            if not rows:
                return []
            
            # Convert to dictionaries
            columns = result.keys()
            records = [dict(zip(columns, row)) for row in rows]
            
            # Check each record for statistical anomalies
            for record in records:
                # Check numeric fields for outliers
                for field, stats in baseline["field_stats"].items():
                    if field not in record or record[field] is None:
                        continue
                    
                    try:
                        value = float(record[field])
                        
                        # Skip if no statistics available
                        if "mean" not in stats or "std_dev" not in stats:
                            continue
                        
                        # Calculate Z-score
                        z_score = (value - stats["mean"]) / max(stats["std_dev"], 0.0001)
                        
                        # Adjust threshold based on sensitivity
                        threshold = 3.0  # Default (medium)
                        if self.config["sensitivity"] == "high":
                            threshold = 2.5
                        elif self.config["sensitivity"] == "low":
                            threshold = 3.5
                        
                        # Check if outlier
                        if abs(z_score) > threshold:
                            anomalies.append({
                                "id": str(uuid.uuid4()),
                                "table": table,
                                "record_id": record.get("id"),
                                "field": field,
                                "value": value,
                                "expected_range": [
                                    stats["mean"] - (threshold * stats["std_dev"]),
                                    stats["mean"] + (threshold * stats["std_dev"])
                                ],
                                "z_score": z_score,
                                "anomaly_type": "statistical_outlier",
                                "detection_method": "statistical",
                                "severity": "medium" if abs(z_score) > threshold + 1 else "low",
                                "detected_at": datetime.datetime.now().isoformat()
                            })
                    except (ValueError, TypeError):
                        # Skip non-numeric values
                        pass
            
            return anomalies
        except Exception as e:
            logger.error(f"Error in statistical anomaly scan for {table}: {str(e)}")
            return []
    
    def _rule_based_anomaly_scan(self, table):
        """
        Perform rule-based anomaly detection on a table.
        
        Args:
            table: Name of the table to scan
            
        Returns:
            List of detected anomalies
        """
        from app import db
        anomalies = []
        
        try:
            # Get rules for this table
            rules = self.detection_rules.get(table, [])
            if not rules:
                return []
            
            # Process each rule
            for rule in rules:
                # Construct query based on the rule
                fields_str = ", ".join(["id"] + rule["fields"])
                
                # Translate rule condition to SQL
                condition = rule["condition"]
                # This is a simplified example - in production code, would use proper
                # SQL parameter binding and safe string formatting
                
                query = f"""
                    SELECT {fields_str} FROM {table}
                    WHERE {condition}
                    LIMIT 100
                """
                
                try:
                    # Execute query safely
                    result = db.session.execute(text(query))
                    rule_violations = result.fetchall()
                    
                    # Process violations
                    if rule_violations:
                        columns = result.keys()
                        for violation in rule_violations:
                            record = dict(zip(columns, violation))
                            
                            anomalies.append({
                                "id": str(uuid.uuid4()),
                                "table": table,
                                "record_id": record.get("id"),
                                "rule_name": rule["name"],
                                "rule_description": rule["description"],
                                "fields": rule["fields"],
                                "anomaly_type": "rule_violation",
                                "detection_method": "rule_based",
                                "severity": rule["severity"],
                                "detected_at": datetime.datetime.now().isoformat()
                            })
                except Exception as e:
                    logger.error(f"Error executing rule '{rule['name']}': {str(e)}")
            
            return anomalies
        except Exception as e:
            logger.error(f"Error in rule-based anomaly scan for {table}: {str(e)}")
            return []
    
    def _update_statistical_baseline(self, table):
        """
        Update statistical baseline for a table.
        
        Args:
            table: Name of the table to update
        """
        from app import db
        
        try:
            # Query to get column names and types
            metadata_query = f"""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = '{table}'
            """
            
            # Execute query safely
            result = db.session.execute(text(metadata_query))
            columns = result.fetchall()
            
            # Identify numeric columns
            numeric_columns = [col[0] for col in columns 
                              if col[1] in ('integer', 'numeric', 'real', 'double precision')]
            
            # Skip tables with no numeric columns
            if not numeric_columns:
                logger.info(f"No numeric columns in {table}, skipping baseline update")
                return
            
            # Query to get data for baseline calculation
            columns_str = ", ".join(numeric_columns)
            data_query = f"""
                SELECT {columns_str} FROM {table}
                LIMIT 10000
            """
            
            # Execute query safely
            result = db.session.execute(text(data_query))
            rows = result.fetchall()
            
            if not rows:
                logger.info(f"No data in {table}, skipping baseline update")
                return
            
            # Calculate statistics for each numeric column
            field_stats = {}
            for i, column in enumerate(numeric_columns):
                values = [row[i] for row in rows if row[i] is not None]
                
                if values:
                    # Calculate basic statistics
                    mean = sum(values) / len(values)
                    
                    # Calculate standard deviation
                    squared_diffs = [(value - mean) ** 2 for value in values]
                    variance = sum(squared_diffs) / len(values)
                    std_dev = variance ** 0.5
                    
                    # Calculate additional statistics
                    values.sort()
                    median = values[len(values) // 2]
                    min_value = min(values)
                    max_value = max(values)
                    
                    # Store statistics
                    field_stats[column] = {
                        "mean": mean,
                        "median": median,
                        "std_dev": std_dev,
                        "min": min_value,
                        "max": max_value,
                        "count": len(values)
                    }
            
            # Update the baseline
            self.statistical_baselines[table] = {
                "last_updated": time.time(),
                "field_stats": field_stats
            }
            
            logger.info(f"Updated statistical baseline for {table}")
        except Exception as e:
            logger.error(f"Error updating statistical baseline for {table}: {str(e)}")
    
    def _process_detected_anomalies(self, table, method, anomalies):
        """
        Process detected anomalies.
        
        Args:
            table: Table where anomalies were detected
            method: Detection method used
            anomalies: List of detected anomalies
        """
        if not anomalies:
            return
        
        # Store the anomalies
        self.detected_anomalies.extend(anomalies)
        
        # Limit the stored anomalies to prevent memory issues
        if len(self.detected_anomalies) > 1000:
            self.detected_anomalies = self.detected_anomalies[-1000:]
        
        # Log the anomalies
        logger.info(f"Detected {len(anomalies)} anomalies in {table} using {method} method")
        
        # Send notifications if enabled
        if self.config["notify_on_detection"]:
            self._send_anomaly_notifications(anomalies)
        
        # Store anomalies in the database
        self._store_anomalies(anomalies)
    
    def _send_anomaly_notifications(self, anomalies):
        """
        Send notifications for detected anomalies.
        
        Args:
            anomalies: List of detected anomalies
        """
        try:
            from data_governance.notification_manager import send_data_quality_notification
            
            # Group anomalies by severity
            anomalies_by_severity = {}
            for anomaly in anomalies:
                severity = anomaly.get("severity", "low")
                if severity not in anomalies_by_severity:
                    anomalies_by_severity[severity] = []
                anomalies_by_severity[severity].append(anomaly)
            
            # Send notifications for each severity level
            for severity, severity_anomalies in anomalies_by_severity.items():
                if not severity_anomalies:
                    continue
                
                # Determine recipients based on severity
                recipients = ["data_quality_team"]
                if severity in ("high", "critical"):
                    recipients.append("data_governance_team")
                if severity == "critical":
                    recipients.append("security_team")
                
                # Create notification
                notification = {
                    "title": f"{len(severity_anomalies)} {severity} anomalies detected",
                    "message": f"Detected {len(severity_anomalies)} {severity} anomalies in {severity_anomalies[0]['table']}",
                    "severity": severity,
                    "anomalies": severity_anomalies,
                    "detection_time": datetime.datetime.now().isoformat()
                }
                
                # Send notification
                send_data_quality_notification(
                    recipients=recipients,
                    notification_data=notification
                )
                
                logger.info(f"Sent notification for {len(severity_anomalies)} {severity} anomalies")
        except Exception as e:
            logger.error(f"Error sending anomaly notifications: {str(e)}")
    
    def _store_anomalies(self, anomalies):
        """
        Store detected anomalies in the database.
        
        Args:
            anomalies: List of detected anomalies
        """
        try:
            from app import db
            from data_quality.models import DataAnomaly
            
            # Insert each anomaly
            for anomaly in anomalies:
                # Create database record
                db_anomaly = DataAnomaly(
                    table_name=anomaly.get("table"),
                    field_name=anomaly.get("field"),
                    record_id=anomaly.get("record_id"),
                    anomaly_type=anomaly.get("anomaly_type"),
                    anomaly_details=json.dumps(anomaly),
                    anomaly_score=anomaly.get("z_score", 0.0),
                    severity=anomaly.get("severity", "low"),
                    status="open",
                    detected_at=datetime.datetime.now()
                )
                
                # Add to database
                db.session.add(db_anomaly)
            
            # Commit transaction
            db.session.commit()
            
            logger.info(f"Stored {len(anomalies)} anomalies in the database")
        except Exception as e:
            logger.error(f"Error storing anomalies in database: {str(e)}")
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task.
        
        Args:
            task_data: Task data
            
        Returns:
            Task result
        """
        task_type = task_data.get("type")
        
        if task_type == "update_baselines":
            # Update statistical baselines
            tables = task_data.get("tables", self.config["tables_to_monitor"])
            for table in tables:
                try:
                    self._update_statistical_baseline(table)
                except Exception as e:
                    return {
                        "status": "error",
                        "error": f"Error updating baseline for {table}: {str(e)}"
                    }
            
            return {
                "status": "success",
                "message": f"Updated baselines for {len(tables)} tables"
            }
        
        elif task_type == "scan_for_anomalies":
            # Perform an immediate scan
            tables = task_data.get("tables", self.config["tables_to_monitor"])
            methods = task_data.get("methods", self.config["detection_methods"])
            
            all_anomalies = []
            for table in tables:
                for method in methods:
                    try:
                        if method == "statistical":
                            anomalies = self._statistical_anomaly_scan(table)
                        elif method == "rule_based":
                            anomalies = self._rule_based_anomaly_scan(table)
                        else:
                            continue
                        
                        self._process_detected_anomalies(table, method, anomalies)
                        all_anomalies.extend(anomalies)
                    except Exception as e:
                        return {
                            "status": "error",
                            "error": f"Error scanning {table} with {method}: {str(e)}"
                        }
            
            return {
                "status": "success",
                "message": f"Detected {len(all_anomalies)} anomalies",
                "anomalies": all_anomalies
            }
        
        elif task_type == "get_anomalies":
            # Get detected anomalies
            filters = task_data.get("filters", {})
            
            # Apply filters
            filtered_anomalies = self.detected_anomalies
            
            if "table" in filters:
                filtered_anomalies = [a for a in filtered_anomalies if a.get("table") == filters["table"]]
            
            if "severity" in filters:
                filtered_anomalies = [a for a in filtered_anomalies if a.get("severity") == filters["severity"]]
            
            if "type" in filters:
                filtered_anomalies = [a for a in filtered_anomalies if a.get("anomaly_type") == filters["type"]]
            
            if "since" in filters:
                since = datetime.datetime.fromisoformat(filters["since"])
                filtered_anomalies = [
                    a for a in filtered_anomalies 
                    if datetime.datetime.fromisoformat(a.get("detected_at", "2000-01-01T00:00:00")) >= since
                ]
            
            # Sort by detection time
            filtered_anomalies.sort(
                key=lambda a: a.get("detected_at", "2000-01-01T00:00:00"),
                reverse=True
            )
            
            # Limit results
            limit = task_data.get("limit", 100)
            filtered_anomalies = filtered_anomalies[:limit]
            
            return {
                "status": "success",
                "anomalies": filtered_anomalies,
                "count": len(filtered_anomalies),
                "total": len(self.detected_anomalies)
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
        
        else:
            return {
                "status": "error",
                "error": f"Unknown task type: {task_type}"
            }