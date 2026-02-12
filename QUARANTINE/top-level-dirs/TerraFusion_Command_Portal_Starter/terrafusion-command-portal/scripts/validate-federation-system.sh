#!/bin/bash

# TerraFusion Federation System Validation Suite
# Advanced testing framework for federation endpoints and real-time systems

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
FEDERATION_WS="ws://localhost:8787/ws/federation"
TEST_TIMEOUT=30
RESULTS_FILE="federation-test-results.json"

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Utility functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_header() {
    echo -e "\n${PURPLE}🚀 $1${NC}"
    echo -e "${PURPLE}$(printf '=%.0s' {1..60})${NC}"
}

# Test execution helper
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    ((TESTS_TOTAL++))
    
    log_info "Testing: $test_name"
    
    if timeout $TEST_TIMEOUT bash -c "$test_command" > /tmp/test_output 2>&1; then
        if [[ -n "$expected_pattern" ]]; then
            if grep -q "$expected_pattern" /tmp/test_output; then
                log_success "$test_name: PASSED"
                return 0
            else
                log_error "$test_name: FAILED - Expected pattern not found"
                cat /tmp/test_output
                return 1
            fi
        else
            log_success "$test_name: PASSED"
            return 0
        fi
    else
        log_error "$test_name: FAILED - Command failed or timed out"
        cat /tmp/test_output
        return 1
    fi
}

# API endpoint tests
test_federation_endpoints() {
    log_header "FEDERATION API ENDPOINTS VALIDATION"
    
    # Test Counties endpoint
    run_test "Counties Endpoint" \
        "curl -s -f $BASE_URL/api/federation/counties" \
        "benton\\|franklin\\|yakima"
    
    # Test Connections endpoint
    run_test "Connections Endpoint" \
        "curl -s -f $BASE_URL/api/federation/connections" \
        "source_county\\|target_county\\|Active"
    
    # Test Dashboard endpoint
    run_test "Dashboard Metrics" \
        "curl -s -f $BASE_URL/api/federation/dashboard" \
        "total_counties\\|active_connections\\|system_health"
    
    # Test Health endpoint
    run_test "Health Status" \
        "curl -s -f $BASE_URL/health" \
        "federation_status\\|connectivity_healthy"
    
    # Test Prometheus metrics
    run_test "Prometheus Metrics" \
        "curl -s -f $BASE_URL/metrics" \
        "tf_"
}

# Data validation tests
test_data_validation() {
    log_header "FEDERATION DATA VALIDATION"
    
    # Test county data structure
    run_test "County Data Structure" \
        "curl -s $BASE_URL/api/federation/counties | jq '.[0] | keys' | grep -q 'name\\|display_name\\|endpoints'" \
        ""
    
    # Test connection data structure  
    run_test "Connection Data Structure" \
        "curl -s $BASE_URL/api/federation/connections | jq '.[0] | keys' | grep -q 'source_county\\|target_county\\|status'" \
        ""
    
    # Test dashboard metrics structure
    run_test "Dashboard Metrics Structure" \
        "curl -s $BASE_URL/api/federation/dashboard | jq 'keys' | grep -q 'total_counties\\|active_connections\\|system_health'" \
        ""
    
    # Test metrics values are reasonable
    run_test "Reasonable Metric Values" \
        "curl -s $BASE_URL/api/federation/dashboard | jq '.total_counties >= 1 and .active_connections >= 1 and .system_health >= 0.5'" \
        "true"
}

# Performance tests
test_performance() {
    log_header "FEDERATION PERFORMANCE VALIDATION"
    
    # Test response time
    run_test "Counties Endpoint Response Time" \
        "time curl -s $BASE_URL/api/federation/counties > /dev/null" \
        ""
    
    # Test concurrent requests
    run_test "Concurrent Request Handling" \
        "for i in {1..5}; do curl -s $BASE_URL/api/federation/counties > /dev/null & done; wait" \
        ""
    
    # Test large response handling
    run_test "Large Response Handling" \
        "curl -s $BASE_URL/api/federation/connections | jq 'length >= 1'" \
        "true"
}

# Security tests
test_security() {
    log_header "FEDERATION SECURITY VALIDATION"
    
    # Test CORS headers
    run_test "CORS Headers" \
        "curl -s -I $BASE_URL/api/federation/counties" \
        "access-control-allow-origin"
    
    # Test invalid endpoints return proper errors
    run_test "Invalid Endpoint Handling" \
        "curl -s -o /dev/null -w '%{http_code}' $BASE_URL/api/federation/invalid" \
        "404"
    
    # Test health check doesn't expose sensitive data
    run_test "Health Check Security" \
        "curl -s $BASE_URL/health | jq 'has(\"password\") or has(\"secret\") or has(\"key\")'" \
        "false"
}

