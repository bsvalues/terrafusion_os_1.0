#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# ops/benton-parity/run-harness.sh — Full Benton Parity Harness orchestrator
# ═══════════════════════════════════════════════════════════════════════════════
#
# Usage:
#   ./run-harness.sh              # Run all probes (network, build, runtime, CI)
#   ./run-harness.sh --phase net  # Run only network probe
#   ./run-harness.sh --phase build
#   ./run-harness.sh --phase runtime
#   ./run-harness.sh --phase ci
#
# This script discovers requirements by running each probe and collecting
# failures into machine-readable JSON files under evidence/.
#
# After running, use evidence-pack.sh to generate the IT handoff document.
#
# ═══════════════════════════════════════════════════════════════════════════════

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

# ── Safety trap ────────────────────────────────────────────────────────────────
# On any exit (success, failure, signal), always write final metadata and
# snapshot deny log if in Benton Mode.
_harness_cleanup() {
  local exit_code=$?
  # Snapshot deny log if root + benton mode
  if is_benton_mode && [ "$(id -u 2>/dev/null || echo 1)" -eq 0 ]; then
    "$SCRIPT_DIR/benton-mode.sh" snapshot 2>/dev/null || true
  fi
  # Write provenance if evidence dir exists
  if [ -d "$EVIDENCE_DIR" ]; then
    write_provenance 2>/dev/null || true
  fi
  exit $exit_code
}
trap _harness_cleanup EXIT

# ── Parse args ─────────────────────────────────────────────────────────────────
PHASE="${2:-all}"
if [ "${1:-}" = "--phase" ]; then
  PHASE="$2"
fi

# ── Banner ─────────────────────────────────────────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║         BENTON PARITY HARNESS — Fail Fast Under Max Constraint      ║"
echo "╠═══════════════════════════════════════════════════════════════════════╣"
echo "║  Mode:    $(is_benton_mode && echo 'BENTON MODE (DENY ALL OUTBOUND)' || echo 'NORMAL (outbound allowed)')                        ║"
echo "║  Phase:   ${PHASE}                                                          ║"
echo "║  Host:    $(hostname)                                               ║"
echo "║  Time:    $(timestamp)                                    ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# ── Preflight ──────────────────────────────────────────────────────────────────
ensure_evidence_dir

# Record harness metadata
cat > "$EVIDENCE_DIR/harness-meta.json" <<METAEOF
{
  "harness_version": "${HARNESS_VERSION}",
  "started_at": "$(timestamp)",
  "hostname": "$(hostname)",
  "benton_mode": $(is_benton_mode && echo "true" || echo "false"),
  "phase": "${PHASE}",
  "kernel": "$(uname -r 2>/dev/null || echo 'unknown')",
  "arch": "$(uname -m 2>/dev/null || echo 'unknown')",
  "user": "$(whoami 2>/dev/null || echo 'unknown')"
}
METAEOF

# Warning if not in Benton Mode
if ! is_benton_mode; then
  log_warn "NOT in Benton Mode — results will show what works on an UNRESTRICTED host"
  log_warn "For deny-all discovery, run: sudo ./benton-mode.sh enable"
  log_warn "Or set BENTON_MODE=1 for simulation (non-root testing)"
  echo ""
fi

# ── Phase execution ────────────────────────────────────────────────────────────
OVERALL_EXIT=0

run_phase() {
  local phase_name="$1"
  local script="$2"
  local phase_exit=0

  if [ "$PHASE" != "all" ] && [ "$PHASE" != "$phase_name" ]; then
    return 0
  fi

  # Execute probe as subprocess (avoids SCRIPT_DIR conflicts when sourcing)
  bash "$script" || phase_exit=$?

  if [ $phase_exit -ne 0 ]; then
    OVERALL_EXIT=1
  fi
}

# Phase A1: Network connectivity
run_phase "net" "$SCRIPT_DIR/lib/net-probe.sh"

# Phase A2: Build / supply-chain
run_phase "build" "$SCRIPT_DIR/lib/build-probe.sh"

# Phase A3: Runtime / health-check
run_phase "runtime" "$SCRIPT_DIR/lib/runtime-probe.sh"

# Phase A4: CI PR-gate simulation
run_phase "ci" "$SCRIPT_DIR/lib/ci-probe.sh"

# ── Capture deny log snapshot (also done by trap, but explicit is nice) ─────
if is_benton_mode && [ "$(id -u)" -eq 0 ]; then
  log_phase "FIREWALL DENY LOG SNAPSHOT"
  "$SCRIPT_DIR/benton-mode.sh" snapshot
fi

# ── Summary ────────────────────────────────────────────────────────────────────
log_phase "HARNESS COMPLETE"

# Update metadata with provenance
cat > "$EVIDENCE_DIR/harness-meta.json" <<METAEOF2
{
  "harness_version": "${HARNESS_VERSION}",
  "started_at": "$(jq -r '.started_at' "$EVIDENCE_DIR/harness-meta.json" 2>/dev/null || echo 'unknown')",
  "completed_at": "$(timestamp)",
  "hostname": "$(hostname)",
  "benton_mode": $(is_benton_mode && echo "true" || echo "false"),
  "phase": "${PHASE}",
  "overall_result": "$([ $OVERALL_EXIT -eq 0 ] && echo 'PASS' || echo 'REQUIREMENTS_DISCOVERED')",
  "kernel": "$(uname -r 2>/dev/null || echo 'unknown')",
  "arch": "$(uname -m 2>/dev/null || echo 'unknown')",
  "user": "$(whoami 2>/dev/null || echo 'unknown')"
}
METAEOF2

# Count requirements per category
echo ""
log_info "Evidence files:"
for f in "$EVIDENCE_DIR"/*.json; do
  [ -f "$f" ] || continue
  local_name=$(basename "$f")
  if command -v jq &>/dev/null; then
    local_count=$(jq 'if type == "array" then length else 0 end' "$f" 2>/dev/null || echo "?")
    echo "  ${local_name}: ${local_count} entries"
  else
    echo "  ${local_name}: (install jq for counts)"
  fi
done

echo ""
if [ $OVERALL_EXIT -eq 0 ]; then
  log_ok "All probes passed — no additional requirements discovered"
  log_info "The environment satisfies all constraints"
else
  log_warn "Requirements discovered — review evidence/ directory"
  log_info "Next step: run ./evidence-pack.sh to generate IT handoff document"
fi

echo ""
log_info "Evidence directory: ${EVIDENCE_DIR}"
exit $OVERALL_EXIT
