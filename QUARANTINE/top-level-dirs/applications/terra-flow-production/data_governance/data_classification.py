"""
Data Classification Framework

This module implements a strategic data classification system for the Benton County 
Washington Assessor's Office, establishing the foundation for applying appropriate
security controls based on data sensitivity.

Classification levels:
- Level 1 (Public): General property information already in the public domain
- Level 2 (Internal): Administrative data requiring basic protection
- Level 3 (Confidential): Personal taxpayer information requiring enhanced security
- Level 4 (Restricted): Highly sensitive information requiring maximum protection
"""

import enum
import logging
from typing import Dict, List, Any, Optional, Set

logger = logging.getLogger(__name__)

class SensitivityLevel(enum.Enum):
    """Data sensitivity classification levels"""
    PUBLIC = 1      # Level 1: Public information
    INTERNAL = 2    # Level 2: Internal administrative data
    CONFIDENTIAL = 3  # Level 3: Personal taxpayer information
    RESTRICTED = 4  # Level 4: Highly sensitive information

class DataClassificationManager:
    """
    Manages data classification rules and provides methods to classify data
    and determine appropriate security controls based on classification.
    """
    
    def __init__(self):
        """Initialize the data classification manager"""
        # Default field classifications for common tables
        self.field_classifications = {
            'properties': {
                # Public fields
                'parcel_id': SensitivityLevel.PUBLIC,
                'address': SensitivityLevel.PUBLIC,
                'city': SensitivityLevel.PUBLIC,
                'state': SensitivityLevel.PUBLIC,
                'zip_code': SensitivityLevel.PUBLIC,
                'property_type': SensitivityLevel.PUBLIC,
                'lot_size': SensitivityLevel.PUBLIC,
                'year_built': SensitivityLevel.PUBLIC,
                'total_area': SensitivityLevel.PUBLIC,
                
                # Internal fields
                'features': SensitivityLevel.INTERNAL,
                'location': SensitivityLevel.INTERNAL,
                'created_at': SensitivityLevel.INTERNAL,
                'updated_at': SensitivityLevel.INTERNAL,
                
                # Confidential fields
                'owner_name': SensitivityLevel.CONFIDENTIAL,
                'owner_address': SensitivityLevel.CONFIDENTIAL,
                'purchase_date': SensitivityLevel.CONFIDENTIAL,
                'purchase_price': SensitivityLevel.CONFIDENTIAL,
                
                # Restricted fields
                'property_metadata': SensitivityLevel.RESTRICTED
            },
            'tax_records': {
                # Public fields
                'tax_year': SensitivityLevel.PUBLIC,
                'land_value': SensitivityLevel.PUBLIC,
                'improvement_value': SensitivityLevel.PUBLIC,
                'total_value': SensitivityLevel.PUBLIC,
                'tax_rate': SensitivityLevel.PUBLIC,
                
                # Internal fields
                'created_at': SensitivityLevel.INTERNAL,
                'updated_at': SensitivityLevel.INTERNAL,
                
                # Confidential fields
                'tax_amount': SensitivityLevel.CONFIDENTIAL,
                'status': SensitivityLevel.CONFIDENTIAL,
                
                # Restricted fields
                'exemptions': SensitivityLevel.RESTRICTED
            },
            'assessments': {
                # Public fields
                'assessment_date': SensitivityLevel.PUBLIC,
                'land_value': SensitivityLevel.PUBLIC,
                'improvement_value': SensitivityLevel.PUBLIC,
                'total_value': SensitivityLevel.PUBLIC,
                'valuation_method': SensitivityLevel.PUBLIC,
                'status': SensitivityLevel.PUBLIC,
                
                # Internal fields
                'assessor_id': SensitivityLevel.INTERNAL,
                'created_at': SensitivityLevel.INTERNAL,
                'updated_at': SensitivityLevel.INTERNAL,
                
                # Confidential fields
                'comparable_properties': SensitivityLevel.CONFIDENTIAL,
                'market_conditions': SensitivityLevel.CONFIDENTIAL,
                'notes': SensitivityLevel.CONFIDENTIAL,
                
                # Restricted fields
                'documents': SensitivityLevel.RESTRICTED
            },
            'users': {
                # Public fields
                'id': SensitivityLevel.PUBLIC,
                
                # Internal fields
                'username': SensitivityLevel.INTERNAL,
                'full_name': SensitivityLevel.INTERNAL,
                'department': SensitivityLevel.INTERNAL,
                'created_at': SensitivityLevel.INTERNAL,
                
                # Confidential fields
                'email': SensitivityLevel.CONFIDENTIAL,
                'phone': SensitivityLevel.CONFIDENTIAL,
                'roles': SensitivityLevel.CONFIDENTIAL,
                
                # Restricted fields
                'mfa_secret': SensitivityLevel.RESTRICTED,
                'ad_object_id': SensitivityLevel.RESTRICTED
            }
        }
        
        # Security controls required for each sensitivity level
        self.security_controls = {
            SensitivityLevel.PUBLIC: {
                'encryption_at_rest': False,
                'encryption_in_transit': True,
                'field_level_encryption': False,
                'access_logging': False,
                'retention_policy': '7 years',
                'masking_required': False,
                'mfa_required': False,
                'approval_required': False
            },
            SensitivityLevel.INTERNAL: {
                'encryption_at_rest': True,
                'encryption_in_transit': True,
                'field_level_encryption': False,
                'access_logging': True,
                'retention_policy': '7 years',
                'masking_required': False,
                'mfa_required': False,
                'approval_required': False
            },
            SensitivityLevel.CONFIDENTIAL: {
                'encryption_at_rest': True,
                'encryption_in_transit': True,
                'field_level_encryption': True,
                'access_logging': True,
                'retention_policy': '10 years',
                'masking_required': True,
                'mfa_required': True,
                'approval_required': False
            },
            SensitivityLevel.RESTRICTED: {
                'encryption_at_rest': True,
                'encryption_in_transit': True,
                'field_level_encryption': True,
                'access_logging': True,
                'retention_policy': 'Indefinite',
                'masking_required': True,
                'mfa_required': True,
                'approval_required': True
            }
        }
        
        # Required permissions for each sensitivity level
        self.required_permissions = {
            SensitivityLevel.PUBLIC: {
                'read': ['public_data_read'],
                'write': ['public_data_write'],
                'delete': ['data_delete']
            },
            SensitivityLevel.INTERNAL: {
                'read': ['internal_data_read'],
                'write': ['internal_data_write'],
                'delete': ['data_delete', 'internal_data_delete']
            },
            SensitivityLevel.CONFIDENTIAL: {
                'read': ['confidential_data_read'],
                'write': ['confidential_data_write'],
                'delete': ['data_delete', 'confidential_data_delete']
            },
            SensitivityLevel.RESTRICTED: {
                'read': ['restricted_data_read'],
                'write': ['restricted_data_write'],
                'delete': ['data_delete', 'restricted_data_delete', 'admin_approval']
            }
        }
        
        logger.info("Data Classification Manager initialized")
    
    def get_classification_levels(self) -> List[Dict[str, Any]]:
        """
        Get the list of all classification levels defined in the system.
        
        Returns:
            List of dictionaries with classification level information
        """
        return [
            {"id": level.value, "name": level.name, "description": self._get_level_description(level)}
            for level in SensitivityLevel
        ]
        
    def get_field_classification(self, table_name: str, field_name: str) -> SensitivityLevel:
        """
        Get the sensitivity classification level for a specific field.
        
        Args:
            table_name: Database table name
            field_name: Field name
            
        Returns:
            SensitivityLevel enum value representing the field's classification level
        """
        if table_name in self.field_classifications and field_name in self.field_classifications[table_name]:
            return self.field_classifications[table_name][field_name]
        
        # Default to CONFIDENTIAL if not explicitly classified
        logger.warning(f"No classification found for {table_name}.{field_name}, defaulting to CONFIDENTIAL")
        return SensitivityLevel.CONFIDENTIAL
        
    def _get_level_description(self, level: SensitivityLevel) -> str:
        """
        Get a human-readable description for a sensitivity level.
        
        Args:
            level: SensitivityLevel enum value
            
        Returns:
            Description string
        """
        descriptions = {
            SensitivityLevel.PUBLIC: "General property information already in the public domain",
            SensitivityLevel.INTERNAL: "Administrative data requiring basic protection",
            SensitivityLevel.CONFIDENTIAL: "Personal taxpayer information requiring enhanced security",
            SensitivityLevel.RESTRICTED: "Highly sensitive information requiring maximum protection"
        }
        
        return descriptions.get(level, "Unknown classification level")
    
    def get_record_classification(self, table_name: str, record_data: Dict[str, Any]) -> SensitivityLevel:
        """
        Determine the overall classification level for a record based on its fields.
        The record takes the highest classification level of any of its fields.
        
        Args:
            table_name: Database table name
            record_data: Dictionary of field names and values
            
        Returns:
            SensitivityLevel enum value representing the record's classification level
        """
        highest_level = SensitivityLevel.PUBLIC
        
        for field_name in record_data.keys():
            field_level = self.get_field_classification(table_name, field_name)
            if field_level.value > highest_level.value:
                highest_level = field_level
                
        return highest_level
    
    def get_required_security_controls(self, sensitivity_level: SensitivityLevel) -> Dict[str, Any]:
        """
        Get required security controls for a given sensitivity level.
        
        Args:
            sensitivity_level: SensitivityLevel enum value
            
        Returns:
            Dictionary of security controls and their settings
        """
        return self.security_controls.get(sensitivity_level, self.security_controls[SensitivityLevel.CONFIDENTIAL])
    
    def get_required_permissions(self, sensitivity_level: SensitivityLevel, operation: str) -> List[str]:
        """
        Get required permissions for a given sensitivity level and operation.
        
        Args:
            sensitivity_level: SensitivityLevel enum value
            operation: Operation type (read, write, delete)
            
        Returns:
            List of permission names required
        """
        if operation not in ['read', 'write', 'delete']:
            logger.warning(f"Unknown operation: {operation}, defaulting to read permissions")
            operation = 'read'
            
        perms = self.required_permissions.get(sensitivity_level, {})
        return perms.get(operation, [])
    
    def mask_sensitive_data(self, table_name: str, record_data: Dict[str, Any], 
                           user_permissions: List[str]) -> Dict[str, Any]:
        """
        Apply data masking to sensitive fields based on user permissions.
        
        Args:
            table_name: Database table name
            record_data: Dictionary of field names and values
            user_permissions: List of permission names the user has
            
        Returns:
            Dictionary with sensitive data masked if user lacks proper permissions
        """
        result = {}
        
        for field_name, value in record_data.items():
            field_level = self.get_field_classification(table_name, field_name)
            required_perms = self.get_required_permissions(field_level, 'read')
            
            # Check if user has at least one of the required permissions
            has_permission = any(perm in user_permissions for perm in required_perms)
            
            if has_permission:
                result[field_name] = value
            else:
                # Apply masking based on sensitivity level
                if field_level == SensitivityLevel.CONFIDENTIAL:
                    result[field_name] = self._apply_mask_confidential(field_name, value)
                elif field_level == SensitivityLevel.RESTRICTED:
                    result[field_name] = "**RESTRICTED**"
                else:
                    result[field_name] = value
                    
        return result
    
    def _apply_mask_confidential(self, field_name: str, value: Any) -> Any:
        """
        Apply appropriate masking for confidential data.
        
        Args:
            field_name: Field name to determine masking strategy
            value: Value to mask
            
        Returns:
            Masked value
        """
        if value is None:
            return None
            
        if isinstance(value, str):
            # Apply different masking based on field type
            if 'name' in field_name.lower():
                # Show only first initial and last initial
                parts = value.split()
                if len(parts) > 1:
                    return f"{parts[0][0]}. {parts[-1][0]}."
                return f"{value[0]}."
            elif 'email' in field_name.lower():
                # Mask email
                parts = value.split('@')
                if len(parts) == 2:
                    return f"{parts[0][0]}...@{parts[1]}"
                return "***@***.***"
            elif 'address' in field_name.lower():
                # Show only street number
                parts = value.split(' ', 1)
                if len(parts) > 1 and parts[0].isdigit():
                    return f"{parts[0]} ***"
                return "*** ***"
            elif 'phone' in field_name.lower():
                # Mask phone number
                if len(value) > 4:
                    return f"***-***-{value[-4:]}"
                return "***-***-****"
                
        # For numeric values, show as "REDACTED"
        if isinstance(value, (int, float)):
            return "REDACTED"
            
        # Default masking for other types
        return "***"

# Create a singleton instance
classification_manager = DataClassificationManager()