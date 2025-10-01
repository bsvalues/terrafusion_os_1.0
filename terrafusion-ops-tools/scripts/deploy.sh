#!/bin/bash
#
# TerraFusion Automated Deployment Script
# Handles blue-green deployment with health checks and automatic rollback
#
# Usage: ./deploy.sh [environment] [version]
# Example: ./deploy.sh production v1.2.3

set -euo pipefail

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
DEPLOY_DIR="/opt/terrafusion"
BACKUP_DIR="/opt/terrafusion/backups/deployments"
LOG_FILE="/var/log/terrafusion/deployment_$(date +%Y%m%d_%H%M%S).log"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_DELAY=10
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create directories
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$BACKUP_DIR"

# Logging functions
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

# Notification function
notify() {
    local status=$1
    local message=$2
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Deployment $status: $message\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
    
    # Email notification
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "TerraFusion Deployment $status" ops-team@terrafusion.com || true
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if running as appropriate user
    if [ "$EUID" -ne 0 ] && [ "$ENVIRONMENT" = "production" ]; then 
        log_error "Production deployments must be run as root"
        exit 1
    fi
    
    # Check disk space (need at least 5GB)
    available_space=$(df "$DEPLOY_DIR" | awk 'NR==2 {print int($4/1024/1024)}')
    if [ "$available_space" -lt 5 ]; then
        log_error "Insufficient disk space. At least 5GB required, only ${available_space}GB available"
        exit 1
    fi
    
    # Verify version/tag exists
    if ! git ls-remote --tags origin | grep -q "$VERSION"; then
        log_warning "Version $VERSION not found in git tags, proceeding anyway"
    fi
    
    # Check if services are healthy before deployment
    if ! check_health; then
        log_warning "Current services not healthy, proceeding with deployment"
    fi
    
    log_success "Pre-deployment checks passed"
}

# Health check function
check_health() {
    local services=("backend:${TF_STATIC_PORT:-8080}" "ai-engine:8001" "frontend:3003")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        local name="${service%%:*}"
        local port="${service##*:}"
        
        if curl -sf "http://localhost:$port/health" > /dev/null; then
            log "✓ $name is healthy"
        else
            log_warning "✗ $name is not responding"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        return 0
    else
        return 1
    fi
}

# Backup current deployment
backup_current() {
    log "Backing up current deployment..."
    
    local backup_name="deployment_backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Backup application code
    cp -r "$DEPLOY_DIR/backend" "$backup_path/" 2>/dev/null || true
    cp -r "$DEPLOY_DIR/frontend" "$backup_path/" 2>/dev/null || true
    cp -r "$DEPLOY_DIR/ai_engine" "$backup_path/" 2>/dev/null || true
    
    # Backup configurations
    cp -r "$DEPLOY_DIR/.env" "$backup_path/" 2>/dev/null || true
    cp -r "$DEPLOY_DIR/configs" "$backup_path/" 2>/dev/null || true
    
    # Save current version info
    echo "$VERSION" > "$backup_path/previous_version.txt"
    
    log_success "Backup completed: $backup_path"
    echo "$backup_path"
}

# Deploy backend service
deploy_backend() {
    log "Deploying backend service..."
    
    cd "$DEPLOY_DIR/backend"
    
    # Pull latest code
    git fetch --tags
    git checkout "$VERSION"
    
    # Install dependencies
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    
    # Run migrations
    log "Running database migrations..."
    alembic upgrade head
    
    # Restart service with zero downtime
    log "Restarting backend service..."
    sudo systemctl reload terrafusion-backend || sudo systemctl restart terrafusion-backend
    
    deactivate
    log_success "Backend deployed"
}

# Deploy AI engine
deploy_ai_engine() {
    log "Deploying AI engine..."
    
    cd "$DEPLOY_DIR/ai_engine"
    
    # Pull latest code
    git fetch --tags
    git checkout "$VERSION"
    
    # Install dependencies
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    
    # Download/update models if needed
    if [ -f "scripts/update_models.sh" ]; then
        ./scripts/update_models.sh
    fi
    
    # Restart service
    log "Restarting AI engine..."
    sudo systemctl restart terrafusion-ai-engine
    
    deactivate
    log_success "AI engine deployed"
}

# Deploy frontend
deploy_frontend() {
    log "Deploying frontend..."
    
    cd "$DEPLOY_DIR/frontend"
    
    # Pull latest code
    git fetch --tags
    git checkout "$VERSION"
    
    # Install dependencies and build
    npm ci
    npm run build
    
    # Deploy to web server (blue-green style)
    local current_link="/var/www/terrafusion"
    local new_build="/var/www/terrafusion-$VERSION"
    local old_build="/var/www/terrafusion-old"
    
    # Copy new build
    rm -rf "$new_build"
    cp -r build "$new_build"
    
    # Atomic switch
    if [ -L "$current_link" ]; then
        local current_target=$(readlink "$current_link")
        ln -sfn "$current_target" "$old_build"
    fi
    ln -sfn "$new_build" "$current_link"
    
    # Reload web server
    sudo systemctl reload nginx
    
    log_success "Frontend deployed"
}

