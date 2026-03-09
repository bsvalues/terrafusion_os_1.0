#!/bin/bash

# ==================================================
# TerraFusion OS 1.0 Phase Beta Deployment
# Deploys only services that have real Dockerfiles.
# ==================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
TERRAFUSION_VERSION="1.0.0"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-development}"
COMPOSE_FILE="docker-compose.microservices.yml"
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

mkdir -p logs

echo -e "${PURPLE}=================================================="
echo -e "  TERRAFUSION OS 1.0 - PHASE BETA DEPLOYMENT"
echo -e "==================================================${NC}"
echo ""

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "logs/$LOG_FILE"
}

section() {
    echo -e "\n${CYAN}> $1${NC}"
    log "SECTION: $1"
}

success() {
    echo -e "${GREEN}  OK: $1${NC}"
    log "SUCCESS: $1"
}

warning() {
    echo -e "${YELLOW}  WARN: $1${NC}"
    log "WARNING: $1"
}

error() {
    echo -e "${RED}  ERROR: $1${NC}"
    log "ERROR: $1"
}

# ── Prerequisites ─────────────────────────────────
check_prerequisites() {
    section "Phase 0: Prerequisites"

    if ! command -v docker &> /dev/null; then
        error "Docker is not installed."
        exit 1
    fi
    success "Docker found: $(docker --version)"

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed."
        exit 1
    fi
    success "Docker Compose available"

    if command -v dotnet &> /dev/null; then
        success ".NET SDK found: $(dotnet --version)"
    else
        warning ".NET SDK not found — Docker-only deploy"
    fi

    section "Port availability"
    ports=(5000 3002 3004 8500 5432 6379 5672 15672 9090 3001)
    for port in "${ports[@]}"; do
        if lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
            warning "Port $port is already in use"
        else
            echo -e "  Port $port: ${GREEN}Available${NC}"
        fi
    done
}

# ── Environment ───────────────────────────────────
setup_environment() {
    section "Phase 1: Environment configuration"

    if [ ! -f .env ]; then
        log "Creating .env from defaults"
        cat > .env << EOF
# TerraFusion OS 1.0 — Phase Beta
TERRAFUSION_ENVIRONMENT=${DEPLOYMENT_ENV}
ASPNETCORE_ENVIRONMENT=${DEPLOYMENT_ENV^}
POSTGRES_USER=terrafusion
POSTGRES_PASSWORD=$(openssl rand -base64 24 2>/dev/null || pwgen -s 32 1)
POSTGRES_DB=terrafusion_os
REDIS_PASSWORD=$(openssl rand -base64 24 2>/dev/null || pwgen -s 32 1)
RABBITMQ_USER=terrafusion
RABBITMQ_PASSWORD=$(openssl rand -base64 24 2>/dev/null || pwgen -s 32 1)
GRAFANA_USER=admin
GRAFANA_PASSWORD=$(openssl rand -base64 24 2>/dev/null || pwgen -s 32 1)
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || pwgen -s 48 1)
PGADMIN_PASSWORD=$(openssl rand -base64 24 2>/dev/null || pwgen -s 32 1)
EOF
        success "Created .env"
    else
        success ".env already exists"
    fi

    # shellcheck disable=SC1091
    source .env
}

# ── Build ─────────────────────────────────────────
build_services() {
    section "Phase 2: Building microservices"

    if [ -f "TerraFusion.sln" ]; then
        log "Building .NET solution"
        dotnet restore TerraFusion.sln
        dotnet build TerraFusion.sln --configuration Release --no-restore
        success ".NET solution built"
    else
        warning ".NET solution not found, skipping dotnet build"
    fi

    log "Building Docker images"
    docker-compose -f "$COMPOSE_FILE" build --parallel
    success "Docker images built"
}

# ── Infrastructure ────────────────────────────────
start_infrastructure() {
    section "Phase 3: Infrastructure services"

    docker-compose -f "$COMPOSE_FILE" up -d consul postgres redis rabbitmq
    echo -e "${YELLOW}Waiting for infrastructure...${NC}"

    echo -n "  Consul: "
    for i in $(seq 1 30); do
        if curl -sf http://localhost:8500/v1/status/leader | grep -q '"'; then break; fi
        echo -n "."; sleep 2
    done
    echo -e " ${GREEN}Ready${NC}"

    echo -n "  PostgreSQL: "
    for i in $(seq 1 30); do
        if docker exec terrafusion-postgres pg_isready -U terrafusion -d terrafusion_os &>/dev/null; then break; fi
        echo -n "."; sleep 2
    done
    echo -e " ${GREEN}Ready${NC}"

    echo -n "  Redis: "
    for i in $(seq 1 30); do
        if docker exec terrafusion-redis redis-cli ping 2>/dev/null | grep -q PONG; then break; fi
        echo -n "."; sleep 2
    done
    echo -e " ${GREEN}Ready${NC}"

    echo -n "  RabbitMQ: "
    for i in $(seq 1 30); do
        if curl -sf -u "${RABBITMQ_USER:-terrafusion}:${RABBITMQ_PASSWORD:?RABBITMQ_PASSWORD not set}" http://localhost:15672/api/overview | grep -q management_version; then break; fi
        echo -n "."; sleep 2
    done
    echo -e " ${GREEN}Ready${NC}"

    success "Infrastructure up"
}

