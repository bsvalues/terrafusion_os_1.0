#!/usr/bin/env bash
# ==============================================================================
# RuntimeCert Bundle Governance Test Suite
# Reference: ops/runtimecert/RUNTIMECERT_BUNDLE_CONSTITUTION_v1.0.0_SPECLOCK.md
# ==============================================================================

set -euo pipefail

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TF="$ROOT/ops/dev/tf.sh"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test bundle directory (cleaned up after each test)
TEST_BUNDLE_DIR="/tmp/tf-runtimecert-test-$$"

# ==============================================================================
# Helpers
# ==============================================================================

pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "✓ PASS"
}

fail() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "✗ FAIL: $1"
}

run_test() {
    TESTS_RUN=$((TESTS_RUN + 1))
}

cleanup_bundle() {
    rm -rf "$TEST_BUNDLE_DIR" 2>/dev/null || true
    rm -rf /tmp/tf-runtimecert-test-* 2>/dev/null || true
}

# Create a valid bundle for testing
create_valid_bundle() {
    local bundle_dir="${1:-$TEST_BUNDLE_DIR}"
    mkdir -p "$bundle_dir/proofs"
    
    # manifest.json
    cat > "$bundle_dir/manifest.json" << 'EOF'
{
  "bundle_id": "test-bundle-001",
  "created_at": "2025-12-18T21:00:00Z",
  "mode": "dev",
  "overall_status": "pass",
  "proofs": {
    "agent": { "file": "proofs/agent.json", "status": "pass" },
    "deploy": { "file": "proofs/deploy.json", "status": "pass" },
    "gate": { "file": "proofs/gate.json", "status": "pass" },
    "marketplace": { "file": "proofs/marketplace.json", "status": "pass" }
  },
  "sbom_included": false,
  "schema_version": "1.0.0"
}
EOF

    # proofs/gate.json
    cat > "$bundle_dir/proofs/gate.json" << 'EOF'
{
  "checks": [],
  "source": "gate",
  "status": "pass",
  "summary": { "failed": 0, "passed": 11, "skipped": 0, "total": 11, "warnings": 0 },
  "timestamp": "2025-12-18T21:00:00Z",
  "version": "1.0.0"
}
EOF

    # proofs/agent.json
    cat > "$bundle_dir/proofs/agent.json" << 'EOF'
{
  "source": "agent",
  "status": "pass",
  "summary": { "active_sessions": 0, "missing_artifacts": [], "stale_sessions": 0 },
  "timestamp": "2025-12-18T21:00:00Z",
  "version": "1.0.0"
}
EOF

    # proofs/deploy.json
    cat > "$bundle_dir/proofs/deploy.json" << 'EOF'
{
  "source": "deploy",
  "status": "pass",
  "summary": { "environments_configured": ["dev", "techsupport", "prod"], "gate_enforcement": true, "promotion_chain_valid": true },
  "timestamp": "2025-12-18T21:00:00Z",
  "version": "1.0.0"
}
EOF

    # proofs/marketplace.json
    cat > "$bundle_dir/proofs/marketplace.json" << 'EOF'
{
  "source": "marketplace",
  "status": "pass",
  "summary": { "plugins_enabled": 0, "plugins_installed": 0, "quarantined": 0, "registry_valid": true },
  "timestamp": "2025-12-18T21:00:00Z",
  "version": "1.0.0"
}
EOF

    # bundle_meta.json
    cat > "$bundle_dir/bundle_meta.json" << 'EOF'
{
  "generated_at": "2025-12-18T21:00:00Z",
  "hostname": "test-host",
  "tf_sha": "abc123",
  "tf_version": "1.0.0"
}
EOF

    # checksums.sha256 (computed from actual files)
    (
        cd "$bundle_dir"
        sha256sum manifest.json proofs/agent.json proofs/deploy.json proofs/gate.json proofs/marketplace.json 2>/dev/null | sort -k2
    ) > "$bundle_dir/checksums.sha256"
}

# ==============================================================================
# Test Banner
# ==============================================================================

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  RuntimeCert Bundle Governance Test Suite"
echo "  Reference: RUNTIMECERT_BUNDLE_CONSTITUTION_v1.0.0_SPECLOCK.md"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ==============================================================================
# A. INVOCATION VALIDITY (Exit 2 on Invalid)
# ==============================================================================
echo "A. Invocation Validity (Exit 2 on Invalid):"

