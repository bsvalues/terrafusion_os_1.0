#!/usr/bin/env bash
set -Eeuo pipefail

# If championship demo scripts exist, invoke them; otherwise, present fallback URLs
if [[ -x ./championship/scripts/demo_benton.sh ]]; then
  ./championship/scripts/demo_benton.sh || true
else
  echo "(info) demo_benton.sh not found; using fallback."
fi

# Output demo endpoints
echo "Demo ready:\n  UI:        http://localhost:\${{TF_FRONTEND_PORT:-3000}}\n  API:       http://localhost:\${{TF_FRONTEND_PORT:-3000}}\n  Grafana:   http://localhost:\${{TF_FRONTEND_PORT:-3000}}\n  Prometheus:http://localhost:\${{TF_FRONTEND_PORT:-3000}}"
