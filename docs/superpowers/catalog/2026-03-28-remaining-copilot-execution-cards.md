# Remaining Copilot Execution Cards

**Date**: 2026-03-28  
**Purpose**: define the remaining post-Phase-44 Copilot cards as a bounded multi-agent packet, without reopening stale work or widening scope  
**Status**: supersedes the earlier broad candidate-order draft; this is the current Phase 45 parallel packet  
**Lane**:
- Codex: docs/control-plane only
- Copilot: bounded runtime execution only
- multi-agent/sub-agent mode: allowed only inside a selected card and only within that card's allowed files

For the full post-44 card inventory beyond this immediate packet, use [2026-03-28-master-remaining-copilot-card-plan.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-master-remaining-copilot-card-plan.md).

## Preconditions

These cards are downstream of the current sealed runtime queue:

1. `44A` TerraLevy is complete
2. `44B` TerraQueue is complete

## Authority Stack

Issue or execute the remaining cards only from this stack:

1. [2026-03-28-phase44-execution-packet.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-phase44-execution-packet.md)
2. [2026-03-28-full-ecosystem-demo-surface-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-surface-matrix.md)
3. [2026-03-28-full-ecosystem-demo-launch-registry.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-launch-registry.md)
4. [2026-03-28-surface-readiness-ledger.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-surface-readiness-ledger.md)
5. [2026-03-28-full-ecosystem-demo-tranche-backlog.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-tranche-backlog.md)

## Execution Status Legend

- `SERIAL-CLEAR`: the card is bounded enough to issue after Phase 44, but it must run alone because it touches a shared config or launch surface
- `PARALLEL-CLEAR`: the card is bounded enough to issue after Phase 44 and may run in parallel with another `PARALLEL-CLEAR` card if the write sets are disjoint
- `HOLD`: the card is useful as a control-plane definition, but it is not execution-ready yet because file proof or scope control is still incomplete

## Parallel Execution Map

| Card | Family | Execution Status | Parallel Mode | Reason |
| --- | --- | --- | --- | --- |
| `45A` GPT dual-truth placeholder-conflict alignment | GPT | `SERIAL-CLEAR` | Parent card only | touches shared module-registration surface |
| `45B` Canon mixed-family gating | Canon | `PARALLEL-CLEAR` | Parent card plus sub-agents only within `CanonHome.tsx` | one-file visible-truth split |
| `45C` Pilot/Trace standalone posture alignment | Governance | `PARALLEL-CLEAR` | Parent card plus one child if parent owns integration | exact Pilot and Trace host files are now sealed |
| `45D` Shell launcher truth-dialect reconciliation | OS shell | `HOLD` | none | shared launcher/config surfaces are too hot for blind parallel issue |

## Global Out Of Scope

These remain forbidden across all remaining cards:

- `PropertyWorkbench.tsx`
- `QueuedModuleSurface.tsx`
- any file defining or exporting `WorkbenchTabSlug`
- Clerk, Treasury, Audit, Recorder, and other reserved vertical work
- GPT Studio, Marketplace, Builder, Analytics, or other queued GPT breadth unless the selected card names them explicitly
- backup, dead-shell, ARCHIVE, or QUARANTINE archaeology
- control-plane doc edits during runtime execution
- matrix reinterpretation inside runtime files
- backend, migrations, routes, or runtime config not explicitly listed in the selected card

## Card 45A - GPT Dual-Truth Placeholder-Conflict Alignment

### Authority Snapshot

- `canonical_status`: `Active/Canonical` for `GPT Management` and `RAG Datasets`; `Planned` for `GPT Studio`, `Marketplace`, `Builder`, and `Analytics`
- `readiness_label`: the live bounded workspace slices are `Ready`, but the module-launch posture still has a dual-truth conflict
- `source rows`:
  - Matrix: `GPT | GPT Management | bounded-workspace | county | native-ai | live | R3 Ready-now`
  - Matrix: `GPT | RAG Datasets | bounded-workspace | county | native-ai | live | R3 Ready-now`
  - Matrix: `GPT | GPT Studio / Marketplace / Builder / Analytics | bounded-workspace | county | native-ai | queued | R1 Queued-safe`
  - Launch registry: `/gpt` hosts the live bounded workspace while `gpt-management` and `gpt-rag` still appear as placeholder shell entries in module-launch posture
  - Readiness ledger: `GPT Management` and `RAG Datasets` are ready references; the breadth GPT family remains planned/queued
