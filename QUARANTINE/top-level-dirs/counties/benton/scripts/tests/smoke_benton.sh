#!/usr/bin/env bash
set -euo pipefail

API_URL=${API_URL:-http://localhost:5000}

echo "[smoke] Checking ${API_URL}/health ..."
if curl -fsS "${API_URL}/health" > /dev/null; then
  echo "[smoke] /health OK"
else
  echo "[smoke] /health FAILED" >&2
  exit 1
fi

# Optional status endpoint
if curl -fsS "${API_URL}/api/v1/status" > /dev/null; then
  echo "[smoke] /api/v1/status OK"
else
  echo "[smoke] /api/v1/status not available (non-fatal)"
fi

echo "[smoke] Completed"#!/usr/bin/env bash
set -euo pipefail
echo "[API] /health"
curl -fsS http://localhost:5000/health
echo "[API] /api/v1/status (if present)"
curl -fsS "http://localhost:5000/api/v1/status?county=benton" || true
echo "OK"
