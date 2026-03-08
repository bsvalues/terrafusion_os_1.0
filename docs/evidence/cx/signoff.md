# CX Lane: R1 Release Signoff

## Metadata

- Lane: cx
- Lane branch name: claude/review-progress-ledger-a8iw5
- Lane branch HEAD SHA (pre-merge): f130778be4b5b71296e89e8122da5a196dd22f9e
- Merge commit SHA (into r1/integration): 0111b25ddabd3c4ab5ec89aefd307d1c50d630cc
- Baseline r1/integration SHA used for lane work: 81577b071e5ac6aeaa1fb781e805ee9c3a4a7cd6
- Final branch-head SHA used for verification: 0afe584756ffd60aa2c986bde8ea2e0edc7bede6
- Date (local): 2026-03-07
- Verified by: Codex (CX lane agent)
- Command canon version: r1-canon-2026-03-07

---

## Evidence Artifacts

- [CX R1 Active Surface Closure](./cx-r1-active-surface-closure.md) -- active-surface hardening and explicit Post-R1 carve-outs
- [CX R1 Route Matrix](./cx-r1-route-matrix.md) -- authoritative active-route inventory and scope classification
- [CX R1 Forge Contract](./cx-r1-forge-contract.md) -- frozen Forge request/response semantics plus explicit Post-R1 route behavior

---

## Completed Items

| Item ID | Description | Status |
|---|---|---|
| CX-HARD-01 | `PropertyValuationController` authenticated and county-scoped on active requests | COMPLETE |
| CX-R1-01 | `PiltController` converted from fake-live facade to explicit authenticated `501` / `Post-R1` | COMPLETE |
| CX-HARD-03 | `QuantumMetricsBackgroundService` moved to opt-in gate (`TF_ENABLE_QUANTUM_METRICS_BACKGROUND_SERVICE`) | COMPLETE |
| CX-FORGE-01 | CostForge single-property path kept real; batch valuation and Harris PACS sync converted to explicit `501` / `Post-R1` | COMPLETE |
| CX-DOS-02 | Dossier document-management endpoints converted to explicit `501` / `Post-R1` | COMPLETE |
| CX-ATL-02 | Atlas suite-level GIS/search/catalog endpoints converted to explicit `501` / `Post-R1` | COMPLETE |
| CX-R1-00 | Route matrix and Forge contract evidence published for the active R1 backend surface | COMPLETE |

---

## Remaining Items

No active CX code blockers remain on the strict R1 backend surface.

Shared release finalization still remains:

| Item | Owner | Notes |
|---|---|---|
| Same-SHA / same-canon convergence | All lanes | Signoffs and final manifest must point at the same verification target |
| Final evidence verification | All lanes | `node tools/r1/verify-evidence.mjs` must pass after manifest refresh |

---

## Gate Results

| Gate | Result | Notes |
|---|---|---|
| backend build | PASS | `dotnet build backend/TerraFusion.sln -c Release -v:minimal /nologo` |
| CX closure tests | PASS | `R1Week5CxR1ClosureTests` = **13/13** |
| Active-route auth/county hardening | PASS | PropertyValuation, CostForge, Dossier, Atlas, Levy verified on active surface |
| Evidence artifacts | PASS | `cx-r1-active-surface-closure.md`, `cx-r1-route-matrix.md`, `cx-r1-forge-contract.md` |
