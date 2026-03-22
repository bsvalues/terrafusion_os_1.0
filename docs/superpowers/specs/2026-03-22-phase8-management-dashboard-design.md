# Phase 8 — Management Dashboard & Morning Briefing Strip
## Design Spec

**Date:** 2026-03-22
**Phase:** 8
**Status:** Approved
**Scope:** Wire `ManagementDashboard.tsx` to live endpoints + add `MorningBriefingStrip` as persistent top surface on the Dais home scene.

---

## Goals

1. Replace all fixture fallbacks in `ManagementDashboard.tsx` with real API calls.
2. Add `MorningBriefingStrip` — a persistent top strip showing county KPIs and assessor operational data, always visible when Dais opens.
3. Introduce a shared `FreshData<T>` freshness contract across all domain hooks.
4. Wire `useSwarmLive()` to the live Consciousness SignalR hub (port 3004), replacing the fixture-based `AISwarmDashboard`.

---

## Non-Goals (Phase 8)

- CertificationTab live wiring (Phase 9 scope)
- `useWorkloadSummary` calling `/api/dais/appraiser-productivity` (deferred to WorkloadTab drill-down)
- React Context for briefing state (YAGNI — only one consumer)
- Deleting `AISwarmDashboard.tsx` (deprecated in-file, removed in follow-on pass)
- E2E tests (deferred to Phase 9 when tab drill-through is live)

---

## Architecture

### Component Tree

```
DaisSuiteHome
└── ManagementDashboard          ← orchestration + single data owner
    ├── MorningBriefingStrip     ← presentational, receives FreshData props
    │   ├── SwarmStatusCard
    │   ├── PacsStatusCard
    │   ├── AppealsQueueCard
    │   └── WorkloadCard
    └── DashboardTabs
        ├── CertificationTab     ← Phase 9 scope (no change)
        ├── AppealsTab           ← receives appeals FreshData as prop
        └── WorkloadTab          ← receives workload FreshData as prop
```

**Key decisions:**
- `DaisSuiteHome` is already the Dais home scene. No routing change.
- `ManagementDashboard` calls all four domain hooks once and distributes results. No hook is called more than once.
- `MorningBriefingStrip` is purely presentational — no fetching, no hooks.
- Cards are dumb — each renders only its `FreshData<T>` slice.

---

## Freshness Contract

### `FreshData<T>` envelope

```ts
interface FreshData<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  lastUpdated: number | null   // epoch ms
  source: 'live' | 'polled' | 'fallback' | 'unavailable'
  isStale: boolean
}
```

**`source` semantics:**
- `live` — arrived via SignalR push
- `polled` — arrived via HTTP fetch within refresh window
- `fallback` — transport failed, showing last known good data
- `unavailable` — no data at all (first load failed, no cache)

**`isStale`** is computed independently per domain using its own stale threshold from `DAIS_REFRESH`. A `polled` result can be stale if polling stalled. A `fallback` result may or may not be stale.

### Envelope helpers (`freshData.ts`)

```ts
export const hasData     = <T>(f: FreshData<T>): boolean => f.data !== null
export const canRender   = <T>(f: FreshData<T>): boolean => hasData(f) || f.isLoading
export const isFresh     = <T>(f: FreshData<T>): boolean => !f.isStale && f.source !== 'unavailable'
export const showLiveBadge = (
  f: FreshData<unknown>,
  conn?: SwarmConnectionState
): boolean => f.source === 'live' && conn === 'connected' && !f.isStale
```

### Card render state matrix

| Condition | Renders |
|---|---|
| `isLoading && !hasData` | Skeleton placeholder |
| `hasData && !isStale` | Data + source badge |
| `hasData && isStale` | Data + "Stale" warning badge |
| `source === 'unavailable'` | "Unavailable" chip, no data |
| `source === 'fallback'` | Data + "Last known" label |

---

## Refresh Config

```ts
// config/daisRefresh.config.ts
export const DAIS_REFRESH = {
  appealsQueueMs:     45_000,
  appealsStaleAfterMs: 90_000,
  pacsStatusMs:       60_000,
  pacsStaleAfterMs:  180_000,
  workloadMs:        120_000,
  workloadStaleAfterMs: 300_000,
  swarmStaleAfterMs:  10_000,
} as const
```

No interval values are hardcoded inside hooks or components.

---

## Hook Contracts

### `useSwarmLive()` → `FreshData<SwarmStatus>`

```ts
interface SwarmStatus {
  connectionState: 'connecting' | 'connected' | 'degraded' | 'disconnected'
  totalAgents: number
  healthyAgents: number
  overallStatus: string
}
```

- Connects to Consciousness SignalR hub: `VITE_CONSCIOUSNESS_URL/hubs/swarm`
- On message: `source: 'live'`, stamps `lastUpdated`
- On disconnect with prior data: `source: 'fallback'`, `isStale: true`
- On first-load failure (never connected): `source: 'unavailable'`
- No HTTP fallback — swarm is SignalR-only. `polled` is never used.
- `isStale = Date.now() - lastUpdated > DAIS_REFRESH.swarmStaleAfterMs`

