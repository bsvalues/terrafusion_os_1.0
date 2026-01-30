#!/usr/bin/env bash
#
# SpecLock Generated Artifact Enforcement
#
# Ensures generated artifacts match their specs (no drift).
# Fails if any tracked generated files have uncommitted changes.
#
# Usage:
#   bash scripts/speclock-enforce-generated.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TerraFusion SpecLock Generated Artifact Enforcement"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if there are any changes to tracked files
if ! git diff --quiet; then
    echo "⚠️  Uncommitted changes detected in working tree."
    echo ""
    echo "Changed files:"
    git diff --name-only | head -20
    echo ""
    echo "❌ Generated artifacts are out of sync with SpecLocks."
    echo ""
    echo "Resolution:"
    echo "  1. Run: python scripts/speclock-generate-all.py"
    echo "  2. Commit the regenerated artifacts"
    echo ""
    exit 1
fi

# Also check staged changes
if ! git diff --cached --quiet; then
    echo "⚠️  Staged changes detected."
    echo ""
    echo "Staged files:"
    git diff --cached --name-only | head -20
    echo ""
    echo "ℹ️  Ensure staged changes include regenerated artifacts if specs changed."
fi

echo "✅ Generated artifacts are in sync with SpecLocks."
echo ""
