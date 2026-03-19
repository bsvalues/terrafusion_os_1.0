# Phase 6 — Debt Triage Pass Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the highest-signal remaining TypeScript debt (`catch (error: any)`, `APIResponse<any>` in CostForge hook, console noise) in a safe, gate-guarded pass while keeping all existing tests green.

**Architecture:** Three focused sweeps — error type narrowing (3 files), CostForge response type tightening (1 file), console noise removal (3 files) — each committed independently before a final regression gate. The auth files are already clean (0 `any`); Phase 6 attacks the next tier of debt identified in the Wave 0 ledger.

**Tech Stack:** TypeScript 5.3, Vitest, `pnpm run type-check` (0-error gate), `node --test phase83-tools.test.mjs` (56/56 gate)

---

## Pre-Phase Gate (run BEFORE touching any file)

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
pnpm run type-check          # must be 0 errors
pnpm exec vitest --run       # note current pass count (baseline)
cd C:/Users/bsval/terrafusion_os_1.0
node --test os-platform/core/tests/phase83-tools.test.mjs   # 56/56 required
```

If any gate is red before you start, STOP and report. Do not proceed.

---

## File Map

| File | Change | Risk |
|------|--------|------|
| `src/api/researchServices.ts` | `catch (error: any)` → `catch (error: unknown)` with DOMException/Error narrowing | Low — same runtime behaviour |
| `src/components/test/APIConnectionTest.tsx` | `catch (error: any)` → `catch (error: unknown)` | Low |
| `src/hooks/useBackendConnection.tsx` | `catch (error: any)` → `catch (error: unknown)` with AbortError guard | Low |
| `src/hooks/useCostForgeAPI.ts` | `APIResponse<any>` → typed; `Record<string, any>` → `Record<string, unknown>` | Low — no runtime impact |
| `src/components/modules/ModuleHost.tsx` | `console.debug` → `console.warn` on error paths | Low |
| `src/components/ai/GovernmentAIStatus.tsx` | Remove one `console.info` loading noise call | Trivial |
| `src/pages/workbench/tabs/PropertyForge.tsx` | Remove one `console.debug` value indicator call | Trivial |
| `src/hooks/useCostForgeAPI.ts` | Remove `console.debug` perf timing (covered by SLA warn below it) | Trivial |
| `src/__tests__/phase6/phase6-debt-contract.test.ts` | **NEW** — Contract test ensuring Phase 6 targets stay clean | — |

---

## Chunk 1: Error Type Narrowing

### Task 1: `catch (error: any)` → `catch (error: unknown)` — 3 files

**Background:** TypeScript allows `catch (e: any)` but the correct type is `unknown`. Accessing `.name` or `.message` on `unknown` requires a type guard. The pattern to apply uniformly:

```typescript
// AbortError is DOMException in fetch API (not Error subclass)
const isAbort = error instanceof DOMException && error.name === 'AbortError';
const message = error instanceof Error ? error.message : String(error);
```

**Files:**
- Modify: `src/api/researchServices.ts` (line 311)
- Modify: `src/components/test/APIConnectionTest.tsx` (line 49)
- Modify: `src/hooks/useBackendConnection.tsx` (line 101)
- Create: `src/__tests__/phase6/phase6-debt-contract.test.ts`

---

- [ ] **Step 1: Write the contract test (RED)**

Create `src/__tests__/phase6/phase6-debt-contract.test.ts`:

```typescript
/**
 * Phase 6 Debt Contract Tests
 *
 * Proves: catch(error: any) eliminated from production files.
 * This test reads source files and asserts no `catch (error: any)` patterns remain.
 *
 * We do NOT test runtime behaviour here — that's covered by existing hook/API tests.
 * We test the source text because TypeScript types are erased at runtime.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '../../');

function readSrc(rel: string) {
  return readFileSync(join(SRC, rel), 'utf8');
}

describe('Phase 6 — Debt Contract', () => {
  describe('catch (error: any) eliminated', () => {
    const targets = [
      'api/researchServices.ts',
      'components/test/APIConnectionTest.tsx',
      'hooks/useBackendConnection.tsx',
    ];

    it.each(targets)('%s has no catch(error: any)', (file) => {
      const src = readSrc(file);
      expect(src).not.toMatch(/catch\s*\(\s*error\s*:\s*any\s*\)/);
    });
  });

  describe('useCostForgeAPI: Record<string, any> eliminated', () => {
    it('useCostForgeAPI.ts has no Record<string, any>', () => {
      const src = readSrc('hooks/useCostForgeAPI.ts');
      expect(src).not.toMatch(/Record<string,\s*any>/);
    });

    it('useCostForgeAPI.ts has no APIResponse<any>', () => {
      const src = readSrc('hooks/useCostForgeAPI.ts');
      expect(src).not.toMatch(/APIResponse<any>/);
    });
  });

  describe('console noise eliminated', () => {
    it('GovernmentAIStatus.tsx: no console.info loading noise', () => {
      const src = readSrc('components/ai/GovernmentAIStatus.tsx');
      expect(src).not.toMatch(/console\.info\('📊 Government AI: Loading/);
    });

    it('PropertyForge.tsx: no console.debug value indicator', () => {
      const src = readSrc('pages/workbench/tabs/PropertyForge.tsx');
      expect(src).not.toMatch(/console\.debug\(`\[Forge\] Value indicated/);
    });

    it('useCostForgeAPI.ts: no console.debug perf timing', () => {
      const src = readSrc('hooks/useCostForgeAPI.ts');
      expect(src).not.toMatch(/console\.debug\(\s*`\[CostForge API\]/);
    });
  });
});
```

- [ ] **Step 2: Run the test — confirm RED**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
pnpm exec vitest run src/__tests__/phase6/phase6-debt-contract.test.ts
```

Expected: **FAIL** — all `catch (error: any)` assertions fail, all `APIResponse<any>` assertions fail, all console assertions fail. If it passes immediately, re-read the file paths — something is wrong.

---

- [ ] **Step 3: Fix `researchServices.ts` — error narrowing**

Open `src/api/researchServices.ts` line 311. Replace the **entire catch block** (from `} catch` through the closing `}`) with:

```typescript
// AFTER — replaces the full catch block:
} catch (error: unknown) {
  const duration = performance.now() - startTime;

  // Narrow error type — fetch AbortError is a DOMException, not an Error subclass
  const isAbort = error instanceof DOMException && error.name === 'AbortError';
  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? (error.name ?? 'UNKNOWN_ERROR') : 'UNKNOWN_ERROR';

  // Retry logic for network errors and 5xx status codes
  const isRetryable =
    isAbort ||
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504');

  if (isRetryable && retryCount < MAX_RETRIES) {
    const delay = RETRY_DELAYS[retryCount];
    console.warn(
      `⚠️ API error, retrying ${endpoint} in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return apiClient<T>(endpoint, options, retryCount + 1);
  }

  console.error(`❌ API failure: ${endpoint} (${duration.toFixed(2)}ms)`, error);

  return {
    success: false,
    data: null as unknown as T,
    error: {
      code: name,
      message: message,
      details: { endpoint, retryCount },
      retryable: isRetryable,
    },
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      duration,
      cached: false,
    },
  };
}
```

Key: `error.name` and `error.message` both replaced with narrowed `name` and `message` variables throughout the block — no raw `error.*` accesses remain.

- [ ] **Step 4: Fix `APIConnectionTest.tsx` — error narrowing**

Open `src/components/test/APIConnectionTest.tsx` line 49. Change:

```typescript
// BEFORE:
} catch (error: any) {
  const endTime = performance.now();
  return {
    endpoint: name,
    status: 'error',
    error: error.message || 'Network error',
    responseTime: Math.round(endTime - startTime),
  };
}
```

To:

```typescript
// AFTER:
} catch (error: unknown) {
  const endTime = performance.now();
  return {
    endpoint: name,
    status: 'error',
    error: error instanceof Error ? error.message : 'Network error',
    responseTime: Math.round(endTime - startTime),
  };
}
```

- [ ] **Step 5: Fix `useBackendConnection.tsx` — error narrowing**

Open `src/hooks/useBackendConnection.tsx` line 101. Change:

```typescript
// BEFORE:
} catch (error: any) {
  const endTime = performance.now();
  const responseTime = Math.round(endTime - startTime);

  if (error.name === 'AbortError') {
    logger.debug('Health check aborted');
    return null;
  }

  const errorMessage = error.message || 'Unknown connection error';
  logger.error('Backend connection failed:', errorMessage);
```

To:

```typescript
// AFTER:
} catch (error: unknown) {
  const endTime = performance.now();
  const responseTime = Math.round(endTime - startTime);

  if (error instanceof DOMException && error.name === 'AbortError') {
    logger.debug('Health check aborted');
    return null;
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
  logger.error('Backend connection failed:', errorMessage);
```

- [ ] **Step 6: Type-check — must stay 0 errors**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
pnpm run type-check
```

Expected: `Found 0 errors.`

If there are errors, read them and fix before continuing. Common issue: if the catch block uses `error.message` more than once, each usage needs to use the narrowed `message` variable.

- [ ] **Step 7: Run contract test — expect partial GREEN**

```bash
pnpm exec vitest run src/__tests__/phase6/phase6-debt-contract.test.ts
```

Expected: The 3 `catch (error: any)` tests now PASS. The `useCostForgeAPI` and console tests still FAIL.

- [ ] **Step 8: Commit Task 1**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git add frontend/apps/os-shell/src/api/researchServices.ts \
        frontend/apps/os-shell/src/components/test/APIConnectionTest.tsx \
        frontend/apps/os-shell/src/hooks/useBackendConnection.tsx \
        frontend/apps/os-shell/src/__tests__/phase6/phase6-debt-contract.test.ts
git commit -m "fix(types): catch(error: unknown) narrowing in researchServices, APIConnectionTest, useBackendConnection"
```

---

## Chunk 2: CostForge Type Tightening

### Task 2: `useCostForgeAPI.ts` — Replace `any` with concrete types

**Background:** The CostForge hook has 9 `any` occurrences. Three patterns:
1. `Record<string, any>` (2 occurrences) — safe to tighten to `Record<string, unknown>`
2. `APIResponse<any>` for endpoints whose response shape is not yet typed — define minimal interfaces
3. `console.debug` perf timing (1 occurrence) — remove (SLA warn below it is sufficient)

**Files:**
- Modify: `src/hooks/useCostForgeAPI.ts`

---

- [ ] **Step 1: Read the existing interfaces in `useCostForgeAPI.ts`**

The file already has these well-typed interfaces (confirmed from recon):
- `CostAnalysis`, `CostComponent`, `CostBreakdown`, `CostCategory`
- `CostComparison`, `CostForecast`, `YearlyForecast`
- `SystemStatus`, `PerformanceMetrics`

The `any` occurrences are in the **untyped** operations: batch-calculate, agents/status, agents/scale, sync/harris-pacs, and health check.

- [ ] **Step 2: Add the four missing response interfaces**

Find the section after the existing interfaces (around line 80 in the file, before the `useCostForgeAPI` function). Add:

```typescript
/** Minimal response shape for /api/costforge/batch-calculate */
interface BatchCalculateResult {
  results: CostAnalysis[];
  processed: number;
  failed: number;
  countyId: string;
}

