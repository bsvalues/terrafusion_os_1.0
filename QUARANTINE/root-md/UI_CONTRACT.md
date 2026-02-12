# TerraFusion OS UI Integration Contract
## Version 1.0 | Zone B | February 2026

---

## 🎯 PURPOSE

This document defines the **versioned, frozen interface** between the TerraFusion OS UI (frontend/apps/os-shell) and the core runtime (os-platform/core). This contract ensures backward compatibility, trace-first error handling, and observability-driven development.

---

## 📐 ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────┐
│    UI Layer (Zone B)                         │
│    frontend/apps/os-shell/src                │
│    - Desktop Shell                           │
│    - Router (React Router)                   │
│    - API Clients                             │
│    - Error Boundaries                        │
└──────────────────────────────────────────────┘
                    ↓ HTTP/REST
┌──────────────────────────────────────────────┐
│    Core Runtime (Zone B - Allowed Scope)     │
│    os-platform/core/                         │
│    - ToolRunner                              │
│    - ToolRegistry                            │
│    - TraceService                            │
│    - PilotController (API)                   │
└──────────────────────────────────────────────┘
                    ↓ Trace Events
┌──────────────────────────────────────────────┐
│    Trace Store                               │
│    os-platform/core/trace/TraceStore.ts      │
│    - correlationId-indexed                   │
│    - event stream (tool_invoked → result)    │
└──────────────────────────────────────────────┘
```

---

## 🔒 INTERFACE SPECIFICATION (v1.0)

### 1. Tool Execution Request

**Endpoint**: `POST /api/pilot/execute`

**Request Payload**:
```typescript
interface ToolExecutionRequest {
  toolId: string;
  arguments: Record<string, unknown>;
  context: {
    county: string;           // e.g., "benton" | "yakima"
    userId: string;
    role: string;             // e.g., "operator" | "supervisor"
    confirmation?: boolean;   // for write_low+
    reasonCode?: string;      // for write_high
    supervisorApproval?: {    // for irreversible
      userId: string;
      role: string;
      timestamp: string;
    };
  };
}
```

**Response (Success)**:
```typescript
interface ToolExecutionSuccess {
  correlationId: string;      // PRIMARY KEY for trace lookup
  status: "success";
  result: unknown;            // Tool-specific result
  executionTime: number;      // milliseconds
  timestamp: string;          // ISO 8601
}
```

**Response (Failure)**:
```typescript
interface ToolExecutionFailure {
  correlationId: string;      // ALWAYS present, even on failure
  status: "error";
  error: {
    code: ErrorCode;          // e.g., "CONFIRMATION_REQUIRED"
    message: string;
    details?: unknown;
  };
  executionTime: number;
  timestamp: string;
}
```

**Error Codes** (from [ToolRunner.ts](os-platform/core/pilot/ToolRunner.ts)):
- `WRITE_LANE_MISMATCH`
- `WRITE_LANE_REQUIRED`
- `CONFIRMATION_REQUIRED`
- `REASON_CODE_REQUIRED`
- `REASON_CODE_INVALID`
- `SUPERVISOR_APPROVAL_REQUIRED`
- `SUPERVISOR_ROLE_INVALID`
- `PAYLOAD_STORE_REQUIRED`
- `TOOL_NOT_FOUND`
- `EXECUTION_FAILED`

---

### 2. Trace Query

**Endpoint**: `GET /api/pilot/trace/:correlationId`

**Response**:
```typescript
interface TraceChain {
  correlationId: string;
  events: TraceEvent[];       // chronological
}

