# Hot-File Collision Matrix

**Date**: 2026-03-29  
**Purpose**: define which Copilot cards may run in parallel, which must serialize, and which hold cards remain blocked because their hot files are shared  
**Lane**:
- Codex: docs/control-plane only
- Copilot: execute only from named cards

## Authority Stack

1. [2026-03-28-phase44-execution-packet.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-phase44-execution-packet.md)
2. [2026-03-28-remaining-copilot-execution-cards.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-remaining-copilot-execution-cards.md)
3. [2026-03-28-master-remaining-copilot-card-plan.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-master-remaining-copilot-card-plan.md)
4. [2026-03-28-exhaustive-remaining-card-atlas.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-exhaustive-remaining-card-atlas.md)
5. [2026-03-29-cp-55-shell-hot-surface-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-55-shell-hot-surface-seal.md)

## Collision Labels

- `NONE`: no known file overlap
- `HARD`: direct file overlap; do not run together
- `HOT`: no direct overlap proven, but policy says one card must run alone because it touches shared launcher/config surfaces

## Known Write Sets

| Card | Wave | Allowed Files | Collision Class |
| --- | --- | --- | --- |
| `44A` TerraLevy | Wave 0 | `frontend/apps/os-shell/src/applications/terra-levy/TerraLevyDashboard.tsx`; `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx` | bounded |
| `44B` TerraQueue | Wave 0 | `frontend/apps/os-shell/src/pages/dais/TerraQueue.tsx`; `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx` | bounded |
| `45A` GPT dual-truth | Wave 1 | `frontend/apps/os-shell/src/config/moduleComponents.tsx`; `frontend/apps/os-shell/src/pages/suites/GptSuiteHome.tsx` | hot shared config |
| `45C` Pilot/Trace posture | Wave 2 | `frontend/apps/os-shell/src/pages/PilotHome.tsx`; `frontend/apps/os-shell/src/pages/TraceHome.tsx` | bounded |
| `45B` Canon gating | Wave 2 | `frontend/apps/os-shell/src/pages/CanonHome.tsx` | bounded |
| `46A` CostForge | Wave 2 | `frontend/apps/os-shell/src/components/costforge/CostForgeQuantumDashboard.tsx`; `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx` | bounded |
| `46B1` Statistics Studio | Wave 2 | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx` | bounded |
| `46B2` Batch/Preview | Wave 2 | `frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx`; `frontend/apps/os-shell/src/pages/forge/batch/CoefficientPreview.tsx` | bounded |
| `46B3` Cost Manual / Value Audit | Wave 2 | `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx`; `frontend/apps/os-shell/src/pages/suites/modules/ValueAuditModule.tsx` | bounded |
| `46C` Regression Studio | Wave 2 | `frontend/apps/os-shell/src/pages/forge/regression/RegressionStudio.tsx` | bounded |
| `47A` Atlas breadth posture | Wave 2 | `frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx` | bounded |
| `47B` Atlas renderer truth | Wave 2 | `frontend/apps/os-shell/src/pages/atlas/GeoEquityDashboard.tsx`; `frontend/apps/os-shell/src/pages/atlas/MassAppraisalGIS.tsx` | bounded |
| `48A` Management Dashboard | Wave 2 | `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx`; `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx` | bounded |
| `49A` Dossier suite-home proof | Wave 2 | `frontend/apps/os-shell/src/pages/suites/DossierSuiteHome.tsx` | bounded |
| `49B` Workbench Dossier proof | Wave 2 | `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx` | bounded |
| `50A` Governance Dashboard | Wave 2 | `frontend/apps/os-shell/src/pages/GovernanceDashboard.tsx` | bounded |
| `50C` Admin Dashboard | Wave 2 | `frontend/apps/os-shell/src/pages/admin/AdminDashboard.tsx` | bounded |
| `50E` Desktop shell proof | Ready serial sidecar | `frontend/apps/os-shell/src/shell/desktop/StageZeroState.tsx` | bounded |

## Clear-Card Collision Grid

| Card | `44A` | `44B` | `45A` | `45B` | `46A` | `47A` | `48A` | `49A` | `50E` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `44A` | self | `HARD` | `HOT` | `NONE` | `NONE` | `NONE` | `HARD` | `NONE` | `NONE` |
| `44B` | `HARD` | self | `HOT` | `NONE` | `NONE` | `NONE` | `HARD` | `NONE` | `NONE` |
| `45A` | `HOT` | `HOT` | self | `HOT` | `HOT` | `HOT` | `HOT` | `HOT` | `NONE` |
| `45B` | `NONE` | `NONE` | `HOT` | self | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` |
| `46A` | `NONE` | `NONE` | `HOT` | `NONE` | self | `NONE` | `NONE` | `NONE` | `NONE` |
| `47A` | `NONE` | `NONE` | `HOT` | `NONE` | `NONE` | self | `NONE` | `NONE` | `NONE` |
| `48A` | `HARD` | `HARD` | `HOT` | `NONE` | `NONE` | `NONE` | self | `NONE` | `NONE` |
| `49A` | `NONE` | `NONE` | `HOT` | `NONE` | `NONE` | `NONE` | `NONE` | self | `NONE` |
| `50E` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | self |

## Operational Read

1. `44A` and `44B` cannot run together because both touch `DaisSuiteHome.tsx`.
2. `48A` cannot run with either `44A` or `44B` because it also touches `DaisSuiteHome.tsx`.
3. `45A` remains serial by policy because it touches `moduleComponents.tsx`, a shared module-registration surface.
4. `50E` is now a bounded serial sidecar with no overlap against the cleared packet surfaces; its sole write file is `StageZeroState.tsx`.
5. `45D` is the only remaining launcher hot-surface hold.

## Hold-Card Hot-Surface View

| Hold Card | Known Or Candidate Files | Collision State | Why Still Blocked |
| --- | --- | --- | --- |
| `45D` launcher dialect | `suiteRegistry.ts`; `desktopManifest.ts`; `DesktopIconGrid.tsx` | `HOT` | shared launcher/config surface requires dedicated hot-file window and architectural authorization |

## Historical Clear Pool

These cards were cleared by this matrix and remain the canonical disjoint packet structure:

- `45C`
- `45B`
- `46A`
- `46B1`
- `46B2`
- `46B3`
- `46C`
- `47A`
- `47B`
- `48A`
- `49A`
- `49B`
- `50A`
- `50C`

## Serial Sidecar

- `50E` may run alone after any in-flight runtime session is clean.

## Closed Or Suppressed Runtime Cards

| Card | Runtime State | Why It Stays Out Of Parallel Execution |
| --- | --- | --- |
| `50B` Monitoring | closed `NO-OP` | simulation framing already exists at the page level and the child dashboard already mounts `DemoDataBanner` |
| `50D` User Admin | closed as already satisfied | unconditional `DemoDataBanner` already discloses sample-fixture posture |

## Use Rule

If a card is not in this matrix with a sealed write set, treat it as non-parallelizable until the hold-card unlock ledger upgrades it.
