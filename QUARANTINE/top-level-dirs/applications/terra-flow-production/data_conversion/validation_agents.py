"""
Data Validation Agents

This module implements specialized data validation agents for the conversion pipeline,
ensuring data quality, consistency, and compliance with requirements.
"""

import logging
import json
import re
import datetime
import os
from typing import Dict, List, Any, Optional, Union, Set, Tuple, Callable

logger = logging.getLogger(__name__)

class ValidationManager:
    """
    Manages and orchestrates validation agents for data conversion processes.
    """
    def __init__(self):
        """Initialize the validation manager"""
        self.validation_agents = {}
        self.validation_rules = {}
        
        # Create folder for validation reports
        self.reports_dir = os.environ.get('VALIDATION_REPORTS_DIR', 'validation_reports')
        os.makedirs(self.reports_dir, exist_ok=True)
        
        logger.info("ValidationManager initialized")
    
    def register_agent(self, agent_id: str, agent: 'ValidationAgent') -> None:
        """
        Register a validation agent.
        
        Args:
            agent_id: Unique identifier for the agent
            agent: ValidationAgent instance
        """
        self.validation_agents[agent_id] = agent
        logger.info(f"Registered validation agent: {agent_id}")
    
    def register_rule(self, rule_id: str, rule_config: Dict[str, Any]) -> None:
        """
        Register a validation rule.
        
        Args:
            rule_id: Unique identifier for the rule
            rule_config: Rule configuration
        """
        self.validation_rules[rule_id] = rule_config
        logger.info(f"Registered validation rule: {rule_id}")
    
    def validate_data(self, data: Any, agents: List[str] = None, 
                    rules: List[str] = None) -> Dict[str, Any]:
        """
        Validate data using registered agents and rules.
        
        Args:
            data: Data to validate
            agents: List of agent IDs to use (if None, use all)
            rules: List of rule IDs to apply (if None, use all)
            
        Returns:
            Combined validation results
        """
        results = {
            'overall_passed': True,
            'agent_results': {},
            'rule_results': {},
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'summary': {
                'total_checks': 0,
                'passed': 0,
                'failed': 0,
                'warnings': 0
            }
        }
        
        # Run agent validations
        agent_ids = agents if agents is not None else self.validation_agents.keys()
        for agent_id in agent_ids:
            if agent_id in self.validation_agents:
                agent = self.validation_agents[agent_id]
                agent_result = agent.validate(data)
                results['agent_results'][agent_id] = agent_result
                
                # Update summary
                results['summary']['total_checks'] += agent_result.get('passed', 0) + agent_result.get('failed', 0)
                results['summary']['passed'] += agent_result.get('passed', 0)
                results['summary']['failed'] += agent_result.get('failed', 0)
                results['summary']['warnings'] += agent_result.get('warnings', 0)
                
                # Update overall result
                if agent_result.get('failed', 0) > 0:
                    results['overall_passed'] = False
            else:
                logger.warning(f"Validation agent not found: {agent_id}")
        
        # Apply validation rules
        rule_ids = rules if rules is not None else self.validation_rules.keys()
        for rule_id in rule_ids:
            if rule_id in self.validation_rules:
                rule_config = self.validation_rules[rule_id]
                rule_result = self._apply_rule(data, rule_config)
                results['rule_results'][rule_id] = rule_result
                
                # Update summary
                results['summary']['total_checks'] += 1
                if rule_result['passed']:
                    results['summary']['passed'] += 1
                else:
                    results['summary']['failed'] += 1
                
                # Update overall result
                if not rule_result['passed'] and rule_result.get('severity') == 'error':
                    results['overall_passed'] = False
            else:
                logger.warning(f"Validation rule not found: {rule_id}")
        
        return results
    
    def _apply_rule(self, data: Any, rule_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply a validation rule to data.
        
        Args:
            data: Data to validate
            rule_config: Rule configuration
            
        Returns:
            Rule validation result
        """
        rule_type = rule_config.get('type')
        result = {
            'passed': True,
            'rule_type': rule_type,
            'description': rule_config.get('description', ''),
            'severity': rule_config.get('severity', 'error')
        }
        
        if rule_type == 'required_fields':
            # Check if required fields are present
            fields = rule_config.get('fields', [])
            missing_fields = []
            
            if isinstance(data, dict):
                for field in fields:
                    if field not in data:
                        missing_fields.append(field)
            elif isinstance(data, list) and all(isinstance(item, dict) for item in data):
                # Check all records for required fields
                for i, record in enumerate(data):
                    for field in fields:
                        if field not in record:
                            missing_fields.append(f"{field} (record {i})")
            
            if missing_fields:
                result['passed'] = False
                result['missing_fields'] = missing_fields
        
        elif rule_type == 'field_pattern':
            # Check if field matches pattern
            field = rule_config.get('field')
            pattern = rule_config.get('pattern')
            
            if pattern and field:
                regex = re.compile(pattern)
                matches = []
                
                if isinstance(data, dict):
                    if field in data and not regex.match(str(data[field])):
                        matches.append(field)
                elif isinstance(data, list) and all(isinstance(item, dict) for item in data):
                    # Check all records for pattern
                    for i, record in enumerate(data):
                        if field in record and not regex.match(str(record[field])):
                            matches.append(f"{field} (record {i})")
                
                if matches:
                    result['passed'] = False
                    result['pattern_violations'] = matches
        
        elif rule_type == 'custom':
            # Execute custom validation function
            # In a real implementation, this would be more sophisticated
            # For now, just log that it's not implemented
            result['passed'] = True
            result['notes'] = "Custom validation not implemented"
            logger.warning("Custom validation rule not implemented")
        
        return result
    
    def save_validation_report(self, report_id: str, validation_results: Dict[str, Any]) -> str:
        """
        Save validation results to a report file.
        
        Args:
            report_id: Unique identifier for the report
            validation_results: Validation results to save
            
        Returns:
            Path to the saved report file
        """
        # Generate filename
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"validation_report_{report_id}_{timestamp}.json"
        file_path = os.path.join(self.reports_dir, filename)
        
        # Add report metadata
        report = {
            'report_id': report_id,
            'timestamp': timestamp,
            'results': validation_results
        }
        
        # Save to file
        with open(file_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Saved validation report to {file_path}")
        return file_path


# Create a singleton instance
validation_manager = ValidationManager()

class ValidationAgent:
    """
    Base class for all validation agents.
    """
    
    def __init__(self, name: str):
        """Initialize the validation agent"""
        self.name = name
        self.validation_results = {
            'passed': 0,
            'failed': 0,
            'warnings': 0,
            'errors': []
        }
        
        logger.info(f"Validation Agent '{name}' initialized")
    
    def validate(self, data: Any) -> Dict[str, Any]:
        """
        Validate data using this agent.
        
        Args:
            data: Data to validate
            
        Returns:
            Validation results
        """
        # Reset validation results
        self.validation_results = {
            'passed': 0,
            'failed': 0,
            'warnings': 0,
            'errors': []
        }
        
        # Run validation (to be implemented by subclasses)
        self._validate(data)
        
        # Add agent name to results
        self.validation_results['agent_name'] = self.name
        
        # Calculate validation score
        total = self.validation_results['passed'] + self.validation_results['failed']
        if total > 0:
            self.validation_results['score'] = self.validation_results['passed'] / total
        else:
            self.validation_results['score'] = 0.0
        
        return self.validation_results
    
    def _validate(self, data: Any) -> None:
        """
        Perform validation logic.
        
        Args:
            data: Data to validate
        """
        raise NotImplementedError("Subclasses must implement this method")
    
    def add_error(self, error_type: str, message: str, record_id: Any = None, 
                 details: Dict[str, Any] = None, is_warning: bool = False) -> None:
        """
        Add an error or warning to the validation results.
        
        Args:
            error_type: Type of error
            message: Error message
            record_id: ID of the record with the error (if applicable)
            details: Additional error details
            is_warning: Whether this is a warning (True) or error (False)
        """
        error = {
            'type': error_type,
            'message': message,
            'record_id': record_id,
            'details': details or {},
            'is_warning': is_warning,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        self.validation_results['errors'].append(error)
        
        if is_warning:
            self.validation_results['warnings'] += 1
        else:
            self.validation_results['failed'] += 1
            
        if record_id is not None:
            if is_warning:
                logger.warning(f"Validation warning ({self.name}): {message} - Record {record_id}")
            else:
                logger.error(f"Validation error ({self.name}): {message} - Record {record_id}")
        else:
            if is_warning:
                logger.warning(f"Validation warning ({self.name}): {message}")
            else:
                logger.error(f"Validation error ({self.name}): {message}")


class SourceDataValidator(ValidationAgent):
    """
    Validates source data before extraction.
    """
    
    def __init__(self, file_format: str = None):
        """
        Initialize the source data validator.
        
        Args:
            file_format: Source file format (e.g., 'csv', 'json')
        """
        super().__init__("SourceDataValidator")
        self.file_format = file_format
        
        # Define format-specific validators
        self.format_validators = {
            'csv': self._validate_csv,
            'json': self._validate_json,
            'xml': self._validate_xml,
            'excel': self._validate_excel,
            'database': self._validate_database,
            'shapefile': self._validate_shapefile
        }
    
    def _validate(self, data: Any) -> None:
        """
        Validate source data integrity.
        
        Args:
            data: Source data to validate (typically a file path or connection object)
        """
        # Check if data is accessible
        if isinstance(data, str):
            # Assume it's a file path
            try:
                with open(data, 'r') as f:
                    # Just check if we can open it
                    pass
                self.validation_results['passed'] += 1
            except Exception as e:
                self.add_error('file_access', f"Cannot access source file: {str(e)}")
                return
        
        # If format specified, run format-specific validation
        if self.file_format and self.file_format in self.format_validators:
            self.format_validators[self.file_format](data)
        else:
            # Generic validation - check if it exists
            self.validation_results['passed'] += 1
            self.add_error('unknown_format', 
                          f"No specific validator for format: {self.file_format}", 
                          is_warning=True)
    
    def _validate_csv(self, file_path: str) -> None:
        """Validate CSV file format"""
        import csv
        
        try:
            with open(file_path, 'r') as f:
                # Check if it's valid CSV
                csv_reader = csv.reader(f)
                header = next(csv_reader)
                
                # Check if header exists
                if not header:
                    self.add_error('csv_format', "CSV file has no header row")
                else:
                    self.validation_results['passed'] += 1
                
                # Check a sample of rows
                row_count = 0
                column_count = len(header)
                
                for row in csv_reader:
                    row_count += 1
                    
                    # Check row length matches header
                    if len(row) != column_count:
                        self.add_error('csv_format', 
                                      f"Row {row_count} has {len(row)} columns, expected {column_count}")
                    else:
                        self.validation_results['passed'] += 1
                    
                    # Only check a sample
                    if row_count >= 100:
                        break
        
        except csv.Error as e:
            self.add_error('csv_format', f"CSV parsing error: {str(e)}")
        except Exception as e:
            self.add_error('file_access', f"Error reading CSV file: {str(e)}")
    
    def _validate_json(self, file_path: str) -> None:
        """Validate JSON file format"""
        try:
            with open(file_path, 'r') as f:
                # Check if it's valid JSON
                json_data = json.load(f)
                
                # Check if it's an array or object
                if isinstance(json_data, list):
                    # Check if array is empty
                    if not json_data:
                        self.add_error('json_format', 
                                      "JSON file contains empty array", 
                                      is_warning=True)
                    else:
                        self.validation_results['passed'] += 1
                        
                        # Check a sample of items
                        for i, item in enumerate(json_data[:100]):
                            if not isinstance(item, dict):
                                self.add_error('json_format', 
                                              f"Item {i} is not an object")
                            else:
                                self.validation_results['passed'] += 1
                elif isinstance(json_data, dict):
                    # Check if object is empty
                    if not json_data:
                        self.add_error('json_format', 
                                      "JSON file contains empty object", 
                                      is_warning=True)
                    else:
                        self.validation_results['passed'] += 1
                else:
                    self.add_error('json_format', 
                                  "JSON file contains neither object nor array")
        
        except json.JSONDecodeError as e:
            self.add_error('json_format', f"JSON parsing error: {str(e)}")
        except Exception as e:
            self.add_error('file_access', f"Error reading JSON file: {str(e)}")
    
    def _validate_xml(self, file_path: str) -> None:
        """Validate XML file format"""
        try:
            import xml.etree.ElementTree as ET
            
            # Check if it's valid XML
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Check if root has children
            if len(root) == 0:
                self.add_error('xml_format', 
                              "XML file has empty root element", 
                              is_warning=True)
            else:
                self.validation_results['passed'] += 1
        
        except ET.ParseError as e:
            self.add_error('xml_format', f"XML parsing error: {str(e)}")
        except Exception as e:
            self.add_error('file_access', f"Error reading XML file: {str(e)}")
    
    def _validate_excel(self, file_path: str) -> None:
        """Validate Excel file format"""
        try:
            import pandas as pd
            
            # Check if it's a valid Excel file
            excel_data = pd.ExcelFile(file_path)
            
            # Check if it has sheets
            if len(excel_data.sheet_names) == 0:
                self.add_error('excel_format', "Excel file has no sheets")
            else:
                self.validation_results['passed'] += 1
                
                # Check a sample of sheets
                for sheet_name in excel_data.sheet_names[:5]:
                    df = pd.read_excel(excel_data, sheet_name)
                    
                    # Check if sheet is empty
                    if df.empty:
                        self.add_error('excel_format', 
                                      f"Sheet '{sheet_name}' is empty", 
                                      is_warning=True)
                    else:
                        self.validation_results['passed'] += 1
        
        except Exception as e:
            self.add_error('excel_format', f"Excel parsing error: {str(e)}")
    
    def _validate_database(self, connection_string: str) -> None:
        """Validate database connection"""
        try:
            from sqlalchemy import create_engine, inspect
            
            # Try to connect to the database
            engine = create_engine(connection_string)
            inspector = inspect(engine)
            
            # Check if there are tables
            tables = inspector.get_table_names()
            if not tables:
                self.add_error('database_format', 
                              "Database has no tables", 
                              is_warning=True)
            else:
                self.validation_results['passed'] += 1
        
        except Exception as e:
            self.add_error('database_connection', f"Database connection error: {str(e)}")
    
    def _validate_shapefile(self, file_path: str) -> None:
        """Validate shapefile format"""
        try:
            import geopandas as gpd
            
            # Check if it's a valid shapefile
            gdf = gpd.read_file(file_path)
            
            # Check if it has features
            if len(gdf) == 0:
                self.add_error('shapefile_format', 
                              "Shapefile has no features", 
                              is_warning=True)
            else:
                self.validation_results['passed'] += 1
                
            # Check if it has geometry
            if 'geometry' not in gdf.columns:
                self.add_error('shapefile_format', "Shapefile has no geometry column")
            else:
                self.validation_results['passed'] += 1
        
        except Exception as e:
            self.add_error('shapefile_format', f"Shapefile parsing error: {str(e)}")


class SchemaValidator(ValidationAgent):
    """
    Validates data against a schema.
    """
    
    def __init__(self, schema: Dict[str, Any]):
        """
        Initialize the schema validator.
        
        Args:
            schema: Schema definition
        """
        super().__init__("SchemaValidator")
        self.schema = schema
        
        # Define type validators
        self.type_validators = {
            'string': self._validate_string,
            'integer': self._validate_integer,
            'number': self._validate_number,
            'boolean': self._validate_boolean,
            'array': self._validate_array,
            'object': self._validate_object,
            'date': self._validate_date,
            'datetime': self._validate_datetime,
            'email': self._validate_email,
            'uuid': self._validate_uuid,
            'phone': self._validate_phone
        }
    
    def _validate(self, data: Any) -> None:
        """
        Validate data against schema.
        
        Args:
            data: Data to validate
        """
        # Check data type
        if isinstance(data, list):
            # Validate each record against the schema
            for i, record in enumerate(data):
                if not isinstance(record, dict):
                    self.add_error('schema_validation', 
                                  f"Record {i} is not an object", 
                                  record_id=i)
                else:
                    self._validate_record(record, i)
        elif isinstance(data, dict):
            # Validate the single record against the schema
            self._validate_record(data, None)
        else:
            self.add_error('schema_validation', 
                          f"Data is neither an object nor an array: {type(data).__name__}")
    
    def _validate_record(self, record: Dict[str, Any], record_id: Any = None) -> None:
        """
        Validate a single record against the schema.
        
        Args:
            record: Record to validate
            record_id: ID of the record (for error reporting)
        """
        # Check required fields
        for field_name, field_schema in self.schema.items():
            if field_schema.get('required', False) and field_name not in record:
                self.add_error('missing_required_field', 
                              f"Required field '{field_name}' is missing", 
                              record_id=record_id)
            elif field_name in record:
                field_value = record[field_name]
                field_type = field_schema.get('type')
                
                # Validate field type
                if field_type and field_type in self.type_validators:
                    if field_value is None:
                        if field_schema.get('nullable', False):
                            self.validation_results['passed'] += 1
                        else:
                            self.add_error('null_value', 
                                          f"Field '{field_name}' cannot be null", 
                                          record_id=record_id)
                    else:
                        # Validate using type-specific validator
                        is_valid = self.type_validators[field_type](
                            field_value, field_schema, field_name, record_id
                        )
                        
                        if is_valid:
                            self.validation_results['passed'] += 1
                else:
                    # Unknown type, assume valid
                    self.validation_results['passed'] += 1
                    self.add_error('unknown_type', 
                                  f"Unknown field type: {field_type}", 
                                  is_warning=True)
    
    def _validate_string(self, value: Any, schema: Dict[str, Any], 
                        field_name: str, record_id: Any) -> bool:
        """Validate string field"""
        if not isinstance(value, str):
            self.add_error('type_mismatch', 
                          f"Field '{field_name}' should be a string, got {type(value).__name__}", 
                          record_id=record_id)
            return False
        
        # Check minimum length
        min_length = schema.get('minLength')
        if min_length is not None and len(value) < min_length:
            self.add_error('string_too_short', 
                          f"Field '{field_name}' is too short ({len(value)} < {min_length})", 
                          record_id=record_id)
            return False
        
        # Check maximum length
        max_length = schema.get('maxLength')
        if max_length is not None and len(value) > max_length:
            self.add_error('string_too_long', 
                          f"Field '{field_name}' is too long ({len(value)} > {max_length})", 
                          record_id=record_id)
            return False
        
        # Check pattern
        pattern = schema.get('pattern')
        if pattern is not None and not re.match(pattern, value):
            self.add_error('pattern_mismatch', 
                          f"Field '{field_name}' does not match pattern", 
                          record_id=record_id)
            return False
        
        # Check enum
        enum_values = schema.get('enum')
        if enum_values is not None and value not in enum_values:
            self.add_error('enum_mismatch', 
                          f"Field '{field_name}' must be one of: {', '.join(enum_values)}", 
                          record_id=record_id)
            return False
        
        return True
    
    def _validate_integer(self, value: Any, schema: Dict[str, Any], 
                         field_name: str, record_id: Any) -> bool:
        """Validate integer field"""
        if not isinstance(value, int) or isinstance(value, bool):
            self.add_error('type_mismatch', 
                          f"Field '{field_name}' should be an integer, got {type(value).__name__}", 
                          record_id=record_id)
            return False
        
        # Check minimum value
        minimum = schema.get('minimum')
        if minimum is not None and value < minimum:
            self.add_error('integer_too_small', 
                          f"Field '{field_name}' is too small ({value} < {minimum})", 
                          record_id=record_id)
            return False
        
        # Check maximum value
        maximum = schema.get('maximum')
        if maximum is not None and value > maximum:
            self.add_error('integer_too_large', 
                          f"Field '{field_name}' is too large ({value} > {maximum})", 
                          record_id=record_id)
            return False
        
        return True
    
    def _validate_number(self, value: Any, schema: Dict[str, Any], 
                        field_name: str, record_id: Any) -> bool:
        """Validate number field"""
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            self.add_error('type_mismatch', 
                          f"Field '{field_name}' should be a number, got {type(value).__name__}", 
                          record_id=record_id)
            return False
        
        # Check minimum value
        minimum = schema.get('minimum')
        if minimum is not None and value < minimum:
            self.add_error('number_too_small', 
                          f"Field '{field_name}' is too small ({value} < {minimum})", 
                          record_id=record_id)
            return False
        
        # Check maximum value
        maximum = schema.get('maximum')
        if maximum is not None and value > maximum:
            self.add_error('number_too_large', 
                          f"Field '{field_name}' is too large ({value} > {maximum})", 
                          record_id=record_id)
            return False
        
        return True
    
    def _validate_boolean(self, value: Any, schema: Dict[str, Any], 
                         field_name: str, record_id: Any) -> bool:
        """Validate boolean field"""
        if not isinstance(value, bool):
            self.add_error('type_mismatch', 
                          f"Field '{field_name}' should be a boolean, got {type(value).__name__}", 
                          record_id=record_id)
            return False
        
        return True
    
    def _validate_array(self, value: Any, schema: Dict[str, Any], 
                       field_name: str, record_id: Any) -> bool:
        """Validate array field"""
        if not isinstance(value, list):
            self.add_error('type_mismatch', 
                          f"Field '{field_name}' should be an array, got {type(value).__name__}", 
                          record_id=record_id)
            return False
        
        # Check minimum items
        min_items = schema.get('minItems')
        if min_items is not None and len(value) < min_items:
            self.add_error('array_too_short', 
                          f"Field '{field_name}' has too few items ({len(value)} < {min_items})", 
                          record_id=record_id)
            return False
        
        # Check maximum items
        max_items = schema.get('maxItems')
        if max_items is not None and len(value) > max_items:
            self.add_error('array_too_long', 
                          f"Field '{field_name}' has too many items ({len(value)} > {max_items})", 
                          record_id=record_id)
            return False
        
        # Check items
        items_schema = schema.get('items')
        if items_schema is not None and value:
            item_type = items_schema.get('type')
            if item_type and item_type in self.type_validators:
                # Validate each item
                for i, item in enumerate(value):
                    if item is None and not items_schema.get('nullable', False):
                        self.add_error('null_value', 
                                      f"Item {i} in field '{field_name}' cannot be null", 
                                      record_id=record_id)
                    elif item is not None:
                        is_valid = self.type_validators[item_type](
                            item, items_schema, f"{field_name}[{i}]", record_id
                        )
                        
                        if not is_valid:
                            return False
        
        return True
    
    def _validate_object(self, value: Any, schema: Dict[str, Any], 
                        field_name: str, record_id: Any) -> bool:
        """Validate object field"""
        if not isinstance(value, dict):
            self.add_error('type_mismatch', 
                          f"Field '{field_name}' should be an object, got {type(value).__name__}", 
                          record_id=record_id)
            return False
        
        # Check properties
        properties = schema.get('properties')
        if properties is not None:
            # Check required properties
            for prop_name, prop_schema in properties.items():
                if prop_schema.get('required', False) and prop_name not in value:
                    self.add_error('missing_required_property', 
                                  f"Required property '{prop_name}' is missing in field '{field_name}'", 
                                  record_id=record_id)
                    return False
            
            # Validate each property
            for prop_name, prop_value in value.items():
                if prop_name in properties:
                    prop_schema = properties[prop_name]
                    prop_type = prop_schema.get('type')
                    
                    if prop_type and prop_type in self.type_validators:
                        if prop_value is None:
                            if not prop_schema.get('nullable', False):
                                self.add_error('null_value', 
                                              f"Property '{prop_name}' in field '{field_name}' cannot be null", 
                                              record_id=record_id)
                                return False
                        else:
                            is_valid = self.type_validators[prop_type](
                                prop_value, prop_schema, f"{field_name}.{prop_name}", record_id
                            )
                            
                            if not is_valid:
                                return False
        
        return True
    
    def _validate_date(self, value: Any, schema: Dict[str, Any], 
                      field_name: str, record_id: Any) -> bool:
        """Validate date field"""
        if not isinstance(value, str):
            self.add_error('type_mismatch', 
                          f"Field '{field_name}' should be a date string, got {type(value).__name__}", 
                          record_id=record_id)
            return False
        
        # Check date format (YYYY-MM-DD)
        try:
            datetime.datetime.strptime(value, '%Y-%m-%d')
        except ValueError:
            self.add_error('invalid_date', 
                          f"Field '{field_name}' is not a valid date (expected format: YYYY-MM-DD)", 
                          record_id=record_id)
            return False
        
        return True
    
    def _validate_datetime(self, value: Any, schema: Dict[str, Any], 
                          field_name: str, record_id: Any) -> bool:
        """Validate datetime field"""
        if not isinstance(value, str):
            self.add_error('type_mismatch', 
                          f"Field '{field_name}' should be a datetime string, got {type(value).__name__}", 
                          record_id=record_id)
            return False
        
        # Check datetime format (ISO 8601)
        try:
            datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            self.add_error('invalid_datetime', 
                          f"Field '{field_name}' is not a valid datetime (expected format: ISO 8601)", 
                          record_id=record_id)
            return False
        
        return True
    
    def _validate_email(self, value: Any, schema: Dict[str, Any], 
                       field_name: str, record_id: Any) -> bool:
        """Validate email field"""
        if not isinstance(value, str):
            self.add_error('type_mismatch', 
                          f"Field '{field_name}' should be an email string, got {type(value).__name__}", 
                          record_id=record_id)
            return False
        
        # Check email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value):
            self.add_error('invalid_email', 
                          f"Field '{field_name}' is not a valid email address", 
                          record_id=record_id)
            return False
        
        return True
    
    def _validate_uuid(self, value: Any, schema: Dict[str, Any], 
                      field_name: str, record_id: Any) -> bool:
        """Validate UUID field"""
        if not isinstance(value, str):
            self.add_error('type_mismatch', 
                          f"Field '{field_name}' should be a UUID string, got {type(value).__name__}", 
                          record_id=record_id)
            return False
        
        # Check UUID format
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        if not re.match(uuid_pattern, value.lower()):
            self.add_error('invalid_uuid', 
                          f"Field '{field_name}' is not a valid UUID", 
                          record_id=record_id)
            return False
        
        return True
    
    def _validate_phone(self, value: Any, schema: Dict[str, Any], 
                       field_name: str, record_id: Any) -> bool:
        """Validate phone number field"""
        if not isinstance(value, str):
            self.add_error('type_mismatch', 
                          f"Field '{field_name}' should be a phone number string, got {type(value).__name__}", 
                          record_id=record_id)
            return False
        
        # Check phone format (simple validation)
        phone_pattern = r'^\+?[0-9]{10,15}$'
        if not re.match(phone_pattern, value.replace('-', '').replace(' ', '').replace('(', '').replace(')', '')):
            self.add_error('invalid_phone', 
                          f"Field '{field_name}' is not a valid phone number", 
                          record_id=record_id)
            return False
        
        return True


class ConsistencyChecker(ValidationAgent):
    """
    Checks consistency between source and converted data.
    """
    
    def __init__(self, comparison_fields: List[str]):
        """
        Initialize the consistency checker.
        
        Args:
            comparison_fields: List of fields to compare
        """
        super().__init__("ConsistencyChecker")
        self.comparison_fields = comparison_fields
    
    def _validate(self, data: Dict[str, Any]) -> None:
        """
        Check consistency between source and converted data.
        
        Args:
            data: Dictionary with 'source' and 'converted' data
        """
        if not isinstance(data, dict) or 'source' not in data or 'converted' not in data:
            self.add_error('invalid_input', 
                          "Input must be a dictionary with 'source' and 'converted' keys")
            return
        
        source_data = data['source']
        converted_data = data['converted']
        
        # Check if data types match
        if isinstance(source_data, list) and isinstance(converted_data, list):
            # Match records by index or ID
            self._compare_record_sets(source_data, converted_data)
        elif isinstance(source_data, dict) and isinstance(converted_data, dict):
            # Compare single records
            self._compare_records(source_data, converted_data, "root")
        else:
            self.add_error('type_mismatch', 
                          f"Source ({type(source_data).__name__}) and converted ({type(converted_data).__name__}) data types do not match")
    
    def _compare_record_sets(self, source_records: List[Dict[str, Any]], 
                            converted_records: List[Dict[str, Any]]) -> None:
        """
        Compare sets of records for consistency.
        
        Args:
            source_records: Source records
            converted_records: Converted records
        """
        # Check if counts match
        if len(source_records) != len(converted_records):
            self.add_error('count_mismatch', 
                          f"Record counts do not match: source={len(source_records)}, converted={len(converted_records)}")
        
        # Compare each record
        for i, (source, converted) in enumerate(zip(source_records, converted_records)):
            if isinstance(source, dict) and isinstance(converted, dict):
                self._compare_records(source, converted, i)
            else:
                self.add_error('type_mismatch', 
                              f"Record {i} types do not match: source={type(source).__name__}, converted={type(converted).__name__}")
    
    def _compare_records(self, source: Dict[str, Any], 
                        converted: Dict[str, Any], record_id: Any) -> None:
        """
        Compare individual records for consistency.
        
        Args:
            source: Source record
            converted: Converted record
            record_id: ID for error reporting
        """
        # Compare specified fields
        for field in self.comparison_fields:
            if field in source and field in converted:
                if source[field] != converted[field]:
                    self.add_error('value_mismatch', 
                                  f"Field '{field}' values do not match: source='{source[field]}', converted='{converted[field]}'", 
                                  record_id=record_id)
                else:
                    self.validation_results['passed'] += 1
            elif field in source and field not in converted:
                self.add_error('missing_converted_field', 
                              f"Field '{field}' exists in source but not in converted data", 
                              record_id=record_id)
            elif field not in source and field in converted:
                self.add_error('missing_source_field', 
                              f"Field '{field}' exists in converted but not in source data", 
                              record_id=record_id)


class AnomalyDetector(ValidationAgent):
    """
    Detects anomalies in data.
    """
    
    def __init__(self, anomaly_rules: Dict[str, Dict[str, Any]] = None):
        """
        Initialize the anomaly detector.
        
        Args:
            anomaly_rules: Dictionary of field-specific anomaly rules
        """
        super().__init__("AnomalyDetector")
        self.anomaly_rules = anomaly_rules or {}
        
        # Default anomaly rules for common field types
        self.default_rules = {
            'number': {
                'z_score_threshold': 3.0,  # Z-score > 3 is an anomaly
                'min_samples': 5,          # Need at least 5 samples for z-score
                'absolute_limits': None    # No absolute limits by default
            },
            'string': {
                'max_length_ratio': 2.0,   # Length > 2x average is suspicious
                'min_samples': 5           # Need at least 5 samples
            },
            'date': {
                'future_allowed': False,   # Future dates not allowed by default
                'past_limit_years': 100    # Dates > 100 years in past are suspicious
            }
        }
    
    def _validate(self, data: List[Dict[str, Any]]) -> None:
        """
        Detect anomalies in data.
        
        Args:
            data: List of records to check for anomalies
        """
        if not isinstance(data, list):
            self.add_error('invalid_input', "Input must be a list of records")
            return
        
        if not data:
            self.add_error('empty_input', "Input data is empty", is_warning=True)
            return
        
        # Collect field statistics
        field_stats = self._collect_field_statistics(data)
        
        # Check each record for anomalies
        for i, record in enumerate(data):
            if not isinstance(record, dict):
                self.add_error('invalid_record', 
                              f"Record {i} is not an object: {type(record).__name__}", 
                              record_id=i)
                continue
            
            self._check_record_anomalies(record, field_stats, i)
    
    def _collect_field_statistics(self, data: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """
        Collect statistics about fields for anomaly detection.
        
        Args:
            data: List of records
            
        Returns:
            Dictionary of field statistics
        """
        stats = {}
        
        # Get all field names
        field_names = set()
        for record in data:
            if isinstance(record, dict):
                field_names.update(record.keys())
        
        # Collect statistics for each field
        for field in field_names:
            field_values = []
            for record in data:
                if isinstance(record, dict) and field in record:
                    field_values.append(record[field])
            
            # Determine field type
            field_type = self._get_field_type(field_values)
            
            # Calculate statistics based on type
            if field_type == 'number':
                stats[field] = self._calculate_number_stats(field_values, field)
            elif field_type == 'string':
                stats[field] = self._calculate_string_stats(field_values, field)
            elif field_type == 'date':
                stats[field] = self._calculate_date_stats(field_values, field)
            else:
                stats[field] = {'type': field_type}
        
        return stats
    
    def _get_field_type(self, values: List[Any]) -> str:
        """
        Determine the type of a field based on its values.
        
        Args:
            values: List of field values
            
        Returns:
            Field type ('number', 'string', 'date', 'mixed', 'empty', 'null')
        """
        # Filter out None values
        non_null = [v for v in values if v is not None]
        
        if not non_null:
            return 'null'
        
        # Check types
        types = set(type(v).__name__ for v in non_null)
        
        if len(types) == 1:
            if 'int' in types or 'float' in types:
                return 'number'
            elif 'str' in types:
                # Check if strings are dates
                date_count = 0
                for v in non_null:
                    try:
                        datetime.datetime.strptime(v, '%Y-%m-%d')
                        date_count += 1
                    except (ValueError, TypeError):
                        pass
                
                if date_count == len(non_null):
                    return 'date'
                else:
                    return 'string'
            else:
                return next(iter(types))
        else:
            # Check if mixed numeric types
            if types.issubset({'int', 'float'}):
                return 'number'
            else:
                return 'mixed'
    
    def _calculate_number_stats(self, values: List[Any], field_name: str) -> Dict[str, Any]:
        """
        Calculate statistics for numeric fields.
        
        Args:
            values: List of field values
            field_name: Field name
            
        Returns:
            Dictionary of statistics
        """
        # Filter to numeric values only
        numeric_values = []
        for v in values:
            if v is not None:
                try:
                    numeric_values.append(float(v))
                except (ValueError, TypeError):
                    pass
        
        if not numeric_values:
            return {'type': 'number', 'count': 0}
        
        # Calculate statistics
        count = len(numeric_values)
        minimum = min(numeric_values)
        maximum = max(numeric_values)
        mean = sum(numeric_values) / count
        
        # Calculate standard deviation
        if count > 1:
            variance = sum((x - mean) ** 2 for x in numeric_values) / count
            std_dev = variance ** 0.5
        else:
            std_dev = 0
        
        # Get anomaly rule for this field
        rule = self.anomaly_rules.get(field_name, self.default_rules['number'])
        
        return {
            'type': 'number',
            'count': count,
            'min': minimum,
            'max': maximum,
            'mean': mean,
            'std_dev': std_dev,
            'z_score_threshold': rule.get('z_score_threshold', 3.0),
            'absolute_limits': rule.get('absolute_limits')
        }
    
    def _calculate_string_stats(self, values: List[Any], field_name: str) -> Dict[str, Any]:
        """
        Calculate statistics for string fields.
        
        Args:
            values: List of field values
            field_name: Field name
            
        Returns:
            Dictionary of statistics
        """
        # Filter to string values only
        string_values = [str(v) for v in values if v is not None]
        
        if not string_values:
            return {'type': 'string', 'count': 0}
        
        # Calculate statistics
        count = len(string_values)
        lengths = [len(s) for s in string_values]
        avg_length = sum(lengths) / count
        max_length = max(lengths)
        
        # Count unique values
        unique_count = len(set(string_values))
        uniqueness_ratio = unique_count / count
        
        # Get anomaly rule for this field
        rule = self.anomaly_rules.get(field_name, self.default_rules['string'])
        
        return {
            'type': 'string',
            'count': count,
            'avg_length': avg_length,
            'max_length': max_length,
            'unique_count': unique_count,
            'uniqueness_ratio': uniqueness_ratio,
            'max_length_ratio': rule.get('max_length_ratio', 2.0)
        }
    
    def _calculate_date_stats(self, values: List[Any], field_name: str) -> Dict[str, Any]:
        """
        Calculate statistics for date fields.
        
        Args:
            values: List of field values
            field_name: Field name
            
        Returns:
            Dictionary of statistics
        """
        # Parse dates
        dates = []
        for v in values:
            if v is not None:
                try:
                    dates.append(datetime.datetime.strptime(v, '%Y-%m-%d').date())
                except (ValueError, TypeError):
                    pass
        
        if not dates:
            return {'type': 'date', 'count': 0}
        
        # Calculate statistics
        count = len(dates)
        min_date = min(dates)
        max_date = max(dates)
        today = datetime.date.today()
        
        # Get anomaly rule for this field
        rule = self.anomaly_rules.get(field_name, self.default_rules['date'])
        
        return {
            'type': 'date',
            'count': count,
            'min_date': min_date.isoformat(),
            'max_date': max_date.isoformat(),
            'future_allowed': rule.get('future_allowed', False),
            'past_limit_years': rule.get('past_limit_years', 100),
            'today': today.isoformat()
        }
    
    def _check_record_anomalies(self, record: Dict[str, Any], 
                               field_stats: Dict[str, Dict[str, Any]], 
                               record_id: Any) -> None:
        """
        Check a record for anomalies based on field statistics.
        
        Args:
            record: Record to check
            field_stats: Field statistics
            record_id: ID for error reporting
        """
        for field, value in record.items():
            if field not in field_stats:
                continue
            
            stats = field_stats[field]
            field_type = stats.get('type')
            
            if value is None:
                # Skip null values
                continue
            
            if field_type == 'number':
                self._check_number_anomaly(field, value, stats, record_id)
            elif field_type == 'string':
                self._check_string_anomaly(field, value, stats, record_id)
            elif field_type == 'date':
                self._check_date_anomaly(field, value, stats, record_id)
    
    def _check_number_anomaly(self, field: str, value: Any, 
                             stats: Dict[str, Any], record_id: Any) -> None:
        """
        Check for anomalies in numeric fields.
        
        Args:
            field: Field name
            value: Field value
            stats: Field statistics
            record_id: ID for error reporting
        """
        if stats['count'] < self.default_rules['number']['min_samples']:
            self.validation_results['passed'] += 1
            return
        
        try:
            num_value = float(value)
        except (ValueError, TypeError):
            self.add_error('type_mismatch', 
                          f"Field '{field}' has non-numeric value '{value}'", 
                          record_id=record_id)
            return
        
        # Check for outliers using z-score
        if stats['std_dev'] > 0:
            z_score = abs(num_value - stats['mean']) / stats['std_dev']
            if z_score > stats['z_score_threshold']:
                self.add_error('numeric_outlier', 
                              f"Field '{field}' value {num_value} is an outlier (z-score: {z_score:.2f})", 
                              record_id=record_id,
                              details={'z_score': z_score, 'threshold': stats['z_score_threshold']},
                              is_warning=True)
                return
        
        # Check absolute limits if defined
        limits = stats.get('absolute_limits')
        if limits:
            if 'min' in limits and num_value < limits['min']:
                self.add_error('below_minimum', 
                              f"Field '{field}' value {num_value} is below minimum {limits['min']}", 
                              record_id=record_id)
                return
            
            if 'max' in limits and num_value > limits['max']:
                self.add_error('above_maximum', 
                              f"Field '{field}' value {num_value} is above maximum {limits['max']}", 
                              record_id=record_id)
                return
        
        self.validation_results['passed'] += 1
    
    def _check_string_anomaly(self, field: str, value: Any, 
                             stats: Dict[str, Any], record_id: Any) -> None:
        """
        Check for anomalies in string fields.
        
        Args:
            field: Field name
            value: Field value
            stats: Field statistics
            record_id: ID for error reporting
        """
        if stats['count'] < self.default_rules['string']['min_samples']:
            self.validation_results['passed'] += 1
            return
        
        str_value = str(value)
        
        # Check for unusually long strings
        length = len(str_value)
        if length > stats['avg_length'] * stats['max_length_ratio']:
            self.add_error('string_too_long', 
                          f"Field '{field}' length {length} is much longer than average {stats['avg_length']:.1f}", 
                          record_id=record_id,
                          is_warning=True)
            return
        
        # Check for empty strings in non-empty fields
        if length == 0 and stats['avg_length'] > 0:
            self.add_error('empty_string', 
                          f"Field '{field}' is empty when typically non-empty", 
                          record_id=record_id,
                          is_warning=True)
            return
        
        self.validation_results['passed'] += 1
    
    def _check_date_anomaly(self, field: str, value: Any, 
                           stats: Dict[str, Any], record_id: Any) -> None:
        """
        Check for anomalies in date fields.
        
        Args:
            field: Field name
            value: Field value
            stats: Field statistics
            record_id: ID for error reporting
        """
        try:
            date_value = datetime.datetime.strptime(value, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            self.add_error('invalid_date', 
                          f"Field '{field}' has invalid date value '{value}'", 
                          record_id=record_id)
            return
        
        today = datetime.datetime.strptime(stats['today'], '%Y-%m-%d').date()
        
        # Check for future dates
        if not stats['future_allowed'] and date_value > today:
            self.add_error('future_date', 
                          f"Field '{field}' has future date {value}", 
                          record_id=record_id)
            return
        
        # Check for very old dates
        past_limit = today.replace(year=today.year - stats['past_limit_years'])
        if date_value < past_limit:
            self.add_error('too_old_date', 
                          f"Field '{field}' date {value} is more than {stats['past_limit_years']} years old", 
                          record_id=record_id,
                          is_warning=True)
            return
        
        self.validation_results['passed'] += 1


class ComplianceVerifier(ValidationAgent):
    """
    Verifies compliance with legal and regulatory requirements.
    """
    
    def __init__(self, regulations: List[str]):
        """
        Initialize the compliance verifier.
        
        Args:
            regulations: List of regulations to verify
        """
        super().__init__("ComplianceVerifier")
        self.regulations = regulations
        
        # Define regulation-specific checks
        self.regulation_checks = {
            'gdpr': self._check_gdpr,
            'ccpa': self._check_ccpa,
            'hipaa': self._check_hipaa,
            'pci_dss': self._check_pci_dss,
            'washington_pra': self._check_washington_pra
        }
    
    def _validate(self, data: Any) -> None:
        """
        Verify compliance with regulations.
        
        Args:
            data: Data to verify
        """
        # Run applicable regulation checks
        for regulation in self.regulations:
            if regulation in self.regulation_checks:
                self.regulation_checks[regulation](data)
            else:
                self.add_error('unknown_regulation', 
                              f"Unknown regulation: {regulation}", 
                              is_warning=True)
    
    def _check_gdpr(self, data: Any) -> None:
        """
        Check GDPR compliance.
        
        Args:
            data: Data to check
        """
        # Check for personal data
        personal_data_fields = [
            'email', 'phone', 'address', 'name', 'full_name', 'first_name', 'last_name',
            'birth_date', 'ssn', 'social_security', 'passport', 'id_number',
            'ip_address', 'device_id'
        ]
        
        self._check_personal_data_fields(data, personal_data_fields, 'gdpr')
    
    def _check_ccpa(self, data: Any) -> None:
        """
        Check CCPA compliance.
        
        Args:
            data: Data to check
        """
        # Similar to GDPR but with California-specific considerations
        personal_data_fields = [
            'email', 'phone', 'address', 'name', 'full_name', 'first_name', 'last_name',
            'birth_date', 'ssn', 'social_security', 'drivers_license', 'state_id',
            'ip_address', 'device_id', 'geolocation'
        ]
        
        self._check_personal_data_fields(data, personal_data_fields, 'ccpa')
    
    def _check_hipaa(self, data: Any) -> None:
        """
        Check HIPAA compliance.
        
        Args:
            data: Data to check
        """
        # Check for protected health information (PHI)
        phi_fields = [
            'medical_record', 'health_plan', 'diagnosis', 'treatment', 'medication',
            'provider', 'patient_id', 'admission_date', 'discharge_date', 'procedure',
            'health_condition', 'lab_result'
        ]
        
        records = self._get_records(data)
        
        for record in records:
            for field in phi_fields:
                if field in record:
                    self.add_error('phi_present', 
                                  f"Protected Health Information (PHI) field '{field}' present in data", 
                                  record_id=record.get('id'))
                    return
        
        self.validation_results['passed'] += 1
    
    def _check_pci_dss(self, data: Any) -> None:
        """
        Check PCI DSS compliance.
        
        Args:
            data: Data to check
        """
        # Check for payment card information
        pci_fields = [
            'credit_card', 'card_number', 'cvv', 'cvc', 'expiration_date',
            'card_type', 'cardholder_name', 'payment_token'
        ]
        
        records = self._get_records(data)
        
        for record in records:
            for field in pci_fields:
                if field in record:
                    self.add_error('pci_present', 
                                  f"Payment Card Information (PCI) field '{field}' present in data", 
                                  record_id=record.get('id'))
                    return
        
        self.validation_results['passed'] += 1
    
    def _check_washington_pra(self, data: Any) -> None:
        """
        Check Washington Public Records Act compliance.
        
        Args:
            data: Data to check
        """
        # Check for exempt records under Washington PRA
        exempt_fields = [
            'ssn', 'social_security', 'tax_id', 'medical_record', 'health_information',
            'juvenile_record', 'law_enforcement_investigation', 'personal_identifiers'
        ]
        
        records = self._get_records(data)
        
        for record in records:
            # Check for exempt fields
            for field in exempt_fields:
                if field in record:
                    self.add_error('wa_pra_exempt', 
                                  f"Washington PRA exempt field '{field}' requires special handling", 
                                  record_id=record.get('id'),
                                  is_warning=True)
            
            # Check for retention metadata
            if 'retention_period' not in record and 'retention_schedule' not in record:
                self.add_error('missing_retention_metadata', 
                              "Record lacks retention period metadata required by WA PRA", 
                              record_id=record.get('id'),
                              is_warning=True)
            else:
                self.validation_results['passed'] += 1
    
    def _check_personal_data_fields(self, data: Any, field_patterns: List[str], 
                                   regulation: str) -> None:
        """
        Check for personal data fields.
        
        Args:
            data: Data to check
            field_patterns: List of personal data field patterns
            regulation: Regulation name for reporting
        """
        records = self._get_records(data)
        
        for record in records:
            for field_name in record:
                # Check if field name matches any personal data pattern
                if any(pattern in field_name.lower() for pattern in field_patterns):
                    self.add_error('personal_data_present', 
                                  f"Personal data field '{field_name}' requires {regulation.upper()} compliance", 
                                  record_id=record.get('id'),
                                  is_warning=True)
                    return
        
        self.validation_results['passed'] += 1
    
    def _get_records(self, data: Any) -> List[Dict[str, Any]]:
        """
        Get records from data.
        
        Args:
            data: Input data
            
        Returns:
            List of records
        """
        if isinstance(data, list):
            # Assume it's a list of records
            records = []
            for item in data:
                if isinstance(item, dict):
                    records.append(item)
            return records
        elif isinstance(data, dict):
            # Assume it's a single record
            return [data]
        else:
            self.add_error('invalid_input', 
                          f"Cannot extract records from data of type: {type(data).__name__}")
            return []

# Create a validator registry
validation_agent_registry = {
    'source_data': SourceDataValidator,
    'schema': SchemaValidator,
    'consistency': ConsistencyChecker,
    'anomaly': AnomalyDetector,
    'compliance': ComplianceVerifier
}