# Honesty Sweep — 2026-03-19

Date: 2026-03-19
Phase: Phase 5 — Honesty Sweep (Named Gate — Cannot Be Skipped)
Authority: docs/superpowers/specs/2026-03-19-full-ecosystem-go-live-roadmap-design.md

## Sweep Status: VIOLATIONS FOUND — PENDING FIX

Two surfaces classified HONESTY VIOLATION. Fix required before Phase 5 can close.

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

- Top of component: `const SAMPLE_COST_SCHEDULES: CostScheduleRow[] = [...]` — 6 hardcoded rows
- `filtered = SAMPLE_COST_SCHEDULES.filter(...)` — filtering only within static array
- No API call anywhere in the component
- No service import
- `DemoDataBanner` rendered at top (governance transparency marker present)

### Classification

**HONESTY VIOLATION**

Component renders only hardcoded static data. No connection to real CostForge data pipeline.
The roadmap requires: "Renders real CostForge data pipeline output, not static placeholder values."
`DemoDataBanner` indicates governance awareness, but does not eliminate the violation.

### Fix Required

- Wire to real cost schedule API endpoint (`/forge/cost/schedules` or equivalent)
- Or: replace static array with TerraForge CostForge service call
- DemoDataBanner may remain during transition window but must reflect real data source
- Implementation scope: `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx`
- Write lane: TerraForge

---

## Surface 4: BatchCostRun.tsx

File: `frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx`

### Trace

- `const BACKEND_APPLY_CAPABLE = false;` — explicit disconnection flag
- All run records backed by fixture data
- Comment: "In production this would be sent to TerraTrace; for now log to console"
- Audit events fire to `console.info`, not TerraTrace
- `DemoDataBanner` rendered
- Apply mode blocked by `BACKEND_APPLY_CAPABLE` guard

### Classification

**HONESTY VIOLATION**

Component cannot trigger real batch valuation runs. Backend apply path is explicitly disabled.
The roadmap requires: "Triggers real batch valuation run, not a UI-only simulation."
`DemoDataBanner` + `BACKEND_APPLY_CAPABLE = false` flag are transparency measures,
but the component does not meet the REAL classification criteria.

### Fix Required

- Wire apply path to real TerraFusion batch valuation service
- Replace console audit with TerraTrace emit (tool_invoked / tool_succeeded / tool_failed)
- Set `BACKEND_APPLY_CAPABLE = true` after real backend is connected
- Implementation scope: `frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx`
- Write lane: TerraForge + TerraTrace binding

---

## Sweep Summary

| Surface | Classification | Fix Status |
|---|---|---|
| useTodaysWork.ts | REAL | No fix needed |
| useBudgetData.ts | REAL | No fix needed |
| CostManual.tsx | HONESTY VIOLATION | Fix pending — backend wiring required |
| BatchCostRun.tsx | HONESTY VIOLATION | Fix pending — backend wiring required |

## Gate Status

Phase 5 gate condition: "All 4 surfaces classified REAL with evidence."
Current: 2/4 REAL, 2/4 HONESTY VIOLATION.

**Phase 5 gate: OPEN — violations must be fixed and re-swept before gate closes.**

## Reclassification Protocol

After each fix:
1. Re-read component and trace data source
2. Verify real API call present and active
3. Update classification in this sweep doc
4. Sign reclassification with date and committer

| Surface | Reclassified By | Date | New Classification |
|---|---|---|---|
| CostManual.tsx | | | |
| BatchCostRun.tsx | | | |
