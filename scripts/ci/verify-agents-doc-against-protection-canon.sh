#!/usr/bin/env bash
set -euo pipefail
export PYTHONIOENCODING=UTF-8

CANON_PATH="${TF_PROTECTION_CANON_PATH:-.governance/main.protection.json}"
AGENTS_PATH="${TF_AGENTS_PATH:-AGENTS.md}"
DIAG_DIR="${TF_DIAG_DIR:-.tf-ci-diagnostics}"
PYTHON_BIN="${TF_PYTHON_BIN:-python3}"

mkdir -p "${DIAG_DIR}"

if [[ ! -f "${CANON_PATH}" ]]; then
  echo "ERROR: missing canon file: ${CANON_PATH}"
  exit 1
fi

if [[ ! -f "${AGENTS_PATH}" ]]; then
  echo "ERROR: missing AGENTS.md at: ${AGENTS_PATH}"
  exit 1
fi

if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
  if command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    echo "ERROR: python3/python not found in PATH."
    exit 1
  fi
fi

"${PYTHON_BIN}" - "${CANON_PATH}" "${AGENTS_PATH}" > "${DIAG_DIR}/agents-vs-canon-diff.txt" <<'PY'
import json
import re
import sys

with open(sys.argv[1], "r", encoding="utf-8") as f:
    canon = json.load(f)
with open(sys.argv[2], "r", encoding="utf-8") as f:
    agents = f.read()

expected_enforce = str(bool(canon.get("enforce_admins"))).lower()
expected_checks = canon.get("required_checks", [])

m_enf = re.search(r"enforce_admins\s*:\s*(true|false)", agents, re.IGNORECASE)
found_enf = m_enf.group(1).lower() if m_enf else None

checks = []
sec = re.search(r"required_checks\s*:\s*\n(?P<body>(?:\s*-\s*.+\n)+)", agents, re.IGNORECASE)
if sec:
    body = sec.group("body")
    for line in body.splitlines():
        mm = re.match(r"\s*-\s*(.+?)\s*$", line)
        if mm:
            checks.append(mm.group(1))

diffs = []
if found_enf is None:
    diffs.append("AGENTS.md missing explicit 'enforce_admins: true|false' line.")
elif found_enf != expected_enforce:
    diffs.append(f"enforce_admins mismatch: canon={expected_enforce} AGENTS.md={found_enf}")

if not checks:
    diffs.append("AGENTS.md missing explicit required_checks block (required_checks: \\n  - ...).")
else:
    cset = set(expected_checks)
    aset = set(checks)
    missing = sorted(list(cset - aset))
    extra = sorted(list(aset - cset))
    if missing:
        diffs.append("required_checks missing in AGENTS.md:\n  - " + "\n  - ".join(missing))
    if extra:
        diffs.append("required_checks extra in AGENTS.md:\n  - " + "\n  - ".join(extra))

if not diffs:
    print("OK: AGENTS.md matches protection canon.")
else:
    print("FAIL: AGENTS.md drift detected.\n")
    print("\n\n".join(diffs))
PY

if grep -q '^FAIL:' "${DIAG_DIR}/agents-vs-canon-diff.txt"; then
  echo ""
  cat "${DIAG_DIR}/agents-vs-canon-diff.txt"
  echo ""
  exit 1
fi

cat "${DIAG_DIR}/agents-vs-canon-diff.txt"
echo "agents-doc-canon: PASS"
