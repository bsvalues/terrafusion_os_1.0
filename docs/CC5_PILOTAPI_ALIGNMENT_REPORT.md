# CC-5: pilotApi.ts Alignment Report

**File**: `frontend/apps/os-shell/src/api/pilotApi.ts` (576 lines)
**Contract**: `os-platform/core/types/INVOKE_CONTRACT.md`
**Status**: 3 confirmed misalignments, 5 action items

## Misalignment 1: Base URL (Line 26)

**Current**:
```ts
const API_BASE_URL = env.VITE_API_URL || 'http://localhost:5000';
```

**Contract** (INVOKE_CONTRACT.md):
- Backend runs on port 5046 (R1 Pilot subsystem)
- Env var should be `TF_API_BASE_URL` (full override) or `TF_API_PORT` (port-only)

**Fix**:
```ts
const API_BASE_URL = env.TF_API_BASE_URL || `http://localhost:${env.TF_API_PORT || '5046'}`;
```

**Risk**: LOW — current code works because Vite proxy routes `/api` to backend anyway. Only matters for direct API calls bypassing proxy.

## Misalignment 2: approvalToken Field (Lines 105, 116-141, 419-433)

**Current**:
```ts
// Line 105 in PilotInvokeRequest
approvalToken?: string;

// Lines 116-141: Full ApprovalToken type system
interface ApprovalToken { tokenId, toolId, requestHash, ... }
interface ApprovalTokenRequest { ... }
interface ApprovalTokenResponse { ... }

// Lines 419-433: requestApprovalToken() function
export async function requestApprovalToken(request: ApprovalTokenRequest): Promise<ApprovalTokenResponse> {
  const url = `${API_BASE_URL}/pilot/approval/token`;
  // ...
}
```

**Contract**: `INVOKE_CONTRACT.md` defines NO `approvalToken` field on InvokeRequest. The `/pilot/approval/token` endpoint is NOT in the contract.

**Assessment**: This is Phase 4 "Solo Approval Token" — a speculative feature that was coded ahead of the contract. The types and function are well-structured but have no backend counterpart.

**Fix**: Remove `approvalToken` from `PilotInvokeRequest`. Keep the types/function in a commented-out block or separate file for when the backend implements this feature.

**Risk**: MEDIUM — if any UI code calls `requestApprovalToken()`, removing it would break compilation. Grep for usage first.

## Misalignment 3: Error Codes (Lines 548-575)

**Current** `getSeverityFromErrorCode()`:
```ts
// Line 552: HANDLER_ERROR — NOT a contract code
if (errorCode === 'EXECUTION_FAILED' || errorCode === 'HANDLER_ERROR') return 'critical';

// Line 560: REJECTED_PII — NOT a contract code
if (errorCode === 'WRITE_LANE_MISMATCH' || errorCode === 'SUPERVISOR_APPROVAL_REQUIRED' || errorCode === 'REJECTED_PII') return 'high';

// Line 569: REJECTED_MISSING_EVIDENCE — NOT a contract code
if (errorCode === 'CONFIRMATION_REQUIRED' || errorCode === 'REASON_CODE_REQUIRED' || errorCode === 'REJECTED_MISSING_EVIDENCE') return 'medium';
```

**Contract** canonical error codes (12):
| Code | Mapped? |
|------|---------|
| `TOOL_NOT_FOUND` | NO |
| `ROLE_DENIED` | NO |
| `WRITE_LANE_MISMATCH` | YES (high) |
| `CONFIRMATION_REQUIRED` | YES (medium) |
| `REASON_CODE_REQUIRED` | YES (medium) |
| `SUPERVISOR_APPROVAL_REQUIRED` | YES (high) |
| `MODE_MISMATCH` | NO |
| `POLICY_DENIED` | NO |
| `RATE_LIMITED` | NO |
| `EXECUTION_FAILED` | YES (critical) |
| `TRACE_WRITE_FAILED` | NO |
| `APPROVAL_TOKEN_INVALID` | NO |

**Non-contract codes present**:
- `HANDLER_ERROR` -> should be `EXECUTION_FAILED`
- `REJECTED_PII` -> should be `POLICY_DENIED`
- `REJECTED_MISSING_EVIDENCE` -> should be `POLICY_DENIED`

**Missing contract codes** (7): `TOOL_NOT_FOUND`, `ROLE_DENIED`, `MODE_MISMATCH`, `POLICY_DENIED`, `RATE_LIMITED`, `TRACE_WRITE_FAILED`, `APPROVAL_TOKEN_INVALID`

## What IS Aligned (No Changes Needed)

| Feature | Status |
|---------|--------|
| `POST /pilot/invoke` single choke point | Correct |
| `POST /pilot/validate` preflight | Correct |
| `GET /pilot/tools` listing | Correct |
| `GET /pilot/tools/:id` detail | Correct |
| `GET /pilot/trace/:correlationId` | Correct |
| `GET /pilot/health` | Correct |
| Suite type enum | Correct (forge, atlas, dais, dossier, os, pilot, gpt) |
| Risk type enum | Correct (read_only, write_low, write_high, irreversible) |
| Mode type enum | Correct (pilot, muse) |
| PilotInvokeRequest shape | Correct (except approvalToken) |
| PilotInvokeResponse shape | Correct |
| correlationId flow | Correct (backend -> UI via normalizePilotError) |
| buildPilotHeaders() | Correct (x-user-id, x-county-id, x-role, x-mode) |
| Risk/Suite badge colors | Correct (UI-only, no contract dependency) |

## Action Items (R1 Priority)

1. **Fix base URL** (line 26): `VITE_API_URL || localhost:5000` -> `TF_API_BASE_URL || localhost:5046`
2. **Remove `approvalToken`** from `PilotInvokeRequest` (line 105) — grep for callers first
3. **Quarantine approval token types** (lines 116-141) and `requestApprovalToken()` (lines 419-433) — move to `pilotApi.approval.ts` or comment with `// R2: pending backend implementation`
4. **Fix error code mapping** (lines 548-575): replace 3 non-contract codes with contract codes
5. **Add 7 missing contract codes** to `getSeverityFromErrorCode()` with appropriate severity levels
