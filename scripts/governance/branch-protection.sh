#!/usr/bin/env bash
# branch-protection.sh — Prometheus T5 / PR-5
#
# One-time operator action: updates GitHub branch protection for `main` to
# include the full PR-5 required-checks list, enforce admins, require 1
# approving review, dismiss stale reviews, require conversation resolution,
# and forbid force-pushes / deletions.
#
# Run: bash scripts/governance/branch-protection.sh
# Verify: gh api repos/${REPO}/branches/main/protection
#
# Override REPO via env var if needed:
#   REPO=bsvalues/terrafusion_os_1.0 bash scripts/governance/branch-protection.sh
#
# Rollback (restore previous state — caller must have captured it first):
#   gh api -X PUT "repos/${REPO}/branches/main/protection" --input previous-protection.json
#
# IMPORTANT: This script is intentionally NOT invoked by CI. Branch protection
# is a privileged operation that an authorized maintainer must run once.

set -euo pipefail

REPO="${REPO:-bsvalues/terrafusion_os_1.0}"

# Capture current protection before mutating (for audit + rollback).
SNAPSHOT_FILE="branch-protection-snapshot-$(date -u +%Y%m%dT%H%M%SZ).json"
echo "Capturing current protection to ${SNAPSHOT_FILE}..."
gh api "repos/${REPO}/branches/main/protection" > "${SNAPSHOT_FILE}" || {
  echo "WARNING: could not capture current state (no existing protection?)"
  echo "{}" > "${SNAPSHOT_FILE}"
}

CHECKS_JSON=$(cat <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "🔒 TerraFusion Seal Gate",
      "Backend Gate (.NET 8) / Canonical .NET Test Run",
      "🧪 Tier-1 UI Harness Validation",
      "phase85-tools",
      "phase86-toolrunner",
      "governed-spine",
      "Vitest Full Suite (merge gate)",
      "Migration Apply Check"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": false,
  "required_conversation_resolution": true
}
EOF
)

echo "$CHECKS_JSON" | gh api -X PUT "repos/${REPO}/branches/main/protection" --input -
echo ""
echo "Branch protection updated."
echo "Snapshot of prior state saved to: ${SNAPSHOT_FILE}"
echo "Verify: gh api repos/${REPO}/branches/main/protection"
