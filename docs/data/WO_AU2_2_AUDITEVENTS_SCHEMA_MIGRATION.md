# WO-AU2-2 — AuditEvents Schema: CountyId + Trail Index

**Date:** 2026-07-02
**Authorization:** SW-02 (schema migration) granted by operator.
**Risk executed:** SW-02 — an **additive** EF migration was **generated and committed**. It was **NOT applied** to the
live demo DB (applying is deploy-time / SW-01; the demo's AutoMigrate will apply it on the next deploy). No live
data was mutated; no destructive DDL.

## Change
Extends `canonical` audit schema so AU2-3 event emission can populate county-scoped, efficiently-queryable rows:
- **`AuditEvent.CountyId`** — new `Guid?` property → `AuditEvents.CountyId uuid NULL`. Nullable + additive → existing
  rows (0 today) get `NULL`; no backfill required. Lets a future `/api/audit/trail` enforce true county isolation
  instead of parcel-scope-only.
- **Index `IX_AuditEvents_EntityId_Timestamp`** on `(EntityId, Timestamp)` — the exact access pattern of
  `/api/audit/trail` and `/api/audit/search` (filter by `EntityId`, order by `Timestamp`).

Both declared on the entity in `Core` (`[Index]` attribute + property); `Core` already references EF Core, so no new
dependency and the config stays colocated with the POCO.

## Migration
`backend/src/TerraFusion.Data/Migrations/20260703002317_AU2_2_AuditEventsCountyIdAndTrailIndex.cs`
```csharp
Up:   AddColumn<Guid>("CountyId", "AuditEvents", type: "uuid", nullable: true);
      CreateIndex("IX_AuditEvents_EntityId_Timestamp", "AuditEvents", ["EntityId","Timestamp"]);
Down: DropIndex(...); DropColumn("CountyId", ...);   // fully reversible
```

## Discipline & verification
- **Generated with API as `--startup-project`** (`dotnet ef migrations add … --project TerraFusion.Data
  --startup-project TerraFusion.API --context TerraFusion.Data.TerraFusionDbContext`) — per the standing rule that
  Data-as-startup scaffolds destructive DROPs. Confirmed working: the API host ran at design time (so
  `OnModelCreatingExtensions`, which applies the GPT/RAG configs, was set → **full model**), and the diff came out
  clean.
- **Migration inspected — surgical:** the generated `Up`/`Down` contain **only** the CountyId column and the one
  index. No table drops, no GPT/RAG churn, no `DocumentAuditEvents` (the `AuditEvent` subclass) changes.
- **Snapshot diff = 5 additions / 0 deletions**, all inside the `AuditEvent` model block.
- **Build:** API `/warnaserror` → 0 warnings / 0 errors (entity, migration, and snapshot all compile).
- **Not applied to any DB.** `AuditEvents` is empty, and even a populated table would be safe (nullable add + index
  create are non-destructive). The demo applies it on next deploy (SW-01).

## Scope honored / not done
- ✅ additive nullable column · ✅ `(EntityId, Timestamp)` index · ✅ API-as-startup · ✅ generated + inspected +
  reversible · ✅ no live-DB apply · ✅ no data mutation.
- **Next (not authorized):** AU2-3 (`IAuditEventWriter` + curated emission, populating `CountyId`), AU2-4 (ETL
  exclusion — already structurally true from AU2-1), AU2-5 (e2e verification). Applying this migration to the demo
  is a deploy action (SW-01).