# Test R.A1: Missing --out on bundle
echo -n "  [R.A1] Missing --out on bundle returns exit 2... "
run_test
cleanup_bundle
output=$(bash "$TF" release bundle 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test R.A2: Missing --bundle on verify
echo -n "  [R.A2] Missing --bundle on verify returns exit 2... "
run_test
cleanup_bundle
output=$(bash "$TF" release verify 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test R.A3: Unknown flags on bundle
echo -n "  [R.A3] Unknown flags on bundle returns exit 2... "
run_test
cleanup_bundle
output=$(bash "$TF" release bundle --out /tmp/test --unknown-flag 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test R.A4: Unknown flags on verify
echo -n "  [R.A4] Unknown flags on verify returns exit 2... "
run_test
cleanup_bundle
output=$(bash "$TF" release verify --bundle /tmp/test --unknown-flag 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test R.A5: Invalid mode on bundle
echo -n "  [R.A5] Invalid --mode on bundle returns exit 2... "
run_test
cleanup_bundle
output=$(bash "$TF" release bundle --out /tmp/test --mode invalid 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

echo ""

# ==============================================================================
# B. BUNDLE STRUCTURE + CONTENT
# ==============================================================================
echo "B. Bundle Structure + Content:"

# Test R.B1: Bundle creates manifest.json
echo -n "  [R.B1] bundle creates manifest.json... "
run_test
cleanup_bundle
output=$(bash "$TF" release bundle --out "$TEST_BUNDLE_DIR" --force 2>&1) && rc=0 || rc=$?
if [[ -f "$TEST_BUNDLE_DIR/manifest.json" ]]; then
    pass
else
    fail "manifest.json not created (rc=$rc)"
fi

# Test R.B2: Bundle creates proofs/ directory
echo -n "  [R.B2] bundle creates proofs/ directory... "
run_test
# Reuse previous bundle or create new
if [[ ! -d "$TEST_BUNDLE_DIR/proofs" ]]; then
    cleanup_bundle
    bash "$TF" release bundle --out "$TEST_BUNDLE_DIR" --force >/dev/null 2>&1 || true
fi
if [[ -d "$TEST_BUNDLE_DIR/proofs" ]]; then
    pass
else
    fail "proofs/ directory not created"
fi

# Test R.B3: Bundle creates checksums.sha256
echo -n "  [R.B3] bundle creates checksums.sha256... "
run_test
if [[ -f "$TEST_BUNDLE_DIR/checksums.sha256" ]]; then
    pass
else
    fail "checksums.sha256 not created"
fi

# Test R.B4: Bundle creates all 4 proof files
echo -n "  [R.B4] bundle creates all 4 proof files... "
run_test
missing=""
for proof in gate agent deploy marketplace; do
    if [[ ! -f "$TEST_BUNDLE_DIR/proofs/$proof.json" ]]; then
        missing="$missing $proof"
    fi
done
if [[ -z "$missing" ]]; then
    pass
else
    fail "Missing proofs:$missing"
fi

# Test R.B5: verify fails if any required proof missing
echo -n "  [R.B5] verify fails if required proof missing... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
rm -f "$TEST_BUNDLE_DIR/proofs/gate.json"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

# Test R.B6: verify fails if manifest.json missing
echo -n "  [R.B6] verify fails if manifest.json missing... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
rm -f "$TEST_BUNDLE_DIR/manifest.json"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

# Test R.B7: verify fails if checksums.sha256 missing
echo -n "  [R.B7] verify fails if checksums.sha256 missing... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
rm -f "$TEST_BUNDLE_DIR/checksums.sha256"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

echo ""

# ==============================================================================
# C. CHECKSUM INTEGRITY
# ==============================================================================
echo "C. Checksum Integrity:"

# Test R.C1: verify fails on tampered proof file
echo -n "  [R.C1] verify fails on tampered proof file... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
# Tamper with gate.json
echo '{"tampered": true}' >> "$TEST_BUNDLE_DIR/proofs/gate.json"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

# Test R.C2: verify fails on tampered manifest.json
echo -n "  [R.C2] verify fails on tampered manifest.json... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
# Tamper with manifest.json
echo '{"tampered": true}' >> "$TEST_BUNDLE_DIR/manifest.json"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

# Test R.C3: verify passes on untouched bundle
echo -n "  [R.C3] verify passes on untouched bundle... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 0)"
fi

echo ""

# ==============================================================================
# D. PROOF SCHEMA VALIDATION
# ==============================================================================
echo "D. Proof Schema Validation:"

# Test R.D1: verify fails if proof JSON invalid
echo -n "  [R.D1] verify fails if proof JSON invalid... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
# Corrupt JSON
echo "not valid json {{{" > "$TEST_BUNDLE_DIR/proofs/agent.json"
# Regenerate checksums to isolate JSON validation
(cd "$TEST_BUNDLE_DIR" && sha256sum manifest.json proofs/agent.json proofs/deploy.json proofs/gate.json proofs/marketplace.json 2>/dev/null | sort -k2) > "$TEST_BUNDLE_DIR/checksums.sha256"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

# Test R.D2: verify fails if proof missing required fields
echo -n "  [R.D2] verify fails if proof missing required fields... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
# Remove required field (status)
echo '{"version": "1.0.0", "timestamp": "2025-12-18T21:00:00Z", "source": "agent", "summary": {}}' > "$TEST_BUNDLE_DIR/proofs/agent.json"
# Regenerate checksums
(cd "$TEST_BUNDLE_DIR" && sha256sum manifest.json proofs/agent.json proofs/deploy.json proofs/gate.json proofs/marketplace.json 2>/dev/null | sort -k2) > "$TEST_BUNDLE_DIR/checksums.sha256"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

# Test R.D3: verify fails if any proof status == fail
echo -n "  [R.D3] verify fails if any proof status == fail... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
# Set status to fail
cat > "$TEST_BUNDLE_DIR/proofs/gate.json" << 'EOF'
{
  "checks": [],
  "source": "gate",
  "status": "fail",
  "summary": { "failed": 1, "passed": 10, "skipped": 0, "total": 11, "warnings": 0 },
  "timestamp": "2025-12-18T21:00:00Z",
  "version": "1.0.0"
}
EOF
# Regenerate checksums
(cd "$TEST_BUNDLE_DIR" && sha256sum manifest.json proofs/agent.json proofs/deploy.json proofs/gate.json proofs/marketplace.json 2>/dev/null | sort -k2) > "$TEST_BUNDLE_DIR/checksums.sha256"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

# Test R.D4: verify fails if any proof status == error
echo -n "  [R.D4] verify fails if any proof status == error... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
# Set status to error
cat > "$TEST_BUNDLE_DIR/proofs/marketplace.json" << 'EOF'
{
  "source": "marketplace",
  "status": "error",
  "summary": { "error_message": "Registry corrupted" },
  "timestamp": "2025-12-18T21:00:00Z",
  "version": "1.0.0"
}
EOF
# Regenerate checksums
(cd "$TEST_BUNDLE_DIR" && sha256sum manifest.json proofs/agent.json proofs/deploy.json proofs/gate.json proofs/marketplace.json 2>/dev/null | sort -k2) > "$TEST_BUNDLE_DIR/checksums.sha256"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

echo ""

# ==============================================================================
# E. CI JSON PURITY
# ==============================================================================
echo "E. CI JSON Purity:"

# Test R.E1: verify --ci outputs JSON only (parseable)
echo -n "  [R.E1] verify --ci outputs JSON only (parseable)... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    pass
else
    fail "Output is not valid JSON"
fi

# Test R.E2: verify --ci has no ANSI codes
echo -n "  [R.E2] verify --ci has no ANSI codes... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | grep -qE $'\x1b\[' 2>/dev/null; then
    fail "ANSI codes found in output"
else
    pass
fi

# Test R.E3: verify --ci includes error.code on failures
echo -n "  [R.E3] verify --ci includes error.code on failures... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
rm -f "$TEST_BUNDLE_DIR/proofs/gate.json"
# Regenerate checksums without gate.json
(cd "$TEST_BUNDLE_DIR" && sha256sum manifest.json proofs/agent.json proofs/deploy.json proofs/marketplace.json 2>/dev/null | sort -k2) > "$TEST_BUNDLE_DIR/checksums.sha256"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -c "import json,sys; d=json.load(sys.stdin); exit(0 if d.get('error',{}).get('code') else 1)" 2>/dev/null; then
    pass
else
    fail "error.code not found in failure output"
fi

# Test R.E4: verify --ci has stable top-level schema
echo -n "  [R.E4] verify --ci has stable top-level schema... "
run_test
cleanup_bundle
create_valid_bundle "$TEST_BUNDLE_DIR"
output=$(bash "$TF" release verify --bundle "$TEST_BUNDLE_DIR" --ci 2>&1) && rc=0 || rc=$?
required_fields="version timestamp command status bundle_path"
all_present=true
for field in $required_fields; do
    if ! echo "$output" | python3 -c "import json,sys; d=json.load(sys.stdin); exit(0 if '$field' in d else 1)" 2>/dev/null; then
        all_present=false
        break
    fi
done
if $all_present; then
    pass
else
    fail "Missing required field in CI JSON"
fi

# Test R.E5: bundle --ci outputs JSON only
echo -n "  [R.E5] bundle --ci outputs JSON only... "
run_test
cleanup_bundle
output=$(bash "$TF" release bundle --out "$TEST_BUNDLE_DIR" --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    pass
else
    fail "Output is not valid JSON"
fi

echo ""

# ==============================================================================
# F. BUNDLE OVERWRITE PROTECTION
# ==============================================================================
echo "F. Bundle Overwrite Protection:"

# Test R.F1: bundle fails if directory exists (no --force)
echo -n "  [R.F1] bundle fails if directory exists (no --force)... "
run_test
cleanup_bundle
mkdir -p "$TEST_BUNDLE_DIR"
output=$(bash "$TF" release bundle --out "$TEST_BUNDLE_DIR" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

# Test R.F2: bundle succeeds with --force on existing directory
echo -n "  [R.F2] bundle succeeds with --force on existing directory... "
run_test
# TEST_BUNDLE_DIR still exists from previous test
output=$(bash "$TF" release bundle --out "$TEST_BUNDLE_DIR" --force 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 0)"
fi

echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
cleanup_bundle

echo "═══════════════════════════════════════════════════════════════════════════"
if [[ $TESTS_FAILED -eq 0 ]]; then
    echo "  ✓ All tests passed ($TESTS_PASSED/$TESTS_RUN)"
else
    echo "  ✗ Tests failed: $TESTS_FAILED/$TESTS_RUN"
    echo "    Passed: $TESTS_PASSED"
fi
echo "═══════════════════════════════════════════════════════════════════════════"

exit $TESTS_FAILED
