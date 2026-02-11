#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# ops/benton-parity/tests/benton-mode.test.sh — Unit tests for benton-mode.sh
# ═══════════════════════════════════════════════════════════════════════════════
#
# Tests:
#   1. EnableDisable_RoundTrip_RestoresFirewall
#   2. Snapshot_Restore_Works
#   3. Idempotent_EnableDisable
#
# Requires: root (iptables), Linux kernel with iptables support
# Run:  sudo bash ops/benton-parity/tests/benton-mode.test.sh
#
# Exit code 0 = all tests passed, non-zero = failures
# ═══════════════════════════════════════════════════════════════════════════════

set -Euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BENTON_MODE_SH="${HARNESS_DIR}/benton-mode.sh"

# shellcheck source=../lib/common.sh
source "$HARNESS_DIR/lib/common.sh"

# ── Test framework ─────────────────────────────────────────────────────────────
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    return 0
  else
    echo "    ASSERT FAILED: $label"
    echo "      expected: $expected"
    echo "      actual:   $actual"
    return 1
  fi
}

run_test() {
  local name="$1"
  shift
  TESTS_RUN=$((TESTS_RUN + 1))
  echo ""
  echo "── TEST: $name ──"

  local rc=0
  "$@" || rc=$?

  if [ $rc -eq 0 ]; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "  ✅ PASS: $name"
  else
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILURES+=("$name")
    echo "  ❌ FAIL: $name"
  fi
}

# ── Preflight ──────────────────────────────────────────────────────────────────
preflight() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "ERROR: Tests require root (iptables manipulation)."
    echo "Run: sudo bash $0"
    exit 2
  fi

  if ! command -v iptables &>/dev/null; then
    echo "ERROR: iptables not found."
    exit 2
  fi

  # Ensure chain does NOT exist at test start (clean slate)
  if iptables -L BENTON_DENY_ALL -n &>/dev/null 2>&1; then
    echo "WARN: BENTON_DENY_ALL chain exists before tests — cleaning up"
    "$BENTON_MODE_SH" disable 2>/dev/null || true
  fi
}

# ── Helpers ────────────────────────────────────────────────────────────────────
chain_exists() {
  iptables -L BENTON_DENY_ALL -n &>/dev/null 2>&1
}

chain_in_output() {
  iptables -L OUTPUT -n 2>/dev/null | grep -q BENTON_DENY_ALL
}

# ── Test 1: EnableDisable_RoundTrip_RestoresFirewall ──────────────────────────
# Enable Benton Mode, verify it's active, disable it, verify firewall is
# restored to clean state.
test_enable_disable_roundtrip() {
  # Pre-condition: chain must not exist
  if chain_exists; then
    echo "    Pre-condition failed: chain already exists"
    return 1
  fi

  # Snapshot OUTPUT chain rule count before enable
  local before_count
  before_count=$(iptables -L OUTPUT -n --line-numbers 2>/dev/null | wc -l)

  # Enable Benton Mode
  "$BENTON_MODE_SH" enable >/dev/null 2>&1

  # Verify chain exists
  if ! chain_exists; then
    echo "    Chain not created after enable"
    return 1
  fi

  # Verify chain is in OUTPUT
  if ! chain_in_output; then
    echo "    Chain not inserted into OUTPUT"
    return 1
  fi

  # Verify DROP rule exists in chain
  if ! iptables -L BENTON_DENY_ALL -n 2>/dev/null | grep -q "DROP"; then
    echo "    DROP rule missing from chain"
    return 1
  fi

  # Disable Benton Mode
  "$BENTON_MODE_SH" disable >/dev/null 2>&1

  # Verify chain is gone
  if chain_exists; then
    echo "    Chain still exists after disable"
    return 1
  fi

  # Verify OUTPUT chain is restored (same rule count as before)
  local after_count
  after_count=$(iptables -L OUTPUT -n --line-numbers 2>/dev/null | wc -l)
  assert_eq "OUTPUT rule count restored" "$before_count" "$after_count" || return 1

  return 0
}

