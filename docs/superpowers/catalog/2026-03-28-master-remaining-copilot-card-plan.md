# Master Remaining Copilot Card Plan

**Date**: 2026-03-28  
**Purpose**: define the full remaining Copilot execution plan after the current Phase 44 quarantine pair, with explicit multi-agent and sub-agent parallel boundaries  
**Status**: current master plan for remaining runtime cards; complements the immediate [remaining packet](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-remaining-copilot-execution-cards.md) and the exhaustive [remaining-card atlas](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-exhaustive-remaining-card-atlas.md) rather than replacing them  
**Lane**:
- Codex: docs/control-plane only
- Copilot: bounded runtime execution only
- sub-agents: allowed only inside a selected card and only within that card's allowed files

**Prep artifacts**:
- [2026-03-28-hot-file-collision-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-hot-file-collision-matrix.md)
- [2026-03-28-hold-card-unlock-ledger.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-hold-card-unlock-ledger.md)
- [2026-03-28-execution-scoreboard.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-execution-scoreboard.md)
- [2026-03-29-next-codex-phase-program.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\plans\2026-03-29-next-codex-phase-program.md)
- [2026-03-29-codex-phase-board.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-codex-phase-board.md)
- [2026-03-29-cp-51-pilot-trace-file-proof-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-51-pilot-trace-file-proof-seal.md)
- [2026-03-29-cp-52-forge-renderer-inventory-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-52-forge-renderer-inventory-seal.md)
- [2026-03-29-cp-53-atlas-dossier-proof-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-53-atlas-dossier-proof-seal.md)
- [2026-03-29-cp-54-governance-admin-host-proof-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-54-governance-admin-host-proof-seal.md)
- [2026-03-29-46b-repacketization-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-46b-repacketization-seal.md)
- [2026-03-29-cp-56-parent-sub-agent-split-packs.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-56-parent-sub-agent-split-packs.md)
- [2026-03-29-cp-59-no-card-canon-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-59-no-card-canon-seal.md)

## Authority Stack

Use only these artifacts when issuing any remaining card:

1. [2026-03-28-phase44-execution-packet.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-phase44-execution-packet.md)
2. [2026-03-28-remaining-copilot-execution-cards.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-remaining-copilot-execution-cards.md)
3. [2026-03-28-full-ecosystem-demo-surface-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-surface-matrix.md)
4. [2026-03-28-full-ecosystem-demo-launch-registry.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-launch-registry.md)
5. [2026-03-28-surface-readiness-ledger.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-surface-readiness-ledger.md)
6. [2026-03-28-full-ecosystem-demo-tranche-backlog.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-tranche-backlog.md)

## Execution Status Legend

- `SERIAL-CLEAR`: execution-ready, but must run alone because it touches a shared config, launch surface, or otherwise hot write set
- `PARALLEL-CLEAR`: execution-ready and allowed to run with another `PARALLEL-CLEAR` card if the write sets are disjoint
- `HOLD`: defined in the control plane, but not ready to issue because file proof, role clarity, or hot-surface clearance is still missing

## Global Runtime Rules

These apply to every remaining card:

- one parent card owns the slice
- sub-agents may split only within that card's allowed files
- no widening into `PropertyWorkbench.tsx`
- no widening into `QueuedModuleSurface.tsx`
- no `WorkbenchTabSlug` changes
- no Clerk, Treasury, Audit, Recorder, or other reserved vertical promotion
- suite, OS, system-workspace, and workbench ownership follows [2026-03-29-cp-61-ownership-boundary-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-61-ownership-boundary-seal.md)
- no backup, dead-shell, ARCHIVE, or QUARANTINE archaeology during runtime work
- no docs edits during runtime execution
- if a change requires a file outside Allowed Files, stop and report

## Wave Map

### Wave 0 - Preconditions

These must close before any remaining card is issued:

1. `44A` TerraLevy sample-fiction honesty correction
2. `44B` TerraQueue fixture-risk posture correction

### Wave 1 - Serial Blockers

These cards are execution-ready, but must run alone:

1. `45A` GPT dual-truth placeholder-conflict alignment

### Wave 2 - Parallel Pool A

These cards are execution-ready and use disjoint write sets:

