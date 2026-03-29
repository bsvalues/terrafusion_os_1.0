# Control-Plane Doc Integrity and App Readiness Audit

**Date**: 2026-03-28  
**Scope**: March 28 control-plane stack plus adjacent planning docs and current shell/runtime evidence  
**Authority**: Founder-directed deep-dive audit, docs lane only  
**Lane**: Codex-safe control-plane documentation only

## Status Update

Since the first pass of this audit:

- Phase 34 and Phase 35 stale matrix links have been repointed to the March 28 catalog matrix.
- The March 28 matrix now carries `Readiness Grade` and `Defect Class`.
- The grouped workbench row has been split into separate Clerk, Treasury, Audit, and Pilot rows.
- Launch-gap and sample-fiction defects are now recorded directly in the matrix, registry, and backlog.
- Phase 40 execution wording has been normalized to current Copilot-owned execution.
- The March 19 and March 20 roadmap specs now explicitly defer to the March 28 stack for current demo-canon decisions.
- The broader `docs/superpowers/artifacts/cp19/` packet still exists and remains valid as historical launch evidence; only the living control-plane inventory moved to `catalog/`.
- `terra-cert` and `terra-notice` have been verified on 2026-03-28 as queued-canon surfaces, not active launch gaps.
- `terra-flow` has been verified on 2026-03-28 as queued-canon in the active launch path; the speculative `QuantumCommandCenter` renderer remains in-tree but is dormant.
- Claude-only archaeology findings that survived repo verification have been harvested into [2026-03-28-claude-archaeology-harvest.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-claude-archaeology-harvest.md) without importing its stale readiness tables.
- The March 28 matrix and launch registry have now been collapsed into a label-locked readiness ledger at [2026-03-28-surface-readiness-ledger.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-surface-readiness-ledger.md).

The findings below should therefore be read as a mix of:

- resolved first-pass defects kept for audit history
- remaining open control-plane drift
- current runtime honesty risks that still belong to Copilot-owned execution work

## Purpose

This audit answers two questions:

1. Are the planning docs internally consistent enough to act as a trustworthy control plane?
2. App by app and module by module, is the visible surface actually ready for client-demo use?

This document does not open execution work. It records control-plane contradictions, launch gaps, and readiness truth so Copilot-owned execution can target the right rows.

## Readiness Rubric

| Grade | Meaning | Demo posture |
|---|---|---|
| `R3 Ready-now` | Real launcher, real renderer, no fixture/sample fiction, honesty posture already acceptable | Safe to keep in `must-be-live` |
| `R2 Conditional-live` | Real surface exists and has real flows, but proof is partial or some sections remain static/fallback | Needs proof and/or disclosure cleanup before blessing |
| `R1 Queued-safe` | Not ready, but already honestly framed as queued/unavailable and safe to keep visible | Safe only if launcher and copy remain explicitly non-live |
| `R0 Not-demo-safe` | Placeholder host, broken launcher, sample-fiction, or misleading live posture | Must be redesigned, hidden, or downgraded before demo use |

## Executive Findings

1. The March 28 control plane is materially stronger than the first pass: stale matrix links are fixed, readiness grades are folded in, and grouped workbench rows are split.
2. The runtime metadata still uses an older status dialect in `frontend/apps/os-shell/src/config/suiteRegistry.ts` (`live | wip | planned`) while the March 28 canon uses `live | queued | unavailable`.
3. Older roadmap/spec docs remain useful as historical strategy, but the March 19/20 ledgers now explicitly defer current demo-canon decisions to the March 28 stack.
4. Some suite-home cards still target module IDs that do not resolve in the module renderer at all.
5. The highest-risk surfaces are not placeholders. They are real renderers that still present sample or simulated data with live-looking chrome.

## Control-Plane Integrity Findings

