#!/bin/bash
#
# TerraFusion SpecLock CI Script
#
# Runs validation and checks that INDEX.md is up-to-date.
# Returns non-zero if:
#   - INDEX.json validation fails
#   - INDEX.md is out of sync (needs regeneration)
#
# Usage:
#   ./scripts/speclock-ci.sh [--strict]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TerraFusion SpecLock CI Pipeline"
echo "═══════════════════════════════════════════════════════════════"
echo ""

STRICT_FLAG=""
if [[ "$1" == "--strict" ]]; then
    STRICT_FLAG="--strict"
    echo "ℹ️  Running in STRICT mode (warnings = errors)"
else
    echo "ℹ️  Running in normal mode"
fi
echo ""

# Step 1: Validate INDEX.json
echo "─────────────────────────────────────────────────────────────────"
echo "Step 1: Validating INDEX.json"
echo "─────────────────────────────────────────────────────────────────"
echo ""

if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ ERROR: Python not found"
    exit 1
fi

$PYTHON_CMD scripts/validate-speclock-index.py $STRICT_FLAG
VALIDATE_EXIT=$?

if [ $VALIDATE_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Validation failed. Fix INDEX.json before proceeding."
    exit $VALIDATE_EXIT
fi

echo ""

# Step 2: Check INDEX.md is up-to-date
echo "─────────────────────────────────────────────────────────────────"
echo "Step 2: Checking INDEX.md is up-to-date"
echo "─────────────────────────────────────────────────────────────────"
echo ""

# Save current INDEX.md
if [ -f "docs/spec-lock/INDEX.md" ]; then
    cp "docs/spec-lock/INDEX.md" "docs/spec-lock/INDEX.md.backup"
fi

# Regenerate
$PYTHON_CMD scripts/generate-speclock-index-md.py

# Compare (strip trailing whitespace and normalize line endings)
if [ -f "docs/spec-lock/INDEX.md.backup" ]; then
    # Normalize both files: remove trailing whitespace and convert line endings
    CURRENT_HASH=$(cat "docs/spec-lock/INDEX.md" | sed 's/[[:space:]]*$//' | tr -d '\r' | md5sum | cut -d' ' -f1)
    BACKUP_HASH=$(cat "docs/spec-lock/INDEX.md.backup" | sed 's/[[:space:]]*$//' | tr -d '\r' | md5sum | cut -d' ' -f1)
    
    if [ "$CURRENT_HASH" != "$BACKUP_HASH" ]; then
        echo ""
        echo "⚠️  INDEX.md has changed."
        echo ""
        echo "❌ INDEX.md is out of sync with INDEX.json."
        echo "   Run: python scripts/generate-speclock-index-md.py"
        echo "   Then commit both files."
        rm -f "docs/spec-lock/INDEX.md.backup"
        exit 1
    fi
    rm -f "docs/spec-lock/INDEX.md.backup"
fi

echo "✅ INDEX.md is up-to-date"
echo ""

# Step 3: Run SpecLock tests (if dotnet available)
echo "─────────────────────────────────────────────────────────────────"
echo "Step 3: Running SpecLock Tests"
echo "─────────────────────────────────────────────────────────────────"
echo ""

if command -v dotnet &> /dev/null; then
    echo "Running: dotnet test --filter \"Category=SpecLock\""
    echo ""
    dotnet test --filter "Category=SpecLock" --nologo || {
        echo ""
        echo "❌ SpecLock tests failed"
        exit 1
    }
    echo ""
    echo "✅ SpecLock tests passed"
else
    echo "⚠️  dotnet not found, skipping SpecLock tests"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ SpecLock CI Pipeline PASSED"
echo "═══════════════════════════════════════════════════════════════"
echo ""

exit 0
