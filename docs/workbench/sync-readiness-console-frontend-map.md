# Sync Readiness Console — Frontend Shell Map

**Slice:** OPS-1-B-PREP (docs-only — read-only survey of the
existing `frontend/apps/os-shell/` structure so OPS-1-B can
implement the Sync Readiness Console without inventing
patterns.).

**Status:** docs-only. Pins the route registration, page
location, API client, auth/session, design tokens, and test
patterns OPS-1-B will use. Does NOT add code.

**Authoritative cross-references:**

- `docs/workbench/sync-readiness-console-policy.md` — OPS-1
  policy (six pinned questions, hard guards, test matrix).
- `docs/workbench/sync-readiness-console-wireframe.md` — OPS-1
  wireframe (panel layout, status colors, interaction model).
- `frontend/CLAUDE.md` — frontend-wide development guide.

## Where the Sync Readiness route slots in

### Router registration

The shell mounts every authenticated route under the persistent
chrome layout in `frontend/apps/os-shell/src/Router.tsx`:

```tsx
<Route path='/' element={<App />}>
  <Route index element={null} />
  <Route path='property' element={<PropertySearch />} />
  <Route path='property/:parcelId' element={<PropertyWorkbench />}>
    <Route index element={<PropertySummary />} />
    <Route path='forge' element={<PropertyForge />} />
    {/* ... */}
  </Route>
  <Route path='forge' element={<ForgeHome />} />
  <Route path='atlas' element={<AtlasHome />} />
  <Route path='dais' element={<DaisHome />} />
  {/* OPS-1-B will add: */}
  <Route path='workbench/sync-readiness' element={<SyncReadinessConsole />} />
</Route>
```

**Decision pinned:** the route slug is `workbench/sync-readiness`
under the persistent `<App>` chrome layout. This places the
console in the same shell-chrome family as the existing
parcel-context Workbench (`property/:parcelId`) without
nesting under it (the console is OS-level, not parcel-context).

### Lazy load + Suspense

Every existing page lazy-loads:

```tsx
const PropertyWorkbench = lazy(() => import('./pages/workbench/PropertyWorkbench'));
const ForgeHome = lazy(() => import('./pages/suites/ForgeHome'));
```

OPS-1-B adds:

```tsx
const SyncReadinessConsole = lazy(() =>
  import('./pages/workbench/sync-readiness/SyncReadinessConsole'));
```

The shell's `<Suspense fallback={<LoadingFallback />}>` already
wraps everything, so no per-route Suspense boundary is needed.

## File layout (OPS-1-B target)

```text
frontend/apps/os-shell/src/
  pages/
    workbench/
      sync-readiness/                     ← new
        SyncReadinessConsole.tsx          ← page entry
        ScopeSelectorForm.tsx             ← empty-state form
        ReadinessPanel.tsx                ← reusable panel renderer
        StatusBadge.tsx                   ← YES/WARN/NO/UNKNOWN circle
        useSyncReadiness.ts               ← TanStack Query hook
        __tests__/
          SyncReadinessConsole.test.tsx
          ReadinessPanel.test.tsx
          StatusBadge.test.tsx
  api/
    workbenchSyncReadiness.ts             ← API client (new)
```

This mirrors `pages/workbench/` (existing parcel hub) for path
consistency, and `pages/forge/cost/` for the multi-component
sub-page pattern (Dashboard / RatioAnalysis / etc. each get
their own .tsx file in a feature folder).

## API client pattern

### Reference: `src/api/canonPing.ts`

Existing API clients follow a compact pattern:

```ts
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

export interface FooResponse { /* ... */ }

export async function callFoo(input: FooInput): Promise<FooResponse> {
  const url = `${API_BASE_URL}/api/foo`;
  const response = await fetch(url, { method: 'GET', /* ... */ });
  if (!response.ok) {
    return failureResponse(response.statusText);
  }
  return response.json();
}
```

### OPS-1-B target

```ts
// src/api/workbenchSyncReadiness.ts
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

// Types mirror the OPS-1-A backend DTOs verbatim:
export interface SyncReadinessDto { /* ...six panels... */ }
export interface SyncReadinessRefreshDto { readiness: SyncReadinessDto; /* ... */ }

export async function getSyncReadiness(
  countyId: string,
  sourceConnectionId: string,
  workbookId?: string,
): Promise<SyncReadinessDto> {
  const params = new URLSearchParams({ countyId, sourceConnectionId });
  if (workbookId) params.set('workbookId', workbookId);
  const r = await fetch(`${API_BASE_URL}/api/workbench/sync-readiness?${params}`);
  if (!r.ok) throw new Error(`GET sync-readiness failed: ${r.status}`);
  return r.json();
}

export async function refreshSyncReadiness(
  countyId: string,
  sourceConnectionId: string,
  workbookId: string,
): Promise<SyncReadinessRefreshDto> {
  const params = new URLSearchParams({ countyId, sourceConnectionId, workbookId });
  const r = await fetch(`${API_BASE_URL}/api/workbench/sync-readiness/refresh?${params}`, {
    method: 'POST',
  });
  if (!r.ok) throw new Error(`POST sync-readiness/refresh failed: ${r.status}`);
  return r.json();
}
```

