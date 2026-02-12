"""
Property models for the TerraMiner application.

This module defines the data models for property information and 
associated entities like listings, histories, and data sources.
"""

from datetime import datetime
from typing import Dict, Any, Optional, List

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.dialects.postgresql import JSONB

# Import the db module to use the SQLAlchemy instance
import sys
import os

# Add the root directory to the path to ensure imports work correctly
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import the central SQLAlchemy instance
from db_utils import get_db

db = get_db()

class Property(db.Model):
    """
    Primary model for real estate property information.
    
    This model stores comprehensive property details from various sources.
    """
    __tablename__ = 'properties'
    
    id = Column(Integer, primary_key=True)
    
    # Common property identifiers
    external_id = Column(String(100), index=True)  # ID from external data source
    source = Column(String(50), index=True)  # Data source name (zillow, pacmls, etc.)
    mls_number = Column(String(50), index=True)  # MLS listing number if available
    parcel_number = Column(String(50), index=True)  # County parcel/APN number
    
    # Basic property information
    property_type = Column(String(50))  # Single-family, Condo, Multi-family, etc.
    status = Column(String(50))  # Active, Pending, Sold, etc.
    price = Column(Float)  # Current listing price or last sold price
    original_price = Column(Float)  # Original listing price if different
    
    # Address information
    address_line1 = Column(String(255))
    address_line2 = Column(String(100))
    city = Column(String(100), index=True)
    state = Column(String(50), index=True)
    zipcode = Column(String(20), index=True)
    county = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Property details
    bedrooms = Column(Float)  # Using float to handle half bedrooms (e.g., 3.5)
    bathrooms = Column(Float)  # Using float to handle half bathrooms
    square_feet = Column(Float)
    lot_size = Column(Float)
    year_built = Column(Integer)
    stories = Column(Float)
    parking_spaces = Column(Integer)
    pool = Column(Boolean)
    has_basement = Column(Boolean)
    has_garage = Column(Boolean)
    
    # Financial details
    tax_assessed_value = Column(Float)
    tax_annual_amount = Column(Float)
    hoa_fee = Column(Float)
    monthly_cost = Column(Float)
    
    # Sales history
    last_sold_date = Column(DateTime)
    last_sold_price = Column(Float)
    
    # Listing details
    days_on_market = Column(Integer)
    listing_date = Column(DateTime)
    listing_agent = Column(String(255))
    listing_office = Column(String(255))
    virtual_tour_url = Column(String(500))
    description = Column(Text)
    
    # Amenities and details
    features = Column(JSONB)  # JSON field for flexible storage of features
    schools = Column(JSONB)  # JSON field for nearby schools
    neighborhood_info = Column(JSONB)  # JSON field for neighborhood details
    
    # Valuation and predictions
    estimated_value = Column(Float)  # Estimated market value
    value_change_rate = Column(Float)  # Rate of value change (percentage)
    price_per_sqft = Column(Float)  # Price per square foot
    
    # Image information
    primary_image_url = Column(String(500))
    image_count = Column(Integer)
    
    # Timestamps and metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_checked = Column(DateTime)  # Last time data was verified/updated
    
    # External data in raw format for reference
    raw_data = Column(JSONB)  # Complete raw data from source
    
    # Relationships
    listings = relationship("PropertyListing", back_populates="property")
    history = relationship("PropertyHistory", back_populates="property")
    
    def __repr__(self):
        return f"<Property {self.id}: {self.address_line1}, {self.city}, {self.state}>"
    
    @property
    def full_address(self):
        """Generate full address string."""
        components = [self.address_line1]
        if self.address_line2:
            components.append(self.address_line2)
        components.append(f"{self.city}, {self.state} {self.zipcode}")
        return ", ".join(components)
    
    @property
    def display_price(self):
        """Format price for display with appropriate label."""
        if not self.price:
            return "Price not available"
        
        formatted_price = f"${int(self.price):,}"
        
        if self.status and self.status.lower() == 'sold':
            return f"Sold for {formatted_price}"
        elif self.status and self.status.lower() == 'pending':
            return f"Pending at {formatted_price}"
        else:
            return formatted_price
    
    @property
    def coordinates(self):
        """Return latitude and longitude as a tuple if available."""
        if self.latitude is not None and self.longitude is not None:
            return (self.latitude, self.longitude)
        return None
    
    def to_dict(self):
        """Convert property to dictionary for API responses."""
        return {
            "id": self.id,
            "external_id": self.external_id,
            "source": self.source,
            "address": self.full_address,
            "price": self.price,
            "status": self.status,
            "property_type": self.property_type,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "square_feet": self.square_feet,
            "lot_size": self.lot_size,
            "year_built": self.year_built,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "primary_image_url": self.primary_image_url,
            "days_on_market": self.days_on_market,
            "listing_date": self.listing_date.isoformat() if self.listing_date else None,
            "last_updated": self.updated_at.isoformat() if self.updated_at else None
        }

