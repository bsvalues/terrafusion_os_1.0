#!/usr/bin/env bash
set -euo pipefail

# Fails on dangerous release-lane patterns:
#  - terraform apply -auto-approve
#  - production deploy patterns triggered directly from main (heuristic)

DIAG_DIR="${TF_DIAG_DIR:-.tf-ci-diagnostics}"
ALLOW="${TF_RELEASE_LINT_ALLOWLIST_REGEX:-$^}"
PYTHON_BIN="${TF_PYTHON_BIN:-python3}"

mkdir -p "${DIAG_DIR}"

if [[ ! -d ".github/workflows" ]]; then
  echo "release-lane-lint: no workflows found; PASS"
  exit 0
fi

if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
  if command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    echo "ERROR: python3/python not found in PATH."
    exit 1
  fi
fi

echo "release-lane-lint: scanning .github/workflows for dangerous patterns"

AUTO_APPROVE_HITS="$(rg -n --no-heading -S "terraform[[:space:]]+apply\\b.*-auto-approve" .github/workflows -g "*.yml" -g "*.yaml" || true)"
AUTO_APPROVE_HITS="$(echo "${AUTO_APPROVE_HITS}" | rg -v "${ALLOW}" || true)"

DIRECT_MAIN_PROD_RAW="$("${PYTHON_BIN}" <<'PY'
import glob
import os
import re

files = sorted(glob.glob(".github/workflows/*.yml")) + sorted(glob.glob(".github/workflows/*.yaml"))
results = []

job_header = re.compile(r"^  ([A-Za-z0-9_-]+):\s*$")
prod_env_inline = re.compile(r"^\s+environment:\s*production(?:\b|-)", re.IGNORECASE)
prod_env_block = re.compile(r"^\s+environment:\s*$", re.IGNORECASE)
prod_env_name = re.compile(r"^\s+name:\s*production(?:\b|-)", re.IGNORECASE)
main_ref = re.compile(
    r"refs/heads/main|github\.ref_name\s*==\s*['\"]main['\"]|github\.ref\s*==\s*['\"]refs/heads/main['\"]"
)
prod_name = re.compile(r"deploy[-_]?prod|deploy[-_]?production", re.IGNORECASE)
prod_step = re.compile(r"^\s+name:\s*.*deploy to production", re.IGNORECASE | re.MULTILINE)

for path in files:
    with open(path, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()

    in_jobs = False
    current_job = None
    current_start = 0
    current_lines = []

    def analyze(job_name, start_line, block):
        if not job_name:
            return
        text = "\n".join(block)
        is_prod = False
        prod_line = None
        in_env = False

        for idx, line in enumerate(block, start=start_line):
            if prod_env_inline.search(line):
                is_prod = True
                prod_line = idx
                break
            if prod_env_block.search(line):
                in_env = True
                continue
            if in_env:
                if re.match(r"^\s{2}[A-Za-z0-9_-]+:\s*$", line):
                    in_env = False
                elif prod_env_name.search(line):
                    is_prod = True
                    prod_line = idx
                    break
                elif re.match(r"^\s+\w+:\s*", line):
                    in_env = False

        if not is_prod and (prod_name.search(job_name) or prod_step.search(text)):
            is_prod = True
            prod_line = start_line

        if not is_prod:
            return

        main_line = None
        for idx, line in enumerate(block, start=start_line):
            if main_ref.search(line):
                main_line = idx
                break

        if main_line is not None:
            results.append(f"{path}:{main_line}: main-triggered production job '{job_name}'")
            if prod_line is not None and prod_line != main_line:
                results.append(f"{path}:{prod_line}: production marker for job '{job_name}'")

    for i, line in enumerate(lines, start=1):
        if not in_jobs:
            if line.strip() == "jobs:":
                in_jobs = True
            continue

        m = job_header.match(line)
        if m:
            analyze(current_job, current_start, current_lines)
            current_job = m.group(1)
            current_start = i
            current_lines = [line]
            continue

        if current_job is not None:
            current_lines.append(line)

    analyze(current_job, current_start, current_lines)

print("\n".join(results))
PY
)"

DIRECT_MAIN_PROD_HITS="$(echo "${DIRECT_MAIN_PROD_RAW}" | rg -v "${ALLOW}" || true)"

FAIL=0

{
  echo "Release Lane Safety Lint"
  echo ""

  if [[ -n "${AUTO_APPROVE_HITS}" ]]; then
    echo "FAIL: terraform apply uses -auto-approve:"
    echo "${AUTO_APPROVE_HITS}"
    echo ""
    FAIL=1
  fi

  if [[ -n "${DIRECT_MAIN_PROD_HITS}" ]]; then
    echo "FAIL: Direct main-to-production deployment risk detected:"
    echo "${DIRECT_MAIN_PROD_HITS}"
    echo ""
    echo "Fix: production jobs must be workflow_dispatch/tag/release gated and environment-approved."
    FAIL=1
  fi
} > "${DIAG_DIR}/release-lane-lint.txt"

cat "${DIAG_DIR}/release-lane-lint.txt"

if [[ "${FAIL}" -eq 1 ]]; then
  exit 1
fi

echo "release-lane-lint: PASS"
