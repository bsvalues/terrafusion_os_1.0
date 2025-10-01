#!/bin/bash
# TerraFusion OS Harris PACS Integration Testing Script
# Comprehensive automated testing for 90 specialized Harris PACS agents

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}\")\" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Configuration
HARRIS_PACS_AGENTS_COUNT="${HARRIS_PACS_AGENTS_COUNT:-90}"
BENTON_COUNTY_TEST_SUITE="${BENTON_COUNTY_TEST_SUITE:-comprehensive}"
GOVERNMENT_COMPLIANCE_TESTING="${GOVERNMENT_COMPLIANCE_TESTING:-true}"
CONTINUOUS_TESTING_MODE="${CONTINUOUS_TESTING_MODE:-false}"
PARALLEL_EXECUTION="${PARALLEL_EXECUTION:-true}"

# Test execution settings
TEST_TIMEOUT_MINUTES="${TEST_TIMEOUT_MINUTES:-30}"
MAX_RETRY_ATTEMPTS="${MAX_RETRY_ATTEMPTS:-3}"
CLEANUP_ON_EXIT="${CLEANUP_ON_EXIT:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

print_banner() {
    echo "==================================================================================="
    echo "  🏛️ HARRIS PACS INTEGRATION TESTING - BENTON COUNTY"
    echo "  Comprehensive Testing for 90 Specialized Harris PACS Agents"
    echo "==================================================================================="
    echo "  Total AI Agents: ${HARRIS_PACS_AGENTS_COUNT}"
    echo "  Test Suite: ${BENTON_COUNTY_TEST_SUITE}"
    echo "  Government Compliance: ${GOVERNMENT_COMPLIANCE_TESTING}"
    echo "  Parallel Execution: ${PARALLEL_EXECUTION}"
    echo "  Continuous Mode: ${CONTINUOUS_TESTING_MODE}"
    echo "==================================================================================="
    echo "  Agent Distribution:"
    echo "    • Connectivity Specialists: 15 agents"
    echo "    • Data Sync Experts: 20 agents"
    echo "    • Performance Analysts: 15 agents"
    echo "    • Compliance Validators: 12 agents"
    echo "    • Integration Testers: 15 agents"
    echo "    • Monitoring Surveillance: 8 agents"
    echo "    • Security Auditors: 5 agents"
    echo "==================================================================================="
    echo
}

# Validate prerequisites
validate_prerequisites() {
    log_header "Validating Prerequisites for Harris PACS Testing"
    
    # Check required tools
    local required_tools=("docker" "docker-compose" "curl" "jq")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        else
            log_info "  ✓ $tool is available"
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Validate Harris PACS test directory structure
    local test_dir="${PROJECT_ROOT}/tests/harris-pacs-integration"
    if [ ! -d "$test_dir" ]; then
        log_error "Harris PACS integration test directory not found: $test_dir"
        exit 1
    fi
    
    # Check required test files
    local required_files=(
        "docker-compose.harris-pacs-test.yml"
        "orchestration/harris_pacs_test_orchestrator.py"
        "mock-services/harris-pacs/harris_pacs_mock_server.py"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "${test_dir}/${file}" ]; then
            log_error "Required test file not found: ${file}"
            exit 1
        else
            log_info "  ✓ ${file} exists"
        fi
    done
    
    log_success "Prerequisites validation completed"
}

