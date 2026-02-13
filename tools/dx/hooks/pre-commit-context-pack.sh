#!/usr/bin/env bash
# TerraFusion DX Spine - Pre-Commit Context Pack Generator
# Automatically regenerates the context pack before each commit
# to ensure the AI memory layer is always current.
#
# Install: cp tools/dx/hooks/pre-commit-context-pack.sh .git/hooks/pre-commit
# Or: echo 'bash tools/dx/hooks/pre-commit-context-pack.sh' >> .git/hooks/pre-commit

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
GENERATOR="${REPO_ROOT}/tools/dx/context-pack/generate.mjs"
CONTEXT_FILE="${REPO_ROOT}/.terrafusion/context/latest.json"

# Only run if the generator exists
if [ ! -f "$GENERATOR" ]; then
  echo "[DX Spine] Context pack generator not found, skipping"
  exit 0
fi

# Check if node is available
if ! command -v node &>/dev/null; then
  echo "[DX Spine] Node.js not found, skipping context pack generation"
  exit 0
fi

echo "[DX Spine] Regenerating context pack..."

# Run the generator with a timeout to avoid blocking commits
if timeout 10 node "$GENERATOR" 2>/dev/null; then
  # Stage the updated context pack if it changed
  if [ -f "$CONTEXT_FILE" ]; then
    git add "$CONTEXT_FILE" 2>/dev/null || true

    # Also stage the markdown version if it exists
    MD_FILE="${REPO_ROOT}/.terrafusion/context/latest.md"
    if [ -f "$MD_FILE" ]; then
      git add "$MD_FILE" 2>/dev/null || true
    fi

    echo "[DX Spine] Context pack updated and staged"
  fi
else
  # Non-fatal: don't block the commit if generation fails
  echo "[DX Spine] Context pack generation timed out or failed (non-fatal)"
fi

exit 0
