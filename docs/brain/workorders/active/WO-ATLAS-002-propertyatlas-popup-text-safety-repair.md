# WO-ATLAS-002 - PropertyAtlas Popup Text-Safety Repair

## Status

Complete on protected merge.

## Authority

The user's 2026-07-17 standing direction to continue and exercise the granted engineering authority
activates this exact R3 frontend slice. That authority is limited to the two recorded PropertyAtlas
files and the Brain lifecycle records listed in the registry. It does not authorize renderer,
package, routing, data-contract, deployment, county, PACS, SQL, secret, or production changes.

## Objective

Render boundary-derived situs content as popup text so markup is never interpreted as HTML.

## Implementation

- Replace `Popup.setHTML` interpolation with `Popup.setText`.
- Preserve newline normalization and the parcel-ID fallback.
- Add a runtime regression using hostile markup and a controlled Mapbox mock.

## Allowed Files

- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyAtlas.tsx`
- `frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx`
- WO-ATLAS-002 evidence and Portfolio Operator lifecycle records under `docs/brain/workorders/**`

## Validation

- Red proof: the new regression failed because `setText` received zero calls.
- Green proof: focused PropertyAtlas suite passed, 13 tests.
- Frontend type-check.
- Brain query and query tests.
- Formatting, scope, and diff checks.
- Required remote PR checks.

## Rollback

Revert the bounded merge. No persistence, schema, package, renderer, or deployment state is changed.

## Result

Boundary-derived situs markup is passed to Mapbox as text. WO-ATLAS-003 remains a separate
docs-only renderer contract decision.

