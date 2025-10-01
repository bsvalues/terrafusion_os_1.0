#!/usr/bin/env python3
"""
TerraFusion Live Optimization Dashboard
Real-time monitoring and perfection of TerraFusionBuild with Benton County data
Judge and TF Live Optimization Session
"""
import requests
import time
import json
import sqlite3
from datetime import datetime
import threading
from flask import Flask, render_template_string, jsonify
import subprocess
import os

class LiveOptimizer:
    def __init__(self):
        self.target_url = "http://localhost:\${{TF_API_PORT:-5000}}"
        self.db_path = "terrafusionsync_real.db"
        self.optimization_log = []
        self.performance_metrics = {
            'response_times': [],
            'database_queries': [],
            'search_performance': [],
            'branding_consistency': 100,
            'user_experience_score': 0
        }
        self.is_monitoring = False
        
    def check_application_status(self):
        """Check if TerraFusionBuild is running and responsive"""
        try:
            response = requests.get(f"{self.target_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                return {
                    'status': 'online',
                    'response_time': response.elapsed.total_seconds() * 1000,
                    'database_status': data.get('database', 'unknown'),
                    'properties_count': data.get('properties', 0)
                }
            else:
                return {'status': 'error', 'code': response.status_code}
        except Exception as e:
            return {'status': 'offline', 'error': str(e)}
    
    def test_search_performance(self):
        """Test search functionality performance"""
        search_tests = [
            "Columbia River",
            "Kennewick",
            "12345",
            "Residential",
            "Swift"
        ]
        
        results = []
        for query in search_tests:
            try:
                start_time = time.time()
                response = requests.get(f"{self.target_url}/api/properties?q={query}", timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    results.append({
                        'query': query,
                        'response_time_ms': round(response_time, 2),
                        'results_count': data.get('count', 0),
                        'status': 'success'
                    })
                else:
                    results.append({
                        'query': query,
                        'response_time_ms': round(response_time, 2),
                        'status': 'error',
                        'code': response.status_code
                    })
            except Exception as e:
                results.append({
                    'query': query,
                    'status': 'failed',
                    'error': str(e)
                })
        
        return results
    
    def check_branding_consistency(self):
        """Check branding consistency across the application"""
        try:
            response = requests.get(self.target_url, timeout=10)
            content = response.text.lower()
            
            brand_elements = {
                'terrafusion_title': 'terrafusion build' in content,
                'cosmic_blue_color': '#0891b2' in content,
                'quantum_teal_color': '#00d2ff' in content,
                'intelligence_tagline': 'intelligence that counties envy' in content,
                'tf_navbar_class': 'tf-navbar' in content,
                'tf_card_class': 'tf-card' in content,
                'tf_btn_quantum': 'tf-btn-quantum' in content
            }
            
            consistency_score = sum(brand_elements.values()) / len(brand_elements) * 100
            
            return {
                'consistency_score': round(consistency_score, 1),
                'elements_found': brand_elements,
                'missing_elements': [k for k, v in brand_elements.items() if not v]
            }
            
        except Exception as e:
            return {'error': str(e), 'consistency_score': 0}
    
    def analyze_database_performance(self):
        """Analyze database performance with real PACS data"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Test query performance
            queries = [
                ("Property count", "SELECT COUNT(*) FROM properties"),
                ("Address search", "SELECT COUNT(*) FROM property_addresses WHERE situs_street LIKE '%MAIN%'"),
                ("Value aggregation", "SELECT AVG(market_value) FROM properties WHERE market_value > 0"),
                ("Permit count", "SELECT COUNT(*) FROM building_permits"),
                ("Complex join", """
                    SELECT COUNT(*) FROM properties p 
                    LEFT JOIN property_addresses pa ON p.prop_id = pa.prop_id 
                    WHERE p.market_value > 200000
                """)
            ]
            
            performance_results = []
            for name, query in queries:
                start_time = time.time()
                cursor.execute(query)
                result = cursor.fetchone()
                query_time = (time.time() - start_time) * 1000
                
                performance_results.append({
                    'query_name': name,
                    'execution_time_ms': round(query_time, 2),
                    'result_count': result[0] if result else 0
                })
            
            conn.close()
            return performance_results
            
        except Exception as e:
            return [{'error': str(e)}]
    
    def generate_optimization_recommendations(self):
        """Generate real-time optimization recommendations"""
        recommendations = []
        
        # Check application status
        app_status = self.check_application_status()
        if app_status['status'] != 'online':
            recommendations.append({
                'priority': 'CRITICAL',
                'category': 'Application Status',
                'issue': 'Application is not responding',
                'recommendation': 'Restart TerraFusionBuild service',
                'action': 'python terrafusion_build_enhanced.py'
            })
            return recommendations
        
        # Performance recommendations
        if app_status.get('response_time', 0) > 500:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Performance',
                'issue': f"Slow response time: {app_status['response_time']:.0f}ms",
                'recommendation': 'Optimize database queries or add caching',
                'action': 'Review database indexes and query optimization'
            })
        
        # Search performance
        search_results = self.test_search_performance()
        slow_searches = [r for r in search_results if r.get('response_time_ms', 0) > 200]
        if slow_searches:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Search Performance',
                'issue': f"{len(slow_searches)} search queries are slow",
                'recommendation': 'Add database indexes for search fields',
                'action': 'CREATE INDEX ON property_addresses(situs_street)'
            })
        
        # Branding consistency
        branding = self.check_branding_consistency()
        if branding.get('consistency_score', 0) < 90:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Branding',
                'issue': f"Branding consistency: {branding.get('consistency_score', 0)}%",
                'recommendation': 'Update missing brand elements',
                'action': 'Apply TerraFusion brand system consistently'
            })
        
        # Database performance
        db_performance = self.analyze_database_performance()
        slow_queries = [q for q in db_performance if q.get('execution_time_ms', 0) > 100]
        if slow_queries:
            recommendations.append({
                'priority': 'LOW',
                'category': 'Database Performance',
                'issue': f"{len(slow_queries)} database queries are slow",
                'recommendation': 'Optimize slow database queries',
                'action': 'Add indexes or rewrite queries'
            })
        
        if not recommendations:
            recommendations.append({
                'priority': 'SUCCESS',
                'category': 'System Status',
                'issue': 'All systems operating optimally',
                'recommendation': 'Continue monitoring for peak performance',
                'action': 'Maintain current optimization level'
            })
        
        return recommendations
    
    def start_monitoring(self):
        """Start continuous monitoring"""
        self.is_monitoring = True
        
        def monitor_loop():
            while self.is_monitoring:
                try:
                    # Collect metrics
                    app_status = self.check_application_status()
                    search_perf = self.test_search_performance()
                    branding = self.check_branding_consistency()
                    db_perf = self.analyze_database_performance()
                    
                    # Update performance metrics
                    if app_status.get('response_time'):
                        self.performance_metrics['response_times'].append({
                            'timestamp': datetime.now().isoformat(),
                            'response_time': app_status['response_time']
                        })
                    
                    self.performance_metrics['branding_consistency'] = branding.get('consistency_score', 0)
                    
                    # Log optimization event
                    self.optimization_log.append({
                        'timestamp': datetime.now().isoformat(),
                        'app_status': app_status,
                        'search_performance': search_perf,
                        'branding_consistency': branding,
                        'database_performance': db_perf
                    })
                    
                    # Keep only last 50 entries
                    if len(self.optimization_log) > 50:
                        self.optimization_log = self.optimization_log[-50:]
                    
                    time.sleep(30)  # Monitor every 30 seconds
                    
                except Exception as e:
                    print(f"Monitoring error: {e}")
                    time.sleep(60)
        
        threading.Thread(target=monitor_loop, daemon=True).start()
    
    def get_live_report(self):
        """Generate live optimization report"""
        recommendations = self.generate_optimization_recommendations()
        
        return {
            'timestamp': datetime.now().isoformat(),
            'application_status': self.check_application_status(),
            'search_performance': self.test_search_performance(),
            'branding_consistency': self.check_branding_consistency(),
            'database_performance': self.analyze_database_performance(),
            'recommendations': recommendations,
            'performance_metrics': self.performance_metrics,
            'optimization_log_count': len(self.optimization_log)
        }

# Create Flask app for live dashboard
dashboard_app = Flask(__name__)
optimizer = LiveOptimizer()

DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraFusion Live Optimization Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --tf-cosmic-blue: #0891b2;
            --tf-quantum-teal: #00d2ff;
            --tf-stellar-white: #ffffff;
        }
        
        body { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
        
        .tf-header {
            background: linear-gradient(135deg, var(--tf-cosmic-blue), var(--tf-quantum-teal));
            color: var(--tf-stellar-white);
            padding: 2rem 0;
        }
        
        .metric-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            padding: 1.5rem;
            margin-bottom: 1rem;
            transition: transform 0.3s ease;
        }
        
        .metric-card:hover { transform: translateY(-5px); }
        
        .status-online { color: #10b981; }
        .status-warning { color: #f59e0b; }
        .status-error { color: #ef4444; }
        
        .recommendation-critical { border-left: 4px solid #ef4444; }
        .recommendation-high { border-left: 4px solid #f59e0b; }
        .recommendation-medium { border-left: 4px solid #3b82f6; }
        .recommendation-low { border-left: 4px solid #6b7280; }
        .recommendation-success { border-left: 4px solid #10b981; }
        
        .auto-refresh { position: fixed; top: 20px; right: 20px; z-index: 1000; }
    </style>
</head>
<body>
    <div class="tf-header">
        <div class="container">
            <h1><i class="fas fa-tachometer-alt"></i> TerraFusion Live Optimization Dashboard</h1>
            <p class="lead">Real-time monitoring and perfection of TerraFusionBuild</p>
        </div>
    </div>

    <div class="auto-refresh">
        <button class="btn btn-primary" onclick="location.reload()">
            <i class="fas fa-sync"></i> Refresh
        </button>
    </div>

    <div class="container mt-4">
        <!-- Application Status -->
        <div class="row">
            <div class="col-md-3">
                <div class="metric-card text-center">
                    <h3 class="status-{{ 'online' if report.application_status.status == 'online' else 'error' }}">
                        <i class="fas fa-{{ 'check-circle' if report.application_status.status == 'online' else 'times-circle' }}"></i>
                    </h3>
                    <h6>Application Status</h6>
                    <p>{{ report.application_status.status.title() }}</p>
                    {% if report.application_status.response_time %}
                    <small>{{ "%.0f"|format(report.application_status.response_time) }}ms response</small>
                    {% endif %}
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card text-center">
                    <h3 class="status-online">{{ "{:,}".format(report.application_status.properties_count or 0) }}</h3>
                    <h6>Properties Available</h6>
                    <p>Real PACS Data</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card text-center">
                    <h3 class="status-{{ 'online' if report.branding_consistency.consistency_score >= 90 else 'warning' }}">
                        {{ "%.0f"|format(report.branding_consistency.consistency_score or 0) }}%
                    </h3>
                    <h6>Brand Consistency</h6>
                    <p>TerraFusion Standards</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card text-center">
                    <h3 class="status-online">{{ report.search_performance|length }}</h3>
                    <h6>Search Tests</h6>
                    <p>Performance Validated</p>
                </div>
            </div>
        </div>

        <!-- Search Performance -->
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="metric-card">
                    <h5><i class="fas fa-search"></i> Search Performance</h5>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Query</th>
                                    <th>Time (ms)</th>
                                    <th>Results</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {% for test in report.search_performance %}
                                <tr>
                                    <td>{{ test.query }}</td>
                                    <td>{{ test.response_time_ms or 'N/A' }}</td>
                                    <td>{{ test.results_count or 'N/A' }}</td>
                                    <td>
                                        <span class="status-{{ 'online' if test.status == 'success' else 'error' }}">
                                            {{ test.status.title() }}
                                        </span>
                                    </td>
                                </tr>
                                {% endfor %}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Database Performance -->
            <div class="col-md-6">
                <div class="metric-card">
                    <h5><i class="fas fa-database"></i> Database Performance</h5>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Query Type</th>
                                    <th>Time (ms)</th>
                                    <th>Results</th>
                                </tr>
                            </thead>
                            <tbody>
                                {% for query in report.database_performance %}
                                {% if not query.error %}
                                <tr>
                                    <td>{{ query.query_name }}</td>
                                    <td class="status-{{ 'online' if query.execution_time_ms < 100 else 'warning' }}">
                                        {{ query.execution_time_ms }}
                                    </td>
                                    <td>{{ "{:,}".format(query.result_count) }}</td>
                                </tr>
                                {% endif %}
                                {% endfor %}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Optimization Recommendations -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="metric-card">
                    <h5><i class="fas fa-lightbulb"></i> Live Optimization Recommendations</h5>
                    {% for rec in report.recommendations %}
                    <div class="alert alert-light recommendation-{{ rec.priority.lower() }} mb-2">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <strong class="text-{{ 'danger' if rec.priority == 'CRITICAL' else 'warning' if rec.priority == 'HIGH' else 'primary' if rec.priority == 'MEDIUM' else 'success' }}">
                                    {{ rec.priority }}
                                </strong>
                            </div>
                            <div class="col-md-3">
                                <strong>{{ rec.category }}</strong>
                            </div>
                            <div class="col-md-4">
                                {{ rec.issue }}
                            </div>
                            <div class="col-md-3">
                                <small class="text-muted">{{ rec.recommendation }}</small>
                            </div>
                        </div>
                    </div>
                    {% endfor %}
                </div>
            </div>
        </div>

        <!-- Branding Analysis -->
        {% if report.branding_consistency.missing_elements %}
        <div class="row mt-4">
            <div class="col-12">
                <div class="metric-card">
                    <h5><i class="fas fa-palette"></i> Branding Consistency Analysis</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Missing Brand Elements:</h6>
                            <ul>
                                {% for element in report.branding_consistency.missing_elements %}
                                <li class="text-warning">{{ element.replace('_', ' ').title() }}</li>
                                {% endfor %}
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>Brand Elements Found:</h6>
                            {% for element, found in report.branding_consistency.elements_found.items() %}
                            {% if found %}
                            <span class="badge bg-success me-1">{{ element.replace('_', ' ').title() }}</span>
                            {% endif %}
                            {% endfor %}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {% endif %}

        <!-- System Information -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="metric-card">
                    <h5><i class="fas fa-info-circle"></i> System Information</h5>
                    <div class="row">
                        <div class="col-md-4">
                            <strong>Last Updated:</strong><br>
                            {{ report.timestamp.split('T')[1].split('.')[0] }}
                        </div>
                        <div class="col-md-4">
                            <strong>Target Application:</strong><br>
                            http://localhost:\${{TF_API_PORT:-5000}}
                        </div>
                        <div class="col-md-4">
                            <strong>Database:</strong><br>
                            {{ report.application_status.database_status or 'Unknown' }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
        
        // Add visual feedback for refresh
        document.addEventListener('DOMContentLoaded', function() {
            const refreshBtn = document.querySelector('.auto-refresh button');
            let countdown = 30;
            
            const updateCountdown = () => {
                refreshBtn.innerHTML = `<i class="fas fa-sync"></i> Refresh (${countdown}s)`;
                countdown--;
                if (countdown < 0) countdown = 30;
            };
            
            setInterval(updateCountdown, 1000);
        });
    </script>
</body>
</html>
"""

@dashboard_app.route('/')
def dashboard():
    """Live optimization dashboard"""
    report = optimizer.get_live_report()
    return render_template_string(DASHBOARD_TEMPLATE, report=report)

@dashboard_app.route('/api/report')
def api_report():
    """API endpoint for optimization report"""
    return jsonify(optimizer.get_live_report())

if __name__ == '__main__':
    print("🚀 Starting TerraFusion Live Optimization Dashboard")
    print("📊 Real-time monitoring of TerraFusionBuild")
    print("🎯 Judge and TF Live Optimization Session")
    print()
    
    # Start monitoring
    optimizer.start_monitoring()
    
    # Run dashboard
    dashboard_app.run(host='0.0.0.0', port=\${{TF_API_HTTPS_PORT:-5001}}, debug=False) 