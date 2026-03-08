# CP Lane Evidence: Governance Contracts

**Lane**: cp
**Date**: 2026-03-07
**Scope**: Frozen governance contracts, enforcement implementation, and gate results

---

## Frozen Contract Documents

### R1_DAY0_CONTRACTS.md

**Location**: `docs/R1_DAY0_CONTRACTS.md`
**Status**: FROZEN (2026-03-02)
**Version**: 1.0

This is the tri-agent contract document containing three frozen contracts:

1. **Contract 1: Tool Invoke Request/Response** -- Owned by Copilot (PilotController). Defines `PilotInvokeRequest` and `PilotInvokeResponse` shapes for `POST /pilot/invoke`. Includes error codes table (12 codes), allowed reason codes (10 codes), and validation endpoint (`POST /pilot/validate`).

2. **Contract 2: Backend Endpoint Contracts** -- Owned by Codex. Defines request/response shapes for CostForge Calculate, Levy Calculation, Atlas, and Dossier endpoints. All real handlers in `handlers.real.ts` call these exact endpoint paths.

3. **Contract 3: Role Vocabulary Map** -- Owned by all 3 agents. Defines 5 canonical roles (`viewer`, `appraiser`, `supervisor`, `administrator`, `auditor`), their JWT claims, trace access levels, UI policy, and write tool access.

**CP-7 Exception**: The document includes an R1 exception for trace persistence: FileTraceStore (JSONL) instead of SQLite/Drizzle, with no external API contract change.

### INVOKE_CONTRACT.md

**Location**: `tools/registry/INVOKE_CONTRACT.md`
**Status**: FROZEN for R1
**Contract Version**: 1.0.0
**Manifest Version**: 1.3.0
**Tools Count**: 24

Defines the single source of truth for tool invocation shapes:

- **Request body** (`PilotInvokeRequest`): `toolId`, `params`, `mode`, `parcelId`, `dossierId`, `confirmation`, `reasonCode`, `supervisorApproval`
- **Response body** (`PilotInvokeResponse`): `ok`, `correlationId`, `result`, `error`, `errorCode`, `traceEventId`
- **ALLOWED_REASON_CODES**: 10 codes (`annual_certification`, `market_adjustment`, `new_construction`, `correction`, `appeal_response`, `board_directive`, `court_order`, `data_subject_request`, `supervisor_override`, `legal_compliance`)
- **ERROR_CODES**: 12 codes mapped to enforcement gates
- **Enforcement order**: Tool Lookup -> Mode Check -> Preflight Policy -> Gate 4 (Write-Lane) -> Gate 5 (Risk Policy) -> Gate 6 (PII/Trace) -> Handler Execution -> Trace Emission
- **County isolation**: `params.county` must match `context.countyId` (case-insensitive)

### ROLE_VOCABULARY.md

**Location**: `os-platform/core/types/ROLE_VOCABULARY.md`
**Status**: FROZEN for R1
**Contract Version**: 1.0.0
**Roles Count**: 5
**Claims Count**: 9

Defines canonical role-to-claim mappings:

| Role | Write Tools |
|------|-------------|
| `viewer` | None |
| `appraiser` | `add_dossier_note`, `draft_appeal_response`, `draft_value_change_notice`, `draft_boe_appeal_response` |
| `supervisor` | All appraiser + `run_valuation_model`, `assemble_boe_packet`, `assign_task` |
| `administrator` | All supervisor + `request_trace_redaction` |
| `auditor` | `search_trace_by_correlation` (read-only) |

Trace access control matrix: viewers see own correlationIds only; appraisers see own county; supervisors/administrators see own county + system events; auditors see cross-county when authorized.

---

## ToolRunner.ts -- Write-Lane / Risk / PII Enforcement

**Location**: `os-platform/core/pilot/ToolRunner.ts`

The ToolRunner is the runtime enforcement layer implementing Gates 4-6 from the INVOKE_CONTRACT:

### Gate 4: Write-Lane Assertions (`enforceWriteLane()`)

- Read-only tools skip write lane checks
- Write tools must have a `writeLane` declaration (error: `WRITE_LANE_REQUIRED`)
- `writeLane` must match `suite` (or be in `crossSuiteReads`) (error: `WRITE_LANE_MISMATCH`)

