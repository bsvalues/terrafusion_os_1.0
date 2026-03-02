# R1 Week 2 — All Agents Briefing

**Phase**: UI Governance + Forge Wiring
**Prerequisite**: Week 1 PRs merged to `r1/integration`
**Integration test**: After Week 2, invoke `run_valuation_model` from the frontend UI through the governed path and see real data in the Execution Console.

---

## Codex (Backend) — Week 2

**Branch**: `codex/r1-week2-trace-forge`

### CX-7: Trace Event Endpoint for PilotController

The Pilot system (TypeScript, port 3333) needs to emit trace events that persist to a queryable store. Two options:

**Option A (Recommended)**: Pilot uses its own Drizzle/SQLite trace store (Copilot scope). No backend endpoint needed.

**Option B**: Pilot calls a .NET trace endpoint. If this path is chosen:

Create `POST /api/trace/events`:
```json
Request: {
  "eventId": "uuid",
  "correlationId": "uuid",
  "toolId": "string",
  "type": "tool_invoked | tool_completed | tool_failed",
  "context": { "userId": "string", "countyId": "string", "roles": ["string"] },
  "summary": "string",
  "payloadRef": "string | null",
  "timestamp": "ISO8601"
}
Response (201): { "eventId": "uuid", "stored": true }
```

**Decision**: Copilot owns trace storage (SQLite/Drizzle). Codex only needs this if the team decides to centralize trace in PostgreSQL (R2 decision).

### CX-8: Fix CostForge Service for Real Requests

Verify `ICostForgeService.AnalyzeCostAsync()` returns real calculated data for Benton County parcels:

1. Call `POST /api/costforge/calculate` with a known Benton County parcel
2. Response must contain non-zero values for totalCost, landValue, structureValue
3. Values must vary by property (not same number for every parcel)
4. If AnalyzeCostAsync returns mock data: fix the service implementation

**Acceptance test**: Two different parcels → two different calculated values.

### CX-9: Document ALL Endpoint Contracts

For every backend endpoint that R1 tools call, produce exact request/response documentation:

- `POST /api/costforge/calculate` (CX-2 verified in Week 1)
- `POST /api/levy-calculation/calculate-rate`
- `GET /api/properties/{id}`
- `GET /api/properties/parcel/{parcelNumber}`
- `GET /api/atlas/parcels/{parcelId}` (skeleton from CX-5)
- `GET /api/dossier/{parcelId}/notes` (skeleton from CX-6)

Output: Update `R1_DAY0_CONTRACTS.md` with any corrections discovered.

---

## Copilot (Governance) — Week 2

**Branch**: `copilot/r1-week2-trace-tests`
**Commit**: `5553d7987` — pushed to PR #496 → `r1/integration`

### CP-7: Trace Persistence ✅ COMPLETE

**Delivered**: FileTraceStore (append-only JSON lines, zero external deps)
- Replaced phantom PostgresTraceStore (had unresolved Drizzle deps, never worked)
- TraceService wired: `emit()` persists fire-and-forget, `queryAsync()` / `getByCorrelationIdAsync()` delegate to store
- Added `trace/` to `tsconfig.core.json` (type-checked for first time)
- **24 new tests** in `r1-trace-persistence.test.mjs`: persistence, restart survival, query filters, county isolation, factory validation

### CP-8: Handler Unit Tests ✅ COMPLETE

**Delivered**: Mock-based tests for all 5 MVP handlers
- Tests use `globalThis.fetch` interception for backend call mocking
- Covers: backend response parsing, county mismatch, network failures, error propagation, metadata-only trace results
- Fixed 8 pre-existing test failures exposed by `build:core-js` rebuilding ToolRunner.js with Gate 5b RBAC
- `draft_appeal_response`, `draft_value_change_notice`, `draft_boe_appeal_response` now use supervisor role
- **27 new tests** in `r1-handlers.test.mjs`

**Gates**: type-check 0 errors, 110/110 tests pass (59 original + 51 new), zero new deps

---

## Claude Code (Frontend) — Week 2

**Branch**: `claude/r1-week2-ui-governance`

### CC-7: Execution Console Component

**File**: `frontend/apps/os-shell/src/components/governance/ExecutionConsole.tsx`

A panel component that shows tool invocation lifecycle:

```tsx
interface ExecutionEntry {
  correlationId: string;
  toolId: string;
  displayName: string;
  status: 'invoked' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  errorCode?: string;
}
```

