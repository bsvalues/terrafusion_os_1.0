# Slice 7.2 — Module Registry Cleanup: Plan

**Date**: 2026-02-27 (REVISED — verified against current source)
**Agent**: Agent 2 of 5 (Governance Swarm)

---

## Current State Summary

The registries are currently **synchronized** — no data drift exists right now. However, the architecture creates **structural risk** through duplicated data, a naming conflict, a test misannotation, and a minor API asymmetry. This plan addresses those structural issues.

---

## Phase 0: TDD Test Harness (WRITE FIRST)

### Task 0.1: Extend `moduleRegistryConsistency.test.ts` with import-based validation

**File**: `config/__tests__/moduleRegistryConsistency.test.ts` (already exists — extend it)

Add these test groups:

```
Test Group 6: "moduleLoaderStore aliases match canonical MODULE_ALIASES"
- Import MODULE_ALIASES from moduleComponents.tsx
- Dynamically import moduleLoaderStore's internal MODULE_ALIASES
- Assert exact key+value equality

Test Group 7: "no duplicate displayNames across MODULE_REGISTRY"
- For all displayNames in moduleActivation.ts, assert no two canonical IDs share the same name

Test Group 8: "PlaceholderModules have consistent API"
- For levy-calculator, gis-viewer, document-manager:
  - Assert isModuleRegistered() returns true
  - Assert getModuleEntry() returns defined (requires adding entries) OR
    test documents the asymmetry explicitly

Test Group 9: "no @vitest annotations in Jest-run test files"
- Scan test files in __tests__/ for @vitest-environment
- Assert none found (since frontend runs Jest)
```

**Acceptance Criteria**: Tests 6 and 7 fail against current code (proving they detect real issues). Tests 8 and 9 pass as documentation tests.

### Task 0.2: Create alias resolution end-to-end test

**File**: `config/__tests__/aliasResolution.e2e.test.ts` (new)

```
For each alias in MODULE_ALIASES:
  1. Call normalizeModuleId(alias) → get canonical
  2. Assert isModuleRegistered(canonical) === true
  3. Assert getModuleEntry(canonical) !== undefined OR canonical is known placeholder
  4. Assert canonical appears in displayNames map (via hardcoded expectation)
```

**Acceptance Criteria**: All assertions pass. This is a regression guard.

---

## Phase 1: Fix Naming Conflict

### Task 1.1: Rename `federation-dashboard` display name

**File**: `orchestration/moduleActivation.ts`
**Change**: `'federation-dashboard': 'TerraDais'` → `'federation-dashboard': 'Federation Dashboard'`

**File**: `config/__tests__/moduleRegistryConsistency.test.ts`
**Change**: Update `EXPECTED_DISPLAY_NAMES['federation-dashboard']` from `'TerraDais'` to `'Federation Dashboard'`

**Acceptance Criteria**: No two MODULE_REGISTRY entries share the same displayName. Test Group 7 passes.

**Risk**: LOW — `federation-dashboard` has no aliases pointing to it and is not used by desktop icons or start menu.

---

## Phase 2: Eliminate DRY Violation

### Task 2.1: Replace moduleLoaderStore local aliases with canonical import

**File**: `stores/moduleLoaderStore.ts`
**Change**:
1. Delete local `MODULE_ALIASES` (L52–94, 32 entries)
2. Delete local `REGISTERED_MODULES` (L96–120, 21 entries)
3. Add imports: `import { MODULE_ALIASES, MODULE_REGISTRY, normalizeModuleId } from '../config/moduleComponents';`
4. Update `normalizeModuleId` in store to delegate to imported function
5. Update `isModuleRegistered` in store to use `MODULE_REGISTRY.has()`

**Pre-check**: Verify no circular dependency:
```
moduleLoaderStore.ts
  → imports from config/moduleComponents.tsx
    → imports from config/modules.ts
      → imports from stores/moduleRegistryStore.ts
        → imports from stores/desktopStore.ts
        (does NOT import moduleLoaderStore.ts)
```
**Verdict**: No circular dependency. Safe to import.

**Acceptance Criteria**:
- `moduleLoaderStore.ts` no longer contains `MODULE_ALIASES` or `REGISTERED_MODULES` as local constants
- `normalizeModuleId()` and `isModuleRegistered()` in the store delegate to canonical functions
- Test Group 4 and 6 pass

**Risk**: MEDIUM — moduleLoaderStore is used by `activateModule()` for warm loading. Need to verify the import chain doesn't cause module initialization order issues at runtime.

**Mitigation**: Run full `pnpm test` in `frontend/` after change. If module load order issues arise, fall back to Task 2.1-ALT.

