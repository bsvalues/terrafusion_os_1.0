#!/usr/bin/env bash
set -Eeuo pipefail

echo "🏗️  Preparing Cowlitz County environment..."

# Ensure Cowlitz data directory structure
mkdir -p "$DATA_DIR"/{parcels,assessments,sales,zoning,boundaries}

# Create sample Cowlitz data if empty
if [[ -z $(ls -A "$DATA_DIR/parcels" 2>/dev/null || true) ]]; then
  cat > "$DATA_DIR/README.md" <<MD
# Cowlitz County Data Directory

Place Cowlitz County data files here:
- parcels/cowlitz_parcels.csv
- assessments/cowlitz_assessments.csv  
- sales/cowlitz_sales.csv
- zoning/cowlitz_zoning.geojson
- boundaries/cowlitz_boundaries.geojson

Population: 110,000
Properties: 45,000
Assessment URL: https://www.co.cowlitz.wa.us/assessor
MD
fi

echo "✅ Cowlitz County environment prepared."