1. `45C` Pilot/Trace standalone posture alignment
2. `45B` Canon mixed-family gating
3. `46A` CostForge quarantine honesty seal
4. `46B1` Statistics Studio proof seal
5. `46B2` Batch/Preview proof seal
6. `46B3` Cost Manual / Value Audit proof seal
7. `46C` Regression Studio proof seal
8. `47A` Atlas breadth queued-posture seal
9. `47B` Atlas renderer truth sweep
10. `48A` Management Dashboard conditional-live cleanup
11. `49A` Dossier suite-home proof seal
12. `49B` Workbench Dossier proof sweep
13. `50A` Governance Dashboard role seal
14. `50C` Admin Dashboard static-data cleanup

### Wave 3 - Remaining Hold

These cards remain HOLD:

1. `45D` Shell launcher truth-dialect reconciliation

### Ready Serial Sidecar

1. `50E` Desktop shell proof seal

### Closed / No Runtime Needed

1. `50B` Monitoring simulation framing
2. `50D` User Admin honesty correction

## Immediate Packet Reference

The detailed card text for `45A`, `45B`, `45C`, and `45D` already lives in [2026-03-28-remaining-copilot-execution-cards.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-remaining-copilot-execution-cards.md). This master plan extends beyond that packet and adds the rest of the remaining card set.

