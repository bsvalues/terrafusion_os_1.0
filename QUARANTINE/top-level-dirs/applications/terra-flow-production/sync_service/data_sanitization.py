"""
Data Sanitization Framework for Sync Service

This module provides a configurable, rule-based sanitization framework for ensuring
sensitive data is properly sanitized when transferred between production and 
training/development environments.
"""
import logging
import re
import random
import string
import datetime
from typing import Dict, Any, List, Callable, Optional, Union, Set, Tuple
import json
import hashlib

from app import db
from sync_service.models import FieldConfiguration, TableConfiguration, SyncLog
from sync_service.app_context import with_app_context

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Sanitization function type hint
SanitizerFunc = Callable[[Any, Dict[str, Any]], Any]


class SanitizationLog(db.Model):
    """Log of sanitization actions for audit purposes"""
    __tablename__ = 'sanitization_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(50), nullable=False, index=True)
    table_name = db.Column(db.String(100), nullable=False)
    field_name = db.Column(db.String(100), nullable=False)
    record_id = db.Column(db.String(100), nullable=False)
    
    # The type of sanitization applied
    sanitization_type = db.Column(db.String(50), nullable=False)
    
    # Whether the value was modified
    was_modified = db.Column(db.Boolean, default=False)
    
    # Additional context
    context = db.Column(db.JSON)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<SanitizationLog {self.id} {self.table_name}.{self.field_name} [{self.sanitization_type}]>"


class SanitizationRule:
    """A rule for sanitizing data"""
    
    def __init__(self, 
                name: str,
                field_types: List[str],
                strategy: str,
                sanitizer_func: SanitizerFunc,
                description: str = None):
        """Initialize a sanitization rule
        
        Args:
            name: Name of the rule
            field_types: List of field types this rule applies to
            strategy: Type of sanitization strategy (mask, hash, nullify, etc.)
            sanitizer_func: Function to apply the sanitization
            description: Description of the rule
        """
        self.name = name
        self.field_types = field_types
        self.strategy = strategy
        self.sanitizer_func = sanitizer_func
        self.description = description or f"Sanitizes {', '.join(field_types)} using {strategy}"
    
    def apply(self, value: Any, context: Dict[str, Any] = None) -> Any:
        """Apply this sanitization rule to a value
        
        Args:
            value: The value to sanitize
            context: Additional context information
            
        Returns:
            The sanitized value
        """
        if context is None:
            context = {}
        
        return self.sanitizer_func(value, context)
    
    def __repr__(self):
        return f"<SanitizationRule {self.name} [{self.strategy}] for {','.join(self.field_types)}>"


