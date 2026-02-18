#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "ci-guard: asserting repo is clean after CI steps"

if ! git diff --quiet; then
  echo ""
  echo "ERROR: CI step mutated working tree (unstaged changes)."
  git diff --name-status || true
  exit 1
fi

if ! git diff --cached --quiet; then
  echo ""
  echo "ERROR: CI step mutated index (staged changes)."
  git diff --cached --name-status || true
  exit 1
fi

UNTRACKED="$(git ls-files --others --exclude-standard)"
if [[ -n "${UNTRACKED}" ]]; then
  echo ""
  echo "ERROR: CI step produced untracked files."
  echo "${UNTRACKED}"
  exit 1
fi

echo "ci-guard: OK (tree clean)"
