#!/usr/bin/env python3
"""
TerraFusion Enterprise API Gateway
Advanced Microservices Architecture with Full Integration
PhD-Level Enterprise-Grade API Management
"""

from flask import Flask, request, jsonify, g
from flask_restx import Api, Resource, fields, Namespace
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import sqlite3
import redis
from functools import wraps
import uuid
import hashlib
import hmac
import base64

# Import our enterprise systems
from enterprise_integration_suite import enterprise_orchestrator, IntegrationConfig
from terrafusion_final import ai_orchestrator, TerraFusionCostEngine

# Advanced monitoring and metrics
import psutil
from prometheus_client import Counter, Histogram, Gauge, generate_latest

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api_gateway.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app with enterprise configuration
app = Flask(__name__)
app.config['SECRET_KEY'] = 'terrafusion-enterprise-api-gateway-2025'
app.config['JWT_SECRET_KEY'] = 'jwt-secret-terrafusion-enterprise'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=8)

# Enable CORS for cross-origin requests
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize JWT
jwt = JWTManager(app)

# Initialize rate limiting
limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["1000 per hour", "100 per minute"]
)

# Initialize Redis for caching (mock for now)
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_available = True
except:
    redis_client = None
    redis_available = False
    logger.warning("Redis not available - caching disabled")

# Initialize API with Swagger documentation
api = Api(
    app,
    version='1.0',
    title='TerraFusion Enterprise API Gateway',
    description='PhD-Level AI-Powered Property Valuation Platform API',
    doc='/api/docs/',
    prefix='/api'
)