## Card 46A - CostForge Quarantine Honesty Seal

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Quarantine`
- `source rows`:
  - Readiness ledger: `CostForge | Forge | Active/Canonical | Real renderer launches, but current surface is mock analytics rather than county-runtime truth | Full App | Forge | silently fake | Sample-fiction honesty violation | Quarantine`
  - Matrix: `Forge | CostForge | standalone-window | county | assisted | queued | R0 Not-demo-safe | sample-fiction`
  - Launch registry: `costforge` resolves to a real renderer and remains a renderer-backed honesty defect
- `explicitly out of scope`:
  - QUARANTINE restore-search
  - broad Forge fixture cleanup
  - new backend valuation work

### Execution Status

`PARALLEL-CLEAR`

Why:
- the problem is isolated to one module renderer and one suite-home card host
- the write set is disjoint from the other clear cards in Parallel Pool A

### Allowed Files

- `frontend/apps/os-shell/src/components/costforge/CostForgeQuantumDashboard.tsx`
- `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx`

### Forbidden Files

- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- any Forge breadth renderer not named above

### Required Changes

1. Make the mock or demo nature of CostForge analytics unambiguous if county-runtime truth is still absent.
2. Remove any live-looking suite-card posture while sample analytics remain active.
3. If the renderer cannot be made honest within the two allowed files, downgrade it visibly and stop.

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only the two allowed files change and CostForge exits its current silently-fake live-looking posture.

### Paste-Ready Copilot Handoff

````md
# Copilot Execution Card

## Slice
Phase 46A - CostForge quarantine honesty seal

## Why
`CostForge` is still a renderer-backed quarantine surface because mock analytics are presented with live-looking posture.

## Source of Truth
- Matrix row(s):
  - `Forge | CostForge | standalone-window | county | assisted | queued | R0 Not-demo-safe | sample-fiction`
- Launch registry note(s):
  - `costforge` resolves to a real renderer
  - it remains a renderer-backed honesty defect
- Readiness ledger row(s):
  - `CostForge` = `Quarantine`

## Current State
- Canonical Status: `Active/Canonical`
- Readiness Label: `Quarantine`
- Truth posture now: renderer present, mock analytics active, silently fake live-looking posture

## Goal State
CostForge either reads honestly as demo/sample truth or is visibly downgraded from live-looking posture.

## Allowed Files
- `frontend/apps/os-shell/src/components/costforge/CostForgeQuantumDashboard.tsx`
- `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx`

## Forbidden Files
- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- any Forge breadth renderer not named above

## Required Changes
1. Make the mock or demo nature of CostForge analytics unambiguous if county-runtime truth is still absent.
2. Remove any live-looking suite-card posture while sample analytics remain active.
3. If the renderer cannot be made honest within the two allowed files, downgrade it visibly and stop.

## Proof Gates
```bash
pnpm run type-check
```

## Stop Condition
Only the two allowed files change and CostForge exits its current silently-fake live-looking posture.
````

## Card 47A - Atlas Breadth Queued-Posture Seal

### Authority Snapshot

- `canonical_status`: `Active/Canonical` for `Atlas suite home`; `Planned` for `Geo Equity`, `Appraisal GIS`, and `TerraGIS Pro`
- `readiness_label`: `Recovery` for suite home; `Recovery` or `Planned` for breadth cards
- `source rows`:
  - Readiness ledger: `Atlas suite home | Atlas | Active/Canonical | Real suite home with live host and queued breadth labeling | Home Scene | Atlas | real | Proof gap | Recovery`
  - Readiness ledger: `Geo Equity | Atlas | Planned | Real renderer exists, but suite posture and data truth remain queued and fixture-dependent | Full App | Atlas | mock-labeled | Fixture risk | Recovery`
  - Readiness ledger: `Appraisal GIS | Atlas | Planned | Real renderer exists, but live GIS truth is still conditional and demo-parcel fallback remains | Full App | Atlas | mock-labeled | Fixture risk | Recovery`
  - Readiness ledger: `TerraGIS Pro | Atlas | Planned | Module resolves only to a placeholder host | Full App | Atlas | placeholder | Placeholder host | Planned`
  - Launch registry: `geo-equity-dashboard` and `mass-appraisal-gis` resolve to real renderers, while `terra-gis` remains placeholder-hosted
- `explicitly out of scope`:
  - renderer-level GIS truth cleanup
  - new GIS runtime work
  - promoting placeholder Atlas breadth to live scope

### Execution Status

`PARALLEL-CLEAR`

Why:
- this card is intentionally limited to suite-home posture
- the single-file write set is disjoint from the other clear cards

### Allowed Files

- `frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx`

### Forbidden Files

- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- any Atlas renderer file

### Required Changes

1. Keep Atlas breadth surfaces visibly queued or conditional where runtime truth is not sealed.
2. Preserve live host truth for the suite home without overstating breadth modules.
3. Do not widen into renderer cleanup inside this card.

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only `AtlasSuiteHome.tsx` changes and Atlas breadth cards no longer overstate readiness.

### Paste-Ready Copilot Handoff

````md
# Copilot Execution Card

## Slice
Phase 47A - Atlas breadth queued-posture seal

## Why
Atlas breadth modules remain queued or conditional, and the suite home must keep that truth explicit without widening into renderer cleanup.

## Source of Truth
- Matrix row(s):
  - `Atlas suite home`
  - `Geo Equity`
  - `Appraisal GIS`
  - `TerraGIS Pro`
- Launch registry note(s):
  - `geo-equity-dashboard` and `mass-appraisal-gis` are real renderer paths
  - `terra-gis` remains placeholder-hosted
- Readiness ledger row(s):
  - `Atlas suite home` = `Recovery`
  - `Geo Equity` = `Recovery`
  - `Appraisal GIS` = `Recovery`
  - `TerraGIS Pro` = `Planned`

## Current State
- Canonical Status: suite home is active; breadth remains planned or recovery-grade
- Readiness Label: queued or conditional breadth truth still needs explicit suite posture
- Truth posture now: suite host is real, but breadth must stay non-live

## Goal State
Atlas suite-home posture preserves queued or conditional truth for breadth surfaces without touching renderer logic.

## Allowed Files
- `frontend/apps/os-shell/src/pages/suites/AtlasSuiteHome.tsx`

## Forbidden Files
- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- any Atlas renderer file

## Required Changes
1. Keep Atlas breadth surfaces visibly queued or conditional where runtime truth is not sealed.
2. Preserve live host truth for the suite home without overstating breadth modules.
3. Do not widen into renderer cleanup inside this card.

## Proof Gates
```bash
pnpm run type-check
```

## Stop Condition
Only `AtlasSuiteHome.tsx` changes and Atlas breadth cards no longer overstate readiness.
````

## Card 48A - Management Dashboard Conditional-Live Cleanup

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Recovery`
- `source rows`:
  - Readiness ledger: `Management Dashboard | Dais | Active/Canonical | Real standalone dashboard uses live hooks, but residual fixture fallback still exists | Full App | Dais | mock-labeled | Fixture risk | Recovery`
  - Matrix: `Dais | Management Dashboard | standalone-window | county | assisted | live | R2 Conditional-live | fixture-risk`
  - Launch registry: `management-dashboard` resolves to a real renderer and remains a Dais standalone card
