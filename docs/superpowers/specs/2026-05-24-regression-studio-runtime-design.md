# Regression Studio Runtime Design

## Goal

Activate Regression Studio as a live TerraForge specialist module by binding it to existing county-scoped TerraForge regression endpoints and proving it through tests and browser runtime verification.

## Scope

Modify only the frontend Regression Studio surface and its launcher contract:

- `frontend/apps/os-shell/src/pages/forge/regression/**`
- `frontend/apps/os-shell/src/hooks/useRegressionAnalysis.ts`
- `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx`
- focused frontend tests under `frontend/apps/os-shell/src/**/__tests__/**`

Do not modify Sync, Data, seeding, migrations, `applications/**`, `specialized/**`, or Claude worktrees.

## Architecture

Regression Studio will use the existing TerraForge API surface:

- `GET /api/terraforge/regression`
- `GET /api/terraforge/ratio-study/hedonic-regression`
- `GET /api/terraforge/ratio-study/cross-validation`

The hook layer will own county-scoped headers, query parameters, response normalization, and honest unavailable states. The UI will consume normalized regression data and render model fit, coefficients, validation metrics, and empty/error states without fixtures.

## Data Flow

1. User opens Forge Suite.
2. Regression Studio appears as an enabled secondary app.
3. Regression Studio resolves county session scope with `buildCountyScopedSessionHeaders`.
4. Live queries call TerraForge endpoints through `apiFetch`.
5. Responses are normalized into the existing Regression Studio result shape where possible.
6. Insufficient data, missing county scope, and backend failures render explicit states rather than fabricated analytics.

## Error Handling

- Missing county isolation disables live calls and shows a county-scope required message.
- `insufficientData`, `singularMatrix`, and `{ error, sampleSize }` responses render as unavailable analysis with sample evidence.
- Failed fetches surface the query error state in the tab content.
- No synthetic model rows, fake run history, or fixture-backed coefficients are introduced.

## Testing

Use test-first implementation:

- Add a launcher contract proving Regression Studio is enabled and no longer queued.
- Add hook/service tests proving live TerraForge endpoint paths, county headers, and insufficient-data normalization.
- Run focused Vitest tests, frontend type check/build where practical, required core gates, and browser runtime verification.

## Runtime Proof

Start the API with dev seeders skipped and start the frontend from the isolated worktree. In the browser, open Forge Suite, launch Regression Studio, and verify the live panel renders TerraForge regression output or an honest insufficient-data response from the backend.
