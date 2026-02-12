#!/bin/bash

# TerraFusionPro-1 Enterprise Deployment Script
#
# This script automates the setup and deployment of the TerraFusionPro-1 application stack.
# It checks dependencies, handles environment configuration, manages SSL certificates,
# and ensures all services are healthy before completing.
#
# Usage:
#   bash scripts/deploy.sh
#   bash scripts/deploy.sh --clean
#   bash scripts/deploy.sh --no-cache

# --- Configuration & Helpers ---
set -e
set -o pipefail
set -u

# Color codes for logging
COLOR_RESET='\033[0m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[0;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'

log_info() {
    echo -e "${COLOR_BLUE}[INFO]${COLOR_RESET} $1"
}

log_success() {
    echo -e "${COLOR_GREEN}[SUCCESS]${COLOR_RESET} $1"
}

log_warn() {
    echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $1"
}

log_error() {
    echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $1"
    exit 1
}

# --- Dependency Checks ---
check_dependency() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed. Please install it to continue."
    fi
    log_info "$1 found."
}

log_info "Phase 1: Checking dependencies..."
check_dependency "docker"
check_dependency "docker-compose"
check_dependency "openssl"
log_success "All dependencies are installed."

# --- Argument Parsing ---
CLEAN_FLAG=false
NO_CACHE_FLAG=false
for arg in "$@"; do
    case $arg in
        --clean)
        CLEAN_FLAG=true
        shift
        ;;
        --no-cache)
        NO_CACHE_FLAG=true
        shift
        ;;
    esac
done

# --- Environment Setup ---
log_info "Phase 2: Setting up environment..."

if [ ! -f .env.example ]; then
    log_error ".env.example file not found. Please restore it from the repository."
fi

if [ ! -f .env ]; then
    log_warn ".env file not found. Copying from .env.example."
    cp .env.example .env
    log_info "Please review and edit the .env file with your specific configuration."
    # Optional: exit here to force user to edit, or continue with defaults
    # exit 1
fi

# Source .env file to make variables available
export "$(grep -v '^#' .env | xargs)"

# Validate critical variables
if [ -z "${JWT_SECRET:-}" ] || [ ${#JWT_SECRET} -lt 32 ]; then
    log_warn "JWT_SECRET is not set or is less than 32 characters. Please set a strong secret in .env."
fi
if [ -z "${DB_PASSWORD:-}" ] || [ -z "${DB_ROOT_PASSWORD:-}" ]; then
    log_warn "Database passwords are not set in .env. This is not recommended for production."
fi

log_success "Environment configuration loaded."

# --- SSL Certificate Handling ---
log_info "Phase 3: Handling SSL certificates..."
SSL_DIR="nginx/ssl"
mkdir -p "$SSL_DIR"

CERT_FILE="$SSL_DIR/cert.pem"
KEY_FILE="$SSL_DIR/key.pem"

if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    log_success "SSL certificates found."
else
    if [ "${NODE_ENV:-development}" == "production" ]; then
        log_error "In PRODUCTION mode, but SSL certificates not found at $CERT_FILE and $KEY_FILE. Please place your valid certificates there."
    else
        log_warn "SSL certificates not found. Generating self-signed certificates for DEVELOPMENT."
        openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
            -keyout "$KEY_FILE" \
            -out "$CERT_FILE" \
            -subj "/C=US/ST=California/L=San Francisco/O=TerraFusionDev/CN=localhost"
        log_success "Self-signed certificates generated."
    fi
fi

# --- Docker Operations ---
if [ "$CLEAN_FLAG" = true ]; then
    log_info "Phase 4: Cleaning previous Docker environment (--clean flag detected)..."
    docker-compose down -v --remove-orphans
    log_success "Docker environment cleaned."
fi

log_info "Phase 5: Building and starting Docker services..."
BUILD_ARGS=""
if [ "$NO_CACHE_FLAG" = true ]; then
    log_warn "Building app with --no-cache flag."
    BUILD_ARGS="--no-cache"
fi

docker-compose pull
docker-compose build $BUILD_ARGS
docker-compose up -d --remove-orphans

log_success "Docker services started."

# --- Service Health Verification ---
log_info "Phase 6: Verifying service health..."

wait_for_service() {
    local service_name=$1
    local command_to_run=$2
    local max_wait=60
    local current_wait=0

    log_info "Waiting for $service_name to be healthy..."
    while [ $current_wait -lt $max_wait ]; do
        if eval "$command_to_run" &> /dev/null; then
            log_success "$service_name is healthy."
            return 0
        fi
        sleep 2
        current_wait=$((current_wait + 2))
        echo -n "."
    done
    echo ""
    log_error "$service_name failed to become healthy after $max_wait seconds."
}

# Wait for Database
DB_HEALTH_CMD="docker-compose exec -T db mysqladmin ping -h'localhost' -u'root' -p'$DB_ROOT_PASSWORD'"
wait_for_service "Database (MySQL)" "$DB_HEALTH_CMD"

# Wait for Redis
REDIS_HEALTH_CMD="docker-compose exec -T redis redis-cli ping | grep PONG"
wait_for_service "Cache (Redis)" "$REDIS_HEALTH_CMD"

# Wait for Application
APP_PORT=${APP_PORT:-3000}
APP_HEALTH_CMD="curl -s -f http://localhost:$APP_PORT/api/health"
wait_for_service "Application" "$APP_HEALTH_CMD"

log_success "All services are up and healthy."

# --- Final Summary ---
log_info "--- Deployment Complete ---"
echo -e "${COLOR_GREEN}TerraFusionPro-1 is now running!${COLOR_RESET}"
echo ""
echo -e "Access URLs:"
echo -e "  - ${COLOR_YELLOW}Application:${COLOR_RESET} http://localhost:$APP_PORT"
echo -e "  - ${COLOR_YELLOW}Grafana:${COLOR_RESET}     http://localhost:3001 (user: admin, pass: from .env)"
echo -e "  - ${COLOR_YELLOW}Prometheus:${COLOR_RESET}  http://localhost:9090"
echo ""
echo -e "To view logs, run: ${COLOR_YELLOW}docker-compose logs -f [service_name]${COLOR_RESET} (e.g., app, db)"
echo -e "To stop services, run: ${COLOR_YELLOW}docker-compose down${COLOR_RESET}"
echo ""
