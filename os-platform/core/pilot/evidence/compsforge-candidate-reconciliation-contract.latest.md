# CompsForge Candidate Reconciliation Contract

Checked: 2026-04-30T23:25:44.839Z
Status: PASS
Decision: COMPSFORGE_CANDIDATE_RECONCILIATION_CONTRACT_REGISTERED_AND_ECHOED

Contract: `compsforge_candidate_reconciliation_v1`
Population: CompsForge county sales shard candidates for the active parcel or County Studio rollup handoff scope, followed by Benton-certified CostForge adjustment/reconciliation where supported
Read path: GET /launch-data/washington/sales/by-county/{countyCode}.json plus POST /api/costforge/sales-comparison/adjust-comparable and POST /api/costforge/sales-comparison/reconcile

## Policy

- Qualified-only default: true
- Sale window: 2016-01-01 through 2026-12-31
- Candidate cap: 30
- Default selected candidates: 3
- Governed adjustment county: 005

## Checks

| Check | Result | Proof | Note |
| --- | --- | --- | --- |
| contract-registered | PASS | `os-platform/core/pilot/terrafusion-suite-contracts.json` | CompsForge candidate/reconciliation contract is present in the suite registry. |
| contract-required | PASS | `terraforge_operational_health_v1`<br>`terraforge_statistics_compat_v1`<br>`terraforge_segment_derivation_v1`<br>`terraforge_correction_priority_v1`<br>`costforge_calibration_priority_v1`<br>`county_data_trust_launch_context_v1`<br>`compsforge_candidate_reconciliation_v1` | Contract is part of the required suite contract list. |
| module-runtime-echo | PASS | `frontend/apps/os-shell/src/pages/suites/modules/CompsForgeModule.tsx` | CompsForge module declares contract id, candidate policy, Benton-only governed adjustment posture, and UI contract echo. |
| service-selection-and-reconciliation-boundary | PASS | `frontend/apps/os-shell/src/services/comparableSalesService.ts` | Comparable sales service contains the filter, score, candidate selection, CostForge adjustment, and reconciliation boundaries. |
| ui-contract-test | PASS | `frontend/apps/os-shell/src/pages/suites/modules/__tests__/CompsForgeModule.deeplink.test.tsx` | Focused CompsForge test proves the contract posture is visible in the module. |
| audit-adopted | PASS | `os-platform/core/pilot/contract-adoption-audit.json` | Contract adoption audit treats CompsForge as contract-backed instead of future out-of-scope work. |

## Failures

- None.