- `explicitly out of scope`:
  - queue backend work
  - TerraLevy or TerraQueue changes
  - suite-wide Dais ownership changes

### Execution Status

`PARALLEL-CLEAR`

Why:
- the write set is isolated to one dashboard page and one suite-home card host
- it does not overlap with the other Parallel Pool A cards

### Allowed Files

- `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx`
- `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx`

### Forbidden Files

- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- `frontend/apps/os-shell/src/pages/dais/TerraLevyDashboard.tsx`
- `frontend/apps/os-shell/src/pages/dais/TerraQueue.tsx`

### Required Changes

1. Keep source-state or fixture disclosure unmistakable while residual fallback remains.
2. Remove any stronger live claims than the current proof supports.
3. Do not widen into queue, levy, or backend work.

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only the two allowed files change and Management Dashboard remains conditional-live rather than overstated live truth.

### Paste-Ready Copilot Handoff

````md
# Copilot Execution Card

## Slice
Phase 48A - Management Dashboard conditional-live cleanup

## Why
`Management Dashboard` is real, but residual fixture fallback still makes stronger live claims unsafe.

## Source of Truth
- Matrix row(s):
  - `Dais | Management Dashboard | standalone-window | county | assisted | live | R2 Conditional-live | fixture-risk`
- Launch registry note(s):
  - `management-dashboard` resolves to a real renderer
- Readiness ledger row(s):
  - `Management Dashboard` = `Recovery`

## Current State
- Canonical Status: `Active/Canonical`
- Readiness Label: `Recovery`
- Truth posture now: real dashboard, but residual fixture fallback still exists

## Goal State
Management Dashboard stays visibly conditional-live until residual fallback ambiguity is removed.

## Allowed Files
- `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx`
- `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx`

## Forbidden Files
- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- `frontend/apps/os-shell/src/pages/dais/TerraLevyDashboard.tsx`
- `frontend/apps/os-shell/src/pages/dais/TerraQueue.tsx`

## Required Changes
1. Keep source-state or fixture disclosure unmistakable while residual fallback remains.
2. Remove any stronger live claims than the current proof supports.
3. Do not widen into queue, levy, or backend work.

## Proof Gates
```bash
pnpm run type-check
```

## Stop Condition
Only the two allowed files change and Management Dashboard remains conditional-live rather than overstated live truth.
````

## Card 49A - Dossier Suite-Home Proof Seal

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Recovery`
- `source rows`:
  - Readiness ledger: `Dossier suite home | Dossier | Active/Canonical | Real suite home with parcel-routing truth and queued system tools | Home Scene | Dossier | real | Proof gap | Recovery`
  - Matrix: `Dossier | Dossier suite home | suite-home | county | assisted | live | R2 Conditional-live | proof-gap`
  - Launch registry: Dossier suite home is real, parcel work routes through the workbench, and `terra-flow` remains queued canon
- `explicitly out of scope`:
  - TerraFlow resurrection
  - PACS DataBridge or TerraSync implementation
  - workbench tab changes

### Execution Status

`PARALLEL-CLEAR`

Why:
- the proof-gap cleanup is bounded to the suite-home host
- the write set is disjoint from the other clear cards

### Allowed Files

- `frontend/apps/os-shell/src/pages/suites/DossierSuiteHome.tsx`

### Forbidden Files

- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- any Workbench Dossier tab file
- any TerraFlow renderer residue

### Required Changes

1. Keep parcel-routing and queued system-tool truth explicit.
2. Remove any ambiguous wording that blurs suite-home proof with unsealed breadth claims.
3. Do not widen into workbench or system-tool implementation.

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only `DossierSuiteHome.tsx` changes and the suite home no longer overstates proof beyond current control-plane truth.

### Paste-Ready Copilot Handoff

````md
# Copilot Execution Card

## Slice
Phase 49A - Dossier suite-home proof seal

## Why
`Dossier suite home` is real, but its proof posture still needs alignment with parcel-routing truth and queued system-tool boundaries.

## Source of Truth
- Matrix row(s):
  - `Dossier | Dossier suite home | suite-home | county | assisted | live | R2 Conditional-live | proof-gap`
- Launch registry note(s):
  - Dossier suite home is real
  - parcel work routes through the Workbench
  - `terra-flow` remains queued canon
- Readiness ledger row(s):
  - `Dossier suite home` = `Recovery`

## Current State
- Canonical Status: `Active/Canonical`
- Readiness Label: `Recovery`
- Truth posture now: real suite host, but proof language can still blur parcel-routing truth with queued breadth

## Goal State
Dossier suite-home posture matches current proof, parcel-routing truth, and queued system-tool boundaries.

## Allowed Files
- `frontend/apps/os-shell/src/pages/suites/DossierSuiteHome.tsx`

## Forbidden Files
- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- any Workbench Dossier tab file
- any TerraFlow renderer residue

## Required Changes
1. Keep parcel-routing and queued system-tool truth explicit.
2. Remove ambiguous wording that blurs suite-home proof with unsealed breadth claims.
3. Do not widen into workbench or system-tool implementation.

## Proof Gates
```bash
pnpm run type-check
```

## Stop Condition
Only `DossierSuiteHome.tsx` changes and the suite home no longer overstates proof beyond current control-plane truth.
````

## Card 45C - Pilot/Trace Standalone Posture Alignment

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Recovery`
- `source rows`:
  - Readiness ledger: `Pilot Home / Pilot Console | OS | Active/Canonical | Standalone Pilot entry; real console content but truth posture not explicitly sealed | Home Scene | OS | real | Proof gap | Recovery`
  - Readiness ledger: `Trace Home | OS | Active/Canonical | Real telemetry visualization but fixture-fallback truth boundary not disclosed | Home Scene | OS | real | Proof gap | Recovery`
