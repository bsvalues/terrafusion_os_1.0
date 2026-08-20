# WO-SR-009D Evidence - Dossier Workbench Canonical Evidence Read Adoption

## Current State

Implementation completed from sovereign base `6622ca14e93d6a853c9629308e37a42620c0e08f` under Issue #1426 and decision `OWNER-SR-009D-R3-DOSSIER-WORKBENCH-CANONICAL-EVIDENCE-READ-20260807`. PR #1427 exact assured head `85818a749d4268f84cf8638d991d9cef657a0d19` merged as `c7f2d78619a9eb19186c2c724876fb4d11c81b00`; current main `ffd2fa35f5152de2b95e7f63b220050d18193d7a` contains the merge.

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
| Property Dossier loading/loaded/empty/error/stale navigation, pagination, and correlation UX | Pass | PASS - 26/26 focused frontend tests |
| Disposable authenticated SQLite journey | Pass, no tracked residue | PASS - Playwright 1/1; database isolated under ignored `.tmp` state |
| Backend Release build | 0 warnings, 0 errors | PASS - 0 warnings, 0 errors with `/warnaserror` |
| Frontend TypeScript | Pass | PASS - `tsc --noEmit` |
| Frozen contract hashes | Unchanged | PASS - DTO and adapter Git blobs match base |
| JSON, Work Order query/planner, diff, exact scope | Pass | PASS - query plus 46/46 tooling tests; exact 17 paths |
| Remote checks, exact-head assurance, review threads | Green, pass, zero | PASS - 19/19 recorded workflow runs successful; 10/10 substantive threads resolved; exact assured head merged |

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

PR #1427 delivered exact assured head `85818a749d4268f84cf8638d991d9cef657a0d19` and merged as `c7f2d78619a9eb19186c2c724876fb4d11c81b00`. All recorded workflow runs succeeded, all substantive review threads are resolved, and post-merge main `ffd2fa35f5152de2b95e7f63b220050d18193d7a` contains the implementation. The terminal condition is satisfied. Authority is completed and consumed, all execution flags are false, and the Five-Suite program returns to portfolio reconciliation with no successor inferred.
