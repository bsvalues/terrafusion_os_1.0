#!/usr/bin/env bash
# deploy-sovereign.sh — Phase 11 Sovereign Deploy
# Runs governance safety checks before any deployment action.
#
# Usage: ./scripts/deploy-sovereign.sh [--dry-run] [--county <county_id>]
#
# Exit 0 = all checks passed (ready to deploy)
# Exit 1 = safety checks failed (deployment blocked)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DRY_RUN=false
COUNTY_ID="${COUNTY_ID:-benton_wa}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run) DRY_RUN=true; shift ;;
    --county) COUNTY_ID="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  TerraFusion OS — Sovereign Deploy v1.0      ║"
echo "║  County: $COUNTY_ID                          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Gate 1: Sovereign manifest safety checks
echo "► Gate 1: Sovereign safety validation..."
cd "$REPO_ROOT"
if ! npx tsx tools/tf/test-safety.ts; then
  echo ""
  echo "DEPLOYMENT BLOCKED — Sovereign safety checks failed."
  echo "Fix sovereign.yaml before deploying."
  exit 1
fi

# Gate 2: Drift check (no unpaired emitIntent/emitResult)
echo "► Gate 2: TerraTrace drift check..."
if ! npx tsx tools/tf/sweep.ts; then
  echo ""
  echo "DEPLOYMENT BLOCKED — TerraTrace drift detected."
  echo "Run: npx tsx tools/tf/sweep.ts for details."
  exit 1
fi

# Gate 3: Shadow write check
echo "► Gate 3: Shadow write detection..."
if ! npx tsx tools/tf/verify-ops.ts; then
  echo ""
  echo "DEPLOYMENT BLOCKED — Shadow writes detected."
  echo "Run: npx tsx tools/tf/verify-ops.ts for details."
  exit 1
fi

echo ""
echo "✅ All deployment gates passed."
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN — No deployment actions taken."
  echo ""
  exit 0
fi

echo "► Deployment actions would execute here."
echo "   (Connect to your CI/CD or kubectl/docker-compose as needed.)"
echo ""
echo "✅ Sovereign deploy complete for county: $COUNTY_ID"
echo ""
exit 0
