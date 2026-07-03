# WO-TERRAPILOT-P10 - summarize_levy_rate_components Evidence Packet

**Goal:** GOAL-TERRAPILOT-TOOL-MATURITY
**Loop:** LOOP-TERRAPILOT-TOOL-MATURITY
**Date:** 2026-07-03
**Mode:** Evidence only. No runtime change, no backend integration, no tool promotion.

## Decision

`summarize_levy_rate_components` is the first TerraPilot candidate with enough source evidence to
prepare a future `contract-covered` metadata decision.

This packet does not promote the tool, does not mark it `contract-covered`, and does not claim live
backend/product integration. It records the current evidence, the missing evidence, and the stop
gates that must remain in force before any future `backend-integrated` or `promoted` claim.

## Candidate

| Field | Value |
|-------|-------|
| Tool ID | `summarize_levy_rate_components` |
| Suite | `dais` |
| Risk | `read_only` |
| Mode | `muse` |
| Write lane | `null` |
| Current maturity level | `L1` |
| Current maturity state | `stub-contract` |
| Current live integration flag | `false` |
| Current disclosure | `tool layer in development` |

## Evidence Reviewed

- `tools/registry/terrapilot.tools.json`
- `tools/registry/tool-maturity.json`
- `tools/registry/tool-maturity.schema.json`
- `docs/brain/workorders/programs/terrapilot-promotion-protocol.md`
- `docs/brain/workorders/evidence/WO-TERRAPILOT-P3-P6-MATURITY-EVIDENCE.md`
- `docs/brain/workorders/evidence/WO-TERRAPILOT-P8-MATURITY-METADATA-ENFORCEMENT.md`
- `docs/brain/workorders/evidence/WO-TERRAPILOT-P9-FIRST-PROMOTION-CANDIDATE-DECISION.md`
- `os-platform/core/pilot/handlers.real.ts`
- `os-platform/core/tests/r1-contract-alignment.test.mjs`
- `os-platform/core/tests/r1-auth-smoke.test.mjs`
- `os-platform/core/tests/r1-live-smoke.test.mjs`
- `os-platform/core/tests/phase85-tools.test.mjs`

## Current Manifest Contract

The manifest declares `summarize_levy_rate_components` as a Dais read-only TerraPilot tool.

Observed manifest properties:

- `toolId`: `summarize_levy_rate_components`
- `displayName`: `Summarize Levy Rate Components`
- `suite`: `dais`
- `mode`: `muse`
- `risk`: `read_only`
- `writeLane`: `null`
- `touches`: `levy`, `parcel`
- `piiHandling`: `sanitize`
- `tracePolicy`: `summary_only`
- `officeScope`: `assessor`

Observed parameter contract:

- `county`: string, required, must match the execution context county
- `taxYear`: integer, required
- `districtCode`: string, optional

## Current Handler Evidence

`os-platform/core/pilot/handlers.real.ts` contains a real handler registration for the tool:

- handler export: `summarizeLevyRateRealHandler`
- registry binding: `runner.registerHandler('summarize_levy_rate_components', summarizeLevyRateRealHandler)`
- intended backend target: `POST /api/levy-calculation/calculate-rate`
- county boundary: `assertCountyMatch(params.county, context.countyId)`
- auth boundary: `acquirePilotToken()`

This is meaningful evidence that the tool has a concrete handler and backend target. It is not by
itself live promotion evidence because this P10 work order did not run or change backend services,
did not access live data, and did not update maturity metadata.

## Current Test Evidence

Existing tests reference the candidate:

| Test file | Evidence type |
|-----------|---------------|
| `os-platform/core/tests/r1-contract-alignment.test.mjs` | Manifest schema and suite/risk alignment |
| `os-platform/core/tests/r1-auth-smoke.test.mjs` | Auth-bound backend smoke path when a local backend is available |
| `os-platform/core/tests/r1-live-smoke.test.mjs` | Backend dispatch distinction from canned/stub behavior |
| `os-platform/core/tests/phase85-tools.test.mjs` | Contract-shaped result, sorted components, total-rate calculation, trace pair |
| `os-platform/core/tests/phase83-tools.test.mjs` | Manifest/tool registry invariants |
| `os-platform/core/tests/tool-maturity.test.mjs` | Maturity metadata guardrails |

P10 did not start services, use credentials, access county systems, or run live backend probes.

## Contract-Covered Readiness

Based on current evidence, the tool is a candidate for a future `contract-covered` metadata change
because it has:

- a manifest entry with risk, suite, params schema, PII handling, trace policy, and disclosure,
- a concrete handler reference,
- a named backend target,
- a county-boundary check,
- an auth-token acquisition boundary,
- contract and smoke tests that describe the expected behavior.

The future `contract-covered` decision still needs an explicit metadata work order because P10 is
evidence-only and leaves `tools/registry/tool-maturity.json` unchanged.

## Missing Evidence Before Backend-Integrated

The tool must not be marked `backend-integrated` until a separate authorized work order provides:

- focused live/focused validation against the owning backend service,
- proof that the backing service is available in the intended environment,
- auth model evidence that does not expose credentials or secrets,
- TerraTrace/correlation evidence for a real execution path,
- confirmation that UI/operator disclosure remains honest,
- rollback/demotion path if the integration fails or evidence expires.

## Promotion Stop Gates

Stop before any future change that would:

- mark the tool `backend-integrated`,
- mark the tool `promoted`,
- set `liveIntegration: true`,
- change handler behavior,
- implement or modify backend integration,
- start deployment or production work,
- touch secrets, credentials, PACS, county SQL, county data, or live databases,
- apply schema/database migrations,
- weaken existing phase83 or maturity metadata gates.

## Explicit Non-Changes

- No tool was promoted.
- No tool was marked `contract-covered`, `backend-integrated`, or `promoted`.
- No maturity metadata was changed.
- No backend integration was implemented.
- No handler behavior changed.
- No product/runtime behavior changed.
- No CI workflow changed.
- No schema migration or database operation was performed.
- No deployment behavior changed.
- No secrets, credentials, county data, PACS, county SQL, or live database access were used.

## Validation

Validation for this evidence packet:

```powershell
git diff --check
node docs/brain/workorders/tools/wo-query.mjs --json
node --test os-platform/core/tests/tool-maturity.test.mjs
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## Next Recommended Work

`WO-TERRAPILOT-P11 - Contract-Covered Metadata Decision`

Recommended scope:

- decide whether `summarize_levy_rate_components` should move from `stub-contract` to
  `contract-covered`,
- if authorized, update maturity metadata only after confirming the P10 evidence still applies,
- do not mark the tool `backend-integrated`,
- do not set `liveIntegration: true`,
- do not implement backend integration,
- do not touch runtime behavior, CI workflows, deployment, schema/database migration, secrets,
  county data, PACS, county SQL, or live DB access.
