# WO-P8-MGMT-003 — Sync Doctrine API Client Conformance Fix

**Work Order:** WO-P8-MGMT-003
**Program:** P8 — Management Dashboard
**Date:** 2026-07-01
**Mode:** Small code fix + focused tests + local live verification. No deploy, no new dashboard, no data mutation.
**Status:** COMPLETE — conformance fixed; single-config reachability proven
**Authority Boundary:** SW-01 NOT crossed (no deploy). SW-02 NOT crossed. SW-03 NOT crossed.

---

## 0. Result

`syncDoctrine.ts` now conforms to the canonical apiBase contract (Invariant B). With the fix, a
**single** `VITE_API_URL = <azure-origin>` lights up **every** surface at once — the split that
WO-P8-MGMT-002 documented is resolved. Verified live against the Azure demo API.

---

## 1. The Fix

**File:** `frontend/apps/os-shell/src/api/syncDoctrine.ts`

Before — hand-rolled base from `VITE_API_URL`, direct `fetch`, no `/api` prefix (bypassed the proxy):
```ts
const API_BASE_URL = getViteEnv().VITE_API_URL || '';
const url = `${API_BASE_URL}/sync/doctrine/state?recentGateLimit=${recentGateLimit}`;
const res = await fetch(url, { signal });
```

After — canonical helpers, bare paths (Invariant B), rides the relative `/api` proxy:
```ts
import { apiFetch, apiFetchJson } from '@/lib/apiBase';
return apiFetchJson<DoctrineState>(
  `/sync/doctrine/state?recentGateLimit=${recentGateLimit}`, { signal });
```

Applied to all four functions:
- `getDoctrineState` → `apiFetchJson('/sync/doctrine/state?…')`
- `getDoctrineLanes` → `apiFetchJson('/sync/doctrine/lanes')`
- `getDoctrineBatch` → `apiFetchJson('/sync/doctrine/batch/…')`
- `postDoctrineDrain` → `apiFetch('/sync/doctrine/drain/…')` — uses `apiFetch` (not `apiFetchJson`)
  to preserve its dual-envelope contract (same body on HTTP 200 Succeeded and HTTP 500 Failed).

Also: removed the now-unused `getViteEnv` import and `API_BASE_URL` constant. `apiFetch` additionally
attaches the dev/bearer token in the browser — a small correctness bonus for authenticated deploys.

Behavior preserved: same endpoints, same DTOs, same signal forwarding, same drain 200/500 handling.
No new dashboard, no UI change.

---

## 2. Focused Tests (new)

**File:** `frontend/apps/os-shell/src/api/__tests__/syncDoctrine.test.ts` (7 tests)

Mocks `@/lib/apiBase` and asserts path construction conforms to Invariant B:
- Each function calls the canonical helper with a **bare** `/sync/doctrine/*` path
- Path never starts with `/api` and is never an absolute `http(s)://` URL (the two failure modes
  from WO-P8-MGMT-002)
- Abort signal is forwarded via `init`
- `postDoctrineDrain` uses `apiFetch` and still parses the envelope on both HTTP 500 and HTTP 200

Result: **7/7 pass.** Broader regression run (doctrine console + dais areas): **32 files / 152
tests pass**, no regressions (only pre-existing `act()` warnings from an unrelated component).

---

## 3. Live Verification — Single Config (the proof)

Ran `frontend/apps/os-shell` locally with **one** value:
`VITE_API_URL = https://app-terrafusion-benton-demo.azurewebsites.net` (origin, no `/api`).

Network trace at `/workbench/sync-doctrine` — all through the relative `/api` proxy:

| Request | Status |
|---------|--------|
| `GET /api/sync/doctrine/state?recentGateLimit=25` | **200** (was direct-to-Azure `/sync/...` 401 before the fix) |
| `GET /api/system/health` | **200** |
| `GET /api/agents/status` · `GET /api/agents/events` | **200** |

Rendered live: OPERATIONAL — canonical rows 3,264,539; `tf_parcel 84,418`, `tf_sale 90,386`,
`tf_owner 97,062`; quarantine 2,053,173; counties bound 1; real batch history. The only 401 is
`/api/auth/dev-token` (expected/benign — dev-token endpoint absent on the demo; auth bypass handles it).

Contrast with WO-P8-MGMT-002 (pre-fix): `origin` made proxy clients work but the doctrine console
401'd; `origin/api` flipped it. **Post-fix: one config, all surfaces green.**

---

## 4. Honesty

No fabricated data. All rendered numbers trace to live `/api/sync/doctrine/state`. No agent counts,
no stale 89,247, no randomized metrics. The fix is a transport-conformance change only — it does not
touch what is displayed or its disclosure semantics.

---

## 5. Scope Adherence

| Item | Status |
|------|--------|
| Change `syncDoctrine.ts` to canonical apiFetch/buildApiUrl behavior | DONE |
| Preserve bare-path `/api` proxy convention (Invariant B) | DONE |
| Add focused tests for API path construction | DONE (7 tests) |
| Verify local os-shell vs Azure with ONE `VITE_API_URL` | DONE (proven §3) |
| No new dashboard / no Azure deploy / no launch / no county go-live | HELD |
| No DUPE-001B delete / no fake counts / no stale 89,247 | HELD |

---

## 6. Evidence Log

- Fix: `frontend/apps/os-shell/src/api/syncDoctrine.ts` (4 functions → canonical helpers)
- Tests: `frontend/apps/os-shell/src/api/__tests__/syncDoctrine.test.ts` (7/7 pass)
- Regression: 32 files / 152 tests pass (doctrine + dais areas)
- Live single-config run: `/api/sync/doctrine/state` 200 + `/api/system/health` 200 + agents 200,
  doctrine console rendered live (screenshot captured in session)
- Canonical contract: `frontend/apps/os-shell/src/lib/apiBase.ts` (Invariant B)

---

## 7. Next

Reachability is now single-config clean. The remaining P8 step is **WO-P8-MGMT-004 (or -003b):
deploy the os-shell frontend to the Azure demo (SW-01)** — the frontend can now be served with a
single `VITE_API_URL` (or, when served same-origin by the API, no `VITE_API_URL` at all). Requires
explicit operator authorization (crosses SW-01: changes public demo reachability).

**WO-P8-MGMT-003: COMPLETE.**
