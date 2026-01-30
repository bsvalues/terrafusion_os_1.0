#!/usr/bin/env bash
# Check: Readiness Endpoint
# Verifies /healthz/ready returns 200 when constitutional flags are true

set -euo pipefail

BASE_URL="${1:-http://localhost:5000}"
TIMEOUT="${2:-10}"

response=$(curl -s -w "\n%{http_code}" --connect-timeout "$TIMEOUT" "${BASE_URL}/healthz/ready" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)

if [[ "$http_code" == "200" ]]; then
    echo '{"check":"readiness_endpoint","passed":true,"message":"Returns 200 OK"}'
    exit 0
elif [[ "$http_code" == "000" ]]; then
    echo '{"check":"readiness_endpoint","passed":false,"message":"Unreachable"}'
    exit 2
else
    echo "{\"check\":\"readiness_endpoint\",\"passed\":false,\"message\":\"Returns $http_code (expected 200)\"}"
    exit 1
fi
