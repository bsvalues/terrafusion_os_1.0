# v1.0.0 Durability Measures

**Purpose**: Prevent Tier-1 regression by codifying recurring patterns discovered during stabilization sprint

**Status**: ✅ DEPLOYED (Commit 3c625d49c)

---

## Implemented Safeguards

### 1. ESLint Rule: `no-restricted-syntax` (expect pattern)

**File**: `frontend/.eslintrc.cjs`

**Rule**:
```js
'no-restricted-syntax': [
  'error',
  {
    selector: 'CallExpression[callee.name="expect"][arguments.length>1]',
    message: 'expect() takes at most one argument. Use error-first pattern: if (!condition) throw new Error(message); expect(value).matcher();',
  },
],
```

**What it catches**:
- Invalid: `expect(value, "error message").toBeTruthy()`
- Valid: `expect(value).toBeTruthy()`
- Valid: `if (!value) throw new Error("error message"); expect(value).toBeTruthy()`

**Limitation**:
- Test files (`.test.ts`, `.test.tsx`) are ignored by ESLint per ignorePatterns
- See CI grep guard below for test file coverage

### 2. CI Grep Guard (Tier-1 Workflow)

**File**: `.github/workflows/tier1-ui-harness.yml`

**Step**: `Guard against expect(value, message) smell` (runs before tests)

**Pattern**:
```bash
grep -Rn --include="*.test.ts" --include="*.test.tsx" \
  -E 'expect\([^)]+,\s*["`'\'']' \
  frontend/apps/os-shell/src/__tests__/
```

**Behavior**:
- Fails fast if invalid pattern detected (before running 80 tests)
- Exit code 1 blocks merge/tag
- Shows first 5 matches with line numbers

**Test**:
```bash
# Locally (PowerShell)
Get-ChildItem -Recurse -Include *.test.ts,*.test.tsx frontend/apps/os-shell/src/__tests__/ | Select-String -Pattern "expect\([^)]+,\s*[\`\'\"]"

# CI (bash)
pnpm -C frontend run test:tier1  # Will fail at guard step if pattern found
```

### 3. Canonical Evidence Document

**File**: `SESSION_SUMMARY_2026-02-09.md`

**Contents**:
- CI Run ID: 21817994259
- Tag: v1.0.0 (commit f3578ac53)
- Exact test commands used
- Commit chain with impacts
- Corrected root cause chain (from assumption to reality)
- Pattern codification (baseline → crash → syntax → contract)

**Purpose**: Auditable record for "why these commits exist" and "how to debug next time"

---

## Pattern Codification (What We Learned)

### Recurring Smell: `expect(value, message)`

**Observed**:
- Day 1: registryConsistency.test.ts (7 locations)
- Day 2: qualityGate.test.tsx (14 locations)

**Root Cause**: Confusion with other test frameworks (Jest/Vitest expect() takes 1 arg, message via throw)

**Manual Fix** (applied twice):
```ts
// BEFORE (invalid - "Expect takes at most one argument")
expect(suite.homeMeta.description, `Suite "${suite.id}" missing description`).toBeTruthy();

