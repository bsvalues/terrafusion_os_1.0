#!/usr/bin/env python3
"""TerraFlow - Simple Working Version"""

from flask import Flask, jsonify, render_template_string
import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Simple HTML template
DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>TerraFlow Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-dark text-light">
    <div class="container">
        <h1 class="mt-4">TerraFlow - Workflow Management</h1>
        <div class="row mt-4">
            <div class="col-md-4">
                <div class="card bg-secondary">
                    <div class="card-body text-center">
                        <h3 class="text-info">12</h3>
                        <p>Active Sync Jobs</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-secondary">
                    <div class="card-body text-center">
                        <h3 class="text-success">8</h3>
                        <p>Completed Today</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-secondary">
                    <div class="card-body text-center">
                        <h3 class="text-warning">3</h3>
                        <p>Pending Jobs</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-4">
            <h3>System Status</h3>
            <p class="text-success">✅ All systems operational</p>
            <p>Last updated: {{ timestamp }}</p>
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def dashboard():
    return render_template_string(DASHBOARD_TEMPLATE, timestamp=datetime.datetime.now())

@app.route('/api/status')
def status():
    return jsonify({
        'status': 'operational',
        'service': 'TerraFlow',
        'port': 5001,
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

@app.route('/api/sync_jobs')
def sync_jobs():
    return jsonify({
        'jobs': [
            {'id': 1, 'name': 'PACS Data Sync', 'status': 'running', 'progress': 67},
            {'id': 2, 'name': 'ArcGIS Update', 'status': 'completed', 'progress': 100},
            {'id': 3, 'name': 'Assessment Flow', 'status': 'pending', 'progress': 0}
        ]
    })

if __name__ == '__main__':
    logger.info("🌊 TerraFlow starting on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False) 