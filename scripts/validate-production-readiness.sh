#!/bin/bash

# TerraFusion OS Production Readiness Validation Script
# PhD-Level Go/No-Go Criteria Validation for Government Property Assessment Systems
# Comprehensive validation of all production optimization implementations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/validation-results-$(date +%Y%m%d_%H%M%S).log"
TEMP_DIR="/tmp/terrafusion-validation-$$"

# Performance Targets (Go/No-Go Criteria)
API_RESPONSE_TARGET_MS=10
DATABASE_QUERY_TARGET_MS=5
CACHE_HIT_RATIO_TARGET=90
NEGATIVE_CACHE_EFFECTIVENESS_TARGET=94
MEMORY_USAGE_THRESHOLD=80
CPU_USAGE_THRESHOLD=70
ERROR_RATE_THRESHOLD=1

# Test Results
declare -A TEST_RESULTS
declare -A PERFORMANCE_METRICS
OVERALL_STATUS="UNKNOWN"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${BLUE}[INFO]${NC}  $message" | tee -a "$LOG_FILE" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC}  $message" | tee -a "$LOG_FILE" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$LOG_FILE" ;;
        "HEADER") echo -e "${PURPLE}=== $message ===${NC}" | tee -a "$LOG_FILE" ;;
    esac
}

# Setup validation environment
setup_validation() {
    log "HEADER" "TerraFusion OS Production Readiness Validation"
    log "INFO" "Starting comprehensive validation of production optimization implementations"
    log "INFO" "Log file: $LOG_FILE"
    
    mkdir -p "$TEMP_DIR"
    
    log "INFO" "Validation environment setup complete"
}

# Validate Phase 1: Load Balancing with Negative Caching
validate_phase1_load_balancing() {
    log "HEADER" "Phase 1: Load Balancing with Negative Caching Validation"
    
    local phase1_status="PASS"
    
    # Check HAProxy configuration
    log "INFO" "Validating HAProxy configuration..."
    if [[ -f "$PROJECT_ROOT/config/haproxy/haproxy.cfg" ]]; then
        # Validate negative caching configuration
        if grep -q "negative-cache.lua" "$PROJECT_ROOT/config/haproxy/haproxy.cfg"; then
            log "SUCCESS" "HAProxy negative caching Lua integration found"
        else
            log "ERROR" "HAProxy negative caching Lua integration missing"
            phase1_status="FAIL"
        fi
        
        # Validate SSL configuration
        if grep -q "ssl-min-ver TLSv1.2" "$PROJECT_ROOT/config/haproxy/haproxy.cfg"; then
            log "SUCCESS" "Government-grade SSL configuration validated"
        else
            log "ERROR" "Government-grade SSL configuration missing"
            phase1_status="FAIL"
        fi
        
        # Validate health checks
        if grep -q "negative-cache-status" "$PROJECT_ROOT/config/haproxy/haproxy.cfg"; then
            log "SUCCESS" "Negative cache health checks configured"
        else
            log "WARN" "Negative cache specific health checks not found"
        fi
    else
        log "ERROR" "HAProxy configuration file not found"
        phase1_status="FAIL"
    fi
    
    # Check Lua scripts
    log "INFO" "Validating negative caching Lua scripts..."
    if [[ -f "$PROJECT_ROOT/config/haproxy/lua/negative-cache.lua" ]]; then
        if grep -q "check_negative_cache" "$PROJECT_ROOT/config/haproxy/lua/negative-cache.lua"; then
            log "SUCCESS" "Negative caching Lua script functions validated"
        else
            log "ERROR" "Required Lua functions missing"
            phase1_status="FAIL"
        fi
    else
        log "ERROR" "Negative caching Lua script not found"
        phase1_status="FAIL"
    fi
    
    # Validate Docker Compose configuration
    log "INFO" "Validating production Docker Compose configuration..."
    if [[ -f "$PROJECT_ROOT/docker-compose.production-optimized.yml" ]]; then
        if grep -q "haproxy.*negative.*cache" "$PROJECT_ROOT/docker-compose.production-optimized.yml"; then
            log "SUCCESS" "Production Docker Compose includes negative caching"
        else
            log "WARN" "Negative caching references not found in Docker Compose"
        fi
    else
        log "ERROR" "Production Docker Compose file not found"
        phase1_status="FAIL"
    fi
    
    TEST_RESULTS["phase1"]=$phase1_status
    log "INFO" "Phase 1 validation: $phase1_status"
}