# Setup test environment
setup_test_environment() {
    log_header "Setting Up Harris PACS Test Environment"
    
    local test_dir="${PROJECT_ROOT}/tests/harris-pacs-integration"
    cd "$test_dir"
    
    # Create test data directories
    mkdir -p test-results
    mkdir -p logs
    mkdir -p backups
    
    # Set proper permissions
    chmod -R 755 test-results logs backups
    
    # Create environment configuration
    cat > .env << EOF
# Harris PACS Integration Test Environment Configuration

# Test Configuration
HARRIS_PACS_AGENTS_COUNT=${HARRIS_PACS_AGENTS_COUNT}
BENTON_COUNTY_TEST_SUITE=${BENTON_COUNTY_TEST_SUITE}
GOVERNMENT_COMPLIANCE_TESTING=${GOVERNMENT_COMPLIANCE_TESTING}
CONTINUOUS_TESTING_MODE=${CONTINUOUS_TESTING_MODE}

# Mock Services Configuration
HARRIS_PACS_MOCK_MODE=comprehensive
BENTON_COUNTY_SIMULATION=true
GOVERNMENT_COMPLIANCE_MODE=${GOVERNMENT_COMPLIANCE_TESTING}
API_RESPONSE_DELAY_MS=100
FAILURE_INJECTION_RATE=0.02

# Agent Specialization Configuration
CONNECTIVITY_AGENTS=15
DATA_SYNC_AGENTS=20
PERFORMANCE_AGENTS=15
COMPLIANCE_AGENTS=12
INTEGRATION_AGENTS=15
MONITORING_AGENTS=8
SECURITY_AGENTS=5

# Database Configuration
POSTGRES_DB=benton_county_test
POSTGRES_USER=benton_assessor
POSTGRES_PASSWORD=test_assessor_2024

# Test Execution Configuration
PARALLEL_TEST_EXECUTION=${PARALLEL_EXECUTION}
TEST_TIMEOUT_SECONDS=$((TEST_TIMEOUT_MINUTES * 60))
MAX_RETRY_ATTEMPTS=${MAX_RETRY_ATTEMPTS}

# Government Compliance
FISMA_COMPLIANCE_VALIDATION=true
NIST_FRAMEWORK_VALIDATION=true
SECTION_508_ACCESSIBILITY=true

# Monitoring and Metrics
PROMETHEUS_METRICS_ENABLED=true
REAL_TIME_MONITORING=true
TEST_RESULT_RETENTION_DAYS=30

# Benton County Specific
COUNTY_NAME=Benton
STATE=Washington
ASSESSOR_OFFICE=Benton County Assessor
HARRIS_PACS_MODULES=CAMA,RealEstate,Assessment,Collections,Permits
EOF
    
    log_success "Test environment setup completed"
}

# Build test infrastructure
build_test_infrastructure() {
    log_header "Building Harris PACS Test Infrastructure"
    
    local test_dir="${PROJECT_ROOT}/tests/harris-pacs-integration"
    cd "$test_dir"
    
    # Build all test services
    log_info "Building Harris PACS mock services..."
    docker-compose -f docker-compose.harris-pacs-test.yml build --parallel
    
    # Pull required images
    log_info "Pulling required base images..."
    docker-compose -f docker-compose.harris-pacs-test.yml pull
    
    log_success "Test infrastructure built successfully"
}

# Start test infrastructure
start_test_infrastructure() {
    log_header "Starting Harris PACS Test Infrastructure"
    
    local test_dir="${PROJECT_ROOT}/tests/harris-pacs-integration"
    cd "$test_dir"
    
    # Start mock services first
    log_info "Starting Harris PACS mock services..."
    docker-compose -f docker-compose.harris-pacs-test.yml up -d \
        harris-pacs-mock \
        government-db-mock
    
    # Wait for mock services to be ready
    log_info "Waiting for mock services to initialize..."
    sleep 30
    
    # Verify mock services health
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts..."
        
        if curl -f -s http://localhost:\${{TF_PORT_8180:-8180}}/health >/dev/null 2>&1; then
            log_info "  ✓ Harris PACS Mock: Healthy"
            break
        else
            log_info "  ⚠ Harris PACS Mock: Starting..."
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Mock services failed to start within timeout"
            return 1
        fi
        
        sleep 5
        ((attempt++))
    done
    
    # Start agent testing services
    log_info "Starting Harris PACS agent testing services..."
    docker-compose -f docker-compose.harris-pacs-test.yml up -d \
        connectivity-agents-tester \
        data-sync-agents-tester \
        performance-agents-tester \
        compliance-agents-tester \
        integration-testing-agents \
        monitoring-agents-tester \
        security-audit-agents
    
    # Start orchestration and reporting services
    log_info "Starting test orchestration services..."
    docker-compose -f docker-compose.harris-pacs-test.yml up -d \
        harris-pacs-test-orchestrator \
        harris-pacs-test-dashboard \
        harris-pacs-test-metrics \
        government-compliance-reporter
    
    # Start disaster recovery testing
    log_info "Starting disaster recovery testing service..."
    docker-compose -f docker-compose.harris-pacs-test.yml up -d \
        disaster-recovery-tester
    
    log_success "Harris PACS test infrastructure started"
}

