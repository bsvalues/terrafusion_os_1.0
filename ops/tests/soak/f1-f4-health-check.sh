#!/usr/bin/env bash
#
# TerraFusion F1/F4 24h Soak Health Check
# Automated validation during staging soak period
#
# Architecture Integration:
# - Runs every 4h via cron during 24h soak window
# - Feeds results into AI Swarm monitoring (swarm-master-control.js)
# - Aligns with CAMA migration GO/NO-GO checkpoint cadence
#
# Usage:
#   bash ops/tests/soak/f1-f4-health-check.sh [--namespace terrafusion-staging]
#
# Cron Schedule (every 4 hours):
#   0 */4 * * * /path/to/f1-f4-health-check.sh >> /var/log/soak-check.log 2>&1
#
# Exit Codes:
#   0 = All health checks passed
#   1 = One or more checks failed (NO-GO signal)
#
# Author: TerraFusion Platform Team
# Last Updated: 2025-10-07

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

NAMESPACE="${1:-terrafusion-staging}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
CHECK_WINDOW="5m"  # Metric aggregation window
CHECKPOINT_FILE="/tmp/f1-f4-soak-checkpoint.json"

# Day 9 acceptance criteria (from DAY_9_F1F4_README.md)
F1_TARGET_RI=0.9500
F1_TARGET_ERROR_RATE=1.0  # percentage
F1_TARGET_P95_LATENCY=0.500  # seconds

F4_TARGET_RI=0.9300
F4_TARGET_ERROR_RATE=1.5  # percentage
F4_TARGET_P95_LATENCY=0.800  # seconds
F4_TARGET_POOL_SATURATION=85  # percentage

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] ${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] ${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
}

log_error() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] ${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
}

query_prometheus() {
    local query="$1"
    curl -s -G "${PROMETHEUS_URL}/api/v1/query" \
        --data-urlencode "query=${query}" \
        | jq -r '.data.result[0].value[1] // "null"'
}

save_checkpoint() {
    local service="$1"
    local metric="$2"
    local value="$3"
    local status="$4"
    
    # Append to checkpoint file (JSON Lines format)
    echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"service\":\"$service\",\"metric\":\"$metric\",\"value\":$value,\"status\":\"$status\"}" >> "$CHECKPOINT_FILE"
}

# =============================================================================
# Health Checks
# =============================================================================

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}TerraFusion F1/F4 Soak Health Check${NC}"
echo -e "${BLUE}$(date +'%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check 1: F1 RI
log_info "Checking F1 RI..."
F1_RI=$(query_prometheus "terrafusion:f1:ri")
if [[ "$F1_RI" != "null" ]]; then
    F1_RI_FLOAT=$(echo "$F1_RI" | awk '{printf "%.4f", $1}')
    F1_RI_MEETS_TARGET=$(echo "$F1_RI >= $F1_TARGET_RI" | bc -l)
    
    if [[ "$F1_RI_MEETS_TARGET" -eq 1 ]]; then
        log_success "F1 RI: $F1_RI_FLOAT (target: $F1_TARGET_RI) ✅"
        save_checkpoint "f1" "ri" "$F1_RI_FLOAT" "PASS"
    else
        log_error "F1 RI: $F1_RI_FLOAT (target: $F1_TARGET_RI) ❌"
        save_checkpoint "f1" "ri" "$F1_RI_FLOAT" "FAIL"
    fi
else
    log_error "F1 RI metric not available"
    save_checkpoint "f1" "ri" "null" "ERROR"
fi