| Severity | Finding | Evidence | Control-plane correction |
|---|---|---|---|
| `P0` | Phase 34 and Phase 35 pointed at an obsolete living surface-matrix path under `artifacts/cp19` | `docs/superpowers/plans/2026-03-27-phase34-copilot-lanes.md`, `docs/superpowers/plans/2026-03-27-phase35-parallel-stub-elimination.md` | Resolved on 2026-03-28 by repointing both ledgers to `docs/superpowers/catalog/2026-03-28-full-ecosystem-demo-surface-matrix.md`; the broader `cp19` artifact bundle remains valid historical evidence |
| `P0` | Status vocabulary drift remains between planning canon and runtime metadata | `docs/superpowers/specs/2026-03-28-full-ecosystem-demo-gui-canon-design.md`, `frontend/apps/os-shell/src/config/suiteRegistry.ts` | Record a reconciliation task: launcher/status metadata must map to `live | queued | unavailable` before final demo proof |
| `P1` | Matrix row granularity was too coarse for workbench tabs | First-pass matrix grouped `Clerk / Treasury / Audit / Pilot tabs` into one row, but real tab implementations exist in `PropertyClerk.tsx`, `PropertyTreasury.tsx`, `PropertyAudit.tsx`, `PropertyPilot.tsx` | Resolved on 2026-03-28 by splitting the grouped row into separate matrix entries |
| `P1` | Launch registry and audit drifted behind runtime queued-canon fixes | `frontend/apps/os-shell/src/config/moduleComponents.tsx`, `docs/superpowers/catalog/2026-03-28-full-ecosystem-demo-launch-registry.md` | Resolved on 2026-03-28 by reclassifying `terra-cert`, `terra-notice`, and `terra-flow` to their current queued-canon launch posture |
| `P1` | Older roadmap/spec docs still presented stronger go-live language than the March 28 audit stack | `docs/superpowers/specs/2026-03-19-full-ecosystem-go-live-roadmap-design.md`, `docs/superpowers/specs/2026-03-20-unified-phase-map-19-30-design.md` | Resolved on 2026-03-28 by adding explicit historical-strategy notes and deferring current demo-canon decisions to the March 28 stack |
| `P2` | The first-pass matrix mixed “truth state” and “demo tier” without recording sample-fiction, fallback, or launch-broken nuance | Multiple runtime patterns below | Resolved on 2026-03-28 by adding `Readiness Grade` and `Defect Class` to the matrix and registry |
| `P2` | Phase 35 and Phase 40 carried historical parallel-lane wording under a control plane that now treats Copilot as the sole execution owner | `docs/superpowers/plans/2026-03-27-phase35-parallel-stub-elimination.md`, `docs/superpowers/plans/2026-03-28-phase40-banner-sweep-final-and-suite-home-canon.md`, `docs/superpowers/plans/2026-03-27-phase34-copilot-lanes.md` | Resolved on 2026-03-28 by clarifying both ledgers as historical/parallel stream decomposition under current Copilot-owned execution |

## Launch and Honesty Risk Findings

| Severity | Finding | Evidence | Impact |
|---|---|---|---|
| `P0` | `CostForge` launches a real component that is still a mock analytics dashboard with simulated counters and mock chart data | `frontend/apps/os-shell/src/components/costforge/CostForgeQuantumDashboard.tsx` | Looks live but is not county-runtime truth |
| `P0` | `TerraLevy` contains hardcoded sample levy/budget data while rendering a visible `Live` badge in the module chrome | `frontend/apps/os-shell/src/applications/terra-levy/TerraLevyDashboard.tsx` | Strongest honesty violation in the standalone set |
| `P0` | `User Admin` is fully sample-data-driven | `frontend/apps/os-shell/src/pages/admin/UserAdmin.tsx` | Cannot be treated as live admin readiness |
| `P1` | `TerraFlow` still has a speculative historical renderer in-tree, even though the active launch path now resolves to queued canon | `frontend/apps/os-shell/src/components/terra-flow/QuantumCommandCenter.tsx`, `frontend/apps/os-shell/src/config/moduleComponents.tsx` | Not an active launch-path defect anymore, but easy to misread during future archaeology |
| `P1` | Several standalone modules are honest only through fixture banners, not through the March 28 queued/unavailable canon | `StatisticsStudio.tsx`, `BatchCostRun.tsx`, `CoefficientPreview.tsx`, `GeoEquityDashboard.tsx`, `MassAppraisalGIS.tsx`, `CostManual.tsx`, `ValueAuditModule.tsx`, `TerraQueue.tsx`, `ManagementDashboard.tsx` | Safe only if explicitly reclassified and visually normalized |

## App and Module Readiness Ledger

### Suite Homes and Workspace Hosts

| Surface | Current grade | Why | Recommended control-plane action |
|---|---|---|---|
| Forge suite home | `R2 Conditional-live` | Real suite host, real county stats hook, source disclosure when snapshot/fixtures are active | Keep `must-be-live`, require screenshot/proof only |
| Atlas suite home | `R2 Conditional-live` | Real suite host, queued labeling already present for standalone Atlas apps | Keep `must-be-live`, retain queued labeling until standalone Atlas apps are proven |
| Dais suite home | `R2 Conditional-live` | Real suite host, county-provider fallback disclosure exists, standalone card truth is mixed | Keep `must-be-live`, fix card-level launch/readiness mismatches |
| Dossier suite home | `R2 Conditional-live` | Real suite host, queued labeling present for some system tools, parcel tools route correctly | Keep `must-be-live`, keep standalone system tools out of live claims |
| GPT workspace host | `R3 Ready-now` | `/gpt` explicitly separates live management/RAG from queued future slices | Preserve current pattern as canon reference |
| Canon home / IDS workspace family | `R2 Conditional-live` | Real bounded workspace exists, but workspace family still mixes mature IDE shell with incomplete or sample-oriented slices | Split Canon into sub-surfaces instead of treating it as one readiness claim |

