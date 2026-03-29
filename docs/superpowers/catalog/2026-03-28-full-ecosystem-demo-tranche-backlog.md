# Full-Ecosystem Demo Tranche Backlog

**Date**: 2026-03-28  
**Purpose**: Convert the demo matrix into execution-ready slices that avoid cross-agent interference  
**Depends on**:
- [2026-03-28-full-ecosystem-design-audit-and-realization.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\plans\2026-03-28-full-ecosystem-design-audit-and-realization.md)
- [2026-03-28-full-ecosystem-demo-surface-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-surface-matrix.md)
- [2026-03-28-full-ecosystem-demo-launch-registry.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-launch-registry.md)
- [2026-03-28-control-plane-doc-integrity-and-app-readiness-audit.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-control-plane-doc-integrity-and-app-readiness-audit.md)
- [2026-03-28-copilot-execution-card-packet.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-copilot-execution-card-packet.md)

## Execution Rule

Each slice must:
- reference one or more matrix rows
- record the current `Readiness Grade` and any `Defect Class`
- name the surface family it touches
- preserve current agent isolation
- prove truth state after the change
- for Copilot-owned runtime work, be issued as a bounded execution card from the current card packet

## Tranche 0 — Control-Plane Normalization

### Slice 0A: Matrix readiness overlay

Targets:
- March 28 surface matrix
- grouped workbench rows
- mixed-family Canon rows

Definition of done:
- grouped workbench rows are split
- each row carries `Readiness Grade`
- each row carries any blocking `Defect Class`

### Slice 0B: Launch-gap and sample-fiction registry overlay

Targets:
- launch registry
- suite-home card maps
- module activation registry

Definition of done:
- `launch-gap` is tracked as a first-class defect
- `sample-fiction` surfaces are explicitly recorded as higher-risk than placeholders
- visible cards with no renderer coverage are named before new execution opens

### Slice 0C: Quarantine archaeology ledger

Targets:
- `QUARANTINE/top-level-dirs`
- `QUARANTINE/root-md`
- `QUARANTINE/root-artifacts`
- `QUARANTINE/frontend-dead-shell`

Definition of done:
- a read-only audit ledger exists
- a disposition matrix exists
- restore-candidate islands are separated from dead-shell and backup noise
- no runtime or repo-shape changes are made during the audit

## Tranche 1 — Visual System

### Slice 1A: Shell launch grammar

Targets:
- Desktop shell / StageZero
- Desktop icon launches
- Workbench launch entry

Definition of done:
- launch labels, status indicators, and icon semantics match actual route/window truth
- no icon implies a live surface that is only queued

### Slice 1B: Suite-home archetype normalization

Targets:
- Forge suite home
- Atlas suite home
- Dais suite home
- Dossier suite home
- GPT bounded workspace host

Definition of done:
- consistent header, KPI band, hierarchy, operational context, and disclosure grammar

### Slice 1C: Queued and unavailable state canon

Targets:
- all visible queued or unavailable surfaces

Definition of done:
- one intentional queued pattern
- one intentional unavailable pattern
- no faux-live KPI or chart pattern survives on queued surfaces

## Tranche 2 — Ecosystem Truth

### Slice 2A: Standalone module truth audit

Targets:
- Forge standalone modules
- Atlas standalone modules
- Dais standalone modules
- Dossier standalone modules

Definition of done:
- every standalone module classified as real component, placeholder host, or route-only concept
- every standalone module classified for `launch-gap`, `fixture-risk`, or `sample-fiction` where applicable
- every standalone module assigned `R0` through `R3`
- every module assigned `must-be-live`, `may-be-queued`, or `hide`

### Slice 2B: Workbench tab truth audit

Targets:
- Summary
- Forge
- Atlas
- Dais
- Dossier
- Clerk
- Treasury
- Audit
- Pilot

Definition of done:
- every tab has a declared truth state and demo obligation
- Clerk, Treasury, Audit, and Pilot are tracked as separate rows
- parcel-scoped workbench modules are not double-counted as standalone apps

### Slice 2C: Governance and admin truth audit

Targets:
- Governance Dashboard
- Monitoring
- Pilot home / console surfaces
- Trace
- Admin Dashboard
- User Admin

Definition of done:
- visible internal surfaces either align to canon or are removed from the client-demo path

## Tranche 3 — Demo Realization

### Slice 3A: Must-be-live suite homes

Targets:
- Forge
- Atlas
- Dais
- Dossier
- GPT

Priority:
- highest

Definition of done:
- all five are screenshot-ready and launch correctly from shell and/or window host

### Slice 3B: Must-be-live workbench path

Targets:
- Property Search
- Property Workbench shell
- Summary / Forge / Atlas / Dais / Dossier tabs

Priority:
- highest

Definition of done:
- full parcel-centered demo path is truthful and continuous

### Slice 3C: Must-be-live standalone modules

Targets:
- CostForge
- TerraLevy
- Statistics Studio
- Batch Cost Runs
- Appraisal GIS
- Geo Equity
- Management Dashboard
- TerraQueue
- Canon workspace family

Priority:
- high

Definition of done:
- each surface is either live and proven, or explicitly redesigned as queued/unavailable, or removed from the demo path
- `sample-fiction` surfaces are corrected before placeholder-only breadth is upgraded
- `launch-gap` surfaces are either disabled in the launcher or backed by a real registered target

### Slice 3D: May-be-queued surfaces

Targets:
- regression and specialist Forge modules
- PILT / Permit / PropertyTax AI / TerraSync / PACS bridge family
- TerraFlow / TerraCert / TerraNotice
- Clerk / Treasury / Audit / Pilot workbench surfaces when not demo-safe
- governance/internal utility pages not needed for the main client path

Priority:
- medium

Definition of done:
- visible breadth preserved only where queued state is honest and visually intentional

## Tranche 4 — Proof

### Slice 4A: Screenshot set by archetype

Required set:
- shell desktop
- each suite home
- workbench shell
- representative workbench tabs
- each must-be-live standalone module
- GPT bounded workspace
- Canon bounded workspace

### Slice 4B: Runtime proof sweep

Required checks:
- route launch
- desktop icon launch
- module activation launch
- no fixture banner on live surfaces
- queued and unavailable disclosure present where required

### Slice 4C: Honesty proof sweep

Required checks:
- no overstated “live” claims
- no fake KPI cards on queued surfaces
- no charts or counts presented as current if they are placeholder-only

## Safe Sequencing

To avoid interfering with concurrent coding lanes:

1. Update only docs and backlog artifacts while active agents are working on runtime/frontend files.
2. Open implementation slices one surface family at a time.
3. Keep shell, suite-home, workbench, and standalone-module edits disjoint when parallelizing.
4. Treat UI token files and runtime-generated artifacts as shared hot surfaces and avoid mixing them with planning-only changes.
5. Codex remains in the docs lane for matrix, registry, backlog, and readiness bookkeeping; acting on runtime fixes remains Copilot-only.

## First Recommended Execution Order

1. Matrix readiness overlay + launch-gap registry normalization
2. Shell launch grammar
3. Suite-home archetype normalization
4. Workbench path truth audit
5. Standalone module truth audit
6. Must-be-live standalone realization
7. Governance/admin client-demo path decision
8. Proof sweep and screenshot set
