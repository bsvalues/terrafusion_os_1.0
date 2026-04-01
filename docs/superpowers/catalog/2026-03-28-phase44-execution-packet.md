# Phase 44 Execution Packet

**Date**: 2026-03-28  
**Purpose**: Single execution-ready packet for the current Copilot runtime slice  
**Lane**:
- Codex: docs/control-plane only
- Copilot: bounded runtime execution only
- Claude Code: audit/reference only

## Packet Rule

This packet is the current runtime handoff for Phase 44.

Do not give Copilot:

- the archaeology pile
- the QUARANTINE sweep
- stale CostForge or TerraFlow cards
- GPT placeholder cleanup
- Clerk, Treasury, or Audit detours

Copilot executes one card only.

## Authority Snapshot

| card | surface | canonical status | readiness label | source rows | explicitly out of scope |
|---|---|---|---|---|---|
| `44A` | TerraLevy | `Active/Canonical` | `Quarantine` | Matrix: `Dais | TerraLevy`; Launch registry: `terra-levy`; Ledger: `TerraLevy | Dais | Active/Canonical | ... | Quarantine` | TerraQueue, Management Dashboard, TerraCert, TerraNotice, GPT family, Clerk/Treasury/Audit, matrix reinterpretation, archaeology |
| `44B` | TerraQueue | `Planned` under TerraDais | `Quarantine` | Matrix: `Dais | TerraQueue`; Launch registry: `terra-queue`; Ledger: `TerraQueue | Dais | Planned | ... | Quarantine` | TerraLevy, Management Dashboard, queue backend work, GPT family, Clerk/Treasury/Audit, matrix reinterpretation, archaeology |

## Global Do Not Do

Do not touch:

- [PropertyWorkbench.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\pages\workbench\PropertyWorkbench.tsx)
- [moduleComponents.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\config\moduleComponents.tsx)
- `QueuedModuleSurface.tsx`
- any file that defines or exports `WorkbenchTabSlug`
- any GPT-family runtime files
- any Clerk, Treasury, or Audit runtime files
- any QUARANTINE, backup, or dead-shell paths
- any docs under `docs/superpowers/**`

Do not:

- invent runtime fixes
- search for alternate implementations
- widen scope beyond the selected card
- relabel readiness inside runtime code
- mutate Dais, Forge, Dossier, or OS ownership rules

## Card 44A

### Slice

`Phase 44A — TerraLevy sample-fiction honesty correction`

### Exact source rows

#### Matrix row

`Dais | TerraLevy | standalone-window | county | assisted | live | R0 Not-demo-safe | sample-fiction | If sample arrays remain, show explicit sample posture and never pair them with a live badge or live suite-card posture | levy services | Renderer exists, but sample levy/budget arrays remain and module chrome still presents a live badge | must-be-live | Demo realization`

#### Launch-registry facts

- `terra-levy` resolves to a real component renderer
- `terra-levy` is listed under renderer-backed surfaces with honesty defects as `sample-fiction`
- `terra-levy` remains a Dais standalone card

#### Readiness-ledger row

`TerraLevy | Dais | Active/Canonical | Real renderer exists, but sample levy and budget arrays still sit under a live-looking header posture | Full App | Dais | silently fake | Sample-fiction honesty violation | Quarantine | Copilot-only Phase 44A card remains the right fix`

### Allowed Files

- `frontend/apps/os-shell/src/applications/terra-levy/TerraLevyDashboard.tsx`
- `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx`

### Forbidden Files

- `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx`
- `frontend/apps/os-shell/src/config/moduleComponents.tsx`
- `QueuedModuleSurface.tsx`
- any file that defines or exports `WorkbenchTabSlug`
- any `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyClerk*`
- any `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyTreasury*`
- any `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAudit*`
- any GPT-family runtime file
- any QUARANTINE, backup, or dead-shell path
- any file outside the two allowed files

### Required Changes

1. Make sample/demo disclosure unambiguous in `TerraLevyDashboard.tsx` while sample arrays remain the active source.
2. Remove or replace the live-looking status badge so sample truth never appears live.
3. In `DaisSuiteHome.tsx`, set the `terra-levy` card posture to queued unless the same slice makes the renderer runtime-backed.

### Do Not Do

- do not search for a better TerraLevy implementation
- do not touch TerraQueue or Management Dashboard
- do not touch TerraCert or TerraNotice
- do not touch any GPT surface
- do not touch Clerk, Treasury, or Audit
- do not reinterpret matrix rows inside runtime code
- do not do archaeology or backup sweeps

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only the two allowed files change, TerraLevy no longer pairs sample data with live-looking posture, and `pnpm run type-check` exits `0`.

