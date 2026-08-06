# WO-SR-009A Evidence - Authenticated County-Governed Parcel Journey

## Evidence state

`IMPLEMENTATION_VALIDATED_AWAITING_REMOTE`. Local proof is complete. PR checks, exact-head
assurance, merge metadata, and post-merge verification remain pending.

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
| Remote checks and review threads | PENDING | GitHub exact-head evidence required |
| Independent exact-head assurance | PENDING | PASS required |

## Rollback

Revert the bounded implementation PR. The prior controller query behavior and smoke configuration
return from Git history; the disposable database and ignored evidence directory are removed. No
production, county, PACS, SQL, deployment, schema, or suite-repository state exists to roll back.

## Non-claims

This Work Order does not prove live county readiness, production deployment, protected-data access,
Forge cutover, Atlas adoption, Dais writes, GPT provider adoption, TerraPilot promotion, or Sync
connectivity.

## Terminal condition

Local proof satisfies the implementation portion of
`AUTHENTICATED_COUNTY_GOVERNED_SYNTHETIC_PARCEL_JOURNEY_PROVEN_NO_LIVE_DATA_OR_CUTOVER`.
The terminal condition is recorded only after governed merge and post-merge verification.
