"""
Data Sovereignty Compliance Framework

This module implements a comprehensive data sovereignty and compliance framework
that defines geographic restrictions for data storage, compliance requirements
for Washington state laws, and regular audit procedures.
"""

import os
import json
import logging
import datetime
from typing import Dict, List, Any, Optional, Tuple, Set

logger = logging.getLogger(__name__)

class DataSovereigntyManager:
    """
    Manager for data sovereignty and compliance requirements.
    This ensures all data storage and processing meets legal requirements.
    """
    
    def __init__(self):
        """Initialize the data sovereignty manager"""
        # Geographic restrictions for data storage
        self.allowed_regions = {
            'primary': ['us-west', 'us-west-2', 'us-west1'],  # Primary regions
            'backup': ['us-east', 'us-east-1', 'us-central1'],  # Backup regions
            'restricted': ['us-west', 'us-west-2']  # Regions for most sensitive data
        }
        
        # Compliance requirements by regulation
        self.compliance_requirements = {
            'washington_public_records_act': {
                'description': 'Washington Public Records Act (RCW 42.56)',
                'retention_periods': {
                    'property_records': '8 years',
                    'tax_records': '7 years',
                    'assessment_records': '10 years'
                },
                'disclosure_exemptions': [
                    'personal_information',
                    'law_enforcement_data',
                    'preliminary_drafts'
                ],
                'access_requirements': {
                    'response_time': '5 business days',
                    'denial_process': 'written explanation required'
                }
            },
            'data_breach_notification': {
                'description': 'Washington Data Breach Notification Law (RCW 19.255)',
                'notification_threshold': 500,
                'notification_timeline': '30 days',
                'required_information': [
                    'breach_details',
                    'data_affected',
                    'remediation_steps',
                    'contact_information'
                ]
            },
            'personal_data_protection': {
                'description': 'Washington Personal Data Protection Laws',
                'data_minimization': True,
                'purpose_limitation': True,
                'consent_requirements': {
                    'explicit_consent': 'sensitive_data',
                    'opt_out': 'marketing_use'
                }
            }
        }
        
        # Audit requirements
        self.audit_requirements = {
            'frequency': {
                'internal': '6 months',
                'external': '1 year'
            },
            'scope': [
                'data_classification',
                'access_controls',
                'security_measures',
                'breach_response',
                'data_minimization',
                'retention_compliance'
            ],
            'documentation': [
                'audit_plan',
                'findings_report',
                'remediation_plan',
                'implementation_evidence'
            ]
        }
        
        # Data residency verification tracker
        self.last_verification = datetime.datetime.now() - datetime.timedelta(days=400)
        self.verification_status = {}
        
        logger.info("Data Sovereignty Manager initialized")
    
    def verify_storage_compliance(self, storage_region: str, data_sensitivity: str) -> Tuple[bool, str]:
        """
        Verify that a storage region complies with geographic restrictions
        based on data sensitivity.
        
        Args:
            storage_region: Cloud region or data center location
            data_sensitivity: Level of data sensitivity (standard, sensitive, restricted)
            
        Returns:
            Tuple of (is_compliant, reason)
        """
        allowed_regions = []
        
        if data_sensitivity == 'restricted':
            allowed_regions = self.allowed_regions['restricted']
        elif data_sensitivity == 'sensitive':
            allowed_regions = self.allowed_regions['primary']
        else:  # standard
            allowed_regions = self.allowed_regions['primary'] + self.allowed_regions['backup']
        
        is_compliant = any(region in storage_region for region in allowed_regions)
        
        reason = "Storage region complies with data sovereignty requirements" if is_compliant else \
                f"Storage region {storage_region} does not comply with requirements for {data_sensitivity} data"
                
        # Update verification status
        self.verification_status[storage_region] = {
            'verified_at': datetime.datetime.now(),
            'data_sensitivity': data_sensitivity,
            'is_compliant': is_compliant,
            'reason': reason
        }
        
        return is_compliant, reason
    
    def get_retention_period(self, data_type: str) -> str:
        """
        Get the required retention period for a specific type of data.
        
        Args:
            data_type: Type of data (e.g., property_records, tax_records)
            
        Returns:
            Retention period as a string (e.g., "7 years")
        """
        # Default retention period if not specified
        default_retention = '7 years'
        
        # Check Washington Public Records Act requirements
        wpr_requirements = self.compliance_requirements.get('washington_public_records_act', {})
        retention_periods = wpr_requirements.get('retention_periods', {})
        
        return retention_periods.get(data_type, default_retention)
    
    def get_jurisdiction(self) -> str:
        """
        Get the primary jurisdiction for data governance.
        
        Returns:
            Primary jurisdiction name (e.g., "washington")
        """
        return "washington"
        
    def get_compliance_requirements(self, regulation: str) -> Dict[str, Any]:
        """
        Get compliance requirements for a specific regulation.
        
        Args:
            regulation: Regulation name
            
        Returns:
            Dictionary of compliance requirements
        """
        return self.compliance_requirements.get(regulation, {})
    
    def is_disclosure_exempt(self, data_type: str) -> bool:
        """
        Check if a type of data is exempt from public disclosure requirements.
        
        Args:
            data_type: Type of data to check
            
        Returns:
            True if exempt, False otherwise
        """
        wpr_requirements = self.compliance_requirements.get('washington_public_records_act', {})
        exemptions = wpr_requirements.get('disclosure_exemptions', [])
        
        return data_type in exemptions
    
    def get_next_audit_date(self, audit_type: str = 'internal') -> datetime.datetime:
        """
        Determine when the next audit should be conducted.
        
        Args:
            audit_type: Type of audit ('internal' or 'external')
            
        Returns:
            Datetime when next audit should occur
        """
        frequency = self.audit_requirements['frequency'].get(audit_type, '1 year')
        months = 12  # Default to a year
        
        if frequency == '6 months':
            months = 6
        elif frequency == '3 months':
            months = 3
        
        # Add the specified number of months to the last verification date
        next_date = self.last_verification + datetime.timedelta(days=30*months)
        return next_date
    
    def is_audit_due(self, audit_type: str = 'internal') -> bool:
        """
        Check if an audit is due based on the last verification date.
        
        Args:
            audit_type: Type of audit ('internal' or 'external')
            
        Returns:
            True if audit is due, False otherwise
        """
        next_audit_date = self.get_next_audit_date(audit_type)
        return datetime.datetime.now() >= next_audit_date
    
    def get_audit_scope(self, audit_type: str = 'internal') -> List[str]:
        """
        Get the scope of items to be covered in an audit.
        
        Args:
            audit_type: Type of audit ('internal' or 'external')
            
        Returns:
            List of audit scope items
        """
        return self.audit_requirements['scope']
    
    def record_audit_completion(self, audit_type: str, findings: List[Dict[str, Any]]) -> None:
        """
        Record the completion of an audit and update the last verification date.
        
        Args:
            audit_type: Type of audit ('internal' or 'external')
            findings: List of audit findings
        """
        self.last_verification = datetime.datetime.now()
        
        # Record verification in status
        self.verification_status[f'audit_{audit_type}'] = {
            'verified_at': self.last_verification,
            'findings_count': len(findings),
            'findings': findings
        }
        
        logger.info(f"{audit_type.capitalize()} audit completed with {len(findings)} findings")

# Create a singleton instance
sovereignty_manager = DataSovereigntyManager()