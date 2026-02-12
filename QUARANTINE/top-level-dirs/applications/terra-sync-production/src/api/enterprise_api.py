from flask import Blueprint, request, jsonify, g
from functools import wraps
import jwt
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import logging
from werkzeug.security import check_password_hash
import asyncio
from src.core.terrafusion_engine import create_terrafusion_engine

enterprise_api = Blueprint('enterprise_api', __name__, url_prefix='/api/v1')
logger = logging.getLogger(__name__)

core_engine = create_terrafusion_engine()

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
            
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            jwt.decode(token, os.environ.get('JWT_SECRET_KEY', 'fallback'), algorithms=['HS256'])
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
        return f(*args, **kwargs)
    return decorated_function

def require_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'user_role') or g.user_role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@enterprise_api.route('/auth/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    if username == 'admin' and password == 'admin123':
        token = jwt.encode({
            'user_id': 1,
            'username': username,
            'role': 'admin',
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, os.environ.get('JWT_SECRET_KEY', 'fallback'))
        
        return jsonify({
            'token': token,
            'user': {
                'id': 1,
                'username': username,
                'role': 'admin'
            },
            'expires_in': 86400
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@enterprise_api.route('/system/health', methods=['GET'])
def system_health():
    health_data = core_engine.get_system_health()
    return jsonify(health_data)

@enterprise_api.route('/system/metrics', methods=['GET'])
def system_metrics():
    metrics = core_engine.get_system_metrics()
    return jsonify({
        'cpu_usage': metrics.cpu_usage,
        'memory_usage': metrics.memory_usage,
        'disk_usage': metrics.disk_usage,
        'network_io': metrics.network_io,
        'active_connections': metrics.active_connections,
        'response_time_avg': metrics.response_time_avg,
        'error_rate': metrics.error_rate,
        'uptime_seconds': metrics.uptime_seconds,
        'timestamp': datetime.now().isoformat()
    })

@enterprise_api.route('/jobs', methods=['POST'])
@require_auth
def create_job():
    data = request.get_json()
    job_type = data.get('job_type', 'data_processing')
    priority = data.get('priority', 5)
    metadata = data.get('metadata', {})
    
    job_id = core_engine.create_processing_job(job_type, priority, metadata)
    
    return jsonify({
        'job_id': job_id,
        'status': 'created',
        'message': 'Job queued successfully'
    }), 201

@enterprise_api.route('/jobs/<job_id>', methods=['GET'])
@require_auth
def get_job_status(job_id):
    job_status = core_engine.get_job_status(job_id)
    
    if not job_status:
        return jsonify({'error': 'Job not found'}), 404
        
    return jsonify(job_status)

@enterprise_api.route('/jobs/<job_id>/execute', methods=['POST'])
@require_auth
def execute_job(job_id):
    async def run_job():
        return await core_engine.execute_job(job_id)
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        success = loop.run_until_complete(run_job())
        
        if success:
            return jsonify({'message': 'Job executed successfully'})
        else:
            return jsonify({'error': 'Job execution failed'}), 500
    except Exception as e:
        logger.error(f"Job execution error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@enterprise_api.route('/jobs', methods=['GET'])
@require_auth
def list_jobs():
    jobs = []
    for job_id in core_engine.active_jobs.keys():
        job_status = core_engine.get_job_status(job_id)
        if job_status:
            jobs.append(job_status)
    
    status_filter = request.args.get('status')
    if status_filter:
        jobs = [job for job in jobs if job['status'] == status_filter]
    
    return jsonify({
        'jobs': jobs,
        'total': len(jobs),
        'timestamp': datetime.now().isoformat()
    })

@enterprise_api.route('/counties/<county_id>/properties', methods=['GET'])
@require_auth
def get_county_properties(county_id):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 100)
    
    properties = []
    for i in range((page - 1) * per_page, page * per_page):
        properties.append({
            'property_id': f'{county_id}_PROP_{i:06d}',
            'parcel_number': f'P{i:08d}',
            'owner_name': f'Property Owner {i}',
            'address': f'{100 + i} Main Street',
            'assessed_value': 150000 + (i * 1000),
            'tax_amount': 1500 + (i * 10),
            'property_type': 'Residential',
            'last_updated': datetime.now().isoformat()
        })
    
    return jsonify({
        'properties': properties,
        'page': page,
        'per_page': per_page,
        'total_count': 50000,
        'county_id': county_id
    })

@enterprise_api.route('/counties/<county_id>/districts', methods=['GET'])
@require_auth
def get_county_districts(county_id):
    districts = [
        {
            'district_id': f'{county_id}_FIRE_001',
            'district_name': 'Central Fire District',
            'district_type': 'fire',
            'boundary_area_sqmi': 45.2,
            'population': 12500,
            'tax_rate': 0.0015
        },
        {
            'district_id': f'{county_id}_SCHOOL_001',
            'district_name': 'Unified School District',
            'district_type': 'school',
            'boundary_area_sqmi': 120.5,
            'population': 35000,
            'tax_rate': 0.0125
        },
        {
            'district_id': f'{county_id}_WATER_001',
            'district_name': 'Municipal Water District',
            'district_type': 'water',
            'boundary_area_sqmi': 85.7,
            'population': 28000,
            'tax_rate': 0.0008
        }
    ]
    
    return jsonify({
        'districts': districts,
        'county_id': county_id,
        'total_districts': len(districts)
    })

@enterprise_api.route('/analytics/performance', methods=['GET'])
@require_auth
def get_performance_analytics():
    days = request.args.get('days', 7, type=int)
    
    analytics = {
        'time_period_days': days,
        'processing_statistics': {
            'total_jobs_processed': 1248,
            'successful_jobs': 1201,
            'failed_jobs': 47,
            'success_rate': 96.2,
            'average_processing_time_seconds': 45.3
        },
        'system_performance': {
            'average_cpu_usage': 42.5,
            'average_memory_usage': 65.8,
            'average_response_time_ms': 125.7,
            'uptime_percentage': 99.95
        },
        'data_quality_metrics': {
            'records_validated': 485920,
            'validation_success_rate': 98.7,
            'data_completeness_score': 94.2,
            'accuracy_score': 97.1
        },
        'user_activity': {
            'active_sessions': 23,
            'api_requests_per_hour': 1520,
            'concurrent_users': 12
        }
    }
    
    return jsonify(analytics)

@enterprise_api.route('/counties/<county_id>/sync', methods=['POST'])
@require_auth
def trigger_county_sync(county_id):
    data = request.get_json() or {}
    sync_type = data.get('sync_type', 'full')
    
    job_metadata = {
        'county_id': county_id,
        'sync_type': sync_type,
        'requested_by': 'api_user',
        'sync_timestamp': datetime.now().isoformat()
    }
    
    job_id = core_engine.create_processing_job(
        job_type=f'county_sync_{sync_type}',
        priority=7,
        metadata=job_metadata
    )
    
    return jsonify({
        'sync_job_id': job_id,
        'county_id': county_id,
        'sync_type': sync_type,
        'status': 'initiated',
        'estimated_completion_minutes': 15 if sync_type == 'incremental' else 45
    }), 202

@enterprise_api.route('/export/<export_type>', methods=['POST'])
@require_auth
def create_export_job(export_type):
    if export_type not in ['geojson', 'csv', 'xml', 'json']:
        return jsonify({'error': 'Invalid export type'}), 400
    
    data = request.get_json() or {}
    filters = data.get('filters', {})
    
    export_metadata = {
        'export_type': export_type,
        'filters': filters,
        'requested_by': 'api_user',
        'export_timestamp': datetime.now().isoformat()
    }
    
    job_id = core_engine.create_processing_job(
        job_type=f'data_export_{export_type}',
        priority=6,
        metadata=export_metadata
    )
    
    return jsonify({
        'export_job_id': job_id,
        'export_type': export_type,
        'status': 'queued',
        'estimated_completion_minutes': 10
    }), 202

@enterprise_api.route('/admin/system/maintenance', methods=['POST'])
@require_auth
@require_admin
def trigger_maintenance():
    data = request.get_json() or {}
    maintenance_type = data.get('type', 'routine')
    
    if maintenance_type not in ['routine', 'database', 'cache', 'logs']:
        return jsonify({'error': 'Invalid maintenance type'}), 400
    
    job_id = core_engine.create_processing_job(
        job_type=f'maintenance_{maintenance_type}',
        priority=9,
        metadata={
            'maintenance_type': maintenance_type,
            'initiated_by': 'admin',
            'timestamp': datetime.now().isoformat()
        }
    )
    
    return jsonify({
        'maintenance_job_id': job_id,
        'type': maintenance_type,
        'status': 'scheduled'
    }), 202

@enterprise_api.route('/admin/system/cleanup', methods=['POST'])
@require_auth
@require_admin
def trigger_cleanup():
    core_engine.cleanup_completed_jobs(retention_hours=24)
    
    return jsonify({
        'message': 'System cleanup completed',
        'timestamp': datetime.now().isoformat()
    })

@enterprise_api.errorhandler(404)
def api_not_found(error):
    return jsonify({'error': 'API endpoint not found'}), 404

@enterprise_api.errorhandler(500)
def api_internal_error(error):
    logger.error(f"API internal error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500