#!/bin/bash
set -e

echo "Starting TerraFusion Enterprise Deployment..."

# Environment validation
if [ ! -f ".env" ]; then
    echo "Error: .env file not found. Copy .env.template and configure it."
    exit 1
fi

# Database migration
echo "Running database migrations..."
python -c "from app import db; db.create_all()"

# Static file collection
echo "Collecting static files..."
mkdir -p static/dist
cp -r static/css static/js static/images static/dist/

# Security checks
echo "Running security validation..."
python scripts/security_check.py

# Performance optimization
echo "Optimizing application..."
python scripts/performance_optimizer.py

# Health check
echo "Performing health check..."
python -c "
import requests
import time
import subprocess
import os

# Start application in background
proc = subprocess.Popen(['gunicorn', '--bind', '0.0.0.0:5000', '--workers', '4', 'main:app'])
time.sleep(5)

try:
    response = requests.get('http://localhost:5000/health', timeout=10)
    if response.status_code == 200:
        print('Health check: PASSED')
    else:
        print('Health check: FAILED')
        exit(1)
finally:
    proc.terminate()
"

echo "Deployment validation completed successfully!"
echo "Application ready for production deployment."
