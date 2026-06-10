# WO-0015 — Dais Live-DB Migration Verify (read-only)

**Date:** 2026-06-10 · **Verdict: APPLIED** — `20260317074518_AddDaisEntities` is applied to the live dev database; all five Dais tables exist. D-002's in-memory-provider gap is closed. One unrelated finding: a single out-of-order PENDING migration (Sync lane) → D-016.

## Effective connection
`appsettings.Development.local.json` overrides committed Development settings (memory-lesson check performed): `Host=127.0.0.1;Database=terrafusion;Username=postgres;Password=***;Port=5432`. Live server = docker container `terrafusion-postgres-dev` (pgvector/pgvector:pg16).

## Evidence chain (zero schema mutation — list/select only)
1. `dotnet ef migrations list --project src/TerraFusion.Data --startup-project src/TerraFusion.API --context TerraFusionDbContext --no-build` (API as startup per [[feedback_ef_migration_startup]]; `--no-build` avoids the D-001 dev-API DLL lock; `--context` required — multiple DbContexts in API).
   - 97 migrations listed, `20251027125937_InitialCreate` … `20260609060000_AddQuarantineReviewDecisionRowRef`.
   - `20260317074518_AddDaisEntities` listed **without** `(Pending)` → applied.
   - Exactly ONE pending: `20260608053127_AddRevenueSpineStage2BAssessmentBill (Pending)` — OUT OF ORDER (five later 2026-06-08/09 migrations are applied).
2. Direct DB cross-check (`docker exec terrafusion-postgres-dev psql … terrafusion`):
   - `__EFMigrationsHistory` contains `20260317074518_AddDaisEntities`; total 107 rows (other DbContexts share the DB).
   - `RevenueSpineStage2B` absent from history — confirms the pending marker.
   - Tables present: **Appeals, Exemptions, CertificationSteps, Notices, QueueItems** (all five Dais entities) — plus LevyCertifications, pacs_appeals/pacs_exemptions (other lanes).

## Finding → D-016 (P2, Sync/Data owner)
`AddRevenueSpineStage2BAssessmentBill` exists in code but was never applied, while later migrations were — an out-of-order apply by the fleet's Revenue-A workstream. NOT applied here (WO stop condition: pending migration → record + queue an apply WO with operator approval; EF applies out-of-order ones on the next `database update`, but whether that's wanted is the Revenue lane's call — its `Up()` may collide with state Stage2B-dependent later migrations created manually).

## Release-gate impact
Dais persistence gate now fully closed: behavior (37 tests, D-002) + live schema (this WO). Remaining product gate in queue: dock/top-bar deep sweep (+G2), then LocalOps chain.
