#!/bin/bash
# Configure Git to use Atlas pre-commit hooks

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.githooks"

echo "🔧 Setting up TerraFusion Atlas Git Hooks..."

# Configure git to use custom hooks directory
git config core.hooksPath "$HOOKS_DIR"

# Make pre-commit hook executable
chmod +x "$HOOKS_DIR/pre-commit"

echo "✅ Git hooks configured!"
echo ""
echo "📋 Active hooks:"
echo "  • Pre-commit: Atlas registration check"
echo ""
echo "💡 To bypass in emergencies: git commit --no-verify"
echo "📖 Documentation: terrafusion-atlas/docs/DEVELOPER_GUIDE.md"
