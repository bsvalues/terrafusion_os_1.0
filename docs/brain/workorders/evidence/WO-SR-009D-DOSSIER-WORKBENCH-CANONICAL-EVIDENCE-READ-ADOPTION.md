# WO-SR-009D Evidence - Dossier Workbench Canonical Evidence Read Adoption

## Current State

Implementation is active from sovereign base `6622ca14e93d6a853c9629308e37a42620c0e08f` under Issue #1426
and decision `OWNER-SR-009D-R3-DOSSIER-WORKBENCH-CANONICAL-EVIDENCE-READ-20260807`.

## Boundary Implemented

- The new route reads only `DossierEvidenceItems` filtered by the authenticated county and exact parcel.
- The route uses a strict canonical `countyId` claim and never invokes the Development Benton fallback.
- Source rows are ordered by `CreatedAt` descending and `Id` ascending before pagination.
- The unchanged frozen `DossierEvidenceRegistryReadAdapter` remains the only public-contract mapper.
- The Workbench renders the frozen metadata in a separate canonical panel and leaves the legacy mixed
  evidence index explicitly non-canonical.
- A stale response cannot replace the active parcel's canonical state.

## Validation Matrix

| Proof | Required result | Current result |
|---|---|---|
| Strict authentication/county/permission/selectors | Fail closed | PASS - exact-route 401/403 integration proof plus focused controller proof |
| Same-county, foreign-only, absent, ordering, pagination, trace | Pass | PASS - valid inbound trace propagates; missing or invalid trace is omitted |
| Frozen-adapter rejection, UTC, vocabulary, duplicates | Fail closed | PASS - 49/49 focused adapter/controller tests, including exact SQLite instant preservation and unspecified timestamp rejection |
| Property Dossier loading/loaded/empty/error/stale navigation | Pass | PASS - 24/24 focused frontend tests |
| Disposable authenticated SQLite journey | Pass, no residue | PASS - Playwright 1/1; disposable database removed |
| Backend Release build | 0 warnings, 0 errors | PASS - 0 warnings, 0 errors with `/warnaserror` |
| Frontend TypeScript | Pass | PASS - `tsc --noEmit` |
| Frozen contract hashes | Unchanged | PASS - DTO and adapter Git blobs match base |
| JSON, Work Order query/planner, diff, exact scope | Pass | PASS - query plus 46/46 tooling tests; exact 17 paths |
| Remote checks, exact-head assurance, review threads | Green, pass, zero | Pending delivery |

The disposable proof exposed and closed two local-only fixture/provider gaps without weakening the
contract: synthetic county parents now satisfy the real Dossier foreign key, and SQLite's demonstrated
Local materialization of a stored UTC timestamp is converted back to the exact UTC instant before the
unchanged frozen adapter validates it. Other non-UTC representations remain fail-closed. The broader
historical smoke still depends on the previously proven exact Atlas local
process-host environment; the dedicated Dossier journey isolates this Work Order's terminal proof.

## Safety Posture

No evidence write, custody mutation, schema/migration change, provider/persistence change, runtime
cutover, live data, county/PACS/SQL access, credential, secret, deployment, publication, or production
resource is authorized or used.

## Rollback

Revert the bounded implementation PR. The prior ad hoc document/evidence search surfaces remain
unchanged, and no schema, data, route identity, tab identity, or custody state requires rollback.

## Terminal Evidence

The implementation and merge SHAs, final validation results, authority consumption, and portfolio
reconciliation state will be recorded by the governance-only closeout after the product PR merges.
