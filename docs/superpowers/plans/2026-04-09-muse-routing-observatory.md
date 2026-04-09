# Muse Routing Observatory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Muse Routing Observatory UI — a lane-status panel that polls `GET /api/pilot/router/status` every 30s and renders above MuseChat in PilotHome.

**Architecture:** Three deliverables in order: (1) `useMuseLaneStatus` hook — isolated polling logic with no UI dependency, (2) `MuseRouterObservatory` component — consumes the hook, renders lane cards + fallback banner, (3) wire both into `PilotHome` above `MuseChat`. TDD throughout — write failing test, implement, verify pass.

**Tech Stack:** React 18, TypeScript 5, Vitest + @testing-library/react, `vi.spyOn` for component tests, `vi.useFakeTimers` for hook polling tests.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `frontend/apps/os-shell/src/hooks/useMuseLaneStatus.ts` | Create | Polls `/api/pilot/router/status`, returns typed state |
| `frontend/apps/os-shell/src/components/pilot/MuseRouterObservatory.tsx` | Create | Renders lane cards, fallback banner, loading/error states |
| `frontend/apps/os-shell/src/__tests__/hooks/useMuseLaneStatus.test.tsx` | Create | 4 hook tests (loading, lanes, error, polling) |
| `frontend/apps/os-shell/src/__tests__/pilot/MuseRouterObservatory.test.tsx` | Create | 5 component tests |
| `frontend/apps/os-shell/src/pages/PilotHome.tsx` | Modify | Import + render Observatory above MuseChat |

---

### Task 1: `useMuseLaneStatus` hook (TDD)

**Files:**
- Create: `frontend/apps/os-shell/src/hooks/useMuseLaneStatus.ts`
- Create: `frontend/apps/os-shell/src/__tests__/hooks/useMuseLaneStatus.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/apps/os-shell/src/__tests__/hooks/useMuseLaneStatus.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMuseLaneStatus } from '../../hooks/useMuseLaneStatus';

const MOCK_RESPONSE = {
  lanes: {
    openai: { model: 'gpt-4o', endpoint: 'https://api.openai.com/v1', live: true, latencyMs: 120 },
    local: { model: 'llama-3.2', endpoint: 'http://localhost:11434/v1', live: false, latencyMs: null },
  },
  fallbackActive: false,
};

describe('useMuseLaneStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts in loading state with null lanes', () => {
    const { result } = renderHook(() => useMuseLaneStatus());
    expect(result.current.loading).toBe(true);
    expect(result.current.lanes).toBeNull();
  });

  it('populates lanes and clears loading after fetch', async () => {
    const { result } = renderHook(() => useMuseLaneStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lanes).toEqual(MOCK_RESPONSE.lanes);
    expect(result.current.fallbackActive).toBe(false);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('sets error string on fetch failure, leaves lanes null', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network down'));
    const { result } = renderHook(() => useMuseLaneStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network down');
    expect(result.current.lanes).toBeNull();
  });

  it('polls every 30 seconds', async () => {
    const { result } = renderHook(() => useMuseLaneStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstUpdate = result.current.lastUpdated;
    await vi.advanceTimersByTimeAsync(30_000);
    await waitFor(() => expect(result.current.lastUpdated).not.toBe(firstUpdate));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
npm test -- __tests__/hooks/useMuseLaneStatus.test.tsx
```

Expected: 4 failures with "Cannot find module '../../hooks/useMuseLaneStatus'"

- [ ] **Step 3: Implement the hook**

Create `frontend/apps/os-shell/src/hooks/useMuseLaneStatus.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';

export interface LaneStatus {
  model: string;
  endpoint: string;
  live: boolean;
  latencyMs: number | null;
}

interface RouterStatusResponse {
  lanes: Record<string, LaneStatus>;
  fallbackActive: boolean;
}

export interface MuseLaneStatusResult {
  lanes: Record<string, LaneStatus> | null;
  fallbackActive: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const POLL_MS = 30_000;

export function useMuseLaneStatus(): MuseLaneStatusResult {
  const [lanes, setLanes] = useState<Record<string, LaneStatus> | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/pilot/router/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RouterStatusResponse = await res.json() as RouterStatusResponse;
      setLanes(data.lanes);
      setFallbackActive(data.fallbackActive);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch router status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
    timerRef.current = setInterval(() => void fetchStatus(), POLL_MS);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, []);

  return { lanes, fallbackActive, loading, error, lastUpdated };
}
```

