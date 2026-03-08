#!/bin/bash

# ==================================================
# TerraFusion OS 1.0 Deployment Validation Suite
# Tests only the services that actually exist.
# ==================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

TEST_RESULTS_DIR="test-results"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$TEST_RESULTS_DIR/validation-$TIMESTAMP.log"

mkdir -p "$TEST_RESULTS_DIR"

echo -e "${CYAN}=================================================="
echo -e "  TERRAFUSION OS 1.0 - VALIDATION SUITE"
echo -e "==================================================${NC}"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"

    ((TOTAL_TESTS++))
    echo -n "  $test_name: "
    log "TEST START: $test_name"

    if eval "$test_command" 2>/dev/null | grep -q "$expected_result" 2>/dev/null; then
        echo -e "${GREEN}PASS${NC}"
        log "TEST PASS: $test_name"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        log "TEST FAIL: $test_name"
        ((FAILED_TESTS++))
        return 1
    fi
}

test_api_endpoint() {
    local service_name="$1"
    local port="$2"
    local endpoint="$3"
    local expected_status="$4"

    ((TOTAL_TESTS++))
    echo -n "  $service_name ($endpoint): "
    log "API TEST: $service_name $endpoint"

    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$endpoint" 2>/dev/null || echo "000")

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}PASS ($status_code)${NC}"
        log "API TEST PASS: $service_name - $status_code"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}FAIL ($status_code)${NC}"
        log "API TEST FAIL: $service_name - expected $expected_status, got $status_code"
        ((FAILED_TESTS++))
        return 1
    fi
}

# ── Infrastructure ────────────────────────────────
test_infrastructure() {
    echo -e "\n${CYAN}Infrastructure${NC}"
    log "SECTION: Infrastructure"

    run_test "Consul Service Discovery" \
        "curl -s http://localhost:8500/v1/status/leader" \
        '\"'

    run_test "PostgreSQL Database" \
        "docker exec terrafusion-postgres pg_isready -U terrafusion -d terrafusion_os" \
        "accepting connections"

    run_test "Redis Cache" \
        "docker exec terrafusion-redis redis-cli ping" \
        "PONG"

    run_test "RabbitMQ Broker" \
        "curl -s -u terrafusion:TerraFusion2024! http://localhost:15672/api/overview" \
        "management_version"
}

# ── Monitoring ────────────────────────────────────
test_monitoring() {
    echo -e "\n${CYAN}Monitoring${NC}"
    log "SECTION: Monitoring"

    test_api_endpoint "Prometheus" "9090" "/api/v1/status/config" "200"
    test_api_endpoint "Grafana" "3001" "/api/health" "200"
}

# ── Core service health ──────────────────────────
test_service_health() {
    echo -e "\n${CYAN}Core Service Health${NC}"
    log "SECTION: Core Service Health"

    services=(
        "API (Kernel):5000"
        "Gateway (Shell):3002"
        "Consciousness (AI Swarm):3004"
    )

    for svc in "${services[@]}"; do
        IFS=':' read -r name port <<< "$svc"
        test_api_endpoint "$name" "$port" "/health" "200"
    done
}

# ── Gateway features ─────────────────────────────
test_gateway_features() {
    echo -e "\n${CYAN}Gateway Features${NC}"
    log "SECTION: Gateway Features"

    test_api_endpoint "Gateway Info" "3002" "/gateway/info" "200"
    test_api_endpoint "Gateway Health Detail" "3002" "/health" "200"
}

# ── Security headers ─────────────────────────────
test_compliance() {
    echo -e "\n${CYAN}Compliance${NC}"
    log "SECTION: Compliance"

    ((TOTAL_TESTS++))
    echo -n "  FISMA Security Headers: "
    log "TEST: Security Headers"

    local headers
    headers=$(curl -s -I "http://localhost:5000/health" 2>/dev/null || echo "")

    if echo "$headers" | grep -qi "X-Content-Type-Options\|X-Frame-Options\|Strict-Transport-Security"; then
        echo -e "${GREEN}PASS${NC}"
        log "TEST PASS: Security Headers"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}FAIL${NC}"
        log "TEST FAIL: Security Headers"
        ((FAILED_TESTS++))
    fi
}

