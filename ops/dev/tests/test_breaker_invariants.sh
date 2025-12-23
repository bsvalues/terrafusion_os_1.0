#!/usr/bin/env bash
#
# test_breaker_invariants.sh - Regression guards for breaker/gate portability
#
# Tests that breaker and gate work correctly under adverse conditions:
#   - Minimal PATH (CI-style environment)
#   - set -e safety (non-zero command substitution)
#
# Run: bash ops/dev/tests/test_breaker_invariants.sh

set -euo pipefail

# Locale hardening: prevent setlocale errors in CI/minimal environments
export LC_ALL=C
export LANG=C

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Colors (only if terminal supports it)
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' NC=''
fi

TESTS_RUN=0
TESTS_PASSED=0
TESTS_SKIPPED=0

pass() { TESTS_PASSED=$((TESTS_PASSED + 1)); echo -e "  ${GREEN}✓ PASS${NC}"; }
fail() { echo -e "  ${RED}✗ FAIL${NC}: $1"; }
skip() { TESTS_SKIPPED=$((TESTS_SKIPPED + 1)); echo -e "  ${YELLOW}○ SKIP${NC}: $1"; }
run_test() { TESTS_RUN=$((TESTS_RUN + 1)); }

# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Test Suite: Breaker Invariants (PATH + set -e safety)"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# TEST A: PATH Hardening
# ─────────────────────────────────────────────────────────────────────────────
echo "PATH Hardening Tests:"

# Test A1: tf.sh runs with minimal PATH
echo -n "  [A1] tf.sh runs with PATH=/usr/bin:/bin... "
run_test

# Need bash, python3, docker, kubectl - check what minimal PATH works
MINIMAL_PATH="/usr/bin:/bin"

# First check if we can even run with minimal path (some systems need more)
check_result=$(env -i PATH="$MINIMAL_PATH" HOME="$HOME" USER="$USER" bash -c 'command -v python3' 2>&1) && check_rc=0 || check_rc=$?
if [[ $check_rc -eq 0 ]]; then
    output=$(env -i PATH="$MINIMAL_PATH" HOME="$HOME" USER="$USER" \
        bash -c "cd '$ROOT' && ./ops/dev/tf.sh help" 2>&1) && rc=0 || rc=$?
    
    if [[ $rc -eq 0 ]] && echo "$output" | grep -q "TerraFusion Dev CLI"; then
        pass
    else
        fail "tf.sh help failed with minimal PATH (rc=$rc)"
    fi
else
    skip "python3 not in minimal PATH on this system"
fi

# Test A2: gate command runs with minimal PATH
echo -n "  [A2] gate --ci runs with minimal PATH... "
run_test

# Build a PATH that includes essentials but not user bins
ESSENTIAL_PATH="/usr/bin:/bin"
# Add docker/kubectl paths if they exist in standard locations
[[ -d "/usr/local/bin" ]] && ESSENTIAL_PATH="/usr/local/bin:$ESSENTIAL_PATH"

# Check if docker is accessible (needed for some gate checks)
docker_check=$(command -v docker 2>&1) && docker_rc=0 || docker_rc=$?
if [[ $docker_rc -ne 0 ]]; then
    skip "docker not available"
else
    # Capture stdout only (stderr may have warnings)
    # Note: Some gate checks (like VS Code extensions) may fail gracefully in minimal PATH
    # We just verify the script produces JSON structure (even with malformed messages)
    output=$(env -i PATH="$ESSENTIAL_PATH" HOME="$HOME" USER="$USER" \
        bash -c "cd '$ROOT' && ./ops/dev/tf.sh gate --ci" 2>/dev/null) && rc=0 || rc=$?
    
    # Check for JSON structure markers (may have embedded newlines/control chars in messages)
    if echo "$output" | grep -q '"version":"1.0.0"' && echo "$output" | grep -q '"checks":\['; then
        pass
    else
        fail "gate --ci did not produce JSON structure with minimal PATH"
    fi
fi

# Test A3: generate-contract.py uses TF_CLI constant
echo -n "  [A3] generate-contract.py has TF_CLI constant... "
run_test

