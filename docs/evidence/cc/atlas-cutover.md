# CC Lane Evidence: Atlas Cutover (Phase 3)

**Lane:** CC
**Date:** 2026-03-07
**Scope:** TerraAtlas — real tool invocation via `query_parcel_layers`, SVG map labeled as schematic, fallback data removed from atlasService.ts.

---

## Real Invocation via query_parcel_layers

`PropertyAtlas.tsx` invokes the `query_parcel_layers` tool through the governed pilot API path:

```
PropertyAtlas.tsx handleQueryLayers()
  -> invokeTool({ toolId: 'query_parcel_layers', params: { parcelId, layers, format } })
    -> pilotApi POST /pilot/invoke
    -> PilotController -> tool handler
```

The component:
1. Lets users select from 4 map layers (boundary, zoning, flood, aerial)
2. Calls `invokeTool()` imported from `pilotApi.ts` with `toolId: 'query_parcel_layers'`
3. Parses the response (handles both string and object `output`)
4. Displays results with correlation ID tracing
5. Maintains an invocation history via `InvocationHistory` component

Error handling covers both tool-level errors (response.error) and network errors, each generating a correlation ID for tracing.

---

## SVG Map Labeled as Schematic

The map visualization is a deterministic SVG generated from a parcelId hash (`getParcelPolygon()` function, line 75). It renders parcel boundary, zoning overlay, flood zone, and aerial imagery as geometric SVG shapes.

At line 173 of `PropertyAtlas.tsx`:

```tsx
<p className="tf-text-dim text-xs mt-1 text-center italic">
  Schematic representation — GIS integration planned for R2
</p>
```

This disclaimer is always visible below the map. The SVG is explicitly a schematic representation, not a GIS-accurate map. No fake GIS data or mock coordinate systems are presented as real.

---

## atlasService.ts: Fallback Removed (CC-13)

`atlasService.ts` line 119-121 contains the tombstone:

```
// NOTE: DEFAULT fallback data removed in CC-13 (R1 Week 3).
// All service methods now propagate errors from the real backend.
```

All service methods call the real backend with bearer auth:
- `getLayers()` -> `GET /api/atlas/layers`
- `searchParcels()` -> `POST /api/atlas/parcels/search`
- `getParcel()` -> `GET /api/atlas/parcels/{parcelId}`
- `getZoningDistricts()` -> `GET /api/atlas/zoning`
- `getFloodZones()` -> `GET /api/atlas/flood-zones`
- `getStats()` -> `GET /api/atlas/stats`

Authentication is handled via `authHeaders()` which reads the bearer token from `authStorage`. No fallback data, no hardcoded responses.

---

## Ticket Status

| Ticket | Description | Status |
|--------|-------------|--------|
| CC-ATL-01 | Real tool invocation via query_parcel_layers | **CLOSED** |
| CC-ATL-02 | SVG map labeled as schematic with R2 disclaimer | **CLOSED** |
| CC-ATL-03 | Fallback removal from atlasService.ts (CC-13) | **CLOSED** |

---

## Verification

- `tsc` passes
- `PropertyAtlas.tsx` imports `invokeTool` from `pilotApi` and calls with `toolId: 'query_parcel_layers'`
- Schematic disclaimer present at line 173
- No fallback data in atlasService.ts (CC-13 tombstone at line 119)
- No fake layer generation — SVG is explicitly labeled as non-GIS

---

**Files:**
- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx`
- `frontend/apps/os-shell/src/services/atlasService.ts`

**Verified by:** Claude Code (CC lane agent)
