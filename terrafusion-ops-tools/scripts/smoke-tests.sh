#!/bin/bash
#
# TerraFusion Smoke Tests
# Quick validation of critical functionality after deployment
#
# Usage: ./smoke-tests.sh [environment]
# Example: ./smoke-tests.sh production

set -euo pipefail

# Configuration
ENVIRONMENT=${1:-staging}
BASE_URL=${BASE_URL:-"http://localhost:8080"}
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3003"}
AI_ENGINE_URL=${AI_ENGINE_URL:-"http://localhost:8001"}
TEST_USER_EMAIL="test@terrafusion.com"
TEST_USER_PASSWORD="TestPassword123!"
TIMEOUT=10

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test tracking
run_test() {
    local test_name=$1
    local test_function=$2
    
    echo -n "Running: $test_name... "
    
    if $test_function; then
        echo -e "${GREEN}PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}FAILED${NC}"
        ((TESTS_FAILED++))
        FAILED_TESTS+=("$test_name")
    fi
}

# Helper function for API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=${3:-}
    local token=${4:-}
    
    local headers="-H 'Content-Type: application/json'"
    if [ -n "$token" ]; then
        headers="$headers -H 'Authorization: Bearer $token'"
    fi
    
    if [ -n "$data" ]; then
        eval curl -sf -X "$method" "$headers" -d "'$data'" --max-time "$TIMEOUT" "$BASE_URL$endpoint"
    else
        eval curl -sf -X "$method" "$headers" --max-time "$TIMEOUT" "$BASE_URL$endpoint"
    fi
}

# Test: API Health Check
test_api_health() {
    local response=$(curl -sf --max-time "$TIMEOUT" "$BASE_URL/health")
    [ "$?" -eq 0 ] && [[ "$response" == *"healthy"* ]]
}

# Test: Frontend Loading
test_frontend_loading() {
    local response=$(curl -sf --max-time "$TIMEOUT" "$FRONTEND_URL")
    [ "$?" -eq 0 ] && [[ "$response" == *"TerraFusion"* ]]
}

# Test: AI Engine Health
test_ai_engine_health() {
    local response=$(curl -sf --max-time "$TIMEOUT" "$AI_ENGINE_URL/health")
    [ "$?" -eq 0 ] && [[ "$response" == *"healthy"* ]]
}

# Test: User Authentication
test_user_authentication() {
    local response=$(api_call POST "/api/auth/login" "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}")
    [ "$?" -eq 0 ] && [[ "$response" == *"token"* ]]
}

# Test: Get Projects List
test_get_projects() {
    # First get auth token
    local auth_response=$(api_call POST "/api/auth/login" "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}")
    local token=$(echo "$auth_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$token" ]; then
        return 1
    fi
    
    local response=$(api_call GET "/api/projects" "" "$token")
    [ "$?" -eq 0 ] && ([[ "$response" == *"projects"* ]] || [[ "$response" == "[]" ]])
}

# Test: Create Project
test_create_project() {
    # Get auth token
    local auth_response=$(api_call POST "/api/auth/login" "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}")
    local token=$(echo "$auth_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$token" ]; then
        return 1
    fi
    
    local project_data='{
        "name": "Smoke Test Project",
        "description": "Automated test project",
        "type": "construction",
        "location": "Test Location"
    }'
    
    local response=$(api_call POST "/api/projects" "$project_data" "$token")
    [ "$?" -eq 0 ] && [[ "$response" == *"id"* ]]
}

# Test: Cost Calculation
test_cost_calculation() {
    # Get auth token
    local auth_response=$(api_call POST "/api/auth/login" "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}")
    local token=$(echo "$auth_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$token" ]; then
        return 1
    fi
    
    local cost_data='{
        "project_type": "construction",
        "area_sqft": 10000,
        "materials": ["concrete", "steel"],
        "location": "urban"
    }'
    
    local response=$(api_call POST "/api/costs/calculate" "$cost_data" "$token")
    [ "$?" -eq 0 ] && [[ "$response" == *"total_cost"* ]]
}

# Test: AI Prediction
test_ai_prediction() {
    local prediction_data='{
        "project_type": "construction",
        "features": {
            "area": 10000,
            "floors": 3,
            "location_type": "urban"
        }
    }'
    
    local response=$(curl -sf -X POST \
        -H "Content-Type: application/json" \
        -d "$prediction_data" \
        --max-time "$TIMEOUT" \
        "$AI_ENGINE_URL/api/predict")
    
    [ "$?" -eq 0 ] && [[ "$response" == *"prediction"* ]]
}

