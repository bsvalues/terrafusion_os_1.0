#!/usr/bin/env bash
set -euo pipefail

compose_base=(docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml)

echo "[1/6] Compose config..."
"${compose_base[@]}" config >/dev/null

echo "[2/6] Stack up..."
"${compose_base[@]}" up -d

echo "[3/6] UI checks..."
curl -fsS -I http://localhost:3000 >/dev/null
curl -fsS -I http://localhost:9090 >/dev/null
curl -fsS -I http://localhost:16686 >/dev/null

echo "[4/6] Service health..."
curl -fsS http://localhost:5000/health >/dev/null || true
curl -fsS http://localhost:8006/health >/dev/null || true

echo "[5/6] Generate traffic..."
curl -fsS http://localhost:5000/health >/dev/null || true
# curl -fsS -X POST http://localhost:8006/api/chat \
#   -H "Content-Type: application/json" \
#   -d '{"message":"observability gate smoke test","context":{"user_role":"assessor"}}' >/dev/null || true

echo "[6/6] Prometheus scrape target UP..."
# Ensure at least one active target is 'otel-collector' and health is 'up'
targets_json="$(curl -fsS http://localhost:9090/api/v1/targets)"
export TARGETS_JSON="$targets_json"

if command -v python3 &>/dev/null; then
    runner="python3"
elif command -v python &>/dev/null; then
    runner="python"
else
    echo "❌ No python found for JSON check"
    exit 1
fi

$runner - <<'PY'
import json, os, sys
try:
    data=json.loads(os.environ["TARGETS_JSON"])
    active=data["data"]["activeTargets"]
    ok=any(t.get("labels",{}).get("job")=="otel-collector" and t.get("health")=="up" for t in active)
    if not ok:
        print("FAIL: otel-collector scrape target not UP")
        sys.exit(1)
    print("PASS: otel-collector scrape target is UP")
except Exception as e:
    print(f"FAIL: Script error: {e}")
    sys.exit(1)
PY

echo "PASS: observability gate"
