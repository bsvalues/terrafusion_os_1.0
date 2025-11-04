"""
Validator Component for TerraFusion Sync Service.

This module is responsible for validating data integrity, schema compatibility,
and enforcing business rules during synchronization.
"""

import logging
import datetime
import json
import re
from typing import Dict, List, Any, Tuple, Optional, Union, Set, Callable

import sqlalchemy as sa
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.engine import Engine, Connection

from sync_service.data_type_handlers import DataTypeHandler, get_handler_for_column

logger = logging.getLogger(__name__)


class ValidationRule:
    """Base class for validation rules."""
    
    def __init__(self, name: str, description: str = None):
        """
        Initialize a validation rule.
        
        Args:
            name: Unique name for the rule
            description: Human-readable description of the rule
        """
        self.name = name
        self.description = description or name
        
    def validate(self, record: Dict[str, Any], context: Dict[str, Any] = None) -> Tuple[bool, Optional[str]]:
        """
        Validate a record against this rule.
        
        Args:
            record: The record to validate
            context: Additional context for validation
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        raise NotImplementedError("Subclasses must implement validate method")


class RequiredFieldRule(ValidationRule):
    """Rule for required fields."""
    
    def __init__(self, field_name: str):
        """
        Initialize a required field rule.
        
        Args:
            field_name: Name of the required field
        """
        super().__init__(
            name=f"required_{field_name}",
            description=f"Field '{field_name}' is required"
        )
        self.field_name = field_name
        
    def validate(self, record: Dict[str, Any], context: Dict[str, Any] = None) -> Tuple[bool, Optional[str]]:
        """Check if the required field exists and is not None."""
        if self.field_name not in record or record[self.field_name] is None:
            return False, f"Required field '{self.field_name}' is missing or None"
        return True, None


class TypeRule(ValidationRule):
    """Rule for field type validation."""
    
    def __init__(self, field_name: str, field_type: Union[type, str, List[type]]):
        """
        Initialize a type validation rule.
        
        Args:
            field_name: Name of the field to validate
            field_type: Expected type(s) for the field
        """
        if isinstance(field_type, list):
            type_names = [self._get_type_name(t) for t in field_type]
            type_desc = " or ".join(type_names)
        else:
            type_desc = self._get_type_name(field_type)
            
        super().__init__(
            name=f"type_{field_name}",
            description=f"Field '{field_name}' must be of type {type_desc}"
        )
        self.field_name = field_name
        self.field_type = field_type
        
    def _get_type_name(self, t):
        """Get a string representation of a type."""
        if isinstance(t, type):
            return t.__name__
        return str(t)
        
    def validate(self, record: Dict[str, Any], context: Dict[str, Any] = None) -> Tuple[bool, Optional[str]]:
        """Check if the field is of the expected type."""
        if self.field_name not in record:
            # Skip validation if field doesn't exist
            return True, None
            
        value = record[self.field_name]
        if value is None:
            # Skip validation for None values
            return True, None
            
        # Handle multi-type validation
        if isinstance(self.field_type, list):
            for t in self.field_type:
                if self._check_type(value, t):
                    return True, None
            type_names = [self._get_type_name(t) for t in self.field_type]
            return False, f"Field '{self.field_name}' with value '{value}' is not of expected types: {', '.join(type_names)}"
        else:
            # Single type validation
            if self._check_type(value, self.field_type):
                return True, None
            return False, f"Field '{self.field_name}' with value '{value}' is not of type {self._get_type_name(self.field_type)}"
    
    def _check_type(self, value, expected_type):
        """Check if a value matches an expected type."""
        if isinstance(expected_type, str):
            # Handle string type names
            if expected_type == 'str':
                return isinstance(value, str)
            elif expected_type == 'int':
                return isinstance(value, int)
            elif expected_type == 'float':
                return isinstance(value, (int, float))
            elif expected_type == 'bool':
                return isinstance(value, bool)
            elif expected_type == 'list':
                return isinstance(value, list)
            elif expected_type == 'dict':
                return isinstance(value, dict)
            elif expected_type == 'datetime':
                return isinstance(value, datetime.datetime)
            elif expected_type == 'date':
                return isinstance(value, datetime.date)
            else:
                return False
        else:
            # Handle type objects
            return isinstance(value, expected_type)


class RangeRule(ValidationRule):
    """Rule for numeric range validation."""
    
    def __init__(self, field_name: str, min_value: Optional[float] = None, max_value: Optional[float] = None):
        """
        Initialize a range validation rule.
        
        Args:
            field_name: Name of the field to validate
            min_value: Minimum allowed value (inclusive)
            max_value: Maximum allowed value (inclusive)
        """
        description = f"Field '{field_name}' must be"
        if min_value is not None and max_value is not None:
            description += f" between {min_value} and {max_value}"
        elif min_value is not None:
            description += f" greater than or equal to {min_value}"
        elif max_value is not None:
            description += f" less than or equal to {max_value}"
            
        super().__init__(
            name=f"range_{field_name}",
            description=description
        )
        self.field_name = field_name
        self.min_value = min_value
        self.max_value = max_value
        
    def validate(self, record: Dict[str, Any], context: Dict[str, Any] = None) -> Tuple[bool, Optional[str]]:
        """Check if the field value is within the specified range."""
        if self.field_name not in record:
            # Skip validation if field doesn't exist
            return True, None
            
        value = record[self.field_name]
        if value is None:
            # Skip validation for None values
            return True, None
            
        if not isinstance(value, (int, float)):
            return False, f"Field '{self.field_name}' with value '{value}' is not numeric"
            
        if self.min_value is not None and value < self.min_value:
            return False, f"Field '{self.field_name}' with value {value} is less than minimum {self.min_value}"
            
        if self.max_value is not None and value > self.max_value:
            return False, f"Field '{self.field_name}' with value {value} is greater than maximum {self.max_value}"
            
        return True, None


class PatternRule(ValidationRule):
    """Rule for string pattern validation."""
    
    def __init__(self, field_name: str, pattern: str):
        """
        Initialize a pattern validation rule.
        
        Args:
            field_name: Name of the field to validate
            pattern: Regular expression pattern
        """
        super().__init__(
            name=f"pattern_{field_name}",
            description=f"Field '{field_name}' must match pattern '{pattern}'"
        )
        self.field_name = field_name
        self.pattern = pattern
        self.regex = re.compile(pattern)
        
    def validate(self, record: Dict[str, Any], context: Dict[str, Any] = None) -> Tuple[bool, Optional[str]]:
        """Check if the field value matches the specified pattern."""
        if self.field_name not in record:
            # Skip validation if field doesn't exist
            return True, None
            
        value = record[self.field_name]
        if value is None:
            # Skip validation for None values
            return True, None
            
        if not isinstance(value, str):
            return False, f"Field '{self.field_name}' with value '{value}' is not a string"
            
        if not self.regex.match(value):
            return False, f"Field '{self.field_name}' with value '{value}' does not match pattern '{self.pattern}'"
            
        return True, None


class EnumRule(ValidationRule):
    """Rule for enumeration validation."""
    
    def __init__(self, field_name: str, allowed_values: List[Any]):
        """
        Initialize an enumeration validation rule.
        
        Args:
            field_name: Name of the field to validate
            allowed_values: List of allowed values
        """
        super().__init__(
            name=f"enum_{field_name}",
            description=f"Field '{field_name}' must be one of: {', '.join(str(v) for v in allowed_values)}"
        )
        self.field_name = field_name
        self.allowed_values = allowed_values
        
    def validate(self, record: Dict[str, Any], context: Dict[str, Any] = None) -> Tuple[bool, Optional[str]]:
        """Check if the field value is in the list of allowed values."""
        if self.field_name not in record:
            # Skip validation if field doesn't exist
            return True, None
            
        value = record[self.field_name]
        if value is None:
            # Skip validation for None values
            return True, None
            
        if value not in self.allowed_values:
            return False, f"Field '{self.field_name}' with value '{value}' is not in allowed values: {', '.join(str(v) for v in self.allowed_values)}"
            
        return True, None


class ReferenceRule(ValidationRule):
    """Rule for foreign key reference validation."""
    
    def __init__(self, field_name: str, reference_table: str, reference_field: str):
        """
        Initialize a reference validation rule.
        
        Args:
            field_name: Name of the field to validate
            reference_table: Name of the referenced table
            reference_field: Name of the referenced field
        """
        super().__init__(
            name=f"reference_{field_name}",
            description=f"Field '{field_name}' must reference existing {reference_table}.{reference_field}"
        )
        self.field_name = field_name
        self.reference_table = reference_table
        self.reference_field = reference_field
        
    def validate(self, record: Dict[str, Any], context: Dict[str, Any] = None) -> Tuple[bool, Optional[str]]:
        """Check if the field value references an existing record."""
        if self.field_name not in record:
            # Skip validation if field doesn't exist
            return True, None
            
        value = record[self.field_name]
        if value is None:
            # Skip validation for None values
            return True, None
            
        # This rule requires a database connection in the context
        if not context or 'connection' not in context:
            logger.warning(f"Cannot validate reference rule without a database connection")
            return True, None
            
        conn = context['connection']
        query = text(f"SELECT 1 FROM {self.reference_table} WHERE {self.reference_field} = :value LIMIT 1")
        result = conn.execute(query, {'value': value})
        if result.scalar():
            return True, None
        else:
            return False, f"Field '{self.field_name}' with value '{value}' does not reference an existing {self.reference_table}.{self.reference_field}"


class CustomRule(ValidationRule):
    """Rule for custom validation logic."""
    
    def __init__(self, name: str, description: str, validator_func: Callable[[Dict[str, Any], Dict[str, Any]], Tuple[bool, Optional[str]]]):
        """
        Initialize a custom validation rule.
        
        Args:
            name: Unique name for the rule
            description: Human-readable description of the rule
            validator_func: Function that takes (record, context) and returns (is_valid, error_message)
        """
        super().__init__(name=name, description=description)
        self.validator_func = validator_func
        
    def validate(self, record: Dict[str, Any], context: Dict[str, Any] = None) -> Tuple[bool, Optional[str]]:
        """Apply the custom validation function."""
        return self.validator_func(record, context or {})


class Validator:
    """
    Validates data integrity and schema compatibility during synchronization.
    
    Features:
    - Schema validation to ensure compatibility
    - Data validation rules enforcement
    - Custom validation rules support
    - Validation result reporting
    """
    
    def __init__(self):
        """Initialize the Validator component."""
        self.rules = {}  # Map table names to lists of validation rules
        self.schema_registry = {}  # Map table names to field type dictionaries
        
    def add_rule(self, table_name: str, rule: ValidationRule):
        """
        Add a validation rule for a table.
        
        Args:
            table_name: Name of the table
            rule: Validation rule to add
        """
        if table_name not in self.rules:
            self.rules[table_name] = []
            
        self.rules[table_name].append(rule)
        logger.info(f"Added rule '{rule.name}' for table '{table_name}'")
        
    def remove_rule(self, table_name: str, rule_name: str) -> bool:
        """
        Remove a validation rule for a table.
        
        Args:
            table_name: Name of the table
            rule_name: Name of the rule to remove
            
        Returns:
            True if rule was removed, False if not found
        """
        if table_name not in self.rules:
            return False
            
        for i, rule in enumerate(self.rules[table_name]):
            if rule.name == rule_name:
                del self.rules[table_name][i]
                logger.info(f"Removed rule '{rule_name}' from table '{table_name}'")
                return True
                
        return False
        
    def add_schema(self, table_name: str, schema: Dict[str, str]):
        """
        Add or update a table schema.
        
        Args:
            table_name: Name of the table
            schema: Dictionary mapping field names to types
        """
        self.schema_registry[table_name] = schema
        logger.info(f"Updated schema for table '{table_name}'")
        
    def remove_schema(self, table_name: str) -> bool:
        """
        Remove a table schema.
        
        Args:
            table_name: Name of the table
            
        Returns:
            True if schema was removed, False if not found
        """
        if table_name in self.schema_registry:
            del self.schema_registry[table_name]
            logger.info(f"Removed schema for table '{table_name}'")
            return True
        return False
        
    def validate_record(self, table_name: str, record: Dict[str, Any], 
                      context: Dict[str, Any] = None) -> Tuple[bool, List[str]]:
        """
        Validate a record against all rules for a table.
        
        Args:
            table_name: Name of the table
            record: Record to validate
            context: Additional context for validation
            
        Returns:
            Tuple of (is_valid, list_of_error_messages)
        """
        if table_name not in self.rules:
            # No rules for this table
            return True, []
            
        errors = []
        for rule in self.rules[table_name]:
            is_valid, error = rule.validate(record, context)
            if not is_valid and error:
                errors.append(error)
                
        return len(errors) == 0, errors
        
    def validate_records(self, table_name: str, records: List[Dict[str, Any]], 
                       context: Dict[str, Any] = None) -> Tuple[bool, Dict[int, List[str]]]:
        """
        Validate multiple records against all rules for a table.
        
        Args:
            table_name: Name of the table
            records: Records to validate
            context: Additional context for validation
            
        Returns:
            Tuple of (all_valid, {record_index: list_of_error_messages})
        """
        if table_name not in self.rules:
            # No rules for this table
            return True, {}
            
        all_valid = True
        error_map = {}
        
        for i, record in enumerate(records):
            is_valid, errors = self.validate_record(table_name, record, context)
            if not is_valid:
                all_valid = False
                error_map[i] = errors
                
        return all_valid, error_map
        
    def validate_schema_compatibility(self, source_schema: Dict[str, str], 
                                    target_schema: Dict[str, str]) -> Tuple[bool, List[str]]:
        """
        Validate that source schema is compatible with target schema.
        
        Compatible means:
        - All required fields in target exist in source
        - All field types in source can be converted to target types
        
        Args:
            source_schema: Dictionary mapping field names to types in source
            target_schema: Dictionary mapping field names to types in target
            
        Returns:
            Tuple of (is_compatible, list_of_compatibility_issues)
        """
        issues = []
        
        # Get all fields that exist in both schemas
        common_fields = set(source_schema.keys()).intersection(set(target_schema.keys()))
        
        # Check for missing required fields in source
        for field, type_name in target_schema.items():
            if field not in source_schema and not type_name.endswith('?'):  # '?' suffix indicates optional field
                issues.append(f"Required field '{field}' in target schema is missing from source schema")
                
        # Check type compatibility for common fields
        for field in common_fields:
            source_type = source_schema[field]
            target_type = target_schema[field]
            
            # Remove optional indicator from target type
            if target_type.endswith('?'):
                target_type = target_type[:-1]
                
            if not self._are_types_compatible(source_type, target_type):
                issues.append(f"Field '{field}' has incompatible types: source={source_type}, target={target_type}")
                
        is_compatible = len(issues) == 0
        return is_compatible, issues
        
    def _are_types_compatible(self, source_type: str, target_type: str) -> bool:
        """
        Check if two types are compatible for data conversion.
        
        Args:
            source_type: Data type in source schema
            target_type: Data type in target schema
            
        Returns:
            True if source type can be converted to target type
        """
        # Same types are always compatible
        if source_type == target_type:
            return True
            
        # Define type compatibility rules
        compatibility = {
            'int': {'int', 'float', 'str', 'bool'},
            'float': {'float', 'str'},
            'str': {'str'},
            'bool': {'bool', 'int', 'str'},
            'date': {'date', 'datetime', 'str'},
            'datetime': {'datetime', 'str'},
            'json': {'json', 'dict', 'str'},
            'dict': {'dict', 'json', 'str'},
            'list': {'list', 'json', 'str'}
        }
        
        # Check if target type is in the compatibility set for source type
        return target_type in compatibility.get(source_type, {target_type})
        
    def introspect_database_schema(self, engine: Engine, table_name: str) -> Dict[str, str]:
        """
        Introspect database schema for a table.
        
        Args:
            engine: SQLAlchemy engine
            table_name: Name of the table
            
        Returns:
            Dictionary mapping field names to types
        """
        schema = {}
        
        try:
            # Query table columns and types
            query = text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = :table_name
            """)
            
            with engine.connect() as conn:
                result = conn.execute(query, {'table_name': table_name})
                
                for row in result:
                    column_name = row['column_name']
                    data_type = row['data_type']
                    is_nullable = row['is_nullable'] == 'YES'
                    
                    # Map SQL types to our type system
                    type_name = self._map_sql_type(data_type)
                    
                    # Add optional indicator if nullable
                    if is_nullable:
                        type_name += '?'
                        
                    schema[column_name] = type_name
                    
            return schema
            
        except Exception as e:
            logger.error(f"Error introspecting schema for table {table_name}: {str(e)}")
            return {}
            
    def _map_sql_type(self, sql_type: str) -> str:
        """
        Map SQL data type to our type system.
        
        Args:
            sql_type: SQL data type
            
        Returns:
            Mapped type name
        """
        sql_type = sql_type.lower()
        
        # Integer types
        if sql_type in ('int', 'integer', 'smallint', 'bigint', 'serial', 'bigserial'):
            return 'int'
            
        # Float types
        if sql_type in ('real', 'double precision', 'numeric', 'decimal', 'float'):
            return 'float'
            
        # String types
        if sql_type in ('character', 'character varying', 'varchar', 'text', 'char'):
            return 'str'
            
        # Boolean types
        if sql_type in ('boolean', 'bool'):
            return 'bool'
            
        # Date/time types
        if sql_type == 'date':
            return 'date'
        if sql_type in ('timestamp', 'timestamp with time zone', 'timestamp without time zone'):
            return 'datetime'
            
        # JSON types
        if sql_type in ('json', 'jsonb'):
            return 'json'
            
        # Array types
        if sql_type.endswith('[]'):
            return 'list'
            
        # Fallback
        return 'str'
        
    def generate_validation_rules(self, table_name: str, schema: Dict[str, str]) -> List[ValidationRule]:
        """
        Generate basic validation rules from a schema.
        
        Args:
            table_name: Name of the table
            schema: Dictionary mapping field names to types
            
        Returns:
            List of generated validation rules
        """
        rules = []
        
        for field, type_name in schema.items():
            # Required field rule (if not optional)
            if not type_name.endswith('?'):
                rules.append(RequiredFieldRule(field))
                
            # Type rule
            base_type = type_name.rstrip('?')  # Remove optional indicator
            rules.append(TypeRule(field, base_type))
            
        return rules
        
    def get_table_rules(self, table_name: str) -> List[ValidationRule]:
        """
        Get all validation rules for a table.
        
        Args:
            table_name: Name of the table
            
        Returns:
            List of validation rules
        """
        return self.rules.get(table_name, [])