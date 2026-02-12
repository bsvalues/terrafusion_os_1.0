#!/usr/bin/env bash
set -Eeuo pipefail

echo "🚀 Starting Cowlitz County services..."

export COMPOSE_PROJECT_NAME=terrafusion_cowlitz
docker-compose -f compose/docker-compose.cowlitz.yml up -d

# Wait for services to be ready
sleep 10

echo "✅ Cowlitz County services started."
echo "🌐 Cowlitz Demo: http://localhost:${COWLITZ_DEMO_PORT}"
echo "🔌 Cowlitz API: http://localhost:${COWLITZ_API_PORT}"
