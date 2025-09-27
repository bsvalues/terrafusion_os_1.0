#!/bin/bash

# TerraFusion cOS Demo Environment Startup Script
# This script starts the complete demo environment with Harris PACS integration

set -e

# Demo configuration
DEMO_NAME="TerraFusion cOS Platform Demo"
DEMO_VERSION="1.0.0"
DEMO_COUNTY="Benton County, Washington"
DEMO_PROPERTY_COUNT="89,247"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Demo banner
print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║                     TerraFusion cOS Platform Demo                   ║"
    echo "║                  County Operating System Platform                   ║"
    echo "╠══════════════════════════════════════════════════════════════════════╣"
    echo "║  🏛️  County: ${DEMO_COUNTY}                            ║"
    echo "║  🏠  Properties: ${DEMO_PROPERTY_COUNT} parcels                               ║"
    echo "║  🤖  AI Agents: 50,000+ active agents                               ║"
    echo "║  🔗  Vendor Integration: Zero-rewrite platform substrate            ║"
    echo "║  🛡️  Compliance: FISMA Moderate, Government-grade security          ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Status logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking demo prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is required but not installed"
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is required but not installed"
        exit 1
    fi

    # Check available ports
    local ports=(80 443 3000 3001 3002 3003 5432 5433 6379 6380 8080 8081 8082 8083 8084 9090 9200 5601)
    local ports_in_use=()

    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            ports_in_use+=($port)
        fi
    done

    if [ ${#ports_in_use[@]} -gt 0 ]; then
        log_warning "The following ports are in use: ${ports_in_use[*]}"
        log_warning "Demo may not start correctly if these ports are required"
        echo
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Check system resources
    local total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2/1024}')
    if [ "$total_mem" -lt 8 ]; then
        log_warning "Demo requires at least 8GB RAM. Available: ${total_mem}GB"
        log_warning "Performance may be degraded"
    fi

    log_success "Prerequisites check completed"
}

# Clean previous demo environment
clean_demo() {
    log_info "Cleaning previous demo environment..."

    # Stop and remove containers
    docker-compose -f demo/deployment/docker-compose.demo.yml down -v --remove-orphans 2>/dev/null || true

    # Remove demo-specific volumes
    docker volume rm $(docker volume ls -q | grep terrafusion-demo) 2>/dev/null || true

    # Remove demo networks
    docker network rm $(docker network ls -q | grep terrafusion-demo) 2>/dev/null || true

    # Prune unused images (optional)
    if [ "$1" = "--full-clean" ]; then
        log_info "Performing full cleanup (removing images)..."
        docker image prune -f
        docker system prune -f --volumes
    fi

    log_success "Demo environment cleaned"
}

# Build demo images
build_demo_images() {
    log_info "Building demo container images..."

    cd "$(dirname "$0")/.."

    # Build platform core image
    log_info "Building TerraFusion Platform Core..."
    docker build -t terrafusion/platform-core:demo \
        -f deployment/containers/platform-core/Dockerfile \
        --build-arg BUILD_ENV=demo .

    # Build vendor integration sidecar
    log_info "Building Vendor Integration Sidecar..."
    docker build -t terrafusion/vendor-integration:demo \
        -f deployment/containers/vendor-integration/Dockerfile .

    # Build Harris PACS data pipeline
    log_info "Building Harris PACS Data Pipeline..."
    docker build -t terrafusion/harris-pacs-pipeline:demo \
        -f demo/data-pipeline/Dockerfile demo/data-pipeline/

    # Build vendor demo applications
    log_info "Building ACME Assessment Demo..."
    docker build -t terrafusion/acme-assessment:demo \
        -f demo/vendor-integrations/Dockerfile.acme-demo demo/vendor-integrations/

    log_info "Building GovGIS Solutions Demo..."
    docker build -t terrafusion/govgis-solutions:demo \
        -f demo/vendor-integrations/Dockerfile.govgis-demo demo/vendor-integrations/

    log_info "Building PaymentPro Government Demo..."
    docker build -t terrafusion/paymentpro-government:demo \
        -f demo/vendor-integrations/Dockerfile.paymentpro-demo demo/vendor-integrations/

    # Build demo dashboard
    log_info "Building Demo Dashboard..."
    docker build -t terrafusion/demo-dashboard:latest \
        -f demo/web-app/Dockerfile demo/web-app/

    log_success "Demo images built successfully"
}