**Requirements**:
- Shows entries in reverse chronological order (newest first)
- Each entry shows: tool name, status badge, duration, correlationId
- Failed entries: red badge, error message visible, correlationId is clickable
- Clicking correlationId calls `GET /pilot/trace/:correlationId` and shows trace detail
- Maximum 50 entries in view (older entries scroll off)
- Uses shadcn/ui Card + Badge components

**Acceptance test**: AC-9 from PRD — entries transition through lifecycle states with timestamps.

### CC-8: Confirmation Gate Component

**File**: `frontend/apps/os-shell/src/components/governance/ConfirmationGate.tsx`

Modal dialog that appears when a write_high or irreversible tool is invoked:

```tsx
interface ConfirmationGateProps {
  tool: {
    toolId: string;
    displayName: string;
    risk: string;
    reasonCodes?: string[];
    requiresSupervisorApproval?: boolean;
    supervisorRoles?: string[];
  };
  onConfirm: (reasonCode: string, supervisorApproval?: { approvedBy: string; role: string }) => void;
  onCancel: () => void;
}
```

**Requirements**:
- Shows tool name, risk level, write lane
- For write_high: dropdown to select reason code (from tool manifest)
- For irreversible: additional supervisor approval fields
- Confirm button disabled until reason code selected
- Cancel returns to previous state without invoking
- Uses shadcn/ui Dialog + Select components

**Acceptance test**: AC-2 and AC-3 from PRD — unconfirmed writes blocked, missing reason code blocked.

### CC-9: Evidence Rail Component

**File**: `frontend/apps/os-shell/src/components/governance/EvidenceRail.tsx`

Side panel showing trace events for the active parcel:

```tsx
interface EvidenceRailProps {
  parcelId: string;
  countyId: string;
  userId: string;
  roles: string[];
}
```

**Requirements**:
- Calls `GET /pilot/trace` filtered by parcelId (or queries trace store)
- Shows: event type icon, timestamp, tool name, actor, summary
- payload_ref events show "View in Dossier" link (not raw content)
- Respects trace access control (backend filters, frontend renders what it gets)
- Auto-refreshes when new tool invocations complete
- Uses shadcn/ui ScrollArea + Card components

**Acceptance test**: AC-10 from PRD — shows real trace events, respects access control.

### CC-10: Rewrite forgeService.ts

**THE BIG ONE.** Replace client-side calculations with PilotController invocations.

Using the mapping from CC-4 (Week 1 research):

1. `calculateCost()` → call `pilotApi.invoke('run_valuation_model', { parcelId, ... })`
2. Remove hardcoded COST_MATRIX (42 entries)
3. Remove all localStorage usage (`costforge-scenarios`, `appealforge-appeals`, `forgeaudit-entries`)
4. Keep the TypeScript types/interfaces (they define the UI contract)
5. Each function becomes a thin wrapper around pilotApi.invoke()

**Critical rule**: Do NOT delete forgeService.ts — rewrite it in place. Components still import from it.

**Acceptance test**:
```bash
grep -r "localStorage\|COST_MATRIX\|hardcoded\|DEFAULT_" frontend/apps/os-shell/src/services/forgeService.ts
# Must return 0 matches

# Invoke cost calculation from UI → see real data from backend (not client-side math)
```

---

## Week 2 Integration Test

After all 3 agents merge Week 2:

1. Start .NET backend: `dotnet run --project backend/src/TerraFusion.API`
2. Start Pilot: (however os-platform/core starts)
3. Start frontend: `cd frontend && npm run dev`
4. Open Property Workbench for a Benton County parcel
5. Navigate to Forge tab
6. Trigger valuation → Confirmation Gate appears
7. Select reason code → confirm → Execution Console shows invoked → running → completed
8. Evidence Rail shows trace event
9. Verify correlationId links to trace detail

If this works, the governed execution pattern is proven.

---

**Target merge**: All 3 branches → `r1/integration`
**Merge order**: Codex → Copilot → Claude Code

## R1 Exception — CP-7 Trace Persistence
- Decision: Trace persistence uses **FileTraceStore (JSONL)** for R1.
- Rationale: Zero external dependencies; deterministic append-only evidence retention on Windows/Linux.
- Scope: `TraceService.emit()` persists fire-and-forget; `queryAsync()` and `getByCorrelationIdAsync()` delegate to the store; county isolation remains enforced.
- Deferred: SQLite/Drizzle persistence is moved to R2 with no external API contract change.
