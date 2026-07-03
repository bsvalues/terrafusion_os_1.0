# WO-TERRAPILOT-P11 - Contract-Covered Metadata Decision

**Goal:** GOAL-TERRAPILOT-TOOL-MATURITY
**Loop:** LOOP-TERRAPILOT-TOOL-MATURITY
**Date:** 2026-07-03
**Mode:** Evidence/governance decision only. No metadata mutation, no runtime change, no backend
integration, no live promotion.

## Decision

`summarize_levy_rate_components` remains a valid first candidate for a future
`contract-covered` maturity metadata change, but this P11 packet does not change
`tools/registry/tool-maturity.json`.

Reason: moving a tool from `stub-contract` to `contract-covered` is not live/backend integration,
but it is still a maturity-state claim. That claim should be made only in a narrow follow-up work
order that explicitly authorizes the metadata change and records the exact evidence carried forward
from P10.

## Inputs Reviewed

- `docs/brain/workorders/evidence/WO-TERRAPILOT-P10-SUMMARIZE-LEVY-RATE-EVIDENCE-PACKET.md`
- `tools/registry/tool-maturity.json`
- `tools/registry/tool-maturity.schema.json`
- `tools/registry/terrapilot.tools.json`
- `docs/brain/workorders/programs/terrapilot-tool-maturity.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`

## Current Metadata State

`summarize_levy_rate_components` remains:

| Field | Current value |
|-------|---------------|
| `level` | `L1` |
| `state` | `stub-contract` |
| `liveIntegration` | `false` |
| `disclosureRequired` | `true` |
| `disclosure` | `tool layer in development` |

## P10 Evidence Carried Forward

P10 established that the candidate has:

- a manifest entry with suite, risk, parameter schema, PII handling, trace policy, and disclosure,
- a concrete handler reference,
- a named backend target,
- a county-boundary check,
- an auth-token acquisition boundary,
- static contract and smoke tests that describe expected behavior.

That evidence is enough to justify a future `contract-covered` metadata-change packet. It is not
enough to claim `backend-integrated`, `liveIntegration: true`, or `promoted`.

## Metadata Change Stop Gate

A follow-up metadata-change work order may update only `tools/registry/tool-maturity.json` and
evidence/routing docs if it confirms:

- P10 evidence still applies to `summarize_levy_rate_components`,
- the tool remains read-only,
- `liveIntegration` remains `false`,
- disclosure remains honest and required,
- no handler behavior changes,
- no backend integration is implemented,
- no runtime behavior changes,
- no CI workflow changes,
- no schema/database migration occurs,
- no deployment, secrets, county data, PACS, county SQL, or live DB access is used.

## Explicit Non-Changes

- No maturity metadata changed.
- No tool was marked `contract-covered`.
- No tool was marked `backend-integrated`.
- No tool was marked `promoted`.
- No `liveIntegration: true` claim was made.
- No handler behavior changed.
- No backend integration was implemented.
- No runtime/product behavior changed.
- No CI workflow changed.
- No schema migration or database operation was performed.
- No deployment behavior changed.
- No secrets, credentials, county data, PACS, county SQL, or live database access were used.

## Validation

Validation for this decision packet:

```powershell
git diff --check
node docs/brain/workorders/tools/wo-query.mjs --json
node --test os-platform/core/tests/tool-maturity.test.mjs
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## Next Recommended Work

`WO-TERRAPILOT-P12 - Contract-Covered Metadata Change Authorization Packet`

Recommended scope:

- decide whether to explicitly authorize moving `summarize_levy_rate_components` from
  `stub-contract` to `contract-covered`,
- if authorized, update only maturity metadata and supporting evidence/routing docs,
- keep `liveIntegration: false`,
- do not mark the tool `backend-integrated`,
- do not mark the tool `promoted`,
- do not implement backend integration,
- do not touch runtime behavior, CI workflows, deployment, schema/database migration, secrets,
  county data, PACS, county SQL, or live DB access.
