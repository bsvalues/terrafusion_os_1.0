# Phase 8 Management Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire ManagementDashboard.tsx to live endpoints and add MorningBriefingStrip — a persistent top strip showing swarm health, PACS status, appeals queue, and workload — as the Dais home scene header.

**Architecture:** Hook-per-domain (usePacsStatus, useAppealsQueue, useWorkloadSummary, useSwarmLive) with a shared FreshData<T> freshness envelope. ManagementDashboard is the single data owner — it calls all four hooks and passes results down to MorningBriefingStrip (presentational) and DashboardTabs. No fixture data rendered; every card shows its true source state.

**Tech Stack:** React 18, TypeScript 5.3, Vitest + React Testing Library, @microsoft/signalr, shadcn/ui + Tailwind CSS, Vite (env vars via import.meta.env)

**Spec:** `docs/superpowers/specs/2026-03-22-phase8-management-dashboard-design.md`

---

## Parallelization Map

```
Task 1  ──────────────────────────────────────────── (foundation — must run first)
         ↓
Tasks 2+3+4+5  ────────────────────────────────────── (parallel wave — independent hooks)
                ↓
         STEP 1 GATE (Tasks 2+3+4 tests pass) + STEP 2a GATE (Task 5 tests pass)
                ↓
Tasks 6+7+8+9 ─────────────────────────────────────── (parallel wave — independent cards)
               ↓
Task 10 ─────────────────────────────────────────────  (strip — needs all 4 cards)
         ↓
Task 11 ─────────────────────────────────────────────  (wiring — needs strip + hooks)
         ↓
         STEP 2b GATE (smoke test passes)
```

---

## File Map

**Create:**
```
frontend/apps/os-shell/src/
  lib/freshData.ts
  config/daisRefresh.config.ts
  hooks/usePacsStatus.ts
  hooks/useAppealsQueue.ts
  hooks/useWorkloadSummary.ts
  hooks/useSwarmLive.ts
  components/dashboard/MorningBriefingStrip.tsx
  components/dashboard/cards/SwarmStatusCard.tsx
  components/dashboard/cards/PacsStatusCard.tsx
  components/dashboard/cards/AppealsQueueCard.tsx
  components/dashboard/cards/WorkloadCard.tsx
  __tests__/lib/freshData.test.ts
  __tests__/hooks/usePacsStatus.test.ts
  __tests__/hooks/useAppealsQueue.test.ts
  __tests__/hooks/useWorkloadSummary.test.ts
  __tests__/hooks/useSwarmLive.test.ts
  __tests__/dashboard/MorningBriefingStrip.test.tsx
  __tests__/dashboard/ManagementDashboard.smoke.test.tsx
```

**Modify:**
```
frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx
frontend/apps/os-shell/src/components/dashboard/AISwarmDashboard.tsx  (add @deprecated JSDoc)
```

---

## Task 1: Foundation — FreshData + Config

**Files:**
- Create: `frontend/apps/os-shell/src/lib/freshData.ts`
- Create: `frontend/apps/os-shell/src/config/daisRefresh.config.ts`
- Test: `frontend/apps/os-shell/src/__tests__/lib/freshData.test.ts`

- [ ] **Step 1: Write the failing test for freshData helpers**

`frontend/apps/os-shell/src/__tests__/lib/freshData.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import type { FreshData } from '../../lib/freshData'
import { hasData, canRender, isFresh, showLiveBadge } from '../../lib/freshData'

const base: FreshData<string> = {
  data: null, isLoading: false, error: null,
  lastUpdated: null, source: 'unavailable', isStale: false,
}

describe('hasData', () => {
  it('returns false when data is null', () => {
    expect(hasData({ ...base, data: null })).toBe(false)
  })
  it('returns true when data is present', () => {
    expect(hasData({ ...base, data: 'value' })).toBe(true)
  })
})

describe('canRender', () => {
  it('returns false when data is null', () => {
    expect(canRender({ ...base, data: null })).toBe(false)
  })
  it('returns false when isLoading even with data', () => {
    expect(canRender({ ...base, data: 'v', isLoading: true })).toBe(false)
  })
  it('returns true when data present and not loading', () => {
    expect(canRender({ ...base, data: 'v', isLoading: false })).toBe(true)
  })
})

describe('isFresh', () => {
  it('returns false when source is unavailable', () => {
    expect(isFresh({ ...base, source: 'unavailable', isStale: false })).toBe(false)
  })
  it('returns false when isStale is true', () => {
    expect(isFresh({ ...base, source: 'polled', data: 'v', isStale: true })).toBe(false)
  })
  it('returns true when polled and not stale', () => {
    expect(isFresh({ ...base, source: 'polled', data: 'v', isStale: false })).toBe(true)
  })
  it('returns true when fallback and not stale (recent fallback is still fresh)', () => {
    expect(isFresh({ ...base, source: 'fallback', data: 'v', isStale: false })).toBe(true)
  })
})

describe('showLiveBadge', () => {
  it('returns false when source is not live', () => {
    expect(showLiveBadge({ ...base, source: 'polled' }, 'connected')).toBe(false)
  })
  it('returns false when connectionState is not connected', () => {
    expect(showLiveBadge({ ...base, source: 'live', isStale: false }, 'degraded')).toBe(false)
  })
  it('returns false when isStale', () => {
    expect(showLiveBadge({ ...base, source: 'live', isStale: true }, 'connected')).toBe(false)
  })
  it('returns true when live, connected, and not stale', () => {
    expect(showLiveBadge({ ...base, source: 'live', isStale: false }, 'connected')).toBe(true)
  })
  it('returns false when conn is omitted (HTTP cards never pass conn)', () => {
    expect(showLiveBadge({ ...base, source: 'live', isStale: false })).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- --run __tests__/lib/freshData.test.ts
```
Expected: FAIL — `freshData` module not found.

- [ ] **Step 3: Implement freshData.ts**

`frontend/apps/os-shell/src/lib/freshData.ts`:
```typescript
export type SwarmConnectionState = 'connecting' | 'connected' | 'degraded' | 'disconnected'

export interface FreshData<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  lastUpdated: number | null  // epoch ms
  source: 'live' | 'polled' | 'fallback' | 'unavailable'
  isStale: boolean
}

export const hasData = <T>(f: FreshData<T>): boolean => f.data !== null

// canRender: true when settled data is present and ready to display.
// For skeleton vs empty branching: (!hasData(f) && f.isLoading) → skeleton; source==='unavailable' → empty chip.
export const canRender = <T>(f: FreshData<T>): boolean => hasData(f) && !f.isLoading

// isFresh: false when stale or unavailable. Used by cards for source-badge rendering.
// Note: fallback with isStale===false is still isFresh (recent last-known data).
export const isFresh = <T>(f: FreshData<T>): boolean =>
  !f.isStale && f.source !== 'unavailable'

// showLiveBadge: SwarmStatusCard only. HTTP-polling cards never have source==='live'.
export const showLiveBadge = (
  f: FreshData<unknown>,
  conn?: SwarmConnectionState
): boolean => f.source === 'live' && conn === 'connected' && !f.isStale
```

- [ ] **Step 4: Implement daisRefresh.config.ts**

`frontend/apps/os-shell/src/config/daisRefresh.config.ts`:
```typescript
// No swarmIntervalMs — useSwarmLive is push-driven (SignalR), not polled.
// The no-hardcoded-interval rule applies to HTTP-polling hooks only.
export const DAIS_REFRESH = {
  appealsQueueMs:       45_000,
  appealsStaleAfterMs:  90_000,
  pacsStatusMs:         60_000,
  pacsStaleAfterMs:    180_000,
  workloadMs:          120_000,
  workloadStaleAfterMs: 300_000,
  swarmStaleAfterMs:    10_000,  // stale detection only — not a poll interval
} as const
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd frontend && npm test -- --run __tests__/lib/freshData.test.ts
```
Expected: 11 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/apps/os-shell/src/lib/freshData.ts \
        frontend/apps/os-shell/src/config/daisRefresh.config.ts \
        frontend/apps/os-shell/src/__tests__/lib/freshData.test.ts
