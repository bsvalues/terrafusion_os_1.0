"""
Transformer Component for TerraFusion Sync Service.

This module is responsible for transforming data between different database schemas,
applying mappings, and handling format conversions. It includes support for AI-assisted
transformations for complex mapping scenarios.
"""

import logging
import json
import os
import datetime
from typing import Dict, List, Any, Optional, Union, Tuple, Callable

import sqlalchemy as sa
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError

from sync_service.data_type_handlers import DataTypeHandler, get_handler_for_column

logger = logging.getLogger(__name__)


class Transformer:
    """
    Transform data between different schemas and formats.
    
    Features:
    - Schema mapping based on configuration files
    - Automatic type conversion
    - Specialized handlers for complex data types (GIS, documents, etc.)
    - AI-assisted transformation for complex scenarios
    - Field value normalization
    """
    
    def __init__(self, 
                 mapping_directory: str = 'sync_service/mappings',
                 schema_registry: Dict[str, Dict[str, str]] = None,
                 use_ai_transformation: bool = False,
                 ai_service_url: str = None):
        """
        Initialize the Transformer.
        
        Args:
            mapping_directory: Directory containing mapping configuration files
            schema_registry: Registry of known schemas and their mappings
            use_ai_transformation: Whether to use AI for complex transformations
            ai_service_url: URL of the AI transformation service
        """
        self.mapping_directory = mapping_directory
        self.schema_registry = schema_registry or {}
        self.use_ai_transformation = use_ai_transformation
        self.ai_service_url = ai_service_url
        self.mappings = {}
        self.type_conversions = {
            # Standard type conversions
            ('str', 'int'): lambda v: int(v) if v else 0,
            ('str', 'float'): lambda v: float(v) if v else 0.0,
            ('str', 'bool'): lambda v: v.lower() in ('true', 'yes', 't', 'y', '1'),
            ('str', 'datetime'): lambda v: datetime.datetime.fromisoformat(v) if v else None,
            ('int', 'str'): lambda v: str(v),
            ('float', 'str'): lambda v: str(v),
            ('bool', 'str'): lambda v: 'true' if v else 'false',
            ('datetime', 'str'): lambda v: v.isoformat() if v else '',
            # Add more type conversions as needed
        }
        
        # Load mapping files
        self._load_mappings()
        
    def _load_mappings(self):
        """Load mapping configuration files from the mapping directory."""
        if not os.path.exists(self.mapping_directory):
            logger.warning(f"Mapping directory not found: {self.mapping_directory}")
            return
            
        try:
            for filename in os.listdir(self.mapping_directory):
                if filename.endswith('.json'):
                    mapping_name = os.path.splitext(filename)[0]
                    
                    with open(os.path.join(self.mapping_directory, filename), 'r') as f:
                        mapping = json.load(f)
                        
                    self.mappings[mapping_name] = mapping
                    logger.info(f"Loaded mapping configuration: {mapping_name}")
                    
        except Exception as e:
            logger.error(f"Error loading mapping configurations: {str(e)}")
    
    def transform_record(self, 
                        record: Dict[str, Any], 
                        source_schema: str = None, 
                        target_schema: str = None,
                        mapping_name: str = None,
                        custom_mapping: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Transform a record from source schema to target schema.
        
        Args:
            record: The record to transform
            source_schema: Name of the source schema
            target_schema: Name of the target schema
            mapping_name: Name of the predefined mapping to use
            custom_mapping: Custom mapping definition (overrides other mappings)
            
        Returns:
            Transformed record
        """
        # Determine which mapping to use
        mapping = None
        
        if custom_mapping:
            mapping = custom_mapping
        elif mapping_name and mapping_name in self.mappings:
            mapping = self.mappings[mapping_name]
        elif source_schema and target_schema:
            mapping_key = f"{source_schema}_to_{target_schema}"
            if mapping_key in self.mappings:
                mapping = self.mappings[mapping_key]
                
        if not mapping:
            # No explicit mapping, try with schema registry
            if source_schema and target_schema and source_schema in self.schema_registry and target_schema in self.schema_registry:
                # Auto-generate mapping based on field names and types
                mapping = self._generate_mapping(source_schema, target_schema)
            else:
                # Identity transform - return record as is
                logger.warning(f"No mapping found, returning original record")
                return record.copy()
        
        # Apply mapping
        return self._apply_mapping(record, mapping)
    
    def transform_records(self, 
                         records: List[Dict[str, Any]], 
                         source_schema: str = None, 
                         target_schema: str = None,
                         mapping_name: str = None,
                         custom_mapping: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Transform multiple records from source schema to target schema.
        
        Args:
            records: The records to transform
            source_schema: Name of the source schema
            target_schema: Name of the target schema
            mapping_name: Name of the predefined mapping to use
            custom_mapping: Custom mapping definition (overrides other mappings)
            
        Returns:
            List of transformed records
        """
        return [
            self.transform_record(
                record, source_schema, target_schema, mapping_name, custom_mapping
            )
            for record in records
        ]
    
    def _apply_mapping(self, record: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply a mapping to transform a record.
        
        Mapping format:
        {
            "field_mappings": {
                "target_field1": {
                    "source_field": "source_field1",
                    "type": "target_type",
                    "transform": "transformation_method" (optional),
                    "default": default_value (optional)
                },
                ...
            },
            "constants": {
                "target_field2": value,
                ...
            },
            "complex_mappings": [
                {
                    "target_field": "computed_field",
                    "expression": "python:source['field1'] + source['field2']"
                },
                ...
            ]
        }
        """
        result = {}
        
        # Apply field mappings
        if 'field_mappings' in mapping:
            for target_field, field_config in mapping['field_mappings'].items():
                source_field = field_config.get('source_field')
                
                if source_field and source_field in record:
                    value = record[source_field]
                    
                    # Apply type conversion if needed
                    target_type = field_config.get('type')
                    if target_type and isinstance(value, (str, int, float, bool, datetime.datetime)):
                        source_type = type(value).__name__
                        conversion_key = (source_type, target_type)
                        
                        if conversion_key in self.type_conversions:
                            try:
                                value = self.type_conversions[conversion_key](value)
                            except Exception as e:
                                logger.warning(f"Failed to convert {source_field} from {source_type} to {target_type}: {str(e)}")
                                # Use default if available
                                if 'default' in field_config:
                                    value = field_config['default']
                                    
                    # Apply custom transformation if specified
                    transform = field_config.get('transform')
                    if transform:
                        value = self._apply_transformation(value, transform)
                        
                    result[target_field] = value
                elif 'default' in field_config:
                    # Source field not present, use default value
                    result[target_field] = field_config['default']
                    
        # Apply constants
        if 'constants' in mapping:
            for target_field, value in mapping['constants'].items():
                result[target_field] = value
                
        # Apply complex mappings
        if 'complex_mappings' in mapping:
            for complex_mapping in mapping['complex_mappings']:
                target_field = complex_mapping.get('target_field')
                expression = complex_mapping.get('expression')
                
                if target_field and expression:
                    try:
                        # Handle different expression types
                        if expression.startswith('python:'):
                            # Python expression
                            python_expr = expression[7:]
                            # Execute in a context with 'source' and 'record' variables
                            source = record  # To maintain backward compatibility
                            value = eval(python_expr, {"__builtins__": {}}, {"source": source, "record": record})
                            result[target_field] = value
                        elif expression.startswith('handler:'):
                            # Use data type handler
                            handler_name = expression[8:]
                            handler = get_handler_for_column(handler_name)
                            if handler:
                                value = handler.transform_value(record)
                                result[target_field] = value
                            else:
                                logger.warning(f"Handler not found: {handler_name}")
                        elif self.use_ai_transformation and expression.startswith('ai:'):
                            # AI-assisted transformation
                            ai_expr = expression[3:]
                            value = self._ai_transform(record, ai_expr, target_field)
                            result[target_field] = value
                            
                    except Exception as e:
                        logger.error(f"Error evaluating complex mapping for {target_field}: {str(e)}")
                        
        # Check if we need to handle special data types
        for field, value in record.items():
            # If field hasn't been handled yet and has a specialized data type
            if field not in result:
                handler = get_handler_for_column(field)
                if handler:
                    # Use handler to transform the value
                    transformed_value = handler.transform_value(record)
                    # Use the same field name if not mapped otherwise
                    result[field] = transformed_value
        
        return result
    
    def _apply_transformation(self, value: Any, transform: str) -> Any:
        """
        Apply a named transformation to a value.
        
        Built-in transformations:
        - uppercase: Convert string to uppercase
        - lowercase: Convert string to lowercase
        - trim: Remove whitespace from start and end
        - truncate:N: Truncate string to N characters
        - format:fmt: Format string according to fmt
        - replace:old,new: Replace old substring with new
        """
        if not transform or not isinstance(transform, str):
            return value
            
        if transform == 'uppercase' and isinstance(value, str):
            return value.upper()
        elif transform == 'lowercase' and isinstance(value, str):
            return value.lower()
        elif transform == 'trim' and isinstance(value, str):
            return value.strip()
        elif transform.startswith('truncate:') and isinstance(value, str):
            try:
                length = int(transform.split(':', 1)[1])
                return value[:length]
            except (ValueError, IndexError):
                return value
        elif transform.startswith('format:') and isinstance(value, (str, int, float)):
            try:
                fmt = transform.split(':', 1)[1]
                return fmt.format(value)
            except (ValueError, IndexError, KeyError):
                return value
        elif transform.startswith('replace:') and isinstance(value, str):
            try:
                args = transform.split(':', 1)[1].split(',', 1)
                if len(args) == 2:
                    old, new = args
                    return value.replace(old, new)
            except (ValueError, IndexError):
                pass
                
        # Unknown transformation
        logger.warning(f"Unknown transformation: {transform}")
        return value
    
    def _generate_mapping(self, source_schema: str, target_schema: str) -> Dict[str, Any]:
        """
        Generate a mapping between two schemas based on the schema registry.
        
        This creates a simple field-to-field mapping for fields with matching names,
        and adds type conversions where needed.
        """
        if source_schema not in self.schema_registry or target_schema not in self.schema_registry:
            logger.warning(f"Cannot generate mapping: schema not in registry")
            return {}
            
        source_fields = self.schema_registry[source_schema]
        target_fields = self.schema_registry[target_schema]
        
        mapping = {"field_mappings": {}}
        
        # Find matching fields
        for target_field, target_type in target_fields.items():
            if target_field in source_fields:
                source_type = source_fields[target_field]
                
                field_mapping = {
                    "source_field": target_field
                }
                
                # Add type conversion if needed
                if source_type != target_type:
                    field_mapping["type"] = target_type
                    
                mapping["field_mappings"][target_field] = field_mapping
                
        return mapping
    
    def _ai_transform(self, record: Dict[str, Any], expression: str, target_field: str) -> Any:
        """
        Use AI to transform complex data.
        
        Args:
            record: The source record
            expression: The AI transformation expression
            target_field: The target field name
            
        Returns:
            Transformed value
        """
        if not self.use_ai_transformation or not self.ai_service_url:
            logger.warning("AI transformation requested but not enabled")
            return None
            
        try:
            import requests
            
            # Prepare request to AI service
            payload = {
                "record": record,
                "expression": expression,
                "target_field": target_field
            }
            
            response = requests.post(
                self.ai_service_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("value")
            else:
                logger.error(f"AI transformation failed: {response.status_code} {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error in AI transformation: {str(e)}")
            return None
    
    def register_type_conversion(self, source_type: str, target_type: str, converter: Callable[[Any], Any]):
        """
        Register a custom type conversion function.
        
        Args:
            source_type: Source data type name
            target_type: Target data type name
            converter: Function that converts from source type to target type
        """
        self.type_conversions[(source_type, target_type)] = converter
        
    def add_schema_to_registry(self, schema_name: str, fields: Dict[str, str]):
        """
        Add or update a schema in the registry.
        
        Args:
            schema_name: Name of the schema
            fields: Dictionary mapping field names to their types
        """
        self.schema_registry[schema_name] = fields
        
    def create_mapping(self, mapping_name: str, mapping_definition: Dict[str, Any]):
        """
        Create a new mapping configuration.
        
        Args:
            mapping_name: Name for the mapping
            mapping_definition: The mapping definition
        """
        self.mappings[mapping_name] = mapping_definition
        
        # Save to file
        try:
            filename = f"{mapping_name}.json"
            file_path = os.path.join(self.mapping_directory, filename)
            
            # Ensure directory exists
            os.makedirs(self.mapping_directory, exist_ok=True)
            
            with open(file_path, 'w') as f:
                json.dump(mapping_definition, f, indent=2)
                
            logger.info(f"Saved mapping configuration: {mapping_name}")
            
        except Exception as e:
            logger.error(f"Error saving mapping configuration: {str(e)}")
            
    def delete_mapping(self, mapping_name: str) -> bool:
        """
        Delete a mapping configuration.
        
        Args:
            mapping_name: Name of the mapping to delete
            
        Returns:
            True if successful, False otherwise
        """
        if mapping_name not in self.mappings:
            logger.warning(f"Mapping not found: {mapping_name}")
            return False
            
        try:
            # Remove from memory
            del self.mappings[mapping_name]
            
            # Remove file if it exists
            file_path = os.path.join(self.mapping_directory, f"{mapping_name}.json")
            if os.path.exists(file_path):
                os.remove(file_path)
                
            logger.info(f"Deleted mapping configuration: {mapping_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting mapping configuration: {str(e)}")
            return False