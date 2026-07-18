# WO-ATLAS-003 - Map Renderer Contract Decision

**Program:** Portfolio Operator
**Goal:** `GOAL-PORTFOLIO-OPERATOR-001`
**Loop:** `LOOP-PORTFOLIO-OPERATOR-001`
**Risk:** R1
**Status:** Complete on protected merge

## Objective

Decide the supported Workbench renderer contract from current main without reviving stale PR #1073
or changing frontend, provider, package, lockfile, CI, deployment, or protected resources.

## Decision

Retain `mapbox-gl` 3.20.0 as the current supported OS-shell renderer baseline. MapLibre remains an
eligible future migration target, but no live ADR, dependency, provider contract, or complete proof
currently authorizes that migration.

## Contract

- `VITE_MAPBOX_ACCESS_TOKEN` is the canonical current token name; aliases remain compatibility debt.
- Current Mapbox-hosted styles remain the supported provider path until a replacement is ratified.
- No public/demo tile, glyph, or style endpoint becomes production canon without attribution,
  licensing, availability, privacy, security, and rollback proof.
- Boundary- or API-derived popup values must use text nodes or an equivalent escaping boundary.
- A migration must cover every current OS-shell Mapbox surface, package and lockfile changes, tests,
  provider failure behavior, and an atomic rollback plan.

## Evidence

See
[WO-ATLAS-003-MAP-RENDERER-CONTRACT-DECISION.md](../evidence/WO-ATLAS-003-MAP-RENDERER-CONTRACT-DECISION.md).

## Next

`WO-ATLAS-004 - GeoForge Popup Content Safety Audit` inventories current API-derived popup HTML and
defines exact bounded repair slices. It does not change frontend code.
