#!/usr/bin/env bash
# ==============================================================================
# Marketplace Runtime Execution Governance Test Suite
# ==============================================================================
# Constitutional tests for Phase 2: Execution Containment
# Evidence-driven validation of runtime invariants
#
# Reference: ops/marketplace/MARKETPLACE_EXECUTION_CONSTITUTION_v1.0.0_SPECLOCK.md
# Prerequisite: ops/dev/tests/test_marketplace_governance.sh (Phase 1) must pass
#
# Test Sections:
#   A. Invocation Validity (Exit 2)
#   B. Execution Prerequisites (Exit 1)
#   C. Capability Enforcement (Exit 1 + quarantine)
#   D. Resource Limits (timeout)
#   E. Crash Containment
#   F. Audit Logging
#   G. CI JSON Purity
#   H. Kill Command
#
# Usage:
#   ./test_marketplace_runtime_governance.sh
#   ./test_marketplace_runtime_governance.sh --section A
#   ./test_marketplace_runtime_governance.sh --verbose
# ==============================================================================

# Note: We use set -u but NOT set -e to allow test failures to be captured
set -uo pipefail

# --- Constants ---
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TF="$ROOT/ops/dev/tf.sh"
# Use temp directory for test isolation
export MARKETPLACE_DIR="${MARKETPLACE_DIR:-/tmp/tf-marketplace-runtime-test-suite-$$}"
export MARKETPLACE_REGISTRY="$MARKETPLACE_DIR/registry.json"
REGISTRY="$MARKETPLACE_REGISTRY"
AUDIT_DIR="$MARKETPLACE_DIR/audit"

# Initialize test directories
mkdir -p "$MARKETPLACE_DIR/audit"

# Test counters
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
TOTAL_TESTS=0

# Colors (disabled in CI)
if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    NC=''
fi

# --- Helpers ---
pass() {
    ((PASS_COUNT++))
    echo -e "  ${GREEN}✓ PASS${NC}"
}

fail() {
    ((FAIL_COUNT++))
    echo -e "  ${RED}✗ FAIL${NC}: $1"
}

skip() {
    ((SKIP_COUNT++))
    echo -e "  ${YELLOW}○ SKIP${NC}: $1"
}

run_test() {
    ((TOTAL_TESTS++))
}

# JSON validation helper (uses jq if available, grep fallback)
json_valid() {
    local input="$1"
    if command -v jq &>/dev/null; then
        echo "$input" | jq . >/dev/null 2>&1
    else
        # Fallback: basic JSON structure check
        [[ "$input" == "{"*"}" ]] && echo "$input" | grep -qE '"[^"]+"\s*:'
    fi
}

# JSON field check helper (uses jq if available, grep fallback)
json_has_field() {
    local input="$1"
    local field="$2"
    if command -v jq &>/dev/null; then
        echo "$input" | jq -e ".$field" >/dev/null 2>&1
    else
        # Fallback: grep for field pattern
        echo "$input" | grep -qE "\"$field\"\s*:"
    fi
}

# JSON field check from file (uses jq if available, grep fallback)
json_file_has_field() {
    local file="$1"
    local field="$2"
    if command -v jq &>/dev/null; then
        jq -e ".$field" "$file" >/dev/null 2>&1
    else
        # Fallback: grep for field pattern
        grep -qE "\"$field\"\s*:" "$file"
    fi
}

cleanup_registry() {
    # Reset registry to empty state
    mkdir -p "$MARKETPLACE_DIR"
    cat > "$REGISTRY" << 'EOF'
{
  "version": "1.0.0",
  "updated_at": "2025-01-01T00:00:00Z",
  "plugins": []
}
EOF
}

cleanup_audit() {
    # Remove all audit logs
    rm -rf "$AUDIT_DIR"
    mkdir -p "$AUDIT_DIR"
}

cleanup_bundles() {
    rm -rf /tmp/tf-marketplace-runtime-test-*
}

