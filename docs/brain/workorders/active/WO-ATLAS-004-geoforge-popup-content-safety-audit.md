# WO-ATLAS-004 - GeoForge Popup Content Safety Audit

**Program:** Portfolio Operator
**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`
**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`
**Risk:** R1
**Status:** Complete on protected merge

## Objective

Inventory current-main GeoForge popup HTML, classify every dynamic trust boundary, identify test gaps,
and define an exact bounded repair without changing frontend source.

## Verdict

Eight Mapbox popup sites interpolate API- or store-derived feature properties through `setHTML`:
seven in `GeoForgeMap` and one in `GeoForgeV2Map`. No focused test proves hostile values remain text.

## Required Repair

`WO-ATLAS-005 - GeoForge Popup DOM Safety Repair` must replace all eight calls with static DOM
content populated through `textContent`, add hostile-input unit proof, and preserve existing map,
valuation, routing, provider, and persistence behavior.

## Evidence

See
[WO-ATLAS-004-GEOFORGE-POPUP-CONTENT-SAFETY-AUDIT.md](../evidence/WO-ATLAS-004-GEOFORGE-POPUP-CONTENT-SAFETY-AUDIT.md).