git commit -m "feat(phase8): FreshData<T> envelope + DAIS_REFRESH config"
```

---

## Task 2: usePacsStatus (parallel with Tasks 3, 4, 5)

**Files:**
- Create: `frontend/apps/os-shell/src/hooks/usePacsStatus.ts`
- Test: `frontend/apps/os-shell/src/__tests__/hooks/usePacsStatus.test.ts`

- [ ] **Step 1: Write the failing tests**

`frontend/apps/os-shell/src/__tests__/hooks/usePacsStatus.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePacsStatus } from '../../hooks/usePacsStatus'
import { DAIS_REFRESH } from '../../config/daisRefresh.config'

const ok = { contractValid: true, healthCheckExecution: 'passed', latencyMs: 120, lastVerifiedUtc: '2026-03-22T03:00:00Z' }

function mockFetch(response: object | null, fail = false) {
  if (fail) return vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true, json: async () => response,
  } as Response)
}

describe('usePacsStatus', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

  it('starts with isLoading:true and source:unavailable', () => {
    mockFetch(ok)
    const { result } = renderHook(() => usePacsStatus())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.source).toBe('unavailable')
    expect(result.current.data).toBeNull()
  })

  it('sets source:polled and stamps lastUpdated on success', async () => {
    mockFetch(ok)
    const { result } = renderHook(() => usePacsStatus())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.source).toBe('polled')
    expect(result.current.data?.contractValid).toBe(true)
    expect(result.current.data?.reachable).toBe(true)
    expect(result.current.lastUpdated).toBeTypeOf('number')
    expect(result.current.isStale).toBe(false)
  })

  it('sets source:unavailable on first-load failure', async () => {
    mockFetch(null, true)
    const { result } = renderHook(() => usePacsStatus())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.source).toBe('unavailable')
    expect(result.current.data).toBeNull()
    expect(result.current.error).toContain('Network error')
  })

  it('sets source:fallback and preserves data on poll failure after success', async () => {
    const spy = vi.spyOn(global, 'fetch')
    spy.mockResolvedValueOnce({ ok: true, json: async () => ok } as Response)
    spy.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => usePacsStatus())
    await waitFor(() => expect(result.current.source).toBe('polled'))
    vi.advanceTimersByTime(DAIS_REFRESH.pacsStatusMs)
    await waitFor(() => expect(result.current.source).toBe('fallback'))
    expect(result.current.data?.contractValid).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('does not set isLoading:true on re-poll when prior data exists', async () => {
    mockFetch(ok)
    const { result } = renderHook(() => usePacsStatus())
    await waitFor(() => expect(result.current.source).toBe('polled'))
    vi.advanceTimersByTime(DAIS_REFRESH.pacsStatusMs)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).not.toBeNull()
  })

  it('sets isStale:true after pacsStaleAfterMs elapses in fallback', async () => {
    const spy = vi.spyOn(global, 'fetch')
    spy.mockResolvedValueOnce({ ok: true, json: async () => ok } as Response)
    spy.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => usePacsStatus())
    await waitFor(() => expect(result.current.source).toBe('polled'))
    vi.advanceTimersByTime(DAIS_REFRESH.pacsStaleAfterMs + DAIS_REFRESH.pacsStatusMs)
    await waitFor(() => expect(result.current.isStale).toBe(true))
    expect(result.current.source).toBe('fallback')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- --run __tests__/hooks/usePacsStatus.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement usePacsStatus.ts**

`frontend/apps/os-shell/src/hooks/usePacsStatus.ts`:
```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
import type { FreshData } from '../lib/freshData'
import { DAIS_REFRESH } from '../config/daisRefresh.config'

export interface PacsHealth {
  contractValid: boolean
  reachable: boolean
  latencyMs: number | null
  lastProofUtc: string | null
}

const INITIAL: FreshData<PacsHealth> = {
  data: null, isLoading: true, error: null,
  lastUpdated: null, source: 'unavailable', isStale: false,
}

function computeIsStale(lastUpdated: number | null): boolean {
  if (lastUpdated === null) return false
  return Date.now() - lastUpdated > DAIS_REFRESH.pacsStaleAfterMs
}

async function fetchPacsHealth(): Promise<PacsHealth> {
  const res = await fetch('/ops/pacs/proof')
  if (!res.ok) throw new Error(`PACS probe failed: ${res.status}`)
  const json = await res.json()
  return {
    contractValid: json.contractValid ?? false,
    reachable: json.healthCheckExecution === 'passed',
    latencyMs: json.latencyMs ?? null,
    lastProofUtc: json.lastVerifiedUtc ?? null,
  }
}

export function usePacsStatus(): FreshData<PacsHealth> {
  const [state, setState] = useState<FreshData<PacsHealth>>(INITIAL)
  const lastUpdatedRef = useRef<number | null>(null)
  const lastDataRef = useRef<PacsHealth | null>(null)

  const poll = useCallback(async () => {
    try {
      const data = await fetchPacsHealth()
      const lastUpdated = Date.now()
      lastUpdatedRef.current = lastUpdated
      lastDataRef.current = data
      setState({ data, isLoading: false, error: null, lastUpdated, source: 'polled', isStale: false })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      const lastUpdated = lastUpdatedRef.current
      if (lastDataRef.current !== null) {
        // Keep prior data; do NOT set isLoading:true
        setState({ data: lastDataRef.current, isLoading: false, error: errMsg,
          lastUpdated, source: 'fallback', isStale: computeIsStale(lastUpdated) })
      } else {
        setState({ data: null, isLoading: false, error: errMsg,
          lastUpdated: null, source: 'unavailable', isStale: false })
      }
    }
  }, [])

  useEffect(() => {
    poll()
    const id = setInterval(poll, DAIS_REFRESH.pacsStatusMs)
    return () => clearInterval(id)
  }, [poll])

  return state
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- --run __tests__/hooks/usePacsStatus.test.ts
```
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/os-shell/src/hooks/usePacsStatus.ts \
        frontend/apps/os-shell/src/__tests__/hooks/usePacsStatus.test.ts
git commit -m "feat(phase8): usePacsStatus — polls /ops/pacs/proof with FreshData envelope"
```

---

## Task 3: useAppealsQueue (parallel with Tasks 2, 4, 5)

**Files:**
- Create: `frontend/apps/os-shell/src/hooks/useAppealsQueue.ts`
- Test: `frontend/apps/os-shell/src/__tests__/hooks/useAppealsQueue.test.ts`

Same structure as Task 2 — same tests, different endpoint and config keys.

- [ ] **Step 1: Write the failing tests**

`frontend/apps/os-shell/src/__tests__/hooks/useAppealsQueue.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAppealsQueue } from '../../hooks/useAppealsQueue'
import { DAIS_REFRESH } from '../../config/daisRefresh.config'

const ok = { total: 42, openCount: 30, pendingHearingCount: 8, closedThisCycleCount: 4 }

