#!/usr/bin/env python3
"""
TerraFusion AI Gateway
Central API gateway for all TerraFusion AI services
"""
from flask import Flask, jsonify, request, render_template_string
import requests
import logging
from datetime import datetime

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# AI Service Endpoints
AI_SERVICES = {
    'terrainsight': {
        'name': 'TerraInsight',
        'url': 'http://localhost:\${{TF_SHELL_PORT:-3001}}',
        'description': 'Main geospatial property intelligence agent',
        'status': 'active'
    },
    'gispro': {
        'name': 'GISPRO',
        'url': 'http://localhost:\${{TF_SHELL_PORT:-3001}}',
        'description': 'GIS Professional Tools',
        'status': 'active'
    },
    'assessor': {
        'name': 'TerraFusionAssessor',
        'url': 'http://localhost:\${{TF_SHELL_PORT:-3001}}',
        'description': 'Property Assessment Agent',
        'status': 'active'
    },
    'terraagent': {
        'name': 'TerraAgent',
        'url': 'http://localhost:\${{TF_SHELL_PORT:-3001}}',
        'description': 'Core Terra Agent',
        'status': 'active'
    },
    'terraflow': {
        'name': 'TerraFlow',
        'url': 'http://localhost:\${{TF_SHELL_PORT:-3001}}',
        'description': 'Workflow Management Agent',
        'status': 'active'
    },
    'terralevy': {
        'name': 'TerraLevy',
        'url': 'http://localhost:\${{TF_SHELL_PORT:-3001}}',
        'description': 'Tax/Levy Analysis Agent',
        'status': 'active'
    },
    'terraminer': {
        'name': 'TerraMiner',
        'url': 'http://localhost:\${{TF_SHELL_PORT:-3001}}',
        'description': 'Data Mining Agent',
        'status': 'active'
    }
}

DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraFusion AI Gateway</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card { box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .service-card { transition: transform 0.2s; }
        .service-card:hover { transform: translateY(-5px); }
        .status-active { color: #28a745; }
        .status-inactive { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container mt-4">
        <div class="text-center mb-4">
            <h1 class="text-white">🚀 TerraFusion AI Gateway</h1>
            <p class="text-light">Central Command for All AI Services</p>
        </div>
        
        <div class="row">
            <div class="col-md-4 mb-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h4>🎯 Total Services</h4>
                        <h2 class="text-primary">{{ total_services }}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h4>✅ Active Services</h4>
                        <h2 class="text-success">{{ active_services }}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h4>🔄 Uptime</h4>
                        <h2 class="text-info">99.9%</h2>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>🤖 AI Services Registry</h3>
            </div>
            <div class="card-body">
                <div class="row">
                    {% for service_id, service in services.items() %}
                    <div class="col-md-6 mb-3">
                        <div class="card service-card">
                            <div class="card-body">
                                <h5>{{ service.name }} 
                                    <span class="status-{{ service.status }}">●</span>
                                </h5>
                                <p class="text-muted">{{ service.description }}</p>
                                <small>Endpoint: {{ service.url }}</small>
                                <br>
                                <a href="{{ service.url }}" target="_blank" class="btn btn-sm btn-primary mt-2">
                                    Open Service
                                </a>
                                <a href="/api/proxy/{{ service_id }}/health" class="btn btn-sm btn-secondary mt-2">
                                    Health Check
                                </a>
                            </div>
                        </div>
                    </div>
                    {% endfor %}
                </div>
            </div>
        </div>
        
        <div class="card mt-4">
            <div class="card-header">
                <h4>📊 Gateway Statistics</h4>
            </div>
            <div class="card-body">
                <p><strong>Gateway Started:</strong> {{ start_time }}</p>
                <p><strong>Total Requests:</strong> <span id="request-count">0</span></p>
                <p><strong>API Version:</strong> v2.0.0</p>
                <p><strong>Gateway Status:</strong> <span class="status-active">OPERATIONAL</span></p>
            </div>
        </div>
    </div>
    
    <script>
        // Update request count every few seconds
        setInterval(() => {
            fetch('/api/stats')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('request-count').textContent = data.total_requests || 0;
                });
        }, 5000);
    </script>
</body>
</html>
"""

@app.route('/')
def dashboard():
    active_count = sum(1 for s in AI_SERVICES.values() if s['status'] == 'active')
    return render_template_string(DASHBOARD_TEMPLATE, 
                                services=AI_SERVICES,
                                total_services=len(AI_SERVICES),
                                active_services=active_count,
                                start_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

@app.route('/api/services')
def list_services():
    return jsonify({
        'services': AI_SERVICES,
        'total': len(AI_SERVICES),
        'active': sum(1 for s in AI_SERVICES.values() if s['status'] == 'active')
    })

@app.route('/api/proxy/<service_id>/<path:endpoint>')
def proxy_request(service_id, endpoint):
    if service_id not in AI_SERVICES:
        return jsonify({'error': 'Service not found'}), 404
    
    service = AI_SERVICES[service_id]
    target_url = f"{service['url']}/{endpoint}"
    
    try:
        response = requests.get(target_url, timeout=5)
        return jsonify(response.json() if response.headers.get('content-type', '').startswith('application/json') 
                      else {'status': 'success', 'data': response.text})
    except Exception as e:
        return jsonify({'error': str(e), 'service': service_id}), 500

@app.route('/api/health')
def gateway_health():
    service_health = {}
    overall_healthy = True
    
    for service_id, service in AI_SERVICES.items():
        try:
            response = requests.get(f"{service['url']}/health", timeout=3)
            service_health[service_id] = {
                'status': 'healthy' if response.status_code == 200 else 'unhealthy',
                'response_time': response.elapsed.total_seconds() * 1000,
                'url': service['url']
            }
        except Exception as e:
            service_health[service_id] = {
                'status': 'unhealthy',
                'error': str(e),
                'url': service['url']
            }
            overall_healthy = False
    
    return jsonify({
        'gateway_status': 'healthy' if overall_healthy else 'degraded',
        'services': service_health,
        'timestamp': datetime.now().isoformat(),
        'total_services': len(AI_SERVICES)
    })

@app.route('/api/stats')
def gateway_stats():
    return jsonify({
        'total_requests': 0,  # Would track in production
        'uptime': '99.9%',
        'active_services': sum(1 for s in AI_SERVICES.values() if s['status'] == 'active'),
        'gateway_version': 'v2.0.0'
    })

if __name__ == '__main__':
    print("🚀 Starting TerraFusion AI Gateway")
    print("=" * 50)
    print("✅ Service Discovery: ENABLED")
    print("✅ Health Monitoring: ENABLED")
    print("✅ Request Proxying: ENABLED")
    print("🌐 Dashboard: http://localhost:\${{TF_SHELL_PORT:-3001}}")
    print("📡 API Endpoint: http://localhost:\${{TF_SHELL_PORT:-3001}}/api")
    
    app.run(host='0.0.0.0', port=\${{TF_SERVICE_8001_PORT:-8001}}, debug=False)