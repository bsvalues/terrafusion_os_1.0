# Extraction Prerequisites (per future repo)

*What must be TRUE before each repo is extracted. Until met, the repo is not cleared for
migration. Migration is gated on owner lock-release AND these.*

## Global prerequisites (all repos)
- TerraFusionOS core (Phase 1) **founded and proven** (shell + workbench host + registry + shared-contracts boot clean).
- Target repo **created** with the core-owned contracts it must obey vendored/pinned.
- All R-SPLIT ownership cells for the surface **filled** (`OWNERSHIP-CELLS.md`).
- The relevant **shared contract defined in core** before any consumer extracts.

## TerraFusion-Sync (Phase 2 — first, upstream)
- **F14 schema reconciliation done** for sync entities (one lineage; resolve the multi-DbContext drift).
- **sync→suite payload contract** defined + versioned in core.
- County ingestion isolated from shell; **ArcGIS nightly feed separated from Atlas UI** (R-ATLAS).
- PACS source-of-truth direction confirmed (PACS → TerraFusion, per canon).
- Best-version sync heads selected from overlap groups (sync-doctrine-4 → v9, etc.).

## TerraFusion-Atlas (Phase 3a)
- Atlas **UI separated from ingestion** (ingestion already in Sync).
- **atlas tab contract** + map/geometry contracts defined in core.
- MapLibre migration (PR #1073) settled (single map stack).
- Atlas owns view-state persistence; Sync owns geo data.

## TerraFusion-Dais (Phase 3b)
- **Dual `LevyCertification` resolved** (F14) — one entity, one schema owner (Dais).
- **dais tab contract** defined in core; Levy reinterpreted as Dais-internal (not platform).
- Permits/cert domain isolated from workbench host.
- Sync→Dais payload contract in place (levy inputs flow from Sync).

## TerraFusion-Forge (Phase 3c)
- **CostForge "Ultimate" cut first** (Tier-5 theater removed, not migrated).
- Forge statistics (`waves-26-35-integration`) ported clean; cross-checked vs live IAAO compliance.
- Valuation surface made **honest** (no $425k demo placeholder masquerading as real).
- Forge schema owner established; **forge tab contract** in core.

## TerraFusion-Dossier (Phase 3d — last, least-fractured)
- Dossier domain isolated from parcel/workbench surfaces.
- **dossier tab contract** + document-mgmt payload contract in core.
- Can follow once Sync + the other suites' contracts are stable.

## AI internals (Phase 4 — deferred)
- F17-style reality classification **solid** for the surface in question.
- Surface is runtime-real + evidence-backed + independently owned + large enough (R-PILOT).
- Until then: shell-facing Pilot stays core; deep internals stay undecided.

> No repo extracts until its row above is fully satisfied. This is the gate between
> "topology decided" and "topology executed."
