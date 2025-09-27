#!/usr/bin/env bash
set -Eeuo pipefail

# Ensure example env exists
[[ -f .env.benton ]] || cp .env.benton.example .env.benton

# Normalize dirs
mkdir -p "$ARTIFACTS_DIR" "$DATA_DIR" compose scripts

# Seed placeholder data dir if empty
if [[ -z $(ls -A "$DATA_DIR" 2>/dev/null || true) ]]; then
  mkdir -p "$DATA_DIR"
  cat > "$DATA_DIR/README.md" <<'MD'
Place Benton County CSVs/GeoJSON here:
- parcels.csv
- assessments.csv
- sales.csv
- neighborhoods.csv
- precincts.geojson
MD
fi

echo "Env prepared."
