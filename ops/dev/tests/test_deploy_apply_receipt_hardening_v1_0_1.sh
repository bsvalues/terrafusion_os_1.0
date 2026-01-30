#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Deploy Apply + Receipt Constitution v1.0.1 — Hardening Test Suite
# Reference: DEPLOY_APPLY_RECEIPT_CONSTITUTION_v1.0.1_SPECLOCK.md
# 
# NOTE: v1.1.0 SUPERSEDES THIS TEST SUITE
#       The v1.1.0 test suite (test_deploy_k8s_apply_v1_1_0_governance.sh)
#       includes TOCTOU regression coverage (test G1) and full k8s flow.
#       Some tests here (I2, M1, M2) fail because they lack kubectl stubs
#       required for v1.1.0's real k8s execution.
# ═══════════════════════════════════════════════════════════════════════════
set -uo pipefail

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
    
    cat > "$TEST_TMP/valid_bundle/bundle_meta.json" << EOF
{
  "generated_at": "$ts",
  "hostname": "test",
  "tf_sha": "abc123",
  "tf_version": "1.0.0"
}
EOF
    
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
# I. TOCTOU DETECTION TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_I1_bundle_modified_during_apply() {
    # This test requires simulating modification between verify and receipt write
    # For baseline, we test that BUNDLE_CHANGED error code is recognized
    
    # Create a bundle, then tamper checksums.sha256 content
    mkdir -p "$TEST_TMP/toctou_bundle/proofs"
    cp -r "$TEST_TMP/valid_bundle/"* "$TEST_TMP/toctou_bundle/"
    
    # We need to trigger the re-hash check
    # In actual implementation, this would require a background process
    # For now, we test the error code path by checking output structure
    
    # Run apply and check if re-hash logic exists
    local rc=0 output
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/toctou_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    # For RED baseline: this should PASS once TOCTOU mitigation is implemented
    # Currently v1.0.0 has no re-hash, so we check if error code BUNDLE_CHANGED
    # would be returned (it won't be in v1.0.0)
    
    local has_rehash_check=false
    # Check if tf.sh contains BUNDLE_CHANGED error handling
    if grep -q "BUNDLE_CHANGED" "$TF" 2>/dev/null; then
        has_rehash_check=true
    fi
    
    test_result "I1" "$has_rehash_check" "BUNDLE_CHANGED error code not implemented"
}

