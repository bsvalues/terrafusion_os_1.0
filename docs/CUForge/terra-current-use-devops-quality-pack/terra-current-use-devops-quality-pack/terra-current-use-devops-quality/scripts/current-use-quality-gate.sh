#!/usr/bin/env bash
set -euo pipefail

echo "== Terra Current Use Quality Gate =="

echo "1. Frontend typecheck"
pnpm exec tsc --noEmit

echo "2. Frontend tests"
pnpm test -- current-use --runInBand

echo "3. Backend build"
dotnet build --configuration Release

echo "4. Backend Current Use tests"
dotnet test --configuration Release --filter "FullyQualifiedName~CurrentUse"

echo "5. Static boundary check"
if grep -R "APPROVE_CLASSIFICATION\\|DENY_CLASSIFICATION\\|WAIVE_PENALTY" src/modules/terra-current-use 2>/dev/null; then
  echo "Forbidden AI/legal action string found in frontend module."
  exit 1
fi

echo "Quality gate passed."
