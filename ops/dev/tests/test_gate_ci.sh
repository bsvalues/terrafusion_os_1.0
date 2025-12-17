#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Test Suite: tf gate --ci JSON output
# Session: 20251217_084815Z_os-shell_tf-gate-ci-json-output
# 
# NOTE: Uses Python for JSON validation (no jq dependency)
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TF="$ROOT/ops/dev/tf.sh"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════════════════════
# Test Helpers (Python-based, no jq)
# ═══════════════════════════════════════════════════════════════════════════

assert_eq() {
    local expected="$1"
    local actual="$2"
    local msg="${3:-}"
    
    if [[ "$expected" == "$actual" ]]; then
        return 0
    else
        echo "  Expected: $expected"
        echo "  Actual:   $actual"
        return 1
    fi
}

assert_json_valid() {
    local json="$1"
    if echo "$json" | python3 -c "import json,sys; json.load(sys.stdin)" 2>/dev/null; then
        return 0
    else
        echo "  Invalid JSON: ${json:0:100}..."
        return 1
    fi
}

assert_json_field() {
    local json="$1"
    local field="$2"
    local expected="$3"
    
    local actual
    actual=$(echo "$json" | python3 -c "
import json,sys
d=json.load(sys.stdin)
# Navigate dotted path
parts='$field'.strip('.').split('.')
val=d
for p in parts:
    if p.startswith('[') and p.endswith(']'):
        val=val[int(p[1:-1])]
    else:
        val=val.get(p)
    if val is None:
        break
print(val if val is not None else '__NULL__')
" 2>/dev/null || echo "__ERROR__")
    
    if [[ "$actual" == "$expected" ]]; then
        return 0
    else
        echo "  Field: $field"
        echo "  Expected: $expected"
        echo "  Actual:   $actual"
        return 1
    fi
}

assert_json_field_exists() {
    local json="$1"
    local field="$2"
    
    local exists
    exists=$(echo "$json" | python3 -c "
import json,sys
d=json.load(sys.stdin)
parts='$field'.strip('.').split('.')
val=d
for p in parts:
    if p.startswith('[') and p.endswith(']'):
        val=val[int(p[1:-1])]
    else:
        val=val.get(p) if isinstance(val,dict) else None
    if val is None:
        break
print('yes' if val is not None else 'no')
" 2>/dev/null || echo "no")
    
    if [[ "$exists" == "yes" ]]; then
        return 0
    else
        echo "  Field missing: $field"
        return 1
    fi
}

assert_json_field_type() {
    local json="$1"
    local field="$2"
    local expected_type="$3"
    
    local actual_type
    actual_type=$(echo "$json" | python3 -c "
import json,sys
d=json.load(sys.stdin)
parts='$field'.strip('.').split('.')
val=d
for p in parts:
    if p.startswith('[') and p.endswith(']'):
        val=val[int(p[1:-1])]
    else:
        val=val.get(p) if isinstance(val,dict) else None
    if val is None:
        break
if val is None:
    print('null')
elif isinstance(val, list):
    print('array')
elif isinstance(val, dict):
    print('object')
elif isinstance(val, bool):
    print('boolean')
elif isinstance(val, int):
    print('number')
elif isinstance(val, float):
    print('number')
elif isinstance(val, str):
    print('string')
else:
    print('unknown')
" 2>/dev/null || echo "null")
    
    if [[ "$actual_type" == "$expected_type" ]]; then
        return 0
    else
        echo "  Field: $field"
        echo "  Expected type: $expected_type"
        echo "  Actual type:   $actual_type"
        return 1
    fi
}

json_get() {
    local json="$1"
    local field="$2"
    
    echo "$json" | python3 -c "
import json,sys
d=json.load(sys.stdin)
parts='$field'.strip('.').split('.')
val=d
for p in parts:
    if p.startswith('[') and p.endswith(']'):
        val=val[int(p[1:-1])]
    else:
        val=val.get(p) if isinstance(val,dict) else None
    if val is None:
        break
print(val if val is not None else '')
" 2>/dev/null
}

json_array_len() {
    local json="$1"
    local field="$2"
    
    echo "$json" | python3 -c "
import json,sys
d=json.load(sys.stdin)
parts='$field'.strip('.').split('.')
val=d
for p in parts:
    if p:
        val=val.get(p) if isinstance(val,dict) else None
    if val is None:
        break
print(len(val) if isinstance(val, list) else 0)
" 2>/dev/null || echo "0"
}

run_test() {
    local test_name="$1"
    local test_func="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "  [$TESTS_RUN] $test_name... "
    
    if $test_func; then
        echo -e "${GREEN}✓ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# Unit Tests
# ═══════════════════════════════════════════════════════════════════════════

test_ci_flag_produces_json() {
    local output
    output=$("$TF" gate --ci 2>/dev/null || true)
    assert_json_valid "$output"
}

test_ci_json_schema_required_fields() {
    local output
    output=$("$TF" gate --ci 2>/dev/null || true)
    
    assert_json_field_exists "$output" "version" || return 1
    assert_json_field_exists "$output" "timestamp" || return 1
    assert_json_field_exists "$output" "status" || return 1
    assert_json_field_exists "$output" "checks" || return 1
    assert_json_field_exists "$output" "summary" || return 1
}

test_ci_json_schema_version() {
    local output
    output=$("$TF" gate --ci 2>/dev/null || true)
    assert_json_field "$output" "version" "1.0.0"
}

test_ci_json_schema_status_enum() {
    local output
    output=$("$TF" gate --ci 2>/dev/null || true)
    
    local status
    status=$(json_get "$output" "status")
    
    if [[ "$status" == "pass" ]] || [[ "$status" == "fail" ]] || [[ "$status" == "error" ]]; then
        return 0
    else
        echo "  Status '$status' not in [pass, fail, error]"
        return 1
    fi
}

test_ci_json_checks_array() {
    local output
    output=$("$TF" gate --ci 2>/dev/null || true)
    
    assert_json_field_type "$output" "checks" "array" || return 1
    
    local count
    count=$(json_array_len "$output" "checks")
    
    if [[ "$count" -ge 11 ]]; then
        return 0
    else
        echo "  Expected at least 11 checks, got $count"
        return 1
    fi
}

test_ci_json_summary_fields() {
    local output
    output=$("$TF" gate --ci 2>/dev/null || true)
    
    assert_json_field_exists "$output" "summary.total" || return 1
    assert_json_field_exists "$output" "summary.passed" || return 1
    assert_json_field_exists "$output" "summary.failed" || return 1
    assert_json_field_exists "$output" "summary.warnings" || return 1
    assert_json_field_exists "$output" "summary.skipped" || return 1
}

test_ci_json_check_structure() {
    local output
    output=$("$TF" gate --ci 2>/dev/null || true)
    
    # Check first item has required fields using Python
    echo "$output" | python3 -c "
import json,sys
d=json.load(sys.stdin)
c=d['checks'][0]
assert 'id' in c, 'missing id'
assert 'name' in c, 'missing name'
assert 'status' in c, 'missing status'
" 2>/dev/null || { echo "  First check missing required fields"; return 1; }
}

# ═══════════════════════════════════════════════════════════════════════════
# Integration Tests
# ═══════════════════════════════════════════════════════════════════════════

test_ci_exit_code_0_on_pass() {
    local exit_code=0
    "$TF" gate --ci >/dev/null 2>&1 || exit_code=$?
    
    local output
    output=$("$TF" gate --ci 2>/dev/null || true)
    local status
    status=$(json_get "$output" "status")
    
    if [[ "$status" == "pass" ]]; then
        assert_eq "0" "$exit_code" "Exit code should be 0 when status is pass"
    else
        # If status isn't pass, we can't test this reliably
        echo "  (skipped - current status is '$status')"
        return 0
    fi
}

test_ci_exit_code_reflects_status() {
    local output exit_code=0
    output=$("$TF" gate --ci 2>/dev/null) || exit_code=$?
    
    local status
    status=$(json_get "$output" "status")
    
    case "$status" in
        pass)
            assert_eq "0" "$exit_code" "pass should exit 0"
            ;;
        fail)
            assert_eq "1" "$exit_code" "fail should exit 1"
            ;;
        error)
            assert_eq "2" "$exit_code" "error should exit 2"
            ;;
        *)
            echo "  Unknown status: $status"
            return 1
            ;;
    esac
}

