#!/bin/bash
# validate-environment.sh - Environment Configuration Validator
# AI Swarm Developer Squad: Environment validation and setup verification

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🤖 AI Environment Validation Agent: Checking TerraFusion OS configuration"
echo "📍 Geographic Context: Benton County, Washington (County Seat: Prosser)"

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_error ".env file not found!"
    log_info "Copy .env.template to .env and configure your values:"
    log_info "cp .env.template .env"
    exit 1
fi

log_success ".env file found"

# Load environment variables
set -a
source .env
set +a

# Validation functions
validate_required_vars() {
    log_info "Validating required environment variables..."
    
    REQUIRED_VARS=(
        "NODE_ENV"
        "ASPNETCORE_ENVIRONMENT"
        "DB_HOST"
        "DB_PORT" 
        "DB_NAME"
        "DB_USER"
        "REDIS_HOST"
        "REDIS_PORT"
        "JWT_SECRET"
        "COUNTY_NAME"
        "STATE_NAME"
        "COUNTY_SEAT"
        "AI_SWARM_SIZE"
    )
    
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var:-}" ]; then
            MISSING_VARS+=("$var")
            log_error "Missing required variable: $var"
        else
            log_success "$var is set"
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        log_error "Missing ${#MISSING_VARS[@]} required environment variables"
        return 1
    fi
    
    log_success "All required environment variables are set"
}

validate_geographic_data() {
    log_info "Validating geographic data configuration..."
    
    # Validate Benton County data - CRITICAL VALIDATION
    if [ "$COUNTY_NAME" != "Benton County" ]; then
        log_error "Invalid county name: $COUNTY_NAME (expected: Benton County)"
        return 1
    fi
    
    if [ "$STATE_NAME" != "Washington" ]; then
        log_error "Invalid state: $STATE_NAME (expected: Washington)"
        return 1
    fi
    
    if [ "$COUNTY_SEAT" != "Prosser" ]; then
        log_error "Invalid county seat: $COUNTY_SEAT (expected: Prosser, NOT Richland)"
        return 1
    fi
    
    if [ "${COUNTY_SEAT}" = "Richland" ]; then
        log_error "CRITICAL ERROR: Richland is NOT the county seat of Benton County!"
        log_error "The correct county seat is Prosser"
        return 1
    fi
    
    log_success "Geographic data validation passed: Benton County, WA (County Seat: Prosser)"
}

validate_security_config() {
    log_info "Validating security configuration..."
    
    # Check JWT secret strength
    if [ ${#JWT_SECRET} -lt 32 ]; then
        log_error "JWT_SECRET must be at least 32 characters long"
        return 1
    fi
    
    # Check if using default/weak secrets
    if [[ "$JWT_SECRET" == *"your-"* ]] || [[ "$JWT_SECRET" == *"default"* ]]; then
        log_warning "JWT_SECRET appears to be a placeholder - update with a secure value"
    fi
    
    # Validate FISMA compliance settings
    if [ "$FISMA_COMPLIANCE_LEVEL" = "High" ]; then
        log_success "FISMA High compliance level configured"
    else
        log_warning "FISMA compliance level is not set to High"
    fi
    
    log_success "Security configuration validation completed"
}

validate_ai_swarm_config() {
    log_info "Validating AI Swarm configuration..."
    
    # Check AI Swarm size
    if [ "$AI_SWARM_SIZE" != "1008" ]; then
        log_warning "AI_SWARM_SIZE is $AI_SWARM_SIZE (expected: 1008 for full deployment)"
    else
        log_success "AI Swarm configured for 1,008 agents"
    fi
    
    # Check quantum processing
    if [ "$AI_QUANTUM_PROCESSING" = "true" ]; then
        log_success "Quantum processing enabled"
    else
        log_warning "Quantum processing disabled"
    fi
    
    # Check performance target
    if [ "$AI_PERFORMANCE_TARGET" = "379000000" ]; then
        log_success "AI performance target set to 379,000,000% improvement"
    else
        log_warning "AI performance target is not set to maximum (379,000,000%)"
    fi
    
    log_success "AI Swarm configuration validation completed"
}

validate_database_config() {
    log_info "Validating database configuration..."
    
    # Check if connection string is properly formed
    if [[ "$CONNECTION_STRING" == *"${DB_HOST}"* ]] && [[ "$CONNECTION_STRING" == *"${DB_PORT}"* ]]; then
        log_success "Database connection string properly configured"
    else
        log_error "Database connection string configuration issue"
        return 1
    fi
    
    # Test database connectivity (if services are running)
    if command -v pg_isready >/dev/null 2>&1; then
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
            log_success "Database connection test successful"
        else
            log_warning "Database connection test failed (service may not be running)"
        fi
    fi
    
    log_success "Database configuration validation completed"
}

validate_feature_flags() {
    log_info "Validating feature flag configuration..."
    
    # Check critical features
    if [ "$FEATURE_AI_SWARM_UI" = "true" ]; then
        log_success "AI Swarm UI feature enabled"
    else
        log_warning "AI Swarm UI feature disabled"
    fi
    
    if [ "$FEATURE_QUANTUM_OPTIMIZATION" = "true" ]; then
        log_success "Quantum optimization feature enabled"
    else
        log_warning "Quantum optimization feature disabled"
    fi
    
    log_success "Feature flag validation completed"
}

# Run all validations
main() {
    echo ""
    echo "🔍 Starting comprehensive environment validation..."
    echo ""
    
    VALIDATION_FAILED=false
    
    validate_required_vars || VALIDATION_FAILED=true
    echo ""
    
    validate_geographic_data || VALIDATION_FAILED=true
    echo ""
    
    validate_security_config || VALIDATION_FAILED=true
    echo ""
    
    validate_ai_swarm_config || VALIDATION_FAILED=true
    echo ""
    
    validate_database_config || VALIDATION_FAILED=true
    echo ""
    
    validate_feature_flags || VALIDATION_FAILED=true
    echo ""
    
    if [ "$VALIDATION_FAILED" = true ]; then
        log_error "Environment validation failed - please fix the issues above"
        exit 1
    else
        log_success "🎉 Environment validation completed successfully!"
        log_info "TerraFusion OS is ready for development"
        log_info "Geographic context verified: Benton County, WA (County Seat: Prosser)"
        log_info "AI Swarm ready: $AI_SWARM_SIZE agents configured"
        log_info "Government compliance: FISMA $FISMA_COMPLIANCE_LEVEL level"
    fi
}

# Execute main function
main "$@"
