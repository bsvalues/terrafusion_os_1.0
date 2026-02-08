#!/usr/bin/env bash
# Consolidate Snyk PRs (22 → 1)
# Implements Critical-Only policy per Two-Lane CI Architecture

set -euo pipefail

REPO="${REPO:-bsvalues/terrafusion_os_1.0}"

echo "===================================="
echo "Snyk PR Consolidation (22 → 0-1)"
echo "===================================="
echo "Repository: $REPO"
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

echo "🔍 Finding Snyk PRs..."
echo ""

# Get all open PRs from Snyk bot
SNYK_PRS=$(gh pr list --repo "$REPO" --author "snyk-bot" --state open --json number,title,url --jq '.[] | "\(.number)\t\(.title)\t\(.url)"')

if [ -z "$SNYK_PRS" ]; then
    echo "✅ No Snyk PRs found (already clean)"
    exit 0
fi

# Count PRs
PR_COUNT=$(echo "$SNYK_PRS" | wc -l)
echo "Found $PR_COUNT Snyk PRs:"
echo ""
echo "$SNYK_PRS" | while IFS=$'\t' read -r number title url; do
    echo "  #$number - $title"
done
echo ""

# Confirmation prompt (unless CI or force mode)
if [ "${CI:-false}" != "true" ] && [ "${FORCE:-false}" != "true" ]; then
    read -p "Close all $PR_COUNT Snyk PRs as superseded? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted by user"
        exit 1
    fi
fi

echo ""
echo "🔒 Closing Snyk PRs..."
echo ""

CLOSED_COUNT=0

echo "$SNYK_PRS" | while IFS=$'\t' read -r number title url; do
    echo "Closing #$number..."
    
    # Add comment explaining closure
    gh pr comment "$number" --repo "$REPO" --body "## 🔒 Snyk PR Consolidation

This PR is being closed as part of implementing the **Two-Lane CI Architecture**.

**New Policy:** Critical-Only Security Updates
- ✅ Critical/High vulnerabilities → Immediate patch
- ⏸️  Medium/Low vulnerabilities → Monthly batch
- 🚫 Duplicate PRs closed as superseded

**Why?**
- 22 open Snyk PRs create merge velocity drag
- Security is velocity when correctly tiered
- Monthly batching reduces noise while maintaining safety

**Next Steps:**
1. Snyk PR grouping enabled (max 1 PR at a time)
2. Monthly security batch reviews scheduled
3. Critical vulnerabilities get immediate PRs

**Reference:**
- Two-Lane CI: \`.github/TWO_LANE_CI_ARCHITECTURE.md\`
- Snyk Policy: \`.snyk\` (repo root)

---
*Closed by: .github/scripts/consolidate-snyk-prs.sh*"

    # Close the PR
    gh pr close "$number" --repo "$REPO" --comment "Superseded by Two-Lane CI Architecture (Critical-Only policy)"
    
    CLOSED_COUNT=$((CLOSED_COUNT + 1))
    echo "  ✅ Closed #$number"
done

echo ""
echo "✅ Closed $CLOSED_COUNT Snyk PRs"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Configure Snyk PR Grouping:"
echo "   - Go to https://app.snyk.io/"
echo "   - Settings > Integrations > GitHub"
echo "   - Enable 'Group PRs'"
echo "   - Set 'Max concurrent PRs' to 1"
echo ""
echo "2. Enable Critical-Only Mode:"
echo "   - Snyk dashboard > Project settings"
echo "   - Set 'Auto-fix PRs' to 'Critical and High only'"
echo "   - Schedule monthly reviews for Medium/Low"
echo ""
echo "3. Monthly Security Batch:"
echo "   - First Monday of each month"
echo "   - Review all pending Medium/Low vulnerabilities"
echo "   - Create one grouped PR for approved updates"
echo ""
echo "📚 Documentation: .github/TWO_LANE_CI_ARCHITECTURE.md"
