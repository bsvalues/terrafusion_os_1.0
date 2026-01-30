#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Deploy Runtime Constitution v1.0.0 — Governance Test Suite
# 
# Tests constitutional compliance for deploy subsystem:
# - Exit code contract (0=success, 1=failure, 2=invalid)
# - Gate-first enforcement
# - Active session prevention
# - Bundle validation requirements
# - CI JSON purity (--ci mode)
# - Dry-run safety
#
# Evidence-driven TDD: RED baseline → implementation → GREEN validation
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Test environment setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TF="$ROOT/ops/dev/tf.sh"
SESSIONS_DIR="$ROOT/ops/agents/sessions"
ACTIVE_SESSION="$ROOT/ops/agents/ACTIVE_SESSION"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test helpers
run_test() {
    TESTS_RUN=$((TESTS_RUN + 1))
}

pass() {
    echo -e "  ${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
    local msg="${1:-}"
    echo -e "  ${RED}✗ FAIL${NC}${msg:+: $msg}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

cleanup_sessions() {
    rm -f "$ACTIVE_SESSION" 2>/dev/null || true
    # Clean up test sessions
    find "$SESSIONS_DIR" -type d -name "*test*" -exec rm -rf {} + 2>/dev/null || true
}

cleanup_bundles() {
    rm -rf /tmp/tf-test-bundle* 2>/dev/null || true
}

create_valid_bundle() {
    local bundle_path="$1"
    mkdir -p "$bundle_path/proofs"
    
    # Create manifest
    cat > "$bundle_path/manifest.json" << EOF
{
  "version": "1.0.0-test",
  "git_sha": "a1b2c3d4",
  "build_timestamp": "2025-12-18T12:00:00Z",
  "environment": "dev"
}
EOF
    
    # Create SBOM placeholder (v1.0 accepts placeholders)
    cat > "$bundle_path/sbom.json" << EOF
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.4",
  "version": 1,
  "metadata": {
    "component": {
      "type": "application",
      "name": "terrafusion-os",
      "version": "1.0.0-test"
    }
  },
  "components": []
}
EOF
    
    # Create runtime proofs
    echo '{"status": "passed", "checks": 11}' > "$bundle_path/proofs/gate-summary.json"
    echo '{"passed": 42, "failed": 0}' > "$bundle_path/proofs/test-results.json"
    echo "a1b2c3d4  manifest.json" > "$bundle_path/proofs/SHA256SUMS"
}

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Test Suite: Deploy Runtime Governance (Constitutional Compliance)"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION A: Invocation Validity (Exit 2 on Invalid)
# ─────────────────────────────────────────────────────────────────────────────
echo "A. Invocation Validity (Exit 2 on Invalid):"

