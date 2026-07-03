# WO-TERRAPILOT-P14 - Contract-Covered Metadata Stop-Gate Rollup

**Goal:** GOAL-TERRAPILOT-TOOL-MATURITY
**Loop:** LOOP-TERRAPILOT-TOOL-MATURITY
**Date:** 2026-07-03
**Mode:** Evidence/governance only. No runtime change, no backend integration, no live promotion.

## Purpose

This packet closes the evidence chain from P9 through P13 for
`summarize_levy_rate_components`.

The tool is now contract-covered in maturity metadata, but it is still not
backend-integrated, live, promoted, or product-operational. P14 records that stop
gate so the L2 metadata claim cannot be mistaken for an L3/L4 capability claim.

## P9 Through P13 Summary

| WO | Result | Boundary |
|----|--------|----------|
| WO-TERRAPILOT-P9 | Selected `summarize_levy_rate_components` as the first candidate path | Decision/evidence only; no promotion |
| WO-TERRAPILOT-P10 | Recorded contract, handler, backend target, auth, trace, and rollback evidence | Evidence only; no runtime integration |
| WO-TERRAPILOT-P11 | Decided the candidate could proceed toward contract-covered metadata | Decision only; no metadata mutation |
| WO-TERRAPILOT-P12 | Captured owner authorization for the exact L2 metadata change | Authorization packet only |
| WO-TERRAPILOT-P13 | Applied the authorized metadata change | Metadata only; no backend/live/promotion claim |

## What Changed In P13

P13 changed only the maturity metadata for `summarize_levy_rate_components` and
supporting evidence/routing docs.

The authorized metadata change was:

- `level`: `L1` to `L2`
- `state`: `stub-contract` to `contract-covered`
- `liveIntegration`: remained `false`
- `disclosureRequired`: remained `true`
- `disclosure`: remained `tool layer in development`
- L2 evidence references were added for contract, backing-service, verification,
  and trace evidence.

P13 did not populate promotion fields. The `promotion` object remains null-valued:

- `targetState: null`
- `operatorApproval: null`
- `promotionDate: null`
- `rollbackPath: null`

## What Did Not Change

P9 through P14 did not:

- implement backend integration,
- change handler behavior,
- change runtime/product behavior,
- mark any tool backend-integrated,
- mark any tool live,
- mark any tool promoted,
- claim county/runtime availability,
- change CI workflows,
- change schema or database migrations,
- deploy anything,
- use secrets, credentials, county data, PACS, county SQL, or live DB access.

## Stop Gate

`summarize_levy_rate_components` is now L2 / `contract-covered` only.

It must continue to disclose that the tool layer is in development until a
separate owner-authorized runtime/backend integration work order proves an L3 or
L4 claim.

The stop gate is stricter after P13, not looser:

- L2 is machine-readable.
- L2 points to explicit evidence.
- L2 still requires disclosure.
- L2 still blocks live/backend/promoted claims.
- L3/L4 still require separate owner authority and evidence.

## Required Evidence Before Any Future L3/L4 Promotion

Before any future work order may mark this tool `backend-integrated`, live, or
promoted, it must provide all of the following:

- owner authorization for a runtime/backend integration work order,
- backing service endpoint and owner,
- auth boundary and required permission model,
- handler behavior proof against non-production data,
- trace/correlation evidence,
- county-boundary proof with no PACS/county SQL/live DB access unless separately
  authorized,
- UI/operator disclosure update plan,
- rollback plan,
- focused tests proving the new claim,
- updated maturity metadata validation,
- PR checks proving no governance regression.

## Rollback Path

If the L2 claim is later found to overclaim evidence, rollback is metadata-only:

1. Revert only `summarize_levy_rate_components` from `L2` /
   `contract-covered` back to `L1` / `stub-contract`.
2. Remove L2-only evidence references if they no longer support the claim.
3. Keep `liveIntegration: false`.
4. Keep disclosure required.
5. Do not change handler behavior while rolling back metadata.
6. Add an evidence note explaining why the L2 claim was withdrawn.

## Validation Summary

Post-P13 merge validation passed before this P14 packet was written:

- `git diff --check`
- `pnpm run type-check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- `node --test os-platform/core/tests/tool-maturity.test.mjs`
- `node --test os-platform/core/tests/phase83-tools.test.mjs`
- `node -e "const Ajv=require('ajv'); const fs=require('fs'); const schema=JSON.parse(fs.readFileSync('tools/registry/tool-maturity.schema.json','utf8')); const data=JSON.parse(fs.readFileSync('tools/registry/tool-maturity.json','utf8')); const ajv=new Ajv({allErrors:true,strict:false}); const validate=ajv.compile(schema); if(!validate(data)){ console.error(JSON.stringify(validate.errors,null,2)); process.exit(1); } console.log('tool-maturity schema validation PASS');"`

P14 must not weaken these gates and must not mutate runtime behavior.

## Next Safe TerraPilot Work

The next safe TerraPilot work order is:

- `WO-TERRAPILOT-P15` - Future promotion authorization decision packet.

P15 may be evidence/governance-only. It must not implement live integration. If
the owner wants actual backend integration, that requires a separate runtime WO
with explicit authority.

## Done / Not Done

Done:

- L2 contract-covered metadata is evidenced.
- The stop gate before live/backend integration is explicit.
- No live/backend/promoted claim was made.

Not done:

- No governed L3/L4 `backend-integrated`, `live`, or `promoted` claim has been
  approved for this tool. Existing handler or backend-post code paths remain
  unpromoted unless a future runtime WO proves and authorizes the claim.
- No product-operational TerraPilot tool is claimed.
- No deployment, schema, secrets, county data, PACS, or live DB path was touched.
