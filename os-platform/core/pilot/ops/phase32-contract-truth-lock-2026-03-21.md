# Phase 32 Contract Truth Lock

Date: 2026-03-21
Status: LOCKED FOR LANES 1-2
Owner: Copilot / solo-dev execution lane
Scope: Record only verified Phase 32 contract truth from current workspace evidence

## Purpose

This artifact replaces assumption-driven Phase 32 route naming with repo-backed truth.

Only claims verified from current workspace code are included here.

## Verified REST Surface

### Canon adapter routes in governed backend scope

Verified in `os-platform/core/api/PilotController.ts`:

- `POST /pilot/canon/ping`
  - request body: `{ echo?: string }`
  - behavior: executes `pnpm canon:ping --json --echo <value>`
  - response shape: canon wrapper payload with fields `tool`, `version`, `startedAt`, `dryRun`, `overallOk`, optional `error`, optional `stderr`, optional `rawStdout`, optional `rawStderr`, optional `normalized`, optional `raw`
- `POST /pilot/canon/doctor`
  - request body: `{}`
  - behavior: executes `pnpm canon:doctor --json`
  - response shape: same canon wrapper payload
- `POST /pilot/canon/gatefast`
  - request body: `{}`
  - behavior: executes `pnpm canon:gatefast --json`
  - response shape: same canon wrapper payload

### Frontend callers bound to those routes

Verified in `frontend/apps/os-shell/src/api/canonPing.ts`, `frontend/apps/os-shell/src/api/canonDoctor.ts`, and `frontend/apps/os-shell/src/api/canonGateFast.ts`:

- frontend calls `${VITE_API_URL}/pilot/canon/ping`
- frontend calls `${VITE_API_URL}/pilot/canon/doctor`
- frontend calls `${VITE_API_URL}/pilot/canon/gatefast`

## Verified Correlation-Id Truth

### Pilot invoke path exposes correlationId

Verified in `os-platform/core/api/PilotController.ts` and `frontend/apps/os-shell/src/api/pilotApi.ts`:

- `POST /pilot/invoke` returns JSON with `ok` and `correlationId`
- UI pilot client expects and propagates `correlationId` from that invoke response

### Canon adapter routes do not expose correlationId in the HTTP payload

Verified in `os-platform/core/api/PilotController.ts`:

- `/pilot/canon/ping`
- `/pilot/canon/doctor`
- `/pilot/canon/gatefast`

These routes return the parsed canon command wrapper directly and do not append `correlationId` to the HTTP response body.

Verified in `os-platform/core/pilot/dev-pilot-runtime.mjs`:

- the dev pilot runtime internally emits trace events with generated `canon-${Date.now()}` correlation ids
- those correlation ids are used for trace emission inside the runtime
- those correlation ids are not returned in the HTTP JSON payload for canon endpoints

Decision:

- treat missing `correlationId` on canon adapter responses as current contract truth, not a smoke failure
- record correlation-id exposure for `/pilot/invoke` separately from canon adapter routes

## Collaboration / Hub Truth

### Frontend collaboration assumption exists

Verified in `frontend/apps/os-shell/src/services/SignalRService.ts`:

- frontend collaboration client targets `${baseUrl}/hubs/collaboration`
- frontend invokes `JoinSession(sessionId, user)`
- frontend invokes `LeaveSession(sessionId)`

### Governed backend mapping is not verified in current workspace evidence

Searches in governed backend scope found no verified collaboration hub mapping under `os-platform/core/**` for:

- `/hubs/collaboration`
- a `MapHub(...)` call
- a governed backend hub class tied to the collaboration route

Decision:

- do not invent a collaboration hub path beyond the frontend assumption
- do not invent join or leave method names beyond the frontend assumption
- require explicit environment input for live collaboration smoke until backend route and method truth are proven on the executable surface

## Phase 32 Execution Consequence

Lane 2 may safely prebuild:

- a REST smoke script fixed to the verified canon adapter routes
- a collaboration smoke script that requires explicit live hub configuration and classifies missing truth as contract input missing

Lane 5 must not claim collaboration contract truth until the live surface verifies:

- actual hub URL
- actual auth path
- actual join method
- actual leave method
- any optional edit/broadcast method

## Locked Artifact Set

- `os-platform/core/pilot/phase32-codex-live-smoke.mjs`
- `os-platform/core/pilot/phase32-codex-collab-smoke.mjs`
- `os-platform/core/pilot/ops/phase32-evidence-bundle-templates-2026-03-21.md`

These artifacts must stay aligned to this truth lock unless newer repo evidence supersedes it.