# ── Test 2: Snapshot_Restore_Works ────────────────────────────────────────────
# Enable creates a snapshot; snapshot file is valid and non-empty.
test_snapshot_restore() {
  # Clean state
  "$BENTON_MODE_SH" disable >/dev/null 2>&1 || true

  # Remove any existing snapshot
  rm -f "$SNAPSHOT_FILE"

  # Enable — should create snapshot
  "$BENTON_MODE_SH" enable >/dev/null 2>&1

  # Verify snapshot file was created
  if [ ! -f "$SNAPSHOT_FILE" ]; then
    echo "    Snapshot file not created after enable"
    "$BENTON_MODE_SH" disable >/dev/null 2>&1 || true
    return 1
  fi

  # Verify snapshot is non-empty
  if [ ! -s "$SNAPSHOT_FILE" ]; then
    echo "    Snapshot file is empty"
    "$BENTON_MODE_SH" disable >/dev/null 2>&1 || true
    return 1
  fi

  # Verify verify_snapshot passes
  if ! verify_snapshot >/dev/null 2>&1; then
    echo "    verify_snapshot() failed on valid snapshot"
    "$BENTON_MODE_SH" disable >/dev/null 2>&1 || true
    return 1
  fi

  # Clean up
  "$BENTON_MODE_SH" disable >/dev/null 2>&1

  return 0
}

# ── Test 3: Idempotent_EnableDisable ──────────────────────────────────────────
# Enable twice should not error; disable twice should not error.
test_idempotent_enable_disable() {
  # Clean state
  "$BENTON_MODE_SH" disable >/dev/null 2>&1 || true

  # Enable once
  "$BENTON_MODE_SH" enable >/dev/null 2>&1
  if ! chain_exists; then
    echo "    First enable failed"
    return 1
  fi

  # Enable again (should handle gracefully, not error)
  local rc=0
  "$BENTON_MODE_SH" enable >/dev/null 2>&1 || rc=$?
  if [ $rc -ne 0 ]; then
    echo "    Second enable returned error: $rc"
    "$BENTON_MODE_SH" disable >/dev/null 2>&1 || true
    return 1
  fi

  # Chain should still exist and be valid
  if ! chain_exists; then
    echo "    Chain missing after idempotent enable"
    return 1
  fi

  # Verify only one DROP rule (not duplicated)
  local drop_count
  drop_count=$(iptables -L BENTON_DENY_ALL -n 2>/dev/null | grep -c "DROP" || echo "0")
  assert_eq "Exactly one DROP rule" "1" "$drop_count" || {
    "$BENTON_MODE_SH" disable >/dev/null 2>&1 || true
    return 1
  }

  # Disable once
  "$BENTON_MODE_SH" disable >/dev/null 2>&1
  if chain_exists; then
    echo "    Chain still exists after first disable"
    return 1
  fi

  # Disable again (should not error on clean state)
  rc=0
  "$BENTON_MODE_SH" disable >/dev/null 2>&1 || rc=$?
  if [ $rc -ne 0 ]; then
    echo "    Second disable returned error: $rc"
    return 1
  fi

  return 0
}

# ── Main ───────────────────────────────────────────────────────────────────────
main() {
  echo "═══════════════════════════════════════════════════════════════════════"
  echo "  Benton Mode Tests — $(timestamp)"
  echo "═══════════════════════════════════════════════════════════════════════"

  preflight

  run_test "EnableDisable_RoundTrip_RestoresFirewall" test_enable_disable_roundtrip
  run_test "Snapshot_Restore_Works"                    test_snapshot_restore
  run_test "Idempotent_EnableDisable"                  test_idempotent_enable_disable

  # ── Final cleanup ──────────────────────────────────────────────────────────
  "$BENTON_MODE_SH" disable >/dev/null 2>&1 || true

  # ── Summary ────────────────────────────────────────────────────────────────
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════"
  echo "  Results: ${TESTS_PASSED}/${TESTS_RUN} passed, ${TESTS_FAILED} failed"
  echo "═══════════════════════════════════════════════════════════════════════"

  if [ ${#FAILURES[@]} -gt 0 ]; then
    echo "  Failed tests:"
    for f in "${FAILURES[@]}"; do
      echo "    - $f"
    done
  fi

  echo ""
  exit "$TESTS_FAILED"
}

main
