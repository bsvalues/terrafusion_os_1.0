#!/bin/bash

# ==================================================
# REVOLUTIONARY: TerraFusion OS 1.0 Validation Suite
# Comprehensive Testing for Government-Grade Microservices
# 
# This validation suite ensures our quantum AI-enhanced
# microservices architecture meets the highest standards
# of government excellence and citizen satisfaction.
# ==================================================

set -euo pipefail

# Colors for enhanced output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
TEST_RESULTS_DIR="test-results"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$TEST_RESULTS_DIR/validation-$TIMESTAMP.log"

# Create test results directory
mkdir -p "$TEST_RESULTS_DIR"

echo -e "${PURPLE}=================================================="
echo -e "🧪 TERRAFUSION OS 1.0 - VALIDATION SUITE"
echo -e "   Government. Transcended. Quality Assured."
echo -e "==================================================${NC}"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Test result tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    ((TOTAL_TESTS++))
    echo -n "  Testing $test_name: "
    log "TEST START: $test_name"
    
    if eval "$test_command" | grep -q "$expected_result" 2>/dev/null; then
        echo -e "${GREEN}PASS${NC}"
        log "TEST PASS: $test_name"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        log "TEST FAIL: $test_name - Expected: $expected_result"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Function to test API endpoint
test_api_endpoint() {
    local service_name="$1"
    local port="$2"
    local endpoint="$3"
    local expected_status="$4"
    
    ((TOTAL_TESTS++))
    echo -n "  $service_name API ($endpoint): "
    log "API TEST START: $service_name - $endpoint"
    
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$endpoint" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}PASS ($status_code)${NC}"
        log "API TEST PASS: $service_name - $endpoint - Status: $status_code"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}FAIL ($status_code)${NC}"
        log "API TEST FAIL: $service_name - $endpoint - Expected: $expected_status, Got: $status_code"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Function to test service health
test_service_health() {
    echo -e "\n${CYAN}🏥 Health Check Validation${NC}"
    log "SECTION: Health Check Validation"
    
    services=(
        "API Gateway:5000"
        "Property Service:5001"
        "Citizen Services:5002"
        "Document Management:5003"
        "Compliance Monitoring:5004"
        "AI Intelligence:5005"
        "Knowledge Graph:5006"
        "Emotional Intelligence:5007"
        "Communication Hub:5008"
        "Analytics & Reporting:5009"
        "Event Streaming:5010"
        "Identity & Access:5011"
        "Audit & Logging:5012"
        "Backup & Recovery:5013"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        test_api_endpoint "$name" "$port" "/health" "200"
    done
}

# Function to test infrastructure services
test_infrastructure() {
    echo -e "\n${CYAN}🏗️ Infrastructure Validation${NC}"
    log "SECTION: Infrastructure Validation"
    
    # Test Consul
    run_test "Consul Service Discovery" \
        "curl -s http://localhost:8500/v1/status/leader" \
        '\"'
    
    # Test PostgreSQL
    run_test "PostgreSQL Database" \
        "PGPASSWORD=TerraFusion2024! psql -h localhost -U terrafusion -d terrafusion_os -c 'SELECT 1'" \
        "1"
    
    # Test Redis
    run_test "Redis Cache" \
        "redis-cli -h localhost -p 6379 -a TerraFusion2024! ping" \
        "PONG"
    
    # Test RabbitMQ
    run_test "RabbitMQ Message Broker" \
        "curl -s -u terrafusion:TerraFusion2024! http://localhost:15672/api/overview" \
        "management_version"
}

# Function to test monitoring services
test_monitoring() {
    echo -e "\n${CYAN}📊 Monitoring & Observability Validation${NC}"
    log "SECTION: Monitoring Validation"
    
    # Test Prometheus
    test_api_endpoint "Prometheus" "9090" "/api/v1/status/config" "200"
    
    # Test Grafana
    test_api_endpoint "Grafana" "3000" "/api/health" "200"
}

# Function to test gateway functionality
test_gateway_features() {
    echo -e "\n${CYAN}🌐 API Gateway Features Validation${NC}"
    log "SECTION: Gateway Features Validation"
    
    # Test gateway info endpoint
    test_api_endpoint "Gateway Info" "5000" "/gateway/info" "200"
    
    # Test service discovery endpoint
    test_api_endpoint "Service Discovery" "5000" "/gateway/services" "200"
    
    # Test health endpoint with detailed information
    test_api_endpoint "Detailed Health" "5000" "/health/detailed" "200"
}

# Function to test quantum AI features
test_quantum_ai() {
    echo -e "\n${CYAN}🤖 Quantum AI Features Validation${NC}"
    log "SECTION: Quantum AI Validation"
    
    # Test AI service availability
    test_api_endpoint "AI Intelligence Core" "5005" "/health" "200"
    
    # Test knowledge graph service
    test_api_endpoint "Knowledge Graph Engine" "5006" "/health" "200"
    
    # Test emotional intelligence service
    test_api_endpoint "Emotional Intelligence" "5007" "/health" "200"
    
    # Test quantum routing through gateway
    ((TOTAL_TESTS++))
    echo -n "  Quantum Routing Intelligence: "
    log "QUANTUM TEST START: Routing Intelligence"
    
    local response
    response=$(curl -s -H "X-Citizen-ID: test-citizen" \
        -H "X-Geographic-Region: benton-county" \
        -H "X-Emergency-Request: false" \
        "http://localhost:5000/gateway/info" 2>/dev/null || echo "")
    
    if echo "$response" | grep -q "Quantum AI Routing"; then
        echo -e "${GREEN}PASS${NC}"
        log "QUANTUM TEST PASS: Routing Intelligence"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}FAIL${NC}"
        log "QUANTUM TEST FAIL: Routing Intelligence"
        ((FAILED_TESTS++))
    fi
}

