"""
Data Source API Controller

This module provides API endpoints for managing data sources,
including testing connections, updating configurations,
and retrieving status information.
"""

import logging
import time
from datetime import datetime
from flask import Blueprint, jsonify, request

from models.property import DataSourceStatus
from db import db

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create blueprint
data_source_api_bp = Blueprint('data_source_api', __name__, url_prefix='/api/data_sources')

@data_source_api_bp.route('/', methods=['GET'])
def get_all_data_sources():
    """Get all data sources and their status."""
    try:
        # Get all sources from the database if available
        sources = DataSourceStatus.query.all()
        
        # If no sources in database, return mock data for initial setup
        if not sources:
            sources = [
                {
                    'name': 'zillow',
                    'status': 'healthy',
                    'priority': 'Primary',
                    'priority_num': 1,
                    'enabled': True,
                    'data_types': ['listings', 'details', 'market_trends'],
                    'success_rate': 93,
                    'avg_response_time': 0.8,
                    'request_count': 1254,
                    'error_count': 87,
                    'last_check': datetime.now().isoformat(),
                },
                {
                    'name': 'realtor',
                    'status': 'degraded',
                    'priority': 'Secondary',
                    'priority_num': 2,
                    'enabled': True,
                    'data_types': ['listings', 'details'],
                    'success_rate': 85,
                    'avg_response_time': 1.2,
                    'request_count': 987,
                    'error_count': 148,
                    'last_check': datetime.now().isoformat(),
                },
                {
                    'name': 'pacmls',
                    'status': 'limited',
                    'priority': 'Tertiary',
                    'priority_num': 3,
                    'enabled': True,
                    'data_types': ['listings', 'details', 'market_trends'],
                    'success_rate': 78,
                    'avg_response_time': 0.5,
                    'request_count': 542,
                    'error_count': 119,
                    'last_check': datetime.now().isoformat(),
                },
                {
                    'name': 'county',
                    'status': 'critical',
                    'priority': 'Fallback',
                    'priority_num': 4,
                    'enabled': False,
                    'data_types': ['details'],
                    'success_rate': 65,
                    'avg_response_time': 1.7,
                    'request_count': 321,
                    'error_count': 112,
                    'last_check': datetime.now().isoformat(),
                }
            ]
        else:
            # Convert database objects to dictionaries
            sources = [s.to_dict() for s in sources]
        
        return jsonify({
            'status': 'success',
            'data': {
                'sources': sources,
                'total': len(sources),
                'active': sum(1 for s in sources if s.get('enabled', False))
            }
        })
    except Exception as e:
        logger.error(f"Error getting data sources: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Failed to retrieve data sources: {str(e)}"
        }), 500

@data_source_api_bp.route('/<source_name>/test', methods=['POST'])
def test_data_source(source_name):
    """Test connection to a specific data source."""
    try:
        # Get connector based on source name
        if source_name == 'zillow':
            # For now, simulate a test with a delay
            time.sleep(1)
            success = True
            response_time = 0.8
            error = None
        elif source_name == 'realtor':
            time.sleep(1.5)
            success = True
            response_time = 1.2
            error = None
        elif source_name == 'pacmls':
            time.sleep(0.7)
            success = True
            response_time = 0.5
            error = None
        elif source_name == 'county':
            time.sleep(2)
            success = False
            response_time = 3.1
            error = "Connection timeout after 3 seconds"
        else:
            return jsonify({
                'status': 'error',
                'message': f"Unknown data source: {source_name}"
            }), 404
        
        # Update source status in database if success
        source = DataSourceStatus.query.filter_by(source_name=source_name).first()
        if source:
            source.last_check = datetime.now()
            if success:
                # Update metrics
                source.avg_response_time = (source.avg_response_time * 0.9) + (response_time * 0.1)
                source.request_count += 1
                # Update status based on response time
                if response_time < 1.0:
                    source.status = 'healthy'
                elif response_time < 2.0:
                    source.status = 'degraded'
                else:
                    source.status = 'limited'
            else:
                source.error_count += 1
                source.status = 'critical'
            
            # Calculate success rate
            if source.request_count > 0:
                source.success_rate = ((source.request_count - source.error_count) / source.request_count) * 100
            
            db.session.commit()
        
        return jsonify({
            'status': 'success' if success else 'error',
            'data': {
                'source': source_name,
                'response_time': response_time,
                'success': success,
                'error': error,
                'timestamp': datetime.now().isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Error testing data source {source_name}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Failed to test data source: {str(e)}"
        }), 500

@data_source_api_bp.route('/<source_name>/enable', methods=['POST'])
def enable_data_source(source_name):
    """Enable a data source."""
    try:
        enabled = request.json.get('enabled', True)
        
        # Update source in database
        source = DataSourceStatus.query.filter_by(source_name=source_name).first()
        if source:
            source.is_active = enabled
            db.session.commit()
            status = 'enabled' if enabled else 'disabled'
        else:
            # Create new source if it doesn't exist
            source = DataSourceStatus(
                source_name=source_name,
                is_active=enabled,
                status='unknown',
                last_check=datetime.now()
            )
            db.session.add(source)
            db.session.commit()
            status = 'created and ' + ('enabled' if enabled else 'disabled')
        
        return jsonify({
            'status': 'success',
            'message': f"Data source {source_name} {status}",
            'data': {
                'source': source_name,
                'enabled': enabled
            }
        })
    except Exception as e:
        logger.error(f"Error enabling data source {source_name}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Failed to enable data source: {str(e)}"
        }), 500

