#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# ops/benton-parity/benton-mode.sh — DENY-ALL outbound toggle
# ═══════════════════════════════════════════════════════════════════════════════
#
# Usage:
#   sudo ./benton-mode.sh enable    # Block all outbound, enable logging
#   sudo ./benton-mode.sh disable   # Remove all restrictions
#   sudo ./benton-mode.sh status    # Show current state
#
# Requires: root (iptables manipulation)
#
# What it does:
#   1. Creates a custom iptables chain BENTON_DENY_ALL
#   2. Allows: loopback, established/related, DNS to localhost (for host resolution)
#   3. Logs + drops everything else outbound
#   4. Every denied packet is logged with prefix "BENTON_DENY: " for parsing
#
# What it does NOT do:
#   - No proxy setup (that's Phase B, only after requirements are known)
#   - No allowlisting (that's derived from evidence, not guessed)
#
# ═══════════════════════════════════════════════════════════════════════════════

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

CHAIN_NAME="BENTON_DENY_ALL"
LOG_PREFIX="BENTON_DENY: "
# Rate-limit logging to avoid log flood (max 10/sec with burst of 20)
LOG_RATE="10/sec"
LOG_BURST="20"

# ── Preflight ──────────────────────────────────────────────────────────────────
require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    log_fail "This script must be run as root (sudo)."
    exit 1
  fi
}

require_iptables() {
  if ! command -v iptables &>/dev/null; then
    log_fail "iptables not found. Install: apt-get install iptables"
    exit 1
  fi
}

# ── Safety trap ────────────────────────────────────────────────────────────────
# If enable crashes partway through, auto-disable to avoid leaving firewall
# in a broken half-applied state.
_benton_enable_in_progress=false
_benton_cleanup() {
  if [ "$_benton_enable_in_progress" = true ]; then
    echo ""
    log_warn "SAFETY TRAP: enable interrupted — auto-disabling to restore firewall"
    disable_benton_mode_quiet
    log_ok "Firewall restored to pre-enable state"
  fi
}
trap _benton_cleanup EXIT

# ── Enable ─────────────────────────────────────────────────────────────────────
enable_benton_mode() {
  require_root
  require_iptables

  log_phase "ENABLING BENTON MODE (DENY ALL OUTBOUND)"

  # Snapshot current iptables state BEFORE any changes
  snapshot_iptables

  _benton_enable_in_progress=true

  # Idempotent: remove existing chain first if present
  if iptables -L "$CHAIN_NAME" -n &>/dev/null 2>&1; then
    log_warn "Benton Mode already active — re-applying rules"
    disable_benton_mode_quiet
  fi

  # Create the chain
  iptables -N "$CHAIN_NAME"

  # ── Rules (order matters) ─────────────────────────────────────────────────

  # 1. Allow loopback (always)
  iptables -A "$CHAIN_NAME" -o lo -j ACCEPT

  # 2. Allow established/related (responses to inbound connections)
  iptables -A "$CHAIN_NAME" -m state --state ESTABLISHED,RELATED -j ACCEPT

  # 3. Allow ICMP to localhost only (ping self for health checks)
  iptables -A "$CHAIN_NAME" -d 127.0.0.0/8 -p icmp -j ACCEPT

  # 4. Allow internal network (same subnet — services talking to each other)
  #    Using RFC1918 ranges for local-only communication
  iptables -A "$CHAIN_NAME" -d 10.0.0.0/8 -j ACCEPT
  iptables -A "$CHAIN_NAME" -d 172.16.0.0/12 -j ACCEPT
  iptables -A "$CHAIN_NAME" -d 192.168.0.0/16 -j ACCEPT

  # 5. LOG everything else (rate-limited to prevent log flood)
  iptables -A "$CHAIN_NAME" -m limit --limit "$LOG_RATE" --limit-burst "$LOG_BURST" \
    -j LOG --log-prefix "$LOG_PREFIX" --log-level 4

  # 6. DROP everything else
  iptables -A "$CHAIN_NAME" -j DROP

  # ── Insert into OUTPUT chain ──────────────────────────────────────────────
  iptables -I OUTPUT 1 -j "$CHAIN_NAME"

  # ── Persist deny log marker ──────────────────────────────────────────────
  ensure_evidence_dir
  echo "$(timestamp) BENTON_MODE=ENABLED" >> "$EVIDENCE_DIR/mode-transitions.log"

  # ── Flush kernel log mark ────────────────────────────────────────────────
  # Write a marker to dmesg so we know where Benton Mode started
  if command -v logger &>/dev/null; then
    logger -t BENTON_PARITY "Benton Mode ENABLED at $(timestamp)"
  fi

  # Mark enable complete — trap will no longer auto-disable
  _benton_enable_in_progress=false

  log_ok "Benton Mode ENABLED"
  log_info "All outbound traffic is now DENIED + LOGGED"
  log_info "Internal RFC1918 traffic is allowed (service-to-service)"
  log_info "Snapshot saved: $SNAPSHOT_FILE"
  log_info "Run 'dmesg | grep BENTON_DENY' to see denied connections"
  log_info "Run '$0 status' to verify"
}