# Create a valid plugin bundle with executable entrypoint
create_valid_plugin_bundle() {
    local bundle_path="$1"
    local plugin_id="${2:-test-plugin}"
    local capabilities="${3:-[\"ui.panel\", \"data.read\"]}"
    
    mkdir -p "$bundle_path/proofs"
    
    # Create manifest with entrypoints
    cat > "$bundle_path/plugin.manifest.json" << EOF
{
  "id": "$plugin_id",
  "name": "Test Plugin",
  "version": "1.0.0",
  "entrypoints": {
    "main": "./main.sh",
    "config": "./config.sh"
  },
  "capabilities": $capabilities,
  "integrity": {
    "sha256": "test-hash-$(date +%s)"
  }
}
EOF
    
    # Create SBOM
    cat > "$bundle_path/sbom.json" << 'EOF'
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.4",
  "components": []
}
EOF
    
    # Create executable entrypoint (simulates plugin behavior)
    cat > "$bundle_path/main.sh" << 'EOF'
#!/bin/bash
# Simulated plugin main entrypoint
echo '{"status": "executed", "plugin": "test-plugin"}'
exit 0
EOF
    chmod +x "$bundle_path/main.sh"
    
    # Create config entrypoint
    cat > "$bundle_path/config.sh" << 'EOF'
#!/bin/bash
echo '{"config": "loaded"}'
exit 0
EOF
    chmod +x "$bundle_path/config.sh"
}

# Create a plugin that times out
create_slow_plugin_bundle() {
    local bundle_path="$1"
    local plugin_id="${2:-slow-plugin}"
    
    mkdir -p "$bundle_path/proofs"
    
    cat > "$bundle_path/plugin.manifest.json" << EOF
{
  "id": "$plugin_id",
  "name": "Slow Plugin",
  "version": "1.0.0",
  "entrypoints": {
    "main": "./main.sh"
  },
  "capabilities": ["ui.panel"],
  "integrity": {
    "sha256": "slow-hash-$(date +%s)"
  }
}
EOF
    
    cat > "$bundle_path/sbom.json" << 'EOF'
{"bomFormat": "CycloneDX", "specVersion": "1.4", "components": []}
EOF
    
    # Plugin that sleeps forever
    cat > "$bundle_path/main.sh" << 'EOF'
#!/bin/bash
sleep 3600
EOF
    chmod +x "$bundle_path/main.sh"
}

# Create a plugin that crashes
create_crashy_plugin_bundle() {
    local bundle_path="$1"
    local plugin_id="${2:-crashy-plugin}"
    
    mkdir -p "$bundle_path/proofs"
    
    cat > "$bundle_path/plugin.manifest.json" << EOF
{
  "id": "$plugin_id",
  "name": "Crashy Plugin",
  "version": "1.0.0",
  "entrypoints": {
    "main": "./main.sh"
  },
  "capabilities": ["ui.panel"],
  "integrity": {
    "sha256": "crashy-hash-$(date +%s)"
  }
}
EOF
    
    cat > "$bundle_path/sbom.json" << 'EOF'
{"bomFormat": "CycloneDX", "specVersion": "1.4", "components": []}
EOF
    
    # Plugin that crashes
    cat > "$bundle_path/main.sh" << 'EOF'
#!/bin/bash
exit 1
EOF
    chmod +x "$bundle_path/main.sh"
}

# Create a plugin that attempts forbidden capability
create_malicious_plugin_bundle() {
    local bundle_path="$1"
    local plugin_id="${2:-malicious-plugin}"
    
    mkdir -p "$bundle_path/proofs"
    
    cat > "$bundle_path/plugin.manifest.json" << EOF
{
  "id": "$plugin_id",
  "name": "Malicious Plugin",
  "version": "1.0.0",
  "entrypoints": {
    "main": "./main.sh"
  },
  "capabilities": ["ui.panel"],
  "integrity": {
    "sha256": "malicious-hash-$(date +%s)"
  }
}
EOF
    
    cat > "$bundle_path/sbom.json" << 'EOF'
{"bomFormat": "CycloneDX", "specVersion": "1.4", "components": []}
EOF
    
    # Plugin that tries to invoke forbidden capability
    # In simulated harness, this would be detected by capability check
    cat > "$bundle_path/main.sh" << 'EOF'
#!/bin/bash
# Attempt to invoke fs.write (forbidden)
echo "CAPABILITY_INVOKE:fs.write:/etc/passwd"
EOF
    chmod +x "$bundle_path/main.sh"
}

# Install and enable a plugin for testing
install_and_enable_plugin() {
    local bundle_path="$1"
    local plugin_id="${2:-test-plugin}"
    
    bash "$TF" marketplace install --bundle "$bundle_path" >/dev/null 2>&1 || true
    bash "$TF" marketplace enable --plugin "$plugin_id" >/dev/null 2>&1 || true
}

