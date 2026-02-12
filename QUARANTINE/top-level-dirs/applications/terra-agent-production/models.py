from app import db
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
import datetime

class Property(db.Model):
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
    
    assessments = relationship("Assessment", back_populates="property")
    sales = relationship("Sale", back_populates="property")
    
    def __repr__(self):
        return f"<Property {self.parcel_id}: {self.address}>"

class Assessment(db.Model):
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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    property = relationship("Property", back_populates="assessments")
    
    def __repr__(self):
        return f"<Assessment {self.id}: ${self.total_value:,.2f} ({self.assessment_year})>"

class Sale(db.Model):
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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    property = relationship("Property", back_populates="sales")
    
    def __repr__(self):
        return f"<Sale {self.id}: ${self.sale_price:,.2f} on {self.sale_date.strftime('%Y-%m-%d')}>"

class Neighborhood(db.Model):
    __tablename__ = 'neighborhoods'
    
    id = Column(Integer, primary_key=True)
    code = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    average_value = Column(Float)
    median_value = Column(Float)
    value_trend = Column(Float)
    total_properties = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f"<Neighborhood {self.code}: {self.name}>"

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    content = Column(Text, nullable=False)
    document_type = Column(String(50))
    source_url = Column(String(255))
    published_date = Column(DateTime)
    vector_id = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f"<Document {self.id}: {self.title}>"

class QueryLog(db.Model):
    __tablename__ = 'query_logs'
    
    id = Column(Integer, primary_key=True)
    query_text = Column(Text, nullable=False)
    query_type = Column(String(50))
    response_text = Column(Text)
    response_time = Column(Float)
    status = Column(String(50))
    error_message = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f"<QueryLog {self.id}: {self.query_type} - {self.status}>"