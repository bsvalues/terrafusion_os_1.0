# R1 Day 0 — Frozen Contracts

**Status**: FROZEN once all 3 agents acknowledge
**Rule**: No agent may change these shapes without a PR that all 3 agents review

These 3 contracts define the boundaries between Codex (backend), Copilot (governance), and Claude Code (frontend). Every agent codes against these exact shapes.

---

## Contract 1: Tool Invoke Request/Response

**Owner**: Copilot (PilotController)
**Consumers**: Claude Code (frontend invokeTool), Codex (backend handler endpoints)

### Request: `POST /pilot/invoke`

```typescript
interface PilotInvokeRequest {
  toolId: string;                    // From terrapilot.tools.json
  params: Record<string, unknown>;   // Tool-specific params per paramsSchema
  mode?: "pilot" | "muse";          // Default: "pilot"
  parcelId?: string;                 // Context: active parcel
  dossierId?: string;                // Context: active dossier
  confirmation?: boolean;            // Required for write_low+ tools
  reasonCode?: string;               // Required for write_high tools
  supervisorApproval?: {             // Required for irreversible tools
    approvedBy: string;
    role: string;
  };
}
```

### Response: `PilotInvokeResponse`

```typescript
// Success (HTTP 200)
interface PilotInvokeResponse {
  ok: true;
  correlationId: string;             // UUID — always present
  result: unknown;                   // Tool-specific return data
  traceEventId: string;              // UUID of the trace event
}

// Failure (HTTP 200 with ok: false, or HTTP 400/403/500)
interface PilotInvokeResponse {
  ok: false;
  correlationId: string;             // UUID — always present, even on failure
  error: string;                     // Human-readable error
  errorCode: string;                 // Machine-readable — see Error Codes table below
  traceEventId?: string;             // Present if trace was emitted before failure
}
```

### Error Codes (from `tools/registry/INVOKE_CONTRACT.md`)

| Error Code | Gate | Meaning |
|------------|------|---------|
| `TOOL_NOT_FOUND` | Gate 1 | toolId not in manifest |
| `MODE_MISMATCH` | Gate 2 | Tool not available in requested mode |
| `WRITE_LANE_MISMATCH` | Gate 4 | Tool's writeLane doesn't match invoking suite |
| `WRITE_LANE_REQUIRED` | Gate 4 | Write tool invoked without writeLane context |
| `CONFIRMATION_REQUIRED` | Gate 5 | write_low+ tool invoked without confirmation=true |
| `REASON_CODE_REQUIRED` | Gate 5 | write_high tool invoked without reasonCode |
| `REASON_CODE_INVALID` | Gate 5 | reasonCode not in allowed list |
| `SUPERVISOR_APPROVAL_REQUIRED` | Gate 5 | irreversible tool invoked without supervisorApproval |
| `SUPERVISOR_ROLE_INVALID` | Gate 5 | supervisorApproval.role not in supervisorRoles |
| `PAYLOAD_STORE_REQUIRED` | Gate 6 | Tool has piiHandling=sanitize but payload store unavailable |
| `POLICY_DENIED` | Gate 5 | Generic risk policy denial |
| `EXECUTION_FAILED` | Handler | Handler threw or returned error |

### Allowed Reason Codes (for write_high tools)

```
annual_certification | market_adjustment | new_construction | correction |
appeal_response | board_directive | court_order | data_subject_request |
supervisor_override | legal_compliance
```

### Validation: `POST /pilot/validate`

```typescript
interface PilotValidateRequest {
  toolId: string;
  params: Record<string, unknown>;
  mode?: "pilot" | "muse";
  confirmation?: boolean;
  reasonCode?: string;
}

interface PilotValidateResponse {
  valid: boolean;
  violations: string[];              // Empty if valid
  tool?: {
    toolId: string;
    suite: string;
    risk: string;
    requiresConfirmation?: boolean;
    reasonCodeRequired?: boolean;
    reasonCodes?: string[];
    requiresSupervisorApproval?: boolean;
    supervisorRoles?: string[];
  };
}
```

