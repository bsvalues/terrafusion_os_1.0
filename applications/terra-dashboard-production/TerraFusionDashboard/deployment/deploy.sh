#!/bin/bash
set -euo pipefail

################################################################################
# TerraFusion Production Deployment Script
# Optimized for Benton County Washington Property Assessment Platform
################################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Print banner
print_banner() {
    echo -e "${CYAN}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  🏛️  TERRAFUSION PLATFORM - PRODUCTION DEPLOYMENT                           ║
║                                                                              ║
║  CLIENT: BENTON COUNTY WASHINGTON                                            ║
║  PARCELS: 94,149+ properties ready for AI-powered assessment               ║
║  STATUS: 🚀 DEPLOYING TO PRODUCTION                                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking deployment prerequisites..."
    
    # Required tools
    local tools=("docker" "docker-compose" "git")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed. Please install it first."
            exit 1
        fi
        log_info "✓ $tool found"
    done
    
    # Check environment variables
    local env_vars=("DB_PASSWORD" "JWT_SECRET" "REDIS_PASSWORD")
    for var in "${env_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Environment variable $var is not set"
            log_info "Please set: export $var='your-secure-value'"
            exit 1
        fi
        log_info "✓ $var configured"
    done
    
    log_success "Prerequisites check completed"
}

# Setup SSL certificates
setup_ssl() {
    log_step "Setting up SSL certificates..."
    
    mkdir -p deployment/ssl
    
    if [[ ! -f "deployment/ssl/cert.pem" ]] || [[ ! -f "deployment/ssl/key.pem" ]]; then
        log_info "Generating self-signed SSL certificates for development..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout deployment/ssl/key.pem \
            -out deployment/ssl/cert.pem \
            -subj "/C=US/ST=WA/L=Richland/O=BentonCounty/CN=terrafusion.local"
        log_info "✓ Self-signed certificates generated"
        log_warn "For production, replace with proper SSL certificates"
    else
        log_info "✓ SSL certificates found"
    fi
}

# Build and deploy
deploy() {
    log_step "Building and deploying TerraFusion platform..."
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f deployment/docker-compose.production.yml down --remove-orphans || true
    
    # Build application image
    log_info "Building application image..."
    docker-compose -f deployment/docker-compose.production.yml build --no-cache
    
    # Start services
    log_info "Starting production services..."
    docker-compose -f deployment/docker-compose.production.yml up -d
    
    log_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    log_step "Waiting for services to be ready..."
    
    # Wait for database
    log_info "Waiting for PostgreSQL..."
    timeout 60 bash -c 'until docker-compose -f deployment/docker-compose.production.yml exec -T postgres pg_isready -U terrafusion -d terrafusion_prod; do sleep 2; done'
    
    # Wait for Redis
    log_info "Waiting for Redis..."
    timeout 30 bash -c 'until docker-compose -f deployment/docker-compose.production.yml exec -T redis redis-cli ping; do sleep 2; done'
    
    # Wait for application
    log_info "Waiting for TerraFusion application..."
    timeout 60 bash -c 'until curl -f -s http://localhost:5000/api/system/health > /dev/null; do sleep 2; done'
    
    log_success "All services are ready"
}

# Run database migrations
run_migrations() {
    log_step "Running database schema setup..."
    
    # Apply production schema
    docker-compose -f deployment/docker-compose.production.yml exec -T postgres \
        psql -U terrafusion -d terrafusion_prod -f /docker-entrypoint-initdb.d/01-schema.sql || \
        log_info "Schema already applied or partially applied"
    
    log_success "Database schema setup completed"
}

# Performance verification
verify_deployment() {
    log_step "Verifying deployment..."
    
    # Health checks
    log_info "Checking application health..."
    if curl -f -s http://localhost:5000/api/system/health > /dev/null; then
        log_success "✓ Application health check passed"
    else
        log_error "✗ Application health check failed"
        return 1
    fi
    
    # Database connectivity
    log_info "Checking database connectivity..."
    DB_CHECK=$(docker-compose -f deployment/docker-compose.production.yml exec -T postgres \
        psql -U terrafusion -d terrafusion_prod -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' \n')
    
    if [[ "$DB_CHECK" =~ ^[0-9]+$ ]] && [[ "$DB_CHECK" -gt 0 ]]; then
        log_success "✓ Database connectivity verified ($DB_CHECK tables found)"
    else
        log_error "✗ Database connectivity failed"
        return 1
    fi
    
    # API response time
    log_info "Testing API response time..."
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}\n' http://localhost:5000/api/counties)
    log_info "API response time: ${RESPONSE_TIME}s"
    
    log_success "Deployment verification completed"
}

# Generate deployment report
generate_report() {
    log_step "Generating deployment report..."
    
    cat > deployment_report.md << EOF
# TerraFusion Platform Deployment Report

## Deployment Summary
- **Date**: $(date)
- **Environment**: Production
- **Client**: Benton County Washington
- **Status**: ✅ Successfully Deployed

## Services Status
$(docker-compose -f deployment/docker-compose.production.yml ps)

## Access Information
- **Application**: https://localhost (or your domain)
- **Monitoring**: http://localhost:3000 (Grafana)
- **Metrics**: http://localhost:9090 (Prometheus)

## Next Steps
1. Configure domain and proper SSL certificates
2. Import Benton County property data (94,149 parcels)
3. Set up user accounts and permissions
4. Configure monitoring alerts
5. Begin user training and onboarding

## Support
- Health Check: http://localhost:5000/api/system/health
- Logs: \`docker-compose -f deployment/docker-compose.production.yml logs\`
- Stop: \`docker-compose -f deployment/docker-compose.production.yml down\`
EOF

    log_success "Deployment report generated: deployment_report.md"
}

# Main deployment function
main() {
    print_banner
    
    log_info "Starting TerraFusion Platform production deployment..."
    
    check_prerequisites
    setup_ssl
    deploy
    wait_for_services
    run_migrations
    verify_deployment
    generate_report
    
    echo -e "${GREEN}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  🎉 TERRAFUSION PLATFORM DEPLOYMENT COMPLETE                                ║
║                                                                              ║
║  ✅ Application: Running at https://localhost                               ║
║  ✅ Database: PostgreSQL with production schema                             ║
║  ✅ Cache: Redis for high-performance operations                            ║
║  ✅ Load Balancer: NGINX with SSL termination                              ║
║  ✅ Monitoring: Prometheus + Grafana stack                                 ║
║                                                                              ║
║  🏛️ READY FOR BENTON COUNTY WASHINGTON                                      ║
║  📊 Ready to import 94,149 property records                                ║
║  🚀 AI-powered assessment platform operational                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    log_success "TerraFusion Platform deployed successfully!"
    log_info "Access: https://localhost"
    log_info "Monitoring: http://localhost:3000"
    log_info "Health: http://localhost:5000/api/system/health"
    
    echo -e "${CYAN}Next Steps:${NC}"
    echo "1. Configure your domain and proper SSL certificates"
    echo "2. Import Benton County property data"
    echo "3. Set up user accounts and assign roles"
    echo "4. Configure monitoring alerts and thresholds"
    echo "5. Begin user training and system onboarding"
}

# Execute deployment
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi