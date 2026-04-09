# Muse Routing Observatory — Design Spec

**Date:** 2026-04-09
**Status:** APPROVED — ready for implementation
**Branch target:** `data/comparable-sales-year-date-index`

---

## Problem Statement

The Muse AI router routes requests across multiple configured AI lanes (OpenAI, local Ollama, etc.). When a lane goes offline, requests fall back to static templates. Currently there is no frontend visibility into which lanes are live, degraded, or offline — an admin or developer has no ambient signal that Muse is operating in degraded mode.

The backend endpoint `GET /api/pilot/router/status` was shipped in PR #712 (`59006646e`). The frontend Observatory UI is the missing half.

---

## Placement Decision

**B — Panel above MuseChat in PilotHome, always visible.**

- Domain rationale: Router lane health is ops/admin information. The MuseChat surface must stay clean for appraisal work. Lane status is system state, not assessor state.
- Architecture rationale: PilotHome is the natural control surface for TerraPilot system-level status. A developer or admin opens the Pilot window and the Observatory is ambient — no navigation required.
- Over-engineering avoided: Standalone window (C) would require full window lifecycle management for a diagnostic widget.
- Placement: Above `<MuseChat />` in `PilotHome`, always rendered, not behind a tab.

---

## Architecture

### New files

| File | Responsibility |
|---|---|
| `frontend/apps/os-shell/src/hooks/useMuseLaneStatus.ts` | Polls `GET /api/pilot/router/status`, returns typed lane data, loading, error, and last-updated timestamp |
| `frontend/apps/os-shell/src/components/pilot/MuseRouterObservatory.tsx` | Renders the lane status panel — one card per lane, fallback banner, loading/error states |
| `frontend/apps/os-shell/src/__tests__/pilot/MuseRouterObservatory.test.tsx` | 5 unit tests |

### Modified files

| File | Change |
|---|---|
| `frontend/apps/os-shell/src/pages/PilotHome.tsx` | Import and render `<MuseRouterObservatory />` above `<MuseChat />` |

---

## Backend Contract

**Endpoint:** `GET /api/pilot/router/status`
**Auth:** `AllowAnonymous` (pure observability, no sensitive data)

**Response shape:**
```typescript
interface RouterStatusResponse {
  lanes: Record<string, LaneStatus>;
  fallbackActive: boolean;
}

interface LaneStatus {
  model: string;
  endpoint: string;
  live: boolean;
  latencyMs: number | null;
}
```

**Example response:**
```json
{
  "lanes": {
    "openai": { "model": "gpt-4o", "endpoint": "https://api.openai.com/v1", "live": true, "latencyMs": 234 },
    "local":  { "model": "llama-3.2", "endpoint": "http://localhost:11434/v1", "live": false, "latencyMs": null }
  },
  "fallbackActive": false
}
```

---

## Hook: `useMuseLaneStatus`

```typescript
interface MuseLaneStatusResult {
  lanes: Record<string, LaneStatus> | null;
  fallbackActive: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}
```

- Fetches on mount
- Polls every **30 seconds** (lane probing takes up to 3s per lane concurrently — no need to hammer the endpoint)
- Cleans up interval on unmount
- On fetch error: sets `error` string, retains last known `lanes` (stale-but-useful)
- Does NOT use any existing pilot API client — direct `fetch('/api/pilot/router/status')` to keep the hook self-contained and independently testable

---

## Component: `MuseRouterObservatory`

**Visual structure:**

```
┌─────────────────────────────────────────────────────┐
│ MUSE ROUTING OBSERVATORY          [last updated: xs] │
├──────────────┬──────────────┬──────────────┬─────────┤
│ openai       │ local        │ ...          │         │
│ gpt-4o       │ llama-3.2    │              │         │
│ ● LIVE 234ms │ ○ OFFLINE    │              │         │
└──────────────┴──────────────┴──────────────┴─────────┘
[FALLBACK ACTIVE — static templates in use] (only when fallbackActive: true)
```

**States:**
- **Loading (first load):** Skeleton/spinner, no lane cards yet
- **Loaded — all live:** Green indicator per lane, latency badge
- **Loaded — partial degraded:** Orange/red indicator on offline lanes, others green
- **Loaded — fallback active:** Red banner below lanes: "FALLBACK ACTIVE — Muse is using static templates"
- **Error:** Single error message row, retains last known lane data if available

**Design tokens:** Uses `--tf-*` terracotta system (no hardcoded colors). Live = success tone, offline = error tone, fallback banner = error tone.

**No user interaction** — read-only display. No buttons, no actions.

---

## Tests (5)

| # | Test name | What it asserts |
|---|---|---|
| 1 | renders all lanes from API response | All lane names appear in the DOM |
| 2 | shows healthy state | Live indicator shown, latency badge shown, no fallback banner |
| 3 | shows degraded state for offline lane | Offline indicator on the offline lane, live indicator on live lanes |
| 4 | shows fallback active banner | Banner renders when `fallbackActive: true` |
| 5 | shows loading state on first render | Loading indicator shown before first fetch resolves |

Tests use `vi.fn()` / `msw` handler or `global.fetch` mock. No real network calls.

---

## Success Criteria

1. `PilotHome` renders `<MuseRouterObservatory />` above `<MuseChat />`
2. Observatory polls `GET /api/pilot/router/status` every 30s
3. Each lane renders its name, model, live/offline status, and latency (or `—` if null)
4. Fallback banner appears when `fallbackActive: true`
5. Loading state shown on first render before data arrives
6. Error state shows message without crashing when endpoint is unreachable
7. All 5 tests pass
8. TypeScript compiles clean
9. UI token ratchet ≤ 764
