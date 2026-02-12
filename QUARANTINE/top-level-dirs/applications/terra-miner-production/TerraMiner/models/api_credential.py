"""
API credential management models.

This module defines the models for storing and managing API credentials
for various data sources used in the TerraMiner application.
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
import os
import logging
from utils.crypto_utils import encrypt_value, decrypt_value

# Add the root directory to the path to ensure imports work correctly
import sys
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import the central SQLAlchemy instance
from db_utils import get_db

db = get_db()
logger = logging.getLogger(__name__)

class ApiCredential(db.Model):
    """
    Model for storing API credentials for data sources.
    
    This model securely stores credentials like API keys, usernames, passwords,
    client IDs, etc. for the various data source connectors.
    """
    __tablename__ = 'api_credentials'
    
    id = Column(Integer, primary_key=True)
    source_name = Column(String(50), unique=True, index=True)
    
    # Authentication details (one or more may be used depending on the source)
    # Sensitive fields are stored encrypted-at-rest. Migration required for existing data.
    _api_key = Column("api_key", String(500))
    _username = Column("username", String(100))
    _password = Column("password", String(255))
    _client_id = Column("client_id", String(100))
    _client_secret = Column("client_secret", String(255))
    _additional_credentials = Column("additional_credentials", Text)  # JSON string of additional credentials

    @property
    def api_key(self):
        return decrypt_value(self._api_key)
    @api_key.setter
    def api_key(self, value):
        self._api_key = encrypt_value(value)

    @property
    def username(self):
        return decrypt_value(self._username)
    @username.setter
    def username(self, value):
        self._username = encrypt_value(value)

    @property
    def password(self):
        return decrypt_value(self._password)
    @password.setter
    def password(self, value):
        self._password = encrypt_value(value)

    @property
    def client_id(self):
        return decrypt_value(self._client_id)
    @client_id.setter
    def client_id(self, value):
        self._client_id = encrypt_value(value)

    @property
    def client_secret(self):
        return decrypt_value(self._client_secret)
    @client_secret.setter
    def client_secret(self, value):
        self._client_secret = encrypt_value(value)

    @property
    def additional_credentials(self):
        return decrypt_value(self._additional_credentials)
    @additional_credentials.setter
    def additional_credentials(self, value):
        self._additional_credentials = encrypt_value(value)
    
    # Configuration
    base_url = Column(String(255))  # Optional override for source's default URL
    
    # State tracking
    is_enabled = Column(Boolean, default=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<ApiCredential {self.id}: {self.source_name}>"
    
    def to_dict(self, include_secrets: bool = False) -> Dict[str, Any]:
        """
        Convert credential to dictionary for API responses.
        
        Args:
            include_secrets (bool): Whether to include secret values like API keys
                                   and passwords in the output
        
        Returns:
            dict: Dictionary representation of the credential
        """
        result = {
            "id": self.id,
            "source_name": self.source_name,
            "is_enabled": self.is_enabled,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
        
        # Include credential fields if requested
        if include_secrets:
            credential_fields = {
                "api_key": self.api_key,
                "username": self.username,
                "password": self.password,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "base_url": self.base_url,
                "additional_credentials": self.additional_credentials
            }
            
            # Only include non-None values
            for field, value in credential_fields.items():
                if value is not None:
                    result[field] = value
        else:
            # Just include which credential types are available
            credential_types = []
            if self.api_key:
                credential_types.append("api_key")
            if self.username:
                credential_types.append("username")
            if self.password:
                credential_types.append("password")
            if self.client_id:
                credential_types.append("client_id")
            if self.client_secret:
                credential_types.append("client_secret")
            if self.additional_credentials:
                credential_types.append("additional_credentials")
            
            result["credential_types"] = credential_types
            result["has_base_url"] = self.base_url is not None
        
        return result

    @classmethod
    def get_by_source(cls, source_name: str) -> Optional['ApiCredential']:
        """
        Get credentials for a specific data source.
        
        Args:
            source_name (str): The name of the data source
        
        Returns:
            ApiCredential: The credentials object or None if not found
        """
        try:
            return cls.query.filter_by(source_name=source_name).first()
        except Exception as e:
            logger.error(f"Error retrieving credentials for {source_name}: {str(e)}")
            return None
    
    @classmethod
    def get_all_sources(cls) -> List['ApiCredential']:
        """
        Get credentials for all data sources.
        
        Returns:
            list: List of all API credential objects
        """
        try:
            return cls.query.all()
        except Exception as e:
            logger.error(f"Error retrieving all credentials: {str(e)}")
            return []