#!/usr/bin/env bash
set -euo pipefail

echo "== TerraFusion Canon/IDE Truth Gate =="
echo "This script expects to be run from the TerraFusion repo root."

echo "1) Backend build"
dotnet build backend/TerraFusion.sln

echo "2) Frontend type-check"
pnpm run type-check

echo "3) Shell/Canon launch wiring search"
rg -n "os-canon|os-pilot|os-trace|moduleComponents|activateModule|navigate\(" frontend/apps/os-shell/src || true

echo "4) Governance enforcement search"
rg -n "AGENT_ENTRYPOINT|SEAL|hardcoded port|Trace Events|TerraTrace" .github os-platform frontend backend || true

echo "Truth Gate complete."