- [ ] **Step 4: Run tests — verify all 4 pass**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
npm test -- __tests__/hooks/useMuseLaneStatus.test.tsx
```

Expected: 4 PASS, 0 fail.

- [ ] **Step 5: Commit**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git add frontend/apps/os-shell/src/hooks/useMuseLaneStatus.ts \
        frontend/apps/os-shell/src/__tests__/hooks/useMuseLaneStatus.test.tsx
git commit -m "$(cat <<'EOF'
feat(muse): useMuseLaneStatus hook — polls /api/pilot/router/status every 30s

4/4 tests green. Typed LaneStatus + RouterStatusResponse. Error retained as string,
stale lanes preserved on poll failure. Interval cleaned up on unmount.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `MuseRouterObservatory` component (TDD)

**Files:**
- Create: `frontend/apps/os-shell/src/components/pilot/MuseRouterObservatory.tsx`
- Create: `frontend/apps/os-shell/src/__tests__/pilot/MuseRouterObservatory.test.tsx`

- [ ] **Step 1: Write the 5 failing component tests**

Create `frontend/apps/os-shell/src/__tests__/pilot/MuseRouterObservatory.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MuseRouterObservatory } from '../../components/pilot/MuseRouterObservatory';
import * as museHookModule from '../../hooks/useMuseLaneStatus';
import type { MuseLaneStatusResult } from '../../hooks/useMuseLaneStatus';

const MOCK_LANES = {
  openai: { model: 'gpt-4o', endpoint: 'https://api.openai.com/v1', live: true, latencyMs: 234 },
  local: { model: 'llama-3.2', endpoint: 'http://localhost:11434/v1', live: false, latencyMs: null },
};

function mockHook(overrides: Partial<MuseLaneStatusResult>) {
  vi.spyOn(museHookModule, 'useMuseLaneStatus').mockReturnValue({
    lanes: null,
    fallbackActive: false,
    loading: false,
    error: null,
    lastUpdated: null,
    ...overrides,
  });
}

describe('MuseRouterObservatory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading indicator on first render before data arrives', () => {
    mockHook({ loading: true, lanes: null });
    render(<MuseRouterObservatory />);
    expect(screen.getByTestId('observatory-loading')).toBeDefined();
    expect(screen.queryByTestId('observatory-lanes')).toBeNull();
  });

  it('renders all lanes from API response', () => {
    mockHook({ lanes: MOCK_LANES });
    render(<MuseRouterObservatory />);
    expect(screen.getByTestId('lane-card-openai')).toBeDefined();
    expect(screen.getByTestId('lane-card-local')).toBeDefined();
  });

  it('shows healthy state: live indicator + latency badge for live lane', () => {
    mockHook({ lanes: MOCK_LANES });
    render(<MuseRouterObservatory />);
    expect(screen.getByTestId('lane-status-openai').className).toContain('muse-lane-dot--live');
    expect(screen.getByTestId('lane-latency-openai').textContent).toBe('234ms');
    expect(screen.queryByTestId('lane-latency-local')).toBeNull();
  });

  it('shows degraded state: offline indicator for offline lane', () => {
    mockHook({ lanes: MOCK_LANES });
    render(<MuseRouterObservatory />);
    expect(screen.getByTestId('lane-status-local').className).toContain('muse-lane-dot--offline');
  });

  it('shows fallback active banner when fallbackActive is true', () => {
    mockHook({ lanes: MOCK_LANES, fallbackActive: true });
    render(<MuseRouterObservatory />);
    expect(screen.getByTestId('observatory-fallback-banner')).toBeDefined();
    expect(screen.queryByTestId('observatory-fallback-banner')?.textContent).toContain('FALLBACK ACTIVE');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
npm test -- __tests__/pilot/MuseRouterObservatory.test.tsx
```

Expected: 5 failures with "Cannot find module '../../components/pilot/MuseRouterObservatory'"

- [ ] **Step 3: Implement the component**

Create `frontend/apps/os-shell/src/components/pilot/MuseRouterObservatory.tsx`:

```tsx
import React from 'react';
import type { LaneStatus } from '../../hooks/useMuseLaneStatus';
import { useMuseLaneStatus } from '../../hooks/useMuseLaneStatus';

function LaneCard({ name, lane }: { name: string; lane: LaneStatus }): React.ReactElement {
  return (
    <div
      data-testid={`lane-card-${name}`}
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        border: `1px solid ${lane.live ? 'hsl(var(--tf-success, 142 71% 45%))' : 'hsl(var(--tf-error, 0 72% 51%))'}`,
        background: 'hsl(var(--tf-bg))',
        minWidth: '140px',
        flex: '1 1 140px',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--tf-text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {name}
      </div>
      <div style={{ fontSize: '12px', color: 'hsl(var(--tf-text))', marginTop: '2px' }}>
        {lane.model}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
        <span
          data-testid={`lane-status-${name}`}
          className={`muse-lane-dot ${lane.live ? 'muse-lane-dot--live' : 'muse-lane-dot--offline'}`}
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: lane.live ? 'hsl(142 71% 45%)' : 'hsl(0 72% 51%)',
          }}
        />
        <span style={{ fontSize: '11px', color: 'hsl(var(--tf-text-muted))' }}>
          {lane.live ? 'LIVE' : 'OFFLINE'}
        </span>
        {lane.live && lane.latencyMs !== null && (
          <span
            data-testid={`lane-latency-${name}`}
            style={{ fontSize: '11px', color: 'hsl(var(--tf-text-muted))', marginLeft: 'auto' }}
          >
            {lane.latencyMs}ms
          </span>
        )}
      </div>
    </div>
  );
}

