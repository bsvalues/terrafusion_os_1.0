#!/usr/bin/env bash
set -euo pipefail
OUT="artifacts/terrafusion-artifacts-$(date -u +%Y%m%dT%H%M%SZ).zip"
zip -qr "$OUT" artifacts || true
printf "Packaged: %s\n" "$OUT"
