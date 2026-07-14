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

canon_block = re.search(
    r"^### Branch Protection Canon \(Machine Readable\)\s*$\s*"
    r"```yaml\s*(?P<body>.*?)^```\s*$",
    agents,
    re.IGNORECASE | re.MULTILINE | re.DOTALL,
)
if not canon_block:
    print("FAIL: AGENTS.md is missing the machine-readable branch-protection canon block.")
    raise SystemExit(1)
agents_canon = canon_block.group("body")

def canon_enabled(key):
    value = canon.get(key) or {}
    return bool(value.get("enabled")) if isinstance(value, dict) else bool(value)

expected = {
    "require_pull_request": bool(canon.get("require_pull_request")),
    "strict": bool((canon.get("required_status_checks") or {}).get("strict")),
    "required_approving_review_count": (
        canon.get("required_pull_request_reviews") or {}
    ).get("required_approving_review_count"),
    "enforce_admins": canon_enabled("enforce_admins"),
    "required_conversation_resolution": canon_enabled(
        "required_conversation_resolution"
    ),
    "allow_force_pushes": canon_enabled("allow_force_pushes"),
    "allow_deletions": canon_enabled("allow_deletions"),
}
expected_checks = (canon.get("required_status_checks") or {}).get("contexts", [])

def find_bool(name):
    match = re.search(rf"^\s*{re.escape(name)}\s*:\s*(true|false)\s*$", agents_canon, re.IGNORECASE | re.MULTILINE)
    return None if not match else match.group(1).lower() == "true"

def find_int(name):
    match = re.search(rf"^\s*{re.escape(name)}\s*:\s*(\d+)\s*$", agents_canon, re.IGNORECASE | re.MULTILINE)
    return None if not match else int(match.group(1))

checks = []
sec = re.search(r"contexts\s*:\s*\n(?P<body>(?:\s*-\s*.+\n)+)", agents_canon, re.IGNORECASE)
if sec:
    body = sec.group("body")
    for line in body.splitlines():
        mm = re.match(r"\s*-\s*(.+?)\s*$", line)
        if mm:
            checks.append(mm.group(1).strip("\"'"))

diffs = []
found = {
    "require_pull_request": find_bool("require_pull_request"),
    "strict": find_bool("strict"),
    "required_approving_review_count": find_int("required_approving_review_count"),
    "enforce_admins": find_bool("enforce_admins"),
    "required_conversation_resolution": find_bool("required_conversation_resolution"),
    "allow_force_pushes": find_bool("allow_force_pushes"),
    "allow_deletions": find_bool("allow_deletions"),
}

for key, expected_value in expected.items():
    if found[key] is None:
        diffs.append(f"AGENTS.md missing explicit '{key}' value.")
    elif found[key] != expected_value:
        diffs.append(f"{key} mismatch: canon={expected_value} AGENTS.md={found[key]}")

if not checks:
    diffs.append("AGENTS.md missing explicit required_status_checks contexts block.")
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
