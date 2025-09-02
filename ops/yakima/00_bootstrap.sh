#!/usr/bin/env bash
set -Eeuo pipefail
: "${ROOT_DIR:=$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)}"

echo "🏆 YAKIMA COUNTY FLAGSHIP - Bootstrapping Championship Infrastructure"
echo "═══════════════════════════════════════════════════════════════════"

mkdir -p "$ARTIFACTS_DIR" "$DATA_DIR"

# Create Yakima flagship network
if ! docker network ls --format '{{.Name}}' | grep -q "^${TF_NETWORK}$"; then
  docker network create --subnet "$TF_SUBNET" "$TF_NETWORK"
  echo "✅ Created Yakima flagship network: $TF_NETWORK"
fi

# Create comprehensive Yakima data structure
mkdir -p "$DATA_DIR"/{parcels,assessments,sales,zoning,boundaries,demographics,agricultural,commercial}

# Create championship monitoring directories
mkdir -p "$ARTIFACTS_DIR"/{logs,reports,screenshots,performance,compliance}

echo "🚀 Yakima County flagship infrastructure ready for championship deployment!"
