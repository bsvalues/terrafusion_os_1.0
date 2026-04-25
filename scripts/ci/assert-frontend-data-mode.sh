#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# assert-frontend-data-mode.sh
#
# CI guardrail: block accidental non-live data mode unless explicitly allowed.
#
# Rules:
#   1. VITE_DATA_MODE=snapshot|fixtures requires VITE_ALLOW_NON_LIVE_MODE=1
#   2. main branch NEVER allows non-live mode (strict policy for protected refs)
#   3. Unknown VITE_DATA_MODE values are treated as live (safe fallback)
#
# Usage:
#   ./scripts/ci/assert-frontend-data-mode.sh
#
# Exit codes:
#   0  Guard passed
#   1  Guard failed (non-live mode without allow flag, or main branch policy)
# -----------------------------------------------------------------------------

set -euo pipefail

MODE="${VITE_DATA_MODE:-}"
ALLOW="${VITE_ALLOW_NON_LIVE_MODE:-}"
REF="${GITHUB_REF_NAME:-}"

NON_LIVE_MODES=("snapshot" "fixtures")

is_non_live() {
  local m="$1"
  for nm in "${NON_LIVE_MODES[@]}"; do
    [[ "$m" == "$nm" ]] && return 0
  done
  return 1
}

# -- Main branch policy -------------------------------------------------------

if [[ -n "$REF" && "$REF" == "main" ]] && is_non_live "$MODE"; then
  echo "❌ CI guard failed: main branch forbids non-live data mode"
  echo "   VITE_DATA_MODE=${MODE}"
  echo "   GITHUB_REF_NAME=${REF}"
  echo "   Non-live modes (snapshot/fixtures) must never reach main CI."
  exit 1
fi

# -- Allow-flag gate ----------------------------------------------------------

if is_non_live "$MODE"; then
  if [[ "$ALLOW" != "1" ]]; then
    echo "❌ CI guard failed: VITE_DATA_MODE=${MODE} requires VITE_ALLOW_NON_LIVE_MODE=1"
    echo ""
    echo "   Non-live modes must be explicitly opted into."
    echo "   Set VITE_ALLOW_NON_LIVE_MODE=1 if this is intentional (test lane only)."
    exit 1
  fi
  echo "⚠️  CI running in explicit non-live mode: VITE_DATA_MODE=${MODE} (VITE_ALLOW_NON_LIVE_MODE=1 present)"
else
  if [[ -z "$MODE" || "$MODE" == "live" ]]; then
    echo "✅ CI data mode guard passed — live-default path"
  else
    echo "✅ CI data mode guard passed — unknown mode '${MODE}' falls back to live"
  fi
fi
