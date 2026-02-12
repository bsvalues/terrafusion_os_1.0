from app import db
from flask_login import UserMixin
import datetime
import uuid
import json
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

# Association table for role-permissions relationship
role_permissions = db.Table('role_permissions',
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True),
    db.Column('permission_id', db.Integer, db.ForeignKey('permissions.id'), primary_key=True)
)

class Permission(db.Model):
    __tablename__ = 'permissions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)
    description = db.Column(db.Text)
    
    def __repr__(self):
        return f'<Permission {self.name}>'

class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    permissions = db.relationship('Permission', secondary=role_permissions, lazy='subquery',
                               backref=db.backref('roles', lazy=True))
    
    def __repr__(self):
        return f'<Role {self.name}>'

# Association table for user-roles relationship
user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True)
)

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    full_name = db.Column(db.String(128))
    department = db.Column(db.String(128))
    avatar_path = db.Column(db.String(512))  # Path to user's custom avatar
    phone = db.Column(db.String(20))  # Phone number
    bio = db.Column(db.Text)  # User bio/description
    ad_object_id = db.Column(db.String(128))  # Azure AD Object ID
    mfa_enabled = db.Column(db.Boolean, default=False)
    mfa_secret = db.Column(db.String(64))  # For TOTP MFA
    last_login = db.Column(db.DateTime)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    files = db.relationship('File', backref='owner', lazy='dynamic')
    projects = db.relationship('GISProject', backref='owner', lazy='dynamic')
    queries = db.relationship('QueryLog', backref='user', lazy='dynamic')
    roles = db.relationship('Role', secondary=user_roles, lazy='subquery',
                         backref=db.backref('users', lazy=True))
    
    def has_role(self, role_name):
        """Check if user has a specific role"""
        return any(role.name == role_name for role in self.roles)
    
    def has_permission(self, permission_name):
        """Check if user has a specific permission through any of their roles"""
        return any(permission.name == permission_name 
                  for role in self.roles 
                  for permission in role.permissions)
    
    def get_permissions(self):
        """Get all permissions for the user from all roles"""
        # Create a set to avoid duplicates
        permissions = set()
        for role in self.roles:
            for permission in role.permissions:
                permissions.add(permission.name)
        return list(permissions)
    
    def __repr__(self):
        return f'<User {self.username}>'

class ApiToken(db.Model):
    __tablename__ = 'api_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(128), unique=True, nullable=False)
    name = db.Column(db.String(128))  # Optional name/description for the token
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    last_used_at = db.Column(db.DateTime)
    revoked = db.Column(db.Boolean, default=False)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('tokens', lazy='dynamic'))
    
    def is_valid(self):
        """Check if token is valid (not expired or revoked)"""
        now = datetime.datetime.utcnow()
        return not self.revoked and self.expires_at > now
    
    def __repr__(self):
        return f'<ApiToken {self.id}>'

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(64), nullable=False)  # login, logout, api_access, etc.
    resource_type = db.Column(db.String(64))  # file, project, etc.
    resource_id = db.Column(db.Integer)  # ID of the resource being acted upon
    details = db.Column(JSONB)  # Additional details about the action (using PostgreSQL JSONB)
    ip_address = db.Column(db.String(45))  # Supports IPv6
    user_agent = db.Column(db.String(256))
    
    # Relationships
    user = db.relationship('User', backref=db.backref('audit_logs', lazy='dynamic'))
    
    def __repr__(self):
        return f'<AuditLog {self.action} by user_id={self.user_id}>'

class File(db.Model):
    __tablename__ = 'files'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # Size in bytes
    file_type = db.Column(db.String(64))  # MIME type or file extension
    upload_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    description = db.Column(db.Text)
    file_metadata = db.Column(JSONB)  # For storing extracted metadata (using PostgreSQL JSONB)
    storage_bucket = db.Column(db.String(64))  # Supabase Storage bucket name
    storage_path = db.Column(db.String(512))  # Path in Supabase Storage
    storage_url = db.Column(db.String(1024))  # Public URL (if available)
    
    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('gis_projects.id'))
    
    def __repr__(self):
        return f'<File {self.filename}>'

class GISProject(db.Model):
    __tablename__ = 'gis_projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    files = db.relationship('File', backref='project', lazy='dynamic')
    
    def __repr__(self):
        return f'<GISProject {self.name}>'

class QueryLog(db.Model):
    __tablename__ = 'query_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    query = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    response = db.Column(db.Text)
    processing_time = db.Column(db.Float)  # In seconds
    
    def __repr__(self):
        return f'<QueryLog {self.query[:30]}>'

# MFA class to store backup codes and configuration
class MFASetup(db.Model):
    __tablename__ = 'mfa_setup'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    backup_codes = db.Column(JSONB)  # Store hashed backup codes (using PostgreSQL JSONB)
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('mfa_setup', uselist=False))
    
    def __repr__(self):
        return f'<MFASetup user_id={self.user_id}>'

