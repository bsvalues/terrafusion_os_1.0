#!/usr/bin/env bash
set -Eeuo pipefail
: "${ROOT_DIR:=$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)}"

mkdir -p "$ARTIFACTS_DIR" "$DATA_DIR"

# Create Docker network if missing
if ! docker network ls --format '{{.Name}}' | grep -q "^${TF_NETWORK}$"; then
  docker network create --subnet "$TF_SUBNET" "$TF_NETWORK"
fi

echo "Bootstrap complete."