Note: `getViteEnv().VITE_API_URL` returns empty string when the
Vite proxy is in use; the proxy then routes `/api/*` to the
.NET backend on port 5000. No CORS configuration needed for dev.

## TanStack Query usage

### Reference: `pages/forge/cost/CostForgeDashboard.tsx`

TanStack Query is the data-fetch layer for server state:

```tsx
import { useQuery } from '@tanstack/react-query';

const { data: stats, isLoading } = useQuery<DashboardStats>({
  queryKey: ['cost-forge', 'dashboard-stats'],
  queryFn: () => fetch('/api/...').then(r => r.json()),
});
```

### OPS-1-B target

```tsx
// src/pages/workbench/sync-readiness/useSyncReadiness.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSyncReadiness, refreshSyncReadiness } from '@/api/workbenchSyncReadiness';

export function useSyncReadiness(
  countyId: string | null,
  sourceConnectionId: string | null,
  workbookId: string | null,
) {
  // Per OPS-1 policy: NO auto-refresh on page load. The query
  // fetches once on initial render (existing-artifact read);
  // refetch is operator-driven via the Refresh mutation.
  return useQuery({
    queryKey: ['sync-readiness', countyId, sourceConnectionId, workbookId],
    queryFn: () => getSyncReadiness(countyId!, sourceConnectionId!, workbookId ?? undefined),
    enabled: Boolean(countyId && sourceConnectionId),
    staleTime: Infinity,         // never auto-refetch
    refetchOnWindowFocus: false, // no probes on focus
    refetchInterval: false,      // no polling
  });
}

export function useSyncReadinessRefresh() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { countyId: string; sourceConnectionId: string; workbookId: string }) =>
      refreshSyncReadiness(args.countyId, args.sourceConnectionId, args.workbookId),
    onSuccess: (data, vars) => {
      qc.setQueryData(
        ['sync-readiness', vars.countyId, vars.sourceConnectionId, vars.workbookId],
        data.readiness);
    },
  });
}
```

## Auth / session pattern

### Reference: `src/auth/useSession.ts` + `useAuthContext.ts`

```ts
import { useSession } from '../../auth/useSession';

const session = useSession(); // { userId, countyId, role, mode }
```

The session carries the operator's default `countyId`. OPS-1-B
should:

1. Use `useSession()` to populate the scope-form's `countyId`
   default value.