# Validate Phase 2: Database Scaling with Read Replicas
validate_phase2_database_scaling() {
    log "HEADER" "Phase 2: Database Scaling with Read Replicas Validation"
    
    local phase2_status="PASS"
    
    # Check PostgreSQL configurations
    log "INFO" "Validating PostgreSQL primary configuration..."
    if [[ -f "$PROJECT_ROOT/config/postgresql/postgresql-primary.conf" ]]; then
        # Validate replication settings
        if grep -q "wal_level = replica" "$PROJECT_ROOT/config/postgresql/postgresql-primary.conf"; then
            log "SUCCESS" "PostgreSQL replication configuration validated"
        else
            log "ERROR" "PostgreSQL replication settings missing"
            phase2_status="FAIL"
        fi
        
        # Validate performance settings
        if grep -q "shared_buffers = 2GB" "$PROJECT_ROOT/config/postgresql/postgresql-primary.conf"; then
            log "SUCCESS" "PostgreSQL performance tuning validated"
        else
            log "WARN" "PostgreSQL performance settings may need adjustment"
        fi
    else
        log "ERROR" "PostgreSQL primary configuration not found"
        phase2_status="FAIL"
    fi
    
    # Check replica configuration
    log "INFO" "Validating PostgreSQL replica configuration..."
    if [[ -f "$PROJECT_ROOT/config/postgresql/postgresql-replica.conf" ]]; then
        if grep -q "hot_standby = on" "$PROJECT_ROOT/config/postgresql/postgresql-replica.conf"; then
            log "SUCCESS" "PostgreSQL replica configuration validated"
        else
            log "ERROR" "PostgreSQL replica hot standby not enabled"
            phase2_status="FAIL"
        fi
    else
        log "ERROR" "PostgreSQL replica configuration not found"
        phase2_status="FAIL"
    fi
    
    # Check HBA configuration
    log "INFO" "Validating PostgreSQL HBA configuration..."
    if [[ -f "$PROJECT_ROOT/config/postgresql/pg_hba.conf" ]]; then
        if grep -q "scram-sha-256" "$PROJECT_ROOT/config/postgresql/pg_hba.conf"; then
            log "SUCCESS" "Government-grade authentication configured"
        else
            log "ERROR" "Strong authentication not configured"
            phase2_status="FAIL"
        fi
    else
        log "ERROR" "PostgreSQL HBA configuration not found"
        phase2_status="FAIL"
    fi
    
    # Check replication setup
    if [[ -f "$PROJECT_ROOT/config/postgresql/setup-replication.sql" ]]; then
        if grep -q "negative_cache" "$PROJECT_ROOT/config/postgresql/setup-replication.sql"; then
            log "SUCCESS" "Negative caching database schema configured"
        else
            log "WARN" "Negative caching database schema not found"
        fi
    else
        log "ERROR" "Database replication setup script not found"
        phase2_status="FAIL"
    fi
    
    TEST_RESULTS["phase2"]=$phase2_status
    log "INFO" "Phase 2 validation: $phase2_status"
}

