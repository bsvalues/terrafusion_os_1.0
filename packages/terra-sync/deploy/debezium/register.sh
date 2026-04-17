#!/usr/bin/env bash
# Registers (or re-registers) a Debezium connector at the local Kafka
# Connect REST API. Prints the registration response, a list of current
# connectors, and the status of the one just registered.
#
# Usage:
#   ./register.sh                                  # default: connectors/benton-harris-pacs.json
#   ./register.sh connectors/other-connector.json
#   CONNECT=http://connect-host:8083 ./register.sh

set -euo pipefail

CONNECT="${CONNECT:-http://localhost:8083}"
CFG="${1:-connectors/benton-harris-pacs.json}"

if ! [ -f "$CFG" ]; then
  echo "config file not found: $CFG" >&2
  exit 1
fi

NAME="$(jq -r .name "$CFG")"
echo "Registering $NAME from $CFG at $CONNECT"

# Idempotent: if the connector already exists, PUT the config (update),
# otherwise POST (create).
if curl -sf "$CONNECT/connectors/$NAME" > /dev/null; then
  echo "Connector $NAME already exists; updating config via PUT"
  CONFIG_JSON="$(jq .config "$CFG")"
  curl -sf -X PUT -H "Content-Type: application/json" \
    "$CONNECT/connectors/$NAME/config" \
    -d "$CONFIG_JSON" | jq .
else
  curl -sf -X POST -H "Content-Type: application/json" \
    "$CONNECT/connectors" \
    -d @"$CFG" | jq .
fi

echo ""
echo "Current connector list:"
curl -sf "$CONNECT/connectors" | jq .

echo ""
echo "Status of $NAME:"
curl -sf "$CONNECT/connectors/$NAME/status" | jq .
