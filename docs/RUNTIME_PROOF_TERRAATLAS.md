# TerraAtlas Runtime Proof
**Branch**: feat/june10-dev39-runtime-truth  
**Date**: 2026-06-10  
**Final status**: ✅ **PROVEN CORE RUNTIME** (live Benton County GIS data)  
**Sprint scope**: TerraAtlas Suite runtime proof — Atlas as third Workbench tab, honest GIS unavailable states, Cortex advisory-only, no cross-suite writes, no hardcoded ports.

> **Status upgrade (2026-06-10):** This is no longer merely *VERIFIED BY TEST*. The Atlas GIS core API was driven against the live Postgres `terrafusion` database and returned **real Benton County parcel geometry** (`source: live`). The earlier `404` claims below were caused by a **stale API binary + placeholder parcel ID + Production DB-host misconfig**, not by missing TerraAtlas architecture. See **Live GIS Runtime Proof** and **Runtime Launch Truth** sections.

---

## Live GIS Runtime Proof (canonical)

**Canonical runtime smoke parcel**: `119802030006001` — **203 E 47TH PL, KENNEWICK, WA 99337** (owner *COX DONNA M*).

| Evidence | Result |
|----------|--------|
| `GET /health` | ✅ **200** |
| Real Postgres `terrafusion` DB reachable via `localhost:5432` | ✅ container `terrafusion-postgres-dev` (pgvector/pgvector:pg16) |
| `GisParcelGeometries` row count | ✅ **80,014** rows |
| Sampled rows have `RingJson` **and** centroids | ✅ 80,014 / 80,014 (all sampled) |
| `GET /api/atlas/gis/parcels/119802030006001/boundary` | ✅ **200**, `source: live` |
| `GET /api/atlas/gis/parcels/119802030006001` (combined) | ✅ **200**, `source: live` |
| Response includes real `RingJson` polygon (15 points) | ✅ |
| Response includes real centroid (`46.16697, -119.11561`, `derivedFrom: arcgis-centroid`) | ✅ |
| Response includes real situs / owner / area (`0.3271 ac`, `14,250 sqft`) | ✅ |
| Live `taxArea` (`K1`) and `landClass` (`primaryUseCd: 11`) layers | ✅ `source: live` |
| Flood layer | ⚠️ `source: stub` — FEMA enrichment gap (not a core blocker) |
| Zoning layer | ⚠️ `null` — honest, enrichment gap (not a core blocker) |

**Placeholder-ID correction:**
- `00AA00001129049` was a **placeholder fixture ID** and must **not** be used as runtime proof.
- `12345-001` is also **placeholder/demo** and must **not** be used as runtime proof.
- The canonical runtime smoke parcel is **`119802030006001`** unless a better real parcel is selected.

---

## Mandatory Gate Results

| Gate | Command | Result |
|------|---------|--------|
| Core governance gate | `node --test os-platform/core/tests/phase83-tools.test.mjs` | ✅ **56/56 pass, 0 fail** |
| Type-check | `pnpm --dir frontend run type-check` (tsc --noEmit) | ✅ **exit 0** |

---

## Frontend Test Results

Command:
```
pnpm --dir frontend exec vitest run \
  apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx \
  apps/os-shell/src/__tests__/workbench/workbench.contractGates.test.ts \
  apps/os-shell/src/__tests__/workbench/reservedOfficeGating.test.ts
```

| Test file | Tests | Result |
|-----------|-------|--------|
| `PropertyAtlas.test.tsx` | 12 | ✅ pass |
| `workbench.contractGates.test.ts` | 24 | ✅ pass |
| `reservedOfficeGating.test.ts` | 3 | ✅ pass |
| **Total** | **39** | ✅ **39/39 pass** |

Duration: 62s. Warnings: React Router v7 future flags (pre-existing, non-blocking).

---

## API Runtime State

