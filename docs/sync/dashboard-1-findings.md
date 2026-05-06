# DASHBOARD-1 — Findings: Sync Doctrine Console (Operator UI)

**Slice:** DASHBOARD-1 (post-ATTR-POP-1). The frontend operator
status board for the doctrine pipeline. Renders
`/api/sync/doctrine/state` (shipped in #778) as panels following
the user's existing design language (tf-* utility classes, no new
tokens).

**Status:** SHIPPED. Three new files + one route registration.
Sibling to the existing `SyncReadinessConsole`. Type-check clean.

## What this is (and isn't)

**Is:** the read-only doctrine status board. One screen, structured
panels, polls `/api/sync/doctrine/state` every 30 seconds. Renders
canonical / quarantine / freshness / gate-failures / counties for
the operator at a glance.

**Isn't:** a closure trigger. The `Refresh` button forces a
data re-read, not a doctrine re-run. The closure trigger lives at
`/api/debug/doctrine-closure/run-all-lanes` (PR #777) — separate
surface, separate ergonomics.

## Why a sibling, not a replacement

The user has a pre-existing `SyncReadinessConsole` at
`/workbench/sync-readiness` that answers "is PACS reachable?" via
operator-driven probes. Per OPS-1 hard-guard: no auto-refresh, no
polling, no probes on page load. That console is for live PACS
state.

`/workbench/sync-doctrine` is a SIBLING for a different question:
"what's in our canonical layer?" The data source is TerraFusion's
own DB — DB reads, not PACS probes. 30s polling is appropriate
because the cost is one COUNT(*) per canonical table, not a
network call to a county system.

Both consoles share design language: tf-* utility classes,
panel-grid layout, AllowAnonymous routing for dev, single
operator-facing data-testid.

## Files shipped

- `frontend/apps/os-shell/src/api/syncDoctrine.ts`
  — fetch-based API client mirroring `workbenchSyncReadiness.ts`
  pattern. Three endpoints (state, lanes, batch detail) typed end-
  to-end. No axios; uses `getViteEnv().VITE_API_URL`.
- `frontend/apps/os-shell/src/pages/workbench/sync-doctrine/useDoctrineState.ts`
  — TanStack Query hook with `refetchInterval: 30_000`. Distinct
  from `useSyncReadiness` (which deliberately disables polling).
  The 30s cadence is documented inline with rationale.
- `frontend/apps/os-shell/src/pages/workbench/sync-doctrine/SyncDoctrineConsole.tsx`
  — page component. Eight panels:
  1. **Overall verdict** (full-width) — green if `operational`,
     yellow otherwise. Headline counts.
  2. **Canonical layer** — 9 terminal-table counts as a tabular list.
  3. **Quarantine** — 6 unproven-table counts; non-zero rows are
     highlighted with `tf-status-warning`.
  4. **Last completed per source-system** — sorted by recency,
     shows extracted/promoted counts.
  5. **Counties bound** — currently 1 (Benton); ready for multi-county.
  6. **Batch outcomes (all-time)** — PASS/FAIL/IN_PROGRESS counts.
  7. **Gate outcomes (all-time)** — PASS/FAIL/WARN counts with
     status-colored cells.
  8. **Recent gate failures** (full-width when present) — tabular
     list of FAIL/WARN rows with detail and timestamp.
- `frontend/apps/os-shell/src/Router.tsx`
  — adds `lazy()` import + `<Route path='workbench/sync-doctrine'>`
  next to the existing sync-readiness route.

## Design discipline (the rules I respected)

Per Agent A's pre-build research and the user's saved memory ("AI
agents keep ignoring my UI specs"):

- ✓ tf-* utility classes only (no raw `text-gray-*` / `bg-gray-*`)
- ✓ Mirror the existing `SyncReadinessConsole` page shape (Header
  + scope strip + button row + panel grid)
- ✓ tf-status-success / -warning / -error / -info for verdicts
- ✓ tf-panel for surfaces, tf-text / tf-text-secondary for typography
- ✓ Sized typography in `style={{ fontSize: '0.85rem' }}` matching
  the readiness console
- ✓ data-testid attributes for the operator-facing test harness
- ✓ Inline aria-label per section
- ✓ No new design tokens. No tabs. No modals.

## What changes when you visit it

Navigate to `/workbench/sync-doctrine` and the dashboard hydrates
from the doctrine status endpoint. The page reflects whatever the
backend reports: today's Benton dev DB shows green
(`operational: true`), with the 3,168 quarantined imprv_attr rows
visible and flagged amber until ops decides to drain.

If a closure run happens while the dashboard is open (e.g.
operator triggers `POST /api/debug/doctrine-closure/run-all-lanes`
from another tab), the next 30s poll picks up the new state and
the panels refresh in place.

## What's deliberately NOT here

- **No closure trigger button.** Triggering a doctrine run from
  the dashboard is a separate concern. The status board is
  read-only by design.
- **No batch-detail drilldown UI.** The endpoint exists
  (`/api/sync/doctrine/batch/{guid}`), but the modal/drawer/route
  for displaying it is a future slice. Today: clicking a gate-
  failure row could be wired by adding a single
  `<Link to={?id=batch_id}>` — left for the next iteration.
- **No multi-county switcher.** Today the panel renders all bound
  counties as a list. When N counties are bound, a switcher with
  per-county filters becomes useful — separate slice.
- **No SignalR push.** The doctrine pipeline doesn't broadcast
  state changes today. If/when promoters/projectors emit events,
  the polling can be replaced with a subscription.

## Re-open conditions for DASHBOARD-1

- The doctrine status endpoint adds new layers (e.g. multi-county,
  cross-county summaries) — the page must render them.
- The user's design language evolves (new tf-* tokens, new panel
  conventions) — this page should follow.
- Closure-trigger UX is added (button on the dashboard) — this
  page is the natural host.

## How to run

```bash
# Backend (terminal 1):
cd backend/src/TerraFusion.API
dotnet run

# Frontend (terminal 2):
cd frontend
npm run dev   # vite at port 3000
# Open http://localhost:3000/workbench/sync-doctrine
```

## The one-line summary

**DASHBOARD-1 shipped: sibling to the SyncReadinessConsole, polls
the doctrine state endpoint every 30s, renders eight panels using
the user's existing tf-* design language. No new tokens, no new
patterns — built to the spec, not invented.**
