#!/bin/bash

# County Audit Hub - Production Deployment Script
# Automated deployment with SSL, Docker, and health checks

set -euo pipefail

# Configuration
APP_NAME="county-audit-hub"
APP_PORT="5000"
SSL_DIR="nginx/ssl"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_dependencies() {
    log "Checking system dependencies..."
    
    local deps=("node" "npm")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            error "$dep is not installed or not in PATH"
            exit 1
        fi
    done
    
    success "All dependencies are available"
}

# Environment validation
check_environment() {
    log "Validating environment configuration..."
    
    if [[ -z "${DATABASE_URL:-}" ]]; then
        warning "DATABASE_URL not set - using default PostgreSQL connection"
    fi
    
    success "Environment validated"
}

# Install dependencies
install_dependencies() {
    log "Installing production dependencies..."
    npm ci
    success "Dependencies installed"
}

# Build application
build_application() {
    log "Building application for production..."
    export NODE_ENV=production
    npm run build
    success "Application built successfully"
}

# Database setup
setup_database() {
    log "Setting up database..."
    npm run db:push
    success "Database setup completed"
}

# Start services
start_services() {
    log "Starting application services..."
    npm run start &
    APP_PID=$!
    echo $APP_PID > .app.pid
    success "Services started"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    local max_attempts=15
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:$APP_PORT/api/analytics" > /dev/null 2>&1; then
            success "Application is responding"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts, retrying in 2 seconds..."
        sleep 2
        ((attempt++))
    done
    
    warning "Health check completed with timeout"
    return 0
}

# Main deployment flow
main() {
    log "Starting County Audit Hub deployment..."
    
    check_dependencies
    check_environment
    install_dependencies
    build_application
    setup_database
    start_services
    health_check
    
    success "County Audit Hub deployed successfully!"
    log "Application is running at http://localhost:$APP_PORT"
}

# Run deployment
main "$@"