/** Minimal response shape for /api/costforge/agents/status */
interface AgentStatusResult {
  activeAgents: number;
  totalAgents: number;
  healthyAgents: number;
  agentDetails: Array<{ id: string; status: string; lastActivity: string }>;
}

/** Minimal response shape for /api/costforge/agents/scale */
interface AgentScaleResult {
  previousCount: number;
  targetCount: number;
  currentCount: number;
  scalingStatus: string;
}

/** Minimal response shape for /api/costforge/sync/harris-pacs */
interface HarrisPACSSyncResult {
  countyId: string;
  syncType: string;
  recordsSynced: number;
  recordsFailed: number;
  syncStarted: string;
  syncCompleted: string;
  status: string;
}
```

- [ ] **Step 3: Replace the `any` occurrences**

Make these exact replacements in `useCostForgeAPI.ts`:

**Replace 1** — `additionalParameters` in `CostCalculationRequest` (line 22):
```typescript
// FROM:
additionalParameters?: Record<string, any>;
// TO:
additionalParameters?: Record<string, unknown>;
```

**Replace 2** — `systemMetrics` in the `SystemStatus` interface (line ~103):
```typescript
// FROM:
systemMetrics: Record<string, any>;
// TO:
systemMetrics: Record<string, unknown>;
```

**Call-site check:** After changing these two `Record<string, any>` fields, run `pnpm run type-check`. If any call site passes a `Record<string, string>` or other narrower type and gets a type error, widen it at the call site by adding `as Record<string, unknown>` at the call — do NOT revert the interface. `Record<string, string>` is not directly assignable to `Record<string, unknown>` in TypeScript's type system.

**Replace 3** — `console.debug` perf timing (line ~162):
```typescript
// FROM:
console.debug(
  `[CostForge API] ${options.method || 'GET'} ${endpoint} - ${duration.toFixed(2)}ms`
);
// TO:
// (remove these 3 lines entirely — the SLA warn below covers it)
```

**Replace 4** — `batchCalculateValuations`:
```typescript
// FROM:
async (propertyIds: string[], countyId: string): Promise<APIResponse<any>> => {
  return apiCall<any>('/api/costforge/batch-calculate', {
// TO:
async (propertyIds: string[], countyId: string): Promise<APIResponse<BatchCalculateResult>> => {
  return apiCall<BatchCalculateResult>('/api/costforge/batch-calculate', {
```

**Replace 5** — `getAIAgentStatus`:
```typescript
// FROM:
const getAIAgentStatus = useCallback(async (): Promise<APIResponse<any>> => {
  return apiCall<any>('/api/costforge/agents/status');
// TO:
const getAIAgentStatus = useCallback(async (): Promise<APIResponse<AgentStatusResult>> => {
  return apiCall<AgentStatusResult>('/api/costforge/agents/status');
```

**Replace 6** — `scaleAIAgents`:
```typescript
// FROM:
async (targetCount: number): Promise<APIResponse<any>> => {
  return apiCall<any>('/api/costforge/agents/scale', {
// TO:
async (targetCount: number): Promise<APIResponse<AgentScaleResult>> => {
  return apiCall<AgentScaleResult>('/api/costforge/agents/scale', {
```

**Replace 7** — `syncWithHarrisPACS`:
```typescript
// FROM:
async (countyId: string, syncType: string = 'full'): Promise<APIResponse<any>> => {
  return apiCall<any>('/api/costforge/sync/harris-pacs', {
// TO:
async (countyId: string, syncType: string = 'full'): Promise<APIResponse<HarrisPACSSyncResult>> => {
  return apiCall<HarrisPACSSyncResult>('/api/costforge/sync/harris-pacs', {
```

**Replace 8 + 9** — health check `apiCall<any>`:

Find the health check block (line ~314 area):
```typescript
// FROM:
const response = await apiCall<any>('/api/health')
// TO:
const response = await apiCall<{ status: string }>('/api/health')
```

- [ ] **Step 4: Type-check**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
pnpm run type-check
```

Expected: `Found 0 errors.`

If errors appear, they will be about callers of these functions trying to access properties that are now typed. Read the error message, find the caller, and either update the caller's property access or widen the interface if the caller accesses a real field.

- [ ] **Step 5: Run contract test — expect more GREEN**

```bash
pnpm exec vitest run src/__tests__/phase6/phase6-debt-contract.test.ts
```

Expected: `catch` tests PASS, `useCostForgeAPI` tests PASS, console tests still FAIL.

- [ ] **Step 6: Commit Task 2**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git add frontend/apps/os-shell/src/hooks/useCostForgeAPI.ts
git commit -m "fix(types): type useCostForgeAPI responses — BatchCalculate, AgentStatus, AgentScale, HarrisPACS sync"
```

---

## Chunk 3: Console Noise Removal

### Task 3: Remove/demote console noise in 3 files

**Background:** Per the Wave 0 debt ledger, `console.debug` and `console.info` in non-error paths are mechanical cleanup candidates. We target only the clearly-noise calls; legitimate error-boundary calls (`console.error`, SLA warnings) are untouched.

**Files:**
- Modify: `src/components/ai/GovernmentAIStatus.tsx` (remove 1 console.info)
- Modify: `src/pages/workbench/tabs/PropertyForge.tsx` (remove 1 console.debug)
- Modify: `src/components/modules/ModuleHost.tsx` (promote 2 console.debug → console.warn)

---

- [ ] **Step 1: `GovernmentAIStatus.tsx` — remove loading noise**

Open `src/components/ai/GovernmentAIStatus.tsx` line ~26. Remove this line entirely:

```typescript
// REMOVE:
console.info('📊 Government AI: Loading elite metrics');
```

Do not replace with anything. This is pure logging noise (fires every time the component fetches; no operational value).

- [ ] **Step 2: `PropertyForge.tsx` — remove debug value indicator**

Open `src/pages/workbench/tabs/PropertyForge.tsx` line ~97. Remove this line entirely:

```typescript
// REMOVE:
console.debug(`[Forge] Value indicated: ${approach} = $${value.toLocaleString()}`);
```

Do not replace with anything. This is developer debug output; the forge chart already shows this data visually.

- [ ] **Step 3: `ModuleHost.tsx` — promote debug → warn on error paths**

Open `src/components/modules/ModuleHost.tsx`. Find the two `console.debug` calls in error-path `.catch()` handlers (lines ~187 and ~195) and change both from `console.debug` to `console.warn`:

```typescript
// FROM (line ~187):
console.debug(`[ModuleHost] Load failed for ${normalizedId}:`, error.message);
// TO:
console.warn(`[ModuleHost] Load failed for ${normalizedId}:`, error.message);

// FROM (line ~195):
console.debug(`[ModuleHost] Retry failed for ${normalizedId}:`, error.message);
// TO:
console.warn(`[ModuleHost] Retry failed for ${normalizedId}:`, error.message);
```

Rationale: these fire only when a module fails to load — that is a real error condition, not debug noise. `console.warn` is appropriate here (not `console.error` because the system already handles via error boundary).

**Important — `.catch()` callback typing:**
TypeScript's `Promise.catch()` signature types the rejection reason as `any` (not `unknown`), so you **cannot** annotate the parameter as `(error: unknown)` — that causes a type error. The callbacks are currently `(error) =>` with no annotation, TypeScript treats them as `any`. The safe change is to use `String(error)` instead of `error.message`:

```typescript
// FROM:
loadModule(normalizedId).catch((error) => {
  console.debug(`[ModuleHost] Load failed for ${normalizedId}:`, error.message);
});
// TO:
loadModule(normalizedId).catch((error) => {
  console.warn(`[ModuleHost] Load failed for ${normalizedId}:`, String(error));
});

// FROM:
retryModule(normalizedId).catch((error) => {
  console.debug(`[ModuleHost] Retry failed for ${normalizedId}:`, error.message);
});
// TO:
retryModule(normalizedId).catch((error) => {
  console.warn(`[ModuleHost] Retry failed for ${normalizedId}:`, String(error));
});
```

`String(error)` produces `"Error: <message>"` for Error instances and a safe string for anything else. No type annotation changes needed on the callbacks.

- [ ] **Step 4: Type-check**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
pnpm run type-check
```

Expected: `Found 0 errors.`

- [ ] **Step 5: Run contract test — expect ALL GREEN**

```bash
pnpm exec vitest run src/__tests__/phase6/phase6-debt-contract.test.ts
```

Expected: **ALL PASS** — 8/8 or however many assertions.

- [ ] **Step 6: Commit Task 3**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git add frontend/apps/os-shell/src/components/ai/GovernmentAIStatus.tsx \
        frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx \
        frontend/apps/os-shell/src/components/modules/ModuleHost.tsx
git commit -m "fix(console): remove debug/info noise; promote module load failures to console.warn"
```

---

## Chunk 4: Gate Regression + Governance Closure

### Task 4: Full regression gate + seal

**Files:**
- Modify: `.governance/workflow/progress.md`

---

- [ ] **Step 1: Run type-check**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
pnpm run type-check
```

Expected: `Found 0 errors.` If any errors, fix before continuing — do NOT seal with type errors.

- [ ] **Step 2: Run phase83 gate**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
node --test os-platform/core/tests/phase83-tools.test.mjs
```

Expected: `56/56 PASS`

- [ ] **Step 3: Run unit tests**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend
pnpm exec vitest --run
```

Expected: All existing tests PASS plus the 8 new Phase 6 contract tests. Note the final count.

- [ ] **Step 4: Update progress.md**

Open `.governance/workflow/progress.md` and add a new "Current Status" table at the top of the status section and a Phase 6 record in the history:

**Replace the Current Status table with:**

```markdown
| Field | Value |
|-------|-------|
| **Slice** | **Slice 27 — Phase 6: Debt Triage Pass — error narrowing, CostForge types, console noise** |
| **Phase** | Phase 6 — **CP-W6-1 CLOSED** ✅ |
| **Task** | catch(error:any)→unknown (3 files); APIResponse<any>→typed (useCostForgeAPI 9 occurrences); console noise removed (3 files); 8 contract tests added |
| **Status** | ✅ COMPLETE — hard stop reinstated |
| **Latest Commit** | `<seal-commit-sha>` |
```

**Add a Phase 6 history block:**

```markdown
## Phase 6 — CP-W6-1 CLOSED — 2026-03-18

### Targets Addressed

| Target | Files | Result |
|--------|-------|--------|
| `catch (error: any)` → `catch (error: unknown)` | researchServices.ts, APIConnectionTest.tsx, useBackendConnection.tsx | ✅ Eliminated |
| `APIResponse<any>` → typed interfaces | useCostForgeAPI.ts (9 occurrences) | ✅ Typed |
| `Record<string, any>` → `Record<string, unknown>` | useCostForgeAPI.ts | ✅ Tightened |
| `console.debug` noise | PropertyForge.tsx, useCostForgeAPI.ts | ✅ Removed |
| `console.info` noise | GovernmentAIStatus.tsx | ✅ Removed |
| `console.debug` → `console.warn` on error paths | ModuleHost.tsx | ✅ Promoted |

### Gates
- `pnpm run type-check` → **0 errors**
- `node --test os-platform/core/tests/phase83-tools.test.mjs` → **56/56 PASS**
- `pnpm exec vitest --run` → **[count]/[count] PASS** (includes 8 new Phase 6 contract tests)

### New Files
- `src/__tests__/phase6/phase6-debt-contract.test.ts` — 8 contract tests asserting debt eliminated

**Phase 7 (Sovereign Spine Contract Hardening) requires new explicit founder go.**
```

- [ ] **Step 5: Seal commit**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git add .governance/workflow/progress.md
git commit -m "chore(phase6): seal — Debt Triage Pass — error narrowing, CostForge types, console noise — CP-W6-1 CLOSED"
```

---

## Quick Reference — Debt Ledger Ceiling

From `Wave 0 Debt Ledger` (CP-W0-1, baseline `de0243388`):

| Pattern | Prod Baseline | Phase 5B After | Phase 6 Removes |
|---------|--------------|----------------|-----------------|
| `as any` casts | ~144 | ~126 (Phase 5B swept 18) | 0 (not targeted this phase) |
| `catch (error: any)` | counted in `: any` | 3 remaining | **3 → 0** |
| `APIResponse<any>` | counted in `<any>` | 6 in useCostForge | **6 → 0** |
| `Record<string, any>` | counted in `: any` | 2 in useCostForge | **2 → 0** |
| `console.debug` (prod) | ~9 | 9 | **−3 removed, 2 promoted to warn** |
| `console.info` (prod) | ~7 | 7 | **−1 removed** |

Gate after each batch: `pnpm run type-check` must stay at `0 errors`.
