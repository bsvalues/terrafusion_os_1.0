# WO-ATLAS-001 - MapLibre Migration Reality Audit Evidence

## Verdict

PR #1073 is **not a safe merge, rebase, or wholesale cherry-pick vehicle**. It was closed as
superseded by fresh current-main Work Orders; its branch and commits remain preserved.

## Exact-Head Evidence

- Audited PR head: `07c396eda56007e3f0fbb3d5cd46b47a9ad53745`.
- Audit base: `bba42d1fe6c1a7bb39744b01fdd72da9c6f7460e`.
- Divergence: 208 current-main commits and 11 PR-only commits.
- Exact current-main comparison: 787 additions and 379 deletions across 11 files.
- Review state: 19 total threads, 16 unresolved.
- The PR crosses Workbench Atlas, two Forge map implementations, shell desktop mapping, tests,
  test-runner configuration, `frontend/package.json`, and `pnpm-lock.yaml`.

## Canon And Dependency Findings

- No tracked live canon contains `ADR-0021`, an equivalent ADR identifier, or a MapLibre stack lock.
  The PR's repeated `ADR-0021` claim is therefore unsupported on current main.
- Current main declares `mapbox-gl` 3.20.0 and does not declare `maplibre-gl` or `wicket`.
- The stale branch removes Mapbox and adds `maplibre-gl` 5.24.0 plus `wicket` 1.3.8.
- Current main still uses Mapbox in `PropertyAtlas`; the migration direction remains a real
  engineering candidate, but not an already-ratified canonical requirement.
- Four later current-main commits touched the PR's file set, including frontend CI/test
  configuration. The stale branch's Vitest fork setting is no longer a self-contained product delta.

## Defect Findings

Unresolved review findings include:

- hardcoded Workbench overlay `zIndex` outside shell stacking authority;
- per-parcel session state not rehydrated when `parcelId` changes;
- popup HTML interpolation and XSS risk;
- state persistence paths that can drop `showContext`;
- hardcoded demo glyph and public raster tile endpoints unsuitable as a production contract;
- incomplete accessibility semantics and test assertions;
- effect/lifecycle maintainability issues and provider configuration gaps.

Some branch fixes were later reintroduced by merges, which is why resolved and unresolved comments
contradict the final exact head. This further rules out commit-level blind selection.

## Current-Main Security Finding

The popup XSS risk is not only stale-branch debt. Current main's Mapbox implementation also passes
the boundary-derived situs string to `Popup.setHTML`. That bounded defect is independent of renderer
selection and is the highest-value safe successor.

## Disposition And Routing

- PR #1073: closed as superseded; branch preserved.
- `WO-ATLAS-002 - PropertyAtlas Popup Text-Safety Repair`: identified as the next bounded R3 Work
  Order. Its registry record declares the exact frontend scope and therefore fails closed as
  `protected-system-required` until explicit R3 frontend authority is recorded for activation.
- `WO-ATLAS-003 - Map Renderer Contract Decision`: planned after the security repair to decide
  Mapbox retention versus a fresh MapLibre migration, including provider, glyph, package, test, and
  rollback contracts.
- PR #1082 remains the only open PR and retains its independent recovery-ratification boundary.

## Non-Claims

- This audit does not approve or reject MapLibre as the future renderer.
- This audit does not ratify a missing ADR or create a package decision.
- No product source, tests, package, lockfile, runtime, backend, tools-sync, CI, deployment, schema,
  migration, county, PACS, SQL, secret, live-service, or production resource changed.
