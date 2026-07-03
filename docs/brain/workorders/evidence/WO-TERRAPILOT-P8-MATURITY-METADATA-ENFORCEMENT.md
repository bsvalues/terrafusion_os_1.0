# WO-TERRAPILOT-P8 — Maturity Metadata Enforcement

**Goal:** GOAL-TERRAPILOT-TOOL-MATURITY
**Loop:** LOOP-TERRAPILOT-TOOL-MATURITY
**Date:** 2026-07-02
**Mode:** Governance metadata and focused tests only.

## Purpose

P8 converts the TerraPilot maturity doctrine into an enforceable machine-readable baseline. It does
not promote tools, wire live backend integrations, alter handler behavior, or change product runtime
behavior.

## Files Added

- `tools/registry/tool-maturity.json`
- `tools/registry/tool-maturity.schema.json`
- `os-platform/core/tests/tool-maturity.test.mjs`

## Files Updated

- `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
- `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
- `docs/brain/workorders/programs/terrapilot-tool-maturity.md`

## Enforcement Added

The new static test validates:

- every manifest tool has exactly one maturity metadata entry,
- maturity states map to the documented L0-L4 ladder,
- non-live tools keep an operator/UI disclosure,
- no current tool is `backend-integrated` or `promoted`,
- any future `backend-integrated` claim requires contract, backing service, verification command, and
  trace evidence,
- any future `promoted` claim requires operator approval, promotion date, and rollback path.

The guard is wired into the existing `test:governed` command so required core-governance paths run
the maturity parity and promotion-evidence checks instead of relying on a manual one-off command.

The JSON metadata also points to `tools/registry/tool-maturity.schema.json`, and that schema encodes
the same core invariants for editor and schema-aware validation:

- state-to-level consistency,
- non-live tools require disclosure,
- `backend-integrated` requires live integration plus contract, backing service, verification
  command, and trace evidence,
- `promoted` requires live integration plus operator approval, promotion date, rollback path, and
  backend-integration evidence.

## Current Metadata Baseline

All current TerraPilot manifest tools are recorded as:

- `level`: `L1`
- `state`: `stub-contract`
- `liveIntegration`: `false`
- `disclosureRequired`: `true`

This is intentionally conservative. Handler registration and green manifest gates prove registration
and contract shape; they do not prove live backend/product integration.

## Explicit Non-Changes

- No tool was promoted.
- No tool was marked `backend-integrated`.
- No backend integration was added.
- No runtime behavior changed.
- No CI workflow changed. The existing governed test script now includes the maturity guard.
- No schema migration or database operation was performed.
- No deployment behavior changed.
- No secrets, credentials, county data, PACS, county SQL, or live database access were used.

## Validation

Expected validation:

```powershell
git diff --check
node docs/brain/workorders/tools/wo-query.mjs --json
node --test os-platform/core/tests/tool-maturity.test.mjs
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## Next Step

`WO-TERRAPILOT-P9 — First promotion candidate decision`

P9 is an owner decision wall. Any attempt to move a tool toward `backend-integrated` or `promoted`
requires a separate authorized runtime work order.
