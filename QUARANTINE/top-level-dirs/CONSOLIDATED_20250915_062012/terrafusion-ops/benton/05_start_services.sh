#!/usr/bin/env bash
set -Eeuo pipefail

docker compose -f compose/docker-compose.demo.yml up -d api ui grafana prometheus

echo "Services started."
