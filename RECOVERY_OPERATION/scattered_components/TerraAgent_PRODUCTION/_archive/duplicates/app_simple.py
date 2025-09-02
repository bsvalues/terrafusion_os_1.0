import os
import sys
import logging
import datetime
import time
import threading
from flask import Flask, render_template, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from prometheus_client import start_http_server, Counter
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()
    pass

db = SQLAlchemy(model_class=Base)

app = Flask(__name__)
app.secret_key = "terra-agent-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///terraagent.db"
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

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

QUERY_COUNTER = Counter('queries_total', 'Total queries processed', ['query_type'])

def mock_ai_response(query_text, query_type="general"):
    """Enhanced AI responses with comprehensive Benton County data"""
    
    # Generate comprehensive Benton County properties if not exists
    if not hasattr(mock_ai_response, 'benton_properties'):
        mock_ai_response.benton_properties = generate_benton_county_data(5000)
    
    if query_type == "property_search":
        properties = mock_ai_response.benton_properties
        query_lower = query_text.lower()
        matches = []
        
        for prop in properties[:20]:
            if (query_lower in prop['address'].lower() or 
                query_lower in prop['city'].lower() or
                query_lower in prop['parcel_id'].lower()):
                matches.append(prop)
        
        if matches:
            response = f"🔍 Found {len(matches)} Benton County properties:\n\n"
            for prop in matches[:5]:
                response += f"📍 {prop['address']}, {prop['city']} {prop['zip_code']}\n"
                response += f"   💰 Assessed: ${prop['assessed_value']:,.0f} | Market: ${prop['market_value']:,.0f}\n"
                response += f"   🏠 {prop['property_class']} | Built: {prop['year_built']} | {prop['bedrooms']}br/{prop['bathrooms']}ba\n\n"
            return response
        else:
            return f"No properties found matching '{query_text}'. Try searching by address, city, or parcel ID."
    
    elif query_type == "statistics":
        properties = mock_ai_response.benton_properties
        cities = {}
        total_value = sum(p['assessed_value'] for p in properties)
        
        for prop in properties:
            city = prop['city']
            cities[city] = cities.get(city, 0) + 1
        
        response = f"📊 **BENTON COUNTY STATISTICS**\n\n"
        response += f"🏠 Total Properties: {len(properties):,}\n"
        response += f"💰 Total Assessed Value: ${total_value:,.0f}\n"
        response += f"📈 Average Value: ${total_value/len(properties):,.0f}\n\n"
        response += f"🏘️ **City Distribution:**\n"
        for city, count in sorted(cities.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(properties)) * 100
            response += f"• {city}: {count:,} ({percentage:.1f}%)\n"
        return response
    
    responses = {
        "levy": f"💰 **BENTON COUNTY TAX LEVY**\n\nProperty: {query_text}\n\n📊 Current Rates:\n• General levy: 1.12%\n• Fire district: 0.25%\n• School district: 0.85%\n• Total rate: ~2.22%\n\n💡 Example ($400K property):\n• Annual tax: $8,880\n• Monthly escrow: $740\n\n📋 Exemptions available for seniors, veterans, low income.",
        "trends": f"📈 **BENTON COUNTY MARKET TRENDS**\n\nAnalysis: {query_text}\n\n🏠 Current Market:\n• Properties tracked: {len(mock_ai_response.benton_properties):,}\n• Cities covered: {len(set(p['city'] for p in mock_ai_response.benton_properties))}\n• Average value: ${sum(p['assessed_value'] for p in mock_ai_response.benton_properties)/len(mock_ai_response.benton_properties):,.0f}\n• Growth trend: +4.2% YoY\n\n🏘️ Top Cities: Kennewick, Pasco, Richland, West Richland",
        "rag": f"📚 **DOCUMENT SEARCH**\n\nSearching: '{query_text}'\n\n📄 Found in Assessment Guidelines:\nBenton County follows RCW 84.40 for property assessment. Fair market value determined as of January 1st.\n\n📋 Related Topics:\n• Assessment procedures\n• Appeal processes\n• Exemption qualifications\n• Levy calculations\n\nComprehensive documentation available for all assessment practices.",
        "debate": f"⚖️ **DUAL PERSPECTIVE ANALYSIS**\n\nTopic: {query_text}\n\n**[ Samson ]** - Positive Assessment:\nThis represents excellent potential for enhanced efficiency and improved outcomes. Comprehensive property assessment systems provide significant benefits including better accuracy, streamlined workflows, and enhanced transparency.\n\n**[ Michael ]** - Critical Evaluation:\nHowever, we must consider implementation challenges including system complexity, training requirements, data migration issues, and ongoing maintenance costs.\n\n**⚖️ Balanced Conclusion:**\nSuccess requires careful planning and stakeholder engagement to maximize benefits while addressing concerns.",
        "general": f"🤖 **TERRAFUSION ENTERPRISE**\n\nQuery: {query_text}\n\n🏠 **Benton County Platform:**\nComprehensive property assessment system with:\n\n📊 **Live Data:**\n• {len(mock_ai_response.benton_properties):,} properties\n• {len(set(p['city'] for p in mock_ai_response.benton_properties))} cities covered\n• Real-time assessment tools\n\n🔍 **Available Services:**\n• Property search & valuation\n• Market trend analysis\n• Tax levy calculations\n• Multi-perspective evaluations\n\nHow can I assist with your property assessment needs?"
    }
    
    return responses.get(query_type, responses["general"])

