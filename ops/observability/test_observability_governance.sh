#!/usr/bin/env bash
#===============================================================================
# Observability Governance Tests
#
# RED PHASE: These tests define expected behavior for tf observe commands.
# They MUST FAIL until Phase 3 (Builder) implements the commands.
#
# Run: ./test_observability_governance.sh
# Exit: 0 = all tests pass, 1 = any test fails
#
# Constitution: OBSERVABILITY_RUNTIME_CONSTITUTION_v1.0.0_SPECLOCK.md
#===============================================================================

set -euo pipefail

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
TF_CLI="${REPO_ROOT}/ops/dev/tf.sh"

# JSON validation helper (uses jq if available, falls back to python3)
json_validate() {
    if command -v jq &>/dev/null; then
        jq . 2>/dev/null
    else
        python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null
    fi
}

json_query() {
    local query="$1"
    if command -v jq &>/dev/null; then
        jq -e "$query" 2>/dev/null
    else
        python3 -c "import sys,json; d=json.load(sys.stdin); print(eval('d$query'.replace('.','[\"').replace('[\"','[\\'').replace(']',']').replace('[\\'','[\\\"').replace(']','\\\"]\\'')))" 2>/dev/null || return 1
    fi
}

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Colors (disabled in CI)
if [[ "${CI:-false}" == "true" ]] || [[ ! -t 1 ]]; then
    RED="" GREEN="" YELLOW="" RESET="" BOLD=""
else
    RED="\033[0;31m" GREEN="\033[0;32m" YELLOW="\033[1;33m" RESET="\033[0m" BOLD="\033[1m"
fi

#-------------------------------------------------------------------------------
# Test Utilities
#-------------------------------------------------------------------------------

log_test() {
    echo -e "${BOLD}[TEST]${RESET} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${RESET} $1"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${RESET} $1"
    ((TESTS_FAILED++))
}

log_skip() {
    echo -e "${YELLOW}[SKIP]${RESET} $1"
    ((TESTS_SKIPPED++))
}

#-------------------------------------------------------------------------------
# SECTION 1: Command Existence Tests
#-------------------------------------------------------------------------------

test_observe_command_exists() {
    log_test "tf observe command exists"
    
    if "${TF_CLI}" observe --help &>/dev/null; then
        log_pass "tf observe is available"
        return 0
    else
        log_fail "tf observe command not found (RED phase expected)"
        return 1
    fi
}

test_observe_health_exists() {
    log_test "tf observe health command exists"
    
    if "${TF_CLI}" observe health --help &>/dev/null; then
        log_pass "tf observe health is available"
        return 0
    else
        log_fail "tf observe health command not found (RED phase expected)"
        return 1
    fi
}

test_observe_proofs_exists() {
    log_test "tf observe proofs command exists"
    
    if "${TF_CLI}" observe proofs --help &>/dev/null; then
        log_pass "tf observe proofs is available"
        return 0
    else
        log_fail "tf observe proofs command not found (RED phase expected)"
        return 1
    fi
}

test_observe_bundle_exists() {
    log_test "tf observe bundle command exists"
    
    if "${TF_CLI}" observe bundle --help &>/dev/null; then
        log_pass "tf observe bundle is available"
        return 0
    else
        log_fail "tf observe bundle command not found (RED phase expected)"
        return 1
    fi
}

test_observe_chain_exists() {
    log_test "tf observe chain command exists"
    
    if "${TF_CLI}" observe chain --help &>/dev/null; then
        log_pass "tf observe chain is available"
        return 0
    else
        log_fail "tf observe chain command not found (RED phase expected)"
        return 1
    fi
}

test_observe_summary_exists() {
    log_test "tf observe summary command exists"
    
    if "${TF_CLI}" observe summary --help &>/dev/null; then
        log_pass "tf observe summary is available"
        return 0
    else
        log_fail "tf observe summary command not found (RED phase expected)"
        return 1
    fi
}