### Task 2.1-ALT (fallback): Add programmatic sync assertion at build time

If Task 2.1 causes circular dependency or initialization issues:
1. Keep local copies in moduleLoaderStore.ts
2. Add a build-time assertion script: `scripts/check-registry-sync.ts`
3. Wire into `pnpm run type-check` or as a pre-commit hook
4. Script reads both files, parses aliases/registry, asserts equality

---

## Phase 3: Fix Test Misannotation

### Task 3.1: Remove vestigial `@vitest-environment` comment

**File**: `stores/__tests__/moduleRegistryStore.test.ts`
**Change**: Remove `@vitest-environment jsdom` from the JSDoc comment at L2

**Acceptance Criteria**: No `@vitest-environment` annotations in `frontend/apps/os-shell/` test files.

**Risk**: NONE — Jest ignores this comment entirely.

---

## Phase 4: Resolve Placeholder Asymmetry (Optional)

### Task 4.1: Add MODULE_ENTRIES for placeholder modules

**File**: `config/moduleComponents.tsx`
**Change**: Add 3 entries to MODULE_ENTRIES:
```ts
'levy-calculator': { Component: undefined },
'gis-viewer': { Component: undefined },
'document-manager': { Component: undefined },
```

(Or create PlaceholderModule lazy wrappers so they're consistent with the rest.)

**Acceptance Criteria**: `getModuleEntry(id)` returns defined for all MODULE_REGISTRY entries.

**Risk**: LOW — no behavioral change; adds API consistency.

**NOTE**: This is optional. The current behavior is correct (ModuleRenderer handles these inline). This task exists only to close the `getModuleEntry()` API gap.

---

## Phase 5: Document Legacy Module Coexistence

### Task 5.1: Add code comments documenting `terra-gaia` / `suite-gpt` overlap

**File**: `config/moduleComponents.tsx` (near `terra-gaia` alias)
**Change**: Add JSDoc comment:
```ts
// LEGACY NOTE: terra-gaia is the legacy TerraGaia AI module.
// suite-gpt is the constitutional TerraGPT suite home.
// Both coexist intentionally. terra-gaia will be deprecated when
// suite-gpt achieves feature parity.
```

**Acceptance Criteria**: Comment exists. No code change.

**Risk**: NONE.

---

## Dead Aliases to Remove

**NONE.** All 32 aliases resolve to valid canonical IDs.

## Orphaned Registry Entries to Remove

**NONE.** All 21 MODULE_REGISTRY entries have matching ModuleRenderer switch cases, displayNames, and icons.

---

## Execution Order

| Order | Task | Depends On | Estimated Lines Changed |
|-------|------|-----------|------------------------|
| 1 | 0.1 — Extend consistency tests | None | ~60 lines (test file) |
| 2 | 0.2 — Alias e2e test | None | ~40 lines (new test) |
| 3 | 1.1 — Fix displayName conflict | 0.1 (test Group 7) | 2 lines |
| 4 | 2.1 — Eliminate DRY violation | 0.1 (test Group 6) | ~80 lines (delete ~90, add ~10) |
| 5 | 3.1 — Remove vitest annotation | None | 1 line |
| 6 | 4.1 — Placeholder entries (optional) | None | 3 lines |
| 7 | 5.1 — Document legacy overlap | None | 4 lines comment |

---

## Definition of Done

- [ ] All existing tests in `moduleRegistryConsistency.test.ts` pass
- [ ] All existing tests in `registryConsistency.test.ts` pass
- [ ] New test groups (6, 7, 8, 9) pass
- [ ] New alias e2e test passes
- [ ] `pnpm run type-check` passes
- [ ] No `@vitest-environment` annotations in frontend test files
- [ ] `moduleLoaderStore.ts` has single source of truth (or programmatic sync check)
- [ ] No duplicate displayNames across MODULE_REGISTRY entries
- [ ] Code review confirms no broken navigation paths

---

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | Removing duplicated aliases from moduleLoaderStore breaks warm loading | Medium | High | Task 2.1-ALT as fallback; full test suite run |
| R2 | `federation-dashboard` displayName change confuses existing users | Low | Low | No aliases → no external usage path |
| R3 | Circular dependency from importing moduleComponents into moduleLoaderStore | Low | Medium | Pre-checked import chain above; ALT fallback |
| R4 | Removing aliases could break bookmarks/deep links | N/A | N/A | **Not removing any aliases** |
| R5 | Module initialization order change from import refactor | Low | Medium | Runtime integration test after Task 2.1 |