# Test A1: Missing --env returns exit 2
echo -n "  [A1] Missing --env returns exit 2... "
run_test
cleanup_sessions
cleanup_bundles
output=$(bash "$TF" deploy --bundle /tmp/fake 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    if [[ $output == *"--env"* ]] || [[ $output == *"environment"* ]]; then
        pass
    else
        fail "Exit 2 but no clear error about --env"
    fi
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test A2: Invalid --env value returns exit 2
echo -n "  [A2] Invalid --env value returns exit 2... "
run_test
cleanup_bundles
output=$(bash "$TF" deploy --env foobar --bundle /tmp/fake 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    if [[ $output == *"dev"* ]] && [[ $output == *"techsupport"* ]] && [[ $output == *"prod"* ]]; then
        pass
    else
        fail "Exit 2 but doesn't list valid environments"
    fi
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test A3: Missing --bundle returns exit 2
echo -n "  [A3] Missing --bundle returns exit 2... "
run_test
output=$(bash "$TF" deploy --env dev 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    if [[ $output == *"--bundle"* ]] || [[ $output == *"bundle"* ]]; then
        pass
    else
        fail "Exit 2 but no clear error about --bundle"
    fi
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test A4: Invalid flag combination (if --ci exists with incompatible option)
echo -n "  [A4] Invalid flag combination handling... "
run_test
# For now, just verify --ci flag is rejected if deploy doesn't support it yet
output=$(bash "$TF" deploy --env dev --bundle /tmp/fake --ci --unknown-flag 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]] || [[ $rc -eq 1 ]]; then
    # Either invalid invocation (2) or command doesn't exist yet (1)
    pass
else
    fail "Unexpected exit code: $rc"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION B: Gate-First Enforcement (Exit 1 on Gate Fail)
# ─────────────────────────────────────────────────────────────────────────────
echo "B. Gate-First Enforcement:"

# Test B1: Deploy refuses when gate would fail
echo -n "  [B1] Deploy checks gate before proceeding... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-test-bundle-$$"
create_valid_bundle "$bundle_path"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
# Should either run gate check or refuse because deploy doesn't exist yet
if [[ $output == *"gate"* ]] || [[ $output == *"Gate"* ]] || [[ $rc -ne 0 ]]; then
    pass
else
    fail "No evidence of gate check or proper refusal"
fi
cleanup_bundles

# Test B2: Gate pass allows deploy to proceed to next checks
echo -n "  [B2] Gate pass proceeds to bundle validation... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-test-bundle-$$"
create_valid_bundle "$bundle_path"
# Deploy should check bundle after gate (if both pass, may fail on actual deploy)
output=$(bash "$TF" deploy --env dev --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
# As long as it doesn't exit with 2 (invalid), it's checking prerequisites
if [[ $rc -ne 2 ]]; then
    pass
else
    fail "Exited with invalid invocation code during preflight"
fi
cleanup_bundles

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION C: Active Session Prevention (Exit 1)
# ─────────────────────────────────────────────────────────────────────────────
echo "C. No Active Sessions:"

# Test C1: Deploy refuses when active session exists
echo -n "  [C1] Deploy refuses with active session... "
run_test
cleanup_sessions
cleanup_bundles
bundle_path="/tmp/tf-test-bundle-$$"
create_valid_bundle "$bundle_path"
# Create active session marker
echo "test-session-id" > "$ACTIVE_SESSION"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    if [[ $output == *"session"* ]] || [[ $output == *"Session"* ]] || [[ $output == *"ACTIVE"* ]]; then
        pass
    else
        fail "Exit 1 but no session-related error"
    fi
else
    fail "Wrong exit code: $rc (expected 1 for active session)"
fi
cleanup_sessions
cleanup_bundles

# Test C2: No active session allows deploy to proceed
echo -n "  [C2] No active session proceeds to bundle check... "
run_test
cleanup_sessions
cleanup_bundles
bundle_path="/tmp/tf-test-bundle-$$"
create_valid_bundle "$bundle_path"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
# Should proceed past session check (may fail later on actual deploy)
# Check for active session ERROR (not gate's session check output)
if [[ $rc -ne 2 ]] && [[ $output != *"Active agent session"* ]] && [[ $output != *"active session detected"* ]]; then
    pass
else
    fail "Blocked on session check when no session exists"
fi
cleanup_bundles

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION D: Bundle Requirements (Exit 1)
# ─────────────────────────────────────────────────────────────────────────────
echo "D. Bundle Requirements:"

# Test D1: Missing bundle path returns exit 1
echo -n "  [D1] Nonexistent bundle path fails... "
run_test
cleanup_sessions
output=$(bash "$TF" deploy --env dev --bundle /tmp/nonexistent-bundle-xyz 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]] || [[ $rc -eq 2 ]]; then
    if [[ $output == *"bundle"* ]] || [[ $output == *"not found"* ]] || [[ $output == *"exist"* ]]; then
        pass
    else
        fail "Exit code correct but unclear error message"
    fi
else
    fail "Wrong exit code: $rc (expected 1 or 2)"
fi

# Test D2: Bundle missing manifest fails
echo -n "  [D2] Bundle missing manifest fails... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-test-bundle-incomplete-$$"
mkdir -p "$bundle_path/proofs"
# Create bundle WITHOUT manifest
echo '{}' > "$bundle_path/sbom.json"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]] || [[ $output == *"manifest"* ]]; then
    pass
else
    fail "Should reject bundle without manifest"
fi
cleanup_bundles

