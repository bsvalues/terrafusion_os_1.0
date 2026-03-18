# Post-R1 Story: Upgrade RAGEmbedding.Embedding from real[] to vector(1536)

**Status:** Open — Post-R1 enhancement, not release debt
**Created:** 2026-03-18
**Classification:** Performance-grade vector search enablement
**Priority:** Post-R1 (non-blocking for TerraFusion OS 1.0 release)

---

## Context

During the live-db sprint (2026-03-18), `RAGEmbedding.Embedding` was stored as PostgreSQL
`real[]` rather than `vector(1536)`. This was a deliberate trade-off: the `Pgvector.EntityFrameworkCore`
package was not present, the `[Column(TypeName = "vector(1536)")]` entity attribute was overridden
by fluent API `HasColumnType("real[]")`, and the migration generated and applied cleanly.

**What works today (R1):**
- Embedding vectors are stored and retrieved correctly as `float[]` / `real[]`
- All existing GPT/RAG persistence paths function
- County isolation holds for all embedding rows
- The pgvector extension (0.8.2) is installed in the target database

**What this story unlocks (Post-R1):**
- Native pgvector distance queries: `<->` (L2), `<=>` (cosine), `<#>` (inner product)
- Index-accelerated nearest-neighbor search via `ivfflat` or `hnsw` indexes
- Semantic similarity search in the Herald RAG pipeline at production scale

---

## Success Criteria

- [ ] `Pgvector.EntityFrameworkCore` added to `Directory.Packages.props`
- [ ] Package reference added to `TerraFusion.Data.csproj` (and `TerraFusion.AI.csproj` if needed)
- [ ] `UseVector()` called in `TerraFusionDbContextFactory.cs` Npgsql options
- [ ] `UseVector()` called in `Program.cs` `AddDbContext` Npgsql options
- [ ] `HasColumnType("real[]")` override removed from `GptAiEntityConfigurations.cs`; fluent API defers to `[Column(TypeName = "vector(1536)")]` entity attribute
- [ ] EF migration generated — verifies column type change in `Up()`:
  ```sql
  ALTER TABLE "RAGEmbeddings"
    ALTER COLUMN "Embedding" TYPE vector(1536)
    USING "Embedding"::vector(1536);
  ```
- [ ] Migration applied to live pgvector database; column confirmed as `vector(1536)` via `\d "RAGEmbeddings"`
- [ ] Nearest-neighbor query test added and passing (see test stub below)
- [ ] Existing embedding round-trip tests remain green
- [ ] Deployment runbook updated: note minimum pgvector version (0.5.0+), extension must be active before migration runs

---

## Test Stub

```csharp
public sealed class VectorQueryIntegrationTests
{
    [Fact]
    public async Task Embedding_Can_Be_Persisted_As_Vector1536() { }

    [Fact]
    public async Task Cosine_Or_L2_Distance_Query_Returns_Expected_Nearest_Neighbor() { }

    [Fact]
    public async Task CountyIsolation_Holds_For_Vector_Search() { }
}
```

Tests must run against a real PostgreSQL + pgvector instance (not in-memory or SQLite).
Use the `IDesignTimeDbContextFactory` pattern with a dedicated test connection string.

---

## Migration Safety Notes

1. **Extension must exist before migration runs.** Verify with:
   ```sql
   SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
   ```
2. **The USING cast is safe** when `real[]` contains exactly 1536 elements. If any row has
   a different length, the cast will fail. Add a pre-migration guard:
   ```sql
   SELECT COUNT(*) FROM "RAGEmbeddings"
   WHERE array_length("Embedding", 1) != 1536;
   ```
   This must return 0 before running the migration.
3. **Table lock.** `ALTER COLUMN TYPE` acquires an `ACCESS EXCLUSIVE` lock. Run during a
   maintenance window or after setting `lock_timeout`.
4. **Index.** After column conversion, add a pgvector index for production query performance:
   ```sql
   CREATE INDEX CONCURRENTLY ON "RAGEmbeddings"
   USING ivfflat ("Embedding" vector_cosine_ops) WITH (lists = 100);
   ```

---

## Files to Touch

| File | Change |
|------|--------|
| `backend/Directory.Packages.props` | Add `Pgvector.EntityFrameworkCore` version pin |
| `backend/src/TerraFusion.Data/TerraFusion.Data.csproj` | Add package reference |
| `backend/src/TerraFusion.Data/TerraFusionDbContextFactory.cs` | Add `.UseVector()` |
| `backend/src/TerraFusion.API/Program.cs` | Add `.UseVector()` to `AddDbContext` |
| `backend/src/TerraFusion.AI/Data/GptAiEntityConfigurations.cs` | Remove `HasColumnType("real[]")` override |
| `backend/src/TerraFusion.Data/Migrations/` | New migration: `EnableNativeVectorColumn` |
| `.governance/wave5-deployment-readiness.md` | Mark vector upgrade complete |

---

## Do Not Reopen From R1

- Waves 0–5 architecture
- Wave 4 EF persistence wiring
- Wave 2 route surface
- Wave 5 CI gates
- Live-db sprint smoke tests

The R1 release baseline is frozen at commit `4fb924cc5`.
