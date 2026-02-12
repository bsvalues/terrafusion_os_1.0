#!/usr/bin/env bash
set -Eeuo pipefail
reqs=(docker docker-compose)
for bin in "${reqs[@]}"; do
  command -v "$bin" >/dev/null 2>&1 || { echo "Missing dependency: $bin"; exit 1; }
done

# Optional database/quality/security tools, will be skipped if missing
optional=(psql trivy snyk jq)
for bin in "${optional[@]}"; do
  command -v "$bin" >/dev/null 2>&1 || echo "(info) Optional tool not found: $bin — skipping"
done

echo "Prereqs OK."