# Check 2: F1 Error Rate
log_info "Checking F1 error rate..."
F1_ERROR_RATE=$(query_prometheus "terrafusion:f1:error_rate_pct")
if [[ "$F1_ERROR_RATE" != "null" ]]; then
    F1_ERROR_RATE_FLOAT=$(echo "$F1_ERROR_RATE" | awk '{printf "%.2f", $1}')
    F1_ERROR_MEETS_TARGET=$(echo "$F1_ERROR_RATE <= $F1_TARGET_ERROR_RATE" | bc -l)
    
    if [[ "$F1_ERROR_MEETS_TARGET" -eq 1 ]]; then
        log_success "F1 error rate: $F1_ERROR_RATE_FLOAT% (target: ≤$F1_TARGET_ERROR_RATE%) ✅"
        save_checkpoint "f1" "error_rate_pct" "$F1_ERROR_RATE_FLOAT" "PASS"
    else
        log_error "F1 error rate: $F1_ERROR_RATE_FLOAT% (target: ≤$F1_TARGET_ERROR_RATE%) ❌"
        save_checkpoint "f1" "error_rate_pct" "$F1_ERROR_RATE_FLOAT" "FAIL"
    fi
else
    log_error "F1 error rate metric not available"
    save_checkpoint "f1" "error_rate_pct" "null" "ERROR"
fi

# Check 3: F1 p95 Latency
log_info "Checking F1 p95 latency..."
F1_P95=$(query_prometheus "terrafusion:f1:latency_p95")
if [[ "$F1_P95" != "null" ]]; then
    F1_P95_FLOAT=$(echo "$F1_P95" | awk '{printf "%.3f", $1}')
    F1_P95_MS=$(echo "$F1_P95 * 1000" | bc -l | awk '{printf "%.0f", $1}')
    F1_P95_MEETS_TARGET=$(echo "$F1_P95 <= $F1_TARGET_P95_LATENCY" | bc -l)
    
    if [[ "$F1_P95_MEETS_TARGET" -eq 1 ]]; then
        log_success "F1 p95 latency: ${F1_P95_MS}ms (target: ≤500ms) ✅"
        save_checkpoint "f1" "latency_p95_ms" "$F1_P95_MS" "PASS"
    else
        log_error "F1 p95 latency: ${F1_P95_MS}ms (target: ≤500ms) ❌"
        save_checkpoint "f1" "latency_p95_ms" "$F1_P95_MS" "FAIL"
    fi
else
    log_error "F1 p95 latency metric not available"
    save_checkpoint "f1" "latency_p95_ms" "null" "ERROR"
fi

# Check 4: F1 Circuit Breaker State
log_info "Checking F1 circuit breaker..."
F1_CB_STATE=$(query_prometheus "terrafusion:f1:circuit_breaker_state")
if [[ "$F1_CB_STATE" != "null" ]]; then
    F1_CB_OPEN=$(echo "$F1_CB_STATE" | awk '{printf "%.0f", $1}')
    
    if [[ "$F1_CB_OPEN" -eq 0 ]]; then
        log_success "F1 circuit breaker: CLOSED ✅"
        save_checkpoint "f1" "circuit_breaker_state" "0" "PASS"
    else
        log_error "F1 circuit breaker: OPEN (unhealthy) ❌"
        save_checkpoint "f1" "circuit_breaker_state" "$F1_CB_OPEN" "FAIL"
    fi
else
    log_info "F1 circuit breaker metric not available (may not be configured)"
fi

# Check 5: F4 RI
log_info "Checking F4 RI..."
F4_RI=$(query_prometheus "terrafusion:f4:ri")
if [[ "$F4_RI" != "null" ]]; then
    F4_RI_FLOAT=$(echo "$F4_RI" | awk '{printf "%.4f", $1}')
    F4_RI_MEETS_TARGET=$(echo "$F4_RI >= $F4_TARGET_RI" | bc -l)
    
    if [[ "$F4_RI_MEETS_TARGET" -eq 1 ]]; then
        log_success "F4 RI: $F4_RI_FLOAT (target: $F4_TARGET_RI) ✅"
        save_checkpoint "f4" "ri" "$F4_RI_FLOAT" "PASS"
    else
        log_error "F4 RI: $F4_RI_FLOAT (target: $F4_TARGET_RI) ❌"
        save_checkpoint "f4" "ri" "$F4_RI_FLOAT" "FAIL"
    fi
