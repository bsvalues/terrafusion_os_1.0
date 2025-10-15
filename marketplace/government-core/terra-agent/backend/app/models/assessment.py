"""
Assessment Model - Property assessment data model
Migrated from TerraAgent_PRODUCTION with full feature parity
"""

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Assessment(Base):
    __tablename__ = 'assessments'
    
    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey('properties.id'), nullable=False)
    assessment_year = Column(Integer, nullable=False)
    land_value = Column(Float, nullable=False)
    improvement_value = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)
    assessment_date = Column(DateTime, nullable=False)
    assessor_id = Column(Integer)
    exemptions = Column(Text)
    tax_rate = Column(Float)
    levy_code = Column(String(10))
    mill_rate = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    property = relationship("Property", back_populates="assessments")
    
    def calculate_tax(self):
        """Calculate property tax based on total value and tax rate"""
        if self.total_value and self.tax_rate:
            return self.total_value * (self.tax_rate / 100)
        return 0.0
    
    def calculate_levy(self):
        """Calculate levy amount based on mill rate"""
        if self.total_value and self.mill_rate:
            return (self.total_value / 1000) * self.mill_rate
        return 0.0
    
    def to_dict(self):
        """Convert assessment to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'property_id': self.property_id,
            'assessment_year': self.assessment_year,
            'land_value': self.land_value,
            'improvement_value': self.improvement_value,
            'total_value': self.total_value,
            'assessment_date': self.assessment_date.isoformat() if self.assessment_date else None,
            'assessor_id': self.assessor_id,
            'exemptions': self.exemptions,
            'tax_rate': self.tax_rate,
            'levy_code': self.levy_code,
            'mill_rate': self.mill_rate,
            'calculated_tax': self.calculate_tax(),
            'calculated_levy': self.calculate_levy(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Assessment {self.assessment_year}: ${self.total_value:,.2f}>'
