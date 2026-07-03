# WO-TERRAPILOT-P12 - Contract-Covered Metadata Change Authorization Packet

**Goal:** GOAL-TERRAPILOT-TOOL-MATURITY
**Loop:** LOOP-TERRAPILOT-TOOL-MATURITY
**Date:** 2026-07-03
**Mode:** Authorization packet only. No metadata mutation, no runtime change, no backend integration,
no live promotion.

## Decision Required

The owner must decide whether to authorize a future narrow metadata-change work order for
`summarize_levy_rate_components`.

This packet does not make that change. It defines the exact proposed change, proof required before
and after, rollback path, validation gates, and stop walls.

## Proposed Future Metadata Change

If authorized in a separate work order, update only the `summarize_levy_rate_components` entry in
`tools/registry/tool-maturity.json`:

| Field | Current value | Proposed future value |
|-------|---------------|-----------------------|
| `level` | `L1` | `L2` |
| `state` | `stub-contract` | `contract-covered` |
| `liveIntegration` | `false` | `false` |
| `disclosureRequired` | `true` | `true` |
| `disclosure` | `tool layer in development` | `tool layer in development` |

The proposed future change is a contract-coverage metadata claim only. It must not claim live
backend integration, production readiness, or promoted user-facing capability.

## Required Proof Before Metadata Change

A future metadata-change work order must verify:

- P10 evidence remains current and unchanged in meaning,
- P11 decision remains valid,
- `summarize_levy_rate_components` still has a manifest entry with read-only risk,
- the handler reference and backend target are still present,
- county-boundary and auth-token acquisition boundaries are still present,
- `liveIntegration` will remain `false`,
- disclosure remains required and honest,
- no handler behavior change is included,
- no backend implementation or integration is included,
- no runtime behavior, CI workflow, schema/database, deployment, secrets, county data, PACS, county
  SQL, or live DB access is included.

## Required Validation After Metadata Change

If the future metadata-change work order is authorized, validation must include:

```powershell
git diff --check
node docs/brain/workorders/tools/wo-query.mjs --json
node --test os-platform/core/tests/tool-maturity.test.mjs
node --test os-platform/core/tests/phase83-tools.test.mjs
```

If the future work order touches package or TypeScript boundaries, it must also run:

```powershell
pnpm run type-check
```

## Owner Decision Choices

The owner decision for the next work order is one of:

| Choice | Meaning |
|--------|---------|
| Authorize metadata change | Permit a narrow PR that changes only the maturity metadata and supporting evidence/routing docs. |
| Hold for more evidence | Keep the tool at `L1` / `stub-contract` until additional non-live evidence is recorded. |
| Defer to runtime integration WO | Stop the metadata path and require a separate runtime/backend integration work order before any maturity movement. |

## Rollback Path

If a future metadata-change PR is merged and later found to overclaim evidence, rollback is:

1. Revert only the `summarize_levy_rate_components` maturity entry to `L1` / `stub-contract`.
2. Keep `liveIntegration: false`.
3. Keep disclosure required.
4. Add a follow-up evidence note explaining why the metadata claim was rolled back.
5. Do not change handler behavior or backend integration while rolling back metadata.

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

## Next Recommended Work

`WO-TERRAPILOT-P13 - Contract-Covered Metadata Change`

This is an owner-authorized follow-up only. It must not begin unless the owner chooses
`Authorize metadata change` for `summarize_levy_rate_components`.