| Check | Result |
|-------|--------|
| `GET http://127.0.0.1:5046/health` | `200 Healthy` — TerraFusion OS API, Development, v1.0.0 |
| Frontend dev server | Running on port `3103` (env-driven, no hardcoded port) |
| Static preview | Running on port `3102` (env-driven) |

---

## OS Shell Runtime Evidence (captured this session)

> **Note (placeholder correction):** The URLs in this section use the placeholder fixture ID `00AA00001129049`, which has **no GIS geometry** and must **not** be cited as live-data proof. They remain here only as a record of the OS-shell mount/honest-error behavior captured before the live-data proof. The authoritative live-data proof is the **Live GIS Runtime Proof** section above, using real parcel `119802030006001`.

**URL**: `http://127.0.0.1:3103/property/00AA00001129049/atlas`

- OS shell rendered: ✅ TerraFusion OS header visible
- Context bar: `Benton County` / `Assessor's Office` / `Runtime Pilot`
- System status: `SENTINEL · 16–32ms` (yellow/amber), `HEALTH` (green)
- Bottom launcher bar visible with: **Forge, Atlas, Dais, Dossier, GPT** icons

**Authentication state at time of final proof run**:  
Dev session token had expired by the time of the final screenshot attempt. The browser showed "Parcel data unavailable for parcel 12345-001" — a stale state from the previous route.  
**This is a known limitation of the static-preview flow and dev session expiry, not a code regression.** The `PropertyAtlas` component renders correctly under authentication (evidence from the session earlier confirmed `property-atlas-tab`, `map-container`, `atlas-geometry-disclosure`, and honest GIS error states for parcel `00AA00001129049`).

**Earlier runtime session evidence (same session, before auth expiry)**:
- Route `/property/00AA00001129049/atlas` mounted `PropertyAtlas` successfully
- Parcel address displayed from property store
- Tab order confirmed: Summary → Forge → **Atlas (3rd)** → Dais → Dossier → Pilot
- `map-container` rendered (stable mount point, always present)
- `atlas-map-canvas` count = 0 (correct — no Mapbox token in dev, no live centroid)
- `atlas-geometry-disclosure` rendered with honest copy
- GIS endpoints: 404 (live Atlas GIS not wired) — shown as honest error, not crash
- Source badge: "Non-live data" / "unavailable" (correct)
- `query_parcel_layers` and `explain_spatial_anomaly` buttons rendered; invocations produced honest failure states with correlationIds

---

## Design Token Compliance (changed file only)

Changed file: `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx`

| Violation removed | Before | After |
|-------------------|--------|-------|
| Hardcoded light-mode opacity | `text-white/70` | `tf-text-secondary` |
| Hardcoded light-mode opacity | `text-white/50` (×2) | `tf-text-dim` |
| Hardcoded light-mode opacity | `text-white/30` | `tf-text-muted` |
| Aspirational copy | "Full GIS geometry loads when a connected layer is available" | "Connected geometry is shown only when returned by the Atlas GIS response" |

---

## Hardcoded Port Audit (TerraAtlas files)

No hardcoded ports in `PropertyAtlas.tsx` or any Atlas-scope file changed this sprint. All service references go through `getEnv()`, `import.meta.env.VITE_*`, or the governed `invokeTool` API client.

---

## Cross-Suite Write Audit

`PropertyAtlas.tsx` does not write to any suite other than Atlas. It calls:
- `invokeTool({ toolId: 'query_parcel_layers', ... })` — read-only GIS query
- `invokeTool({ toolId: 'explain_spatial_anomaly', ... })` — read-only advisory
- No mutations, no writes to Forge/Dais/Dossier/Pilot data stores

---

## Cortex/Brain Advisory Compliance

No Cortex/Brain integration is present in the Atlas Workbench tab. The `explain_spatial_anomaly` tool returns an advisory finding with `recommendedAction` — it does not execute any action. Displayed as a recommendation panel only.

---

## Runtime Launch Truth

The earlier `404`/`401` false negatives were **launch/runtime truth defects**, not TerraAtlas architecture gaps. Root causes and fixes:

| Defect | Cause | Fix |
|--------|-------|-----|
| Auth/route false negative (`401` on `[AllowAnonymous]` GIS routes) | **Stale API binary** — the running `TerraFusion.API.exe` predated the `[AllowAnonymous]` attribute on the parcel routes | Rebuilt API (`dotnet build`, 0 errors); restarted. `401` → `200`. |
| Apparent missing endpoint | Mislabeled — routes `parcels/{id}/boundary`, `parcels/{id}/layers`, `parcels/{id}` **already exist** in `AtlasGisController.cs` | Confirmed by `401` (route registered), not `404` |
| DB DNS failure (`SocketException 11001 No such host is known`) | `--no-launch-profile` defaulted env to **Production**, loading `appsettings.Production.json` whose `DefaultConnection` uses **unsubstituted** `Host=${TF_DB_HOST}` | Relaunched with explicit `ASPNETCORE_ENVIRONMENT=Development` + `ConnectionStrings__DefaultConnection=Host=localhost;...;Port=5432` |
| GIS data "missing" | **Wrong parcel ID** — `00AA00001129049` is a placeholder fixture with no geometry | Used real GeoId `119802030006001` (one of 80,014 real parcels) |

**Launch contract for runtime proof:**
- The production launch command must explicitly set `ASPNETCORE_ENVIRONMENT=Development` **or** provide a valid `TF_DB_HOST` / `ConnectionStrings__DefaultConnection`.
- Do **not** use `dotnet run --no-launch-profile` without an explicit environment / connection-string override for local runtime proof.

---

## Known Blockers / Limitations

| Item | Status |
|------|--------|
| Live Atlas GIS endpoints (`/api/atlas/gis/parcels/{id}/boundary`, `/layers`, combined `/{id}`) | ✅ **PROVEN 200 with live data** for real parcel `119802030006001`. Routes exist in `AtlasGisController.cs` (`[AllowAnonymous]`). |
| Browser visual smoke | ⏳ Pending **only** if the browser session/JWT is expired. API runtime itself is proven. Navigate to `/property/119802030006001/atlas` (real GeoId), not a placeholder. |
| Mapbox live satellite rendering | ⚠️ **External/config-dependent** — `VITE_MAPBOX_ACCESS_TOKEN` absent. `atlas-map-canvas` not rendered; `map-container` always present as stable mount. Not a core runtime blocker. |
| FEMA flood layer | ⚠️ Enrichment/config gap — returns `source: stub`. Not a core runtime blocker. |
| Zoning layer | ⚠️ Enrichment/config gap — returns `null`. Not a core runtime blocker. |
| Dev session auth expiry (browser) | Parcel **detail** page requires a valid JWT. The Atlas GIS API routes themselves are `[AllowAnonymous]` and proven independent of JWT. |
| `pnpm run check:generated` | Fails due to `.tmp/worktrees/` ToolRegistry artifacts outside governance surface — pre-existing, unrelated to TerraAtlas. |
| Snyk security scan | Snyk tool not available in this Copilot session. Cannot produce scan result. |

---

## Non-TerraAtlas Governance Repair (kept, not claimed)

During the proof wall, Phase 83 was found stale at HEAD:
- Manifest `tools/registry/terrapilot.tools.json` contained **117 tools** (pre-sprint)
- `phase83-tools.test.mjs` expected **106** (stale assertion, pre-sprint)
- 11 manifest tools had no registered handler (pre-sprint gap)

These changes were retained to restore the mandatory governance gate. They are **not TerraAtlas feature scope** and are **not claimed as TerraAtlas product work**. See [TERRAATLAS_CHANGESET_BOUNDARY.md](./TERRAATLAS_CHANGESET_BOUNDARY.md) for full classification.

Files in governance repair:
- `os-platform/core/pilot/handlers.ts`
- `os-platform/core/pilot/handlers.js`
- `os-platform/core/tests/phase83-tools.test.mjs`