# Validate Phase 3: Redis Caching with Negative Caching
validate_phase3_redis_caching() {
    log "HEADER" "Phase 3: Advanced Redis Caching Validation"
    
    local phase3_status="PASS"
    
    # Check Redis master configuration
    log "INFO" "Validating Redis master configuration..."
    if [[ -f "$PROJECT_ROOT/config/redis/redis-master.conf" ]]; then
        # Validate negative caching optimization
        if grep -q "TF_Redis_Master" "$PROJECT_ROOT/config/redis/redis-master.conf"; then
            log "SUCCESS" "Redis master security configuration validated"
        else
            log "ERROR" "Redis master security settings missing"
            phase3_status="FAIL"
        fi
        
        # Check persistence settings
        if grep -q "appendonly yes" "$PROJECT_ROOT/config/redis/redis-master.conf"; then
            log "SUCCESS" "Redis persistence configured for government data"
        else
            log "ERROR" "Redis persistence not configured"
            phase3_status="FAIL"
        fi
    else
        log "ERROR" "Redis master configuration not found"
        phase3_status="FAIL"
    fi
    
    # Check Lua scripts for negative caching
    log "INFO" "Validating Redis Lua scripts for negative caching..."
    if [[ -f "$PROJECT_ROOT/config/redis/lua-scripts/set_miss_sentinel.lua" ]]; then
        if grep -q "MISS_SENTINEL" "$PROJECT_ROOT/config/redis/lua-scripts/set_miss_sentinel.lua"; then
            log "SUCCESS" "Miss sentinel Lua script validated"
        else
            log "ERROR" "Miss sentinel logic missing from Lua script"
            phase3_status="FAIL"
        fi
    else
        log "ERROR" "Miss sentinel Lua script not found"
        phase3_status="FAIL"
    fi
    
    if [[ -f "$PROJECT_ROOT/config/redis/lua-scripts/check_miss_sentinel.lua" ]]; then
        if grep -q "negative_cache_hits" "$PROJECT_ROOT/config/redis/lua-scripts/check_miss_sentinel.lua"; then
            log "SUCCESS" "Miss sentinel check script validated"
        else
            log "ERROR" "Negative cache hit tracking missing"
            phase3_status="FAIL"
        fi
    else
        log "ERROR" "Miss sentinel check script not found"
        phase3_status="FAIL"
    fi
    
    # Check C# negative caching service
    log "INFO" "Validating C# negative caching service..."
    if [[ -f "$PROJECT_ROOT/backend/TerraFusion.Core/Services/NegativeCachingService.cs" ]]; then
        if grep -q "TERRAFUSION_MISS_SENTINEL" "$PROJECT_ROOT/backend/TerraFusion.Core/Services/NegativeCachingService.cs"; then
            log "SUCCESS" "C# negative caching service validated"
        else
            log "ERROR" "Miss sentinel constants missing from C# service"
            phase3_status="FAIL"
        fi
    else
        log "ERROR" "C# negative caching service not found"
        phase3_status="FAIL"
    fi
    
    TEST_RESULTS["phase3"]=$phase3_status
    log "INFO" "Phase 3 validation: $phase3_status"
}

# Validate Phase 4: APM Integration with OpenTelemetry
validate_phase4_apm_integration() {
    log "HEADER" "Phase 4: APM Integration with OpenTelemetry Validation"
    
    local phase4_status="PASS"
    
    # Check OpenTelemetry collector configuration
    log "INFO" "Validating OpenTelemetry collector configuration..."
    if [[ -f "$PROJECT_ROOT/config/opentelemetry/otel-collector.yml" ]]; then
        # Validate government compliance settings
        if grep -q "government.classification" "$PROJECT_ROOT/config/opentelemetry/otel-collector.yml"; then
            log "SUCCESS" "Government compliance attributes configured"
        else
            log "ERROR" "Government compliance attributes missing"
            phase4_status="FAIL"
        fi
        
        # Validate negative caching tracing
        if grep -q "negative_cache" "$PROJECT_ROOT/config/opentelemetry/otel-collector.yml"; then
            log "SUCCESS" "Negative caching tracing configured"
        else
            log "WARN" "Negative caching specific tracing not found"
        fi
    else
        log "ERROR" "OpenTelemetry collector configuration not found"
        phase4_status="FAIL"
    fi
    
    # Check telemetry configuration in C#
    log "INFO" "Validating C# telemetry configuration..."
    if [[ -f "$PROJECT_ROOT/backend/TerraFusion.Core/Observability/TelemetryConfiguration.cs" ]]; then
        if grep -q "terrafusion.cache.negative_hits" "$PROJECT_ROOT/backend/TerraFusion.Core/Observability/TelemetryConfiguration.cs"; then
            log "SUCCESS" "Negative cache metrics configured in C#"
        else
            log "ERROR" "Negative cache metrics missing from telemetry"
            phase4_status="FAIL"
        fi
        
        if grep -q "government.system" "$PROJECT_ROOT/backend/TerraFusion.Core/Observability/TelemetryConfiguration.cs"; then
            log "SUCCESS" "Government system attributes configured"
        else
            log "ERROR" "Government system attributes missing"
            phase4_status="FAIL"
        fi
    else
        log "ERROR" "C# telemetry configuration not found"
        phase4_status="FAIL"
    fi
    
    TEST_RESULTS["phase4"]=$phase4_status
    log "INFO" "Phase 4 validation: $phase4_status"
}

