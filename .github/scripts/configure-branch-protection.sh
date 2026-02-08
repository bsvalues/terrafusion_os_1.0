#!/usr/bin/env bash
# Configure Two-Lane CI Architecture Branch Protection
# See: .github/TWO_LANE_CI_ARCHITECTURE.md

set -euo pipefail

REPO="${REPO:-bsvalues/terrafusion_os_1.0}"
BRANCH="${BRANCH:-main}"
REQUIRED_CHECK="🔒 SEAL"

echo "===================================="
echo "Two-Lane CI Branch Protection Setup"
echo "===================================="
echo "Repository: $REPO"
echo "Branch: $BRANCH"
echo "Required Check: $REQUIRED_CHECK"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Backup current protection (if any)
echo "📦 Backing up current branch protection..."
gh api "repos/$REPO/branches/$BRANCH/protection" > ".github/backups/branch-protection-$BRANCH-$(date +%Y%m%d-%H%M%S).json" 2>/dev/null || echo "⚠️  No existing protection to backup"

echo ""
echo "🔒 Configuring branch protection..."
echo ""

# Apply Two-Lane CI protection rules
# Only SEAL is required
# All other checks are informational
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$REPO/branches/$BRANCH/protection" \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]="$REQUIRED_CHECK" \
  -f enforce_admins=true \
  -f required_pull_request_reviews[dismiss_stale_reviews]=false \
  -f required_pull_request_reviews[require_code_owner_reviews]=false \
  -f required_pull_request_reviews[required_approving_review_count]=0 \
  -f required_pull_request_reviews[require_last_push_approval]=false \
  -f required_linear_history=false \
  -f allow_force_pushes=false \
  -f allow_deletions=false \
  -f required_conversation_resolution=false \
  -f lock_branch=false \
  -f allow_fork_syncing=true

echo ""
echo "✅ Branch protection configured!"
echo ""
echo "Configuration Summary:"
echo "  - Required checks: $REQUIRED_CHECK (ONLY)"
echo "  - Required reviews: 0 (solo dev, CI is review)"
echo "  - Enforce admins: Yes"
echo "  - Force pushes: Blocked"
echo "  - Deletions: Blocked"
echo ""
echo "🎯 Two-Lane CI Architecture Active"
echo ""
echo "Merge Safety Lane (PR Required):"
echo "  ✅ 🔒 SEAL (seal-gate-fast.yml) - 3-8 min target"
echo ""
echo "Release Assurance Lane (main/tag only):"
echo "  ✅ SBOM (sbom.yml)"
echo "  ✅ SLSA Provenance (slsa-provenance.yml)"
echo "  ✅ Security Compliance (security-compliance.yml)"
echo ""
echo "📚 Documentation: .github/TWO_LANE_CI_ARCHITECTURE.md"
