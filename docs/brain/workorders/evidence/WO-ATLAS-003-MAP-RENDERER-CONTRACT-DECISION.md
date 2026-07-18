# WO-ATLAS-003 - Map Renderer Contract Decision Evidence

## Verdict

**RETAIN MAPBOX AS THE CURRENT BASELINE.** Do not migrate from stale PR #1073. MapLibre remains a
candidate only after a fresh provider-neutral migration packet satisfies the contract below.

## Current-Main Truth

- `frontend/package.json` declares `mapbox-gl` 3.20.0; `pnpm-lock.yaml` resolves that version.
- Current main does not declare `maplibre-gl` or `wicket`.
- OS-shell Mapbox use spans `PropertyAtlas`, `GeoForgeMap`, `GeoForgeV2Map`, and
  `BentonCountyMap`; GIS package surfaces also declare Mapbox.
- Current styles use Mapbox `satellite-streets-v12` and `light-v11` provider URLs.
- Current token handling is not unified: most surfaces read `VITE_MAPBOX_ACCESS_TOKEN`, while
  GeoForge retains `VITE_MAPBOX_TOKEN` compatibility or guidance.
- No tracked live ADR locks MapLibre or the `ADR-0021` claim made by stale PR #1073.

## Why Stale PR #1073 Is Not The Migration Vehicle

The exact-head audit found 208 current-main-only commits, 11 PR-only commits, 16 unresolved review
threads, an unsupported ADR claim, cross-suite/package scope, and hardcoded public OSM/Esri
endpoints. The candidate also used popup HTML interpolation that WO-ATLAS-002 independently repaired
on current main. Its branch remains historical evidence, not an integration base.

## Supported Renderer Contract

### Renderer And Package

- The current supported OS-shell renderer is `mapbox-gl` 3.20.0.
- Renderer dependencies must remain exact and lockfile-backed.
- Renderer changes must be atomic across source, tests, package manifest, and lockfile.
- A future MapLibre proposal must start from current main and enumerate every Mapbox consumer; a
  PropertyAtlas-only swap is incomplete.

### Provider, Style, Glyph, And Attribution

- `VITE_MAPBOX_ACCESS_TOKEN` is the canonical current token name. Alias cleanup is a separate
  bounded change.
- Current Mapbox-hosted style identifiers are the supported baseline.
- A replacement must name the tile, style, glyph, sprite, geocoding, and attribution providers.
- Public/demo endpoints are not production contracts. They require documented terms, rate limits,
  availability, privacy, attribution, credential model, failure behavior, and replacement/rollback.
- No secret value is committed or copied into client source; only explicitly client-safe provider
  credentials may be exposed through a governed frontend environment contract.

### Security And Data Handling

- County geometry and identifiers remain subject to Atlas ownership and county-isolation rules.
- Boundary- or API-derived strings must not be interpolated into popup HTML. Use `setText`, DOM
  nodes populated with `textContent`, or an equivalent escaping boundary.
- Rich popup markup must keep structure static and data text-only.
- Provider requests must not disclose owner, valuation, or protected parcel context beyond what the
  approved map provider contract explicitly requires.

### Test And Readiness Proof

A renderer migration is not release-ready without:

1. lifecycle and cleanup proof for parcel and route changes;
2. missing-token and provider-failure truth states;
3. style reload and boundary-layer rehydration proof;
4. hostile popup-content regression proof;
5. attribution and keyboard/accessibility proof;
6. unit and Tier-1 shell tests for every changed map surface;
7. frontend type-check/build and required repository gates; and
8. documented provider smoke proof that does not use county production data.

### Rollback

- Preserve the current Mapbox implementation until replacement proof passes.
- A migration PR must be independently revertible and restore the prior source, manifest, and
  lockfile together.
- Provider configuration and fallback truth must remain valid during rollback.
- No destructive data or schema rollback is involved; renderer state must remain presentation-only.

## Additional Current-Main Finding

GeoForge v1 and v2 still pass API/feature-derived identifiers and labels through `Popup.setHTML`.
That is renderer-independent security debt and should be inventoried before any renderer migration.
This WO records the finding but does not alter Forge source.

## Decision Consequences

- Mapbox retention is a current-state support decision, not an indefinite vendor lock.
- MapLibre is neither rejected nor canonized.
- PR #1073 must not be reopened, rebased, or wholesale cherry-picked.
- Any future migration requires a fresh bounded Work Order satisfying this contract.
- The next safe node is `WO-ATLAS-004 - GeoForge Popup Content Safety Audit`.

## Non-Claims

- No provider availability, licensing, or production token was validated.
- No Mapbox or MapLibre runtime was started.
- No frontend, package, lockfile, CI, deployment, county, PACS, SQL, secret, live-service, or
  production resource changed.