### Tool Listing: `GET /pilot/tools?mode=pilot|muse`

```typescript
interface PilotToolListResponse {
  tools: Array<{
    toolId: string;
    displayName: string;
    suite: string;
    mode: string;
    risk: string;
    description: string;
    requiresConfirmation?: boolean;
    reasonCodes?: string[];
  }>;
  version: string;                   // Manifest version "1.3.0"
}
```

---

## Contract 2: Backend Endpoint Contracts

**Owner**: Codex (backend controllers)
**Consumers**: Copilot (handler → HTTP call), Claude Code (direct calls where no tool exists)

### CostForge Calculate

```
POST /api/costforge/calculate
Authorization: Bearer <jwt>
Content-Type: application/json

Request:
{
  "propertyId": "guid-string",       // OR parcelNumber below
  "parcelNumber": "string",          // Alternative lookup
  "countyCode": "BENTON"             // Required for county isolation
}

Response (200):
{
  "propertyId": "guid",
  "parcelNumber": "string",
  "totalCost": 285000.00,
  "landValue": 85000.00,
  "structureValue": 180000.00,
  "siteImprovements": 20000.00,
  "depreciatedValue": 245000.00,
  "depreciation": {
    "physicalPercent": 0.12,
    "functionalPercent": 0.03,
    "externalPercent": 0.00
  },
  "costFactors": {
    "region": "BENTON",
    "buildingType": "SFR",
    "qualityGrade": "AVERAGE",
    "yearBuilt": 1995,
    "effectiveAge": 25,
    "squareFeet": 1800
  },
  "confidence": 0.87,
  "calculatedAt": "2026-03-02T12:00:00Z",
  "modelVersion": "costforge-v2.1"
}

Response (400): { "error": "Property not found", "propertyId": "guid" }
Response (401): Unauthorized
Response (403): Insufficient permissions
```

### Levy Calculation

```
POST /api/levy-calculation/calculate-rate
Authorization: Bearer <jwt>
Content-Type: application/json

Request:
{
  "districtId": "string",
  "assessedValue": 285000.00,
  "budgetAmount": 1500000.00,
  "countyCode": "BENTON",
  "taxYear": 2026
}

Response (200):
{
  "baseRate": 10.52,                  // Per $1,000 AV
  "optimizedRate": 10.48,
  "projectedRevenue": 1495000.00,
  "components": [
    { "name": "State School", "rate": 2.45, "percent": 23.3 },
    { "name": "Local School", "rate": 3.12, "percent": 29.7 },
    { "name": "County General", "rate": 1.85, "percent": 17.6 },
    { "name": "City", "rate": 1.50, "percent": 14.3 },
    { "name": "Fire District", "rate": 0.95, "percent": 9.0 },
    { "name": "Other", "rate": 0.61, "percent": 6.1 }
  ],
  "confidence": 0.95,
  "calculatedAt": "2026-03-02T12:00:00Z"
}
```

### Atlas (Skeleton — R1)

```
GET /api/atlas/parcels/{parcelId}
Authorization: Bearer <jwt>

Response (200):
{
  "parcelId": "string",
  "geometry": "POLYGON((...))",       // WKT format
  "centroid": { "lat": 46.2, "lng": -119.2 },
  "areaSqft": 8500,
  "areaAcres": 0.195,
  "zoning": "R1",
  "layers": ["boundary", "zoning"]    // Available layers
}

Response (404): { "error": "Parcel not found" }
```

### Dossier (Skeleton — R1)

