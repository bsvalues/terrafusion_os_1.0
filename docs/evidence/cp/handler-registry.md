# CP Lane Evidence: Handler Registry

**Lane**: cp
**Date**: 2026-03-07
**Source file**: `os-platform/core/pilot/handlers.real.ts`
**Registration entry point**: `registerR1Handlers()`

---

## Overview

The CP lane delivers the governed handler registry as its core governance artifact for R1. The `registerR1Handlers()` function in `os-platform/core/pilot/handlers.real.ts` registers 10 production handlers that replace canned Phase 8.3/8.4 stubs with real backend calls. These handlers are the runtime implementation behind the `POST /pilot/invoke` contract surface.

---

## 10 Real Handlers Registered via registerR1Handlers()

All 10 handlers are registered in `registerR1Handlers()` (lines 665-686 of `handlers.real.ts`). Each handler enforces county isolation via `assertCountyMatch()` before any backend call.

### 1. route_to_parcel

- **Registration**: `runner.registerHandler('route_to_parcel', routeToParcelHandler)`
- **Backend call**: None (navigation event)
- **Behavior**: Constructs a client-side navigation URL `/property/{parcelId}/{tab}`. No HTTP call to backend. Returns `{ navigateTo, parcelId, tab }`.
- **Risk**: read_only
- **County enforcement**: `assertCountyMatch(params.county, context.countyId)`

### 2. run_valuation_model

- **Registration**: `runner.registerHandler('run_valuation_model', runValuationModelHandler)`
- **Backend call**: `POST /api/costforge/calculate`
- **Behavior**: Calls CostForge with property ID, county code, and building type. Supports automatic parcel number discovery via `GET /api/properties` fallback. Normalizes `totalCost`/`estimatedValue` and array/object component shapes.
- **Risk**: write_high (requires reasonCode)
- **County enforcement**: `assertCountyMatch()` + `normalizeCountyCode()` in request body

### 3. explain_value_change

- **Registration**: `runner.registerHandler('explain_value_change', explainValueChangeHandler)`
- **Backend call**: `GET /api/properties/{id}`
- **Behavior**: Fetches property data including valuation history. Computes delta between `fromYear` and `toYear`, identifies drivers (market_appreciation, market_decline, significant_adjustment), and generates audience-appropriate explanation (internal vs. taxpayer).
- **Risk**: read_only
- **County enforcement**: `assertCountyMatch()`

### 4. search_trace_by_correlation

- **Registration**: `runner.registerHandler('search_trace_by_correlation', createSearchTraceHandler(traceService))`
- **Backend call**: `TraceService.getByCorrelationId()` (in-process)
- **Behavior**: Factory function `createSearchTraceHandler()` closes over the TraceService instance. Queries trace events by correlation ID, maps to `{ ts, type, toolId }` shape, applies limit.
- **Risk**: read_only
- **County enforcement**: `assertCountyMatch()`

### 5. summarize_levy_rate_components

- **Registration**: `runner.registerHandler('summarize_levy_rate_components', summarizeLevyRateRealHandler)`
- **Backend call**: `POST /api/levy-calculation/calculate-rate`
- **Behavior**: Calls levy calculation with district ID, assessed value, budget amount, and county code. Returns AI optimal rate, base rate, statutory limit as components. Generates explanation with projected revenue.
- **Risk**: read_only
- **County enforcement**: `assertCountyMatch()` + `normalizeCountyCode()` in request body

### 6. explain_model_inputs

- **Registration**: `runner.registerHandler('explain_model_inputs', explainModelInputsRealHandler)`
- **Backend call**: `GET /api/costforge/models/{modelId}`
- **Behavior**: Fetches model input definitions from CostForge. Normalizes between `inputs[]` and `modelInputs[]` response shapes. Flags PII fields but never exposes them in trace. Sorts alphabetically by name.
- **Risk**: read_only
- **County enforcement**: `assertCountyMatch()` + countyId in query string

### 7. compare_assessed_value_history

- **Registration**: `runner.registerHandler('compare_assessed_value_history', compareAssessedValueHistoryRealHandler)`
- **Backend call**: `GET /api/properties/{parcelId}`
- **Behavior**: Fetches property valuation history. Builds year-over-year trend for requested years, computes percentage change, identifies drivers, and generates narrative. Optional breakdown includes taxable value. Flags missing years.
- **Risk**: read_only
- **County enforcement**: `assertCountyMatch()`

### 8. summarize_parcel_casefile

- **Registration**: `runner.registerHandler('summarize_parcel_casefile', summarizeParcelCasefileRealHandler)`
- **Backend call**: `GET /api/dossier/parcels/{parcelId}/casefile`
- **Behavior**: Fetches casefile from Dossier backend with optional section filtering (notices, appeals, permits, sales). Builds highlights from sections or documents. PII stored by reference via `payloadRef` (`dossier://{countyId}/parcels/{parcelId}/casefile`).
- **Risk**: read_only
- **County enforcement**: `assertCountyMatch()` + countyId in query string