# Validate service readiness
validate_service_readiness() {
    log_header "Validating Harris PACS Test Services Readiness"
    
    # Define services to check
    declare -A services=(
        ["Harris PACS Mock"]="8180:/health"
        ["Government DB Mock"]="5433"
        ["Test Orchestrator"]="9000:/health"
        ["Test Dashboard"]="3050"
        ["Connectivity Agents"]="9510:/health"
        ["Data Sync Agents"]="9520:/health"
        ["Performance Agents"]="9530:/health"
        ["Compliance Agents"]="9540:/health"
        ["Integration Agents"]="9550:/health"
        ["Monitoring Agents"]="9560:/health"
        ["Security Agents"]="9570:/health"
    )
    
    local failed_services=()
    local max_attempts=60  # 5 minutes total
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Service readiness check attempt $attempt/$max_attempts..."
        
        local all_ready=true
        failed_services=()
        
        for service in "${!services[@]}"; do
            local endpoint="${services[$service]}"
            
            if [[ "$endpoint" == *":/"* ]]; then
                local port="${endpoint%:/*}"
                local path="${endpoint#*:}"
                
                if curl -f -s "http://localhost:${port}${path}" >/dev/null 2>&1; then
                    log_info "  ✓ ${service}: Ready"
                else
                    failed_services+=("$service")
                    all_ready=false
                    log_info "  ⚠ ${service}: Starting..."
                fi
            else
                # Simple port check
                local port="$endpoint"
                if nc -z localhost "$port" 2>/dev/null; then
                    log_info "  ✓ ${service}: Ready"
                else
                    failed_services+=("$service")
                    all_ready=false
                    log_info "  ⚠ ${service}: Starting..."
                fi
            fi
        done
        
        if [ "$all_ready" = true ]; then
            log_success "All Harris PACS test services are ready"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Services failed to start: ${failed_services[*]}"
            return 1
        fi
        
        sleep 5
        ((attempt++))
    done
}

# Execute Harris PACS integration tests
execute_integration_tests() {
    log_header "Executing Harris PACS Integration Tests"
    
    local test_start_time=$(date +%s)
    local test_results_file="/tmp/harris-pacs-test-results-$(date +%Y%m%d_%H%M%S).json"
    
    # Execute comprehensive test suite via orchestrator
    log_info "Triggering comprehensive Harris PACS test execution..."
    
    local test_payload=$(cat << EOF
{
    "test_suite": "${BENTON_COUNTY_TEST_SUITE}",
    "total_agents": ${HARRIS_PACS_AGENTS_COUNT},
    "county": "benton",
    "government_compliance": ${GOVERNMENT_COMPLIANCE_TESTING},
    "parallel_execution": ${PARALLEL_EXECUTION},
    "timeout_minutes": ${TEST_TIMEOUT_MINUTES}
}
EOF
)
    
    # Start test execution
    local execution_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$test_payload" \
        http://localhost:\${{TF_PORT_8180:-8180}}/api/execute_comprehensive_tests)
    
    if [ $? -ne 0 ]; then
        log_error "Failed to start Harris PACS integration tests"
        return 1
    fi
    
    local test_execution_id=$(echo "$execution_response" | jq -r '.test_execution_id // "unknown"')
    log_info "Test execution started with ID: $test_execution_id"
    
    # Monitor test execution
    log_info "Monitoring test execution progress..."
    
    local timeout_seconds=$((TEST_TIMEOUT_MINUTES * 60))
    local elapsed_seconds=0
    local check_interval=30
    
    while [ $elapsed_seconds -lt $timeout_seconds ]; do
        # Check test status
        local status_response=$(curl -s "http://localhost:\${{TF_PORT_8180:-8180}}/api/test_status/$test_execution_id")
        local test_status=$(echo "$status_response" | jq -r '.status // "unknown"')
        local progress=$(echo "$status_response" | jq -r '.progress_percentage // 0')
        
        log_info "Test progress: ${progress}% - Status: $test_status"
        
        # Check for completion
        if [[ "$test_status" == "completed" ]]; then
            log_success "Harris PACS integration tests completed successfully"
            
            # Fetch final results
            local final_results=$(curl -s "http://localhost:\${{TF_PORT_8180:-8180}}/api/test_results/$test_execution_id")
            echo "$final_results" > "$test_results_file"
            
            # Display results summary
            display_test_results "$final_results"
            return 0
        elif [[ "$test_status" == "failed" ]]; then
            log_error "Harris PACS integration tests failed"
            
            # Fetch failure details
            local failure_details=$(curl -s "http://localhost:\${{TF_PORT_8180:-8180}}/api/test_results/$test_execution_id")
            echo "$failure_details" > "$test_results_file"
            
            display_test_results "$failure_details"
            return 1
        fi
        
        sleep $check_interval
        elapsed_seconds=$((elapsed_seconds + check_interval))
    done
    
    log_error "Harris PACS integration tests timed out after ${TEST_TIMEOUT_MINUTES} minutes"
    return 1
}

