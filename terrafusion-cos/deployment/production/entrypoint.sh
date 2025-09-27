#!/bin/bash
# TerraFusion cOS Production Entrypoint Script
# Handles startup, configuration, and graceful shutdown

set -e

# Environment variables
export TERRAFUSION_ENV=${TERRAFUSION_ENV:-production}
export TERRAFUSION_LOG_LEVEL=${TERRAFUSION_LOG_LEVEL:-INFO}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Validate environment
validate_environment() {
    log "Validating production environment..."
    
    # Check required environment variables
    required_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET_KEY"
        "ENCRYPTION_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log "Environment validation complete"
}

# Database readiness check
wait_for_database() {
    log "Waiting for database connection..."
    
    max_attempts=30
    attempt=1
    
    while ! python -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.close()
    print('Database connection successful')
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
" 2>/dev/null; do
        if [ $attempt -eq $max_attempts ]; then
            error "Database connection failed after $max_attempts attempts"
            exit 1
        fi
        warn "Database not ready, attempt $attempt/$max_attempts"
        sleep 2
        ((attempt++))
    done
    
    log "Database connection established"
}

# Redis readiness check
wait_for_redis() {
    log "Waiting for Redis connection..."
    
    max_attempts=30
    attempt=1
    
    while ! python -c "
import redis
import os
try:
    r = redis.from_url(os.environ['REDIS_URL'])
    r.ping()
    print('Redis connection successful')
except Exception as e:
    print(f'Redis connection failed: {e}')
    exit(1)
" 2>/dev/null; do
        if [ $attempt -eq $max_attempts ]; then
            error "Redis connection failed after $max_attempts attempts"
            exit 1
        fi
        warn "Redis not ready, attempt $attempt/$max_attempts"
        sleep 2
        ((attempt++))
    done
    
    log "Redis connection established"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    if [ -f "alembic.ini" ]; then
        alembic upgrade head
        log "Database migrations completed"
    else
        warn "No Alembic configuration found, skipping migrations"
    fi
}

# Initialize application
initialize_application() {
    log "Initializing TerraFusion cOS application..."
    
    # Create required directories
    mkdir -p /app/logs /app/data /app/tmp
    
    # Set proper permissions
    chmod 755 /app/logs /app/data /app/tmp
    
    # Initialize services
    python -c "
import sys
sys.path.append('/app')
from services.security_mesh import SecurityMesh
from services.zero_trust import ZeroTrustNetworkAccess
from services.terrafusion_sync import TerraFusionSync
from services.terra_flow import TerraFlow

print('Initializing core services...')
security = SecurityMesh()
zero_trust = ZeroTrustNetworkAccess()  
sync = TerraFusionSync()
flow = TerraFlow()
print('Core services initialized successfully')
"
    
    log "Application initialization complete"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring and observability..."
    
    # Start Prometheus metrics collection
    export PROMETHEUS_MULTIPROC_DIR=/tmp/prometheus_multiproc
    mkdir -p $PROMETHEUS_MULTIPROC_DIR
    
    log "Monitoring setup complete"
}

# Graceful shutdown handler
cleanup() {
    log "Received shutdown signal, performing graceful shutdown..."
    
    # Send SIGTERM to child processes
    if [ ! -z "$API_PID" ]; then
        kill -TERM $API_PID 2>/dev/null || true
        wait $API_PID 2>/dev/null || true
    fi
    
    log "Graceful shutdown complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Main execution
main() {
    log "Starting TerraFusion cOS Production Deployment"
    log "Version: 2.0.0-enterprise"
    log "Environment: $TERRAFUSION_ENV"
    
    # Validate environment
    validate_environment
    
    # Wait for dependencies
    wait_for_database
    wait_for_redis
    
    # Run migrations
    run_migrations
    
    # Initialize application
    initialize_application
    
    # Setup monitoring
    setup_monitoring
    
    log "Starting application server..."
    
    # Start the application
    if [ "$1" = "python" ] && [ "$2" = "desktop/api_server.py" ]; then
        # Production server with Gunicorn
        exec gunicorn \
            --bind 0.0.0.0:8090 \
            --workers 4 \
            --worker-class uvicorn.workers.UvicornWorker \
            --worker-connections 1000 \
            --max-requests 10000 \
            --max-requests-jitter 1000 \
            --timeout 60 \
            --keep-alive 5 \
            --log-level info \
            --access-logfile - \
            --error-logfile - \
            --capture-output \
            --enable-stdio-inheritance \
            --preload \
            desktop.api_server:TerraFusionAPI().app &
        
        API_PID=$!
        wait $API_PID
    else
        # Execute provided command
        exec "$@"
    fi
}

# Run main function
main "$@"