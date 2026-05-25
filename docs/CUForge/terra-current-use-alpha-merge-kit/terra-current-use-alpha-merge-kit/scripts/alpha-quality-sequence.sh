#!/usr/bin/env bash
set -euo pipefail

echo "== Current Use Alpha Quality Sequence =="

echo "Frontend typecheck"
pnpm exec tsc --noEmit

echo "Frontend tests"
pnpm test -- current-use --runInBand

echo "Backend build"
dotnet build --configuration Release

echo "Backend Current Use tests"
dotnet test --configuration Release --filter "FullyQualifiedName~CurrentUse"

echo "Boundary check"
node scripts/current-use-boundary-check.mjs src/modules/terra-current-use

echo "Alpha quality sequence passed."