#-------------------------------------------------------------------------------
# SECTION 2: JSON Output Tests (Article I, Section 1.3)
#-------------------------------------------------------------------------------

test_observe_health_json_valid() {
    log_test "tf observe health --ci emits valid JSON"
    
    local output
    if ! output=$("${TF_CLI}" observe health --ci 2>&1); then
        log_fail "Command failed to execute"
        return 1
    fi
    
    if echo "$output" | json_validate &>/dev/null; then
        log_pass "Output is valid JSON"
        return 0
    else
        log_fail "Output is not valid JSON: $output"
        return 1
    fi
}

test_observe_proofs_json_valid() {
    log_test "tf observe proofs --ci emits valid JSON"
    
    local output
    if ! output=$("${TF_CLI}" observe proofs --ci 2>&1); then
        log_fail "Command failed to execute"
        return 1
    fi
    
    if echo "$output" | json_validate &>/dev/null; then
        log_pass "Output is valid JSON"
        return 0
    else
        log_fail "Output is not valid JSON"
        return 1
    fi
}

test_observe_summary_json_valid() {
    log_test "tf observe summary --ci emits valid JSON"
    
    local output
    if ! output=$("${TF_CLI}" observe summary --ci 2>&1); then
        log_fail "Command failed to execute"
        return 1
    fi
    
    if echo "$output" | json_validate &>/dev/null; then
        log_pass "Output is valid JSON"
        return 0
    else
        log_fail "Output is not valid JSON"
        return 1
    fi
}

#-------------------------------------------------------------------------------
# SECTION 3: ANSI-Free Output Tests (Article I, Section 1.3)
#-------------------------------------------------------------------------------

test_observe_no_ansi_health() {
    log_test "tf observe health --ci has no ANSI codes"
    
    local output
    output=$("${TF_CLI}" observe health --ci 2>&1) || true
    
    # Check for ANSI escape sequences
    if echo "$output" | grep -qE $'\033\['; then
        log_fail "Output contains ANSI escape sequences"
        return 1
    else
        log_pass "Output is ANSI-free"
        return 0
    fi
}

test_observe_no_ansi_summary() {
    log_test "tf observe summary --ci has no ANSI codes"
    
    local output
    output=$("${TF_CLI}" observe summary --ci 2>&1) || true
    
    if echo "$output" | grep -qE $'\033\['; then
        log_fail "Output contains ANSI escape sequences"
        return 1
    else
        log_pass "Output is ANSI-free"
        return 0
    fi
}

#-------------------------------------------------------------------------------
# SECTION 4: Schema Compliance Tests (Article II)
#-------------------------------------------------------------------------------

test_observe_health_has_version() {
    log_test "tf observe health --ci has version field"
    
    local output
    output=$("${TF_CLI}" observe health --ci 2>&1) || true
    
    if echo "$output" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'version' in d else 1)" 2>/dev/null; then
        log_pass "version field present"
        return 0
    else
        log_fail "version field missing"
        return 1
    fi
}

test_observe_health_has_timestamp() {
    log_test "tf observe health --ci has timestamp field"
    
    local output
    output=$("${TF_CLI}" observe health --ci 2>&1) || true
    
    if echo "$output" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'timestamp' in d else 1)" 2>/dev/null; then
        log_pass "timestamp field present"
        return 0
    else
        log_fail "timestamp field missing"
        return 1
    fi
}

test_observe_health_has_status() {
    log_test "tf observe health --ci has status field"
    
    local output
    output=$("${TF_CLI}" observe health --ci 2>&1) || true
    
    if echo "$output" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'status' in d else 1)" 2>/dev/null; then
        log_pass "status field present"
        return 0
    else
        log_fail "status field missing"
        return 1
    fi
}

test_observe_health_has_components() {
    log_test "tf observe health --ci has components field"
    
    local output
    output=$("${TF_CLI}" observe health --ci 2>&1) || true
    
    if echo "$output" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'components' in d else 1)" 2>/dev/null; then
        log_pass "components field present"
        return 0
    else
        log_fail "components field missing"
        return 1
    fi
}

