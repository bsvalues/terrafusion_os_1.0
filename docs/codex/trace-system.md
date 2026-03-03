# Trace System Contract (R1 Integration)

Last updated: 2026-03-03  
Source of truth: `os-platform/core/api/PilotController.ts`, `os-platform/core/trace/TraceService.ts`, `os-platform/core/trace/TraceStore.ts`, PRs #511-#515.

## Scope
- Endpoint contracts for `GET /pilot/traces` and `GET /pilot/traces/stats`
- Query semantics and access rules
- Response shape guarantees
- Security and audit behavior

## Endpoint: `GET /pilot/traces`

### Request
- Query params:
  - `parcelId` (required)
  - `toolId` (optional)
  - `from` (optional, ISO 8601 inclusive lower bound)
  - `to` (optional, ISO 8601 inclusive upper bound)
  - `limit` (optional, default `50`, clamped `1..200`)
  - `offset` (optional, default `0`, min `0`)

### Validation
- `parcelId` missing -> `400 INVALID_REQUEST`
- invalid `from`/`to` -> `400 INVALID_REQUEST`
- `from > to` -> `400 INVALID_REQUEST`

### Query Semantics
- Default window: if neither `from` nor `to` is provided, effective `from = now - 30 days`.
- Ordering: stable sort `timestamp DESC`, tie-break `correlationId ASC`.
- Pagination: offset/limit over sorted events.
- `toolId` filter is parcel-bounded in practice: querying `toolId` under a different parcel returns empty (no cross-parcel existence leak).

### Access Control
- County isolation is always enforced.
- Elevated roles can see in-county traces across users.
- Non-elevated users only see their own trace events.
- Filtered events are removed from results; response remains `200`.

### Auditing Behavior
- Every call emits `trace_accessed` (`toolId: pilot:traces:list`).
- If events are filtered by access control, emits `permission_denied` with filtered count.
- Guard against audit-feed recursion/noise: audit events for list access intentionally omit `parcelId` in event context, so they do not re-enter parcel-scoped list feeds.

### Response
- JSON:
  - `events: TraceEvent[]`
  - `pagination: { offset, limit, returned }`
  - `nextCursor: null` (reserved for future cursor pagination)

## Endpoint: `GET /pilot/traces/stats`

### Purpose
- Returns trace store operability stats.

### Access Control
- Requires elevated trace role (`admin`/`administrator`/`compliance_officer`/`auditor`/`supervisor` per `TraceAccessControl`).
- Unauthorized calls return `403 ACCESS_DENIED`.

### Auditing Behavior
- Denied calls emit `permission_denied` (`toolId: pilot:traces:stats`).
- Allowed calls emit `trace_accessed` (`toolId: pilot:traces:stats`).

### Response
- JSON:
  - `totalEvents: number`
  - `oldestTimestamp: string | null`
  - `newestTimestamp: string | null`

## Store and Retention Semantics
- Store type in R1: `FileTraceStore` (JSONL append-only persistence) via `TraceService` store delegation.
- `TraceService.emit()` is fire-and-forget persistence (ring buffer remains source for immediate in-memory access; store failures do not fail emit).
- Retention pruning exists at both `TraceService.prune()` and `TraceStore.prune()`.

## Durability (merged in #515)
- Atomic prune rewrite (`.tmp` + rename) — crash-safe file replacement.
- Corruption line counter (`getCorruptLineCount()`) — malformed lines counted during load.
- Restart/durability hardening tests (12 new tests covering persistence, corruption, atomic prune).

## Security Invariants (merged in #516)
- No `write:os` claim exists in ROLE_VOCABULARY; OS-lane tools are gated by `admin:trace`.
- Irreversible OS tools (e.g. `request_trace_redaction`) require `administrator` role with `approve:irreversible` + `admin:trace` claims.
- `runtime-lock.test.mjs` now deterministic (11/11 pass).

