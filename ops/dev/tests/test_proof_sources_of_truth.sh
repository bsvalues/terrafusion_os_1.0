#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Proof Sources of Truth v1.0.0 — Governance Test Suite
# Constitution: PROOF_SOURCES_OF_TRUTH_v1.0.0_SPECLOCK.md
# Purpose: Validate canonical proof emission from all subsystems
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
YELLOW='\033[0;33m'
NC='\033[0m'

pass() {
    ((TESTS_PASSED++))
    echo -e "✓ ${GREEN}PASS${NC}"
}

fail() {
    ((TESTS_FAILED++))
    echo -e "✗ ${RED}FAIL${NC}: $1"
}

skip() {
    echo -e "○ ${YELLOW}SKIP${NC}: $1"
}

run_test() {
    ((TESTS_RUN++))
}

# Helper: Check JSON has required top-level fields for proof
check_proof_fields() {
    local json="$1"
    python3 -c "
import json, sys
try:
    d = json.loads('''$json''')
    required = ['version', 'timestamp', 'subsystem', 'status', 'summary', 'checks']
    missing = [f for f in required if f not in d]
    if missing:
        print(f'Missing fields: {missing}', file=sys.stderr)
        sys.exit(1)
    # Check summary fields
    summary_required = ['total', 'passed', 'failed', 'warnings', 'skipped']
    summary_missing = [f for f in summary_required if f not in d.get('summary', {})]
    if summary_missing:
        print(f'Missing summary fields: {summary_missing}', file=sys.stderr)
        sys.exit(1)
    sys.exit(0)
except Exception as e:
    print(f'Parse error: {e}', file=sys.stderr)
    sys.exit(1)
" 2>&1
}

# Helper: Check ANSI codes absent
check_no_ansi() {
    local output="$1"
    if echo "$output" | grep -qE $'\x1b\['; then
        return 1
    fi
    return 0
}

# Helper: Check checks array is non-empty and ordered by id
check_checks_ordered() {
    local json="$1"
    python3 -c "
import json, sys
try:
    d = json.loads('''$json''')
    checks = d.get('checks', [])
    if not checks:
        print('Empty checks array', file=sys.stderr)
        sys.exit(1)
    # Verify ordering by id
    ids = [c.get('id') for c in checks]
    if ids != sorted(ids, key=lambda x: (isinstance(x, str), x)):
        print(f'Checks not ordered by id: {ids}', file=sys.stderr)
        sys.exit(1)
    sys.exit(0)
except Exception as e:
    print(f'Parse error: {e}', file=sys.stderr)
    sys.exit(1)
" 2>&1
}

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Proof Sources of Truth v1.0.0 — Governance Test Suite"
echo "  Reference: PROOF_SOURCES_OF_TRUTH_v1.0.0_SPECLOCK.md"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ==============================================================================
# A. Agent Proof Schema + Purity Tests
# ==============================================================================
echo "A. Agent Proof Schema + Purity:"

# Test A1: agent proof --ci outputs valid JSON
echo -n "  [A1] agent proof --ci outputs valid JSON... "
run_test
output=$(bash "$TF" agent proof --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    pass
else
    fail "Output is not valid JSON"
fi

# Test A2: agent proof --ci has required fields
echo -n "  [A2] agent proof --ci has required top-level fields... "
run_test
output=$(bash "$TF" agent proof --ci 2>&1) && rc=0 || rc=$?
result=$(check_proof_fields "$output")
if [[ $? -eq 0 ]]; then
    pass
else
    fail "$result"
fi

# Test A3: agent proof --ci subsystem field is "agent"
echo -n "  [A3] agent proof --ci subsystem field is 'agent'... "
run_test
output=$(bash "$TF" agent proof --ci 2>&1) && rc=0 || rc=$?
subsystem=$(echo "$output" | python3 -c "import json,sys; print(json.load(sys.stdin).get('subsystem',''))" 2>/dev/null || echo "")
if [[ "$subsystem" == "agent" ]]; then
    pass
else
    fail "subsystem='$subsystem' (expected 'agent')"
fi

# Test A4: agent proof --ci checks array non-empty
echo -n "  [A4] agent proof --ci checks array non-empty... "
run_test
output=$(bash "$TF" agent proof --ci 2>&1) && rc=0 || rc=$?
result=$(check_checks_ordered "$output")
if [[ $? -eq 0 ]]; then
    pass
else
    fail "$result"
fi

# Test A5: agent proof --ci no ANSI escape codes
echo -n "  [A5] agent proof --ci no ANSI escape codes... "
run_test
output=$(bash "$TF" agent proof --ci 2>&1) && rc=0 || rc=$?
if check_no_ansi "$output"; then
    pass
else
    fail "ANSI escape codes found in output"
fi

# Test A6: agent proof --ci deterministic check ordering
echo -n "  [A6] agent proof --ci deterministic check ordering... "
run_test
output1=$(bash "$TF" agent proof --ci 2>&1)
output2=$(bash "$TF" agent proof --ci 2>&1)
# Extract checks arrays and compare (excluding timestamp)
checks1=$(echo "$output1" | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin).get('checks',[])))" 2>/dev/null || echo "[]")
checks2=$(echo "$output2" | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin).get('checks',[])))" 2>/dev/null || echo "[]")
if [[ "$checks1" == "$checks2" ]]; then
    pass