else
    log_error "F4 RI metric not available"
    save_checkpoint "f4" "ri" "null" "ERROR"
fi

# Check 6: F4 Error Rate
log_info "Checking F4 error rate..."
F4_ERROR_RATE=$(query_prometheus "terrafusion:f4:error_rate_pct")
if [[ "$F4_ERROR_RATE" != "null" ]]; then
    F4_ERROR_RATE_FLOAT=$(echo "$F4_ERROR_RATE" | awk '{printf "%.2f", $1}')
    F4_ERROR_MEETS_TARGET=$(echo "$F4_ERROR_RATE <= $F4_TARGET_ERROR_RATE" | bc -l)
    
    if [[ "$F4_ERROR_MEETS_TARGET" -eq 1 ]]; then
        log_success "F4 error rate: $F4_ERROR_RATE_FLOAT% (target: ≤$F4_TARGET_ERROR_RATE%) ✅"
        save_checkpoint "f4" "error_rate_pct" "$F4_ERROR_RATE_FLOAT" "PASS"
    else
        log_error "F4 error rate: $F4_ERROR_RATE_FLOAT% (target: ≤$F4_TARGET_ERROR_RATE%) ❌"
        save_checkpoint "f4" "error_rate_pct" "$F4_ERROR_RATE_FLOAT" "FAIL"
    fi
else
    log_error "F4 error rate metric not available"
    save_checkpoint "f4" "error_rate_pct" "null" "ERROR"
fi

# Check 7: F4 p95 Latency
log_info "Checking F4 p95 latency..."
F4_P95=$(query_prometheus "terrafusion:f4:latency_p95")
if [[ "$F4_P95" != "null" ]]; then
    F4_P95_FLOAT=$(echo "$F4_P95" | awk '{printf "%.3f", $1}')
    F4_P95_MS=$(echo "$F4_P95 * 1000" | bc -l | awk '{printf "%.0f", $1}')
    F4_P95_MEETS_TARGET=$(echo "$F4_P95 <= $F4_TARGET_P95_LATENCY" | bc -l)
    
    if [[ "$F4_P95_MEETS_TARGET" -eq 1 ]]; then
        log_success "F4 p95 latency: ${F4_P95_MS}ms (target: ≤800ms) ✅"
        save_checkpoint "f4" "latency_p95_ms" "$F4_P95_MS" "PASS"
    else
        log_error "F4 p95 latency: ${F4_P95_MS}ms (target: ≤800ms) ❌"
        save_checkpoint "f4" "latency_p95_ms" "$F4_P95_MS" "FAIL"
    fi
else
    log_error "F4 p95 latency metric not available"
    save_checkpoint "f4" "latency_p95_ms" "null" "ERROR"
fi

# Check 8: F4 Pool Saturation
log_info "Checking F4 pool saturation..."
F4_POOL_SAT=$(query_prometheus "terrafusion:f4:pool_saturation_pct")
if [[ "$F4_POOL_SAT" != "null" ]]; then
    F4_POOL_SAT_INT=$(echo "$F4_POOL_SAT" | awk '{printf "%.0f", $1}')
    F4_POOL_MEETS_TARGET=$(echo "$F4_POOL_SAT <= $F4_TARGET_POOL_SATURATION" | bc -l)
    
    if [[ "$F4_POOL_MEETS_TARGET" -eq 1 ]]; then
        log_success "F4 pool saturation: ${F4_POOL_SAT_INT}% (target: ≤$F4_TARGET_POOL_SATURATION%) ✅"
        save_checkpoint "f4" "pool_saturation_pct" "$F4_POOL_SAT_INT" "PASS"
    else
        log_error "F4 pool saturation: ${F4_POOL_SAT_INT}% (target: ≤$F4_TARGET_POOL_SATURATION%) ❌"
        save_checkpoint "f4" "pool_saturation_pct" "$F4_POOL_SAT_INT" "FAIL"
    fi
