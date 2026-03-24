# CP-16 Proof Commands

Date: 2026-03-19
Phase: CP-16
Gate: G7
Status: COMPLETE

## Baseline Required Commands

Both must pass before any CP-16 changes merge:

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## Targeted Proof Commands — G7 Service Registry + Contract

### Suite Registry Consistency

```bash
pnpm vitest run frontend/apps/os-shell/src/config/__tests__/registryConsistency.test.ts
```

### Desktop Manifest Drift Gate

```bash
pnpm vitest run frontend/apps/os-shell/src/config/__tests__/DesktopManifestDriftGate.test.ts
```

### Suite Registry Router Contract

```bash
pnpm vitest run frontend/apps/os-shell/src/__tests__/routing/SuiteRegistryRouterContract.test.ts
```

### Multi-County Isolation (Backend — from CP-14)

```bash
dotnet test backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter FullyQualifiedName~ControllerSecurityBoundaryTests
```

## Optional Commands (not required — CP-16 did not touch ToolRunner contracts)

```bash
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
```

## Note: vitest.config.ts glob fix (CP-16 change)

Root `vitest.config.ts` was updated to include the additional glob:

```
'frontend/apps/os-shell/src/**/__tests__/**/*.test.{ts,tsx}'
```

This makes `config/__tests__`, `stores/__tests__`, `ui/materials/__tests__` and other nested
test directories discoverable from the repo root via `pnpm vitest run`.

## Command Wall Execution Record

| Command | Result | Run At |
|---|---|---|
| `pnpm run type-check` | PASS (exit 0) | 2026-03-19 CP-16 seal run |
| `node --test phase83-tools.test.mjs` | PASS 56/56 | 2026-03-19 CP-16 seal run |
| `pnpm vitest run registryConsistency.test.ts` | PASS 12/12 | 2026-03-19 CP-16 seal run |
| `pnpm vitest run DesktopManifestDriftGate.test.ts` | PASS 5/5 | 2026-03-19 CP-16 seal run |
| `pnpm vitest run SuiteRegistryRouterContract.test.ts` | PASS 12/12 | 2026-03-19 CP-16 seal run |
| `dotnet test --filter ControllerSecurityBoundaryTests` | PASS 7/7 | 2026-03-19 CP-14 (carried) |
