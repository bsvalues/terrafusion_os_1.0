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
- New tabs added in future phases must receive data from `ManagementDashboard` props, not call their own hooks (preserves single-data-owner rule).

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
- `live` — arrived via SignalR push (swarm only)
- `polled` — arrived via HTTP fetch within refresh window (HTTP hooks only)
- `fallback` — transport failed, showing last known good data (any hook)
- `unavailable` — no data at all (first load failed, no cache)

**`isStale`** is computed independently per domain using its own stale threshold from `DAIS_REFRESH`:
- `isStale = Date.now() - lastUpdated > DAIS_REFRESH.<domain>StaleAfterMs`
- Computed against `lastUpdated` (the timestamp of last successful data receipt), not against the poll interval.
- A `polled` result can become stale if polling stalls. A `fallback` result is stale once its threshold elapses.

**Hook state on failure:**
- All three HTTP-polling hooks follow the same fallback pattern:
  - Poll success → `source: 'polled'`, stamp `lastUpdated`, clear `error`, `isLoading: false`
  - Poll failure with prior data → `source: 'fallback'`, keep `data`, set `error`, `isLoading: false`; `isStale` resolves naturally from `lastUpdated`
  - Poll failure with no prior data (first load) → `source: 'unavailable'`, `data: null`, set `error`, `isLoading: false`
- Hooks must set `isLoading: false` before setting `source: 'unavailable'` to avoid ambiguous render states.
- **Re-poll with prior data:** `isLoading` remains `false` during polling retries when `data !== null`. Only the initial fetch (no prior data) sets `isLoading: true`. This prevents skeleton flashing on refresh.
- **While in `source: 'fallback'`:** `isLoading` MUST remain `false`. Polling retry attempts do not set `isLoading: true` if prior data exists.

**`source: 'polled'` is never used by `useSwarmLive()`** — swarm is SignalR-only. If the hub never delivers data, the swarm goes directly to `'unavailable'`, not `'polled'`.

### Envelope helpers (`freshData.ts`)

```ts
export const hasData   = <T>(f: FreshData<T>): boolean => f.data !== null

// canRender: true when settled data is present and ready to display (not loading, not null)
// For skeleton vs empty-state branching: if (!hasData(f) && f.isLoading) → skeleton; if (source === 'unavailable') → empty chip
export const canRender = <T>(f: FreshData<T>): boolean => hasData(f) && !f.isLoading

// isFresh: used by cards to decide whether to show a "Stale" or "Last known" badge
// Note: source === 'fallback' with isStale === false returns isFresh === true (recent fallback data is still fresh)
// Call site: card source-badge rendering — show badge only when isFresh(f) is false
export const isFresh   = <T>(f: FreshData<T>): boolean => !f.isStale && f.source !== 'unavailable'

// showLiveBadge: SwarmStatusCard only — requires explicit connectionState
// HTTP-polling cards never have source === 'live', so conn can be omitted safely (returns false)
export const showLiveBadge = (
  f: FreshData<unknown>,
  conn?: SwarmConnectionState
): boolean => f.source === 'live' && conn === 'connected' && !f.isStale
```

**Card skeleton vs empty-state rule:**
- `isLoading && !hasData(f)` → render skeleton placeholder
- `source === 'unavailable'` → render "Unavailable" chip (takes precedence; `isLoading` must be `false` at this point)
- `canRender(f)` → render real content

### Card render state matrix (evaluation order matters — top wins)

| Priority | Condition | Renders |
|---|---|---|
| 1 | `source === 'unavailable'` | "Unavailable" chip, no data (`isLoading` is always `false` here) |
| 2 | `isLoading && !hasData` | Skeleton placeholder (initial fetch only) |
| 3 | `source === 'fallback' && !isLoading` | Data + "Last known" label (`isLoading` always `false` in fallback) |
| 4 | `hasData && isStale` | Data + "Stale" warning badge |
| 5 | `hasData && !isStale` | Data + source badge |

---

## Refresh Config

```ts
// config/daisRefresh.config.ts
// Note: no swarmIntervalMs — useSwarmLive() is push-driven, not polled.
// The no-hardcoded-interval rule applies to HTTP-polling hooks only.
export const DAIS_REFRESH = {
  appealsQueueMs:       45_000,
  appealsStaleAfterMs:  90_000,
  pacsStatusMs:         60_000,
  pacsStaleAfterMs:    180_000,
  workloadMs:          120_000,
  workloadStaleAfterMs: 300_000,
  swarmStaleAfterMs:    10_000,   // stale detection only, not poll interval
} as const
```

---

## Hook Contracts

### `useSwarmLive()` → `FreshData<SwarmStatus>`

```ts
type SwarmConnectionState = 'connecting' | 'connected' | 'degraded' | 'disconnected'

interface SwarmStatus {
  connectionState: SwarmConnectionState
  totalAgents: number
  healthyAgents: number
  overallStatus: string
}
```

- Connects to Consciousness SignalR hub: `VITE_CONSCIOUSNESS_URL/hubs/swarm`
- On message: `source: 'live'`, stamp `lastUpdated`, `isLoading: false`
- On disconnect with prior data: `source: 'fallback'`, reset `lastUpdated` to `null`, keep `data`; `isStale` resolves `true` immediately because `Date.now() - null` exceeds threshold
- On first-load failure (never connected): `source: 'unavailable'`, `data: null`, `isLoading: false`
- `polled` is never used — no HTTP fallback for swarm
- `isStale = lastUpdated === null || Date.now() - lastUpdated > DAIS_REFRESH.swarmStaleAfterMs`

### `usePacsStatus()` → `FreshData<PacsHealth>`

