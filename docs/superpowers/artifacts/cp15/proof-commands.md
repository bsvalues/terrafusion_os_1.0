# CP-15 Proof Commands

Date: 2026-03-19
Phase: CP-15
Gate: G5 + G6
Status: COMPLETE

## Baseline Required Commands

Both must pass before any CP-15 changes merge:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## Targeted Proof Commands

### G6 — Workbench Host Integrity Gate

```bash
pnpm vitest run frontend/apps/os-shell/src/__tests__/workbench/workbenchRealHosting.gate.test.tsx
```

Covers:
- PRIMARY: Forge, Atlas, Dais real surface + interactive element
- SECONDARY: Dossier, Pilot real surface
- REGISTRY: clerk, treasury, audit in VALID_WORKBENCH_TAB_IDS
- WORKBENCH-LEVEL: 9 canonical tab slugs, maximized window

### G5 — Route Completeness Supporting Tests

```bash
pnpm vitest run frontend/apps/os-shell/src/__tests__/workbench/PropertySummary.test.tsx
pnpm vitest run frontend/apps/os-shell/src/__tests__/workbench/PropertyAtlas.test.tsx
pnpm vitest run frontend/apps/os-shell/src/__tests__/workbench/PropertyClerk.test.tsx
pnpm vitest run frontend/apps/os-shell/src/__tests__/workbench/dossierNarrativeRouting.contract.test.tsx
```

## Optional Commands (only if CP-15 touches those contracts)

Only required if CP-15 changes touch ToolRunner or Phase 85/86 contracts:

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

Status: NOT required (CP-15 did not touch ToolRunner contracts)

## Command Wall Execution Record

| Command | Result | Run At |
|---|---|---|
| `pnpm run type-check` | PASS (exit 0) | 2026-03-19 CP-15 seal run |
| `node --test phase83-tools.test.mjs` | PASS 56/56 | 2026-03-19 CP-15 seal run |
| `pnpm vitest run workbenchRealHosting.gate.test.tsx` | PASS 15/15 | 2026-03-19 CP-15 seal run |
