#!/usr/bin/env sh
# Retired by WO-DEVEX-HOOKS-004: .husky is the sole supported hook authority.

echo "❌ scripts/setup/setup-atlas-hooks.sh is unsupported."
echo "   It previously changed core.hooksPath to the legacy .githooks directory."
echo "   TerraFusion hooks are managed through .husky and the root package contract."
echo "   Bootstrap dependencies explicitly with:"
echo "   corepack pnpm install --frozen-lockfile"
exit 1
