#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${PILOT_API_URL:-http://localhost:3333}"
API_BASE="$BASE_URL/api"

H_USER="x-user-id: smoke-user"
H_COUNTY="x-county-id: benton"
H_ROLE="x-role: analyst"
H_PERMS_ALL="x-permissions: parcel:read,valuation:commit,parcel:write"

json() {
  printf '%s' "$1"
}

assert_status() {
  local expected="$1"
  local method="$2"
  local url="$3"
  local data="${4:-}"
  local headers=()
  shift 4 || true

  while [ $# -gt 0 ]; do
    headers+=("-H" "$1")
    shift
  done

  local body_file
  body_file=$(mktemp)

  local code
  if [ -n "$data" ]; then
    code=$(curl -s -o "$body_file" -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      "${headers[@]}" \
      -d "$data" \
      "$url")
  else
    code=$(curl -s -o "$body_file" -w "%{http_code}" -X "$method" \
      "${headers[@]}" \
      "$url")
  fi

  if [ "$code" != "$expected" ]; then
    echo "❌ Expected $expected, got $code for $method $url"
    echo "Response:"
    cat "$body_file"
    rm -f "$body_file"
    exit 1
  fi

  rm -f "$body_file"
}

echo "▶️  listTools"
assert_status 200 GET "$API_BASE/tools" "" \
  "$H_USER" "$H_COUNTY" "$H_ROLE" "$H_PERMS_ALL"

echo "▶️  read tool success"
assert_status 200 POST "$API_BASE/tools/execute" \
  "$(json '{"toolName":"atlas.parcel.read","input":{"parcelId":"P-001"}}')" \
  "$H_USER" "$H_COUNTY" "$H_ROLE" "$H_PERMS_ALL"

echo "▶️  permission denied"
assert_status 403 POST "$API_BASE/tools/execute" \
  "$(json '{"toolName":"atlas.parcel.read","input":{"parcelId":"P-001"}}')" \
  "$H_USER" "$H_COUNTY" "$H_ROLE" "x-permissions:"

echo "▶️  risk gate (no token)"
assert_status 409 POST "$API_BASE/tools/execute" \
  "$(json '{"toolName":"forge.valuation.commit","input":{"parcelId":"P-001","value":123}}')" \
  "$H_USER" "$H_COUNTY" "$H_ROLE" "x-permissions: valuation:commit"

echo "▶️  lane violation"
assert_status 409 POST "$API_BASE/tools/execute" \
  "$(json '{"toolName":"atlas.parcel.badwrite","input":{"parcelId":"P-001","_confirmationToken":"OK"}}')" \
  "$H_USER" "$H_COUNTY" "$H_ROLE" "x-permissions: parcel:write"

echo "✅ Smoke passed"
