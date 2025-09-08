"""
Sale Model - Property sale transaction data model
Migrated from TerraAgent_PRODUCTION with full feature parity
"""

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Sale(Base):
    __tablename__ = 'sales'
    
    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey('properties.id'), nullable=False)
    sale_date = Column(DateTime, nullable=False)
    sale_price = Column(Float, nullable=False)
    buyer_name = Column(String(255))
    seller_name = Column(String(255))
    transaction_type = Column(String(50))
    deed_type = Column(String(50))
    validation_flag = Column(Boolean, default=True)
    market_conditions = Column(String(100))
    financing_type = Column(String(50))
    days_on_market = Column(Integer)
    price_per_sqft = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    property = relationship("Property", back_populates="sales")
    
    def calculate_price_per_sqft(self, total_area=None):
        """Calculate price per square foot"""
        area = total_area or (self.property.total_area if self.property else None)
        if self.sale_price and area and area > 0:
            return self.sale_price / area
        return 0.0
    
    def is_valid_sale(self):
        """Determine if this is a valid market sale"""
        if not self.validation_flag:
            return False
        
        # Check for arm's length transaction indicators
        valid_transaction_types = ['market', 'conventional', 'arms_length']
        if self.transaction_type and self.transaction_type.lower() in valid_transaction_types:
            return True
            
        # Check for reasonable price range (can be configured)
        if self.sale_price and self.sale_price > 1000:  # Minimum reasonable price
            return True
            
        return False
    
    def to_dict(self):
        """Convert sale to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'property_id': self.property_id,
            'sale_date': self.sale_date.isoformat() if self.sale_date else None,
            'sale_price': self.sale_price,
            'buyer_name': self.buyer_name,
            'seller_name': self.seller_name,
            'transaction_type': self.transaction_type,
            'deed_type': self.deed_type,
            'validation_flag': self.validation_flag,
            'market_conditions': self.market_conditions,
            'financing_type': self.financing_type,
            'days_on_market': self.days_on_market,
            'price_per_sqft': self.price_per_sqft or self.calculate_price_per_sqft(),
            'is_valid_sale': self.is_valid_sale(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Sale {self.sale_date}: ${self.sale_price:,.2f}>'