export function MuseRouterObservatory(): React.ReactElement {
  const { lanes, fallbackActive, loading, error, lastUpdated } = useMuseLaneStatus();

  return (
    <div
      data-testid="muse-router-observatory"
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid hsl(var(--tf-border, 30 20% 85%))',
        background: 'hsl(var(--tf-surface, 45 30% 97%))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'hsl(var(--tf-text-muted))', textTransform: 'uppercase' }}>
          Muse Routing Observatory
        </span>
        {lastUpdated && (
          <span style={{ fontSize: '10px', color: 'hsl(var(--tf-text-muted))' }}>
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {loading && !lanes && (
        <div data-testid="observatory-loading" style={{ fontSize: '12px', color: 'hsl(var(--tf-text-muted))' }}>
          Probing lanes…
        </div>
      )}

      {error && !lanes && (
        <div data-testid="observatory-error" style={{ fontSize: '12px', color: 'hsl(0 72% 51%)' }}>
          {error}
        </div>
      )}

      {lanes && (
        <div data-testid="observatory-lanes" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(lanes).map(([name, lane]) => (
            <LaneCard key={name} name={name} lane={lane} />
          ))}
        </div>
      )}

      {fallbackActive && (
        <div
          data-testid="observatory-fallback-banner"
          style={{
            marginTop: '8px',
            padding: '4px 10px',
            borderRadius: '4px',
            background: 'hsl(0 72% 51% / 0.1)',
            border: '1px solid hsl(0 72% 51% / 0.3)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'hsl(0 60% 40%)',
            letterSpacing: '0.04em',
          }}
        >
          FALLBACK ACTIVE — Muse is using static templates
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — verify all 5 pass**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
npm test -- __tests__/pilot/MuseRouterObservatory.test.tsx
```

Expected: 5 PASS, 0 fail.

- [ ] **Step 5: Commit**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git add frontend/apps/os-shell/src/components/pilot/MuseRouterObservatory.tsx \
        frontend/apps/os-shell/src/__tests__/pilot/MuseRouterObservatory.test.tsx
git commit -m "$(cat <<'EOF'
feat(muse): MuseRouterObservatory component — lane status panel

5/5 tests green. Lane cards with live/offline dot, latency badge.
Fallback active banner. Loading + error states. Terracotta tf-* tokens throughout.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Wire Observatory into PilotHome

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/PilotHome.tsx` (currently 17 lines)

- [ ] **Step 1: Replace PilotHome content**

Open `frontend/apps/os-shell/src/pages/PilotHome.tsx`. Replace the entire file with:

```tsx
/**
 * TerraFusion Pilot Home
 *
 * Renders the Muse Routing Observatory (ambient lane health) above the Muse
 * conversational AI interface. Full-bleed — no shell chrome wrapper.
 *
 * @module pages/PilotHome
 */

import React from 'react';
import { MuseRouterObservatory } from '../components/pilot/MuseRouterObservatory';
import { MuseChat } from './MuseChat';

export function PilotHome(): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <MuseRouterObservatory />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MuseChat />
      </div>
    </div>
  );
}

export default PilotHome;
```

- [ ] **Step 2: TypeScript compile check**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
npm run type-check
```

Expected: zero errors.

- [ ] **Step 3: Run all pilot tests together**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
npm test -- __tests__/pilot/ __tests__/hooks/useMuseLaneStatus.test.tsx
```

Expected: all 9 new tests pass (4 hook + 5 component) plus any pre-existing pilot tests that were passing before.

- [ ] **Step 4: Commit**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git add frontend/apps/os-shell/src/pages/PilotHome.tsx
git commit -m "$(cat <<'EOF'
feat(muse): wire MuseRouterObservatory into PilotHome above MuseChat

Observatory renders ambient lane health above the chat surface.
Pilot window is now: Observatory (top, fixed) + MuseChat (flex-fill below).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Verification Checklist

After all three tasks are committed:

- [ ] `PilotHome` renders `<MuseRouterObservatory />` above `<MuseChat />`
- [ ] Observatory shows lane cards for each key in the API response
- [ ] Each lane card shows name, model, live/offline dot, latency (or omits latency when null)
- [ ] Fallback banner appears when `fallbackActive: true`
- [ ] Loading indicator shown before first fetch resolves
- [ ] Error message shown when endpoint unreachable
- [ ] 9 tests green (4 hook + 5 component)
- [ ] TypeScript compiles clean
- [ ] UI token ratchet ≤ 764
