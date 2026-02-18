#!/usr/bin/env bash
set -euo pipefail

# Fails loudly if os-platform/core/** is touched on frontend lanes.
# Read-only: does not modify or stage anything.

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'detached')"

# Frontend phase lanes should not touch core lane files.
if [[ "$BRANCH" != feat/phase* ]]; then
  exit 0
fi

CHANGED="$(
  (git diff --name-only; git diff --cached --name-only; git ls-files --others --exclude-standard) \
    | sort -u | rg '^os-platform/core/' || true
)"

if [[ -n "$CHANGED" ]]; then
  echo ""
  echo "ERROR: Cross-lane guard tripped."
  echo "Frontend lanes must not touch os-platform/core/**."
  echo ""
  echo "$CHANGED"
  echo ""
  echo "Fix: revert/remove core changes, or do core work on a core-designated lane."
  exit 1
fi
