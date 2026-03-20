# Leak-Guard Remediation Status

Date: 2026-03-20
Status: PARTIAL
Scope: Close the separate leak-guard governance drift lane and record the first full-root rerun outcome

## Outcome Summary

The specific leak-guard governance drift documented on 2026-03-19 is now remediated.

The strict narrow-root coverage gate is green after adding the missing per-file guard wrappers under `os-platform/core/tests`.

Full-root Vitest is still not green, but the remaining failures are not in the leak-guard surface.

## Commands Executed

### Strict leak-guard coverage

Command:

```powershell
pnpm exec vitest run os-platform/core/tests/leak-guard-strict-components-coverage.test.ts --reporter=verbose
```

Result:

- exit code: `0`
- test files: `1 passed`
- tests: `1 passed`

### Required governed gates

Command:

```powershell
pnpm run type-check
```

Result:

- exit code: `0`
- `tsc -p tsconfig.core.json` completed cleanly

Command:

```powershell
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Result:

- exit code: `0`
- suites: `17 passed`
- tests: `56 passed`

### Full-root Vitest rerun

Command:

```powershell
pnpm exec vitest run --reporter=verbose
```

Result:

- Vitest exit code: `1`
- failed files: `7`
- passed files: `98`
- skipped files: `749`
- failed tests: `1`
- passed tests: `2079`
- skipped tests: `46`

## What Closed

- the 63-file leak-guard coverage gap is closed
- the strict coverage gate for `frontend/apps/os-shell/src/components` is green
- no newly added leak-guard test file failed on raw-color content

## What Still Fails In Full Root

The remaining full-root failures observed in the rerun were:

1. `frontend/apps/os-shell/src/__tests__/desktop/TerraCanonCrossTabSyncContract.test.tsx`
2. `frontend/apps/os-shell/src/__tests__/desktop/TerraCanonMultiWorkspaceSwitcherContract.test.tsx`
3. `frontend/apps/os-shell/src/__tests__/desktop/TerraCanonRenameWorkspaceIntentContract.test.tsx`
4. `frontend/apps/os-shell/src/__tests__/desktop/TerraCanonReopenWorkspaceIntentContract.test.tsx`
5. `frontend/apps/os-shell/src/__tests__/desktop/TerraCanonWorkspacePersistenceSpineContract.test.tsx`
6. `frontend/apps/os-shell/src/__tests__/shell/shellAccessibility.contract.test.tsx`
7. `frontend/apps/os-shell/src/__tests__/shell/shellKeyboardFocus.contract.test.ts`

These failures are outside the leak-guard remediation surface.

## Honest Bottom Line

The separate leak-guard blocker is removed.

Any remaining claim that full-root Vitest is not green must now point to the frontend contract/accessibility failure cluster above, not to leak-guard governance drift.