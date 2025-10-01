"""
TerraAgent Backend - MIT PhD Level Implementation
Production-grade Flask backend with complete property assessment capabilities
Migrated from TerraAgent_PRODUCTION with full feature parity
"""

import os
import sys
import logging
import datetime
import time
import threading
from flask import Flask, render_template, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from dotenv import load_dotenv
from prometheus_client import start_http_server, Counter

# Import our modules
from app.utils.auth import get_sql_connection_string
from app.utils.monitoring import setup_logging
from app.chains.levy_calculator import create_levy_chain
from app.chains.neighborhood_trends import create_neighborhood_trend_chain
from app.chains.debate_format import run_debate_format

try:
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_community.utilities.sql_database import SQLDatabase
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("LangChain not available - some AI features will be disabled")

load_dotenv()

logger = setup_logging()

Base = declarative_base()
db = SQLAlchemy(model_class=Base)

def create_app():
    """Application factory pattern for better testing and modularity"""
    app = Flask(__name__)
    
    # Configuration
    app.secret_key = os.environ.get("SESSION_SECRET", "terra-fusion-secret-key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///terraagent.db")
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # Enable CORS for frontend integration
    CORS(app, origins=["http://localhost:\${{TF_FRONTEND_PORT:-3000}}", "http://localhost:\${{TF_FRONTEND_PORT:-3000}}"])
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    from app.routes.property_routes import property_bp
    from app.routes.assessment_routes import assessment_bp
    from app.routes.analytics_routes import analytics_bp
    from app.routes.ai_routes import ai_bp
    
    app.register_blueprint(property_bp, url_prefix='/api/property')
    app.register_blueprint(assessment_bp, url_prefix='/api/assessment')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    
    # Create tables
    with app.app_context():
        db.create_all()
        logger.info("Database tables created successfully")
    
    return app

# Import models after db initialization
from app.models.property import Property
from app.models.assessment import Assessment
from app.models.sale import Sale
from app.models.neighborhood import Neighborhood
from app.models.document import Document
from app.models.query_log import QueryLog

# Prometheus metrics
QUERY_COUNTER = Counter('queries_total', 'Total queries processed', ['query_type'])

# Initialize LangChain if available
langchain_db = None
qa_chain = None

if LANGCHAIN_AVAILABLE:
    try:
        conn_str = get_sql_connection_string()
        langchain_db = SQLDatabase.from_uri(conn_str)
        
        try:
            from app.utils.rag import create_rag_chain, run_rag_query
            qa_chain = run_rag_query
            logger.info("RAG functionality initialized successfully")
        except ImportError:
            logger.warning("RAG functionality not available")
    except Exception as e:
        logger.error(f"Failed to initialize LangChain database: {str(e)}")

@app.route('/')
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        "status": "healthy",
        "service": "TerraAgent Backend",
        "version": "1.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "features": {
            "langchain": LANGCHAIN_AVAILABLE,
            "database": langchain_db is not None,
            "rag": qa_chain is not None
        }
    })

@app.route('/api/dashboard')
def dashboard():
    """Dashboard data endpoint"""
    try:
        # Get statistics
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
        
        return jsonify(dashboard_data)
        
    except Exception as e:
        logger.error(f"Error generating dashboard data: {str(e)}")
        return jsonify({"error": "Failed to generate dashboard data"}), 500

if __name__ == '__main__':
    # Start Prometheus metrics server
    try:
        prometheus_port = int(os.environ.get("PROMETHEUS_PORT", "8001"))
        start_http_server(prometheus_port)
        logger.info(f"Prometheus metrics server started on port {prometheus_port}")
    except Exception as e:
        logger.warning(f"Failed to start Prometheus server: {str(e)}")
    
    # Create and run app
    app = create_app()
    port = int(os.environ.get("PORT", "5001"))
    debug = os.environ.get("DEBUG", "False").lower() == "true"
    
    logger.info(f"Starting TerraAgent backend on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
