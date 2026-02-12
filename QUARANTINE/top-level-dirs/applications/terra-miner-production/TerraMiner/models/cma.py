"""
Models for Comparative Market Analysis (CMA) functionality.

This module defines the data models for storing and tracking CMA reports,
comparable properties, and analysis results.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, 
    Boolean, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship

from app import db

class CMAReport(db.Model):
    """Model for a Comparative Market Analysis Report."""
    
    __tablename__ = 'cma_reports'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    subject_property_id = Column(String(100), nullable=False)  # External property ID
    subject_address = Column(String(255), nullable=False)
    subject_city = Column(String(100), nullable=False)
    subject_state = Column(String(50), nullable=False)
    subject_zip = Column(String(20), nullable=False)
    subject_price = Column(Float, nullable=True)
    subject_sqft = Column(Float, nullable=True)
    subject_beds = Column(Float, nullable=True)
    subject_baths = Column(Float, nullable=True)
    subject_year_built = Column(Integer, nullable=True)
    subject_lot_size = Column(Float, nullable=True)
    subject_property_type = Column(String(100), nullable=True)
    
    # Search parameters
    search_radius_miles = Column(Float, default=1.0)
    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)
    min_sqft = Column(Float, nullable=True)
    max_sqft = Column(Float, nullable=True)
    min_beds = Column(Float, nullable=True)
    max_beds = Column(Float, nullable=True)
    min_baths = Column(Float, nullable=True)
    max_baths = Column(Float, nullable=True)
    property_types = Column(String(255), nullable=True)  # Comma-separated list
    max_days_on_market = Column(Integer, nullable=True)
    
    # Report metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100), nullable=True)  # User ID or email
    status = Column(String(50), default='pending')  # pending, processing, completed, error
    error_message = Column(Text, nullable=True)
    
    # Analysis results
    recommended_price = Column(Float, nullable=True)
    price_per_sqft = Column(Float, nullable=True)
    avg_days_on_market = Column(Float, nullable=True)
    market_trend = Column(String(50), nullable=True)  # up, down, stable
    confidence_score = Column(Float, nullable=True)
    price_range_low = Column(Float, nullable=True)
    price_range_high = Column(Float, nullable=True)
    summary = Column(Text, nullable=True)
    insights = Column(JSON, nullable=True)
    
    # Relationships
    comps = relationship('Comparable', back_populates='report', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f"<CMAReport {self.id}: {self.subject_address}>"
    
    def to_dict(self):
        """Convert the report to a dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'subject_property_id': self.subject_property_id,
            'subject_address': self.subject_address,
            'subject_city': self.subject_city,
            'subject_state': self.subject_state,
            'subject_zip': self.subject_zip,
            'subject_price': self.subject_price,
            'subject_sqft': self.subject_sqft,
            'subject_beds': self.subject_beds,
            'subject_baths': self.subject_baths,
            'subject_year_built': self.subject_year_built,
            'subject_lot_size': self.subject_lot_size,
            'subject_property_type': self.subject_property_type,
            'search_radius_miles': self.search_radius_miles,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by,
            'status': self.status,
            'recommended_price': self.recommended_price,
            'price_per_sqft': self.price_per_sqft,
            'avg_days_on_market': self.avg_days_on_market,
            'market_trend': self.market_trend,
            'confidence_score': self.confidence_score,
            'price_range_low': self.price_range_low,
            'price_range_high': self.price_range_high,
            'summary': self.summary,
            'insights': self.insights,
            'comps_count': len(self.comps) if self.comps else 0
        }


class Comparable(db.Model):
    """Model for a comparable property used in CMA reports."""
    
    __tablename__ = 'cma_comparables'
    
    id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey('cma_reports.id'), nullable=False)
    property_id = Column(String(100), nullable=False)  # External property ID
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    zip_code = Column(String(20), nullable=False)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)  # If price history available
    sqft = Column(Float, nullable=True)
    beds = Column(Float, nullable=True)
    baths = Column(Float, nullable=True)
    year_built = Column(Integer, nullable=True)
    lot_size = Column(Float, nullable=True)
    property_type = Column(String(100), nullable=True)
    days_on_market = Column(Integer, nullable=True)
    status = Column(String(50), nullable=True)  # active, pending, sold
    sale_date = Column(DateTime, nullable=True)
    distance_miles = Column(Float, nullable=True)  # Distance from subject property
    price_per_sqft = Column(Float, nullable=True)
    
    # Adjustments
    location_adjustment = Column(Float, default=0.0)
    condition_adjustment = Column(Float, default=0.0)
    size_adjustment = Column(Float, default=0.0)
    features_adjustment = Column(Float, default=0.0)
    time_adjustment = Column(Float, default=0.0)
    total_adjustment = Column(Float, default=0.0)
    adjusted_price = Column(Float, nullable=True)
    
    # Similarity score (0-100)
    similarity_score = Column(Float, nullable=True)
    
    # Additional data
    photos_url = Column(String(255), nullable=True)
    details_url = Column(String(255), nullable=True)
    additional_data = Column(JSON, nullable=True)
    
    # Relationship
    report = relationship('CMAReport', back_populates='comps')
    
    def __repr__(self):
        return f"<Comparable {self.id}: {self.address}>"
    
    def to_dict(self):
        """Convert the comparable to a dictionary."""
        return {
            'id': self.id,
            'property_id': self.property_id,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'price': self.price,
            'original_price': self.original_price,
            'sqft': self.sqft,
            'beds': self.beds,
            'baths': self.baths,
            'year_built': self.year_built,
            'lot_size': self.lot_size,
            'property_type': self.property_type,
            'days_on_market': self.days_on_market,
            'status': self.status,
            'sale_date': self.sale_date.isoformat() if self.sale_date else None,
            'distance_miles': self.distance_miles,
            'price_per_sqft': self.price_per_sqft,
            'location_adjustment': self.location_adjustment,
            'condition_adjustment': self.condition_adjustment,
            'size_adjustment': self.size_adjustment,
            'features_adjustment': self.features_adjustment,
            'time_adjustment': self.time_adjustment,
            'total_adjustment': self.total_adjustment,
            'adjusted_price': self.adjusted_price,
            'similarity_score': self.similarity_score,
            'photos_url': self.photos_url,
            'details_url': self.details_url,
            'additional_data': self.additional_data
        }