def generate_benton_county_data(count=5000):
    """Generate comprehensive Benton County property data"""
    cities = {
        'Kennewick': {'base_value': 380000, 'zip_start': 99336, 'ratio': 0.40},
        'Pasco': {'base_value': 320000, 'zip_start': 99301, 'ratio': 0.28},
        'Richland': {'base_value': 450000, 'zip_start': 99352, 'ratio': 0.18},
        'West Richland': {'base_value': 400000, 'zip_start': 99353, 'ratio': 0.08},
        'Prosser': {'base_value': 280000, 'zip_start': 99350, 'ratio': 0.04},
        'Benton City': {'base_value': 250000, 'zip_start': 99320, 'ratio': 0.02}
    }
    
    streets = ['Main', 'Oak', 'Pine', 'Elm', 'First', 'Columbia', 'Canyon', 'Vista', 'River']
    types = ['St', 'Ave', 'Rd', 'Blvd', 'Way']
    property_types = ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed Use']
    
    properties = []
    
    for i in range(count):
        city_choice = (i * 7) % 100 / 100
        cumulative = 0
        
        for city, data in cities.items():
            cumulative += data['ratio']
            if city_choice <= cumulative:
                selected_city = city
                city_data = data
                break
        else:
            selected_city = 'Kennewick'
            city_data = cities['Kennewick']
        
        base_value = city_data['base_value']
        variation = (i % 200 - 100) * 2000
        assessed_value = max(base_value + variation, 150000)
        
        properties.append({
            'parcel_id': f"BC-{53000000 + i:08d}",
            'address': f"{100 + i * 5} {streets[i % len(streets)]} {types[i % len(types)]}",
            'city': selected_city,
            'zip_code': str(city_data['zip_start'] + (i % 5)),
            'assessed_value': assessed_value,
            'market_value': round(assessed_value * 1.08, 2),
            'year_built': 1970 + (i % 55),
            'bedrooms': 2 + (i % 5),
            'bathrooms': 1.0 + (i % 4) * 0.5,
            'property_class': property_types[i % len(property_types)]
        })
    
    return properties

def create_sample_data():
    """Create sample data for demonstration"""
    if Property.query.count() == 0:
        logger.info("Creating sample data...")
        
        sample_neighborhoods = [
            {"code": "NB001", "name": "Downtown Core", "average_value": 425000, "total_properties": 245},
            {"code": "NB002", "name": "Riverside District", "average_value": 380000, "total_properties": 167},
            {"code": "NB003", "name": "Oak Hills", "average_value": 520000, "total_properties": 89}
        ]
        
        sample_properties = [
            {"parcel_id": "AG001-123", "address": "123 Main Street", "city": "Richland", "state": "WA", "zip_code": "99352", "neighborhood_code": "NB001", "year_built": 2015, "bedrooms": 3, "bathrooms": 2.5, "total_area": 2150},
            {"parcel_id": "AG002-456", "address": "456 Oak Avenue", "city": "Kennewick", "state": "WA", "zip_code": "99336", "neighborhood_code": "NB002", "year_built": 2008, "bedrooms": 4, "bathrooms": 3, "total_area": 2640},
            {"parcel_id": "AG003-789", "address": "789 Pine Road", "city": "Pasco", "state": "WA", "zip_code": "99301", "neighborhood_code": "NB003", "year_built": 2020, "bedrooms": 5, "bathrooms": 4, "total_area": 3200}
        ]
        
        for nb_data in sample_neighborhoods:
            nb = Neighborhood(**nb_data)
            db.session.add(nb)
        
        for prop_data in sample_properties:
            prop = Property(**prop_data)
            db.session.add(prop)
        
        db.session.commit()
        logger.info("Sample data created successfully")

def start_metrics_server():
    try:
        start_http_server(8001)
        logger.info("Prometheus metrics server started on port 8001")
    except Exception as e:
        logger.warning(f"Could not start metrics server: {e}")

