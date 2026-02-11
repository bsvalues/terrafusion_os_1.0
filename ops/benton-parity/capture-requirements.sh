#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# ops/benton-parity/capture-requirements.sh — Convert deny logs → requirements
# ═══════════════════════════════════════════════════════════════════════════════
# Parses iptables deny logs (dmesg), build logs, and probe outputs into
# consolidated machine-readable requirement files.
#
# This is the "Phase A3: Convert failures into requirements" step.
# ═══════════════════════════════════════════════════════════════════════════════

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

CONSOLIDATED_FILE="${EVIDENCE_DIR}/all-requirements.json"

# ── Resolve IP → hostname ─────────────────────────────────────────────────────
resolve_ip() {
  local ip="$1"
  if command -v dig &>/dev/null; then
    dig +short -x "$ip" 2>/dev/null | head -1 | sed 's/\.$//' || echo ""
  elif command -v nslookup &>/dev/null; then
    nslookup "$ip" 2>/dev/null | grep "name = " | awk '{print $NF}' | sed 's/\.$//' | head -1 || echo ""
  elif command -v getent &>/dev/null; then
    getent hosts "$ip" 2>/dev/null | awk '{print $2}' | head -1 || echo ""
  else
    echo ""
  fi
}

# ── Parse firewall deny log ───────────────────────────────────────────────────
parse_deny_log() {
  log_info "Parsing firewall deny log..."

  local deny_log="${EVIDENCE_DIR}/deny.log"
  local net_req="${EVIDENCE_DIR}/network-requirements.json"

  # Get deny entries from dmesg if deny.log doesn't exist
  if [ ! -f "$deny_log" ]; then
    dmesg 2>/dev/null | grep "BENTON_DENY" > "$deny_log" 2>/dev/null || true
  fi

  if [ ! -s "$deny_log" ]; then
    log_info "No firewall deny entries found"
    return 0
  fi

  local count
  count=$(wc -l < "$deny_log")
  log_info "Processing ${count} deny entries..."

  # Extract unique DST:DPT pairs
  local pairs
  pairs=$(grep -oP 'DST=\K[0-9.]+' "$deny_log" | paste -d: - <(grep -oP 'DPT=\K[0-9]+' "$deny_log") | sort -u)

  # Ensure net requirements file exists
  [ -f "$net_req" ] || echo '[]' > "$net_req"

  while IFS=: read -r ip port; do
    [ -z "$ip" ] && continue
    local hostname
    hostname=$(resolve_ip "$ip")
    local display="${ip}:${port}"
    [ -n "$hostname" ] && display="${hostname} (${ip}):${port}"

    # Check if already in requirements
    if command -v jq &>/dev/null; then
      local already
      already=$(jq --arg k "${ip}:${port}" '[.[] | select(.key == $k)] | length' "$net_req" 2>/dev/null || echo "0")
      if [ "$already" -gt 0 ]; then
        continue
      fi
    fi

    append_requirement "$net_req" "firewall-deny" "${ip}:${port}" \
      "Outbound to ${display} was denied — requires allowlisting or mirror" \
      "iptables deny log"

    log_info "  DENY → ${display}"
  done <<< "$pairs"
}

