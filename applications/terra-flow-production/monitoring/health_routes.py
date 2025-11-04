"""
Health monitoring routes and utility functions
"""

import json
import os
import platform
import time
from datetime import datetime
from typing import Dict, Any

from flask import Blueprint, jsonify, current_app, render_template, request
import psutil
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

# Create a Blueprint for health monitoring routes
health_monitoring_bp = Blueprint('health_monitoring', __name__)

@health_monitoring_bp.route('/monitoring/health', methods=['GET'])
def health_check():
    """Basic health check endpoint"""
    # Start timing the response
    start_time = time.time()
    
    # Check system
    system_status = check_system_health()
    
    # Check database
    db_status = check_database()
    
    # Check if application is ready
    is_ready = system_status.get('status') == 'healthy' and db_status.get('status') == 'healthy'
    
    # Calculate response time
    response_time = (time.time() - start_time) * 1000  # in milliseconds
    
    # Compile result
    result = {
        'status': 'healthy' if is_ready else 'unhealthy',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'response_time_ms': response_time,
        'system': system_status,
        'database': db_status,
    }
    
    return jsonify(result)

@health_monitoring_bp.route('/monitoring/health/detailed', methods=['GET'])
def detailed_health():
    """Detailed health check including all components"""
    # Start timing the response
    start_time = time.time()
    
    # Check system
    system_status = check_system_health()
    
    # Check database
    db_status = check_database()
    
    # Check AI agents
    agents_status = check_ai_agents()
    
    # Check environment
    env_status = check_environment()
    
    # Calculate response time
    response_time = (time.time() - start_time) * 1000  # in milliseconds
    
    # Compile result
    result = {
        'status': 'healthy' if system_status.get('status') == 'healthy' and db_status.get('status') == 'healthy' else 'unhealthy',
        'timestamp': datetime.now().isoformat(),
        'response_time_ms': response_time,
        'system': system_status,
        'database': db_status,
        'ai_agents': agents_status,
        'environment': env_status
    }
    
    return jsonify(result)

@health_monitoring_bp.route('/monitoring/health/liveness', methods=['GET'])
def liveness():
    """Liveness probe for Kubernetes health checks"""
    return jsonify({
        'status': 'alive',
        'timestamp': datetime.now().isoformat()
    })

@health_monitoring_bp.route('/monitoring/health/readiness', methods=['GET'])
def readiness():
    """Readiness probe for Kubernetes health checks"""
    # Check database
    db_status = check_database()
    
    if db_status.get('status') != 'healthy':
        return jsonify({
            'status': 'not_ready',
            'message': 'Database connection failed'
        }), 503  # Service Unavailable
    
    return jsonify({
        'status': 'ready',
        'message': 'Application is ready to serve traffic'
    })

@health_monitoring_bp.route('/monitoring/metrics', methods=['GET'])
def metrics():
    """Return system metrics for monitoring"""
    # Collect metrics
    system_metrics = {
        'timestamp': datetime.now().isoformat(),
        'system': get_system_metrics(),
        'process': get_process_metrics()
    }
    
    return jsonify(system_metrics)

@health_monitoring_bp.route('/monitoring/dashboard', methods=['GET'])
def health_dashboard():
    """Health monitoring dashboard"""
    # Get detailed health data
    start_time = time.time()
    
    # Check system
    system_status = check_system_health()
    
    # Check database
    db_status = check_database()
    
    # Check AI agents
    agents_status = check_ai_agents()
    
    # Check environment
    env_status = check_environment()
    
    # Calculate response time
    response_time = (time.time() - start_time) * 1000  # in milliseconds
    
    # Compile result
    health_data = {
        'status': 'healthy' if system_status.get('status') == 'healthy' and db_status.get('status') == 'healthy' else 'unhealthy',
        'timestamp': datetime.now().isoformat(),
        'response_time_ms': response_time,
        'system': system_status,
        'database': db_status,
        'ai_agents': agents_status,
        'environment': env_status
    }
    
    return render_template('monitoring/dashboard.html', health_data=health_data)

