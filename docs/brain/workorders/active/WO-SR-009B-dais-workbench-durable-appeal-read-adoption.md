# WO-SR-009B - Dais Workbench Durable Appeal Read Adoption

## Status

`COMPLETE / AUTHORITY CONSUMED`

## Authority

- Decision: `OWNER-SR-009B-R3-DAIS-WORKBENCH-APPEAL-READ-20260805`
- Issue: `#1417`
- Sovereign base: `32eff1281326019217341a326dba787437dea270`
- Dais evidence head: `29a34b0feeab32984a4dedf1af853239993b4a26`
- Merge mode: bounded Mode B
- Activation PR: `#1418`, merge `46e55b5ccd17a0c9bdbceee2d80ba091777d5365`
- Implementation PR: `#1419`
- Exact assured implementation head: `11bc49507a6e57925414d142a21f203bb8c3c811`
- Implementation merge: `8b5fe0965c0f51008d47e6ff1e0133e94a417667`

## Objective

Make the existing county-scoped frozen Dais appeal-workflow read reachable through the real API and
`LiveDataProvider` in the canonical Property Workbench. Prove authenticated same-county success,
cross-county non-disclosure, and honest loading, empty, error, and loaded UI states with disposable
synthetic data.

## Exact Scope

The exact product, test, governance, and evidence allowlists are recorded in Issue #1417 and the
canonical owner decision register. No other file or repository is authorized.

## Non-Claims

This Work Order does not authorize appeal writes, service/entity/persistence/schema changes,
standalone Dais runtime adoption, live county/PACS/SQL access, credentials, deployment, production,
cutover, other-suite adoption, or Workbench routing/tab/navigation changes.

## Required Proof

- Existing frozen adapter proof remains green.
- Exact frozen-contract endpoint and provider mapping pass focused tests.
- Same-parcel cross-county appeal evidence is not disclosed.
- PropertyDais renders honest loading, empty, error, loaded, and provenance states.
- The disposable authenticated Workbench journey renders one synthetic appeal.
- Backend and frontend builds pass; required governance and remote gates pass.
- Exact-head assurance passes with zero unresolved substantive threads.

## Completion

- The dedicated endpoint applies the existing county-access boundary, reads by parcel through the
  existing service, and serializes only the frozen adapter result.
- `LiveDataProvider` derives county identity from authenticated claims, validates the frozen schema,
  preserves correlation evidence, and fails closed on invalid or unavailable responses.
- `PropertyDais` exposes honest loading, unavailable, error, empty, loaded, and provenance states for
  the active parcel without changing Workbench routing, tab identity, navigation, or structure.
- Focused backend tests, frontend tests and type-check, the Release build with warnings as errors,
  disposable SQLite proof, and the authenticated Playwright Workbench journey passed.
- PR #1419 completed 54 remote checks successfully with 9 neutral/skipped checks, no failures, zero
  unresolved substantive threads, and exact-head assurance at the recorded implementation head.
- The bounded R3 authority is completed and consumed by this terminal governance closeout.

## Rollback

Revert PR #1419 and this closeout. The pre-existing raw CRUD endpoint and the legacy Workbench data
path remain otherwise unchanged; no schema, persistence, live-data, deployment, or cutover state
requires reversal.

## Terminal Condition

`DAIS_COUNTY_SCOPED_APPEAL_READ_REACHABLE_IN_WORKBENCH_NO_WRITE_OR_LIVE_DATA`
