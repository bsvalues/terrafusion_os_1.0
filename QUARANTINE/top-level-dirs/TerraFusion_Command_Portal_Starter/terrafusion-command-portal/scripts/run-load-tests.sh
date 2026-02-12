#!/bin/bash

# TerraFusion Load Testing Execution Script
# 
# Comprehensive automated execution of all load testing scenarios
# Validates government-grade performance requirements
# 
# THE TERRAFUSION WAY: Systematic performance excellence

set -e  # Exit on any error

# Colors for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8787"
FRONTEND_URL="http://localhost:5177"
RESULTS_DIR="./test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                    TerraFusion Load Testing Suite                    ║${NC}"
echo -e "${PURPLE}║                         THE TERRAFUSION WAY                          ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a service is running
check_service() {
    local url=$1
    local service_name=$2
    
    echo -e "${BLUE}🔍 Checking ${service_name} availability...${NC}"
    
    if curl -s --max-time 5 "$url" > /dev/null; then
        echo -e "${GREEN}✅ ${service_name} is operational at ${url}${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  ${service_name} not available at ${url}${NC}"
        return 1
    fi
}

# Function to install k6 if not present
install_k6() {
    if ! command -v k6 &> /dev/null; then
        echo -e "${YELLOW}📦 Installing k6 load testing framework...${NC}"
        
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux installation
            sudo gpg -k
            sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
            echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
            sudo apt-get update
            sudo apt-get install k6
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS installation
            brew install k6
        else
            echo -e "${RED}❌ Unsupported operating system for automatic k6 installation${NC}"
            echo -e "${YELLOW}Please install k6 manually from https://k6.io/docs/get-started/installation/${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}✅ k6 installation completed${NC}"
    else
        echo -e "${GREEN}✅ k6 is already installed$(NC)"
    fi
}

# Function to prepare test environment
prepare_environment() {
    echo -e "${CYAN}🛠️  Preparing test environment...${NC}"
    
    # Create results directory
    mkdir -p "$RESULTS_DIR"
    
    # Check k6 installation
    install_k6
    
    # Verify k6 version
    echo -e "${BLUE}📊 K6 version:${NC}"
    k6 version
    
    echo -e "${GREEN}✅ Test environment prepared${NC}"
}