# ── Disable ────────────────────────────────────────────────────────────────────
disable_benton_mode() {
  require_root
  require_iptables

  log_phase "DISABLING BENTON MODE"

  # Snapshot deny log before disable (capture everything)
  snapshot_deny_log 2>/dev/null || true

  disable_benton_mode_quiet

  # Verify firewall is actually restored
  if iptables -L "$CHAIN_NAME" -n &>/dev/null 2>&1; then
    log_fail "BENTON_DENY_ALL chain still exists after disable — manual cleanup needed"
    log_fail "Run: sudo iptables -D OUTPUT -j BENTON_DENY_ALL; sudo iptables -F BENTON_DENY_ALL; sudo iptables -X BENTON_DENY_ALL"
  fi

  ensure_evidence_dir
  echo "$(timestamp) BENTON_MODE=DISABLED" >> "$EVIDENCE_DIR/mode-transitions.log"

  if command -v logger &>/dev/null; then
    logger -t BENTON_PARITY "Benton Mode DISABLED at $(timestamp)"
  fi

  log_ok "Benton Mode DISABLED — normal outbound restored"
}

disable_benton_mode_quiet() {
  # Remove from OUTPUT chain
  while iptables -D OUTPUT -j "$CHAIN_NAME" 2>/dev/null; do :; done

  # Flush and delete the chain
  iptables -F "$CHAIN_NAME" 2>/dev/null || true
  iptables -X "$CHAIN_NAME" 2>/dev/null || true
}

# ── Status ─────────────────────────────────────────────────────────────────────
show_status() {
  require_iptables

  echo ""
  if iptables -L "$CHAIN_NAME" -n &>/dev/null 2>&1; then
    log_ok "Benton Mode is ACTIVE"
    echo ""
    echo "Chain rules:"
    iptables -L "$CHAIN_NAME" -n -v --line-numbers 2>/dev/null || true
    echo ""
    echo "Recent denies (last 10):"
    dmesg 2>/dev/null | grep "BENTON_DENY" | tail -10 || echo "  (none)"
    echo ""
    # Count unique destinations denied
    local denied_count
    denied_count=$(dmesg 2>/dev/null | grep -c "BENTON_DENY" || echo "0")
    log_info "Total denied packets (this boot): $denied_count"
  else
    log_warn "Benton Mode is INACTIVE"
  fi
  echo ""
}

# ── Snapshot deny log ──────────────────────────────────────────────────────────
# Capture current dmesg deny entries into evidence file
snapshot_deny_log() {
  ensure_evidence_dir
  local snapshot_file="${EVIDENCE_DIR}/deny.log"
  dmesg 2>/dev/null | grep "BENTON_DENY" > "$snapshot_file" || true
  local count
  count=$(wc -l < "$snapshot_file" 2>/dev/null || echo "0")
  log_info "Snapshot: $count deny entries → $snapshot_file"
}

# ── Main ───────────────────────────────────────────────────────────────────────
case "${1:-help}" in
  enable)
    enable_benton_mode
    ;;
  disable)
    disable_benton_mode
    ;;
  status)
    show_status
    ;;
  snapshot)
    snapshot_deny_log
    ;;
  help|--help|-h)
    echo "Usage: $0 {enable|disable|status|snapshot}"
    echo ""
    echo "  enable   — Block all outbound traffic + enable deny logging"
    echo "  disable  — Remove all restrictions, restore normal networking"
    echo "  status   — Show current Benton Mode state + recent denies"
    echo "  snapshot — Capture current deny log to evidence/deny.log"
    ;;
  *)
    log_fail "Unknown command: $1"
    echo "Usage: $0 {enable|disable|status|snapshot}"
    exit 1
    ;;
esac
