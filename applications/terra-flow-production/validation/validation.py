"""
Validation Module

This module implements data validation capabilities for the Benton County Assessor's Office,
providing a comprehensive framework for validating data throughout the system.
"""

import os
import logging
import json
import datetime
import uuid
import re
import time
import threading
from typing import Dict, List, Any, Optional, Tuple, Set, Union, Callable

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class ValidationManager:
    """
    Manager for data validation operations, including schema validation,
    data quality checks, and validation rule enforcement.
    """
    
    def __init__(self):
        """Initialize the validation manager"""
        # Validation configurations
        self.validation_rules = {}
        self.validation_history = []
        self.active_validations = {}
        
        # Validation levels
        self.validation_levels = {
            'minimal': {
                'description': 'Basic validation checking only critical fields and format',
                'priority': 1
            },
            'standard': {
                'description': 'Standard validation with common business rules',
                'priority': 2
            },
            'strict': {
                'description': 'Strict validation with all business rules enforced',
                'priority': 3
            },
            'custom': {
                'description': 'Custom validation with user-defined rules',
                'priority': 4
            }
        }
        
        # Rule categories
        self.rule_categories = {
            'format': 'Data format validation',
            'range': 'Value range validation',
            'reference': 'Reference data validation',
            'uniqueness': 'Uniqueness validation',
            'consistency': 'Cross-field consistency validation',
            'completeness': 'Data completeness validation',
            'geospatial': 'Geospatial data validation',
            'business': 'Business rule validation',
            'temporal': 'Temporal data validation'
        }
        
        # Default validation templates by entity type
        self.validation_templates = {
            'property': self._get_property_validation_template(),
            'assessment': self._get_assessment_validation_template(),
            'user': self._get_user_validation_template(),
            'parcel': self._get_parcel_validation_template(),
            'document': self._get_document_validation_template()
        }
        
        # Load custom validation rules if they exist
        self._load_validation_rules()
        
        # Initialize threads for validation workers
        self.worker_threads = []
        self.worker_running = False
        self.validation_queue = []
        self.queue_lock = threading.Lock()
        
        # Start validation workers
        self._start_validation_workers()
        
        # Initialization state
        self._initialized = True
        
        logger.info("Validation Manager initialized")
    
    def is_initialized(self) -> bool:
        """
        Check if the validation manager is properly initialized.
        
        Returns:
            True if initialized, False otherwise
        """
        return self._initialized
    
    def _get_property_validation_template(self) -> Dict[str, Any]:
        """Get the default validation template for property entities"""
        return {
            'name': 'Property Validation',
            'entity_type': 'property',
            'rules': [
                {
                    'id': 'prop_001',
                    'name': 'Property ID Format',
                    'description': 'Validate the property ID format',
                    'category': 'format',
                    'level': 'minimal',
                    'field': 'property_id',
                    'rule_type': 'regex',
                    'pattern': r'^P-\d{8}$',
                    'message': 'Property ID must be in format P-########',
                    'required': True
                },
                {
                    'id': 'prop_002',
                    'name': 'Address Required',
                    'description': 'Validate that property address is provided',
                    'category': 'completeness',
                    'level': 'minimal',
                    'field': 'address',
                    'rule_type': 'required',
                    'message': 'Property address is required',
                    'required': True
                },
                {
                    'id': 'prop_003',
                    'name': 'Valid Property Type',
                    'description': 'Validate that property type is valid',
                    'category': 'reference',
                    'level': 'standard',
                    'field': 'property_type',
                    'rule_type': 'enum',
                    'values': [
                        'residential', 'commercial', 'industrial', 'agricultural',
                        'vacant_land', 'special_purpose', 'mixed_use'
                    ],
                    'message': 'Invalid property type',
                    'required': True
                },
                {
                    'id': 'prop_004',
                    'name': 'Valid Square Footage',
                    'description': 'Validate square footage is in valid range',
                    'category': 'range',
                    'level': 'standard',
                    'field': 'square_footage',
                    'rule_type': 'range',
                    'min_value': 0,
                    'max_value': 1000000,
                    'message': 'Square footage must be between 0 and 1,000,000',
                    'required': False
                },
                {
                    'id': 'prop_005',
                    'name': 'Year Built Range',
                    'description': 'Validate year built is in valid range',
                    'category': 'range',
                    'level': 'standard',
                    'field': 'year_built',
                    'rule_type': 'range',
                    'min_value': 1800,
                    'max_value': datetime.datetime.now().year,
                    'message': f'Year built must be between 1800 and {datetime.datetime.now().year}',
                    'required': False
                },
                {
                    'id': 'prop_006',
                    'name': 'Valid Zip Code',
                    'description': 'Validate zip code format',
                    'category': 'format',
                    'level': 'standard',
                    'field': 'zip_code',
                    'rule_type': 'regex',
                    'pattern': r'^\d{5}(-\d{4})?$',
                    'message': 'Zip code must be in 5-digit or 5+4 digit format',
                    'required': False
                },
                {
                    'id': 'prop_007',
                    'name': 'Valid State',
                    'description': 'Validate state is a valid 2-letter code',
                    'category': 'format',
                    'level': 'standard',
                    'field': 'state',
                    'rule_type': 'regex',
                    'pattern': r'^[A-Z]{2}$',
                    'message': 'State must be a valid 2-letter state code',
                    'required': False
                },
                {
                    'id': 'prop_008',
                    'name': 'Valid Parcel ID Reference',
                    'description': 'Validate parcel ID exists in parcel records',
                    'category': 'reference',
                    'level': 'strict',
                    'field': 'parcel_id',
                    'rule_type': 'reference',
                    'ref_table': 'parcels',
                    'ref_field': 'parcel_id',
                    'message': 'Referenced parcel ID does not exist',
                    'required': True
                },
                {
                    'id': 'prop_009',
                    'name': 'Valid Owner Information',
                    'description': 'Validate owner information is complete',
                    'category': 'completeness',
                    'level': 'strict',
                    'field': 'owner_name',
                    'rule_type': 'required',
                    'message': 'Owner name is required',
                    'required': True
                },
                {
                    'id': 'prop_010',
                    'name': 'Valid Latitude/Longitude',
                    'description': 'Validate latitude and longitude are in valid ranges',
                    'category': 'geospatial',
                    'level': 'standard',
                    'fields': ['latitude', 'longitude'],
                    'rule_type': 'custom',
                    'validator': '_validate_lat_long',
                    'message': 'Invalid latitude/longitude coordinates',
                    'required': False
                }
            ]
        }
    
    def _get_assessment_validation_template(self) -> Dict[str, Any]:
        """Get the default validation template for assessment entities"""
        return {
            'name': 'Assessment Validation',
            'entity_type': 'assessment',
            'rules': [
                {
                    'id': 'assess_001',
                    'name': 'Assessment ID Format',
                    'description': 'Validate the assessment ID format',
                    'category': 'format',
                    'level': 'minimal',
                    'field': 'assessment_id',
                    'rule_type': 'regex',
                    'pattern': r'^A-\d{8}$',
                    'message': 'Assessment ID must be in format A-########',
                    'required': True
                },
                {
                    'id': 'assess_002',
                    'name': 'Valid Property Reference',
                    'description': 'Validate property ID exists in property records',
                    'category': 'reference',
                    'level': 'minimal',
                    'field': 'property_id',
                    'rule_type': 'reference',
                    'ref_table': 'properties',
                    'ref_field': 'property_id',
                    'message': 'Referenced property ID does not exist',
                    'required': True
                },
                {
                    'id': 'assess_003',
                    'name': 'Valid Assessment Date',
                    'description': 'Validate assessment date is in valid range',
                    'category': 'temporal',
                    'level': 'standard',
                    'field': 'assessment_date',
                    'rule_type': 'date_range',
                    'min_date': '1900-01-01',
                    'max_date': datetime.datetime.now().strftime('%Y-%m-%d'),
                    'message': 'Assessment date must be between 1900-01-01 and today',
                    'required': True
                },
                {
                    'id': 'assess_004',
                    'name': 'Valid Assessment Value',
                    'description': 'Validate assessment value is positive',
                    'category': 'range',
                    'level': 'minimal',
                    'field': 'assessed_value',
                    'rule_type': 'range',
                    'min_value': 0,
                    'message': 'Assessment value must be positive',
                    'required': True
                },
                {
                    'id': 'assess_005',
                    'name': 'Valid Assessment Type',
                    'description': 'Validate assessment type is valid',
                    'category': 'reference',
                    'level': 'standard',
                    'field': 'assessment_type',
                    'rule_type': 'enum',
                    'values': [
                        'initial', 'annual', 'appeal', 'correction', 
                        'revaluation', 'special'
                    ],
                    'message': 'Invalid assessment type',
                    'required': True
                },
                {
                    'id': 'assess_006',
                    'name': 'Valid Assessor Reference',
                    'description': 'Validate assessor ID exists in user records',
                    'category': 'reference',
                    'level': 'standard',
                    'field': 'assessor_id',
                    'rule_type': 'reference',
                    'ref_table': 'users',
                    'ref_field': 'id',
                    'message': 'Referenced assessor ID does not exist',
                    'required': True
                },
                {
                    'id': 'assess_007',
                    'name': 'Value Components Sum Check',
                    'description': 'Validate that value components sum to total value',
                    'category': 'consistency',
                    'level': 'strict',
                    'fields': ['land_value', 'improvement_value', 'total_value'],
                    'rule_type': 'custom',
                    'validator': '_validate_value_components_sum',
                    'message': 'Land value + improvement value must equal total value',
                    'required': True
                },
                {
                    'id': 'assess_008',
                    'name': 'Valid Tax Year',
                    'description': 'Validate tax year is in valid range',
                    'category': 'range',
                    'level': 'standard',
                    'field': 'tax_year',
                    'rule_type': 'range',
                    'min_value': 1900,
                    'max_value': datetime.datetime.now().year + 1,
                    'message': f'Tax year must be between 1900 and {datetime.datetime.now().year + 1}',
                    'required': True
                },
                {
                    'id': 'assess_009',
                    'name': 'Valid Status',
                    'description': 'Validate assessment status is valid',
                    'category': 'reference',
                    'level': 'standard',
                    'field': 'status',
                    'rule_type': 'enum',
                    'values': [
                        'draft', 'review', 'approved', 'appealed', 
                        'appealed_approved', 'appealed_denied', 'finalized'
                    ],
                    'message': 'Invalid assessment status',
                    'required': True
                },
                {
                    'id': 'assess_010',
                    'name': 'Status-Date Consistency',
                    'description': 'Validate status date is consistent with status',
                    'category': 'consistency',
                    'level': 'strict',
                    'fields': ['status', 'status_date'],
                    'rule_type': 'custom',
                    'validator': '_validate_status_date_consistency',
                    'message': 'Status date must be consistent with status',
                    'required': True
                }
            ]
        }
    
    def _get_user_validation_template(self) -> Dict[str, Any]:
        """Get the default validation template for user entities"""
        return {
            'name': 'User Validation',
            'entity_type': 'user',
            'rules': [
                {
                    'id': 'user_001',
                    'name': 'Username Format',
                    'description': 'Validate username format',
                    'category': 'format',
                    'level': 'minimal',
                    'field': 'username',
                    'rule_type': 'regex',
                    'pattern': r'^[a-zA-Z0-9_]{3,20}$',
                    'message': 'Username must be 3-20 characters (letters, numbers, underscore)',
                    'required': True
                },
                {
                    'id': 'user_002',
                    'name': 'Email Format',
                    'description': 'Validate email format',
                    'category': 'format',
                    'level': 'minimal',
                    'field': 'email',
                    'rule_type': 'regex',
                    'pattern': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
                    'message': 'Invalid email format',
                    'required': True
                },
                {
                    'id': 'user_003',
                    'name': 'Valid Role Reference',
                    'description': 'Validate role exists in role records',
                    'category': 'reference',
                    'level': 'standard',
                    'field': 'role_id',
                    'rule_type': 'reference',
                    'ref_table': 'roles',
                    'ref_field': 'id',
                    'message': 'Referenced role ID does not exist',
                    'required': True
                },
                {
                    'id': 'user_004',
                    'name': 'Valid Department',
                    'description': 'Validate department is valid',
                    'category': 'reference',
                    'level': 'standard',
                    'field': 'department',
                    'rule_type': 'enum',
                    'values': [
                        'assessment', 'administration', 'it', 'finance',
                        'legal', 'field_operations', 'customer_service'
                    ],
                    'message': 'Invalid department',
                    'required': True
                },
                {
                    'id': 'user_005',
                    'name': 'Valid Phone Number',
                    'description': 'Validate phone number format',
                    'category': 'format',
                    'level': 'standard',
                    'field': 'phone',
                    'rule_type': 'regex',
                    'pattern': r'^\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$',
                    'message': 'Invalid phone number format',
                    'required': False
                }
            ]
        }
    
    def _get_parcel_validation_template(self) -> Dict[str, Any]:
        """Get the default validation template for parcel entities"""
        return {
            'name': 'Parcel Validation',
            'entity_type': 'parcel',
            'rules': [
                {
                    'id': 'parcel_001',
                    'name': 'Parcel ID Format',
                    'description': 'Validate parcel ID format',
                    'category': 'format',
                    'level': 'minimal',
                    'field': 'parcel_id',
                    'rule_type': 'regex',
                    'pattern': r'^[0-9]{3}-[0-9]{4}-[0-9]{3}$',
                    'message': 'Parcel ID must be in format ###-####-###',
                    'required': True
                },
                {
                    'id': 'parcel_002',
                    'name': 'Valid Area',
                    'description': 'Validate parcel area is positive',
                    'category': 'range',
                    'level': 'standard',
                    'field': 'area_sqft',
                    'rule_type': 'range',
                    'min_value': 0,
                    'message': 'Parcel area must be positive',
                    'required': True
                },
                {
                    'id': 'parcel_003',
                    'name': 'Valid Zoning Code',
                    'description': 'Validate zoning code is valid',
                    'category': 'reference',
                    'level': 'standard',
                    'field': 'zoning_code',
                    'rule_type': 'enum',
                    'values': [
                        'R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3',
                        'I1', 'I2', 'A1', 'A2', 'PUD', 'MU', 'OS'
                    ],
                    'message': 'Invalid zoning code',
                    'required': True
                },
                {
                    'id': 'parcel_004',
                    'name': 'Valid Geometry',
                    'description': 'Validate parcel geometry is valid',
                    'category': 'geospatial',
                    'level': 'strict',
                    'field': 'geometry',
                    'rule_type': 'custom',
                    'validator': '_validate_parcel_geometry',
                    'message': 'Invalid parcel geometry',
                    'required': True
                },
                {
                    'id': 'parcel_005',
                    'name': 'Valid Legal Description',
                    'description': 'Validate legal description is provided',
                    'category': 'completeness',
                    'level': 'standard',
                    'field': 'legal_description',
                    'rule_type': 'required',
                    'message': 'Legal description is required',
                    'required': True
                }
            ]
        }
    
    def _get_document_validation_template(self) -> Dict[str, Any]:
        """Get the default validation template for document entities"""
        return {
            'name': 'Document Validation',
            'entity_type': 'document',
            'rules': [
                {
                    'id': 'doc_001',
                    'name': 'Document ID Format',
                    'description': 'Validate document ID format',
                    'category': 'format',
                    'level': 'minimal',
                    'field': 'document_id',
                    'rule_type': 'regex',
                    'pattern': r'^DOC-\d{8}$',
                    'message': 'Document ID must be in format DOC-########',
                    'required': True
                },
                {
                    'id': 'doc_002',
                    'name': 'Valid Document Type',
                    'description': 'Validate document type is valid',
                    'category': 'reference',
                    'level': 'standard',
                    'field': 'document_type',
                    'rule_type': 'enum',
                    'values': [
                        'deed', 'mortgage', 'lien', 'easement', 'plat',
                        'survey', 'tax_record', 'appeal', 'photo', 'other'
                    ],
                    'message': 'Invalid document type',
                    'required': True
                },
                {
                    'id': 'doc_003',
                    'name': 'Valid File Extension',
                    'description': 'Validate file extension is valid',
                    'category': 'format',
                    'level': 'standard',
                    'field': 'file_path',
                    'rule_type': 'regex',
                    'pattern': r'.*\.(pdf|jpg|jpeg|png|tif|tiff|doc|docx|xls|xlsx)$',
                    'message': 'Invalid file extension',
                    'required': True
                },
                {
                    'id': 'doc_004',
                    'name': 'Valid Upload Date',
                    'description': 'Validate upload date is not in the future',
                    'category': 'temporal',
                    'level': 'standard',
                    'field': 'upload_date',
                    'rule_type': 'date_range',
                    'max_date': datetime.datetime.now().strftime('%Y-%m-%d'),
                    'message': 'Upload date cannot be in the future',
                    'required': True
                },
                {
                    'id': 'doc_005',
                    'name': 'Valid Reference Entity',
                    'description': 'Validate referenced entity exists',
                    'category': 'reference',
                    'level': 'strict',
                    'fields': ['reference_type', 'reference_id'],
                    'rule_type': 'custom',
                    'validator': '_validate_document_reference',
                    'message': 'Referenced entity does not exist',
                    'required': True
                }
            ]
        }
    
    def _load_validation_rules(self) -> None:
        """Load validation rules from configuration"""
        rules_path = os.environ.get('VALIDATION_RULES_PATH', 'config/validation_rules.json')
        
        if os.path.exists(rules_path):
            try:
                with open(rules_path, 'r') as f:
                    self.validation_rules = json.load(f)
                logger.info(f"Loaded validation rules from {rules_path}")
            except Exception as e:
                logger.error(f"Error loading validation rules: {str(e)}")
                # Fall back to default templates
                self.validation_rules = {
                    template['entity_type']: template
                    for _, template in self.validation_templates.items()
                }
        else:
            # Use default templates
            logger.info("Using default validation templates")
            self.validation_rules = {
                template['entity_type']: template
                for _, template in self.validation_templates.items()
            }
    
    def _start_validation_workers(self) -> None:
        """Start validation worker threads"""
        self.worker_running = True
        
        # Start worker threads
        num_workers = min(4, os.cpu_count() or 2)
        for i in range(num_workers):
            thread = threading.Thread(
                target=self._validation_worker,
                name=f"ValidationWorker-{i+1}"
            )
            thread.daemon = True
            thread.start()
            self.worker_threads.append(thread)
        
        logger.info(f"Started {num_workers} validation worker threads")
    
    def _validation_worker(self) -> None:
        """Validation worker thread function"""
        while self.worker_running:
            # Get next validation task
            validation_task = None
            
            with self.queue_lock:
                if self.validation_queue:
                    validation_task = self.validation_queue.pop(0)
            
            if validation_task:
                try:
                    # Process the validation task
                    validation_id = validation_task.get('validation_id')
                    entity_type = validation_task.get('entity_type')
                    entity_data = validation_task.get('entity_data')
                    validation_level = validation_task.get('validation_level', 'standard')
                    
                    # Perform validation
                    if validation_id in self.active_validations:
                        validation_info = self.active_validations[validation_id]
                        validation_info['status'] = 'in_progress'
                        
                        # Validate entity
                        results = self._validate_entity(
                            entity_type=entity_type,
                            entity_data=entity_data,
                            validation_level=validation_level
                        )
                        
                        # Update validation info
                        validation_info['results'] = results
                        validation_info['status'] = 'completed'
                        validation_info['completed_at'] = datetime.datetime.now().isoformat()
                        validation_info['is_valid'] = all(rule.get('passed', False) for rule in results)
                        
                        # Add to validation history
                        self.validation_history.append(validation_info)
                        
                        logger.info(f"Completed validation task: {validation_id}")
                        
                except Exception as e:
                    logger.error(f"Error processing validation task: {str(e)}")
                    
                    # Update validation info if it exists
                    if validation_id and validation_id in self.active_validations:
                        validation_info = self.active_validations[validation_id]
                        validation_info['status'] = 'failed'
                        validation_info['error'] = str(e)
                        
                        # Add to validation history
                        self.validation_history.append(validation_info)
            
            else:
                # No task available, sleep
                time.sleep(0.1)
    
    def validate_entity(self, entity_type: str, entity_data: Dict[str, Any],
                      validation_level: str = 'standard') -> Dict[str, Any]:
        """
        Validate an entity against defined rules.
        
        Args:
            entity_type: Type of entity to validate
            entity_data: Entity data to validate
            validation_level: Validation level to apply
            
        Returns:
            Validation results
        """
        # Create validation ID
        validation_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now()
        
        # Create validation info
        validation_info = {
            'id': validation_id,
            'entity_type': entity_type,
            'validation_level': validation_level,
            'created_at': timestamp.isoformat(),
            'status': 'queued',
            'completed_at': None,
            'is_valid': None,
            'results': None,
            'error': None
        }
        
        # Add to active validations
        self.active_validations[validation_id] = validation_info
        
        # Create validation task
        validation_task = {
            'validation_id': validation_id,
            'entity_type': entity_type,
            'entity_data': entity_data,
            'validation_level': validation_level
        }
        
        # Add to validation queue
        with self.queue_lock:
            self.validation_queue.append(validation_task)
        
        logger.info(f"Queued validation task: {validation_id} for {entity_type}")
        
        return validation_info
    
    def get_validation_status(self, validation_id: str) -> Dict[str, Any]:
        """
        Get status of a validation operation.
        
        Args:
            validation_id: Validation ID
            
        Returns:
            Validation status information
        """
        # Check active validations
        if validation_id in self.active_validations:
            return self.active_validations[validation_id]
        
        # Check validation history
        for validation in self.validation_history:
            if validation.get('id') == validation_id:
                return validation
        
        raise ValueError(f"Validation not found: {validation_id}")
    
    def _validate_entity(self, entity_type: str, entity_data: Dict[str, Any],
                        validation_level: str = 'standard') -> List[Dict[str, Any]]:
        """
        Validate an entity against defined rules.
        
        Args:
            entity_type: Type of entity to validate
            entity_data: Entity data to validate
            validation_level: Validation level to apply
            
        Returns:
            List of validation results
        """
        # Get validation rules for entity type
        if entity_type not in self.validation_rules:
            logger.warning(f"No validation rules defined for entity type: {entity_type}")
            return []
        
        # Get validation level priority
        level_priority = self.validation_levels.get(
            validation_level, self.validation_levels['standard']
        )['priority']
        
        # Get rules for entity type that match or are below the validation level
        rules = self.validation_rules[entity_type]['rules']
        applicable_rules = [
            rule for rule in rules
            if self.validation_levels.get(rule.get('level', 'standard'), {}).get('priority', 2) <= level_priority
        ]
        
        # Apply each rule
        results = []
        for rule in applicable_rules:
            rule_result = self._apply_rule(rule, entity_data)
            results.append(rule_result)
        
        return results
    
    def _apply_rule(self, rule: Dict[str, Any], entity_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply a validation rule to entity data.
        
        Args:
            rule: Validation rule to apply
            entity_data: Entity data to validate
            
        Returns:
            Rule validation result
        """
        rule_id = rule.get('id', 'unknown')
        rule_name = rule.get('name', 'Unknown Rule')
        rule_type = rule.get('rule_type', 'unknown')
        field = rule.get('field')
        fields = rule.get('fields', [field] if field else [])
        required = rule.get('required', False)
        message = rule.get('message', 'Validation failed')
        
        # Default result structure
        result = {
            'rule_id': rule_id,
            'rule_name': rule_name,
            'fields': fields,
            'passed': False,
            'message': message
        }
        
        try:
            # Check if all fields are present
            missing_fields = [f for f in fields if f not in entity_data]
            
            # If fields are missing but not required, mark as passed
            if missing_fields and not required:
                result['passed'] = True
                result['message'] = 'Fields not present but not required'
                return result
            
            # If fields are missing and required, validation fails
            if missing_fields and required:
                result['passed'] = False
                result['message'] = f"Required fields missing: {', '.join(missing_fields)}"
                return result
            
            # Apply rule based on type
            if rule_type == 'regex':
                if field in entity_data:
                    pattern = rule.get('pattern', '')
                    value = str(entity_data[field])
                    passed = bool(re.match(pattern, value))
                    
                    result['passed'] = passed
                    if not passed:
                        result['message'] = message
                
            elif rule_type == 'required':
                if field in entity_data:
                    value = entity_data[field]
                    passed = value is not None and value != ''
                    
                    result['passed'] = passed
                    if not passed:
                        result['message'] = message
                
            elif rule_type == 'enum':
                if field in entity_data:
                    valid_values = rule.get('values', [])
                    value = entity_data[field]
                    passed = value in valid_values
                    
                    result['passed'] = passed
                    if not passed:
                        result['message'] = f"{message} (valid values: {', '.join(str(v) for v in valid_values)})"
                
            elif rule_type == 'range':
                if field in entity_data:
                    value = entity_data[field]
                    min_value = rule.get('min_value')
                    max_value = rule.get('max_value')
                    
                    # Check minimum value if specified
                    min_check = True
                    if min_value is not None:
                        min_check = value >= min_value
                    
                    # Check maximum value if specified
                    max_check = True
                    if max_value is not None:
                        max_check = value <= max_value
                    
                    passed = min_check and max_check
                    
                    result['passed'] = passed
                    if not passed:
                        if min_value is not None and max_value is not None:
                            result['message'] = f"{message} ({min_value} to {max_value})"
                        elif min_value is not None:
                            result['message'] = f"{message} (min: {min_value})"
                        elif max_value is not None:
                            result['message'] = f"{message} (max: {max_value})"
                
            elif rule_type == 'date_range':
                if field in entity_data:
                    value_str = entity_data[field]
                    
                    # Parse date string
                    try:
                        if isinstance(value_str, str):
                            value = datetime.datetime.fromisoformat(value_str.replace('Z', '+00:00'))
                        elif isinstance(value_str, datetime.datetime):
                            value = value_str
                        else:
                            raise ValueError(f"Invalid date format: {value_str}")
                        
                        # Get min and max dates
                        min_date_str = rule.get('min_date')
                        max_date_str = rule.get('max_date')
                        
                        min_date = None
                        if min_date_str:
                            min_date = datetime.datetime.fromisoformat(min_date_str.replace('Z', '+00:00'))
                        
                        max_date = None
                        if max_date_str:
                            max_date = datetime.datetime.fromisoformat(max_date_str.replace('Z', '+00:00'))
                        
                        # Check date range
                        min_check = True
                        if min_date:
                            min_check = value >= min_date
                        
                        max_check = True
                        if max_date:
                            max_check = value <= max_date
                        
                        passed = min_check and max_check
                        
                        result['passed'] = passed
                        if not passed:
                            if min_date and max_date:
                                result['message'] = f"{message} ({min_date_str} to {max_date_str})"
                            elif min_date:
                                result['message'] = f"{message} (min: {min_date_str})"
                            elif max_date:
                                result['message'] = f"{message} (max: {max_date_str})"
                    except ValueError as e:
                        result['passed'] = False
                        result['message'] = f"Invalid date format: {str(e)}"
                
            elif rule_type == 'reference':
                # This would typically involve a database query
                # For simplicity, we'll simulate reference validation
                if field in entity_data:
                    ref_table = rule.get('ref_table')
                    ref_field = rule.get('ref_field')
                    value = entity_data[field]
                    
                    # In a real implementation, this would check the database
                    # For now, we'll just assume the reference is valid
                    passed = True
                    
                    result['passed'] = passed
                    if not passed:
                        result['message'] = f"{message} (table: {ref_table}, field: {ref_field})"
                
            elif rule_type == 'custom':
                # Custom validation logic
                validator_name = rule.get('validator')
                
                if validator_name and hasattr(self, validator_name):
                    validator_func = getattr(self, validator_name)
                    passed, message = validator_func(entity_data, rule)
                    
                    result['passed'] = passed
                    if not passed:
                        result['message'] = message
                else:
                    result['passed'] = False
                    result['message'] = f"Custom validator not found: {validator_name}"
            
            else:
                result['passed'] = False
                result['message'] = f"Unknown rule type: {rule_type}"
        
        except Exception as e:
            result['passed'] = False
            result['message'] = f"Error applying rule: {str(e)}"
        
        return result
    
    # Custom validators
    
    def _validate_lat_long(self, entity_data: Dict[str, Any], rule: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate latitude and longitude values.
        
        Args:
            entity_data: Entity data to validate
            rule: Validation rule
            
        Returns:
            Tuple of (passed, message)
        """
        latitude = entity_data.get('latitude')
        longitude = entity_data.get('longitude')
        
        if latitude is None or longitude is None:
            return False, "Latitude and longitude must both be provided"
        
        try:
            lat_float = float(latitude)
            long_float = float(longitude)
            
            if lat_float < -90 or lat_float > 90:
                return False, "Latitude must be between -90 and 90"
            
            if long_float < -180 or long_float > 180:
                return False, "Longitude must be between -180 and 180"
            
            return True, "Coordinates are valid"
            
        except ValueError:
            return False, "Latitude and longitude must be numeric"
    
    def _validate_value_components_sum(self, entity_data: Dict[str, Any], rule: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate that value components sum to total value.
        
        Args:
            entity_data: Entity data to validate
            rule: Validation rule
            
        Returns:
            Tuple of (passed, message)
        """
        land_value = entity_data.get('land_value', 0)
        improvement_value = entity_data.get('improvement_value', 0)
        total_value = entity_data.get('total_value', 0)
        
        # Convert to float if needed
        try:
            land_value = float(land_value)
            improvement_value = float(improvement_value)
            total_value = float(total_value)
        except ValueError:
            return False, "Value components must be numeric"
        
        # Check sum with a small tolerance for floating-point precision
        expected_total = land_value + improvement_value
        tolerance = 0.01  # 1 cent tolerance
        
        if abs(expected_total - total_value) <= tolerance:
            return True, "Value components sum correctly"
        else:
            return False, f"Land value ({land_value}) + improvement value ({improvement_value}) = {expected_total}, which does not equal total value ({total_value})"
    
    def _validate_status_date_consistency(self, entity_data: Dict[str, Any], rule: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate status date is consistent with status.
        
        Args:
            entity_data: Entity data to validate
            rule: Validation rule
            
        Returns:
            Tuple of (passed, message)
        """
        status = entity_data.get('status')
        status_date_str = entity_data.get('status_date')
        
        if not status or not status_date_str:
            return False, "Status and status date must both be provided"
        
        try:
            if isinstance(status_date_str, str):
                status_date = datetime.datetime.fromisoformat(status_date_str.replace('Z', '+00:00'))
            elif isinstance(status_date_str, datetime.datetime):
                status_date = status_date_str
            else:
                return False, f"Invalid status date format: {status_date_str}"
            
            # Check if status date is not in the future
            now = datetime.datetime.now()
            if status_date > now:
                return False, "Status date cannot be in the future"
            
            # Check status sequence logic
            assessment_date_str = entity_data.get('assessment_date')
            if assessment_date_str:
                if isinstance(assessment_date_str, str):
                    assessment_date = datetime.datetime.fromisoformat(assessment_date_str.replace('Z', '+00:00'))
                elif isinstance(assessment_date_str, datetime.datetime):
                    assessment_date = assessment_date_str
                else:
                    return False, f"Invalid assessment date format: {assessment_date_str}"
                
                # Status date should not be before assessment date
                if status_date < assessment_date:
                    return False, "Status date cannot be before assessment date"
            
            return True, "Status date is consistent with status"
            
        except ValueError as e:
            return False, f"Invalid date format: {str(e)}"
    
    def _validate_parcel_geometry(self, entity_data: Dict[str, Any], rule: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate parcel geometry.
        
        Args:
            entity_data: Entity data to validate
            rule: Validation rule
            
        Returns:
            Tuple of (passed, message)
        """
        geometry = entity_data.get('geometry')
        
        if not geometry:
            return False, "Geometry must be provided"
        
        try:
            # In a real implementation, this would use GIS libraries
            # For example, using Shapely:
            try:
                from shapely.geometry import shape
                from shapely.validation import explain_validity
                
                geom_obj = shape(geometry)
                
                if geom_obj.is_valid:
                    return True, "Geometry is valid"
                else:
                    explanation = explain_validity(geom_obj)
                    return False, f"Invalid geometry: {explanation}"
                
            except ImportError:
                # If Shapely is not available, perform basic checks
                if isinstance(geometry, dict):
                    geom_type = geometry.get('type')
                    coordinates = geometry.get('coordinates')
                    
                    if not geom_type or not coordinates:
                        return False, "Geometry must have type and coordinates"
                    
                    if geom_type not in ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon']:
                        return False, f"Invalid geometry type: {geom_type}"
                    
                    return True, "Basic geometry structure is valid"
                else:
                    return False, "Geometry must be a GeoJSON object"
                
        except Exception as e:
            return False, f"Error validating geometry: {str(e)}"
    
    def _validate_document_reference(self, entity_data: Dict[str, Any], rule: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate document reference.
        
        Args:
            entity_data: Entity data to validate
            rule: Validation rule
            
        Returns:
            Tuple of (passed, message)
        """
        reference_type = entity_data.get('reference_type')
        reference_id = entity_data.get('reference_id')
        
        if not reference_type or not reference_id:
            return False, "Reference type and ID must both be provided"
        
        # Check reference type is valid
        valid_ref_types = ['property', 'assessment', 'parcel', 'user', 'appeal']
        if reference_type not in valid_ref_types:
            return False, f"Invalid reference type: {reference_type} (valid types: {', '.join(valid_ref_types)})"
        
        # In a real implementation, this would involve a database query
        # For now, we'll assume the reference is valid based on ID format
        
        # Check ID format based on reference type
        if reference_type == 'property' and not re.match(r'^P-\d{8}$', reference_id):
            return False, "Property ID must be in format P-########"
        
        elif reference_type == 'assessment' and not re.match(r'^A-\d{8}$', reference_id):
            return False, "Assessment ID must be in format A-########"
        
        elif reference_type == 'parcel' and not re.match(r'^[0-9]{3}-[0-9]{4}-[0-9]{3}$', reference_id):
            return False, "Parcel ID must be in format ###-####-###"
        
        return True, "Document reference is valid"
    
    def get_validation_metrics(self) -> Dict[str, Any]:
        """
        Get validation metrics and statistics.
        
        Returns:
            Dictionary of validation metrics
        """
        total_validations = len(self.validation_history)
        
        # Count validations by status
        status_counts = {}
        for status in ['completed', 'failed', 'in_progress', 'queued']:
            status_counts[status] = len([
                v for v in self.validation_history
                if v.get('status') == status
            ])
        
        # Count validations by entity type
        entity_counts = {}
        for v in self.validation_history:
            entity_type = v.get('entity_type', 'unknown')
            entity_counts[entity_type] = entity_counts.get(entity_type, 0) + 1
        
        # Calculate success rate
        success_count = len([
            v for v in self.validation_history
            if v.get('status') == 'completed' and v.get('is_valid') == True
        ])
        
        success_rate = 0
        if total_validations > 0:
            success_rate = success_count / total_validations
        
        # Get recent validations
        recent_validations = sorted(
            self.validation_history,
            key=lambda v: v.get('created_at', ''),
            reverse=True
        )[:10]
        
        return {
            'total_validations': total_validations,
            'status_counts': status_counts,
            'entity_counts': entity_counts,
            'success_rate': success_rate,
            'recent_validations': recent_validations,
            'active_validations': len(self.active_validations),
            'queued_validations': len(self.validation_queue)
        }
    
    def add_validation_rule(self, entity_type: str, rule: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a new validation rule.
        
        Args:
            entity_type: Entity type to add rule for
            rule: Rule definition
            
        Returns:
            Added rule
        """
        # Ensure entity type exists
        if entity_type not in self.validation_rules:
            # Create new entity type from template if available
            if entity_type in self.validation_templates:
                self.validation_rules[entity_type] = self.validation_templates[entity_type].copy()
            else:
                # Create empty entity type
                self.validation_rules[entity_type] = {
                    'name': f"{entity_type.capitalize()} Validation",
                    'entity_type': entity_type,
                    'rules': []
                }
        
        # Generate rule ID if not provided
        if 'id' not in rule:
            # Get existing rule IDs
            existing_ids = [r.get('id', '') for r in self.validation_rules[entity_type]['rules']]
            
            # Generate new ID
            entity_prefix = entity_type[:4].lower()
            for i in range(1, 1000):
                rule_id = f"{entity_prefix}_{i:03d}"
                if rule_id not in existing_ids:
                    rule['id'] = rule_id
                    break
        
        # Add rule
        self.validation_rules[entity_type]['rules'].append(rule)
        
        # Save validation rules
        self._save_validation_rules()
        
        return rule
    
    def update_validation_rule(self, entity_type: str, rule_id: str, 
                             rule_updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing validation rule.
        
        Args:
            entity_type: Entity type
            rule_id: Rule ID to update
            rule_updates: Updates to apply
            
        Returns:
            Updated rule
        """
        # Ensure entity type exists
        if entity_type not in self.validation_rules:
            raise ValueError(f"Entity type not found: {entity_type}")
        
        # Find rule
        for i, rule in enumerate(self.validation_rules[entity_type]['rules']):
            if rule.get('id') == rule_id:
                # Update rule
                updated_rule = rule.copy()
                updated_rule.update(rule_updates)
                
                # Replace rule
                self.validation_rules[entity_type]['rules'][i] = updated_rule
                
                # Save validation rules
                self._save_validation_rules()
                
                return updated_rule
        
        raise ValueError(f"Rule not found: {rule_id}")
    
    def delete_validation_rule(self, entity_type: str, rule_id: str) -> bool:
        """
        Delete a validation rule.
        
        Args:
            entity_type: Entity type
            rule_id: Rule ID to delete
            
        Returns:
            True if rule was deleted
        """
        # Ensure entity type exists
        if entity_type not in self.validation_rules:
            raise ValueError(f"Entity type not found: {entity_type}")
        
        # Find rule
        for i, rule in enumerate(self.validation_rules[entity_type]['rules']):
            if rule.get('id') == rule_id:
                # Delete rule
                del self.validation_rules[entity_type]['rules'][i]
                
                # Save validation rules
                self._save_validation_rules()
                
                return True
        
        raise ValueError(f"Rule not found: {rule_id}")
    
    def _save_validation_rules(self) -> None:
        """Save validation rules to configuration"""
        rules_path = os.environ.get('VALIDATION_RULES_PATH', 'config/validation_rules.json')
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(rules_path), exist_ok=True)
        
        try:
            with open(rules_path, 'w') as f:
                json.dump(self.validation_rules, f, indent=2)
            logger.info(f"Saved validation rules to {rules_path}")
        except Exception as e:
            logger.error(f"Error saving validation rules: {str(e)}")

# Create singleton instance
validation_manager = ValidationManager()