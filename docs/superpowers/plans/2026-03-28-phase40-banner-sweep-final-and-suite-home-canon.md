# Phase 40 — Final Banner Sweep + Suite-Home Archetype Start

**Date**: 2026-03-28  
**Branch**: `feat/pacs-ef-adapter` (or `fix/workbench-loading-aria` if already merged)  
**Execution mode**: Historical parallel stream decomposition under current Copilot-owned execution  
**Parent plan**: [2026-03-28-full-ecosystem-design-audit-and-realization.md](./2026-03-28-full-ecosystem-design-audit-and-realization.md)  
**Surface matrix**: [2026-03-28-full-ecosystem-demo-surface-matrix.md](../catalog/2026-03-28-full-ecosystem-demo-surface-matrix.md)  
**Tranche backlog**: [2026-03-28-full-ecosystem-demo-tranche-backlog.md](../catalog/2026-03-28-full-ecosystem-demo-tranche-backlog.md)

**Current lane rule**: This execution plan remains Copilot-owned for runtime/frontend/backend work. Codex is confined to control-plane docs updates only.

**Verification update (2026-03-28)**: `TerraLevyDashboard.tsx` already gates `DemoDataBanner` on `isSampleData` in the current tree. Treat Stream A1 below as historical phase context, not an open Copilot task.

---

## Context (what phase 39 left open)

Phases 37–39 cleared 8 DEMO DATA banners in the Forge/Atlas/Dais suite surfaces.
This phase originally tracked three remaining banners. In the current tree, the TerraLevy item is already closed, so only the other banner items should be treated as open without new runtime verification.

| Surface | File | Banner trigger | Root cause |
|---------|------|---------------|------------|
| **TerraLevy** | `applications/terra-levy/TerraLevyDashboard.tsx` | **closed in current tree** | `DemoDataBanner` is already gated on `isSampleData`; keep as historical record only |
| **AI Swarm Monitoring** | `components/dashboard/AISwarmDashboard.tsx` L697 | **unconditional** — always shown | `<DemoDataBanner>` rendered with no guard; no endpoint probe |
| **Segment Discovery** | `pages/forge/calibration/SegmentDiscoveryDashboard.tsx` L66 | `isFixture` state — needs endpoint | `GET /api/massappraisal/segments` may not be returning real data |

Additionally, `GovernmentAIStatus.tsx` shows a banner when `dataSource !== 'BACKEND'`.
This is intentionally conditional and depends on `TerraFusionEliteAPI` — treat as read-only unless a quick cap exists.

---

## Phase 40 Scope

### Stream A — Banner fixes (three independent surfaces, fully parallel)

Each stream targets a single file pair (frontend component + optional backend controller).
Zero overlap → safe to run all three simultaneously.

---

#### A1 — TerraLevy banner fix (Historical / closed in current tree)

**Owner**: Copilot  
**Files touched**:
- `frontend/apps/os-shell/src/applications/terra-levy/TerraLevyDashboard.tsx`
- `backend/src/TerraFusion.API/Controllers/LevyController.cs` (if it exists, add stub routes; if not, add stub to ForgeController or create minimal file)

**Current verification**:
`TerraLevyDashboard.tsx` already contains:

```tsx
{isSampleData && <DemoDataBanner module="TerraLevy" />}
```

Do not dispatch this stream again unless a fresh runtime check proves the banner behavior regressed.

**Historical problem statement**:
```tsx
// Line 179 — ALWAYS renders, no condition
<DemoDataBanner module="TerraLevy" />
```
`useBudgetData` from `./hooks/useBudgetData` already has `isSampleData` state.
`isSampleData` starts `true` and clears when `/api/levy/dashboard/summary` OR
`/api/levy/budget/scenarios` OR `/api/levy/budget/visualization` returns category arrays.

**Fix — two changes**:

1. In `TerraLevyDashboard.tsx`:
   - Import `useBudgetData` (or confirm it is already imported)
   - Destructure `isSampleData` from the hook call 
   - Change line 179 from `<DemoDataBanner module="TerraLevy" />` to `{isSampleData && <DemoDataBanner module="TerraLevy" />}`

