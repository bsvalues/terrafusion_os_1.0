#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# TerraFusion Git Hooks Installer
# Installs pre-commit hooks to enforce dev standards
# ═══════════════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HOOKS_SRC="$SCRIPT_DIR/hooks"
HOOKS_DST="$ROOT/.git/hooks"

echo "🔗 Installing TerraFusion Git Hooks"
echo "───────────────────────────────────────────────────────"

# Check if we're in a git repo
if [ ! -d "$ROOT/.git" ]; then
    echo "❌ Not a git repository: $ROOT"
    exit 1
fi

# Create hooks directory if needed
mkdir -p "$HOOKS_DST"

# Install pre-commit hook
if [ -f "$HOOKS_SRC/pre-commit" ]; then
    cp "$HOOKS_SRC/pre-commit" "$HOOKS_DST/pre-commit"
    chmod +x "$HOOKS_DST/pre-commit"
    echo "  ✓ Installed pre-commit hook"
else
    echo "  ⚠ No pre-commit hook found at $HOOKS_SRC/pre-commit"
fi

echo ""
echo "✓ Git hooks installed!"
echo ""
echo "  Hooks will run automatically on:"
echo "    • git commit  →  pre-commit (gate + drift check)"
echo ""
echo "  To bypass (emergency only):"
echo "    git commit --no-verify"
echo ""