- `scope sealed`: 2026-03-29 co-founder discovery ruling
- `explicitly out of scope`:
  - Pilot backend, RBAC, or tool invocation changes
  - TerraTrace contract test changes
  - Any pilot service or API file

### Execution Status

`PARALLEL-CLEAR`

Why:
- the proof-gap language is bounded to the standalone home page files
- the write set is disjoint from all other Pool B cards

### Allowed Files

- `frontend/apps/os-shell/src/pages/PilotHome.tsx`
- `frontend/apps/os-shell/src/pages/TraceHome.tsx`

### Forbidden Files

- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- any Pilot service, API, hook, or RBAC file
- TerraTrace contract files

### Required Changes

1. Add explicit posture disclosure to `PilotHome` where architecture claims (e.g. "Single Choke Point") are asserted without runtime proof.
2. Add fixture-fallback truth boundary disclosure to `TraceHome` where telemetry store fallback is active.
3. Do not change any invocation logic, hook, or service file.

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only the three allowed files change and both surfaces exit their current undisclosed-posture state.

---

## Card 46B - Historical Bundled Hold (Superseded)

### Authority Snapshot

- `canonical_status`: `Active/Canonical` for all five renderers
- `readiness_label`: `Recovery`
- `source rows`:
  - `Statistics Studio | Forge | Active/Canonical | real renderer, DemoDataBanner wired, fixture array fallback not explicitly bounded | Full App | Forge | mock-labeled | Fixture risk | Recovery`
  - `Batch Cost Runs | Forge | Active/Canonical | real renderer, BACKEND_APPLY_CAPABLE=true inconsistency, fixture data | Full App | Forge | mock-labeled | Fixture risk | Recovery`
  - `Coefficient Preview | Forge | Active/Canonical | real renderer, BACKEND_APPLY_CAPABLE=false, fixture data | Full App | Forge | mock-labeled | Fixture risk | Recovery`
  - `Cost Manual | Forge | Active/Canonical | real renderer, SAMPLE_COST_SCHEDULES fallback, isSampleData flag present | Full App | Forge | mock-labeled | Fixture risk | Recovery`
  - `Value Audit Log | Forge | Active/Canonical | real renderer, DEMO_ENTRIES fixture array, no DemoDataBanner | Full App | Forge | mock-labeled | Fixture risk | Recovery`
- `scope sealed`: 2026-03-29 co-founder discovery ruling
- `explicitly out of scope`:
  - CostForge changes (covered by 46A, already complete)
  - Regression Studio (separate card 46C)
  - any Forge store or service file

### Execution Status

`SUPERSEDED`

Why:
- the exact five-file host inventory is sealed
- the bundled card was broader than necessary for Copilot execution
- [2026-03-29-46b-repacketization-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-46b-repacketization-seal.md) replaced this coarse hold with `46B1` / `46B2` / `46B3`

