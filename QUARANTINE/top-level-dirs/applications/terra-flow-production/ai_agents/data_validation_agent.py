"""
Data Validation Agent

This agent performs data validation on property assessment data,
ensuring integrity, consistency, and compliance with business rules.
"""

import os
import logging
import time
import json
import datetime
import uuid
import threading
import re
from typing import Dict, List, Any, Optional, Union, Tuple

from sqlalchemy import text
from ai_agents.base_agent import AIAgent

logger = logging.getLogger(__name__)

class DataValidationAgent(AIAgent):
    """
    Agent responsible for validating property assessment data.
    Ensures data integrity, consistency, and compliance with business rules.
    """
    
    def __init__(self, agent_id: str = None, name: str = "DataValidationAgent", 
                description: str = "Validates property assessment data integrity", 
                capabilities: List[str] = None, **kwargs):
        """
        Initialize the data validation agent.
        
        Args:
            agent_id: Unique identifier for the agent
            name: Name of the agent
            description: Description of the agent
            capabilities: Agent capabilities
            **kwargs: Additional configuration
        """
        # Default capabilities
        default_capabilities = [
            "schema_validation",
            "data_quality_checks",
            "business_rule_validation",
            "format_validation",
            "relationship_validation",
            "compliance_validation"
        ]
        
        capabilities = capabilities or default_capabilities
        
        # Initialize base agent
        super().__init__(agent_id, name, description, capabilities)
        
        # Agent configuration
        self.config = {
            "validation_interval": kwargs.get("validation_interval", 3600),  # 1 hour
            "validation_scope": kwargs.get("validation_scope", "incremental"),  # or "full"
            "tables_to_validate": kwargs.get("tables_to_validate", [
                "properties", "parcels", "assessments", "owners", "sales"
            ]),
            "auto_repair": kwargs.get("auto_repair", False),
            "log_all_validations": kwargs.get("log_all_validations", False),
            "notify_on_failure": kwargs.get("notify_on_failure", True)
        }
        
        # Validation tracking
        self.validation_results = []
        self.last_validation_time = None
        self.validation_stats = {
            "total_validations": 0,
            "passed_validations": 0,
            "failed_validations": 0,
            "repaired_records": 0
        }
        
        # Validation rules and schemas
        self.validation_rules = self._initialize_validation_rules()
        self.field_validators = self._initialize_field_validators()
        
        # Background validation task
        self.validation_thread = None
        self.validation_running = False
        
        logger.info(f"Data Validation Agent '{self.name}' initialized")
    
    def _initialize_validation_rules(self):
        """Initialize data validation rules"""
        # These rules would be customized based on domain knowledge
        # and specific requirements for the Benton County data
        return {
            "properties": [
                {
                    "name": "required_fields",
                    "description": "Check required fields are present",
                    "fields": ["parcel_id", "property_type", "address_id"],
                    "severity": "critical"
                },
                {
                    "name": "valid_property_type",
                    "description": "Property type must be valid",
                    "valid_values": ["residential", "commercial", "agricultural", "industrial", "public"],
                    "fields": ["property_type"],
                    "severity": "high"
                },
                {
                    "name": "assessed_value_consistency",
                    "description": "Total value must equal sum of land and improvements",
                    "expression": "total_value = land_value + improvement_value",
                    "fields": ["total_value", "land_value", "improvement_value"],
                    "tolerance": 0.01,  # Allow for small rounding differences
                    "severity": "medium"
                }
            ],
            "parcels": [
                {
                    "name": "valid_geometry",
                    "description": "Parcel geometry must be valid",
                    "sql_check": "ST_IsValid(geometry)",
                    "fields": ["geometry"],
                    "severity": "high"
                },
                {
                    "name": "valid_parcel_id_format",
                    "description": "Parcel ID must match standard format",
                    "regex": r"^\d{2}-\d{4}-\d{3}$",
                    "fields": ["parcel_id"],
                    "severity": "high"
                }
            ],
            "assessments": [
                {
                    "name": "valid_assessment_date",
                    "description": "Assessment date must be in the past",
                    "expression": "assessment_date <= CURRENT_DATE",
                    "fields": ["assessment_date"],
                    "severity": "medium"
                },
                {
                    "name": "valid_assessor",
                    "description": "Assessor must exist in staff table",
                    "sql_check": "EXISTS (SELECT 1 FROM staff WHERE id = assessor_id)",
                    "fields": ["assessor_id"],
                    "severity": "medium"
                }
            ],
            "owners": [
                {
                    "name": "valid_contact_info",
                    "description": "Owner must have valid contact information",
                    "expression": "email IS NOT NULL OR phone IS NOT NULL OR address_id IS NOT NULL",
                    "fields": ["email", "phone", "address_id"],
                    "severity": "medium"
                },
                {
                    "name": "valid_email_format",
                    "description": "Email must be in valid format",
                    "regex": r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$",
                    "fields": ["email"],
                    "severity": "low",
                    "null_allowed": True
                }
            ],
            "sales": [
                {
                    "name": "valid_sale_date",
                    "description": "Sale date must be in the past",
                    "expression": "sale_date <= CURRENT_DATE",
                    "fields": ["sale_date"],
                    "severity": "medium"
                },
                {
                    "name": "valid_sale_price",
                    "description": "Sale price must be positive",
                    "expression": "sale_price > 0",
                    "fields": ["sale_price"],
                    "severity": "medium"
                }
            ]
        }
    
    def _initialize_field_validators(self):
        """Initialize field-level validators"""
        return {
            # Standard field types
            "string": lambda v, **kwargs: isinstance(v, str) and 
                     (len(v) <= kwargs.get("max_length", 255)) and 
                     (len(v) >= kwargs.get("min_length", 0)),
            
            "integer": lambda v, **kwargs: isinstance(v, int) and 
                     (v <= kwargs.get("max_value", float("inf"))) and 
                     (v >= kwargs.get("min_value", float("-inf"))),
            
            "float": lambda v, **kwargs: isinstance(v, (int, float)) and 
                     (v <= kwargs.get("max_value", float("inf"))) and 
                     (v >= kwargs.get("min_value", float("-inf"))),
            
            "boolean": lambda v, **kwargs: isinstance(v, bool),
            
            "date": lambda v, **kwargs: (
                isinstance(v, datetime.date) or
                (isinstance(v, str) and self._is_valid_date(v))
            ),
            
            "datetime": lambda v, **kwargs: (
                isinstance(v, datetime.datetime) or
                (isinstance(v, str) and self._is_valid_datetime(v))
            ),
            
            "email": lambda v, **kwargs: (
                isinstance(v, str) and 
                re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", v)
            ),
            
            "phone": lambda v, **kwargs: (
                isinstance(v, str) and 
                re.match(r"^\+?[0-9]{10,15}$", v.replace("-", "").replace(" ", ""))
            ),
            
            "url": lambda v, **kwargs: (
                isinstance(v, str) and 
                re.match(r"^https?://[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", v)
            ),
            
            # Domain-specific field types
            "parcel_id": lambda v, **kwargs: (
                isinstance(v, str) and 
                re.match(r"^\d{2}-\d{4}-\d{3}$", v)
            ),
            
            "property_type": lambda v, **kwargs: (
                isinstance(v, str) and 
                v in ["residential", "commercial", "agricultural", "industrial", "public"]
            ),
            
            "address": lambda v, **kwargs: (
                isinstance(v, str) and 
                len(v) <= 255 and
                ("," in v or " " in v)  # Basic check for address components
            ),
            
            "zip_code": lambda v, **kwargs: (
                isinstance(v, str) and 
                (re.match(r"^\d{5}$", v) or re.match(r"^\d{5}-\d{4}$", v))
            ),
            
            # Custom validators
            "regex": lambda v, **kwargs: (
                isinstance(v, str) and 
                re.match(kwargs.get("pattern", ".*"), v)
            ),
            
            "enum": lambda v, **kwargs: v in kwargs.get("values", []),
            
            "range": lambda v, **kwargs: (
                isinstance(v, (int, float)) and
                (v >= kwargs.get("min", float("-inf"))) and
                (v <= kwargs.get("max", float("inf")))
            ),
            
            "json": lambda v, **kwargs: (
                (isinstance(v, str) and self._is_valid_json(v)) or
                isinstance(v, (dict, list))
            ),
            
            "geojson": lambda v, **kwargs: (
                self._is_valid_geojson(v)
            )
        }
    
    def start(self):
        """Start the agent and the background validation thread"""
        super().start()
        
        # Start background validation
        self.validation_running = True
        self.validation_thread = threading.Thread(target=self._background_validation_loop)
        self.validation_thread.daemon = True
        self.validation_thread.start()
        
        logger.info(f"Data Validation Agent '{self.name}' validation started")
    
    def stop(self):
        """Stop the agent and the background validation thread"""
        # Stop background validation
        self.validation_running = False
        if self.validation_thread:
            self.validation_thread.join(timeout=2.0)
        
        super().stop()
        logger.info(f"Data Validation Agent '{self.name}' stopped")
    
    def _background_validation_loop(self):
        """Background loop for periodic data validation"""
        while self.validation_running:
            try:
                # Skip if agent is paused
                if self.status != "running":
                    time.sleep(1)
                    continue
                
                # Check if it's time for validation
                current_time = time.time()
                if (self.last_validation_time is None or 
                    current_time - self.last_validation_time >= self.config["validation_interval"]):
                    
                    # Perform validation
                    self._perform_validation()
                    
                    # Update last validation time
                    self.last_validation_time = current_time
                
                # Sleep briefly before checking again
                time.sleep(10)
            except Exception as e:
                logger.error(f"Error in validation loop: {str(e)}")
                time.sleep(5)  # Sleep briefly after error
    
    def _perform_validation(self):
        """Perform validation across monitored tables"""
        logger.info(f"Starting validation run for {len(self.config['tables_to_validate'])} tables")
        
        try:
            all_results = []
            
            # Validate each table
            for table in self.config["tables_to_validate"]:
                # Skip if table has no validation rules
                if table not in self.validation_rules:
                    continue
                
                # Get validation rules for the table
                rules = self.validation_rules[table]
                
                # Perform validation
                if self.config["validation_scope"] == "full":
                    results = self._validate_table_full(table, rules)
                else:
                    results = self._validate_table_incremental(table, rules)
                
                # Process results
                self._process_validation_results(table, results)
                all_results.extend(results)
            
            # Update validation stats
            self.validation_stats["total_validations"] += len(all_results)
            self.validation_stats["passed_validations"] += sum(1 for r in all_results if r["status"] == "passed")
            self.validation_stats["failed_validations"] += sum(1 for r in all_results if r["status"] == "failed")
            
            # Store results
            self.validation_results.extend(all_results)
            
            # Limit stored results to prevent memory issues
            if len(self.validation_results) > 1000:
                self.validation_results = self.validation_results[-1000:]
            
            logger.info(f"Completed validation run with {len(all_results)} validations")
        except Exception as e:
            logger.error(f"Error performing validation: {str(e)}")
    
    def _validate_table_full(self, table, rules):
        """
        Perform full validation on a table.
        
        Args:
            table: Name of the table to validate
            rules: Validation rules for the table
            
        Returns:
            List of validation results
        """
        from app import db
        results = []
        
        try:
            # Query to get all records
            query = f"SELECT * FROM {table}"
            
            # Execute query safely
            records_result = db.session.execute(text(query))
            records = records_result.fetchall()
            
            if not records:
                return results
            
            # Get column names
            columns = records_result.keys()
            
            # Apply validation rules to each record
            for record in records:
                record_dict = dict(zip(columns, record))
                record_id = record_dict.get("id")
                
                # Apply each rule
                for rule in rules:
                    result = self._apply_validation_rule(table, record_dict, rule)
                    results.append(result)
            
            return results
        except Exception as e:
            logger.error(f"Error performing full validation on {table}: {str(e)}")
            return []
    
    def _validate_table_incremental(self, table, rules):
        """
        Perform incremental validation on a table.
        
        Args:
            table: Name of the table to validate
            rules: Validation rules for the table
            
        Returns:
            List of validation results
        """
        from app import db
        results = []
        
        try:
            # Determine cutoff time for incremental validation
            if self.last_validation_time:
                cutoff_time = datetime.datetime.fromtimestamp(self.last_validation_time)
            else:
                # First time, use recent timeframe
                cutoff_time = datetime.datetime.now() - datetime.timedelta(hours=24)
            
            # Query to get records modified since last validation
            query = f"""
                SELECT * FROM {table}
                WHERE updated_at >= :cutoff_time OR created_at >= :cutoff_time
            """
            
            # Execute query safely
            records_result = db.session.execute(
                text(query),
                {"cutoff_time": cutoff_time}
            )
            records = records_result.fetchall()
            
            if not records:
                return results
            
            # Get column names
            columns = records_result.keys()
            
            # Apply validation rules to each record
            for record in records:
                record_dict = dict(zip(columns, record))
                record_id = record_dict.get("id")
                
                # Apply each rule
                for rule in rules:
                    result = self._apply_validation_rule(table, record_dict, rule)
                    results.append(result)
            
            return results
        except Exception as e:
            logger.error(f"Error performing incremental validation on {table}: {str(e)}")
            return []
    
    def _apply_validation_rule(self, table, record, rule):
        """
        Apply a validation rule to a record.
        
        Args:
            table: Name of the table
            record: Record to validate
            rule: Validation rule to apply
            
        Returns:
            Validation result
        """
        result = {
            "id": str(uuid.uuid4()),
            "table": table,
            "record_id": record.get("id"),
            "rule_name": rule["name"],
            "rule_description": rule["description"],
            "fields": rule["fields"],
            "severity": rule["severity"],
            "validation_time": datetime.datetime.now().isoformat()
        }
        
        try:
            # Check different rule types
            if "required_fields" in rule["name"]:
                # Check required fields
                missing_fields = [field for field in rule["fields"] 
                                if field not in record or record[field] is None]
                
                if missing_fields:
                    result["status"] = "failed"
                    result["message"] = f"Missing required fields: {', '.join(missing_fields)}"
                else:
                    result["status"] = "passed"
                    result["message"] = "All required fields present"
            
            elif "valid_values" in rule:
                # Check enum values
                invalid_fields = []
                for field in rule["fields"]:
                    if field in record and record[field] not in rule["valid_values"]:
                        invalid_fields.append(field)
                
                if invalid_fields:
                    result["status"] = "failed"
                    result["message"] = f"Invalid values in fields: {', '.join(invalid_fields)}"
                else:
                    result["status"] = "passed"
                    result["message"] = "All values are valid"
            
            elif "regex" in rule:
                # Check regex pattern
                invalid_fields = []
                pattern = re.compile(rule["regex"])
                
                for field in rule["fields"]:
                    if field in record and record[field] is not None:
                        if not pattern.match(str(record[field])):
                            invalid_fields.append(field)
                
                if invalid_fields:
                    result["status"] = "failed"
                    result["message"] = f"Fields do not match pattern: {', '.join(invalid_fields)}"
                else:
                    result["status"] = "passed"
                    result["message"] = "All fields match pattern"
            
            elif "expression" in rule:
                # Evaluate expression
                expression = rule["expression"]
                
                # Replace field names with values
                for field in rule["fields"]:
                    if field in record:
                        expression = expression.replace(field, str(record[field]))
                
                # Special handling for some expressions
                if "=" in expression:
                    # Equality check with tolerance
                    parts = expression.split("=")
                    left = eval(parts[0].strip())
                    right = eval(parts[1].strip())
                    
                    tolerance = rule.get("tolerance", 0)
                    if abs(left - right) <= tolerance:
                        result["status"] = "passed"
                        result["message"] = "Expression is valid"
                    else:
                        result["status"] = "failed"
                        result["message"] = f"Expression not valid: {left} != {right}"
                else:
                    # Boolean expression
                    if eval(expression):
                        result["status"] = "passed"
                        result["message"] = "Expression is valid"
                    else:
                        result["status"] = "failed"
                        result["message"] = f"Expression not valid: {expression}"
            
            elif "sql_check" in rule:
                # SQL check requires a separate query
                from app import db
                
                sql_check = rule["sql_check"]
                record_id = record.get("id")
                
                query = f"""
                    SELECT CASE WHEN {sql_check} THEN 1 ELSE 0 END AS check_result
                    FROM {table}
                    WHERE id = :record_id
                """
                
                check_result = db.session.execute(
                    text(query),
                    {"record_id": record_id}
                ).scalar()
                
                if check_result:
                    result["status"] = "passed"
                    result["message"] = "SQL check passed"
                else:
                    result["status"] = "failed"
                    result["message"] = "SQL check failed"
            
            else:
                # Default field type validation
                invalid_fields = []
                
                for field in rule["fields"]:
                    if field in record and record[field] is not None:
                        field_type = self._infer_field_type(record[field])
                        if field_type in self.field_validators:
                            if not self.field_validators[field_type](record[field]):
                                invalid_fields.append(field)
                
                if invalid_fields:
                    result["status"] = "failed"
                    result["message"] = f"Invalid field types: {', '.join(invalid_fields)}"
                else:
                    result["status"] = "passed"
                    result["message"] = "All field types are valid"
        
        except Exception as e:
            result["status"] = "error"
            result["message"] = f"Error applying rule: {str(e)}"
        
        return result
    
    def _process_validation_results(self, table, results):
        """
        Process validation results.
        
        Args:
            table: Table that was validated
            results: Validation results
        """
        if not results:
            return
        
        # Count failed validations
        failed_results = [r for r in results if r["status"] == "failed"]
        
        if not failed_results:
            # All validations passed
            logger.info(f"All validations passed for table {table}")
            return
        
        # Log failures
        logger.warning(f"{len(failed_results)} validations failed for table {table}")
        
        # Group failures by severity
        failures_by_severity = {}
        for result in failed_results:
            severity = result.get("severity", "low")
            if severity not in failures_by_severity:
                failures_by_severity[severity] = []
            failures_by_severity[severity].append(result)
        
        # Log counts by severity
        for severity, failures in failures_by_severity.items():
            logger.warning(f"{len(failures)} {severity} validation failures for {table}")
        
        # Send notifications for failures if enabled
        if self.config["notify_on_failure"]:
            self._send_validation_failure_notifications(table, failures_by_severity)
        
        # Auto-repair if enabled
        if self.config["auto_repair"]:
            repaired_count = self._auto_repair_failures(table, failed_results)
            if repaired_count > 0:
                logger.info(f"Auto-repaired {repaired_count} records in {table}")
                self.validation_stats["repaired_records"] += repaired_count
    
    def _send_validation_failure_notifications(self, table, failures_by_severity):
        """
        Send notifications for validation failures.
        
        Args:
            table: Table with failures
            failures_by_severity: Failures grouped by severity
        """
        try:
            from data_governance.notification_manager import send_data_quality_notification
            
            # Send notifications for each severity level
            for severity, failures in failures_by_severity.items():
                if not failures:
                    continue
                
                # Determine recipients based on severity
                recipients = ["data_quality_team"]
                if severity in ("high", "critical"):
                    recipients.append("data_governance_team")
                if severity == "critical":
                    recipients.append("security_team")
                
                # Create notification
                notification = {
                    "title": f"{len(failures)} {severity} validation failures in {table}",
                    "message": f"Data validation found {len(failures)} {severity} failures in {table}",
                    "severity": severity,
                    "failures": failures[:10],  # Include first 10 failures
                    "total_failures": len(failures),
                    "validation_time": datetime.datetime.now().isoformat()
                }
                
                # Send notification
                send_data_quality_notification(
                    recipients=recipients,
                    notification_data=notification
                )
                
                logger.info(f"Sent notification for {len(failures)} {severity} validation failures")
        except Exception as e:
            logger.error(f"Error sending validation failure notifications: {str(e)}")
    
    def _auto_repair_failures(self, table, failures):
        """
        Attempt to automatically repair validation failures.
        
        Args:
            table: Table with failures
            failures: List of validation failures
            
        Returns:
            Number of records repaired
        """
        from app import db
        repaired_count = 0
        
        # Group failures by record
        failures_by_record = {}
        for failure in failures:
            record_id = failure.get("record_id")
            if not record_id:
                continue
            
            if record_id not in failures_by_record:
                failures_by_record[record_id] = []
            failures_by_record[record_id].append(failure)
        
        # Process each record
        for record_id, record_failures in failures_by_record.items():
            try:
                # Get record data
                query = f"SELECT * FROM {table} WHERE id = :record_id"
                record_result = db.session.execute(
                    text(query),
                    {"record_id": record_id}
                )
                record = record_result.fetchone()
                
                if not record:
                    continue
                
                # Convert to dictionary
                columns = record_result.keys()
                record_dict = dict(zip(columns, record))
                
                # Collect fields to update
                updates = {}
                
                # Apply repairs based on failure types
                for failure in record_failures:
                    rule_name = failure.get("rule_name", "")
                    fields = failure.get("fields", [])
                    
                    # Apply repairs based on rule type
                    if "required_fields" in rule_name:
                        # Can't repair missing required fields
                        continue
                    
                    elif "valid_values" in rule_name:
                        # Set to default value for the field
                        for field in fields:
                            if field in record_dict and field not in updates:
                                # Get default value for the field
                                default_value = self._get_field_default(table, field)
                                if default_value is not None:
                                    updates[field] = default_value
                    
                    elif "regex" in rule_name:
                        # Cannot automatically repair regex failures
                        continue
                    
                    elif "expression" in rule_name:
                        # Cannot automatically repair expression failures
                        continue
                    
                    elif "sql_check" in rule_name:
                        # Cannot automatically repair SQL check failures
                        continue
                    
                    else:
                        # Type-based repairs
                        for field in fields:
                            if field in record_dict and field not in updates:
                                # Get default value for the field
                                default_value = self._get_field_default(table, field)
                                if default_value is not None:
                                    updates[field] = default_value
                
                # Apply updates if any
                if updates:
                    set_clause = ", ".join([f"{field} = :{field}" for field in updates])
                    update_query = f"""
                        UPDATE {table}
                        SET {set_clause}
                        WHERE id = :record_id
                    """
                    
                    # Add record_id to updates
                    updates["record_id"] = record_id
                    
                    # Execute update
                    db.session.execute(text(update_query), updates)
                    db.session.commit()
                    
                    repaired_count += 1
                    
                    logger.info(f"Auto-repaired record {record_id} in {table}: {updates}")
            
            except Exception as e:
                logger.error(f"Error repairing record {record_id} in {table}: {str(e)}")
                db.session.rollback()
        
        return repaired_count
    
    def _get_field_default(self, table, field):
        """Get default value for a field"""
        # This would typically query the database schema or a configuration
        # For demonstration, using hardcoded defaults
        defaults = {
            "properties": {
                "property_type": "residential",
                "status": "active"
            },
            "parcels": {
                "status": "active"
            },
            "assessments": {
                "assessment_date": datetime.date.today()
            },
            "owners": {
                "status": "active"
            },
            "sales": {
                "sale_date": datetime.date.today()
            }
        }
        
        return defaults.get(table, {}).get(field)
    
    def _infer_field_type(self, value):
        """Infer the type of a field value"""
        if value is None:
            return "null"
        elif isinstance(value, bool):
            return "boolean"
        elif isinstance(value, int):
            return "integer"
        elif isinstance(value, float):
            return "float"
        elif isinstance(value, (datetime.date, datetime.datetime)):
            return "date"
        elif isinstance(value, str):
            # Check for special string types
            if re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", value):
                return "email"
            elif re.match(r"^\+?[0-9]{10,15}$", value.replace("-", "").replace(" ", "")):
                return "phone"
            elif re.match(r"^https?://", value):
                return "url"
            elif re.match(r"^\d{2}-\d{4}-\d{3}$", value):
                return "parcel_id"
            elif self._is_valid_json(value):
                return "json"
            else:
                return "string"
        else:
            return "unknown"
    
    def _is_valid_date(self, value):
        """Check if a string is a valid date"""
        try:
            datetime.datetime.strptime(value, "%Y-%m-%d")
            return True
        except ValueError:
            return False
    
    def _is_valid_datetime(self, value):
        """Check if a string is a valid datetime"""
        try:
            datetime.datetime.fromisoformat(value)
            return True
        except ValueError:
            return False
    
    def _is_valid_json(self, value):
        """Check if a string is valid JSON"""
        try:
            json.loads(value)
            return True
        except (ValueError, TypeError):
            return False
    
    def _is_valid_geojson(self, value):
        """Check if a value is valid GeoJSON"""
        try:
            if isinstance(value, str):
                value = json.loads(value)
            
            # Basic GeoJSON validation
            if not isinstance(value, dict):
                return False
            
            if "type" not in value:
                return False
            
            if value["type"] not in ["Point", "LineString", "Polygon", "MultiPoint",
                                    "MultiLineString", "MultiPolygon", "GeometryCollection",
                                    "Feature", "FeatureCollection"]:
                return False
            
            return True
        except Exception:
            return False
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task.
        
        Args:
            task_data: Task data
            
        Returns:
            Task result
        """
        task_type = task_data.get("type")
        
        if task_type == "validate_table":
            # Validate a specific table
            table = task_data.get("table")
            scope = task_data.get("scope", "incremental")
            
            if not table:
                return {
                    "status": "error",
                    "error": "No table specified"
                }
            
            if table not in self.validation_rules:
                return {
                    "status": "error",
                    "error": f"No validation rules for table {table}"
                }
            
            # Get validation rules for the table
            rules = self.validation_rules[table]
            
            # Perform validation
            if scope == "full":
                results = self._validate_table_full(table, rules)
            else:
                results = self._validate_table_incremental(table, rules)
            
            # Process results
            self._process_validation_results(table, results)
            
            return {
                "status": "success",
                "message": f"Validated {table} with {len(results)} checks",
                "results": results,
                "passed": len([r for r in results if r["status"] == "passed"]),
                "failed": len([r for r in results if r["status"] == "failed"])
            }
        
        elif task_type == "validate_record":
            # Validate a specific record
            table = task_data.get("table")
            record_id = task_data.get("record_id")
            
            if not table or not record_id:
                return {
                    "status": "error",
                    "error": "Table and record_id are required"
                }
            
            if table not in self.validation_rules:
                return {
                    "status": "error",
                    "error": f"No validation rules for table {table}"
                }
            
            try:
                from app import db
                
                # Get record data
                query = f"SELECT * FROM {table} WHERE id = :record_id"
                record_result = db.session.execute(
                    text(query),
                    {"record_id": record_id}
                )
                record = record_result.fetchone()
                
                if not record:
                    return {
                        "status": "error",
                        "error": f"Record {record_id} not found in {table}"
                    }
                
                # Convert to dictionary
                columns = record_result.keys()
                record_dict = dict(zip(columns, record))
                
                # Get validation rules for the table
                rules = self.validation_rules[table]
                
                # Apply validation rules
                results = []
                for rule in rules:
                    result = self._apply_validation_rule(table, record_dict, rule)
                    results.append(result)
                
                return {
                    "status": "success",
                    "message": f"Validated record {record_id} in {table}",
                    "results": results,
                    "passed": len([r for r in results if r["status"] == "passed"]),
                    "failed": len([r for r in results if r["status"] == "failed"])
                }
            
            except Exception as e:
                return {
                    "status": "error",
                    "error": f"Error validating record: {str(e)}"
                }
        
        elif task_type == "get_validation_results":
            # Get validation results
            filters = task_data.get("filters", {})
            
            # Apply filters
            filtered_results = self.validation_results
            
            if "table" in filters:
                filtered_results = [r for r in filtered_results if r.get("table") == filters["table"]]
            
            if "severity" in filters:
                filtered_results = [r for r in filtered_results if r.get("severity") == filters["severity"]]
            
            if "status" in filters:
                filtered_results = [r for r in filtered_results if r.get("status") == filters["status"]]
            
            if "since" in filters:
                since = datetime.datetime.fromisoformat(filters["since"])
                filtered_results = [
                    r for r in filtered_results 
                    if datetime.datetime.fromisoformat(r.get("validation_time", "2000-01-01T00:00:00")) >= since
                ]
            
            # Sort by validation time
            filtered_results.sort(
                key=lambda r: r.get("validation_time", "2000-01-01T00:00:00"),
                reverse=True
            )
            
            # Limit results
            limit = task_data.get("limit", 100)
            filtered_results = filtered_results[:limit]
            
            return {
                "status": "success",
                "results": filtered_results,
                "count": len(filtered_results),
                "total": len(self.validation_results),
                "stats": self.validation_stats
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
        
        elif task_type == "update_validation_rules":
            # Update validation rules
            rule_updates = task_data.get("rules", {})
            
            for table, rules in rule_updates.items():
                if table in self.validation_rules:
                    self.validation_rules[table].extend(rules)
                else:
                    self.validation_rules[table] = rules
            
            return {
                "status": "success",
                "message": "Validation rules updated",
                "updated_tables": list(rule_updates.keys())
            }
        
        else:
            return {
                "status": "error",
                "error": f"Unknown task type: {task_type}"
            }