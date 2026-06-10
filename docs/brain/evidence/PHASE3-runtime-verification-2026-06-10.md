# Phase 3 — Independent Runtime Verification (2026-06-10)

**Standard applied:** agent "complete" = "ready to verify," not "done." This is the independent browser verification through the running TerraFusion OS product.

**Status going in:** Phase 3 CLAIMED complete by agent · USER-VERIFIED incomplete · Phase 4 blocked.
**Status after this verification:** Phase 3 verified **PASS with 3 flagged items** (below) — final acceptance remains the human owner's call per the acceptance standard.

## Runtime under test
- Worktree/SHA: `~/.config/superpowers/worktrees/terrafusion_os_1.0/benton-cama-gla-gap` @ `f32863883` — the ONLY ref containing all six commits (79d801eec GLA, f32863883 Forge auth, 61c3f5ea9 owner, 0d7785644 sales, aae00fda9 CompsForge lookback, 9dc2ff5cb IncomeForge).
- Backend: that worktree, Development, **port 5047** (deviation: the main tree's watcher kept respawning its own API on 5046 and won the bind race; 5047 chosen rather than killing the operator's supervisor — same code, different port).
- Frontend: that worktree's vite on **5174**, proxy → 5047. Verified serving from the loop worktree (all module URLs resolve under `benton-cama-gla-gap`).
- Note: services found pre-running on 5046/5174 were from the MAIN tree (wrong lineage) — stopped and replaced. Agent-reported runtimes must be identity-checked, not trusted.

## Per-domain verdicts — parcel 101040000000000 (PROSSER, vacant commercial land, Sec 1 T10N R24)
| Domain | Verdict | Evidence |
|---|---|---|
| Parcel data | **PASS** | ID, legal "SECTION 1 TOWNSHIP 10 NORTH RANGE 24: ALL, FRACTIONAL", district 1613, nbhd 540100 001, use 83 |
| Owner | **PASS** | PEARSON KELLY (61c3f5ea9 binding live) |
| Land | **PASS** | Land value $238,140; acreage 639.40 (≈ full section — coherent with legal) |
| Improvement/CAMA | **PASS (honest)** | Vacant land: Improvement "—" on Summary; year-built/bed/bath "—"; no fabricated CAMA |
| Sales | **PASS** | Last sale 10/28/1997 · $72,465 · "28yr ago" · DB/API-backed label (0d7785644 live) |
| Cost | **PASS** | Forge tab: Cost Indicated $238,140, Sales Indicated $200,000, Income honestly N/A, Reconciled $217,948; "values returned from the live workbench API"; all `/api/forge/*?taxYear=2026` → 200 (f32863883 auth fix PROVEN — these were the 401 surface) |
| Comps | **PASS w/ FLAG-2** | Live forge sales endpoint 200; but ComparableSalesPanel candidates come from STATIC launch-package shard (see flags) |
| Geometry status | **PASS** | Atlas tab: centroid 46.381441, -119.755657 (Prosser area), lot 27,852,264 sq ft = 639.40 ac exactly; "Benton County Records"; honest "boundary previews only" + "Layer data not available for this parcel" + Layer Query "Partial" |
| Provenance | **PASS** | "TerraFusion DB/API-backed" chips on valuation/sale/history; vintage disclosure ("does not show a more precise as-of timestamp"); Atlas source note |
| No silent zero GLA | **PASS** | GLA (ABOVE GRADE) = **"Proof pending"**, TOTAL SQ FT = "Proof pending" (79d801eec live; no false 0) |
| No mock/sample/random | **PASS w/ FLAG-2** | All values internally consistent county data; no mock markers; one static-data path flagged |
| No 401/403 | **FAIL (1) → FLAG-1** | Single 401: `POST /api/trace/events` (trace ingestion). ALL data reads 200. |

Console errors: **zero**. OS-window contract: dock + top bar visible throughout; window chrome (close/min/max); no full-page route escape. Screens checked: Desktop → Recent Work chip → Property Workbench window (Summary, Forge, Atlas tabs) at `http://localhost:5174/`.

## Flagged items (NOT fixed — verification only)
1. **FLAG-1 (blocker for "no 401/403" acceptance):** `POST /api/trace/events` → 401. The workbench's TerraTrace client posts unauthenticated (or the endpoint requires auth the shell session lacks). Telemetry-write only — no data surface affected — but it is a real auth failure AND means workbench trace events are being dropped (audit-spine gap). Needs its own slice.
2. **FLAG-2 (staleness risk):** `comparableSalesService.ts` sources comp candidates from the static "Washington statewide launch package" (`/launch-data/washington/sales/by-county/005.json`), not the live ComparableSales table (259k rows). Real county data, honest provenance in the code header, backend does adjustment math — but it is a frozen snapshot. Operator decision: acceptable for launch-package scope, or migrate to live comps-pool.
3. **FLAG-3 (env note):** vacant-land parcel exercises the honest-unavailable paths well but does NOT exercise improvement/CAMA/GLA positive paths. Owner should spot-check one improved residential parcel (e.g. recent-work chip `103892030000012`) against the same checklist before final sign-off.

## Remaining blocker to Phase-3 acceptance
FLAG-1 (trace 401) violates the literal "no 401/403" gate; FLAG-3 means the GLA-positive path is owner-unverified. Phase 4 (39-county posture) remains **blocked** until the owner accepts or these are cleared.
