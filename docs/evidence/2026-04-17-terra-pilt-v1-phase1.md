# Evidence Note — terra-pilt v1 Honest Surface, Phase 1

**Date:** 2026-04-17
**Branch:** `feat/native-app-integrations`
**Scope:** Phase 1 of AppFrame Wiring Plan task for `terra-pilt` (next app after CostForge).
**Classification:** Dev evidence, not code change.

## Summary

Started v1 honest-surface pass for `packages/terra-pilt` (pattern: CostForge v1).
Dominant finding: **the terra-pilt iframe frontend has never actually built** — the
client has 201 JSX corruption sites and a missing `lib/queryClient` import.
PR #708's "wire 11 apps via AppFrame" shipped a non-functional iframe for this module.

Phase 1 could not close with a green build. Phase 1 closed with scoped,
non-regressing improvements + a documented blocker for Phase 2.

## Ground Truth (runtime-verified + source-inspected)

### Two parallel PILT stacks exist

1. **Main backend (real)** — `backend/src/TerraFusion.API/Controllers/PiltController.cs`
   - Real Benton levy districts, real Hanford acreage (Assessor 2024)
   - 7 endpoints at `/api/pilt/*`
   - `[Authorize]` — JWT required

2. **Iframe app (broken)** — `packages/terra-pilt/`
   - Own Express server on port `5009` (package's `dev`/`start` hardcode this)
   - Own SQLite DB
   - Own `/api/pilt/*` routes (different contract than main backend)
   - Client fetches at hardcoded same-origin — cannot reach main backend as-is
   - **Frontend build fails**: 201 `</>` JSX corruption sites + missing `lib/queryClient.ts`

### Contract mismatch (iframe client → main backend)

| terra-pilt client fetch | Main backend PiltController | Status |
|---|---|---|
| `GET /api/pilt/districts?year=2024` | `GET /api/pilt/districts` | ✅ Param drop |
| `GET /api/pilt/history` (+ `?year=`) | `GET /api/pilt/receipts` | 🟡 Rename + shape |
| `GET /api/pilt/distribution?year=` | `GET /api/pilt/reports/{year}` | 🟡 Shape diff |
| `POST /api/pilt/generate-report` | `GET /api/pilt/reports/{year}` | 🟡 Verb + path |
| `GET /api/auth/user`, `POST /api/auth/login`, `POST /api/auth/logout` | Different auth stack (JWT) | 🔴 Full auth rework |
| `GET /api/reports/templates`, `POST /api/reports/generate` | ❌ missing | 🔴 Needs backend |
| `POST /api/etl/upload-csv` | ❌ missing | 🔴 Needs backend |
| `GET /api/health` | `GET /api/health` (different shape) | 🟡 Shape diff |

### Port alignment
- Plan spec: `5009`
- Package `dev`/`start`/production config: `5009`
- Registry before this session: `5179`  ← drift

## Changes Made (Phase 1)

### Code

- Added `packages/terra-pilt/client/src/lib/apiBase.ts` — `piltApiUrl(path)` utility.
  Precedence: `VITE_PILT_API_URL` > `VITE_MAIN_API_URL` > same-origin. Establishes
  the retarget seam for Phase 2 without requiring simultaneous shotgun edits.

- Added `packages/terra-pilt/client/src/lib/queryClient.ts` — restored the missing
  TanStack Query client that `App.tsx` and `hooks/use-auth.tsx` both import. The
  file was absent from the quarantined port; the build had been silently broken.

- Rewrote `packages/terra-pilt/client/src/App.tsx` —
  - Deleted `TestDashboard` (unused by any route; contained corrupted JSX and
    fabricated status claims: "✅ Database: SQLite initialized with 8 tables",
    "✅ Backend: Node.js server running on port 5009", etc. — all hardcoded strings)
  - Deleted unused `Router()` function
  - Deleted dead state (`apiStatus`, `districts`) that fetched but never rendered
  - Kept the real `App` component (Switch → ConsolidatedDashboard / BulkImport / Analytics / Monitor)

- Aligned `backend/service-registry.json` for `terra-pilt`: port `5179` → `5009`
  to match the package's own dev/prod scripts and the plan spec.

### Not Changed
- Retargeting of `/api/pilt/districts` via `piltApiUrl` was prepared and then
  dropped as net-zero: the only call site turned out to be inside the dead
  `TestDashboard`. The real consumers (`ConsolidatedDashboard`, `Reports`) fetch
  `/api/pilt/history`, `/api/pilt/distribution`, `/api/pilt/generate-report` —
  endpoints that **do not exist** on the main backend yet.

## Verification Status

- ❌ `npm run build` — still fails. Next blocker after `App.tsx`: `components/Footer.tsx:12`
  (same `</>` corruption pattern). 201 total corruption sites across the client.
- ❌ Runtime iframe render — not possible until build passes.
- ✅ `App.tsx` itself now parses cleanly (verified locally; build blocked by downstream files).
- ✅ Port alignment non-regressive (only changes an unused registry slot).
- ✅ New `lib/` files are additive; no existing import broken.

**Per runtime-verification standard: I am NOT claiming terra-pilt works. I am
claiming the scaffold for Phase 2 is in place and the fabrication strings in
the dead test component are gone.**

## Blocker for Phase 2

The 201 JSX corruption sites across `packages/terra-pilt/client/src/**/*.{tsx,jsx}`
prevent any further frontend work from being verified. The corruption pattern is
mechanical (`</> ` inserted between an opening tag name and its attributes) and
uniform — likely from an automated tool during the quarantine port.

### Phase 2 options (pick at start of next slice)

**Option A — Mechanical JSX repair**
Write a codemod that reverses the `<tag` + `</> attrs...>` → `<tag attrs...>`
pattern. Run across the 201 sites. Restore build. Then do contract retargeting.
- Cost: medium (codemod + spot review)
- Risk: low if pattern truly uniform

**Option B — Fresh re-port from QUARANTINE source**
`QUARANTINE/top-level-dirs/applications/terra-pilt-production/` is the original
source. Re-copy client only (preserve the Phase 1 additions to `lib/`), if
the source there is un-corrupted.
- Cost: low if source is clean
- Risk: may lose other fixes made since port

**Option C — Abandon iframe, render PILT in os-shell**
Delete `packages/terra-pilt/` frontend; build a `<PiltModule />` React component
in `frontend/apps/os-shell/src/pages/` that calls the real `PiltController` directly.
- Cost: highest (rewrite UI)
- Risk: lowest (honest outcome, no dead iframe ever)
- Aligns with CostForge pattern (`moduleId="costforge"` case uses a real
  `<CostForgeSurface />` React component, not an iframe)

**Recommendation:** Option B if source is clean (fastest). Otherwise Option C
(cleanest long-term — matches CostForge pattern exactly).

## Not In Scope (Phase 1)

- No changes to `os-platform/core/**` (per AGENTS.md Core Governance Surface).
- No changes to `frontend/apps/os-shell/` (AppFrame wiring stays as shipped).
- No JSX repair — explicitly deferred to Phase 2.
- No contract retargeting — blocked by build, also deferred.
- No auth rework — Phase 3 material.

## Files Touched

- **Added:** `packages/terra-pilt/client/src/lib/apiBase.ts`
- **Added:** `packages/terra-pilt/client/src/lib/queryClient.ts`
- **Modified:** `packages/terra-pilt/client/src/App.tsx` (removed 120+ lines of dead/corrupt code)
- **Modified:** `backend/service-registry.json` (terra-pilt port alignment)
- **Added:** `docs/evidence/2026-04-17-terra-pilt-v1-phase1.md` (this file)

## Compliance

- Core Governance Surface: **not touched** (allowed scope per `AGENTS.md`).
- Forbidden paths (`**/ARCHIVE/**`, `specialized/**`, `applications/**`, `ai-swarm/**`): **not touched**.
- Port discipline: **passed** (registry now reflects env-configurable port already
  used by the package; no new hardcoded ports introduced).
- Legacy frontend (`frontend/src/**`): **not touched**.