# Prometheus metrics
REQUEST_COUNT = Counter('terrafusion_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('terrafusion_request_duration_seconds', 'Request duration')
ACTIVE_CONNECTIONS = Gauge('terrafusion_active_connections', 'Active connections')
AI_AGENT_UTILIZATION = Gauge('terrafusion_ai_agent_utilization', 'AI agent utilization')

# API Models for Swagger documentation
property_model = api.model('Property', {
    'parcel_id': fields.String(required=True, description='Unique parcel identifier'),
    'address': fields.String(required=True, description='Property address'),
    'latitude': fields.Float(description='Property latitude'),
    'longitude': fields.Float(description='Property longitude'),
    'building_type': fields.String(description='Type of building (SFR, CONDO, etc.)'),
    'square_feet': fields.Integer(description='Building square footage'),
    'year_built': fields.Integer(description='Year property was built'),
    'quality_grade': fields.String(description='Quality grade (LOW, MEDIUM, HIGH, PREMIUM)'),
    'condition_rating': fields.String(description='Condition rating (POOR, FAIR, AVERAGE, GOOD, EXCELLENT)')
})

valuation_request_model = api.model('ValuationRequest', {
    'property_data': fields.Nested(property_model, required=True),
    'analysis_type': fields.String(description='Type of analysis (comprehensive, valuation, market, etc.)'),
    'include_external_data': fields.Boolean(description='Include external data sources'),
    'generate_report': fields.Boolean(description='Generate comprehensive report'),
    'send_notifications': fields.Boolean(description='Send completion notifications')
})

# Authentication decorator
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return {'error': 'API key required'}, 401
        
        # Validate API key (implement your validation logic)
        if not validate_api_key(api_key):
            return {'error': 'Invalid API key'}, 401
        
        return f(*args, **kwargs)
    return decorated_function

def validate_api_key(api_key: str) -> bool:
    """Validate API key"""
    # Mock validation - implement real validation
    valid_keys = ['terrafusion-enterprise-key-2025', 'demo-api-key']
    return api_key in valid_keys

# Request metrics middleware
@app.before_request
def before_request():
    g.start_time = time.time()
    ACTIVE_CONNECTIONS.inc()

@app.after_request
def after_request(response):
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.endpoint or 'unknown',
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.observe(time.time() - g.start_time)
    ACTIVE_CONNECTIONS.dec()
    
    return response

# Caching decorator
def cache_response(timeout=300):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not redis_available:
                return f(*args, **kwargs)
            
            # Create cache key
            cache_key = f"{request.endpoint}:{hashlib.md5(str(request.args).encode()).hexdigest()}"
            
            # Try to get from cache
            cached_response = redis_client.get(cache_key)
            if cached_response:
                return json.loads(cached_response)
            
            # Execute function and cache result
            result = f(*args, **kwargs)
            redis_client.setex(cache_key, timeout, json.dumps(result))
            
            return result
        return decorated_function
    return decorator

# API Namespaces
auth_ns = api.namespace('auth', description='Authentication operations')
properties_ns = api.namespace('properties', description='Property management operations')
valuations_ns = api.namespace('valuations', description='Property valuation operations')
analytics_ns = api.namespace('analytics', description='Analytics and reporting operations')
integrations_ns = api.namespace('integrations', description='External system integrations')
system_ns = api.namespace('system', description='System monitoring and health')

# Authentication Routes
@auth_ns.route('/login')
class AuthLogin(Resource):
    @auth_ns.doc('user_login')
    @auth_ns.expect(api.model('LoginCredentials', {
        'username': fields.String(required=True),
        'password': fields.String(required=True)
    }))
    def post(self):
        """Authenticate user and return JWT token"""
        try:
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
            
            # Validate credentials (implement your authentication logic)
            if authenticate_user(username, password):
                access_token = create_access_token(
                    identity=username,
                    additional_claims={'role': get_user_role(username)}
                )
                
                return {
                    'access_token': access_token,
                    'token_type': 'bearer',
                    'expires_in': 28800,  # 8 hours
                    'user_info': {
                        'username': username,
                        'role': get_user_role(username)
                    }
                }, 200
            else:
                return {'error': 'Invalid credentials'}, 401
                
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return {'error': 'Authentication failed'}, 500

@auth_ns.route('/refresh')
class AuthRefresh(Resource):
    @auth_ns.doc('refresh_token')
    @jwt_required()
    def post(self):
        """Refresh JWT token"""
        current_user = get_jwt_identity()
        new_token = create_access_token(
            identity=current_user,
            additional_claims={'role': get_user_role(current_user)}
        )
        
        return {
            'access_token': new_token,
            'token_type': 'bearer',
            'expires_in': 28800
        }

# Property Management Routes
@properties_ns.route('')
class PropertyList(Resource):
    @properties_ns.doc('list_properties')
    @properties_ns.param('limit', 'Number of properties to return', type='integer')
    @properties_ns.param('offset', 'Offset for pagination', type='integer')
    @properties_ns.param('property_type', 'Filter by property type')
    @require_api_key
    @cache_response(timeout=600)
    def get(self):
        """Get list of properties with optional filtering"""
        try:
            limit = request.args.get('limit', 50, type=int)
            offset = request.args.get('offset', 0, type=int)
            property_type = request.args.get('property_type')
            
            # Get properties from database
            conn = sqlite3.connect('terrafusion_final.db')
            cursor = conn.cursor()
            
            query = 'SELECT * FROM properties'
            params = []
            
            if property_type:
                query += ' WHERE building_type = ?'
                params.append(property_type)
            
            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            # Get column names
            columns = [description[0] for description in cursor.description]
            
            # Convert to dictionaries
            properties = [dict(zip(columns, row)) for row in rows]
            
            # Get total count
            count_query = 'SELECT COUNT(*) FROM properties'
            if property_type:
                count_query += ' WHERE building_type = ?'
                cursor.execute(count_query, [property_type])
            else:
                cursor.execute(count_query)
            
            total_count = cursor.fetchone()[0]
            
            conn.close()
            
            return {
                'properties': properties,
                'pagination': {
                    'total': total_count,
                    'limit': limit,
                    'offset': offset,
                    'has_more': offset + limit < total_count
                }
            }
            
        except Exception as e:
            logger.error(f"Property list error: {e}")
            return {'error': 'Failed to retrieve properties'}, 500

@properties_ns.route('/<string:parcel_id>')
class PropertyDetail(Resource):
    @properties_ns.doc('get_property')
    @require_api_key
    @cache_response(timeout=300)
    def get(self, parcel_id):
        """Get detailed property information"""
        try:
            conn = sqlite3.connect('terrafusion_final.db')
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM properties WHERE parcel_id = ?', (parcel_id,))
            row = cursor.fetchone()
            
            if not row:
                return {'error': 'Property not found'}, 404
            
            columns = [description[0] for description in cursor.description]
            property_data = dict(zip(columns, row))
            
            # Get recent valuations
            cursor.execute('''
                SELECT * FROM valuations 
                WHERE property_id = ? 
                ORDER BY created_at DESC 
                LIMIT 5
            ''', (property_data['id'],))
            
            valuation_rows = cursor.fetchall()
            valuation_columns = [description[0] for description in cursor.description]
            valuations = [dict(zip(valuation_columns, row)) for row in valuation_rows]
            
            conn.close()
            
            return {
                'property': property_data,
                'recent_valuations': valuations
            }
            
        except Exception as e:
            logger.error(f"Property detail error: {e}")
            return {'error': 'Failed to retrieve property details'}, 500

# Valuation Routes
@valuations_ns.route('/comprehensive')
class ComprehensiveValuation(Resource):
    @valuations_ns.doc('comprehensive_valuation')
    @valuations_ns.expect(valuation_request_model)
    @require_api_key
    @limiter.limit("10 per minute")
    def post(self):
        """Execute comprehensive property valuation with AI orchestration"""
        try:
            data = request.get_json()
            property_data = data.get('property_data', {})
            analysis_type = data.get('analysis_type', 'comprehensive')
            include_external_data = data.get('include_external_data', False)
            generate_report = data.get('generate_report', False)
            
            # Execute AI orchestration
            result = ai_orchestrator.orchestrate_comprehensive_analysis(
                property_data,
                analysis_scope=analysis_type
            )
            
            # Include external data if requested
            if include_external_data:
                user_context = {
                    'user_id': 'api_user',
                    'enable_sap_integration': False,
                    'enable_salesforce_integration': False,
                    'send_notifications': False
                }
                
                integration_result = asyncio.run(
                    enterprise_orchestrator.execute_comprehensive_integration(
                        property_data, user_context
                    )
                )
                
                result['external_data'] = integration_result.get('external_data', {})
                result['integration_metrics'] = {
                    'execution_time': integration_result.get('execution_time', 0),
                    'data_sources': len(integration_result.get('external_data', {}))
                }
            
            # Generate comprehensive report if requested
            if generate_report:
                report = asyncio.run(
                    enterprise_orchestrator.document_processor.generate_comprehensive_report(result)
                )
                result['comprehensive_report'] = report
            
            # Store valuation result
            store_valuation_result(property_data, result)
            
            # Update metrics
            AI_AGENT_UTILIZATION.set(calculate_agent_utilization())
            
            return result
            
        except Exception as e:
            logger.error(f"Comprehensive valuation error: {e}")
            return {'error': 'Valuation failed', 'details': str(e)}, 500

@valuations_ns.route('/batch')
class BatchValuation(Resource):
    @valuations_ns.doc('batch_valuation')
    @valuations_ns.expect(api.model('BatchValuationRequest', {
        'properties': fields.List(fields.Nested(property_model), required=True),
        'analysis_type': fields.String(description='Type of analysis for all properties')
    }))
    @require_api_key
    @limiter.limit("5 per hour")
    def post(self):
        """Execute batch valuation for multiple properties"""
        try:
            data = request.get_json()
            properties = data.get('properties', [])
            analysis_type = data.get('analysis_type', 'comprehensive')
            
            if len(properties) > 100:
                return {'error': 'Maximum 100 properties per batch'}, 400
            
            batch_results = []
            
            # Process properties in parallel
            async def process_batch():
                tasks = []
                for prop in properties:
                    task = ai_orchestrator.orchestrate_comprehensive_analysis(
                        prop, analysis_scope=analysis_type
                    )
                    tasks.append(task)
                
                # Note: This is a simplified version - in production, you'd use proper async execution
                results = []
                for prop in properties:
                    result = ai_orchestrator.orchestrate_comprehensive_analysis(
                        prop, analysis_scope=analysis_type
                    )
                    results.append(result)
                
                return results
            
            # Execute batch processing
            batch_results = asyncio.run(process_batch()) if len(properties) <= 10 else [
                ai_orchestrator.orchestrate_comprehensive_analysis(prop, analysis_scope=analysis_type)
                for prop in properties
            ]
            
            # Store all results
            for i, result in enumerate(batch_results):
                store_valuation_result(properties[i], result)
            
            return {
                'batch_id': str(uuid.uuid4()),
                'total_properties': len(properties),
                'successful_valuations': len([r for r in batch_results if r.get('orchestration_success', False)]),
                'results': batch_results,
                'processing_time': sum(r.get('orchestration_time', 0) for r in batch_results)
            }
            
        except Exception as e:
            logger.error(f"Batch valuation error: {e}")
            return {'error': 'Batch valuation failed', 'details': str(e)}, 500

# Analytics Routes
@analytics_ns.route('/market-intelligence')
class MarketIntelligence(Resource):
    @analytics_ns.doc('market_intelligence')
    @analytics_ns.param('zip_code', 'ZIP code for market analysis')
    @analytics_ns.param('property_type', 'Property type filter')
    @require_api_key
    @cache_response(timeout=1800)  # Cache for 30 minutes
    def get(self):
        """Get comprehensive market intelligence"""
        try:
            zip_code = request.args.get('zip_code', '98501')
            property_type = request.args.get('property_type', 'all')
            
            # Get market trends from integration system
            market_data = asyncio.run(
                enterprise_orchestrator.data_connector.fetch_market_trends(zip_code)
            )
            
            # Add local market analysis
            local_analysis = get_local_market_analysis(zip_code, property_type)
            
            return {
                'market_data': market_data,
                'local_analysis': local_analysis,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Market intelligence error: {e}")
            return {'error': 'Failed to retrieve market intelligence'}, 500

@analytics_ns.route('/performance-dashboard')
class PerformanceDashboard(Resource):
    @analytics_ns.doc('performance_dashboard')
    @require_api_key
    def get(self):
        """Get comprehensive performance dashboard data"""
        try:
            # Get system performance
            performance_data = enterprise_orchestrator.performance_optimizer.monitor_system_performance()
            
            # Get AI agent status
            agent_status = ai_orchestrator.get_system_status()
            
            # Get recent activity
            recent_activity = get_recent_system_activity()
            
            return {
                'system_performance': performance_data,
                'ai_agent_status': agent_status,
                'recent_activity': recent_activity,
                'dashboard_updated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Performance dashboard error: {e}")
            return {'error': 'Failed to retrieve performance data'}, 500

# Integration Routes
@integrations_ns.route('/external-data')
class ExternalDataIntegration(Resource):
    @integrations_ns.doc('external_data_integration')
    @integrations_ns.expect(api.model('ExternalDataRequest', {
        'property_data': fields.Nested(property_model, required=True),
        'data_sources': fields.List(fields.String, description='List of data sources to include')
    }))
    @require_api_key
    @limiter.limit("20 per minute")
    def post(self):
        """Fetch external data for property analysis"""
        try:
            data = request.get_json()
            property_data = data.get('property_data', {})
            data_sources = data.get('data_sources', ['mls', 'county', 'census', 'market'])
            
            user_context = {
                'user_id': 'api_user',
                'enable_sap_integration': False,
                'enable_salesforce_integration': False,
                'send_notifications': False
            }
            
            # Execute integration
            integration_result = asyncio.run(
                enterprise_orchestrator.execute_comprehensive_integration(
                    property_data, user_context
                )
            )
            
            # Filter results based on requested data sources
            filtered_data = {}
            external_data = integration_result.get('external_data', {})
            
            for source in data_sources:
                if source == 'mls' and 'mls_data' in external_data:
                    filtered_data['mls_data'] = external_data['mls_data']
                elif source == 'county' and 'county_records' in external_data:
                    filtered_data['county_records'] = external_data['county_records']
                elif source == 'census' and 'census_data' in external_data:
                    filtered_data['census_data'] = external_data['census_data']
                elif source == 'market' and 'market_trends' in external_data:
                    filtered_data['market_trends'] = external_data['market_trends']
            
            return {
                'integration_id': integration_result.get('integration_id'),
                'external_data': filtered_data,
                'execution_time': integration_result.get('execution_time'),
                'data_sources_requested': data_sources,
                'data_sources_retrieved': list(filtered_data.keys())
            }
            
        except Exception as e:
            logger.error(f"External data integration error: {e}")
            return {'error': 'External data integration failed', 'details': str(e)}, 500

# System Monitoring Routes
@system_ns.route('/health')
class SystemHealth(Resource):
    @system_ns.doc('system_health')
    def get(self):
        """Get comprehensive system health status"""
        try:
            health_status = {
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'components': {
                    'api_gateway': {'status': 'healthy', 'response_time': 0.05},
                    'database': check_database_health(),
                    'ai_orchestrator': check_ai_orchestrator_health(),
                    'integration_system': check_integration_system_health(),
                    'cache': {'status': 'healthy' if redis_available else 'unavailable'},
                    'external_apis': check_external_api_health()
                },
                'metrics': {
                    'active_connections': ACTIVE_CONNECTIONS._value._value,
                    'total_requests': REQUEST_COUNT._value.sum(),
                    'ai_agent_utilization': AI_AGENT_UTILIZATION._value._value,
                    'uptime_hours': get_system_uptime()
                }
            }
            
            # Determine overall health
            component_statuses = [comp['status'] for comp in health_status['components'].values()]
            if 'unhealthy' in component_statuses:
                health_status['status'] = 'unhealthy'
            elif 'degraded' in component_statuses:
                health_status['status'] = 'degraded'
            
            return health_status
            
        except Exception as e:
            logger.error(f"Health check error: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }, 500

@system_ns.route('/metrics')
class SystemMetrics(Resource):
    @system_ns.doc('system_metrics')
    def get(self):
        """Get Prometheus metrics"""
        return generate_latest().decode('utf-8'), 200, {'Content-Type': 'text/plain'}

# Utility Functions
def authenticate_user(username: str, password: str) -> bool:
    """Authenticate user credentials"""
    try:
        conn = sqlite3.connect('terrafusion_final.db')
        cursor = conn.cursor()
        cursor.execute('SELECT password_hash FROM users WHERE username = ? AND is_active = 1', (username,))
        result = cursor.fetchone()
        conn.close()
        
        if result and check_password_hash(result[0], password):
            return True
        return False
    except:
        return False

def get_user_role(username: str) -> str:
    """Get user role"""
    try:
        conn = sqlite3.connect('terrafusion_final.db')
        cursor = conn.cursor()
        cursor.execute('SELECT role FROM users WHERE username = ?', (username,))
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result else 'user'
    except:
        return 'user'

def store_valuation_result(property_data: Dict, result: Dict):
    """Store valuation result in database"""
    try:
        conn = sqlite3.connect('terrafusion_final.db')
        cursor = conn.cursor()
        
        valuation_data = result.get('analysis_results', {}).get('valuation_analysis', {})
        
        cursor.execute('''
            INSERT INTO valuations (
                property_id, orchestration_id, valuation_method, rcn_value, 
                market_value, reconciled_value, confidence_score, analysis_scope,
                analysis_data, agent_id, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            None,  # property_id (for API calls)
            result.get('orchestration_id'),
            'API_COMPREHENSIVE',
            valuation_data.get('rcn_calculation', {}).get('final_rcn', 0),
            valuation_data.get('market_value_estimate', 0),
            valuation_data.get('reconciled_value', 0),
            result.get('confidence_score', 0.85),
            'api_comprehensive',
            json.dumps(result),
            result.get('agent_id'),
            1  # API user
        ))
        
        conn.commit()
        conn.close()
        
    except Exception as e:
        logger.error(f"Failed to store valuation result: {e}")

def calculate_agent_utilization() -> float:
    """Calculate AI agent utilization"""
    try:
        agent_status = ai_orchestrator.get_system_status()
        busy_agents = sum(1 for agent in agent_status['agents'].values() if agent.get('is_busy', False))
        total_agents = agent_status['total_agents']
        return busy_agents / total_agents if total_agents > 0 else 0
    except:
        return 0

def get_local_market_analysis(zip_code: str, property_type: str) -> Dict:
    """Get local market analysis from database"""
    try:
        conn = sqlite3.connect('terrafusion_final.db')
        cursor = conn.cursor()
        
        # Get recent valuations for market analysis
        query = '''
            SELECT AVG(market_value) as avg_value, COUNT(*) as count,
                   MIN(market_value) as min_value, MAX(market_value) as max_value
            FROM valuations v
            JOIN properties p ON v.property_id = p.id
            WHERE v.created_at > date('now', '-6 months')
        '''
        
        if property_type != 'all':
            query += ' AND p.building_type = ?'
            cursor.execute(query, (property_type,))
        else:
            cursor.execute(query)
        
        result = cursor.fetchone()
        conn.close()
        
        return {
            'average_value': result[0] or 0,
            'transaction_count': result[1] or 0,
            'value_range': {
                'min': result[2] or 0,
                'max': result[3] or 0
            },
            'analysis_period': '6 months',
            'zip_code': zip_code,
            'property_type': property_type
        }
        
    except Exception as e:
        logger.error(f"Local market analysis error: {e}")
        return {'error': str(e)}

def get_recent_system_activity() -> Dict:
    """Get recent system activity"""
    try:
        conn = sqlite3.connect('terrafusion_final.db')
        cursor = conn.cursor()
        
        # Get recent valuations
        cursor.execute('''
            SELECT COUNT(*) as count, AVG(confidence_score) as avg_confidence
            FROM valuations 
            WHERE created_at > datetime('now', '-24 hours')
        ''')
        
        recent_valuations = cursor.fetchone()
        
        # Get recent property additions
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM properties 
            WHERE created_at > datetime('now', '-24 hours')
        ''')
        
        recent_properties = cursor.fetchone()
        
        conn.close()
        
        return {
            'recent_valuations': {
                'count': recent_valuations[0] or 0,
                'average_confidence': recent_valuations[1] or 0
            },
            'recent_properties': recent_properties[0] or 0,
            'time_period': '24 hours'
        }
        
    except Exception as e:
        logger.error(f"Recent activity error: {e}")
        return {'error': str(e)}

def check_database_health() -> Dict:
    """Check database health"""
    try:
        conn = sqlite3.connect('terrafusion_final.db')
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        cursor.fetchone()
        conn.close()
        
        return {'status': 'healthy', 'response_time': 0.01}
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def check_ai_orchestrator_health() -> Dict:
    """Check AI orchestrator health"""
    try:
        status = ai_orchestrator.get_system_status()
        return {
            'status': 'healthy' if status['system_health'] == 'optimal' else 'degraded',
            'active_agents': status['active_agents'],
            'total_agents': status['total_agents']
        }
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def check_integration_system_health() -> Dict:
    """Check integration system health"""
    try:
        status = enterprise_orchestrator.get_integration_status()
        return {
            'status': status['system_status'],
            'available_integrations': len(status['available_integrations'])
        }
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def check_external_api_health() -> Dict:
    """Check external API health"""
    # Mock health check for external APIs
    return {
        'status': 'healthy',
        'apis_checked': ['MLS', 'County Records', 'Census'],
        'response_time': 0.25
    }

def get_system_uptime() -> float:
    """Get system uptime in hours"""
    try:
        boot_time = psutil.boot_time()
        uptime_seconds = time.time() - boot_time
        return uptime_seconds / 3600  # Convert to hours
    except:
        return 0

if __name__ == '__main__':
    logger.info("🚀 TerraFusion Enterprise API Gateway Starting...")
    logger.info(f"📊 Swagger Documentation: http://localhost:5002/api/docs/")
    logger.info(f"🔧 Health Check: http://localhost:5002/api/system/health")
    logger.info(f"📈 Metrics: http://localhost:5002/api/system/metrics")
    logger.info("🔒 API Authentication: X-API-Key header required")
    logger.info("🎯 Rate Limiting: 1000/hour, 100/minute per IP")
    
    app.run(
        host='0.0.0.0',
        port=5002,
        debug=False,
        threaded=True
    )