interface TraceEvent {
  eventType: "tool_invoked" | "tool_completed" | "tool_failed";
  timestamp: string;
  toolId?: string;
  component: string;          // e.g., "ToolRunner" | "Handler"
  payload?: unknown;
  errorCode?: string;
  stackTrace?: string;        // on tool_failed only
}
```

**Usage** (supports Wave 1 debugging workflows):
```bash
# From frontend error UI → copy correlationId → query
pnpm run trace:query --correlation <correlationId>
```

---

## 🧩 UI INTEGRATION POINTS

### A. Global Error Boundary

**Location**: [frontend/apps/os-shell/src/contexts/ErrorContext.tsx](frontend/apps/os-shell/src/contexts/ErrorContext.tsx)

**Required Contract**:
1. **Capture** `correlationId` from all API errors
2. **Display** user-safe error message + correlationId
3. **Provide** "Copy correlationId" button
4. **Hint** (dev-only): "Run: `pnpm run trace:query --correlation <id>`"

**Example UI**:
```tsx
interface ErrorDisplayProps {
  error: ToolExecutionFailure;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="error-surface">
      <h3>⚠️ Operation Failed</h3>
      <p>{getUserSafeMessage(error.error.code)}</p>
      <div className="correlation-id-block">
        <code>{error.correlationId}</code>
        <button onClick={() => copyToClipboard(error.correlationId)}>
          📋 Copy
        </button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details>
          <summary>Debug Info</summary>
          <pre>pnpm run trace:query --correlation {error.correlationId}</pre>
        </details>
      )}
    </div>
  );
}
```

---

### B. Tool Invocation Component

**Location**: (to be created in Phase 2)

**Contract**:
1. **Validate** tool arguments before submission
2. **Show** loading state with "cancel" option
3. **Emit** traces for UI-level events (e.g., "user_cancelled")
4. **Handle** all error codes with specific UI feedback

**Example**:
```tsx
export function ToolInvoker({ toolId }: { toolId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolExecutionSuccess | null>(null);
  const [error, setError] = useState<ToolExecutionFailure | null>(null);

  const execute = async (args: Record<string, unknown>) => {
    setLoading(true);
    try {
      const response = await pilotApi.executeTool(toolId, args, context);
      if (response.status === "success") {
        setResult(response);
      } else {
        setError(response);
      }
    } catch (err) {
      // Network/parse errors → still try to extract correlationId
      setError({
        correlationId: err.correlationId || 'unknown',
        status: "error",
        error: { code: "EXECUTION_FAILED", message: err.message },
        executionTime: 0,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Tool form */}
      {loading && <LoadingSpinner />}
      {result && <SuccessDisplay result={result} />}
      {error && <ErrorDisplay error={error} />}
    </div>
  );
}
```

---

### C. correlationId Persistence

**Contract**:
- **Store** correlationId in session storage on error
- **Show** "Recent Errors" widget in dev mode
- **Link** to trace query from error history

---

## ✅ VERIFICATION CHECKLIST (Per PR)

Before merging UI changes:

1. ✅ **Type Safety**: All API responses match TypeScript interfaces
2. ✅ **correlationId Display**: Visible + copyable on all error surfaces
3. ✅ **Trace Query Hint**: Shown in dev mode
4. ✅ **Error Code Mapping**: All codes have user-safe messages
5. ✅ **Loading States**: Clear feedback during tool execution
6. ✅ **Tests**: E2E test for "error → copy correlationId → query trace" workflow

---

## 🔄 VERSIONING & EVOLUTION

**Current Version**: v1.0 (Zone B, Feb 2026)

**Compatibility Promise**:
- Interface fields are **additive-only** (no breaking changes)
- New error codes → documented + mapped to UI messages
- New trace event types → backward-compatible query

**Deprecation Process**:
1. Announce in `UI_CONTRACT_CHANGELOG.md`
2. 2-sprint grace period
3. Runtime warnings in dev mode
4. Final removal only after all UI surfaces migrated

---

## 📚 RELATED DOCUMENTATION

- **Backend Contract**: [os-platform/core/api/PilotController.ts](os-platform/core/api/PilotController.ts)
- **Error Handling**: [AGENTS.md § Debugging Workflows](AGENTS.md#debugging-workflows)
- **Trace Schema**: [os-platform/core/trace/schema.ts](os-platform/core/trace/schema.ts)
- **Wave 1 Dry-Run**: `scripts/wave1-dryrun.mjs` (shows trace ergonomics in action)

---

## 🏛️ THE TERRAFUSION WAY

**Observability-First UX**: Every user-facing error is a gateway to complete system introspection. correlationId is not a debug tool—it's a first-class citizen of the error experience.

**Government. Transcended.**
