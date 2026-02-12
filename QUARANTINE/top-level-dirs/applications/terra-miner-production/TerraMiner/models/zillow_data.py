"""
Database models for Zillow data.

These models store the Zillow market data, property information,
and price trends collected from the Zillow API.
"""
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from app import db

class ZillowMarketData(db.Model):
    """Market data for a specific location from Zillow."""
    
    __tablename__ = 'zillow_market_data'
    
    id = db.Column(db.Integer, primary_key=True)
    resource_id = db.Column(db.String(50), nullable=False, index=True)
    location_name = db.Column(db.String(255))
    location_type = db.Column(db.String(50))
    beds = db.Column(db.Integer, default=0)
    property_types = db.Column(db.String(50))
    median_price = db.Column(db.Float)
    median_price_per_sqft = db.Column(db.Float)
    median_days_on_market = db.Column(db.Integer)
    avg_days_on_market = db.Column(db.Float)
    homes_sold_last_month = db.Column(db.Integer)
    total_active_listings = db.Column(db.Integer)
    raw_data = db.Column(JSONB)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # One-to-many relationship with price trends
    price_trends = db.relationship('ZillowPriceTrend', back_populates='market_data', 
                                   cascade='all, delete-orphan')

    def __repr__(self):
        return f"<ZillowMarketData {self.location_name} ({self.resource_id})>"

class ZillowPriceTrend(db.Model):
    """Historical price trend data for a market."""
    
    __tablename__ = 'zillow_price_trends'
    
    id = db.Column(db.Integer, primary_key=True)
    market_data_id = db.Column(db.Integer, db.ForeignKey('zillow_market_data.id', ondelete='CASCADE'), 
                               nullable=False, index=True)
    date = db.Column(db.Date, nullable=False)
    price = db.Column(db.Float)
    percent_change = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Many-to-one relationship with market data
    market_data = db.relationship('ZillowMarketData', back_populates='price_trends')
    
    def __repr__(self):
        return f"<ZillowPriceTrend {self.date} ${self.price}>"

class ZillowProperty(db.Model):
    """Individual property data from Zillow."""
    
    __tablename__ = 'zillow_properties'
    
    id = db.Column(db.Integer, primary_key=True)
    zpid = db.Column(db.String(50), nullable=False, unique=True, index=True)
    address = db.Column(db.String(255))
    city = db.Column(db.String(100))
    state = db.Column(db.String(50))
    zip_code = db.Column(db.String(20))
    price = db.Column(db.Float)
    beds = db.Column(db.Float)
    baths = db.Column(db.Float)
    square_feet = db.Column(db.Float)
    lot_size = db.Column(db.Float)
    year_built = db.Column(db.Integer)
    property_type = db.Column(db.String(50))
    status = db.Column(db.String(50))
    days_on_market = db.Column(db.Integer)
    url = db.Column(db.String(512))
    image_url = db.Column(db.String(512))
    raw_data = db.Column(JSONB)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<ZillowProperty {self.address}, {self.city}, {self.state} ({self.zpid})>"