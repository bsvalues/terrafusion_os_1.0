# Copilot Execution Card Packet

**Date**: 2026-03-28  
**Purpose**: Convert the March 28 control plane into bounded Copilot-only runtime cards  
**Lane rule**:
- Codex stays in docs/control-plane artifacts only
- Copilot gets execution cards only
- every card must point to matrix rows, registry facts, and a bounded file list

**Companion**:
- [2026-03-28-phase44-card-companion.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-phase44-card-companion.md)
- [2026-03-28-phase44-execution-packet.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-phase44-execution-packet.md)
- [2026-03-28-remaining-copilot-execution-cards.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-remaining-copilot-execution-cards.md)
- [2026-03-28-master-remaining-copilot-card-plan.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-master-remaining-copilot-card-plan.md)
- [2026-03-28-exhaustive-remaining-card-atlas.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-exhaustive-remaining-card-atlas.md)

The remaining-cards packet is the current Phase 45 parallel packet. It defines which post-44 cards are `SERIAL-CLEAR`, `PARALLEL-CLEAR`, or still on `HOLD`.
The master remaining card plan extends that packet into the full post-44 execution map.
The exhaustive remaining-card atlas maps every non-ready March 28 surface to `EXECUTION-CARD`, `HOLD-CARD`, `NO-CARD-KEEP-QUEUED`, or `NO-CARD-ABSORBED`.
Execution prep artifacts now live in:
- [2026-03-28-hot-file-collision-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-hot-file-collision-matrix.md)
- [2026-03-28-hold-card-unlock-ledger.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-hold-card-unlock-ledger.md)
- [2026-03-28-execution-scoreboard.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-execution-scoreboard.md)
March 29 Codex planning artifacts now live in:
- [2026-03-29-next-codex-phase-program.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\plans\2026-03-29-next-codex-phase-program.md)
- [2026-03-29-codex-phase-board.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-codex-phase-board.md)
March 29 Codex prep artifacts now also include:
- [2026-03-29-cp-54-governance-admin-host-proof-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-54-governance-admin-host-proof-seal.md)
- [2026-03-29-46b-repacketization-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-46b-repacketization-seal.md)
- [2026-03-29-cp-56-parent-sub-agent-split-packs.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-56-parent-sub-agent-split-packs.md)
- [2026-03-29-cp-57-evidence-and-handoff-packetization.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-57-evidence-and-handoff-packetization.md)
- [2026-03-29-cp-59-no-card-canon-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-59-no-card-canon-seal.md)
- [2026-03-29-cp-60-control-plane-link-alias-hygiene.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-60-control-plane-link-alias-hygiene.md)
- [2026-03-29-cp-61-ownership-boundary-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-61-ownership-boundary-seal.md)
- [2026-03-29-cp-55-shell-hot-surface-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-55-shell-hot-surface-seal.md)

## Verified Current State

These facts were rechecked before this packet was written:

1. **Phase 42 remote publication is already complete**
   - local branch: `feat/queued-unavailable-canon`
   - remote branch: `origin/feat/queued-unavailable-canon`
   - commit `0386813f7` is already on the remote branch
   - conclusion: the old “push verification” card is closed and should not be reopened

2. **The old CostForge/TerraFlow Phase 43 card is already stale**
   - `CostForgeQuantumDashboard.tsx` already imports and renders `DemoDataBanner`
   - `DossierSuiteHome.tsx` already marks `terra-flow` as `truthState: 'queued'`
   - `moduleComponents.tsx` already routes `terra-flow` to `QueuedModuleSurface`
   - commit `ca4bad29c` exists in history as the Phase 43 honesty slice
   - conclusion: do not reissue the old CostForge/TerraFlow card

3. **Do not reopen `terra-cert` / `terra-notice` launch-gap work**
   - both now resolve to `QueuedModuleSurface` in `moduleComponents.tsx`
   - they remain queued breadth surfaces, not crash bugs

## Card Template

````md
# Copilot Execution Card

## Slice
[tranche / phase / slice name]

## Why
[one-sentence purpose]

## Source of Truth
- Matrix row(s): [exact row names]
- Launch registry note(s): [exact launcher/renderer fact]
- Backlog slice: [exact slice]

## Current State
- Readiness Grade: [R0 / R1 / R2 / R3]
- Defect Class: [launch-gap / sample-fiction / fixture-risk / placeholder-host / proof-gap / static-data / simulation / mixed-family]
- Truth posture now: [launcher wired / renderer present / queued-safe / live-looking / not demo-safe]

## Goal State
[what should be true when done]

## Allowed Files
- [exact path 1]
- [exact path 2]
- [exact path 3]