### `usePacsStatus()` → `FreshData<PacsHealth>`

```ts
interface PacsHealth {
  contractValid: boolean
  reachable: boolean
  latencyMs: number | null
  lastProofUtc: string | null
}
```

- Polls `GET /ops/pacs/proof` every `pacsStatusMs` (60s)
- Stale threshold: `pacsStaleAfterMs` (180s)
- Fallback: last known data shown with `source: 'fallback'` on poll failure

### `useAppealsQueue()` → `FreshData<AppealsQueueSummary>`

```ts
interface AppealsQueueSummary {
  total: number
  openCount: number
  pendingHearingCount: number
  closedThisCycleCount: number
}
```

- Polls `GET /api/dais/appeals` every `appealsQueueMs` (45s)
- Stale threshold: `appealsStaleAfterMs` (90s)

### `useWorkloadSummary()` → `FreshData<WorkloadSummary>`

```ts
interface WorkloadSummary {
  totalParcels: number
  parcelsReviewed: number
  parcelsRemaining: number
  appraisersActive: number
  utilizationPct: number | null
}
```

- Polls `GET /api/dais/queue` every `workloadMs` (120s)
- Stale threshold: `workloadStaleAfterMs` (300s)
- Does NOT call `/api/dais/appraiser-productivity` (deferred to WorkloadTab Phase 9)

---

## Component Contracts

### `MorningBriefingStrip`

```tsx
interface MorningBriefingStripProps {
  swarm:    FreshData<SwarmStatus>
  pacs:     FreshData<PacsHealth>
  appeals:  FreshData<AppealsQueueSummary>
  workload: FreshData<WorkloadSummary>
}
```

Four cards in a horizontal row. Each card receives only its slice. Cards are self-contained for render state but do no fetching.

### `ManagementDashboard`

```tsx
interface ManagementDashboardProps {
  onNavigate: (target: { type: 'area' | 'appeal' | 'appraiser'; id: string }) => void
}

export function ManagementDashboard({ onNavigate }) {
  const swarm    = useSwarmLive()
  const pacs     = usePacsStatus()
  const appeals  = useAppealsQueue()
  const workload = useWorkloadSummary()

  return (
    <div className="flex flex-col gap-4">
      <MorningBriefingStrip
        swarm={swarm} pacs={pacs}
        appeals={appeals} workload={workload}
      />
      <DashboardTabs
        appeals={appeals} workload={workload}
        onNavigate={onNavigate}
      />
    </div>
  )
}
```

---

## `AISwarmDashboard.tsx` Retirement

- Phase 8: `ManagementDashboard` stops importing it. `SwarmStatusCard` replaces its home-scene role.
- File is NOT deleted in Phase 8 — a `// @deprecated` JSDoc is added.
- Import/test/story cleanup is a follow-on pass after Phase 8.

---

## New Files

```
frontend/apps/os-shell/src/
  hooks/
    useSwarmLive.ts
    usePacsStatus.ts
    useAppealsQueue.ts
    useWorkloadSummary.ts
  config/
    daisRefresh.config.ts
  lib/
    freshData.ts
  components/dashboard/
    MorningBriefingStrip.tsx
    cards/
      SwarmStatusCard.tsx
      PacsStatusCard.tsx
      AppealsQueueCard.tsx
      WorkloadCard.tsx
```

**Modified:** `ManagementDashboard.tsx` (hook rewire + strip insertion).
**Unchanged:** `DaisSuiteHome.tsx`.

---

## Testing

| Target | Approach |
|---|---|
| Each domain hook | Unit test with mocked fetch/SignalR. Covers all `source` transitions and `isStale` firing at threshold. |
| `MorningBriefingStrip` | Component test with injected `FreshData` props. No transport mocking. Covers all card render states and mixed-state scenarios. |
| `ManagementDashboard` | Smoke test — hooks mocked at module boundary. Verifies strip + tabs receive correct props. No duplicate hook call assertions. |
| E2E | Deferred to Phase 9. |

### Key test cases for `useSwarmLive`

- `connected` → `isStale` fires after `swarmStaleAfterMs` with no new message
- Disconnect with prior data → `source: 'fallback'`, `isStale: true`
- Never connected → `source: 'unavailable'`
- Reconnect after disconnect → `source: 'live'`, `isStale` clears

---

## Implementation Sequence

**Step 1 (D first):** Wire real endpoints — `usePacsStatus`, `useAppealsQueue`, `useWorkloadSummary`, `freshData.ts`, `daisRefresh.config.ts`. Replace fixture calls in `ManagementDashboard`.

**Step 2 (C):** Add hybrid refresh — `useSwarmLive` with SignalR. Build `MorningBriefingStrip` + four cards. Insert strip into `ManagementDashboard`. Deprecate `AISwarmDashboard`.

**Step 3:** Tests for all hooks + strip component.
