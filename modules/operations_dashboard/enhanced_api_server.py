#!/usr/bin/env python3
"""
Enhanced TerraFusion Operations Dashboard API Server
Provides comprehensive monitoring and control capabilities
"""

from flask import Flask, jsonify, render_template, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import threading
import logging
import os
from datetime import datetime
import asyncio

from config import Config
from metrics_collector import MetricsCollector

# Initialize Flask app
app = Flask(__name__, 
           static_folder='static',
           template_folder='templates')

# Load configuration
Config.init_app(app)

# Initialize CORS
CORS(app, origins=Config.CORS_ORIGINS)

# Initialize SocketIO for real-time updates
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize metrics collector
metrics_collector = MetricsCollector()

# Setup logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format=Config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(Config.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# API Routes
@app.route('/')
def index():
    """Serve the main dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0'
    })

@app.route('/api/metrics/summary')
def metrics_summary():
    """Get current metrics summary"""
    summary = metrics_collector.get_metrics_summary()
    return jsonify(summary)

@app.route('/api/metrics/system')
def system_metrics():
    """Get historical system metrics"""
    limit = request.args.get('limit', 100, type=int)
    metrics = list(metrics_collector.metrics_store['system'])[-limit:]
    return jsonify({
        'metrics': metrics,
        'count': len(metrics)
    })

@app.route('/api/metrics/services')
def service_metrics():
    """Get service metrics and health"""
    services = {}
    
    for service_id, config in Config.SERVICES.items():
        service_data = metrics_collector.metrics_store['services'].get(service_id, {})
        
        # Get latest health status
        health_history = list(service_data.get('health_history', []))
        latest_health = health_history[-1] if health_history else {'status': 'unknown'}
        
        # Calculate metrics
        response_times = list(service_data.get('response_times', []))
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Calculate uptime
        if health_history:
            healthy_count = sum(1 for h in health_history if h['status'] == 'healthy')
            uptime = (healthy_count / len(health_history)) * 100
        else:
            uptime = 0
        
        services[service_id] = {
            'id': service_id,
            'name': config['name'],
            'port': config['port'],
            'status': latest_health['status'],
            'uptime_percent': uptime,
            'avg_response_time': avg_response_time,
            'error_count': service_data.get('error_count', 0),
            'last_check': service_data.get('last_check')
        }
    
    return jsonify(services)

@app.route('/api/metrics/database')
def database_metrics():
    """Get database metrics"""
    limit = request.args.get('limit', 100, type=int)
    metrics = list(metrics_collector.metrics_store['database'])[-limit:]
    
    # Calculate averages
    if metrics:
        avg_connections = sum(m.get('connection_count', 0) for m in metrics) / len(metrics)
        avg_cache_hit = sum(m.get('cache_hit_ratio', 0) for m in metrics) / len(metrics)
    else:
        avg_connections = 0
        avg_cache_hit = 0
    
    return jsonify({
        'metrics': metrics,
        'averages': {
            'connections': avg_connections,
            'cache_hit_ratio': avg_cache_hit
        }
    })

@app.route('/api/metrics/cache')
def cache_metrics():
    """Get Redis cache metrics"""
    limit = request.args.get('limit', 100, type=int)
    metrics = list(metrics_collector.metrics_store['cache'])[-limit:]
    return jsonify({
        'metrics': metrics,
        'count': len(metrics)
    })

@app.route('/api/alerts')
def get_alerts():
    """Get active alerts"""
    alerts = list(metrics_collector.metrics_store['alerts'])
    
    # Group by severity
    grouped = {
        'critical': [],
        'warning': [],
        'info': []
    }
    
    for alert in alerts:
        severity = alert.get('severity', 'info')
        grouped[severity].append(alert)
    
    return jsonify({
        'alerts': alerts[-50:],  # Last 50 alerts
        'grouped': grouped,
        'total': len(alerts)
    })

@app.route('/api/services/<service_id>/restart', methods=['POST'])
def restart_service(service_id):
    """Restart a specific service"""
    if service_id not in Config.SERVICES:
        return jsonify({'error': 'Service not found'}), 404
    
    try:
        # In production, this would actually restart the service
        # For now, we'll simulate it
        logger.info(f"Restart requested for service: {service_id}")
        
        # Log the action
        emit('service_action', {
            'action': 'restart',
            'service': service_id,
            'timestamp': datetime.now().isoformat()
        }, broadcast=True, namespace='/')
        
        return jsonify({
            'success': True,
            'message': f'Service {service_id} restart initiated'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/system/info')
def system_info():
    """Get system information"""
    import platform
    import psutil
    
    boot_time = datetime.fromtimestamp(psutil.boot_time())
    uptime = datetime.now() - boot_time
    
    return jsonify({
        'platform': {
            'system': platform.system(),
            'release': platform.release(),
            'version': platform.version(),
            'machine': platform.machine(),
            'processor': platform.processor()
        },
        'uptime': {
            'boot_time': boot_time.isoformat(),
            'uptime_seconds': uptime.total_seconds(),
            'uptime_string': str(uptime).split('.')[0]
        },
        'cpu': {
            'count': psutil.cpu_count(),
            'count_logical': psutil.cpu_count(logical=True)
        }
    })

@app.route('/api/logs/<service_id>')
def get_service_logs(service_id):
    """Get recent logs for a service"""
    if service_id not in Config.SERVICES:
        return jsonify({'error': 'Service not found'}), 404
    
    # In production, this would read actual log files
    # For now, return sample data
    logs = [
        {
            'timestamp': datetime.now().isoformat(),
            'level': 'INFO',
            'message': f'{service_id} service started successfully'
        },
        {
            'timestamp': datetime.now().isoformat(),
            'level': 'INFO',
            'message': f'Health check passed for {service_id}'
        }
    ]
    
    return jsonify({
        'service': service_id,
        'logs': logs
    })

# SocketIO Events
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {
        'status': 'connected',
        'timestamp': datetime.now().isoformat()
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('subscribe')
def handle_subscribe(data):
    """Handle metric subscriptions"""
    metric_types = data.get('metrics', [])
    logger.info(f"Client {request.sid} subscribed to: {metric_types}")
    emit('subscribed', {
        'metrics': metric_types,
        'timestamp': datetime.now().isoformat()
    })

# Background Tasks
def broadcast_metrics():
    """Broadcast metrics to all connected clients"""
    while True:
        try:
            # Get current metrics
            summary = metrics_collector.get_metrics_summary()
            
            # Broadcast to all clients
            socketio.emit('metrics_update', summary)
            
            # Check for critical alerts
            critical_alerts = [
                alert for alert in metrics_collector.metrics_store['alerts']
                if alert.get('severity') == 'critical'
            ]
            
            if critical_alerts:
                socketio.emit('critical_alert', {
                    'alerts': critical_alerts[-5:],  # Last 5 critical alerts
                    'timestamp': datetime.now().isoformat()
                })
            
            socketio.sleep(5)  # Broadcast every 5 seconds
            
        except Exception as e:
            logger.error(f"Broadcast error: {e}")
            socketio.sleep(5)

def start_metrics_collection():
    """Start the metrics collection in a separate thread"""
    collection_thread = threading.Thread(
        target=metrics_collector.start_collection_loop,
        daemon=True
    )
    collection_thread.start()
    logger.info("Metrics collection started")

def start_broadcast():
    """Start broadcasting metrics"""
    socketio.start_background_task(broadcast_metrics)
    logger.info("Metric broadcasting started")

# Static file serving
@app.route('/static/<path:path>')
def send_static(path):
    """Serve static files"""
    return send_from_directory('static', path)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Main execution
if __name__ == '__main__':
    logger.info("Starting TerraFusion Operations Dashboard")
    
    # Start metrics collection
    start_metrics_collection()
    
    # Start metric broadcasting
    start_broadcast()
    
    # Run the Flask app with SocketIO
    socketio.run(
        app,
        host=Config.API_HOST,
        port=Config.API_PORT,
        debug=Config.DEBUG
    )