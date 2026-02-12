"""
Data Sanitization Module for Benton County GeoAssessmentPro

This module provides functions to sanitize sensitive data according to
privacy requirements and data protection regulations.
"""

import re
import random
import logging
import pandas as pd
from typing import Dict, List, Any, Optional, Callable, Union
from datetime import datetime, date, timedelta

# Configure logging
logger = logging.getLogger(__name__)

class DataSanitizer:
    """
    Data sanitization class for cleaning sensitive data.
    """
    
    def __init__(self):
        """Initialize the data sanitizer"""
        # Register sanitization rules
        self.sanitization_rules = {
            # PII sanitization
            "name": self._sanitize_name,
            "email": self._sanitize_email,
            "phone": self._sanitize_phone,
            "ssn": self._sanitize_ssn,
            "address": self._sanitize_address,
            
            # Field type sanitization
            "personal_name": self._sanitize_name,
            "business_name": self._sanitize_business_name,
            "email_address": self._sanitize_email,
            "phone_number": self._sanitize_phone,
            "social_security_number": self._sanitize_ssn,
            "street_address": self._sanitize_address,
            "date_of_birth": self._sanitize_date,
            "personal_date": self._sanitize_date,
            "credit_card": self._sanitize_credit_card
        }
        
        # Field detection patterns
        self.field_patterns = {
            "name": [
                r".+_name$",
                r"^name_.+",
                r"^(first|last|middle|full)_name$",
                r"^(owner|buyer|seller|appraiser)_name$"
            ],
            "email": [
                r".+_email$",
                r"^email(_.+)?$",
                r"^(contact|owner|buyer|seller)_email$"
            ],
            "phone": [
                r".+_phone$",
                r"^phone(_.+)?$",
                r"^(contact|owner|buyer|seller)_phone$",
                r"^(phone|mobile|cell)_(number|num)$"
            ],
            "ssn": [
                r".+_ssn$",
                r"^ssn$",
                r"^social_security(_number)?$",
                r"^tax_id$"
            ],
            "address": [
                r".+_address$",
                r"^address(_.+)?$",
                r"^(owner|buyer|seller|mailing)_address$",
                r"^street_address$"
            ],
            "date_of_birth": [
                r".+_dob$",
                r"^dob$",
                r"^birth_date$",
                r"^date_of_birth$"
            ],
            "credit_card": [
                r".+_cc$",
                r"^cc_number$",
                r"^credit_card(_number)?$",
                r"^payment_card$"
            ]
        }
        
        logger.info("Data sanitizer initialized with %d rules", len(self.sanitization_rules))
    
    def sanitize_dataframe(self, df: pd.DataFrame, field_mappings: Optional[Dict[str, str]] = None) -> pd.DataFrame:
        """
        Sanitize a pandas DataFrame containing sensitive data.
        
        Args:
            df: The DataFrame to sanitize
            field_mappings: Optional mapping of column names to field types for sanitization
                            e.g. {'owner_name': 'name', 'owner_email': 'email'}
                            
        Returns:
            Sanitized DataFrame
        """
        if df.empty:
            return df
        
        # Create a copy to avoid modifying the original
        sanitized_df = df.copy()
        
        # Determine which columns should be sanitized
        to_sanitize = {}
        
        # If field mappings are provided, use them
        if field_mappings:
            for column, field_type in field_mappings.items():
                if column in sanitized_df.columns and field_type in self.sanitization_rules:
                    to_sanitize[column] = field_type
        
        # Otherwise, auto-detect based on column names
        else:
            for column in sanitized_df.columns:
                field_type = self._detect_field_type(column)
                if field_type:
                    to_sanitize[column] = field_type
        
        # Apply sanitization
        for column, field_type in to_sanitize.items():
            sanitizer = self.sanitization_rules[field_type]
            sanitized_df[column] = sanitized_df[column].apply(
                lambda x: sanitizer(x) if pd.notna(x) else x
            )
        
        if to_sanitize:
            logger.info("Sanitized %d columns in DataFrame: %s", 
                        len(to_sanitize), 
                        ", ".join(to_sanitize.keys()))
        
        return sanitized_df
    
    def register_sanitization_rule(self, field_type: str, sanitizer: Callable) -> None:
        """
        Register a custom sanitization rule.
        
        Args:
            field_type: The field type to sanitize
            sanitizer: The sanitization function
        """
        self.sanitization_rules[field_type] = sanitizer
        logger.info("Registered sanitization rule for field type: %s", field_type)
    
    def _detect_field_type(self, column_name: str) -> Optional[str]:
        """
        Detect the field type based on column name.
        
        Args:
            column_name: The column name to check
            
        Returns:
            Detected field type or None
        """
        column_lower = column_name.lower()
        
        for field_type, patterns in self.field_patterns.items():
            for pattern in patterns:
                if re.match(pattern, column_lower):
                    return field_type
        
        return None
    
    def validate_field_integrity(self, field_data: Any, field_type: str) -> Dict[str, Any]:
        """Validate field data integrity with advanced rules
        
        Args:
            field_data: Data to validate
            field_type: Type of field
            
        Returns:
            Validation results
        """
        validation_results = {
            "is_valid": True,
            "issues": [],
            "risk_level": "low"
        }
        
        # Type-specific validation
        if field_type == "parcel_number":
            if not re.match(r"^\d{3}-\d{3}-\d{3}$", str(field_data)):
                validation_results["is_valid"] = False
                validation_results["issues"].append("Invalid parcel number format")
                validation_results["risk_level"] = "high"
                
        elif field_type == "coordinate":
            try:
                lat, lon = map(float, str(field_data).split(","))
                if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                    validation_results["is_valid"] = False
                    validation_results["issues"].append("Coordinates out of valid range")
            except:
                validation_results["is_valid"] = False
                validation_results["issues"].append("Invalid coordinate format")
                
        return validation_results
    
    # Sanitization methods
    
    def _sanitize_name(self, value: Any) -> str:
        """Sanitize a name by replacing with a generic name"""
        if not value or not isinstance(value, str):
            return value
        
        name_parts = value.split()
        if len(name_parts) == 1:
            # Just a single name
            return "J. Doe"
        elif len(name_parts) == 2:
            # First and last name
            return "John Doe"
        else:
            # Multiple parts
            return "John Q. Doe"
    
    def _sanitize_business_name(self, value: Any) -> str:
        """Sanitize a business name"""
        if not value or not isinstance(value, str):
            return value
        
        return "Example Business, Inc."
    
    def _sanitize_email(self, value: Any) -> str:
        """Sanitize an email address"""
        if not value or not isinstance(value, str):
            return value
        
        # Extract domain if possible
        at_pos = value.find('@')
        if at_pos >= 0:
            domain = value[at_pos:]
            return f"user{random.randint(1000, 9999)}{domain}"
        
        return f"user{random.randint(1000, 9999)}@example.com"
    
    def _sanitize_phone(self, value: Any) -> str:
        """Sanitize a phone number"""
        if not value or not isinstance(value, (str, int)):
            return value
        
        # Format doesn't matter, just replace with generic
        return "(555) 555-1234"
    
    def _sanitize_ssn(self, value: Any) -> str:
        """Sanitize a social security number"""
        if not value or not isinstance(value, (str, int)):
            return value
        
        # Always use the same masked SSN format
        return "XXX-XX-1234"
    
    def _sanitize_address(self, value: Any) -> str:
        """Sanitize a street address"""
        if not value or not isinstance(value, str):
            return value
        
        return f"{random.randint(100, 999)} Main Street"
    
    def _sanitize_date(self, value: Any) -> Union[str, date, datetime]:
        """Sanitize a date (keep approximate age but change exact date)"""
        if not value:
            return value
        
        if isinstance(value, str):
            try:
                # Try to parse as date
                parsed_date = datetime.strptime(value, "%Y-%m-%d").date()
                # Add random days offset (±30 days)
                offset = random.randint(-30, 30)
                new_date = parsed_date + timedelta(days=offset)
                # Return in same format
                return new_date.strftime("%Y-%m-%d")
            except ValueError:
                # Not a standard date format, return as is
                return value
        
        elif isinstance(value, date):
            # Add random days offset (±30 days)
            offset = random.randint(-30, 30)
            return value + timedelta(days=offset)
        
        elif isinstance(value, datetime):
            # Add random days offset (±30 days)
            offset = random.randint(-30, 30)
            return value + timedelta(days=offset)
        
        return value
    
    def _sanitize_credit_card(self, value: Any) -> str:
        """Sanitize a credit card number"""
        if not value or not isinstance(value, (str, int)):
            return value
        
        # Always use the same masked format
        return "XXXX-XXXX-XXXX-1234"

# Create a singleton instance
data_sanitizer = DataSanitizer()