if grep -q '^TF_CLI = ' "$ROOT/ops/agents/generate-contract.py"; then
    # Verify it's used in PROJECTS
    if grep -q 'f"{TF_CLI}' "$ROOT/ops/agents/generate-contract.py"; then
        pass
    else
        fail "TF_CLI defined but not used in PROJECTS"
    fi
else
    fail "TF_CLI constant not found"
fi

# Test A4: No bare 'tf ' commands in generate-contract.py
echo -n "  [A4] No bare 'tf ' commands in generator... "
run_test

# Look for bare 'tf ' that isn't part of TF_CLI assignment or comment
bare_tf=$(grep -n '"tf ' "$ROOT/ops/agents/generate-contract.py" | grep -v "TF_CLI" | grep -v "^#" || true)
if [[ -z "$bare_tf" ]]; then
    pass
else
    fail "Found bare 'tf ' command: $bare_tf"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# TEST B: set -e Safety
# ─────────────────────────────────────────────────────────────────────────────
echo "set -e Safety Tests:"

# Test B1: Gate check 10 pattern captures exit codes
echo -n "  [B1] Gate check 10 uses safe exit-code capture... "
run_test

# The pattern should be: cmd && rc=0 || rc=$?
if grep -q '&& session_exit=0 || session_exit=\$?' "$ROOT/ops/dev/tf.sh"; then
    pass
else
    fail "Gate check 10 missing safe exit-code capture pattern"
fi

# Test B2: Gate completes all 11 checks even when check 10 fails
echo -n "  [B2] Gate completes 11 checks when session check fails... "
run_test

# Create a scenario where agent check will fail (if there's an active session with unfrozen speclock)
# For this test, we just verify the JSON output has 11 checks
# Note: only capture stdout (stderr may have warnings)
output=$(cd "$ROOT" && ./ops/dev/tf.sh gate --ci 2>/dev/null) && rc=0 || rc=$?
check_count=$(echo "$output" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('checks',[])))" 2>/dev/null || echo "0")

if [[ "$check_count" -eq 11 ]]; then
    pass
else
    fail "Expected 11 checks, got $check_count"
fi

# Test B3: Gate JSON has correct summary totals
echo -n "  [B3] Gate JSON summary matches check count... "
run_test

summary_total=$(echo "$output" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('summary',{}).get('total',0))" 2>/dev/null || echo "0")
if [[ "$summary_total" -eq 11 ]]; then
    pass
else
    fail "Summary total is $summary_total, expected 11"
fi

# Test B4: Simulated non-zero probe doesn't exit script
echo -n "  [B4] set -e safe pattern works in isolation... "
run_test

