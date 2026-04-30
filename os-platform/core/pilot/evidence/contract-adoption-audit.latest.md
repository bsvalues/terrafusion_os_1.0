# Contract Adoption Audit

Checked: 2026-04-30T22:37:01.027Z
Status: PASS_WITH_ADOPTION_GAPS
Decision: CONTRACT_LAYER_LIVE_ADOPTION_GAPS_FOUND

## Summary

- Surfaces audited: 17
- Pass: 12
- Partial: 0
- Gap: 3
- Out of scope for current four contracts: 2
- Migration needed: 5

## Matrix

| Surface | Metric/Behavior | Contract-backed | Contract ID | Trust posture exposed | Migration needed | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| County Studio health summary API | Operational health summary and correction-priority alert ranking. | yes | `terraforge_operational_health_v1`<br>`terraforge_correction_priority_v1` | api | no | pass | Runtime DTOs echo both operational health and correction priority contract ids. |
| County Studio segment derivation API | Derives segment set metrics from canonical TerraFusion DB tables. | yes | `terraforge_segment_derivation_v1` | api | no | pass | SegmentDerivationResult echoes the registered segment derivation contract id. |
| County Studio Statistics Compat panel | Same-population ratio-study parity, population contract fields, and parity rows. | yes | `terraforge_statistics_compat_v1`<br>`statistics_ratio_study_compat_v1` | ui | no | pass | The panel displays contractId, population, trustPosture, sale window, qualification policy, suppression policy, outlier policy, conversion-sensitive counts, and parity rows. |
| County Studio command strip | Displays median ratio, COD, PRD, critical/warning counts, needs-data count, and exceptions. | yes | `terraforge_operational_health_v1`<br>`terraforge_correction_priority_v1` | ui | no | pass | Uses healthSummary and visibly exposes operational contract id, correction priority contract id, and county trust posture. |
| County Studio health panel | Displays operational health metrics, top action items, and composite-risk explanation. | yes | `terraforge_operational_health_v1`<br>`terraforge_correction_priority_v1` | ui | no | pass | Visible health surface now exposes operational contract id, correction priority contract id, and county trust posture. |
| County Studio correction and defense panel | Shows defense readiness, county posture, correction counts, and evidence readiness. | yes | `terraforge_correction_priority_v1`<br>`terraforge_operational_health_v1` | ui | no | pass | Defense readiness now exposes operational contract id, correction priority contract id, and county trust posture alongside current anchors. |
| County Studio AI diagnosis panel | Displays deterministic findings, evidence values, and recommended actions. | no | none | no | yes | gap | Diagnosis output is metric-shaped and action-shaping, but no contract id, population, or proof artifact is visible in the response or UI. |
| Evidence packet modal and markdown export | Exports DOR-defensible packet with correction-priority contract id and segment signals. | yes | `terraforge_correction_priority_v1` | partial | no | pass | Correction contract is visible. A future improvement can attach county trust tier directly. |
| Atlas Live overlay manager | Colors parcels for ratio-like metric overlays, scenario deltas, cohort shading, and edge warnings. | yes | `terraforge_segment_derivation_v1`<br>`terraforge_statistics_compat_v1`<br>`terraforge_correction_priority_v1` | feature-state | no | pass | Overlay feature state now carries atlasContractId, atlasSourcePopulation, and atlasTrustPosture; default overlay mappings preserve contract lineage when projections omit explicit metadata. |
| Atlas Live county context | Loads Washington launch county status, Benton compatibility geometry, staged sales, and review counts. | no | none | partial | yes | gap | It labels geometry availability, but Washington 39-county launch status remains outside the registered suite metric contracts. |
| GeoForge county health panel | Displays contract-backed operational health metrics and keeps neighborhood spatial diagnostics clearly supplemental. | yes | `terraforge_operational_health_v1`<br>`terraforge_correction_priority_v1` | ui | no | pass | Countywide metrics now come from County Studio healthSummary and visibly show operational contract id, correction priority contract id, and trust posture; local neighborhood calculations are limited to supplemental spatial context. |
| CostForge triage tab | Computes AI priority score from COD deviation, median-ratio deviation, PRB deviation, and sale count. | no | none | no | yes | gap | The priority formula is local and not registered as correction priority or a separate CostForge calibration contract. |
| SalesForge running stats | Displays qualification counts, median ratio, weighted mean, COD, PRD, PRB, and IAAO compliance. | yes | `terraforge_statistics_compat_v1`<br>`statistics_ratio_study_compat_v1` | ui | no | pass | The running-stats rail now visibly declares the registered Statistics Compat contract, implementation alias, qualified-sale population, and parity-compatible trust posture for sale-qualification stats. |
| SalesForge ratio audit | Filters qualified sales, sorts by ratio, and flags outliers using local thresholds. | yes | `terraforge_statistics_compat_v1`<br>`statistics_ratio_study_compat_v1` | ui | no | pass | The audit panel now surfaces Statistics Compat lineage and keeps its local 0.85/1.15 outlier screen labeled as a SalesForge audit lens under the qualified-sale population. |
| CompsForge module | Loads comparable county sales, filters qualified sales, scores candidates, and runs governed adjustment/reconciliation. | no | none | partial | yes | outOfScope | This does not fit the four current suite metric contracts cleanly. It needs a future comparable-sales candidate-selection/reconciliation contract. |
| CostForge calculator module | Computes RCNLD, cost factors, matrix provenance, API verification, and cost commit gate. | no | none | partial | yes | outOfScope | This is governed in its own cost domain but not covered by the four TerraForge suite metric contracts. A CostForge cost-value contract should be registered later. |
| Legacy Statistics API client | Calls MassAppraisal ratio-study, strata, outlier, comparison, and segment endpoints. | yes | `terraforge_statistics_compat_v1`<br>`statistics_ratio_study_compat_v1` | client-metadata | no | pass | The client exports contract metadata and exposes it on the service instance while preserving existing MassAppraisal method return shapes. |

## Migration Gaps

| Surface | Status | Path | Notes |
| --- | --- | --- | --- |
| County Studio AI diagnosis panel | gap | frontend/apps/os-shell/src/pages/forge/county-studio/components/AiDiagnosisPanel.tsx | Diagnosis output is metric-shaped and action-shaping, but no contract id, population, or proof artifact is visible in the response or UI. |
| Atlas Live county context | gap | frontend/apps/os-shell/src/pages/forge/atlas-live/atlasLiveApi.ts | It labels geometry availability, but Washington 39-county launch status remains outside the registered suite metric contracts. |
| CostForge triage tab | gap | frontend/apps/os-shell/src/pages/forge/cost/tabs/TriageTab.tsx | The priority formula is local and not registered as correction priority or a separate CostForge calibration contract. |
| CompsForge module | outOfScope | frontend/apps/os-shell/src/pages/suites/modules/CompsForgeModule.tsx | This does not fit the four current suite metric contracts cleanly. It needs a future comparable-sales candidate-selection/reconciliation contract. |
| CostForge calculator module | outOfScope | frontend/apps/os-shell/src/pages/suites/modules/CostForgeModule.tsx | This is governed in its own cost domain but not covered by the four TerraForge suite metric contracts. A CostForge cost-value contract should be registered later. |

## Validation Failures

- None.

## Next Closures

- Close Atlas Live county context and County Studio AI diagnosis contract posture gaps.
- Register future CostForge and CompsForge domain contracts before treating their calculations as suite truth.

