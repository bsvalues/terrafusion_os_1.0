# Hold-Card Unlock Ledger

**Date**: 2026-03-29  
**Purpose**: define exactly what proof or scope sealing is still missing before each hold card can be promoted into an issuable Copilot runtime card  
**Lane**:
- Codex: docs/control-plane only
- Copilot: do not execute hold cards

## Authority Stack

1. [2026-03-28-master-remaining-copilot-card-plan.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-master-remaining-copilot-card-plan.md)
2. [2026-03-28-exhaustive-remaining-card-atlas.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-exhaustive-remaining-card-atlas.md)
3. [2026-03-28-hot-file-collision-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-hot-file-collision-matrix.md)
4. [2026-03-29-cp-55-shell-hot-surface-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-55-shell-hot-surface-seal.md)

## Unlock Fields

- `current blocker`: why the card is held now
- `minimum unlock evidence`: the smallest control-plane proof needed before issue
- `candidate allowed files`: only when already partly known
- `unlock owner`: who needs to do the next prep work
- `target status after unlock`: expected class once the blocker is cleared

## Recently Promoted On 2026-03-29

| Card | Unlock Artifact | Exact Files | Promoted Status |
| --- | --- | --- | --- |
| `45C` Pilot/Trace standalone posture alignment | [2026-03-29-cp-51-pilot-trace-file-proof-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-51-pilot-trace-file-proof-seal.md) | `frontend/apps/os-shell/src/pages/PilotHome.tsx`; `frontend/apps/os-shell/src/pages/TraceHome.tsx` | `PARALLEL-CLEAR` |
| `46B1` Statistics Studio proof seal | [2026-03-29-46b-repacketization-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-46b-repacketization-seal.md) | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx` | `PARALLEL-CLEAR` |
| `46B2` Batch/Preview proof seal | [2026-03-29-46b-repacketization-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-46b-repacketization-seal.md) | `frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx`; `frontend/apps/os-shell/src/pages/forge/batch/CoefficientPreview.tsx` | `PARALLEL-CLEAR` |
| `46B3` Cost Manual / Value Audit proof seal | [2026-03-29-46b-repacketization-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-46b-repacketization-seal.md) | `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx`; `frontend/apps/os-shell/src/pages/suites/modules/ValueAuditModule.tsx` | `PARALLEL-CLEAR` |
| `46C` Regression Studio proof seal | [2026-03-29-cp-52-forge-renderer-inventory-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-52-forge-renderer-inventory-seal.md) | `frontend/apps/os-shell/src/pages/forge/regression/RegressionStudio.tsx` | `PARALLEL-CLEAR` |
| `47B` Atlas renderer truth sweep | [2026-03-29-cp-53-atlas-dossier-proof-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-53-atlas-dossier-proof-seal.md) | `frontend/apps/os-shell/src/pages/atlas/GeoEquityDashboard.tsx`; `frontend/apps/os-shell/src/pages/atlas/MassAppraisalGIS.tsx` | `PARALLEL-CLEAR` |
| `49B` Workbench Dossier proof sweep | [2026-03-29-cp-53-atlas-dossier-proof-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-53-atlas-dossier-proof-seal.md) | `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx` | `PARALLEL-CLEAR` |
| `50A` Governance Dashboard role seal | [2026-03-29-cp-54-governance-admin-host-proof-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-54-governance-admin-host-proof-seal.md) | `frontend/apps/os-shell/src/pages/GovernanceDashboard.tsx` | `PARALLEL-CLEAR` |
| `50C` Admin Dashboard static-data cleanup | [2026-03-29-cp-54-governance-admin-host-proof-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-54-governance-admin-host-proof-seal.md) | `frontend/apps/os-shell/src/pages/admin/AdminDashboard.tsx` | `PARALLEL-CLEAR` |
| `50E` Desktop shell proof seal | [2026-03-29-cp-55-shell-hot-surface-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-55-shell-hot-surface-seal.md) | `frontend/apps/os-shell/src/shell/desktop/StageZeroState.tsx` | `SERIAL-CLEAR` |

## Closed Without New Runtime Work On 2026-03-29

| Card | Closure Artifact | Exact File | Closure Reason |
| --- | --- | --- | --- |
| `50B` Monitoring simulation framing | [2026-03-29-cp-54-governance-admin-host-proof-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-54-governance-admin-host-proof-seal.md) | `frontend/apps/os-shell/src/pages/Monitoring.tsx` | page-level simulation framing already satisfies the card intent |
| `50D` User Admin honesty correction | [2026-03-29-cp-54-governance-admin-host-proof-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-54-governance-admin-host-proof-seal.md) | `frontend/apps/os-shell/src/pages/admin/UserAdmin.tsx` | unconditional `DemoDataBanner` and explicit sample-fixture posture already landed |

## Remaining Hold Cards

| Card | Current Blocker | Minimum Unlock Evidence | Candidate Allowed Files | Unlock Owner | Target Status After Unlock |
| --- | --- | --- | --- | --- | --- |
| `45D` Shell launcher truth-dialect reconciliation | shared launcher/config surfaces are hot and governance-owned | explicit architectural-risk authorization plus confirmation that no other active card touches launcher config | `frontend/apps/os-shell/src/config/suiteRegistry.ts`; `frontend/apps/os-shell/src/config/desktopManifest.ts`; `frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx` | co-founder governance ruling plus Codex docs confirmation | likely `SERIAL-CLEAR` |

## Highest-Value Unlock Order

1. `45D`

## Why This Order

1. `45C`, `46B1`, `46B2`, `46B3`, `46C`, `47B`, `49B`, `50A`, and `50C` are already promoted and should stay out of the hold pool.
2. `50B` and `50D` are closed without new runtime work and should not be treated as pending unlocks.
3. `50E` hold was lifted by [2026-03-29-cp-55-shell-hot-surface-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-55-shell-hot-surface-seal.md); the remaining work is proof verification on `StageZeroState.tsx`, not hold resolution.
4. `45D` is now the only remaining launcher hot-surface hold.

## Promotion Rule

Do not promote a hold card into execution until this ledger has:

1. an exact file list
2. a target class (`SERIAL-CLEAR` or `PARALLEL-CLEAR`)
3. a collision entry in [2026-03-28-hot-file-collision-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-hot-file-collision-matrix.md)