class PropertyListing(db.Model):
    """
    Model for property listing information.
    
    This tracks multiple listings for the same property over time.
    """
    __tablename__ = 'property_listings'
    
    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey('properties.id'), index=True)
    
    # Listing details
    listing_id = Column(String(100), index=True)  # External listing ID
    source = Column(String(50))  # Source of this listing
    status = Column(String(50))  # Active, Pending, Sold, Expired, etc.
    price = Column(Float)  # Listed price
    original_price = Column(Float)  # Original price if changed
    listing_date = Column(DateTime)
    listing_expiration = Column(DateTime)
    days_on_market = Column(Integer)
    
    # Listing agent information
    listing_agent = Column(String(255))
    listing_agent_id = Column(String(100))
    listing_office = Column(String(255))
    listing_office_id = Column(String(100))
    
    # Listing details
    description = Column(Text)
    showing_instructions = Column(Text)
    open_house_dates = Column(JSONB)  # JSON array of open house dates
    virtual_tour_url = Column(String(500))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Raw data
    raw_data = Column(JSONB)
    
    # Relationships
    property = relationship("Property", back_populates="listings")
    
    def __repr__(self):
        return f"<PropertyListing {self.id}: {self.listing_id} from {self.source}>"

class PropertyHistory(db.Model):
    """
    Model for property history events.
    
    This tracks price changes, status changes, and other significant events.
    """
    __tablename__ = 'property_history'
    
    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey('properties.id'), index=True)
    
    # Event details
    event_type = Column(String(50))  # price_change, status_change, sold, listed, etc.
    event_date = Column(DateTime)
    previous_value = Column(String(255))  # Previous value (price, status, etc.)
    new_value = Column(String(255))  # New value
    source = Column(String(50))  # Source of this history record
    
    # Additional details
    description = Column(Text)
    agent = Column(String(255))
    details = Column(JSONB)  # Additional details as JSON
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    property = relationship("Property", back_populates="history")
    
    def __repr__(self):
        return f"<PropertyHistory {self.id}: {self.event_type} on {self.event_date}>"

class DataSourceStatus(db.Model):
    """
    Model for tracking data source health and status.
    
    This stores information about each data source's availability,
    response times, and configuration.
    """
    __tablename__ = 'data_source_status'
    
    id = Column(Integer, primary_key=True)
    source_name = Column(String(50), unique=True, index=True)
    
    # Status information
    status = Column(String(50), default='unknown')  # healthy, degraded, critical, unknown
    is_active = Column(Boolean, default=True)
    priority = Column(String(50), default='secondary')  # primary, secondary, tertiary, fallback
    last_check = Column(DateTime)
    
    # Performance metrics
    success_rate = Column(Float, default=100.0)  # Percentage of successful requests
    avg_response_time = Column(Float, default=0.0)  # Average response time in seconds
    error_count = Column(Integer, default=0)  # Number of errors encountered
    request_count = Column(Integer, default=0)  # Total number of requests made
    
    # Rate limiting information
    rate_limit_remaining = Column(Integer)  # Remaining requests in current period
    rate_limit_reset = Column(DateTime)  # When rate limit resets
    
    # Configuration status
    credentials_configured = Column(Boolean, default=False)
    settings_configured = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<DataSourceStatus {self.source_name}: {self.status}>"
    
    def to_dict(self):
        """Convert status to dictionary for API responses."""
        return {
            "name": self.source_name,
            "status": self.status,
            "is_active": self.is_active,
            "priority": self.priority,
            "success_rate": self.success_rate,
            "avg_response_time": self.avg_response_time,
            "error_count": self.error_count,
            "request_count": self.request_count,
            "last_check": self.last_check.isoformat() if self.last_check else None,
            "rate_limit_remaining": self.rate_limit_remaining,
            "rate_limit_reset": self.rate_limit_reset.isoformat() if self.rate_limit_reset else None,
            "configured": {
                "credentials": self.credentials_configured,
                "settings": self.settings_configured
            }
        }

