from app import db
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, Text, Boolean, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

class User(db.Model):
    __tablename__ = 'users'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    
    def is_authenticated(self):
        return True
    
    def is_active(self):
        return self.active
    
    def is_anonymous(self):
        return False
    
    def get_id(self):
        return str(self.id)
    
    # Performance indexes
    __table_args__ = (
        Index('idx_users_active_created', 'active', 'created_at'),
    )

class County(db.Model):
    __tablename__ = 'counties'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    county_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    config_path: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ExportJob(db.Model):
    __tablename__ = 'export_jobs'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    county_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    export_format: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default='pending', index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True, index=True)
    file_path: Mapped[str] = mapped_column(String(255), nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Performance indexes for common query patterns
    __table_args__ = (
        Index('idx_export_jobs_lookup', 'county_id', 'status', 'created_at'),
        Index('idx_export_jobs_user_status', 'username', 'status'),
    )

class Parcel(db.Model):
    __tablename__ = 'parcels'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parcel_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    county_id: Mapped[int] = mapped_column(Integer, ForeignKey('counties.id'), nullable=False, index=True)
    owner_name: Mapped[str] = mapped_column(String(200), nullable=True, index=True)
    property_address: Mapped[str] = mapped_column(String(300), nullable=True)
    assessed_value: Mapped[float] = mapped_column(Float, nullable=True, index=True)
    land_area: Mapped[float] = mapped_column(Float, nullable=True)
    property_type: Mapped[str] = mapped_column(String(50), nullable=True, index=True)
    tax_year: Mapped[int] = mapped_column(Integer, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    county: Mapped["County"] = relationship("County", backref="parcels")
    
    # Performance indexes
    __table_args__ = (
        Index('idx_parcels_lookup', 'county_id', 'property_type', 'tax_year'),
        Index('idx_parcels_value', 'assessed_value', 'tax_year'),
    )

class SyncOperation(db.Model):
    __tablename__ = 'sync_operations'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    operation_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    county_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    operation_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default='pending', index=True)
    records_processed: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True, index=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Performance indexes
    __table_args__ = (
        Index('idx_sync_ops_lookup', 'county_id', 'operation_type', 'status'),
        Index('idx_sync_ops_processing', 'status', 'created_at'),
    )

class Property(db.Model):
    __tablename__ = 'properties'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    property_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    county_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    parcel_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    owner_name: Mapped[str] = mapped_column(String(200), nullable=True, index=True)
    owner_address: Mapped[str] = mapped_column(String(300), nullable=True)
    property_address: Mapped[str] = mapped_column(String(300), nullable=True, index=True)
    assessed_value: Mapped[float] = mapped_column(Float, nullable=True, index=True)
    tax_amount: Mapped[float] = mapped_column(Float, nullable=True)
    property_type: Mapped[str] = mapped_column(String(50), nullable=True, index=True)
    acreage: Mapped[float] = mapped_column(Float, nullable=True)
    zoning: Mapped[str] = mapped_column(String(50), nullable=True, index=True)
    exemptions: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string for array storage
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_by: Mapped[str] = mapped_column(String(100), nullable=True)
    
    # Performance indexes
    __table_args__ = (
        Index('idx_properties_lookup', 'county_id', 'property_type', 'last_updated'),
        Index('idx_properties_value', 'assessed_value', 'county_id'),
        Index('idx_properties_owner', 'owner_name', 'county_id'),
    )

class DistrictBoundary(db.Model):
    __tablename__ = 'district_boundaries'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    district_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    county_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    district_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    district_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    tax_rate: Mapped[float] = mapped_column(Float, nullable=True)
    boundary_coordinates: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string for coordinates
    population: Mapped[int] = mapped_column(Integer, nullable=True)
    area_square_miles: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Performance indexes
    __table_args__ = (
        Index('idx_districts_lookup', 'county_id', 'district_type', 'district_id'),
        Index('idx_districts_type', 'district_type', 'county_id'),
    )

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    county_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    details: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string
    user_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    
    # Performance indexes
    __table_args__ = (
        Index('idx_audit_logs_lookup', 'county_id', 'action', 'timestamp'),
        Index('idx_audit_logs_user', 'user_id', 'timestamp'),
    )