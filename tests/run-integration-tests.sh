#!/bin/bash

# TerraFusion OS Integration Test Runner
# Comprehensive testing script for all infrastructure components

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$TEST_DIR")"
DOCKER_COMPOSE_FILES=(
    "docker-compose.consul.yml"
    "docker-compose.kong.yml" 
    "docker-compose.messaging.yml"
)

# Test configuration
WAIT_TIMEOUT=120
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=5

echo -e "${BLUE}🧪 TerraFusion OS Integration Test Suite${NC}"
echo -e "${BLUE}======================================${NC}"

# Function to print colored messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if a service is healthy
check_service_health() {
    local service_name=$1
    local health_url=$2
    local retries=${3:-$HEALTH_CHECK_RETRIES}
    
    log_info "Checking health of $service_name..."
    
    for i in $(seq 1 $retries); do
        if curl -sf "$health_url" > /dev/null 2>&1; then
            log_success "$service_name is healthy"
            return 0
        fi
        
        if [ $i -lt $retries ]; then
            log_info "Attempt $i/$retries: $service_name not ready, waiting ${HEALTH_CHECK_INTERVAL}s..."
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    log_error "$service_name failed health check after $retries attempts"
    return 1
}

# Function to wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    local services=(
        "Consul:http://localhost:\${{TF_CONSUL_PORT:-8500}}/v1/status/leader"
        "Kong Admin:http://localhost:\${{TF_CONSUL_PORT:-8500}}/status"
        "RabbitMQ:http://localhost:\${{TF_CONSUL_PORT:-8500}}/api/overview"
        "Kafka UI:http://localhost:\${{TF_CONSUL_PORT:-8500}}"
        "Message Coordinator:http://localhost:\${{TF_CONSUL_PORT:-8500}}/health"
    )
    
    local all_healthy=true
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name health_url <<< "$service_info"
        
        if ! check_service_health "$service_name" "$health_url"; then
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        log_success "All services are healthy and ready"
        return 0
    else
        log_error "Some services failed health checks"
        return 1
    fi
}

# Function to start infrastructure services
start_services() {
    log_info "Starting TerraFusion OS infrastructure services..."
    
    cd "$PROJECT_ROOT"
    
    # Start services in order
    for compose_file in "${DOCKER_COMPOSE_FILES[@]}"; do
        if [ -f "$compose_file" ]; then
            log_info "Starting services from $compose_file..."
            docker-compose -f "$compose_file" up -d
        else
            log_warning "Docker compose file $compose_file not found"
        fi
    done
    
    # Start progress monitor if available
    if [ -f "terrafusion-ops/monitoring/implementation-progress-monitor.cjs" ]; then
        log_info "Starting progress monitor..."
        cd "terrafusion-ops/monitoring"
        npm install > /dev/null 2>&1 || true
        node implementation-progress-monitor.cjs &
        PROGRESS_MONITOR_PID=$!
        cd "$PROJECT_ROOT"
        log_success "Progress monitor started (PID: $PROGRESS_MONITOR_PID)"
    fi
    
    # Start message coordinator if available
    if [ -f "message-coordinator/package.json" ]; then
        log_info "Starting message coordinator..."
        cd "message-coordinator"
        npm install > /dev/null 2>&1 || true
        npm start &
        MESSAGE_COORDINATOR_PID=$!
        cd "$PROJECT_ROOT"
        log_success "Message coordinator started (PID: $MESSAGE_COORDINATOR_PID)"
    fi
    
    sleep 10  # Give services time to start
}

# Function to stop infrastructure services
stop_services() {
    log_info "Stopping TerraFusion OS infrastructure services..."
    
    cd "$PROJECT_ROOT"
    
    # Stop Node.js services
    if [ ! -z "${PROGRESS_MONITOR_PID:-}" ]; then
        log_info "Stopping progress monitor..."
        kill $PROGRESS_MONITOR_PID 2>/dev/null || true
    fi
    
    if [ ! -z "${MESSAGE_COORDINATOR_PID:-}" ]; then
        log_info "Stopping message coordinator..."
        kill $MESSAGE_COORDINATOR_PID 2>/dev/null || true
    fi
    
    # Stop Docker services
    for compose_file in "${DOCKER_COMPOSE_FILES[@]}"; do
        if [ -f "$compose_file" ]; then
            log_info "Stopping services from $compose_file..."
            docker-compose -f "$compose_file" down -v 2>/dev/null || true
        fi
    done
    
    log_success "All services stopped"
}

# Function to run integration tests
run_integration_tests() {
    log_info "Running integration tests..."
    
    cd "$TEST_DIR"
    
    # Install test dependencies if needed
    if [ -f "package.json" ]; then
        log_info "Installing test dependencies..."
        npm install > /dev/null 2>&1
    fi
    
    # Run different test suites
    local test_exit_code=0
    
    # Integration tests
    if [ -f "integration/terrafusion-integration.test.js" ]; then
        log_info "Running integration tests..."
        if npm test -- integration/terrafusion-integration.test.js; then
            log_success "Integration tests passed"
        else
            log_error "Integration tests failed"
            test_exit_code=1
        fi
    fi
    
    # E2E tests
    if [ -f "e2e/terrafusion-e2e.test.js" ]; then
        log_info "Running E2E tests..."
        if npm test -- e2e/terrafusion-e2e.test.js; then
            log_success "E2E tests passed"
        else
            log_error "E2E tests failed"
            test_exit_code=1
        fi
    fi
    
    return $test_exit_code
}