## Forbidden Files
- any file outside Allowed Files
- docs/superpowers/**
- backend/**
- shared hot files unless explicitly listed
- route/launcher/config files unless explicitly listed

## Required Changes
1. [bounded change]
2. [bounded change]
3. [bounded change]

## Do Not Do
- do not audit
- do not search for alternate implementations
- do not widen scope
- do not rename unrelated modules
- do not touch neighboring surfaces
- do not rewrite control-plane docs

## Proof Gates
```bash
[command 1]
[command 2]
```

## Expected Evidence
- [specific visible/UI proof]
- [specific test/build proof]

## Stop Condition
[exact done line]
````

## Closed Historical Cards

### Closed Card H1 — Phase 42 remote publication

Status:
- closed

Why closed:
- `origin/feat/queued-unavailable-canon` already exists
- `0386813f7` is already in the remote branch history

### Closed Card H2 — Phase 43 CostForge/TerraFlow honesty slice

Status:
- closed

Why closed:
- CostForge already shows `DemoDataBanner`
- `terra-flow` is already queued in both suite home and renderer mapping

## Current Guardrails

1. Do not open any new runtime task for `terra-cert` or `terra-notice` crash repair.
2. Do not open any new runtime task for `terra-flow` queued downgrade; that downgrade already landed.
3. If a card does not map to an exact matrix row, do not issue it.

## Open Card 1 — TerraLevy Sample-Fiction Honesty Correction

```md
# Copilot Execution Card

## Slice
Phase 44A — TerraLevy sample-fiction honesty correction

## Why
TerraLevy is still an active R0 standalone surface because it presents sample levy/budget data with a live-looking header posture.

## Source of Truth
- Matrix row(s): Dais → TerraLevy
- Launch registry note(s): `terra-levy` is a real renderer with `sample-fiction`
- Backlog slice: Tranche 3C Must-be-live standalone modules

## Current State
- Readiness Grade: R0
- Defect Class: sample-fiction
- Truth posture now: launcher wired, renderer present, live-looking, not demo-safe

## Goal State
TerraLevy no longer combines sample data with a live posture. The suite card and module chrome both tell the truth.

## Allowed Files
- `frontend/apps/os-shell/src/applications/terra-levy/TerraLevyDashboard.tsx`
- `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx`

## Forbidden Files
- any file outside Allowed Files
- docs/superpowers/**
- backend/**
- shared hot files unless explicitly listed
- route/launcher/config files unless explicitly listed

## Required Changes
1. In `TerraLevyDashboard.tsx`, make sample/demo disclosure unambiguous while sample arrays remain the active data source.
2. Remove or replace the current live-looking status badge so it cannot read as live county truth while sample data is shown.
3. In `DaisSuiteHome.tsx`, set `terra-levy` card posture to queued unless the renderer becomes runtime-backed in the same slice.

## Do Not Do
- do not search QUARANTINE for a fuller levy implementation
- do not touch `moduleComponents.tsx`
- do not touch TerraQueue, Management, TerraCert, or TerraNotice
- do not edit docs

## Proof Gates
```bash
pnpm run type-check
```

## Expected Evidence
- TerraLevy no longer shows a live badge beside sample data
- TerraLevy suite card is visibly queued if sample data remains
- type-check exits 0

## Stop Condition
Only the two allowed files change and TerraLevy exits the current live-looking sample-fiction posture.
```

## Open Card 2 — TerraQueue Queued-Posture Correction

```md
# Copilot Execution Card

## Slice
Phase 44B — TerraQueue fixture-risk posture correction

## Why
TerraQueue still reads like an operational live module even though the current renderer is fixture-backed.

## Source of Truth
- Matrix row(s): Dais → TerraQueue
- Launch registry note(s): `terra-queue` is a real renderer with `fixture-risk`
- Backlog slice: Tranche 3C Must-be-live standalone modules

## Current State
- Readiness Grade: R0
- Defect Class: fixture-risk
- Truth posture now: launcher wired, renderer present, live-looking suite card, not demo-safe

## Goal State
TerraQueue either reads as explicitly queued in suite posture or its fixture posture is made unambiguously non-live.

## Allowed Files
- `frontend/apps/os-shell/src/pages/dais/TerraQueue.tsx`
- `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx`

## Forbidden Files
- any file outside Allowed Files
- docs/superpowers/**
- backend/**
- shared hot files unless explicitly listed
- route/launcher/config files unless explicitly listed

## Required Changes
1. In `DaisSuiteHome.tsx`, set `terra-queue` card posture to queued unless the module becomes runtime-backed in the same slice.
2. In `TerraQueue.tsx`, keep fixture/sample disclosure unmistakable if fixture data remains active.
3. Do not widen this slice into Management Dashboard or queue backend work.

## Do Not Do
- do not touch `queueStore`
- do not touch backend queue endpoints
- do not widen into management-dashboard
- do not edit docs

## Proof Gates
```bash
pnpm run type-check
```

## Expected Evidence
- TerraQueue suite card is visibly queued if fixture data remains
- TerraQueue still discloses fixture truth in the module surface
- type-check exits 0

## Stop Condition
Only the two allowed files change and TerraQueue no longer presents a live-looking suite posture while still fixture-backed.
```
