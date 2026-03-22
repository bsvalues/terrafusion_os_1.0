#!/usr/bin/env bash
# .claude/skills/playwright-run/run.sh
# Runs Playwright e2e tests for TerraFusion OS frontend.
# Usage: bash .claude/skills/playwright-run/run.sh [target]
#   target: file path, "*.spec.ts" glob, grep pattern, or blank for full suite
set -euo pipefail

TARGET="${1:-}"
FRONTEND_DIR="$(pwd)/frontend"
CONFIG="${FRONTEND_DIR}/playwright.config.ts"
ARTIFACT_DIR="${FRONTEND_DIR}/playwright-report"

# ── runner detection ──────────────────────────────────────────────────────────
detect_runner() {
  if [[ -f "${FRONTEND_DIR}/pnpm-lock.yaml" ]]; then
    echo "pnpm --dir ${FRONTEND_DIR} exec playwright"
  elif [[ -f "${FRONTEND_DIR}/yarn.lock" ]]; then
    echo "yarn --cwd ${FRONTEND_DIR} playwright"
  else
    echo "npx --prefix ${FRONTEND_DIR} playwright"
  fi
}

RUNNER="$(detect_runner)"

# ── build command ─────────────────────────────────────────────────────────────
CMD=()
# shellcheck disable=SC2206
CMD+=(${RUNNER} test --config "${CONFIG}")

if [[ -n "${TARGET}" ]]; then
  # File path or glob → pass as positional; pattern → --grep
  if [[ -f "${FRONTEND_DIR}/${TARGET}" ]] || \
     [[ -f "${TARGET}" ]] || \
     [[ "${TARGET}" == *".spec."* ]] || \
     [[ "${TARGET}" == *".test."* ]]; then
    CMD+=("${TARGET}")
  else
    CMD+=(--grep "${TARGET}")
  fi
fi

CMD+=(--reporter=line)

# ── run ───────────────────────────────────────────────────────────────────────
echo "== PLAYWRIGHT_RUN =="
echo "command: ${CMD[*]}"
echo "config:  ${CONFIG}"
echo "artifacts: ${ARTIFACT_DIR}"
echo ""

"${CMD[@]}"
EXIT_CODE=$?

# ── artifact summary ──────────────────────────────────────────────────────────
echo ""
echo "== ARTIFACTS =="
if [[ -d "${ARTIFACT_DIR}" ]]; then
  find "${ARTIFACT_DIR}" \
    \( -name "*.png" -o -name "*.webm" -o -name "*.zip" \) \
    -newer "${CONFIG}" \
    -print 2>/dev/null | head -20 || true
else
  echo "(no artifact directory found)"
fi

exit "${EXIT_CODE}"
