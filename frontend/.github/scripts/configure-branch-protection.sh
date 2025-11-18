#!/bin/bash
# TerraFusion OS - Configure Branch Protection with Required Accessibility Checks
# Requires: GitHub CLI (gh) with admin permissions

set -e

REPO="bsvalues/terrafusion_os_1.0"
BRANCH="main"
CHECK_NAME="🧪 Playwright Accessibility (axe-core)"

echo "🔒 Configuring branch protection for ${BRANCH}..."

# Note: GitHub CLI doesn't directly support adding required status checks
# Use GitHub API via gh api command

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/${REPO}/branches/${BRANCH}/protection" \
  -f "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=${CHECK_NAME}" \
  -f "required_pull_request_reviews[required_approving_review_count]=1" \
  -f "required_pull_request_reviews[dismiss_stale_reviews]=true" \
  -f "required_pull_request_reviews[require_code_owner_reviews]=false" \
  -f "enforce_admins=true" \
  -f "required_linear_history=false" \
  -f "allow_force_pushes=false" \
  -f "allow_deletions=false" \
  -f "required_conversation_resolution=true"

echo "✅ Branch protection configured successfully!"
echo ""
echo "📋 Summary:"
echo "  - Branch: ${BRANCH}"
echo "  - Required status check: ${CHECK_NAME}"
echo "  - Required reviews: 1"
echo "  - Conversation resolution: Required"
echo ""
echo "View settings: https://github.com/${REPO}/settings/branches"
