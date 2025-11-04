"""
Sync service table models

This module contains the database models for the sync service tables.
"""
import datetime
import uuid
from typing import Dict, Any, List, Optional

from app import db
from sqlalchemy import Index, ForeignKey, UniqueConstraint, event
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.dialects.postgresql import JSON

class SyncBase(object):
    """Base class for sync service models with common fields."""

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    @declared_attr
    def __tablename__(cls):
        # Convert CamelCase to snake_case for table names
        name = cls.__name__
        import re
        return re.sub('(?<!^)(?=[A-Z])', '_', name).lower()

class SyncJob(SyncBase, db.Model):
    """Represents a sync job execution."""

    job_id = db.Column(db.String(36), unique=True, nullable=False)  # UUID
    name = db.Column(db.String(128), nullable=False)
    status = db.Column(db.String(32), nullable=False, default='pending')  # pending, running, completed, failed
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    total_records = db.Column(db.Integer, default=0)
    processed_records = db.Column(db.Integer, default=0)
    error_records = db.Column(db.Integer, default=0)
    error_details = db.Column(JSON)
    job_type = db.Column(db.String(64))  # full, incremental, schema, etc.
    source_db = db.Column(db.String(256))
    target_db = db.Column(db.String(256))
    initiated_by = db.Column(db.Integer, db.ForeignKey('users.id'))

    def __repr__(self):
        return f"<SyncJob {self.job_id} ({self.status})>"

class TableConfiguration(SyncBase, db.Model):
    """Configuration for tables to be synchronized."""

    name = db.Column(db.String(128), unique=True, nullable=False)
    
    # Using property decorators for columns that might not exist in the database
    # to ensure backward compatibility
    @property
    def source_name(self):
        """Get the source name or default to the table name if not set."""
        return self.name
        
    @property
    def display_name(self):
        """Get the display name or default to the table name if not set."""
        return self.name
        
    @property
    def description(self):
        """Get the description for the table configuration."""
        return ""
    join_table = db.Column(db.String(128))
    join_sql = db.Column(db.Text)
    order = db.Column(db.Integer, nullable=False, default=0)
    total_pages = db.Column(db.BigInteger, default=0)
    current_page = db.Column(db.BigInteger, default=0)
    total_pages_for_change_schema = db.Column(db.BigInteger, default=0)
    current_page_for_change_schema = db.Column(db.BigInteger, default=0)
    total_pages_for_assign_group_refresh = db.Column(db.BigInteger, default=0)
    current_page_for_assign_group_refresh = db.Column(db.BigInteger, default=0)
    is_flat = db.Column(db.Boolean, default=True)
    is_lookup = db.Column(db.Boolean, default=False)
    is_controller = db.Column(db.Boolean, default=False)
    sub_select = db.Column(db.Text)
    order_by_sql = db.Column(db.Text)
    
    # Using properties for backward compatibility where columns might not exist yet
    @property
    def is_active(self):
        """Get whether this table configuration is active."""
        return True
        
    @property
    def is_incremental(self):
        """Get whether this table uses incremental sync."""
        return True
        
    @property
    def batch_size(self):
        """Get the batch size for this table's sync operations."""
        return 1000
        
    @property
    def primary_key(self):
        """Get the primary key field for this table."""
        return None
        
    @property
    def timestamp_field(self):
        """Get the timestamp field for this table."""
        return None
        
    @property
    def last_sync_time(self):
        """Get the last sync time for this table."""
        return None
        
    @property
    def source_query(self):
        """Get the source query for this table."""
        return None
        
    @property
    def target_query(self):
        """Get the target query for this table."""
        return None
    
    # Bidirectional sync settings - using properties for backward compatibility
    @property
    def sync_direction(self):
        """Get the sync direction for this table."""
        return 'both'
    
    # Conflict resolution settings - using properties for backward compatibility
    @property
    def conflict_strategy(self):
        """Get the conflict resolution strategy for this table."""
        return 'timestamp'
        
    @property
    def conflict_detection(self):
        """Get the conflict detection method for this table."""
        return 'field'
        
    @property
    def manual_review_required(self):
        """Get whether conflicts for this table require manual review."""
        return False
        
    @property
    def conflict_notes(self):
        """Get notes about conflict resolution for this table."""
        return None
    
    # Relationships
    field_configurations = db.relationship('FieldConfiguration', backref='table', lazy='dynamic')
    field_default_values = db.relationship('FieldDefaultValue', backref='table', lazy='dynamic')
    primary_key_columns = db.relationship('PrimaryKeyColumn', backref='table', lazy='dynamic')
    parcel_maps = db.relationship('ParcelMap', backref='table', lazy='dynamic')

    def __repr__(self):
        return f"<TableConfiguration {self.name}>"