### Exact Host Inventory

- `frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx`
- `frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx`
- `frontend/apps/os-shell/src/pages/forge/batch/CoefficientPreview.tsx`
- `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx`
- `frontend/apps/os-shell/src/pages/suites/modules/ValueAuditModule.tsx`

### Successor Cards

Do not issue this historical bundled card.

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

### Stop Condition

Do not issue `46B` from this section. Issue `46B1`, `46B2`, or `46B3` only, using [2026-03-29-46b-repacketization-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-46b-repacketization-seal.md).

---

## Card 46C - Regression Studio Proof Seal

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Recovery`
- `source rows`:
  - Readiness ledger: `Regression Studio | Forge | Active/Canonical | real renderer, store-driven model list, no explicit proof-posture disclosure at landing view | Full App | Forge | real | Proof gap | Recovery`
- `scope sealed`: 2026-03-29 co-founder ruling — host-only scope for this tranche
- `scope decision`: host file only; sub-components (`RegressionControlPanel`, `CoefficientPanel`) are explicitly out of scope for this tranche unless proof emerges that the truth issue lives inside them
- `explicitly out of scope`:
  - `RegressionControlPanel.tsx`
  - `CoefficientPanel.tsx`
  - `VersionComparePanel.tsx`
  - any Regression chart file
  - any Forge store or service file

### Execution Status

`PARALLEL-CLEAR`

Why:
- single-file host scope; disjoint from all other Pool B cards

### Allowed Files

- `frontend/apps/os-shell/src/pages/forge/regression/RegressionStudio.tsx`

### Forbidden Files

- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- `RegressionControlPanel.tsx`
- `CoefficientPanel.tsx`
- any Regression sub-component, chart, or store file

### Required Changes

1. Add explicit fixture or live-truth posture disclosure at the `RegressionStudio` landing view.
2. Do not widen into sub-components unless the landing view change is insufficient and a stop-and-report condition is triggered.

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only `RegressionStudio.tsx` changes and the landing view no longer presents model data without posture disclosure.

---

## Card 47B - Atlas Renderer Truth Sweep

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Recovery`
- `source rows`:
  - Readiness ledger: `Geo Equity | Atlas | Planned | real renderer, DemoDataBanner wired, fragile reference-equality fixture-fallback detection | Full App | Atlas | mock-labeled | Fixture risk | Recovery`
  - Readiness ledger: `Appraisal GIS | Atlas | Planned | real renderer, DemoDataBanner imported, fixture parcel data fallback | Full App | Atlas | mock-labeled | Fixture risk | Recovery`
- `scope sealed`: 2026-03-29 co-founder discovery ruling
- `explicitly out of scope`:
  - Atlas suite home (covered by 47A, already complete)
  - TerraGIS Pro (placeholder, NO-CARD-KEEP-QUEUED)
  - any Atlas store or service file

### Execution Status

`PARALLEL-CLEAR`

Why:
- two standalone renderer pages; write set stays inside two named files
- disjoint from all other Pool B cards

### Allowed Files

- `frontend/apps/os-shell/src/pages/atlas/GeoEquityDashboard.tsx`
- `frontend/apps/os-shell/src/pages/atlas/MassAppraisalGIS.tsx`

### Forbidden Files

- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- any Atlas store, service, or spatial fixture file
- `AtlasSuiteHome.tsx`

### Required Changes

1. Harden `GeoEquityDashboard` fixture-fallback detection: replace fragile reference-equality check with an explicit `isFixture` boolean that is set when the API call fails or returns empty.
2. Ensure `MassAppraisalGIS` has `DemoDataBanner` fully wired (not just imported) with an appropriate fixture-data disclosure condition.
3. Do not change any store, service, or data file.

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only the two allowed files change and both renderers exit their current fixture-fallback ambiguity.

---

