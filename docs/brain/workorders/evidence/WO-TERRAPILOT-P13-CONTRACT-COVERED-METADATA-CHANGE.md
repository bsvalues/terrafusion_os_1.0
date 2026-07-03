# WO-TERRAPILOT-P13 - Contract-Covered Metadata Change

**Goal:** GOAL-TERRAPILOT-TOOL-MATURITY
**Loop:** LOOP-TERRAPILOT-TOOL-MATURITY
**Date:** 2026-07-03
**Mode:** Metadata change only. No runtime change, no backend integration, no live promotion.

## Decision

Owner authorization from the merged P12 packet permits the exact metadata change for
`summarize_levy_rate_components`:

- move `level` from `L1` to `L2`,
- move `state` from `stub-contract` to `contract-covered`,
- keep `liveIntegration: false`,
- keep disclosure required,
- add machine-readable evidence references for the L2 claim.

This change records contract coverage only. It does not mark the tool `backend-integrated`, does
not mark it `promoted`, does not claim live backend service execution, and does not change handler
behavior.

## Metadata Changed

File changed:

- `tools/registry/tool-maturity.json`

Tool changed:

- `summarize_levy_rate_components`

Authorized fields changed:

| Field | Before | After |
|-------|--------|-------|
| `level` | `L1` | `L2` |
| `state` | `stub-contract` | `contract-covered` |
| `liveIntegration` | `false` | `false` |
| `disclosureRequired` | `true` | `true` |
| `disclosure` | `tool layer in development` | `tool layer in development` |

The metadata also records L2 evidence references in the existing `evidence` object:

- `contract`,
- `backingService`,
- `verificationCommand`,
- `traceEvidence`.

## Evidence Basis

The L2 claim is based on previously merged P10/P11/P12 evidence:

- P10 recorded the current manifest contract, handler reference, backend target, county boundary,
  auth boundary, and test evidence for `summarize_levy_rate_components`.
- P11 decided the tool remains a valid candidate for contract-covered metadata.
- P12 authorized this exact metadata change while preserving the stop wall before live/backend
  integration.

The evidence references in `tool-maturity.json` point back to P10 contract, backing-service,
verification, and trace/test evidence sections.

## Explicit Non-Claims

This P13 work order does not claim:

- live backend integration,
- production readiness,
- promoted user-facing capability,
- service availability in any county environment,
- successful live execution against county data,
- UI/operator readiness beyond existing disclosure.

## Explicit Non-Changes

- No handler behavior changed.
- No backend integration was implemented.
- No runtime/product behavior changed.
- No CI workflow changed.
- No schema migration or database operation was performed.
- No deployment behavior changed.
- No secrets, credentials, county data, PACS, county SQL, or live database access were used.
- No tool was marked `backend-integrated`.
- No tool was marked `promoted`.
- No tool was marked live.

## Validation Gates

P13 validation must include:

```powershell
git diff --check
pnpm run type-check
node docs/brain/workorders/tools/wo-query.mjs --json
node --test os-platform/core/tests/tool-maturity.test.mjs
node --test os-platform/core/tests/phase83-tools.test.mjs
```

AJV/schema validation should also be run if an existing repo command is available without adding a
dependency.

Validation result: PASS.

Executed validation:

- `git diff --check`
- `pnpm run type-check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- `node --test os-platform/core/tests/tool-maturity.test.mjs`
- `node --test os-platform/core/tests/phase83-tools.test.mjs`
- `node -e "const Ajv=require('ajv'); const fs=require('fs'); const schema=JSON.parse(fs.readFileSync('tools/registry/tool-maturity.schema.json','utf8')); const data=JSON.parse(fs.readFileSync('tools/registry/tool-maturity.json','utf8')); const ajv=new Ajv({allErrors:true,strict:false}); const validate=ajv.compile(schema); if(!validate(data)){ console.error(JSON.stringify(validate.errors,null,2)); process.exit(1); } console.log('tool-maturity schema validation PASS');"`

## Rollback Path

If this metadata change is later found to overclaim evidence, rollback is:

1. Revert only the `summarize_levy_rate_components` maturity entry to `L1` / `stub-contract`.
2. Remove the L2-only evidence fields added by P13 if they no longer support the metadata claim.
3. Revert supporting evidence/routing docs changed by P13.
4. Keep `liveIntegration: false`.
5. Keep disclosure required.
6. Add a follow-up evidence note explaining why the metadata claim was rolled back.
7. Do not change handler behavior or backend integration while rolling back metadata.

## Next Recommended Work

Stop before live/backend integration.

The next TerraPilot maturity step requires a separate owner-authorized runtime/backend integration
work order if the owner wants to pursue `backend-integrated` maturity. Until then,
`summarize_levy_rate_components` remains contract-covered only and must continue disclosing that the
tool layer is in development.
