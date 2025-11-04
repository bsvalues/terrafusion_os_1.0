"""
Data Quality Models for MCP

This module provides SQLAlchemy models for data quality components
"""

import json
import datetime
from app import db
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Index, JSON, DateTime

# Use JSONB for PostgreSQL, fallback to JSON for other databases
try:
    JsonType = JSONB
except:
    JsonType = JSON

class QualityAlertModel(db.Model):
    """
    Database model for data quality alerts
    
    Maps to the existing data_quality_alert table structure
    """
    __tablename__ = 'data_quality_alert'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=True)
    alert_type = db.Column(db.String(64), nullable=False)  # This maps to our check_type
    table_name = db.Column(db.String(128), nullable=True)
    field_name = db.Column(db.String(128), nullable=True)
    severity_threshold = db.Column(db.String(32), nullable=True)  # This maps to our severity
    conditions = db.Column(JsonType, nullable=False)  # This maps to our parameters
    channels = db.Column(JsonType, nullable=False)  # This maps to our notification_channels
    recipients = db.Column(JsonType, nullable=False)  # Additional recipients information
    is_active = db.Column(db.Boolean, nullable=True, default=True)  # This maps to our enabled
    created_by = db.Column(db.Integer, nullable=True)
    created_at = db.Column(DateTime, nullable=True)  # This maps to our created_date
    updated_at = db.Column(DateTime, nullable=True)
    
    # SQLAlchemy will handle with the existing table - no need for indices
    __table_args__ = {'extend_existing': True}
    
    def to_dict(self):
        """
        Convert model to dictionary - maps database fields to Alert object fields
        """
        channels = self.channels
        if isinstance(channels, str):
            channels = json.loads(channels)
            
        conditions = self.conditions
        if isinstance(conditions, str):
            conditions = json.loads(conditions)
            
        # Map the database model to our Alert format
        return {
            "id": str(self.id),  # Convert to string for compatibility
            "name": self.name,
            "description": self.description,
            "check_type": self.alert_type,  # Map from alert_type to check_type
            "parameters": conditions,        # Map from conditions to parameters
            "threshold": 0.95,               # Default, not directly mapped
            "severity": self.severity_threshold or "medium",  # Map from severity_threshold
            "notification_channels": channels,  # Map from channels
            "enabled": self.is_active,          # Map from is_active
            "last_checked": None,              # Not directly mapped
            "last_status": None,               # Not directly mapped
            "last_value": None,                # Not directly mapped
            "last_error": None,                # Not directly mapped
            "triggered_count": 0,              # Not directly mapped
            "created_date": self.created_at.isoformat() if self.created_at else None
        }
        
    @classmethod
    def from_dict(cls, data):
        """
        Create model from dictionary - maps Alert object fields to database fields
        """
        nc = data.get('notification_channels', ['log'])
        if not isinstance(nc, str):
            nc = json.dumps(nc)
            
        params = data.get('parameters', {})
        if not isinstance(params, str):
            params = json.dumps(params)
            
        # Create a database model from our Alert format
        model = cls(
            # If id is a string, convert to int if possible, otherwise None
            id=int(data.get('id')) if data.get('id') and data.get('id').isdigit() else None,
            name=data.get('name', ''),
            description=data.get('description'),
            alert_type=data.get('check_type', ''),  # Map from check_type to alert_type
            conditions=params,                      # Map from parameters to conditions
            channels=nc,                           # Map from notification_channels to channels
            recipients=json.dumps([]),             # Default empty recipients
            is_active=data.get('enabled', True),   # Map from enabled to is_active
            severity_threshold=data.get('severity', 'medium'),  # Map from severity
            created_at=datetime.datetime.utcnow()  # Current timestamp
        )
        
        return model