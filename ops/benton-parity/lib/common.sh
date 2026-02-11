#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# ops/benton-parity/lib/common.sh — Shared functions for the Benton Parity Harness
# ═══════════════════════════════════════════════════════════════════════════════

set -Eeuo pipefail

# ── Harness Version ────────────────────────────────────────────────────────────
HARNESS_VERSION="1.1.0"

# ── Paths ──────────────────────────────────────────────────────────────────────
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$HARNESS_DIR/../.." && pwd)"
EVIDENCE_DIR="${HARNESS_DIR}/evidence"
DENY_LOG="${EVIDENCE_DIR}/deny.log"
SNAPSHOT_FILE="${EVIDENCE_DIR}/iptables-snapshot.txt"

# ── Colors ─────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Logging ────────────────────────────────────────────────────────────────────
log_info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_fail()  { echo -e "${RED}[FAIL]${NC}  $*"; }
log_phase() { echo -e "\n${BOLD}═══ $* ═══${NC}\n"; }

# ── Evidence directory ─────────────────────────────────────────────────────────
ensure_evidence_dir() {
  # If baseline evidence exists, archive it before overwriting
  if [ -f "$EVIDENCE_DIR/provenance.json" ] && [ "${OVERWRITE_BASELINE:-}" != "1" ]; then
    local ts
    ts=$(date +%Y%m%d-%H%M%S)
    local archive_dir="${HARNESS_DIR}/evidence-archive"
    local archive_name="baseline-${ts}"
    
    mkdir -p "$archive_dir"
    
    log_warn "Existing baseline detected. Archiving to: ${archive_dir}/${archive_name}/"
    mv "$EVIDENCE_DIR" "${archive_dir}/${archive_name}"
    log_ok "Baseline archived. Proceeding with new run."
  fi
  
  mkdir -p "$EVIDENCE_DIR"
}

# ── Timestamp ──────────────────────────────────────────────────────────────────
timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# ── JSON helpers ───────────────────────────────────────────────────────────────
# Convert JSONL file to JSON array (no jq required)
jsonl_to_array() {
  local jsonl_file="$1" array_file="$2"
  if [ ! -f "$jsonl_file" ] || [ ! -s "$jsonl_file" ]; then
    echo '[]' > "$array_file"
    return 0
  fi

  # Build JSON array from JSONL lines
  {
    echo '['
    local first=true
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      if [ "$first" = true ]; then
        first=false
        echo "  $line"
      else
        echo ","
        echo "  $line"
      fi
    done < "$jsonl_file"
    echo ''
    echo ']'
  } > "$array_file"
}

# Append a requirement to a JSON array file.
# Usage: append_requirement <file> <category> <key> <value> <source>
append_requirement() {
  local file="$1" category="$2" key="$3" value="$4" source="$5"
  ensure_evidence_dir
  local ts
  ts="$(timestamp)"

  # Create file with empty array if missing
  if [ ! -f "$file" ]; then
    echo '[]' > "$file"
  fi

  # Use a temp file to avoid broken pipes
  local tmp="${file}.tmp"
  local entry
  entry=$(cat <<ENTRY_EOF
{"timestamp":"${ts}","category":"${category}","key":"${key}","value":"${value}","source":"${source}"}
ENTRY_EOF
)

  # If jq is available, use it; otherwise simple append
  if command -v jq &>/dev/null; then
    jq --argjson entry "$entry" '. += [$entry]' "$file" > "$tmp" && mv "$tmp" "$file"
  else
    # Fallback: simple line-based append (valid JSONL, converted later)
    echo "$entry" >> "${file}.jsonl"
  fi
}

# ── Benton Mode detection ─────────────────────────────────────────────────────
is_benton_mode() {
  # Check if the BENTON_DENY_ALL iptables chain exists
  if command -v iptables &>/dev/null; then
    iptables -L BENTON_DENY_ALL -n &>/dev/null 2>&1 && return 0
  fi
  # Also check env var override (for CI or non-root testing)
  [ "${BENTON_MODE:-}" = "1" ] && return 0
  return 1
}

# ── Snapshot / Restore ─────────────────────────────────────────────────────────
# Save current iptables OUTPUT chain state before enable (for safe restore)
snapshot_iptables() {
  ensure_evidence_dir
  if command -v iptables-save &>/dev/null; then
    iptables-save -t filter > "$SNAPSHOT_FILE" 2>/dev/null || true
    log_info "iptables snapshot saved → $SNAPSHOT_FILE"
  fi
}

