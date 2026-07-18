# WO-ATLAS-004 - GeoForge Popup Content Safety Audit Evidence

## Verdict

**REPAIR REQUIRED.** Current main has eight `Popup.setHTML` calls that combine static markup with
dynamic feature properties. Those properties cross API/store boundaries and are not HTML authority.

## Exact Current-Main Inventory

| Surface | Line | Dynamic values crossing into HTML |
| --- | ---: | --- |
| `GeoForgeMap.tsx` | 111 | `neighborhoodCode`, `modeLabel`, `modeValue`, counts, simulation values |
| `GeoForgeMap.tsx` | 140 | `parcelId`, `saleDate`, `qualificationDecision`, sale/ratio values |
| `GeoForgeMap.tsx` | 156 | `parcelId`, assessed value |
| `GeoForgeMap.tsx` | 173 | `neighborhoodCode`, parcel count, AV change |
| `GeoForgeMap.tsx` | 192 | `neighborhoodCode`, sale count, price trend |
| `GeoForgeMap.tsx` | 213 | `neighborhoodCode`, counts, COD, ratio drift |
| `GeoForgeMap.tsx` | 230 | `codeA`, `codeB`, ratio cliff values |
| `GeoForgeV2Map.tsx` | 245 | `neighborhoodCode`, `grade`, median ratio, sale count |

The line numbers are from `origin/main` `60bc8fa951fd24a88555fce3e62ebf2d56896fb1`.

## Trust-Boundary Evidence

- V1 map feature properties are built from `neighborhoodStats`, `salePoints`, and responses from
  `/api/geoforge/neighborhoods/*` and `/api/geoforge/parcels/points`.
- V2 outlines and parcels are fetched from `/geoforge/v2/*` endpoints and pushed into Mapbox GeoJSON
  sources before popup handlers read `feature.properties`.
- Numeric conversion constrains some values, but identifiers, dates, grades, decisions, mode labels,
  and mode values remain raw strings.
- A malicious or malformed string such as `<img src=x onerror=alert(1)>` can therefore become DOM
  markup when passed to `setHTML`.

## Existing Proof Gap

- No focused GeoForge map test asserts popup content behavior.
- `CountyStudyPage.test.tsx` mocks `GeoForgeV2Map` and cannot prove popup safety.
- The PropertyAtlas hostile-input regression covers only `PropertyAtlas` and does not exercise Forge.
- No shared popup-content builder or escaping contract exists.

## Bounded Repair Contract

`WO-ATLAS-005` should use Mapbox `setDOMContent` with a static DOM builder:

1. construct markup structure in code;
2. put every dynamic value through `textContent`;
3. preserve the current visible labels, values, and color classification;
4. replace all eight current `setHTML` calls;
5. prohibit replacement through `innerHTML`, `outerHTML`, `DOMParser`, React
   `dangerouslySetInnerHTML`, or an ad hoc escape helper;
6. add hostile strings for identifiers, labels, dates, and decisions;
7. assert no injected element or event attribute is created; and
8. prove Mapbox receives DOM nodes through `setDOMContent`.

## Exact Proposed Implementation Scope

- `frontend/apps/os-shell/src/pages/forge/geo/GeoForgeMap.tsx`
- `frontend/apps/os-shell/src/pages/forge/geo/v2/GeoForgeV2Map.tsx`
- `frontend/apps/os-shell/src/pages/forge/geo/popupContent.ts`
- `frontend/apps/os-shell/src/pages/forge/geo/__tests__/popupContent.test.ts`
- bounded Brain active/evidence/routing files for WO-ATLAS-005

## Behavioral Invariants

- No valuation calculation or methodology changes.
- No GIS geometry, layer, provider, token, style, or renderer changes.
- No routing, persistence, county isolation, API contract, package, or lockfile changes.
- Existing popup labels and numeric formatting remain unchanged.
- The repair is presentation-safety only and is independently revertible.

## Risk

The defect is **major** because API-derived strings can cross into executable DOM markup. The repair
is bounded R3 frontend work because it changes presentation behavior on protected OS-shell files but
does not alter business semantics or protected data.

## Next

`WO-ATLAS-005 - GeoForge Popup DOM Safety Repair` is the highest-value dependency-cleared successor.

## Non-Claims

- This audit did not execute the map runtime or access live county data.
- No frontend, backend, package, lockfile, CI, deployment, county, PACS, SQL, secret, live-service, or
  production resource changed.