```ts
interface PacsHealth {
  contractValid: boolean
  reachable: boolean
  latencyMs: number | null
  lastProofUtc: string | null
}
```

- Polls `GET /ops/pacs/proof` every `DAIS_REFRESH.pacsStatusMs` (60s)
- Poll success → `source: 'polled'`, stamp `lastUpdated`
- Poll failure with prior data → `source: 'fallback'`, keep `data`, set `error`
- First-load failure → `source: 'unavailable'`, `data: null`, `isLoading: false`
- `isStale = Date.now() - lastUpdated > DAIS_REFRESH.pacsStaleAfterMs` (180s)

### `useAppealsQueue()` → `FreshData<AppealsQueueSummary>`

```ts
interface AppealsQueueSummary {
  total: number
  openCount: number
  pendingHearingCount: number
  closedThisCycleCount: number
}
```

- Polls `GET /api/dais/appeals` every `DAIS_REFRESH.appealsQueueMs` (45s)
- Poll success → `source: 'polled'`, stamp `lastUpdated`
- Poll failure with prior data → `source: 'fallback'`, keep `data`, set `error`
- First-load failure → `source: 'unavailable'`, `data: null`, `isLoading: false`
- `isStale = Date.now() - lastUpdated > DAIS_REFRESH.appealsStaleAfterMs` (90s)

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

- Polls `GET /api/dais/queue` every `DAIS_REFRESH.workloadMs` (120s)
- Poll success → `source: 'polled'`, stamp `lastUpdated`
- Poll failure with prior data → `source: 'fallback'`, keep `data`, set `error`
- First-load failure → `source: 'unavailable'`, `data: null`, `isLoading: false`
- `isStale = Date.now() - lastUpdated > DAIS_REFRESH.workloadStaleAfterMs` (300s)
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

### `DashboardTabs`

```tsx
interface DashboardTabsProps {
  appeals:    FreshData<AppealsQueueSummary>
  workload:   FreshData<WorkloadSummary>
  onNavigate: (target: { type: 'area' | 'appeal' | 'appraiser'; id: string }) => void
}
```

Phase 8 scope: `appeals` and `workload` only. Any future tab that needs additional data (including `swarm` or `pacs`) must extend `DashboardTabsProps` — tab components do not call their own hooks. This preserves the single-data-owner rule.

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
- File is NOT deleted in Phase 8 — a `/** @deprecated — replaced by SwarmStatusCard in MorningBriefingStrip */` JSDoc is added.
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
| HTTP polling hooks (`usePacsStatus`, `useAppealsQueue`, `useWorkloadSummary`) | Unit test with mocked fetch. Covers all three `source` transitions and `isStale` threshold. Tested after Step 1, before Step 2. |
| `useSwarmLive` | Unit test with mocked SignalR. Covers connection state machine and stale detection. Tested after Step 2. |
| `MorningBriefingStrip` | Component test with injected `FreshData` props. No transport mocking. Covers all card render states and mixed-state scenarios. Tested after Step 2. |
| `ManagementDashboard` | Smoke test — hooks mocked at module boundary. Verifies strip + tabs receive correct props. No duplicate hook call assertions. |
| E2E | Deferred to Phase 9. |

### Key test cases — HTTP polling hooks (all three share this pattern)

- First successful poll → `source: 'polled'`, `lastUpdated` stamped, `isLoading: false`
- Poll failure with prior data → `source: 'fallback'`, data preserved, `error` set, `isLoading: false`
- Poll failure with no prior data → `source: 'unavailable'`, `data: null`, `isLoading: false`
- `isStale` fires at domain threshold (e.g., 90s for appeals) with no successful poll
- Re-poll with prior data → `isLoading` remains `false` (no skeleton flash on refresh)

### Key test cases — `useSwarmLive`

- `connected` → `isStale` fires after `swarmStaleAfterMs` with no new message
- Disconnect with prior data → `source: 'fallback'`, `isStale: true`
- Never connected → `source: 'unavailable'`, `isLoading: false`
- Reconnect after disconnect → `source: 'live'`, `isStale` clears

### Key test cases — `MorningBriefingStrip`

- All four `unavailable` → four "Unavailable" chips, no data, no skeletons
- All four `polled` + fresh → data rendered, no stale badges
- Mixed: swarm `fallback+isStale`, rest `polled` → only swarm card shows "Last known" + stale
- `showLiveBadge` only true when `source === 'live'` AND `conn === 'connected'` AND `!isStale`
- `source === 'unavailable'` takes render priority over `isLoading` (skeleton never shown for unavailable)

---

## Implementation Sequence

**Step 1 — Wire real endpoints (D first):**
- Create `freshData.ts` (envelope type + helpers)
- Create `daisRefresh.config.ts`
- Implement `usePacsStatus`, `useAppealsQueue`, `useWorkloadSummary`
- Replace fixture calls in `ManagementDashboard`
- **Step 1 test gate:** unit tests for three HTTP hooks + freshData helpers pass before proceeding

**Step 2a — SignalR hook:**
- Implement `useSwarmLive` with SignalR connection + stale detection
- **Step 2a test gate:** unit tests for `useSwarmLive` (connection states, stale, reconnect) pass before proceeding

**Step 2b — Strip + wiring:**
- Build `MorningBriefingStrip` + four cards
- Extend `DashboardTabs` prop interface (pure type change, no risk)
- Insert strip into `ManagementDashboard`
- Deprecate `AISwarmDashboard` (add JSDoc comment)
- **Step 2b test gate:** component tests for `MorningBriefingStrip` + `ManagementDashboard` smoke test pass
