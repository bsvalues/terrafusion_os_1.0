"""
Database models for NARRPR data.
"""
from datetime import datetime
from sqlalchemy import JSON

from app import db

class NarrprReport(db.Model):
    """Model representing a NARRPR report."""
    __tablename__ = 'narrpr_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.String(50), nullable=False, unique=True)
    title = db.Column(db.String(255), nullable=True)
    type = db.Column(db.String(50), nullable=True)
    date = db.Column(db.Date, nullable=True)
    link = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), nullable=True)
    raw_data = db.Column(JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<NarrprReport(id={self.id}, title='{self.title}')>"

class NarrprProperty(db.Model):
    """Model representing a NARRPR property."""
    __tablename__ = 'narrpr_properties'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.String(50), nullable=False, unique=True)
    address = db.Column(db.String(255), nullable=True)
    street = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(2), nullable=True)
    zip_code = db.Column(db.String(10), nullable=True)
    property_type = db.Column(db.String(50), nullable=True)
    beds = db.Column(db.Float, nullable=True)
    baths = db.Column(db.Float, nullable=True)
    square_feet = db.Column(db.Integer, nullable=True)
    year_built = db.Column(db.Integer, nullable=True)
    lot_size = db.Column(db.Float, nullable=True)
    estimated_value = db.Column(db.Integer, nullable=True)
    raw_data = db.Column(JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Define relationships
    comparables = db.relationship('NarrprComparableProperty', back_populates='property', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f"<NarrprProperty(id={self.id}, address='{self.address}')>"

class NarrprComparableProperty(db.Model):
    """Model representing a comparable property from NARRPR."""
    __tablename__ = 'narrpr_comparable_properties'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('narrpr_properties.id'), nullable=False)
    comparable_id = db.Column(db.String(50), nullable=False)
    address = db.Column(db.String(255), nullable=True)
    distance = db.Column(db.Float, nullable=True)
    price = db.Column(db.Integer, nullable=True)
    beds = db.Column(db.Float, nullable=True)
    baths = db.Column(db.Float, nullable=True)
    square_feet = db.Column(db.Integer, nullable=True)
    year_built = db.Column(db.Integer, nullable=True)
    sale_date = db.Column(db.Date, nullable=True)
    raw_data = db.Column(JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Define relationships
    property = db.relationship('NarrprProperty', back_populates='comparables')
    
    def __repr__(self):
        return f"<NarrprComparableProperty(id={self.id}, address='{self.address}')>"

class NarrprMarketActivity(db.Model):
    """Model representing market activity data from NARRPR."""
    __tablename__ = 'narrpr_market_activities'
    
    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.String(50), nullable=False)
    location_type = db.Column(db.String(20), nullable=False)  # zip, neighborhood, city
    location_name = db.Column(db.String(100), nullable=True)
    date = db.Column(db.Date, nullable=False)
    median_list_price = db.Column(db.Integer, nullable=True)
    median_sold_price = db.Column(db.Integer, nullable=True)
    median_days_on_market = db.Column(db.Integer, nullable=True)
    total_properties = db.Column(db.Integer, nullable=True)
    active_listings = db.Column(db.Integer, nullable=True)
    sold_last_6_months = db.Column(db.Integer, nullable=True)
    price_per_sqft = db.Column(db.Integer, nullable=True)
    raw_data = db.Column(JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Create a unique constraint for location and date
    __table_args__ = (
        db.UniqueConstraint('location_id', 'location_type', 'date', name='uix_narrpr_market_activity'),
    )
    
    def __repr__(self):
        return f"<NarrprMarketActivity(id={self.id}, location='{self.location_name}', date='{self.date}')>"