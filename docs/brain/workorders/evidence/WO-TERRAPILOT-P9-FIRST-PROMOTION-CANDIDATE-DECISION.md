# WO-TERRAPILOT-P9 - First Promotion Candidate Decision

**Goal:** GOAL-TERRAPILOT-TOOL-MATURITY
**Loop:** LOOP-TERRAPILOT-TOOL-MATURITY
**Date:** 2026-07-03
**Mode:** Decision/evidence only. No runtime change, no backend integration, no tool promotion.

## Decision

No TerraPilot tool is ready to move to `backend-integrated` or `promoted`.

The first safe next step is not live promotion. The next step is a separate evidence work order that
attempts to raise one read-only candidate from `stub-contract` to `contract-covered` by documenting
its contract, owning service, backing target, auth boundary, verification plan, trace requirement,
UI disclosure rule, and rollback/demotion path.

Recommended candidate for that future evidence packet:

- `summarize_levy_rate_components`

This recommendation does not promote the tool and does not mark it live.

## Evidence Reviewed

- `docs/brain/workorders/programs/terrapilot-promotion-protocol.md`
- `docs/brain/workorders/evidence/WO-TERRAPILOT-P3-P6-MATURITY-EVIDENCE.md`
- `docs/brain/workorders/evidence/WO-TERRAPILOT-P7-EVIDENCE-ROLLUP.md`
- `docs/brain/workorders/evidence/WO-TERRAPILOT-P8-MATURITY-METADATA-ENFORCEMENT.md`
- `tools/registry/tool-maturity.json`
- `tools/registry/tool-maturity.schema.json`
- `os-platform/core/tests/tool-maturity.test.mjs`

## Current Maturity Metadata

Observed from `tools/registry/tool-maturity.json`:

| Metric | Value |
|--------|-------|
| Total TerraPilot tools | 117 |
| `stub-contract` tools | 117 |
| `contract-covered` tools | 0 |
| `backend-integrated` tools | 0 |
| `promoted` tools | 0 |
| `liveIntegration: true` tools | 0 |

All current tools remain `L1` / `stub-contract` and keep `liveIntegration: false`.

## Why No Tool Is Ready

The P8 schema and test guard require a future `backend-integrated` claim to include:

- `liveIntegration: true`,
- `level: L3`,
- contract evidence,
- backing service evidence,
- verification command,
- trace evidence.

A future `promoted` claim additionally requires:

- `level: L4`,
- operator approval,
- promotion date,
- rollback path.

No current tool metadata contains those fields, and this P9 packet does not create them.

## Candidate Rationale

`summarize_levy_rate_components` remains the best first evidence candidate because P4 already
classified it as a read-only candidate with real handler registration. It is still blocked from live
promotion because it lacks:

- live backend probe,
- backing service proof,
- auth boundary documentation,
- trace evidence,
- operator approval.

Those blockers are appropriate. They prevent a green manifest or real handler registration from
being mistaken for a live assessor-facing tool.

## Explicit Non-Changes

- No tool was promoted.
- No tool was marked `contract-covered`, `backend-integrated`, or `promoted`.
- No maturity metadata was changed.
- No backend integration was implemented.
- No handler behavior changed.
- No product/runtime behavior changed.
- No GitHub Actions workflow changed.
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

P8 post-merge validation also confirmed:

- P8 files exist on `origin/main`,
- `tool-maturity.test.mjs` passes from the updated main baseline,
- `phase83-tools.test.mjs` passes from the updated main baseline.

AJV schema validation was attempted from the clean P9 worktree, but `ajv` was not installed in that
worktree without running a package install. No install was performed in P9.

## Next Recommended Work

`WO-TERRAPILOT-P10 - Contract-Covered Candidate Evidence Packet`

Recommended scope:

- candidate: `summarize_levy_rate_components`,
- decision/evidence only unless separately authorized,
- document contract, owner, backing target, auth boundary, verification method, trace requirement,
  UI disclosure, and rollback/demotion path,
- do not mark the tool `backend-integrated`,
- do not implement live backend integration,
- do not touch secrets, county data, PACS, county SQL, live DB, schema migrations, deployment, or
  runtime behavior without a separate owner-authorized work order.
