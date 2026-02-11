#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# ops/benton-parity/tests/requirements.test.sh — Unit tests for capture logic
# ═══════════════════════════════════════════════════════════════════════════════
#
# Tests the deterministic parsing logic in capture-requirements.sh:
#   1. DenyLogParse_ProducesHostPort
#   2. BuildErrorParse_NuGet_Npm_SSL_Proxy
#
# Does NOT require root — works with synthetic log data.
# Run:  bash ops/benton-parity/tests/requirements.test.sh
#
# Exit code 0 = all tests passed, non-zero = failures
# ═══════════════════════════════════════════════════════════════════════════════

set -Euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Point EVIDENCE_DIR to a temp directory so we don't pollute real evidence
TEST_TMPDIR="$(mktemp -d)"
export EVIDENCE_DIR="$TEST_TMPDIR"

# shellcheck source=../lib/common.sh
source "$HARNESS_DIR/lib/common.sh"

# Source capture-requirements.sh functions (it guards main behind BASH_SOURCE)
source "$HARNESS_DIR/capture-requirements.sh"

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

assert_contains() {
  local label="$1" haystack="$2" needle="$3"
  if echo "$haystack" | grep -qF "$needle"; then
    return 0
  else
    echo "    ASSERT FAILED: $label"
    echo "      expected to contain: $needle"
    echo "      actual: $haystack"
    return 1
  fi
}

assert_file_contains() {
  local label="$1" file="$2" pattern="$3"
  if [ ! -f "$file" ]; then
    echo "    ASSERT FAILED: $label — file not found: $file"
    return 1
  fi
  if grep -q "$pattern" "$file" 2>/dev/null; then
    return 0
  else
    echo "    ASSERT FAILED: $label"
    echo "      file: $file"
    echo "      expected pattern: $pattern"
    return 1
  fi
}