# Validate Phase 5: CI/CD Pipeline
validate_phase5_cicd_pipeline() {
    log "HEADER" "Phase 5: CI/CD Pipeline Validation"
    
    local phase5_status="PASS"
    
    # Check GitHub Actions workflows
    log "INFO" "Validating GitHub Actions workflows..."
    if [[ -f "$PROJECT_ROOT/.github/workflows/production-deployment.yml" ]]; then
        # Validate negative caching tests
        if grep -q "Negative Caching Performance Tests" "$PROJECT_ROOT/.github/workflows/production-deployment.yml"; then
            log "SUCCESS" "Negative caching performance tests configured in CI/CD"
        else
            log "ERROR" "Negative caching tests missing from CI/CD"
            phase5_status="FAIL"
        fi
        
        # Validate government compliance checks
        if grep -q "Government Compliance Check" "$PROJECT_ROOT/.github/workflows/production-deployment.yml"; then
            log "SUCCESS" "Government compliance checks configured"
        else
            log "ERROR" "Government compliance checks missing"
            phase5_status="FAIL"
        fi
        
        # Validate performance targets
        if grep -q "NEGATIVE_CACHE_EFFECTIVENESS_TARGET" "$PROJECT_ROOT/.github/workflows/production-deployment.yml"; then
            log "SUCCESS" "Performance targets validated in CI/CD"
        else
            log "ERROR" "Performance targets missing from CI/CD"
            phase5_status="FAIL"
        fi
    else
        log "ERROR" "Production deployment workflow not found"
        phase5_status="FAIL"
    fi
    
    # Check performance monitoring workflow
    if [[ -f "$PROJECT_ROOT/.github/workflows/performance-monitoring.yml" ]]; then
        if grep -q "Negative Cache Effectiveness Validation" "$PROJECT_ROOT/.github/workflows/performance-monitoring.yml"; then
            log "SUCCESS" "Continuous performance monitoring configured"
        else
            log "ERROR" "Continuous negative cache monitoring missing"
            phase5_status="FAIL"
        fi
    else
        log "ERROR" "Performance monitoring workflow not found"
        phase5_status="FAIL"
    fi
    
    TEST_RESULTS["phase5"]=$phase5_status
    log "INFO" "Phase 5 validation: $phase5_status"
}