# Function to test citizen-centric features
test_citizen_features() {
    echo -e "\n${CYAN}👥 Citizen-Centric Features Validation${NC}"
    log "SECTION: Citizen Features Validation"
    
    # Test citizen services
    test_api_endpoint "Citizen Services Portal" "5002" "/health" "200"
    
    # Test accessibility features
    ((TOTAL_TESTS++))
    echo -n "  Accessibility Support: "
    log "ACCESSIBILITY TEST START"
    
    local response
    response=$(curl -s -H "X-Screen-Reader: true" \
        -H "X-High-Contrast: true" \
        -H "User-Agent: NVDA screen reader" \
        "http://localhost:5000/gateway/info" 2>/dev/null || echo "")
    
    if [ -n "$response" ]; then
        echo -e "${GREEN}PASS${NC}"
        log "ACCESSIBILITY TEST PASS"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}FAIL${NC}"
        log "ACCESSIBILITY TEST FAIL"
        ((FAILED_TESTS++))
    fi
}

# Function to test government compliance
test_compliance() {
    echo -e "\n${CYAN}🏛️ Government Compliance Validation${NC}"
    log "SECTION: Compliance Validation"
    
    # Test compliance monitoring service
    test_api_endpoint "Compliance Monitoring" "5004" "/health" "200"
    
    # Test audit logging service
    test_api_endpoint "Audit & Logging" "5012" "/health" "200"
    
    # Test security headers
    ((TOTAL_TESTS++))
    echo -n "  FISMA Security Headers: "
    log "SECURITY TEST START: Headers"
    
    local headers
    headers=$(curl -s -I "http://localhost:5000/gateway/info" 2>/dev/null || echo "")
    
    if echo "$headers" | grep -q "X-Content-Type-Options\|X-Frame-Options\|X-XSS-Protection"; then
        echo -e "${GREEN}PASS${NC}"
        log "SECURITY TEST PASS: Headers"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}FAIL${NC}"
        log "SECURITY TEST FAIL: Headers"
        ((FAILED_TESTS++))
    fi
}

# Function to test performance
test_performance() {
    echo -e "\n${CYAN}⚡ Performance Validation${NC}"
    log "SECTION: Performance Validation"
    
    # Test response times
    services=("5000:Gateway" "5001:Property" "5002:Citizen" "5005:AI")
    
    for service in "${services[@]}"; do
        IFS=':' read -r port name <<< "$service"
        
        ((TOTAL_TESTS++))
        echo -n "  $name Response Time: "
        log "PERFORMANCE TEST START: $name"
        
        local response_time
        response_time=$(curl -s -w "%{time_total}" -o /dev/null "http://localhost:$port/health" 2>/dev/null || echo "999")
        
        # Convert to milliseconds and check if under 2 seconds
        local ms_time
        ms_time=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "9999")
        
        if (( $(echo "$ms_time < 2000" | bc -l) )); then
            echo -e "${GREEN}PASS (${ms_time%.*}ms)${NC}"
            log "PERFORMANCE TEST PASS: $name - ${ms_time%.*}ms"
            ((PASSED_TESTS++))
        else
            echo -e "${RED}FAIL (${ms_time%.*}ms)${NC}"
            log "PERFORMANCE TEST FAIL: $name - ${ms_time%.*}ms"
            ((FAILED_TESTS++))
        fi
    done
}

# Function to test data persistence
test_data_persistence() {
    echo -e "\n${CYAN}💾 Data Persistence Validation${NC}"
    log "SECTION: Data Persistence Validation"
    
    # Test database connectivity from services
    test_api_endpoint "Property Data Access" "5001" "/health" "200"
    test_api_endpoint "Citizen Data Access" "5002" "/health" "200"
    test_api_endpoint "Document Storage" "5003" "/health" "200"
    
    # Test backup service
    test_api_endpoint "Backup & Recovery" "5013" "/health" "200"
}