# ── Parse build logs for additional requirements ──────────────────────────────
parse_build_logs() {
  log_info "Parsing build logs for additional requirements..."
  local build_log_dir="${EVIDENCE_DIR}/build-logs"
  local sc_req="${EVIDENCE_DIR}/supply-chain-requirements.json"

  [ -d "$build_log_dir" ] || return 0
  [ -f "$sc_req" ] || echo '[]' > "$sc_req"

  # Look for cert verification failures (common in corp environments)
  for log_file in "$build_log_dir"/*.log; do
    [ -f "$log_file" ] || continue
    local log_name
    log_name=$(basename "$log_file")

    # SSL/TLS certificate failures
    if grep -qi "SSL\|certificate\|CERTIFICATE_VERIFY_FAILED\|unable to get local issuer" "$log_file" 2>/dev/null; then
      log_warn "  ${log_name}: SSL certificate issue detected"
      append_requirement "$sc_req" "tls" "certificate-trust" \
        "TLS certificate verification failed — corporate CA bundle may be needed" \
        "build-log: ${log_name}"
    fi

    # Proxy-related failures
    if grep -qi "proxy\|ECONNREFUSED\|ERR_SOCKET_TIMEOUT" "$log_file" 2>/dev/null; then
      log_warn "  ${log_name}: Proxy/connection issue detected"
      append_requirement "$sc_req" "proxy" "proxy-config" \
        "Connection failures suggest proxy configuration may be needed" \
        "build-log: ${log_name}"
    fi

    # Disk space issues
    if grep -qi "ENOSPC\|No space left\|disk full" "$log_file" 2>/dev/null; then
      log_warn "  ${log_name}: Disk space issue detected"
      append_requirement "$sc_req" "infrastructure" "disk-space" \
        "Insufficient disk space during build" \
        "build-log: ${log_name}"
    fi

    # Permission issues
    if grep -qi "EACCES\|Permission denied\|Operation not permitted" "$log_file" 2>/dev/null; then
      log_warn "  ${log_name}: Permission issue detected"
      append_requirement "$sc_req" "infrastructure" "permissions" \
        "File permission issue during build" \
        "build-log: ${log_name}"
    fi
  done
}

# ── Consolidate all requirements ──────────────────────────────────────────────
consolidate() {
  log_info "Consolidating all requirements..."

  local files=(
    "${EVIDENCE_DIR}/network-requirements.json"
    "${EVIDENCE_DIR}/supply-chain-requirements.json"
    "${EVIDENCE_DIR}/secrets-requirements.json"
    "${EVIDENCE_DIR}/ports-requirements.json"
    "${EVIDENCE_DIR}/ci-requirements.json"
  )

  # First, convert any JSONL files to JSON arrays (for jq-less environments)
  for f in "${files[@]}"; do
    local jsonl="${f}.jsonl"
    if [ -f "$jsonl" ] && [ ! -f "$f" ]; then
      log_info "  Converting ${jsonl##*/} → ${f##*/}"
      jsonl_to_array "$jsonl" "$f"
    fi
  done

  if command -v jq &>/dev/null; then
    # Merge all JSON requirement arrays with jq
    local merged='[]'
    for f in "${files[@]}"; do
      if [ -f "$f" ]; then
        local category
        category=$(basename "$f" .json)
        merged=$(echo "$merged" | jq --slurpfile items "$f" --arg src "$category" \
          '. + ($items[0] // [] | map(. + {file: $src}))' 2>/dev/null || echo "$merged")
      fi
    done
    echo "$merged" | jq '.' > "$CONSOLIDATED_FILE"
  else
    # Fallback: merge JSON arrays manually (no jq)
    local all_jsonl="${EVIDENCE_DIR}/.all-tmp.jsonl"
    : > "$all_jsonl"
    for f in "${files[@]}"; do
      if [ -f "$f" ]; then
        # Extract entries from JSON array (skip [ and ])
        sed '1d;$d' "$f" | sed 's/^[[:space:]]*//;s/,$//' | grep -v '^$' >> "$all_jsonl" 2>/dev/null || true
      fi
    done
    # Convert merged JSONL to final array
    if [ -s "$all_jsonl" ]; then
      jsonl_to_array "$all_jsonl" "$CONSOLIDATED_FILE"
      rm -f "$all_jsonl"
    else
      echo '[]' > "$CONSOLIDATED_FILE"
    fi
  fi

  if command -v jq &>/dev/null && [ -f "$CONSOLIDATED_FILE" ]; then
    local total
    total=$(jq 'length' "$CONSOLIDATED_FILE" 2>/dev/null || echo "?")
    log_ok "Consolidated ${total} total requirements → ${CONSOLIDATED_FILE}"
  else
    # Count entries without jq (count lines with "timestamp")
    local total
    total=$(grep -c '"timestamp"' "$CONSOLIDATED_FILE" 2>/dev/null || echo "0")
    log_ok "Consolidated ${total} total requirements → ${CONSOLIDATED_FILE}"
  fi
}

# ── Main ───────────────────────────────────────────────────────────────────────
run_capture() {
  log_phase "REQUIREMENT CAPTURE"
  ensure_evidence_dir

  parse_deny_log
  parse_build_logs
  consolidate

  echo ""
  log_info "Capture complete. Run ./evidence-pack.sh to generate IT handoff."
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_capture
fi
