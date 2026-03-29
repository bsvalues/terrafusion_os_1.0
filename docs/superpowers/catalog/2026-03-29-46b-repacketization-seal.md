# 46B Repacketization Seal

**Date**: 2026-03-29  
**Purpose**: replace the coarse `46B` Forge fixture-risk hold with three executable Copilot cards that match the already-sealed host inventory  
**Lane**:
- Codex: docs/control-plane only
- Copilot: runtime execution only from the child cards defined here

## Authority Stack

1. [2026-03-29-cp-52-forge-renderer-inventory-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-52-forge-renderer-inventory-seal.md)
2. [2026-03-28-surface-readiness-ledger.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-surface-readiness-ledger.md)
3. [2026-03-28-full-ecosystem-demo-launch-registry.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-launch-registry.md)

## Split Result

| Child Card | Surface(s) | Allowed Files | Target Status | Why This Split Is Bounded |
| --- | --- | --- | --- | --- |
| `46B1` | Statistics Studio | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx` | `PARALLEL-CLEAR` | isolated one-file Forge renderer |
| `46B2` | Batch Cost Runs + Coefficient Preview | `frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx`; `frontend/apps/os-shell/src/pages/forge/batch/CoefficientPreview.tsx` | `PARALLEL-CLEAR` | paired apply/disclosure surfaces in the same batch family |
| `46B3` | Cost Manual + Value Audit Log | `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx`; `frontend/apps/os-shell/src/pages/suites/modules/ValueAuditModule.tsx` | `PARALLEL-CLEAR` | paired reference-data and demo-audit disclosure surfaces |

## Scope Ruling

- `46B` was a packaging defect, not a missing-file defect.
- The old bundled five-file card is retired from the active packet chain.
- Future Copilot execution must use `46B1`, `46B2`, or `46B3` only.

## Control-Plane Actions

1. Promote `46B1`, `46B2`, and `46B3` into the execution queue.
2. Remove coarse `46B` from the remaining-hold list.
3. Keep `45D` as the only substantive remaining structural hold after this repacketization; `50E` moved to `READY` under CP-55.