# Initialize demo data
init_demo_data() {
    log_info "Initializing demo data..."

    # Wait for database to be ready
    log_info "Waiting for demo database to be ready..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f demo/deployment/docker-compose.demo.yml exec -T demo-postgres pg_isready -U demo_user -d terrafusion_demo >/dev/null 2>&1; then
            break
        fi
        sleep 2
        ((attempt++))
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "Database failed to become ready"
        return 1
    fi

    # Run data initialization
    log_info "Generating Harris PACS demo data (89,247 properties)..."
    docker-compose -f demo/deployment/docker-compose.demo.yml exec -T harris-pacs-pipeline \
        python3 harris-pacs-integration.py --init-data --property-count 89247

    # Initialize AI agent simulation data
    log_info "Initializing AI agent simulation data..."
    docker-compose -f demo/deployment/docker-compose.demo.yml exec -T demo-redis \
        redis-cli SET "ai:agents:total" "50000"
    docker-compose -f demo/deployment/docker-compose.demo.yml exec -T demo-redis \
        redis-cli SET "ai:agents:active" "47283"

    # Load demo configuration
    log_info "Loading demo configuration..."
    docker-compose -f demo/deployment/docker-compose.demo.yml exec -T demo-redis \
        redis-cli HMSET "demo:config" \
        "county" "Benton County" \
        "state" "Washington" \
        "property_count" "89247" \
        "demo_version" "1.0.0" \
        "started_at" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    log_success "Demo data initialized successfully"
}

# Start demo services
start_demo_services() {
    log_info "Starting TerraFusion cOS demo services..."

    cd "$(dirname "$0")/.."

    # Start core infrastructure first
    log_info "Starting core infrastructure (database, cache)..."
    docker-compose -f demo/deployment/docker-compose.demo.yml up -d \
        demo-postgres demo-redis

    # Wait for infrastructure
    sleep 10

    # Start platform services
    log_info "Starting platform core services..."
    docker-compose -f demo/deployment/docker-compose.demo.yml up -d \
        platform-core-demo vendor-integration-demo

    # Wait for platform to be ready
    sleep 15

    # Start data pipeline
    log_info "Starting Harris PACS data pipeline..."
    docker-compose -f demo/deployment/docker-compose.demo.yml up -d \
        harris-pacs-pipeline

    # Start vendor demo applications
    log_info "Starting vendor demo applications..."
    docker-compose -f demo/deployment/docker-compose.demo.yml up -d \
        acme-assessment-demo govgis-demo paymentpro-demo

    # Start web interface and monitoring
    log_info "Starting demo dashboard and monitoring..."
    docker-compose -f demo/deployment/docker-compose.demo.yml up -d \
        demo-dashboard demo-nginx demo-prometheus demo-grafana

    # Start AI simulation and additional services
    log_info "Starting AI agent simulation and additional services..."
    docker-compose -f demo/deployment/docker-compose.demo.yml up -d \
        ai-agent-simulator demo-elasticsearch demo-kibana demo-health-monitor

    log_success "Demo services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for demo services to become ready..."

    local services=(
        "http://localhost:3000/health|TerraFusion Platform Core"
        "http://localhost:3001/health|Vendor Integration Sidecar"
        "http://localhost:3002|Demo Dashboard"
        "http://localhost:8082/health|ACME Assessment Demo"
        "http://localhost:8083/health|GovGIS Solutions Demo"
        "http://localhost:8084/health|PaymentPro Government Demo"
        "http://localhost:9090|Prometheus Monitoring"
        "http://localhost:3003|Grafana Dashboard"
    )

    local max_wait=300  # 5 minutes
    local waited=0

    for service in "${services[@]}"; do
        IFS='|' read -ra SERVICE_INFO <<< "$service"
        local url="${SERVICE_INFO[0]}"
        local name="${SERVICE_INFO[1]}"

        log_info "Waiting for ${name}..."

        while [ $waited -lt $max_wait ]; do
            if curl -f -s "$url" > /dev/null 2>&1; then
                log_success "${name} is ready"
                break
            fi
            sleep 5
            ((waited+=5))
        done

        if [ $waited -ge $max_wait ]; then
            log_warning "${name} did not become ready within timeout"
        fi
    done
}

