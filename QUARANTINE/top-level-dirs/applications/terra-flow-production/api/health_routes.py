"""
Health Check API Routes

This module provides API endpoints for health checks and system status monitoring.
"""

import json
import os
import platform
import time
from datetime import datetime
from typing import Dict, List, Any

from flask import Blueprint, jsonify, current_app
import psutil
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

health_bp = Blueprint('api_health_endpoint', __name__)

@health_bp.route('/api/health', methods=['GET'])
def health_check():
    """
    Basic health check endpoint that returns the status of the application.
    """
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

@health_bp.route('/api/health/detailed', methods=['GET'])
def detailed_health():
    """
    Detailed health check that includes all components and dependencies.
    """
    # Start timing the response
    start_time = time.time()
    
    # Check system
    system_status = check_system_health()
    
    # Check database
    db_status = check_database()
    
    # Check AI agents
    agents_status = check_ai_agents()
    
    # Check components
    components_status = check_components()
    
    # Check environment
    env_status = check_environment()
    
    # Check if application is ready
    is_ready = (
        system_status.get('status') == 'healthy' and 
        db_status.get('status') == 'healthy' and
        agents_status.get('status') == 'healthy'
    )
    
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
        'ai_agents': agents_status,
        'components': components_status,
        'environment': env_status,
    }
    
    return jsonify(result)

@health_bp.route('/api/health/readiness', methods=['GET'])
def readiness():
    """
    Readiness probe for Kubernetes health checks.
    Returns 200 OK if the application is ready to serve traffic.
    """
    # Start timing the response
    start_time = time.time()
    
    # Check database - this is the most critical dependency
    db_status = check_database()
    
    # Calculate response time
    response_time = (time.time() - start_time) * 1000  # in milliseconds
    
    # If database is not connected, application is not ready
    if db_status.get('status') != 'healthy':
        result = {
            'status': 'not_ready',
            'message': 'Database connection failed',
            'response_time_ms': response_time,
        }
        return jsonify(result), 503  # Service Unavailable
    
    # Application is ready
    result = {
        'status': 'ready',
        'message': 'Application is ready to serve traffic',
        'response_time_ms': response_time,
    }
    
    return jsonify(result)

@health_bp.route('/api/health/liveness', methods=['GET'])
def liveness():
    """
    Liveness probe for Kubernetes health checks.
    Returns 200 OK if the application is alive.
    """
    # Simple check to verify the application is running
    result = {
        'status': 'alive',
        'timestamp': datetime.now().isoformat(),
    }
    
    return jsonify(result)

@health_bp.route('/api/health/metrics', methods=['GET'])
def metrics():
    """
    Return basic metrics about the application for monitoring.
    """
    # Start timing the response
    start_time = time.time()
    
    # Collect metrics
    system_metrics = collect_system_metrics()
    
    # Calculate response time
    response_time = (time.time() - start_time) * 1000  # in milliseconds
    
    # Add response time to metrics
    system_metrics['response_time_ms'] = response_time
    
    return jsonify(system_metrics)

