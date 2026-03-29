# CP-56 Parent/Sub-Agent Split Packs

**Date**: 2026-03-29  
**Purpose**: define how Copilot may use parent cards and sub-agents inside the current clear queue without crossing card boundaries or shared hot files  
**Lane**:
- Codex: docs/control-plane only
- Copilot: runtime execution only from prepared cards
- sub-agents: allowed only inside a selected card and only within that card's allowed files

## Authority Stack

1. [2026-03-28-hot-file-collision-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-hot-file-collision-matrix.md)
2. [2026-03-28-execution-scoreboard.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-execution-scoreboard.md)
3. [2026-03-28-master-remaining-copilot-card-plan.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-master-remaining-copilot-card-plan.md)

## Split Labels

- `SINGLE-OWNER`: parent card only; no sub-agent split
- `OPTIONAL-DUAL-SPLIT`: one parent plus one child; parent owns integration and proof
- `DUAL-SPLIT`: one parent plus one child on disjoint host files

## Split Matrix

| Card | Runtime Status | Split Mode | Parent-Owned File(s) | Child-Owned File(s) | Why |
| --- | --- | --- | --- | --- | --- |
| `44A` TerraLevy | `READY-NOW` | `OPTIONAL-DUAL-SPLIT` | `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx` | `frontend/apps/os-shell/src/applications/terra-levy/TerraLevyDashboard.tsx` | suite posture and renderer honesty are coupled, but file ownership can still split cleanly |
| `44B` TerraQueue | `BLOCKED-BY-WAVE` | `OPTIONAL-DUAL-SPLIT` | `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx` | `frontend/apps/os-shell/src/pages/dais/TerraQueue.tsx` | same pattern as `44A`; parent must reconcile suite posture against module disclosure |
| `45A` GPT dual-truth | `BLOCKED-BY-WAVE` | `SINGLE-OWNER` | `frontend/apps/os-shell/src/config/moduleComponents.tsx`; `frontend/apps/os-shell/src/pages/suites/GptSuiteHome.tsx` | none | shared config surface; do not parallelize within the card |
| `45B` Canon gating | `BLOCKED-BY-WAVE` | `SINGLE-OWNER` | `frontend/apps/os-shell/src/pages/CanonHome.tsx` | none | one-file card |
| `45C` Pilot/Trace posture | `BLOCKED-BY-WAVE` | `DUAL-SPLIT` | `frontend/apps/os-shell/src/pages/PilotHome.tsx` | `frontend/apps/os-shell/src/pages/TraceHome.tsx` | exact host files are disjoint and independently editable |
| `46A` CostForge | `BLOCKED-BY-WAVE` | `OPTIONAL-DUAL-SPLIT` | `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx` | `frontend/apps/os-shell/src/components/costforge/CostForgeQuantumDashboard.tsx` | suite-card posture and renderer disclosure can split, but parent must verify truth parity |
| `46B1` Statistics Studio | `BLOCKED-BY-WAVE` | `SINGLE-OWNER` | `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx` | none | one-file Forge renderer proof card |
| `46B2` Batch/Preview | `BLOCKED-BY-WAVE` | `DUAL-SPLIT` | `frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx` | `frontend/apps/os-shell/src/pages/forge/batch/CoefficientPreview.tsx` | two-file batch family truth sweep with disjoint hosts |
| `46B3` Cost Manual / Value Audit | `BLOCKED-BY-WAVE` | `DUAL-SPLIT` | `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx` | `frontend/apps/os-shell/src/pages/suites/modules/ValueAuditModule.tsx` | paired disclosure-local hosts with no service/config spill |
| `46C` Regression Studio | `BLOCKED-BY-WAVE` | `SINGLE-OWNER` | `frontend/apps/os-shell/src/pages/forge/regression/RegressionStudio.tsx` | none | one-file proof card |
| `47A` Atlas breadth posture | `BLOCKED-BY-WAVE` | `SINGLE-OWNER` | `frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx` | none | one-file suite-home card |
| `47B` Atlas renderer truth | `BLOCKED-BY-WAVE` | `DUAL-SPLIT` | `frontend/apps/os-shell/src/pages/atlas/GeoEquityDashboard.tsx` | `frontend/apps/os-shell/src/pages/atlas/MassAppraisalGIS.tsx` | two disjoint renderer pages with no shared host file |
| `48A` Management Dashboard | `BLOCKED-BY-WAVE` | `OPTIONAL-DUAL-SPLIT` | `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx` | `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx` | host and suite posture are separate files, but parent must preserve Dais truth alignment |
| `49A` Dossier suite-home proof | `BLOCKED-BY-WAVE` | `SINGLE-OWNER` | `frontend/apps/os-shell/src/pages/suites/DossierSuiteHome.tsx` | none | one-file suite-home card |
| `49B` Workbench Dossier proof | `BLOCKED-BY-WAVE` | `SINGLE-OWNER` | `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx` | none | one-file workbench card |
| `50A` Governance Dashboard | `BLOCKED-BY-WAVE` | `SINGLE-OWNER` | `frontend/apps/os-shell/src/pages/GovernanceDashboard.tsx` | none | one-file host correction |
| `50C` Admin Dashboard | `BLOCKED-BY-WAVE` | `SINGLE-OWNER` | `frontend/apps/os-shell/src/pages/admin/AdminDashboard.tsx` | none | one-file host correction |

## Parent Rules

1. The parent owns the branch, proof gate, and final stop condition.
2. A child may own at most one file.
3. A child may not widen scope from a page host into services, hooks, config, or adjacent cards.
4. If a child needs a second file, collapse that work back into the parent and stop the split.
5. `45D` stays excluded until it is promoted out of hold.
6. `50E` is serial-ready but remains `SINGLE-OWNER`; do not split `StageZeroState.tsx`.