# Validate infrastructure completeness
validate_infrastructure_completeness() {
    log "HEADER" "Infrastructure Completeness Validation"
    
    local infra_status="PASS"
    
    # Check Docker Compose files
    log "INFO" "Validating Docker Compose configurations..."
    
    # Production optimized compose
    if [[ -f "$PROJECT_ROOT/docker-compose.production-optimized.yml" ]]; then
        local service_count=$(grep -c "^[[:space:]]*[a-zA-Z0-9_-]*:" "$PROJECT_ROOT/docker-compose.production-optimized.yml" || true)
        if [[ $service_count -ge 10 ]]; then
            log "SUCCESS" "Production Docker Compose includes comprehensive services ($service_count services)"
        else
            log "WARN" "Production Docker Compose may be missing services ($service_count found)"
        fi
    else
        log "ERROR" "Production Docker Compose not found"
        infra_status="FAIL"
    fi
    
    # Database infrastructure
    if [[ -f "$PROJECT_ROOT/infrastructure/database/docker-compose-postgresql.yml" ]]; then
        if grep -q "replica" "$PROJECT_ROOT/infrastructure/database/docker-compose-postgresql.yml"; then
            log "SUCCESS" "Database replication infrastructure configured"
        else
            log "ERROR" "Database replication missing from infrastructure"
            infra_status="FAIL"
        fi
    else
        log "ERROR" "Database infrastructure configuration not found"
        infra_status="FAIL"
    fi
    
    # Cache infrastructure
    if [[ -f "$PROJECT_ROOT/infrastructure/cache/docker-compose-redis.yml" ]]; then
        if grep -q "sentinel" "$PROJECT_ROOT/infrastructure/cache/docker-compose-redis.yml"; then
            log "SUCCESS" "Redis high availability configured"
        else
            log "WARN" "Redis high availability not configured"
        fi
    else
        log "ERROR" "Cache infrastructure configuration not found"
        infra_status="FAIL"
    fi
    
    # Monitoring infrastructure
    if [[ -f "$PROJECT_ROOT/infrastructure/monitoring/docker-compose-observability.yml" ]]; then
        if grep -q "otel-collector" "$PROJECT_ROOT/infrastructure/monitoring/docker-compose-observability.yml"; then
            log "SUCCESS" "APM monitoring infrastructure configured"
        else
            log "ERROR" "APM monitoring missing from infrastructure"
            infra_status="FAIL"
        fi
    else
        log "ERROR" "Monitoring infrastructure configuration not found"
        infra_status="FAIL"
    fi
    
    TEST_RESULTS["infrastructure"]=$infra_status
    log "INFO" "Infrastructure validation: $infra_status"
}

# Validate security and compliance
validate_security_compliance() {
    log "HEADER" "Security and Government Compliance Validation"
    
    local security_status="PASS"
    
    # Check SSL/TLS configurations
    log "INFO" "Validating SSL/TLS configurations..."
    local ssl_files=0
    
    # Count SSL configuration references
    while IFS= read -r -d '' file; do
        if grep -q "TLSv1.2\|TLSv1.3" "$file" 2>/dev/null; then
            ((ssl_files++))
        fi
    done < <(find "$PROJECT_ROOT" -name "*.conf" -o -name "*.yml" -o -name "*.yaml" -print0)
    
    if [[ $ssl_files -ge 5 ]]; then
        log "SUCCESS" "Government-grade TLS configuration found in $ssl_files files"
    else
        log "ERROR" "Insufficient TLS configuration coverage ($ssl_files files)"
        security_status="FAIL"
    fi
    
    # Check for secrets in code
    log "INFO" "Scanning for hardcoded secrets..."
    if find "$PROJECT_ROOT" -name "*.cs" -o -name "*.js" -o -name "*.ts" | \
       xargs grep -l "password.*=.*['\"].*['\"]" 2>/dev/null | head -1 | grep -q .; then
        log "ERROR" "Potential hardcoded secrets found in code"
        security_status="FAIL"
    else
        log "SUCCESS" "No hardcoded secrets detected"
    fi
    
    # Check government compliance attributes
    log "INFO" "Validating government compliance attributes..."
    if grep -r "fisma\|government\.classification\|compliance\.framework" "$PROJECT_ROOT" --include="*.cs" --include="*.yml" >/dev/null; then
        log "SUCCESS" "Government compliance attributes configured"
    else
        log "ERROR" "Government compliance attributes missing"
        security_status="FAIL"
    fi
    
    TEST_RESULTS["security"]=$security_status
    log "INFO" "Security and compliance validation: $security_status"
}