# Function to generate test report
generate_test_report() {
    log_info "Generating test report..."
    
    local report_file="$PROJECT_ROOT/test-results.md"
    
    cat > "$report_file" << EOF
# TerraFusion OS Integration Test Report

**Test Date:** $(date)
**Test Environment:** $(uname -a)

## Test Summary

EOF
    
    # Add service status to report
    echo "## Service Health Status" >> "$report_file"
    echo "" >> "$report_file"
    
    local services=(
        "Consul:http://localhost:\${{TF_CONSUL_PORT:-8500}}/v1/status/leader"
        "Kong:http://localhost:\${{TF_CONSUL_PORT:-8500}}/status"
        "RabbitMQ:http://localhost:\${{TF_CONSUL_PORT:-8500}}/api/overview"
        "Redis:redis://localhost:\${{TF_CONSUL_PORT:-8500}}"
        "Kafka:http://localhost:\${{TF_CONSUL_PORT:-8500}}"
        "Message Coordinator:http://localhost:\${{TF_CONSUL_PORT:-8500}}/health"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name health_url <<< "$service_info"
        
        if curl -sf "$health_url" > /dev/null 2>&1; then
            echo "- ✅ $service_name: Healthy" >> "$report_file"
        else
            echo "- ❌ $service_name: Unhealthy" >> "$report_file"
        fi
    done
    
    echo "" >> "$report_file"
    echo "## Test Coverage" >> "$report_file"
    echo "" >> "$report_file"
    echo "- Service Discovery (Consul): Integration tests" >> "$report_file"
    echo "- API Gateway (Kong): Rate limiting, authentication, proxying" >> "$report_file"
    echo "- Message Bus: RabbitMQ, Kafka, Redis connectivity" >> "$report_file"
    echo "- Plugin SDK: TypeScript/JavaScript SDK functionality" >> "$report_file"
    echo "- AI Agent Coordination: 50,000+ agent simulation" >> "$report_file"
    echo "- Government Compliance: Audit logging, FISMA compliance" >> "$report_file"
    
    log_success "Test report generated: $report_file"
}

# Function to cleanup test artifacts
cleanup_test_artifacts() {
    log_info "Cleaning up test artifacts..."
    
    # Remove test databases/data
    docker volume prune -f > /dev/null 2>&1 || true
    
    # Remove test logs
    find "$PROJECT_ROOT" -name "*.test.log" -delete 2>/dev/null || true
    
    # Remove temporary test files
    find "$PROJECT_ROOT" -name "test-*" -type f -delete 2>/dev/null || true
    
    log_success "Test artifacts cleaned up"
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check for required commands
    local required_commands=("docker" "docker-compose" "curl" "node" "npm")
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" > /dev/null 2>&1; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_error "Please install the missing dependencies and try again"
        return 1
    fi
    
    # Check Docker daemon
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker daemon is not running"
        return 1
    fi
    
    log_success "All prerequisites satisfied"
    return 0
}

# Function to display help
show_help() {
    cat << EOF
TerraFusion OS Integration Test Runner

Usage: $0 [OPTIONS]

Options:
    -h, --help          Show this help message
    -s, --start-only    Only start services (no tests)
    -t, --test-only     Only run tests (assume services are running)
    -c, --clean         Clean up and stop all services
    -r, --report        Generate test report only
    --skip-e2e          Skip E2E tests
    --skip-integration  Skip integration tests

Examples:
    $0                  Run full test suite (start services, test, cleanup)
    $0 --start-only     Start services for manual testing
    $0 --test-only      Run tests against already running services
    $0 --clean          Stop all services and cleanup

EOF
}

# Main execution function
main() {
    local start_services_flag=true
    local run_tests_flag=true
    local cleanup_flag=true
    local skip_e2e=false
    local skip_integration=false
    local report_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -s|--start-only)
                start_services_flag=true
                run_tests_flag=false
                cleanup_flag=false
                shift
                ;;
            -t|--test-only)
                start_services_flag=false
                cleanup_flag=false
                shift
                ;;
            -c|--clean)
                start_services_flag=false
                run_tests_flag=false
                cleanup_flag=true
                shift
                ;;
            -r|--report)
                start_services_flag=false
                run_tests_flag=false
                cleanup_flag=false
                report_only=true
                shift
                ;;
            --skip-e2e)
                skip_e2e=true
                shift
                ;;
            --skip-integration)
                skip_integration=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Handle report-only mode
    if [ "$report_only" = true ]; then
        generate_test_report
        exit 0
    fi
    
    # Handle cleanup-only mode
    if [ "$cleanup_flag" = true ] && [ "$start_services_flag" = false ] && [ "$run_tests_flag" = false ]; then
        stop_services
        cleanup_test_artifacts
        exit 0
    fi
    
    # Check prerequisites
    if ! check_prerequisites; then
        exit 1
    fi
    
    # Set up cleanup trap
    trap 'log_warning "Test interrupted"; stop_services; cleanup_test_artifacts; exit 1' INT TERM
    
    local overall_exit_code=0
    
    # Start services if requested
    if [ "$start_services_flag" = true ]; then
        start_services
        
        if ! wait_for_services; then
            log_error "Services failed to start properly"
            stop_services
            exit 1
        fi
    fi
    
    # Run tests if requested
    if [ "$run_tests_flag" = true ]; then
        if ! run_integration_tests; then
            overall_exit_code=1
        fi
        
        # Generate test report
        generate_test_report
    fi
    
    # Cleanup if requested
    if [ "$cleanup_flag" = true ]; then
        stop_services
        cleanup_test_artifacts
    fi
    
    # Final status
    if [ $overall_exit_code -eq 0 ]; then
        log_success "🎉 All tests completed successfully!"
    else
        log_error "💥 Some tests failed. Check the logs for details."
    fi
    
    exit $overall_exit_code
}

# Run main function with all arguments
main "$@"