#!/usr/bin/env bash
set -Eeuo pipefail

# Source environment variables
source .env.benton

# Create network if it doesn't exist
docker network create ${TF_NETWORK} --subnet=${TF_SUBNET} 2>/dev/null || echo "Network ${TF_NETWORK} already exists"

# Pull images (best effort)
docker compose -f compose/docker-compose.demo.yml pull || true

# Up DB/Redis first for healthchecks
export COMPOSE_PROJECT_NAME=terrafusion_benton

docker compose --env-file .env.benton -f compose/docker-compose.demo.yml up -d db redis

# Wait for Postgres readiness
until docker exec terrafusion_benton-db-1 pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do
  echo "Waiting for Postgres..."; sleep 2;
done

echo "Infra provisioned."
