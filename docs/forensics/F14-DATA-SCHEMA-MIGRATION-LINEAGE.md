# F14 — Data / Schema / Migration Lineage Audit

*Loop 2 deliverable.* Status: **complete**. Confidence: **high**.
Goal: one lineage or multiple conflicting histories for DB schema/migrations/persistence.

## Verdict: MULTIPLE CONFLICTING LINEAGES

## Migration lineage map

| DbContext | Migrations dir | Provider | Count | Status |
|---|---|---|---|---|
| `TerraFusionDbContext` | `backend/src/TerraFusion.Data/Migrations/` | PostgreSQL + runtime SQLite fallback | 197 files (~98 migrations) | ACTIVE (primary) |
| `LevyDbContext` | `backend/src/TerraFusion.Levy/Migrations/` | PostgreSQL only | 9 files | ACTIVE |
| `CurrentUseDbContext` | `backend/src/TerraFusion.CurrentUse/Migrations/` | PostgreSQL, **hardcoded schema "currentuse"** | 2 files | ACTIVE |
| `TerraFusion.Experiments` | `backend/TerraFusion.Experiments/Migrations/` | raw SQL, no EF | 1 `.sql` | ORPHANED |

Three EF contexts with **separate lineages** + one orphaned raw-SQL table. No single schema SSOT.

## Schema truth conflicts

| Domain | Definition A | Definition B | Conflict |
|---|---|---|---|
| **LevyCertification** | `TerraFusion.Core/Entities/LevyCertification.cs` (int PK, ~11 fields, basic audit) | `TerraFusion.Levy/Models/LevyCertification.cs` (Guid PK, 40+ fields, SHA-256 attestation, banked capacity) | 🔴 **CRITICAL — two incompatible schemas for one domain; both registered as `DbSet<LevyCertification>`** (TerraFusionDbContext + LevyDbContext). DI ordering decides which "wins". |
| Properties / PACS slices (Legacy/Truth/Canonical/SyncBridge/SyncProfile) | unified under `TerraFusionDbContext` | — | ✅ no split |

`ITerraFusionDbContext` (`TerraFusion.Core/Interfaces`) declares `DbSet<LevyCertification>`
while `TerraFusion.Levy` owns the complex variant → interface/ownership contradiction.

## Provider drift register

| Issue | Evidence | Risk |
|---|---|---|
| Runtime PG↔SQLite switch | `TerraFusionDbContext.OnConfiguring` (Host= detection) | SQLite path untested in CI |
| CurrentUse hardcodes PG schema | `HasDefaultSchema("currentuse")` | breaks on SQLite (no schemas) |
| Levy has no provider fallback | no `OnConfiguring` | PG-only |
| `fix/currentuse-sqlite-provider-fix` branch | exists, **unmerged** | known fix unapplied |

## Generated-contract contradictions
- Model snapshots consistent with their own contexts.
- `ITerraFusionDbContext` LevyCertification claim contradicts Levy ownership (above).
- `Levy_Schema_And_Seed.sql` (hand-maintained) may drift from migration up/down.

## PACS sync lineage
Unified under `TerraFusionDbContext` (Legacy → Truth → Canonical → SyncBridge → SyncProfile
slices). Mapping/transform logic for the marketplace `terra-fusion-sync` module lives in QUARANTINE.

## Top remediation lead (for R-lanes, not actioned now)
Resolve `LevyCertification` dual-definition (consolidate to one entity, one DbSet) and apply
`fix/currentuse-sqlite-provider-fix`. Both are recorded as salvage leads under recovery lock.