## Card 49B - Workbench Dossier Proof Sweep

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Recovery`
- `source rows`:
  - Readiness ledger: `Dossier tab | Dossier | Active/Canonical | real backend-connected workbench tab with real API, correlationId UX, and evidence sub-components; proof posture question is narrower than suite home | Workbench | Dossier | real | Proof gap | Recovery`
- `scope sealed`: 2026-03-29 co-founder discovery ruling
- `explicitly out of scope`:
  - `DossierSuiteHome.tsx` (covered by 49A, already complete)
  - Evidence sub-components (`ParcelEvidencePacket`, `PacketNarrativeEditor`, `PacketFinalizationPanel`, `PacketAppealHandoffPanel`)
  - any Dossier service or hook file

### Execution Status

`PARALLEL-CLEAR`

Why:
- single workbench tab file; write set stays inside one file
- disjoint from all other Pool B cards

### Allowed Files

- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx`

### Forbidden Files

- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- `DossierSuiteHome.tsx`
- any Dossier evidence sub-component
- any Dossier service, hook, or contract file

### Required Changes

1. Add appropriate proof-posture disclosure for any data shown in the Dossier tab that is not live-backend-sourced (e.g. synthesized evidence, fallback states).
2. Do not change any evidence sub-component logic, service, or hook.

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only `PropertyDossier.tsx` changes and the Dossier workbench tab no longer presents any data without appropriate proof-posture disclosure.

---

## Card 50A - Governance Dashboard Role Seal

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Recovery`
- `source rows`:
  - Readiness ledger: `Governance Dashboard | OS | Active/Canonical | real live API calls to /api/pilot/metrics; handles ACCESS_DENIED correctly; no demo-context framing when backend is not live | Full App | OS | real | Proof gap | Recovery`
- `scope sealed`: 2026-03-29 co-founder discovery ruling
- `explicit disclosure needed`: the render path has no framing for client-demo or prospect context where the backend is not live; loading/error states appear without posture context
- `explicitly out of scope`:
  - any Pilot API, metrics backend, or RBAC change
  - `GovernanceLock` configuration
  - any shared dashboard component

### Execution Status

`PARALLEL-CLEAR`

Why:
- single-file host scope; disjoint from all other Pool B cards

### Allowed Files

- `frontend/apps/os-shell/src/pages/GovernanceDashboard.tsx`

### Forbidden Files

- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- any Pilot API or metrics file

### Required Changes

1. Add a visible disclosure note to the Governance Dashboard that clarifies this surface renders live invocation metrics from the backend and is not populated in demo/prospect environments without a live county backend connection.
2. Do not change any API call, RBAC gate, or backend logic.

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only `GovernanceDashboard.tsx` changes and the surface includes a clear demo-context framing disclosure.

---

## Card 50C - Admin Dashboard Static-Data Cleanup

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Recovery`
- `source rows`:
  - Readiness ledger: `Admin Dashboard | OS | Active/Canonical | tabbed admin surface; hardcoded fixture interfaces present for counties, security events, users, study periods, scrape jobs; DemoDataBanner absent | Full App | OS | mock-labeled | Fixture risk | Recovery`
- `scope sealed`: 2026-03-29 co-founder discovery ruling
- `explicitly out of scope`:
  - `UserAdmin.tsx` (closed `50D`; do not reopen)
  - any backend admin API or auth change

### Execution Status

`PARALLEL-CLEAR`

Why:
- single-file host scope; disjoint from all other Pool B cards

### Allowed Files

- `frontend/apps/os-shell/src/pages/admin/AdminDashboard.tsx`

### Forbidden Files

- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- `UserAdmin.tsx`

### Required Changes

1. Add `DemoDataBanner` or equivalent disclosure where hardcoded static data arrays (counties, security events, users, study periods, scrape jobs) are rendered.
2. Do not change any static data array values, backend wiring, or auth logic.

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only `AdminDashboard.tsx` changes and the static data sections include visible sample-data disclosure.

---

## Card 50D - Closed As Already Satisfied

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Recovery`
- `source rows`:
  - Readiness ledger: `User Admin | Admin | Active/Canonical | Real route exists; INITIAL_USERS and AUDIT_LOG remain sample-data-driven, but the page now discloses that posture via DemoDataBanner and explicit file-level sample-fixture notes | Full App | OS Core | mock-labeled | Static-data risk; proof gap | Recovery`
- `scope sealed`: 2026-03-29 co-founder discovery ruling
- `exact host`: `frontend/apps/os-shell/src/pages/admin/UserAdmin.tsx`

### Runtime State

Closed.

Why:
- the page already renders `DemoDataBanner` unconditionally
- the file header already states that `INITIAL_USERS` and `AUDIT_LOG` are in-memory sample fixtures
- reopening this as a runtime card would send Copilot after stale control-plane memory rather than current runtime truth

---

## Card 50E - Desktop Shell Proof Seal

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Recovery`
- `source rows`:
  - Readiness ledger: `Desktop shell / StageZero | OS | Active/Canonical | idle scene uses real hooks but county-status and Recent Work panels may claim live-ness when returning empty/fixture data; DemoDataBanner imported but condition unclear | Home Scene | OS | real | Proof gap | Recovery`
