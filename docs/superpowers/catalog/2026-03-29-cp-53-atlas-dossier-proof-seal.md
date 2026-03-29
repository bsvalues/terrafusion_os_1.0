# CP-53 Atlas And Dossier Proof Seal

**Date**: 2026-03-29  
**Purpose**: seal the exact renderer and tab host files for `47B` and `49B`, and promote both from `HOLD-CARD` to issuable Copilot cards  
**Lane**:
- Codex: docs/control-plane only
- Copilot: runtime execution only after promotion lands in the packet chain

## Exact File Proof

- `Geo Equity`: `frontend/apps/os-shell/src/pages/atlas/GeoEquityDashboard.tsx`
- `Appraisal GIS`: `frontend/apps/os-shell/src/pages/atlas/MassAppraisalGIS.tsx`
- `Workbench Dossier tab`: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx`

## Scope Read

- `47B` can stay bounded to two renderer files.
- `49B` can stay bounded to its own workbench host.
- No evidence was found that either card must widen into router, module registration, or suite-home files.

## Promotion Recommendation

### Promote `47B`

- target status: `PARALLEL-CLEAR`
- Allowed Files:
  - `frontend/apps/os-shell/src/pages/atlas/GeoEquityDashboard.tsx`
  - `frontend/apps/os-shell/src/pages/atlas/MassAppraisalGIS.tsx`

### Promote `49B`

- target status: `PARALLEL-CLEAR`
- Allowed Files:
  - `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx`

## Overlap Check

- `47B` does not overlap with `47A`, which remains suite-home only at `frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx`
- `49B` does not overlap with `49A`, which remains suite-home only at `frontend/apps/os-shell/src/pages/suites/DossierSuiteHome.tsx`

## Follow-On Control-Plane Changes

1. update the hold-card unlock ledger
2. add `47B` and `49B` to the execution scoreboard
3. expand the collision matrix to include both new clear cards
4. update the master plan and exhaustive atlas to move both surfaces from hold to execution