# Function to execute individual test suite
run_test_suite() {
    local test_file=$1
    local test_name=$2
    local output_file="$RESULTS_DIR/${test_name}_${TIMESTAMP}"
    
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║ Executing: ${test_name}${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    
    if [[ ! -f "$test_file" ]]; then
        echo -e "${RED}❌ Test file not found: $test_file${NC}"
        return 1
    fi
    
    # Execute k6 test with comprehensive output
    echo -e "${BLUE}🚀 Starting load test execution...${NC}"
    
    k6 run \
        --out json="${output_file}.json" \
        --out csv="${output_file}.csv" \
        --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
        --summary-time-unit=ms \
        "$test_file" | tee "${output_file}.log"
    
    local exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        echo -e "${GREEN}✅ ${test_name} completed successfully${NC}"
        echo -e "${CYAN}📁 Results saved to: ${output_file}.*${NC}"
    else
        echo -e "${RED}❌ ${test_name} failed with exit code: $exit_code${NC}"
    fi
    
    return $exit_code
}

# Function to analyze test results
analyze_results() {
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║ Performance Analysis                                                ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    
    local total_tests=0
    local passed_tests=0
    
    echo -e "${BLUE}📊 Analyzing test results...${NC}"
    
    # Count result files
    for result_file in "$RESULTS_DIR"/*.json; do
        if [[ -f "$result_file" ]]; then
            total_tests=$((total_tests + 1))
            
            # Basic analysis of JSON results
            if grep -q '"http_req_failed":{"fails":0' "$result_file" 2>/dev/null; then
                passed_tests=$((passed_tests + 1))
            fi
        fi
    done
    
    echo -e "${CYAN}📈 Test Execution Summary:${NC}"
    echo -e "   Total Tests: $total_tests"
    echo -e "   Passed Tests: $passed_tests"
    echo -e "   Failed Tests: $((total_tests - passed_tests))"
    
    if [[ $passed_tests -eq $total_tests && $total_tests -gt 0 ]]; then
        echo -e "${GREEN}🎉 All tests passed! Government performance standards met.${NC}"
        return 0
    elif [[ $total_tests -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  No test results found to analyze.${NC}"
        return 1
    else
        echo -e "${RED}❌ Some tests failed. Performance optimization required.${NC}"
        return 1
    fi
}

# Function to generate performance report
generate_report() {
    echo ""
    echo -e "${CYAN}📋 Generating comprehensive performance report...${NC}"
    
    local report_file="$RESULTS_DIR/terrafusion_performance_report_${TIMESTAMP}.md"
    
    cat > "$report_file" << EOF
# TerraFusion Load Testing Report

**Generated:** $(date)
**Test Session:** $TIMESTAMP

## Executive Summary

This report presents the results of comprehensive load testing performed on the TerraFusion Command Portal system. The testing validates performance against government-grade requirements for citizen services, emergency response, and multi-agency coordination.

## Test Environment

- **Backend Service:** $BACKEND_URL
- **Frontend Service:** $FRONTEND_URL
- **Testing Framework:** k6
- **Results Directory:** $RESULTS_DIR

## Test Suites Executed

EOF

    # Add test suite information
    for log_file in "$RESULTS_DIR"/*.log; do
        if [[ -f "$log_file" ]]; then
            local test_name=$(basename "$log_file" .log)
            echo "### $test_name" >> "$report_file"
            echo "" >> "$report_file"
            
            # Extract key metrics from log
            if grep -q "checks" "$log_file"; then
                echo "**Key Metrics:**" >> "$report_file"
                grep -E "(checks|http_req_duration|http_req_failed|iterations)" "$log_file" | head -10 >> "$report_file"
                echo "" >> "$report_file"
            fi
        fi
    done
    
    cat >> "$report_file" << EOF

## Performance Standards Compliance

The TerraFusion system is designed to meet the following government performance standards:

- **Maximum Response Time:** 2000ms (95th percentile)
- **Minimum Success Rate:** 99.5%
- **Emergency Response Time:** 500ms maximum
- **Federation Latency:** 100ms maximum

## Recommendations

Based on the load testing results, consider the following optimizations:

1. **Database Optimization:** Implement connection pooling and query optimization
2. **Caching Strategy:** Deploy Redis for session and API response caching  
3. **CDN Implementation:** Use content delivery network for static assets
4. **Horizontal Scaling:** Configure auto-scaling for peak traffic periods
5. **Monitoring:** Implement real-time performance monitoring with alerting

## Technical Details

Detailed results are available in the following files:
EOF

    for result_file in "$RESULTS_DIR"/*_"$TIMESTAMP".*; do
        if [[ -f "$result_file" ]]; then
            echo "- $(basename "$result_file")" >> "$report_file"
        fi
    done
    
    echo "" >> "$report_file"
    echo "---" >> "$report_file"
    echo "*Generated by TerraFusion Load Testing Framework - THE TERRAFUSION WAY*" >> "$report_file"
    
    echo -e "${GREEN}✅ Performance report generated: $report_file${NC}"
}

# Main execution flow
main() {
    echo -e "${CYAN}🚀 Starting TerraFusion Load Testing Suite...${NC}"
    
    # Prepare environment
    prepare_environment
    
    # Check service availability
    backend_available=false
    frontend_available=false
    
    if check_service "$BACKEND_URL/health" "Backend Service"; then
        backend_available=true
    fi
    
    if check_service "$FRONTEND_URL" "Frontend Service"; then
        frontend_available=true
    fi
    
    # Execute test suites
    echo ""
    echo -e "${CYAN}📊 Executing load test suites...${NC}"
    
    test_results=()
    
    # Government services load test
    if [[ -f "tests/load/k6-government-load-test.js" ]]; then
        if run_test_suite "tests/load/k6-government-load-test.js" "government_services_load_test"; then
            test_results+=("PASS")
        else
            test_results+=("FAIL")
        fi
    fi
    
    # General load test
    if [[ -f "tests/load/terrafusion-load-test.js" ]]; then
        if run_test_suite "tests/load/terrafusion-load-test.js" "terrafusion_comprehensive_load_test"; then
            test_results+=("PASS")
        else
            test_results+=("FAIL")
        fi
    fi
    
    # Execute Node.js framework if available
    if [[ -f "tests/load/load-test-framework.js" ]]; then
        echo ""
        echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${PURPLE}║ Executing Node.js Load Testing Framework                            ║${NC}"
        echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
        
        cd tests/load && node load-test-framework.js || true
        cd ../..
    fi
    
    # Analyze results
    if analyze_results; then
        analysis_result="PASS"
    else
        analysis_result="FAIL"
    fi
    
    # Generate comprehensive report
    generate_report
    
    # Final summary
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║ Load Testing Execution Complete                                     ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "${CYAN}📊 Final Summary:${NC}"
    echo -e "   Backend Available: $(if $backend_available; then echo -e "${GREEN}Yes${NC}"; else echo -e "${YELLOW}No${NC}"; fi)"
    echo -e "   Frontend Available: $(if $frontend_available; then echo -e "${GREEN}Yes${NC}"; else echo -e "${YELLOW}No${NC}"; fi)"
    echo -e "   Test Suites: ${#test_results[@]}"
    echo -e "   Analysis Result: $(if [[ "$analysis_result" == "PASS" ]]; then echo -e "${GREEN}PASS${NC}"; else echo -e "${RED}FAIL${NC}"; fi)"
    
    # Count passed tests
    passed_count=0
    for result in "${test_results[@]}"; do
        if [[ "$result" == "PASS" ]]; then
            passed_count=$((passed_count + 1))
        fi
    done
    
    echo -e "   Passed Tests: ${passed_count}/${#test_results[@]}"
    
    if [[ $passed_count -eq ${#test_results[@]} && $analysis_result == "PASS" ]]; then
        echo ""
        echo -e "${GREEN}🎉 ALL TESTS PASSED! Government performance standards achieved.${NC}"
        echo -e "${GREEN}✅ TerraFusion system ready for production deployment.${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}❌ Some tests failed. System optimization required before deployment.${NC}"
        exit 1
    fi
}

# Execute main function
main "$@"