#!/usr/bin/env bash
# WACO 2026 offline demo — LOAD step (no network required).
# Usage: scripts/offline-demo-load.sh [path/to/offline-demo-images.tar.gz]
set -euo pipefail

cd "$(dirname "$0")/.."
TARBALL="${1:-dist/offline-demo-images.tar.gz}"

if [[ ! -f "$TARBALL" ]]; then
  echo "ERROR: image tarball not found: $TARBALL" >&2
  echo "Run scripts/offline-demo-export.sh on a networked machine first." >&2
  exit 1
fi

echo "Loading images from ${TARBALL} (offline)..."
gunzip -c "$TARBALL" | docker load

echo "Starting demo stack (offline)..."
docker compose -f docker/offline/compose.demo.yaml --env-file docker/offline/.env.example up -d

echo
echo "Demo endpoints:"
echo "  UI:   http://localhost:3000"
echo "  API:  http://localhost:8080/health"
echo
echo "Stop with: docker compose -f docker/offline/compose.demo.yaml down"