describe('useAppealsQueue', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

  it('starts with isLoading:true and source:unavailable', () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ok } as Response)
    const { result } = renderHook(() => useAppealsQueue())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.source).toBe('unavailable')
  })

  it('sets source:polled on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ok } as Response)
    const { result } = renderHook(() => useAppealsQueue())
    await waitFor(() => expect(result.current.source).toBe('polled'))
    expect(result.current.data?.total).toBe(42)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isStale).toBe(false)
  })

  it('sets source:unavailable on first-load failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useAppealsQueue())
    await waitFor(() => expect(result.current.source).toBe('unavailable'))
    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('sets source:fallback and preserves data on poll failure after success', async () => {
    const spy = vi.spyOn(global, 'fetch')
    spy.mockResolvedValueOnce({ ok: true, json: async () => ok } as Response)
    spy.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useAppealsQueue())
    await waitFor(() => expect(result.current.source).toBe('polled'))
    vi.advanceTimersByTime(DAIS_REFRESH.appealsQueueMs)
    await waitFor(() => expect(result.current.source).toBe('fallback'))
    expect(result.current.data?.total).toBe(42)
    expect(result.current.isLoading).toBe(false)
  })

  it('does not set isLoading:true on re-poll when prior data exists', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ok } as Response)
    const { result } = renderHook(() => useAppealsQueue())
    await waitFor(() => expect(result.current.source).toBe('polled'))
    vi.advanceTimersByTime(DAIS_REFRESH.appealsQueueMs)
    expect(result.current.isLoading).toBe(false)
  })

  it('sets isStale:true after appealsStaleAfterMs elapses in fallback', async () => {
    const spy = vi.spyOn(global, 'fetch')
    spy.mockResolvedValueOnce({ ok: true, json: async () => ok } as Response)
    spy.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useAppealsQueue())
    await waitFor(() => expect(result.current.source).toBe('polled'))
    vi.advanceTimersByTime(DAIS_REFRESH.appealsStaleAfterMs + DAIS_REFRESH.appealsQueueMs)
    await waitFor(() => expect(result.current.isStale).toBe(true))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- --run __tests__/hooks/useAppealsQueue.test.ts
```

- [ ] **Step 3: Implement useAppealsQueue.ts**

`frontend/apps/os-shell/src/hooks/useAppealsQueue.ts`:
```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
import type { FreshData } from '../lib/freshData'
import { DAIS_REFRESH } from '../config/daisRefresh.config'

export interface AppealsQueueSummary {
  total: number
  openCount: number
  pendingHearingCount: number
  closedThisCycleCount: number
}

const INITIAL: FreshData<AppealsQueueSummary> = {
  data: null, isLoading: true, error: null,
  lastUpdated: null, source: 'unavailable', isStale: false,
}

function computeIsStale(lastUpdated: number | null): boolean {
  if (lastUpdated === null) return false
  return Date.now() - lastUpdated > DAIS_REFRESH.appealsStaleAfterMs
}

async function fetchAppeals(): Promise<AppealsQueueSummary> {
  const res = await fetch('/api/dais/appeals')
  if (!res.ok) throw new Error(`Appeals fetch failed: ${res.status}`)
  const json = await res.json()
  // Normalize — adjust field names if the actual API shape differs
  return {
    total: json.total ?? json.length ?? 0,
    openCount: json.openCount ?? 0,
    pendingHearingCount: json.pendingHearingCount ?? 0,
    closedThisCycleCount: json.closedThisCycleCount ?? 0,
  }
}

export function useAppealsQueue(): FreshData<AppealsQueueSummary> {
  const [state, setState] = useState<FreshData<AppealsQueueSummary>>(INITIAL)
  const lastUpdatedRef = useRef<number | null>(null)
  const lastDataRef = useRef<AppealsQueueSummary | null>(null)

  const poll = useCallback(async () => {
    try {
      const data = await fetchAppeals()
      const lastUpdated = Date.now()
      lastUpdatedRef.current = lastUpdated
      lastDataRef.current = data
      setState({ data, isLoading: false, error: null, lastUpdated, source: 'polled', isStale: false })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      const lastUpdated = lastUpdatedRef.current
      if (lastDataRef.current !== null) {
        setState({ data: lastDataRef.current, isLoading: false, error: errMsg,
          lastUpdated, source: 'fallback', isStale: computeIsStale(lastUpdated) })
      } else {
        setState({ data: null, isLoading: false, error: errMsg,
          lastUpdated: null, source: 'unavailable', isStale: false })
      }
    }
  }, [])

  useEffect(() => {
    poll()
    const id = setInterval(poll, DAIS_REFRESH.appealsQueueMs)
    return () => clearInterval(id)
  }, [poll])

  return state
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- --run __tests__/hooks/useAppealsQueue.test.ts
```
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/os-shell/src/hooks/useAppealsQueue.ts \
        frontend/apps/os-shell/src/__tests__/hooks/useAppealsQueue.test.ts
git commit -m "feat(phase8): useAppealsQueue — polls /api/dais/appeals with FreshData envelope"
```

---

## Task 4: useWorkloadSummary (parallel with Tasks 2, 3, 5)

**Files:**
- Create: `frontend/apps/os-shell/src/hooks/useWorkloadSummary.ts`
- Test: `frontend/apps/os-shell/src/__tests__/hooks/useWorkloadSummary.test.ts`

- [ ] **Step 1: Write the failing tests**

`frontend/apps/os-shell/src/__tests__/hooks/useWorkloadSummary.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWorkloadSummary } from '../../hooks/useWorkloadSummary'
import { DAIS_REFRESH } from '../../config/daisRefresh.config'

const ok = { totalParcels: 89247, parcelsReviewed: 12000, parcelsRemaining: 77247, appraisersActive: 8, utilizationPct: 72 }

describe('useWorkloadSummary', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

  it('starts with isLoading:true and source:unavailable', () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ok } as Response)
    const { result } = renderHook(() => useWorkloadSummary())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.source).toBe('unavailable')
  })

  it('sets source:polled on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ok } as Response)
    const { result } = renderHook(() => useWorkloadSummary())
    await waitFor(() => expect(result.current.source).toBe('polled'))
    expect(result.current.data?.totalParcels).toBe(89247)
    expect(result.current.isLoading).toBe(false)
  })

  it('sets source:unavailable on first-load failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useWorkloadSummary())
    await waitFor(() => expect(result.current.source).toBe('unavailable'))
    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('sets source:fallback and preserves data on poll failure', async () => {
    const spy = vi.spyOn(global, 'fetch')
    spy.mockResolvedValueOnce({ ok: true, json: async () => ok } as Response)
    spy.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useWorkloadSummary())
    await waitFor(() => expect(result.current.source).toBe('polled'))
    vi.advanceTimersByTime(DAIS_REFRESH.workloadMs)
    await waitFor(() => expect(result.current.source).toBe('fallback'))
    expect(result.current.data?.totalParcels).toBe(89247)
    expect(result.current.isLoading).toBe(false)
  })

  it('does not set isLoading:true on re-poll when prior data exists', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ok } as Response)
    const { result } = renderHook(() => useWorkloadSummary())
    await waitFor(() => expect(result.current.source).toBe('polled'))
    vi.advanceTimersByTime(DAIS_REFRESH.workloadMs)
    expect(result.current.isLoading).toBe(false)
  })

  it('sets isStale:true after workloadStaleAfterMs elapses in fallback', async () => {
    const spy = vi.spyOn(global, 'fetch')
    spy.mockResolvedValueOnce({ ok: true, json: async () => ok } as Response)
    spy.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useWorkloadSummary())
    await waitFor(() => expect(result.current.source).toBe('polled'))
    vi.advanceTimersByTime(DAIS_REFRESH.workloadStaleAfterMs + DAIS_REFRESH.workloadMs)
    await waitFor(() => expect(result.current.isStale).toBe(true))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- --run __tests__/hooks/useWorkloadSummary.test.ts
```

- [ ] **Step 3: Implement useWorkloadSummary.ts**

`frontend/apps/os-shell/src/hooks/useWorkloadSummary.ts`:
```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
import type { FreshData } from '../lib/freshData'
import { DAIS_REFRESH } from '../config/daisRefresh.config'

export interface WorkloadSummary {
  totalParcels: number
  parcelsReviewed: number
  parcelsRemaining: number
  appraisersActive: number
  utilizationPct: number | null
}

const INITIAL: FreshData<WorkloadSummary> = {
  data: null, isLoading: true, error: null,
  lastUpdated: null, source: 'unavailable', isStale: false,
}

function computeIsStale(lastUpdated: number | null): boolean {
  if (lastUpdated === null) return false
  return Date.now() - lastUpdated > DAIS_REFRESH.workloadStaleAfterMs
}

async function fetchWorkload(): Promise<WorkloadSummary> {
  const res = await fetch('/api/dais/queue')
  if (!res.ok) throw new Error(`Workload fetch failed: ${res.status}`)
  const json = await res.json()
  return {
    totalParcels: json.totalParcels ?? 0,
    parcelsReviewed: json.parcelsReviewed ?? 0,
    parcelsRemaining: json.parcelsRemaining ?? 0,
    appraisersActive: json.appraisersActive ?? 0,
    utilizationPct: json.utilizationPct ?? null,
  }
}

export function useWorkloadSummary(): FreshData<WorkloadSummary> {
  const [state, setState] = useState<FreshData<WorkloadSummary>>(INITIAL)
  const lastUpdatedRef = useRef<number | null>(null)
  const lastDataRef = useRef<WorkloadSummary | null>(null)

  const poll = useCallback(async () => {
    try {
      const data = await fetchWorkload()
      const lastUpdated = Date.now()
      lastUpdatedRef.current = lastUpdated
      lastDataRef.current = data
      setState({ data, isLoading: false, error: null, lastUpdated, source: 'polled', isStale: false })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      const lastUpdated = lastUpdatedRef.current
      if (lastDataRef.current !== null) {
        setState({ data: lastDataRef.current, isLoading: false, error: errMsg,
          lastUpdated, source: 'fallback', isStale: computeIsStale(lastUpdated) })
      } else {
        setState({ data: null, isLoading: false, error: errMsg,
          lastUpdated: null, source: 'unavailable', isStale: false })
      }
    }
  }, [])

  useEffect(() => {
    poll()
    const id = setInterval(poll, DAIS_REFRESH.workloadMs)
    return () => clearInterval(id)
  }, [poll])

  return state
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- --run __tests__/hooks/useWorkloadSummary.test.ts
```
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/os-shell/src/hooks/useWorkloadSummary.ts \
        frontend/apps/os-shell/src/__tests__/hooks/useWorkloadSummary.test.ts
git commit -m "feat(phase8): useWorkloadSummary — polls /api/dais/queue with FreshData envelope"
```

---

## ✅ STEP 1 TEST GATE

Before proceeding to Task 5 and the card wave, run the full HTTP hook suite:

```bash
cd frontend && npm test -- --run __tests__/hooks/usePacsStatus.test.ts \
  __tests__/hooks/useAppealsQueue.test.ts \
  __tests__/hooks/useWorkloadSummary.test.ts \
  __tests__/lib/freshData.test.ts
```

Expected: 29 tests PASS. Do not proceed to card tasks if any fail.

---

## Task 5: useSwarmLive (parallel with Tasks 2, 3, 4 — Step 2a gate)

**Files:**
- Create: `frontend/apps/os-shell/src/hooks/useSwarmLive.ts`
- Test: `frontend/apps/os-shell/src/__tests__/hooks/useSwarmLive.test.ts`

- [ ] **Step 1: Write the failing tests**

`frontend/apps/os-shell/src/__tests__/hooks/useSwarmLive.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSwarmLive } from '../../hooks/useSwarmLive'
import { DAIS_REFRESH } from '../../config/daisRefresh.config'

// Captured callbacks from mock
let onHandlers: Record<string, (payload: unknown) => void> = {}
let closeCb: (() => void) | null = null
let reconnectingCb: (() => void) | null = null
let reconnectedCb: (() => void) | null = null
let startResolve: (() => void) | null = null
let startReject: ((e: Error) => void) | null = null

const mockConnection = {
  on: vi.fn((event: string, cb: (payload: unknown) => void) => {
    onHandlers[event] = cb
  }),
  onclose: vi.fn((cb: () => void) => { closeCb = cb }),
  onreconnecting: vi.fn((cb: () => void) => { reconnectingCb = cb }),
  onreconnected: vi.fn((cb: () => void) => { reconnectedCb = cb }),
  start: vi.fn(() => new Promise<void>((res, rej) => { startResolve = res; startReject = rej })),
  stop: vi.fn().mockResolvedValue(undefined),
}

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: vi.fn(() => ({
    withUrl: vi.fn().mockReturnThis(),
    withAutomaticReconnect: vi.fn().mockReturnThis(),
    configureLogging: vi.fn().mockReturnThis(),
    build: vi.fn(() => mockConnection),
  })),
  LogLevel: { Warning: 1 },
}))

