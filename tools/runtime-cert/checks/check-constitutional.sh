#!/usr/bin/env bash
# Check: Constitutional Status
# Verifies speclock_ok and state_mesh_ok are both true

set -euo pipefail

BASE_URL="${1:-http://localhost:5000}"
TIMEOUT="${2:-10}"

response=$(curl -s --connect-timeout "$TIMEOUT" "${BASE_URL}/healthz/proof" 2>/dev/null || echo "{}")

result=$(python3 << EOF
import json
import sys

try:
    data = json.loads('''$response''')
except:
    print('{"check":"constitutional_status","passed":false,"message":"Cannot parse proof"}')
    sys.exit(1)

speclock_ok = data.get('speclock_ok', False)
state_mesh_ok = data.get('state_mesh_ok', False)

if not speclock_ok:
    print('{"check":"constitutional_status","passed":false,"message":"speclock_ok=false"}')
    sys.exit(1)

if not state_mesh_ok:
    print('{"check":"constitutional_status","passed":false,"message":"state_mesh_ok=false"}')
    sys.exit(1)

print('{"check":"constitutional_status","passed":true,"message":"All constitutional flags true"}')
EOF
)

echo "$result"
[[ "$result" == *'"passed":true'* ]] && exit 0 || exit 1