### Gate 5: Risk Policy (`enforceRiskPolicy()`)

- `requiresConfirmation` tools require `context.confirmation === true` (error: `CONFIRMATION_REQUIRED`)
- `write_high` / `reasonCodeRequired` tools require `context.reasonCode` (error: `REASON_CODE_REQUIRED`)
- `reasonCode` must be in tool's `reasonCodes` list (error: `REASON_CODE_INVALID`)
- `irreversible` tools require `context.supervisorApproval` (error: `SUPERVISOR_APPROVAL_REQUIRED`)
- Supervisor role must be in tool's `supervisorRoles` (error: `SUPERVISOR_ROLE_INVALID`)

### Gate 5b: RBAC Permission Enforcement (`enforceRbacPermissions()`)

- Derives required claims from tool manifest (`touches`, `writeLane`, `risk`, `suite`)
- Resolves user claims from roles using `ROLE_CLAIMS` mapping (matches ROLE_VOCABULARY.md exactly)
- Missing claims produce `PERMISSION_DENIED` error

### Gate 6: PII/Trace Policy (`enforcePiiPolicy()`)

- `payload_ref` trace policy requires `payloadStore` declaration (error: `PAYLOAD_STORE_REQUIRED`)

### Trace Integration

Every execution emits trace events via `TraceService.emitWithPiiHandling()`:
- `tool_invoked` on entry (with raw payload if trace policy allows)
- `tool_completed` on success
- `tool_failed` on enforcement failure or handler error (includes `errorCode` and `stackTrace`)

---

## PilotController.ts -- Governed Invoke Surface

**Location**: `os-platform/core/api/PilotController.ts`

### Single Execution Path

PilotController is the **single choke point** for all tool invocations. The hard rule (documented in file header): "If a PR adds a new tool call path, it must use this adapter or it doesn't merge."

The `rejectDirectToolCalls()` middleware enforces this by scanning request bodies for suspicious keys (`toolId`, `execute_tool`, `run_tool`, `invoke_tool`) on non-Pilot routes.

### Correlation ID Propagation

Every invocation through `POST /pilot/invoke`:
1. PilotController builds `ToolExecutionContext` from JWT auth + request body
2. `ToolRunner.execute()` generates a `correlationId` (UUID)
3. All trace events for the invocation share this `correlationId`
4. Response always includes `correlationId` (even on failure per INVOKE_CONTRACT)
5. `traceEventId` returned on success for direct trace lookup

### Context Extraction

`extractContext()` maps auth + request to `ToolExecutionContext`:
- `countyId` from JWT user context (default: `benton` in dev)
- `userId` from JWT
- `roles` from JWT claims
- `mode` from request body (default: `pilot`)
- `parcelId`, `dossierId` from request body context
- `confirmation`, `reasonCode` from request body
- `supervisorApproval` with `approvedAt` timestamp

---

## RiskConfirmationModal Integration

**Location**: `frontend/apps/os-shell/src/components/pilot/RiskConfirmationModal.tsx`

The frontend `RiskConfirmationModal` component integrates with the governance surface:

- Displayed when a tool's risk level is `write_high` or `irreversible`
- For `write_high`: requires user to select a `reasonCode` from the tool's allowed list
- For `irreversible`: requires `supervisorApproval` with approver identity and role
- Confirmation state is passed through `PilotInvokeRequest.confirmation`, `reasonCode`, and `supervisorApproval` fields
- Connected via `RiskPolicyGate` component which validates pre-flight before showing execution UI

---

## Gate Results

### Phase 83: 32/32 passing

Phase 8.3 gate validates the core tool registry, handler registration, and basic invocation flow for the initial 3 handlers (`summarize_dossier`, `explain_model_results`, `draft_appeal_response`).

### Phase 85: 20/20 passing

Phase 8.5 gate validates the full enforcement pipeline: write-lane assertions (Gate 4), risk policy enforcement (Gate 5), RBAC permission checks (Gate 5b), PII/trace policy (Gate 6), and trace event emission for all outcomes (success, enforcement failure, handler error).

### Phase 86: 7/7 passing

Phase 8.6 gate validates the write-gate governance handlers (`assemble_boe_packet` with write_high risk, `request_trace_redaction` with irreversible risk), including reason code validation, supervisor approval flow, and dual trace event emission for redaction requests.