### Property Workbench Tabs

| Surface | Current grade | Why | Recommended control-plane action |
|---|---|---|---|
| Summary tab | `R3 Ready-now` | Truth disclosure already built around source states | Keep `must-be-live` |
| Forge tab | `R3 Ready-now` | Parcel-first framing plus disclosure patterns are already present | Keep `must-be-live` |
| Atlas tab | `R3 Ready-now` | PACS/fallback/unavailable disclosure logic is explicit | Keep `must-be-live` |
| Dais tab | `R3 Ready-now` | Governed-tool flows and source badges are already established | Keep `must-be-live` |
| Dossier tab | `R2 Conditional-live` | Real dossier APIs, evidence snapshot, chain, and packet surfaces exist; proof status is behind the implementation reality | Split it out of the generic queued bucket and track proof separately |
| Clerk tab | `R2 Conditional-live` | Real governed-tool MWUX exists with correlation-friendly invocation flows | Give it its own matrix row instead of burying it in a grouped queued row |
| Treasury tab | `R2 Conditional-live` | Real governed-tool MWUX exists for tax statement, payment, delinquency, and tax-sale flows | Same as Clerk: separate matrix row and proof obligation |
| Audit tab | `R2 Conditional-live` | Real governed-tool MWUX exists for roll summary, compliance, findings, and reconciliation | Same as Clerk: separate matrix row and proof obligation |
| Pilot tab | `R2 Conditional-live` | Real manifest-backed read-only tool surface plus trace rail exists | Separate matrix row; do not keep grouped with unrelated tabs |

### Forge Standalone Modules

| Surface | Current grade | Why | Recommended control-plane action |
|---|---|---|---|
| CostForge | `R0 Not-demo-safe` | Launches `CostForgeQuantumDashboard`, which is mock analytics with simulated counters and no county-runtime truth | Remove from `must-be-live` until it points at a real valuation surface |
| Statistics Studio | `R1 Queued-safe` | Real renderer, but fixture banner still active | Keep visible only as queued until fixture path is removed |
| Batch Cost Runs | `R1 Queued-safe` | Real renderer, but sample/fallback banner remains | Keep queued or redesign; do not bless as live |
| Regression Studio | `R2 Conditional-live` | Real renderer and store-driven UX exist, but proof and data provenance are not yet established | Keep as secondary/conditional, not live-critical |
| TerraGAMA | `R1 Queued-safe` | Placeholder host in module renderer, already conceptually roadmap material | Keep queued only |
| Coefficient Preview | `R1 Queued-safe` | Real renderer, fixture banner remains | Keep queued only |
| Cost Manual | `R0 Not-demo-safe` | Standalone module still exposes sample-reference fallback but is not truth-labeled queued at suite-home level | Add queued state or remove from live launch set |
| Value Audit Log | `R0 Not-demo-safe` | Real module, but empty-state banner still acts as demo-data disclosure while the suite-home card reads like a live tool | Add explicit queued/conditional labeling before demo use |

### Atlas Standalone Modules

| Surface | Current grade | Why | Recommended control-plane action |
|---|---|---|---|
| TerraGIS Pro | `R1 Queued-safe` | Placeholder host, suite home already labels it queued | Keep queued only |
| Geo Equity | `R1 Queued-safe` | Real renderer, fixture banner present, suite home already labels it queued | Keep queued until runtime truth is proven |
| Appraisal GIS | `R1 Queued-safe` | Real renderer with demo-parcel fallback and banner, suite home already labels it queued | Keep queued until live/fallback semantics are formally proven |

### Dais Standalone Modules

| Surface | Current grade | Why | Recommended control-plane action |
|---|---|---|---|
| TerraLevy | `R0 Not-demo-safe` | Uses sample levy and budget arrays while displaying a `Live` badge in the module header | Remove from live posture immediately or rewrite disclosure |
| TerraPILT | `R1 Queued-safe` | Placeholder host and correctly queued in suite home | Keep queued only |
| TerraPermit | `R1 Queued-safe` | Placeholder host and correctly queued in suite home | Keep queued only |
| VEI | `R1 Queued-safe` | Placeholder host and correctly queued in suite home | Keep queued only |
| PropertyTax AI | `R1 Queued-safe` | Placeholder host and correctly queued in suite home | Keep queued only |
| Management Dashboard | `R2 Conditional-live` | Real renderer, source badges exist, but fixture fallback still exists | Keep `must-be-live` only if proof sweep removes residual fixture ambiguity |
| TerraQueue | `R0 Not-demo-safe` | Real renderer, fixture banner still active, but suite-home card is not explicitly queued | Either relabel queued or finish live zero-state wiring |
| TerraCert | `R1 Queued-safe` | Visible suite-home card now resolves to `QueuedModuleSurface` | Keep queued only; do not reopen crash or launch-gap work |
| TerraNotice | `R1 Queued-safe` | Visible suite-home card now resolves to `QueuedModuleSurface` | Keep queued only; do not reopen crash or launch-gap work |

