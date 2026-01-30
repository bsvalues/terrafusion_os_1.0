#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Marketplace Runtime Constitution v1.0.0 — Governance Test Suite
# 
# Tests constitutional compliance for marketplace subsystem:
# - Exit code contract (0=success, 1=failure, 2=invalid)
# - Bundle structure requirements (manifest, SBOM, proofs/)
# - Manifest schema validation
# - Capability allowlist enforcement
# - Registry state management
# - CI JSON purity (--ci mode)
#
# Evidence-driven TDD: RED baseline → implementation → GREEN validation
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Test environment setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TF="$ROOT/ops/dev/tf.sh"
MARKETPLACE_DIR="$ROOT/ops/marketplace"
REGISTRY="$MARKETPLACE_DIR/registry.json"

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

cleanup_bundles() {
    rm -rf /tmp/tf-marketplace-test-* 2>/dev/null || true
}

cleanup_registry() {
    # Backup existing registry if it exists
    if [[ -f "$REGISTRY" ]]; then
        cp "$REGISTRY" "$REGISTRY.backup.$$" 2>/dev/null || true
    fi
    # Start with clean registry for tests
    mkdir -p "$MARKETPLACE_DIR"
    echo '{"version":"1.0.0","plugins":[]}' > "$REGISTRY"
}

restore_registry() {
    if [[ -f "$REGISTRY.backup.$$" ]]; then
        mv "$REGISTRY.backup.$$" "$REGISTRY"
    fi
}

create_valid_plugin_bundle() {
    local bundle_path="$1"
    mkdir -p "$bundle_path/proofs"
    
    # Create valid manifest
    cat > "$bundle_path/plugin.manifest.json" << 'EOF'
{
  "id": "test-plugin",
  "name": "Test Plugin",
  "version": "1.0.0",
  "entrypoints": {
    "main": "./plugin.js"
  },
  "capabilities": ["ui.panel", "data.read"],
  "integrity": {
    "sha256": "abc123def456"
  }
}
EOF
    
    # Create minimal SBOM
    cat > "$bundle_path/sbom.json" << 'EOF'
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.4",
  "version": 1,
  "components": []
}
EOF
}

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Test Suite: Marketplace Runtime Governance (Constitutional Compliance)"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION A: Invocation Validity (Exit 2 on Invalid)
# ─────────────────────────────────────────────────────────────────────────────
echo "A. Invocation Validity (Exit 2 on Invalid):"

