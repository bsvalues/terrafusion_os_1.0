# ADR-0020: Jest to Vitest Test Syntax Migration

**Status:** Resolved  
**Date:** 2026-02-07  
**Context:** Slice 20.1 - Test Hygiene + Regression Immunity

## Problem

11 InvocationHistory tests (and 47 other workbench tests) were failing with:
```
ReferenceError: jest is not defined
```

## Root Cause

**Test files were written with Jest syntax** (`jest.mock()`, `jest.fn()`, `jest.clearAllMocks()`) **but the project uses Vitest** as its test runner.

This mismatch likely occurred because:
1. Tests were authored using Jest conventions (common in React ecosystem)
2. The project migrated to Vitest but these tests weren't updated
3. Or tests were copied from Jest-based examples without adaptation

## Affected Files (8 total)

| File | Test Count |
|------|------------|
| `InvocationHistory.test.tsx` | 11 |
| `PropertyForge.test.tsx` | 22 |
| `PropertyAtlas.test.tsx` | 18 |
| `PropertyDais.test.tsx` | 15 |
| `PropertyDossier.test.tsx` | 15 |
| `ResultPanel.test.tsx` | 9 |
| `workbench.materials.test.tsx` | 18 |
| `workbench.regression.test.tsx` | 20 |

**Total:** 128+ tests affected

## Solution

Converted all Jest globals to Vitest equivalents:

| Jest | Vitest |
|------|--------|
| `jest.mock()` | `vi.mock()` |
| `jest.fn()` | `vi.fn()` |
| `jest.clearAllMocks()` | `vi.clearAllMocks()` |
| `jest.MockedFunction<T>` | `Mock<T>` (from `vitest`) |
| `jest.requireActual()` | `await vi.importActual()` |

Added `import { vi } from 'vitest'` to all affected files.

## Verification

After fixes:
- ✅ 159 workbench tests pass
- ✅ 127 telemetry + trace + osActions tests pass
- ✅ Type-check passes
- ✅ phase83-tools gate passes (32/32)
- ✅ Working tree clean

## Commits

1. `3b286a7ae` - fix(tests): convert workbench tests from Jest to Vitest syntax
2. `f29250716` - refactor(tests): formatting + import cleanup from Slice 17-19
3. `53725dae0` - refactor(ui): formatting + minor cleanup from Slice 17-19

## Prevention

- CI lint rule to flag `jest.*` references in test files
- Vitest-first test templates in `docs/templates/`
- Code review checklist item: "Test uses vi.* not jest.*"

---

**Decision:** Migrate all remaining test files proactively if any more Jest syntax is discovered.