```
GET /api/dossier/{parcelId}/notes
Authorization: Bearer <jwt>

Response (200):
{
  "parcelId": "string",
  "notes": [
    {
      "noteId": "uuid",
      "content": "string",
      "createdAt": "2026-03-02T12:00:00Z",
      "createdBy": "userId",
      "type": "case_note"
    }
  ],
  "total": 3
}

POST /api/dossier/{parcelId}/notes
Authorization: Bearer <jwt>
Content-Type: application/json

Request:
{
  "content": "string",
  "type": "case_note"
}

Response (201):
{
  "noteId": "uuid",
  "parcelId": "string",
  "createdAt": "2026-03-02T12:00:00Z"
}
```

---

## Contract 3: Role Vocabulary Map

**Owner**: All 3 agents must use these exact strings
**Consumed by**: JWT claims, TraceAccessControl, UI policy guards, tool manifest

### Role Definitions (from `os-platform/core/types/ROLE_VOCABULARY.md`)

| Role String | JWT Claim | Trace Access | Claims | Tool Access | UI Policy |
|-------------|-----------|-------------|--------|-------------|-----------|
| `viewer` | `role: "viewer"` | Own traces only | read:parcel, read:dossier | All read_only tools | Read-only mode |
| `appraiser` | `role: "appraiser"` | Own traces only | read:parcel, read:dossier, write:forge, write:dossier | All viewer tools + add_dossier_note, draft_appeal_response, draft_value_change_notice, draft_boe_appeal_response | Valuation work mode default |
| `supervisor` | `role: "supervisor"` | Elevated (same county) | All appraiser + write:dais, approve:irreversible | All appraiser tools + run_valuation_model, assemble_boe_packet, assign_task | Supervisor mode + approval authority |
| `administrator` | `role: "administrator"` | Elevated (same county) | All supervisor + admin:trace, admin:system | All supervisor tools + request_trace_redaction | Full admin access |
| `auditor` | `role: "auditor"` | Elevated (same county) | read:parcel, read:dossier, read:trace, audit:all | All read_only tools + trace inspection | Audit mode |

### Elevated Trace Roles (from TraceAccessControl.ts)

These roles can view traces from ANY user in the SAME county:
- `admin` ← legacy alias in code; canonical role is `administrator`
- `administrator`
- `compliance_officer`
- `auditor`
- `supervisor`

> **Note**: The 5 canonical JWT roles are: `viewer`, `appraiser`, `supervisor`, `administrator`, `auditor`.
> `admin` and `compliance_officer` appear in TraceAccessControl.ts as legacy aliases — the code
> accepts them for backward compatibility, but new code should use `administrator`.

### County Context

```typescript
// Always present in JWT and execution context
interface CountyContext {
  countyId: string;      // "benton" (lowercase)
  countyCode: string;    // "BENTON" (uppercase — used in backend queries)
  countyName: string;    // "Benton County" (display)
}
```

### Mode Definitions

| Mode | Description | Tool Filter | Write Allowed |
|------|-------------|-------------|---------------|
| `pilot` | Deterministic execution | `tool.mode === "pilot"` | Yes (with gates) |
| `muse` | Drafting, explaining, summarizing | `tool.mode === "muse"` | write_low only (drafts) |

---

## Freeze Protocol

1. All 3 agents acknowledge these contracts in their first PR description
2. Any change to these contracts requires a dedicated PR with "[CONTRACT CHANGE]" prefix
3. Contract change PRs require approval from all 3 agent owners
4. Until a contract change merges, all agents code against the frozen version

---

**Frozen**: 2026-03-02
**Version**: 1.0

## R1 Exception — CP-7 Trace Persistence
- Decision: Trace persistence uses **FileTraceStore (JSONL)** for R1.
- Rationale: Zero external dependencies; deterministic append-only evidence retention on Windows/Linux.
- Scope: `TraceService.emit()` persists fire-and-forget; `queryAsync()` and `getByCorrelationIdAsync()` delegate to the store; county isolation remains enforced.
- Deferred: SQLite/Drizzle persistence is moved to R2 with no external API contract change.
