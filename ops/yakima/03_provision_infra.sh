#!/usr/bin/env bash
set -Eeuo pipefail

echo "🚀 YAKIMA FLAGSHIP - Provisioning Championship Infrastructure"
echo "═══════════════════════════════════════════════════════════════"

# Create Yakima flagship docker-compose with championship features
cat > compose/docker-compose.yakima-flagship.yml <<COMPOSE
version: '3.8'
services:
  db:
    image: postgis/postgis:15-3.4
    container_name: yakima-postgres-flagship
    environment:
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: \${POSTGRES_DB}
    ports:
      - "5432:5432"
    networks: [ \${TF_NETWORK} ]
    volumes:
      - yakima_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER}"]
      interval: 5s
      timeout: 3s
      retries: 20

  redis:
    image: redis:7-alpine
    container_name: yakima-redis-flagship
    command: ["redis-server", "--appendonly", "yes"]
    ports: ["6379:6379"]
    networks: [ \${TF_NETWORK} ]
    volumes:
      - yakima_redis_data:/data

  core:
    image: terrafusion/core:flagship
    container_name: yakima-core-flagship
    environment:
      COUNTY_NAME: "\${COUNTY_NAME}"
      COUNTY_CODE: "\${COUNTY_CODE}"
      YAKIMA_FLAGSHIP_MODE: "true"
      CHAMPIONSHIP_MODE: "\${CHAMPIONSHIP_MODE}"
      AI_SWARM_SIZE: "\${AI_SWARM_SIZE}"
      TARGET_RESPONSE_TIME_MS: "\${TARGET_RESPONSE_TIME_MS}"
      MCP_ENABLED: "\${MCP_ENABLED}"
      CONNECTIONSTRINGS__POSTGRES: "Host=db;Port=5432;Database=\${POSTGRES_DB};Username=\${POSTGRES_USER};Password=\${POSTGRES_PASSWORD}"
      REDIS__HOST: redis
      JWT__SECRET: "\${JWT_SECRET}"
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_started }
    ports: ["\${YAKIMA_API_PORT}:${TF_STATIC_PORT:-8080}"]
    networks: [ \${TF_NETWORK} ]

  ui:
    image: terrafusion/ui:flagship
    container_name: yakima-ui-flagship
    environment:
      NEXT_PUBLIC_API_BASE: http://localhost:\${YAKIMA_API_PORT}
      NEXT_PUBLIC_COUNTY_NAME: "\${COUNTY_NAME}"
      NEXT_PUBLIC_CHAMPIONSHIP_MODE: "true"
      NEXT_PUBLIC_YAKIMA_FLAGSHIP: "true"
    depends_on:
      core: { condition: service_started }
    ports: ["\${YAKIMA_DEMO_PORT}:${TF_FRONTEND_PORT:-3102}"]
    networks: [ \${TF_NETWORK} ]

  prometheus:
    image: prom/prometheus:latest
    container_name: yakima-prometheus-flagship
    ports: ["\${YAKIMA_PROMETHEUS_PORT}:9090"]
    networks: [ \${TF_NETWORK} ]
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana-oss:latest
    container_name: yakima-grafana-flagship
    ports: ["\${YAKIMA_GRAFANA_PORT}:${TF_FRONTEND_PORT:-3102}"]
    networks: [ \${TF_NETWORK} ]
    volumes:
      - yakima_grafana_data:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: yakima_championship_2024

volumes:
  yakima_postgres_data:
  yakima_redis_data:
  yakima_grafana_data:

networks:
  \${TF_NETWORK}:
    external: true
COMPOSE

# Create monitoring configuration
mkdir -p monitoring
cat > monitoring/prometheus.yml <<PROM
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'yakima-core'
    static_configs:
      - targets: ['core:${TF_STATIC_PORT:-8080}']
  - job_name: 'yakima-ui'
    static_configs:
      - targets: ['ui:${TF_FRONTEND_PORT:-3102}']
PROM

export COMPOSE_PROJECT_NAME=terrafusion_yakima_flagship
docker-compose -f compose/docker-compose.yakima-flagship.yml pull || true
docker-compose -f compose/docker-compose.yakima-flagship.yml up -d db redis

# Wait for Yakima flagship Postgres with championship timing
echo "⏳ Waiting for Yakima flagship database..."
until docker exec yakima-postgres-flagship pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do
  echo "🔄 Yakima flagship database initializing..."; sleep 2;
done

echo "✅ Yakima County flagship infrastructure provisioned and ready!"