- `explicitly out of scope`:
  - widening the `/gpt` bounded-workspace host
  - changing queued GPT breadth into live scope
  - new GPT routes or unrelated GPT implementation work

### Execution Status

`SERIAL-CLEAR`

Why:
- the problem is bounded and real
- the likely fix path touches a shared module-registration surface
- it should not run beside another launcher/registry card

### Allowed Files

- `frontend/apps/os-shell/src/config/moduleComponents.tsx`
- `frontend/apps/os-shell/src/pages/suites/GptSuiteHome.tsx`

### Forbidden Files

- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- `frontend/apps/os-shell/src/pages/PropertyWorkbench.tsx`
- `frontend/apps/os-shell/src/components/QueuedModuleSurface.tsx`
- any GPT breadth file not named above
- any route or host file not named above

### Required Changes

1. Align `gpt-management` and `gpt-rag` entry posture so the live bounded workspace truth is not contradicted by placeholder shell treatment.
2. Keep `GPT Studio`, `Marketplace`, `Builder`, and `Analytics` explicitly queued.
3. If the alignment cannot be completed within the two allowed files, stop and report instead of widening scope.

### Do Not Do

- do not widen into `/gpt` host restructuring
- do not touch non-GPT families
- do not reinterpret readiness labels inside runtime code
- do not reopen stale CostForge or TerraFlow work
- do not search for alternate implementations

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only the two allowed files change, `gpt-management` and `gpt-rag` no longer contradict the live bounded workspace truth, and queued GPT breadth remains queued.

### Paste-Ready Copilot Handoff

````md
# Copilot Execution Card

## Slice
Phase 45A - GPT dual-truth placeholder-conflict alignment

## Why
`GPT Management` and `RAG Datasets` are already real bounded-workspace slices, but module-launch posture still presents a placeholder conflict.

## Source of Truth
- Matrix row(s):
  - `GPT | GPT Management | bounded-workspace | county | native-ai | live | R3 Ready-now`
  - `GPT | RAG Datasets | bounded-workspace | county | native-ai | live | R3 Ready-now`
  - `GPT | GPT Studio / Marketplace / Builder / Analytics | bounded-workspace | county | native-ai | queued | R1 Queued-safe`
- Launch registry note(s):
  - `/gpt` is the live bounded workspace host
  - `gpt-management` and `gpt-rag` still carry placeholder-shell conflict in module-launch posture
- Readiness ledger row(s):
  - `GPT Management` = `Ready`
  - `RAG Datasets` = `Ready`
  - queued GPT breadth remains `Planned`

## Current State
- Canonical Status: `Active/Canonical` for management and RAG; `Planned` for GPT breadth
- Readiness Label: dual-truth conflict between bounded-workspace truth and placeholder module posture
- Truth posture now: live bounded workspace exists, but entry posture still conflicts

## Goal State
Entry posture for `gpt-management` and `gpt-rag` matches the live bounded workspace truth, while queued GPT breadth remains queued.

## Allowed Files
- `frontend/apps/os-shell/src/config/moduleComponents.tsx`
- `frontend/apps/os-shell/src/pages/suites/GptSuiteHome.tsx`

## Forbidden Files
- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- `frontend/apps/os-shell/src/pages/PropertyWorkbench.tsx`
- `frontend/apps/os-shell/src/components/QueuedModuleSurface.tsx`
- any GPT breadth file not named above
- any route or host file not named above

## Required Changes
1. Align `gpt-management` and `gpt-rag` entry posture so the live bounded workspace truth is not contradicted by placeholder-shell treatment.
2. Keep `GPT Studio`, `Marketplace`, `Builder`, and `Analytics` explicitly queued.
3. If the fix requires a third runtime file, stop and report instead of widening scope.

## Do Not Do
- do not widen into `/gpt` host restructuring
- do not touch non-GPT families
- do not reinterpret readiness labels inside runtime code
- do not search for alternate implementations

## Proof Gates
```bash
pnpm run type-check
```

## Stop Condition
Only the two allowed files change and the GPT entry posture no longer contradicts the live bounded workspace truth.
````