def standardize_property_data(data: Dict[str, Any], source: str) -> Dict[str, Any]:
    """
    Standardize property data from different sources into a common format.
    
    Args:
        data: Property data from a specific source
        source: Source identifier (zillow, pacmls, etc.)
    
    Returns:
        Standardized property data dictionary
    """
    standardized = {
        "source": source,
        "external_id": data.get("id") or data.get("zpid") or data.get("listing_id") or data.get("property_id")
    }
    
    # Extract common fields with source-specific mappings
    if source == "zillow":
        standardized.update({
            "price": data.get("price"),
            "address_line1": data.get("streetAddress") or data.get("address"),
            "city": data.get("city"),
            "state": data.get("state"),
            "zipcode": data.get("zipcode"),
            "bedrooms": data.get("bedrooms"),
            "bathrooms": data.get("bathrooms"),
            "square_feet": data.get("livingArea") or data.get("sqft"),
            "lot_size": data.get("lotSize"),
            "year_built": data.get("yearBuilt"),
            "property_type": data.get("homeType") or data.get("propertyType"),
            "status": data.get("homeStatus") or data.get("status"),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "primary_image_url": data.get("imgSrc") or data.get("image_url"),
            "days_on_market": data.get("daysOnZillow") or data.get("days_on_market"),
            "raw_data": data
        })
    
    elif source == "realtor":
        standardized.update({
            "price": data.get("price"),
            "address_line1": data.get("address", {}).get("line") or data.get("address"),
            "city": data.get("address", {}).get("city"),
            "state": data.get("address", {}).get("state_code") or data.get("address", {}).get("state"),
            "zipcode": data.get("address", {}).get("postal_code") or data.get("address", {}).get("zip"),
            "bedrooms": data.get("beds") or data.get("bedrooms"),
            "bathrooms": data.get("baths") or data.get("bathrooms"),
            "square_feet": data.get("building_size", {}).get("size") or data.get("sqft"),
            "lot_size": data.get("lot_size", {}).get("size") or data.get("lot_sqft"),
            "year_built": data.get("year_built"),
            "property_type": data.get("prop_type") or data.get("property_type"),
            "status": data.get("status") or data.get("listing_status"),
            "latitude": data.get("address", {}).get("lat"),
            "longitude": data.get("address", {}).get("lon"),
            "primary_image_url": (data.get("photos") or [{}])[0].get("href") if data.get("photos") else None,
            "days_on_market": data.get("days_on_market"),
            "raw_data": data
        })
    
    elif source == "pacmls":
        standardized.update({
            "price": data.get("ListPrice") or data.get("Price"),
            "address_line1": data.get("UnparsedAddress") or data.get("Address"),
            "city": data.get("City"),
            "state": data.get("StateOrProvince"),
            "zipcode": data.get("PostalCode"),
            "bedrooms": data.get("BedroomsTotal") or data.get("Bedrooms"),
            "bathrooms": data.get("BathroomsFull") + (data.get("BathroomsHalf") or 0) / 2 if data.get("BathroomsFull") else data.get("Bathrooms"),
            "square_feet": data.get("LivingArea") or data.get("SquareFeet"),
            "lot_size": data.get("LotSizeArea") or data.get("LotSize"),
            "year_built": data.get("YearBuilt"),
            "property_type": data.get("PropertyType") or data.get("PropertySubType"),
            "status": data.get("MlsStatus") or data.get("Status"),
            "mls_number": data.get("ListingId") or data.get("MLSNumber"),
            "latitude": data.get("Latitude"),
            "longitude": data.get("Longitude"),
            "primary_image_url": (data.get("Media") or [{}])[0].get("MediaURL") if data.get("Media") else None,
            "days_on_market": data.get("DaysOnMarket") or data.get("CumulativeDaysOnMarket"),
            "listing_agent": data.get("ListAgentFullName") or data.get("ListingAgent"),
            "listing_office": data.get("ListOfficeName") or data.get("ListingOffice"),
            "raw_data": data
        })
    
    # Add additional source mappings as needed
    
    # Set default values for empty fields
    if not standardized.get("status"):
        standardized["status"] = "Unknown"
    
    return standardized