# Display demo information
show_demo_info() {
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    DEMO ENVIRONMENT READY                           ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${BLUE}🎯 Demo Access Points:${NC}"
    echo
    echo -e "  🏠 ${YELLOW}Main Demo Dashboard:${NC}       http://localhost:3002"
    echo -e "  🏛️ ${YELLOW}Platform Core API:${NC}         http://localhost:3000"
    echo -e "  🔗 ${YELLOW}Vendor Integration:${NC}        http://localhost:3001"
    echo
    echo -e "${BLUE}🏢 Vendor Demo Applications:${NC}"
    echo
    echo -e "  📊 ${YELLOW}ACME Assessment Pro:${NC}       http://localhost:8082"
    echo -e "  🗺️  ${YELLOW}GovGIS Solutions:${NC}          http://localhost:8083"
    echo -e "  💳 ${YELLOW}PaymentPro Government:${NC}     http://localhost:8084"
    echo
    echo -e "${BLUE}📈 Monitoring & Analytics:${NC}"
    echo
    echo -e "  📊 ${YELLOW}Prometheus Metrics:${NC}        http://localhost:9090"
    echo -e "  📈 ${YELLOW}Grafana Dashboard:${NC}         http://localhost:3003 (admin/demo_admin_2024)"
    echo -e "  📋 ${YELLOW}Kibana Logs:${NC}               http://localhost:5601"
    echo
    echo -e "${BLUE}🗄️ Data Sources:${NC}"
    echo
    echo -e "  🗃️  ${YELLOW}Demo Database:${NC}             postgresql://demo_user:demo_pass_2024@localhost:5433/terrafusion_demo"
    echo -e "  🔴 ${YELLOW}Redis Cache:${NC}                redis://localhost:6380"
    echo
    echo -e "${BLUE}📋 Demo Features:${NC}"
    echo
    echo -e "  ✅ Harris PACS database replica with ${DEMO_PROPERTY_COUNT} properties"
    echo -e "  ✅ Real-time AI agent simulation (50,000+ agents)"
    echo -e "  ✅ Zero-rewrite vendor integration demonstrations"
    echo -e "  ✅ Government-grade security and compliance"
    echo -e "  ✅ Interactive dashboard with live data"
    echo -e "  ✅ Multi-vendor ecosystem simulation"
    echo
    echo -e "${BLUE}🎭 Demo Scenarios:${NC}"
    echo
    echo -e "  👔 ${YELLOW}Government Executive:${NC}       Platform overview and ROI analysis"
    echo -e "  🏢 ${YELLOW}Vendor Partnership:${NC}         Zero-rewrite integration showcase"
    echo -e "  🔧 ${YELLOW}Technical Deep Dive:${NC}        Architecture and AI coordination"
    echo -e "  👥 ${YELLOW}Citizen Services:${NC}           Public-facing service delivery"
    echo
    echo -e "${BLUE}🎮 Demo Controls:${NC}"
    echo
    echo -e "  ▶️  Start real-time simulation:   ${YELLOW}curl -X POST http://localhost:3000/api/demo/start${NC}"
    echo -e "  ⏸️  Pause simulation:             ${YELLOW}curl -X POST http://localhost:3000/api/demo/pause${NC}"
    echo -e "  📊 Get demo status:               ${YELLOW}curl http://localhost:3000/api/demo/status${NC}"
    echo -e "  🔄 Reset demo data:               ${YELLOW}curl -X POST http://localhost:3000/api/demo/reset${NC}"
    echo
    echo -e "${BLUE}🛠️ Management Commands:${NC}"
    echo
    echo -e "  📋 View logs:           ${YELLOW}docker-compose -f demo/deployment/docker-compose.demo.yml logs -f${NC}"
    echo -e "  ⏹️  Stop demo:            ${YELLOW}docker-compose -f demo/deployment/docker-compose.demo.yml down${NC}"
    echo -e "  🔄 Restart services:    ${YELLOW}docker-compose -f demo/deployment/docker-compose.demo.yml restart${NC}"
    echo
    echo -e "${GREEN}🎉 Demo is ready! Visit http://localhost:3002 to get started.${NC}"
    echo
}

