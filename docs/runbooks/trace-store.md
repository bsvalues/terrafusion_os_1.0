# Runbook: Trace Store Operations (R1)

Last updated: 2026-03-03

## Purpose
Operator playbook for Pilot trace storage health, retention validation, and access-audit monitoring.

## Endpoints
- `GET /pilot/traces?parcelId=...`
- `GET /pilot/traces/stats` (elevated roles only)

## Normal Expectations
- Trace list returns parcel-scoped events with stable order.
- List responses include:
  - `pagination.offset`
  - `pagination.limit`
  - `pagination.returned`
  - `nextCursor: null` (reserved)
- Stats response includes:
  - `totalEvents`
  - `oldestTimestamp`
  - `newestTimestamp`

## Incident: Corruption metric > 0

Note: explicit corruption metric accessor is delivered in merged PR #515.  
Malformed lines are skipped and counted for operator visibility.

### Steps
1. Confirm scope
   - Verify whether data loss is user-visible (missing trace events) or only parser noise.
2. Capture stats snapshot
   - Query `GET /pilot/traces/stats` and record `totalEvents`, `oldestTimestamp`, `newestTimestamp`.
3. Preserve evidence
   - Copy current trace file before maintenance action.
4. Run retention prune in maintenance window
   - Use existing service prune path; verify event count and timestamp bounds post-prune.
5. Re-check query invariants
   - Parcel-bounded query with tool filter should not leak cross-parcel existence.
6. Escalate
   - If corruption count rises or stats regress unexpectedly, raise incident and hold further feature rollout.

## Validate Retention Is Working
1. Capture pre-prune stats.
2. Execute prune for configured retention window.
3. Capture post-prune stats.
4. Verify:
   - `oldestTimestamp` moves forward (or remains null for empty store).
   - `newestTimestamp` remains recent.
   - `totalEvents` decreases only by expired records.
5. Confirm trace list default behavior:
   - With no `from`/`to`, list uses last 30 days window.

## Access-Audit Checks
- For every `GET /pilot/traces` call:
  - expect `trace_accessed` audit event.
- If events were filtered:
  - expect `permission_denied` event with filtered-count summary.
- For unauthorized `GET /pilot/traces/stats`:
  - expect `403 ACCESS_DENIED` and `permission_denied` audit event.

## Anti-Recursion Guard
- Access-audit events for trace list intentionally omit `parcelId` in context.
- This keeps audit records out of parcel-scoped feeds and avoids recursive audit-noise loops.