2. In backend (LevyController or new stub):
   - Add `GET api/levy/dashboard/summary` → `Ok(Array.Empty<object>())` with `[AllowAnonymous]`
   - Returning empty array is honest (no levy runs in dev) and clears `isSampleData` because `categories.length === 0` actually re-sets `isSampleData = true` — **check the logic**
   
   > ⚠️ **Critical**: `useBudgetData` sets `isSampleData = false` only when `categories.length > 0`. An empty array from the endpoint still leaves `isSampleData = true`. So the backend fix alone won't clear it. Options:
   > - Return a stub levy category object (1 item) instead of `[]`, so `categories.length > 0`
   > - OR make the frontend check "did the endpoint respond 200" instead of "did I get categories > 0"

   **Correct fix**: Return a stub `BudgetCategory` array with 1 placeholder item from `GET /api/levy/dashboard/summary`.
   The `BudgetCategory` type is in `frontend/apps/os-shell/src/applications/terra-levy/types/BudgetTypes.ts` — read it first to match the shape.

**Acceptance**: `<DemoDataBanner module="TerraLevy" />` no longer renders when the page loads (endpoint returns stub category → `isSampleData = false`).

---

#### A2 — AI Swarm Monitoring banner fix

**Owner**: Copilot  
**Files touched**:
- `frontend/apps/os-shell/src/components/dashboard/AISwarmDashboard.tsx`

**Problem**:
```tsx
// Line 697 — ALWAYS renders
<DemoDataBanner module='AI Swarm Monitoring' className='mb-4' />
```
No state condition. The component uses `swarmStatus` data (likely from `useSwarmStatus` or similar).

**Fix**:
1. Find what hook or state drives the swarm data. Check whether there's an `isSimulated`, `isSampleData`, or `dataSource` field returned from the swarm data hook.
2. If a fixture/sample flag exists: wrap the banner render with that condition.
3. If NO flag exists: check whether swarm fetches from a real endpoint. If the endpoint returns data, add an `isFixture` state that starts `true` and clears when the endpoint responds 200.

> Read lines 1–100 of `AISwarmDashboard.tsx` first to see imports and hook usage before implementing.

**Acceptance**: Banner no longer visible when AI swarm data loads successfully (or is appropriately conditioned rather than unconditional).

---

#### A3 — Segment Discovery banner audit

**Owner**: Copilot  
**Files touched**:
- `frontend/apps/os-shell/src/pages/forge/calibration/SegmentDiscoveryDashboard.tsx`
- `backend/src/TerraFusion.API/Controllers/MassAppraisalController.cs` (if segments endpoint is missing or returning wrong shape)

**Problem**:
```tsx
// Line 66
{isFixture && <DemoDataBanner module="Segment Discovery" />}
```
`isFixture` is conditional — good. Need to identify what endpoint drives it and whether that endpoint already exists and returns real data.

**Fix path**:
1. Read `SegmentDiscoveryDashboard.tsx` lines 1–80 to find what hook drives `isFixture`.
2. Check if `GET /api/massappraisal/segments` (or `DiscoverSegments` endpoint) exists in `MassAppraisalController.cs`.
3. Phase 37 added `[AllowAnonymous]` on read endpoints and `return Ok(empty)` on catch. Verify the segments endpoint is reached and returns data that satisfies `isFixture = false`.
4. If the endpoint returns empty and the component treats empty as fixture: add one stub segment object to the response.

**Acceptance**: `<DemoDataBanner module="Segment Discovery" />` does not render when the component loads.

---

### Stream B — TerraQueue honesty fix (sequential after A streams, or parallel if A3 is quick)

**Owner**: Copilot  
**Priority**: `must-be-live` per surface matrix  
**Files touched**:
- `frontend/apps/os-shell/src/pages/dais/TerraQueue.tsx` (or wherever TerraQueue lives — check module registry)
- `backend/src/TerraFusion.API/Controllers/DaisController.cs`

**Problem** (from surface matrix):
> "Real queue or explicit unavailable/zero-state; no fixture banner — Phase 35 open"

TerraQueue uses `GET /api/dais/queue` or similar. If there is a fixture banner, it needs to be conditioned or the endpoint needs to return a valid empty state.

**Fix**:
1. Find TerraQueue component — `git grep -r "TerraQueue\|terra-queue" frontend/apps/os-shell/src/pages`.
2. Read it to find the fixture condition and endpoint.
3. Check `DaisController.cs` for the queue list endpoint.
4. Either add an empty-array stub or ensure the component treats `[]` (empty queue) and a 200 response as "live" (not fixture).

**Acceptance**: TerraQueue loads without a fixture/demo banner. Either zero-state or real items visible.

---

### Stream C — Gates + commit

