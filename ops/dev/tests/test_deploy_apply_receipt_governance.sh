#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Deploy Apply + Receipt Constitution v1.0.0 — Governance Test Suite
# Reference: DEPLOY_APPLY_RECEIPT_CONSTITUTION_v1.0.0_SPECLOCK.md
# ═══════════════════════════════════════════════════════════════════════════
set -uo pipefail
# Note: set -e omitted to allow test functions to capture exit codes

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TF="$ROOT/ops/dev/tf.sh"

# Test counters
PASS=0
FAIL=0
TOTAL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test temp directory
TEST_TMP=""

setup() {
    TEST_TMP=$(mktemp -d)
    # Create a valid bundle structure for testing
    mkdir -p "$TEST_TMP/valid_bundle/proofs"
    
    # Create minimal valid proofs
    local ts
    ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    for proof in gate agent deploy marketplace; do
        cat > "$TEST_TMP/valid_bundle/proofs/$proof.json" << EOF
{
  "version": "1.0.0",
  "timestamp": "$ts",
  "status": "pass",
  "source": "$proof",
  "summary": {},
  "subsystem": "$proof",
  "checks": []
}
EOF
    done
    
    # Create manifest
    cat > "$TEST_TMP/valid_bundle/manifest.json" << EOF
{
  "bundle_id": "test-bundle-$(date +%s)",
  "created_at": "$ts",
  "mode": "dev",
  "overall_status": "pass",
  "proofs": {
    "gate": {"file": "proofs/gate.json", "status": "pass"},
    "agent": {"file": "proofs/agent.json", "status": "pass"},
    "deploy": {"file": "proofs/deploy.json", "status": "pass"},
    "marketplace": {"file": "proofs/marketplace.json", "status": "pass"}
  },
  "schema_version": "1.0.0"
}
EOF
    
    # Create bundle_meta
    cat > "$TEST_TMP/valid_bundle/bundle_meta.json" << EOF
{
  "generated_at": "$ts",
  "hostname": "test",
  "tf_sha": "abc123",
  "tf_version": "1.0.0"
}
EOF
    
    # Create checksums
    (cd "$TEST_TMP/valid_bundle" && sha256sum manifest.json proofs/*.json 2>/dev/null | sort -k2) > "$TEST_TMP/valid_bundle/checksums.sha256"
}

cleanup() {
    [[ -n "$TEST_TMP" ]] && rm -rf "$TEST_TMP"
}

trap cleanup EXIT

test_result() {
    local name="$1" passed="$2" details="${3:-}"
    ((TOTAL++))
    if [[ "$passed" == "true" ]]; then
        ((PASS++))
        echo -e "  [$name] ${GREEN}✓ PASS${NC}"
    else
        ((FAIL++))
        echo -e "  [$name] ${RED}✗ FAIL${NC}"
        [[ -n "$details" ]] && echo -e "     ${YELLOW}$details${NC}"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# INVOCATION VALIDITY TESTS (Exit 2)
# ═══════════════════════════════════════════════════════════════════════════

test_A1_missing_env() {
    local rc=0
    bash "$TF" deploy apply --bundle "$TEST_TMP/valid_bundle" --ci 2>/dev/null && rc=0 || rc=$?
    test_result "A1" "$([[ $rc -eq 2 ]] && echo true || echo false)" "Expected exit 2, got $rc"
}

test_A2_missing_bundle() {
    local rc=0
    bash "$TF" deploy apply --env dev --ci 2>/dev/null && rc=0 || rc=$?
    test_result "A2" "$([[ $rc -eq 2 ]] && echo true || echo false)" "Expected exit 2, got $rc"
}

test_A3_invalid_env() {
    local rc=0
    bash "$TF" deploy apply --env invalid --bundle "$TEST_TMP/valid_bundle" --ci 2>/dev/null && rc=0 || rc=$?
    test_result "A3" "$([[ $rc -eq 2 ]] && echo true || echo false)" "Expected exit 2, got $rc"
}

test_A4_invalid_flag_combo() {
    local rc=0 output
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --ci --unknown-flag 2>&1) && rc=0 || rc=$?
    local has_error_code=false
    if echo "$output" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'error' in d else 1)" 2>/dev/null; then
        has_error_code=true
    fi
    test_result "A4" "$([[ $rc -eq 2 ]] && [[ "$has_error_code" == "true" ]] && echo true || echo false)" "Exit=$rc, has_error=$has_error_code"
}

# ═══════════════════════════════════════════════════════════════════════════
# VERIFY-FIRST + SIDE EFFECTS TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_B1_tampered_bundle_no_receipt() {
    # Create tampered bundle (corrupt checksum)
    mkdir -p "$TEST_TMP/tampered_bundle/proofs"
    cp -r "$TEST_TMP/valid_bundle/"* "$TEST_TMP/tampered_bundle/"
    echo "corrupted" > "$TEST_TMP/tampered_bundle/manifest.json"
    
    local rc=0
    bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/tampered_bundle" --ci 2>/dev/null && rc=0 || rc=$?
    
    local receipt_exists=false
    [[ -f "$TEST_TMP/tampered_bundle/proofs/deploy_receipt.json" ]] && receipt_exists=true
    
    test_result "B1" "$([[ $rc -eq 1 ]] && [[ "$receipt_exists" == "false" ]] && echo true || echo false)" "Exit=$rc, receipt_exists=$receipt_exists"
}

test_B2_missing_bundle_path() {
    local rc=0
    bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/nonexistent" --ci 2>/dev/null && rc=0 || rc=$?
    test_result "B2" "$([[ $rc -eq 2 ]] || [[ $rc -eq 1 ]] && echo true || echo false)" "Expected exit 1 or 2, got $rc"
}

test_B3_verify_called() {
    # Verify that apply calls verify internally (behavioral guard)
    # We test this by using a valid bundle and checking the flow
    local output
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --dry-run 2>&1) && true
    
    # If apply works with valid bundle, verify must have been called
    # Check receipt shows verify step passed
    local verify_called=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
steps = {s['name']: s for s in d.get('steps', [])}
if 'verify' in steps and steps['verify']['status'] == 'pass':
    exit(0)
exit(1)
" 2>/dev/null; then
            verify_called=true
        fi
    fi
    test_result "B3" "$verify_called" "verify step not found or not pass in receipt"
}

# ═══════════════════════════════════════════════════════════════════════════
# DRY-RUN BEHAVIOR TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_C1_dryrun_exit_0_receipt_written() {
    # Clean any existing receipt
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local rc=0
    bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --dry-run --ci 2>/dev/null && rc=0 || rc=$?
    
    local receipt_exists=false
    [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]] && receipt_exists=true
    
    test_result "C1" "$([[ $rc -eq 0 ]] && [[ "$receipt_exists" == "true" ]] && echo true || echo false)" "Exit=$rc, receipt_exists=$receipt_exists"
}

test_C2_dryrun_action_and_status() {
    local valid=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
if d.get('action') == 'dry_run' and d.get('status') == 'dry_run':
    exit(0)
exit(1)
" 2>/dev/null; then
            valid=true
        fi
    fi
    test_result "C2" "$valid" "action or status not dry_run"
}

test_C3_dryrun_execute_skip() {
    local valid=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
steps = {s['name']: s for s in d.get('steps', [])}
if 'execute' in steps and steps['execute']['status'] == 'skip':
    exit(0)
exit(1)
" 2>/dev/null; then
            valid=true
        fi
    fi
    test_result "C3" "$valid" "execute step not skip"
}

# ═══════════════════════════════════════════════════════════════════════════
# RECEIPT VALIDITY TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_D1_receipt_valid_json() {
    local valid=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -m json.tool "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" >/dev/null 2>&1; then
            valid=true
        fi
    fi
    test_result "D1" "$valid" "Receipt not valid JSON"
}

test_D2_receipt_required_fields() {
    local valid=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
required = ['version', 'timestamp', 'environment', 'mode', 'bundle', 'git', 'action', 'status', 'steps']
missing = [f for f in required if f not in d]
exit(0 if not missing else 1)
" 2>/dev/null; then
            valid=true
        fi
    fi
    test_result "D2" "$valid" "Missing required fields"
}

test_D3_receipt_steps_complete() {
    local valid=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
step_names = {s['name'] for s in d.get('steps', [])}
required_steps = {'verify', 'preflight', 'execute', 'health'}
exit(0 if required_steps <= step_names else 1)
" 2>/dev/null; then
            valid=true
        fi
    fi
    test_result "D3" "$valid" "Missing required steps"
}

test_D4_receipt_bundle_verified() {
    local valid=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
exit(0 if d.get('bundle', {}).get('verified') == True else 1)
" 2>/dev/null; then
            valid=true
        fi
    fi
    test_result "D4" "$valid" "bundle.verified not true"
}

# ═══════════════════════════════════════════════════════════════════════════
# CI JSON PURITY TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_E1_apply_ci_valid_json() {
    local output rc=0
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --ci 2>&1) && rc=0 || rc=$?
    
    local valid_json=false
    if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
        valid_json=true
    fi
    test_result "E1" "$valid_json" "apply --ci output not valid JSON"
}

test_E2_receipt_ci_valid_json() {
    local output rc=0
    output=$(bash "$TF" deploy receipt --bundle "$TEST_TMP/valid_bundle" --ci 2>&1) && rc=0 || rc=$?
    
    local valid_json=false
    if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
        valid_json=true
    fi
    test_result "E2" "$valid_json" "receipt --ci output not valid JSON"
}

test_E3_no_ansi_in_ci() {
    local output
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --ci 2>&1) && true
    
    local has_ansi=false
    if echo "$output" | grep -q $'\033'; then
        has_ansi=true
    fi
    test_result "E3" "$([[ "$has_ansi" == "false" ]] && echo true || echo false)" "ANSI codes found in CI output"
}

# ═══════════════════════════════════════════════════════════════════════════
# MODE HANDLING TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_F1_unsupported_mode_exit_2() {
    # In v1.0.0, all modes are unsupported for actual execution
    # But apply still runs for governance (execute=skip)
    # This test verifies the behavior documented in SpecLock
    
    # For v1.0.0, apply should succeed (exit 0) with execute=skip
    # NOT exit 2, because governance checks pass
    local rc=0
    bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --ci 2>/dev/null && rc=0 || rc=$?
    
    # v1.0.0 should exit 0 (governance-only mode)
    test_result "F1" "$([[ $rc -eq 0 ]] && echo true || echo false)" "Expected exit 0 (governance mode), got $rc"
}

test_F2_mode_in_receipt() {
    local valid=false
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -c "
import json
d = json.load(open('$TEST_TMP/valid_bundle/proofs/deploy_receipt.json'))
mode = d.get('mode', '')
exit(0 if mode in ['k8s', 'compose', 'unknown'] else 1)
" 2>/dev/null; then
            valid=true
        fi
    fi
    test_result "F2" "$valid" "mode not valid value"
}

# ═══════════════════════════════════════════════════════════════════════════
# IDEMPOTENCY TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_G1_receipt_read_only() {
    # Receipt command should read existing receipt, not regenerate
    local before_content after_content
    
    if [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]]; then
        before_content=$(cat "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json")
        sleep 1  # Ensure timestamp would differ if regenerated
        bash "$TF" deploy receipt --bundle "$TEST_TMP/valid_bundle" --ci >/dev/null 2>&1 || true
        after_content=$(cat "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json")
        
        test_result "G1" "$([[ "$before_content" == "$after_content" ]] && echo true || echo false)" "Receipt was modified"
    else
        test_result "G1" "false" "No receipt file to test"
    fi
}

test_G2_receipt_missing_exits_1() {
    mkdir -p "$TEST_TMP/no_receipt_bundle/proofs"
    local rc=0
    bash "$TF" deploy receipt --bundle "$TEST_TMP/no_receipt_bundle" --ci 2>/dev/null && rc=0 || rc=$?
    test_result "G2" "$([[ $rc -eq 1 ]] && echo true || echo false)" "Expected exit 1, got $rc"
}

# ═══════════════════════════════════════════════════════════════════════════
# BREAKER SECURITY TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_H1_path_traversal_blocked() {
    local rc=0
    bash "$TF" deploy apply --env dev --bundle "../../../etc" --ci 2>/dev/null && rc=0 || rc=$?
    test_result "H1" "$([[ $rc -eq 2 ]] || [[ $rc -eq 1 ]] && echo true || echo false)" "Path traversal not blocked (exit $rc)"
}

test_H2_newline_injection_sanitized() {
    local output rc=0
    # Test with newline in path (should be sanitized in JSON output)
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/valid_bundle"$'\n'"injection" --ci 2>&1) && rc=0 || rc=$?
    
    local has_raw_newline=false
    # Check if the JSON output itself has the raw newline (not escaped)
    if echo "$output" | grep -q $'injection'; then
        has_raw_newline=true
    fi
    test_result "H2" "$([[ "$has_raw_newline" == "false" ]] || [[ $rc -eq 2 ]] && echo true || echo false)" "Newline injection not handled"
}

test_H3_precreated_invalid_receipt() {
    # Create bundle with pre-existing invalid receipt
    mkdir -p "$TEST_TMP/invalid_receipt_bundle/proofs"
    cp -r "$TEST_TMP/valid_bundle/"* "$TEST_TMP/invalid_receipt_bundle/"
    echo "not json" > "$TEST_TMP/invalid_receipt_bundle/proofs/deploy_receipt.json"
    
    # Regenerate checksums to make bundle valid
    (cd "$TEST_TMP/invalid_receipt_bundle" && sha256sum manifest.json proofs/gate.json proofs/agent.json proofs/deploy.json proofs/marketplace.json 2>/dev/null | sort -k2) > "$TEST_TMP/invalid_receipt_bundle/checksums.sha256"
    
    # Apply should overwrite with valid receipt
    local rc=0
    bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/invalid_receipt_bundle" --ci 2>/dev/null && rc=0 || rc=$?
    
    local valid_receipt=false
    if [[ -f "$TEST_TMP/invalid_receipt_bundle/proofs/deploy_receipt.json" ]]; then
        if python3 -m json.tool "$TEST_TMP/invalid_receipt_bundle/proofs/deploy_receipt.json" >/dev/null 2>&1; then
            valid_receipt=true
        fi
    fi
    test_result "H3" "$valid_receipt" "Invalid receipt not overwritten"
}

test_H4_symlink_attack() {
    # Create symlink pointing to /etc
    mkdir -p "$TEST_TMP/symlink_test"
    ln -sf /etc "$TEST_TMP/symlink_test/bundle"
    
    local rc=0
    bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/symlink_test/bundle" --ci 2>/dev/null && rc=0 || rc=$?
    
    # Should fail (exit 1) because symlinked dir won't have valid bundle structure
    test_result "H4" "$([[ $rc -eq 1 ]] && echo true || echo false)" "Symlink attack not blocked (exit $rc)"
}

test_H5_verify_always_called() {
    # Create a fresh bundle, then tamper it after creation
    mkdir -p "$TEST_TMP/tamper_bundle/proofs"
    
    # Create fresh bundle (not copying from valid_bundle which may have receipt)
    local ts
    ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    for proof in gate agent deploy marketplace; do
        cat > "$TEST_TMP/tamper_bundle/proofs/$proof.json" << EOF
{"version":"1.0.0","timestamp":"$ts","status":"pass","source":"$proof","summary":{},"subsystem":"$proof","checks":[]}
EOF
    done
    cat > "$TEST_TMP/tamper_bundle/manifest.json" << EOF
{"bundle_id":"tamper-test","created_at":"$ts","mode":"dev","overall_status":"pass","schema_version":"1.0.0"}
EOF
    (cd "$TEST_TMP/tamper_bundle" && sha256sum manifest.json proofs/*.json 2>/dev/null | sort -k2) > "$TEST_TMP/tamper_bundle/checksums.sha256"
    
    # Now tamper the manifest (checksum will fail)
    echo "tampered" >> "$TEST_TMP/tamper_bundle/manifest.json"
    
    local rc=0
    bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/tamper_bundle" --ci 2>/dev/null && rc=0 || rc=$?
    
    # Should fail AND receipt should NOT exist (fresh bundle, no pre-existing receipt)
    local receipt_exists=false
    [[ -f "$TEST_TMP/tamper_bundle/proofs/deploy_receipt.json" ]] && receipt_exists=true
    
    test_result "H5" "$([[ $rc -eq 1 ]] && [[ "$receipt_exists" == "false" ]] && echo true || echo false)" "Verify bypass possible (rc=$rc, receipt=$receipt_exists)"
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

main() {
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "  Deploy Apply + Receipt Constitution v1.0.0 — Governance Test Suite"
    echo "  Reference: DEPLOY_APPLY_RECEIPT_CONSTITUTION_v1.0.0_SPECLOCK.md"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""
    
    setup
    
    echo "A. Invocation Validity (Exit 2):"
    test_A1_missing_env
    test_A2_missing_bundle
    test_A3_invalid_env
    test_A4_invalid_flag_combo
    
    echo ""
    echo "B. Verify-First + Side Effects:"
    test_B1_tampered_bundle_no_receipt
    test_B2_missing_bundle_path
    test_B3_verify_called
    
    echo ""
    echo "C. Dry-Run Behavior:"
    test_C1_dryrun_exit_0_receipt_written
    test_C2_dryrun_action_and_status
    test_C3_dryrun_execute_skip
    
    echo ""
    echo "D. Receipt Validity:"
    test_D1_receipt_valid_json
    test_D2_receipt_required_fields
    test_D3_receipt_steps_complete
    test_D4_receipt_bundle_verified
    
    echo ""
    echo "E. CI JSON Purity:"
    test_E1_apply_ci_valid_json
    test_E2_receipt_ci_valid_json
    test_E3_no_ansi_in_ci
    
    echo ""
    echo "F. Mode Handling:"
    test_F1_unsupported_mode_exit_2
    test_F2_mode_in_receipt
    
    echo ""
    echo "G. Idempotency:"
    test_G1_receipt_read_only
    test_G2_receipt_missing_exits_1
    
    echo ""
    echo "H. Breaker Security:"
    test_H1_path_traversal_blocked
    test_H2_newline_injection_sanitized
    test_H3_precreated_invalid_receipt
    test_H4_symlink_attack
    test_H5_verify_always_called
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════"
    if [[ $FAIL -eq 0 ]]; then
        echo -e "  ${GREEN}✓ All tests passed ($PASS/$TOTAL)${NC}"
    else
        echo -e "  ${RED}✗ Tests failed: $FAIL/$TOTAL${NC}"
        echo -e "  ${GREEN}✓ Passed: $PASS${NC}"
    fi
    echo "═══════════════════════════════════════════════════════════════════════════"
    
    [[ $FAIL -eq 0 ]] && return 0 || return 1
}

main "$@"