# Health check for running demo
health_check() {
    log_info "Performing demo environment health check..."

    local healthy=true

    # Check core services
    local services=(
        "demo-postgres|PostgreSQL Database"
        "demo-redis|Redis Cache"
        "terrafusion-platform-demo|Platform Core"
        "terrafusion-vendor-integration-demo|Vendor Integration"
        "terrafusion-demo-dashboard|Demo Dashboard"
        "acme-assessment-demo|ACME Assessment Demo"
    )

    for service in "${services[@]}"; do
        IFS='|' read -ra SERVICE_INFO <<< "$service"
        local container="${SERVICE_INFO[0]}"
        local name="${SERVICE_INFO[1]}"

        if docker ps --filter "name=${container}" --filter "status=running" --quiet | grep -q .; then
            log_success "${name} is running"
        else
            log_error "${name} is not running"
            healthy=false
        fi
    done

    # Check HTTP endpoints
    local endpoints=(
        "http://localhost:3000/health|Platform Core Health"
        "http://localhost:3002|Demo Dashboard"
        "http://localhost:8082/health|ACME Assessment Health"
    )

    for endpoint in "${endpoints[@]}"; do
        IFS='|' read -ra ENDPOINT_INFO <<< "$endpoint"
        local url="${ENDPOINT_INFO[0]}"
        local name="${ENDPOINT_INFO[1]}"

        if curl -f -s "$url" > /dev/null 2>&1; then
            log_success "${name} is responding"
        else
            log_error "${name} is not responding"
            healthy=false
        fi
    done

    if [ "$healthy" = true ]; then
        log_success "All demo services are healthy"
        return 0
    else
        log_error "Some demo services are not healthy"
        return 1
    fi
}

# Main execution
main() {
    local action="${1:-start}"

    case $action in
        "start")
            print_banner
            check_prerequisites
            clean_demo
            build_demo_images
            start_demo_services
            init_demo_data
            wait_for_services
            show_demo_info
            ;;
        "stop")
            log_info "Stopping TerraFusion cOS demo environment..."
            docker-compose -f demo/deployment/docker-compose.demo.yml down
            log_success "Demo environment stopped"
            ;;
        "restart")
            log_info "Restarting TerraFusion cOS demo environment..."
            docker-compose -f demo/deployment/docker-compose.demo.yml restart
            log_success "Demo environment restarted"
            ;;
        "clean")
            clean_demo --full-clean
            ;;
        "health")
            health_check
            ;;
        "logs")
            docker-compose -f demo/deployment/docker-compose.demo.yml logs -f "${2:-}"
            ;;
        "status")
            docker-compose -f demo/deployment/docker-compose.demo.yml ps
            ;;
        "rebuild")
            clean_demo
            build_demo_images
            log_success "Demo images rebuilt"
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|clean|health|logs|status|rebuild}"
            echo
            echo "Commands:"
            echo "  start    - Start complete demo environment"
            echo "  stop     - Stop demo environment"
            echo "  restart  - Restart demo services"
            echo "  clean    - Clean demo environment and images"
            echo "  health   - Check demo service health"
            echo "  logs     - View demo service logs"
            echo "  status   - Show demo service status"
            echo "  rebuild  - Rebuild demo images"
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}Demo startup interrupted${NC}"; exit 130' INT

# Run main function
main "$@"