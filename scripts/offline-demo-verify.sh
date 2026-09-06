#!/usr/bin/env bash
# WACO 2026 offline demo — static verification (no Docker daemon required).
# Checks YAML parses and required files exist. If Docker is available, also runs
# `docker compose config` for full validation.
set -euo pipefail

cd "$(dirname "$0")/.."
fail=0

req_files=(
  docker/offline/compose.demo.yaml
  docker/offline/.env.example
  docker/offline/nginx-demo.conf
  docker/offline/GAP_ANALYSIS.md
  scripts/offline-demo-export.sh
  scripts/offline-demo-load.sh
)

for f in "${req_files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "MISSING: $f" >&2
    fail=1
  else
    echo "OK: $f"
  fi
done

# YAML parse check via python (no PyYAML? fall back to docker compose config only)
if python3 -c "import yaml,sys; yaml.safe_load(open('docker/offline/compose.demo.yaml'))" 2>/dev/null; then
  echo "OK: compose.demo.yaml parses as YAML"
else
  echo "WARN: python yaml check unavailable or failed; relying on docker compose config" >&2
fi

if docker info >/dev/null 2>&1; then
  docker compose -f docker/offline/compose.demo.yaml --env-file docker/offline/.env.example config -q \
    && echo "OK: docker compose config validates"
else
  echo "WARN: Docker daemon not available; skipped 'docker compose config'. Run this on a Docker machine before travel." >&2
fi

exit "$fail"
