# Frontend OS Shell Snyk Triage

Date: 2026-03-22
Status: PASS
Owner lane: core pilot ops
Purpose: Classify the findings surfaced by the new frontend shell Snyk scan lane so future frontend honesty slices can distinguish likely real follow-up from scanner noise.

## Scope

This triage slice was intentionally limited to the frontend-only Snyk report and read-only inspection of the flagged shell files:

- `.tmp/snyk-code-frontend-apps-os-shell.json`
- `frontend/apps/os-shell/src/auth/useSession.ts`
- `frontend/apps/os-shell/src/api/systemDiagnosticsApi.ts`
- `frontend/apps/os-shell/src/components/analytics/AnalyticsDashboard.tsx`
- `frontend/apps/os-shell/src/components/integration/IntegrationDashboard.tsx`
- `frontend/apps/os-shell/src/components/layout/ProfessionalDashboard.tsx`
- `frontend/apps/os-shell/src/components/legacy/LegacyRedirect.tsx`
- `frontend/apps/os-shell/src/components/pilot/ExecutionConsole.tsx`
- `frontend/apps/os-shell/src/components/PWAShell.tsx`
- `frontend/apps/os-shell/src/components/research/ResearchPortal.tsx`
- `frontend/apps/os-shell/src/hooks/useCostForgeAPI.ts`
- `frontend/apps/os-shell/src/pages/suites/TerraPrimeSuite.tsx`

No frontend source files, no Snyk rules, and no baseline ceilings were changed in this slice.

## Current Finding Totals

`pnpm run security:scan:frontend` produced `18` findings across `7` rule families:

- `javascript/DOMXSS` = `7 warning`
- `javascript/CodeInjection` = `4 warning`
- `javascript/NoHardcodedPasswords/test` = `3 note`
- `javascript/HardcodedNonCryptoSecret` = `1 error`
- `javascript/HardcodedNonCryptoSecret/test` = `1 note`
- `javascript/OR` = `1 warning`
- `javascript/PrototypePollution` = `1 warning`

## Classification

### Likely false positive / low immediate risk

- `javascript/HardcodedNonCryptoSecret` in `frontend/apps/os-shell/src/auth/useSession.ts:10`
  - current hit is the dev session storage key string `tf.session.dev`, not a credential or token
- `javascript/CodeInjection` in `AnalyticsDashboard.tsx`, `IntegrationDashboard.tsx`, and `useCostForgeAPI.ts`
  - the flagged sinks are `setInterval` and `setTimeout` with function callbacks and delay values, not string-eval timer bodies
- `javascript/DOMXSS` in `systemDiagnosticsApi.ts`, `ExecutionConsole.tsx`, and `ResearchPortal.tsx`
  - the flagged sinks are blob-download anchor elements created with `document.createElement('a')`, object URLs, and `download` filenames
- `javascript/PrototypePollution` in `LegacyRedirect.tsx`
  - the flagged flow is from the React location object into telemetry fields; the inspected site does not show dynamic object-key writes
- test-only notes in `form-workflows.integration.test.tsx`, `runtimeCountyHeaderPropagation.contract.test.tsx`, and `PenetrationTesting.test.tsx`
  - these are fixture/test literals, not production secrets

### Needs human review / strongest real follow-up candidates

- `javascript/DOMXSS` in `frontend/apps/os-shell/src/components/PWAShell.tsx:500`
  - flagged sink is `iframe src={currentModule.url}`
- `javascript/DOMXSS` in `frontend/apps/os-shell/src/components/layout/ProfessionalDashboard.tsx:317`
  - flagged sink is `iframe src={currentModule.url}`
- `javascript/OR` in `frontend/apps/os-shell/src/pages/suites/TerraPrimeSuite.tsx:242`
  - flagged sink is `window.open(getIframeUrl(), '_blank')`
- `javascript/DOMXSS` in `frontend/apps/os-shell/src/pages/suites/TerraPrimeSuite.tsx:257`
  - flagged sink is `iframe src={getIframeUrl()}`

These findings may still be acceptable once the URL sources are constrained to trusted module registry values, but they are the only frontend shell findings that currently justify a dedicated follow-up review lane.

## Relevance To The PropertyDais PILT Slice

None of the `18` frontend shell findings map to the recent PropertyDais or PILT placement honesty slice.

The scan surfaced adjacent shell/module-hosting issues, not parcel workbench Dais copy or request/result honesty issues.

## Recommended Next Step

If a frontend security follow-up opens, it should be a bounded shell-host URL provenance lane focused on:

- `PWAShell.tsx`
- `ProfessionalDashboard.tsx`
- `TerraPrimeSuite.tsx`

That is the strongest next security slice exposed by the new frontend-capable scan path.

## Truth Statement

The new frontend shell scan lane is now classified enough to be operationally useful.

Most findings are scanner noise or low-risk download/timer patterns, while the iframe and pop-out URL flows are the only credible next review targets.