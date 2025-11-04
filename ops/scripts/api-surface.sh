#!/usr/bin/env bash
set -euo pipefail
mkdir -p artifacts/apis artifacts/reports

# Generate/publish OpenAPI + GraphQL (stub)
echo '{"openapi":"3.1.0","info":{"title":"TerraFusion"}}' > artifacts/apis/openapi.json
cat > artifacts/apis/schema.graphql <<'GQL'
type Query { health: String! }
GQL

# Contract tests (placeholder)
[[ -s artifacts/apis/openapi.json ]] || { echo "OpenAPI missing"; exit 1; }
[[ -s artifacts/apis/schema.graphql ]] || { echo "GraphQL missing"; exit 1; }

echo "API surface OK"
