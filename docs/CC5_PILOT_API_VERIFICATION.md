# CC-5: Pilot API Verification Report

> **Purpose:** Verify the Pilot API contract, correlationId propagation, and URL handling.
> **Scope:** Read-only audit with one flagged issue. No behavior changes in this PR.

## 1. Contract Alignment

### Request: `PilotInvokeRequest`

| Field | pilotApi.ts | INVOKE_CONTRACT.md | ToolRunner.ts | Match? |
|-------|-------------|-------------------|---------------|--------|
| `toolId` | string | string | string | YES |
| `params` | Record<string, unknown> | Record<string, unknown> | Record<string, unknown> | YES |
| `mode` | Mode? | Mode? | Mode? | YES |
| `parcelId` | string? | string? | string? | YES |
| `dossierId` | string? | string? | string? | YES |
| `confirmation` | boolean? | boolean? | boolean? | YES |
| `reasonCode` | string? | string? | string? | YES |
| `supervisorApproval` | object? | object? | object? | YES |
| `approvalToken` | string? | **NOT YET** | **NOT YET** | Phase 4 forward-add |

**Verdict:** Contract aligned. `approvalToken` is a known Phase 4 extension.

### Response: `PilotInvokeResponse`

| Field | pilotApi.ts | ToolRunner.ts | Match? |
|-------|-------------|---------------|--------|
| `ok` | boolean | boolean | YES |
| `result` | T | TResult | YES |
| `correlationId` | string | string (randomUUID) | YES |
| `traceEventId` | string? | string? | YES |
| `error` | string? | string? | YES |
| `errorCode` | ErrorCode? | ErrorCode? | YES |

**Verdict:** Fully aligned.

## 2. CorrelationId Flow

```
User Action
  → invokeTool() [pilotApi.ts]
    → POST /pilot/invoke
      → ToolRunner.execute() generates correlationId (crypto.randomUUID)
        → Emits tool_invoked trace event
        → Runs Gates 4→5→5b→6→handler
        → Emits tool_completed/tool_failed
      ← Returns { ok, correlationId, result/error }
    ← pilotApi normalizes into typed response with correlationId
  ← UI receives correlationId, displays in ResultPanel with copy button
```

**Three correlationId origins:**
| Prefix | Source | When |
|--------|--------|------|
| `corr-*` | Backend (ToolRunner) | Successful invoke or backend error |
| `net-*` | Client (pilotApi.ts) | Network/fetch failure |
| `ebnd-*` | Client (ErrorBoundary) | React render crash |

**Propagation verified:** All 5 workbench tabs (Forge, Atlas, Dais, Dossier, Pilot) use the single `invokeTool()` choke point. No tab calls `invokePilotTool()` directly.

## 3. URL / Port Handling

| File | Pattern | Status |
|------|---------|--------|
| `pilotApi.ts` | `VITE_API_URL \|\| 'http://localhost:5000'` | **FLAG** — fallback uses `:5000` not `:5046` |
| `apiBase.ts` | Returns `/api` (relative, Vite proxy) | PASS |
| `useCostForgeAPI.ts` | `getViteEnv().VITE_API_URL` | PASS |

**Note:** `pilotApi.ts` intentionally does NOT use `apiBase.ts` — documented in code comments. Pilot makes absolute URL calls to backend, bypassing Vite proxy.

### Port Fallback Issue

`pilotApi.ts` line 26:
```ts
const API_BASE_URL = env.VITE_API_URL || 'http://localhost:5000';
```

Per governance rules, the fallback should use `TF_API_PORT` env var or default to `:5046`. This is dev-only (production always sets `VITE_API_URL`), but violates the zero-tolerance port rule.

**Recommended fix (deferred — not in this PR):**
```ts
const API_BASE_URL = env.VITE_API_URL || `http://localhost:${env.TF_API_PORT || '5046'}`;
```

## 4. Enforcement Order (Backend)

ToolRunner executes gates in this order:

| Gate | Check | Error Code |
|------|-------|------------|
| 1 | Tool lookup | `TOOL_NOT_FOUND` |
| 2 | Mode match | `MODE_MISMATCH` |
| 3 | Preflight policy | `POLICY_DENIED` |
| 4 | Write-lane | `WRITE_LANE_MISMATCH` / `WRITE_LANE_REQUIRED` |
| 5 | Risk policy | `CONFIRMATION_REQUIRED` / `REASON_CODE_REQUIRED` / `SUPERVISOR_APPROVAL_REQUIRED` |
| 5b | RBAC permissions | `PERMISSION_DENIED` |
| 6 | PII/Trace | `PAYLOAD_STORE_REQUIRED` |
| 7 | Handler exec | `EXECUTION_FAILED` |

**Verified:** Matches INVOKE_CONTRACT.md § "Enforcement Order".

## 5. Error Severity Mapping

pilotApi.ts maps error codes to severity for UI presentation:

| Severity | Error Codes |
|----------|------------|
| critical | `EXECUTION_FAILED`, `HANDLER_ERROR` |
| high | `WRITE_LANE_MISMATCH`, `SUPERVISOR_APPROVAL_REQUIRED`, `REJECTED_PII` |
| medium | `CONFIRMATION_REQUIRED`, `REASON_CODE_REQUIRED`, `REJECTED_MISSING_EVIDENCE` |
| low | All others |

## 6. Consumer Map (23 import sites)

**Production (13):** PilotConsole, PilotConsoleContent, GovernanceDashboard, ToolInvokePanel, RiskPolicyGate, RiskConfirmationModal, PropertyPilot, PropertyForge, PropertyDossier, PropertyDais, PropertyAtlas, invokeWithPreflight, Router (PilotApiDemo)

**Tests (10):** PropertyForge.test, PropertyDossier.test, PropertyDais.test, PropertyAtlas.test, ToolInvokePanel.test, RiskPolicyGate.test, RiskPolicyGate.irreversible.test, RiskConfirmationModal.test, pilotapi-error-normalization.test, error-pipeline-integration.test

## 7. Summary

| Check | Status |
|-------|--------|
| Request contract alignment | **PASS** |
| Response contract alignment | **PASS** |
| CorrelationId propagation | **PASS** |
| Single invokeTool choke point | **PASS** |
| Error normalization | **PASS** |
| Backend gate enforcement order | **PASS** |
| RBAC (Gate 5b) | **PASS** |
| Port handling | **FLAG** — `:5000` fallback in pilotApi.ts |
| apiBase.ts separation | **PASS** (intentional, documented) |
