# CP Lane Evidence: R1 Proof Tools (5-Tool Set)

**Lane**: cp
**Date**: 2026-03-07
**Scope**: The 5 tools required for R1 governed proof demonstration

---

## Required R1 Proof Set

The following 5 tools constitute the minimum viable governed proof for R1. Each tool has a real handler in `os-platform/core/pilot/handlers.real.ts`, a backend endpoint (or in-process service), and a UI invocation surface through `POST /pilot/invoke`.

---

### 1. run_valuation_model

| Field | Value |
|-------|-------|
| **Handler** | `runValuationModelHandler` (handlers.real.ts, line 196) |
| **Backend Endpoint** | `POST /api/costforge/calculate` |
| **Risk Level** | write_high |
| **Requires Confirmation** | Yes |
| **Requires Reason Code** | Yes (`annual_certification`, `market_adjustment`, `new_construction`, `correction`) |
| **Suite** | forge |
| **Mode** | pilot |
| **UI Surface** | Forge workbench, invoked via RiskConfirmationModal with reason code selection |
| **PII Handling** | sanitize |

**Behavior**: Calls CostForge with parcel number, county code, and building type. Supports automatic parcel discovery fallback. Returns estimated value, confidence score, and cost components. County isolation enforced at handler level via `assertCountyMatch()` and at request level via `countyCode` in POST body.

---

### 2. explain_value_change

| Field | Value |
|-------|-------|
| **Handler** | `explainValueChangeHandler` (handlers.real.ts, line 260) |
| **Backend Endpoint** | `GET /api/properties/{id}` |
| **Risk Level** | read_only |
| **Requires Confirmation** | No |
| **Suite** | forge |
| **Mode** | muse |
| **UI Surface** | Pilot chat panel, Muse-mode value explanation |
| **PII Handling** | sanitize |

**Behavior**: Fetches property valuation history, computes delta between two years, identifies market drivers, and generates audience-appropriate explanation (internal vs. taxpayer). No write operations.

---

### 3. search_trace_by_correlation

| Field | Value |
|-------|-------|
| **Handler** | `createSearchTraceHandler(traceService)` (handlers.real.ts, line 333) |
| **Backend Endpoint** | `TraceService.getByCorrelationId()` (in-process) |
| **Risk Level** | read_only |
| **Requires Confirmation** | No |
| **Suite** | os |
| **Mode** | pilot |
| **UI Surface** | Trace inspector panel, correlation ID search |
| **PII Handling** | sanitize |

**Behavior**: Factory function closes over the TraceService instance. Queries trace events by correlation ID from the in-memory ring buffer (or persistent FileTraceStore when configured). Maps events to `{ ts, type, toolId }` shape with configurable limit. County isolation enforced via `assertCountyMatch()`.

---

### 4. summarize_levy_rate_components

| Field | Value |
|-------|-------|
| **Handler** | `summarizeLevyRateRealHandler` (handlers.real.ts, line 361) |
| **Backend Endpoint** | `POST /api/levy-calculation/calculate-rate` |
| **Risk Level** | read_only |
| **Requires Confirmation** | No |
| **Suite** | forge |
| **Mode** | muse |
| **UI Surface** | Pilot chat panel, levy rate explanation |
| **PII Handling** | sanitize |

**Behavior**: Calls levy calculation endpoint with district ID, assessed value, budget amount, and county code. Returns AI optimal rate, base rate, statutory limit as sorted components. Generates narrative with projected revenue. Supports optional district code scoping.

---

### 5. summarize_parcel_casefile

| Field | Value |
|-------|-------|
| **Handler** | `summarizeParcelCasefileRealHandler` (handlers.real.ts, line 518) |
| **Backend Endpoint** | `GET /api/dossier/parcels/{parcelId}/casefile` |
| **Risk Level** | read_only |
| **Requires Confirmation** | No |
| **Suite** | dossier |
| **Mode** | muse |
| **UI Surface** | Dossier tab, casefile summary panel |
| **PII Handling** | payload_ref |
| **Payload Store** | dossier |

**Behavior**: Fetches casefile from Dossier backend with optional section filtering (notices, appeals, permits, sales). Builds highlights from structured sections or document list. PII stored by reference via `payloadRef` pattern (`dossier://{countyId}/parcels/{parcelId}/casefile`) -- raw PII never appears in trace events.

---

## Acceptance Criteria Status

All acceptance criteria are structurally met in code. Pending: live smoke test against running backend services.

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC-1 | All 5 proof tools have real handlers registered | MET | `registerR1Handlers()` registers all 5 in handlers.real.ts |
| AC-2 | Each handler calls a real backend endpoint | MET | POST/GET calls verified in handler source code |
| AC-3 | County isolation enforced on every handler | MET | `assertCountyMatch()` on first line of every handler |
| AC-4 | Correlation ID propagated end-to-end | MET | ToolRunner generates UUID, traces all events, response includes it |
| AC-5 | Trace events emitted for invoke/complete/fail | MET | ToolRunner.emitTraceEvent() on all paths |
| AC-6 | Risk policy enforced for write_high tools | MET | ToolRunner.enforceRiskPolicy() checks confirmation + reasonCode |
| AC-7 | PII handling follows trace policy | MET | emitWithPiiHandling() applies sanitize or payload_ref per tool |
| AC-8 | Error codes match INVOKE_CONTRACT | MET | ErrorCodes enum matches all 12 frozen codes |
| AC-9 | Response shape matches frozen contract | MET | PilotInvokeResponse type matches R1_DAY0_CONTRACTS Contract 1 |
| AC-10 | Canned stubs overridden (not removed) | MET | registerR1Handlers() called after registerAllHandlers() |
| AC-11 | RBAC enforced per ROLE_VOCABULARY | MET | enforceRbacPermissions() derives claims from tool manifest |

---

## Phase 6 Readiness Assessment

### Ready for Governed Proof

All 5 tools are structurally ready for Phase 6 governed proof:

1. **Handler registration**: All 5 handlers registered in `registerR1Handlers()` with type-safe signatures
2. **Enforcement pipeline**: ToolRunner enforces Gates 4-6 before any handler executes
3. **Trace persistence**: FileTraceStore provides durable append-only evidence (CP-7)
4. **Contract compliance**: Request/response shapes match frozen INVOKE_CONTRACT
5. **County isolation**: Multi-layer enforcement (handler, ToolRunner, PilotController, TraceAccessControl)

### Remaining for Live Smoke

- Backend services (CostForge, Levy Calculation, Dossier, Atlas) must be running
- JWT auth must be configured for non-anonymous access
- Frontend RiskConfirmationModal must be wired to `run_valuation_model` invoke flow
- Trace export endpoint must be tested with elevated role credentials