- `scope sealed`: 2026-03-29 co-founder discovery ruling
- `scope boundary`: `StageZeroState.tsx` (idle scene) only; `DesktopShell.tsx` and launcher routing surfaces are explicitly out of scope (covered by 45D, which remains HOLD)
- `explicitly out of scope`:
  - `DesktopShell.tsx`
  - `ModuleLauncher.tsx`
  - `moduleComponents.tsx`
  - any hook, store, or activation service file

### Execution Status

`SERIAL-CLEAR`

Why:
- [2026-03-29-cp-55-shell-hot-surface-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-55-shell-hot-surface-seal.md) sealed `StageZeroState.tsx` as the sole write surface
- the card remains separate from launcher-dialect work in `45D`
- implementation work already exists in branch history at `51c59c0c0`; the remaining task is bounded proof verification and closeout

### Allowed File

- `frontend/apps/os-shell/src/shell/desktop/StageZeroState.tsx`

### Execution Rule

Issue this card only as a single-owner serial sidecar. Do not widen beyond `StageZeroState.tsx`, and do not treat CP-55 as authorization for any launcher or registry file.

---

## Hold Inventory

### Card 45D - Shell Launcher Truth-Dialect Reconciliation

- `execution_status`: `HOLD`
- `hold_type`: `ARCHITECTURAL-RISK-HOLD` — this is not an ordinary file-scope gap
- `hold_reason`: shared launcher/config surfaces (`DesktopShell.tsx`, `ModuleLauncher.tsx`, `moduleComponents.tsx`) are OS-owned high-blast-radius shell infrastructure; any change to launcher routing or module registration has full-shell impact; this card requires explicit architectural-risk authorization, not just file-path sealing
- `authorized_by`: co-founder ruling 2026-03-29 — must remain HOLD until explicit architectural-risk authorization is granted in a separate governance decision
- `do not normalize`: do not treat this as an ordinary parallel-pack card; do not silently seal it with a file list without the risk authorization

### Card 50B - Monitoring Simulation Framing

- `execution_status`: `NO-OP`
- `ruling`: co-founder ruling 2026-03-29 — the existing page-level framing on `Monitoring.tsx` line 18 ("Workspace simulation of swarm telemetry and control patterns, not live county agent telemetry") already satisfies the card intent
- `condition`: do not widen scope to `AISwarmDashboard` or any child surface unless a contradictory claim is later proven in a child component
- `close_action`: mark closed / no-op; no runtime execution required

## Multi-Agent Parallel Recommendation

When Copilot executes remaining work in multi-agent or sub-agent mode:

1. finish Wave 0 first
2. run `45A` alone as the serial shared-surface card
3. use Parallel Pool A for the next multi-agent pass
4. split only by the card boundaries already defined here
5. do not issue any Hold card until its exact write scope is sealed in docs first

## Paste-Ready Copilot Meta-Handoff

```txt
Use the master remaining card plan only after Phase 44A and 44B are complete.

Issue order:
1. Phase 45A alone
2. Then choose any disjoint subset from the current parallel-clear pool:
   - Phase 45B
   - Phase 45C
   - Phase 46A
   - Phase 46B1
   - Phase 46B2
   - Phase 46B3
   - Phase 46C
   - Phase 47A
   - Phase 47B
   - Phase 48A
   - Phase 49A
   - Phase 49B
   - Phase 50A
   - Phase 50C
3. `50E` may be issued as a single-owner serial sidecar on `StageZeroState.tsx`.
4. `45D` remains on hold until its architectural-risk condition is cleared.
5. `50B` is closed as no-op; `50D` is already satisfied. Do not execute either.

Sub-agent rule:
- one parent card owns the slice
- sub-agents may split only within that card's Allowed Files
- if a change needs a file outside Allowed Files, stop and report
```