else
    fail "Checks ordering not deterministic"
fi

echo ""

# ==============================================================================
# B. Deploy Proof Schema + Purity Tests
# ==============================================================================
echo "B. Deploy Proof Schema + Purity:"

# Test B1: deploy proof --ci outputs valid JSON
echo -n "  [B1] deploy proof --ci outputs valid JSON... "
run_test
output=$(bash "$TF" deploy proof --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    pass
else
    fail "Output is not valid JSON"
fi

# Test B2: deploy proof --ci has required fields
echo -n "  [B2] deploy proof --ci has required top-level fields... "
run_test
output=$(bash "$TF" deploy proof --ci 2>&1) && rc=0 || rc=$?
result=$(check_proof_fields "$output")
if [[ $? -eq 0 ]]; then
    pass
else
    fail "$result"
fi

# Test B3: deploy proof --ci subsystem field is "deploy"
echo -n "  [B3] deploy proof --ci subsystem field is 'deploy'... "
run_test
output=$(bash "$TF" deploy proof --ci 2>&1) && rc=0 || rc=$?
subsystem=$(echo "$output" | python3 -c "import json,sys; print(json.load(sys.stdin).get('subsystem',''))" 2>/dev/null || echo "")
if [[ "$subsystem" == "deploy" ]]; then
    pass
else
    fail "subsystem='$subsystem' (expected 'deploy')"
fi

# Test B4: deploy proof --ci checks array non-empty
echo -n "  [B4] deploy proof --ci checks array non-empty... "
run_test
output=$(bash "$TF" deploy proof --ci 2>&1) && rc=0 || rc=$?
result=$(check_checks_ordered "$output")
if [[ $? -eq 0 ]]; then
    pass
else
    fail "$result"
fi

# Test B5: deploy proof --ci no ANSI escape codes
echo -n "  [B5] deploy proof --ci no ANSI escape codes... "
run_test
output=$(bash "$TF" deploy proof --ci 2>&1) && rc=0 || rc=$?
if check_no_ansi "$output"; then
    pass
else
    fail "ANSI escape codes found in output"
fi

# Test B6: deploy proof --ci deterministic check ordering
echo -n "  [B6] deploy proof --ci deterministic check ordering... "
run_test
output1=$(bash "$TF" deploy proof --ci 2>&1)
output2=$(bash "$TF" deploy proof --ci 2>&1)
checks1=$(echo "$output1" | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin).get('checks',[])))" 2>/dev/null || echo "[]")
checks2=$(echo "$output2" | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin).get('checks',[])))" 2>/dev/null || echo "[]")
if [[ "$checks1" == "$checks2" ]]; then
    pass
else
    fail "Checks ordering not deterministic"
fi

echo ""

# ==============================================================================
# C. Marketplace Proof Schema + Purity Tests
# ==============================================================================
echo "C. Marketplace Proof Schema + Purity:"

# Test C1: marketplace proof --ci outputs valid JSON
echo -n "  [C1] marketplace proof --ci outputs valid JSON... "
run_test
output=$(bash "$TF" marketplace proof --ci 2>&1) && rc=0 || rc=$?
if echo "$output" | python3 -m json.tool >/dev/null 2>&1; then
    pass
else
    fail "Output is not valid JSON"
fi

# Test C2: marketplace proof --ci has required fields
echo -n "  [C2] marketplace proof --ci has required top-level fields... "
run_test
output=$(bash "$TF" marketplace proof --ci 2>&1) && rc=0 || rc=$?
result=$(check_proof_fields "$output")
if [[ $? -eq 0 ]]; then
    pass
else
    fail "$result"
fi

# Test C3: marketplace proof --ci subsystem field is "marketplace"
echo -n "  [C3] marketplace proof --ci subsystem field is 'marketplace'... "
run_test
output=$(bash "$TF" marketplace proof --ci 2>&1) && rc=0 || rc=$?
subsystem=$(echo "$output" | python3 -c "import json,sys; print(json.load(sys.stdin).get('subsystem',''))" 2>/dev/null || echo "")
if [[ "$subsystem" == "marketplace" ]]; then
    pass
else
    fail "subsystem='$subsystem' (expected 'marketplace')"