# ── Performance ───────────────────────────────────
test_performance() {
    echo -e "\n${CYAN}Performance${NC}"
    log "SECTION: Performance"

    endpoints=("5000:API" "3002:Gateway" "3004:Consciousness")

    for ep in "${endpoints[@]}"; do
        IFS=':' read -r port name <<< "$ep"

        ((TOTAL_TESTS++))
        echo -n "  $name response time: "
        log "PERF TEST: $name"

        local response_time
        response_time=$(curl -s -w "%{time_total}" -o /dev/null "http://localhost:$port/health" 2>/dev/null || echo "999")

        local ms
        ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "9999")

        if (( $(echo "$ms < 2000" | bc -l 2>/dev/null || echo 0) )); then
            echo -e "${GREEN}PASS (${ms%.*}ms)${NC}"
            log "PERF PASS: $name ${ms%.*}ms"
            ((PASSED_TESTS++))
        else
            echo -e "${RED}FAIL (${ms%.*}ms)${NC}"
            log "PERF FAIL: $name ${ms%.*}ms"
            ((FAILED_TESTS++))
        fi
    done
}

# ── Container health ─────────────────────────────
test_containers() {
    echo -e "\n${CYAN}Container Health${NC}"
    log "SECTION: Container Health"

    local containers
    containers=$(docker ps --filter "name=terrafusion" --format "{{.Names}}" 2>/dev/null || echo "")

    if [ -z "$containers" ]; then
        echo -e "  ${RED}No TerraFusion containers running${NC}"
        ((TOTAL_TESTS++))
        ((FAILED_TESTS++))
        return
    fi

    while IFS= read -r container; do
        ((TOTAL_TESTS++))
        echo -n "  $container: "

        local status
        status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")

        if [ "$status" = "healthy" ]; then
            echo -e "${GREEN}healthy${NC}"
            ((PASSED_TESTS++))
        elif [ "$status" = "none" ]; then
            local running
            running=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "unknown")
            if [ "$running" = "running" ]; then
                echo -e "${GREEN}running${NC}"
                ((PASSED_TESTS++))
            else
                echo -e "${RED}$running${NC}"
                ((FAILED_TESTS++))
            fi
        else
            echo -e "${RED}$status${NC}"
            ((FAILED_TESTS++))
        fi
    done <<< "$containers"
}

# ── Report ────────────────────────────────────────
generate_report() {
    echo -e "\n${WHITE}=================================================="
    echo -e "  VALIDATION REPORT"
    echo -e "==================================================${NC}"

    local rate
    if [ "$TOTAL_TESTS" -gt 0 ]; then
        rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc 2>/dev/null || echo "0")
    else
        rate="0"
    fi

    echo -e "  Total:   ${WHITE}$TOTAL_TESTS${NC}"
    echo -e "  Passed:  ${GREEN}$PASSED_TESTS${NC}"
    echo -e "  Failed:  ${RED}$FAILED_TESTS${NC}"
    echo -e "  Rate:    ${WHITE}${rate}%${NC}"
    echo ""

    if [ "$FAILED_TESTS" -eq 0 ]; then
        echo -e "${GREEN}All tests passed.${NC}"
        log "VALIDATION: ALL PASSED"
    else
        echo -e "${YELLOW}$FAILED_TESTS test(s) failed. See $LOG_FILE${NC}"
        log "VALIDATION: $FAILED_TESTS FAILURES"
    fi

    cat > "$TEST_RESULTS_DIR/summary-$TIMESTAMP.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "total": $TOTAL_TESTS,
  "passed": $PASSED_TESTS,
  "failed": $FAILED_TESTS,
  "rate": $rate,
  "log": "$LOG_FILE"
}
EOF
}

# ── Main ──────────────────────────────────────────
main() {
    log "Starting validation"

    test_infrastructure
    test_monitoring
    test_service_health
    test_gateway_features
    test_compliance
    test_performance
    test_containers

    generate_report

    log "Validation complete"

    if [ "$FAILED_TESTS" -eq 0 ]; then exit 0; else exit 1; fi
}

main "$@"
