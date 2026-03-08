# CP Lane Evidence: Trace Persistence (CP-7)

**Lane**: cp
**Date**: 2026-03-07
**Decision**: FileTraceStore (append-only JSONL) for R1, NOT SQLite/Drizzle
**Source files**:
- `os-platform/core/trace/TraceStore.ts` -- interface + FileTraceStore implementation
- `os-platform/core/trace/TraceService.ts` -- service layer with store delegation
- `os-platform/core/api/PilotController.ts` -- API surface
- `os-platform/core/tests/r1-trace-persistence.test.mjs` -- 24 tests

---

## Architectural Decision: FileTraceStore over SQLite

For R1, trace persistence uses **FileTraceStore** (append-only JSONL files) instead of SQLite/Drizzle. This decision is documented in `docs/R1_DAY0_CONTRACTS.md` under the "R1 Exception -- CP-7 Trace Persistence" section.

### Rationale

- **Zero external dependencies**: No SQLite native bindings, no Drizzle ORM, no additional build toolchain. JSONL files work on Windows and Linux without platform-specific compilation.
- **Deterministic append-only**: Each trace event is a single JSON line appended to a file. No schema migrations, no index corruption, no WAL journal management.
- **Evidence retention**: JSONL is human-readable, grep-friendly, and trivially exportable to SIEM/audit systems via NDJSON format.
- **Risk containment**: R1 trace volumes are bounded by the ring buffer (10,000 events default). FileTraceStore provides durable persistence without the operational complexity of a database.

### What Is Deferred to R2

- SQLite persistence via Drizzle ORM (schema already drafted in `TraceStore.ts` comments)
- No external API contract change required -- `TraceStore` interface is the abstraction boundary
- `queryAsync()` and `getByCorrelationIdAsync()` already delegate to the store interface, so swapping FileTraceStore for a SQLite implementation is transparent to API consumers

---

## TraceService.emit() -- Fire-and-Forget Append

**Source**: `os-platform/core/trace/TraceService.ts`, lines 144-187

The `emit()` method is the sole entry point for creating trace events:

1. Assigns `eventId` (UUID), `timestamp` (ISO 8601), and `schemaVersion` ("1.0.0")
2. Appends to in-memory ring buffer (always, for fast synchronous queries)
3. If a persistent `store` is configured, calls `store.append(event)` fire-and-forget:
   - The `.catch(() => {})` ensures persistence failure is non-fatal for R1
   - The event remains in the ring buffer regardless of persistence outcome
4. Audit loop guard prevents recursive audit event emission (Lane H safety)

The fire-and-forget pattern means `emit()` is synchronous from the caller's perspective. Persistence happens asynchronously and does not block tool execution.

---

## TraceService.queryAsync() / getByCorrelationIdAsync()

**Source**: `os-platform/core/trace/TraceService.ts`, lines 285-300

### queryAsync(options)

Delegates to the persistent store when configured:
```
async queryAsync(options): Promise<TraceEvent[]> {
  if (this.store) {
    return this.store.query(options);
  }
  return this.query(options);  // falls back to ring buffer
}
```

### getByCorrelationIdAsync(correlationId, countyId?)

Delegates to the persistent store with optional county isolation:
```
async getByCorrelationIdAsync(correlationId, countyId?): Promise<TraceEvent[]> {
  if (this.store) {
    return this.store.getByCorrelationId(correlationId, countyId);
  }
  return this.getByCorrelationId(correlationId);
}
```

The `countyId` parameter in `getByCorrelationIdAsync` enables county isolation at the store level -- events from other counties are filtered out before returning.

---

## FileTraceStore Implementation

**Source**: `os-platform/core/trace/TraceStore.ts`

The `TraceStore` interface defines the persistence contract:

- `append(event)` -- Immutable, append-only write
- `query(options)` -- Filtered query with pagination (newest-first)
- `getById(eventId)` -- Single event lookup
- `getByCorrelationId(correlationId, countyId?)` -- Correlation group with county filter
- `count(countyId?)` -- Event count (optionally county-scoped)
- `healthy()` -- Health check
- `prune(retentionMs)` -- Retention-based cleanup
- `stats()` -- Store statistics (total, oldest, newest)

The `FileTraceStore` implementation:
- Appends each event as a single JSON line to a `.jsonl` file via `appendFileSync()`
- Reads and parses all lines for queries (acceptable for R1 event volumes)
- Creates parent directories on first write via `mkdirSync({ recursive: true })`
- County isolation enforced in `getByCorrelationId()` via countyId filter parameter

---

## County Isolation in TraceService Query Filters

County isolation is enforced at multiple layers:

1. **Handler level**: `assertCountyMatch()` in every real handler rejects cross-county calls before any backend request
2. **ToolRunner level**: `ToolRunner.run()` validates `params.county` against `context.countyId` (case-insensitive)
3. **TraceService level**: `getByCorrelationIdAsync(correlationId, countyId)` passes county filter to store
4. **PilotController level**: `/pilot/traces` endpoint filters events by `e.context.countyId` matching the authenticated principal's county. Cross-county events are rejected and logged as `permission_denied` audit events.
5. **TraceAccessControl level**: `canViewCorrelation()` and `filterVisibleTraceEvents()` enforce same-county access. Non-elevated roles see only their own traces.

---

## PilotController Endpoints

**Source**: `os-platform/core/api/PilotController.ts`

### POST /pilot/invoke
The single choke point for all tool invocations. Builds `ToolExecutionContext` from auth, delegates to `ToolRunner.execute()`, and returns `PilotInvokeResponse` with correlation ID.

### GET /pilot/traces
Parcel-scoped trace listing with pagination. Requires `parcelId` query parameter. Supports `toolId`, `from`, `to`, `limit`, `offset` filters. County isolation enforced via principal matching. Emits `trace_accessed` audit event on every request.

### GET /pilot/traces/export
NDJSON export for audit/SIEM. Requires elevated trace role. Bounded to 30-day window maximum. Delegates to `handleTraceExport()`.

### GET /pilot/traces/stats
Store statistics (total events, oldest/newest timestamps). Requires elevated trace role (admin, compliance_officer, auditor, supervisor). Returns 403 for non-elevated roles.

### GET /pilot/trace/:correlationId
Single correlation lookup. Enforces access control via `canViewCorrelation()`. Returns 403 (not 404) for denied access to prevent existence leaking.

---

## Test Coverage: 24 Tests in r1-trace-persistence.test.mjs

**Source**: `os-platform/core/tests/r1-trace-persistence.test.mjs`

The test file validates 5 categories:

1. **FileTraceStore**: append, query, survives new instance (persistence across restarts)
2. **TraceService + store**: emit with configured store, persist fire-and-forget, new service instance reads back
3. **InMemoryTraceStore**: query, getByCorrelationId, count
4. **createTraceStore factory**: validation of store type configuration
5. **County isolation in persistent store**: cross-county queries return empty results

All 24 tests use `node:test` runner with `node:assert/strict`. Test isolation via per-test temp directories in `os.tmpdir()`.

---

## Deferred to R2

| Item | R1 Status | R2 Plan |
|------|-----------|---------|
| SQLite persistence | Not implemented | Drizzle ORM schema, same `TraceStore` interface |
| Full-text search on trace summaries | Not implemented | SQLite FTS5 extension |
| Trace compaction | Not implemented | Background job to compact old JSONL segments |
| Cross-county audit queries | Blocked at TraceAccessControl | `auditor` role with `audit:all` claim |

No external API contract change is required for the R1-to-R2 transition. The `TraceStore` interface is the abstraction boundary.
