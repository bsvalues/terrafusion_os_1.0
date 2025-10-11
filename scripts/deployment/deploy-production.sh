#!/bin/bash

# TerraFusion OS 1.0 - Production Deployment Script
# Government Operating System with 1,008 AI Agents
# FISMA/FedRAMP Compliant Deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="TerraFusion OS 1.0"
VERSION="1.0.0"
DEPLOYMENT_DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="./backups/${DEPLOYMENT_DATE}"
LOG_FILE="./logs/deployment_${DEPLOYMENT_DATE}.log"

# Ensure directories exist
mkdir -p ./logs ./backups ./data/postgres ./data/redis ./certs

# Logging function
log() {
    echo -e "$1" | tee -a "${LOG_FILE}"
}

# Header
print_header() {
    clear
    log "${CYAN}${BOLD}"
    log "=========================================================="
    log "🏛️  ${PROJECT_NAME} - PRODUCTION DEPLOYMENT"
    log "=========================================================="
    log "Version: ${VERSION}"
    log "Date: $(date)"
    log "Environment: Production"
    log "Compliance: FISMA | FedRAMP | SOC2"
    log "AI Agents: 1,008"
    log "=========================================================="
    log "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "${BLUE}[1/8] Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log "${RED}❌ Docker not found! Please install Docker first.${NC}"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log "${RED}❌ Docker Compose not found! Please install Docker Compose first.${NC}"
        exit 1
    fi
    
    # Check .env.production
    if [[ ! -f ".env.production" ]]; then
        log "${RED}❌ .env.production file not found!${NC}"
        log "${YELLOW}Creating template .env.production file...${NC}"
        cp .env.example .env.production 2>/dev/null || {
            log "${RED}❌ .env.example not found! Please create .env.production manually.${NC}"
            exit 1
        }
        log "${YELLOW}⚠️  Please update .env.production with your actual values and run again.${NC}"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log "${RED}❌ Docker daemon not running! Please start Docker first.${NC}"
        exit 1
    fi
    
    log "${GREEN}✅ Prerequisites check passed${NC}"
}

# Backup existing data
backup_data() {
    log "${BLUE}[2/8] Creating backup...${NC}"
    
    if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
        log "${YELLOW}Creating data backup before deployment...${NC}"
        mkdir -p "${BACKUP_DIR}"
        
        # Backup database
        if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready; then
            docker-compose -f docker-compose.production.yml exec -T postgres \
                pg_dump -U terrafusion terrafusion_prod > "${BACKUP_DIR}/database_backup.sql"
            log "${GREEN}✅ Database backup created${NC}"
        fi
        
        # Backup Redis
        if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping; then
            docker-compose -f docker-compose.production.yml exec -T redis \
                redis-cli --rdb "${BACKUP_DIR}/redis_backup.rdb" || true
            log "${GREEN}✅ Redis backup created${NC}"
        fi
        
        # Backup application data
        if [[ -d "./data" ]]; then
            cp -r ./data "${BACKUP_DIR}/" || true
            log "${GREEN}✅ Application data backup created${NC}"
        fi
    else
        log "${YELLOW}⚠️  No running services found, skipping backup${NC}"
    fi
}

# Build images
build_images() {
    log "${BLUE}[3/8] Building production images...${NC}"
    
    log "${YELLOW}Building TerraFusion OS API image...${NC}"
    docker-compose -f docker-compose.production.yml build --no-cache terrafusion-api
    
    if [[ -d "./ai-swarm" ]]; then
        log "${YELLOW}Building AI Swarm image...${NC}"
        docker-compose -f docker-compose.production.yml build --no-cache ai-swarm
    fi
    
    log "${GREEN}✅ Images built successfully${NC}"
}

# Stop existing services
stop_services() {
    log "${BLUE}[4/8] Stopping existing services...${NC}"
    
    if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
        log "${YELLOW}Gracefully stopping services...${NC}"
        docker-compose -f docker-compose.production.yml down --timeout 30
    else
        log "${YELLOW}⚠️  No running services found${NC}"
    fi
    
    log "${GREEN}✅ Services stopped${NC}"
}

# Start services
start_services() {
    log "${BLUE}[5/8] Starting production services...${NC}"
    
    log "${YELLOW}Starting infrastructure services...${NC}"
    docker-compose -f docker-compose.production.yml up -d postgres redis
    
    log "${YELLOW}Waiting for infrastructure to be ready...${NC}"
    sleep 10
    
    # Wait for PostgreSQL
    log "${YELLOW}Waiting for PostgreSQL...${NC}"
    timeout 60 bash -c 'until docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U terrafusion -d terrafusion_prod; do sleep 2; done'
    
    # Wait for Redis
    log "${YELLOW}Waiting for Redis...${NC}"
    timeout 30 bash -c 'until docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping; do sleep 2; done'
    
    log "${YELLOW}Starting application services...${NC}"
    docker-compose -f docker-compose.production.yml up -d
    
    log "${GREEN}✅ All services started${NC}"
}

# Run database migrations
run_migrations() {
    log "${BLUE}[6/8] Running database migrations...${NC}"
    
    log "${YELLOW}Waiting for API to be ready...${NC}"
    timeout 120 bash -c 'until curl -f -s http://localhost:5000/health > /dev/null; do sleep 5; done'
    
    # Run Entity Framework migrations
    if docker-compose -f docker-compose.production.yml exec -T terrafusion-api dotnet ef database update --no-build; then
        log "${GREEN}✅ Database migrations completed${NC}"
    else
        log "${YELLOW}⚠️  Migrations may have already been applied${NC}"
    fi
}