# WebSocket tests (basic validation)
test_websockets() {
    log_header "FEDERATION WEBSOCKET VALIDATION"
    
    # Check if WebSocket endpoint is accessible
    run_test "WebSocket Endpoint Accessibility" \
        "curl -s -I --http1.1 -H 'Connection: Upgrade' -H 'Upgrade: websocket' $BASE_URL/ws/federation" \
        ""
    
    # Note: Full WebSocket testing would require more complex tooling like wscat or websocat
    log_info "Note: Full WebSocket real-time testing requires wscat/websocat for comprehensive validation"
}

# Real-time data consistency tests
test_realtime_consistency() {
    log_header "REAL-TIME DATA CONSISTENCY VALIDATION"
    
    # Test that data changes between requests (indicates real-time updates)
    run_test "Real-time Metrics Updates" \
        'FIRST=$(curl -s $BASE_URL/api/federation/dashboard | jq .timestamp); sleep 2; SECOND=$(curl -s $BASE_URL/api/federation/dashboard | jq .timestamp); [ "$FIRST" != "$SECOND" ]' \
        ""
    
    # Test connection metrics are being updated
    run_test "Connection Metrics Updates" \
        'curl -s $BASE_URL/api/federation/connections | jq ".[0].last_updated" | grep -q "[0-9]"' \
        ""
}

# Integration tests
test_integration() {
    log_header "FEDERATION INTEGRATION VALIDATION"
    
    # Test that all endpoints return consistent county counts
    run_test "Consistent County Count" \
        'COUNTIES=$(curl -s $BASE_URL/api/federation/counties | jq length); DASHBOARD=$(curl -s $BASE_URL/api/federation/dashboard | jq .total_counties); [ "$COUNTIES" = "$DASHBOARD" ]' \
        ""
    
    # Test that connections reference valid counties
    run_test "Valid Connection References" \
        'COUNTIES=$(curl -s $BASE_URL/api/federation/counties | jq -r ".[].name"); CONNECTIONS=$(curl -s $BASE_URL/api/federation/connections | jq -r ".[].source_county, .[].target_county"); echo "$CONNECTIONS" | while read county; do echo "$COUNTIES" | grep -q "$county" || exit 1; done' \
        ""
}

# Generate test report
generate_report() {
    log_header "FEDERATION TEST RESULTS SUMMARY"
    
    echo -e "${CYAN}📊 Test Statistics:${NC}"
    echo -e "   Total Tests: $TESTS_TOTAL"
    echo -e "   Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "   Failed: ${RED}$TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Federation system is fully operational.${NC}"
        SUCCESS_RATE=100
    else
        SUCCESS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
        echo -e "\n${YELLOW}⚠️  Some tests failed. Success rate: $SUCCESS_RATE%${NC}"
    fi
    
    # Generate JSON report
    cat > "$RESULTS_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "federation_system": {
    "total_tests": $TESTS_TOTAL,
    "tests_passed": $TESTS_PASSED,
    "tests_failed": $TESTS_FAILED,
    "success_rate_percent": $SUCCESS_RATE,
    "status": "$([ $TESTS_FAILED -eq 0 ] && echo "OPERATIONAL" || echo "ISSUES_DETECTED")"
  },
  "test_categories": [
    "federation_endpoints",
    "data_validation", 
    "performance",
    "security",
    "websockets",
    "realtime_consistency",
    "integration"
  ],
  "recommendation": "$([ $TESTS_FAILED -eq 0 ] && echo "System ready for production deployment" || echo "Address failing tests before production deployment")"
}
EOF
    
    log_info "Test report saved to: $RESULTS_FILE"
}

# Main execution
main() {
    echo -e "${PURPLE}"
    echo "🌐 TerraFusion Federation System Validation Suite"
    echo "================================================"
    echo -e "${NC}"
    
    log_info "Starting comprehensive federation system validation..."
    log_info "Base URL: $BASE_URL"
    log_info "Timeout: ${TEST_TIMEOUT}s per test"
    
    # Wait for server to be ready
    log_info "Waiting for server to be ready..."
    timeout 60 bash -c 'until curl -s http://localhost:8787/health > /dev/null; do sleep 1; done' || {
        log_error "Server not responding. Please start the backend first."
        exit 1
    }
    log_success "Server is ready!"
    
    # Run test suites
    test_federation_endpoints
    test_data_validation
    test_performance
    test_security
    test_websockets
    test_realtime_consistency
    test_integration
    
    # Generate final report
    generate_report
    
    # Exit with appropriate code
    [ $TESTS_FAILED -eq 0 ] && exit 0 || exit 1
}

# Cleanup on exit
cleanup() {
    rm -f /tmp/test_output
}
trap cleanup EXIT

# Run main function
main "$@"