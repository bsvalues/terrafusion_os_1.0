# Tool Invoke Contract — R1 Frozen
<!-- STATUS: FROZEN | Do not modify without governance approval -->
<!-- Contract version: 1.0.0 | Effective: R1 (Week 1+) -->

## Purpose
This document is the **single source of truth** for the shape of all tool invocation
requests and responses flowing through `POST /pilot/invoke`. All three agents (Copilot,
Claude Code, Codex) MUST implement to this contract. Drift = integration failure.

---

## POST /pilot/invoke

### Request Body (`PilotInvokeRequest`)

```jsonc
{
  "toolId":     "string",           // REQUIRED — must exist in terrapilot.tools.json
  "params":     { },                // REQUIRED — tool-specific payload (see paramsSchema in manifest)
  "mode":       "pilot" | "muse",   // OPTIONAL — defaults to tool's manifest mode
  "parcelId":   "string",           // OPTIONAL — scoping context for parcel-touching tools
  "dossierId":  "string",           // OPTIONAL — scoping context for dossier-touching tools
  "confirmation": true,             // REQUIRED when tool.requiresConfirmation === true
  "reasonCode": "string",           // REQUIRED when tool.reasonCodeRequired === true (see ALLOWED_REASON_CODES)
  "supervisorApproval": {           // REQUIRED when tool.risk === "irreversible"
    "approvedBy": "string",         //   supervisor userId
    "role":       "string"          //   must be in tool.supervisorRoles
  }
}
```

### Response Body (`PilotInvokeResponse`)

```jsonc
{
  "ok":            true | false,    // execution outcome
  "correlationId": "uuid",         // always present — links invoke→result trace events
  "result":        { },             // present when ok === true — tool-specific result shape
  "error":         "string",        // present when ok === false — human-readable error
  "errorCode":     "string",        // present when ok === false — machine-readable (see ERROR_CODES)
  "traceEventId":  "string"         // present when trace event was emitted
}
```

---

## ALLOWED_REASON_CODES

These are the only valid values for `reasonCode`. Any other value is rejected with
`REASON_CODE_INVALID`.

| Code | Used By | Context |
|------|---------|---------|
| `annual_certification` | run_valuation_model | Routine annual certification cycle |
| `market_adjustment` | run_valuation_model | Market condition correction |
| `new_construction` | run_valuation_model | New construction valuation |
| `correction` | run_valuation_model | Data correction / error fix |
| `appeal_response` | assemble_boe_packet | Responding to taxpayer appeal |
| `board_directive` | assemble_boe_packet | Board of Equalization directive |
| `court_order` | request_trace_redaction | Court-ordered redaction |
| `data_subject_request` | request_trace_redaction | Data subject (citizen) request |
| `supervisor_override` | request_trace_redaction | Supervisor-authorized override |
| `legal_compliance` | request_trace_redaction | Legal/regulatory compliance |

---

## ERROR_CODES

Machine-readable codes returned in `errorCode` when `ok === false`.

| Code | Gate | Meaning |
|------|------|---------|
| `TOOL_NOT_FOUND` | — | toolId does not exist in manifest |
| `MODE_MISMATCH` | — | Tool requires a different mode than provided |
| `WRITE_LANE_MISMATCH` | 4 | Write-lane does not match tool's suite |
| `WRITE_LANE_REQUIRED` | 4 | Write tool missing writeLane declaration |
| `CONFIRMATION_REQUIRED` | 5 | Tool requires confirmation but none provided |
| `REASON_CODE_REQUIRED` | 5 | Tool requires reasonCode but none provided |
| `REASON_CODE_INVALID` | 5 | reasonCode not in tool's allowed list |
| `SUPERVISOR_APPROVAL_REQUIRED` | 5 | Irreversible tool requires supervisor approval |
| `SUPERVISOR_ROLE_INVALID` | 5 | Supervisor's role not in tool's allowed list |
| `PAYLOAD_STORE_REQUIRED` | 6 | payload_ref trace policy requires payloadStore |
| `POLICY_DENIED` | preflight | Preflight policy rejected the invocation |
| `EXECUTION_FAILED` | handler | Handler threw during execution |

---

## Pre-flight Validation: POST /pilot/validate

Same request shape, returns validation result without executing:

```jsonc
{
  "valid":      true | false,
  "violations": ["string"],         // list of enforcement violations (empty when valid)
  "tool": {                         // tool metadata (when toolId found)
    "toolId":               "string",
    "suite":                "string",
    "risk":                 "string",
    "requiresConfirmation": true | false,
    "reasonCodes":          ["string"]
  }
}
```

---

## Enforcement Order

All invocations pass through these gates in order:

1. **Tool Lookup** — toolId must exist in registry
2. **Mode Check** — context.mode must match tool.mode (if specified)
3. **Preflight Policy** — additive policy gate (default: allow)
4. **Gate 4: Write-Lane** — writeLane must match suite for write tools
5. **Gate 5: Risk Policy** — confirmation, reasonCode, supervisorApproval
6. **Gate 6: PII/Trace** — payload_ref requires payloadStore
7. **Handler Execution** — registered handler is called
8. **Trace Emission** — tool_invoked → tool_completed/tool_failed events

---

## County Isolation

Every request is scoped to a county via `context.countyId`. The `params.county` field
(when present) MUST match `context.countyId` (case-insensitive). Mismatch = `COUNTY_MISMATCH`.

---

## Contract Versioning

| Field | Value |
|-------|-------|
| Contract Version | 1.0.0 |
| Manifest Version | 1.3.0 |
| Tools Count | 24 |
| Status | FROZEN for R1 |