### 9. add_dossier_note

- **Registration**: `runner.registerHandler('add_dossier_note', addDossierNoteRealHandler)`
- **Backend call**: `POST /api/dossier/{parcelId}/notes`
- **Behavior**: Posts a case note to Dossier backend. Validates note content is non-empty and under 2000 characters. Returns `noteId`, `appended: true`, and `payloadRef` for trace audit trail.
- **Risk**: write_low (requires confirmation)
- **County enforcement**: `assertCountyMatch()`

### 10. query_parcel_layers

- **Registration**: `runner.registerHandler('query_parcel_layers', queryParcelLayersRealHandler)`
- **Backend call**: `GET /api/atlas/parcels/{parcelId}/layers`
- **Behavior**: Fetches GIS layer list from Atlas backend. Supports client-side layer filtering when `params.layers` is specified. Returns layer availability with configurable format (geojson, wkt, summary).
- **Risk**: read_only
- **County enforcement**: `assertCountyMatch()`

---

## 14 Stub Handlers (Post-R1 Scope)

The following handlers remain as canned stubs registered via `registerAllHandlers()` in `os-platform/core/pilot/handlers.ts`. They are Phase 8.3/8.4 placeholders that return deterministic canned data. Real backend implementations are deferred to post-R1.

### Phase 8.3 Stubs (3)
1. `summarize_dossier` -- Muse-mode dossier summarization
2. `explain_model_results` -- Muse-mode model result explanation
3. `draft_appeal_response` -- Muse-mode appeal response drafting

### Phase 8.4 Stubs (9)
4. `explain_senior_exemption_impact` -- Senior exemption impact analysis
5. `draft_value_change_notice` -- Value change notice drafting
6. `draft_boe_appeal_response` -- BOE appeal response drafting
7. `summarize_sales_comps_rationale` -- Sales comparables rationale

Note: The following Phase 8.4 stubs are OVERRIDDEN by real handlers from `handlers.real.ts` at runtime:
- `summarize_parcel_casefile` (overridden by handler #8)
- `compare_assessed_value_history` (overridden by handler #7)
- `summarize_levy_rate_components` (overridden by handler #5)
- `explain_model_inputs` (overridden by handler #6)
- `search_trace_by_correlation` (overridden by handler #4)
- `add_dossier_note` (overridden by handler #9)

### C2 Write-Gate Stubs (2)
8. `assemble_boe_packet` -- write_high: BOE packet assembly
9. `request_trace_redaction` -- irreversible: trace redaction request

### Remaining Manifest-Only (5 additional tools in manifest without handlers)
10-14. Tools declared in `terrapilot.tools.json` manifest that have no handler implementation yet (route_to_parcel was previously manifest-only but now has a real handler).

---

## Contract Alignment

### R1_DAY0_CONTRACTS.md (`docs/R1_DAY0_CONTRACTS.md`)

- **Contract 1 (Tool Invoke)**: All 10 real handlers are invoked exclusively through `POST /pilot/invoke` via PilotController. The request/response shapes (`PilotInvokeRequest`, `PilotInvokeResponse`) match the frozen contract exactly, including `correlationId` propagation, `ok`/`error`/`errorCode` fields, and `traceEventId`.
- **Contract 2 (Backend Endpoints)**: Backend endpoint paths in real handlers match the frozen contract: `/api/costforge/calculate`, `/api/levy-calculation/calculate-rate`, `/api/atlas/parcels/{parcelId}`, `/api/dossier/{parcelId}/notes`.
- **Contract 3 (Role Vocabulary)**: County context enforcement via `assertCountyMatch()` aligns with the frozen county isolation contract (`params.county` must match `context.countyId`, case-insensitive).

### INVOKE_CONTRACT.md (`tools/registry/INVOKE_CONTRACT.md`)

- Enforcement order (Gates 1-8) is implemented in ToolRunner.ts and verified by phase83/phase85 test suites.
- Error codes in ToolRunner match the frozen `ERROR_CODES` table: `TOOL_NOT_FOUND`, `MODE_MISMATCH`, `WRITE_LANE_MISMATCH`, `CONFIRMATION_REQUIRED`, `REASON_CODE_REQUIRED`, `REASON_CODE_INVALID`, `SUPERVISOR_APPROVAL_REQUIRED`, `SUPERVISOR_ROLE_INVALID`, `PAYLOAD_STORE_REQUIRED`, `POLICY_DENIED`, `EXECUTION_FAILED`.
- County isolation rule enforced: `params.county` must match `context.countyId` (case-insensitive), consistent with INVOKE_CONTRACT.md County Isolation section.