# Run a mini-script that uses the same pattern
result=$(bash -c '
set -e
# Simulate the pattern used in tf.sh
output=$(false) && exit_code=0 || exit_code=$?
echo "captured:$exit_code"
echo "continued"
' 2>&1) && test_rc=0 || test_rc=$?

if [[ $test_rc -eq 0 ]] && echo "$result" | grep -q "captured:1" && echo "$result" | grep -q "continued"; then
    pass
else
    fail "Pattern did not capture exit code correctly"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# TEST C: Breaker Integration
# ─────────────────────────────────────────────────────────────────────────────
echo "Breaker Integration Tests:"

# Test C1: Breaker gate check uses deterministic path
echo -n "  [C1] Breaker calls gate with deterministic path... "
run_test

# Check that run_breaker uses TF_CLI
if grep -q 'TF_CLI.*gate' "$ROOT/ops/agents/generate-contract.py"; then
    pass
else
    fail "Breaker gate call doesn't use TF_CLI"
fi

# Test C2: No subprocess.run with bare CLI names
echo -n "  [C2] No bare CLI in subprocess calls... "
run_test

# Look for subprocess.run with bare commands (not paths)
bare_subprocess=$(grep -n "subprocess.run.*\[.*'tf'" "$ROOT/ops/agents/generate-contract.py" | head -1 || true)
if [[ -z "$bare_subprocess" ]]; then
    pass
else
    fail "Found bare CLI in subprocess: $bare_subprocess"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# TEST D: Forbidden Patterns (Convention Enforcement)
# ─────────────────────────────────────────────────────────────────────────────
echo "Forbidden Pattern Guards:"

# Test D1: No bare 'python ' or 'python3 ' in gate-critical paths
echo -n "  [D1] No bare python in gate/breaker scripts... "
run_test

# Only check gate scripts (ops/scripts/gate-*.sh) - command handlers in tf.sh are OK
# Use 'command grep' to avoid aliases; '|| true' to handle no-match exit code
bare_python=$(command grep -rn "^\s*python3\? " "$ROOT/ops/scripts"/gate-*.sh 2>/dev/null | \
    command grep -v "^#" | command grep -v "command -v" | command grep -v "which python" | head -1 || true)
if [[ -z "$bare_python" ]]; then
    pass
else
    fail "Found bare python in gate script: $(echo "$bare_python" | cut -d: -f1-2)"
fi

# Test D2: No unguarded command substitution in set -e scripts
echo -n "  [D2] No unguarded \$(cmd) probes in gate checks... "
run_test

# Look for pattern: var=$(python3 ... ) without && or || guard on same/next line
# This is a heuristic check for the specific anti-pattern we fixed
gate_probes=$(command grep -n '=\$(python3.*check' "$ROOT/ops/dev/tf.sh" 2>/dev/null | \
    command grep -v '&& .*=0 || .*=\$?' | head -1 || true)
if [[ -z "$gate_probes" ]]; then
    pass
else
    fail "Found unguarded probe: $gate_probes"
fi

# Test D3: All PROJECTS in generate-contract.py use TF_CLI
echo -n "  [D3] All PROJECTS entries use TF_CLI... "
run_test

# Count gate entries that don't use TF_CLI
# Use awk for deterministic count (no wc formatting issues)
# Pipeline: find "gate":..."tf " lines, exclude TF_CLI, count
non_tf_cli=$(
    command grep -E '"gate":.*"tf ' "$ROOT/ops/agents/generate-contract.py" 2>/dev/null \
    | command grep -v 'TF_CLI' 2>/dev/null \
    | command awk 'END{print NR+0}' \
    || echo "0"
)
# Sanitize: strip all whitespace, ensure single token
non_tf_cli="$(printf '%s' "$non_tf_cli" | tr -d '[:space:]')"

# Validate numeric before comparing (prevents bash syntax errors)
if ! [[ "$non_tf_cli" =~ ^[0-9]+$ ]]; then
    fail "D3 produced non-numeric count: [$non_tf_cli]"
elif [[ "$non_tf_cli" -ne 0 ]]; then
    fail "Found $non_tf_cli PROJECTS entries with bare 'tf' command"
else
    pass
fi

# Test D4: timeout command is available and deterministic
echo -n "  [D4] timeout command available... "
run_test

# Verify timeout resolves to system binary (not alias/function)
timeout_path=$(command -v timeout 2>/dev/null) && timeout_rc=0 || timeout_rc=$?
if [[ $timeout_rc -eq 0 ]] && [[ -x "$timeout_path" ]]; then
    # Verify it's the real timeout (supports --version or standard usage)
    command timeout 1 true 2>/dev/null && verify_rc=0 || verify_rc=$?
    if [[ $verify_rc -eq 0 ]]; then
        pass
    else
        fail "timeout command exists but doesn't work correctly"
    fi
else
    fail "timeout command not found or not executable"
fi

# Test D5: Sterile shell produces no warnings
echo -n "  [D5] tf.sh clean in sterile environment... "
run_test

sterile_test="$SCRIPT_DIR/test_sterile_shell.sh"
if [[ -f "$sterile_test" ]]; then
    sterile_output=$(bash "$sterile_test" 2>&1) && sterile_rc=0 || sterile_rc=$?
    if [[ $sterile_rc -eq 0 ]]; then
        pass
    else
        fail "Sterile shell test failed: $sterile_output"
    fi
else
    skip "test_sterile_shell.sh not found"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════════════════"

TESTS_FAILED=$((TESTS_RUN - TESTS_PASSED - TESTS_SKIPPED))

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "  ${GREEN}✓ All tests passed${NC} ($TESTS_PASSED/$TESTS_RUN, $TESTS_SKIPPED skipped)"
    echo "═══════════════════════════════════════════════════════════════════════════"
    exit 0
else
    echo -e "  ${RED}✗ $TESTS_FAILED test(s) failed${NC} ($TESTS_PASSED passed, $TESTS_SKIPPED skipped)"
    echo "═══════════════════════════════════════════════════════════════════════════"
    exit 1
fi
