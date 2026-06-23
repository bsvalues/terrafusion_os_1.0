# Coefficient Preview Runtime Design

## Goal

Promote Coefficient Preview from a queued Forge surface to a live, read-only runtime module that proves coefficient comparison with production API data and does not imply coefficients can be applied.

## Scope

This slice only touches the Forge suite launcher, the Coefficient Preview frontend module, and focused tests. It does not modify TerraFusion Sync, data seeding, migrations, or backend write lanes.

## Runtime Contract

Coefficient Preview will compare two tax-year regression windows. It will fetch:

- `GET /api/terraforge/regression?taxYear=<year>&countyId=<countyId>` for source and candidate coefficient vectors.
- `POST /api/MassAppraisal/compare` for IAAO summary deltas.

Requests must use the existing `apiFetchJson` API wrapper, county-scoped session headers, and bearer token when present. The component must not use raw `fetch`.

## UI Behavior

The launcher card becomes live with a `Live preview` chip. The module defaults to source year 2026 and candidate year 2025. Generate Preview loads live data, displays source/candidate model labels, COD/PRD/median ratio deltas, coefficient deltas by predictor, and impact counts from the compare endpoint.

If either regression cannot be fit, the component renders an honest unavailable message with the backend reason and leaves Apply blocked.

Apply remains read-only. The button may record an audit-trail event, but it must say the write backend is unavailable and must not call an apply endpoint.

## Testing

Tests must prove:

- The launcher enables Coefficient Preview while TerraGAMA remains queued.
- The component calls live county-scoped endpoints and maps regression coefficients into visible deltas.
- The component does not use legacy raw `fetch` or `/api/MassAppraisal/models`.
- The unavailable path displays backend insufficiency without fake rows.

## Acceptance

Local focused tests, core type-check, Phase 83 gate, frontend type-check, backend API build, frontend production build, and browser runtime proof must pass before PR.
