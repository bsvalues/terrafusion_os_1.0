#!/bin/bash

# TerraFusion Platform - Production Deployment Script
# Version: 1.0.0
# Description: Automated deployment script for production environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
BACKUP_ENABLED=${BACKUP_ENABLED:-true}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-300}

echo -e "${BLUE}🚀 TerraFusion Platform Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo ""

# Function to print status messages
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Pre-deployment checks
log "🔍 Running pre-deployment checks..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    error "Docker is not running. Please start Docker and try again."
fi

# Check if environment file exists
if [ ! -f ".env" ]; then
    warn "No .env file found. Copying from .env.example..."
    cp devops-kit/.env.example .env
    warn "Please configure .env file with your actual values before proceeding."
    read -p "Press Enter to continue after configuring .env..."
fi

# Check required environment variables
log "🔧 Validating environment configuration..."
source .env

required_vars=(
    "DATABASE_URL"
    "JWT_SECRET"
    "OPENAI_API_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        error "Required environment variable $var is not set"
    fi
done

# Create backup if enabled
if [ "$BACKUP_ENABLED" = "true" ]; then
    log "💾 Creating backup before deployment..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="backups/${timestamp}"
    mkdir -p "$backup_dir"
    
    # Backup database if running
    if docker-compose ps database | grep -q "Up"; then
        log "Backing up database..."
        docker-compose exec -T database pg_dump -U $POSTGRES_USER $POSTGRES_DB > "$backup_dir/database_backup.sql"
    fi
    
    # Backup uploaded files
    if [ -d "uploads" ]; then
        log "Backing up uploaded files..."
        tar -czf "$backup_dir/uploads_backup.tar.gz" uploads/
    fi
    
    log "✅ Backup completed: $backup_dir"
fi

# Pull latest images
log "📥 Pulling latest Docker images..."
docker-compose -f docker-compose.prod.yml pull

# Build application images
log "🔨 Building application images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop existing services gracefully
log "🛑 Stopping existing services..."
docker-compose -f docker-compose.prod.yml down --timeout 30

# Start database and cache first
log "🗄️ Starting database and cache services..."
docker-compose -f docker-compose.prod.yml up -d database redis

# Wait for database to be ready
log "⏳ Waiting for database to be ready..."
timeout=60
while ! docker-compose -f docker-compose.prod.yml exec -T database pg_isready -U $POSTGRES_USER >/dev/null 2>&1; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        error "Database failed to start within 60 seconds"
    fi
done

# Run database migrations
log "🔄 Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend npm run db:push

# Start AI engine
log "🤖 Starting AI engine..."
docker-compose -f docker-compose.prod.yml up -d ai-engine

# Wait for AI engine to be ready
log "⏳ Waiting for AI engine to be ready..."
timeout=120
while ! curl -f http://localhost:8000/health >/dev/null 2>&1; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        error "AI engine failed to start within 120 seconds"
    fi
done

# Start backend services
log "⚙️ Starting backend services..."
docker-compose -f docker-compose.prod.yml up -d backend

# Wait for backend to be ready
log "⏳ Waiting for backend to be ready..."
timeout=60
while ! curl -f http://localhost:5000/api/health >/dev/null 2>&1; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        error "Backend failed to start within 60 seconds"
    fi
done

# Start frontend and nginx
log "🌐 Starting frontend and load balancer..."
docker-compose -f docker-compose.prod.yml up -d frontend nginx

# Start monitoring services
log "📊 Starting monitoring services..."
docker-compose -f docker-compose.prod.yml up -d prometheus grafana

# Final health check
log "🏥 Running final health checks..."
services=("frontend" "backend" "ai-engine" "database" "redis")
failed_services=()

for service in "${services[@]}"; do
    if ! docker-compose -f docker-compose.prod.yml ps "$service" | grep -q "Up"; then
        failed_services+=("$service")
    fi
done

if [ ${#failed_services[@]} -eq 0 ]; then
    log "✅ All services are running successfully!"
    log "🎉 Deployment completed successfully!"
    echo ""
    log "📋 Service URLs:"
    log "   Frontend: http://localhost"
    log "   API: http://localhost/api"
    log "   AI Engine: http://localhost/ai"
    log "   Monitoring: http://localhost:3000 (Grafana)"
    log "   Metrics: http://localhost:9090 (Prometheus)"
    echo ""
else
    error "The following services failed to start: ${failed_services[*]}"
fi

# Clean up old images
log "🧹 Cleaning up old Docker images..."
docker image prune -f

log "🎯 Deployment script completed successfully!"
echo -e "${GREEN}TerraFusion Platform is now running in ${ENVIRONMENT} mode${NC}"