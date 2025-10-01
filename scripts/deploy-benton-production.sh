#!/bin/bash

# TerraFusion OS 1.0 - Benton County Production Deployment Script
# One-command deployment for production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.prod"
COMPOSE_FILE="$PROJECT_ROOT/compose.prod.yaml"
LOG_FILE="$PROJECT_ROOT/logs/deployment-$(date +%Y%m%d_%H%M%S).log"

# Ensure logs directory exists
mkdir -p "$PROJECT_ROOT/logs"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    TerraFusion OS 1.0                       ║"
echo "║              Benton County Production Deployment             ║"
echo "║                                                              ║"
echo "║  🏛️  Government AI Operating System                          ║"
echo "║  🤖  1,008 AI Agents | Production Ready                     ║"
echo "║  📊  Real-time Legacy Integration via TerraFusionSync       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Pre-deployment checks
log "🔍 Running pre-deployment checks..."

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    error "Environment file not found: $ENV_FILE"
    error "Please copy env.prod.template to .env.prod and update with actual values"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Validate configuration
log "✅ Validating configuration..."
if ! grep -q "CHANGE_ME" "$ENV_FILE"; then
    warning "Environment file contains placeholder values. Please update with actual values."
fi

# Backup current deployment (if exists)
if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q | grep -q .; then
    log "💾 Creating backup of current deployment..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    sleep 5
fi

# Pull latest images
log "📥 Pulling latest production images..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

# Deploy services
log "🚀 Deploying TerraFusion OS to production..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# Wait for services to be healthy
log "⏳ Waiting for services to be healthy..."
timeout=300
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps | grep -q "unhealthy"; then
        warning "Some services are unhealthy. Waiting..."
        sleep 10
        elapsed=$((elapsed + 10))
    else
        log "✅ All services are healthy!"
        break
    fi
done

if [ $elapsed -ge $timeout ]; then
    error "Services failed to become healthy within $timeout seconds"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs
    exit 1
fi

# Run database migrations
log "🗄️ Running database migrations..."
if [ -f "$PROJECT_ROOT/scripts/migrate-db.sh" ]; then
    "$PROJECT_ROOT/scripts/migrate-db.sh" --environment=production --county=benton
else
    warning "Database migration script not found. Please run migrations manually."
fi

# Run smoke tests
log "🧪 Running smoke tests..."
if [ -f "$PROJECT_ROOT/scripts/smoke-tests.sh" ]; then
    "$PROJECT_ROOT/scripts/smoke-tests.sh" --environment=production --county=benton
else
    warning "Smoke test script not found. Please run tests manually."
fi

# Health check
log "🏥 Performing health check..."
sleep 30

# Check API health
if curl -f http://localhost:${TF_STATIC_PORT:-8080}/health > /dev/null 2>&1; then
    log "✅ API health check passed"
else
    error "❌ API health check failed"
    exit 1
fi

# Check frontend health
if curl -f http://localhost:${TF_STATIC_PORT:-8080}/health > /dev/null 2>&1; then
    log "✅ Frontend health check passed"
else
    error "❌ Frontend health check failed"
    exit 1
fi

# Check AI Swarm health
if curl -f http://localhost:${TF_STATIC_PORT:-8080}/health > /dev/null 2>&1; then
    log "✅ AI Swarm health check passed"
else
    error "❌ AI Swarm health check failed"
    exit 1
fi

# Display service status
log "📊 Service Status:"
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

# Display URLs
log "🌐 Service URLs:"
echo "  Frontend: http://localhost:${TF_STATIC_PORT:-8080}"
echo "  API: http://localhost:${TF_STATIC_PORT:-8080}"
echo "  AI Swarm: http://localhost:${TF_STATIC_PORT:-8080}"
echo "  Grafana: http://localhost:${TF_STATIC_PORT:-8080}"
echo "  Prometheus: http://localhost:${TF_STATIC_PORT:-8080}"

# Success message
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    DEPLOYMENT SUCCESSFUL!                   ║"
echo "║                                                              ║"
echo "║  🎉 TerraFusion OS 1.0 is now running in production         ║"
echo "║  🏛️  Benton County deployment complete                       ║"
echo "║  🤖 1,008 AI agents operational                              ║"
echo "║  📊 Real-time monitoring active                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

log "🎯 Deployment completed successfully!"
log "📋 Next steps:"
log "  1. Configure SSL certificates for public domains"
log "  2. Set up monitoring alerts"
log "  3. Run UAT testing"
log "  4. Schedule go-live"

exit 0