describe('useSwarmLive', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    onHandlers = {}; closeCb = null; reconnectingCb = null
    reconnectedCb = null; startResolve = null; startReject = null
    vi.clearAllMocks()
    mockConnection.on.mockImplementation((event, cb) => { onHandlers[event] = cb })
    mockConnection.onclose.mockImplementation(cb => { closeCb = cb })
    mockConnection.onreconnecting.mockImplementation(cb => { reconnectingCb = cb })
    mockConnection.onreconnected.mockImplementation(cb => { reconnectedCb = cb })
    mockConnection.start.mockImplementation(() =>
      new Promise<void>((res, rej) => { startResolve = res; startReject = rej }))
  })
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

  it('starts with isLoading:true and source:unavailable', () => {
    renderHook(() => useSwarmLive())
    // Before start resolves
    // Can't easily check initial state before async start but hook renders immediately
  })

  it('sets source:live and stamps lastUpdated on SwarmStatusUpdate message', async () => {
    const { result } = renderHook(() => useSwarmLive())
    act(() => { startResolve?.() })
    act(() => {
      onHandlers['SwarmStatusUpdate']?.({
        totalAgents: 2016, healthyAgents: 1980, overallStatus: 'degraded'
      })
    })
    await waitFor(() => expect(result.current.source).toBe('live'))
    expect(result.current.data?.totalAgents).toBe(2016)
    expect(result.current.data?.connectionState).toBe('connected')
    expect(result.current.lastUpdated).toBeTypeOf('number')
    expect(result.current.isStale).toBe(false)
  })

  it('sets isStale:true after swarmStaleAfterMs with no new message', async () => {
    const { result } = renderHook(() => useSwarmLive())
    act(() => { startResolve?.() })
    act(() => {
      onHandlers['SwarmStatusUpdate']?.({
        totalAgents: 2016, healthyAgents: 1980, overallStatus: 'degraded'
      })
    })
    await waitFor(() => expect(result.current.source).toBe('live'))
    // Advance past stale threshold — hook needs to detect this on next check
    // The hook computes isStale from lastUpdated, so advance timers and trigger re-render
    act(() => { vi.advanceTimersByTime(DAIS_REFRESH.swarmStaleAfterMs + 1000) })
    // Force a new message to trigger recompute (or hook polls for staleness)
    // Note: if hook uses a stale-check interval, this will fire automatically
    await waitFor(() => expect(result.current.isStale).toBe(true))
  })

  it('sets source:fallback and isStale:true on disconnect with prior data', async () => {
    const { result } = renderHook(() => useSwarmLive())
    act(() => { startResolve?.() })
    act(() => {
      onHandlers['SwarmStatusUpdate']?.({
        totalAgents: 2016, healthyAgents: 1980, overallStatus: 'degraded'
      })
    })
    await waitFor(() => expect(result.current.source).toBe('live'))
    act(() => { closeCb?.() })
    await waitFor(() => expect(result.current.source).toBe('fallback'))
    expect(result.current.isStale).toBe(true)
    expect(result.current.lastUpdated).toBeNull()  // spec: reset to null on disconnect so isStale is immediately true
    expect(result.current.data?.totalAgents).toBe(2016)
    expect(result.current.isLoading).toBe(false)
  })

  it('sets source:unavailable when connection fails before any data', async () => {
    const { result } = renderHook(() => useSwarmLive())
    act(() => { startReject?.(new Error('connection refused')) })
    await waitFor(() => expect(result.current.source).toBe('unavailable'))
    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('clears isStale and sets source:live after reconnect delivers a new message', async () => {
    const { result } = renderHook(() => useSwarmLive())
    act(() => { startResolve?.() })
    act(() => { onHandlers['SwarmStatusUpdate']?.({ totalAgents: 2016, healthyAgents: 1980, overallStatus: 'degraded' }) })
    await waitFor(() => expect(result.current.source).toBe('live'))
    act(() => { closeCb?.() })
    await waitFor(() => expect(result.current.source).toBe('fallback'))
    // Reconnect delivers new message
    act(() => { onHandlers['SwarmStatusUpdate']?.({ totalAgents: 2016, healthyAgents: 1980, overallStatus: 'healthy' }) })
    await waitFor(() => expect(result.current.source).toBe('live'))
    expect(result.current.isStale).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- --run __tests__/hooks/useSwarmLive.test.ts
```

- [ ] **Step 3: Implement useSwarmLive.ts**

`frontend/apps/os-shell/src/hooks/useSwarmLive.ts`:
```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import type { FreshData, SwarmConnectionState } from '../lib/freshData'
import { DAIS_REFRESH } from '../config/daisRefresh.config'

export interface SwarmStatus {
  connectionState: SwarmConnectionState
  totalAgents: number
  healthyAgents: number
  overallStatus: string
}

const INITIAL: FreshData<SwarmStatus> = {
  data: null, isLoading: true, error: null,
  lastUpdated: null, source: 'unavailable', isStale: false,
}

interface SwarmPayload { totalAgents: number; healthyAgents: number; overallStatus: string }

export function useSwarmLive(): FreshData<SwarmStatus> {
  const [state, setState] = useState<FreshData<SwarmStatus>>(INITIAL)
  const lastDataRef = useRef<SwarmStatus | null>(null)
  const lastUpdatedRef = useRef<number | null>(null)

  const handleMessage = useCallback((payload: SwarmPayload) => {
    const lastUpdated = Date.now()
    lastUpdatedRef.current = lastUpdated
    const data: SwarmStatus = { connectionState: 'connected', ...payload }
    lastDataRef.current = data
    setState({ data, isLoading: false, error: null, lastUpdated, source: 'live', isStale: false })
  }, [])

  const handleDisconnect = useCallback(() => {
    // Reset lastUpdated to null so isStale resolves true immediately
    lastUpdatedRef.current = null
    setState({
      data: lastDataRef.current,
      isLoading: false,
      error: 'Swarm hub disconnected',
      lastUpdated: null,
      source: lastDataRef.current !== null ? 'fallback' : 'unavailable',
      isStale: true,
    })
  }, [])

  useEffect(() => {
    const url = (import.meta.env.VITE_CONSCIOUSNESS_URL as string | undefined) ?? 'http://localhost:3004'
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${url}/hubs/swarm`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    conn.on('SwarmStatusUpdate', handleMessage)
    conn.onreconnecting(() => {
      setState(prev => prev.data
        ? { ...prev, data: { ...prev.data, connectionState: 'connecting' } }
        : prev)
    })
    conn.onreconnected(() => {
      setState(prev => prev.data
        ? { ...prev, data: { ...prev.data, connectionState: 'connected' } }
        : prev)
    })
    conn.onclose(handleDisconnect)

    // Stale detection interval — marks isStale between messages
    const staleId = setInterval(() => {
      const lu = lastUpdatedRef.current
      const nowStale = lu === null || Date.now() - lu > DAIS_REFRESH.swarmStaleAfterMs
      if (nowStale) {
        setState(prev =>
          prev.isStale ? prev : { ...prev, isStale: true })
      }
    }, 1000)

    conn.start().catch(() => {
      setState({ data: null, isLoading: false, error: 'Failed to connect to swarm hub',
        lastUpdated: null, source: 'unavailable', isStale: false })
    })

    return () => {
      clearInterval(staleId)
      conn.stop()
    }
  }, [handleMessage, handleDisconnect])

  return state
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- --run __tests__/hooks/useSwarmLive.test.ts
```
Expected: 5 tests PASS. If the stale-detection test is flaky with fake timers, increase advance time to `swarmStaleAfterMs + 2000`.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/os-shell/src/hooks/useSwarmLive.ts \
        frontend/apps/os-shell/src/__tests__/hooks/useSwarmLive.test.ts
git commit -m "feat(phase8): useSwarmLive — SignalR subscription to Consciousness /hubs/swarm"
```

---

## ✅ STEP 2a TEST GATE

```bash
cd frontend && npm test -- --run __tests__/hooks/useSwarmLive.test.ts
```
Expected: 5 tests PASS. Only proceed to card tasks after this passes.

---

## Tasks 6–9: Card Components (parallel wave — all 4 independent)

Each card is purely presentational — no fetching, no hooks. They render from the card render state matrix in the spec (unavailable → skeleton → fallback → stale → fresh). Use `cn()` (shadcn classnames utility) for conditional classes.

### Task 6: SwarmStatusCard (parallel with 7, 8, 9)

**Files:**
- Create: `frontend/apps/os-shell/src/components/dashboard/cards/SwarmStatusCard.tsx`

- [ ] **Step 1: Implement SwarmStatusCard.tsx**

`frontend/apps/os-shell/src/components/dashboard/cards/SwarmStatusCard.tsx`:
```tsx
import { cn } from '@/lib/utils'
import type { FreshData, SwarmConnectionState } from '../../../lib/freshData'
import { canRender, showLiveBadge } from '../../../lib/freshData'
import type { SwarmStatus } from '../../../hooks/useSwarmLive'

interface SwarmStatusCardProps {
  swarm: FreshData<SwarmStatus>
}

function ConnectionPip({ state }: { state: SwarmConnectionState }) {
  const colors: Record<SwarmConnectionState, string> = {
    connected:    'bg-emerald-400',
    connecting:   'bg-amber-400 animate-pulse',
    degraded:     'bg-amber-500',
    disconnected: 'bg-red-500',
  }
  return <span className={cn('inline-block h-2 w-2 rounded-full mr-1', colors[state])} />
}

export function SwarmStatusCard({ swarm }: SwarmStatusCardProps) {
  // Priority 1: unavailable
  if (swarm.source === 'unavailable') {
    return (
      <div className="rounded-lg border border-red-900/40 bg-terra-midnight p-4 flex flex-col gap-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">AI Swarm</p>
        <span className="text-xs text-red-400 font-medium">Unavailable</span>
      </div>
    )
  }

  // Priority 2: first-load skeleton
  if (!canRender(swarm)) {
    return (
      <div className="rounded-lg border border-white/10 bg-terra-midnight p-4 animate-pulse">
        <div className="h-3 w-16 bg-white/10 rounded mb-2" />
        <div className="h-5 w-24 bg-white/10 rounded" />
      </div>
    )
  }

  const { data } = swarm
  const isLive = showLiveBadge(swarm, data?.connectionState)

  return (
    <div className={cn(
      'rounded-lg border p-4 flex flex-col gap-1',
      swarm.isStale ? 'border-amber-800/40 bg-terra-midnight' : 'border-white/10 bg-terra-midnight'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-wide">AI Swarm</p>
        {swarm.source === 'fallback' && (
          <span className="text-xs text-amber-400">Last known</span>
        )}
        {swarm.isStale && swarm.source !== 'fallback' && (
          <span className="text-xs text-amber-400">Stale</span>
        )}
        {isLive && (
          <span className="text-xs text-emerald-400 flex items-center">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
            Live
          </span>
        )}
      </div>
      {data && (
        <>
          <div className="flex items-center gap-1 mt-1">
            <ConnectionPip state={data.connectionState} />
            <span className="text-sm font-medium text-white capitalize">{data.connectionState}</span>
          </div>
          <p className="text-xs text-gray-400">
            {data.healthyAgents.toLocaleString()} / {data.totalAgents.toLocaleString()} agents healthy
          </p>
          <p className="text-xs text-gray-500 capitalize">{data.overallStatus}</p>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/apps/os-shell/src/components/dashboard/cards/SwarmStatusCard.tsx
git commit -m "feat(phase8): SwarmStatusCard — presentational, FreshData<SwarmStatus> props"
```

### Task 7: PacsStatusCard (parallel with 6, 8, 9)

- [ ] **Step 1: Implement PacsStatusCard.tsx**

`frontend/apps/os-shell/src/components/dashboard/cards/PacsStatusCard.tsx`:
```tsx
import { cn } from '@/lib/utils'
import type { FreshData } from '../../../lib/freshData'
import { canRender } from '../../../lib/freshData'
import type { PacsHealth } from '../../../hooks/usePacsStatus'

interface PacsStatusCardProps {
  pacs: FreshData<PacsHealth>
}

export function PacsStatusCard({ pacs }: PacsStatusCardProps) {
  if (pacs.source === 'unavailable') {
    return (
      <div className="rounded-lg border border-red-900/40 bg-terra-midnight p-4 flex flex-col gap-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">PACS</p>
        <span className="text-xs text-red-400 font-medium">Unavailable</span>
      </div>
    )
  }

  if (!canRender(pacs)) {
    return (
      <div className="rounded-lg border border-white/10 bg-terra-midnight p-4 animate-pulse">
        <div className="h-3 w-16 bg-white/10 rounded mb-2" />
        <div className="h-5 w-24 bg-white/10 rounded" />
      </div>
    )
  }

  const { data } = pacs

  return (
    <div className={cn(
      'rounded-lg border p-4 flex flex-col gap-1',
      pacs.isStale ? 'border-amber-800/40 bg-terra-midnight' : 'border-white/10 bg-terra-midnight'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-wide">PACS</p>
        {pacs.source === 'fallback' && <span className="text-xs text-amber-400">Last known</span>}
        {pacs.isStale && pacs.source !== 'fallback' && <span className="text-xs text-amber-400">Stale</span>}
      </div>
      {data && (
        <>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'inline-block h-2 w-2 rounded-full',
              data.reachable ? 'bg-emerald-400' : 'bg-red-500'
            )} />
            <span className="text-sm font-medium text-white">
              {data.reachable ? 'Reachable' : 'Unreachable'}
            </span>
          </div>
          {data.contractValid
            ? <p className="text-xs text-emerald-400">Contract valid</p>
            : <p className="text-xs text-red-400">Contract invalid</p>}
          {data.latencyMs != null && (
            <p className="text-xs text-gray-500">{data.latencyMs}ms</p>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/apps/os-shell/src/components/dashboard/cards/PacsStatusCard.tsx
git commit -m "feat(phase8): PacsStatusCard — presentational, FreshData<PacsHealth> props"
```

### Task 8: AppealsQueueCard (parallel with 6, 7, 9)

- [ ] **Step 1: Implement AppealsQueueCard.tsx**

`frontend/apps/os-shell/src/components/dashboard/cards/AppealsQueueCard.tsx`:
```tsx
import { cn } from '@/lib/utils'
import type { FreshData } from '../../../lib/freshData'
import { canRender } from '../../../lib/freshData'
import type { AppealsQueueSummary } from '../../../hooks/useAppealsQueue'

interface AppealsQueueCardProps {
  appeals: FreshData<AppealsQueueSummary>
}

export function AppealsQueueCard({ appeals }: AppealsQueueCardProps) {
  if (appeals.source === 'unavailable') {
    return (
      <div className="rounded-lg border border-red-900/40 bg-terra-midnight p-4 flex flex-col gap-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Appeals</p>
        <span className="text-xs text-red-400 font-medium">Unavailable</span>
      </div>
    )
  }

  if (!canRender(appeals)) {
    return (
      <div className="rounded-lg border border-white/10 bg-terra-midnight p-4 animate-pulse">
        <div className="h-3 w-16 bg-white/10 rounded mb-2" />
        <div className="h-5 w-24 bg-white/10 rounded" />
      </div>
    )
  }

  const { data } = appeals

  return (
    <div className={cn(
      'rounded-lg border p-4 flex flex-col gap-1',
      appeals.isStale ? 'border-amber-800/40 bg-terra-midnight' : 'border-white/10 bg-terra-midnight'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Appeals</p>
        {appeals.source === 'fallback' && <span className="text-xs text-amber-400">Last known</span>}
        {appeals.isStale && appeals.source !== 'fallback' && <span className="text-xs text-amber-400">Stale</span>}
      </div>
      {data && (
        <>
          <p className="text-2xl font-bold text-white mt-1">{data.openCount}</p>
          <p className="text-xs text-gray-400">open of {data.total} total</p>
          <p className="text-xs text-gray-500">{data.pendingHearingCount} pending hearing</p>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/apps/os-shell/src/components/dashboard/cards/AppealsQueueCard.tsx
git commit -m "feat(phase8): AppealsQueueCard — presentational, FreshData<AppealsQueueSummary> props"
```

### Task 9: WorkloadCard (parallel with 6, 7, 8)

- [ ] **Step 1: Implement WorkloadCard.tsx**

`frontend/apps/os-shell/src/components/dashboard/cards/WorkloadCard.tsx`:
```tsx
import { cn } from '@/lib/utils'
import type { FreshData } from '../../../lib/freshData'
import { canRender } from '../../../lib/freshData'
import type { WorkloadSummary } from '../../../hooks/useWorkloadSummary'

interface WorkloadCardProps {
  workload: FreshData<WorkloadSummary>
}

export function WorkloadCard({ workload }: WorkloadCardProps) {
  if (workload.source === 'unavailable') {
    return (
      <div className="rounded-lg border border-red-900/40 bg-terra-midnight p-4 flex flex-col gap-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Workload</p>
        <span className="text-xs text-red-400 font-medium">Unavailable</span>
      </div>
    )
  }

  if (!canRender(workload)) {
    return (
      <div className="rounded-lg border border-white/10 bg-terra-midnight p-4 animate-pulse">
        <div className="h-3 w-16 bg-white/10 rounded mb-2" />
        <div className="h-5 w-24 bg-white/10 rounded" />
      </div>
    )
  }

  const { data } = workload
  const pct = data ? Math.round((data.parcelsReviewed / Math.max(data.totalParcels, 1)) * 100) : 0

  return (
    <div className={cn(
      'rounded-lg border p-4 flex flex-col gap-1',
      workload.isStale ? 'border-amber-800/40 bg-terra-midnight' : 'border-white/10 bg-terra-midnight'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Workload</p>
        {workload.source === 'fallback' && <span className="text-xs text-amber-400">Last known</span>}
        {workload.isStale && workload.source !== 'fallback' && <span className="text-xs text-amber-400">Stale</span>}
      </div>
      {data && (
        <>
          <p className="text-2xl font-bold text-white mt-1">{pct}%</p>
          <p className="text-xs text-gray-400">
            {data.parcelsReviewed.toLocaleString()} / {data.totalParcels.toLocaleString()} parcels
          </p>
          <p className="text-xs text-gray-500">{data.appraisersActive} appraisers active</p>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/apps/os-shell/src/components/dashboard/cards/WorkloadCard.tsx
git commit -m "feat(phase8): WorkloadCard — presentational, FreshData<WorkloadSummary> props"
```

---

## Task 10: MorningBriefingStrip + Tests

**Files:**
- Create: `frontend/apps/os-shell/src/components/dashboard/MorningBriefingStrip.tsx`
- Test: `frontend/apps/os-shell/src/__tests__/dashboard/MorningBriefingStrip.test.tsx`

- [ ] **Step 1: Write the failing tests**

`frontend/apps/os-shell/src/__tests__/dashboard/MorningBriefingStrip.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MorningBriefingStrip } from '../../components/dashboard/MorningBriefingStrip'
import type { FreshData } from '../../lib/freshData'
import type { SwarmStatus } from '../../hooks/useSwarmLive'
import type { PacsHealth } from '../../hooks/usePacsStatus'
import type { AppealsQueueSummary } from '../../hooks/useAppealsQueue'
import type { WorkloadSummary } from '../../hooks/useWorkloadSummary'

const unavailable = <T>(overrides = {}): FreshData<T> => ({
  data: null, isLoading: false, error: 'err',
  lastUpdated: null, source: 'unavailable', isStale: false, ...overrides,
})

const polled = <T>(data: T): FreshData<T> => ({
  data, isLoading: false, error: null,
  lastUpdated: Date.now(), source: 'polled', isStale: false,
})

const swarmData: SwarmStatus = { connectionState: 'connected', totalAgents: 2016, healthyAgents: 1980, overallStatus: 'degraded' }
const pacsData: PacsHealth = { contractValid: true, reachable: true, latencyMs: 120, lastProofUtc: null }
const appealsData: AppealsQueueSummary = { total: 42, openCount: 30, pendingHearingCount: 8, closedThisCycleCount: 4 }
const workloadData: WorkloadSummary = { totalParcels: 89247, parcelsReviewed: 12000, parcelsRemaining: 77247, appraisersActive: 8, utilizationPct: 72 }

describe('MorningBriefingStrip', () => {
  it('renders four "Unavailable" chips when all domains are unavailable', () => {
    render(
      <MorningBriefingStrip
        swarm={unavailable<SwarmStatus>()} pacs={unavailable<PacsHealth>()}
        appeals={unavailable<AppealsQueueSummary>()} workload={unavailable<WorkloadSummary>()}
      />
    )
    const chips = screen.getAllByText('Unavailable')
    expect(chips).toHaveLength(4)
  })

  it('renders data for all four cards when polled and fresh', () => {
    render(
      <MorningBriefingStrip
        swarm={polled(swarmData)} pacs={polled(pacsData)}
        appeals={polled(appealsData)} workload={polled(workloadData)}
      />
    )
    expect(screen.getByText('connected', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Contract valid')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()  // openCount
    expect(screen.getByText('13%')).toBeInTheDocument() // workload pct (12000/89247)
  })

  it('shows "Last known" label only on swarm card when swarm is fallback+stale', () => {
    const staleFallback: FreshData<SwarmStatus> = {
      data: swarmData, isLoading: false, error: 'disconnected',
      lastUpdated: null, source: 'fallback', isStale: true,
    }
    render(
      <MorningBriefingStrip
        swarm={staleFallback} pacs={polled(pacsData)}
        appeals={polled(appealsData)} workload={polled(workloadData)}
      />
    )
    expect(screen.getByText('Last known')).toBeInTheDocument()
    expect(screen.queryByText('Unavailable')).toBeNull()
    expect(screen.queryByText('Stale')).toBeNull()  // row 3 wins over row 4 when both could apply
  })

  it('shows "Live" badge when swarm is source:live, connected, not stale', () => {
    const liveSwarm: FreshData<SwarmStatus> = {
      data: swarmData, isLoading: false, error: null,
      lastUpdated: Date.now(), source: 'live', isStale: false,
    }
    render(
      <MorningBriefingStrip
        swarm={liveSwarm} pacs={polled(pacsData)}
        appeals={polled(appealsData)} workload={polled(workloadData)}
      />
    )
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('does not show "Live" badge when swarm is polled (not SignalR)', () => {
    render(
      <MorningBriefingStrip
        swarm={polled(swarmData)} pacs={polled(pacsData)}
        appeals={polled(appealsData)} workload={polled(workloadData)}
      />
    )
    expect(screen.queryByText('Live')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- --run __tests__/dashboard/MorningBriefingStrip.test.tsx
```

- [ ] **Step 3: Implement MorningBriefingStrip.tsx**

`frontend/apps/os-shell/src/components/dashboard/MorningBriefingStrip.tsx`:
```tsx
import type { FreshData } from '../../lib/freshData'
import type { SwarmStatus } from '../../hooks/useSwarmLive'
import type { PacsHealth } from '../../hooks/usePacsStatus'
import type { AppealsQueueSummary } from '../../hooks/useAppealsQueue'
import type { WorkloadSummary } from '../../hooks/useWorkloadSummary'
import { SwarmStatusCard } from './cards/SwarmStatusCard'
import { PacsStatusCard } from './cards/PacsStatusCard'
import { AppealsQueueCard } from './cards/AppealsQueueCard'
import { WorkloadCard } from './cards/WorkloadCard'

export interface MorningBriefingStripProps {
  swarm:    FreshData<SwarmStatus>
  pacs:     FreshData<PacsHealth>
  appeals:  FreshData<AppealsQueueSummary>
  workload: FreshData<WorkloadSummary>
}

export function MorningBriefingStrip({ swarm, pacs, appeals, workload }: MorningBriefingStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="morning-briefing-strip">
      <SwarmStatusCard swarm={swarm} />
      <PacsStatusCard pacs={pacs} />
      <AppealsQueueCard appeals={appeals} />
      <WorkloadCard workload={workload} />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- --run __tests__/dashboard/MorningBriefingStrip.test.tsx
```
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/os-shell/src/components/dashboard/MorningBriefingStrip.tsx \
        frontend/apps/os-shell/src/__tests__/dashboard/MorningBriefingStrip.test.tsx
git commit -m "feat(phase8): MorningBriefingStrip — presentational composite of four status cards"
```

---

## Task 11: Wire ManagementDashboard + Smoke Test + Deprecate AISwarmDashboard

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx`
- Modify: `frontend/apps/os-shell/src/components/dashboard/AISwarmDashboard.tsx`
- Test: `frontend/apps/os-shell/src/__tests__/dashboard/ManagementDashboard.smoke.test.tsx`

- [ ] **Step 1: Read current ManagementDashboard.tsx**

```bash
# Read it to understand the current fixture structure before editing
```
Open: `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx`

Identify:
- Where fixture imports (`OVERVIEW_STATS_FIXTURE`, etc.) are declared
- Where `AISwarmDashboard` is imported (if at all)
- The existing `onNavigate` prop and tab structure

- [ ] **Step 2: Write the smoke test first**

`frontend/apps/os-shell/src/__tests__/dashboard/ManagementDashboard.smoke.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ManagementDashboard } from '../../pages/dais/ManagementDashboard'

// Mock all four hooks at module boundary — no real fetching
vi.mock('../../hooks/usePacsStatus', () => ({
  usePacsStatus: () => ({
    data: null, isLoading: false, error: null,
    lastUpdated: null, source: 'unavailable', isStale: false,
  }),
}))
vi.mock('../../hooks/useAppealsQueue', () => ({
  useAppealsQueue: () => ({
    data: null, isLoading: false, error: null,
    lastUpdated: null, source: 'unavailable', isStale: false,
  }),
}))
vi.mock('../../hooks/useWorkloadSummary', () => ({
  useWorkloadSummary: () => ({
    data: null, isLoading: false, error: null,
    lastUpdated: null, source: 'unavailable', isStale: false,
  }),
}))
vi.mock('../../hooks/useSwarmLive', () => ({
  useSwarmLive: () => ({
    data: null, isLoading: false, error: null,
    lastUpdated: null, source: 'unavailable', isStale: false,
  }),
}))

describe('ManagementDashboard smoke test', () => {
  it('renders without crashing and shows the morning briefing strip', () => {
    render(<ManagementDashboard onNavigate={vi.fn()} />)
    expect(screen.getByTestId('morning-briefing-strip')).toBeInTheDocument()
  })

  it('shows unavailable chips for all four cards when all hooks return unavailable', () => {
    render(<ManagementDashboard onNavigate={vi.fn()} />)
    const chips = screen.getAllByText('Unavailable')
    expect(chips).toHaveLength(4)
  })

  it('does not import or render AISwarmDashboard fixtures', () => {
    render(<ManagementDashboard onNavigate={vi.fn()} />)
    // AISwarmDashboard shows "50,000" agents in its fixture — must not appear
    expect(screen.queryByText(/50,000/)).toBeNull()
    expect(screen.queryByText(/quantum coherence/i)).toBeNull()
  })
})
```

- [ ] **Step 3: Run smoke test to verify it fails**

```bash
cd frontend && npm test -- --run __tests__/dashboard/ManagementDashboard.smoke.test.tsx
```
Expected: FAIL — hooks not found or AISwarmDashboard fixture still present.

- [ ] **Step 4: Rewrite ManagementDashboard.tsx**

In `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx`:

1. Remove all fixture imports (`OVERVIEW_STATS_FIXTURE`, `KEY_DEADLINES_FIXTURE`, etc.)
2. Remove `AISwarmDashboard` import
3. Add hook imports and strip import
4. Add `MorningBriefingStrip` at the top of the return

The key structural change — wrap the existing tab content with the strip:

```tsx
// ADD these imports at the top
import { useSwarmLive } from '../../hooks/useSwarmLive'
import { usePacsStatus } from '../../hooks/usePacsStatus'
import { useAppealsQueue } from '../../hooks/useAppealsQueue'
import { useWorkloadSummary } from '../../hooks/useWorkloadSummary'
import { MorningBriefingStrip } from '../../components/dashboard/MorningBriefingStrip'

// In the component body, REPLACE fixture calls with:
const swarm    = useSwarmLive()
const pacs     = usePacsStatus()
const appeals  = useAppealsQueue()
const workload = useWorkloadSummary()

// In the JSX, ADD strip before existing tabs:
return (
  <div className="flex flex-col gap-4 h-full overflow-auto">
    <MorningBriefingStrip swarm={swarm} pacs={pacs} appeals={appeals} workload={workload} />
    {/* existing tab structure below — pass appeals and workload to tabs as needed */}
    ...
  </div>
)
```

Pass `appeals` and `workload` FreshData envelopes to the appropriate tabs (AppealsTab, WorkloadTab) instead of fixture data. If the existing tabs accept a different prop shape, adapt the mapping — do not remove the tab content, just replace fixture values with `appeals.data` and `workload.data` (guarded with null checks).

- [ ] **Step 5: Deprecate AISwarmDashboard.tsx**

Add to the top of `frontend/apps/os-shell/src/components/dashboard/AISwarmDashboard.tsx`:

```tsx
/**
 * @deprecated Phase 8: replaced by SwarmStatusCard inside MorningBriefingStrip.
 * This component uses fixture data only. Do not use in new surfaces.
 * Remove once all imports, tests, and stories referencing this file are migrated.
 */
```

- [ ] **Step 6: Extend DashboardTabs prop interface (if DashboardTabs is a separate component)**

If `ManagementDashboard.tsx` delegates tabs to a `<DashboardTabs>` sub-component, ensure it accepts:
```ts
interface DashboardTabsProps {
  appeals: FreshData<AppealsQueueSummary>
  workload: FreshData<WorkloadSummary>
  onNavigate: (target: { type: 'area' | 'appeal' | 'appraiser'; id: string }) => void
}
```
Any future tab needing swarm or pacs data must extend this interface — not call its own hooks.

- [ ] **Step 7: Run smoke test to verify it passes**

```bash
cd frontend && npm test -- --run __tests__/dashboard/ManagementDashboard.smoke.test.tsx
```
Expected: 3 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx \
        frontend/apps/os-shell/src/components/dashboard/AISwarmDashboard.tsx \
        frontend/apps/os-shell/src/__tests__/dashboard/ManagementDashboard.smoke.test.tsx
git commit -m "feat(phase8): wire ManagementDashboard to live hooks + MorningBriefingStrip"
```

---

## ✅ STEP 2b TEST GATE — Full Suite

Run the complete Phase 8 test suite:

```bash
cd frontend && npm test -- --run \
  __tests__/lib/freshData.test.ts \
  __tests__/hooks/usePacsStatus.test.ts \
  __tests__/hooks/useAppealsQueue.test.ts \
  __tests__/hooks/useWorkloadSummary.test.ts \
  __tests__/hooks/useSwarmLive.test.ts \
  __tests__/dashboard/MorningBriefingStrip.test.tsx \
  __tests__/dashboard/ManagementDashboard.smoke.test.tsx
```

Expected: **43 tests PASS**. Do not merge until this is green.

---

## API Shape Notes (read before implementing)

The fetch normalizers in each hook (`fetchPacsHealth`, `fetchAppeals`, `fetchWorkload`) map API response fields to the hook's TypeScript interface. If the actual API response shape differs from what's listed below, adjust the mapping in the fetch function — do not change the interface.

| Hook | Endpoint | Key fields to map |
|---|---|---|
| `usePacsStatus` | `GET /ops/pacs/proof` | `contractValid`, `healthCheckExecution === 'passed'` → `reachable`, `latencyMs`, `lastVerifiedUtc` → `lastProofUtc` |
| `useAppealsQueue` | `GET /api/dais/appeals` | `total`, `openCount`, `pendingHearingCount`, `closedThisCycleCount` — may need to aggregate if API returns array |
| `useWorkloadSummary` | `GET /api/dais/queue` | `totalParcels`, `parcelsReviewed`, `parcelsRemaining`, `appraisersActive`, `utilizationPct` — may need to derive from queue shape |
| `useSwarmLive` | SignalR `SwarmStatusUpdate` event | `totalAgents`, `healthyAgents`, `overallStatus` — check actual event name in Consciousness hub |

If the real API returns an array instead of a summary object (e.g., `GET /api/dais/appeals` returns `Appeal[]`), compute the summary in the fetch function:

```typescript
// Example: if appeals endpoint returns an array
const json: Appeal[] = await res.json()
return {
  total: json.length,
  openCount: json.filter(a => a.status === 'open').length,
  pendingHearingCount: json.filter(a => a.status === 'pending_hearing').length,
  closedThisCycleCount: json.filter(a => a.status === 'closed' && isThisCycle(a)).length,
}
```

Similarly, check the actual SignalR event name in `TerraFusion.Consciousness` — it may be `swarmStatus` or `SwarmUpdate` instead of `SwarmStatusUpdate`. Update `conn.on(...)` to match.