test_ci_warn_does_not_fail() {
    local output
    output=$("$TF" gate --ci 2>/dev/null || true)
    
    # Count warnings and failures using Python
    local counts
    counts=$(echo "$output" | python3 -c "
import json,sys
d=json.load(sys.stdin)
warns=len([c for c in d['checks'] if c['status']=='warn'])
fails=len([c for c in d['checks'] if c['status']=='fail'])
print(f'{warns} {fails}')
" 2>/dev/null || echo "0 0")
    
    local has_warn=$(echo "$counts" | cut -d' ' -f1)
    local has_fail=$(echo "$counts" | cut -d' ' -f2)
    
    if [[ "$has_warn" -gt 0 ]] && [[ "$has_fail" -eq 0 ]]; then
        # Has warnings but no failures - should still pass
        local status
        status=$(json_get "$output" "status")
        assert_eq "pass" "$status" "Status should be pass even with warnings"
    else
        echo "  (skipped - no warn-only state to test)"
        return 0
    fi
}

test_ci_full_flag_combines() {
    local output
    output=$("$TF" gate --ci --full 2>/dev/null || true)
    assert_json_valid "$output"
}

test_human_output_unchanged() {
    local output
    output=$("$TF" gate 2>&1 || true)
    
    # Human output should have ANSI escape codes and box drawing
    if echo "$output" | grep -q "Gate Z"; then
        return 0
    else
        echo "  Human output missing expected 'Gate Z' header"
        return 1
    fi
}

test_ci_no_ansi_codes() {
    local output
    output=$("$TF" gate --ci 2>/dev/null || true)
    
    # JSON output should NOT have ANSI escape codes
    if echo "$output" | grep -qE $'\x1b\['; then
        echo "  JSON output contains ANSI escape codes"
        return 1
    fi
    return 0
}

# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  Test Suite: tf gate --ci JSON output"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

echo "Unit Tests:"
run_test "CI flag produces valid JSON" test_ci_flag_produces_json
run_test "JSON has required fields" test_ci_json_schema_required_fields
run_test "JSON version is 1.0.0" test_ci_json_schema_version
run_test "JSON status is valid enum" test_ci_json_schema_status_enum
run_test "JSON checks is array with 11+ items" test_ci_json_checks_array
run_test "JSON summary has all fields" test_ci_json_summary_fields
run_test "JSON check has required structure" test_ci_json_check_structure

echo ""
echo "Integration Tests:"
run_test "Exit code 0 on pass" test_ci_exit_code_0_on_pass
run_test "Exit code reflects status" test_ci_exit_code_reflects_status
run_test "Warn status does not cause failure" test_ci_warn_does_not_fail
run_test "CI and full flags combine" test_ci_full_flag_combines
run_test "Human output unchanged" test_human_output_unchanged
run_test "CI output has no ANSI codes" test_ci_no_ansi_codes

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "  ${GREEN}✓ All tests passed${NC} ($TESTS_PASSED/$TESTS_RUN)"
else
    echo -e "  ${RED}✗ Tests failed${NC} ($TESTS_FAILED/$TESTS_RUN failed)"
fi
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

exit $TESTS_FAILED
