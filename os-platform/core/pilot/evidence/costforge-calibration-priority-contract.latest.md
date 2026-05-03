# CostForge Calibration Priority Contract

Checked: 2026-04-30T22:52:53.929Z
Status: PASS
Decision: COSTFORGE_CALIBRATION_PRIORITY_CONTRACT_REGISTERED_AND_ECHOED

Contract: `costforge_calibration_priority_v1`
Population: CostForge county-scoped neighborhood calibration matrix rows with minimum sale-count filtering
Read path: GET /costforge/calibration/neighborhood-matrix?taxYear={taxYear}&minSales=3 plus GET /equity/deciles

## Formula

- Score: (max(0, COD - 15) * 2 + abs(medianRatio - 1.0) * 100 + abs(PRB) * 50) * sqrt(max(1, saleCount))
- Critical threshold: 20
- Watch threshold: 5
- Minimum sales: 3

## Checks

| Check | Result | Proof | Note |
| --- | --- | --- | --- |
| contract-registered | PASS | `os-platform/core/pilot/terrafusion-suite-contracts.json` | CostForge calibration priority contract is present in the suite registry. |
| contract-required | PASS | `terraforge_operational_health_v1`<br>`terraforge_statistics_compat_v1`<br>`terraforge_segment_derivation_v1`<br>`terraforge_correction_priority_v1`<br>`costforge_calibration_priority_v1` | Contract is part of the required suite contract list. |
| triage-runtime-echo | PASS | `frontend/apps/os-shell/src/pages/forge/cost/tabs/TriageTab.tsx` | Triage runtime declares contract id, formula constants, thresholds, and UI contract echo. |
| audit-adopted | PASS | `os-platform/core/pilot/contract-adoption-audit.json` | Contract adoption audit treats CostForge triage as contract-backed instead of advisory/out-of-scope. |

## Failures

- None.

