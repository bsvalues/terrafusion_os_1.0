# CostForge Cost Value Contract

Checked: 2026-04-30T23:35:48.490Z
Status: PASS
Decision: COSTFORGE_COST_VALUE_CONTRACT_REGISTERED_AND_ECHOED

Contract: `costforge_cost_value_v1`
Population: Benton parcel-bound CostForge cost approach value preview, governed API verification, scenario comparison, and TerraPilot BOE packet commit gate
Read path: Benton 2025 cost matrix in forgeService.calculateCost plus POST /costforge/calculate and Pilot tool assemble_boe_packet

## Policy

- Matrix year: 2025
- Building types: 14
- Regions: 3
- Parcel-bound required: true
- API verification path: /costforge/calculate
- Commit tool: assemble_boe_packet

## Checks

| Check | Result | Proof | Note |
| --- | --- | --- | --- |
| contract-registered | PASS | `os-platform/core/pilot/terrafusion-suite-contracts.json` | CostForge cost-value contract is present in the suite registry. |
| contract-required | PASS | `terraforge_operational_health_v1`<br>`terraforge_statistics_compat_v1`<br>`terraforge_segment_derivation_v1`<br>`terraforge_correction_priority_v1`<br>`costforge_calibration_priority_v1`<br>`county_data_trust_launch_context_v1`<br>`compsforge_candidate_reconciliation_v1`<br>`costforge_cost_value_v1` | Contract is part of the required suite contract list. |
| module-runtime-echo | PASS | `frontend/apps/os-shell/src/pages/suites/modules/CostForgeModule.tsx` | CostForge module declares contract id, matrix policy, API verification path, commit tool, and UI contract echo. |
| cost-engine-boundary | PASS | `frontend/apps/os-shell/src/services/forgeService.ts` | Forge service contains cost matrix, depreciation, RCN, RCNLD, and matrix-source calculation boundary. |
| ui-contract-test | PASS | `frontend/apps/os-shell/src/pages/suites/modules/__tests__/CostForgeModule.contracts.test.tsx` | Focused CostForge module test proves the contract posture is visible in the module. |
| audit-adopted | PASS | `os-platform/core/pilot/contract-adoption-audit.json` | Contract adoption audit treats CostForge calculator output as contract-backed instead of future out-of-scope work. |

## Failures

- None.