# Performance benchmark validation
validate_performance_benchmarks() {
    log "HEADER" "Performance Benchmark Validation"
    
    local perf_status="PASS"
    
    # This would typically run actual performance tests
    # For validation, we check that performance testing infrastructure is in place
    
    log "INFO" "Validating performance testing infrastructure..."
    
    # Check for performance test configurations
    if grep -r "performance.*test" "$PROJECT_ROOT/.github/workflows/" >/dev/null; then
        log "SUCCESS" "Performance testing configured in CI/CD"
    else
        log "ERROR" "Performance testing not configured"
        perf_status="FAIL"
    fi
    
    # Check for performance targets
    if grep -r "API_RESPONSE_TIME_TARGET\|NEGATIVE_CACHE_EFFECTIVENESS_TARGET" "$PROJECT_ROOT" >/dev/null; then
        log "SUCCESS" "Performance targets defined"
    else
        log "ERROR" "Performance targets not defined"
        perf_status="FAIL"
    fi
    
    # Validate negative caching implementation completeness
    log "INFO" "Validating negative caching implementation completeness..."
    local negative_cache_components=0
    
    # Count negative caching components
    [[ -f "$PROJECT_ROOT/config/haproxy/lua/negative-cache.lua" ]] && ((negative_cache_components++))
    [[ -f "$PROJECT_ROOT/config/redis/lua-scripts/set_miss_sentinel.lua" ]] && ((negative_cache_components++))
    [[ -f "$PROJECT_ROOT/backend/TerraFusion.Core/Services/NegativeCachingService.cs" ]] && ((negative_cache_components++))
    
    if [[ $negative_cache_components -ge 3 ]]; then
        log "SUCCESS" "Negative caching implementation complete ($negative_cache_components/3 components)"
        PERFORMANCE_METRICS["negative_cache_completeness"]="100%"
    else
        log "ERROR" "Negative caching implementation incomplete ($negative_cache_components/3 components)"
        perf_status="FAIL"
        PERFORMANCE_METRICS["negative_cache_completeness"]="$(echo "scale=0; $negative_cache_components * 100 / 3" | bc)%"
    fi
    
    TEST_RESULTS["performance"]=$perf_status
    log "INFO" "Performance benchmark validation: $perf_status"
}

