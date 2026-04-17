#!/usr/bin/env bash
# Creates the Kafka topics used by Phase 2 of the TerraFusion Sync v4
# pipeline. Idempotent; safe to rerun. Requires docker-compose.dev.yml
# to be up. See deploy/README.md.
#
# Usage:
#   ./bin/create-topics.sh
#   COMPOSE_FILE=alt.yml PARTITIONS=12 ./bin/create-topics.sh

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"
PARTITIONS="${PARTITIONS:-6}"
REPLICATION="${REPLICATION:-1}"

TOPICS=(
  sync.audit
  sync.anomaly
  sync.deadletter
  sync.canonical.property
  sync.canonical.cama
  sync.canonical.comparable_sales
  sync.canonical.property_assessments
  sync.source.harris.benton.property
  sync.source.harris.benton.imprv
  sync.source.harris.benton.sale
  sync.source.harris.benton.property_val
)

echo "Creating ${#TOPICS[@]} topics on kafka:9092 (via ${COMPOSE_FILE})..."
for t in "${TOPICS[@]}"; do
  docker compose -f "${COMPOSE_FILE}" exec -T kafka kafka-topics \
    --bootstrap-server kafka:9092 \
    --create --if-not-exists \
    --topic "$t" \
    --partitions "${PARTITIONS}" \
    --replication-factor "${REPLICATION}"
done

echo ""
echo "Current topic list:"
docker compose -f "${COMPOSE_FILE}" exec -T kafka kafka-topics \
  --bootstrap-server kafka:9092 --list | sort
