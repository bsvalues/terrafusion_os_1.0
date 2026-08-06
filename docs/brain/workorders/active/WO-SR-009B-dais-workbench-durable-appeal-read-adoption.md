# WO-SR-009B - Dais Workbench Durable Appeal Read Adoption

## Status

`ACTIVE / OWNER-AUTHORIZED R3`

## Authority

- Decision: `OWNER-SR-009B-R3-DAIS-WORKBENCH-APPEAL-READ-20260805`
- Issue: `#1417`
- Sovereign base: `32eff1281326019217341a326dba787437dea270`
- Dais evidence head: `29a34b0feeab32984a4dedf1af853239993b4a26`
- Merge mode: bounded Mode B

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

## Terminal Condition

`DAIS_COUNTY_SCOPED_APPEAL_READ_REACHABLE_IN_WORKBENCH_NO_WRITE_OR_LIVE_DATA`
