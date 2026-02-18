#!/usr/bin/env bash
set -euo pipefail

FAIL_META_DIR="${TF_FAIL_META_DIR:-.tf-ci-failure}"
OUT_DIR="${TF_DIAG_DIR:-.tf-ci-diagnostics}"

mkdir -p "${OUT_DIR}"

step="unknown"
code="unknown"

if [[ -f "${FAIL_META_DIR}/failing_step.txt" ]]; then
  step="$(tr -d '\n' < "${FAIL_META_DIR}/failing_step.txt" || true)"
fi

if [[ -f "${FAIL_META_DIR}/failing_exit_code.txt" ]]; then
  code="$(tr -d '\n' < "${FAIL_META_DIR}/failing_exit_code.txt" || true)"
fi

{
  echo "TerraFusion Governance Failure Summary"
  echo "failing_step=${step}"
  echo "exit_code=${code}"
  echo "job=${GITHUB_JOB:-unknown}"
  echo "run_id=${GITHUB_RUN_ID:-unknown}"
  echo "run_attempt=${GITHUB_RUN_ATTEMPT:-unknown}"
  echo "sha=${GITHUB_SHA:-unknown}"
  echo "ref=${GITHUB_REF_NAME:-unknown}"
} > "${OUT_DIR}/summary.txt"