#-------------------------------------------------------------------------------
# SECTION 5: Exit Code Tests (Article II)
#-------------------------------------------------------------------------------

test_observe_health_exit_code_on_success() {
    log_test "tf observe health exits 0 on healthy system"
    
    if "${TF_CLI}" observe health --ci &>/dev/null; then
        log_pass "Exit code 0 on success"
        return 0
    else
        local ec=$?
        log_fail "Exit code $ec (expected 0)"
        return 1
    fi
}

test_observe_invalid_subcommand_exit_code() {
    log_test "tf observe invalid exits 2 (invalid invocation)"
    
    "${TF_CLI}" observe invalid_subcommand --ci &>/dev/null
    local ec=$?
    
    if [[ $ec -eq 2 ]]; then
        log_pass "Exit code 2 on invalid subcommand"
        return 0
    else
        log_fail "Exit code $ec (expected 2)"
        return 1
    fi
}

#-------------------------------------------------------------------------------
# SECTION 6: Security Tests (Article I, Section 1.1 - Read-Only)
#-------------------------------------------------------------------------------

test_observe_no_file_creation() {
    log_test "tf observe health does not create files"
    
    local test_dir="${REPO_ROOT}/.observe-test-$$"
    mkdir -p "$test_dir"
    local before_count=$(find "$test_dir" -type f | wc -l)
    
    cd "$test_dir"
    "${TF_CLI}" observe health --ci &>/dev/null || true
    cd - >/dev/null
    
    local after_count=$(find "$test_dir" -type f | wc -l)
    rm -rf "$test_dir"
    
    if [[ $before_count -eq $after_count ]]; then
        log_pass "No files created"
        return 0
    else
        log_fail "Files were created (before: $before_count, after: $after_count)"
        return 1
    fi
}

test_observe_no_mutation_guard() {
    log_test "tf observe commands are read-only (no mutations)"
    
    # Check that observe commands don't modify any state files
    local state_file="${REPO_ROOT}/.terrafusion-state"
    local orig_mtime=""
    
    if [[ -f "$state_file" ]]; then
        orig_mtime=$(stat -c %Y "$state_file" 2>/dev/null || stat -f %m "$state_file")
    fi
    
    "${TF_CLI}" observe health --ci &>/dev/null || true
    "${TF_CLI}" observe proofs --ci &>/dev/null || true
    "${TF_CLI}" observe summary --ci &>/dev/null || true
    
    if [[ -f "$state_file" ]]; then
        local new_mtime=$(stat -c %Y "$state_file" 2>/dev/null || stat -f %m "$state_file")
        if [[ "$orig_mtime" == "$new_mtime" ]]; then
            log_pass "State file unchanged"
            return 0
        else
            log_fail "State file was modified"
            return 1
        fi
    fi
    
    log_pass "No state file modifications detected"
    return 0
}

#-------------------------------------------------------------------------------
# SECTION 7: Bundle Path Tests (Article III, Section 3.1)
#-------------------------------------------------------------------------------

test_observe_bundle_validates_path() {
    log_test "tf observe bundle rejects non-existent path"
    
    local output ec
    output=$("${TF_CLI}" observe bundle --bundle /nonexistent/path --ci 2>&1) && ec=0 || ec=$?
    
    if [[ $ec -ne 0 ]]; then
        log_pass "Rejected non-existent path (exit $ec)"
        return 0
    else
        log_fail "Should reject non-existent path"
        return 1
    fi
}

test_observe_bundle_rejects_traversal() {
    log_test "tf observe bundle rejects path traversal"
    
    local output ec
    output=$("${TF_CLI}" observe bundle --bundle "../../../etc/passwd" --ci 2>&1) && ec=0 || ec=$?
    
    # Should fail with error, not expose sensitive paths
    if [[ $ec -ne 0 ]]; then
        log_pass "Rejected path traversal attempt"
        return 0
    else
        log_fail "Should reject path traversal"
        return 1
    fi
}