class DataSanitizer:
    """Configurable, rule-based data sanitization engine"""
    
    def __init__(self, job_id: str = None):
        """Initialize the data sanitizer
        
        Args:
            job_id: ID of the current sync job
        """
        self.job_id = job_id
        self.rules: Dict[str, SanitizationRule] = {}
        self.field_type_rules: Dict[str, List[str]] = {}  # field_type -> list of rule names
        
        # Register default sanitization rules
        self._register_default_rules()
    
    def _register_default_rules(self) -> None:
        """Register the default set of sanitization rules"""
        # Mask sensitive text (e.g., PII)
        self.register_rule(
            SanitizationRule(
                name="mask_text",
                field_types=["personal_data", "pii", "name", "address"],
                strategy="mask",
                sanitizer_func=self._mask_text_sanitizer,
                description="Masks sensitive text data with X's, preserving the first and last character"
            )
        )
        
        # Hash email addresses
        self.register_rule(
            SanitizationRule(
                name="hash_email",
                field_types=["email"],
                strategy="hash",
                sanitizer_func=self._hash_email_sanitizer,
                description="Hashes email addresses while preserving domain"
            )
        )
        
        # Fully mask credentials
        self.register_rule(
            SanitizationRule(
                name="mask_credentials",
                field_types=["password", "credential", "secret"],
                strategy="full_mask",
                sanitizer_func=self._credential_sanitizer,
                description="Completely masks credential data"
            )
        )
        
        # Randomize phone numbers
        self.register_rule(
            SanitizationRule(
                name="random_phone",
                field_types=["phone_number", "fax"],
                strategy="randomize",
                sanitizer_func=self._phone_sanitizer,
                description="Replaces phone numbers with random valid-format numbers"
            )
        )
        
        # Nullify financial data
        self.register_rule(
            SanitizationRule(
                name="nullify_financial",
                field_types=["financial", "bank_account", "credit_card", "ssn", "tax_id"],
                strategy="nullify",
                sanitizer_func=self._nullify_sanitizer,
                description="Sets financial data to NULL"
            )
        )
        
        # Approximate dates
        self.register_rule(
            SanitizationRule(
                name="approximate_date",
                field_types=["date_of_birth", "personal_date"],
                strategy="approximate",
                sanitizer_func=self._date_sanitizer,
                description="Approximates dates to first day of month or year"
            )
        )
        
        # Random address
        self.register_rule(
            SanitizationRule(
                name="random_address",
                field_types=["street_address", "address_line"],
                strategy="randomize",
                sanitizer_func=self._address_sanitizer,
                description="Replaces addresses with random address-like values"
            )
        )
    
    def register_rule(self, rule: SanitizationRule) -> None:
        """Register a sanitization rule
        
        Args:
            rule: The rule to register
        """
        self.rules[rule.name] = rule
        
        # Map field types to rules
        for field_type in rule.field_types:
            if field_type not in self.field_type_rules:
                self.field_type_rules[field_type] = []
            self.field_type_rules[field_type].append(rule.name)
        
        logger.info(f"Registered sanitization rule: {rule.name} for field types: {rule.field_types}")
    
    def get_rules_for_field_type(self, field_type: str) -> List[SanitizationRule]:
        """Get all rules applicable to a field type
        
        Args:
            field_type: Type of field
            
        Returns:
            List of sanitization rules
        """
        rule_names = self.field_type_rules.get(field_type, [])
        return [self.rules[name] for name in rule_names if name in self.rules]
    
    @with_app_context
    def sanitize_field(self, 
                     table_name: str, 
                     field_name: str, 
                     value: Any, 
                     record_id: Any,
                     field_type: str = None) -> Tuple[Any, bool]:
        """Sanitize a field value according to applicable rules
        
        Args:
            table_name: Name of the table
            field_name: Name of the field
            value: Value to sanitize
            record_id: ID of the record
            field_type: Type of field (optional)
            
        Returns:
            Tuple of (sanitized_value, was_modified)
        """
        # Skip sanitization if value is None
        if value is None:
            return value, False
        
        # Get field configuration if not provided
        if not field_type:
            field_config = FieldConfiguration.query.filter_by(
                table_name=table_name,
                field_name=field_name
            ).first()
            
            if field_config and field_config.data_type:
                field_type = field_config.data_type
            else:
                # Guess field type from name
                field_type = self._infer_field_type(field_name)
        
        # Get applicable rules
        rules = self.get_rules_for_field_type(field_type)
        
        # If no rules found, try to infer from field name
        if not rules:
            inferred_type = self._infer_field_type(field_name)
            if inferred_type != field_type:
                rules = self.get_rules_for_field_type(inferred_type)
        
        # If still no rules, use a default conservative approach for unknown fields
        if not rules and not field_name.lower() in ['id', 'key', 'created_at', 'updated_at']:
            # Use masking for unknown string fields
            if isinstance(value, str) and len(value) > 0:
                rules = [self.rules.get("mask_text")]
        
        was_modified = False
        sanitized_value = value
        
        # Apply all applicable rules
        for rule in rules:
            if rule:
                context = {
                    'table_name': table_name,
                    'field_name': field_name,
                    'field_type': field_type,
                    'record_id': record_id
                }
                
                original_value = sanitized_value
                sanitized_value = rule.apply(sanitized_value, context)
                
                # Check if the value was modified
                if sanitized_value != original_value:
                    was_modified = True
                    
                    # Log sanitization
                    self._log_sanitization(
                        table_name=table_name,
                        field_name=field_name,
                        record_id=record_id,
                        sanitization_type=rule.strategy,
                        was_modified=True,
                        context={
                            'field_type': field_type,
                            'rule_name': rule.name
                        }
                    )
        
        return sanitized_value, was_modified
    
    @with_app_context
    def sanitize_record(self, 
                      table_name: str, 
                      record: Dict[str, Any],
                      skip_fields: Set[str] = None) -> Dict[str, Any]:
        """Sanitize an entire record
        
        Args:
            table_name: Name of the table
            record: Record data (dictionary)
            skip_fields: Set of field names to skip
            
        Returns:
            Sanitized record
        """
        if skip_fields is None:
            skip_fields = {'id', 'record_id', 'created_at', 'updated_at', 'last_updated'}
        
        # Get record ID
        record_id = record.get('id', None)
        
        # Get table configuration
        table_config = TableConfiguration.query.filter_by(name=table_name).first()
        
        # Get all field configurations for this table
        field_configs = FieldConfiguration.query.filter_by(table_name=table_name).all()
        field_config_dict = {fc.field_name: fc for fc in field_configs}
        
        sanitized_record = {}
        
        # Process each field
        for field_name, value in record.items():
            # Skip certain fields
            if field_name in skip_fields:
                sanitized_record[field_name] = value
                continue
            
            # Check if field needs sanitization
            field_config = field_config_dict.get(field_name)
            field_type = field_config.data_type if field_config else None
            
            # Sanitize the field
            sanitized_value, was_modified = self.sanitize_field(
                table_name=table_name,
                field_name=field_name,
                value=value,
                record_id=record_id,
                field_type=field_type
            )
            
            sanitized_record[field_name] = sanitized_value
        
        return sanitized_record
    
    @with_app_context
    def _log_sanitization(self, 
                        table_name: str, 
                        field_name: str, 
                        record_id: Any, 
                        sanitization_type: str,
                        was_modified: bool,
                        context: Dict[str, Any] = None) -> None:
        """Log a sanitization action
        
        Args:
            table_name: Name of the table
            field_name: Name of the field
            record_id: ID of the record
            sanitization_type: Type of sanitization applied
            was_modified: Whether the value was modified
            context: Additional context information
        """
        if not self.job_id:
            logger.warning("Cannot log sanitization without a job ID")
            return
        
        # Create sanitization log entry
        log_entry = SanitizationLog()
        log_entry.job_id = self.job_id
        log_entry.table_name = table_name
        log_entry.field_name = field_name
        log_entry.record_id = str(record_id) if record_id is not None else 'unknown'
        log_entry.sanitization_type = sanitization_type
        log_entry.was_modified = was_modified
        log_entry.context_data = context or {}  # Note: Using context_data here instead of context
        
        # Add to session and commit
        db.session.add(log_entry)
        db.session.commit()
        
        # Also log to sync log
        sync_log = SyncLog()
        sync_log.job_id = self.job_id
        sync_log.level = 'INFO' if was_modified else 'DEBUG'
        sync_log.message = f"Sanitized {table_name}.{field_name} using {sanitization_type}"
        sync_log.component = 'DataSanitizer'
        sync_log.table_name = table_name
        
        db.session.add(sync_log)
        db.session.commit()
    
    def _infer_field_type(self, field_name: str) -> str:
        """Infer field type from field name
        
        Args:
            field_name: Name of the field
            
        Returns:
            Inferred field type
        """
        field_name = field_name.lower()
        
        # Personal data
        if any(term in field_name for term in ['name', 'first', 'last', 'middle']):
            return 'personal_data'
        
        # Email
        if 'email' in field_name or field_name.endswith('_email'):
            return 'email'
        
        # Phone
        if any(term in field_name for term in ['phone', 'mobile', 'cell', 'fax']):
            return 'phone_number'
        
        # Address
        if any(term in field_name for term in ['address', 'street', 'city', 'state', 'zip', 'postal']):
            return 'address'
        
        # Financial
        if any(term in field_name for term in ['ssn', 'social', 'tax', 'account', 'card', 'credit', 'payment']):
            return 'financial'
        
        # Credentials
        if any(term in field_name for term in ['password', 'secret', 'key', 'token', 'auth']):
            return 'credential'
        
        # Dates of birth
        if any(term in field_name for term in ['birth', 'dob']):
            return 'date_of_birth'
        
        # Default to unknown
        return 'unknown'
    
    # Sanitization Functions
    
    def _mask_text_sanitizer(self, value: Any, context: Dict[str, Any]) -> Any:
        """Mask sensitive text with X's, preserving first and last character
        
        Args:
            value: Value to sanitize
            context: Additional context
            
        Returns:
            Sanitized value
        """
        if not isinstance(value, str) or not value:
            return value
        
        if len(value) <= 2:
            return value
        
        # Extract first and last character
        first_char = value[0]
        last_char = value[-1]
        
        # Generate a mask of X's for the middle part
        mask_length = len(value) - 2
        mask = 'X' * mask_length
        
        return f"{first_char}{mask}{last_char}"
    
    def _hash_email_sanitizer(self, value: Any, context: Dict[str, Any]) -> Any:
        """Hash email address while preserving domain
        
        Args:
            value: Value to sanitize
            context: Additional context
            
        Returns:
            Sanitized value
        """
        if not isinstance(value, str) or not value or '@' not in value:
            return value
        
        # Split email into local part and domain
        local_part, domain = value.split('@', 1)
        
        # Hash the local part
        hashed_local = hashlib.md5(local_part.encode()).hexdigest()[:8]
        
        return f"{hashed_local}@{domain}"
    
    def _credential_sanitizer(self, value: Any, context: Dict[str, Any]) -> Any:
        """Completely mask credential data
        
        Args:
            value: Value to sanitize
            context: Additional context
            
        Returns:
            Sanitized value
        """
        if not value:
            return value
            
        return '**********'
    
    def _phone_sanitizer(self, value: Any, context: Dict[str, Any]) -> Any:
        """Replace phone numbers with random valid-format numbers
        
        Args:
            value: Value to sanitize
            context: Additional context
            
        Returns:
            Sanitized value
        """
        if not isinstance(value, str) or not value:
            return value
        
        # Extract digits only
        digits = ''.join(c for c in value if c.isdigit())
        
        if not digits:
            return value
        
        # Generate random digits of the same length
        random_digits = ''.join(random.choices(string.digits, k=len(digits)))
        
        # Replace each digit in the original string
        result = ''
        digit_index = 0
        
        for c in value:
            if c.isdigit():
                result += random_digits[digit_index]
                digit_index += 1
            else:
                result += c
        
        return result
    
    def _nullify_sanitizer(self, value: Any, context: Dict[str, Any]) -> Any:
        """Set value to NULL
        
        Args:
            value: Value to sanitize
            context: Additional context
            
        Returns:
            Sanitized value
        """
        return None
    
    def _date_sanitizer(self, value: Any, context: Dict[str, Any]) -> Any:
        """Approximate dates to first day of month or year
        
        Args:
            value: Value to sanitize
            context: Additional context
            
        Returns:
            Sanitized value
        """
        if value is None:
            return None
        
        # Handle different date formats
        if isinstance(value, str):
            try:
                # Try to parse as ISO format
                dt = datetime.datetime.fromisoformat(value)
            except ValueError:
                try:
                    # Try common US format
                    dt = datetime.datetime.strptime(value, '%m/%d/%Y')
                except ValueError:
                    # Return as-is if we can't parse
                    return value
        elif isinstance(value, datetime.datetime):
            dt = value
        elif isinstance(value, datetime.date):
            dt = datetime.datetime.combine(value, datetime.datetime.min.time())
        else:
            return value
        
        # Approximate to first day of month
        approx_date = dt.replace(day=1)
        
        # Convert back to the same type as input
        if isinstance(value, str):
            if '-' in value:
                return approx_date.date().isoformat()
            else:
                return approx_date.date().strftime('%m/%d/%Y')
        elif isinstance(value, datetime.datetime):
            return approx_date
        elif isinstance(value, datetime.date):
            return approx_date.date()
        
        return value
    
    def _address_sanitizer(self, value: Any, context: Dict[str, Any]) -> Any:
        """Replace addresses with random address-like values
        
        Args:
            value: Value to sanitize
            context: Additional context
            
        Returns:
            Sanitized value
        """
        if not isinstance(value, str) or not value:
            return value
        
        # Generate a random street address
        number = random.randint(100, 9999)
        streets = ["Main", "Oak", "Pine", "Maple", "Cedar", "Elm", "Washington", "Park", "Lake", "Hill"]
        types = ["St", "Ave", "Blvd", "Dr", "Lane", "Road", "Place", "Way"]
        
        street = random.choice(streets)
        st_type = random.choice(types)
        
        return f"{number} {street} {st_type}"


# Factory function to create a data sanitizer
def create_data_sanitizer(job_id: str = None) -> DataSanitizer:
    """Create a data sanitizer instance
    
    Args:
        job_id: ID of the current sync job
        
    Returns:
        A DataSanitizer instance
    """
    return DataSanitizer(job_id)