"""
Neighborhood Model - Neighborhood analytics and trends data model
Migrated from TerraAgent_PRODUCTION with full feature parity
"""

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Neighborhood(Base):
    __tablename__ = 'neighborhoods'
    
    id = Column(Integer, primary_key=True)
    code = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    average_value = Column(Float)
    median_value = Column(Float)
    value_trend = Column(Float)  # Percentage change
    total_properties = Column(Integer)
    avg_sqft = Column(Float)
    avg_age = Column(Float)
    price_per_sqft = Column(Float)
    market_activity = Column(String(50))  # High, Medium, Low
    appreciation_rate = Column(Float)  # Annual appreciation percentage
    school_district = Column(String(100))
    crime_rate = Column(Float)
    walkability_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def calculate_market_score(self):
        """Calculate a comprehensive market score for the neighborhood"""
        score = 0
        weights = {
            'value_trend': 0.3,
            'appreciation_rate': 0.25,
            'market_activity': 0.2,
            'walkability_score': 0.15,
            'price_per_sqft': 0.1
        }
        
        # Value trend scoring
        if self.value_trend:
            if self.value_trend > 5:
                score += weights['value_trend'] * 100
            elif self.value_trend > 0:
                score += weights['value_trend'] * 70
            else:
                score += weights['value_trend'] * 30
        
        # Appreciation rate scoring
        if self.appreciation_rate:
            if self.appreciation_rate > 3:
                score += weights['appreciation_rate'] * 100
            elif self.appreciation_rate > 0:
                score += weights['appreciation_rate'] * 70
            else:
                score += weights['appreciation_rate'] * 30
        
        # Market activity scoring
        if self.market_activity:
            activity_scores = {'high': 100, 'medium': 70, 'low': 40}
            score += weights['market_activity'] * activity_scores.get(
                self.market_activity.lower(), 50
            )
        
        # Walkability scoring
        if self.walkability_score:
            score += weights['walkability_score'] * self.walkability_score
        
        # Price per sqft (normalized - assumes $100-300 range)
        if self.price_per_sqft:
            normalized_price = min(100, max(0, (self.price_per_sqft - 100) / 2))
            score += weights['price_per_sqft'] * normalized_price
        
        return min(100, max(0, score))
    
    def get_trend_direction(self):
        """Get trend direction as string"""
        if not self.value_trend:
            return "stable"
        elif self.value_trend > 2:
            return "rising"
        elif self.value_trend < -2:
            return "declining"
        else:
            return "stable"
    
    def to_dict(self):
        """Convert neighborhood to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'description': self.description,
            'average_value': self.average_value,
            'median_value': self.median_value,
            'value_trend': self.value_trend,
            'total_properties': self.total_properties,
            'avg_sqft': self.avg_sqft,
            'avg_age': self.avg_age,
            'price_per_sqft': self.price_per_sqft,
            'market_activity': self.market_activity,
            'appreciation_rate': self.appreciation_rate,
            'school_district': self.school_district,
            'crime_rate': self.crime_rate,
            'walkability_score': self.walkability_score,
            'market_score': self.calculate_market_score(),
            'trend_direction': self.get_trend_direction(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Neighborhood {self.code}: {self.name}>'