class FieldConfiguration(db.Model):
    """Configuration for fields in synchronized tables."""

    id = db.Column(db.Integer, primary_key=True)
    table_name = db.Column(db.String(128), db.ForeignKey('table_configuration.name', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    field_name = db.Column(db.String(128))  # To maintain compatibility with the UI and existing code
    policy_type = db.Column(db.Integer, nullable=False)
    label = db.Column(db.String(256))
    cama_cloud_id = db.Column(db.String(256))
    type = db.Column(db.String(64), nullable=False)
    data_type = db.Column(db.String(50))  # Added for sanitization and conflict detection
    length = db.Column(db.Integer)
    precision = db.Column(db.Integer)
    scale = db.Column(db.Integer)
    
    # Properties for primary keys and timestamps
    is_primary_key = db.Column(db.Boolean, default=False)
    is_timestamp = db.Column(db.Boolean, default=False)
    is_inherited = db.Column(db.Boolean, default=False)
    is_nullable = db.Column(db.Boolean, default=True)
    
    # Direction and synchronization settings
    sync_direction = db.Column(db.String(50), default='both')  # both, to_target, to_source, none
    
    # Conflict resolution settings
    conflict_resolution = db.Column(db.String(50), default='newer_wins')  # newer_wins, source_wins, target_wins, manual
    conflict_notes = db.Column(db.Text)
    
    # Transform and default value settings
    transform_sql = db.Column(db.Text)
    default_value = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<FieldConfiguration {self.table_name}.{self.name}>"

class FieldDefaultValue(db.Model):
    """Default values for fields in synchronized tables."""

    id = db.Column(db.Integer, primary_key=True)
    table_name = db.Column(db.String(128), db.ForeignKey('table_configuration.name', ondelete='CASCADE'), nullable=False)
    column_name = db.Column(db.String(128), nullable=False)
    default_value = db.Column(db.String(1024), nullable=False)
    
    def __repr__(self):
        return f"<FieldDefaultValue {self.table_name}.{self.column_name}: {self.default_value}>"

class PrimaryKeyColumn(db.Model):
    """Primary key columns for synchronized tables."""

    id = db.Column(db.Integer, primary_key=True)
    table_name = db.Column(db.String(128), db.ForeignKey('table_configuration.name', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    order = db.Column(db.Integer, nullable=False)
    
    def __repr__(self):
        return f"<PrimaryKeyColumn {self.table_name}.{self.name} (order: {self.order})>"

class DataChangeMap(SyncBase, db.Model):
    """Maps for tracking data changes."""

    table_name = db.Column(db.String(128), nullable=False)
    composite_key = db.Column(db.String(512), nullable=False)
    unique_cc_row_id = db.Column(db.String(256))
    
    __table_args__ = (
        Index('idx_data_change_map_table_key', 'table_name', 'composite_key'),
    )
    
    def __repr__(self):
        return f"<DataChangeMap {self.table_name} ({self.composite_key})>"

class ParcelMap(db.Model):
    """Maps tables/rows to parcel IDs."""

    id = db.Column(db.Integer, primary_key=True)
    table_name = db.Column(db.String(128), db.ForeignKey('table_configuration.name', ondelete='CASCADE'), nullable=False)
    composite_key = db.Column(db.String(512), nullable=False)
    parcel_id = db.Column(db.String(128))
    
    __table_args__ = (
        Index('idx_parcel_map_table_key', 'table_name', 'composite_key'),
    )
    
    def __repr__(self):
        return f"<ParcelMap {self.table_name} ({self.composite_key}) -> {self.parcel_id}>"

class PhotoMap(SyncBase, db.Model):
    """Maps for tracking photo data."""

    pacs_image_id = db.Column(db.String(256), nullable=False)
    cc_image_id = db.Column(db.String(256))
    
    __table_args__ = (
        Index('idx_photo_map_pacs_id', 'pacs_image_id'),
    )
    
    def __repr__(self):
        return f"<PhotoMap {self.pacs_image_id} -> {self.cc_image_id}>"

class LookupTableConfiguration(SyncBase, db.Model):
    """Configuration for lookup tables."""

    name = db.Column(db.String(128), primary_key=True)
    code_column_name = db.Column(db.String(128))
    desc_column_name = db.Column(db.String(128))
    where_condition = db.Column(db.Text)
    join_condition = db.Column(db.Text)
    order_by_sql = db.Column(db.Text)
    is_transferred = db.Column(db.Boolean, default=False)
    has_none = db.Column(db.Boolean, default=False)
    null_code = db.Column(db.String(128))
    null_description = db.Column(db.String(128))
    
    def __repr__(self):
        return f"<LookupTableConfiguration {self.name}>"

class UpSyncDataChange(SyncBase, db.Model):
    """Tracks data changes for upsync operations."""

    table_name = db.Column(db.String(128), nullable=False)
    field_name = db.Column(db.String(128), nullable=False)
    keys = db.Column(db.String(1024), nullable=False)
    new_value = db.Column(db.Text)
    old_value = db.Column(db.Text)
    action = db.Column(db.String(32), nullable=False)  # insert, update, delete
    date = db.Column(db.DateTime)
    record_inserted_date = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    is_processed_date = db.Column(db.DateTime)
    pacs_user = db.Column(db.String(128))
    cc_field_id = db.Column(db.String(128))
    parcel_id = db.Column(db.String(128))
    unique_cc_row_id = db.Column(db.String(256))
    unique_cc_parent_row_id = db.Column(db.String(256))
    is_processed = db.Column(db.Boolean, default=False)
    
    __table_args__ = (
        Index('idx_upsync_data_change_processed', 'is_processed'),
        Index('idx_upsync_data_change_table_keys', 'table_name', 'keys'),
    )
    
    def __repr__(self):
        return f"<UpSyncDataChange {self.table_name}.{self.field_name} {self.action}>"

class UpSyncDataChangeArchive(SyncBase, db.Model):
    """Archive of processed upsync data changes."""

    table_name = db.Column(db.String(128), nullable=False)
    field_name = db.Column(db.String(128), nullable=False)
    keys = db.Column(db.String(1024), nullable=False)
    new_value = db.Column(db.Text)
    old_value = db.Column(db.Text)
    action = db.Column(db.String(32), nullable=False)  # insert, update, delete
    date = db.Column(db.DateTime)
    record_inserted_date = db.Column(db.DateTime, nullable=False)
    is_processed_date = db.Column(db.DateTime)
    pacs_user = db.Column(db.String(128))
    cc_field_id = db.Column(db.String(128))
    parcel_id = db.Column(db.String(128))
    unique_cc_row_id = db.Column(db.String(256))
    unique_cc_parent_row_id = db.Column(db.String(256))
    is_processed = db.Column(db.Boolean, default=True)
    
    __table_args__ = (
        Index('idx_upsync_archive_processed_date', 'is_processed_date'),
    )
    
    def __repr__(self):
        return f"<UpSyncDataChangeArchive {self.table_name}.{self.field_name} {self.action}>"

class ParcelChangeIndexLog(SyncBase, db.Model):
    """Logs of changes to parcel data."""

    down_sync_id = db.Column(db.String(36), nullable=False)  # UUID
    table_name = db.Column(db.String(128), nullable=False)
    action = db.Column(db.String(32), nullable=False)  # insert, update, delete
    parcel_id = db.Column(db.Integer, nullable=False)
    aux_row_id = db.Column(db.String(256))
    parent_row_id = db.Column(db.String(256))
    keys = db.Column(db.String(1024))
    new_value = db.Column(db.Text)
    field_id = db.Column(db.Integer, nullable=False)
    reviewed_by = db.Column(db.String(128))
    review_time = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    qc_by = db.Column(db.String(128))
    qc_time = db.Column(db.String(128))  # This seems to be a string in the original schema
    pci_status = db.Column(db.String(128))
    pci_description = db.Column(db.String(512))
    
    __table_args__ = (
        Index('idx_parcel_change_index_log_parcel', 'parcel_id'),
        Index('idx_parcel_change_index_log_down_sync', 'down_sync_id'),
    )
    
    def __repr__(self):
        return f"<ParcelChangeIndexLog {self.parcel_id}.{self.field_id} {self.action}>"

class GlobalSetting(SyncBase, db.Model):
    """Global settings for the sync process."""
    __tablename__ = 'global_setting'  # Explicitly set the table name to match existing table

    cama_cloud_state = db.Column(db.String(128), nullable=False)
    last_sync_job_id = db.Column(db.String(36))
    last_assignment_group_sync_job_id = db.Column(db.String(36))
    last_change_schema_job_id = db.Column(db.String(36))
    last_photo_download_job_id = db.Column(db.String(36))
    is_photo_meta_data_schema_sent = db.Column(db.Boolean, default=False)
    last_sync_time = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    last_down_sync_time = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    image_upload_completed_time = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    current_table = db.Column(db.BigInteger, default=0)
    total_tables = db.Column(db.BigInteger, default=0)
    total_photo_pages = db.Column(db.BigInteger, default=0)
    current_photo_page = db.Column(db.BigInteger, default=0)
    user_queue_run_id = db.Column(db.Integer)
    image_queue_run_id = db.Column(db.Integer)
    up_sync_queue_run_id = db.Column(db.Integer)
    assignment_group_queue_run_id = db.Column(db.Integer)
    total_number_of_lookup_tables = db.Column(db.BigInteger, default=0)
    current_lookup_tables_uploaded = db.Column(db.BigInteger, default=0)
    is_property_table_complete = db.Column(db.Boolean, default=False)
    has_photos = db.Column(db.Boolean, default=False)
    is_finalized = db.Column(db.Boolean, default=False)
    last_change_id = db.Column(db.BigInteger, default=0)
    relink_assignment_group = db.Column(db.Boolean, default=False)
    last_clean_data_job_id = db.Column(db.String(36))
    clean_data_run_id = db.Column(db.Integer)
    
    # These properties will be added to the actual database in a controlled migration
    # For now they are defined as @property methods to avoid errors with missing columns

    @property
    def system_user_id(self):
        """Default system user ID for scheduled jobs."""
        return 1
        
    @property
    def sanitization_enabled(self):
        """Whether data sanitization is enabled."""
        return True
        
    @property
    def sanitization_level(self):
        """Level of data sanitization (minimal, standard, strict)."""
        return 'standard'
        
    @property
    def sanitization_rules(self):
        """Custom sanitization rules."""
        return {}
        
    @property
    def sanitization_exclude_tables(self):
        """Tables to exclude from sanitization."""
        return ''
        
    @property
    def sanitization_include_tables(self):
        """Tables to include in sanitization."""
        return ''
        
    @property
    def notification_enabled(self):
        """Whether notifications are enabled."""
        return True
        
    @property
    def email_notifications(self):
        """Whether email notifications are enabled."""
        return True
        
    @property
    def sms_notifications(self):
        """Whether SMS notifications are enabled."""
        return False
        
    @property
    def webhook_notifications(self):
        """Whether webhook notifications are enabled."""
        return False
        
    @property
    def email_recipients(self):
        """Email recipients for notifications."""
        return ''
        
    @property
    def sms_recipients(self):
        """SMS recipients for notifications."""
        return ''
        
    @property
    def webhook_urls(self):
        """Webhook URLs for notifications."""
        return ''
        
    @property
    def critical_notification_channels(self):
        """Channels for critical notifications."""
        return 'email,log'
        
    @property
    def error_notification_channels(self):
        """Channels for error notifications."""
        return 'email,log'
        
    @property
    def warning_notification_channels(self):
        """Channels for warning notifications."""
        return 'log'
        
    @property
    def info_notification_channels(self):
        """Channels for info notifications."""
        return 'log'
    
    def __repr__(self):
        return f"<GlobalSetting id={self.id} state={self.cama_cloud_state}>"
        
class SyncLog(SyncBase, db.Model):
    """Detailed logs for sync operations."""
    
    job_id = db.Column(db.String(36), nullable=False)  # UUID of related job
    level = db.Column(db.String(32), nullable=False, default='INFO')  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    message = db.Column(db.Text, nullable=False)
    component = db.Column(db.String(128))  # Extract, Transform, Load, etc.
    table_name = db.Column(db.String(128))
    record_count = db.Column(db.Integer)
    duration_ms = db.Column(db.Integer)  # Duration in milliseconds
    
    __table_args__ = (
        Index('idx_sync_log_job_level', 'job_id', 'level'),
    )
    
    def __repr__(self):
        return f"<SyncLog {self.job_id} {self.level}: {self.message[:50]}>"

class SyncConflict(SyncBase, db.Model):
    """Record of a synchronization conflict requiring resolution"""
    
    job_id = db.Column(db.String(50), nullable=False, index=True)
    table_name = db.Column(db.String(100), nullable=False, index=True)
    record_id = db.Column(db.String(100), nullable=False)
    
    # The data from source and target systems
    source_data = db.Column(JSON, nullable=False)
    target_data = db.Column(JSON, nullable=False)
    
    # Status tracking
    resolution_status = db.Column(db.String(50), default='pending', nullable=False, index=True)  # pending, resolved, ignored
    resolution_type = db.Column(db.String(50))  # source_wins, target_wins, manual, merged
    resolved_by = db.Column(db.Integer)
    resolved_at = db.Column(db.DateTime)
    resolution_notes = db.Column(db.Text)
    
    # The resolved data (for manual resolution)
    resolved_data = db.Column(JSON)
    
    __table_args__ = (
        Index('idx_sync_conflict_job_table', 'job_id', 'table_name'),
        Index('idx_sync_conflict_status', 'resolution_status'),
    )
    
    def __repr__(self):
        return f"<SyncConflict {self.id} {self.table_name} record {self.record_id} [{self.resolution_status}]>"

class SanitizationLog(SyncBase, db.Model):
    """Log of sanitization actions for audit purposes"""
    
    job_id = db.Column(db.String(50), nullable=False, index=True)
    table_name = db.Column(db.String(100), nullable=False)
    field_name = db.Column(db.String(100), nullable=False)
    record_id = db.Column(db.String(100), nullable=False)
    
    # The type of sanitization applied
    sanitization_type = db.Column(db.String(50), nullable=False)
    
    # Whether the value was modified
    was_modified = db.Column(db.Boolean, default=False)
    
    # Store context data as an attribute with property access
    _context_data = {}
    
    @property
    def context_data(self):
        """Get additional context data for the sanitization."""
        return self._context_data or {}
        
    @context_data.setter
    def context_data(self, value):
        """Set additional context data for the sanitization."""
        self._context_data = value
    
    __table_args__ = (
        Index('idx_sanitization_log_job', 'job_id'),
        Index('idx_sanitization_log_table_field', 'table_name', 'field_name'),
    )
    
    def __repr__(self):
        return f"<SanitizationLog {self.id} {self.table_name}.{self.field_name} [{self.sanitization_type}]>"

class SyncNotificationLog(SyncBase, db.Model):
    """Log of notifications sent"""
    
    job_id = db.Column(db.String(50), nullable=True, index=True)
    
    subject = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(50), nullable=False)
    
    channel = db.Column(db.String(50), nullable=False)
    recipient = db.Column(db.String(255))
    success = db.Column(db.Boolean, default=False)
    
    # Store meta data as an attribute with property access
    _meta_data = {}
    
    @property
    def meta_data(self):
        """Get additional metadata for the notification."""
        return self._meta_data or {}
        
    @meta_data.setter
    def meta_data(self, value):
        """Set additional metadata for the notification."""
        self._meta_data = value
    
    __table_args__ = (
        Index('idx_notification_log_job', 'job_id'),
        Index('idx_notification_log_channel', 'channel'),
        Index('idx_notification_log_severity', 'severity'),
    )
    
    def __repr__(self):
        return f"<SyncNotificationLog {self.id} [{self.severity}] {self.channel}>"

class SyncSchedule(SyncBase, db.Model):
    """Schedule for automated sync jobs"""
    
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    
    # Schedule configuration
    job_type = db.Column(db.String(50), nullable=False)  # up_sync, down_sync, full_sync, incremental_sync, property_export
    schedule_type = db.Column(db.String(20), nullable=False)  # cron, interval
    cron_expression = db.Column(db.String(100))  # For cron-based schedules
    interval_hours = db.Column(db.Integer)  # For interval-based schedules
    
    # Store parameters as an attribute with property access
    _parameters = {}
    
    @property
    def parameters(self):
        """Get the parameters for the scheduled job."""
        return self._parameters or {}
        
    @parameters.setter
    def parameters(self, value):
        """Set the parameters for the scheduled job."""
        self._parameters = value
    
    # Status and tracking
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_run = db.Column(db.DateTime)
    last_updated = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_job_id = db.Column(db.String(50))
    job_id = db.Column(db.String(100))  # ID of the scheduled job in the APScheduler
    
    # User who created the schedule
    created_by = db.Column(db.Integer)
    
    __table_args__ = (
        Index('idx_sync_schedule_is_active', 'is_active'),
        Index('idx_sync_schedule_job_type', 'job_type'),
    )
    
    def __repr__(self):
        return f"<SyncSchedule {self.id} {self.name} [{self.job_type}]>"


class FieldSanitizationRule(SyncBase, db.Model):
    """Configuration for field-level data sanitization rules"""
    
    table_name = db.Column(db.String(100), nullable=False, index=True)
    field_name = db.Column(db.String(100), nullable=False)
    
    # The type of data in this field (used to determine appropriate sanitization)
    field_type = db.Column(db.String(50), nullable=False, index=True)
    
    # The sanitization strategy to apply
    strategy = db.Column(db.String(50), nullable=False)  # mask, hash, nullify, randomize, approximate, etc.
    
    # Description and metadata
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Store parameters as an attribute with property access
    _parameters = {}
    
    @property
    def parameters(self):
        """Get the parameters for the sanitization rule."""
        return self._parameters or {}
        
    @parameters.setter
    def parameters(self, value):
        """Set the parameters for the sanitization rule."""
        self._parameters = value
    
    # Tracking
    created_by = db.Column(db.Integer)
    
    __table_args__ = (
        Index('idx_field_sanitization_table_field', 'table_name', 'field_name'),
        Index('idx_field_sanitization_field_type', 'field_type'),
    )
    
    def __repr__(self):
        return f"<FieldSanitizationRule {self.id} {self.table_name}.{self.field_name} [{self.strategy}]>"
    
    def get_strategy_badge(self):
        """Return the appropriate badge class for the strategy"""
        strategy_badges = {
            'mask': 'info',
            'hash': 'primary',
            'nullify': 'danger',
            'randomize': 'warning',
            'approximate': 'success',
            'full_mask': 'secondary'
        }
        return strategy_badges.get(self.strategy.lower(), 'secondary')


class NotificationConfig(SyncBase, db.Model):
    """Configuration for notification channels"""
    
    channel_type = db.Column(db.String(50), nullable=False, unique=True, index=True)  # email, sms, slack
    
    # Whether this channel is enabled
    enabled = db.Column(db.Boolean, default=False, nullable=False)
    
    # Store configuration as an attribute with property access
    _config = {}
    
    @property
    def config(self):
        """Get configuration for the notification channel."""
        return self._config or {}
        
    @config.setter
    def config(self, value):
        """Set configuration for the notification channel."""
        self._config = value
    
    # When this configuration was last updated
    updated_by = db.Column(db.Integer)
    
    __table_args__ = (
        Index('idx_notification_config_channel_type', 'channel_type'),
        Index('idx_notification_config_enabled', 'enabled'),
    )
    
    def __repr__(self):
        return f"<NotificationConfig {self.channel_type} [{'enabled' if self.enabled else 'disabled'}]>"