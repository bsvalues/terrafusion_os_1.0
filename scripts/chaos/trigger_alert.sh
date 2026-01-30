#!/bin/bash
# scripts/chaos/trigger_alert.sh
# Purpose: Generate traffic and anomaly patterns to trigger Prometheus alerts
# defined in config/alert_rules.yml

SERVER_URL="http://localhost:5000"

echo "=== TerraFusion Chaos Generator ==="
echo "Target: $SERVER_URL"

# 1. Simulating High Latency (CortexLatency)
# We need to find an endpoint that is slow or flood it.
echo "[Chaos] Generating concurent load to spike latency..."
for i in {1..50}; do
    curl -s "$SERVER_URL/api/health" > /dev/null &
done

# 2. Simulating Error Rate (HighErrorRate)
# Sending malformed JSON to trigger 400/500s
echo "[Chaos] Sending malformed requests to trigger errors..."
for i in {1..20}; do
    curl -X POST "$SERVER_URL/api/auth/login" \
         -H "Content-Type: application/json" \
         -d "{ 'broken_json': true, " \
         -s > /dev/null &
done

# 3. Simulating Down State (IronBodyDown)
# This requires stopping the container.
echo "[Chaos] To trigger 'IronBodyDown', run: docker stop terrafusion-backend"

wait
echo "=== Chaos Injection Complete ==="
