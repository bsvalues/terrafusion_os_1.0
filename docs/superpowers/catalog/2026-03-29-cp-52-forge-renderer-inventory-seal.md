# CP-52 Forge Renderer Inventory Seal

**Date**: 2026-03-29  
**Purpose**: seal the exact Forge renderer files behind `46B` and `46C`, promote what is safely bounded now, and leave the rest held only for packaging decisions rather than missing file proof  
**Lane**:
- Codex: docs/control-plane only
- Copilot: runtime execution only after promotion lands in the packet chain

## Exact File Proof

### `46B` fixture-risk sweep candidates

- `Statistics Studio`: `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx`
- `Batch Cost Runs`: `frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx`
- `Coefficient Preview`: `frontend/apps/os-shell/src/pages/forge/batch/CoefficientPreview.tsx`
- `Cost Manual`: `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx`
- `Value Audit Log`: `frontend/apps/os-shell/src/pages/suites/modules/ValueAuditModule.tsx`

### `46C` proof-seal candidate

- `Regression Studio`: `frontend/apps/os-shell/src/pages/forge/regression/RegressionStudio.tsx`

## Scope Read

- `46C` is cleanly bounded to one known host file and can stay promoted.
- `46B` is no longer blocked by missing file proof.
- `46B` should not stay as one bundled five-file card. The inventory is exact enough to split now.

## Promotion Recommendation

### Promote now

- `46C` -> `PARALLEL-CLEAR`

#### Allowed Files

- `frontend/apps/os-shell/src/pages/forge/regression/RegressionStudio.tsx`

### Keep held, but split now

- `46B` stays `HOLD-CARD` until it is repacketized into smaller cards

#### Split recommendation

1. `46B1` Statistics Studio truth boundary
   - Allowed Files:
     - `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx`
   - Target Status:
     - `PARALLEL-CLEAR`

2. `46B2` Batch apply/disclosure alignment
   - Allowed Files:
     - `frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx`
     - `frontend/apps/os-shell/src/pages/forge/batch/CoefficientPreview.tsx`
   - Target Status:
     - `PARALLEL-CLEAR`

3. `46B3` Reference-data disclosure sweep
   - Allowed Files:
     - `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx`
     - `frontend/apps/os-shell/src/pages/suites/modules/ValueAuditModule.tsx`
   - Target Status:
     - `PARALLEL-CLEAR`

#### Why split

- `BatchCostRun.tsx` and `CoefficientPreview.tsx` share apply-capability posture and should move together
- `CostManual.tsx` and `ValueAuditModule.tsx` are both disclosure-local reference or demo-data surfaces
- `StatisticsStudio.tsx` is isolated enough to stand alone

## Collision Read

- `46C` has no direct file overlap with `46A` or Forge suite-home work.
- `46B` has no known direct overlap with `46A` or `ForgeSuiteHome.tsx`.
- the remaining `46B` issue is card granularity, not hot-file collision.

## Follow-On Control-Plane Changes

1. keep `46C` promoted in the scoreboard, atlas, and master plan
2. update the hold-card unlock ledger so `46B` is blocked by repacketization, not file discovery
3. update the packet text so `46B` is split into `46B1` / `46B2` / `46B3`

## Repacketization Status

The repacketization described here is now landed in the active control plane via [2026-03-29-46b-repacketization-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-46b-repacketization-seal.md).
