# WO-WORKBENCH-004 — Forge Surface Truth

## Result

RESULT: PASS
WORK_ORDER: WO-WORKBENCH-004
GOAL: GOAL-PROPERTY-WORKBENCH-CANONICAL-ASSESSOR-EXPERIENCE
LOOP: LOOP-PROPERTY-WORKBENCH-CANONICAL-ASSESSOR-EXPERIENCE
MODE: evidence-only

## Scope

This packet records the current TerraForge surface inside the Property Workbench. It does not modify
Forge behavior, Workbench routing, valuation methodology, write lanes, package dependencies, CI, or
county data.

Allowed system: Property Workbench Forge evidence.

Blocked systems:

- Runtime code changes
- Shell tab or route changes
- Valuation methodology changes
- CAMA characteristic semantics
- County data, PACS, county SQL, or live database access
- Deployment, Docker, Kubernetes, or CI changes

## Canon References

- `brain/packs/forge/README.md`
- `brain/packs/shell/README.md`
- `docs/architecture/specs/terrafusion/01_PROPERTY_WORKBENCH_SPEC_v3.1.md`
- `docs/architecture/specs/terrafusion/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md`
- `frontend/apps/os-shell/AGENTS.md`

## Files Inspected

Workbench Forge frame:

- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/forge/ForgeOverview.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/forge/CostApproach.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/forge/SalesComparison.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/forge/IncomeApproach.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/forge/Reconciliation.tsx`
- `frontend/apps/os-shell/src/pages/workbench/tabs/forge/types.ts`

Forge data/service adapters:

- `frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts`
- `frontend/apps/os-shell/src/services/incomeValuationService.ts`
- `frontend/apps/os-shell/src/services/forge/valuationService.ts`
- `frontend/apps/os-shell/src/services/forge/valuationAgentService.ts`

Workbench Forge proof surface:

- `frontend/apps/os-shell/src/__tests__/workbench/PropertyForge.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyForge.income.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyForge.honesty.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyForge.honesty.contract.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/ForgeSubjectParcelSnapshot.test.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/ComparableSalesForgeHost.test.tsx`

## Observed Runtime Shape

`PropertyForge.tsx` is a Workbench-hosted Forge tab router. It keeps Forge sub-tabs mounted and routes
within the parcel-scoped Workbench context instead of creating a standalone parcel window.

Observed Forge sub-tabs:

- Overview
- Cost
- Sales
- Income
- Reconciliation
- Sketch

The top-level Workbench tab remains `forge`. The sub-tab set is local to Forge and is not the
constitutional Workbench tab order.

## Data Source Model

The Workbench Forge tab uses live API hooks for:

- `GET /api/forge/{parcelId}/cost?taxYear=...`
- `GET /api/forge/{parcelId}/sales?taxYear=...`
- `GET /api/forge/{parcelId}/income?taxYear=...`
- `GET /api/forge/{parcelId}/reconciliation?taxYear=...`
- `GET /api/forge/{parcelId}/years`

These are surfaced through `useForgeValuation.ts`, which returns source state as `live` or
`unavailable`. The Workbench UI displays source badges and explicit unavailable states rather than
inventing valuation values.

Income valuation has an adapter path through `incomeValuationService.ts`. That file states that
CostForge backend endpoints remain the math authority and that client-side preview is not
authoritative.

## Governed Tool Surface

Forge overview and sub-tabs invoke governed tools through Pilot API calls. Observed tool IDs include:

- `explain_model_results`
- `explain_value_change`
- `compare_assessed_value_history`
- `run_valuation_model`
- `propose_rate_adjustment`
- `apply_rate_adjustment_to_draft`
- `rerun_ratio_study`
- `compare_matrix_versions`
- `generate_calibration_memo`
- `flag_parcel_data_issue`
- `explain_model_inputs`
- `summarize_sales_comps_rationale`
- `run_income_valuation`

The `run_valuation_model` path is labeled as `write_high` in the Forge types and UI copy requires
confirmation before execution. This packet does not validate backend enforcement for those tools; it
records that the Workbench surface presents them as governed tool calls.

## Write-Lane Posture

Forge-owned actions observed in the Workbench surface:

- Valuation explanation and value-change analysis
- Cost, sales, income, and reconciliation reads
- Sales qualification override requests
- Sales recommendation recompute requests
- Reconciliation submission for supervisor review
- Calibration proposal and memo tool calls
- Parcel issue routing into a correction lane
- Sketch observation saves through `SketchModule.onSaveObservation`, which currently flow into
  pending IndexedDB observation state and therefore need ownership, sync, privacy, and custody proof
  before release claims.

Important distinction: `useCommitReconciliation` posts to
`/api/forge/{parcelId}/reconciliation/commit`, but code comments state it creates a
`RECONCILIATION_PENDING` flag and does not update assessed value. That is consistent with the
observed UI copy: "Submit for Supervisor Review."

Potentially sensitive or write-like calls that need backend proof before promotion:

- `PATCH /api/forge/sales/{saleId}/qualification`
- `POST /api/forge/sales/recompute-recommendations`
- `POST /api/forge/{parcelId}/reconciliation/commit`
- `run_valuation_model`
- `apply_rate_adjustment_to_draft`
- `run_income_valuation`
- `flag_parcel_data_issue`
- Sketch pending observation saves containing measurement, GLA, and location-like fields

This packet does not certify those as production-safe. It classifies them as present and needing
backend/tool-policy proof before any release gate can claim operational readiness.

## Evidence and Tests Observed

Existing tests cover:

- `PropertyForge` rendering with parcel context
- governed valuation explanation tool invocation and correlation ID display
- network and tool error display
- tax-year and audience controls
- income sub-tab hosting
- source-honesty wording and source badge behavior
- comparable sales parcel evidence gating
- comparable selection, adjustment request, and reconciliation readiness behavior
- no invented subject condition/quality before paired adjustments
- sales comparison backend success/failure handling

The tests are evidence of UI contract and source-honesty behavior. They are not proof of live county
data, PACS connectivity, production authorization, or backend valuation-method correctness.

## Surface Classification

| Surface | Current maturity | Evidence |
| --- | --- | --- |
| Forge Workbench tab router | Implemented | `PropertyForge.tsx`, Workbench tests |
| Cost approach read surface | Implemented, backend-dependent | `useCostApproach`, `CostApproach.tsx` |
| Sales comparison read/review surface | Implemented, backend-dependent | `SalesComparison.tsx`, comparable-sales tests |
| Income approach surface | Implemented, adapter-backed | `IncomeApproach.tsx`, `incomeValuationService.ts`, income tests |
| Reconciliation preview/review surface | Implemented with supervisor-review posture | `Reconciliation.tsx`, reconciliation tests |
| Governed Pilot tool buttons | Implemented in UI, backend policy not proven here | `ForgeOverview.tsx`, `CostApproach.tsx`, `SalesComparison.tsx` |
| CAMA/write-lane safety | Partial | Forge pack defines ownership; backend enforcement not audited here |
| Production readiness | Not claimed | no live DB, PACS, county data, or release gate run |

## Gaps

1. Backend enforcement proof is not captured for Forge write-like tool calls.
2. `run_valuation_model` and calibration actions need tool-policy evidence before release claims.
3. Reconciliation submission is UI-described as supervisor-review only, but backend contract proof is
   outside this packet.
4. Forge has a large standalone suite/module surface outside the Workbench tab; this packet only
   classifies the Workbench Forge surface.
5. Some Forge-adjacent surfaces include Atlas/GeoForge and county-studio handoffs. Those are not
   promoted here because cross-lane ownership requires separate Atlas/Dais/Dossier/Pilot packets.

## Validation Run

Commands for this packet:

```powershell
node scripts/spec-gates/workbench-compliance.mjs
node docs/brain/workorders/tools/wo-query.mjs --json
git diff --check
```

Expected validation result: PASS.

## Conclusion

The Workbench Forge surface is materially implemented as a parcel-scoped Forge tab with live
backend-dependent cost, sales, income, reconciliation, and governed tool surfaces. It is not a
production release claim. The next safe Workbench packet is Atlas Surface Truth.

NEXT_RECOMMENDED_WO: WO-WORKBENCH-005 — Atlas Surface Truth
STOP_TYPE: FORGE_SURFACE_TRUTH_CAPTURED