#-------------------------------------------------------------------------------
# SECTION 8: No Secrets Test (Article I, Section 1.6)
#-------------------------------------------------------------------------------

test_observe_no_secrets_in_output() {
    log_test "tf observe summary --ci contains no secrets"
    
    local output
    output=$("${TF_CLI}" observe summary --ci 2>&1) || true
    
    # Check for common secret patterns
    if echo "$output" | grep -iE 'password|secret|api[_-]?key|token|credential|private[_-]?key' &>/dev/null; then
        log_fail "Output may contain secrets"
        return 1
    else
        log_pass "No secrets detected in output"
        return 0
    fi
}

#-------------------------------------------------------------------------------
# Main Test Runner
#-------------------------------------------------------------------------------

run_all_tests() {
    echo ""
    echo "=============================================="
    echo " Observability Governance Tests"
    echo " Constitution: v1.0.0"
    echo " Phase: RED (tests expected to fail)"
    echo "=============================================="
    echo ""
    
    echo "--- Section 1: Command Existence ---"
    test_observe_command_exists || true
    test_observe_health_exists || true
    test_observe_proofs_exists || true
    test_observe_bundle_exists || true
    test_observe_chain_exists || true
    test_observe_summary_exists || true
    echo ""
    
    echo "--- Section 2: JSON Output ---"
    test_observe_health_json_valid || true
    test_observe_proofs_json_valid || true
    test_observe_summary_json_valid || true
    echo ""
    
    echo "--- Section 3: ANSI-Free Output ---"
    test_observe_no_ansi_health || true
    test_observe_no_ansi_summary || true
    echo ""
    
    echo "--- Section 4: Schema Compliance ---"
    test_observe_health_has_version || true
    test_observe_health_has_timestamp || true
    test_observe_health_has_status || true
    test_observe_health_has_components || true
    echo ""
    
    echo "--- Section 5: Exit Codes ---"
    test_observe_health_exit_code_on_success || true
    test_observe_invalid_subcommand_exit_code || true
    echo ""
    
    echo "--- Section 6: Security (Read-Only) ---"
    test_observe_no_file_creation || true
    test_observe_no_mutation_guard || true
    echo ""
    
    echo "--- Section 7: Bundle Path Validation ---"
    test_observe_bundle_validates_path || true
    test_observe_bundle_rejects_traversal || true
    echo ""
    
    echo "--- Section 8: No Secrets ---"
    test_observe_no_secrets_in_output || true
    echo ""
    
    echo "=============================================="
    echo " RESULTS"
    echo "=============================================="
    echo -e " ${GREEN}PASSED${RESET}: $TESTS_PASSED"
    echo -e " ${RED}FAILED${RESET}: $TESTS_FAILED"
    echo -e " ${YELLOW}SKIPPED${RESET}: $TESTS_SKIPPED"
    echo ""
    
    if [[ $TESTS_FAILED -gt 0 ]]; then
        echo -e " ${RED}STATUS: TESTS FAILING (RED PHASE)${RESET}"
        echo " This is expected until Phase 3 (Builder) implements tf observe"
        return 1
    else
        echo -e " ${GREEN}STATUS: ALL TESTS PASSING${RESET}"
        return 0
    fi
}

#-------------------------------------------------------------------------------
# Entrypoint
#-------------------------------------------------------------------------------

main() {
    # Ensure TF CLI exists
    if [[ ! -x "$TF_CLI" ]]; then
        echo "ERROR: tf.sh not found at $TF_CLI"
        exit 2
    fi
    
    # Ensure JSON parser is available (jq or python3)
    if ! command -v jq &>/dev/null && ! command -v python3 &>/dev/null; then
        echo "ERROR: jq or python3 is required for JSON validation"
        exit 2
    fi
    
    run_all_tests
}

main "$@"
