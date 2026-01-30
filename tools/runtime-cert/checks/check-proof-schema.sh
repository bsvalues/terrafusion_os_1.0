#!/usr/bin/env bash
# Check: Proof Endpoint Schema
# Verifies /healthz/proof returns valid JSON with all required fields

set -euo pipefail

BASE_URL="${1:-http://localhost:5000}"
TIMEOUT="${2:-10}"

response=$(curl -s -w "\n%{http_code}" --connect-timeout "$TIMEOUT" "${BASE_URL}/healthz/proof" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [[ "$http_code" != "200" ]]; then
    echo "{\"check\":\"proof_endpoint\",\"passed\":false,\"message\":\"Returns $http_code\"}"
    exit 1
fi

# Validate JSON and required fields
result=$(python3 << EOF
import json
import sys

try:
    data = json.loads('''$body''')
except:
    print('{"check":"proof_endpoint","passed":false,"message":"Invalid JSON"}')
    sys.exit(1)

required = ["speclock_ok", "state_mesh_ok", "manifest_sha256", "timestamp_epoch", "receipt_count", "state_proof_present"]
missing = [f for f in required if f not in data]

if missing:
    print(f'{{"check":"proof_endpoint","passed":false,"message":"Missing: {missing}"}}')
    sys.exit(1)

print('{"check":"proof_endpoint","passed":true,"message":"Valid schema"}')
EOF
)

echo "$result"
[[ "$result" == *'"passed":true'* ]] && exit 0 || exit 1
