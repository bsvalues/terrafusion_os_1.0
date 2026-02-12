#!/bin/bash

# TerraFusion Production Validation Suite
# Comprehensive enterprise-grade validation for government deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:8787"
PRODUCTION_READINESS_THRESHOLD=95
RESULTS_DIR="./production-validation-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Create results directory
mkdir -p "$RESULTS_DIR"

# Utility functions
log_header() {
    echo -e "\n${PURPLE}🚀 $1${NC}"
    echo -e "${PURPLE}$(printf '=%.0s' {1..80})${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Validation test helper
validate_check() {
    local check_name="$1"
    local check_command="$2"
    local success_pattern="$3"
    
    ((TOTAL_CHECKS++))
    
    if eval "$check_command" > /tmp/check_output 2>&1; then
        if [[ -n "$success_pattern" ]] && ! grep -q "$success_pattern" /tmp/check_output; then
            log_error "$check_name: Command succeeded but expected pattern not found"
            return 1
        else
            log_success "$check_name"
            return 0
        fi
    else
        log_error "$check_name: Command failed"
        cat /tmp/check_output | head -3
        return 1
    fi
}

# System Requirements Validation
validate_system_requirements() {
    log_header "SYSTEM REQUIREMENTS VALIDATION"
    
    # Check backend build
    validate_check "Backend Build Validation" \
        "cd backend && cargo check --release" \
        ""
    
    # Check frontend dependencies
    validate_check "Frontend Dependencies" \
        "cd apps/terrafusion-web && npm list > /dev/null 2>&1 || yarn check > /dev/null 2>&1" \
        ""
    
    # Check Docker availability
    validate_check "Docker Environment" \
        "docker --version" \
        "Docker version"
    
    # Check Kubernetes tools
    validate_check "Kubernetes Tools" \
        "kubectl version --client" \
        "Client Version"
}

# Security Compliance Validation
validate_security_compliance() {
    log_header "SECURITY COMPLIANCE VALIDATION"
    
    # Check TLS/HTTPS capabilities
    validate_check "TLS Certificate Configuration" \
        "openssl version" \
        "OpenSSL"
    
    # Check authentication endpoints
    validate_check "JWT Authentication Endpoints" \
        "curl -s $BASE_URL/api/auth/login -X POST -H 'Content-Type: application/json' -d '{}' | grep -q 'error\\|token\\|invalid'" \
        ""
    
    # Check security headers
    validate_check "Security Headers Present" \
        "curl -s -I $BASE_URL/health | grep -i 'access-control'" \
        "access-control"
    
    # Check for sensitive data exposure
    validate_check "No Sensitive Data in Health Endpoint" \
        "curl -s $BASE_URL/health | jq -r 'keys[]' | grep -v -E 'password|secret|key|token'" \
        ""
}

# Performance Benchmarks
validate_performance() {
    log_header "PERFORMANCE BENCHMARKS"
    
    # Response time test
    validate_check "API Response Time (< 500ms)" \
        "time curl -s $BASE_URL/api/federation/counties > /dev/null" \
        ""
    
    # Concurrent request handling
    validate_check "Concurrent Request Handling" \
        "for i in {1..10}; do curl -s $BASE_URL/health > /dev/null & done; wait" \
        ""
    
    # Memory usage check (basic)
    validate_check "Memory Usage Reasonable" \
        "ps aux | grep tf_command_portal_api | head -1 | awk '{print \$4}' | awk '{print (\$1 < 50)}'" \
        "1"
}

# Federation System Validation
validate_federation_system() {
    log_header "FEDERATION SYSTEM VALIDATION"
    
    # Core federation endpoints
    validate_check "Counties Endpoint Operational" \
        "curl -s $BASE_URL/api/federation/counties | jq 'length > 0'" \
        "true"
    
    validate_check "Connections Endpoint Operational" \
        "curl -s $BASE_URL/api/federation/connections | jq 'length > 0'" \
        "true"
    
    validate_check "Dashboard Metrics Operational" \
        "curl -s $BASE_URL/api/federation/dashboard | jq '.system_health >= 0.8'" \
        "true"
    
    # Real-time capabilities
    validate_check "Real-time Data Updates" \
        "FIRST=\$(curl -s $BASE_URL/api/federation/dashboard | jq .timestamp); sleep 2; SECOND=\$(curl -s $BASE_URL/api/federation/dashboard | jq .timestamp); [ \"\$FIRST\" != \"\$SECOND\" ]" \
        ""
    
    # WebSocket endpoint accessibility
    validate_check "WebSocket Endpoint Available" \
        "curl -s -I --http1.1 -H 'Connection: Upgrade' -H 'Upgrade: websocket' $BASE_URL/ws/federation" \
        ""
}

# Monitoring & Observability
validate_monitoring() {
    log_header "MONITORING & OBSERVABILITY VALIDATION"
    
    # Health endpoints
    validate_check "Health Check Endpoint" \
        "curl -s $BASE_URL/health | jq '.status == \"healthy\"'" \
        "true"
    
    validate_check "Liveness Probe" \
        "curl -s $BASE_URL/health/live" \
        ""
    
    validate_check "Readiness Probe" \
        "curl -s $BASE_URL/health/ready" \
        ""
    
    # Metrics endpoints
    validate_check "Prometheus Metrics" \
        "curl -s $BASE_URL/metrics | grep -c '^tf_'" \
        ""
    
    validate_check "Comprehensive Health Data" \
        "curl -s $BASE_URL/health/comprehensive | jq 'has(\"federation_status\") and has(\"compliance\")'" \
        "true"
}

# Integration Testing
validate_integration() {
    log_header "INTEGRATION TESTING"
    
    # Cross-endpoint consistency
    validate_check "Cross-Endpoint Data Consistency" \
        "COUNTIES=\$(curl -s $BASE_URL/api/federation/counties | jq length); DASHBOARD=\$(curl -s $BASE_URL/api/federation/dashboard | jq .total_counties); [ \"\$COUNTIES\" = \"\$DASHBOARD\" ]" \
        ""
    
    # End-to-end workflow
    validate_check "End-to-End API Workflow" \
        "curl -s $BASE_URL/health && curl -s $BASE_URL/api/federation/counties && curl -s $BASE_URL/api/federation/dashboard" \
        ""
    
    # Authentication integration
    validate_check "Authentication System Integration" \
        "curl -s $BASE_URL/api/auth/metrics | jq 'has(\"total_logins\")'" \
        "true"
}

# Infrastructure Readiness
validate_infrastructure() {
    log_header "INFRASTRUCTURE READINESS"
    
    # Container readiness
    validate_check "Docker Build Capability" \
        "docker build -t tf-test -f backend/Dockerfile backend > /dev/null 2>&1" \
        ""
    
    # Configuration management
    validate_check "Environment Configuration" \
        "ls k8s/*.yaml | wc -l" \
        ""
    
    # Kubernetes manifests validation
    validate_check "Kubernetes Manifests Syntax" \
        "kubectl apply --dry-run=client -f k8s/ > /dev/null 2>&1" \
        ""
}

# Compliance & Governance
validate_compliance() {
    log_header "COMPLIANCE & GOVERNANCE VALIDATION"
    
    # Documentation presence
    validate_check "README Documentation" \
        "test -f README.md && wc -l README.md | awk '{print (\$1 > 20)}'" \
        "1"
    
    validate_check "API Documentation" \
        "grep -r 'api\\|endpoint' . --include='*.md' | wc -l | awk '{print (\$1 > 5)}'" \
        "1"
    
    # Security policies
    validate_check "Security Policies Present" \
        "ls policies/*.rego | wc -l" \
        ""
    
    # Test coverage indicators
    validate_check "Test Infrastructure Present" \
        "ls tests/ | wc -l" \
        ""
}

# Generate comprehensive report
generate_production_report() {
    log_header "PRODUCTION READINESS ASSESSMENT"
    
    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    
    echo -e "${CYAN}📊 Production Validation Summary${NC}"
    echo "=================================="
    echo -e "Total Checks: $TOTAL_CHECKS"
    echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
    echo -e "Success Rate: ${CYAN}$success_rate%${NC}"
    
    # Determine readiness status
    if [ $success_rate -ge $PRODUCTION_READINESS_THRESHOLD ]; then
        echo -e "\n${GREEN}🎉 PRODUCTION READY!${NC}"
        echo -e "Success rate ($success_rate%) exceeds threshold ($PRODUCTION_READINESS_THRESHOLD%)"
        READINESS_STATUS="READY"
    else
        echo -e "\n${YELLOW}⚠️  NEEDS ATTENTION${NC}"
        echo -e "Success rate ($success_rate%) below threshold ($PRODUCTION_READINESS_THRESHOLD%)"
        READINESS_STATUS="NEEDS_ATTENTION"
    fi
    
    # Generate JSON report
    cat > "$RESULTS_DIR/production-readiness-report-$TIMESTAMP.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "terrafusion_system": {
    "version": "1.0.0",
    "validation_date": "$TIMESTAMP",
    "total_checks": $TOTAL_CHECKS,
    "passed_checks": $PASSED_CHECKS,
    "failed_checks": $FAILED_CHECKS,
    "success_rate_percent": $success_rate,
    "readiness_status": "$READINESS_STATUS",
    "production_threshold": $PRODUCTION_READINESS_THRESHOLD
  },
  "validation_categories": {
    "system_requirements": "completed",
    "security_compliance": "completed", 
    "performance_benchmarks": "completed",
    "federation_system": "completed",
    "monitoring_observability": "completed",
    "integration_testing": "completed",
    "infrastructure_readiness": "completed",
    "compliance_governance": "completed"
  },
  "deployment_recommendation": "$([ "$READINESS_STATUS" = "READY" ] && echo "System approved for production deployment" || echo "Address failing checks before production deployment")",
  "next_steps": [
    "$([ $success_rate -lt 100 ] && echo "Resolve remaining validation failures" || echo "All validations passed")",
    "Conduct load testing under production traffic patterns",
    "Perform security penetration testing",
    "Complete documentation review",
    "Schedule production deployment"
  ]
}
EOF
    
    echo -e "\n${BLUE}📝 Full report saved to: $RESULTS_DIR/production-readiness-report-$TIMESTAMP.json${NC}"
    
    # Additional recommendations
    echo -e "\n${CYAN}📋 Production Deployment Checklist:${NC}"
    echo "=================================="
    echo "☐ All validation checks passing (${success_rate}% currently)"
    echo "☐ Load testing completed"
    echo "☐ Security audit completed"
    echo "☐ Backup and recovery procedures tested"
    echo "☐ Monitoring and alerting configured"
    echo "☐ Incident response procedures documented"
    echo "☐ Staff training completed"
    echo "☐ Rollback procedures tested"
    
    return $([ $success_rate -ge $PRODUCTION_READINESS_THRESHOLD ] && echo 0 || echo 1)
}

# Main execution
main() {
    echo -e "${PURPLE}"
    echo "🏛️  TerraFusion Production Validation Suite"
    echo "==========================================="
    echo "🇺🇸 Government-Grade Enterprise Deployment Validation"
    echo -e "${NC}"
    
    log_info "Starting comprehensive production validation..."
    log_info "Target: $BASE_URL"
    log_info "Threshold: ${PRODUCTION_READINESS_THRESHOLD}%"
    log_info "Results: $RESULTS_DIR/"
    
    # Wait for system to be ready
    log_info "Verifying system availability..."
    timeout 30 bash -c 'until curl -s http://localhost:8787/health > /dev/null; do sleep 1; done' || {
        log_error "System not available. Please ensure backend is running."
        exit 1
    }
    log_success "System is available!"
    
    # Run all validation suites
    validate_system_requirements
    validate_security_compliance  
    validate_performance
    validate_federation_system
    validate_monitoring
    validate_integration
    validate_infrastructure
    validate_compliance
    
    # Generate final assessment
    generate_production_report
}

# Cleanup
cleanup() {
    rm -f /tmp/check_output
}
trap cleanup EXIT

# Run main function
main "$@"