else
    log_error "F4 pool saturation metric not available"
    save_checkpoint "f4" "pool_saturation_pct" "null" "ERROR"
fi

# Check 9: F4 Data Integrity
log_info "Checking F4 data integrity..."
F4_INTEGRITY_ERRORS=$(query_prometheus "rate(f4_cache_integrity_errors_total[${CHECK_WINDOW}])")
if [[ "$F4_INTEGRITY_ERRORS" != "null" ]]; then
    F4_INTEGRITY_INT=$(echo "$F4_INTEGRITY_ERRORS" | awk '{printf "%.0f", $1}')
    
    if [[ "$F4_INTEGRITY_INT" -eq 0 ]]; then
        log_success "F4 data integrity: 0 errors ✅"
        save_checkpoint "f4" "integrity_errors" "0" "PASS"
    else
        log_error "F4 data integrity: $F4_INTEGRITY_INT errors detected ❌"
        save_checkpoint "f4" "integrity_errors" "$F4_INTEGRITY_INT" "FAIL"
        log_error "CRITICAL: Data integrity errors require immediate rollback + cache flush"
    fi
else
    log_info "F4 integrity error metric not available"
fi

# Check 10: No Critical Alerts Firing
log_info "Checking for critical alerts..."
CRITICAL_ALERTS=$(query_prometheus 'count(ALERTS{severity="critical",alertstate="firing"})')
if [[ "$CRITICAL_ALERTS" != "null" ]]; then
    CRITICAL_ALERTS_INT=$(echo "$CRITICAL_ALERTS" | awk '{printf "%.0f", $1}')
    
    if [[ "$CRITICAL_ALERTS_INT" -eq 0 ]]; then
        log_success "No critical alerts firing ✅"
        save_checkpoint "system" "critical_alerts" "0" "PASS"
    else
        log_error "$CRITICAL_ALERTS_INT critical alerts firing ❌"
        save_checkpoint "system" "critical_alerts" "$CRITICAL_ALERTS_INT" "FAIL"
    fi
else
    log_info "Alert metrics not available"
fi

# =============================================================================
# Summary & GO/NO-GO Decision
# =============================================================================

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Health Check Summary${NC}"
echo -e "${BLUE}========================================${NC}\n"
echo -e "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Failed: $CHECKS_FAILED${NC}"

# Calculate checkpoint number (0-6, every 4h over 24h)
SOAK_START_FILE="/tmp/f1-f4-soak-start-time"
if [[ -f "$SOAK_START_FILE" ]]; then
    SOAK_START=$(cat "$SOAK_START_FILE")
    NOW=$(date +%s)
    ELAPSED_HOURS=$(( ($NOW - $SOAK_START) / 3600 ))
    CHECKPOINT_NUM=$(( $ELAPSED_HOURS / 4 ))
    echo -e "\n${BLUE}Checkpoint: $CHECKPOINT_NUM/6 (T+${ELAPSED_HOURS}h)${NC}"
else
    echo -e "\n${YELLOW}⚠️  Soak start time not recorded${NC}"
    echo -e "Initialize: echo \$(date +%s) > $SOAK_START_FILE"
fi

if [[ "$CHECKS_FAILED" -eq 0 ]]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ GO: Soak check PASSED${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "\n${GREEN}Continue 24h soak. Re-check in 4 hours.${NC}"
    exit 0
else
    echo -e "\n${RED}========================================${NC}"
    echo -e "${RED}❌ NO-GO: Soak check FAILED${NC}"
    echo -e "${RED}========================================${NC}"
    echo -e "\n${RED}Review failures and consider rollback.${NC}"
    echo -e "Rollback procedures:"
    echo -e "  F1: ops/traffic/f1-retry-budget.yaml (delete VirtualService)"
    echo -e "  F4: ops/cache/f4-redis-pool.yaml (kubectl rollout undo)"
    exit 1
fi
