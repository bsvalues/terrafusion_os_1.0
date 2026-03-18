# Wave 5 Deployment Readiness: Postgres + pgvector

**Status:** Pending — requires live PostgreSQL + pgvector target
**Sealed:** Wave 5 (2026-03-18)

---

## What Was Done in Wave 4

- `DbSet<GPTConfiguration> GPTConfigurations` activated in `TerraFusionDbContext`
- `DbSet<GPTConversation> GPTConversations` activated in `TerraFusionDbContext`
- 7 additional AI entity types registered via the `OnModelCreatingExtensions` hook (wired in `Program.cs`)
- `Program.cs` fully wired for real EF persistence on all GPT/RAG paths
- 13 Wave 4 contract tests green
- 2,807 backend tests passing overall

---

## What Is Deferred to First Live-DB Sprint

- EF migration generation — the `ActivateAiPersistence` migration has **not** been committed because no live PostgreSQL + pgvector database was available during Wave 4 development (SQLite and in-memory providers were used throughout)
- Migration apply + end-to-end smoke test against a real PostgreSQL instance
- pgvector vector column validation — `RAGEmbedding.Embedding` is declared as `float[]` and must map to `vector(1536)` via the pgvector EF provider; this mapping cannot be verified without a live pgvector-enabled database

---

## Prerequisites

1. PostgreSQL 15+ running and reachable from the build/deploy host
2. pgvector extension installed in the target database:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. `POSTGRES_CONNECTION_STRING` environment variable set (format: `Host=...;Database=terrafusion;Username=...;Password=...`)
4. .NET 8 SDK and EF Core global tools installed:
   ```bash
   dotnet tool install --global dotnet-ef
   ```

---

## Migration Commands

```bash
# Step 1: Generate migration (one-time, only if not yet committed)
dotnet ef migrations add ActivateAiPersistence \
  --project backend/src/TerraFusion.Data \
  --startup-project backend/src/TerraFusion.API

# Step 2: Apply migration to the live database
dotnet ef database update \
  --project backend/src/TerraFusion.Data \
  --startup-project backend/src/TerraFusion.API

# Step 3: Verify tables were created (psql)
psql -c "\dt GPT*; \dt RAG*;"
```

Alternatively, run the packaged deploy script which handles idempotency checks:

```bash
POSTGRES_CONNECTION_STRING="Host=...;Database=terrafusion;Username=...;Password=..." \
./scripts/deploy-pgvector-migration.sh
```

---

## Smoke Test: GPT Persistence Round-Trip

After the migration is applied, run the Wave 4 test suite against the real database to confirm end-to-end persistence:

```bash
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj \
  --filter "FullyQualifiedName~Wave4" \
  --environment "ASPNETCORE_ENVIRONMENT=Production"
```

All 13 Wave 4 tests must pass against the real database before Wave 5 is considered complete.

---

## Rollback

### Via SQL (manual drop)

```sql
DROP TABLE IF EXISTS "GPTAudit";
DROP TABLE IF EXISTS "GPTMarketplaceInstalls";
DROP TABLE IF EXISTS "GPTUsageMetrics";
DROP TABLE IF EXISTS "RAGEmbeddings";
DROP TABLE IF EXISTS "RAGDocuments";
DROP TABLE IF EXISTS "RAGDatasets";
DROP TABLE IF EXISTS "GPTMessages";
DROP TABLE IF EXISTS "GPTConversations";
DROP TABLE IF EXISTS "GPTConfigurations";
```

### Via EF Core (preferred)

```bash
dotnet ef database update <PreviousMigrationName> \
  --project backend/src/TerraFusion.Data \
  --startup-project backend/src/TerraFusion.API
```

Replace `<PreviousMigrationName>` with the migration that immediately precedes `ActivateAiPersistence` (visible via `dotnet ef migrations list`).
