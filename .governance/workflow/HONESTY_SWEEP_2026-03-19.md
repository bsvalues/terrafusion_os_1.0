# Honesty Sweep — 2026-03-19

Date: 2026-03-19
Phase: Phase 5 — Honesty Sweep (Named Gate — Cannot Be Skipped)
Authority: docs/superpowers/specs/2026-03-19-full-ecosystem-go-live-roadmap-design.md

## Sweep Status: PASS — ALL 4 SURFACES CLASSIFIED REAL

All four named surfaces are now REAL with explicit fallback provenance.

---

## Surface 1: useTodaysWork.ts

File: `frontend/apps/os-shell/src/hooks/useTodaysWork.ts`

### Trace

- Hook starts with hardcoded `SAMPLE_TASKS` (3 items)
- On mount: calls `getQueueItems()` from `services/suites/queueService`
- If backend responds with queue items: replaces sample tasks with live data
- Priority/status/route sorting applied to live items
- Explicit fallback pattern: sample → live promotion

### Classification

**REAL** (with transparent fallback)

API-first hook. Live Dais queue service drives content when backend reachable.
Sample tasks shown only during load or when backend is offline — standard no-flicker pattern.
No misrepresentation of data source.

---

## Surface 2: useBudgetData.ts

File: `frontend/apps/os-shell/src/applications/terra-levy/hooks/useBudgetData.ts`

### Trace

- Calls `Promise.allSettled([api.get('/levy/dashboard/summary'), api.get('/levy/budget/scenarios'), api.get('/levy/budget/visualization')])`
- Sets `isSampleData=true` initially
- If any endpoint returns category array: uses real data, sets `isSampleData=false`
- If no category data received: leaves `isSampleData=true`, sets appropriate error message
- Returns `isSampleData` flag to consumers for transparency rendering

### Classification

**REAL** (with transparent fallback + provenance flag)

API-first hook. Explicit `isSampleData` flag returned to consumers.
Budget data comes from live levy service when available.
No silent fake-out: when API returns no data, consumers know via `isSampleData=true`.

---

## Surface 3: CostManual.tsx

File: `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx`

### Trace

- Imports `getCostSchedule` from `services/forge/propertyValuationClientService`
- Calls live cost schedule API in `useEffect` (`getCostSchedule({ qualityClass })`)
- Normalizes live payload into rendered table rows
- Falls back to `SAMPLE_COST_SCHEDULES` only on API failure/empty payload
- Sets explicit provenance state (`isSampleData`) and conditionally renders `DemoDataBanner`

### Classification

**REAL** (with transparent fallback)

Component is API-first and renders live CostForge schedule data when available.
Fallback to sample rows is explicit and disclosed via provenance indicator + DemoDataBanner.

### Evidence

- Implementation: `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx`
- Contract tests: `w5dHonestySweep.contract.test.ts` + `w5eUIContractProof.contract.test.ts` PASS

---

## Surface 4: BatchCostRun.tsx

File: `frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx`

### Trace

- Implements live preview endpoint call: `GET /api/forge/cost/batch/preview`
- Implements live apply endpoint call: `POST /api/forge/cost/batch/apply`
- Uses TerraTrace canonical event helpers (`emitToolInvoked`, `emitToolSucceeded`, `emitToolFailed`)
- Maintains explicit `BACKEND_APPLY_CAPABLE` gate and `apply_pending_backend` fallback mode
- Falls back to fixture preview only when backend is unavailable, with explicit provenance marker

### Classification

**REAL** (with transparent fallback + TerraTrace lifecycle events)

Component now attempts real preview/apply execution through live backend endpoints.
If backend is unavailable, fallback behavior is explicit (`apply_pending_backend`) and disclosed.
Trace fidelity requirement is satisfied by invoke/result paired TerraTrace events.

### Evidence

- Implementation: `frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx`
- Contract tests: `w5dHonestySweep.contract.test.ts` + `w5eUIContractProof.contract.test.ts` PASS

---

## Sweep Summary

| Surface | Classification | Fix Status |
|---|---|---|
| useTodaysWork.ts | REAL | No fix needed |
| useBudgetData.ts | REAL | No fix needed |
| CostManual.tsx | REAL | API-first + transparent fallback implemented |
| BatchCostRun.tsx | REAL | Live preview/apply + TerraTrace events implemented |

## Gate Status

Phase 5 gate condition: "All 4 surfaces classified REAL with evidence."
Current: 4/4 REAL.

**Phase 5 gate: GREEN — Honesty Sweep complete.**

## Reclassification Protocol

After each fix:
1. Re-read component and trace data source
2. Verify real API call present and active
3. Update classification in this sweep doc
4. Sign reclassification with date and committer

| Surface | Reclassified By | Date | New Classification |
|---|---|---|---|
| CostManual.tsx | GitHub Copilot | 2026-03-19 | REAL |
| BatchCostRun.tsx | GitHub Copilot | 2026-03-19 | REAL |
