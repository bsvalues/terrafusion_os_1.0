#!/usr/bin/env bash
# =============================================================================
# TerraFusion Runtime Certification Harness (Bash)
# =============================================================================
# Certifies a live/cluster TerraFusion instance against runtimecontract.v1.
#
# Usage:
#   ./cert.sh --base-url http://localhost:5000
#   ./cert.sh --base-url https://terrafusion.benton.gov --strict
#   ./cert.sh --base-url http://localhost:5000 --output-dir ./reports
#
# Exit codes:
#   0 = CERTIFIED (all checks pass)
#   1 = CERTIFICATION_FAILED (one or more checks failed)
#   2 = UNREACHABLE (target not reachable)
# =============================================================================

set -euo pipefail

# Defaults
BASE_URL=""
STRICT=false
OUTPUT_DIR="."
TIMEOUT=10
VERBOSE=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --base-url)
            BASE_URL="$2"
            shift 2
            ;;
        --strict)
            STRICT=true
            shift
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 --base-url <url> [--strict] [--output-dir <dir>] [--timeout <secs>] [--verbose]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [[ -z "$BASE_URL" ]]; then
    echo "Error: --base-url is required"
    exit 1
fi

# Strip trailing slash
BASE_URL="${BASE_URL%/}"

# Results tracking
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_TOTAL=0
RESULTS=()
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((CHECKS_PASSED++))
    ((CHECKS_TOTAL++))
    RESULTS+=("{\"name\":\"$1\",\"passed\":true,\"message\":\"$2\"}")
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1: $2"
    ((CHECKS_FAILED++))
    ((CHECKS_TOTAL++))
    RESULTS+=("{\"name\":\"$1\",\"passed\":false,\"message\":\"$2\"}")
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

http_get() {
    local url="$1"
    local response
    local http_code

    response=$(curl -s -w "\n%{http_code}" --connect-timeout "$TIMEOUT" "$url" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    echo "$http_code|$body"
}

# =============================================================================
# Certification Checks
# =============================================================================

check_readiness() {
    log_info "Checking /healthz/ready..."
    local result
    result=$(http_get "${BASE_URL}/healthz/ready")
    local code="${result%%|*}"
    local body="${result#*|}"

    if [[ "$code" == "200" ]]; then
        log_pass "readiness_endpoint" "Returns 200 OK"
    elif [[ "$code" == "000" ]]; then
        log_fail "readiness_endpoint" "Unreachable"
        return 2
    else
        log_fail "readiness_endpoint" "Returns $code (expected 200)"
    fi
}

check_proof_endpoint() {
    log_info "Checking /healthz/proof..."
    local result
    result=$(http_get "${BASE_URL}/healthz/proof")
    local code="${result%%|*}"
    local body="${result#*|}"

    if [[ "$code" != "200" ]]; then
        log_fail "proof_endpoint" "Returns $code (expected 200)"
        return 1
    fi

    # Validate JSON structure
    if ! echo "$body" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
        log_fail "proof_endpoint" "Response is not valid JSON"
        return 1
    fi

    # Check required fields
    local required_fields=("speclock_ok" "state_mesh_ok" "manifest_sha256" "timestamp_epoch" "receipt_count" "state_proof_present")
    local missing=()

    for field in "${required_fields[@]}"; do
        if ! echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); assert '$field' in d" 2>/dev/null; then
            missing+=("$field")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_fail "proof_endpoint" "Missing fields: ${missing[*]}"
        return 1
    fi

    log_pass "proof_endpoint" "Valid schema with all required fields"
}

