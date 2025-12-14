#!/usr/bin/env bash
# Check: Metrics Endpoint
# Verifies /metrics exposes required Prometheus metrics

set -euo pipefail

BASE_URL="${1:-http://localhost:5000}"
TIMEOUT="${2:-10}"

response=$(curl -s -w "\n%{http_code}" --connect-timeout "$TIMEOUT" "${BASE_URL}/metrics" 2>/dev/null || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [[ "$http_code" != "200" ]]; then
    echo "{\"check\":\"metrics_endpoint\",\"passed\":false,\"message\":\"Returns $http_code\"}"
    exit 1
fi

# Check for required metrics
required_metrics=("tf_speclock_ok" "tf_state_mesh_ok" "tf_receipt_count")
missing=()

for metric in "${required_metrics[@]}"; do
    if ! echo "$body" | grep -q "^${metric}"; then
        missing+=("$metric")
    fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
    echo "{\"check\":\"metrics_endpoint\",\"passed\":false,\"message\":\"Missing: ${missing[*]}\"}"
    exit 1
fi

echo '{"check":"metrics_endpoint","passed":true,"message":"All required metrics present"}'
exit 0
