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
from dotenv import load_dotenv
from prometheus_client import start_http_server, Counter
from utils.auth import get_sql_connection_string
from utils.monitoring import setup_logging
from chains.levy_calculator import create_levy_chain
from chains.neighborhood_trends import create_neighborhood_trend_chain
from chains.debate_format import run_debate_format
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.utilities.sql_database import SQLDatabase

load_dotenv()

logger = setup_logging()

Base = declarative_base()

db = SQLAlchemy(model_class=Base)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "terra-fusion-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
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

try:
    conn_str = get_sql_connection_string()
    langchain_db = SQLDatabase.from_uri(conn_str)
    
    with app.app_context():
        db.create_all()
        logger.info("Database tables created successfully")
    
    try:
        from utils.rag import create_rag_chain, run_rag_query
        qa_chain = run_rag_query
        logger.info("RAG functionality initialized successfully")
    except Exception as e:
        logger.warning(f"RAG functionality disabled: {str(e)}")
        qa_chain = None
    
    levy_chain = create_levy_chain()
    logger.info("Levy calculator initialized successfully")
    
    try:
        trends_chain = create_neighborhood_trend_chain(conn_str)
        logger.info("Neighborhood trends initialized successfully")
    except Exception as e:
        logger.warning("Using fallback trends chain")
        trends_llm = ChatOpenAI(model="gpt-4o", temperature=0)
        trends_template = """You are analyzing neighborhood property trends. 
        However, you currently do not have access to the actual data. 
        Please inform the user that the neighborhood trend analysis is currently unavailable 
        and suggest they try a general property query instead."""
        
        trends_prompt = ChatPromptTemplate.from_template(trends_template)
        
        def trends_chain_func(inputs):
            result = trends_prompt | trends_llm
            response = result.invoke({})
            return {"answer": response.content}
        
        trends_chain = trends_chain_func
        logger.info("Fallback trends chain initialized")
    
except Exception as e:
    logger.critical(f"Failed to initialize core components: {str(e)}")
    langchain_db = None
    qa_chain = None
    levy_chain = None
    trends_chain = None

def start_metrics_server():
    start_http_server(8001)
    logger.info("Prometheus metrics server started on port 8001")

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
        for q_type in ["general", "rag", "levy", "trends", "dbatools"]:
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
    if not langchain_db:
        return jsonify({"error": "Database connection not initialized"}), 500
    
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
        if query_type == 'levy':
            parcel_record = data.get('parcel_record', {})
            tax_rate = data.get('tax_rate', 0.0)
            exemptions = data.get('exemptions', [])
            
            result = levy_chain({
                "parcel_record": parcel_record,
                "tax_rate": tax_rate,
                "exemptions": exemptions
            })
            response_text = result["text"]
            return jsonify({"result": response_text})
        
        elif query_type == 'trends':
            result = trends_chain({"question": query_text})
            response_text = result["answer"]
            return jsonify({"result": response_text})
        
        elif query_type == 'debate':
            result = run_debate_format(query_text)
            response_text = result
            return jsonify({"result": response_text})
        
        elif query_type == 'rag':
            if not qa_chain:
                return jsonify({"error": "RAG functionality not available"}), 500
            
            result = qa_chain({"question": query_text})
            response_text = result["answer"]
            return jsonify({"result": response_text})
        
        else:
            from pacs_agent import run_sql_query
            result = run_sql_query(query_text)
            response_text = result
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
            
            if not hasattr(query_log, 'status') or not query_log.status:
                query_log.status = "success"
                
            if response_text:
                query_log.response_text = response_text
                
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
    from utils.ollama_client import get_ollama_client
    
    ollama_client = get_ollama_client()
    ollama_available = ollama_client.is_available() if ollama_client else False
    
    if not ollama_available:
        logger.warning("Ollama service is not available")
    
    status = {
        "database": langchain_db is not None,
        "vector_store": True,
        "ai_model": True,
        "ollama_local": ollama_available,
        "levy_calculator": levy_chain is not None,
        "trends_analyzer": trends_chain is not None,
        "debate_format": True
    }
    
    logger.info(f"System status check: {status}")
    return jsonify(status)

if __name__ == '__main__':
    # Production-safe configuration - debug only enabled via environment variable
    debug_mode = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    app.run(host='0.0.0.0', port=5004, debug=debug_mode)