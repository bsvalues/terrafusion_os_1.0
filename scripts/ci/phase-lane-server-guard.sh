#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "ci-guard: phase lane core-touch guard"

BRANCH="${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}"
if [[ -z "${BRANCH}" ]]; then
  echo "ci-guard: branch name not found; skipping"
  exit 0
fi

if [[ "${BRANCH}" != feat/phase* ]]; then
  echo "ci-guard: branch '${BRANCH}' is not a phase lane; skipping"
  exit 0
fi

BASE_SHA="${GITHUB_BASE_SHA:-}"
HEAD_SHA="${GITHUB_SHA:-HEAD}"

if [[ -z "${BASE_SHA}" ]]; then
  DEFAULT_BRANCH="${GITHUB_DEFAULT_BRANCH:-main}"
  git fetch -q origin "${DEFAULT_BRANCH}:${DEFAULT_BRANCH}" || true
  BASE_SHA="$(git merge-base "${DEFAULT_BRANCH}" "${HEAD_SHA}")"
fi

echo "ci-guard: diff range ${BASE_SHA}..${HEAD_SHA}"

CHANGED="$(
  git diff --name-only "${BASE_SHA}..${HEAD_SHA}" | grep '^os-platform/core/' || true
)"

if [[ -n "${CHANGED}" ]]; then
  echo ""
  echo "ERROR: Phase lane '${BRANCH}' touched os-platform/core/** (server-side CI guard)."
  echo "These paths are prohibited on phase lanes:"
  echo "${CHANGED}"
  echo ""
  echo "Fix: move core changes to a core-designated lane/PR."
  exit 1
fi

echo "ci-guard: OK (no core touches detected)"
