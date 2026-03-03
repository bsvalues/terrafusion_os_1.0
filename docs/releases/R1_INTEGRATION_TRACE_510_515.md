# R1 Integration Trace Lane Notes (#510-#515)

Last updated: 2026-03-03

## #510 — test: stabilize flaky DesktopIntentContract
This PR stabilized baseline desktop intent tests, removing flake from surface-workbench icon behavior classification. It restored deterministic CI for UI contract tests and prevented false-negative regressions from blocking unrelated trace and governance work.

## #511 — feat(pilot): Lane A — trace list endpoint + parcel-scoped EvidenceRail feed
This PR introduced `GET /pilot/traces` and switched EvidenceRail to parcel-scoped list queries with date filtering and pagination. It established the operational read path for trace lists and removed reliance on single-correlation polling for the main workbench trace feed.

## #512 — harden(trace): stable sort tiebreak + default 30d retention window
This PR hardened list-query determinism and bounded default query cost by adding stable sort (`timestamp DESC`, `correlationId ASC`) and an implicit 30-day window when no date bounds are provided. This removed non-deterministic paging behavior for equal timestamps and reduced unbounded scans.

## #513 — feat(trace): Lane D — Retention Pruning, Parcel Index, Ops Stats
This PR added retention pruning and operability stats (`/pilot/traces/stats`), plus a parcel index optimization in memory store paths. It provided direct operator visibility (`totalEvents`, oldest/newest timestamps) and formalized retention mechanics across in-memory and file store implementations.

## #514 — feat(trace): Lane E — Authorization Audit Trail + Access-Denied Metrics
This PR introduced `trace_accessed` and `permission_denied` audit event types and wired them into list/stats endpoint behavior. It strengthened access telemetry, denial accounting, and parcel-bounded tool filtering guarantees to prevent cross-parcel inference.

## #515 — Lane F: Trace durability — atomic prune, corruption metric, restart correctness
This PR delivered durability hardening: atomic prune rewrite (`.tmp` + rename), malformed-line corruption counting, and restart-correctness test coverage. It closes the R1 trace durability gap and aligns operations with ADR-0015 and the trace-store runbook.

## Security Invariant (Across #511-#515)
- No cross-parcel inference via tool filters in parcel-scoped queries.
- Access-denied and trace-access actions are auditable.
- Stats endpoint remains elevated-role gated with explicit `403` denial behavior.
