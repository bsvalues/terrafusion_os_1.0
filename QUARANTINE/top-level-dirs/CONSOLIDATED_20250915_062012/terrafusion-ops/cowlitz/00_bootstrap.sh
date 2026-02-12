#!/usr/bin/env bash
set -Eeuo pipefail
: "${ROOT_DIR:=$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)}"

echo "🏆 Bootstrapping Cowlitz County Championship Infrastructure"

mkdir -p "$ARTIFACTS_DIR" "$DATA_DIR"

# Create Cowlitz Docker network if missing
if ! docker network ls --format '{{.Name}}' | grep -q "^${TF_NETWORK}$"; then
  docker network create --subnet "$TF_SUBNET" "$TF_NETWORK"
  echo "✅ Created Cowlitz network: $TF_NETWORK"
fi

# Create Cowlitz data structure
mkdir -p "$DATA_DIR"/{parcels,assessments,sales,demographics}

echo "✅ Cowlitz County bootstrap complete."
