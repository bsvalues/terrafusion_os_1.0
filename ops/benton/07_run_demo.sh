#!/usr/bin/env bash
set -Eeuo pipefail

# If championship demo scripts exist, invoke them; otherwise, present fallback URLs
if [[ -x ./championship/scripts/demo_benton.sh ]]; then
  ./championship/scripts/demo_benton.sh || true
else
  echo "(info) demo_benton.sh not found; using fallback."
fi

# Output demo endpoints
echo "Demo ready:\n  UI:        http://localhost:3000\n  API:       http://localhost:8080\n  Grafana:   http://localhost:3001\n  Prometheus:http://localhost:9090"