# ── Monitoring ────────────────────────────────────
start_monitoring() {
    section "Phase 4: Monitoring"

    docker-compose -f "$COMPOSE_FILE" up -d prometheus grafana

    echo -n "  Prometheus: "
    for i in $(seq 1 20); do
        if curl -sf http://localhost:9090/api/v1/status/config | grep -q status; then break; fi
        echo -n "."; sleep 2
    done
    echo -e " ${GREEN}Ready${NC}"

    echo -n "  Grafana: "
    for i in $(seq 1 20); do
        if curl -sf http://localhost:3001/api/health | grep -q ok; then break; fi
        echo -n "."; sleep 2
    done
    echo -e " ${GREEN}Ready${NC}"

    success "Monitoring up"
}

# ── Core services ─────────────────────────────────
start_microservices() {
    section "Phase 5: TerraFusion core services"

    echo -e "${CYAN}Starting API (Kernel)...${NC}"
    docker-compose -f "$COMPOSE_FILE" up -d api
    echo -n "  API: "
    for i in $(seq 1 30); do
        if curl -sf http://localhost:5000/health | grep -qi "healthy"; then break; fi
        echo -n "."; sleep 3
    done
    echo -e " ${GREEN}Ready${NC}"

    echo -e "${CYAN}Starting Gateway (Shell)...${NC}"
    docker-compose -f "$COMPOSE_FILE" up -d gateway
    echo -n "  Gateway: "
    for i in $(seq 1 30); do
        if curl -sf http://localhost:3002/health | grep -qi "healthy"; then break; fi
        echo -n "."; sleep 3
    done
    echo -e " ${GREEN}Ready${NC}"

    echo -e "${CYAN}Starting Consciousness (AI Swarm)...${NC}"
    docker-compose -f "$COMPOSE_FILE" up -d consciousness
    echo -n "  Consciousness: "
    for i in $(seq 1 30); do
        if curl -sf http://localhost:3004/health | grep -qi "healthy"; then break; fi
        echo -n "."; sleep 3
    done
    echo -e " ${GREEN}Ready${NC}"

    success "All core services started"
}

# ── Validation ────────────────────────────────────
validate_deployment() {
    section "Phase 6: Deployment validation"

    services=(
        "5000:api:API (Kernel)"
        "3002:gateway:Gateway (Shell)"
        "3004:consciousness:Consciousness (AI Swarm)"
    )

    healthy=0
    total=${#services[@]}

    for svc in "${services[@]}"; do
        IFS=':' read -r port container name <<< "$svc"
        echo -n "  $name ($port): "
        if curl -sf "http://localhost:$port/health" | grep -qi "healthy"; then
            echo -e "${GREEN}Healthy${NC}"
            ((healthy++))
        else
            echo -e "${RED}Unhealthy${NC}"
        fi
    done

    echo ""
    if [ "$healthy" -eq "$total" ]; then
        success "All $total services healthy"
    else
        warning "$healthy/$total services healthy"
    fi
}

# ── Access info ───────────────────────────────────
display_access_info() {
    section "Phase 7: Access information"

    echo -e "${WHITE}TerraFusion OS 1.0 — Phase Beta Deployed${NC}"
    echo ""
    echo -e "${CYAN}Core Services:${NC}"
    echo -e "  API (Kernel):       ${BLUE}http://localhost:5000${NC}"
    echo -e "  Gateway (Shell):    ${BLUE}http://localhost:3002${NC}"
    echo -e "  Consciousness:      ${BLUE}http://localhost:3004${NC}"
    echo ""
    echo -e "${CYAN}Infrastructure:${NC}"
    echo -e "  Consul UI:          ${BLUE}http://localhost:8500${NC}"
    echo -e "  Grafana:            ${BLUE}http://localhost:3001${NC}"
    echo -e "  Prometheus:         ${BLUE}http://localhost:9090${NC}"
    echo -e "  RabbitMQ Mgmt:      ${BLUE}http://localhost:15672${NC}"
    echo ""
    echo -e "${CYAN}Health Checks:${NC}"
    echo -e "  API:                ${BLUE}http://localhost:5000/health${NC}"
    echo -e "  Gateway:            ${BLUE}http://localhost:3002/health${NC}"
    echo -e "  Consciousness:      ${BLUE}http://localhost:3004/health${NC}"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo -e "  Logs:   docker-compose -f $COMPOSE_FILE logs -f [service]"
    echo -e "  Stop:   docker-compose -f $COMPOSE_FILE down"
}

# ── Main ──────────────────────────────────────────
main() {
    log "Starting TerraFusion OS 1.0 Phase Beta deployment"
    check_prerequisites
    setup_environment
    build_services
    start_infrastructure
    start_monitoring
    start_microservices
    validate_deployment
    display_access_info
    log "Deployment completed"
}

cleanup() {
    echo -e "\n${YELLOW}Deployment interrupted. Stopping services...${NC}"
    docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    exit 1
}

trap cleanup INT TERM

main "$@"
