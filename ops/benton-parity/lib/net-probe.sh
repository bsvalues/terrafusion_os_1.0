#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# ops/benton-parity/lib/net-probe.sh — Network connectivity probing
# ═══════════════════════════════════════════════════════════════════════════════
# Probes outbound connectivity to all known dependency endpoints.
# Under deny-all, every failure becomes a network requirement.
# ═══════════════════════════════════════════════════════════════════════════════

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

NET_REQ_FILE="${EVIDENCE_DIR}/network-requirements.json"

# ── Endpoints to probe ─────────────────────────────────────────────────────────
# These are the known dependency endpoints. We probe each one.
# Format: "label|url|port|protocol|reason"
ENDPOINTS=(
  "GitHub API|api.github.com|443|https|CI/CD: Git operations, Actions API"
  "GitHub|github.com|443|https|CI/CD: Git clone, PR webhooks"
  "GitHub Packages|ghcr.io|443|https|Container registry for built images"
  "GitHub Codeload|codeload.github.com|443|https|CI/CD: Downloading repo archives"
  "GitHub Objects|objects.githubusercontent.com|443|https|CI/CD: Release assets, raw content"
  "npm Registry|registry.npmjs.org|443|https|Supply chain: JavaScript packages"
  "NuGet Registry|api.nuget.org|443|https|Supply chain: .NET packages"
  "NuGet Download|globalcdn.nuget.org|443|https|Supply chain: .NET package downloads"
  "pnpm Registry|registry.npmmirror.com|443|https|Supply chain: pnpm fallback mirror"
  "Node.js Dist|nodejs.org|443|https|Toolchain: Node.js downloads"
  "dotnet Install|dot.net|443|https|Toolchain: dotnet SDK downloads"
  "dotnet Feeds|dotnetcli.azureedge.net|443|https|Toolchain: dotnet SDK CDN"
  "Azure DevOps Feeds|pkgs.dev.azure.com|443|https|Supply chain: Azure DevOps NuGet feeds"
)

# ── Probe function ─────────────────────────────────────────────────────────────
probe_endpoint() {
  local label="$1" host="$2" port="$3" proto="$4" reason="$5"
  local result="UNKNOWN"
  local detail=""

  # Try curl first (most reliable)
  if command -v curl &>/dev/null; then
    local http_code
    http_code=$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time 10 \
      "${proto}://${host}" 2>/dev/null || echo "000")
    if [ "$http_code" = "000" ]; then
      result="DENIED"
      detail="curl: connection failed (timeout or blocked)"
    else
      result="ALLOWED"
      detail="curl: HTTP ${http_code}"
    fi
  # Fallback to nc (netcat)
  elif command -v nc &>/dev/null; then
    if nc -z -w 5 "$host" "$port" 2>/dev/null; then
      result="ALLOWED"
      detail="nc: port open"
    else
      result="DENIED"
      detail="nc: connection refused or timed out"
    fi
  # Fallback to bash /dev/tcp
  else
    if (echo >/dev/tcp/"$host"/"$port") 2>/dev/null; then
      result="ALLOWED"
      detail="/dev/tcp: port open"
    else
      result="DENIED"
      detail="/dev/tcp: connection failed"
    fi
  fi

  if [ "$result" = "DENIED" ]; then
    log_fail "NET  ${label} (${host}:${port}) — ${detail}"
    append_requirement "$NET_REQ_FILE" "network" \
      "${host}:${port}" \
      "${reason}" \
      "net-probe: ${proto}://${host}:${port}"
  else
    log_ok "NET  ${label} (${host}:${port}) — ${detail}"
  fi

  return 0  # Don't abort on failure — we're collecting requirements
}

# ── DNS probe ──────────────────────────────────────────────────────────────────
probe_dns() {
  local host="$1"
  if command -v dig &>/dev/null; then
    dig +short "$host" 2>/dev/null | head -1
  elif command -v nslookup &>/dev/null; then
    nslookup "$host" 2>/dev/null | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1
  elif command -v getent &>/dev/null; then
    getent hosts "$host" 2>/dev/null | awk '{print $1}' | head -1
  else
    echo "UNKNOWN"
  fi
}

# ── Main ───────────────────────────────────────────────────────────────────────
run_net_probe() {
  log_phase "NETWORK CONNECTIVITY PROBE"
  ensure_evidence_dir

  # Reset requirements file
  echo '[]' > "$NET_REQ_FILE"

  local total=${#ENDPOINTS[@]}
  local denied=0
  local allowed=0

  for endpoint in "${ENDPOINTS[@]}"; do
    IFS='|' read -r label host port proto reason <<< "$endpoint"
    probe_endpoint "$label" "$host" "$port" "$proto" "$reason"
    # Count
    local last_result
    last_result=$(tail -1 "$NET_REQ_FILE" 2>/dev/null || echo "")
    if echo "$last_result" | grep -q "$host" 2>/dev/null; then
      ((denied++)) || true
    else
      ((allowed++)) || true
    fi
  done

  echo ""
  log_info "Network probe complete: ${allowed} allowed, ${denied} denied out of ${total} endpoints"

  # Also probe DNS resolution
  log_info "DNS resolution check..."
  for endpoint in "${ENDPOINTS[@]}"; do
    IFS='|' read -r label host port proto reason <<< "$endpoint"
    local ip
    ip=$(probe_dns "$host")
    if [ -z "$ip" ] || [ "$ip" = "UNKNOWN" ]; then
      log_fail "DNS  ${host} — resolution failed"
      append_requirement "$NET_REQ_FILE" "dns" "$host" "DNS resolution required for ${reason}" "dns-probe"
    else
      log_ok "DNS  ${host} → ${ip}"
    fi
  done
}

# Execute if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_net_probe
fi
