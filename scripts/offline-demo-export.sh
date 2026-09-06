#!/usr/bin/env bash
# WACO 2026 offline demo — EXPORT step (requires network; run BEFORE travel).
# Pulls the demo images and saves them to a portable tarball for offline load.
set -euo pipefail

cd "$(dirname "$0")/.."
OUT_DIR="${1:-dist}"
OUT_FILE="${OUT_DIR}/offline-demo-images.tar.gz"
mkdir -p "$OUT_DIR"

IMAGES=(
  "postgis/postgis:15-3.4"
  "nginx:alpine"
)

echo "Pulling images (network required)..."
for img in "${IMAGES[@]}"; do
  docker pull "$img"
done

echo "Saving images to ${OUT_FILE}..."
docker save "${IMAGES[@]}" | gzip > "$OUT_FILE"

echo "Done. Copy ${OUT_FILE} plus the repo (or just docker/offline/ and scripts/) to the demo machine."
echo "On the demo machine run: scripts/offline-demo-load.sh ${OUT_FILE}"
