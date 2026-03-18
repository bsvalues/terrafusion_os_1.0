# Wave 5 Deployment Readiness: Postgres + pgvector

**Status:** COMPLETE — live migration applied and smoke tested 2026-03-18
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

## Live-DB Sprint Execution Record (2026-03-18)

### What Was Done
- **Phase 1:** Provisioned `pgvector/pgvector:pg16` container (`terrafusion-pgvector`) on port 5433; pgvector 0.8.2 verified via `CREATE EXTENSION IF NOT EXISTS vector`
- **Phase 2:** Generated `20260318153801_ActivateAiPersistence` migration — 9 AI entity tables, all foreign keys, all indexes, county isolation columns on all scoped entities
- **Phase 3:** Applied migration via `psql -f activate_ai_persistence.sql` (direct SQL injection; see note below). All 47 tables confirmed in `\dt`. Migration recorded in `__EFMigrationsHistory`
- **Phase 4:** Smoke tests — all 4 tests green:
  - ✅ GPT Configuration persistence (INSERT + RETURNING)
  - ✅ Conversation + Message round-trip (FK constraints valid)
  - ✅ County isolation (Benton-only query returns 0 Yakima rows)
  - ✅ RAGEmbedding `real[]` storage and retrieval

### Embedding Column: ✅ Upgraded to vector(1536) (Phase 6, 2026-03-18)
`RAGEmbedding.Embedding` was stored as `real[]` at R1. Phase 6 of the Post-R1 R3 roadmap
delivered the full native vector upgrade:
- `Pgvector.EntityFrameworkCore` 0.2.0 added; `UseVector()` registered on all Npgsql options
- `EnableNativeVectorColumn` migration applied — `ALTER COLUMN TYPE vector(1536) USING "Embedding"::vector(1536)`
- `IX_RAGEmbeddings_Embedding_ivfflat` (ivfflat cosine index) created
- Provider-aware EF config: `HasConversion(float[] ↔ Pgvector.Vector)` skipped for InMemory
- All 2,810 dotnet tests pass; all 4 frontend gates green
- Distance queries (`<=>`) and county-scoped nearest-neighbour search are now operational

### Dev Note: Npgsql SCRAM-SHA-256 via Docker NAT
`dotnet ef database update` with `--connection` flag failed authentication from host → container via Docker NAT (SCRAM-SHA-256 challenge with pgvector container). Workaround: use `dotnet ef migrations script --idempotent` to generate SQL, then `docker cp` + `psql -f` inside the container. This is a dev environment quirk; production connections use direct network (no Docker NAT layer).

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