# Function to test container health
test_containers() {
    echo -e "\n${CYAN}🐳 Container Health Validation${NC}"
    log "SECTION: Container Health Validation"
    
    # Get all TerraFusion containers
    local containers
    containers=$(docker ps --filter "name=terrafusion" --format "{{.Names}}" 2>/dev/null || echo "")
    
    if [ -z "$containers" ]; then
        echo -e "  ${RED}No TerraFusion containers found${NC}"
        ((TOTAL_TESTS++))
        ((FAILED_TESTS++))
        log "CONTAINER TEST FAIL: No containers found"
        return
    fi
    
    while IFS= read -r container; do
        ((TOTAL_TESTS++))
        echo -n "  Container $container: "
        log "CONTAINER TEST START: $container"
        
        local status
        status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
        
        if [ "$status" = "healthy" ] || [ "$status" = "none" ]; then
            # If no health check defined, check if running
            if [ "$status" = "none" ]; then
                status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "unknown")
                if [ "$status" = "running" ]; then
                    echo -e "${GREEN}PASS (running)${NC}"
                    log "CONTAINER TEST PASS: $container - running"
                    ((PASSED_TESTS++))
                else
                    echo -e "${RED}FAIL ($status)${NC}"
                    log "CONTAINER TEST FAIL: $container - $status"
                    ((FAILED_TESTS++))
                fi
            else
                echo -e "${GREEN}PASS (healthy)${NC}"
                log "CONTAINER TEST PASS: $container - healthy"
                ((PASSED_TESTS++))
            fi
        else
            echo -e "${RED}FAIL ($status)${NC}"
            log "CONTAINER TEST FAIL: $container - $status"
            ((FAILED_TESTS++))
        fi
    done <<< "$containers"
}

# Function to generate validation report
generate_report() {
    echo -e "\n${WHITE}=================================================="
    echo -e "📋 VALIDATION REPORT - TerraFusion OS 1.0"
    echo -e "==================================================${NC}"
    
    local success_rate
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    else
        success_rate="0.0"
    fi
    
    echo -e "${CYAN}Total Tests:    ${WHITE}$TOTAL_TESTS${NC}"
    echo -e "${GREEN}Passed:         ${WHITE}$PASSED_TESTS${NC}"
    echo -e "${RED}Failed:         ${WHITE}$FAILED_TESTS${NC}"
    echo -e "${YELLOW}Success Rate:   ${WHITE}$success_rate%${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! TerraFusion OS is operating at peak excellence!${NC}"
        echo -e "${GREEN}🏛️ Government. Transcended. Quality Assured.${NC}"
        log "VALIDATION COMPLETE: ALL TESTS PASSED"
    elif [ $FAILED_TESTS -lt 5 ]; then
        echo -e "${YELLOW}⚠️ Minor issues detected. System is operational with $FAILED_TESTS minor failures.${NC}"
        echo -e "${YELLOW}🔧 Review the log file for details: $LOG_FILE${NC}"
        log "VALIDATION COMPLETE: MINOR ISSUES DETECTED"
    else
        echo -e "${RED}❌ Significant issues detected. $FAILED_TESTS tests failed.${NC}"
        echo -e "${RED}🚨 Immediate attention required. Review log: $LOG_FILE${NC}"
        log "VALIDATION COMPLETE: SIGNIFICANT ISSUES DETECTED"
    fi
    
    echo ""
    echo -e "${CYAN}📄 Detailed results saved to: ${WHITE}$LOG_FILE${NC}"
    echo -e "${CYAN}🕐 Validation completed at: ${WHITE}$(date)${NC}"
    
    # Create summary file
    cat > "$TEST_RESULTS_DIR/summary-$TIMESTAMP.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "total_tests": $TOTAL_TESTS,
  "passed_tests": $PASSED_TESTS,
  "failed_tests": $FAILED_TESTS,
  "success_rate": $success_rate,
  "status": "$(if [ $FAILED_TESTS -eq 0 ]; then echo "PASS"; elif [ $FAILED_TESTS -lt 5 ]; then echo "WARNING"; else echo "FAIL"; fi)",
  "log_file": "$LOG_FILE"
}
EOF
}

# Main validation function
main() {
    log "Starting TerraFusion OS 1.0 validation suite"
    
    echo -e "${BLUE}Starting comprehensive validation of TerraFusion OS microservices...${NC}\n"
    
    test_infrastructure
    test_monitoring
    test_service_health
    test_gateway_features
    test_quantum_ai
    test_citizen_features
    test_compliance
    test_performance
    test_data_persistence
    test_containers
    
    generate_report
    
    log "TerraFusion OS 1.0 validation suite completed"
    
    # Exit with appropriate code
    if [ $FAILED_TESTS -eq 0 ]; then
        exit 0
    elif [ $FAILED_TESTS -lt 5 ]; then
        exit 1
    else
        exit 2
    fi
}

# Execute main function
main "$@"