# Association table for tracking which documents have been indexed for RAG
class IndexedDocument(db.Model):
    __tablename__ = 'indexed_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    file_id = db.Column(db.Integer, db.ForeignKey('files.id'), nullable=False)
    index_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    chunk_count = db.Column(db.Integer, default=0)  # Number of chunks indexed
    status = db.Column(db.String(32), default='indexed')  # indexed, failed, pending
    
    # Relationship
    file = db.relationship('File', backref=db.backref('index_info', uselist=False))
    
    def __repr__(self):
        return f'<IndexedDocument file_id={self.file_id}>'

# New models for property assessment and valuation

class Property(db.Model):
    """Property model for storing property records."""
    __tablename__ = 'properties'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    address = db.Column(db.String(256), nullable=False, index=True)
    city = db.Column(db.String(64))
    state = db.Column(db.String(2), default='WA')
    zip_code = db.Column(db.String(10))
    property_type = db.Column(db.String(32), index=True)  # residential, commercial, agricultural, etc.
    
    # Property attributes
    lot_size = db.Column(db.Float)  # Size in square feet
    year_built = db.Column(db.Integer)
    bedrooms = db.Column(db.Integer)
    bathrooms = db.Column(db.Float)
    total_area = db.Column(db.Float)  # Total living area in square feet
    
    # Ownership information
    owner_name = db.Column(db.String(256))
    owner_address = db.Column(db.String(256))
    purchase_date = db.Column(db.Date)
    purchase_price = db.Column(db.Numeric(precision=12, scale=2))
    
    # Additional data
    features = db.Column(JSONB)  # Property features and amenities
    location = db.Column(JSONB)  # GeoJSON for property location
    property_metadata = db.Column(JSONB)  # Additional metadata
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    tax_records = db.relationship('TaxRecord', backref='property', lazy='dynamic')
    assessments = db.relationship('Assessment', backref='property', lazy='dynamic')
    inspections = db.relationship('Inspection', backref='property', lazy='dynamic')
    
    def __repr__(self):
        return f'<Property {self.parcel_id} - {self.address}>'

class TaxRecord(db.Model):
    """Tax record for a property."""
    __tablename__ = 'tax_records'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = db.Column(UUID(as_uuid=True), db.ForeignKey('properties.id'), nullable=False)
    tax_year = db.Column(db.Integer, nullable=False)
    
    # Assessed values
    land_value = db.Column(db.Numeric(precision=12, scale=2))
    improvement_value = db.Column(db.Numeric(precision=12, scale=2))
    total_value = db.Column(db.Numeric(precision=12, scale=2))
    
    # Tax amounts
    tax_amount = db.Column(db.Numeric(precision=12, scale=2))
    tax_rate = db.Column(db.Numeric(precision=7, scale=6))  # Tax rate as a decimal (e.g., 0.010345)
    
    # Tax status
    status = db.Column(db.String(32))  # paid, unpaid, partial, exempt
    exemptions = db.Column(JSONB)  # Tax exemptions
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Unique constraint for property_id + tax_year
    __table_args__ = (
        db.UniqueConstraint('property_id', 'tax_year', name='uix_tax_record_property_year'),
    )
    
    def __repr__(self):
        return f'<TaxRecord for {self.property_id} - {self.tax_year}>'

class Assessment(db.Model):
    """Property assessment record."""
    __tablename__ = 'assessments'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = db.Column(UUID(as_uuid=True), db.ForeignKey('properties.id'), nullable=False)
    assessment_date = db.Column(db.Date, nullable=False)
    assessor_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Assessment values
    land_value = db.Column(db.Numeric(precision=12, scale=2))
    improvement_value = db.Column(db.Numeric(precision=12, scale=2))
    total_value = db.Column(db.Numeric(precision=12, scale=2))
    
    # Market analysis
    comparable_properties = db.Column(JSONB)  # List of comparable property IDs and details
    market_conditions = db.Column(JSONB)  # Market condition factors applied
    
    # Assessment details
    valuation_method = db.Column(db.String(32))  # cost, income, market
    notes = db.Column(db.Text)
    documents = db.Column(ARRAY(db.Integer))  # Array of file IDs
    
    # Status
    status = db.Column(db.String(32), default='draft')  # draft, review, complete, appealed
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationship with assessor (optional)
    assessor = db.relationship('User', backref=db.backref('assessments', lazy='dynamic'))
    
    def __repr__(self):
        return f'<Assessment for {self.property_id} on {self.assessment_date}>'