## Endpoint: `GET /pilot/traces/export` (merged in #523, #525)

### Purpose
- Downloads trace events as NDJSON file for a given parcel.
- With `includeMeta=1`, wraps events in an integrity envelope (header + SHA-256 footer) suitable for formal evidence packs.

### Request
- Query params:
  - `parcelId` (required)
  - `correlationId` (optional, filters to single correlation chain)
  - `from` (optional, ISO 8601 — default: `now - 30 days`)
  - `to` (optional, ISO 8601 — default: `now`)
  - `limit` (optional, default `500`, clamped `1..2000`)
  - `format` (optional, must be `ndjson` if present)
  - `includeMeta` (optional, `1` or `true` — enables integrity envelope)

### Validation
- `parcelId` missing → `400 INVALID_REQUEST`
- Invalid `from`/`to` → `400 INVALID_REQUEST`
- `from > to` → `400 INVALID_REQUEST`
- Window exceeds 30 days → `400 INVALID_REQUEST`

### Access Control
- Requires elevated trace role (same set as `/pilot/traces`).
- Cross-county export denied → `403 ACCESS_DENIED` (events from other counties are rejected, not silently filtered).
- Denied calls emit `permission_denied` (`toolId: pilot:traces:export`).
- Allowed calls emit `trace_accessed` (`toolId: pilot:traces:export`).

### Ordering
- Stable three-key sort: `timestamp DESC`, `correlationId ASC`, `eventId ASC`.
- Header `order` field: `timestamp_desc,correlationId_asc,eventId_asc`.
- Implementation: `sortTraceExportEvents()` in `traceExport.ts`.

### Response: Default Mode (`includeMeta` omitted)
- Content-Type: `application/x-ndjson; charset=utf-8`
- Body: one JSON line per event, no header, no footer.
- Backward compatible with Lane K1-K3 consumers.

### Response: Integrity Mode (`includeMeta=1`)
- Content-Type: `application/x-ndjson; charset=utf-8`
- Body structure:
  1. **Header line** — `{"type":"trace_export_header", "parcelId":..., "correlationId":..., "from":..., "to":..., "limit":..., "exportedAt":..., "order":"timestamp_desc,correlationId_asc,eventId_asc"}`
  2. **Event lines** — one JSON object per line (same as default mode)
  3. **Footer line** — `{"type":"trace_export_footer", "sha256":"<hex>", "count":<N>}`

### SHA-256 Hash Contract
- **Input**: exact bytes of each event line (`JSON.stringify(event) + "\n"`).
- **Excluded**: header line and footer line are NOT fed to the hash.
- **Determinism**: same events in same order always produce the same hash. `exportedAt` (in header only) cannot affect the digest.
- **Verification**: a consumer can recompute the hash by streaming event lines through `SHA-256` and comparing against `footer.sha256`.
- **Count**: `footer.count` equals the number of event lines (must match count of lines between header and footer).

### Design Rationale
- Header/footer excluded from hash so that `exportedAt` (a wall-clock timestamp) does not break deterministic verification.
- Default mode emits bare events for backward compatibility and lightweight consumers.
- Integrity mode is opt-in to avoid breaking existing download flows.

## K4: Export Action UI Behavior (merged in #524)

### Terminal-Phase Gate
The "Export Trace" button in `ExecutionConsole.tsx` is gated on `isTerminal`:
```typescript
const isTerminal = phase === 'succeeded' || phase === 'failed';
```
Export is only available when a tool invocation has reached a terminal phase. This is **intentional behavior**:
- Prevents mid-execution exports that would capture incomplete event chains.
- Ensures the correlationId chain is complete before evidence capture.
- Admin diagnostics panel is similarly gated (`isTerminal && showDiagnostics`).

### Admin-Only Visibility
- Export action and diagnostics panel require `showDiagnostics` prop (admin role gate).
- Non-admin users never see the export button or diagnostics drawer.