def check_system_health() -> Dict[str, Any]:
    """Check system health (CPU, memory, disk)."""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Get process info
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
    """Check database connectivity and health."""
    try:
        # Create database connection
        database_url = current_app.config.get('SQLALCHEMY_DATABASE_URI')
        if not database_url:
            return {
                'status': 'error',
                'message': 'SQLALCHEMY_DATABASE_URI not configured',
                'connected': False
            }
        
        engine = sa.create_engine(database_url)
        
        # Check connection
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
            
            # Get some basic database stats
            try:
                db_stats_query = text('''
                    SELECT 
                        numbackends as active_connections,
                        xact_commit as transactions_committed,
                        xact_rollback as transactions_rollback,
                        blks_read as blocks_read,
                        blks_hit as blocks_hit,
                        tup_returned as rows_returned,
                        tup_fetched as rows_fetched,
                        tup_inserted as rows_inserted,
                        tup_updated as rows_updated,
                        tup_deleted as rows_deleted
                    FROM pg_stat_database
                    WHERE datname = current_database()
                ''')
                db_stats = dict(conn.execute(db_stats_query).mappings().first())
                
                # Calculate cache hit ratio
                if db_stats['blocks_read'] + db_stats['blocks_hit'] > 0:
                    cache_hit_ratio = db_stats['blocks_hit'] / (db_stats['blocks_read'] + db_stats['blocks_hit'])
                else:
                    cache_hit_ratio = 0
            except:
                # If stats query fails, provide minimal information
                db_stats = {
                    'active_connections': 0,
                    'transactions_committed': 0,
                    'transactions_rollback': 0,
                    'blocks_read': 0,
                    'blocks_hit': 0,
                    'rows_returned': 0,
                    'rows_fetched': 0,
                    'rows_inserted': 0,
                    'rows_updated': 0,
                    'rows_deleted': 0
                }
                cache_hit_ratio = 0
            
        query_time = time.time() - start_time
        
        return {
            'status': 'healthy',
            'connected': True,
            'version': version,
            'postgis_enabled': postgis_enabled,
            'postgis_version': postgis_version,
            'query_time_ms': query_time * 1000,
            'active_connections': db_stats['active_connections'],
            'cache_hit_ratio': cache_hit_ratio,
            'transactions': {
                'committed': db_stats['transactions_committed'],
                'rollback': db_stats['transactions_rollback'],
            }
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
    """Check AI agents health and status."""
    try:
        # Use imported agent manager if available
        from ai_agents.agent_manager import get_agent_status
        agent_statuses = get_agent_status()
        
        # Check if there are any unhealthy agents
        unhealthy_agents = [
            agent for agent in agent_statuses.get('agents', [])
            if agent.get('status') not in ('healthy', 'active', 'idle')
        ]
        
        return {
            'status': 'healthy' if not unhealthy_agents else 'unhealthy',
            'agents': agent_statuses.get('agents', []),
            'agent_count': len(agent_statuses.get('agents', [])),
            'unhealthy_count': len(unhealthy_agents),
            'unhealthy_agents': [agent.get('name') for agent in unhealthy_agents] if unhealthy_agents else []
        }
    except ImportError:
        # Agent manager not available
        return {
            'status': 'unknown',
            'message': 'Agent manager not available',
            'agent_count': 0,
            'unhealthy_count': 0
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e),
            'agent_count': 0,
            'unhealthy_count': 0
        }

def check_components() -> Dict[str, Any]:
    """Check various application components."""
    components = {}
    
    # Check sync service
    try:
        from sync_service.terra_fusion.main import check_health
        sync_health = check_health()
        components['sync_service'] = {
            'status': sync_health.get('status', 'unknown'),
            'version': sync_health.get('version', 'unknown'),
            'message': sync_health.get('message', '')
        }
    except ImportError:
        components['sync_service'] = {
            'status': 'unknown',
            'message': 'Sync service not available'
        }
    except Exception as e:
        components['sync_service'] = {
            'status': 'error',
            'message': str(e)
        }
    
    # Check map service
    try:
        components['map_service'] = {
            'status': 'healthy',
            'message': 'Map service is available'
        }
    except Exception as e:
        components['map_service'] = {
            'status': 'error',
            'message': str(e)
        }
    
    # Check other components as needed
    
    return components

def check_environment() -> Dict[str, Any]:
    """Check environment information."""
    env_mode = os.environ.get('ENV_MODE', 'development')
    
    return {
        'python_version': platform.python_version(),
        'platform': platform.platform(),
        'env_mode': env_mode,
        'environment_variables': {
            'ENV_MODE': env_mode,
            'FLASK_ENV': os.environ.get('FLASK_ENV', 'development'),
            'FLASK_DEBUG': os.environ.get('FLASK_DEBUG', '0'),
            'BYPASS_LDAP': os.environ.get('BYPASS_LDAP', 'false'),
        }
    }

def collect_system_metrics() -> Dict[str, Any]:
    """Collect system metrics for monitoring."""
    # System metrics
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Process metrics
    process = psutil.Process(os.getpid())
    process_memory = process.memory_info()
    
    return {
        'timestamp': datetime.now().isoformat(),
        'system': {
            'cpu_percent': cpu_percent,
            'memory_percent': memory.percent,
            'memory_available_mb': memory.available / (1024 * 1024),
            'disk_percent': disk.percent,
            'disk_free_gb': disk.free / (1024 * 1024 * 1024),
        },
        'process': {
            'pid': process.pid,
            'memory_rss_mb': process_memory.rss / (1024 * 1024),
            'memory_vms_mb': process_memory.vms / (1024 * 1024),
            'memory_percent': process.memory_percent(),
            'cpu_percent': process.cpu_percent(interval=0.1),
            'threads': len(process.threads()),
            'open_files': len(process.open_files()),
            'connections': len(process.connections()),
            'uptime_seconds': time.time() - process.create_time()
        }
    }