fi

# Test C4: marketplace proof --ci checks array non-empty
echo -n "  [C4] marketplace proof --ci checks array non-empty... "
run_test
output=$(bash "$TF" marketplace proof --ci 2>&1) && rc=0 || rc=$?
result=$(check_checks_ordered "$output")
if [[ $? -eq 0 ]]; then
    pass
else
    fail "$result"
fi

# Test C5: marketplace proof --ci no ANSI escape codes
echo -n "  [C5] marketplace proof --ci no ANSI escape codes... "
run_test
output=$(bash "$TF" marketplace proof --ci 2>&1) && rc=0 || rc=$?
if check_no_ansi "$output"; then
    pass
else
    fail "ANSI escape codes found in output"
fi

# Test C6: marketplace proof --ci deterministic check ordering
echo -n "  [C6] marketplace proof --ci deterministic check ordering... "
run_test
output1=$(bash "$TF" marketplace proof --ci 2>&1)
output2=$(bash "$TF" marketplace proof --ci 2>&1)
checks1=$(echo "$output1" | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin).get('checks',[])))" 2>/dev/null || echo "[]")
checks2=$(echo "$output2" | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin).get('checks',[])))" 2>/dev/null || echo "[]")
if [[ "$checks1" == "$checks2" ]]; then
    pass
else
    fail "Checks ordering not deterministic"
fi

echo ""

# ==============================================================================
# D. Exit Code Tests
# ==============================================================================
echo "D. Exit Code Tests:"

# Test D1: agent proof invalid flag -> exit 2 + error.code
echo -n "  [D1] agent proof --ci --unknown-flag -> exit 2 + error.code... "
run_test
output=$(bash "$TF" agent proof --ci --unknown-flag 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    error_code=$(echo "$output" | python3 -c "import json,sys; print(json.load(sys.stdin).get('error',{}).get('code',''))" 2>/dev/null || echo "")
    if [[ "$error_code" == "invalid_invocation" ]]; then
        pass
    else
        fail "error.code='$error_code' (expected 'invalid_invocation')"
    fi
else
    fail "Exit code=$rc (expected 2)"
fi

# Test D2: deploy proof invalid flag -> exit 2 + error.code
echo -n "  [D2] deploy proof --ci --unknown-flag -> exit 2 + error.code... "
run_test
output=$(bash "$TF" deploy proof --ci --unknown-flag 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    error_code=$(echo "$output" | python3 -c "import json,sys; print(json.load(sys.stdin).get('error',{}).get('code',''))" 2>/dev/null || echo "")
    if [[ "$error_code" == "invalid_invocation" ]]; then
        pass
    else
        fail "error.code='$error_code' (expected 'invalid_invocation')"
    fi
else
    fail "Exit code=$rc (expected 2)"
fi

# Test D3: marketplace proof invalid flag -> exit 2 + error.code
echo -n "  [D3] marketplace proof --ci --unknown-flag -> exit 2 + error.code... "
run_test
output=$(bash "$TF" marketplace proof --ci --unknown-flag 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 2 ]]; then
    error_code=$(echo "$output" | python3 -c "import json,sys; print(json.load(sys.stdin).get('error',{}).get('code',''))" 2>/dev/null || echo "")
    if [[ "$error_code" == "invalid_invocation" ]]; then
        pass
    else
        fail "error.code='$error_code' (expected 'invalid_invocation')"
    fi
else
    fail "Exit code=$rc (expected 2)"
fi

echo ""

# ==============================================================================
# E. Integration Tests (tf release bundle uses proof sources)
# ==============================================================================
echo "E. Integration Tests:"

# Test E1: tf release bundle calls proof commands (behavioral check)
echo -n "  [E1] tf release bundle uses canonical proof emitters... "
run_test
# Check that tf.sh contains calls to proof commands in release bundle
if grep -q 'agent proof --ci\|deploy proof --ci\|marketplace proof --ci' "$TF"; then
    pass
else
    fail "tf release bundle does not call proof commands"
fi

# Test E2: Proofs in bundle match canonical schema
echo -n "  [E2] release bundle proofs have canonical schema... "
run_test
bundle_dir="/tmp/tf-proof-test-bundle-$$"
rm -rf "$bundle_dir"
output=$(bash "$TF" release bundle --out "$bundle_dir" --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -eq 0 ]] && [[ -f "$bundle_dir/proofs/agent.json" ]]; then
    # Check agent proof has canonical fields
    agent_proof=$(cat "$bundle_dir/proofs/agent.json")
    result=$(check_proof_fields "$agent_proof")
    if [[ $? -eq 0 ]]; then
        pass
    else
        fail "agent.json missing canonical fields: $result"
    fi
else
    fail "Bundle creation failed or agent.json missing (rc=$rc)"
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