# Verify snapshot file integrity (exists + non-empty + parseable)
verify_snapshot() {
  if [ ! -f "$SNAPSHOT_FILE" ]; then
    log_warn "No iptables snapshot found (first run?)"
    return 1
  fi
  if [ ! -s "$SNAPSHOT_FILE" ]; then
    log_warn "iptables snapshot is empty"
    return 1
  fi
  # Check it looks like iptables-save output
  if ! head -1 "$SNAPSHOT_FILE" | grep -qE '^(#|\*filter)'; then
    log_warn "iptables snapshot does not look valid"
    return 1
  fi
  log_ok "iptables snapshot verified"
  return 0
}

# ── Provenance hash ────────────────────────────────────────────────────────────
# Compute SHA-256 of a file for evidence provenance
file_sha256() {
  local file="$1"
  if command -v sha256sum &>/dev/null; then
    sha256sum "$file" 2>/dev/null | awk '{print $1}'
  elif command -v shasum &>/dev/null; then
    shasum -a 256 "$file" 2>/dev/null | awk '{print $1}'
  else
    echo "NO_HASH_TOOL"
  fi
}

# Write provenance manifest (hashes of all evidence inputs + scripts)
write_provenance() {
  ensure_evidence_dir
  local prov_file="${EVIDENCE_DIR}/provenance.json"
  local ts
  ts="$(timestamp)"
  {
    echo '{'
    echo '  "generated_at": "'"$ts"'",'
    echo '  "harness_version": "'"$HARNESS_VERSION"'",'
    echo '  "scripts": {'
    local first=true
    for script in "${HARNESS_DIR}"/*.sh "${HARNESS_DIR}"/lib/*.sh; do
      [ -f "$script" ] || continue
      local name
      name=$(basename "$script")
      local hash
      hash=$(file_sha256 "$script")
      if [ "$first" = true ]; then
        first=false
      else
        echo ','
      fi
      printf '    "%s": "%s"' "$name" "$hash"
    done
    echo ''
    echo '  },'
    echo '  "evidence_inputs": {'
    first=true
    for efile in "${EVIDENCE_DIR}"/*.json "${EVIDENCE_DIR}"/*.log; do
      [ -f "$efile" ] || continue
      local ename
      ename=$(basename "$efile")
      # Skip provenance file itself
      [ "$ename" = "provenance.json" ] && continue
      local ehash
      ehash=$(file_sha256 "$efile")
      if [ "$first" = true ]; then
        first=false
      else
        echo ','
      fi
      printf '    "%s": "%s"' "$ename" "$ehash"
    done
    echo ''
    echo '  }'
    echo '}'
  } > "$prov_file"
  log_ok "Provenance manifest written → $prov_file"
}

# ── Probe wrapper ──────────────────────────────────────────────────────────────
# Run a command and capture success/failure + output
# Usage: probe_cmd <label> <requirement_file> <category> <command...>
probe_cmd() {
  local label="$1"; shift
  local req_file="$1"; shift
  local category="$1"; shift
  local cmd_str="$*"

  local output
  local exit_code=0

  output=$("$@" 2>&1) || exit_code=$?

  if [ $exit_code -eq 0 ]; then
    log_ok "$label"
  else
    log_fail "$label"
    # Record the requirement
    append_requirement "$req_file" "$category" "$label" "$output" "$cmd_str"
  fi

  return $exit_code
}

# ── Firewall log parser ───────────────────────────────────────────────────────
# Extract unique denied destinations from kernel log / dmesg
extract_denied_destinations() {
  local log_source="${1:-dmesg}"
  if [ "$log_source" = "dmesg" ]; then
    dmesg 2>/dev/null | grep "BENTON_DENY" | \
      grep -oP 'DST=\K[0-9.]+' | sort -u
  elif [ -f "$log_source" ]; then
    grep "BENTON_DENY" "$log_source" | \
      grep -oP 'DST=\K[0-9.]+' | sort -u
  fi
}

# Extract unique denied ports
extract_denied_ports() {
  local log_source="${1:-dmesg}"
  if [ "$log_source" = "dmesg" ]; then
    dmesg 2>/dev/null | grep "BENTON_DENY" | \
      grep -oP 'DPT=\K[0-9]+' | sort -un
  elif [ -f "$log_source" ]; then
    grep "BENTON_DENY" "$log_source" | \
      grep -oP 'DPT=\K[0-9]+' | sort -un
  fi
}
