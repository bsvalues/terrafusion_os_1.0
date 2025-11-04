"""
API endpoints for system monitoring, metrics, and reporting.
"""
import logging
import json
from datetime import datetime, timedelta, date
from flask import Blueprint, request, jsonify, current_app

from app import db
# Import models inside functions to avoid circular imports

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprints
monitoring_api = Blueprint('monitoring_api', __name__, url_prefix='/api/monitoring')
metrics_api = Blueprint('metrics_api', __name__, url_prefix='/api/metrics')
reports_api = Blueprint('reports_api', __name__, url_prefix='/api/reports')
alerts_api = Blueprint('alerts_api', __name__, url_prefix='/api/alerts')

# 
# System Metrics Endpoints
#

@metrics_api.route('/', methods=['POST'])
def record_metric():
    """Record a new system metric"""
    try:
        # Import models inside function to avoid circular imports
        from models import SystemMetric
        
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        metric_name = data.get('metric_name')
        metric_value = data.get('metric_value')
        metric_unit = data.get('metric_unit')
        category = data.get('category')
        component = data.get('component')
        
        if not metric_name or metric_value is None or not category or not component:
            return jsonify({
                "status": "error",
                "message": "Missing required fields: metric_name, metric_value, category, component"
            }), 400
        
        # Create new metric
        metric = SystemMetric(
            metric_name=metric_name,
            metric_value=float(metric_value),
            metric_unit=metric_unit,
            category=category,
            component=component
        )
        
        db.session.add(metric)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Metric recorded successfully",
            "metric": {
                "id": metric.id,
                "metric_name": metric.metric_name,
                "metric_value": metric.metric_value,
                "metric_unit": metric.metric_unit,
                "category": metric.category,
                "component": metric.component,
                "timestamp": metric.timestamp.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error recording metric: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@metrics_api.route('/', methods=['GET'])
def get_metrics():
    """Get system metrics with filtering options"""
    try:
        # Import models inside function to avoid circular imports
        from models import SystemMetric
        
        metric_name = request.args.get('metric_name')
        category = request.args.get('category')
        component = request.args.get('component')
        days = request.args.get('days', default=7, type=int)
        
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Build query
        query = SystemMetric.query.filter(SystemMetric.timestamp >= start_date)
        
        if metric_name:
            query = query.filter(SystemMetric.metric_name == metric_name)
        if category:
            query = query.filter(SystemMetric.category == category)
        if component:
            query = query.filter(SystemMetric.component == component)
            
        # Execute query with order by most recent first
        metrics = query.order_by(SystemMetric.timestamp.desc()).all()
        
        # Format result
        result = []
        for metric in metrics:
            result.append({
                "id": metric.id,
                "metric_name": metric.metric_name,
                "metric_value": metric.metric_value,
                "metric_unit": metric.metric_unit,
                "category": metric.category,
                "component": metric.component,
                "timestamp": metric.timestamp.isoformat()
            })
        
        return jsonify({
            "status": "success",
            "metrics": result
        })
        
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@metrics_api.route('/summary', methods=['GET'])
def get_metrics_summary():
    """Get summary of system metrics grouped by name/category/component"""
    try:
        # Import models inside function to avoid circular imports
        from models import SystemMetric
        
        group_by = request.args.get('group_by', default='metric_name')
        if group_by not in ['metric_name', 'category', 'component']:
            group_by = 'metric_name'
            
        days = request.args.get('days', default=7, type=int)
        
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Get metrics from the database
        metrics = SystemMetric.query.filter(SystemMetric.timestamp >= start_date).all()
        
        # Group and summarize metrics
        summary = {}
        for metric in metrics:
            key = getattr(metric, group_by)
            
            if key not in summary:
                summary[key] = {
                    'count': 0,
                    'total': 0,
                    'min': float('inf'),
                    'max': float('-inf'),
                    'latest': 0,
                    'latest_timestamp': None,
                    'units': set()
                }
            
            summary[key]['count'] += 1
            summary[key]['total'] += metric.metric_value
            summary[key]['min'] = min(summary[key]['min'], metric.metric_value)
            summary[key]['max'] = max(summary[key]['max'], metric.metric_value)
            
            if not summary[key]['latest_timestamp'] or metric.timestamp > summary[key]['latest_timestamp']:
                summary[key]['latest'] = metric.metric_value
                summary[key]['latest_timestamp'] = metric.timestamp
            
            if metric.metric_unit:
                summary[key]['units'].add(metric.metric_unit)
        
        # Format result
        result = []
        for key, data in summary.items():
            result.append({
                "key": key,
                "count": data['count'],
                "average": data['total'] / data['count'] if data['count'] > 0 else 0,
                "min": data['min'] if data['min'] != float('inf') else 0,
                "max": data['max'] if data['max'] != float('-inf') else 0,
                "latest": data['latest'],
                "latest_timestamp": data['latest_timestamp'].isoformat() if data['latest_timestamp'] else None,
                "units": list(data['units'])
            })
        
        return jsonify({
            "status": "success",
            "summary": result
        })
        
    except Exception as e:
        logger.error(f"Error getting metrics summary: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@metrics_api.route('/trend', methods=['GET'])
def get_metrics_trend():
    """Get trend data for a specific metric over time"""
    try:
        # Import models inside function to avoid circular imports
        from models import SystemMetric
        
        metric_name = request.args.get('metric_name')
        component = request.args.get('component')
        days = request.args.get('days', default=30, type=int)
        interval = request.args.get('interval', default='day')
        
        if not metric_name:
            return jsonify({
                "status": "error",
                "message": "metric_name parameter is required"
            }), 400
        
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Build query
        query = SystemMetric.query.filter(
            SystemMetric.timestamp >= start_date,
            SystemMetric.metric_name == metric_name
        )
        
        if component:
            query = query.filter(SystemMetric.component == component)
            
        # Execute query
        metrics = query.order_by(SystemMetric.timestamp.asc()).all()
        
        # Group metrics by interval
        trend_data = {}
        for metric in metrics:
            if interval == 'hour':
                key = metric.timestamp.strftime('%Y-%m-%d %H:00')
            elif interval == 'day':
                key = metric.timestamp.strftime('%Y-%m-%d')
            elif interval == 'week':
                # Calculate the week start date
                week_start = metric.timestamp - timedelta(days=metric.timestamp.weekday())
                key = week_start.strftime('%Y-%m-%d')
            elif interval == 'month':
                key = metric.timestamp.strftime('%Y-%m')
            else:
                key = metric.timestamp.strftime('%Y-%m-%d')
            
            if key not in trend_data:
                trend_data[key] = {
                    'values': [],
                    'total': 0,
                    'count': 0
                }
            
            trend_data[key]['values'].append(metric.metric_value)
            trend_data[key]['total'] += metric.metric_value
            trend_data[key]['count'] += 1
        
        # Format result
        result = []
        for key, data in sorted(trend_data.items()):
            result.append({
                "interval": key,
                "average": data['total'] / data['count'] if data['count'] > 0 else 0,
                "min": min(data['values']) if data['values'] else 0,
                "max": max(data['values']) if data['values'] else 0,
                "count": data['count']
            })
        
        return jsonify({
            "status": "success",
            "metric_name": metric_name,
            "component": component,
            "interval": interval,
            "trend": result
        })
        
    except Exception as e:
        logger.error(f"Error getting metrics trend: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# 
# API Usage Logging Endpoints
#

@metrics_api.route('/api-usage', methods=['POST'])
def record_api_usage():
    """Record API usage log (typically called by middleware)"""
    try:
        # Import models inside function to avoid circular imports
        from models import APIUsageLog
        
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        endpoint = data.get('endpoint')
        method = data.get('method')
        status_code = data.get('status_code')
        response_time = data.get('response_time')
        user_agent = data.get('user_agent')
        ip_address = data.get('ip_address')
        request_payload = data.get('request_payload')
        
        if not endpoint or not method or not status_code or response_time is None:
            return jsonify({
                "status": "error",
                "message": "Missing required fields: endpoint, method, status_code, response_time"
            }), 400
        
        # Create new API usage log
        log = APIUsageLog(
            endpoint=endpoint,
            method=method,
            status_code=int(status_code),
            response_time=float(response_time),
            user_agent=user_agent,
            ip_address=ip_address,
            request_payload=request_payload
        )
        
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "API usage logged successfully",
            "log_id": log.id
        })
        
    except Exception as e:
        logger.error(f"Error recording API usage: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@metrics_api.route('/api-usage', methods=['GET'])
def get_api_usage():
    """Get API usage logs with filtering options"""
    try:
        # Import models inside function to avoid circular imports
        from models import APIUsageLog
        
        endpoint = request.args.get('endpoint')
        method = request.args.get('method')
        status_code = request.args.get('status_code', type=int)
        days = request.args.get('days', default=7, type=int)
        
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Build query
        query = APIUsageLog.query.filter(APIUsageLog.timestamp >= start_date)
        
        if endpoint:
            query = query.filter(APIUsageLog.endpoint.like(f'%{endpoint}%'))
        if method:
            query = query.filter(APIUsageLog.method == method)
        if status_code:
            query = query.filter(APIUsageLog.status_code == status_code)
            
        # Execute query with order by most recent first
        logs = query.order_by(APIUsageLog.timestamp.desc()).all()
        
        # Format result
        result = []
        for log in logs:
            result.append({
                "id": log.id,
                "endpoint": log.endpoint,
                "method": log.method,
                "status_code": log.status_code,
                "response_time": log.response_time,
                "user_agent": log.user_agent,
                "ip_address": log.ip_address,
                "timestamp": log.timestamp.isoformat()
            })
        
        return jsonify({
            "status": "success",
            "logs": result
        })
        
    except Exception as e:
        logger.error(f"Error getting API usage logs: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@metrics_api.route('/api-usage/summary', methods=['GET'])
def get_api_usage_summary():
    """Get summary of API usage grouped by endpoint/method/status"""
    try:
        # Import models inside function to avoid circular imports
        from models import APIUsageLog
        
        group_by = request.args.get('group_by', default='endpoint')
        days = request.args.get('days', default=7, type=int)
        
        if group_by not in ['endpoint', 'method', 'status_code']:
            group_by = 'endpoint'
            
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Get API usage logs from the database
        logs = APIUsageLog.query.filter(APIUsageLog.timestamp >= start_date).all()
        
        # Group and summarize logs
        summary = {}
        for log in logs:
            key = getattr(log, group_by)
            
            if key not in summary:
                summary[key] = {
                    'count': 0,
                    'success_count': 0,
                    'error_count': 0,
                    'avg_response_time': 0,
                    'total_response_time': 0,
                    'methods': set() if group_by != 'method' else None,
                    'status_codes': set() if group_by != 'status_code' else None
                }
            
            summary[key]['count'] += 1
            
            if log.status_code < 400:
                summary[key]['success_count'] += 1
            else:
                summary[key]['error_count'] += 1
                
            summary[key]['total_response_time'] += log.response_time
            
            if group_by != 'method' and log.method:
                summary[key]['methods'].add(log.method)
                
            if group_by != 'status_code':
                summary[key]['status_codes'].add(log.status_code)
        
        # Format result
        result = []
        for key, data in summary.items():
            result.append({
                "key": key,
                "count": data['count'],
                "success_count": data['success_count'],
                "error_count": data['error_count'],
                "success_rate": (data['success_count'] / data['count']) * 100 if data['count'] > 0 else 0,
                "avg_response_time": data['total_response_time'] / data['count'] if data['count'] > 0 else 0,
                "methods": list(data['methods']) if data['methods'] is not None else None,
                "status_codes": list(data['status_codes']) if data['status_codes'] is not None else None
            })
        
        # Sort by count descending
        result.sort(key=lambda x: x['count'], reverse=True)
        
        return jsonify({
            "status": "success",
            "group_by": group_by,
            "summary": result
        })
        
    except Exception as e:
        logger.error(f"Error getting API usage summary: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@metrics_api.route('/api-usage/trend', methods=['GET'])
def get_api_usage_trend():
    """Get API usage trend data over time"""
    try:
        # Import models inside function to avoid circular imports
        from models import APIUsageLog
        
        days = request.args.get('days', default=30, type=int)
        interval = request.args.get('interval', default='day')
        
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Get API usage logs from the database
        logs = APIUsageLog.query.filter(APIUsageLog.timestamp >= start_date).all()
        
        # Group logs by interval
        trend_data = {}
        for log in logs:
            if interval == 'hour':
                key = log.timestamp.strftime('%Y-%m-%d %H:00')
            elif interval == 'day':
                key = log.timestamp.strftime('%Y-%m-%d')
            elif interval == 'week':
                # Calculate the week start date
                week_start = log.timestamp - timedelta(days=log.timestamp.weekday())
                key = week_start.strftime('%Y-%m-%d')
            elif interval == 'month':
                key = log.timestamp.strftime('%Y-%m')
            else:
                key = log.timestamp.strftime('%Y-%m-%d')
            
            if key not in trend_data:
                trend_data[key] = {
                    'total': 0,
                    'success': 0,
                    'error': 0,
                    'response_times': []
                }
            
            trend_data[key]['total'] += 1
            if log.status_code < 400:
                trend_data[key]['success'] += 1
            else:
                trend_data[key]['error'] += 1
            
            trend_data[key]['response_times'].append(log.response_time)
        
        # Format result
        result = []
        for key, data in sorted(trend_data.items()):
            avg_response_time = sum(data['response_times']) / len(data['response_times']) if data['response_times'] else 0
            error_rate = (data['error'] / data['total'] * 100) if data['total'] > 0 else 0
            
            result.append({
                "date": key,
                "requests": data['total'],
                "successful": data['success'],
                "errors": data['error'],
                "error_rate": error_rate,
                "avg_response_time": avg_response_time
            })
        
        return jsonify({
            "status": "success",
            "interval": interval,
            "trend": result
        })
        
    except Exception as e:
        logger.error(f"Error getting API usage trend: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@metrics_api.route('/api-usage/response-time-distribution', methods=['GET'])
def get_response_time_distribution():
    """Get distribution of API response times"""
    try:
        # Import models inside function to avoid circular imports
        from models import APIUsageLog
        
        days = request.args.get('days', default=7, type=int)
        buckets = request.args.get('buckets', default=10, type=int)
        
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Get API usage logs from the database
        logs = APIUsageLog.query.filter(APIUsageLog.timestamp >= start_date).all()
        
        if not logs:
            return jsonify({
                "status": "success",
                "distribution": []
            })
        
        # Extract response times
        response_times = [log.response_time for log in logs]
        
        # Determine range for the buckets
        min_time = min(response_times)
        max_time = max(response_times)
        
        # Create buckets
        bucket_size = (max_time - min_time) / buckets if max_time > min_time else 0.1
        
        # Initialize buckets
        distribution = []
        for i in range(buckets):
            bucket_min = min_time + i * bucket_size
            bucket_max = bucket_min + bucket_size
            
            # Count responses in this bucket
            count = sum(1 for t in response_times if bucket_min <= t < bucket_max)
            
            # Format for the last bucket to include max value
            if i == buckets - 1:
                count = sum(1 for t in response_times if bucket_min <= t <= bucket_max)
            
            # Add to distribution
            distribution.append({
                "range": f"{bucket_min:.2f}s - {bucket_max:.2f}s",
                "min": bucket_min,
                "max": bucket_max,
                "count": count,
                "percentage": (count / len(response_times) * 100) if response_times else 0
            })
        
        return jsonify({
            "status": "success",
            "distribution": distribution,
            "total_count": len(response_times),
            "min": min_time,
            "max": max_time,
            "avg": sum(response_times) / len(response_times) if response_times else 0
        })
        
    except Exception as e:
        logger.error(f"Error getting response time distribution: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@metrics_api.route('/api-usage/status-code-distribution', methods=['GET'])
def get_status_code_distribution():
    """Get distribution of API status codes"""
    try:
        # Import models inside function to avoid circular imports
        from models import APIUsageLog
        
        days = request.args.get('days', default=7, type=int)
        
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Get API usage logs from the database
        logs = APIUsageLog.query.filter(APIUsageLog.timestamp >= start_date).all()
        
        # Group by status code
        distribution = {}
        for log in logs:
            status_code = log.status_code
            
            # Group into common categories
            if status_code < 200:
                category = "1xx - Informational"
            elif status_code < 300:
                category = "2xx - Success"
            elif status_code < 400:
                category = "3xx - Redirection"
            elif status_code < 500:
                category = "4xx - Client Error"
            else:
                category = "5xx - Server Error"
            
            if category not in distribution:
                distribution[category] = {
                    'count': 0,
                    'status_codes': {}
                }
            
            distribution[category]['count'] += 1
            
            if status_code not in distribution[category]['status_codes']:
                distribution[category]['status_codes'][status_code] = 0
            
            distribution[category]['status_codes'][status_code] += 1
        
        # Format result
        result = []
        total_count = len(logs)
        
        for category, data in distribution.items():
            # Get individual status codes
            status_details = []
            for code, count in data['status_codes'].items():
                status_details.append({
                    "code": code,
                    "count": count,
                    "percentage": (count / total_count * 100) if total_count > 0 else 0
                })
            
            # Sort by count descending
            status_details.sort(key=lambda x: x['count'], reverse=True)
            
            result.append({
                "category": category,
                "count": data['count'],
                "percentage": (data['count'] / total_count * 100) if total_count > 0 else 0,
                "status_codes": status_details
            })
        
        # Sort by category
        result.sort(key=lambda x: x['category'])
        
        return jsonify({
            "status": "success",
            "distribution": result,
            "total_count": total_count
        })
        
    except Exception as e:
        logger.error(f"Error getting status code distribution: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@metrics_api.route('/api-usage/top-endpoints', methods=['GET'])
def get_top_endpoints():
    """Get top API endpoints by usage"""
    try:
        # Import models inside function to avoid circular imports
        from models import APIUsageLog
        
        days = request.args.get('days', default=7, type=int)
        limit = request.args.get('limit', default=10, type=int)
        
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Get API usage logs from the database
        logs = APIUsageLog.query.filter(APIUsageLog.timestamp >= start_date).all()
        
        # Group by endpoint
        endpoints = {}
        for log in logs:
            endpoint = log.endpoint
            
            if endpoint not in endpoints:
                endpoints[endpoint] = {
                    'count': 0,
                    'success_count': 0,
                    'error_count': 0,
                    'total_response_time': 0,
                    'methods': set()
                }
            
            endpoints[endpoint]['count'] += 1
            
            if log.status_code < 400:
                endpoints[endpoint]['success_count'] += 1
            else:
                endpoints[endpoint]['error_count'] += 1
                
            endpoints[endpoint]['total_response_time'] += log.response_time
            
            if log.method:
                endpoints[endpoint]['methods'].add(log.method)
        
        # Format result
        result = []
        for endpoint, data in endpoints.items():
            result.append({
                "endpoint": endpoint,
                "count": data['count'],
                "success_count": data['success_count'],
                "error_count": data['error_count'],
                "success_rate": (data['success_count'] / data['count']) * 100 if data['count'] > 0 else 0,
                "avg_response_time": data['total_response_time'] / data['count'] if data['count'] > 0 else 0,
                "methods": list(data['methods'])
            })
        
        # Sort by count descending and limit results
        result.sort(key=lambda x: x['count'], reverse=True)
        result = result[:limit]
        
        return jsonify({
            "status": "success",
            "endpoints": result
        })
        
    except Exception as e:
        logger.error(f"Error getting top endpoints: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# 
# AI Agent Metrics Endpoints
#

@metrics_api.route('/ai-agent', methods=['POST'])
def record_ai_agent_metrics():
    """Record AI agent metrics (typically updated daily)"""
    try:
        # Import models inside function to avoid circular imports
        from models import AIAgentMetrics
        from app import db
        
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        agent_type = data.get('agent_type')
        prompt_version_id = data.get('prompt_version_id')
        request_count = data.get('request_count', 0)
        average_response_time = data.get('average_response_time', 0.0)
        average_rating = data.get('average_rating', 0.0)
        token_usage = data.get('token_usage', 0)
        error_count = data.get('error_count', 0)
        metrics_date = data.get('date')
        
        if not agent_type:
            return jsonify({
                "status": "error",
                "message": "Missing required field: agent_type"
            }), 400
        
        # Parse date if provided, otherwise use today
        if metrics_date:
            try:
                metrics_date = datetime.strptime(metrics_date, '%Y-%m-%d').date()
            except ValueError:
                metrics_date = date.today()
        else:
            metrics_date = date.today()
        
        # Check if metrics already exist for this agent/date
        existing_metrics = AIAgentMetrics.query.filter(
            AIAgentMetrics.agent_type == agent_type,
            AIAgentMetrics.date == metrics_date
        ).first()
        
        if existing_metrics:
            # Update existing metrics
            existing_metrics.prompt_version_id = prompt_version_id
            existing_metrics.request_count = request_count
            existing_metrics.average_response_time = average_response_time
            existing_metrics.average_rating = average_rating
            existing_metrics.token_usage = token_usage
            existing_metrics.error_count = error_count
            
            db.session.commit()
            
            return jsonify({
                "status": "success",
                "message": "AI agent metrics updated successfully",
                "metrics_id": existing_metrics.id
            })
        else:
            # Create new metrics
            metrics = AIAgentMetrics(
                agent_type=agent_type,
                prompt_version_id=prompt_version_id,
                request_count=request_count,
                average_response_time=average_response_time,
                average_rating=average_rating,
                token_usage=token_usage,
                error_count=error_count,
                date=metrics_date
            )
            
            db.session.add(metrics)
            db.session.commit()
            
            return jsonify({
                "status": "success",
                "message": "AI agent metrics recorded successfully",
                "metrics_id": metrics.id
            })
        
    except Exception as e:
        logger.error(f"Error recording AI agent metrics: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@metrics_api.route('/ai-agent', methods=['GET'])
def get_ai_agent_metrics():
    """Get AI agent metrics with filtering options"""
    try:
        # Import models inside function to avoid circular imports
        from models import AIAgentMetrics
        
        agent_type = request.args.get('agent_type')
        prompt_version_id = request.args.get('prompt_version_id', type=int)
        days = request.args.get('days', default=30, type=int)
        
        # Calculate start date
        start_date = date.today() - timedelta(days=days)
        
        # Build query
        query = AIAgentMetrics.query.filter(AIAgentMetrics.date >= start_date)
        
        if agent_type:
            query = query.filter(AIAgentMetrics.agent_type == agent_type)
        if prompt_version_id:
            query = query.filter(AIAgentMetrics.prompt_version_id == prompt_version_id)
            
        # Execute query with order by date
        metrics = query.order_by(AIAgentMetrics.date.desc()).all()
        
        # Format result
        result = []
        for metric in metrics:
            result.append({
                "id": metric.id,
                "agent_type": metric.agent_type,
                "prompt_version_id": metric.prompt_version_id,
                "request_count": metric.request_count,
                "average_response_time": metric.average_response_time,
                "average_rating": metric.average_rating,
                "token_usage": metric.token_usage,
                "error_count": metric.error_count,
                "date": metric.date.isoformat()
            })
        
        return jsonify({
            "status": "success",
            "metrics": result
        })
        
    except Exception as e:
        logger.error(f"Error getting AI agent metrics: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@metrics_api.route('/ai-agent/daily-trend', methods=['GET'])
def get_ai_agent_daily_trend():
    """Get daily trend data for AI agents over time"""
    try:
        # Import models inside function to avoid circular imports
        from models import AIAgentMetrics
        
        days = request.args.get('days', default=30, type=int)
        agent_type = request.args.get('agent_type')
        
        # Calculate start date
        start_date = date.today() - timedelta(days=days)
        
        # Build query
        query = AIAgentMetrics.query.filter(AIAgentMetrics.date >= start_date)
        
        if agent_type:
            query = query.filter(AIAgentMetrics.agent_type == agent_type)
            
        # Get data ordered by date
        metrics = query.order_by(AIAgentMetrics.date.asc()).all()
        
        # Group metrics by date
        trend_data = {}
        for metric in metrics:
            date_key = metric.date.strftime('%Y-%m-%d')
            
            if date_key not in trend_data:
                trend_data[date_key] = {
                    'date': date_key,
                    'total_requests': 0,
                    'total_tokens': 0,
                    'avg_response_time': 0,
                    'avg_rating': 0,
                    'error_rate': 0,
                    'request_count': 0,
                    'response_time_total': 0,
                    'rating_total': 0,
                    'rating_count': 0,
                    'error_count': 0
                }
            
            # Aggregate data
            trend_data[date_key]['total_requests'] += metric.requests
            trend_data[date_key]['total_tokens'] += metric.tokens_used
            trend_data[date_key]['response_time_total'] += metric.avg_response_time * metric.requests
            trend_data[date_key]['request_count'] += metric.requests
            
            if metric.avg_rating > 0:
                trend_data[date_key]['rating_total'] += metric.avg_rating * metric.feedback_count
                trend_data[date_key]['rating_count'] += metric.feedback_count
            
            trend_data[date_key]['error_count'] += metric.error_count
        
        # Calculate averages for each day
        result = []
        for date_key, data in sorted(trend_data.items()):
            if data['request_count'] > 0:
                data['avg_response_time'] = data['response_time_total'] / data['request_count']
                data['error_rate'] = (data['error_count'] / data['request_count']) * 100
            
            if data['rating_count'] > 0:
                data['avg_rating'] = data['rating_total'] / data['rating_count']
            
            # Remove calculation fields
            del data['response_time_total']
            del data['request_count']
            del data['rating_total']
            del data['rating_count']
            
            result.append(data)
        
        return jsonify({
            "status": "success",
            "trend": result
        })
        
    except Exception as e:
        logger.error(f"Error getting AI agent daily trend: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@metrics_api.route('/ai-agent/summary', methods=['GET'])
def get_ai_agent_metrics_summary():
    """Get summary of AI agent metrics grouped by agent type"""
    try:
        days = request.args.get('days', default=30, type=int)
        
        # Calculate start date
        start_date = date.today() - timedelta(days=days)
        
        # Get AI agent metrics from the database
        metrics = AIAgentMetrics.query.filter(AIAgentMetrics.date >= start_date).all()
        
        # Group and summarize metrics by agent type
        summary = {}
        for metric in metrics:
            agent_type = metric.agent_type
            
            if agent_type not in summary:
                summary[agent_type] = {
                    'total_requests': 0,
                    'total_tokens': 0,
                    'total_errors': 0,
                    'avg_response_time': 0,
                    'avg_rating': 0,
                    'days_with_data': 0,
                    'ratings_sum': 0,
                    'response_time_sum': 0
                }
            
            summary[agent_type]['total_requests'] += metric.request_count
            summary[agent_type]['total_tokens'] += metric.token_usage
            summary[agent_type]['total_errors'] += metric.error_count
            
            if metric.request_count > 0:
                summary[agent_type]['days_with_data'] += 1
                summary[agent_type]['ratings_sum'] += metric.average_rating
                summary[agent_type]['response_time_sum'] += metric.average_response_time
        
        # Calculate averages
        for agent_type, data in summary.items():
            if data['days_with_data'] > 0:
                data['avg_rating'] = data['ratings_sum'] / data['days_with_data']
                data['avg_response_time'] = data['response_time_sum'] / data['days_with_data']
            
            # Remove temporary calculation fields
            del data['ratings_sum']
            del data['response_time_sum']
        
        # Format result
        result = []
        for agent_type, data in summary.items():
            result.append({
                "agent_type": agent_type,
                "total_requests": data['total_requests'],
                "total_tokens": data['total_tokens'],
                "total_errors": data['total_errors'],
                "error_rate": (data['total_errors'] / data['total_requests']) * 100 if data['total_requests'] > 0 else 0,
                "avg_response_time": data['avg_response_time'],
                "avg_rating": data['avg_rating'],
                "days_with_data": data['days_with_data']
            })
        
        # Sort by total requests descending
        result.sort(key=lambda x: x['total_requests'], reverse=True)
        
        return jsonify({
            "status": "success",
            "summary": result
        })
        
    except Exception as e:
        logger.error(f"Error getting AI agent metrics summary: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# 
# Monitoring Alert Endpoints
#

@alerts_api.route('/', methods=['POST'])
def create_alert():
    """Create a new monitoring alert"""
    try:
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        alert_type = data.get('alert_type')
        severity = data.get('severity')
        component = data.get('component')
        message = data.get('message')
        details = data.get('details')
        
        if not alert_type or not severity or not component or not message:
            return jsonify({
                "status": "error",
                "message": "Missing required fields: alert_type, severity, component, message"
            }), 400
        
        # Create new alert
        alert = MonitoringAlert(
            alert_type=alert_type,
            severity=severity,
            component=component,
            message=message,
            details=details,
            status='active'
        )
        
        db.session.add(alert)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Alert created successfully",
            "alert": {
                "id": alert.id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "component": alert.component,
                "message": alert.message,
                "status": alert.status,
                "created_at": alert.created_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error creating alert: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@alerts_api.route('/', methods=['GET'])
def get_alerts():
    """Get monitoring alerts with filtering options"""
    try:
        alert_type = request.args.get('alert_type')
        severity = request.args.get('severity')
        component = request.args.get('component')
        status = request.args.get('status', 'active')
        days = request.args.get('days', default=30, type=int)
        
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Build query
        query = MonitoringAlert.query.filter(MonitoringAlert.created_at >= start_date)
        
        if alert_type:
            query = query.filter(MonitoringAlert.alert_type == alert_type)
        if severity:
            query = query.filter(MonitoringAlert.severity == severity)
        if component:
            query = query.filter(MonitoringAlert.component == component)
        if status:
            query = query.filter(MonitoringAlert.status == status)
            
        # Execute query with order by created_at descending (newest first)
        alerts = query.order_by(MonitoringAlert.created_at.desc()).all()
        
        # Format result
        result = []
        for alert in alerts:
            result.append({
                "id": alert.id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "component": alert.component,
                "message": alert.message,
                "details": alert.details,
                "status": alert.status,
                "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
                "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
                "created_at": alert.created_at.isoformat()
            })
        
        return jsonify({
            "status": "success",
            "alerts": result
        })
        
    except Exception as e:
        logger.error(f"Error getting alerts: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@alerts_api.route('/<int:alert_id>/acknowledge', methods=['POST'])
def acknowledge_alert(alert_id):
    """Acknowledge an alert"""
    try:
        alert = MonitoringAlert.query.get(alert_id)
        
        if not alert:
            return jsonify({
                "status": "not_found",
                "message": f"Alert with ID {alert_id} not found"
            }), 404
        
        # Check if alert can be acknowledged
        if alert.status != 'active':
            return jsonify({
                "status": "error",
                "message": f"Cannot acknowledge alert with status '{alert.status}'"
            }), 400
        
        # Update alert status
        alert.status = 'acknowledged'
        alert.acknowledged_at = datetime.now()
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Alert {alert_id} acknowledged successfully",
            "alert": {
                "id": alert.id,
                "status": alert.status,
                "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None
            }
        })
        
    except Exception as e:
        logger.error(f"Error acknowledging alert {alert_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@alerts_api.route('/<int:alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id):
    """Resolve an alert"""
    try:
        alert = MonitoringAlert.query.get(alert_id)
        
        if not alert:
            return jsonify({
                "status": "not_found",
                "message": f"Alert with ID {alert_id} not found"
            }), 404
        
        # Check if alert can be resolved
        if alert.status == 'resolved':
            return jsonify({
                "status": "error",
                "message": "Alert is already resolved"
            }), 400
        
        # Update alert status
        alert.status = 'resolved'
        alert.resolved_at = datetime.now()
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Alert {alert_id} resolved successfully",
            "alert": {
                "id": alert.id,
                "status": alert.status,
                "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None
            }
        })
        
    except Exception as e:
        logger.error(f"Error resolving alert {alert_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@alerts_api.route('/summary', methods=['GET'])
def get_alerts_summary():
    """Get summary of alerts grouped by type/severity/component/status"""
    try:
        group_by = request.args.get('group_by', default='severity')
        days = request.args.get('days', default=30, type=int)
        
        if group_by not in ['alert_type', 'severity', 'component', 'status']:
            group_by = 'severity'
            
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Get alerts from the database
        alerts = MonitoringAlert.query.filter(MonitoringAlert.created_at >= start_date).all()
        
        # Group and summarize alerts
        summary = {}
        for alert in alerts:
            key = getattr(alert, group_by)
            
            if key not in summary:
                summary[key] = {
                    'count': 0,
                    'active': 0,
                    'acknowledged': 0,
                    'resolved': 0,
                    'high_severity': 0,
                    'medium_severity': 0,
                    'low_severity': 0
                }
            
            summary[key]['count'] += 1
            
            if alert.status == 'active':
                summary[key]['active'] += 1
            elif alert.status == 'acknowledged':
                summary[key]['acknowledged'] += 1
            elif alert.status == 'resolved':
                summary[key]['resolved'] += 1
                
            if alert.severity == 'high':
                summary[key]['high_severity'] += 1
            elif alert.severity == 'medium':
                summary[key]['medium_severity'] += 1
            elif alert.severity == 'low':
                summary[key]['low_severity'] += 1
        
        # Format result
        result = []
        for key, data in summary.items():
            result.append({
                "key": key,
                "count": data['count'],
                "active": data['active'],
                "acknowledged": data['acknowledged'],
                "resolved": data['resolved'],
                "high_severity": data['high_severity'],
                "medium_severity": data['medium_severity'],
                "low_severity": data['low_severity']
            })
        
        # Sort by count descending
        result.sort(key=lambda x: x['count'], reverse=True)
        
        return jsonify({
            "status": "success",
            "group_by": group_by,
            "summary": result
        })
        
    except Exception as e:
        logger.error(f"Error getting alerts summary: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# 
# Scheduled Report Endpoints
#

@reports_api.route('/', methods=['POST'])
def create_scheduled_report():
    """Create a new scheduled report"""
    try:
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        name = data.get('name')
        description = data.get('description')
        report_type = data.get('report_type')
        config = data.get('config')
        schedule_type = data.get('schedule_type')
        schedule_config = data.get('schedule_config')
        output_format = data.get('output_format')
        recipients = data.get('recipients')
        is_active = data.get('is_active', True)
        
        if not name or not report_type or not config or not schedule_type or not schedule_config or not output_format or not recipients:
            return jsonify({
                "status": "error",
                "message": "Missing required fields: name, report_type, config, schedule_type, schedule_config, output_format, recipients"
            }), 400
        
        # Convert config and schedule_config to JSON strings if they're dicts
        if isinstance(config, dict):
            config = json.dumps(config)
        if isinstance(schedule_config, dict):
            schedule_config = json.dumps(schedule_config)
        
        # Convert recipients to JSON string if it's a list
        if isinstance(recipients, list):
            recipients = json.dumps(recipients)
        
        # Create new scheduled report
        # Import models inside function to avoid circular imports
        from models import ModelsScheduledReport
        
        report = ModelsScheduledReport(
            name=name,
            description=description,
            report_type=report_type,
            config=config,
            schedule_type=schedule_type,
            schedule_config=schedule_config,
            output_format=output_format,
            recipients=recipients,
            is_active=is_active
        )
        
        db.session.add(report)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Scheduled report created successfully",
            "report": {
                "id": report.id,
                "name": report.name,
                "report_type": report.report_type,
                "schedule_type": report.schedule_type,
                "output_format": report.output_format,
                "is_active": report.is_active,
                "created_at": report.created_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error creating scheduled report: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@reports_api.route('/', methods=['GET'])
def get_scheduled_reports():
    """Get scheduled reports with optional filtering"""
    try:
        report_type = request.args.get('report_type')
        schedule_type = request.args.get('schedule_type')
        output_format = request.args.get('output_format')
        is_active = request.args.get('active', default=None, type=lambda v: v.lower() == 'true' if v else None)
        
        # Import models inside function to avoid circular imports
        from models import ModelsScheduledReport
        
        # Build query
        query = ModelsScheduledReport.query
        
        if report_type:
            query = query.filter(ModelsScheduledReport.report_type == report_type)
        if schedule_type:
            query = query.filter(ModelsScheduledReport.schedule_type == schedule_type)
        if output_format:
            query = query.filter(ModelsScheduledReport.output_format == output_format)
        if is_active is not None:
            query = query.filter(ModelsScheduledReport.is_active == is_active)
            
        # Execute query
        reports = query.order_by(ModelsScheduledReport.name).all()
        
        # Format result
        result = []
        for report in reports:
            # Parse recipients
            recipients = []
            if report.recipients:
                try:
                    recipients = json.loads(report.recipients)
                except:
                    pass
            
            result.append({
                "id": report.id,
                "name": report.name,
                "description": report.description,
                "report_type": report.report_type,
                "schedule_type": report.schedule_type,
                "output_format": report.output_format,
                "recipients_count": len(recipients),
                "is_active": report.is_active,
                "last_run": report.last_run.isoformat() if report.last_run else None,
                "created_at": report.created_at.isoformat()
            })
        
        return jsonify({
            "status": "success",
            "reports": result
        })
        
    except Exception as e:
        logger.error(f"Error getting scheduled reports: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@reports_api.route('/<int:report_id>', methods=['GET'])
def get_scheduled_report(report_id):
    """Get a specific scheduled report by ID"""
    try:
        # Import models inside function to avoid circular imports
        from models import ModelsScheduledReport
        
        report = ModelsScheduledReport.query.get(report_id)
        
        if not report:
            return jsonify({
                "status": "not_found",
                "message": f"Scheduled report with ID {report_id} not found"
            }), 404
        
        # Parse config, schedule_config and recipients
        config = {}
        schedule_config = {}
        recipients = []
        
        if report.config:
            try:
                config = json.loads(report.config)
            except:
                logger.warning(f"Error parsing config JSON for scheduled report {report_id}")
        
        if report.schedule_config:
            try:
                schedule_config = json.loads(report.schedule_config)
            except:
                logger.warning(f"Error parsing schedule_config JSON for scheduled report {report_id}")
        
        if report.recipients:
            try:
                recipients = json.loads(report.recipients)
            except:
                logger.warning(f"Error parsing recipients JSON for scheduled report {report_id}")
        
        return jsonify({
            "status": "success",
            "report": {
                "id": report.id,
                "name": report.name,
                "description": report.description,
                "report_type": report.report_type,
                "config": config,
                "schedule_type": report.schedule_type,
                "schedule_config": schedule_config,
                "output_format": report.output_format,
                "recipients": recipients,
                "is_active": report.is_active,
                "last_run": report.last_run.isoformat() if report.last_run else None,
                "created_at": report.created_at.isoformat(),
                "updated_at": report.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting scheduled report {report_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@reports_api.route('/<int:report_id>', methods=['PUT'])
def update_scheduled_report(report_id):
    """Update a scheduled report"""
    try:
        # Import models inside function to avoid circular imports
        from models import ModelsScheduledReport
        
        report = ModelsScheduledReport.query.get(report_id)
        
        if not report:
            return jsonify({
                "status": "not_found",
                "message": f"Scheduled report with ID {report_id} not found"
            }), 404
        
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        # Update fields
        if 'name' in data:
            report.name = data['name']
        if 'description' in data:
            report.description = data['description']
        if 'report_type' in data:
            report.report_type = data['report_type']
        if 'config' in data:
            config = data['config']
            if isinstance(config, dict):
                config = json.dumps(config)
            report.config = config
        if 'schedule_type' in data:
            report.schedule_type = data['schedule_type']
        if 'schedule_config' in data:
            schedule_config = data['schedule_config']
            if isinstance(schedule_config, dict):
                schedule_config = json.dumps(schedule_config)
            report.schedule_config = schedule_config
        if 'output_format' in data:
            report.output_format = data['output_format']
        if 'recipients' in data:
            recipients = data['recipients']
            if isinstance(recipients, list):
                recipients = json.dumps(recipients)
            report.recipients = recipients
        if 'is_active' in data:
            report.is_active = data['is_active']
        
        report.updated_at = datetime.now()
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Scheduled report updated successfully",
            "report": {
                "id": report.id,
                "name": report.name,
                "report_type": report.report_type,
                "schedule_type": report.schedule_type,
                "output_format": report.output_format,
                "is_active": report.is_active,
                "updated_at": report.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error updating scheduled report {report_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@reports_api.route('/<int:report_id>', methods=['DELETE'])
def delete_scheduled_report(report_id):
    """Delete a scheduled report"""
    try:
        # Import models inside function to avoid circular imports
        from models import ModelsScheduledReport
        
        report = ModelsScheduledReport.query.get(report_id)
        
        if not report:
            return jsonify({
                "status": "not_found",
                "message": f"Scheduled report with ID {report_id} not found"
            }), 404
        
        # Delete the report
        db.session.delete(report)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Scheduled report {report_id} deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting scheduled report {report_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@reports_api.route('/<int:report_id>/execute', methods=['POST'])
def execute_scheduled_report(report_id):
    """Execute a scheduled report on demand"""
    try:
        # Import models inside function to avoid circular imports
        from models import ModelsScheduledReport, ReportExecution
        
        report = ModelsScheduledReport.query.get(report_id)
        
        if not report:
            return jsonify({
                "status": "not_found",
                "message": f"Scheduled report with ID {report_id} not found"
            }), 404
        
        # Create a report execution record
        execution = ReportExecution(
            report_id=report.id,
            status='running',
            execution_start=datetime.now()
        )
        
        db.session.add(execution)
        db.session.commit()
        
        # In a real implementation, this would execute the report generation
        # For now, we'll simulate successful execution
        
        # Update execution
        execution.status = 'success'
        execution.execution_end = datetime.now()
        execution.output_file_path = f"/reports/{report.report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{report.output_format}"
        execution.delivery_status = 'sent'
        
        # Update report last run time
        report.last_run = datetime.now()
        
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"Report {report_id} executed successfully",
            "execution": {
                "id": execution.id,
                "status": execution.status,
                "execution_start": execution.execution_start.isoformat(),
                "execution_end": execution.execution_end.isoformat() if execution.execution_end else None,
                "output_file_path": execution.output_file_path
            }
        })
        
    except Exception as e:
        logger.error(f"Error executing scheduled report {report_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@reports_api.route('/executions', methods=['GET'])
def get_report_executions():
    """Get report execution history"""
    try:
        report_id = request.args.get('report_id', type=int)
        status = request.args.get('status')
        days = request.args.get('days', default=30, type=int)
        
        # Import models inside function to avoid circular imports
        from models import TerraReportExecution
        
        # Calculate start date
        start_date = datetime.now() - timedelta(days=days)
        
        # Build query
        query = TerraReportExecution.query.filter(TerraReportExecution.execution_start >= start_date)
        
        if report_id:
            query = query.filter(TerraReportExecution.report_id == report_id)
        if status:
            query = query.filter(TerraReportExecution.status == status)
            
        # Execute query with order by execution_start descending (newest first)
        executions = query.order_by(TerraReportExecution.execution_start.desc()).all()
        
        # Format result
        result = []
        for execution in executions:
            # Calculate duration if end time is available
            duration = None
            if execution.execution_end:
                duration = (execution.execution_end - execution.execution_start).total_seconds()
            
            result.append({
                "id": execution.id,
                "report_id": execution.report_id,
                "report_name": execution.report.name if execution.report else None,
                "status": execution.status,
                "execution_start": execution.execution_start.isoformat(),
                "execution_end": execution.execution_end.isoformat() if execution.execution_end else None,
                "duration_seconds": duration,
                "output_file_path": execution.output_file_path,
                "delivery_status": execution.delivery_status,
                "error": execution.error
            })
        
        return jsonify({
            "status": "success",
            "executions": result
        })
        
    except Exception as e:
        logger.error(f"Error getting report executions: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

#
# System Monitoring Dashboard Endpoints
#

@monitoring_api.route('/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """Get combined monitoring data for dashboard"""
    try:
        days = request.args.get('days', default=7, type=int)
        
        # Calculate start date for filtering
        start_date = datetime.now() - timedelta(days=days)
        start_date_day = date.today() - timedelta(days=days)
        
        # Get metrics summary
        system_metrics = SystemMetric.query.filter(SystemMetric.timestamp >= start_date).all()
        
        # Group metrics by component
        metrics_by_component = {}
        latest_metrics = {}
        
        for metric in system_metrics:
            component = metric.component
            
            # Track latest metrics by name
            metric_key = f"{metric.component}:{metric.metric_name}"
            if metric_key not in latest_metrics or metric.timestamp > latest_metrics[metric_key]['timestamp']:
                latest_metrics[metric_key] = {
                    'value': metric.metric_value,
                    'unit': metric.metric_unit,
                    'timestamp': metric.timestamp
                }
            
            # Add to component summary
            if component not in metrics_by_component:
                metrics_by_component[component] = {
                    'metric_count': 0,
                    'unique_metrics': set()
                }
            
            metrics_by_component[component]['metric_count'] += 1
            metrics_by_component[component]['unique_metrics'].add(metric.metric_name)
        
        # Get API usage data
        api_usage = APIUsageLog.query.filter(APIUsageLog.timestamp >= start_date).all()
        
        # Calculate API stats
        total_api_requests = len(api_usage)
        successful_requests = sum(1 for log in api_usage if log.status_code < 400)
        error_requests = total_api_requests - successful_requests
        
        # Group by date for time series
        api_usage_by_date = {}
        for log in api_usage:
            date_key = log.timestamp.strftime('%Y-%m-%d')
            if date_key not in api_usage_by_date:
                api_usage_by_date[date_key] = {
                    'total': 0,
                    'successful': 0,
                    'error': 0
                }
            
            api_usage_by_date[date_key]['total'] += 1
            if log.status_code < 400:
                api_usage_by_date[date_key]['successful'] += 1
            else:
                api_usage_by_date[date_key]['error'] += 1
        
        # Get AI metrics
        ai_metrics = AIAgentMetrics.query.filter(AIAgentMetrics.date >= start_date_day).all()
        
        # Calculate AI stats
        total_ai_requests = sum(metric.request_count for metric in ai_metrics)
        total_ai_errors = sum(metric.error_count for metric in ai_metrics)
        total_token_usage = sum(metric.token_usage for metric in ai_metrics)
        
        # Average values across all agents
        avg_response_time = 0
        avg_rating = 0
        metrics_count = len(ai_metrics)
        
        if metrics_count > 0:
            avg_response_time = sum(metric.average_response_time for metric in ai_metrics) / metrics_count
            avg_rating = sum(metric.average_rating for metric in ai_metrics) / metrics_count
        
        # Group by agent type
        ai_metrics_by_agent = {}
        for metric in ai_metrics:
            agent_type = metric.agent_type
            
            if agent_type not in ai_metrics_by_agent:
                ai_metrics_by_agent[agent_type] = {
                    'request_count': 0,
                    'error_count': 0,
                    'token_usage': 0,
                    'response_times': [],
                    'ratings': []
                }
            
            ai_metrics_by_agent[agent_type]['request_count'] += metric.request_count
            ai_metrics_by_agent[agent_type]['error_count'] += metric.error_count
            ai_metrics_by_agent[agent_type]['token_usage'] += metric.token_usage
            ai_metrics_by_agent[agent_type]['response_times'].append(metric.average_response_time)
            ai_metrics_by_agent[agent_type]['ratings'].append(metric.average_rating)
        
        # Calculate averages for each agent
        for agent_type, data in ai_metrics_by_agent.items():
            if len(data['response_times']) > 0:
                data['avg_response_time'] = sum(data['response_times']) / len(data['response_times'])
            else:
                data['avg_response_time'] = 0
                
            if len(data['ratings']) > 0:
                data['avg_rating'] = sum(data['ratings']) / len(data['ratings'])
            else:
                data['avg_rating'] = 0
                
            # Clean up temporary data
            del data['response_times']
            del data['ratings']
        
        # Get alert stats
        alerts = MonitoringAlert.query.filter(MonitoringAlert.created_at >= start_date).all()
        
        active_alerts = sum(1 for alert in alerts if alert.status == 'active')
        acknowledged_alerts = sum(1 for alert in alerts if alert.status == 'acknowledged')
        resolved_alerts = sum(1 for alert in alerts if alert.status == 'resolved')
        
        high_severity = sum(1 for alert in alerts if alert.severity == 'high')
        medium_severity = sum(1 for alert in alerts if alert.severity == 'medium')
        low_severity = sum(1 for alert in alerts if alert.severity == 'low')
        
        # Group alerts by component
        alerts_by_component = {}
        for alert in alerts:
            component = alert.component
            
            if component not in alerts_by_component:
                alerts_by_component[component] = {
                    'count': 0,
                    'active': 0,
                    'acknowledged': 0,
                    'resolved': 0
                }
            
            alerts_by_component[component]['count'] += 1
            if alert.status == 'active':
                alerts_by_component[component]['active'] += 1
            elif alert.status == 'acknowledged':
                alerts_by_component[component]['acknowledged'] += 1
            elif alert.status == 'resolved':
                alerts_by_component[component]['resolved'] += 1
        
        # Get report execution stats
        # Import renamed model
        from models import TerraReportExecution
        
        report_executions = TerraReportExecution.query.filter(TerraReportExecution.execution_start >= start_date).all()
        
        total_reports = len(report_executions)
        successful_reports = sum(1 for ex in report_executions if ex.status == 'success')
        failed_reports = sum(1 for ex in report_executions if ex.status == 'failure')
        
        # Group by report type
        reports_by_type = {}
        scheduled_reports = ScheduledReport.query.all()
        
        for report in scheduled_reports:
            report_executions_for_report = [ex for ex in report_executions if ex.report_id == report.id]
            
            reports_by_type[report.report_type] = reports_by_type.get(report.report_type, 0) + len(report_executions_for_report)
        
        # Assemble the complete dashboard data
        dashboard_data = {
            "system_overview": {
                "components_monitored": len(metrics_by_component),
                "total_metrics_recorded": len(system_metrics),
                "latest_metrics": [
                    {
                        "name": key.split(':')[1],
                        "component": key.split(':')[0],
                        "value": data['value'],
                        "unit": data['unit'],
                        "timestamp": data['timestamp'].isoformat()
                    }
                    for key, data in latest_metrics.items()
                ],
                "metrics_by_component": [
                    {
                        "component": component,
                        "metric_count": data['metric_count'],
                        "unique_metrics": len(data['unique_metrics'])
                    }
                    for component, data in metrics_by_component.items()
                ]
            },
            "api_usage": {
                "total_requests": total_api_requests,
                "successful_requests": successful_requests,
                "error_requests": error_requests,
                "success_rate": (successful_requests / total_api_requests * 100) if total_api_requests > 0 else 0,
                "daily_trend": [
                    {
                        "date": date_key,
                        "total": data['total'],
                        "successful": data['successful'],
                        "error": data['error']
                    }
                    for date_key, data in sorted(api_usage_by_date.items())
                ]
            },
            "ai_performance": {
                "total_requests": total_ai_requests,
                "total_errors": total_ai_errors,
                "error_rate": (total_ai_errors / total_ai_requests * 100) if total_ai_requests > 0 else 0,
                "total_token_usage": total_token_usage,
                "avg_response_time": avg_response_time,
                "avg_rating": avg_rating,
                "agent_stats": [
                    {
                        "agent_type": agent_type,
                        "request_count": data['request_count'],
                        "error_count": data['error_count'],
                        "error_rate": (data['error_count'] / data['request_count'] * 100) if data['request_count'] > 0 else 0,
                        "token_usage": data['token_usage'],
                        "avg_response_time": data['avg_response_time'],
                        "avg_rating": data['avg_rating']
                    }
                    for agent_type, data in ai_metrics_by_agent.items()
                ]
            },
            "alerts": {
                "total_alerts": len(alerts),
                "active_alerts": active_alerts,
                "acknowledged_alerts": acknowledged_alerts,
                "resolved_alerts": resolved_alerts,
                "high_severity": high_severity,
                "medium_severity": medium_severity,
                "low_severity": low_severity,
                "by_component": [
                    {
                        "component": component,
                        "count": data['count'],
                        "active": data['active'],
                        "acknowledged": data['acknowledged'],
                        "resolved": data['resolved']
                    }
                    for component, data in alerts_by_component.items()
                ]
            },
            "reports": {
                "total_executions": total_reports,
                "successful_executions": successful_reports,
                "failed_executions": failed_reports,
                "success_rate": (successful_reports / total_reports * 100) if total_reports > 0 else 0,
                "by_type": [
                    {
                        "report_type": report_type,
                        "count": count
                    }
                    for report_type, count in reports_by_type.items()
                ]
            }
        }
        
        return jsonify({
            "status": "success",
            "dashboard_data": dashboard_data
        })
        
    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@monitoring_api.route('/system-status', methods=['GET'])
def get_system_status():
    """Get current system status information"""
    try:
        # Get database connection status
        db_status = True
        db_message = "Connected"
        
        try:
            # Simple query to check database connection
            db.session.execute("SELECT 1").scalar()
        except Exception as e:
            db_status = False
            db_message = str(e)
        
        # Get API health
        api_health = {
            "status": "operational",
            "message": "All APIs are operational"
        }
        
        # Get last hour's metrics
        last_hour = datetime.now() - timedelta(hours=1)
        recent_metrics = SystemMetric.query.filter(SystemMetric.timestamp >= last_hour).all()
        
        # Get recent errors (last hour)
        recent_errors = APIUsageLog.query.filter(
            APIUsageLog.timestamp >= last_hour,
            APIUsageLog.status_code >= 500
        ).all()
        
        if len(recent_errors) > 10:
            api_health = {
                "status": "degraded",
                "message": f"Experiencing elevated error rates ({len(recent_errors)} server errors in the last hour)"
            }
        
        # Get active critical alerts
        critical_alerts = MonitoringAlert.query.filter(
            MonitoringAlert.status == 'active',
            MonitoringAlert.severity == 'high'
        ).all()
        
        system_status = "operational"
        if not db_status:
            system_status = "offline"
        elif critical_alerts or api_health["status"] == "degraded":
            system_status = "degraded"
        
        # Get current version information
        version_info = {
            "api_version": "1.0.0",
            "application_version": "1.0.0"
        }
        
        return jsonify({
            "status": "success",
            "system_status": {
                "overall_status": system_status,
                "database": {
                    "status": "operational" if db_status else "offline",
                    "message": db_message
                },
                "api": api_health,
                "critical_alerts": len(critical_alerts),
                "recent_metrics": len(recent_metrics),
                "timestamp": datetime.now().isoformat(),
                "uptime": "Unknown",  # In a real system, this would be calculated
                "version": version_info
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting system status: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@monitoring_api.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        "status": "operational",
        "timestamp": datetime.now().isoformat()
    })

def register_endpoints(app):
    """Register all monitoring and reporting API endpoints with the Flask app"""
    app.register_blueprint(monitoring_api)
    app.register_blueprint(metrics_api)
    app.register_blueprint(reports_api)
    app.register_blueprint(alerts_api)