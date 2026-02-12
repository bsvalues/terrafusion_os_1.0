from flask import Flask, jsonify, render_template_string
import datetime

app = Flask(__name__)

DASHBOARD = """
<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
    <title>TerraFlow - Workflow Management</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-dark text-light">
    <div class="container">
        <h1 class="mt-4"><i class="fas fa-stream text-primary"></i> TerraFlow</h1>
        <p class="lead">Workflow Management & Data Synchronization Platform</p>
        
        <div class="row mt-4">
            <div class="col-md-3">
                <div class="card bg-secondary text-center">
                    <div class="card-body">
                        <i class="fas fa-sync text-primary fs-1"></i>
                        <h3>12</h3>
                        <p>Active Sync Jobs</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-secondary text-center">
                    <div class="card-body">
                        <i class="fas fa-check-circle text-success fs-1"></i>
                        <h3>8</h3>
                        <p>Completed</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-secondary text-center">
                    <div class="card-body">
                        <i class="fas fa-clock text-warning fs-1"></i>
                        <h3>3</h3>
                        <p>Pending</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-secondary text-center">
                    <div class="card-body">
                        <i class="fas fa-cogs text-info fs-1"></i>
                        <h3>5</h3>
                        <p>Workflows</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-4">
            <div class="card bg-secondary">
                <div class="card-header">
                    <h5><i class="fas fa-list"></i> Recent Activity</h5>
                </div>
                <div class="card-body">
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item bg-dark d-flex justify-content-between">
                            <span><i class="fas fa-database text-info"></i> PACS Data Sync</span>
                            <span class="badge bg-success">Running</span>
                        </li>
                        <li class="list-group-item bg-dark d-flex justify-content-between">
                            <span><i class="fas fa-map text-warning"></i> ArcGIS Update</span>
                            <span class="badge bg-primary">Completed</span>
                        </li>
                        <li class="list-group-item bg-dark d-flex justify-content-between">
                            <span><i class="fas fa-file-alt text-secondary"></i> Assessment Flow</span>
                            <span class="badge bg-warning">Pending</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="mt-4 text-center">
            <p class="text-muted">TerraFlow Operational | Port 5001 | {{ timestamp }}</p>
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def dashboard():
    return render_template_string(DASHBOARD, timestamp=datetime.datetime.now())

@app.route('/api/status')
def status():
    return jsonify({
        "status": "operational",
        "service": "TerraFlow",
        "port": 5001,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "features": ["Workflow Management", "Data Sync", "PACS Integration", "ArcGIS Sync"]
    })

@app.route('/api/sync_jobs')
def sync_jobs():
    return jsonify({
        "jobs": [
            {"name": "PACS Data Sync", "status": "running", "progress": 67},
            {"name": "ArcGIS Update", "status": "completed", "progress": 100},
            {"name": "Assessment Flow", "status": "pending", "progress": 0}
        ]
    })

if __name__ == '__main__':
    print("🌊 TerraFlow starting on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False) 