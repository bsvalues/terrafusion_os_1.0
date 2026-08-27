# WO-WAL-000 — Final Deep-Dive Launch Review

**Date:** 2026-08-27

**Base:** `a1f6fd66d2cff6e3dc7f62ebc00311974951dc90`

**Owner directive:** Issue #1485

## Verdict

`IMPLEMENTATION_READY_AS_FINITE_MISSION`

The intended first official launch is not a Benton pilot. It is a 39-county Washington entry model using a public baseline first, optional governed county upload, and optional read-only TerraFusion Sync, with TerraFusion OS + TerraForge as the first assessor-facing product. External county systems remain read-only until a later explicit county adoption decision.

## Verified strengths to preserve

1. **Statewide source registry exists.** Current protected evidence covers all 39 Washington counties, with official assessor URL, primary sales source, statewide parcel backbone and acquisition family for each. Current JSON evidence reports 35 adapter-ready / 4 researched / 0 not-started / 0 unknown family.
2. **Truth tooling exists.** `data-source-truth-inventory.mjs`, `county-runtime-registration-ledger.mjs`, `runtime-candidate-set.mjs` and `runtime-row-path-proof.mjs` distinguish source evidence from landed/runtime evidence and detect silent Benton fallback.
3. **Runtime Sync primitives are substantial.** `terrafusion_os_1.0` contains Benton/Harris-PACS-proven raw→truth→canonical ingestion, source lineage/xref, quarantine, county isolation, parcel/sale/owner/WSDOR/improvement/land/geometry lanes, full-corpus drain infrastructure, operator status and scaling proof.
4. **TerraForge has real runtime surfaces.** `/forge` reads actual TerraFusion API paths for sale qualification, comps, cost matrices, income data, county stats and tools.
5. **Five-Suite ownership is terminal.** This launch builds on the completed canonical suite architecture rather than reopening migration work.

## Verified launch gaps

### G1 — Registry is not runtime

The 39-county coverage artifact states that it proves registry coverage/acquisition-path inventory only and does not prove statewide ingestion, normalization, geometry or endpoint runtime coverage. Statewide launch must close source→rows→canonical→runtime truth, not merely render 39 names.

### G2 — Counties HUB is intentionally unavailable

Protected `CountiesHub.tsx` says the county registry is not connected, metrics are withheld and migration actions are blocked. Protected Router has no `/counties` route. Closed PR #1461 is historical posture recovery only; it does not implement the required data/onboarding control plane.

### G3 — County upload is unfinished

Current `DataImportController` has scaffold/pending CSV behavior. A production launch needs actual file ingestion: authentication/county binding, bounded upload, format validation, mapping, validation, quarantine, provenance, idempotency/deduplication, canonical promotion and an observed receipt. Launch support must begin with formats actually implemented and tested; do not claim DBF/GDB/XLSX merely because they were discussed.

### G4 — Sync is powerful but source-shaped

The real runtime Sync implementation is heavily proven against Benton/Harris PACS and Benton ArcGIS. Historical code/evidence contains single-county/Benton assumptions and explicitly calls out future multi-county parameterization. A 39-county product requires explicit county/source profiles and adapter seams; it must not point arbitrary counties at Benton table/column doctrine.

### G5 — Separate Sync repo is not runtime ingestion

`bsvalues/terrafusion-os` Portfolio-011 closeout is mapping-workbook/evidence tooling and explicitly did not add live PACS/county ingestion/runtime. Reuse its mapping/evidence tools where useful but do not route runtime launch through it.

### G6 — County security must govern operations, not a UI picker

County switching/display does not grant authority. Runtime operations derive county from authenticated claims/authorized context. Public preview may expose public data across counties, but county-provided/connected data and all state-changing TerraFusion operations must remain county-scoped and fail closed.

### G7 — No external write-back in V1

TerraFusion may write into its own canonical county store during ingestion. Public acquisition, uploads and Sync must not issue DML/write-back against external county systems. Future official adoption is a separate authorization state.

### G8 — TerraForge cannot overclaim statewide module coverage

Public parcel/sales sources can support useful statewide search/comps/market workflows, but cost, income, calibration and other valuation functions may require county-specific characteristics/schedules not available publicly. Launch requires a per-county/per-module input-capability matrix driven by observed data. Unsupported modules remain honestly unavailable until upload/Sync supplies prerequisites.

### G9 — Old June/Benton launch locks must be reconciled

`ForgeSuiteHome.tsx` retains June-10 proof-freeze language and Benton defaults. Statewide runtime must use authenticated/selected lawful county context, remove silent/default Benton behavior, and replace dated proof locks only where current runtime evidence supports it.

### G10 — Production comes last, but is part of the mission

Previous Benton Azure/demo infrastructure is not the product. Production deployment becomes valid only after `WO-WAL-007` proves the release candidate. Existing infrastructure may be reused if it satisfies the proven release's auth, HTTPS, monitoring, rollback, isolation and exact-artifact requirements.

## Execution consequence

No further architecture/reconciliation program is needed. The finite WAL chain is sufficient:

`000 authority → (001 public || 002 upload || 003 Sync || 004 isolation) → (005 HUB || 006 Forge) → 007 acceptance → 008 production → 009 terminal closeout`.

The program ends at production assessor acceptance; it does not generate an automatic successor.
