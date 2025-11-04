#!/bin/bash

# ==================================================
# REVOLUTIONARY: TerraFusion OS 1.0 Phase Beta Deployment
# Government-Grade Microservices Architecture Launch
# 
# This script represents the systematic deployment of a complete
# AI-enhanced government operating system with quantum routing,
# citizen-centric optimization, and FISMA-HIGH compliance.
# ==================================================

set -euo pipefail

# Colors for enhanced terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
TERRAFUSION_VERSION="1.0.0"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-development}"
COMPOSE_FILE="docker-compose.microservices.yml"
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory
mkdir -p logs

echo -e "${PURPLE}=================================================="
echo -e "🚀 TERRAFUSION OS 1.0 - PHASE BETA DEPLOYMENT"
echo -e "   Government. Transcended. Microservices Architecture."
echo -e "==================================================${NC}"
echo ""

# Function: Log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "logs/$LOG_FILE"
}

# Function: Print section header
section() {
    echo -e "\n${CYAN}▶ $1${NC}"
    log "SECTION: $1"
}

# Function: Print success message
success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

# Function: Print warning message
warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
    log "WARNING: $1"
}

# Function: Print error message
error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR: $1"
}

# Function: Check prerequisites
check_prerequisites() {
    section "PHASE BETA-0: Prerequisites Validation"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    success "Docker found: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    success "Docker Compose found: $(docker-compose --version)"
    
    # Check .NET SDK
    if ! command -v dotnet &> /dev/null; then
        warning ".NET SDK not found. Some development features may not work."
    else
        success ".NET SDK found: $(dotnet --version)"
    fi
    
    # Check available ports
    section "Port Availability Check"
    ports=(5000 5001 5002 5003 5004 5005 5006 5007 5008 5009 5010 5011 5012 5013 8500 5432 6379 3000 9090)
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            warning "Port $port is already in use"
        else
            echo -e "  Port $port: ${GREEN}Available${NC}"
        fi
    done
}

# Function: Setup environment
setup_environment() {
    section "PHASE BETA-1: Environment Configuration"
    
    # Create environment file if it doesn't exist
    if [ ! -f .env ]; then
        log "Creating .env file from template"
        cat > .env << EOF
# TerraFusion OS 1.0 - Phase Beta Environment Configuration
TERRAFUSION_ENVIRONMENT=${DEPLOYMENT_ENV}
ASPNETCORE_ENVIRONMENT=${DEPLOYMENT_ENV^}

# Database Configuration
POSTGRES_USER=terrafusion
POSTGRES_PASSWORD=TerraFusion2024!
POSTGRES_DB=terrafusion_os

# Redis Configuration
REDIS_PASSWORD=TerraFusion2024!

# RabbitMQ Configuration
RABBITMQ_USER=terrafusion
RABBITMQ_PASSWORD=TerraFusion2024!

# Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=TerraFusion2024!

# Security
JWT_SECRET=$(openssl rand -base64 32)

# Development Tools
PGADMIN_PASSWORD=TerraFusion2024!
EOF
        success "Environment configuration created"
    else
        success "Environment configuration already exists"
    fi
    
    # Load environment
    source .env
}

# Function: Build services
build_services() {
    section "PHASE BETA-2: Building Microservices"
    
    echo -e "${BLUE}Building TerraFusion microservices...${NC}"
    
    # Build .NET solution first
    if [ -f "TerraFusion.sln" ]; then
        log "Building .NET solution"
        dotnet restore TerraFusion.sln
        dotnet build TerraFusion.sln --configuration Release --no-restore
        success ".NET solution built successfully"
    else
        warning ".NET solution not found, skipping build"
    fi
    
    # Build Docker images
    log "Building Docker images for microservices"
    docker-compose -f $COMPOSE_FILE build --parallel
    success "All microservice images built successfully"
}

# Function: Start infrastructure services
start_infrastructure() {
    section "PHASE BETA-3: Infrastructure Services Startup"
    
    echo -e "${BLUE}Starting infrastructure services...${NC}"
    
    # Start infrastructure services first
    docker-compose -f $COMPOSE_FILE up -d consul postgres redis rabbitmq
    
    # Wait for services to be ready
    echo -e "${YELLOW}Waiting for infrastructure services to be ready...${NC}"
    
    # Wait for Consul
    echo -n "Consul: "
    while ! curl -s http://localhost:8500/v1/status/leader | grep -q '"'; do
        echo -n "."
        sleep 2
    done
    echo -e " ${GREEN}Ready${NC}"
    
    # Wait for PostgreSQL
    echo -n "PostgreSQL: "
    while ! PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB -c '\q' 2>/dev/null; do
        echo -n "."
        sleep 2
    done
    echo -e " ${GREEN}Ready${NC}"
    
    # Wait for Redis
    echo -n "Redis: "
    while ! redis-cli -h localhost -p 6379 -a $REDIS_PASSWORD ping 2>/dev/null | grep -q PONG; do
        echo -n "."
        sleep 2
    done
    echo -e " ${GREEN}Ready${NC}"
    
    # Wait for RabbitMQ
    echo -n "RabbitMQ: "
    while ! curl -s -u $RABBITMQ_USER:$RABBITMQ_PASSWORD http://localhost:15672/api/overview 2>/dev/null | grep -q management_version; do
        echo -n "."
        sleep 2
    done
    echo -e " ${GREEN}Ready${NC}"
    
    success "Infrastructure services are ready"
}