# Test: Database Connectivity
test_database_connectivity() {
    # This tests if the API can connect to the database
    local response=$(curl -sf --max-time "$TIMEOUT" "$BASE_URL/api/health/db")
    [ "$?" -eq 0 ] && [[ "$response" == *"connected"* ]]
}

# Test: Redis Connectivity
test_redis_connectivity() {
    # This tests if the API can connect to Redis
    local response=$(curl -sf --max-time "$TIMEOUT" "$BASE_URL/api/health/cache")
    [ "$?" -eq 0 ] && [[ "$response" == *"connected"* ]]
}

# Test: Static Assets
test_static_assets() {
    # Test if static files are being served
    local response=$(curl -sf -I --max-time "$TIMEOUT" "$FRONTEND_URL/static/css/main.css")
    [[ "$response" == *"200 OK"* ]] || [[ "$response" == *"304 Not Modified"* ]]
}

# Test: API Rate Limiting
test_rate_limiting() {
    # Make multiple rapid requests to test rate limiting
    local success_count=0
    local rate_limited=false
    
    for i in {1..20}; do
        local response=$(curl -sf -w "%{http_code}" -o /dev/null --max-time 2 "$BASE_URL/api/health")
        if [ "$response" = "429" ]; then
            rate_limited=true
            break
        elif [ "$response" = "200" ]; then
            ((success_count++))
        fi
    done
    
    # Rate limiting should kick in or all requests should succeed
    [ "$rate_limited" = true ] || [ "$success_count" -eq 20 ]
}

# Test: Error Handling
test_error_handling() {
    # Test 404 handling
    local response=$(curl -sf -w "%{http_code}" -o /dev/null --max-time "$TIMEOUT" "$BASE_URL/api/nonexistent")
    [ "$response" = "404" ]
}

# Test: CORS Headers
test_cors_headers() {
    local response=$(curl -sf -I -H "Origin: http://example.com" --max-time "$TIMEOUT" "$BASE_URL/api/health")
    [[ "$response" == *"Access-Control-Allow-Origin"* ]]
}

# Performance test helper
measure_response_time() {
    local url=$1
    local start_time=$(date +%s%N)
    curl -sf --max-time "$TIMEOUT" "$url" > /dev/null
    local end_time=$(date +%s%N)
    echo $(( (end_time - start_time) / 1000000 ))
}

# Test: API Performance
test_api_performance() {
    local response_time=$(measure_response_time "$BASE_URL/api/health")
    [ "$response_time" -lt 1000 ]  # Should respond in less than 1 second
}

# Main test execution
main() {
    echo "=================================="
    echo "TerraFusion Smoke Tests"
    echo "Environment: $ENVIRONMENT"
    echo "Base URL: $BASE_URL"
    echo "Time: $(date)"
    echo "=================================="
    echo ""
    
    # Core functionality tests
    run_test "API Health Check" test_api_health
    run_test "Frontend Loading" test_frontend_loading
    run_test "AI Engine Health" test_ai_engine_health
    run_test "Database Connectivity" test_database_connectivity
    run_test "Redis Connectivity" test_redis_connectivity
    
    # Authentication tests
    run_test "User Authentication" test_user_authentication
    
    # API functionality tests
    run_test "Get Projects List" test_get_projects
    run_test "Create Project" test_create_project
    run_test "Cost Calculation" test_cost_calculation
    run_test "AI Prediction" test_ai_prediction
    
    # Infrastructure tests
    run_test "Static Assets Serving" test_static_assets
    run_test "Rate Limiting" test_rate_limiting
    run_test "Error Handling" test_error_handling
    run_test "CORS Headers" test_cors_headers
    run_test "API Performance" test_api_performance
    
    echo ""
    echo "=================================="
    echo "Test Summary"
    echo "=================================="
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
    
    if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
        echo ""
        echo "Failed tests:"
        for test in "${FAILED_TESTS[@]}"; do
            echo "  - $test"
        done
    fi
    
    echo "=================================="
    
    # Exit with appropriate code
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All smoke tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed!${NC}"
        exit 1
    fi
}

# Create test user if needed (for fresh installations)
create_test_user() {
    echo "Creating test user..."
    
    local user_data="{
        \"email\": \"$TEST_USER_EMAIL\",
        \"password\": \"$TEST_USER_PASSWORD\",
        \"name\": \"Test User\",
        \"role\": \"assessor\"
    }"
    
    # Try to create user (ignore if already exists)
    api_call POST "/api/auth/register" "$user_data" 2>/dev/null || true
}

# Check if we should create test user
if [ "$ENVIRONMENT" != "production" ]; then
    create_test_user
fi

# Run tests
main