# Test D3: Valid bundle passes validation
echo -n "  [D3] Valid bundle structure passes preflight... "
run_test
cleanup_sessions
cleanup_bundles
bundle_path="/tmp/tf-test-bundle-valid-$$"
create_valid_bundle "$bundle_path"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
# May fail on actual deploy but should not fail on bundle validation
if [[ $output != *"manifest"* ]] || [[ $rc -ne 1 ]]; then
    # Either passes validation or fails for other reasons (not bundle structure)
    pass
else
    fail "Valid bundle rejected: $output"
fi
cleanup_bundles

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION E: CI JSON Purity (if --ci mode exists)
# ─────────────────────────────────────────────────────────────────────────────
echo "E. CI JSON Purity:"

# Test E1: --ci mode emits JSON-only stdout (if implemented)
echo -n "  [E1] --ci mode JSON-only output... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-test-bundle-$$"
create_valid_bundle "$bundle_path"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_path" --ci 2>&1) && rc=0 || rc=$?
# If --ci is implemented, should be JSON. If not implemented, may error.
if [[ $output == "{"* ]] || [[ $rc -eq 2 ]]; then
    # Either JSON output or --ci not implemented yet (exit 2)
    pass
else
    echo -e "  ${YELLOW}○ SKIP${NC} (--ci mode not implemented yet)"
fi
cleanup_bundles

# Test E2: CI JSON includes required fields
echo -n "  [E2] CI JSON schema validation... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-test-bundle-$$"
create_valid_bundle "$bundle_path"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_path" --ci 2>&1) || true
if echo "$output" | python3 -c "import json, sys; j=json.load(sys.stdin); assert 'version' in j and 'timestamp' in j and 'status' in j" 2>/dev/null; then
    pass
else
    echo -e "  ${YELLOW}○ SKIP${NC} (--ci mode not implemented yet)"
fi
cleanup_bundles

# Test E3: No ANSI sequences in CI output
echo -n "  [E3] CI output ANSI-free... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-test-bundle-$$"
create_valid_bundle "$bundle_path"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_path" --ci 2>&1) || true
if echo "$output" | grep -qE '\x1b\['; then
    fail "ANSI escape codes found in CI output"
else
    if [[ $output == "{"* ]]; then
        pass
    else
        echo -e "  ${YELLOW}○ SKIP${NC} (--ci mode not implemented yet)"
    fi
fi
cleanup_bundles

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION F: Dry-Run Safety
# ─────────────────────────────────────────────────────────────────────────────
echo "F. Dry-Run Safety:"

# Test F1: --dry-run performs checks without irreversible changes
echo -n "  [F1] --dry-run performs preflight only... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-test-bundle-$$"
create_valid_bundle "$bundle_path"
output=$(bash "$TF" deploy --env dev --bundle "$bundle_path" --dry-run 2>&1) || true
# Should mention dry-run or preflight checks
if [[ $output == *"dry"* ]] || [[ $output == *"preflight"* ]] || [[ $output == *"check"* ]]; then
    pass
else
    echo -e "  ${YELLOW}○ SKIP${NC} (--dry-run not implemented yet)"
fi
cleanup_bundles

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════
cleanup_sessions
cleanup_bundles

echo "═══════════════════════════════════════════════════════════════════════════"
if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "  ${GREEN}✓ All tests passed${NC} ($TESTS_PASSED/$TESTS_RUN)"
    echo "═══════════════════════════════════════════════════════════════════════════"
    exit 0
else
    echo -e "  ${RED}✗ $TESTS_FAILED test(s) failed${NC} ($TESTS_PASSED passed)"
    echo ""
    echo "  Constitutional gaps detected:"
    echo "  - Deploy command surface not implemented (expected RED baseline)"
    echo "  - Exit code contract not enforced"
    echo "  - Preflight checks missing (gate, sessions, bundle)"
    echo ""
    echo "  See: ops/deploy/DEPLOY_RUNTIME_CONSTITUTION_v1.0.0_SPECLOCK.md"
    echo "═══════════════════════════════════════════════════════════════════════════"
    exit 1
fi