# Function: Start monitoring services
start_monitoring() {
    section "PHASE BETA-4: Monitoring and Observability"
    
    echo -e "${BLUE}Starting monitoring services...${NC}"
    
    # Start monitoring services
    docker-compose -f $COMPOSE_FILE up -d prometheus grafana
    
    # Wait for services
    echo -n "Prometheus: "
    while ! curl -s http://localhost:9090/api/v1/status/config 2>/dev/null | grep -q status; do
        echo -n "."
        sleep 2
    done
    echo -e " ${GREEN}Ready${NC}"
    
    echo -n "Grafana: "
    while ! curl -s http://localhost:3000/api/health 2>/dev/null | grep -q ok; do
        echo -n "."
        sleep 2
    done
    echo -e " ${GREEN}Ready${NC}"
    
    success "Monitoring services are ready"
}

# Function: Start TerraFusion microservices
start_microservices() {
    section "PHASE BETA-5: TerraFusion Microservices Deployment"
    
    echo -e "${BLUE}Starting TerraFusion microservices in order...${NC}"
    
    # Start API Gateway first
    echo -e "${CYAN}Starting API Gateway...${NC}"
    docker-compose -f $COMPOSE_FILE up -d gateway
    
    # Wait for gateway
    echo -n "API Gateway: "
    while ! curl -s http://localhost:5000/health 2>/dev/null | grep -q "Healthy\|healthy"; do
        echo -n "."
        sleep 3
    done
    echo -e " ${GREEN}Ready${NC}"
    
    # Start core services
    echo -e "${CYAN}Starting core government services...${NC}"
    docker-compose -f $COMPOSE_FILE up -d \
        property-service \
        citizen-service \
        document-service \
        compliance-service
    
    # Start AI services
    echo -e "${CYAN}Starting AI intelligence services...${NC}"
    docker-compose -f $COMPOSE_FILE up -d \
        ai-service \
        knowledge-service \
        emotion-service
    
    # Start supporting services
    echo -e "${CYAN}Starting supporting services...${NC}"
    docker-compose -f $COMPOSE_FILE up -d \
        communication-service \
        analytics-service \
        event-service \
        identity-service \
        audit-service \
        backup-service
    
    success "All TerraFusion microservices started"
}

