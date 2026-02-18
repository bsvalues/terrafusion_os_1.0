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
  "enforce_admins": true,
  "required_checks": ["governed-spine", "phase85-tools"]
}
JSON

cat > "$tmp/AGENTS.md" <<'MD'
enforce_admins: true
required_checks:
  - governed-spine
  - phase85-tools
MD

mkdir -p "$tmp/scripts/ci"
cp "$ROOT/scripts/ci/verify-agents-doc-against-protection-canon.sh" "$tmp/scripts/ci/"
chmod +x "$tmp/scripts/ci/verify-agents-doc-against-protection-canon.sh"

(
  cd "$tmp"
  bash scripts/ci/verify-agents-doc-against-protection-canon.sh >/dev/null
)

cat > "$tmp/AGENTS.md" <<'MD'
enforce_admins: false
required_checks:
  - governed-spine
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

echo "governance-canon-scripts.test: PASS"