def check_system_health() -> Dict[str, Any]:
    """Check system health (CPU, memory, disk)"""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Get process info if running
    process = psutil.Process(os.getpid())
    process_info = {
        'pid': process.pid,
        'memory_percent': process.memory_percent(),
        'cpu_percent': process.cpu_percent(interval=0.1),
        'threads': len(process.threads()),
        'uptime': time.time() - process.create_time()
    }
    
    return {
        'status': 'healthy' if cpu_percent < 80 and memory.percent < 80 and disk.percent < 80 else 'unhealthy',
        'cpu_percent': cpu_percent,
        'memory_percent': memory.percent,
        'memory_available_mb': memory.available / (1024 * 1024),
        'disk_percent': disk.percent,
        'disk_free_gb': disk.free / (1024 * 1024 * 1024),
        'process': process_info
    }

def check_database() -> Dict[str, Any]:
    """Check database connectivity and health"""
    try:
        # Get database URL
        database_url = current_app.config.get('SQLALCHEMY_DATABASE_URI')
        if not database_url:
            return {
                'status': 'error',
                'message': 'Database URL not configured',
                'connected': False
            }
        
        # Create engine and check connection
        engine = sa.create_engine(database_url)
        start_time = time.time()
        
        with engine.connect() as conn:
            # Execute a simple query
            result = conn.execute(text('SELECT 1'))
            assert result.scalar() == 1
            
            # Check PostgreSQL version
            version = conn.execute(text('SHOW server_version')).scalar()
            
            # Check if PostGIS is installed
            postgis_enabled = False
            try:
                postgis_version = conn.execute(text('SELECT PostGIS_Version()')).scalar()
                postgis_enabled = True
            except:
                postgis_version = None
        
        query_time = time.time() - start_time
        
        return {
            'status': 'healthy',
            'connected': True,
            'version': version,
            'postgis_enabled': postgis_enabled,
            'postgis_version': postgis_version,
            'query_time_ms': query_time * 1000
        }
    except SQLAlchemyError as e:
        return {
            'status': 'error',
            'message': str(e),
            'connected': False
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e),
            'connected': False
        }

def check_ai_agents() -> Dict[str, Any]:
    """Check AI agents health and status"""
    try:
        # Try to get agent statuses through agent manager
        agent_count = 0
        unhealthy_count = 0
        unhealthy_agents = []
        
        # Get agent info directly from running processes
        agent_processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            if any('agent.py' in arg for arg in proc.info['cmdline'] if arg):
                agent_processes.append({
                    'pid': proc.info['pid'],
                    'cmdline': ' '.join(proc.info['cmdline']),
                    'cpu_percent': proc.cpu_percent(interval=0.1),
                    'memory_percent': proc.memory_percent()
                })
                agent_count += 1
        
        return {
            'status': 'healthy' if agent_count > 0 else 'unknown',
            'agent_count': agent_count,
            'agent_processes': agent_processes
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def check_environment() -> Dict[str, Any]:
    """Check environment information"""
    env_mode = os.environ.get('ENV_MODE', 'development')
    
    return {
        'python_version': platform.python_version(),
        'platform': platform.platform(),
        'env_mode': env_mode,
        'environment_variables': {
            'ENV_MODE': env_mode,
            'FLASK_ENV': os.environ.get('FLASK_ENV', 'development'),
            'FLASK_DEBUG': os.environ.get('FLASK_DEBUG', '0')
        }
    }

def get_system_metrics() -> Dict[str, Any]:
    """Get system metrics"""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        'cpu_percent': cpu_percent,
        'memory_percent': memory.percent,
        'memory_available_mb': memory.available / (1024 * 1024),
        'disk_percent': disk.percent,
        'disk_free_gb': disk.free / (1024 * 1024 * 1024)
    }

def get_process_metrics() -> Dict[str, Any]:
    """Get process metrics"""
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    
    return {
        'pid': process.pid,
        'memory_rss_mb': memory_info.rss / (1024 * 1024),
        'memory_vms_mb': memory_info.vms / (1024 * 1024),
        'memory_percent': process.memory_percent(),
        'cpu_percent': process.cpu_percent(interval=0.1),
        'threads': len(process.threads()),
        'open_files': len(process.open_files()),
        'connections': len(process.connections()),
        'uptime_seconds': time.time() - process.create_time()
    }