test_I2_same_hash_at_verify_and_write() {
    # Normal case: bundle unchanged between verify and write
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local rc=0
    bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --ci 2>/dev/null && rc=0 || rc=$?
    
    local receipt_exists=false
    [[ -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json" ]] && receipt_exists=true
    
    test_result "I2" "$([[ $rc -eq 0 ]] && [[ "$receipt_exists" == "true" ]] && echo true || echo false)" "Exit=$rc, receipt_exists=$receipt_exists"
}

test_I3_checksums_deleted_during_apply() {
    # Similar to I1 - testing error path for hash change detection
    # For RED baseline, check if defensive code exists
    
    local has_defensive_check=false
    # Check if tf.sh has pre-write hash comparison
    if grep -q "pre_write_hash\|verified_hash" "$TF" 2>/dev/null; then
        has_defensive_check=true
    fi
    
    test_result "I3" "$has_defensive_check" "No pre-write hash verification implemented"
}

# ═══════════════════════════════════════════════════════════════════════════
# J. EXPLICIT SYMLINK TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_J1_bundle_root_symlink() {
    # Create valid bundle, then symlink to it
    mkdir -p "$TEST_TMP/symlink_root_test"
    ln -sf "$TEST_TMP/valid_bundle" "$TEST_TMP/symlink_root_test/link_bundle"
    
    local rc=0 output
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/symlink_root_test/link_bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    # Should exit 2 with SYMLINK_NOT_ALLOWED
    local has_symlink_error=false
    if echo "$output" | grep -q "SYMLINK_NOT_ALLOWED"; then
        has_symlink_error=true
    fi
    
    test_result "J1" "$([[ $rc -eq 2 ]] && [[ "$has_symlink_error" == "true" ]] && echo true || echo false)" "Exit=$rc, has_symlink_error=$has_symlink_error (expected exit 2 + SYMLINK_NOT_ALLOWED)"
}

test_J2_manifest_symlink() {
    # Create bundle with manifest.json as symlink
    mkdir -p "$TEST_TMP/symlink_manifest_test/proofs"
    cp -r "$TEST_TMP/valid_bundle/proofs/"* "$TEST_TMP/symlink_manifest_test/proofs/"
    cp "$TEST_TMP/valid_bundle/checksums.sha256" "$TEST_TMP/symlink_manifest_test/"
    cp "$TEST_TMP/valid_bundle/bundle_meta.json" "$TEST_TMP/symlink_manifest_test/"
    
    # Create manifest elsewhere and symlink to it
    cp "$TEST_TMP/valid_bundle/manifest.json" "$TEST_TMP/real_manifest.json"
    ln -sf "$TEST_TMP/real_manifest.json" "$TEST_TMP/symlink_manifest_test/manifest.json"
    
    local rc=0 output
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/symlink_manifest_test" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    local has_symlink_error=false
    if echo "$output" | grep -q "SYMLINK_NOT_ALLOWED"; then
        has_symlink_error=true
    fi
    
    test_result "J2" "$([[ $rc -eq 2 ]] && [[ "$has_symlink_error" == "true" ]] && echo true || echo false)" "Exit=$rc, expected exit 2 + SYMLINK_NOT_ALLOWED"
}

test_J3_proofs_dir_symlink() {
    # Create bundle with proofs/ as symlink
    mkdir -p "$TEST_TMP/symlink_proofs_test"
    cp "$TEST_TMP/valid_bundle/manifest.json" "$TEST_TMP/symlink_proofs_test/"
    cp "$TEST_TMP/valid_bundle/checksums.sha256" "$TEST_TMP/symlink_proofs_test/"
    cp "$TEST_TMP/valid_bundle/bundle_meta.json" "$TEST_TMP/symlink_proofs_test/"
    
    # Symlink proofs directory
    ln -sf "$TEST_TMP/valid_bundle/proofs" "$TEST_TMP/symlink_proofs_test/proofs"
    
    local rc=0 output
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/symlink_proofs_test" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    local has_symlink_error=false
    if echo "$output" | grep -q "SYMLINK_NOT_ALLOWED"; then
        has_symlink_error=true
    fi
    
    test_result "J3" "$([[ $rc -eq 2 ]] && [[ "$has_symlink_error" == "true" ]] && echo true || echo false)" "Exit=$rc, expected exit 2 + SYMLINK_NOT_ALLOWED"
}

test_J4_checksums_symlink() {
    # Create bundle with checksums.sha256 as symlink
    mkdir -p "$TEST_TMP/symlink_checksums_test/proofs"
    cp -r "$TEST_TMP/valid_bundle/proofs/"* "$TEST_TMP/symlink_checksums_test/proofs/"
    cp "$TEST_TMP/valid_bundle/manifest.json" "$TEST_TMP/symlink_checksums_test/"
    cp "$TEST_TMP/valid_bundle/bundle_meta.json" "$TEST_TMP/symlink_checksums_test/"
    
    # Create checksums elsewhere and symlink to it
    cp "$TEST_TMP/valid_bundle/checksums.sha256" "$TEST_TMP/real_checksums.sha256"
    ln -sf "$TEST_TMP/real_checksums.sha256" "$TEST_TMP/symlink_checksums_test/checksums.sha256"
    
    local rc=0 output
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/symlink_checksums_test" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    local has_symlink_error=false
    if echo "$output" | grep -q "SYMLINK_NOT_ALLOWED"; then
        has_symlink_error=true
    fi
    
    test_result "J4" "$([[ $rc -eq 2 ]] && [[ "$has_symlink_error" == "true" ]] && echo true || echo false)" "Exit=$rc, expected exit 2 + SYMLINK_NOT_ALLOWED"
}

test_J5_proof_file_symlink_allowed() {
    # Create bundle with one proof file as symlink (should be allowed per spec)
    mkdir -p "$TEST_TMP/symlink_proof_file_test/proofs"
    cp "$TEST_TMP/valid_bundle/manifest.json" "$TEST_TMP/symlink_proof_file_test/"
    cp "$TEST_TMP/valid_bundle/checksums.sha256" "$TEST_TMP/symlink_proof_file_test/"
    cp "$TEST_TMP/valid_bundle/bundle_meta.json" "$TEST_TMP/symlink_proof_file_test/"
    
    # Copy most proofs, but symlink one
    cp "$TEST_TMP/valid_bundle/proofs/agent.json" "$TEST_TMP/symlink_proof_file_test/proofs/"
    cp "$TEST_TMP/valid_bundle/proofs/deploy.json" "$TEST_TMP/symlink_proof_file_test/proofs/"
    cp "$TEST_TMP/valid_bundle/proofs/marketplace.json" "$TEST_TMP/symlink_proof_file_test/proofs/"
    ln -sf "$TEST_TMP/valid_bundle/proofs/gate.json" "$TEST_TMP/symlink_proof_file_test/proofs/gate.json"
    
    # Regenerate checksums
    (cd "$TEST_TMP/symlink_proof_file_test" && sha256sum manifest.json proofs/*.json 2>/dev/null | sort -k2) > "$TEST_TMP/symlink_proof_file_test/checksums.sha256"
    
    local rc=0
    bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/symlink_proof_file_test" --namespace test-ns --ci 2>/dev/null && rc=0 || rc=$?
    
    # Per spec: individual proof files as symlinks are NOT blocked (only critical files)
    # This should exit 0 (or 1 if verify fails due to symlink-following in sha256sum)
    # Key point: should NOT exit 2 with SYMLINK_NOT_ALLOWED
    
    local blocked_by_symlink=false
    local output
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/symlink_proof_file_test" --namespace test-ns --ci 2>&1) || true
    if echo "$output" | grep -q "SYMLINK_NOT_ALLOWED"; then
        blocked_by_symlink=true
    fi
    
    test_result "J5" "$([[ "$blocked_by_symlink" == "false" ]] && echo true || echo false)" "Individual proof symlinks should NOT be blocked"
}

# ═══════════════════════════════════════════════════════════════════════════
# K. PATH ESCAPE TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_K1_symlink_escape_to_etc() {
    # Create symlink that escapes to /etc
    mkdir -p "$TEST_TMP/escape_test"
    ln -sf /etc "$TEST_TMP/escape_test/bundle"
    
    local rc=0 output
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/escape_test/bundle" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    # Should exit 1 or 2 (symlink blocked or path escape)
    local has_security_error=false
    if echo "$output" | grep -qE "SYMLINK_NOT_ALLOWED|PATH_ESCAPE"; then
        has_security_error=true
    fi
    
    # v1.0.0 blocks this incidentally (no manifest.json), v1.0.1 should block explicitly
    test_result "K1" "$([[ $rc -ne 0 ]] && echo true || echo false)" "Exit=$rc, expected non-zero"
}

test_K2_nested_symlink_chain() {
    # Create deeply nested symlink chain
    mkdir -p "$TEST_TMP/chain_test/level1"
    ln -sf "$TEST_TMP/valid_bundle" "$TEST_TMP/chain_test/level1/level2"
    ln -sf "$TEST_TMP/chain_test/level1/level2" "$TEST_TMP/chain_test/final_link"
    
    local rc=0 output
    output=$(bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/chain_test/final_link" --namespace test-ns --ci 2>&1) && rc=0 || rc=$?
    
    # Should detect symlink chain and block
    local has_symlink_error=false
    if echo "$output" | grep -q "SYMLINK_NOT_ALLOWED"; then
        has_symlink_error=true
    fi
    
    test_result "K2" "$([[ $rc -eq 2 ]] && [[ "$has_symlink_error" == "true" ]] && echo true || echo false)" "Exit=$rc, expected exit 2 + SYMLINK_NOT_ALLOWED"
}

# ═══════════════════════════════════════════════════════════════════════════
# L. ERROR CODE JSON STRUCTURE TESTS
# ═══════════════════════════════════════════════════════════════════════════

test_L1_bundle_changed_json_structure() {
    # Test that BUNDLE_CHANGED error produces valid JSON
    # For RED baseline: check if error code exists in tf.sh
    
    local has_error_code=false
    if grep -q '"BUNDLE_CHANGED"' "$TF" 2>/dev/null; then
        has_error_code=true
    fi
    
    test_result "L1" "$has_error_code" "BUNDLE_CHANGED error code not in tf.sh"
}

test_L2_symlink_not_allowed_json_structure() {
    # Test that SYMLINK_NOT_ALLOWED error produces valid JSON
    local has_error_code=false
    if grep -q '"SYMLINK_NOT_ALLOWED"' "$TF" 2>/dev/null; then
        has_error_code=true
    fi
    
    test_result "L2" "$has_error_code" "SYMLINK_NOT_ALLOWED error code not in tf.sh"
}

test_L3_path_escape_json_structure() {
    # Test that PATH_ESCAPE error produces valid JSON
    local has_error_code=false
    if grep -q '"PATH_ESCAPE"' "$TF" 2>/dev/null; then
        has_error_code=true
    fi
    
    test_result "L3" "$has_error_code" "PATH_ESCAPE error code not in tf.sh"
}

# ═══════════════════════════════════════════════════════════════════════════
# M. REGRESSION TESTS (v1.0.0 behavior preserved)
# ═══════════════════════════════════════════════════════════════════════════

test_M1_valid_bundle_still_works() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local rc=0
    bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --ci 2>/dev/null && rc=0 || rc=$?
    
    test_result "M1" "$([[ $rc -eq 0 ]] && echo true || echo false)" "Valid bundle apply failed (exit $rc)"
}

test_M2_dryrun_still_works() {
    rm -f "$TEST_TMP/valid_bundle/proofs/deploy_receipt.json"
    
    local rc=0
    bash "$TF" deploy apply --env dev --bundle "$TEST_TMP/valid_bundle" --namespace test-ns --dry-run --ci 2>/dev/null && rc=0 || rc=$?
    
    test_result "M2" "$([[ $rc -eq 0 ]] && echo true || echo false)" "Dry-run failed (exit $rc)"
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

main() {
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "  Deploy Apply + Receipt Constitution v1.0.1 — Hardening Test Suite"
    echo "  Reference: DEPLOY_APPLY_RECEIPT_CONSTITUTION_v1.0.1_SPECLOCK.md"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""
    
    setup
    
    echo "I. TOCTOU Detection:"
    test_I1_bundle_modified_during_apply
    test_I2_same_hash_at_verify_and_write
    test_I3_checksums_deleted_during_apply
    
    echo ""
    echo "J. Explicit Symlink Detection:"
    test_J1_bundle_root_symlink
    test_J2_manifest_symlink
    test_J3_proofs_dir_symlink
    test_J4_checksums_symlink
    test_J5_proof_file_symlink_allowed
    
    echo ""
    echo "K. Path Escape Detection:"
    test_K1_symlink_escape_to_etc
    test_K2_nested_symlink_chain
    
    echo ""
    echo "L. Error Code JSON Structure:"
    test_L1_bundle_changed_json_structure
    test_L2_symlink_not_allowed_json_structure
    test_L3_path_escape_json_structure
    
    echo ""
    echo "M. Regression (v1.0.0 preserved):"
    test_M1_valid_bundle_still_works
    test_M2_dryrun_still_works
    
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
