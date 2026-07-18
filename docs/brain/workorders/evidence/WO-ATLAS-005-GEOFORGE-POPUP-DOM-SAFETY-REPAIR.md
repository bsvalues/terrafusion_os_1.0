# WO-ATLAS-005 - GeoForge Popup DOM Safety Repair Evidence

## Verdict

**PASS.** The eight GeoForge popup sinks identified by WO-ATLAS-004 now use static DOM structure and
text-only feature values. The repair is presentation-safety work and does not change domain behavior.

## Implementation

- Added `popupContent.ts`, a typed DOM builder with explicit row and text-part structures.
- The builder creates elements with `document.createElement`, appends text nodes, and assigns styled
  span content with `textContent`.
- Replaced seven `setHTML` calls in `GeoForgeMap.tsx` and one in `GeoForgeV2Map.tsx` with
  `setDOMContent`.
- Preserved existing labels, numeric formatting, conditional rows, colors, and minimum widths.
- Added a focused hostile-input regression and a source contract covering all eight sinks.

## Security Proof

Distinct hostile identifier, label, date, and decision values containing `img`, `script`, `svg`, and
`a` markup remain literal text. Tests prove that no corresponding element, event attribute, or link
attribute is created. The source contract also proves:

- `setHTML` count across the two GeoForge map surfaces: **0**
- `setDOMContent` count across the two GeoForge map surfaces: **8**
- `innerHTML`, `outerHTML`, `DOMParser`, or `dangerouslySetInnerHTML` in the repair path: **0**

## Validation

| Validation | Result |
| --- | --- |
| Frozen dependency bootstrap | PASS; ignored `node_modules` only |
| `package.json` SHA-256 before/after | unchanged: `AE1B423C71421A30983D06D8F303E4B556E674F3551CBB226CF1F33AB500C0D6` |
| `pnpm-lock.yaml` SHA-256 before/after | unchanged: `D23687DD59C77E400D392DC99BB3F12308761377368D686528868C22615489A0` |
| Focused popup-content tests | PASS - 3 tests |
| Frontend type-check | PASS |
| Source safety scan | PASS - 0 HTML sinks, 8 DOM sinks, 0 forbidden parser APIs |
| `git diff --check` | PASS before commit |
| Work Order query | PASS before commit |

## Scope Proof

Frontend changes are limited to the two audited map files, the new DOM builder, and its focused test.
Remaining changes are bounded Brain active/evidence/routing records.

No backend, renderer package, provider, token, style, geometry, valuation methodology, routing,
persistence, API, package manifest, lockfile, CI, deployment, county, PACS, SQL, secret, live-service,
or production resource changed.

## Rollback

Revert the WO-ATLAS-005 squash merge. There is no data, schema, deployment, or provider rollback.

## Next Evidence-Backed Slice

WO-ATLAS-003 recorded that `VITE_MAPBOX_ACCESS_TOKEN` is canonical while GeoForge retains a
`VITE_MAPBOX_TOKEN` compatibility path or guidance. `WO-ATLAS-006 - Mapbox Token Alias Contract
Audit` will inventory that inconsistency and define an exact cleanup contract without changing
configuration, secrets, provider behavior, or frontend source.

## Non-Claims

- No map runtime or provider availability was exercised.
- No live token or county data was accessed.
- This repair does not claim broader renderer migration readiness.
