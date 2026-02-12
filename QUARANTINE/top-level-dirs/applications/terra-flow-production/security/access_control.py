"""
Identity and Access Management Framework

This module implements granular access controls for the Benton County 
Washington Assessor's Office, including role-based access control (RBAC),
attribute-based access control (ABAC), and just-in-time access mechanisms.
"""

import os
import logging
import json
import datetime
import uuid
from typing import Dict, List, Any, Optional, Union, Set, Tuple

from data_governance.data_classification import SensitivityLevel, classification_manager

logger = logging.getLogger(__name__)

class AccessControlManager:
    """
    Manages access control for the system, including role-based access control,
    attribute-based access control, and just-in-time privileged access.
    """
    
    def __init__(self):
        """Initialize the access control manager"""
        # Standard roles with their default permissions
        self.standard_roles = {
            'public_user': {
                'description': 'Public access with minimal permissions',
                'permissions': ['public_data_read'],
                'sensitivity_access': [SensitivityLevel.PUBLIC]
            },
            'readonly_user': {
                'description': 'Read-only access to non-restricted data',
                'permissions': ['public_data_read', 'internal_data_read', 'confidential_data_read'],
                'sensitivity_access': [SensitivityLevel.PUBLIC, SensitivityLevel.INTERNAL, SensitivityLevel.CONFIDENTIAL]
            },
            'assessor': {
                'description': 'Standard assessor with data modification capabilities',
                'permissions': [
                    'public_data_read', 'public_data_write',
                    'internal_data_read', 'internal_data_write',
                    'confidential_data_read', 'confidential_data_write',
                    'run_reports', 'view_dashboard'
                ],
                'sensitivity_access': [SensitivityLevel.PUBLIC, SensitivityLevel.INTERNAL, SensitivityLevel.CONFIDENTIAL]
            },
            'supervisor': {
                'description': 'Supervisor with approval capabilities',
                'permissions': [
                    'public_data_read', 'public_data_write',
                    'internal_data_read', 'internal_data_write',
                    'confidential_data_read', 'confidential_data_write',
                    'run_reports', 'view_dashboard',
                    'approve_changes', 'approve_access'
                ],
                'sensitivity_access': [SensitivityLevel.PUBLIC, SensitivityLevel.INTERNAL, SensitivityLevel.CONFIDENTIAL]
            },
            'administrator': {
                'description': 'System administrator with extended privileges',
                'permissions': [
                    'public_data_read', 'public_data_write',
                    'internal_data_read', 'internal_data_write',
                    'confidential_data_read', 'confidential_data_write',
                    'restricted_data_read', 'restricted_data_write',
                    'run_reports', 'view_dashboard',
                    'approve_changes', 'approve_access',
                    'manage_users', 'manage_roles',
                    'system_config', 'audit_access'
                ],
                'sensitivity_access': [
                    SensitivityLevel.PUBLIC, SensitivityLevel.INTERNAL, 
                    SensitivityLevel.CONFIDENTIAL, SensitivityLevel.RESTRICTED
                ]
            },
            'data_quality_officer': {
                'description': 'Responsible for data quality monitoring and remediation',
                'permissions': [
                    'public_data_read', 'internal_data_read', 'confidential_data_read',
                    'run_reports', 'view_dashboard', 'manage_data_quality',
                    'data_quality_override'
                ],
                'sensitivity_access': [SensitivityLevel.PUBLIC, SensitivityLevel.INTERNAL, SensitivityLevel.CONFIDENTIAL]
            },
            'auditor': {
                'description': 'System auditor with read-only access to all data',
                'permissions': [
                    'public_data_read', 'internal_data_read', 
                    'confidential_data_read', 'restricted_data_read',
                    'run_reports', 'view_dashboard', 'audit_access'
                ],
                'sensitivity_access': [
                    SensitivityLevel.PUBLIC, SensitivityLevel.INTERNAL, 
                    SensitivityLevel.CONFIDENTIAL, SensitivityLevel.RESTRICTED
                ]
            }
        }
        
        # Attribute-based access control rules
        self.abac_rules = [
            {
                'name': 'work_hours_only',
                'description': 'Restrict access to business hours (8am-6pm)',
                'condition': lambda attrs: 8 <= attrs.get('current_hour', 0) <= 18,
                'permissions_affected': ['confidential_data_write', 'restricted_data_read', 'restricted_data_write']
            },
            {
                'name': 'location_restricted',
                'description': 'Restrict sensitive operations to approved locations',
                'condition': lambda attrs: attrs.get('ip_address') in self.get_approved_locations(),
                'permissions_affected': ['restricted_data_read', 'restricted_data_write', 'approve_changes']
            },
            {
                'name': 'mfa_required',
                'description': 'Require MFA for sensitive operations',
                'condition': lambda attrs: attrs.get('mfa_verified', False) is True,
                'permissions_affected': [
                    'confidential_data_write', 'restricted_data_read', 
                    'restricted_data_write', 'approve_changes', 'approve_access'
                ]
            },
            {
                'name': 'training_required',
                'description': 'Require up-to-date training for data modification',
                'condition': lambda attrs: self.is_training_current(attrs.get('user_id')),
                'permissions_affected': [
                    'internal_data_write', 'confidential_data_write', 
                    'restricted_data_write'
                ]
            }
        ]
        
        # Just-in-time access request tracking
        self.jit_access_requests = {}
        
        # Privileged session tracking
        self.privileged_sessions = {}
        
        # Initialization state
        self._initialized = True
        
        logger.info("Access Control Manager initialized")
    
    def is_initialized(self) -> bool:
        """
        Check if the access control manager is properly initialized.
        
        Returns:
            True if initialized, False otherwise
        """
        return True
        
    def has_permission(self, user_id: int, permission: str, 
                       context_attributes: Dict[str, Any] = None) -> bool:
        """
        Check if a user has a specific permission, considering both role-based
        and attribute-based access controls.
        
        Args:
            user_id: User ID to check permissions for
            permission: Permission name to check
            context_attributes: Additional context attributes for ABAC evaluation
            
        Returns:
            True if the user has the permission, False otherwise
        """
        # Get user roles and base permissions (would come from database in real implementation)
        user_roles = self.get_user_roles(user_id)
        user_permissions = self.get_role_permissions(user_roles)
        
        # Check if user has the permission based on roles
        has_base_permission = permission in user_permissions
        
        # If no base permission, no need to check ABAC rules
        if not has_base_permission:
            return False
        
        # If no context attributes provided, use default empty dict
        ctx_attrs = {} if context_attributes is None else context_attributes
        
        # Add current time if not provided
        if 'current_hour' not in ctx_attrs:
            current_hour = datetime.datetime.now().hour
            ctx_attrs['current_hour'] = current_hour
        
        # Add user ID to context attributes
        ctx_attrs['user_id'] = user_id
        
        # Check if any ABAC rule restricts this permission
        for rule in self.abac_rules:
            if permission in rule['permissions_affected']:
                if not rule['condition'](ctx_attrs):
                    logger.info(f"Permission {permission} denied by ABAC rule {rule['name']} for user {user_id}")
                    return False
        
        # Check if user has an active privileged session that grants this permission
        if permission in self.get_privileged_permissions(user_id):
            logger.info(f"Permission {permission} granted via privileged session for user {user_id}")
            return True
        
        return True
    
    def get_user_roles(self, user_id: int) -> List[str]:
        """
        Get roles for a specific user.
        
        Args:
            user_id: User ID
            
        Returns:
            List of role names
        """
        # In a real implementation, this would query the database
        # For now, we'll return mock data for demonstration
        if user_id == 1:  # Admin user
            return ['administrator']
        elif user_id == 2:  # Supervisor
            return ['supervisor']
        elif user_id == 3:  # Regular assessor
            return ['assessor']
        elif user_id == 4:  # Read-only user
            return ['readonly_user']
        elif user_id == 5:  # Data quality officer
            return ['data_quality_officer']
        else:
            return ['public_user']
    
    def get_role_permissions(self, roles: List[str]) -> Set[str]:
        """
        Get all permissions for a list of roles.
        
        Args:
            roles: List of role names
            
        Returns:
            Set of permission names
        """
        permissions = set()
        
        for role in roles:
            if role in self.standard_roles:
                role_permissions = self.standard_roles[role].get('permissions', [])
                permissions.update(role_permissions)
        
        return permissions
    
    def get_role_sensitivity_access(self, roles: List[str]) -> Set[SensitivityLevel]:
        """
        Get all sensitivity levels a user can access based on their roles.
        
        Args:
            roles: List of role names
            
        Returns:
            Set of SensitivityLevel values
        """
        sensitivity_levels = set()
        
        for role in roles:
            if role in self.standard_roles:
                role_levels = self.standard_roles[role].get('sensitivity_access', [])
                sensitivity_levels.update(role_levels)
        
        return sensitivity_levels
    
    def request_elevated_access(self, user_id: int, requested_permissions: List[str], 
                               reason: str, duration_minutes: int = 60) -> str:
        """
        Request just-in-time elevated access for specific permissions.
        
        Args:
            user_id: User ID requesting access
            requested_permissions: List of permissions requested
            reason: Reason for the elevated access
            duration_minutes: Duration in minutes for the elevated access
            
        Returns:
            Request ID for tracking
        """
        request_id = str(uuid.uuid4())
        user_roles = self.get_user_roles(user_id)
        
        # Create request record
        self.jit_access_requests[request_id] = {
            'user_id': user_id,
            'user_roles': user_roles,
            'requested_permissions': requested_permissions,
            'reason': reason,
            'requested_at': datetime.datetime.now(),
            'duration_minutes': duration_minutes,
            'status': 'pending',
            'approver_id': None,
            'approved_at': None
        }
        
        logger.info(f"Elevated access request {request_id} created for user {user_id}")
        return request_id
    
    def approve_elevated_access(self, request_id: str, approver_id: int) -> bool:
        """
        Approve a just-in-time elevated access request.
        
        Args:
            request_id: Request ID to approve
            approver_id: User ID of the approver
            
        Returns:
            True if approval was successful, False otherwise
        """
        if request_id not in self.jit_access_requests:
            logger.warning(f"Elevated access request {request_id} not found")
            return False
        
        request = self.jit_access_requests[request_id]
        
        # Check if approver has approve_access permission
        if not self.has_permission(approver_id, 'approve_access'):
            logger.warning(f"User {approver_id} does not have permission to approve access")
            return False
        
        # Check if request is still pending
        if request['status'] != 'pending':
            logger.warning(f"Elevated access request {request_id} is not pending (status: {request['status']})")
            return False
        
        # Approve the request
        now = datetime.datetime.now()
        request['status'] = 'approved'
        request['approver_id'] = approver_id
        request['approved_at'] = now
        
        # Set up privileged session
        session_id = str(uuid.uuid4())
        expiration = now + datetime.timedelta(minutes=request['duration_minutes'])
        
        self.privileged_sessions[session_id] = {
            'user_id': request['user_id'],
            'granted_permissions': request['requested_permissions'],
            'reason': request['reason'],
            'approved_by': approver_id,
            'created_at': now,
            'expires_at': expiration,
            'revoked': False
        }
        
        logger.info(f"Elevated access request {request_id} approved by user {approver_id}")
        return True
    
    def get_privileged_permissions(self, user_id: int) -> Set[str]:
        """
        Get any additional permissions granted by active privileged sessions.
        
        Args:
            user_id: User ID to check
            
        Returns:
            Set of permission names
        """
        now = datetime.datetime.now()
        permissions = set()
        
        for session_id, session in self.privileged_sessions.items():
            if (session['user_id'] == user_id and 
                session['expires_at'] > now and 
                not session['revoked']):
                permissions.update(session['granted_permissions'])
        
        return permissions
    
    def revoke_privileged_session(self, session_id: str, revoker_id: int) -> bool:
        """
        Revoke an active privileged session.
        
        Args:
            session_id: Session ID to revoke
            revoker_id: User ID performing the revocation
            
        Returns:
            True if revocation was successful, False otherwise
        """
        if session_id not in self.privileged_sessions:
            logger.warning(f"Privileged session {session_id} not found")
            return False
        
        # Check if revoker has approve_access permission
        if not self.has_permission(revoker_id, 'approve_access'):
            logger.warning(f"User {revoker_id} does not have permission to revoke access")
            return False
        
        # Revoke the session
        self.privileged_sessions[session_id]['revoked'] = True
        
        logger.info(f"Privileged session {session_id} revoked by user {revoker_id}")
        return True
    
    def is_training_current(self, user_id: int) -> bool:
        """
        Check if a user's training is current.
        
        Args:
            user_id: User ID to check
            
        Returns:
            True if training is current, False otherwise
        """
        # In a real implementation, this would check a training database
        # For now, we'll assume most users have current training
        return user_id != 6  # User 6 has expired training
    
    def get_approved_locations(self) -> List[str]:
        """
        Get list of approved network locations.
        
        Returns:
            List of approved IP addresses or subnets
        """
        # In a real implementation, this would come from a database
        return [
            '127.0.0.1',
            '192.168.1.0/24',
            '10.0.0.0/8',
            '172.16.0.0/12'
        ]
    
    def apply_data_access_filters(self, user_id: int, table_name: str, 
                                 query_filters: List[Any]) -> List[Any]:
        """
        Apply data access filters based on user permissions.
        
        Args:
            user_id: User ID accessing the data
            table_name: Database table being queried
            query_filters: Existing query filters
            
        Returns:
            Enhanced list of query filters with access controls applied
        """
        # Get user's allowed sensitivity levels
        user_roles = self.get_user_roles(user_id)
        sensitivity_access = self.get_role_sensitivity_access(user_roles)
        
        # Determine fields to filter by sensitivity level
        fields_by_level = {}
        for field_name in self._get_table_fields(table_name):
            field_level = classification_manager.get_field_classification(table_name, field_name)
            if field_level not in fields_by_level:
                fields_by_level[field_level] = []
            fields_by_level[field_level].append(field_name)
        
        # Apply filters for sensitivity levels the user doesn't have access to
        new_filters = list(query_filters)  # Copy existing filters
        
        # TODO: In a real implementation, these would be SQLAlchemy filter conditions
        # For now, we just return the enhanced filters list
        
        return new_filters
    
    def _get_table_fields(self, table_name: str) -> List[str]:
        """
        Get all fields for a database table.
        
        Args:
            table_name: Database table name
            
        Returns:
            List of field names
        """
        # In a real implementation, this would introspect the database schema
        # For now, we'll return a mock list for demonstration
        if table_name == 'properties':
            return [
                'id', 'parcel_id', 'address', 'city', 'state', 'zip_code',
                'property_type', 'lot_size', 'year_built', 'total_area',
                'owner_name', 'owner_address', 'purchase_date', 'purchase_price',
                'features', 'location', 'property_metadata',
                'created_at', 'updated_at'
            ]
        elif table_name == 'tax_records':
            return [
                'id', 'property_id', 'tax_year', 'land_value',
                'improvement_value', 'total_value', 'tax_amount',
                'tax_rate', 'status', 'exemptions',
                'created_at', 'updated_at'
            ]
        else:
            return []

# Create a singleton instance
access_control_manager = AccessControlManager()