## Card 45B - Canon Mixed-Family Gating

### Authority Snapshot

- `canonical_status`: `Active/Canonical` for `Canon core IDE shell`; `Planned` for collaboration and Codex-dependent slices
- `readiness_label`: `Recovery` for core shell proof; `Planned` for collaboration/Codex breadth
- `source rows`:
  - Matrix: `Canon | Canon core IDE shell | bounded-workspace | system | assisted | live | R2 Conditional-live | mixed-family`
  - Matrix: `Canon | Canon collaboration / Codex-dependent slices | bounded-workspace | system | assisted | queued | R1 Queued-safe | mixed-family`
  - Launch registry: `/canon` is mounted as bounded workspace and desktop launch resolves through `activateModule('canon')` to `os-canon`
  - Readiness ledger: core IDE shell is real but mixed with unsealed collaboration claims; collaboration/Codex slices remain planned
- `explicitly out of scope`:
  - Codex runtime implementation
  - new Canon routes
  - broad collaboration enablement

### Execution Status

`PARALLEL-CLEAR`

Why:
- current control-plane evidence points to a one-file visible-truth split
- the card is presentation/gating work, not shell-registry work
- it can run beside another `PARALLEL-CLEAR` card only if write sets stay disjoint

### Allowed Files

- `frontend/apps/os-shell/src/pages/CanonHome.tsx`

### Forbidden Files

- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- any Codex, collaboration, or shared shell config file not named above

### Required Changes

1. Split Canon core IDE shell truth from collaboration/Codex-dependent slices in the visible page posture.
2. Keep collaboration/Codex-dependent slices explicitly queued or planned.
3. If the change requires child component edits outside `CanonHome.tsx`, stop and report instead of widening scope.

### Do Not Do

- do not open Codex runtime work
- do not widen into collaboration implementation
- do not modify launcher behavior
- do not edit docs

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only `CanonHome.tsx` changes and the page clearly separates live core IDE truth from queued collaboration/Codex breadth.

### Paste-Ready Copilot Handoff

````md
# Copilot Execution Card

## Slice
Phase 45B - Canon mixed-family gating

## Why
`Canon` currently mixes a real core IDE shell with unsealed collaboration/Codex-dependent breadth in one readiness claim.

## Source of Truth
- Matrix row(s):
  - `Canon | Canon core IDE shell | bounded-workspace | system | assisted | live | R2 Conditional-live | mixed-family`
  - `Canon | Canon collaboration / Codex-dependent slices | bounded-workspace | system | assisted | queued | R1 Queued-safe | mixed-family`
- Launch registry note(s):
  - `/canon` is the bounded workspace host
  - desktop launch resolves through `activateModule('canon')` to `os-canon`
- Readiness ledger row(s):
  - `Canon core IDE shell` = `Recovery`
  - `Canon collaboration / Codex-dependent slices` = `Planned`

## Current State
- Canonical Status: core shell is `Active/Canonical`; collaboration/Codex slices are `Planned`
- Readiness Label: mixed-family recovery state
- Truth posture now: one page still risks blending live core truth with planned collaboration breadth

## Goal State
Canon visibly separates live core IDE truth from queued collaboration/Codex breadth.

## Allowed Files
- `frontend/apps/os-shell/src/pages/CanonHome.tsx`

## Forbidden Files
- any file outside Allowed Files
- `docs/superpowers/**`
- `backend/**`
- any Codex, collaboration, or shared shell config file not named above

## Required Changes
1. Split core IDE truth from collaboration/Codex-dependent slices in the visible page posture.
2. Keep collaboration/Codex slices explicitly queued or planned.
3. If the change requires child component edits outside `CanonHome.tsx`, stop and report instead of widening scope.

## Do Not Do
- do not open Codex runtime work
- do not widen into collaboration implementation
- do not modify launcher behavior

## Proof Gates
```bash
pnpm run type-check
```

## Stop Condition
Only `CanonHome.tsx` changes and the page clearly separates live core IDE truth from queued collaboration/Codex breadth.
````

