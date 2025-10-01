#!/usr/bin/env bash
set -Eeuo pipefail

docker compose -f compose/docker-compose.demo.yml down -v || true

echo "Stack stopped & volumes removed."
