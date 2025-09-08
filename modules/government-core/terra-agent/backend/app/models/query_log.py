"""
QueryLog Model - Query tracking and performance metrics
Migrated from TerraAgent_PRODUCTION with full feature parity
"""

from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class QueryLog(Base):
    __tablename__ = 'query_logs'
    
    id = Column(Integer, primary_key=True)
    query_text = Column(Text, nullable=False)
    query_type = Column(String(50))  # 'general', 'rag', 'levy', 'trends', 'dbatools'
    response_text = Column(Text)
    response_time = Column(Float)  # Response time in seconds
    status = Column(String(50))  # 'success', 'error', 'timeout'
    error_message = Column(Text)
    user_session = Column(String(100))
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(Text)
    language_model = Column(String(100))  # Model used for processing
    tokens_used = Column(Integer)  # Tokens consumed
    cost = Column(Float)  # API cost if applicable
    confidence_score = Column(Float)  # AI confidence in response
    feedback_rating = Column(Integer)  # User feedback (1-5)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    def calculate_performance_score(self):
        """Calculate overall performance score for this query"""
        score = 0
        
        # Response time scoring (lower is better)
        if self.response_time:
            if self.response_time < 1:
                score += 30
            elif self.response_time < 3:
                score += 20
            elif self.response_time < 5:
                score += 10
        
        # Status scoring
        if self.status == 'success':
            score += 40
        elif self.status == 'error':
            score += 0
        
        # Confidence scoring
        if self.confidence_score:
            score += self.confidence_score * 20
        
        # User feedback scoring
        if self.feedback_rating:
            score += (self.feedback_rating / 5) * 10
        
        return min(100, score)
    
    def get_query_category(self):
        """Categorize the query for analytics"""
        query_lower = self.query_text.lower()
        
        if any(word in query_lower for word in ['property', 'parcel', 'address']):
            return 'property_search'
        elif any(word in query_lower for word in ['assessment', 'value', 'tax']):
            return 'assessment_inquiry'
        elif any(word in query_lower for word in ['sale', 'price', 'market']):
            return 'market_analysis'
        elif any(word in query_lower for word in ['neighborhood', 'area', 'district']):
            return 'neighborhood_analysis'
        elif any(word in query_lower for word in ['levy', 'mill', 'rate']):
            return 'levy_calculation'
        else:
            return 'general_inquiry'
    
    def to_dict(self):
        """Convert query log to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'query_text': self.query_text,
            'query_type': self.query_type,
            'query_category': self.get_query_category(),
            'response_text': self.response_text,
            'response_time': self.response_time,
            'status': self.status,
            'error_message': self.error_message,
            'user_session': self.user_session,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'language_model': self.language_model,
            'tokens_used': self.tokens_used,
            'cost': self.cost,
            'confidence_score': self.confidence_score,
            'feedback_rating': self.feedback_rating,
            'performance_score': self.calculate_performance_score(),
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
    
    def __repr__(self):
        return f'<QueryLog {self.query_type}: {self.status} ({self.response_time:.2f}s)>'
