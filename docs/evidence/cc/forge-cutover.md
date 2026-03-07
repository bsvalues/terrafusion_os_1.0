# CC Lane Evidence: Forge Cutover (Phase 1 + Phase 5)

**Lane:** CC
**Date:** 2026-03-07
**Scope:** TerraForge cost approach engine — elimination of localStorage persistence, deprecation of legacy client-side calculators, establishment of `runGovernedValuation()` as sole production path.

---

## What Was Done

### localStorage Elimination

All localStorage-based persistence in `forgeService.ts` was removed during R1. The file retains 13 occurrences of the string `localStorage`, but every one is inside a `console.warn()` tombstone message of the form:

```
console.warn('[forgeService] saveScenario: localStorage persistence removed in R1. Scenario/appeal/audit data now governed by trace store.');
```

These warnings fire if legacy callers attempt to use the old scenario/appeal/audit save/load paths. They do not read from or write to `localStorage`. The functions return empty arrays or no-ops.

Affected methods (all tombstoned):
- `saveScenario` / `loadScenarios` / `deleteScenario` (lines 428-444)
- `saveAppeal` / `loadAppeals` / `updateAppeal` / `deleteAppeal` (lines 595-613)
- `appendAuditEntry` / `loadAuditEntries` / `loadAuditEntriesForParcel` / `clearAuditEntries` (lines 803-822)

**Grep evidence:** `localStorage` in forgeService.ts production calls = 0 (all 13 hits are in `console.warn` strings).

### `runGovernedValuation()` as Sole Production Path

`runGovernedValuation()` (line 903 of `forgeService.ts`) is the only production valuation entry point. It enforces:

1. Gate 5 confirmation preconditions (`confirmed === true`, non-empty `reasonCode`)
2. Lazy-imports `invokePilotTool` from `pilotApi.ts`
3. Calls `invokePilotTool({ toolId: 'run_valuation_model', ... })`
4. Backend path: `POST /pilot/invoke` -> `PilotController` -> `handlers.real.ts` -> `POST /api/costforge/calculate`

Full invocation chain from UI:
```
ForgeExecutionPanel -> useToolInvocation -> pilotApi.invokePilotTool()
  -> POST /pilot/invoke -> PilotController -> handlers.real.ts
  -> POST /api/costforge/calculate
```

### Legacy Calculators Deprecated

Seven legacy calculator functions retain the `@deprecated` annotation:

> `@deprecated Use runGovernedValuation() for production flows. Client-side calculation retained for offline/preview only.`

Found at lines 291, 300, 310, 326, 489, 544, 686. These are not called from any production UI path (ForgeExecutionPanel uses the governed path exclusively).

### COST_MATRIX Retained as UI Reference Only

`COST_MATRIX` (line 118 of `forgeService.ts`) is a `readonly CostMatrixEntry[]` array extracted from Harris PACS 9.0. It is used in one place: `lookupMatrixEntry()` (line 267), which provides UI display data for building type selection dropdowns. It does not participate in any calculation or valuation flow. All production calculations go through the backend via `runGovernedValuation()`.

---

## Ticket Status

| Ticket | Description | Status |
|--------|-------------|--------|
| CC-FORGE-01 | localStorage elimination from forgeService.ts | **CLOSED** |
| CC-FORGE-02 | runGovernedValuation() as sole production path | **CLOSED** |
| CC-FORGE-03 | Legacy calculator deprecation annotations | **CLOSED** |
| CC-FORGE-04 | COST_MATRIX retained as UI reference only | **CLOSED** |

---

## Verification

- `tsc` passes with no errors related to forgeService.ts
- No regressions in phase83, phase85, or phase86 test suites
- `localStorage` grep in forgeService.ts returns only console.warn tombstones (0 production calls)
- `runGovernedValuation` is the only export that reaches `invokePilotTool`

---

**File:** `frontend/apps/os-shell/src/services/forgeService.ts`
**Verified by:** Claude Code (CC lane agent)