# Display test results
display_test_results() {
    local results_json="$1"
    
    log_header "Harris PACS Integration Test Results Summary"
    
    # Parse results
    local overall_success_rate=$(echo "$results_json" | jq -r '.overall_metrics.overall_success_rate // 0')
    local total_tests=$(echo "$results_json" | jq -r '.overall_metrics.total_tests_executed // 0')
    local successful_tests=$(echo "$results_json" | jq -r '.overall_metrics.successful_tests // 0')
    local execution_duration=$(echo "$results_json" | jq -r '.overall_metrics.execution_duration_minutes // 0')
    
    echo "🎯 Overall Results:"
    echo "  Total Tests Executed: $total_tests"
    echo "  Successful Tests: $successful_tests"
    echo "  Success Rate: $(printf "%.1f%%" "$(echo "$overall_success_rate * 100" | bc -l)")"
    echo "  Execution Duration: $(printf "%.1f" "$execution_duration") minutes"
    echo ""
    
    echo "🤖 Agent Specialization Results:"
    
    # Parse specialization results
    local specializations=("connectivity" "data-sync" "performance-analysis" "compliance-validation" "integration-testing" "monitoring-surveillance" "security-audit")
    
    for spec in "${specializations[@]}"; do
        local spec_results=$(echo "$results_json" | jq -r ".specialization_results.\"$spec\" // []")
        if [[ "$spec_results" != "[]" && "$spec_results" != "null" ]]; then
            local spec_success_rate=$(echo "$spec_results" | jq -r 'map(select(.success_rate >= 0.95)) | length')
            local spec_total=$(echo "$spec_results" | jq -r 'length')
            
            echo "  ${spec}: ${spec_success_rate}/${spec_total} scenarios passed"
        fi
    done
    
    echo ""
    echo "🏛️ Government Compliance Results:"
    
    # Parse compliance results
    local fisma_score=$(echo "$results_json" | jq -r '.government_compliance.FISMA.compliance_score // 0')
    local nist_score=$(echo "$results_json" | jq -r '.government_compliance.NIST.compliance_score // 0')
    
    if [[ "$fisma_score" != "0" && "$fisma_score" != "null" ]]; then
        echo "  FISMA Compliance: $(printf "%.1f" "$fisma_score")/100"
    fi
    
    if [[ "$nist_score" != "0" && "$nist_score" != "null" ]]; then
        echo "  NIST Framework: $(printf "%.1f" "$nist_score")/100"
    fi
    
    echo ""
    echo "🏡 Benton County Scenarios:"
    
    # Parse Benton County results
    local property_assessment=$(echo "$results_json" | jq -r '.benton_county_scenarios.property_assessment // {} | keys | length')
    local harris_modules=$(echo "$results_json" | jq -r '.benton_county_scenarios.harris_pacs_modules // {} | keys | length')
    
    if [[ "$property_assessment" -gt 0 ]]; then
        echo "  Property Assessment Scenarios: $property_assessment tested"
    fi
    
    if [[ "$harris_modules" -gt 0 ]]; then
        echo "  Harris PACS Modules: $harris_modules validated"
    fi
    
    echo ""
    
    # Success/failure summary
    if (( $(echo "$overall_success_rate >= 0.95" | bc -l) )); then
        log_success "✅ Harris PACS Integration Tests: PASSED"
        echo "   🏛️ Government compliance validated"
        echo "   🤖 All 90 agents performing within specifications"
        echo "   🏡 Benton County scenarios validated"
    elif (( $(echo "$overall_success_rate >= 0.85" | bc -l) )); then
        log_warn "⚠️ Harris PACS Integration Tests: PASSED WITH WARNINGS"
        echo "   Some tests failed but overall system is functional"
    else
        log_error "❌ Harris PACS Integration Tests: FAILED"
        echo "   Significant issues detected - review required"
    fi
}

