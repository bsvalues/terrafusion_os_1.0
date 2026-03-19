#!/usr/bin/env bash
# =============================================================================
# deploy-pgvector-migration.sh
# TerraFusion OS — Wave 5 PostgreSQL + pgvector migration runner
#
# WARNING: This script requires a live PostgreSQL database with the pgvector
# extension enabled. Run the following in psql before executing this script:
#   CREATE EXTENSION IF NOT EXISTS vector;
#
# Usage:
#   POSTGRES_CONNECTION_STRING="Host=...;Database=terrafusion;Username=...;Password=..." \
#   ./scripts/deploy-pgvector-migration.sh
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
ENVIRONMENT="${ASPNETCORE_ENVIRONMENT:-Production}"
MIGRATION_NAME="ActivateAiPersistence"
DATA_PROJECT="backend/src/TerraFusion.Data"
STARTUP_PROJECT="backend/src/TerraFusion.API"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
info()    { echo "  $*"; }
success() { echo "✅ $*"; }
fail()    { echo "❌ $*" >&2; exit 1; }
section() { echo ""; echo "──────────────────────────────────────────"; echo "  $*"; echo "──────────────────────────────────────────"; }

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------
section "TerraFusion OS — pgvector Migration Deploy"
info "Environment : $ENVIRONMENT"
info "Repo root   : $REPO_ROOT"

# Verify dotnet is available
command -v dotnet &>/dev/null || fail "dotnet CLI not found. Install .NET 8 SDK first."
success "dotnet CLI found: $(dotnet --version)"

# Verify EF tools are available
dotnet ef --version &>/dev/null || fail "dotnet-ef tool not found. Run: dotnet tool install --global dotnet-ef"
success "dotnet-ef found: $(dotnet ef --version 2>/dev/null | head -1)"

# Verify connection string
if [[ -n "${POSTGRES_CONNECTION_STRING:-}" ]]; then
  info "Using POSTGRES_CONNECTION_STRING from environment."
  export ConnectionStrings__DefaultConnection="$POSTGRES_CONNECTION_STRING"
elif [[ -n "${ConnectionStrings__DefaultConnection:-}" ]]; then
  info "Using ConnectionStrings__DefaultConnection from environment."
else
  echo ""
  echo "⚠️  WARNING: Neither POSTGRES_CONNECTION_STRING nor ConnectionStrings__DefaultConnection"
  echo "   is set. The EF tools will fall back to appsettings.$ENVIRONMENT.json."
  echo "   If that file does not have a valid PostgreSQL connection string, this will fail."
  echo ""
fi

export ASPNETCORE_ENVIRONMENT="$ENVIRONMENT"

# ---------------------------------------------------------------------------
# Change to repo root so relative project paths resolve correctly
# ---------------------------------------------------------------------------
cd "$REPO_ROOT"

# ---------------------------------------------------------------------------
# Step 1: Check whether the migration already exists
# ---------------------------------------------------------------------------
section "Step 1 — Check for existing migration"

MIGRATIONS_DIR="$REPO_ROOT/$DATA_PROJECT/Migrations"
MIGRATION_FILE_PATTERN="${MIGRATIONS_DIR}/*_${MIGRATION_NAME}.cs"

# Use glob expansion; if no match, array is empty
shopt -s nullglob
existing=( $MIGRATION_FILE_PATTERN )
shopt -u nullglob

if [[ ${#existing[@]} -gt 0 ]]; then
  success "Migration '$MIGRATION_NAME' already exists: ${existing[0]##*/}"
  info "Skipping migration generation — proceeding directly to database update."
  SKIP_ADD=true
else
  info "Migration '$MIGRATION_NAME' not found. Will generate it."
  SKIP_ADD=false
fi

# ---------------------------------------------------------------------------
# Step 2: Generate migration (if needed)
# ---------------------------------------------------------------------------
section "Step 2 — Generate EF migration"

if [[ "$SKIP_ADD" == "false" ]]; then
  info "Running: dotnet ef migrations add $MIGRATION_NAME ..."
  dotnet ef migrations add "$MIGRATION_NAME" \
    --project "$DATA_PROJECT" \
    --startup-project "$STARTUP_PROJECT" \
    --verbose
  success "Migration '$MIGRATION_NAME' generated successfully."
else
  info "Skipped (migration already committed)."
fi

# ---------------------------------------------------------------------------
# Step 3: Apply migration to the database
# ---------------------------------------------------------------------------
section "Step 3 — Apply migration (dotnet ef database update)"

info "Running: dotnet ef database update ..."
dotnet ef database update \
  --project "$DATA_PROJECT" \
  --startup-project "$STARTUP_PROJECT" \
  --verbose

success "Database update complete."

# ---------------------------------------------------------------------------
# Step 4: Done
# ---------------------------------------------------------------------------
section "Wave 5 Migration — Complete"
success "PostgreSQL schema is up to date."
info "Next step: run Wave 4 smoke tests against the live DB:"
info "  dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj \\"
info "    --filter 'FullyQualifiedName~Wave4' \\"
info "    --environment 'ASPNETCORE_ENVIRONMENT=$ENVIRONMENT'"
echo ""