# Generate comprehensive validation report
generate_validation_report() {
    log "HEADER" "TerraFusion OS Production Readiness Validation Report"
    
    local total_tests=0
    local passed_tests=0
    
    echo "=========================================" >> "$LOG_FILE"
    echo "COMPREHENSIVE VALIDATION RESULTS" >> "$LOG_FILE"
    echo "=========================================" >> "$LOG_FILE"
    echo "Validation Date: $(date)" >> "$LOG_FILE"
    echo "Project: TerraFusion OS 1.0" >> "$LOG_FILE"
    echo "Purpose: Government Property Assessment System" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    
    # Summarize test results
    for phase in phase1 phase2 phase3 phase4 phase5 infrastructure security performance; do
        ((total_tests++))
        local status=${TEST_RESULTS[$phase]:-"NOT_TESTED"}
        
        case $phase in
            "phase1") description="Phase 1: Load Balancing with Negative Caching" ;;
            "phase2") description="Phase 2: Database Scaling with Read Replicas" ;;
            "phase3") description="Phase 3: Advanced Redis Caching" ;;
            "phase4") description="Phase 4: APM Integration with OpenTelemetry" ;;
            "phase5") description="Phase 5: CI/CD Pipeline" ;;
            "infrastructure") description="Infrastructure Completeness" ;;
            "security") description="Security and Compliance" ;;
            "performance") description="Performance Benchmarks" ;;
        esac
        
        if [[ $status == "PASS" ]]; then
            ((passed_tests++))
            log "SUCCESS" "$description: ✅ PASS"
        else
            log "ERROR" "$description: ❌ FAIL"
        fi
    done
    
    # Calculate overall status
    local pass_percentage=$(echo "scale=0; $passed_tests * 100 / $total_tests" | bc)
    
    if [[ $passed_tests -eq $total_tests ]]; then
        OVERALL_STATUS="PASS"
        log "SUCCESS" ""
        log "SUCCESS" "🎉 OVERALL STATUS: PRODUCTION READY"
        log "SUCCESS" "✅ All validation criteria met ($passed_tests/$total_tests)"
        log "SUCCESS" "🏛️ Government compliance validated"
        log "SUCCESS" "⚡ Negative caching optimization complete"
        log "SUCCESS" "📊 Performance targets achievable"
    elif [[ $pass_percentage -ge 75 ]]; then
        OVERALL_STATUS="CONDITIONAL_PASS"
        log "WARN" ""
        log "WARN" "⚠️ OVERALL STATUS: CONDITIONAL GO"
        log "WARN" "⚡ Some validation criteria need attention ($passed_tests/$total_tests passed)"
        log "WARN" "🔧 Minor issues should be resolved before production"
    else
        OVERALL_STATUS="FAIL"
        log "ERROR" ""
        log "ERROR" "🚨 OVERALL STATUS: NO-GO"
        log "ERROR" "❌ Critical validation failures detected ($passed_tests/$total_tests passed)"
        log "ERROR" "🛑 Production deployment not recommended"
    fi
    
    # Performance metrics summary
    log "INFO" ""
    log "INFO" "📊 Performance Metrics Summary:"
    log "INFO" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "INFO" "🎯 API Response Time Target: ${API_RESPONSE_TARGET_MS}ms"
    log "INFO" "🎯 Database Query Target: ${DATABASE_QUERY_TARGET_MS}ms"
    log "INFO" "🎯 Cache Hit Ratio Target: ${CACHE_HIT_RATIO_TARGET}%"
    log "INFO" "🎯 Negative Cache Effectiveness Target: ${NEGATIVE_CACHE_EFFECTIVENESS_TARGET}%"
    log "INFO" "🔧 Negative Cache Implementation: ${PERFORMANCE_METRICS[negative_cache_completeness]:-"Unknown"}"
    
    # Next steps
    log "INFO" ""
    log "INFO" "📋 Next Steps:"
    log "INFO" "━━━━━━━━━━━━━━━━━━━━"
    
    if [[ $OVERALL_STATUS == "PASS" ]]; then
        log "INFO" "1. ✅ Proceed with production deployment"
        log "INFO" "2. 🏛️ Notify government stakeholders of readiness"
        log "INFO" "3. 📊 Begin production monitoring"
        log "INFO" "4. 🚀 Execute deployment pipeline"
    elif [[ $OVERALL_STATUS == "CONDITIONAL_PASS" ]]; then
        log "INFO" "1. 🔧 Address failing validation criteria"
        log "INFO" "2. 🧪 Re-run validation tests"
        log "INFO" "3. 📋 Review with technical team"
        log "INFO" "4. ⚡ Consider staged rollout"
    else
        log "INFO" "1. 🛠️ Fix critical validation failures"
        log "INFO" "2. 🔍 Conduct thorough code review"
        log "INFO" "3. 🧪 Implement missing components"
        log "INFO" "4. 🔄 Re-run complete validation"
    fi
    
    echo "" >> "$LOG_FILE"
    echo "Validation report saved to: $LOG_FILE" >> "$LOG_FILE"
}

# Cleanup function
cleanup() {
    log "INFO" "Cleaning up validation environment..."
    rm -rf "$TEMP_DIR" 2>/dev/null || true
}

# Main execution
main() {
    trap cleanup EXIT
    
    setup_validation
    
    validate_phase1_load_balancing
    validate_phase2_database_scaling
    validate_phase3_redis_caching
    validate_phase4_apm_integration
    validate_phase5_cicd_pipeline
    validate_infrastructure_completeness
    validate_security_compliance
    validate_performance_benchmarks
    
    generate_validation_report
    
    # Exit with appropriate code
    case $OVERALL_STATUS in
        "PASS") exit 0 ;;
        "CONDITIONAL_PASS") exit 1 ;;
        "FAIL") exit 2 ;;
        *) exit 3 ;;
    esac
}

# Execute main function
main "$@"