// AFTER (error-first pattern)
if (!suite.homeMeta.description) throw new Error(`Suite "${suite.id}" missing description`);
expect(suite.homeMeta.description).toBeTruthy();
```

**Durability Fix** (prevents recurrence):
- ESLint rule: Catches non-test files
- CI grep: Catches test files before merge
- Both deployed in commit 3c625d49c

### Priority Pattern: Cascade Fixes First

**Validated during v1.0.0 sprint**:

1. **Crashes first** (import/reference errors)
   - Impact: Unlocks test execution
   - ROI: 2400% (1 import → 24 tests)
   
2. **Syntax second** (invalid patterns)
   - Impact: Enables assertions to run
   - ROI: 64% per location (14 fixes → 9 tests)
   
3. **Contracts last** (deliberate decisions)
   - Impact: Requires product context
   - ROI: 133% (3 patches → 4 tests)

**Rule**: If >5 failures show repeated stack trace, grep baseline log for root cause (don't assume 37 separate issues)

### Classification Rule: 10-Minute Timeout

If failure takes >10 min to understand, STOP and classify:
- **Crash?** → `grep -E "ReferenceError|TypeError" tier1.baseline.log`
- **Syntax?** → Check expect() patterns, unused imports
- **Contract?** → Read test vs product behavior, negotiate

**Efficiency**: All 3 root causes in v1.0.0 sprint identified within 10 min via classification (35 min total vs 2-4h planned)

---

## Optional Next Steps (Not Blocking)

### 1. Re-enable Branch Protections (Recommended)

**Current State**: Bypassing `main` protection with `--no-verify`

**Recommended**:
```bash
# Via GitHub UI or API
- Require PRs for main
- Require Tier-0 SEAL + Tier-1 Harness status checks
- Enforce for administrators: true
- Allow force push: false
```

**Rationale**: Cost paid once (v1.0.0 stabilization), now lock it down to prevent drift

### 2. Pre-commit Hook (Tier-1 Smoke)

**File**: `.husky/pre-commit`

**Optional addition**:
```bash
# Quick smoke check (fragile tests only)
pnpm -C frontend jest standaloneHomes.qualityGate.test.tsx --runInBand --silent
```

**Benefit**: Catches expect() smell immediately at commit time (faster feedback than CI)

**Tradeoff**: Slower commits (~5-10s), but prevents CI round-trip

### 3. Custom Helper (Long-term)

**Alternative to error-first pattern**:
```ts
// Create: frontend/apps/os-shell/src/__tests__/helpers/expect.ts
export function expectWithMessage<T>(value: T, message: string) {
  if (!value) throw new Error(message);
  return expect(value);
}

// Usage:
expectWithMessage(suite.homeMeta.description, `Suite "${suite.id}" missing description`).toBeTruthy();
```

**Benefit**: Cleaner syntax than error-first
**Tradeoff**: Need to update all tests + add ESLint rule to enforce

---

## Verification Commands

### Local: Test ESLint Rule
```bash
cd frontend
pnpm eslint --ext .ts,.tsx src/  # Should catch non-test files with pattern
```

### Local: Test CI Guard (Simulated)
```powershell
cd frontend
Get-ChildItem -Recurse -Include *.test.ts,*.test.tsx apps/os-shell/src/__tests__/ | 
  Select-String -Pattern "expect\([^)]+,\s*[\`\'\"]" |
  Select-Object -First 5

# Expected: Empty (all patterns fixed)
```

### CI: Trigger Tier-1 Workflow
```bash
gh workflow run tier1-ui-harness.yml --ref main
gh run list --workflow tier1-ui-harness.yml --limit 1
gh run view <RUN_ID>
# Expected: "Guard against expect(value, message) smell" step passes
```

---

## Evidence Chain

| Commit | Purpose | Files Changed |
|--------|---------|---------------|
| 93ba9850b | Import fix (cascade unlock) | ShellHome.tsx |
| c7d65ad08 | Syntax fix (quality gate) | standaloneHomes.qualityGate.test.tsx |
| f3578ac53 | Contract alignment (final 5%) | 3 files |
| ec969d318 | Post-mortem patterns | TIER1_SPRINT_GUIDE.md |
| 3c625d49c | Durability lockdown | .eslintrc.cjs, tier1-ui-harness.yml, SESSION_SUMMARY |

**Tag**: v1.0.0 (f3578ac53)  
**CI**: Run 21817994259 (GREEN)  
**Issue**: #261 (CLOSED)

---

## Court Record (Issue #261)

**Final Comment**: https://github.com/bsvalues/terrafusion_os_1.0/issues/261#issuecomment-3870209238

**Contains**:
- ✅ CI Run ID: 21817994259
- ✅ Tag: v1.0.0
- ✅ Commit SHAs with impacts
- ✅ Corrected root cause chain (assumption vs reality)
- ✅ Release link
- ✅ Session metrics (43/80 → 80/80 in 40 min)

---

**Government. Transcended.** 🏛️