# Deploy workers
deploy_workers() {
    log "Deploying background workers..."
    
    # Stop workers gracefully
    sudo systemctl stop terrafusion-worker || true
    sudo systemctl stop terrafusion-scheduler || true
    
    # Wait for current jobs to complete
    sleep 10
    
    # Start workers with new code
    sudo systemctl start terrafusion-worker
    sudo systemctl start terrafusion-scheduler
    
    log_success "Workers deployed"
}

# Post-deployment validation
post_deployment_validation() {
    log "Running post-deployment validation..."
    
    local attempt=1
    local healthy=false
    
    while [ $attempt -le $HEALTH_CHECK_RETRIES ]; do
        log "Health check attempt $attempt/$HEALTH_CHECK_RETRIES..."
        
        if check_health; then
            healthy=true
            break
        fi
        
        sleep $HEALTH_CHECK_DELAY
        ((attempt++))
    done
    
    if [ "$healthy" = false ]; then
        log_error "Health checks failed after deployment"
        return 1
    fi
    
    # Run smoke tests
    if [ -f "$DEPLOY_DIR/scripts/smoke_tests.sh" ]; then
        log "Running smoke tests..."
        if ! "$DEPLOY_DIR/scripts/smoke_tests.sh"; then
            log_error "Smoke tests failed"
            return 1
        fi
    fi
    
    log_success "Post-deployment validation passed"
    return 0
}

# Rollback function
rollback() {
    local backup_path=$1
    
    log_error "Initiating rollback to $backup_path"
    notify "ROLLBACK" "Deployment failed, rolling back to previous version"
    
    # Stop services
    sudo systemctl stop terrafusion-backend terrafusion-ai-engine terrafusion-worker terrafusion-scheduler
    
    # Restore code
    if [ -d "$backup_path/backend" ]; then
        rm -rf "$DEPLOY_DIR/backend"
        cp -r "$backup_path/backend" "$DEPLOY_DIR/"
    fi
    
    if [ -d "$backup_path/frontend" ]; then
        rm -rf "$DEPLOY_DIR/frontend"
        cp -r "$backup_path/frontend" "$DEPLOY_DIR/"
    fi
    
    if [ -d "$backup_path/ai_engine" ]; then
        rm -rf "$DEPLOY_DIR/ai_engine"
        cp -r "$backup_path/ai_engine" "$DEPLOY_DIR/"
    fi
    
    # Restore configs
    if [ -f "$backup_path/.env" ]; then
        cp "$backup_path/.env" "$DEPLOY_DIR/"
    fi
    
    # Restart services
    sudo systemctl start terrafusion-backend terrafusion-ai-engine terrafusion-worker terrafusion-scheduler
    sudo systemctl reload nginx
    
    # Verify rollback
    sleep 10
    if check_health; then
        log_success "Rollback completed successfully"
        notify "SUCCESS" "Rollback completed, services restored"
    else
        log_error "Rollback failed - manual intervention required!"
        notify "CRITICAL" "Rollback failed - manual intervention required!"
        exit 1
    fi
}

# Main deployment flow
main() {
    log "========================================="
    log "TerraFusion Deployment Started"
    log "Environment: $ENVIRONMENT"
    log "Version: $VERSION"
    log "========================================="
    
    notify "STARTED" "Deploying version $VERSION to $ENVIRONMENT"
    
    # Pre-deployment checks
    pre_deployment_checks
    
    # Backup current deployment
    BACKUP_PATH=$(backup_current)
    
    # Deploy components
    deploy_backend
    deploy_ai_engine
    deploy_frontend
    deploy_workers
    
    # Validate deployment
    if post_deployment_validation; then
        log_success "Deployment completed successfully!"
        notify "SUCCESS" "Version $VERSION deployed to $ENVIRONMENT successfully"
        
        # Cleanup old builds (keep last 3)
        find /var/www -name "terrafusion-*" -type d | sort -r | tail -n +4 | xargs rm -rf
        
        # Tag deployment in git
        if [ "$ENVIRONMENT" = "production" ]; then
            git tag -a "deployed-prod-$(date +%Y%m%d-%H%M%S)" -m "Deployed $VERSION to production"
            git push --tags
        fi
    else
        log_error "Deployment validation failed!"
        rollback "$BACKUP_PATH"
        exit 1
    fi
    
    log "========================================="
    log "Deployment completed at $(date)"
    log "========================================="
}

# Handle interrupts
trap 'log_error "Deployment interrupted!"; exit 1' INT TERM

# Run main function
main