#!/usr/bin/env bash
set -Eeuo pipefail

echo "🚀 Provisioning Cowlitz County infrastructure..."

# Create Cowlitz-specific docker-compose override
cat > compose/docker-compose.cowlitz.yml <<COMPOSE
version: '3.8'
services:
  db:
    image: postgis/postgis:16-3.4
    container_name: cowlitz-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    networks: [ ${TF_NETWORK} ]

  redis:
    image: redis:7-alpine
    container_name: cowlitz-redis
    ports: ["6379:6379"]
    networks: [ ${TF_NETWORK} ]

  core:
    image: terrafusion/core:latest
    container_name: cowlitz-core
    environment:
      COUNTY_NAME: "${COUNTY_NAME}"
      COUNTY_CODE: "${COUNTY_CODE}"
      COWLITZ_DEMO_MODE: "true"
    ports: ["${COWLITZ_API_PORT:-8020}:${TF_STATIC_PORT:-8080}"]
    networks: [ ${TF_NETWORK} ]

  ui:
    image: terrafusion/ui:latest
    container_name: cowlitz-ui
    environment:
      NEXT_PUBLIC_API_BASE: http://localhost:${COWLITZ_API_PORT:-8020}
      NEXT_PUBLIC_COUNTY_NAME: "${COUNTY_NAME}"
    ports: ["${COWLITZ_DEMO_PORT:-3020}:${TF_FRONTEND_PORT:-3102}"]
    networks: [ ${TF_NETWORK} ]

networks:
  ${TF_NETWORK}:
    external: true
COMPOSE

export COMPOSE_PROJECT_NAME=terrafusion_cowlitz
docker-compose -f compose/docker-compose.cowlitz.yml pull || true
docker-compose -f compose/docker-compose.cowlitz.yml up -d db redis

# Wait for Cowlitz Postgres
until docker exec cowlitz-postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do
  echo "⏳ Waiting for Cowlitz Postgres..."; sleep 2;
done

echo "✅ Cowlitz County infrastructure provisioned."
