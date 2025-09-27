#!/usr/bin/env bash
set -euo pipefail

echo "Packaging TerraFusion OS artifacts..."

# Create timestamped artifact bundle
OUT="artifacts/terrafusion-artifacts-$(date -u +%Y%m%dT%H%M%SZ).zip"

# Ensure artifacts directory exists
mkdir -p artifacts

# Package all artifacts with compression
if command -v zip >/dev/null 2>&1; then
  zip -qr "$OUT" artifacts || true
  printf "📦 TerraFusion OS artifacts packaged: %s\n" "$OUT"
  
  # Display package contents summary
  if [[ -f "$OUT" ]]; then
    SIZE=$(du -h "$OUT" | cut -f1)
    echo "📊 Package size: $SIZE"
    echo "📋 Contents:"
    unzip -l "$OUT" | tail -n +4 | head -n -2 | awk '{print "   " $4}' | sort
  fi
else
  # Fallback to tar if zip not available
  OUT="artifacts/terrafusion-artifacts-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
  tar -czf "$OUT" -C artifacts . || true
  printf "📦 TerraFusion OS artifacts packaged: %s\n" "$OUT"
fi

echo "✅ Artifact packaging completed"