**Sequential after A1 + A2 + A3 + B are applied.**

```bash
# 1. Type-check
pnpm run type-check      # must exit 0

# 2. Build
dotnet build TerraFusion.sln -v q --nologo      # must show 0 Error(s)

# 3. Curl probes
curl http://localhost:5000/api/levy/dashboard/summary   # 200 + [{...}]
# TerraLevy banner: should be gone after mount
# AISwarm banner: should be gone after mount
# SegmentDiscovery banner: should be gone after mount
# TerraQueue: should show zero-state cleanly

# 4. Commit
git add <changed files>
git commit -m "fix(phase40): final banner sweep + TerraQueue zero-state

- TerraLevyDashboard: condition DemoDataBanner on isSampleData from useBudgetData
- LevyController (stub): GET api/levy/dashboard/summary returns 1 stub BudgetCategory
- AISwarmDashboard: wrap DemoDataBanner in fixture condition (not unconditional)
- SegmentDiscoveryDashboard: confirm isFixture clears via segments endpoint stub
- TerraQueue: ensure empty queue = zero-state not fixture banner

Evidence:
- Tests: pnpm type-check → exit 0; dotnet build → 0 Error(s)
- Gates: all banner probes 200 with data

Government: FISMA compliance
AI-Collaboration: GitHub Copilot"

# 5. Push + PR update
git push origin <branch>
```

---

## Parallel Execution Map

```
t=0 ─────────────────────────────────────────────────────────
 Copilot A1       │ Copilot A2         │ Copilot A3
 TerraLevy banner │ AISwarm banner     │ SegmentDiscovery
 (frontend + levy │ (frontend only)    │ (frontend + endpoint)
  stub endpoint)  │                   │
─────────────────────────────────────────────────────────────
t=A_done ────────────────────────────────────────────────────
 Copilot B: TerraQueue zero-state fix (single lane)
─────────────────────────────────────────────────────────────
t=B_done ────────────────────────────────────────────────────
 Copilot C: Gates + commit + push (sequential)
─────────────────────────────────────────────────────────────
```

**Agent isolation**: A1/A2/A3 touch non-overlapping files → safe to parallelize.
B touches DaisController (different section from Phase 38 changes) → safe after A.
C is always sequential.

---

## Pre-implementation reads (do these before any edits)

Run in parallel before starting A1/A2/A3:

| Read | Purpose |
|------|---------|
| `TerraLevyDashboard.tsx` lines 1–30 | confirm useBudgetData import and hook call location |
| `BudgetTypes.ts` full | get `BudgetCategory` shape for stub payload |
| `AISwarmDashboard.tsx` lines 1–100 | find hook, find fixture flag or lack thereof |
| `SegmentDiscoveryDashboard.tsx` lines 1–80 | find `isFixture` state origin |
| `MassAppraisalController.cs` grep for `segments\|DiscoverSegments` | confirm endpoint exists + shape |
| `DaisController.cs` grep for `queue` routes | confirm queue list endpoint and shape |

---

## What this phase does NOT touch

- `fix/workbench-loading-aria` branch (PR #706 — already open, do not disturb)
- `os-platform/**` (frozen governance scope)
- `specialized/**`, `applications/**` outside shell (forbidden per AGENTS.md)
- Visual system / suite-home archetype work (Tranche 1) — that is Phase 41

---

## Phase 41 preview (next after Phase 40 closes)

From tranche backlog Slice 1B (Suite-home archetype normalization):
- Forge suite home: add standard header, KPI band, module hierarchy, source disclosure
- Atlas suite home: same pattern  
- Dais suite home: same pattern
- Dossier suite home: same pattern

These are visual + layout work — no backend stubs needed. Safe for Copilot ownership.

---

## Required gates (must pass before commit)

| Gate | Command | Pass condition |
|------|---------|---------------|
| TypeScript | `pnpm run type-check` | exit 0 |
| Backend build | `dotnet build TerraFusion.sln -v q` | 0 Error(s) |
| Honesty contract | `pnpm --filter os-shell run test` | no new failures |
| Module consistency | `pnpm --filter os-shell run test -- moduleRegistryConsistency` | 9/9 pass |

---

## Commit format

```
fix(phase40): [short subject 72 chars max]

[body — what changed and why, one change per bullet]

Evidence:
- Tests: [results]
- Gates: [passed/failed]
- Probes: [curl results]

Government: FISMA compliance
AI-Collaboration: GitHub Copilot
```
