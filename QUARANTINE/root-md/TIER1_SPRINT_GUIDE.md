# Tier-1 Stabilization Sprint Guide

**Sprint Goal**: Tier-1 GREEN (43/80 → 80/80 passing)

**Definition of Done**:
- ✅ `pnpm -C frontend run test:tier1` exits 0 locally
- ✅ CI workflow `tier1-ui-harness.yml` GREEN on `main` (consecutive runs)
- ✅ All 80 tests passing (6 suites)

**Estimated Duration**: 2-4 hours focused work

**Contract alignment sprint per [Issue #261](https://github.com/bsvalues/terrafusion_os_1.0/issues/261)**

---

## Step 0 — Baseline Capture (MANDATORY)

```bash
# Lock the playing field
git checkout main && git pull --ff-only

# Capture baseline (save for comparison)
pnpm -C frontend run test:tier1 | tee tier1.baseline.log
```

**Record**:
- ✅ Current pass/fail counts: **43/80 passing (53.75%)**
- ✅ Failing test files: 5 files
  - `standaloneHomes.navigation.test.tsx`
  - `suiteTiles.accessibility.test.tsx`
  - `standaloneHomes.accessibility.test.tsx`
  - `standaloneHomes.qualityGate.test.tsx`
  - `suiteTiles.routing.test.tsx`
- ✅ Top 3 recurring failure patterns:
  1. CTA fallback contract mismatch
  2. A11y heading hierarchy violations (`diff = 2`)
  3. Quality gate metadata missing (`homeMeta`)

**Optional**: Run with `--runInBand` if flake suspected

---

## Execution Order (Fastest ROI First)

1. **CTA fallback contract** (10 min) → ~5-7 tests
2. **A11y heading hierarchy** (30 min) → ~10-15 tests
3. **Quality gate metadata** (45-75 min) → ~8-10 tests
4. **Routing contract alignment** (variable) → ~5-10 tests

---

## Step 1 — CTA Fallback Contract (10 min)

**Decision**: Fallback CTA is intentional → update tests to assert it exists

**File**: `frontend/apps/os-shell/src/__tests__/standalone/standaloneHomes.navigation.test.tsx`

**Change**:
```ts
// BEFORE (incorrect expectation)
it('workbench_cta_hidden_when_no_parcel_context', () => {
  expect(screen.queryByRole('button', { name: /workbench/i })).not.toBeInTheDocument();
});

// AFTER (correct expectation - fallback CTA appears)
it('workbench_cta_shows_fallback_when_no_parcel_context', () => {
  // Fallback CTA prompts user to choose parcel
  expect(screen.getByTestId('workbench-cta-choose')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /choose parcel to open in workbench/i })
  ).toBeInTheDocument();
});
```

### Patch Checklist
- [ ] Update test to assert fallback button presence (no parcel context)
- [ ] Prefer `data-testid="workbench-cta-choose"` assertion
- [ ] Assert accessible name contains "Choose parcel…"
- [ ] Confirm product intent: locate CTA render branch
- [ ] Document "fallback is intentional" in Contract Decision Log
- [ ] Validate: `pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/standaloneHomes.navigation.test.tsx --runInBand`

**Validation**:
```bash
pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/standaloneHomes.navigation.test.tsx --runInBand
```

**Expected impact**: ~5-7 tests pass

**Contract Decision**: CTA fallback is expected when no parcel context (intentional product behavior per `data-testid="workbench-cta-choose"`)

---

## Step 2 — A11y Heading Hierarchy (30 min)

**Decision**: Fix product (not harness) - heading hierarchy must not skip levels

**Issue**: `diff = 2` indicates h1 → h3 jump (accessibility violation)

**Diagnostic**:
```bash
# Identify failing assertions
pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/standaloneHomes.accessibility.test.tsx --runInBand 2>&1 | grep "diff = "
```

**Product Fix** (likely in `StandaloneHome.tsx` or similar):
```tsx
// BEFORE (violates heading hierarchy)
<h1>Page Title</h1>
<h3>Section Heading</h3>  {/* Skip from h1 to h3 */}

// AFTER (correct progression)
<h1>Page Title</h1>
<h2>Section Heading</h2>  {/* h1 → h2 → h3 progression */}
```

**Affected Files**:
- `suiteTiles.accessibility.test.tsx`
- `standaloneHomes.accessibility.test.tsx`

**Validation**:
### Patch Checklist
- [ ] Fix `h1 → h3` skip to `h1 → h2 → h3` in product code
- [ ] Locate heading elements: `grep -E "<h[1-6]" frontend/apps/os-shell/src/shell/home/StandaloneHome.tsx`
- [ ] Verify progression (no skips)
- [ ] Re-run a11y suites ONLY first:
  ```bash
  pnpm -C frontend jest apps/os-shell/src/__tests__/shellhome/suiteTiles.accessibility.test.tsx --runInBand
  pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/standaloneHomes.accessibility.test.tsx --runInBand
  ```
- [ ] Document heading fix in Contract Decision Log

```bash
pnpm -C frontend jest apps/os-shell/src/__tests__/accessibility/ --runInBand
```

**Expected impact**: ~10-15 tests pass

**Contract Decision**: Heading hierarchy must not skip levels (WCAG 2.1 requirement)

---

## Step 3 — Quality Gate Metadata (45-75 min)

**Issue**: Suites missing `homeMeta.description` or `homeMeta.primaryActions[]`

**Diagnostic Command**:
```bash
pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/standaloneHomes.qualityGate.test.tsx --runInBand
```

**Fast Diagnostic Pattern** (temporary, remove after fix):
```ts
// Add inside test loop to identify exact offenders
if (!suite.homeMeta?.description?.trim()) {
  throw new Error(`Missing description: ${suite.id}`);
}
if (!suite.homeMeta?.primaryActions?.length) {
  throw new Error(`Missing primaryActions: ${suite.id}`);
}
```

**Registry Fix Pattern** (likely in `suiteRegistry.ts` or similar):
```ts
// BEFORE (incomplete)
{
  id: 'suite-id',
  name: 'Suite Name',
  // homeMeta missing or incomplete
}

// AFTER (complete)
{
  id: 'suite-id',
  name: 'Suite Name',
  homeMeta: {
    description: 'Clear description of suite purpose for home screen',
    primaryActions: [
      {
        id: 'action-1',
        label: 'Action Label',
        icon: 'icon-name',
        handler: () => { /* ... */ }
      }
### Patch Checklist (with Offender IDs)
- [ ] Run diagnostic: `pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/standaloneHomes.qualityGate.test.tsx --runInBand`
- [ ] If failures don't enumerate offenders clearly, add **temporary throws** (remove before merge):
  ```ts
  // Inside test loop - identifies exact offenders
  if (!suite.homeMeta?.description?.trim()) {
    throw new Error(`Missing description: ${suite.id}`);
  }
  if (!suite.homeMeta?.primaryActions?.length) {
    throw new Error(`Missing primaryActions: ${suite.id}`);
  }
  if (suite.homeMeta?.primaryActions?.some(a => !a.id || !a.label)) {
    throw new Error(`Invalid action shape in suite: ${suite.id}`);
  }
  ```
- [ ] Record offender suite IDs from error output
- [ ] Add `homeMeta` to each offender in registry
- [ ] Verify action shape: `{ id, label, icon, handler }`
- [ ] Re-run quality gate test: GREEN
- [ ] **REMOVE temporary throws before commit**
- [ ] Document quality gate fix in Contract Decision Log

    ]
  }
}
```

**Required Fields**:
- `homeMeta.description`: Non-empty string
- `homeMeta.primaryActions`: Array with >= 1 action
- Action shape: `{ id, label, icon, handler }` (or similar per contract)
### Patch Checklist
- [ ] Run routing-only: `pnpm -C frontend jest apps/os-shell/src/__tests__/shellhome/suiteTiles.routing.test.tsx --runInBand`
- [ ] For each failure, classify:
  - **Product bug** (route config wrong) → fix product
  - **Intentional behavior** (tests outdated) → fix contract + Decision Log entry
- [ ] Apply fixes (product OR contract, not both)
- [ ] Re-run routing test: GREEN
- [ ] Document routing decisions in Contract Decision Log

---

## ⚠️ Don't Waste Time Rule

If a failure takes **>10 minutes to understand**, PAUSE and classify:

- **Missing data?** → registry (quality gate)
- **Wrong semantics?** → a11y (heading hierarchy)
- **Intentional UX?** → contract (CTA fallback)
- **Real regression?** → product (routing/behavior)

**Classification alone prevents the 4h meander.**


**Validation**:
```bash
pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/standaloneHomes.qualityGate.test.tsx --runInBand
```

**Expected impact**: ~8-10 tests pass

**Contract Decision**: Standalone suites must ship with description + >= 1 primary action (quality gate requirement)

---

## Step 4 — Routing Contract (Remaining)

**File**: `frontend/apps/os-shell/src/__tests__/standalone/suiteTiles.routing.test.tsx`

**Diagnostic**:
```bash
pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/suiteTiles.routing.test.tsx --runInBand
```

**Approach**:
1. Review test expectations vs actual product behavior
2. Align either:
   - **Route definitions** (product code), OR
   - **Route expectations** (test contract)
3. **Prefer product fixes** for genuine bugs
4. Update tests only if product behavior is intentional
Commit Plan (4-Commit Discipline)

**Execute in this order:**

1. `test(tier1): align workbench CTA fallback contract`
   - Update standaloneHomes.navigation.test.tsx
   - Assert fallback CTA presence when no parcel context

2. `fix(a11y): correct standalone heading hierarchy`
   - Fix h1 → h3 skip in StandaloneHome component
   - Change h3 → h2 for proper progression

3. `fix(registry): complete homeMeta descriptions and actions`
   - Add homeMeta to offending suite registry entries
   - Ensure description + >= 1 primaryAction for each

4. `test(tier1): routing contract alignments`
   - Fix product or contract per classification
   - Document intentional vs regression decisions

---

## PR Template (Paste into GitHub)

**Title**: `chore(tier1): stabilize UI harness contracts`

```markdown
## Summary
Stabilizes Tier-1 UI Harness suite (43/80 → 80/80 passing) per [Issue #261](https://github.com/bsvalues/terrafusion_os_1.0/issues/261).

Fixes Root Cause 3: Product vs contract alignment.

## Contract Decision Log

### CTA Fallback
- ✅ **Decision**: CTA fallback shown when no parcel context
- **Rationale**: Intentional product behavior (dedicated testid: `workbench-cta-choose`)
- **Impact**: Updated test assertions to expect fallback button
- **Commit**: test(tier1): align workbench CTA fallback contract

### Heading Hierarchy
- ✅ **Decision**: No level-skips allowed (h1 → h2 → h3 progression)
- **Rationale**: WCAG 2.1 accessibility requirement
- **Impact**: Fixed StandaloneHome component (h3 → h2)
- **Commit**: fix(a11y): correct standalone heading hierarchy

### Quality Gate Metadata
- ✅ **Decision**: Every standalone suite must ship `description` + `>=1 primaryAction`
- **Rationale**: Quality gate requirement for home screen rendering
- **Impact**: Added homeMeta to 5 suite registry entries
- **Commit**: fix(registry): complete homeMeta descriptions and actions

### Routing Contracts
- ✅ **Decision**: Route parity enforced (product/contract aligned per suite)
- **Rationale**: [Document specific routing decisions here]
- **Impact**: [Test/product changes]
- **Commit**: test(tier1): routing contract alignments

## Evidence
- **Local**: `pnpm -C frontend run test:tier1` → 80/80 passing ✅
- **CI**: Tier-1 workflow run [#<run-id>](https://github.com/bsvalues/terrafusion_os_1.0/actions/runs/<run-id>) → GREEN ✅
- **Issue**: Closes #261

## Testing Commands
```bash
# Full Tier-1 suite
pnpm -C frontend run test:tier1

# Individual suite validation
pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/standaloneHomes.navigation.test.tsx --runInBand
pnpm -C frontend jest apps/os-shell/src/__tests__/shellhome/suiteTiles.accessibility.test.tsx --runInBand
pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/standaloneHomes.accessibility.test.tsx --runInBand
pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/standaloneHomes.qualityGate.test.tsx --runInBand
pnpm -C frontend jest apps/os-shell/src/__tests__/shellhom
## PR Structure (Keep Tier-1 Credible)

### Single PR
**Title**: `chore(tier1): stabilize UI harness contracts`

### Commit Grouping
1. `test(tier1): align CTA fallback contract`
2. `fix(a11y): correct heading hierarchy in StandaloneHome`
3. `fix(registry): complete homeMeta for standalone suites`
4. `test(tier1): routing contract alignments`

### PR Description Template
```markdown
## Summary
Stabilizes Tier-1 UI Harness suite (43/80 → 80/80 passing) per Issue #261.

Fixes Root Cause 3: Product vs contract alignment.

## Contract Decision Log

### CTA Fallback
**Decision**: CTA fallback is expected when no parcel context
**Rationale**: Intentional product behavior per `data-testid="workbench-cta-choose"`
**Impact**: Updated 7 test assertions

### Heading Hierarchy
**Decision**: Heading hierarchy must not skip levels
**Rationale**: WCAG 2.1 requirement
**Impact**: Fixed StandaloneHome component (h3 → h2)

### Quality Gate Metadata
**Decision**: Standalone suites must ship description + >=1 primary action
**Rationale**: Quality gate requirement for home screen rendering
**Impact**: Added homeMeta to 5 suite registry entries

### Routing Contracts
**Decision**: [Document specific routing decisions]
**Rationale**: [Reason]
**Impact**: [Test/product changes]

## Evidence
- Local: `pnpm -C frontend run test:tier1` → 80/80 passing
- CI: Tier-1 workflow run <run-id> → GREEN
- Issue: Closes #261

## Testing
```bash
# Tier-1 suite
pnpm -C frontend run test:tier1

# Affected suites individually
pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/standaloneHomes.navigation.test.tsx --runInBand
pnpm -C frontend jest apps/os-shell/src/__tests__/accessibility/ --runInBand
pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/standaloneHomes.qualityGate.test.tsx --runInBand
pnpm -C frontend jest apps/os-shell/src/__tests__/standalone/suiteTiles.routing.test.tsx --runInBand
```
```

---

## Fast Diagnostics (Time Savers)

### 1. Find Exact Metadata Offenders
Add temporary debug throws inside test loop:
```ts
if (!suite.homeMeta?.description?.trim()) {
  throw new Error(`Missing description: ${suite.id}`);
}
if (!suite.homeMeta?.primaryActions?.length) {
  throw new Error(`Missing primaryActions: ${suite.id}`);
}
```

**Remove after identifying offenders.**

### 2. Confirm CTA Intent
Locate where `workbench-cta-choose` is rendered in product code:
```bash
grep -r "workbench-cta-choose" frontend/apps/os-shell/src/
```

Confirm:
- Only rendered when no parcel context
- Text and role are stable (tests can rely on them)

### 3. Heading Hierarchy Visual Check
```bash
# Find all heading elements in component
grep -E "<h[1-6]" frontend/apps/os-shell/src/shell/home/StandaloneHome.tsx
```

Verify `h1 → h2 → h3` progression (no skips).

---

## Progress Tracking

Update as you go:

- [ ] Step 0: Baseline captured (43/80 passing)
- [ ] Step 1: CTA fallback aligned (~5-7 tests)
- [ ] Step 2: A11y heading fixed (~10-15 tests)
- [ ] Step 3: Quality gate metadata (~8-10 tests)
- [ ] Step 4: Routing contracts (~5-10 tests)
- [ ] Validation: Local Tier-1 GREEN (80/80)
- [ ] Validation: CI Tier-1 GREEN (consecutive runs)
- [ ] PR created with Contract Decision Log
- [ ] Issue #261 closed
- [ ] v1.0.0 tagged and pushed

---

## Reference

**Session**: 2026-02-08 Control Plane v1.0.0 RC1 Shipping
**Commits**:
- [79b23771b](https://github.com/bsvalues/terrafusion_os_1.0/commit/79b23771b) - Tier-1 workflow validation
- [113e62e7c](https://github.com/bsvalues/terrafusion_os_1.0/commit/113e62e7c) - Root Cause 1 (useParcelContext import)
- [a57e7a113](https://github.com/bsvalues/terrafusion_os_1.0/commit/a57e7a113) - Root Cause 2 (expect syntax)

**Tags**:
- v1.0.0-rc.1 (79b23771b) - ✅ Shipped
- v1.0.0 (pending) - ⏳ Awaiting Tier-1 GREEN

**Tracking**: [Issue #261](https://github.com/bsvalues/terrafusion_os_1.0/issues/261)

**Session Summary**: `SESSION_SUMMARY_2026-02-08.md`

---

## Post-Mortem Patterns (Actual v1.0.0 Execution - 2026-02-09)

### What Actually Happened

**Initial Plan**: 37 apparent "contract alignment failures"
**Reality**: 37 failures were a **single import cascade crash** masquerading as contract failures

### Real Root Cause Chain (Corrected)

1. **Import Cascade Crash** (93ba9850b) - 30 minutes wasted on wrong assumption
   - **Symptom**: 37 test failures with varied error messages
   - **Root Cause**: `getWorkbenchHrefWithContext` function called at ShellHome.tsx:98 without import
   - **Effect**: ReferenceError cascade before assertions could run (appeared as contract failures)
   - **Fix**: Single import line addition
   - **Impact**: 0/80 → 67/80 passing (+24 tests unlocked)
   - **Learning**: **Baseline log revealed truth - ALL failures showed same ReferenceError stack trace**

2. **Syntax Pattern** (c7d65ad08) - Recurring smell from day prior
   - **Symptom**: "Expect takes at most one argument" in 10 tests
   - **Root Cause**: Invalid `expect(value, message)` pattern (14 locations in qualityGate.test.tsx)
   - **Pattern**: Same issue as registryConsistency.test.ts (a57e7a113)
   - **Fix**: Error-first conversion with preserved messages
   - **Impact**: 67/80 → 76/80 passing (+9 tests)
   - **Learning**: **Recurring pattern → should codify lint rule or helper**

3. **True Contract Deltas** (f3578ac53) - Only 4 were genuine mismatches
   - **Symptom**: 4 tests failing after crashes/syntax fixed
   - **Root Causes**:
     - CTA fallback: Test wrong, product correct (Slice 9 UX intentional)
     - A11y heading: h1 → h3 skip (product fix, WCAG 2.1 violation)
     - Routing (2 tests): Test expected wrong route (TerraTrace → `/trace` per suite definition)
   - **Fix**: 3 surgical patches (2 test updates, 1 product fix)
   - **Impact**: 76/80 → 80/80 passing (+4 tests)
   - **Learning**: **True contract decisions required product owner context**

### Critical Lessons

#### 1. Baseline Evidence Disproves Assumptions

**Wrong Approach** (wasted 30 min):
```bash
# Read test expectations → assume contract failures → start changing tests
```

**Right Approach** (saved hours):
```bash
# Capture baseline → read ACTUAL errors → identify pattern → fix root cause
pnpm run test:tier1 | tee tier1.baseline.log
grep "ReferenceError" tier1.baseline.log | head -20  # Revealed single crash
```

**Rule**: If >5 failures show varied messages, **read the baseline log first**. Crashes masquerade as contract failures.

#### 2. Cascade Fixes Have Exponential ROI

**Observed Impact**:
- Import fix (1 line): 24 tests unlocked (2400% ROI)
- Syntax fix (14 locations): 9 tests unlocked (64% ROI per location)
- Contract fixes (3 patches): 4 tests fixed (133% ROI)

**Priority Order** (validated):
1. **Crashes first** (import/reference errors) - unlocks test execution
2. **Syntax second** (invalid patterns) - enables assertions to run
3. **Contracts last** (deliberate decisions) - requires product context

**Rule**: Fix cascading failures before isolated failures. Check for repeated stack traces in baseline.

#### 3. Recurring Syntax Smells Need Automation

**Pattern Seen Twice** (2 days):
- Day 1: `expect(value, message)` in registryConsistency.test.ts (7 locations)
- Day 2: Same pattern in qualityGate.test.tsx (14 locations)

**Manual Fix** (works but fragile):
```ts
// Error-first pattern preserves governance messages
if (!condition) throw new Error(message);
expect(value).matcher();
```

**Better Solution** (not yet implemented):
```ts
// Custom matcher OR lint rule
// eslint-rule: no-expect-with-message (vitest)
// OR: import { expectWithMessage } from '@/test-utils'
```

**Action Item**: Add ESLint rule or custom helper to prevent recurrence across test files.

#### 4. "10-Minute Rule" Works

**Rule**: If failure takes >10 min to understand, STOP and classify:
- Crash? → grep for ReferenceError/TypeError
- Syntax? → Check expect() patterns
- Contract? → Read test vs product behavior

**Validated**: All 3 root causes identified within 10 min via classification.

### Efficiency Metrics

**Planned Approach** (from guide):
- Step 1 (CTA): 10 min → ~7 tests
- Step 2 (A11y): 30 min → ~15 tests
- Step 3 (Quality): 45-75 min → ~10 tests
- Step 4 (Routing): variable → ~5 tests
- **Total**: 2-4 hours

**Actual Execution**:
- Step 0 (Baseline): 5 min → discovered wrong assumption
- Step 1 (Import): 5 min → 24 tests (+2400% ROI)
- Step 2 (Syntax): 10 min → 9 tests
- Step 3 (Contracts): 15 min → 4 tests
- **Total**: 35 minutes (5-7x faster than planned)

**Key Difference**: Evidence-based debugging prevented "4h meander" warned against in guide.

### Updated Fast Diagnostics

#### Crash Detection (Add Before Classification)

```bash
# FIRST: Check for cascade crashes (before assuming contract failures)
pnpm run test:tier1 2>&1 | tee tier1.baseline.log

# Look for repeated stack traces
grep -E "ReferenceError|TypeError" tier1.baseline.log | sort | uniq -c | sort -rn

# If same error repeats >5 times → import/reference issue, NOT contract failure
```

#### Syntax Pattern Detection

```bash
# Common smell: "Expect takes at most one argument"
grep -r "expect([^)]*,\s*['\"\`]" frontend/apps/os-shell/src/__tests__/

# If matches found → syntax fix needed (error-first pattern)
```

### Contract Decision Quick Reference (Actual)

| Decision | Rationale | Fix Type | Commit |
|----------|-----------|----------|--------|
| CTA fallback shown | Intentional Slice 9 UX (testid exists) | Test update | f3578ac53 |
| h3 → h2 heading | WCAG 2.1 requirement (no skips) | Product fix | f3578ac53 |
| Trace → `/trace` | Suite definition correct | Test update | f3578ac53 |

### Recommended Guide Updates

1. **Step -1**: Add "Crash Detection" before Step 0
   - Grep baseline for repeated errors
   - If >5 identical stack traces → import cascade, not contracts
   
2. **Step 0**: Update "failing test files" → "failing test files OR crash patterns"
   - Document how to distinguish crash vs true failure

3. **Fast Diagnostics**: Add "Crash vs Contract" decision tree
   - ReferenceError/TypeError → import/reference issue
   - "Expect takes..." → syntax issue  
   - "Expected X / Received Y" → contract issue

4. **Commit Plan**: Add "Crash fixes" as Step 0 (before CTA fallback)
   - Import/reference fixes first (cascades unlock rest)

---

**Session Reference**: Issue #261 closed, v1.0.0 tagged (f3578ac53)

**Government. Transcended.** 🏛️
