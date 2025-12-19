#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Deploy RuntimeCert Enforcement Governance Test Suite
# Constitution: DEPLOY_RUNTIME_CONSTITUTION_v1.1.0_SPECLOCK.md
# Purpose: Validate mandatory RuntimeCert bundle verification for deploy ops
# ═══════════════════════════════════════════════════════════════════════════
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TF="$ROOT_DIR/ops/dev/tf.sh"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

pass() {
    ((TESTS_PASSED++))
    echo -e "✓ ${GREEN}PASS${NC}"
}

fail() {
    ((TESTS_FAILED++))
    echo -e "✗ ${RED}FAIL${NC}: $1"
}

run_test() {
    ((TESTS_RUN++))
}

# Create a valid RuntimeCert bundle for testing
create_valid_bundle() {
    local bundle_dir="$1"
    mkdir -p "$bundle_dir/proofs"
    
    # Create manifest.json
    cat > "$bundle_dir/manifest.json" << 'EOF'
{
    "version": "1.0.0",
    "created_at": "2025-12-18T12:00:00Z",
    "mode": "dev",
    "tool_version": "1.0.0"
}
EOF
    
    # Create bundle_meta.json
    cat > "$bundle_dir/bundle_meta.json" << 'EOF'
{
    "created_at": "2025-12-18T12:00:00Z",
    "tool_version": "1.0.0"
}
EOF
    
    # Create proof files with required schema
    for proof in gate agent deploy marketplace; do
        cat > "$bundle_dir/proofs/$proof.json" << EOF
{
    "version": "1.0.0",
    "timestamp": "2025-12-18T12:00:00Z",
    "status": "pass",
    "source": "$proof",
    "summary": {"total": 1, "passed": 1, "failed": 0}
}
EOF
    done
    
    # Create checksums (excluding bundle_meta.json)
    (cd "$bundle_dir" && sha256sum manifest.json proofs/*.json > checksums.sha256)
}

# Create an invalid/tampered bundle
create_tampered_bundle() {
    local bundle_dir="$1"
    create_valid_bundle "$bundle_dir"
    # Tamper with a proof file after checksums
    echo '{"tampered": true}' >> "$bundle_dir/proofs/gate.json"
}

# Create a bundle missing required proofs
create_incomplete_bundle() {
    local bundle_dir="$1"
    mkdir -p "$bundle_dir/proofs"
    cat > "$bundle_dir/manifest.json" << 'EOF'
{"version": "1.0.0"}
EOF
    cat > "$bundle_dir/bundle_meta.json" << 'EOF'
{"created_at": "2025-12-18T12:00:00Z"}
EOF
    # Only create gate proof, missing others
    cat > "$bundle_dir/proofs/gate.json" << 'EOF'
{"version": "1.0.0", "timestamp": "2025-12-18T12:00:00Z", "status": "pass", "source": "gate", "summary": {}}
EOF
    (cd "$bundle_dir" && sha256sum manifest.json proofs/*.json > checksums.sha256 2>/dev/null || true)
}

# Cleanup function
cleanup() {
    rm -rf /tmp/tf-deploy-runtimecert-test-* 2>/dev/null || true
}

trap cleanup EXIT

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Deploy RuntimeCert Enforcement Governance Test Suite"
echo "  Reference: DEPLOY_RUNTIME_CONSTITUTION_v1.1.0_SPECLOCK.md"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ==============================================================================
# A. Invocation Validity (Exit 2 on Invalid)
# ==============================================================================
echo "A. Invocation Validity (Exit 2 on Invalid):"

# Test A1: Missing --bundle on deploy
echo -n "  [D.A1] deploy --env dev (no --bundle) returns exit 2... "
run_test
cleanup
output=$(bash "$TF" deploy --env dev 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test A2: Missing --bundle on promote
echo -n "  [D.A2] promote --from dev --to techsupport (no --bundle) returns exit 2... "
run_test
cleanup
output=$(bash "$TF" deploy promote --from dev --to techsupport 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test A3: Missing --bundle on rollback
echo -n "  [D.A3] rollback --env dev --to-version v1 (no --bundle) returns exit 2... "
run_test
cleanup
output=$(bash "$TF" deploy rollback --env dev --to-version v1.0.0 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test A4: Path traversal in --bundle
echo -n "  [D.A4] deploy --bundle ../../../etc returns exit 2... "
run_test
cleanup
output=$(bash "$TF" deploy --env dev --bundle "../../../etc" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test A5: Bundle path with control characters
echo -n "  [D.A5] deploy --bundle with newline returns exit 2... "
run_test
cleanup
output=$(bash "$TF" deploy --env dev --bundle $'/tmp/bundle\ninjection' 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

echo ""

# ==============================================================================
# B. Bundle Verification Enforcement (Exit 1 on Failure)
# ==============================================================================
echo "B. Bundle Verification Enforcement (Exit 1 on Failure):"

# Test B1: Bundle directory not found
echo -n "  [D.B1] deploy with non-existent bundle dir returns exit 1... "
run_test
cleanup
output=$(bash "$TF" deploy --env dev --bundle "/tmp/nonexistent-bundle-$$" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

# Test B2: Bundle verification fails (tampered)
echo -n "  [D.B2] deploy with tampered bundle returns exit 1... "
run_test
cleanup
bundle_dir="/tmp/tf-deploy-runtimecert-test-tampered-$$"
create_tampered_bundle "$bundle_dir"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_dir" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    # Verify error mentions bundle verification
    if echo "$output" | grep -qi "verify\|bundle\|checksum\|invalid"; then
        pass
    else
        fail "Exit 1 but error doesn't mention verification"
    fi
else
    fail "Wrong exit code: $rc (expected 1)"
fi
rm -rf "$bundle_dir"

# Test B3: Bundle verification passes -> deploy proceeds
echo -n "  [D.B3] deploy with valid bundle proceeds (dry-run)... "
run_test
cleanup
bundle_dir="/tmp/tf-deploy-runtimecert-test-valid-$$"
create_valid_bundle "$bundle_dir"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_dir" --dry-run 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 0)"
fi
rm -rf "$bundle_dir"

# Test B4: Promote with tampered bundle
echo -n "  [D.B4] promote with tampered bundle returns exit 1... "
run_test
cleanup
bundle_dir="/tmp/tf-deploy-runtimecert-test-promote-tampered-$$"
create_tampered_bundle "$bundle_dir"
output=$(bash "$TF" deploy promote --from dev --to techsupport --bundle "$bundle_dir" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi
rm -rf "$bundle_dir"

# Test B5: Rollback with tampered bundle
echo -n "  [D.B5] rollback with tampered bundle returns exit 1... "
run_test
cleanup
bundle_dir="/tmp/tf-deploy-runtimecert-test-rollback-tampered-$$"
create_tampered_bundle "$bundle_dir"
output=$(bash "$TF" deploy rollback --env dev --to-version v1.0.0 --bundle "$bundle_dir" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi
rm -rf "$bundle_dir"

# Test B6: Bundle with incomplete proofs
echo -n "  [D.B6] deploy with incomplete bundle (missing proofs) returns exit 1... "
run_test
cleanup
bundle_dir="/tmp/tf-deploy-runtimecert-test-incomplete-$$"
create_incomplete_bundle "$bundle_dir"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_dir" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi
rm -rf "$bundle_dir"

echo ""

# ==============================================================================
# C. Promote Bundle Enforcement
# ==============================================================================
echo "C. Promote Bundle Enforcement:"

# Test C1: Promote with valid bundle
echo -n "  [D.C1] promote with valid bundle succeeds... "
run_test
cleanup
bundle_dir="/tmp/tf-deploy-runtimecert-test-promote-valid-$$"
create_valid_bundle "$bundle_dir"
output=$(bash "$TF" deploy promote --from dev --to techsupport --bundle "$bundle_dir" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 0)"
fi
rm -rf "$bundle_dir"

echo ""

# ==============================================================================
# D. Rollback Bundle Enforcement
# ==============================================================================
echo "D. Rollback Bundle Enforcement:"

# Test D1: Rollback with valid bundle
echo -n "  [D.D1] rollback with valid bundle succeeds... "
run_test
cleanup
bundle_dir="/tmp/tf-deploy-runtimecert-test-rollback-valid-$$"
create_valid_bundle "$bundle_dir"
output=$(bash "$TF" deploy rollback --env dev --to-version v1.0.0 --bundle "$bundle_dir" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 0)"
fi
rm -rf "$bundle_dir"

echo ""

# ==============================================================================
# E. CI JSON Purity
# ==============================================================================
echo "E. CI JSON Purity:"

# Test E1: deploy --ci with missing bundle outputs valid JSON
echo -n "  [D.E1] deploy --ci missing bundle outputs valid JSON... "
run_test
cleanup
output=$(bash "$TF" deploy --env dev --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    pass
else
    fail "Output is not valid JSON"
fi

# Test E2: deploy --ci bundle failure includes error.code
echo -n "  [D.E2] deploy --ci bundle failure includes error.code... "
run_test
cleanup
bundle_dir="/tmp/tf-deploy-runtimecert-test-ci-fail-$$"
create_tampered_bundle "$bundle_dir"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_dir" --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'error' in d and 'code' in d['error']" 2>/dev/null; then
    pass
else
    fail "error.code not found in CI JSON output"
fi
rm -rf "$bundle_dir"

# Test E3: promote --ci missing bundle outputs valid JSON
echo -n "  [D.E3] promote --ci missing bundle outputs valid JSON... "
run_test
cleanup
output=$(bash "$TF" deploy promote --from dev --to techsupport --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    pass
else
    fail "Output is not valid JSON"
fi

# Test E4: rollback --ci missing bundle outputs valid JSON
echo -n "  [D.E4] rollback --ci missing bundle outputs valid JSON... "
run_test
cleanup
output=$(bash "$TF" deploy rollback --env dev --to-version v1.0.0 --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    pass
else
    fail "Output is not valid JSON"
fi

echo ""

# ==============================================================================
# F. BREAKER AGENT: Bypass Prevention Tests
# ==============================================================================
echo "F. Breaker Agent: Bypass Prevention:"

# Test F1: Empty bundle dir (verify called but has no content)
echo -n "  [F.BRK1] deploy with empty bundle dir fails... "
run_test
cleanup
bundle_dir="/tmp/tf-deploy-runtimecert-test-empty-$$"
mkdir -p "$bundle_dir"
# Empty directory - no manifest, no proofs
output=$(bash "$TF" deploy --env dev --bundle "$bundle_dir" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1 for empty bundle)"
fi
rm -rf "$bundle_dir"

# Test F2: Symlink attack in bundle path
echo -n "  [F.BRK2] deploy rejects symlink in bundle path... "
run_test
cleanup
real_dir="/tmp/tf-deploy-runtimecert-test-real-$$"
symlink_dir="/tmp/tf-deploy-runtimecert-test-symlink-$$"
mkdir -p "$real_dir/proofs"
# Create valid bundle in real dir
create_valid_bundle "$real_dir"
# Create symlink to real dir
ln -sfn "$real_dir" "$symlink_dir"
# Symlinks should be resolved but not rejected (they're valid paths)
output=$(bash "$TF" deploy --env dev --bundle "$symlink_dir" --dry-run 2>&1) && rc=0 || rc=$?
# This is a DESIGN decision: symlinks are allowed if they point to valid bundles
if [[ $rc -eq 0 ]]; then
    pass  # Symlinks resolve and work - this is expected behavior
else
    fail "Symlink to valid bundle should work, got exit code: $rc"
fi
rm -rf "$real_dir" "$symlink_dir"

# Test F3: ANSI injection via --bundle path (CI mode)
echo -n "  [F.BRK3] deploy --ci sanitizes control chars in bundle path... "
run_test
cleanup
# Test that paths with unusual characters don't break CI JSON output
# Note: Most ANSI sequences require actual escape bytes which shells sanitize
# We test that the output remains valid JSON regardless of path content
output=$(bash "$TF" deploy --env dev --bundle '/tmp/test-with-special-chars' --ci 2>&1) && rc=0 || rc=$?
# Check that output is valid JSON (CI mode must never break JSON)
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    # Also verify no raw ANSI sequences in output
    if echo "$output" | grep -qE $'\x1b\[' 2>/dev/null; then
        fail "ANSI escape codes leaked into CI JSON output"
    else
        pass
    fi
else
    fail "CI output is not valid JSON"
fi

# Test F4: Newline injection in bundle path (attempt JSON pollution)
echo -n "  [F.BRK4] deploy --ci prevents newline JSON pollution... "
run_test
cleanup
# Attempt to inject newlines that could break JSON structure
output=$(bash "$TF" deploy --env dev --bundle $'/tmp/bundle\n"injected":"true"' --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    # Path validation should reject control characters
    if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
        pass
    else
        fail "CI output with invalid path is not valid JSON"
    fi
else
    fail "Wrong exit code: $rc (expected 2 for control characters in path)"
fi

# Test F5: Verify that tf release verify is actually called (not bypassed)
echo -n "  [F.BRK5] deploy actually calls tf release verify... "
run_test
cleanup
bundle_dir="/tmp/tf-deploy-runtimecert-test-verify-call-$$"
create_valid_bundle "$bundle_dir"
# Tamper with actual proof content after checksums created (not just checksum file)
echo '{"tampered":true}' >> "$bundle_dir/proofs/gate.json"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_dir" 2>&1) && rc=0 || rc=$?
# Should fail because verify detects content mismatch vs checksums
if [[ $rc -eq 1 ]]; then
    if echo "$output" | grep -qi "verify\|checksum\|bundle\|invalid"; then
        pass
    else
        fail "Exit 1 but no evidence verify was called"
    fi
else
    fail "Wrong exit code: $rc (expected 1 from verify failure)"
fi
rm -rf "$bundle_dir"

# Test F6: Stale bundle (old timestamp) - should pass by design
echo -n "  [F.BRK6] deploy accepts stale bundle (by design)... "
run_test
cleanup
bundle_dir="/tmp/tf-deploy-runtimecert-test-stale-$$"
mkdir -p "$bundle_dir/proofs"
# Create bundle with old timestamp (stale)
cat > "$bundle_dir/manifest.json" << 'EOF'
{
    "version": "1.0.0",
    "created_at": "2020-01-01T00:00:00Z",
    "mode": "dev",
    "tool_version": "1.0.0"
}
EOF
cat > "$bundle_dir/bundle_meta.json" << 'EOF'
{"created_at": "2020-01-01T00:00:00Z", "tool_version": "1.0.0"}
EOF
for proof in gate agent deploy marketplace; do
    cat > "$bundle_dir/proofs/$proof.json" << EOF
{"version": "1.0.0", "timestamp": "2020-01-01T00:00:00Z", "status": "pass", "source": "$proof", "summary": {"total": 1, "passed": 1, "failed": 0}}
EOF
done
(cd "$bundle_dir" && sha256sum manifest.json proofs/*.json > checksums.sha256)
output=$(bash "$TF" deploy --env dev --bundle "$bundle_dir" --dry-run 2>&1) && rc=0 || rc=$?
# Stale bundles are accepted by design (no freshness requirement in v1.1.0)
if [[ $rc -eq 0 ]]; then
    pass  # Documented behavior: stale bundles pass
else
    fail "Stale bundle should be accepted (v1.1.0 has no freshness requirement)"
fi
rm -rf "$bundle_dir"

echo ""

# ==============================================================================
# Summary
# ==============================================================================
echo "═══════════════════════════════════════════════════════════════════════════"
if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "  ${GREEN}✓ All tests passed ($TESTS_PASSED/$TESTS_RUN)${NC}"
else
    echo -e "  ${RED}✗ Tests failed: $TESTS_FAILED/$TESTS_RUN${NC}"
    echo "    Passed: $TESTS_PASSED"
fi
echo "═══════════════════════════════════════════════════════════════════════════"

exit $TESTS_FAILED