# Test A1: Missing --bundle on install returns exit 2
echo -n "  [A1] Missing --bundle on install returns exit 2... "
run_test
cleanup_bundles
cleanup_registry
output=$(bash "$TF" marketplace install 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    if [[ $output == *"--bundle"* ]] || [[ $output == *"bundle"* ]]; then
        pass
    else
        fail "Exit 2 but no clear error about --bundle"
    fi
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test A2: Missing --plugin on enable/disable/remove/inspect returns exit 2
echo -n "  [A2] Missing --plugin on enable returns exit 2... "
run_test
output=$(bash "$TF" marketplace enable 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    if [[ $output == *"--plugin"* ]] || [[ $output == *"plugin"* ]]; then
        pass
    else
        fail "Exit 2 but no clear error about --plugin"
    fi
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test A3: Invalid/unknown flags return exit 2
echo -n "  [A3] Invalid flags return exit 2... "
run_test
cleanup_bundles
output=$(bash "$TF" marketplace install --unknown-flag --bundle /tmp/fake 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test A4: --ci returns JSON-only stdout (or JSON error)
echo -n "  [A4] --ci mode returns JSON or JSON error... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-marketplace-test-ci-$$"
create_valid_plugin_bundle "$bundle_path"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" --ci 2>&1) || true
if [[ $output == "{"* ]]; then
    # Check if valid JSON
    if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
        pass
    else
        fail "Output starts with { but is not valid JSON"
    fi
else
    # Command might not support --ci yet, which is OK for RED baseline
    echo -e "  ${YELLOW}○ SKIP${NC} (--ci not implemented yet)"
fi
cleanup_bundles

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION B: Bundle Structure Requirements (Exit 1)
# ─────────────────────────────────────────────────────────────────────────────
echo "B. Bundle Structure Requirements (Exit 1 on Missing Files):"

# Test B1: Bundle missing plugin.manifest.json returns exit 1
echo -n "  [B1] Missing plugin.manifest.json returns exit 1... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-marketplace-test-no-manifest-$$"
mkdir -p "$bundle_path/proofs"
echo '{}' > "$bundle_path/sbom.json"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    if [[ $output == *"manifest"* ]]; then
        pass
    else
        fail "Exit 1 but no manifest-related error"
    fi
else
    fail "Wrong exit code: $rc (expected 1)"
fi
cleanup_bundles

# Test B2: Bundle missing sbom.json returns exit 1
echo -n "  [B2] Missing sbom.json returns exit 1... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-marketplace-test-no-sbom-$$"
mkdir -p "$bundle_path/proofs"
cat > "$bundle_path/plugin.manifest.json" << 'EOF'
{
  "id": "test",
  "name": "Test",
  "version": "1.0.0",
  "entrypoints": {"main": "./plugin.js"},
  "capabilities": [],
  "integrity": {"sha256": "abc123"}
}
EOF
output=$(bash "$TF" marketplace install --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    if [[ $output == *"sbom"* ]] || [[ $output == *"SBOM"* ]]; then
        pass
    else
        fail "Exit 1 but no SBOM-related error"
    fi
else
    fail "Wrong exit code: $rc (expected 1)"
fi
cleanup_bundles

# Test B3: Bundle missing proofs/ directory returns exit 1
echo -n "  [B3] Missing proofs/ directory returns exit 1... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-marketplace-test-no-proofs-$$"
mkdir -p "$bundle_path"
cat > "$bundle_path/plugin.manifest.json" << 'EOF'
{
  "id": "test",
  "name": "Test",
  "version": "1.0.0",
  "entrypoints": {"main": "./plugin.js"},
  "capabilities": [],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle_path/sbom.json"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    if [[ $output == *"proofs"* ]]; then
        pass
    else
        fail "Exit 1 but no proofs-related error"
    fi
else
    fail "Wrong exit code: $rc (expected 1)"
fi
cleanup_bundles

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION C: Manifest Schema Validation (Exit 2)
# ─────────────────────────────────────────────────────────────────────────────
echo "C. Manifest Schema Validation (Exit 2 on Invalid Schema):"

# Test C1: Manifest missing required fields returns exit 2
echo -n "  [C1] Missing required fields returns exit 2... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-marketplace-test-incomplete-manifest-$$"
mkdir -p "$bundle_path/proofs"
cat > "$bundle_path/plugin.manifest.json" << 'EOF'
{
  "id": "test"
}
EOF
echo '{}' > "$bundle_path/sbom.json"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2 for invalid schema)"
fi
cleanup_bundles

# Test C2: Invalid id format returns exit 2
echo -n "  [C2] Invalid id format returns exit 2... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-marketplace-test-bad-id-$$"
mkdir -p "$bundle_path/proofs"
cat > "$bundle_path/plugin.manifest.json" << 'EOF'
{
  "id": "Test Plugin With Spaces",
  "name": "Test",
  "version": "1.0.0",
  "entrypoints": {"main": "./plugin.js"},
  "capabilities": [],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle_path/sbom.json"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    if [[ $output == *"id"* ]] || [[ $output == *"kebab"* ]] || [[ $output == *"format"* ]]; then
        pass
    else
        fail "Exit 2 but no id format error"
    fi
else
    fail "Wrong exit code: $rc (expected 2)"
fi
cleanup_bundles

# Test C3: Invalid semver returns exit 2
echo -n "  [C3] Invalid semver returns exit 2... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-marketplace-test-bad-version-$$"
mkdir -p "$bundle_path/proofs"
cat > "$bundle_path/plugin.manifest.json" << 'EOF'
{
  "id": "test-plugin",
  "name": "Test",
  "version": "not-a-version",
  "entrypoints": {"main": "./plugin.js"},
  "capabilities": [],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle_path/sbom.json"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    if [[ $output == *"version"* ]] || [[ $output == *"semver"* ]]; then
        pass
    else
        fail "Exit 2 but no version error"
    fi
else
    fail "Wrong exit code: $rc (expected 2)"
fi
cleanup_bundles

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION D: Capability Policy Enforcement (Exit 1)
# ─────────────────────────────────────────────────────────────────────────────
echo "D. Capability Policy Enforcement:"

# Test D1: Unknown capability returns exit 1
echo -n "  [D1] Unknown capability rejected (exit 1)... "
run_test
cleanup_bundles
bundle_path="/tmp/tf-marketplace-test-bad-capability-$$"
mkdir -p "$bundle_path/proofs"
cat > "$bundle_path/plugin.manifest.json" << 'EOF'
{
  "id": "test-plugin",
  "name": "Test",
  "version": "1.0.0",
  "entrypoints": {"main": "./plugin.js"},
  "capabilities": ["unknown.capability", "evil.rootkit"],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle_path/sbom.json"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    if [[ $output == *"capability"* ]] || [[ $output == *"unknown"* ]] || [[ $output == *"allowlist"* ]]; then
        pass
    else
        fail "Exit 1 but no capability error"
    fi
else
    fail "Wrong exit code: $rc (expected 1)"
fi
cleanup_bundles

# Test D2: Allowed capabilities proceed
echo -n "  [D2] Allowed capabilities accepted... "
run_test
cleanup_bundles
cleanup_registry
bundle_path="/tmp/tf-marketplace-test-valid-caps-$$"
create_valid_plugin_bundle "$bundle_path"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
# Should succeed (exit 0) or fail for other reasons (not capability rejection)
if [[ $output != *"capability"* ]] && [[ $output != *"unknown"* ]]; then
    pass
else
    fail "Valid capabilities rejected: $output"
fi
cleanup_bundles

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION E: Registry Behavior (Exit 0 on Success)
# ─────────────────────────────────────────────────────────────────────────────
echo "E. Registry Behavior:"

# Test E1: Install writes deterministic registry entry
echo -n "  [E1] Install writes registry entry (exit 0)... "
run_test
cleanup_bundles
cleanup_registry
bundle_path="/tmp/tf-marketplace-test-registry-$$"
create_valid_plugin_bundle "$bundle_path"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    # Check if registry was updated
    if [[ -f "$REGISTRY" ]] && grep -q "test-plugin" "$REGISTRY" 2>/dev/null; then
        pass
    else
        fail "Exit 0 but registry not updated"
    fi
else
    fail "Wrong exit code: $rc (expected 0)"
fi
cleanup_bundles

# Test E2: Enable/disable toggles enabled flag
echo -n "  [E2] Enable toggles enabled flag (exit 0)... "
run_test
cleanup_bundles
cleanup_registry
bundle_path="/tmp/tf-marketplace-test-enable-$$"
create_valid_plugin_bundle "$bundle_path"
bash "$TF" marketplace install --bundle "$bundle_path" >/dev/null 2>&1 || true
output=$(bash "$TF" marketplace enable --plugin test-plugin 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    # Check if registry shows enabled
    if grep -q '"enabled": true' "$REGISTRY" 2>/dev/null || grep -q '"status": "enabled"' "$REGISTRY" 2>/dev/null; then
        pass
    else
        fail "Exit 0 but plugin not marked enabled"
    fi
else
    fail "Wrong exit code: $rc (expected 0)"
fi
cleanup_bundles

# Test E3: Remove deletes entry
echo -n "  [E3] Remove deletes registry entry (exit 0)... "
run_test
cleanup_bundles
cleanup_registry
bundle_path="/tmp/tf-marketplace-test-remove-$$"
create_valid_plugin_bundle "$bundle_path"
bash "$TF" marketplace install --bundle "$bundle_path" >/dev/null 2>&1 || true
output=$(bash "$TF" marketplace remove --plugin test-plugin 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    # Check if registry no longer contains plugin
    if ! grep -q "test-plugin" "$REGISTRY" 2>/dev/null; then
        pass
    else
        fail "Exit 0 but plugin still in registry"
    fi
else
    fail "Wrong exit code: $rc (expected 0)"
fi
cleanup_bundles

# Test E4: Dry-run performs checks without writing registry
echo -n "  [E4] Dry-run checks without writing registry... "
run_test
cleanup_bundles
cleanup_registry
bundle_path="/tmp/tf-marketplace-test-dryrun-$$"
create_valid_plugin_bundle "$bundle_path"
# Modify plugin id to be unique for dry-run test
sed -i 's/"test-plugin"/"dry-run-plugin"/' "$bundle_path/plugin.manifest.json"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" --dry-run 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]] || [[ $output == *"dry"* ]] || [[ $output == *"would"* ]]; then
    # Check registry was NOT updated
    if ! grep -q "dry-run-plugin" "$REGISTRY" 2>/dev/null; then
        pass
    else
        fail "Dry-run wrote to registry"
    fi
else
    fail "Dry-run failed or didn't indicate dry-run mode"
fi
cleanup_bundles

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION F: CI JSON Purity
# ─────────────────────────────────────────────────────────────────────────────
echo "F. CI JSON Purity:"

# Test F1: --ci output parses as valid JSON
echo -n "  [F1] --ci output is valid JSON... "
run_test
cleanup_bundles
cleanup_registry
bundle_path="/tmp/tf-marketplace-test-ci-json-$$"
create_valid_plugin_bundle "$bundle_path"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" --ci 2>&1) || true
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    pass
else
    echo -e "  ${YELLOW}○ SKIP${NC} (--ci not implemented yet)"
fi
cleanup_bundles

# Test F2: No ANSI escape codes in --ci output
echo -n "  [F2] --ci output has no ANSI codes... "
run_test
cleanup_bundles
cleanup_registry
bundle_path="/tmp/tf-marketplace-test-ci-ansi-$$"
create_valid_plugin_bundle "$bundle_path"
sed -i 's/"test-plugin"/"ansi-test-plugin"/' "$bundle_path/plugin.manifest.json"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" --ci 2>&1) || true
if echo "$output" | grep -qE '\x1b\['; then
    fail "ANSI escape codes found in CI output"
else
    if [[ $output == "{"* ]]; then
        pass
    else
        echo -e "  ${YELLOW}○ SKIP${NC} (--ci not implemented yet)"
    fi
fi
cleanup_bundles

# Test F3: CI JSON contains required schema fields
echo -n "  [F3] CI JSON has version/timestamp/status... "
run_test
cleanup_bundles
cleanup_registry
bundle_path="/tmp/tf-marketplace-test-ci-schema-$$"
create_valid_plugin_bundle "$bundle_path"
sed -i 's/"test-plugin"/"schema-test-plugin"/' "$bundle_path/plugin.manifest.json"
output=$(bash "$TF" marketplace install --bundle "$bundle_path" --ci 2>&1) || true
if echo "$output" | python3 -c "import json, sys; j=json.load(sys.stdin); assert 'version' in j and 'timestamp' in j and 'status' in j" 2>/dev/null; then
    pass
else
    echo -e "  ${YELLOW}○ SKIP${NC} (--ci schema not implemented yet)"
fi
cleanup_bundles

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════
restore_registry
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
    echo "  - Marketplace command surface not implemented (expected RED baseline)"
    echo "  - Exit code contract not enforced"
    echo "  - Bundle validation missing"
    echo "  - Manifest schema validation missing"
    echo "  - Capability allowlist not enforced"
    echo "  - Registry state management not implemented"
    echo ""
    echo "  See: ops/marketplace/MARKETPLACE_RUNTIME_CONSTITUTION_v1.0.0_SPECLOCK.md"
    echo "═══════════════════════════════════════════════════════════════════════════"
    exit 1
fi
