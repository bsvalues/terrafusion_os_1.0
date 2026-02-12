#!/bin/bash
# TerraFusion Enterprise Deployment Script
set -e

echo "🚀 Starting TerraFusion Enterprise Deployment..."

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo "Python 3 required but not installed."; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "PostgreSQL client required but not installed."; exit 1; }

# Environment setup
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from template..."
    cp .env.production.template .env
    echo "✅ Please configure .env file with your production values"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Database setup
echo "🗄️  Setting up database..."
python3 -c "
import os
import psycopg2
from urllib.parse import urlparse

try:
    url = urlparse(os.environ['DATABASE_URL'])
    conn = psycopg2.connect(
        host=url.hostname,
        port=url.port,
        user=url.username,
        password=url.password,
        database=url.path[1:]
    )
    print('✅ Database connection successful')
    conn.close()
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"

# Install dependencies
echo "📦 Installing production dependencies..."
pip3 install -r requirements.production.txt

# Security check
echo "🔒 Running security validation..."
python3 scripts/security_validation.py

# Database migrations
echo "🔄 Running database migrations..."
python3 -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('✅ Database tables created')
"

# SSL certificate check
if [ ! -f "security/certificates/cert.pem" ] || [ ! -f "security/certificates/key.pem" ]; then
    echo "⚠️  SSL certificates not found. HTTPS will be disabled."
fi

# Start services
echo "🎯 Starting TerraFusion services..."
gunicorn --bind 0.0.0.0:${PORT:-5000} --workers ${MAX_WORKERS:-4} --timeout ${WORKER_TIMEOUT:-30} main:app &
MAIN_PID=$!

# Health check
sleep 5
if curl -f http://localhost:${PORT:-5000}/health >/dev/null 2>&1; then
    echo "✅ TerraFusion Enterprise deployed successfully!"
    echo "🌐 Access your application at: http://localhost:${PORT:-5000}"
else
    echo "❌ Deployment failed - health check unsuccessful"
    kill $MAIN_PID
    exit 1
fi

echo "📊 Deployment complete. Service PID: $MAIN_PID"
