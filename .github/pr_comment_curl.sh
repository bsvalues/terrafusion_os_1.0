#!/usr/bin/env bash
# Usage: export GITHUB_TOKEN=ghp_xxx; ./pr_comment_curl.sh
set -euo pipefail
REPO=bsvalues/terrafusion_os_1.0
PR=1
BODY_FILE=.github/pr_comment_oidc_bootstrap.md
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "Please set GITHUB_TOKEN with repo scope or use gh auth login"
  exit 1
fi
curl -sS -X POST -H "Authorization: token ${GITHUB_TOKEN}" -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/${REPO}/issues/${PR}/comments \
  -d @${BODY_FILE} | jq '.'
