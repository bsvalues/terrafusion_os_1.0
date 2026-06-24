# F14 Migration Plan (gate criterion 4) — decision-only

*Turns the ratified SSOT (Levy module = system-of-record → Dais; Core levy = legacy) into a
**decision-ready migration map.** No code, no migration, no lock release.*

## Current sources of levy truth (evidence)
- **Legacy (main DB):** `TerraFusionDbContext.LevyCertifications` (DbSet, `TerraFusionDbContext.cs:508`),
  `int`-PK Core entity + the broader Core `Entities/Levy/*` legacy subdomain.
- **Authoritative (Levy DB):** `TerraFusion.Levy` module (`Guid`-PK, attested, separate DB).
- **Live cert surface writes to the LEGACY store:** `LevyCertificationController` injects
  `TerraFusionDbContext` and reports `Source = "TerraFusionDbContext.LevyCertifications"`
  → today's certifications land in the *legacy* main-DB store, **not** the SoR. (This is the
  data-truth split, live.)

## Consumer surface of the Core (legacy) levy store
~12 API controllers + 2 Core services + 2 seeders touch `.LevyCertifications` (Core):
`LevyCertification/Report/Forecast/Calculator/Search/Dashboard/Audit/DataQuality/BudgetImpact/
HistoricalAnalysis` controllers, `AuditController`, Core `NoticeService` + `CertificationService`,
`PacsDataSeeder` + `PacsCanonicalizer`.

**Classify each (→ resolves C vs D):**
| Consumer class | Disposition |
|---|---|
| Levy-specific controllers (Report/Forecast/Calculator/Search/Dashboard/DataQuality/Certification/BudgetImpact) | **move to TerraFusion-Dais**, consume the Levy SoR directly |
| Cross-cutting retained-in-core readers: `AuditController` (OS audit), `NoticeService`, `HistoricalAnalysisController`, PACS seeders | **retained** → need a levy **read** in core/main |

**Determination:** the retained-read set is **NON-EMPTY** (OS audit + notice + seeders + history
read levy data) ⇒ **lean Option C (Core = read projection)**, *not* D. D (delete Core levy) is
only viable if every one of those is also moved off main-DB levy reads — not the case today.
*(Final confirm = complete the per-consumer home assignment; current evidence = C.)*

## Target source of truth
**`TerraFusion.Levy` (Guid-PK, attested) in `TerraFusion-Dais`.** All *writes* go here. The
live `LevyCertificationController` write path is **repointed** from the Core store to the SoR.

## Existing main-DB levy DATA (must not be dropped)
- One-time **data migration** main-DB `LevyCertifications` → Levy SoR, with explicit mapping:
  `int Id` → `Guid Id` (generate; keep old int as `LegacyId` for trace), `Guid CountyId` →
  `string CountyId`, summary fields → rich fields (attestation fields null/backfilled).
  **Lossy in reverse** (rich→summary), so SoR is the forward direction only.
- Reconciliation report required (row counts, unmapped rows) before cutover.

## Migration lineages (103 vs 4)
- Core's `LevyCertifications` lives in the **main-DB** `TerraFusion.Data` lineage (103) — **frozen**, not merged.
- Levy's **4-migration** lineage becomes canonical for levy schema, owned by Dais.
- **No lineage merge** (different DBs). If C: the projection table is a *new additive* main-DB migration.

## If C (projection) — the leaned path
- Core `LevyCertifications` becomes a **read-only projection** in main DB, populated from the Levy SoR via the sync→suite/Levy contract (criterion 5).
- **Refresh model:** event-driven on SoR write (preferred) or scheduled batch; staleness budget declared.
- **NO dual writes, NO shadow schema:** writes only to SoR; projection is derived.
- `ITerraFusionDbContext.LevyCertifications` becomes read-only (or replaced by a projection DTO).

## If D (deprecate) — only if retained-read set empties
- Delete Core `Entities/Levy/*`; drop the main-DB levy tables (after data migration); repoint ALL consumers to SoR; remove `ITerraFusionDbContext` levy sets.

## Cutover checkpoints
1. Data migrated + reconciliation report clean. 2. SoR write path proven (cert controller repointed in a branch). 3. (C) projection populated + staleness within budget / (D) all consumers repointed. 4. Read parity check (legacy vs SoR/projection). 5. Flip reads. 6. Freeze/retire legacy store.

## Rollback posture
- Pre-cutover: legacy store remains source; SoR runs in shadow-read (no consumer flip).
- Post-flip: keep legacy store **read-only frozen** (not deleted) for N releases; rollback = re-point reads to frozen legacy + replay SoR deltas.
- D is **not** rolled back by un-deleting — so do **C-then-maybe-D** (project first, delete later), never D first.

## Open risks
- Live cert writes currently hit the legacy store → in-flight data during cutover (freeze-write window needed).
- `int`→`Guid` PK remap breaks any external refs to the old int IDs (keep `LegacyId`).
- CountyId type change (`Guid`→`string`) — confirm county identity mapping is 1:1.
- `AuditController` reading levy → audit lineage must not break (AU-2 posture).
- Cross-DB joins that assumed one DB no longer work → must go through the contract.

## Gate effect
Criterion 4 **drafted** (decision-ready, leans **C**). Still OPEN until owner ratifies C-vs-D
and the migration map. Criterion 5 (contracts) builds on the **C/projection** shape next.