### Dossier Standalone Modules

| Surface | Current grade | Why | Recommended control-plane action |
|---|---|---|---|
| PACS DataBridge | `R1 Queued-safe` | Placeholder host and already queued in suite home | Keep queued only |
| TerraSync | `R1 Queued-safe` | Placeholder host and already queued in suite home | Keep queued only |
| TerraFlow | `R1 Queued-safe` | Active launch path is now queued canon even though the historical `QuantumCommandCenter` renderer still exists in-tree | Keep queued; do not reopen the old renderer without explicit new proof |

### GPT Bounded Workspace Slices

| Surface | Current grade | Why | Recommended control-plane action |
|---|---|---|---|
| GPT Management | `R3 Ready-now` | Live inside `/gpt` and already treated as canonical live slice | Keep `must-be-live` |
| RAG Datasets | `R3 Ready-now` | Live inside `/gpt` and already treated as canonical live slice | Keep `must-be-live` |
| GPT Studio | `R1 Queued-safe` | Explicitly queued in workspace nav and panel copy | Keep queued |
| GPT Marketplace | `R1 Queued-safe` | Explicitly queued in workspace nav and panel copy | Keep queued |
| GPT Builder | `R1 Queued-safe` | Explicitly queued in workspace nav and panel copy | Keep queued |
| GPT Analytics | `R1 Queued-safe` | Explicitly queued in workspace nav and panel copy | Keep queued |

### Governance, Admin, and OS Surfaces

| Surface | Current grade | Why | Recommended control-plane action |
|---|---|---|---|
| Monitoring | `R1 Queued-safe` | Explicitly disclosed as workspace simulation, not live county telemetry | Keep visible only with simulation framing |
| Governance Dashboard | `R2 Conditional-live` | Real fetch path and role-gated dashboard exist, but not canon-audited and not on the main client path | Keep conditional until demo-path decision is explicit |
| Admin Dashboard | `R2 Conditional-live` | Some live KPI wiring exists through `useParcelCount`, but multiple panels still use static arrays | Downgrade from assumed-live posture to conditional-live until static panels are addressed |
| User Admin | `R0 Not-demo-safe` | Entirely sample-data-driven | Remove from live admin claims |
| Pilot Home | `R2 Conditional-live` | Real standalone host exists with Pilot console content | Track separately from Governance Dashboard |
| Trace Home | `R2 Conditional-live` | Real standalone telemetry workspace exists | Track separately from Monitoring simulation |
| Canon home | `R2 Conditional-live` | Real bounded workspace host, but workspace family should be split into core IDE versus future collaboration slices | Do not treat as one binary readiness claim |

## Matrix Corrections Recommended Immediately

1. Split the grouped workbench row `Clerk / Treasury / Audit / Pilot tabs` into four rows.
2. Split `Canon home and IDS workspace family` into:
   - core IDE shell
   - import/sync workspace slices
   - collaboration/Codex-dependent slices
3. Reclassify `Dossier tab` from generic queued treatment to `R2 Conditional-live`.
4. Mark `CostForge`, `TerraLevy`, `TerraQueue`, and `User Admin` as the current highest-priority active honesty surfaces.
5. Keep `terra-flow`, `terra-cert`, and `terra-notice` in queued canon and treat any older launch-gap/sample-fiction audit text for them as historical drift, not current execution truth.
6. Keep GPT Management and RAG Datasets as the only clean `R3` reference model for bounded workspaces.

## Safe Next Moves for the Control Plane

1. Reconcile stale document links first so the planning stack points to the same artifacts.
2. Add a `readiness grade` column to the matrix or keep this ledger as the required companion artifact.
3. Split grouped rows before any new “must-be-live” claims are accepted.
4. Require every standalone module to declare one of three launcher postures:
   - live and proven
   - queued and intentionally non-live
   - disabled because the launch path is not real
5. Treat sample-fiction renderers as a higher severity than placeholders, because they mislead more effectively.

## Bottom Line

The March 28 control plane found the right problem, but it is still too optimistic at app level.

The biggest risk is not the obvious placeholder. It is the real-looking module that still runs on sample or simulated truth while the planning layer calls it a live candidate. This ledger should be treated as the correction layer before more demo-readiness claims are sealed.