# ==============================================================================
# Test Header
# ==============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Marketplace Runtime Execution Governance Test Suite"
echo "  Reference: MARKETPLACE_EXECUTION_CONSTITUTION_v1.0.0_SPECLOCK.md"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ==============================================================================
# A. INVOCATION VALIDITY (Exit 2)
# ==============================================================================
echo "A. Invocation Validity (Exit 2 on Invalid):"

# Test R.A1: Missing --plugin flag
echo -n "  [R.A1] Missing --plugin flag returns exit 2... "
run_test
cleanup_bundles
cleanup_registry
output=$(bash "$TF" marketplace run 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test R.A2: Missing --entry flag
echo -n "  [R.A2] Missing --entry flag returns exit 2... "
run_test
output=$(bash "$TF" marketplace run --plugin test-plugin 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test R.A3: Unknown flags
echo -n "  [R.A3] Unknown flags return exit 2... "
run_test
output=$(bash "$TF" marketplace run --plugin test-plugin --entry main --unknown-flag 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi

# Test R.A4: Invalid entrypoint (not in manifest)
echo -n "  [R.A4] Invalid entrypoint returns exit 2... "
run_test
cleanup_registry
bundle_path="/tmp/tf-marketplace-runtime-test-a4-$$"
create_valid_plugin_bundle "$bundle_path"
install_and_enable_plugin "$bundle_path"
output=$(bash "$TF" marketplace run --plugin test-plugin --entry nonexistent 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 2)"
fi
cleanup_bundles

echo ""

# ==============================================================================
# B. EXECUTION PREREQUISITES (Exit 1)
# ==============================================================================
echo "B. Execution Prerequisites (Exit 1 on Policy Failure):"

# Test R.B1: Plugin not installed
echo -n "  [R.B1] Plugin not installed returns exit 1... "
run_test
cleanup_registry
output=$(bash "$TF" marketplace run --plugin nonexistent --entry main 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

# Test R.B2: Plugin installed but not enabled
echo -n "  [R.B2] Plugin not enabled returns exit 1... "
run_test
cleanup_registry
bundle_path="/tmp/tf-marketplace-runtime-test-b2-$$"
create_valid_plugin_bundle "$bundle_path"
bash "$TF" marketplace install --bundle "$bundle_path" >/dev/null 2>&1 || true
# Don't enable!
output=$(bash "$TF" marketplace run --plugin test-plugin --entry main 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi
cleanup_bundles

# Test R.B3: Plugin enabled, valid execution
echo -n "  [R.B3] Enabled plugin executes (exit 0)... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-b3-$$"
create_valid_plugin_bundle "$bundle_path"
install_and_enable_plugin "$bundle_path"
output=$(bash "$TF" marketplace run --plugin test-plugin --entry main 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 0)"
fi
cleanup_bundles

echo ""

# ==============================================================================
# C. CAPABILITY ENFORCEMENT (Exit 1 + Quarantine)
# ==============================================================================
echo "C. Capability Enforcement:"

# Test R.C1: Plugin invokes allowed capability
echo -n "  [R.C1] Allowed capability succeeds... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-c1-$$"
create_valid_plugin_bundle "$bundle_path" "cap-test-plugin" '["ui.panel", "data.read"]'
install_and_enable_plugin "$bundle_path" "cap-test-plugin"
output=$(bash "$TF" marketplace run --plugin cap-test-plugin --entry main 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 0)"
fi
cleanup_bundles

# Test R.C2: Plugin invokes forbidden capability
echo -n "  [R.C2] Forbidden capability fails + quarantine... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-c2-$$"
create_malicious_plugin_bundle "$bundle_path" "malicious-test"
install_and_enable_plugin "$bundle_path" "malicious-test"
output=$(bash "$TF" marketplace run --plugin malicious-test --entry main 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    # Check if quarantined
    if grep -q '"status".*:.*"quarantined"' "$REGISTRY" 2>/dev/null; then
        pass
    else
        fail "Exit 1 but plugin not quarantined"
    fi
else
    fail "Wrong exit code: $rc (expected 1)"
fi
cleanup_bundles

echo ""

# ==============================================================================
# D. RESOURCE LIMITS (Timeout)
# ==============================================================================
echo "D. Resource Limits:"

# Test R.D1: Execution within timeout
echo -n "  [R.D1] Execution within timeout succeeds... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-d1-$$"
create_valid_plugin_bundle "$bundle_path" "fast-plugin"
install_and_enable_plugin "$bundle_path" "fast-plugin"
output=$(bash "$TF" marketplace run --plugin fast-plugin --entry main --timeout 30 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 0)"
fi
cleanup_bundles

# Test R.D2: Execution exceeds timeout
echo -n "  [R.D2] Timeout enforced (exit 1)... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-d2-$$"
create_slow_plugin_bundle "$bundle_path" "slow-test"
install_and_enable_plugin "$bundle_path" "slow-test"
# Use very short timeout
output=$(timeout 10 bash "$TF" marketplace run --plugin slow-test --entry main --timeout 2 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
elif [[ $rc -eq 124 ]]; then
    fail "Test itself timed out - harness not enforcing timeout"
else
    fail "Wrong exit code: $rc (expected 1)"
fi
cleanup_bundles

# Test R.D3: Custom --timeout flag honored
echo -n "  [R.D3] Custom --timeout honored... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-d3-$$"
create_slow_plugin_bundle "$bundle_path" "custom-timeout-test"
install_and_enable_plugin "$bundle_path" "custom-timeout-test"
start_time=$(date +%s)
output=$(timeout 10 bash "$TF" marketplace run --plugin custom-timeout-test --entry main --timeout 1 2>&1) && rc=0 || rc=$?
end_time=$(date +%s)
elapsed=$((end_time - start_time))
# Should terminate within 3 seconds (1s timeout + 2s grace)
if [[ $rc -eq 1 ]] && [[ $elapsed -lt 5 ]]; then
    pass
else
    fail "Timeout not honored (rc=$rc, elapsed=${elapsed}s)"
fi
cleanup_bundles

# Test R.D4: Background processes killed with parent (process group containment)
echo -n "  [R.D4] Background processes killed with parent (setsid)... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-d4-$$"
mkdir -p "$bundle_path"
# Create a plugin that spawns background process with nohup
cat > "$bundle_path/main.sh" << 'FORK_SCRIPT'
#!/bin/bash
# Spawn a background process that writes to marker file
nohup bash -c "sleep 60; echo 'survived' > /tmp/tf-fork-survived-marker" &
# Parent sleeps, gets killed by timeout
sleep 30
FORK_SCRIPT
chmod +x "$bundle_path/main.sh"
cat > "$bundle_path/manifest.json" << 'EOF'
{"id":"fork-test","version":"1.0.0","name":"Fork Test","entrypoints":{"main":"main.sh"},"capabilities":["ui.panel"]}
EOF
install_and_enable_plugin "$bundle_path" "fork-test"
# Remove any stale marker
rm -f /tmp/tf-fork-survived-marker
# Run with very short timeout (2s) - parent + children should all be killed
output=$(timeout 10 bash "$TF" marketplace run --plugin fork-test --entry main --timeout 2 2>&1) && rc=0 || rc=$?
# Wait a moment for any rogue processes to potentially write
sleep 1
# Check if background process survived (it should NOT)
if [[ -f /tmp/tf-fork-survived-marker ]]; then
    fail "Background process survived timeout - process group kill failed"
elif [[ $rc -eq 1 ]]; then
    # Also verify no lingering sleep processes from our test
    if pgrep -f "sleep 60.*tf-fork" >/dev/null 2>&1; then
        fail "Background process still running"
    else
        pass
    fi
else
    fail "Wrong exit code: $rc (expected 1)"
fi
rm -f /tmp/tf-fork-survived-marker
cleanup_bundles

echo ""

# ==============================================================================
# E. CRASH CONTAINMENT
# ==============================================================================
echo "E. Crash Containment:"

# Test R.E1: Plugin crashes, host survives
echo -n "  [R.E1] Plugin crash returns exit 1, host survives... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-e1-$$"
create_crashy_plugin_bundle "$bundle_path" "crashy-test"
install_and_enable_plugin "$bundle_path" "crashy-test"
output=$(bash "$TF" marketplace run --plugin crashy-test --entry main 2>&1) && rc=0 || rc=$?
# Verify we're still running (host didn't crash)
if [[ $rc -eq 1 ]] && bash -c "echo 'host alive'" >/dev/null 2>&1; then
    pass
else
    fail "Wrong exit code: $rc (expected 1) or host crashed"
fi
cleanup_bundles

# Test R.E2: Plugin exits normally
echo -n "  [R.E2] Normal exit returns exit 0... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-e2-$$"
create_valid_plugin_bundle "$bundle_path" "normal-plugin"
install_and_enable_plugin "$bundle_path" "normal-plugin"
output=$(bash "$TF" marketplace run --plugin normal-plugin --entry main 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 0)"
fi
cleanup_bundles

# Test R.E3: Registry unchanged after crash (no quarantine)
echo -n "  [R.E3] Registry unchanged after crash (no quarantine)... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-e3-$$"
create_crashy_plugin_bundle "$bundle_path" "crash-no-quarantine"
install_and_enable_plugin "$bundle_path" "crash-no-quarantine"
# Record registry state before
registry_before=$(cat "$REGISTRY")
output=$(bash "$TF" marketplace run --plugin crash-no-quarantine --entry main 2>&1) && rc=0 || rc=$?
# Check registry still shows enabled (not quarantined)
if grep -q '"enabled": true' "$REGISTRY" 2>/dev/null && ! grep -q '"quarantined"' "$REGISTRY" 2>/dev/null; then
    pass
else
    fail "Registry changed after crash (should remain enabled)"
fi
cleanup_bundles

echo ""

# ==============================================================================
# F. AUDIT LOGGING
# ==============================================================================
echo "F. Audit Logging:"

# Test R.F1: Audit log created on success
echo -n "  [R.F1] Audit log created on success... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-f1-$$"
create_valid_plugin_bundle "$bundle_path" "audit-success"
install_and_enable_plugin "$bundle_path" "audit-success"
output=$(bash "$TF" marketplace run --plugin audit-success --entry main 2>&1) && rc=0 || rc=$?
# Check audit log exists
if [[ -d "$AUDIT_DIR/audit-success" ]] && ls "$AUDIT_DIR/audit-success"/*.json >/dev/null 2>&1; then
    pass
else
    fail "Audit log not created at $AUDIT_DIR/audit-success/"
fi
cleanup_bundles

# Test R.F2: Audit log created on failure
echo -n "  [R.F2] Audit log created on failure... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-f2-$$"
create_crashy_plugin_bundle "$bundle_path" "audit-failure"
install_and_enable_plugin "$bundle_path" "audit-failure"
output=$(bash "$TF" marketplace run --plugin audit-failure --entry main 2>&1) && rc=0 || rc=$?
# Check audit log exists even on failure
if [[ -d "$AUDIT_DIR/audit-failure" ]] && ls "$AUDIT_DIR/audit-failure"/*.json >/dev/null 2>&1; then
    pass
else
    fail "Audit log not created for failure at $AUDIT_DIR/audit-failure/"
fi
cleanup_bundles

# Test R.F3: Audit log schema compliance
echo -n "  [R.F3] Audit log has required fields... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-f3-$$"
create_valid_plugin_bundle "$bundle_path" "audit-schema"
install_and_enable_plugin "$bundle_path" "audit-schema"
output=$(bash "$TF" marketplace run --plugin audit-schema --entry main 2>&1) && rc=0 || rc=$?
# Find the audit log and check schema
audit_log=$(ls "$AUDIT_DIR/audit-schema"/*.json 2>/dev/null | head -1)
if [[ -f "$audit_log" ]]; then
    # Check for required fields using portable helper
    has_plugin_id=$(json_file_has_field "$audit_log" "plugin_id" && echo "yes" || echo "no")
    has_outcome=$(json_file_has_field "$audit_log" "outcome" && echo "yes" || echo "no")
    has_started_at=$(json_file_has_field "$audit_log" "started_at" && echo "yes" || echo "no")
    has_exit_code=$(json_file_has_field "$audit_log" "exit_code" && echo "yes" || echo "no")
    
    if [[ "$has_plugin_id" == "yes" && "$has_outcome" == "yes" && "$has_started_at" == "yes" && "$has_exit_code" == "yes" ]]; then
        pass
    else
        fail "Missing required fields (plugin_id=$has_plugin_id, outcome=$has_outcome, started_at=$has_started_at, exit_code=$has_exit_code)"
    fi
else
    fail "No audit log found"
fi
cleanup_bundles

echo ""

# ==============================================================================
# G. CI JSON PURITY
# ==============================================================================
echo "G. CI JSON Purity:"

# Test R.G1: --ci output is valid JSON
echo -n "  [R.G1] --ci output is valid JSON... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-g1-$$"
create_valid_plugin_bundle "$bundle_path" "ci-json-test"
install_and_enable_plugin "$bundle_path" "ci-json-test"
output=$(bash "$TF" marketplace run --plugin ci-json-test --entry main --ci 2>&1)
if json_valid "$output"; then
    pass
else
    fail "Output is not valid JSON"
fi
cleanup_bundles

# Test R.G2: --ci output has no ANSI codes
echo -n "  [R.G2] --ci output has no ANSI codes... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-g2-$$"
create_valid_plugin_bundle "$bundle_path" "ci-ansi-test"
install_and_enable_plugin "$bundle_path" "ci-ansi-test"
output=$(bash "$TF" marketplace run --plugin ci-ansi-test --entry main --ci 2>&1)
if echo "$output" | grep -q $'\x1b'; then
    fail "Output contains ANSI escape codes"
else
    pass
fi
cleanup_bundles

# Test R.G3: --ci output has required fields
echo -n "  [R.G3] --ci output has required fields... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-g3-$$"
create_valid_plugin_bundle "$bundle_path" "ci-fields-test"
install_and_enable_plugin "$bundle_path" "ci-fields-test"
output=$(bash "$TF" marketplace run --plugin ci-fields-test --entry main --ci 2>&1)
has_version=$(json_has_field "$output" "version" && echo "yes" || echo "no")
has_status=$(json_has_field "$output" "status" && echo "yes" || echo "no")
has_timestamp=$(json_has_field "$output" "timestamp" && echo "yes" || echo "no")
if [[ "$has_version" == "yes" && "$has_status" == "yes" && "$has_timestamp" == "yes" ]]; then
    pass
else
    fail "Missing fields (version=$has_version, status=$has_status, timestamp=$has_timestamp)"
fi
cleanup_bundles

echo ""

# ==============================================================================
# H. KILL COMMAND
# ==============================================================================
echo "H. Kill Command:"

# Test R.H1: Kill running plugin
echo -n "  [R.H1] Kill running plugin (exit 0)... "
run_test
cleanup_registry
cleanup_audit
bundle_path="/tmp/tf-marketplace-runtime-test-h1-$$"
create_slow_plugin_bundle "$bundle_path" "killable-plugin"
install_and_enable_plugin "$bundle_path" "killable-plugin"
# Start plugin in background
bash "$TF" marketplace run --plugin killable-plugin --entry main --timeout 60 &
run_pid=$!
sleep 1
# Try to kill it
output=$(bash "$TF" marketplace kill --plugin killable-plugin 2>&1) && rc=0 || rc=$?
wait $run_pid 2>/dev/null || true
if [[ $rc -eq 0 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 0)"
fi
cleanup_bundles

# Test R.H2: Kill non-running plugin
echo -n "  [R.H2] Kill non-running plugin (exit 1)... "
run_test
cleanup_registry
output=$(bash "$TF" marketplace kill --plugin nonexistent 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 1 ]]; then
    pass
else
    fail "Wrong exit code: $rc (expected 1)"
fi

# Test R.H3: Kill with --ci produces JSON
echo -n "  [R.H3] Kill --ci produces valid JSON... "
run_test
cleanup_registry
output=$(bash "$TF" marketplace kill --plugin nonexistent --ci 2>&1) && rc=0 || rc=$?
if json_valid "$output"; then
    pass
else
    fail "Output is not valid JSON"
fi

echo ""

# ==============================================================================
# Test Summary
# ==============================================================================
echo "═══════════════════════════════════════════════════════════════════════════"
if [[ $FAIL_COUNT -eq 0 ]]; then
    echo -e "  ${GREEN}✓ All tests passed ($PASS_COUNT/$TOTAL_TESTS)${NC}"
else
    echo -e "  ${RED}✗ $FAIL_COUNT test(s) failed${NC} ($PASS_COUNT passed, $SKIP_COUNT skipped)"
    echo ""
    echo "  Constitutional gaps detected:"
    echo "  - Marketplace runtime execution not implemented (expected RED baseline)"
    echo "  - Exit code contract not enforced"
    echo "  - Capability enforcement missing"
    echo "  - Timeout handling not implemented"
    echo "  - Audit logging not implemented"
    echo "  - Kill command not implemented"
    echo ""
    echo "  See: ops/marketplace/MARKETPLACE_EXECUTION_CONSTITUTION_v1.0.0_SPECLOCK.md"
fi
echo "═══════════════════════════════════════════════════════════════════════════"

# Exit with failure if any tests failed
[[ $FAIL_COUNT -eq 0 ]]
