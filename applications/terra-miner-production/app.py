#!/usr/bin/env python3
"""
TerraMiner - Advanced Data Mining & Analytics
AI That Understands Land
"""
from flask import Flask, render_template_string, jsonify
from datetime import datetime

app = Flask(__name__)

TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraMiner - AI That Understands Land</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        :root {
            --tf-cosmic-blue: #0891b2;
            --tf-quantum-teal: #00d2ff;
            --tf-stellar-white: #ffffff;
        }
        
        body { 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        }
        
        .tf-navbar {
            background: linear-gradient(135deg, var(--tf-cosmic-blue), var(--tf-quantum-teal)) !important;
            box-shadow: 0 4px 20px rgba(0, 210, 255, 0.15);
        }
        
        .tf-navbar .navbar-brand {
            color: var(--tf-stellar-white) !important;
            font-weight: 700;
        }
        
        .tf-hero {
            background: linear-gradient(135deg, var(--tf-cosmic-blue), var(--tf-quantum-teal));
            color: var(--tf-stellar-white);
            padding: 3rem 0;
        }
        
        .tf-card {
            background: white;
            border: 2px solid rgba(0, 210, 255, 0.2);
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .tf-btn-primary {
            background: linear-gradient(135deg, var(--tf-cosmic-blue), var(--tf-quantum-teal)) !important;
            border: none !important;
            color: white !important;
            font-weight: 600;
        }
        
        .mining-stat {
            background: linear-gradient(135deg, var(--tf-cosmic-blue), var(--tf-quantum-teal));
            color: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <nav class="tf-navbar navbar navbar-expand-lg">
        <div class="container">
            <a class="navbar-brand" href="/">
                <svg class="me-2" viewBox="0 0 32 32" width="32" height="32">
                    <rect x="4" y="4" width="24" height="24" rx="6" fill="none" stroke="white" stroke-width="2"/>
                    <path d="M8 12 L16 12 L16 20 M16 12 L24 12 M20 16 L24 20" stroke="white" stroke-width="2.5" fill="none"/>
                    <circle cx="12" cy="16" r="2" fill="white"/>
                    <circle cx="20" cy="20" r="2" fill="white"/>
                </svg>
                TerraMiner
            </a>
            <span class="navbar-text text-white">AI That Understands Land</span>
        </div>
    </nav>

    <div class="tf-hero">
        <div class="container text-center">
            <h1>Advanced Data Mining & Analytics</h1>
            <p class="lead">Extracting insights from property and land data</p>
        </div>
    </div>

    <div class="container mt-4">
        <div class="row">
            <div class="col-md-4">
                <div class="mining-stat">
                    <h4>2.4TB</h4>
                    <small>Data Processed</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="mining-stat">
                    <h4>156</h4>
                    <small>Mining Jobs</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="mining-stat">
                    <h4>94.2%</h4>
                    <small>Accuracy Rate</small>
                </div>
            </div>
        </div>
        
        <div class="tf-card p-4 mt-4">
            <h3>TerraMiner Analytics Engine</h3>
            <p>Advanced data mining platform for property and land analysis is operational.</p>
            <button class="tf-btn-primary btn">Start Mining Job</button>
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(TEMPLATE)

@app.route('/health')
def health():
    return {'status': 'healthy', 'service': 'TerraMiner'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5006, debug=False) 