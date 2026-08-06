# WO-SR-009A Evidence - Authenticated County-Governed Parcel Journey

## Evidence state

`COMPLETE - AUTHORITY CONSUMED`. Local proof, remote checks, exact-head assurance, governed merge,
and post-merge verification are complete.

## Authority and provenance

| Field | Value |
| --- | --- |
| Decision | `OWNER-SR-009A-R3-AUTHENTICATED-PARCEL-JOURNEY-20260805` |
| Sovereign base | `f71cdffb66305c4af1abb5193586aa60818e3969` |
| Decision packet | Issue #1413, corrected on 2026-08-05 |
| Data class | Synthetic, local, disposable |
| Protected-resource authority | None |

## Implementation evidence

- CAMA lookup binds `CountyId` and parcel identifier.
- Legacy GIS legal-description lookup does not run because the table cannot prove county ownership.
- Duplicate parcel identifiers return only the authenticated county's CAMA evidence.
- Missing/invalid identity, missing permission, county mismatch, and unknown parcel fail closed.
- The Workbench journey uses a disposable `.tmp` SQLite database and an ephemeral Development token
  held only in Playwright's isolated browser profile.
- Summary, Forge, Atlas, Dais, Dossier, and Pilot settle without a live/canonical cutover claim.
- The browser evidence records twelve out-of-scope Forge API failures rather than hiding them; the
  authenticated auth/property acquisition path returned no 5xx response.

## Validation ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused controller security tests | PASS | `8` passed, `0` failed |
| Focused county-isolation integration tests | PASS | `10` passed, `0` failed; includes real-service disposable SQLite bootstrap |
| Backend build, zero warnings/errors | PASS | `dotnet build backend/TerraFusion.sln -c Release --no-restore /warnaserror`: `0` warnings, `0` errors |
| Local Workbench browser journey | PASS | `1` passed; Summary, Forge, Atlas, Dais, Dossier, and Pilot settled |
| Disposable database removed | PASS | Post-run `.tmp/workbench-smoke/*.db` count: `0` |
| External/protected resource access | PASS | SQLite-only process configuration; Harris and legacy ArcGIS sync disabled; no external credentials or protected data used |
| JSON, query, planner, diff, secret scan | PASS | JSON/query pass; `41` query/planner tests pass; diff and prohibited secret-pattern scan pass |
| Core governance gates | PASS | TypeScript core boundary passes; Phase 8.3 tools `56` passed, `0` failed |
| Strict pre-push validation | PASS | `164` unit tests passed; Snyk, performance, coordination, compliance, and backend publish checks passed |
| Remote checks and review threads | PASS | PR #1415; all required checks green/acceptable; `5` substantive threads resolved; `0` unresolved |
| Independent exact-head assurance | PASS | Exact head `0423615c82840978673916831de788f61766c1b7`; exact 15-file scope |
| Governed merge | PASS | PR #1415 squash-merged as `b934cf0c02ab7e6b5eb20e122f290e9adb665f83` |
| Post-merge verification | PASS | `origin/main` equals `b934cf0c02ab7e6b5eb20e122f290e9adb665f83`; implementation and evidence files present |

## Rollback

Revert the bounded implementation PR. The prior controller query behavior and smoke configuration
return from Git history; the disposable database and ignored evidence directory are removed. No
production, county, PACS, SQL, deployment, schema, or suite-repository state exists to roll back.

## Non-claims

This Work Order does not prove live county readiness, production deployment, protected-data access,
Forge cutover, Atlas adoption, Dais writes, GPT provider adoption, TerraPilot promotion, or Sync
connectivity.

## Terminal condition

`AUTHENTICATED_COUNTY_GOVERNED_SYNTHETIC_PARCEL_JOURNEY_PROVEN_NO_LIVE_DATA_OR_CUTOVER`

`PASS`