class Inspection(db.Model):
    """Property inspection record."""
    __tablename__ = 'inspections'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = db.Column(UUID(as_uuid=True), db.ForeignKey('properties.id'), nullable=False)
    inspection_date = db.Column(db.Date, nullable=False)
    inspector_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Inspection details
    inspection_type = db.Column(db.String(32))  # initial, periodic, appeal, complaint
    condition = db.Column(db.String(32))  # excellent, good, fair, poor
    findings = db.Column(db.Text)
    recommendations = db.Column(db.Text)
    
    # Property changes observed
    changes_noted = db.Column(JSONB)  # Changes observed since last inspection
    
    # Images and documents
    photos = db.Column(ARRAY(db.Integer))  # Array of file IDs
    documents = db.Column(ARRAY(db.Integer))  # Array of file IDs
    
    # Status
    status = db.Column(db.String(32), default='scheduled')  # scheduled, completed, cancelled
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationship with inspector
    inspector = db.relationship('User', backref=db.backref('inspections', lazy='dynamic'))
    
    def __repr__(self):
        return f'<Inspection for {self.property_id} on {self.inspection_date}>'

class ComparableSale(db.Model):
    """Comparable property sale record for market analysis."""
    __tablename__ = 'comparable_sales'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = db.Column(UUID(as_uuid=True), db.ForeignKey('properties.id'), nullable=True)  # Optional link to property
    
    # Sale details
    address = db.Column(db.String(256), nullable=False)
    city = db.Column(db.String(64))
    state = db.Column(db.String(2), default='WA')
    zip_code = db.Column(db.String(10))
    sale_date = db.Column(db.Date, nullable=False)
    sale_price = db.Column(db.Numeric(precision=12, scale=2), nullable=False)
    
    # Property details
    property_type = db.Column(db.String(32))  # residential, commercial, agricultural, etc.
    lot_size = db.Column(db.Float)
    year_built = db.Column(db.Integer)
    bedrooms = db.Column(db.Integer)
    bathrooms = db.Column(db.Float)
    total_area = db.Column(db.Float)
    
    # Sale attributes
    sale_type = db.Column(db.String(32))  # arm's length, foreclosure, family, etc.
    verified = db.Column(db.Boolean, default=False)
    verification_source = db.Column(db.String(256))
    
    # Additional data
    features = db.Column(JSONB)  # Property features and amenities
    location = db.Column(JSONB)  # GeoJSON for property location
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f'<ComparableSale {self.address} - ${self.sale_price}>'

class MarketArea(db.Model):
    """Market area or neighborhood definition."""
    __tablename__ = 'market_areas'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(128), nullable=False)
    code = db.Column(db.String(32), unique=True)
    description = db.Column(db.Text)
    
    # Geographic data
    boundary = db.Column(JSONB)  # GeoJSON boundary
    
    # Market data
    current_trend = db.Column(db.String(32))  # increasing, stable, decreasing
    market_factors = db.Column(JSONB)  # Market condition factors
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f'<MarketArea {self.name}>'

class Appeal(db.Model):
    """Property tax assessment appeal."""
    __tablename__ = 'appeals'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = db.Column(UUID(as_uuid=True), db.ForeignKey('properties.id'), nullable=False)
    assessment_id = db.Column(UUID(as_uuid=True), db.ForeignKey('assessments.id'), nullable=False)
    
    # Appeal details
    appeal_date = db.Column(db.Date, nullable=False)
    appellant_name = db.Column(db.String(256))
    appellant_contact = db.Column(db.String(256))
    reason = db.Column(db.Text)
    requested_value = db.Column(db.Numeric(precision=12, scale=2))
    
    # Appeal process
    hearing_date = db.Column(db.Date)
    decision_date = db.Column(db.Date)
    decision = db.Column(db.String(32))  # granted, denied, partial
    adjusted_value = db.Column(db.Numeric(precision=12, scale=2))
    decision_notes = db.Column(db.Text)
    
    # Documents
    documents = db.Column(ARRAY(db.Integer))  # Array of file IDs
    
    # Status
    status = db.Column(db.String(32), default='submitted')  # submitted, scheduled, heard, decided
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    assessment = db.relationship('Assessment', backref=db.backref('appeals', lazy='dynamic'))
    
    def __repr__(self):
        return f'<Appeal for {self.property_id} on {self.appeal_date}>'

class PropertyDataQualityAlert(db.Model):
    """Data quality alert for property data from the AI system."""
    __tablename__ = 'property_data_quality_alerts'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = db.Column(UUID(as_uuid=True), db.ForeignKey('properties.id'), nullable=True)
    
    # Alert details
    alert_type = db.Column(db.String(64), nullable=False)  # value_anomaly, missing_data, etc.
    severity = db.Column(db.String(16), nullable=False)  # critical, high, medium, low
    description = db.Column(db.Text, nullable=False)
    
    # Alert context
    data_source = db.Column(db.String(128))
    field_name = db.Column(db.String(128))
    detected_value = db.Column(db.String(256))
    expected_range = db.Column(db.String(256))
    
    # Temporal information
    detection_time = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Resolution
    status = db.Column(db.String(32), default='new')  # new, investigating, resolved, false_positive
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    resolution_time = db.Column(db.DateTime)
    resolution_notes = db.Column(db.Text)
    
    # Relationships
    resolver = db.relationship('User', backref=db.backref('resolved_property_alerts', lazy='dynamic'))
    
    def __repr__(self):
        return f'<PropertyDataQualityAlert {self.alert_type} - {self.severity}>'