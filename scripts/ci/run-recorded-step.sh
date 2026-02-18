#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: bash scripts/ci/run-recorded-step.sh \"<step-name>\" -- <command...>"
}

if [[ $# -lt 3 ]]; then
  usage
  exit 2
fi

STEP_NAME="$1"
shift

if [[ "${1:-}" != "--" ]]; then
  usage
  exit 2
fi
shift

if [[ $# -lt 1 ]]; then
  usage
  exit 2
fi

FAIL_META_DIR="${TF_FAIL_META_DIR:-.tf-ci-failure}"
mkdir -p "${FAIL_META_DIR}"
echo "${STEP_NAME}" > "${FAIL_META_DIR}/last_step.txt" || true

set +e
"$@"
code=$?
set -e

if [[ $code -ne 0 ]]; then
  echo "${STEP_NAME}" > "${FAIL_META_DIR}/failing_step.txt" || true
  echo "${code}" > "${FAIL_META_DIR}/failing_exit_code.txt" || true

  if [[ -n "${GITHUB_ENV:-}" ]]; then
    {
      echo "TF_FAILING_STEP=${STEP_NAME}"
      echo "TF_FAILING_EXIT_CODE=${code}"
    } >> "${GITHUB_ENV}"
  fi

  echo "ERROR: governed step failed: ${STEP_NAME} (exit code ${code})"
  exit "${code}"
fi

exit 0
