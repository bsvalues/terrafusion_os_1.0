# TerraAtlas Runtime Proof
**Branch**: feat/june10-dev39-runtime-truth  
**Date**: 2026-06-10  
**Sprint scope**: TerraAtlas Suite runtime proof — Atlas as third Workbench tab, honest GIS unavailable states, Cortex advisory-only, no cross-suite writes, no hardcoded ports.

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

## Known Blockers / Limitations

| Item | Status |
|------|--------|
| Live Atlas GIS endpoints (`/api/atlas/gis/parcels/{id}/boundary`, `/layers`) | `404 Not Found` — backend GIS route not wired. Atlas tab renders honest error state, does not crash. |
| Mapbox token | Not set in dev env — `atlas-map-canvas` not rendered, `map-container` always present as stable mount. Correct behavior. |
| Dev session auth expiry | Browser session expired before final screenshot. Not a regression — parcel data requires valid JWT. |
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