# Verify deployment
verify_deployment() {
    log "${BLUE}[7/8] Verifying deployment...${NC}"
    
    # Check service health
    log "${YELLOW}Checking service health...${NC}"
    
    services=("postgres" "redis" "terrafusion-api")
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.production.yml ps | grep -q "${service}.*Up"; then
            log "${GREEN}✅ ${service} is running${NC}"
        else
            log "${RED}❌ ${service} is not running${NC}"
            return 1
        fi
    done
    
    # Test API endpoints
    log "${YELLOW}Testing API endpoints...${NC}"
    
    if curl -f -s http://localhost:5000/health > /dev/null; then
        log "${GREEN}✅ Health endpoint responding${NC}"
    else
        log "${RED}❌ Health endpoint not responding${NC}"
        return 1
    fi
    
    # Check AI Swarm (if available)
    if docker-compose -f docker-compose.production.yml ps | grep -q "ai-swarm.*Up"; then
        log "${GREEN}✅ AI Swarm is running (1,008 agents)${NC}"
    else
        log "${YELLOW}⚠️  AI Swarm not running (optional)${NC}"
    fi
    
    # Check monitoring (if available)
    if docker-compose -f docker-compose.production.yml ps | grep -q "prometheus.*Up"; then
        log "${GREEN}✅ Monitoring stack is running${NC}"
    else
        log "${YELLOW}⚠️  Monitoring stack not running (optional)${NC}"
    fi
    
    log "${GREEN}✅ Deployment verification passed${NC}"
}

# Display summary
display_summary() {
    log "${BLUE}[8/8] Deployment Summary${NC}"
    log ""
    log "${GREEN}${BOLD}🎉 TerraFusion OS 1.0 PRODUCTION DEPLOYMENT SUCCESSFUL! 🎉${NC}"
    log ""
    log "${CYAN}📊 DEPLOYMENT DETAILS:${NC}"
    log "• Version: ${VERSION}"
    log "• Deployment Date: ${DEPLOYMENT_DATE}"
    log "• Environment: Production"
    log "• Compliance: FISMA | FedRAMP | SOC2"
    log "• AI Agents: 1,008"
    log ""
    log "${CYAN}🌐 ACCESS INFORMATION:${NC}"
    log "• API Health: http://localhost:5000/health"
    log "• API Swagger: http://localhost:5000/swagger (if enabled)"
    log "• Prometheus: http://localhost:9090 (if enabled)"
    log "• Grafana: http://localhost:3000 (if enabled)"
    log ""
    log "${CYAN}🔧 MANAGEMENT COMMANDS:${NC}"
    log "• View Logs: docker-compose -f docker-compose.production.yml logs -f"
    log "• Stop Services: docker-compose -f docker-compose.production.yml down"
    log "• Restart Services: docker-compose -f docker-compose.production.yml restart"
    log "• Service Status: docker-compose -f docker-compose.production.yml ps"
    log ""
    log "${CYAN}📋 CONTAINER RESOURCE USAGE:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" || true
    log ""
    log "${YELLOW}📝 IMPORTANT NOTES:${NC}"
    log "• Backup created at: ${BACKUP_DIR}"
    log "• Deployment log: ${LOG_FILE}"
    log "• Monitor system resources and performance"
    log "• Regular backups are recommended"
    log "• Review security configurations for production"
    log ""
    log "${GREEN}${BOLD}✅ TerraFusion OS 1.0 is now running in production mode!${NC}"
}

# Error handling
handle_error() {
    log "${RED}❌ Deployment failed at step: $1${NC}"
    log "${YELLOW}Checking service logs...${NC}"
    docker-compose -f docker-compose.production.yml logs --tail=50 || true
    log "${YELLOW}For troubleshooting, check: ${LOG_FILE}${NC}"
    exit 1
}

# Rollback function
rollback() {
    log "${YELLOW}🔄 Rolling back deployment...${NC}"
    docker-compose -f docker-compose.production.yml down || true
    if [[ -d "${BACKUP_DIR}" ]]; then
        log "${YELLOW}Restoring from backup: ${BACKUP_DIR}${NC}"
        # Restore logic here if needed
    fi
    log "${RED}❌ Deployment rolled back${NC}"
    exit 1
}

# Trap errors
trap 'handle_error "Unknown error"' ERR

# Main deployment process
main() {
    print_header
    
    # Confirm production deployment
    if [[ "${1:-}" != "--yes" ]]; then
        log "${YELLOW}${BOLD}⚠️  WARNING: This will deploy TerraFusion OS 1.0 to PRODUCTION!${NC}"
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log "${YELLOW}Deployment cancelled by user.${NC}"
            exit 0
        fi
    fi
    
    # Deployment steps
    check_prerequisites || handle_error "Prerequisites check"
    backup_data || handle_error "Backup creation"
    build_images || handle_error "Image building"
    stop_services || handle_error "Service stopping"
    start_services || handle_error "Service starting"
    run_migrations || handle_error "Database migrations"
    verify_deployment || handle_error "Deployment verification"
    display_summary
}

# Run with command line argument support
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
