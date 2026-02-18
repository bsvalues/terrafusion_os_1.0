#!/usr/bin/env bash
set -euo pipefail
export PYTHONIOENCODING=UTF-8

# Verifies GitHub branch protection for the configured branch matches
# .governance/main.protection.json. CI-only, read-only, deterministic output.

REPO="${TF_REPO:-${GITHUB_REPOSITORY:-}}"
TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
CANON_PATH="${TF_PROTECTION_CANON_PATH:-.governance/main.protection.json}"
DIAG_DIR="${TF_DIAG_DIR:-.tf-ci-diagnostics}"
PYTHON_BIN="${TF_PYTHON_BIN:-python3}"

mkdir -p "${DIAG_DIR}"

if [[ -z "${REPO}" ]]; then
  echo "ERROR: repo not set (TF_REPO or GITHUB_REPOSITORY)."
  exit 1
fi

if [[ -z "${TOKEN}" ]]; then
  echo "ERROR: missing token (GH_TOKEN or GITHUB_TOKEN) for branch protection read."
  exit 1
fi

if [[ ! -f "${CANON_PATH}" ]]; then
  echo "ERROR: missing canon file: ${CANON_PATH}"
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

"${PYTHON_BIN}" - "${CANON_PATH}" > "${DIAG_DIR}/branch-protection-canon.json" <<'PY'
import json
import sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    canon = json.load(f)

out = {
    "branch": canon.get("branch", "main"),
    "enforce_admins": bool(canon.get("enforce_admins")),
    "required_checks": sorted(list(dict.fromkeys(canon.get("required_checks", [])))),
}
print(json.dumps(out, indent=2, ensure_ascii=False))
PY

BRANCH="$("${PYTHON_BIN}" - "${DIAG_DIR}/branch-protection-canon.json" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as f:
    data = json.load(f)
print(data.get("branch", "main"))
PY
)"

URL="https://api.github.com/repos/${REPO}/branches/${BRANCH}/protection"
echo "branch-protect-canon: fetching live protection for ${REPO}@${BRANCH}"

LIVE_JSON="$(curl -fsSL \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "${URL}")"

RAW_LIVE_PATH="${DIAG_DIR}/branch-protection-live-raw.json"
printf '%s' "${LIVE_JSON}" > "${RAW_LIVE_PATH}"

"${PYTHON_BIN}" - "${BRANCH}" "${RAW_LIVE_PATH}" > "${DIAG_DIR}/branch-protection-live.json" <<'PY'
import json
import sys

branch = sys.argv[1] if len(sys.argv) > 1 else "main"
live_path = sys.argv[2]
with open(live_path, "r", encoding="utf-8") as f:
    data = json.load(f)

ea = data.get("enforce_admins")
if isinstance(ea, dict):
    enforce_admins = bool(ea.get("enabled", False))
else:
    enforce_admins = bool(ea)

req = data.get("required_status_checks") or {}
contexts = list(req.get("contexts") or [])
for chk in (req.get("checks") or []):
    ctx = chk.get("context")
    if ctx:
        contexts.append(ctx)

contexts = sorted(
    list(
        dict.fromkeys(
            [c for c in contexts if isinstance(c, str) and c.strip()]
        )
    )
)

out = {
    "branch": branch,
    "enforce_admins": enforce_admins,
    "required_checks": contexts,
}
print(json.dumps(out, indent=2, ensure_ascii=False))
PY

"${PYTHON_BIN}" - "${DIAG_DIR}/branch-protection-canon.json" "${DIAG_DIR}/branch-protection-live.json" > "${DIAG_DIR}/branch-protection-diff.txt" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as f:
    canon = json.load(f)
with open(sys.argv[2], "r", encoding="utf-8") as f:
    live = json.load(f)

diffs = []

if canon.get("enforce_admins") != live.get("enforce_admins"):
    diffs.append(
        f"enforce_admins: canon={canon.get('enforce_admins')} live={live.get('enforce_admins')}"
    )

cset = set(canon.get("required_checks", []))
lset = set(live.get("required_checks", []))

missing = sorted(list(cset - lset))
extra = sorted(list(lset - cset))

if missing:
    diffs.append("required_checks missing in live:\n  - " + "\n  - ".join(missing))
if extra:
    diffs.append("required_checks extra in live:\n  - " + "\n  - ".join(extra))

if not diffs:
    print("OK: live branch protection matches canon.")
else:
    print("FAIL: branch protection drift detected.\n")
    print("\n\n".join(diffs))
PY

if grep -q '^FAIL:' "${DIAG_DIR}/branch-protection-diff.txt"; then
  echo ""
  cat "${DIAG_DIR}/branch-protection-diff.txt"
  echo ""
  exit 1
fi

cat "${DIAG_DIR}/branch-protection-diff.txt"
echo "branch-protect-canon: PASS"