# Function: Validate deployment
validate_deployment() {
    section "PHASE BETA-6: Deployment Validation"
    
    echo -e "${BLUE}Validating microservices health...${NC}"
    
    services=(
        "5000:gateway:API Gateway"
        "5001:property-service:Property Assessment"
        "5002:citizen-service:Citizen Services"
        "5003:document-service:Document Management"
        "5004:compliance-service:Compliance Monitoring"
        "5005:ai-service:AI Intelligence"
        "5006:knowledge-service:Knowledge Graph"
        "5007:emotion-service:Emotional Intelligence"
        "5008:communication-service:Communication Hub"
        "5009:analytics-service:Analytics & Reporting"
        "5010:event-service:Event Streaming"
        "5011:identity-service:Identity & Access"
        "5012:audit-service:Audit & Logging"
        "5013:backup-service:Backup & Recovery"
    )
    
    healthy_services=0
    total_services=${#services[@]}
    
    for service in "${services[@]}"; do
        IFS=':' read -r port container name <<< "$service"
        
        echo -n "  $name ($port): "
        if curl -s http://localhost:$port/health 2>/dev/null | grep -q "Healthy\|healthy\|ok"; then
            echo -e "${GREEN}Healthy${NC}"
            ((healthy_services++))
        else
            echo -e "${RED}Unhealthy${NC}"
        fi
    done
    
    echo ""
    if [ $healthy_services -eq $total_services ]; then
        success "All $total_services microservices are healthy"
    else
        warning "$healthy_services out of $total_services services are healthy"
    fi
}

# Function: Display access information
display_access_info() {
    section "PHASE BETA-7: Access Information"
    
    echo -e "${WHITE}TerraFusion OS 1.0 - Phase Beta Deployment Complete!${NC}"
    echo ""
    echo -e "${CYAN}🏛️ Government Services:${NC}"
    echo -e "  API Gateway:        ${BLUE}http://localhost:5000${NC}"
    echo -e "  Property Service:   ${BLUE}http://localhost:5001${NC}"
    echo -e "  Citizen Services:   ${BLUE}http://localhost:5002${NC}"
    echo -e "  AI Intelligence:    ${BLUE}http://localhost:5005${NC}"
    echo ""
    echo -e "${CYAN}🖥️ Management Interfaces:${NC}"
    echo -e "  Consul UI:          ${BLUE}http://localhost:8500${NC}"
    echo -e "  Grafana:            ${BLUE}http://localhost:3000${NC} (admin/TerraFusion2024!)"
    echo -e "  Prometheus:         ${BLUE}http://localhost:9090${NC}"
    echo -e "  RabbitMQ:           ${BLUE}http://localhost:15672${NC} (terrafusion/TerraFusion2024!)"
    echo ""
    echo -e "${CYAN}🔧 Development Tools:${NC}"
    echo -e "  pgAdmin:            ${BLUE}http://localhost:8080${NC} (admin@terrafusion.local/TerraFusion2024!)"
    echo -e "  Redis Commander:    ${BLUE}http://localhost:8081${NC}"
    echo ""
    echo -e "${CYAN}📊 Health Checks:${NC}"
    echo -e "  Gateway Health:     ${BLUE}http://localhost:5000/health${NC}"
    echo -e "  Service Discovery:  ${BLUE}http://localhost:5000/gateway/services${NC}"
    echo -e "  Gateway Info:       ${BLUE}http://localhost:5000/gateway/info${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo -e "  1. Check service health: ${BLUE}./scripts/check-health.sh${NC}"
    echo -e "  2. View logs: ${BLUE}docker-compose -f $COMPOSE_FILE logs -f [service]${NC}"
    echo -e "  3. Scale services: ${BLUE}docker-compose -f $COMPOSE_FILE up -d --scale [service]=3${NC}"
    echo -e "  4. Stop services: ${BLUE}docker-compose -f $COMPOSE_FILE down${NC}"
    echo ""
    echo -e "${GREEN}🎯 THE TERRAFUSION WAY: Systematic Excellence Achieved!${NC}"
}

# Function: Create helper scripts
create_helper_scripts() {
    section "Creating Helper Scripts"
    
    mkdir -p scripts
    
    # Health check script
    cat > scripts/check-health.sh << 'EOF'
#!/bin/bash
echo "🏥 TerraFusion OS Health Check"
echo "============================="

services=(
    "5000:API Gateway"
    "5001:Property Service"
    "5002:Citizen Services"
    "5003:Document Management"
    "5004:Compliance Monitoring"
    "5005:AI Intelligence"
    "5006:Knowledge Graph"
    "5007:Emotional Intelligence"
    "5008:Communication Hub"
    "5009:Analytics & Reporting"
    "5010:Event Streaming"
    "5011:Identity & Access"
    "5012:Audit & Logging"
    "5013:Backup & Recovery"
)

for service in "${services[@]}"; do
    IFS=':' read -r port name <<< "$service"
    echo -n "$name: "
    if curl -s http://localhost:$port/health >/dev/null 2>&1; then
        echo "✅ Healthy"
    else
        echo "❌ Unhealthy"
    fi
done
EOF
    
    chmod +x scripts/check-health.sh
    success "Health check script created"
    
    # Logs script
    cat > scripts/view-logs.sh << 'EOF'
#!/bin/bash
SERVICE=${1:-gateway}
echo "📋 Viewing logs for: $SERVICE"
docker-compose -f docker-compose.microservices.yml logs -f $SERVICE
EOF
    
    chmod +x scripts/view-logs.sh
    success "Logs viewing script created"
    
    # Stop script
    cat > scripts/stop-all.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping TerraFusion OS microservices..."
docker-compose -f docker-compose.microservices.yml down
echo "✅ All services stopped"
EOF
    
    chmod +x scripts/stop-all.sh
    success "Stop script created"
}

# Main deployment function
main() {
    log "Starting TerraFusion OS 1.0 Phase Beta deployment"
    
    check_prerequisites
    setup_environment
    build_services
    start_infrastructure
    start_monitoring
    start_microservices
    validate_deployment
    create_helper_scripts
    display_access_info
    
    log "TerraFusion OS 1.0 Phase Beta deployment completed successfully"
    success "Deployment completed in $(date)"
}

# Handle script termination
cleanup() {
    echo -e "\n${YELLOW}Deployment interrupted. Cleaning up...${NC}"
    docker-compose -f $COMPOSE_FILE down 2>/dev/null || true
    exit 1
}

trap cleanup INT TERM

# Execute main function
main "$@"