2. NOT use the session's `countyId` as an implicit default if
   the URL params are absent — per the OPS-1 policy ("URL
   parameters; no implicit defaults"), the empty selector form
   should appear when URL params are missing, regardless of
   session.

Read flow:

```tsx
const session = useSession();
const [params] = useSearchParams();
const countyId = params.get('countyId');               // null if absent
const sourceConnectionId = params.get('sourceConnectionId'); // null if absent
const workbookId = params.get('workbookId');           // null if absent

// Pass to useSyncReadiness; hook is disabled when null.
const { data, isLoading } = useSyncReadiness(countyId, sourceConnectionId, workbookId);

// Scope-form initial-value override comes from session, not from
// implicit-default fallback at the data layer.
```

Auth guard (`AuthGuard`) wraps the entire `<Routes>` already.
OPS-1-B inherits this; no per-route auth wiring.

## Design tokens — status colors

### Authoritative tokens (from `terrafusion-tokens.css`)

```css
/* Status semantic tokens */
--tf-success: 140 22% 44%;      /* sage green — YES */
--tf-warning: 32 58% 50%;       /* warm amber — WARN (also forge brand) */
--tf-error: 4 55% 50%;          /* warm error red — NO */
--tf-muted: 33 14% 44%;         /* warm taupe — UNKNOWN */
--tf-info: 207 34% 50%;         /* warm slate blue — info accent */
```

Dark mode override (same variable names, different HSL):

```css
--tf-success: ...; --tf-warning: ...; --tf-error: ...; --tf-muted: ...;
```

### Existing utility classes (from `workbench-tokens.css`)

```css
.tf-status-success {   background: hsl(var(--tf-success) / 0.15); border-color: ...; color: hsl(var(--tf-success)); }
.tf-status-warning {   background: hsl(var(--tf-warning) / 0.15); border-color: ...; color: hsl(var(--tf-warning)); }
.tf-status-error   {   background: hsl(var(--tf-error)   / 0.15); border-color: ...; color: hsl(var(--tf-error));   }
.tf-status-info    {   background: hsl(var(--tf-info)    / 0.15); border-color: ...; color: hsl(var(--tf-info));    }
```

### Status → token mapping (binding for OPS-1-B)

| OPS-1 status | Token class       | CSS variable    | HSL (light) |
|--------------|-------------------|-----------------|-------------|
| YES          | `tf-status-success` | `--tf-success` | sage green   |
| WARN         | `tf-status-warning` | `--tf-warning` | warm amber   |
| NO           | `tf-status-error`   | `--tf-error`   | warm red     |
| UNKNOWN      | (inline `--tf-muted`)| `--tf-muted`  | warm taupe   |

The wireframe doc's `terra-green / terra-amber / terra-red /
terra-grey` color names are illustrative; OPS-1-B uses the
existing `tf-status-*` utility classes verbatim. No new tokens
introduced (per OPS-1 non-goals).

For the UNKNOWN state, no `tf-status-muted` utility exists — use
inline style `{ background: 'hsl(var(--tf-muted) / 0.15)', color:
'hsl(var(--tf-muted))', border: '1px solid hsl(var(--tf-muted) /
0.3)' }` or add a `.tf-status-muted` rule alongside the others.

## Panel and badge primitive patterns

### Reference: `src/components/workbench/`

The existing parcel-context Workbench composes from small
focused components (`ContextRibbon`, `WorkbenchRail`,
`ActivityFeed`). Each is in its own `.tsx` file with a
co-located `.test.tsx`.

### OPS-1-B targets

```tsx
// StatusBadge.tsx
type Status = 'YES' | 'WARN' | 'NO' | 'UNKNOWN';
export function StatusBadge({ status }: { status: Status }) {
  const className = `tf-status-${statusClassFor(status)}`;
  return (
    <span className={className} role='status' aria-label={`Status: ${status}`}>
      <span aria-hidden='true' className='inline-block w-2 h-2 rounded-full mr-2' />
      {status}
    </span>
  );
}
```

```tsx
// ReadinessPanel.tsx
export function ReadinessPanel({ panel, onDrillDown }: Props) {
  return (
    <section className='tf-panel p-4' aria-label={panel.headline}>
      <StatusBadge status={panel.status} />
      <h3 className='tf-text mt-2'>{panel.headline}</h3>
      {panel.detail && <p className='tf-text-secondary mt-1'>{panel.detail}</p>}
      {onDrillDown && <button onClick={onDrillDown}>▸ See sample</button>}
    </section>
  );
}
```

## Test patterns

### Reference: `src/components/workbench/ContextRibbon.test.tsx`

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
```

Stack:

- Test runner: **Vitest** (the test files use `vitest`'s `describe/it/vi` — earlier `frontend/CLAUDE.md` mentions Jest, but the in-tree pattern is Vitest now).
- Library: **@testing-library/react** + **@testing-library/jest-dom**.
- Mocks: `vi.fn()` / `vi.mock()`.

### OPS-1-B target test layout

```tsx
// SyncReadinessConsole.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { SyncReadinessConsole } from './SyncReadinessConsole';

// Mock the API client:
vi.mock('@/api/workbenchSyncReadiness', () => ({
  getSyncReadiness: vi.fn(),
  refreshSyncReadiness: vi.fn(),
}));

function renderWithProviders(ui: React.ReactElement, route = '/workbench/sync-readiness') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SyncReadinessConsole', () => {
  it('shows scope-form empty state when URL params missing', () => { /* ... */ });
  it('renders six panels when all URL params present', async () => { /* ... */ });
  it('does NOT auto-refresh on page load', () => { /* ... */ });
  // ... (the 8 OPS-1-B test gates from the policy)
});
```

## Existing related surfaces (read-only inventory)

| Surface                              | Path                                              | Relevance                                              |
|--------------------------------------|---------------------------------------------------|--------------------------------------------------------|
| Property Workbench (parcel hub)      | `pages/workbench/PropertyWorkbench.tsx`           | Peer chrome layout reference; not nested under it.    |
| Property Workbench tabs              | `pages/workbench/tabs/`                            | Pattern for sub-page composition.                     |
| Cost Forge dashboard                 | `pages/forge/cost/CostForgeDashboard.tsx`          | TanStack Query data-fetch reference.                  |
| Diagnostics API client               | `api/systemDiagnosticsApi.ts`                      | Larger API client reference (county federation).      |
| Canon ping API client                | `api/canonPing.ts`                                 | Compact API client reference (single endpoint).       |
| Workbench design tokens              | `styles/workbench-tokens.css`                      | `tf-panel`, `tf-text`, `tf-status-*` utility classes. |
| TerraFusion brand tokens             | `styles/terrafusion-tokens.css`                    | `--tf-success/warning/error/muted` HSL variables.     |
| Auth session                         | `auth/useSession.ts`, `auth/useAuthContext.ts`     | `userId / countyId / role / mode` source.             |
| Auth guard                           | `auth/AuthProvider.tsx`                            | Wraps `<Routes>` at Router level — inherited.         |

## Out of scope at this map

- Multi-county federation behavior beyond default-from-session
  (handled by existing `getCountyOption` in
  `systemDiagnosticsApi.ts`; the OPS-1 console is single-scope
  per the policy).
- Internationalization. The scope form labels are English.
  An `i18n` track exists (`frontend/apps/os-shell/src/i18n/`)
  but OPS-1-B does not engage it; an OPS-1-I18N slice can land
  later.
- WebSocket / SignalR push of readiness updates. Per the OPS-1
  policy, no auto-refresh / no polling. Push-driven readiness
  would be an OPS-2-PUSH slice if ever needed.
- Frozen-file constraints. The Sync Readiness Console route is
  new — no existing frozen file is touched. (Reminder per
  `frontend/CLAUDE.md`: `pages/suites/ForgeSuiteHome.tsx` is
  frozen at commit `8da26658a`; OPS-1-B does NOT touch it.)

## OPS-1-B execution checklist (binding)

When OPS-1-B lands, the implementation MUST:

1. Add `<Route path='workbench/sync-readiness' element={<SyncReadinessConsole />} />`
   under the existing `<App>` chrome route.
2. Add lazy import: `const SyncReadinessConsole = lazy(() =>
   import('./pages/workbench/sync-readiness/SyncReadinessConsole'));`.
3. Create the file layout under
   `pages/workbench/sync-readiness/` per the section above.
4. Implement the API client at `api/workbenchSyncReadiness.ts`
   per the pattern in `api/canonPing.ts`.
5. Use TanStack Query with `staleTime: Infinity`,
   `refetchOnWindowFocus: false`, `refetchInterval: false`.
6. Use `useSession()` for scope-form's countyId default.
7. Use the existing `tf-panel` / `tf-status-success/warning/error`
   utility classes for layout and status colors. Add a
   `tf-status-muted` rule to `workbench-tokens.css` if needed
   for the UNKNOWN state.
8. Use Vitest + @testing-library/react for the 8 OPS-1-B test
   gates (per the policy).
9. Do NOT touch the frozen ForgeSuiteHome.tsx.
10. Do NOT introduce new design tokens.
11. Do NOT auto-refresh, poll, or probe on page load.
12. Do NOT read backend artifact filesystem directly — only via
    the OPS-1-A endpoints.

## Acceptance for OPS-1-B-PREP

- [x] One file added at
  `docs/workbench/sync-readiness-console-frontend-map.md`.
- [x] Route registration pattern surveyed and target slot
  pinned.
- [x] File layout target pinned.
- [x] API client pattern surveyed (canonPing.ts as compact
  reference).
- [x] TanStack Query usage surveyed (CostForgeDashboard.tsx as
  reference); no-auto-refresh contract pinned.
- [x] Auth/session pattern surveyed (useSession.ts).
- [x] Design tokens surveyed; OPS-1 status → token mapping
  pinned to existing `tf-status-*` utility classes (no new
  tokens).
- [x] Test framework surveyed (Vitest + @testing-library); the
  test layout target pinned.
- [x] OPS-1-B execution checklist captured.
- [x] No code changes. No API changes. No token changes.
- [x] No new routes (the target slot is documented but not
  registered).

## Non-goals (explicit)

- OPS-1-B-PREP does not implement the console, the API client,
  the test suite, or the route registration. OPS-1-B does.
- OPS-1-B-PREP does not introduce new design tokens. OPS-1-B
  uses the existing `tf-status-*` utility family verbatim and
  adds a single `tf-status-muted` rule only if needed for
  UNKNOWN.
- OPS-1-B-PREP does not amend the OPS-1 policy or wireframe.
  Both remain authoritative.
- OPS-1-B-PREP does not survey or comment on non-Sync-Readiness
  shell surfaces beyond the patterns OPS-1-B will mimic.
