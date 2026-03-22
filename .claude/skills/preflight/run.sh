#!/usr/bin/env bash
# .claude/skills/preflight/run.sh
# Repo sanity sweep — gather state before coding begins.
set -euo pipefail

ROOT="$(pwd)"
FRONTEND="${ROOT}/frontend"

echo "== PREFLIGHT =="
echo ""

# ── branch + last commit ──────────────────────────────────────────────────────
echo "-- BRANCH --"
git branch --show-current
git log --oneline -1
echo ""

# ── dirty tree ────────────────────────────────────────────────────────────────
echo "-- TREE --"
DIRTY=$(git status --short)
if [[ -z "${DIRTY}" ]]; then
  echo "clean"
else
  echo "DIRTY:"
  echo "${DIRTY}"
fi
echo ""

# ── stash ─────────────────────────────────────────────────────────────────────
echo "-- STASH --"
STASH_COUNT=$(git stash list 2>/dev/null | wc -l | tr -d ' ')
echo "stash entries: ${STASH_COUNT}"
echo ""

# ── package manager ───────────────────────────────────────────────────────────
echo "-- PACKAGE MANAGER --"
if [[ -f "${ROOT}/pnpm-lock.yaml" ]] || [[ -f "${FRONTEND}/pnpm-lock.yaml" ]]; then
  echo "pnpm"
elif [[ -f "${ROOT}/yarn.lock" ]] || [[ -f "${FRONTEND}/yarn.lock" ]]; then
  echo "yarn"
else
  echo "npm"
fi
echo ""

# ── config files ──────────────────────────────────────────────────────────────
echo "-- CONFIGS --"

VITEST="${FRONTEND}/vitest.config.ts"
if [[ -f "${VITEST}" ]]; then
  echo "vitest.config.ts: found"
  EXCLUDES=$(grep -A5 'exclude:' "${VITEST}" 2>/dev/null | grep -v 'node_modules\|dist\|\.spec\|e2e' | grep "'" | tr -d "' ," | grep -v '^$' || true)
  if [[ -n "${EXCLUDES}" ]]; then
    echo "  non-standard excludes: ${EXCLUDES}"
  else
    echo "  excludes: standard only (node_modules/dist/spec/e2e)"
  fi
else
  echo "vitest.config.ts: NOT FOUND"
fi

PLAYWRIGHT="${FRONTEND}/playwright.config.ts"
if [[ -f "${PLAYWRIGHT}" ]]; then
  TESTDIR=$(grep 'testDir' "${PLAYWRIGHT}" | head -1 | tr -d " '," | sed 's/testDir:/testDir: /')
  echo "playwright.config.ts: found (${TESTDIR})"
else
  echo "playwright.config.ts: NOT FOUND"
fi

TSCONFIG="${FRONTEND}/tsconfig.json"
if [[ -f "${TSCONFIG}" ]]; then
  STRICT=$(grep '"strict"' "${TSCONFIG}" | head -1 | tr -d ' ' || echo "not set")
  echo "tsconfig.json: found (${STRICT})"
else
  echo "tsconfig.json: NOT FOUND"
fi
echo ""

# ── test/build scripts ────────────────────────────────────────────────────────
echo "-- NPM SCRIPTS (test/type/lint/build) --"
if [[ -f "${FRONTEND}/package.json" ]]; then
  grep -E '"(test|type-check|lint|build)' "${FRONTEND}/package.json" | tr -d ' ' | head -12
fi
echo ""

# ── recent tags ───────────────────────────────────────────────────────────────
echo "-- RECENT TAGS --"
git tag --sort=-creatordate | head -5 || echo "(none)"
echo ""

echo "== END PREFLIGHT =="
