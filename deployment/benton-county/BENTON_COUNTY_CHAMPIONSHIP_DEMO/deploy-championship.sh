#!/bin/bash

# 🏆 Benton County Championship Demo - Production Deployment Script
# Deploys the complete TerraFusion ecosystem with monitoring

set -e  # Exit on any error

echo "🏆 TerraFusion Championship Deployment Starting..."
echo "=================================================="

# Configuration
COMPOSE_PROJECT_NAME="terrafusion-championship"
ENVIRONMENT=${ENVIRONMENT:-production}
BACKUP_BEFORE_DEPLOY=${BACKUP_BEFORE_DEPLOY:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Pre-deployment checks
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check available disk space (minimum 10GB)
    available_space=$(df . | tail -1 | awk '{print $4}')
    if [ "$available_space" -lt 10485760 ]; then  # 10GB in KB
        warn "Less than 10GB disk space available. Deployment may fail."
    fi
    
    # Check if ports are available
    for port in 3000 3001 5432 6379 9090 8080; do
        if netstat -tuln | grep -q ":$port "; then
            warn "Port $port is already in use. This may cause conflicts."
        fi
    done
    
    log "Prerequisites check completed ✅"
}

# Environment setup
setup_environment() {
    log "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        log "Creating .env file from template..."
        cp .env.example .env
        
        # Generate secure passwords
        POSTGRES_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        REDIS_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        GRAFANA_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
        
        # Update .env with generated passwords
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASS/" .env
        sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASS/" .env
        sed -i "s/GRAFANA_PASSWORD=.*/GRAFANA_PASSWORD=$GRAFANA_PASS/" .env
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        
        log "Environment file created with secure passwords ✅"
    fi
    
    # Create necessary directories
    mkdir -p logs backups data/exports monitoring/config
    
    log "Environment setup completed ✅"
}

# Backup existing deployment
backup_deployment() {
    if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
        log "Creating backup before deployment..."
        
        # Create backup directory with timestamp
        backup_dir="backups/pre-deploy-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"
        
        # Backup Docker volumes if they exist
        if docker volume ls | grep -q "${COMPOSE_PROJECT_NAME}"; then
            log "Backing up Docker volumes..."
            for volume in $(docker volume ls --format "{{.Name}}" | grep "${COMPOSE_PROJECT_NAME}"); do
                log "Backing up volume: $volume"
                docker run --rm \
                    -v "$volume":/source:ro \
                    -v "$(pwd)/$backup_dir":/backup \
                    alpine tar czf "/backup/${volume}.tar.gz" -C /source .
            done
        fi
        
        # Backup configuration files
        cp -r data "$backup_dir/" 2>/dev/null || true
        cp -r monitoring "$backup_dir/" 2>/dev/null || true
        cp .env "$backup_dir/" 2>/dev/null || true
        
        log "Backup completed: $backup_dir ✅"
    fi
}

# Build and deploy services
deploy_services() {
    log "Building and deploying services..."
    
    # Set Docker Compose project name
    export COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME"
    
    # Pull latest images
    log "Pulling latest images..."
    docker-compose pull
    
    # Build custom images
    log "Building TerraFusion application..."
    docker-compose build --no-cache benton-county-demo
    
    # Start services
    log "Starting services..."
    docker-compose up -d
    
    log "Services deployment initiated ✅"
}

# Health checks
wait_for_services() {
    log "Waiting for services to be healthy..."
    
    # Define services and their health check URLs
    declare -A services=(
        ["TerraFusion Demo"]="http://localhost:3000/api/demo/health"
        ["Grafana Dashboard"]="http://localhost:3001/api/health"
        ["Prometheus"]="http://localhost:9090/-/healthy"
        ["Traefik"]="http://localhost:8080/ping"
    )
    
    # Wait for each service
    for service in "${!services[@]}"; do
        url="${services[$service]}"
        log "Checking $service..."
        
        for i in {1..30}; do
            if curl -s -f "$url" > /dev/null 2>&1; then
                log "$service is healthy ✅"
                break
            fi
            
            if [ $i -eq 30 ]; then
                warn "$service health check failed after 5 minutes"
            else
                sleep 10
            fi
        done
    done
    
    log "Health checks completed ✅"
}

# Post-deployment configuration
post_deployment() {
    log "Running post-deployment configuration..."
    
    # Display service URLs and credentials
    echo ""
    echo "🏆 CHAMPIONSHIP DEPLOYMENT SUCCESSFUL! 🏆"
    echo "=========================================="
    echo ""
    echo "📊 Service URLs:"
    echo "  • Demo Application: http://localhost:3000"
    echo "  • Grafana Dashboard: http://localhost:3001"
    echo "  • Prometheus: http://localhost:9090"
    echo "  • Traefik Dashboard: http://localhost:8080"
    echo ""
    echo "🔑 Default Credentials:"
    echo "  • Grafana: admin / $(grep GRAFANA_PASSWORD .env | cut -d'=' -f2)"
    echo "  • Database: terrafusion / $(grep POSTGRES_PASSWORD .env | cut -d'=' -f2)"
    echo ""
    echo "📋 Management Commands:"
    echo "  • View logs: docker-compose logs -f"
    echo "  • Stop services: docker-compose down"
    echo "  • Restart: docker-compose restart"
    echo "  • Full cleanup: docker-compose down -v"
    echo ""
    echo "📈 Key Metrics:"
    echo "  • API Endpoint: http://localhost:3000/api/monitoring/performance"
    echo "  • Health Check: http://localhost:3000/api/demo/health"
    echo "  • Backup Status: http://localhost:3000/api/backup/list"
    echo ""
    echo "🎯 Ready for championship demonstration!"
    echo ""
}

# Cleanup function for interrupted deployments
cleanup() {
    if [ $? -ne 0 ]; then
        error "Deployment failed. Run 'docker-compose logs' to check service logs."
        warn "To clean up failed deployment: docker-compose down -v"
    fi
}

# Main deployment flow
main() {
    trap cleanup EXIT
    
    check_prerequisites
    setup_environment
    backup_deployment
    deploy_services
    wait_for_services
    post_deployment
    
    log "Championship deployment completed successfully! 🏆"
}

# Run main function
main "$@"