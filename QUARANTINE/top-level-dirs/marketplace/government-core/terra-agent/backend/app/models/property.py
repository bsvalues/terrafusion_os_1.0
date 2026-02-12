"""
Property Model - Core property data model
Migrated from TerraAgent_PRODUCTION with full feature parity
"""

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Property(Base):
    __tablename__ = 'properties'
    
    id = Column(Integer, primary_key=True)
    parcel_id = Column(String(20), unique=True, nullable=False, index=True)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(2), nullable=False)
    zip_code = Column(String(10), nullable=False)
    neighborhood_code = Column(String(10), index=True)
    land_area = Column(Float)
    property_class = Column(String(50))
    year_built = Column(Integer)
    bedrooms = Column(Integer)
    bathrooms = Column(Float)
    total_area = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    assessments = relationship("Assessment", back_populates="property")
    sales = relationship("Sale", back_populates="property")
    
    def to_dict(self):
        """Convert property to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'parcel_id': self.parcel_id,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'neighborhood_code': self.neighborhood_code,
            'land_area': self.land_area,
            'property_class': self.property_class,
            'year_built': self.year_built,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'total_area': self.total_area,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Property {self.parcel_id}: {self.address}>'