run_test() {
  local name="$1"
  shift
  TESTS_RUN=$((TESTS_RUN + 1))
  echo ""
  echo "── TEST: $name ──"

  # Reset evidence dir for each test
  rm -rf "$TEST_TMPDIR"/*

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

# ── Test 1: DenyLogParse_ProducesHostPort ─────────────────────────────────────
# Feed synthetic deny log entries, verify parse_deny_log extracts them into
# network-requirements.json with correct IP:port keys.
test_deny_log_parse() {
  # Create a synthetic deny log with known DST/DPT pairs
  local deny_log="${EVIDENCE_DIR}/deny.log"
  cat > "$deny_log" <<'DENYLOG'
[12345.678] BENTON_DENY: IN= OUT=eth0 SRC=10.0.0.5 DST=140.82.121.3 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=12345 DF PROTO=TCP SPT=45678 DPT=443 WINDOW=64240
[12345.679] BENTON_DENY: IN= OUT=eth0 SRC=10.0.0.5 DST=104.16.23.35 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=12346 DF PROTO=TCP SPT=45679 DPT=443 WINDOW=64240
[12345.680] BENTON_DENY: IN= OUT=eth0 SRC=10.0.0.5 DST=52.217.44.132 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=12347 DF PROTO=TCP SPT=45680 DPT=80 WINDOW=64240
[12345.681] BENTON_DENY: IN= OUT=eth0 SRC=10.0.0.5 DST=140.82.121.3 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=12348 DF PROTO=TCP SPT=45681 DPT=443 WINDOW=64240
DENYLOG

  # Run the parser (this calls parse_deny_log from capture-requirements.sh)
  parse_deny_log >/dev/null 2>&1

  local net_req="${EVIDENCE_DIR}/network-requirements.json"

  # Verify requirements file was created
  if [ ! -f "$net_req" ]; then
    echo "    network-requirements.json not created"
    return 1
  fi

  # Verify it's valid JSON
  if command -v jq &>/dev/null; then
    if ! jq empty "$net_req" 2>/dev/null; then
      echo "    network-requirements.json is not valid JSON"
      return 1
    fi

    # Should have 3 unique entries (140.82.121.3:443 appears twice but deduped)
    local count
    count=$(jq 'length' "$net_req" 2>/dev/null || echo "0")
    assert_eq "3 unique deny entries" "3" "$count" || return 1

    # Verify known IP:port pairs are present as keys
    assert_file_contains "has 140.82.121.3:443" "$net_req" "140.82.121.3:443" || return 1
    assert_file_contains "has 104.16.23.35:443" "$net_req" "104.16.23.35:443" || return 1
    assert_file_contains "has 52.217.44.132:80" "$net_req" "52.217.44.132:80" || return 1
  else
    # Without jq, just verify the file has content
    if [ ! -s "$net_req" ]; then
      echo "    network-requirements.json is empty (no jq for detailed check)"
      return 1
    fi
  fi

  return 0
}

# ── Test 2: BuildErrorParse_NuGet_Npm_SSL_Proxy ──────────────────────────────
# Feed synthetic build logs with SSL, proxy, NuGet, and npm errors.
# Verify parse_build_logs produces correct requirement categories.
test_build_error_parse() {
  local build_log_dir="${EVIDENCE_DIR}/build-logs"
  mkdir -p "$build_log_dir"

  # Create synthetic NuGet restore log with SSL error
  cat > "$build_log_dir/dotnet-restore.log" <<'NUGET_LOG'
  Determining projects to restore...
  /usr/share/dotnet/sdk/8.0.100/NuGet.targets(132,5): error : Unable to load the service index for source https://api.nuget.org/v3/index.json.
  /usr/share/dotnet/sdk/8.0.100/NuGet.targets(132,5): error :   The SSL connection could not be established, see inner exception.
  /usr/share/dotnet/sdk/8.0.100/NuGet.targets(132,5): error :   The remote certificate is invalid because of errors in the certificate chain: UntrustedRoot
NUGET_LOG

  # Create synthetic pnpm install log with proxy error
  cat > "$build_log_dir/pnpm-install.log" <<'PNPM_LOG'
 ERR_PNPM_FETCH  GET https://registry.npmjs.org/react/-/react-18.3.1.tgz: request to registry failed
 FetchError: request to https://registry.npmjs.org/react/-/react-18.3.1.tgz failed, reason: connect ECONNREFUSED 104.16.23.35:443
   at ClientRequest.<anonymous> (/usr/lib/node_modules/pnpm/dist/pnpm.cjs:1234:56)
   proxy connection refused
PNPM_LOG

  # Create synthetic log with disk space error
  cat > "$build_log_dir/build-output.log" <<'BUILD_LOG'
Build started...
/tmp/NuGetScratch/lock: No space left on device (ENOSPC)
Build failed.
BUILD_LOG

  # Create synthetic log with permission error
  cat > "$build_log_dir/permission-error.log" <<'PERM_LOG'
error: EACCES: permission denied, mkdir '/opt/runner/.cache'
PERM_LOG

  # Run the parser
  parse_build_logs >/dev/null 2>&1

  local sc_req="${EVIDENCE_DIR}/supply-chain-requirements.json"

  # Verify requirements file was created
  if [ ! -f "$sc_req" ]; then
    echo "    supply-chain-requirements.json not created"
    return 1
  fi

  if command -v jq &>/dev/null; then
    # Verify it's valid JSON
    if ! jq empty "$sc_req" 2>/dev/null; then
      echo "    supply-chain-requirements.json is not valid JSON"
      return 1
    fi

    # Should have at least 4 entries (SSL from nuget, proxy from pnpm, disk, permission)
    local count
    count=$(jq 'length' "$sc_req" 2>/dev/null || echo "0")
    if [ "$count" -lt 4 ]; then
      echo "    Expected at least 4 requirements, got $count"
      return 1
    fi

    # Verify SSL cert requirement was detected
    local has_tls
    has_tls=$(jq '[.[] | select(.category == "tls")] | length' "$sc_req" 2>/dev/null || echo "0")
    if [ "$has_tls" -lt 1 ]; then
      echo "    No TLS/certificate requirement detected"
      return 1
    fi

    # Verify proxy requirement was detected
    local has_proxy
    has_proxy=$(jq '[.[] | select(.category == "proxy")] | length' "$sc_req" 2>/dev/null || echo "0")
    if [ "$has_proxy" -lt 1 ]; then
      echo "    No proxy requirement detected"
      return 1
    fi

    # Verify disk space requirement was detected
    local has_disk
    has_disk=$(jq '[.[] | select(.key == "disk-space")] | length' "$sc_req" 2>/dev/null || echo "0")
    if [ "$has_disk" -lt 1 ]; then
      echo "    No disk-space requirement detected"
      return 1
    fi

    # Verify permission requirement was detected
    local has_perm
    has_perm=$(jq '[.[] | select(.key == "permissions")] | length' "$sc_req" 2>/dev/null || echo "0")
    if [ "$has_perm" -lt 1 ]; then
      echo "    No permissions requirement detected"
      return 1
    fi
  else
    if [ ! -s "$sc_req" ]; then
      echo "    supply-chain-requirements.json is empty (no jq for detailed check)"
      return 1
    fi
  fi

  return 0
}

# ── Test 3: Consolidate_MergesAll ─────────────────────────────────────────────
# Verify consolidate() merges multiple requirement files into one.
test_consolidate_merges() {
  # Create two requirement files
  echo '[{"key":"a","category":"net","value":"test-a","source":"test"}]' > "${EVIDENCE_DIR}/network-requirements.json"
  echo '[{"key":"b","category":"sc","value":"test-b","source":"test"}]' > "${EVIDENCE_DIR}/supply-chain-requirements.json"

  # Run consolidate
  consolidate >/dev/null 2>&1

  local consolidated="${EVIDENCE_DIR}/all-requirements.json"

  if [ ! -f "$consolidated" ]; then
    echo "    all-requirements.json not created"
    return 1
  fi

  if command -v jq &>/dev/null; then
    local count
    count=$(jq 'length' "$consolidated" 2>/dev/null || echo "0")
    if [ "$count" -lt 2 ]; then
      echo "    Expected at least 2 merged entries, got $count"
      return 1
    fi
  fi

  return 0
}

# ── Test 4: Provenance_HashesAreStable ────────────────────────────────────────
# Verify file_sha256 produces consistent hashes and write_provenance creates
# a valid JSON manifest.
test_provenance_hashes() {
  # Create a known file
  local test_file="${TEST_TMPDIR}/test-input.txt"
  echo "deterministic content" > "$test_file"

  # Hash it twice — must be identical
  local hash1 hash2
  hash1=$(file_sha256 "$test_file")
  hash2=$(file_sha256 "$test_file")

  assert_eq "hash is stable" "$hash1" "$hash2" || return 1

  # Hash must not be empty or the fallback
  if [ -z "$hash1" ] || [ "$hash1" = "NO_HASH_TOOL" ]; then
    echo "    No hash tool available — skipping hash value check"
    # Still pass; the function handles missing tools gracefully
  else
    # SHA-256 is 64 hex chars
    local hash_len=${#hash1}
    assert_eq "hash is 64 chars (SHA-256)" "64" "$hash_len" || return 1
  fi

  # Write provenance and verify JSON
  # Need a dummy evidence file so provenance has something to hash
  echo '[]' > "${EVIDENCE_DIR}/network-requirements.json"
  write_provenance >/dev/null 2>&1

  local prov_file="${EVIDENCE_DIR}/provenance.json"
  if [ ! -f "$prov_file" ]; then
    echo "    provenance.json not created"
    return 1
  fi

  if command -v jq &>/dev/null; then
    if ! jq empty "$prov_file" 2>/dev/null; then
      echo "    provenance.json is not valid JSON"
      return 1
    fi

    # Must have 'harness_version' field
    local ver
    ver=$(jq -r '.harness_version' "$prov_file" 2>/dev/null || echo "")
    assert_eq "provenance has version" "$HARNESS_VERSION" "$ver" || return 1

    # Must have 'scripts' object
    local has_scripts
    has_scripts=$(jq 'has("scripts")' "$prov_file" 2>/dev/null || echo "false")
    assert_eq "provenance has scripts" "true" "$has_scripts" || return 1
  fi

  return 0
}

# ── Test 5: JSONL_To_Array_Conversion ─────────────────────────────────────────
# Verify jsonl_to_array() converts JSONL format to JSON array correctly.
test_jsonl_to_array_conversion() {
  # Create a JSONL file (one JSON object per line)
  local jsonl_file="${TEST_TMPDIR}/test.jsonl"
  local array_file="${TEST_TMPDIR}/test.json"

  cat > "$jsonl_file" <<'JSONL'
{"timestamp":"2026-02-11T00:00:01Z","category":"firewall-deny","key":"1.2.3.4:443","value":"Test deny 1","source":"test"}
{"timestamp":"2026-02-11T00:00:02Z","category":"firewall-deny","key":"5.6.7.8:443","value":"Test deny 2","source":"test"}
{"timestamp":"2026-02-11T00:00:03Z","category":"supply-chain","key":"npm","value":"Test npm","source":"test"}
JSONL

  # Convert JSONL to JSON array
  jsonl_to_array "$jsonl_file" "$array_file"

  # Verify output file exists
  if [ ! -f "$array_file" ]; then
    echo "    JSON array file not created"
    return 1
  fi

  # Check it's valid JSON (if jq available)
  if command -v jq &>/dev/null; then
    if ! jq empty "$array_file" 2>/dev/null; then
      echo "    Output is not valid JSON"
      return 1
    fi

    # Verify it's an array with 3 entries
    local count
    count=$(jq 'length' "$array_file" 2>/dev/null || echo "0")
    assert_eq "array has 3 entries" "3" "$count" || return 1

    # Verify first entry has expected key
    local first_key
    first_key=$(jq -r '.[0].key' "$array_file" 2>/dev/null || echo "")
    assert_eq "first entry key" "1.2.3.4:443" "$first_key" || return 1
  else
    # Without jq, verify basic structure (starts with [, ends with ])
    local first_char last_char
    first_char=$(head -c 1 "$array_file")
    last_char=$(tail -c 2 "$array_file" | head -c 1)
    assert_eq "starts with [" "[" "$first_char" || return 1
    assert_eq "ends with ]" "]" "$last_char" || return 1

    # Count entries (lines with "timestamp")
    local count
    count=$(grep -c '"timestamp"' "$array_file" 2>/dev/null || echo "0")
    assert_eq "has 3 entries" "3" "$count" || return 1
  fi

  return 0
}

# ── Test 6: Consolidate_With_JSONL_Files ──────────────────────────────────────
# Verify consolidate() works when inputs are JSONL instead of JSON arrays.
test_consolidate_with_jsonl() {
  # Create JSONL requirement files (simulates no-jq environment)
  cat > "${EVIDENCE_DIR}/network-requirements.json.jsonl" <<'JSONL1'
{"timestamp":"2026-02-11T00:00:01Z","category":"firewall-deny","key":"1.2.3.4:443","value":"Test 1","source":"test"}
{"timestamp":"2026-02-11T00:00:02Z","category":"firewall-deny","key":"5.6.7.8:443","value":"Test 2","source":"test"}
JSONL1

  cat > "${EVIDENCE_DIR}/supply-chain-requirements.json.jsonl" <<'JSONL2'
{"timestamp":"2026-02-11T00:00:03Z","category":"npm","key":"registry.npmjs.org","value":"Test npm","source":"test"}
JSONL2

  # Run consolidate (should convert JSONL → JSON arrays)
  consolidate >/dev/null 2>&1

  # Verify individual files were converted
  local net_req="${EVIDENCE_DIR}/network-requirements.json"
  if [ ! -f "$net_req" ]; then
    echo "    network-requirements.json not created from JSONL"
    return 1
  fi

  # Verify consolidated output
  local consolidated="${EVIDENCE_DIR}/all-requirements.json"
  if [ ! -f "$consolidated" ]; then
    echo "    all-requirements.json not created"
    return 1
  fi

  # Count total requirements (with or without jq)
  local total
  if command -v jq &>/dev/null; then
    total=$(jq 'length' "$consolidated" 2>/dev/null || echo "0")
  else
    total=$(grep -c '"timestamp"' "$consolidated" 2>/dev/null || echo "0")
  fi

  if [ "$total" -lt 3 ]; then
    echo "    Expected at least 3 consolidated entries, got $total"
    return 1
  fi

  return 0
}

# ── Cleanup ────────────────────────────────────────────────────────────────────
cleanup() {
  rm -rf "$TEST_TMPDIR"
}
trap cleanup EXIT

# ── Main ───────────────────────────────────────────────────────────────────────
main() {
  echo "═══════════════════════════════════════════════════════════════════════"
  echo "  Requirements Parser Tests — $(timestamp)"
  echo "  Temp dir: $TEST_TMPDIR"
  echo "═══════════════════════════════════════════════════════════════════════"

  run_test "DenyLogParse_ProducesHostPort"       test_deny_log_parse
  run_test "BuildErrorParse_NuGet_Npm_SSL_Proxy" test_build_error_parse
  run_test "Consolidate_MergesAll"               test_consolidate_merges
  run_test "Provenance_HashesAreStable"          test_provenance_hashes
  run_test "JSONL_To_Array_Conversion"           test_jsonl_to_array_conversion
  run_test "Consolidate_With_JSONL_Files"        test_consolidate_with_jsonl

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