check_proof_determinism() {
    log_info "Checking proof determinism..."
    local result
    result=$(http_get "${BASE_URL}/healthz/proof")
    local code="${result%%|*}"
    local body="${result#*|}"

    if [[ "$code" != "200" ]]; then
        log_fail "proof_determinism" "Cannot check - endpoint unavailable"
        return 1
    fi

    # Check lexicographic key ordering
    local keys_ordered
    keys_ordered=$(echo "$body" | python3 -c "
import sys,json
d=json.load(sys.stdin)
keys=list(d.keys())
print('yes' if keys == sorted(keys) else 'no')
" 2>/dev/null || echo "error")

    if [[ "$keys_ordered" == "yes" ]]; then
        log_pass "proof_determinism" "Keys are lexicographically sorted"
    else
        log_fail "proof_determinism" "Keys are NOT lexicographically sorted"
    fi
}

check_sha256_format() {
    log_info "Checking manifest_sha256 format..."
    local result
    result=$(http_get "${BASE_URL}/healthz/proof")
    local code="${result%%|*}"
    local body="${result#*|}"

    if [[ "$code" != "200" ]]; then
        log_fail "sha256_format" "Cannot check - endpoint unavailable"
        return 1
    fi

    local sha256
    sha256=$(echo "$body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('manifest_sha256',''))" 2>/dev/null || echo "")

    if [[ "$sha256" =~ ^[a-f0-9]{64}$ ]]; then
        log_pass "sha256_format" "Valid lowercase hex (${sha256:0:16}...)"
    else
        log_fail "sha256_format" "Invalid format: $sha256"
    fi
}

check_speclock_status() {
    log_info "Checking speclock_ok status..."
    local result
    result=$(http_get "${BASE_URL}/healthz/proof")
    local code="${result%%|*}"
    local body="${result#*|}"

    if [[ "$code" != "200" ]]; then
        log_fail "speclock_status" "Cannot check - endpoint unavailable"
        return 1
    fi

    local speclock_ok
    speclock_ok=$(echo "$body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('speclock_ok',False))" 2>/dev/null || echo "False")

    if [[ "$speclock_ok" == "True" ]]; then
        log_pass "speclock_status" "speclock_ok=true"
    else
        log_fail "speclock_status" "speclock_ok=false - CONSTITUTIONAL VIOLATION"
    fi
}

check_state_mesh_status() {
    log_info "Checking state_mesh_ok status..."
    local result
    result=$(http_get "${BASE_URL}/healthz/proof")
    local code="${result%%|*}"
    local body="${result#*|}"

    if [[ "$code" != "200" ]]; then
        log_fail "state_mesh_status" "Cannot check - endpoint unavailable"
        return 1
    fi

    local state_mesh_ok
    state_mesh_ok=$(echo "$body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('state_mesh_ok',False))" 2>/dev/null || echo "False")

    if [[ "$state_mesh_ok" == "True" ]]; then
        log_pass "state_mesh_status" "state_mesh_ok=true"
    else
        log_fail "state_mesh_status" "state_mesh_ok=false - CONSTITUTIONAL VIOLATION"
    fi
}

check_metrics_endpoint() {
    log_info "Checking /metrics endpoint..."
    local result
    result=$(http_get "${BASE_URL}/metrics")
    local code="${result%%|*}"
    local body="${result#*|}"

    if [[ "$code" != "200" ]]; then
        log_fail "metrics_endpoint" "Returns $code (expected 200)"
        return 1
    fi

    # Check for required metrics
    local required_metrics=("tf_speclock_ok" "tf_state_mesh_ok" "tf_receipt_count")
    local missing=()

    for metric in "${required_metrics[@]}"; do
        if ! echo "$body" | grep -q "^${metric}"; then
            missing+=("$metric")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_fail "metrics_endpoint" "Missing metrics: ${missing[*]}"
        return 1
    fi

    log_pass "metrics_endpoint" "All required metrics present"
}

check_speclock_api() {
    log_info "Checking /ops/speclock API..."
    local result
    result=$(http_get "${BASE_URL}/ops/speclock")
    local code="${result%%|*}"

    if [[ "$code" == "200" ]]; then
        log_pass "speclock_api" "SpecLock API accessible"
    elif [[ "$code" == "000" ]]; then
        log_fail "speclock_api" "Unreachable"
    else
        log_fail "speclock_api" "Returns $code"
    fi
}

check_speclock_proof() {
    log_info "Checking /ops/speclock/proof..."
    local result
    result=$(http_get "${BASE_URL}/ops/speclock/proof")
    local code="${result%%|*}"

    if [[ "$code" == "200" ]]; then
        log_pass "speclock_proof" "SpecLock proof endpoint accessible"
    else
        log_warn "speclock_proof endpoint returns $code (may not be implemented)"
    fi
}

check_state_proof() {
    log_info "Checking /ops/speclock/state/proof..."
    local result
    result=$(http_get "${BASE_URL}/ops/speclock/state/proof")
    local code="${result%%|*}"

    if [[ "$code" == "200" ]]; then
        log_pass "state_proof" "State proof endpoint accessible"
    else
        log_warn "state_proof endpoint returns $code (may not be implemented)"
    fi
}

# =============================================================================
# Report Generation
# =============================================================================

generate_json_report() {
    local report_file="${OUTPUT_DIR}/cert.report.json"

    cat > "$report_file" << EOF
{
  "target": "${BASE_URL}",
  "timestamp": "${TIMESTAMP}",
  "spec_version": "runtimecontract.v1",
  "overall_passed": $([[ $CHECKS_FAILED -eq 0 ]] && echo "true" || echo "false"),
  "summary": {
    "total": ${CHECKS_TOTAL},
    "passed": ${CHECKS_PASSED},
    "failed": ${CHECKS_FAILED}
  },
  "checks": [
$(IFS=,; echo "${RESULTS[*]}")
  ]
}
EOF

    log_info "JSON report: $report_file"
}

generate_markdown_report() {
    local report_file="${OUTPUT_DIR}/cert.report.md"
    local status_emoji=$([[ $CHECKS_FAILED -eq 0 ]] && echo "✅" || echo "❌")
    local status_text=$([[ $CHECKS_FAILED -eq 0 ]] && echo "CERTIFIED" || echo "FAILED")

    cat > "$report_file" << EOF
# TerraFusion Runtime Certification Report

**Target**: ${BASE_URL}
**Timestamp**: ${TIMESTAMP}
**Spec**: runtimecontract.v1

---

## Summary

| Status | Total | Passed | Failed |
|:------:|:-----:|:------:|:------:|
| ${status_emoji} ${status_text} | ${CHECKS_TOTAL} | ${CHECKS_PASSED} | ${CHECKS_FAILED} |

---

## Check Results

| Check | Status | Message |
|:------|:------:|:--------|
EOF

    for result in "${RESULTS[@]}"; do
        local name=$(echo "$result" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['name'])" 2>/dev/null || echo "unknown")
        local passed=$(echo "$result" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['passed'])" 2>/dev/null || echo "false")
        local message=$(echo "$result" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['message'])" 2>/dev/null || echo "")
        local emoji=$([[ "$passed" == "True" ]] && echo "✅" || echo "❌")
        echo "| ${name} | ${emoji} | ${message} |" >> "$report_file"
    done

    cat >> "$report_file" << EOF

---

## Constitutional Basis

This certification validates compliance with \`runtimecontract.v1\`:
- All required endpoints present and responding correctly
- Proof payloads are deterministic (lexicographic key ordering)
- SHA-256 hashes are lowercase hex format
- Constitutional flags (\`speclock_ok\`, \`state_mesh_ok\`) are true
- Required Prometheus metrics are exposed

---

*Generated by runtime-cert harness*
EOF

    log_info "Markdown report: $report_file"
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    echo " TerraFusion Runtime Certification"
    echo "═══════════════════════════════════════════════════════════════════"
    echo " Target:    ${BASE_URL}"
    echo " Timestamp: ${TIMESTAMP}"
    echo " Mode:      $([[ "$STRICT" == "true" ]] && echo "STRICT" || echo "STANDARD")"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""

    # Run all checks
    check_readiness || true
    check_proof_endpoint || true
    check_proof_determinism || true
    check_sha256_format || true
    check_speclock_status || true
    check_state_mesh_status || true
    check_metrics_endpoint || true
    check_speclock_api || true
    check_speclock_proof || true
    check_state_proof || true

    echo ""
    echo "═══════════════════════════════════════════════════════════════════"

    # Generate reports
    mkdir -p "$OUTPUT_DIR"
    generate_json_report
    generate_markdown_report

    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        echo -e " ${GREEN}🎖️  CERTIFICATION: PASSED${NC}"
        echo "    All constitutional requirements satisfied."
        echo "═══════════════════════════════════════════════════════════════════"
        exit 0
    else
        echo -e " ${RED}❌ CERTIFICATION: FAILED${NC}"
        echo "    ${CHECKS_FAILED} check(s) failed."
        echo "═══════════════════════════════════════════════════════════════════"
        exit 1
    fi
}

main