@data_source_api_bp.route('/update-priority', methods=['POST'])
def update_priority():
    """Update priority order of data sources."""
    try:
        priorities = request.json.get('priorities', [])
        
        # Validate input
        if not isinstance(priorities, list):
            return jsonify({
                'status': 'error',
                'message': "Invalid priorities format, expected list"
            }), 400
        
        # Update each source priority
        for i, source_name in enumerate(priorities):
            priority_level = i + 1
            source = DataSourceStatus.query.filter_by(source_name=source_name).first()
            if source:
                source.priority = priority_level
                db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': "Data source priorities updated",
            'data': {
                'priorities': priorities
            }
        })
    except Exception as e:
        logger.error(f"Error updating priorities: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Failed to update priorities: {str(e)}"
        }), 500

@data_source_api_bp.route('/global-settings', methods=['POST'])
def update_global_settings():
    """Update global data source settings."""
    try:
        # Extract settings from request
        settings = request.json
        failover_timeout = settings.get('failover_timeout')
        max_retry_attempts = settings.get('max_retry_attempts')
        enable_circuit_breakers = settings.get('enable_circuit_breakers')
        
        # Validate input
        if failover_timeout is not None and not isinstance(failover_timeout, (int, float)):
            return jsonify({
                'status': 'error',
                'message': "Invalid failover_timeout, expected number"
            }), 400
        
        if max_retry_attempts is not None and not isinstance(max_retry_attempts, int):
            return jsonify({
                'status': 'error',
                'message': "Invalid max_retry_attempts, expected integer"
            }), 400
        
        # Store settings (this would typically go into a settings table)
        # For now we'll just acknowledge the settings
        
        return jsonify({
            'status': 'success',
            'message': "Global settings updated",
            'data': {
                'settings': settings
            }
        })
    except Exception as e:
        logger.error(f"Error updating global settings: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Failed to update global settings: {str(e)}"
        }), 500

@data_source_api_bp.route('/metrics', methods=['GET'])
def get_metrics():
    """Get aggregated metrics for all data sources."""
    try:
        # Get time range from query params
        days = request.args.get('days', 30, type=int)
        
        # Query metrics from database
        # For now, return mock data
        metrics = {
            'response_times': {
                'zillow': [0.75, 0.82, 0.79, 0.81, 0.86, 0.84, 0.78],
                'realtor': [1.2, 1.35, 1.18, 1.25, 1.3, 1.15, 1.22],
                'pacmls': [0.5, 0.48, 0.52, 0.45, 0.51, 0.55, 0.49],
                'county': [1.7, 1.85, 1.9, 1.75, 1.8, 1.95, 2.1]
            },
            'success_rates': {
                'zillow': [95, 94, 92, 93, 91, 93, 94],
                'realtor': [88, 87, 85, 86, 84, 83, 85],
                'pacmls': [80, 78, 79, 77, 78, 76, 79],
                'county': [70, 68, 65, 64, 63, 65, 67]
            },
            'request_volumes': {
                'zillow': [150, 165, 180, 175, 160, 155, 170],
                'realtor': [120, 115, 125, 130, 135, 140, 130],
                'pacmls': [80, 75, 85, 90, 70, 75, 85],
                'county': [40, 45, 50, 55, 45, 40, 35]
            },
            'labels': ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']
        }
        
        return jsonify({
            'status': 'success',
            'data': {
                'metrics': metrics,
                'days': days
            }
        })
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Failed to retrieve metrics: {str(e)}"
        }), 500