### Paste-Ready Handoff

```txt
Execute Phase 44A only.

Authority inputs:
- Matrix row: Dais | TerraLevy | standalone-window | county | assisted | live | R0 Not-demo-safe | sample-fiction
- Launch registry facts:
  - terra-levy resolves to a real component renderer
  - terra-levy is listed as sample-fiction
  - terra-levy remains a Dais standalone card
- Readiness ledger row:
  - TerraLevy | Dais | Active/Canonical | ... | Quarantine

Allowed files:
- frontend/apps/os-shell/src/applications/terra-levy/TerraLevyDashboard.tsx
- frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx

Hard limits:
- one card only
- no PropertyWorkbench.tsx
- no moduleComponents.tsx
- no QueuedModuleSurface.tsx
- no WorkbenchTabSlug work
- no GPT family work
- no Clerk/Treasury/Audit work
- no archaeology, dead-shell, or backup search
- no widening beyond TerraLevy

Proof gate:
- pnpm run type-check
```

## Card 44B

### Slice

`Phase 44B — TerraQueue fixture-risk posture correction`

### Exact source rows

#### Matrix row

`Dais | TerraQueue | standalone-window | county | assisted | live | R0 Not-demo-safe | fixture-risk | Real queue or explicit unavailable/zero-state; no fixture banner | /api/dais/queue | Phase 35 open; fixture banner still active while card posture reads operational | must-be-live | Demo realization`

#### Launch-registry facts

- `terra-queue` resolves to a real component renderer
- `terra-queue` is listed under renderer-backed surfaces with honesty defects as `fixture-risk`
- `terra-queue` remains a Dais standalone card

#### Readiness-ledger row

`TerraQueue | Dais | Planned | Real renderer exists, but fixture-backed posture still reads operational from the suite card | Full App | Dais | silently fake | Fixture risk with live-looking suite posture | Quarantine | Copilot-only Phase 44B card remains the right fix`

### Allowed Files

- `frontend/apps/os-shell/src/pages/dais/TerraQueue.tsx`
- `frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx`

### Forbidden Files

- `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx`
- `frontend/apps/os-shell/src/config/moduleComponents.tsx`
- `QueuedModuleSurface.tsx`
- any file that defines or exports `WorkbenchTabSlug`
- any `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyClerk*`
- any `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyTreasury*`
- any `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAudit*`
- any GPT-family runtime file
- any QUARANTINE, backup, or dead-shell path
- any file outside the two allowed files

### Required Changes

1. In `DaisSuiteHome.tsx`, set `terra-queue` card posture to queued unless the same slice makes the renderer runtime-backed.
2. In `TerraQueue.tsx`, keep fixture/sample disclosure unmistakable if fixture data remains active.
3. Do not widen this slice into queue backend implementation or Management Dashboard work.

### Do Not Do

- do not touch TerraLevy
- do not touch Management Dashboard
- do not touch queue backend endpoints or stores
- do not touch any GPT surface
- do not touch Clerk, Treasury, or Audit
- do not reinterpret matrix rows inside runtime code
- do not do archaeology or backup sweeps

### Proof Gates

```bash
pnpm run type-check
```

### Stop Condition

Only the two allowed files change, TerraQueue no longer presents a live-looking suite posture while fixture-backed, and `pnpm run type-check` exits `0`.

### Paste-Ready Handoff

```txt
Execute Phase 44B only.

Authority inputs:
- Matrix row: Dais | TerraQueue | standalone-window | county | assisted | live | R0 Not-demo-safe | fixture-risk
- Launch registry facts:
  - terra-queue resolves to a real component renderer
  - terra-queue is listed as fixture-risk
  - terra-queue remains a Dais standalone card
- Readiness ledger row:
  - TerraQueue | Dais | Planned | ... | Quarantine

Allowed files:
- frontend/apps/os-shell/src/pages/dais/TerraQueue.tsx
- frontend/apps/os-shell/src/pages/suites/DaisSuiteHome.tsx

Hard limits:
- one card only
- no PropertyWorkbench.tsx
- no moduleComponents.tsx
- no QueuedModuleSurface.tsx
- no WorkbenchTabSlug work
- no GPT family work
- no Clerk/Treasury/Audit work
- no archaeology, dead-shell, or backup search
- no widening beyond TerraQueue

Proof gate:
- pnpm run type-check
```
