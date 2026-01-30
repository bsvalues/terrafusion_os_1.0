#!/usr/bin/env bash
#
# SpecLock Drift Bot (Nuclear Mode)
#
# Detects drift, regenerates, and opens PR automatically.
#
# Prerequisites:
#   - gh CLI installed and authenticated
#   - git configured with push access
#
# Usage:
#   bash scripts/speclock-drift-bot.sh
#
# Environment:
#   BRANCH - PR branch name (default: speclock/drift-fix)
#   BASE   - Target base branch (default: main)
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

BRANCH="${BRANCH:-speclock/drift-fix}"
BASE="${BASE:-main}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TerraFusion SpecLock Drift Bot (Nuclear Mode)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "ℹ️  Branch: $BRANCH"
echo "ℹ️  Base: $BASE"
echo ""

# Check gh CLI
if ! command -v gh >/dev/null 2>&1; then
    echo "❌ gh CLI required. Install: https://cli.github.com/"
    exit 1
fi

# Detect Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python not found"
    exit 1
fi

# Fetch base
git fetch origin "$BASE" --depth=1 || true
git checkout -B "$BRANCH"

# Run CI gate (allow failure)
set +e
bash scripts/speclock-ci.sh --no-strict --skip-tests
RC=$?
set -e

if [[ "$RC" -eq 0 ]]; then
    echo ""
    echo "✅ No drift detected. Exiting."
    exit 0
fi

echo ""
echo "⚠️  Drift detected. Regenerating..."
echo ""

# Regenerate everything
$PYTHON_CMD scripts/speclock-generate-all.py || true
$PYTHON_CMD scripts/generate-speclock-index-md.py || true
$PYTHON_CMD scripts/speclock-manifest.py || true

# Check if regeneration produced any changes
if git diff --quiet && git diff --cached --quiet; then
    echo ""
    echo "❌ Gate failed but no diff produced — investigate manually."
    exit 2
fi

# Commit and push
git add -A
git commit -m "chore(speclock): auto-fix generated drift

Automated drift remediation by SpecLock Drift Bot.
Generated artifacts + index are now consistent with SpecLocks."

git push -u origin "$BRANCH" --force

# Create PR
gh pr create --base "$BASE" --head "$BRANCH" \
    --title "chore(speclock): fix generated drift" \
    --body "## Automated Drift Remediation

This PR was created by the **SpecLock Drift Bot** because:
- Generated artifacts were out of sync with SpecLocks
- INDEX.md needed regeneration

### Changes
- Regenerated all SpecLock artifacts
- Updated INDEX.md
- Rebuilt manifest.json

### Verification
- [ ] CI passes
- [ ] Generated artifacts match expectations
- [ ] No unintended changes" \
    --label "speclock,automated" || echo "⚠️  PR may already exist"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Drift PR opened: $BRANCH → $BASE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

exit 0