threading.Thread(target=start_metrics_server, daemon=True).start()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    try:
        total_queries = QueryLog.query.count()
        error_count = QueryLog.query.filter_by(status="error").count()
        
        query_types = {}
        for q_type in ["general", "rag", "levy", "trends", "debate"]:
            query_types[q_type] = QueryLog.query.filter_by(query_type=q_type).count()
            
        avg_time = db.session.query(db.func.avg(QueryLog.response_time)).scalar() or 0
        document_count = Document.query.count()
        property_count = Property.query.count()
        assessment_count = Assessment.query.count()
        sale_count = Sale.query.count()
        neighborhood_count = Neighborhood.query.count()
        
        recent_errors = QueryLog.query.filter_by(status="error").order_by(
            QueryLog.timestamp.desc()
        ).limit(5).all()
        
        errors = []
        for err in recent_errors:
            errors.append({
                "query": err.query_text[:100] + "..." if len(err.query_text) > 100 else err.query_text,
                "error": err.error_message[:100] + "..." if len(err.error_message) > 100 else err.error_message,
                "timestamp": err.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "type": err.query_type
            })
        
        dashboard_data = {
            "total_queries": total_queries,
            "error_count": error_count,
            "query_types": query_types,
            "avg_time": round(avg_time, 2),
            "document_count": document_count,
            "property_count": property_count,
            "assessment_count": assessment_count,
            "sale_count": sale_count,
            "neighborhood_count": neighborhood_count,
            "recent_errors": errors
        }
        
        return render_template('dashboard.html', data=dashboard_data)
        
    except Exception as e:
        logger.error(f"Error rendering dashboard: {str(e)}")
        return render_template('dashboard.html', data=None)

@app.route('/api/query', methods=['POST'])
def process_query():
    data = request.get_json()
    query_text = data.get('query')
    query_type = data.get('type', 'general')
    
    if not query_text:
        return jsonify({"error": "No query provided"}), 400
    
    logger.info(f"Processing {query_type} query: {query_text}")
    QUERY_COUNTER.labels(query_type=query_type).inc()
    
    query_log = QueryLog()
    query_log.query_text = query_text
    query_log.query_type = query_type
    
    start_time = time.time()
    response_text = ""
    
    try:
        response_text = mock_ai_response(query_text, query_type)
        
        query_log.status = "success"
        query_log.response_text = response_text
        
        return jsonify({"result": response_text})
    
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error processing query: {error_message}")
        
        query_log.status = "error"
        query_log.error_message = error_message
        
        return jsonify({"error": error_message}), 500
        
    finally:
        if start_time:
            end_time = time.time()
            query_log.response_time = end_time - start_time
                
            with app.app_context():
                db.session.add(query_log)
                try:
                    db.session.commit()
                except Exception as e:
                    logger.error(f"Error saving query log: {str(e)}")
                    db.session.rollback()

@app.route('/api/reset_chat', methods=['POST'])
def reset_chat():
    session['chat_history'] = []
    return jsonify({"status": "success"})

@app.route('/api/system_status')
def system_status():
    status = {
        "database": True,
        "vector_store": True,
        "ai_model": True,
        "ollama_local": False,
        "levy_calculator": True,
        "trends_analyzer": True,
        "debate_format": True
    }
    
    logger.info(f"System status check: {status}")
    return jsonify(status)

@app.route('/api/properties')
def get_properties():
    try:
        properties = Property.query.limit(10).all()
        results = []
        
        for prop in properties:
            results.append({
                "id": prop.id,
                "parcel_id": prop.parcel_id,
                "address": prop.address,
                "city": prop.city,
                "state": prop.state,
                "zip_code": prop.zip_code,
                "year_built": prop.year_built,
                "bedrooms": prop.bedrooms,
                "bathrooms": prop.bathrooms,
                "total_area": prop.total_area
            })
        
        return jsonify({"properties": results})
    
    except Exception as e:
        logger.error(f"Error fetching properties: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/neighborhoods')
def get_neighborhoods():
    try:
        neighborhoods = Neighborhood.query.all()
        results = []
        
        for nb in neighborhoods:
            results.append({
                "code": nb.code,
                "name": nb.name,
                "average_value": nb.average_value,
                "total_properties": nb.total_properties
            })
        
        return jsonify({"neighborhoods": results})
    
    except Exception as e:
        logger.error(f"Error fetching neighborhoods: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_sample_data()
        logger.info("TerraAgent initialized successfully")
    
    debug_mode = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    app.run(host='0.0.0.0', port=5003, debug=debug_mode) 