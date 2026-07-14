#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/.governance" "$tmp/.github/workflows" "$tmp/.tf-ci-diagnostics"

cat > "$tmp/.governance/main.protection.json" <<'JSON'
{
  "branch": "main",
  "require_pull_request": true,
  "required_status_checks": {
    "strict": true,
    "contexts": ["governed-spine", "phase85-tools"]
  },
  "required_pull_request_reviews": {
    "required_approving_review_count": 0
  },
  "enforce_admins": {"enabled": true},
  "required_conversation_resolution": {"enabled": true},
  "allow_force_pushes": {"enabled": false},
  "allow_deletions": {"enabled": false}
}
JSON

cat > "$tmp/AGENTS.md" <<'MD'
require_pull_request: true
required_status_checks:
  strict: true
  contexts:
    - governed-spine
    - phase85-tools
required_pull_request_reviews:
  required_approving_review_count: 0
enforce_admins: true
required_conversation_resolution: true
allow_force_pushes: false
allow_deletions: false
MD

mkdir -p "$tmp/scripts/ci"
cp "$ROOT/scripts/ci/verify-agents-doc-against-protection-canon.sh" "$tmp/scripts/ci/"
cp "$ROOT/scripts/ci/verify-branch-protection-against-canon.sh" "$tmp/scripts/ci/"
chmod +x "$tmp/scripts/ci/verify-agents-doc-against-protection-canon.sh"
chmod +x "$tmp/scripts/ci/verify-branch-protection-against-canon.sh"

(
  cd "$tmp"
  bash scripts/ci/verify-agents-doc-against-protection-canon.sh >/dev/null
)

cat > "$tmp/AGENTS.md" <<'MD'
require_pull_request: true
required_status_checks:
  strict: true
  contexts:
    - governed-spine
required_pull_request_reviews:
  required_approving_review_count: 0
enforce_admins: false
required_conversation_resolution: true
allow_force_pushes: false
allow_deletions: false
MD

(
  cd "$tmp"
  set +e
  bash scripts/ci/verify-agents-doc-against-protection-canon.sh >/dev/null 2>&1
  code=$?
  set -e
  if [[ "$code" -eq 0 ]]; then
    echo "TEST FAIL: expected drift to fail"
    exit 1
  fi
)

mkdir -p "$tmp/bin"
cat > "$tmp/live-protection.json" <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["governed-spine", "phase85-tools"],
    "checks": []
  },
  "required_pull_request_reviews": {"required_approving_review_count": 0},
  "enforce_admins": {"enabled": true},
  "required_conversation_resolution": {"enabled": true},
  "allow_force_pushes": {"enabled": false},
  "allow_deletions": {"enabled": false}
}
JSON
cat > "$tmp/bin/curl" <<'SH'
#!/usr/bin/env bash
cat "${TF_TEST_LIVE_PROTECTION}"
SH
chmod +x "$tmp/bin/curl"

(
  cd "$tmp"
  PATH="$tmp/bin:$PATH" \
  TF_REPO="bsvalues/terrafusion_os_1.0" \
  GH_TOKEN="test-token" \
  TF_TEST_LIVE_PROTECTION="$tmp/live-protection.json" \
  bash scripts/ci/verify-branch-protection-against-canon.sh >/dev/null
)

python - "$tmp/live-protection.json" <<'PY'
import json
import sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)
data["allow_deletions"]["enabled"] = True
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f)
PY

(
  cd "$tmp"
  set +e
  PATH="$tmp/bin:$PATH" \
  TF_REPO="bsvalues/terrafusion_os_1.0" \
  GH_TOKEN="test-token" \
  TF_TEST_LIVE_PROTECTION="$tmp/live-protection.json" \
  bash scripts/ci/verify-branch-protection-against-canon.sh >/dev/null 2>&1
  code=$?
  set -e
  if [[ "$code" -eq 0 ]]; then
    echo "TEST FAIL: expected allow_deletions drift to fail"
    exit 1
  fi
)

echo "governance-canon-scripts.test: PASS"
