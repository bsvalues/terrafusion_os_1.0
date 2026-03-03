# Trace Access Audit Mapping

Last updated: 2026-03-03  
Applies to: Pilot trace endpoints and TraceService event taxonomy.

## Event Mapping

### `trace_accessed`
- Meaning: an authorized or attempted trace data access operation occurred.
- Emitted by:
  - `GET /pilot/traces` (list access)
  - `GET /pilot/traces/stats` (stats access)
- Canonical tool IDs:
  - `pilot:traces:list`
  - `pilot:traces:stats`
- Audit class: `access_audit`
- Security value: attribution of who accessed trace data and when.

### `permission_denied`
- Meaning: access was denied or records were filtered by policy.
- Emitted by:
  - `GET /pilot/traces` when events are filtered by county/user access rules
  - `GET /pilot/traces/stats` when caller lacks elevated trace role (`403`)
- Audit class: `policy_enforcement`
- Security value: evidence of active boundary enforcement and attempted violations.

## Ledger / Evidence Taxonomy Mapping
- `trace_accessed` -> `evidence.access.trace.read`
- `permission_denied` -> `evidence.security.access.denied`

## Guard Against Audit-of-Audit Loops
- Current guard: list-access audit events omit `parcelId`.
- Result: parcel-scoped list feeds do not include their own access-audit records.
- Operational requirement: preserve this behavior when extending trace queries; do not add parcel context to list-audit events without an alternate recursion control.

## Security Invariants
1. Cross-county trace visibility is always denied.
2. Non-elevated users only see own events.
3. Elevated roles may see in-county events across users.
4. Tool filter cannot be used to infer event existence on other parcels.
5. Unauthorized stats access returns `403` and is auditable.

## Verification References
- Endpoint behavior: `os-platform/core/api/PilotController.ts`
- Access control logic: `os-platform/core/trace/TraceAccessControl.ts`
- Event type union: `os-platform/core/types/index.ts`
- Contract tests: `os-platform/core/tests/lane-e-trace-authz.test.mjs`