## Card 45C - Pilot/Trace Standalone Posture Alignment

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Recovery`
- `source rows`:
  - Matrix: `Governance | Pilot Home / Pilot Console | governance-surface | system | native-ai | queued | R2 Conditional-live | proof-gap`
  - Matrix: `Governance | Trace Home | governance-surface | system | native-ai | queued | R2 Conditional-live | proof-gap`
  - Launch registry: `/pilot` and `/trace` are mounted governance-surface routes and desktop launches resolve to real components
  - Readiness ledger: both are OS-owned standalone features with proof gaps, not suite-owned apps
- `explicitly out of scope`:
  - changing OS ownership
  - suite-home adoption
  - backend telemetry or pilot execution plumbing

### Execution Status

`PARALLEL-CLEAR`

Why:
- the exact page hosts are now sealed
- the write set is disjoint from the other current parallel-safe cards
- the card stays bounded to standalone posture and does not widen into services or shell config

### Allowed Files

- `frontend/apps/os-shell/src/pages/PilotHome.tsx`
- `frontend/apps/os-shell/src/pages/TraceHome.tsx`

### Required Changes

1. Add explicit posture disclosure to `PilotHome.tsx` so architecture claims do not read as broader runtime proof than the current surface supports.
2. Add explicit fixture or proof-boundary disclosure to `TraceHome.tsx` where telemetry is not guaranteed to be live county truth.
3. Do not change any service, API, hook, or ownership file.

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only `PilotHome.tsx` and `TraceHome.tsx` change and both surfaces exit their current undisclosed-posture state.

## Card 45D - Shell Launcher Truth-Dialect Reconciliation

### Authority Snapshot

- `canonical_status`: `Active/Canonical`
- `readiness_label`: `Recovery`
- `source rows`:
  - Matrix: `OS | Desktop icon launches | suite-home | system | non-ai | live | R2 Conditional-live | proof-gap`
  - Launch registry: shell delivery is `activateModule(...)` / `openWorkbenchWindow(...)` first, but `suiteRegistry.ts` still carries the older `live | wip | planned` dialect
  - Readiness ledger: launcher metadata still drifts from the March 28 truth dialect
- `explicitly out of scope`:
  - new launch surfaces
  - route rewrites
  - broad shell redesign

### Execution Status

`HOLD`

Why:
- the likely write set is known, but it touches shared launcher/config surfaces
- that work should not be issued in blind parallel mode while other launch or registry cards are active

### Candidate Allowed Files Once Cleared

- `frontend/apps/os-shell/src/config/suiteRegistry.ts`
- `frontend/apps/os-shell/src/config/desktopManifest.ts`
- `frontend/apps/os-shell/src/shell/desktop/DesktopIconGrid.tsx`

### Hold Condition

Do not issue this card until there is an explicit hot-file window for shared shell config surfaces.

## Multi-Agent Execution Rule

When Copilot executes one of these cards in multi-agent or sub-agent mode:

1. one card owns the parent slice
2. sub-agents may split only within the Allowed Files of that card
3. sub-agents may not claim adjacent surfaces, neighboring suites, or queued breadth not named in the card
4. `SERIAL-CLEAR` cards do not run beside any other runtime card
5. `PARALLEL-CLEAR` cards may run together only if the write sets are disjoint before execution begins
6. `HOLD` cards are not issuable runtime work; they are control-plane definitions only

## Current Parallel Recommendation

Issue only after `44A` and `44B` are done:

1. `45A` may run next, but only as a serial shared-config card
2. `45B` and `45C` are the cleanest first parallel-safe follow-on cards
3. `45D` stays on hold pending a hot-file window for launcher/config surfaces

## Paste-Ready Copilot Meta-Handoff

```txt
Use only one selected Phase 45 card from the remaining-cards packet.

Rules:
- execute one card only unless two cards are explicitly marked PARALLEL-CLEAR and their write sets are disjoint
- use only the Allowed Files named in the selected card
- do not widen into PropertyWorkbench, QueuedModuleSurface, WorkbenchTabSlug, GPT breadth, reserved verticals, or archaeology
- do not edit docs during runtime execution
- if a required change spills outside the Allowed Files, stop and report instead of widening scope

Current issue order:
1. finish Phase 44A and 44B
2. issue 45A as serial work or 45B as the cleanest parallel-safe next card
3. issue `45B` and/or `45C` only if their write sets stay disjoint
4. do not issue `45D` until its hold condition is cleared
```
