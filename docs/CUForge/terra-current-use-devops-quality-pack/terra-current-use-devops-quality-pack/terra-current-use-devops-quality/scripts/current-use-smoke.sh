#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
PARCEL_ID="${PARCEL_ID:-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa}"
COUNTY_ID="${COUNTY_ID:-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb}"

echo "== Current Use Smoke Test =="

curl -fsS "$BASE_URL/api/forge/current-use/parcels/$PARCEL_ID/overview" > /tmp/current-use-overview.json
echo "overview ok"

curl -fsS "$BASE_URL/api/forge/current-use/parcels/$PARCEL_ID/evidence" > /tmp/current-use-evidence.json
echo "evidence ok"

curl -fsS "$BASE_URL/api/forge/current-use/parcels/$PARCEL_ID/timeline" > /tmp/current-use-timeline.json
echo "timeline ok"

curl -fsS "$BASE_URL/api/forge/current-use/policy/$COUNTY_ID" > /tmp/current-use-policy.json
echo "policy ok"

echo "smoke passed"