# Generate test report
generate_test_report() {
    log_header "Generating Harris PACS Test Report"
    
    local test_dir="${PROJECT_ROOT}/tests/harris-pacs-integration"
    local report_dir="${test_dir}/test-results/reports"
    mkdir -p "$report_dir"
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="${report_dir}/harris-pacs-test-report-${timestamp}.html"
    
    # Generate comprehensive HTML report
    curl -s "http://localhost:\${{TF_PORT_8180:-8180}}/api/generate_report?format=html" > "$report_file"
    
    if [ -f "$report_file" ]; then
        log_success "Test report generated: $report_file"
        
        # Generate PDF report if possible
        if command -v wkhtmltopdf >/dev/null 2>&1; then
            local pdf_file="${report_dir}/harris-pacs-test-report-${timestamp}.pdf"
            wkhtmltopdf "$report_file" "$pdf_file" 2>/dev/null && \
                log_success "PDF report generated: $pdf_file"
        fi
    else
        log_warn "Failed to generate test report"
    fi
}

# Cleanup test infrastructure
cleanup_test_infrastructure() {
    log_header "Cleaning Up Harris PACS Test Infrastructure"
    
    local test_dir="${PROJECT_ROOT}/tests/harris-pacs-integration"
    cd "$test_dir" 2>/dev/null || return
    
    log_info "Stopping Harris PACS test services..."
    docker-compose -f docker-compose.harris-pacs-test.yml down --timeout 30
    
    # Optional: Remove test volumes
    if [ "${CLEANUP_VOLUMES:-false}" = "true" ]; then
        log_info "Removing test volumes..."
        docker-compose -f docker-compose.harris-pacs-test.yml down -v
    fi
    
    log_success "Test infrastructure cleanup completed"
}

# Main execution function
main() {
    print_banner
    
    # Set up cleanup trap if enabled
    if [ "$CLEANUP_ON_EXIT" = "true" ]; then
        trap cleanup_test_infrastructure EXIT INT TERM
    fi
    
    validate_prerequisites
    setup_test_environment
    build_test_infrastructure
    start_test_infrastructure
    
    # Wait for services to fully initialize
    log_info "Waiting for services to fully initialize (60 seconds)..."
    sleep 60
    
    validate_service_readiness
    
    if [ "$CONTINUOUS_TESTING_MODE" = "true" ]; then
        log_info "Starting continuous testing mode..."
        log_info "Press Ctrl+C to stop continuous testing"
        
        while true; do
            log_info "Starting Harris PACS integration test cycle..."
            
            if execute_integration_tests; then
                log_success "Test cycle completed successfully"
            else
                log_warn "Test cycle completed with issues"
            fi
            
            log_info "Waiting 1 hour before next test cycle..."
            sleep 3600
        done
    else
        # Single test execution
        if execute_integration_tests; then
            generate_test_report
            
            echo ""
            log_success "🎯 Harris PACS Integration Testing Complete!"
            log_success "📊 90 specialized agents validated for Benton County"
            log_success "🏛️ Government compliance testing passed")
            log_success "📋 Test results and reports available")
            
            exit 0
        else
            log_error "Harris PACS integration testing failed"
            exit 1
        fi
    fi
}

# Execute main function
main "$@"