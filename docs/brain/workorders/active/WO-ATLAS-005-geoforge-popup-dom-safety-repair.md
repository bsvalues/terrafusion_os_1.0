# WO-ATLAS-005 - GeoForge Popup DOM Safety Repair

**Program:** Portfolio Operator
**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`
**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`
**Risk:** R3
**Status:** Complete on protected merge

## Objective

Remove executable HTML boundaries from all eight audited GeoForge popup paths while preserving map,
valuation, provider, routing, and persistence behavior.

## Result

- All seven V1 and one V2 `Popup.setHTML` calls now use `Popup.setDOMContent`.
- Static popup structure is created through DOM APIs.
- Every feature-derived value enters the DOM through text nodes or `textContent`.
- Focused hostile-input tests prove that markup and event attributes are not created.
- No renderer, provider, token, style, geometry, valuation, API, package, lockfile, or persistence
  behavior changed.

## Evidence

See
[WO-ATLAS-005-GEOFORGE-POPUP-DOM-SAFETY-REPAIR.md](../evidence/WO-ATLAS-005-GEOFORGE-POPUP-DOM-SAFETY-REPAIR.md).

## Next

`WO-ATLAS-006 - Mapbox Token Alias Contract Audit` is the next dependency-cleared docs-only node.
