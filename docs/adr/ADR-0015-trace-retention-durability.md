# ADR-0015: Trace Retention and Durability Strategy

Status: Accepted for R1 baseline; durability hardening merged in PR #515.  
Date: 2026-03-03

## Context
R1 requires persistent, queryable, county-scoped trace evidence with deterministic behavior and low operational friction. The trace system is implemented in `os-platform/core/trace` and surfaced via Pilot trace endpoints.

## Decision
1. Use `FileTraceStore` (JSONL append-only) for R1 persistence.
2. Enforce bounded query behavior by defaulting list queries to a 30-day window when no date bounds are provided.
3. Keep ordering deterministic (`timestamp DESC`, `correlationId ASC`) for stable pagination.
4. Expose operability stats via `GET /pilot/traces/stats`, access-controlled by elevated trace roles.
5. Maintain auditable access via explicit `trace_accessed` and `permission_denied` events.

## Durability and Retention Mechanics

### Current merged baseline (#513/#514 and earlier)
- `append()` uses synchronous line append to JSONL.
- `prune(retentionMs)` removes old events and rewrites file with survivors.
- malformed JSON lines are skipped during load.

### Merge-pending hardening in #515
- Atomic prune file replacement (`.tmp` + rename) to avoid partial-write corruption windows.
- Corruption metric (`corruptLineCount`) incremented for malformed lines.
- Restart-correctness tests for persistence + post-prune behavior.

## Alternatives Considered

### In-place truncate/delete during prune
- Rejected: higher partial-write and interleaving risk, weak crash safety.

### Delete-on-write strategy
- Rejected: violates append-only evidence posture; weak audit continuity.

### Cursor pagination now
- Rejected for R1: higher implementation complexity than needed.
- Decision: return `nextCursor: null` placeholder now; preserve contract for later migration.

## Risks and Mitigations
- Risk: audit noise / audit-about-audit loops in parcel feed.
  - Mitigation: list-access audit events omit `parcelId` so they do not appear in parcel-scoped lists.
- Risk: access pattern leaks (cross-county or cross-user).
  - Mitigation: county isolation + role-based filtering + denial metrics.
- Risk: malformed lines in trace file.
  - Mitigation: skip malformed lines; count and surface corruption metric (post-#515 merge).

## Consequences
- R1 gets deterministic evidence behavior with minimal ops dependencies.
- Durability hardening path remains compatible with current API/contract semantics.

