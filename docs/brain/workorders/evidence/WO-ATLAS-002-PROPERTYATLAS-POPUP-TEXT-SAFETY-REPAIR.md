# WO-ATLAS-002 - PropertyAtlas Popup Text-Safety Repair Evidence

## Verdict

PASS on protected merge.

## Defect

Current main interpolated `boundary.data.situsDisplay` into `Popup.setHTML`. The boundary response is
not an HTML authority, so markup-shaped situs content could be interpreted by the popup DOM.

## Repair

`PropertyAtlas` now calls `Popup.setText(situsText)`. Newline normalization and the parcel-ID
fallback are unchanged. No renderer, map style, provider, package, geometry, routing, or persistence
behavior changed.

## Regression Proof

The focused test supplies this boundary-derived value:

```text
<img src=x onerror=alert(1)>
```

The test asserts:

- `Popup.setText` receives the exact string.
- `Popup.setHTML` receives no call.
- the text popup is attached to the marker.

The test was observed failing before the production repair and passing afterward.

## Validation

- `corepack pnpm --dir frontend exec vitest run apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx`
  - before repair: 12 passed, 1 failed at the new `setText` assertion
  - after repair: 13 passed, 0 failed
- Frozen bootstrap preserved `package.json` and `pnpm-lock.yaml` SHA-256 hashes.
- Frontend type-check: required before merge.
- `node docs/brain/workorders/tools/wo-query.mjs --json --authority R3`.
- `node --test docs/brain/workorders/tools/wo-query.test.mjs`.
- `git diff --check` and exact-scope inspection.

## Safety Posture

- Runtime code changed: yes, one presentation-safety API call.
- Backend code changed: no.
- Package or lockfile changed: no.
- Renderer/provider contract changed: no.
- CI/deployment/county/PACS/SQL/secrets/production changed: no.

## Next

WO-ATLAS-003 - Map Renderer Contract Decision. It must decide Mapbox retention versus a fresh
MapLibre migration from current main; it must not revive PR #1073 as an integration vehicle.
