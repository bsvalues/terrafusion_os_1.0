"""
Database models for API key authentication.
"""
import os
import uuid
import hashlib
from datetime import datetime, timedelta

from app import db

class APIKey(db.Model):
    """Model for API key authentication."""
    __tablename__ = 'api_keys'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    key_prefix = db.Column(db.String(8), nullable=False, unique=True)
    key_hash = db.Column(db.String(128), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    permissions = db.Column(db.JSON, nullable=True)  # Store permissions as a JSON object
    created_at = db.Column(db.DateTime, default=datetime.now)
    created_by = db.Column(db.String(100), nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    last_used_at = db.Column(db.DateTime, nullable=True)
    
    def __repr__(self):
        return f"<APIKey(id={self.id}, name='{self.name}', prefix='{self.key_prefix}')>"
    
    @staticmethod
    def generate_key():
        """
        Generate a new API key.
        
        Returns:
            tuple: (full_key, key_prefix, key_hash)
        """
        # Generate a random UUID as the key
        full_key = f"etl_{uuid.uuid4().hex}"
        
        # Take the first 8 characters as the prefix (used for lookup)
        key_prefix = full_key[:8]
        
        # Hash the full key for storage
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        
        return full_key, key_prefix, key_hash
    
    @staticmethod
    def create_key(name, created_by=None, permissions=None, expiry_days=None):
        """
        Create a new API key.
        
        Args:
            name (str): Name of the key
            created_by (str, optional): User who created the key
            permissions (dict, optional): Permissions for the key
            expiry_days (int, optional): Number of days until key expires
            
        Returns:
            tuple: (APIKey object, full_key)
        """
        full_key, key_prefix, key_hash = APIKey.generate_key()
        
        # Calculate expiry date if specified
        expires_at = None
        if expiry_days:
            expires_at = datetime.now() + timedelta(days=expiry_days)
        
        # Create new API key
        api_key = APIKey(
            name=name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            is_active=True,
            permissions=permissions,
            created_by=created_by,
            expires_at=expires_at
        )
        
        db.session.add(api_key)
        db.session.commit()
        
        # Return the API key object and the full key (which won't be stored in the database)
        return api_key, full_key
    
    @staticmethod
    def validate_key(api_key):
        """
        Validate an API key.
        
        Args:
            api_key (str): The API key to validate
            
        Returns:
            APIKey or None: The API key object if valid, None otherwise
        """
        if not api_key or len(api_key) < 8:
            return None
        
        # Extract prefix (first 8 characters)
        key_prefix = api_key[:8]
        
        # Find API key in database
        db_key = APIKey.query.filter_by(key_prefix=key_prefix).first()
        if not db_key:
            return None
        
        # Check if key is active
        if not db_key.is_active:
            return None
        
        # Check if key has expired
        if db_key.expires_at and db_key.expires_at < datetime.now():
            return None
        
        # Check if key hash matches
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        if key_hash != db_key.key_hash:
            return None
        
        # Update last used time
        db_key.last_used_at = datetime.now()
        db.session.commit()
        
        return db_key
    
    def has_permission(self, permission):
        """
        Check if the API key has a specific permission.
        
        Args:
            permission (str): The permission to check
            
        Returns:
            bool: True if the key has the permission, False otherwise
        """
        if not self.permissions:
            return False
        
        # Check for 'admin' permission which grants all permissions
        if self.permissions.get('admin', False):
            return True
        
        # Check for specific permission
        return self.permissions.get(permission, False)
    
    def has_any_permission(self, permissions):
        """
        Check if the API key has any of the specified permissions.
        
        Args:
            permissions (list): List of permissions to check
            
        Returns:
            bool: True if the key has any of the permissions, False otherwise
        """
        if not self.permissions or not permissions:
            return False
        
        # Check for 'admin' permission which grants all permissions
        if self.permissions.get('admin', False):
            return True
        
        # Check for any of the specified permissions
        return any(self.permissions.get(p, False) for p in permissions)