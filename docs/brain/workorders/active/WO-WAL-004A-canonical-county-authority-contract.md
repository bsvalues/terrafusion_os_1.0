# WO-WAL-004A — Canonical Washington County Authority Contract

| Field | Value |
| --- | --- |
| Status | `ACTIVE` |
| Program | Washington Assessor Launch V1 |
| Goal | `GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Loop | `LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Parent | `WO-WAL-004` |
| Authority | Issue #1485 via `OWNER-WAL-V1-MISSION-AUTHORITY-20260827` |
| Risk | R5 bounded county identity and authenticated-claim authority |
| Merge mode | Protected PR with required checks and zero unresolved review threads |
| Terminal condition | `CANONICAL_39_COUNTY_IDENTITY_AND_CONFLICTING_CLAIM_DENIAL_PROVEN` |

## Objective

Create the first shared fail-closed county-authority primitive for WAL. Define exactly 39 canonical
Washington county identities and resolve their stable key, slug, FIPS and accepted aliases to the
existing persisted county GUID. Harden authenticated request context so conflicting county claims
cannot be silently selected by claim order.

## Contract Reservations

- `wal.county-identity.v1`
- `wal.county-authority.v1`

No other WAL child may redefine these contracts. Later children may consume or extend them through
an explicitly reserved versioned contract.

## Exact Path Reservations

- `docs/brain/workorders/active/WO-WAL-004A-canonical-county-authority-contract.md`
- `backend/src/TerraFusion.Core/Counties/WashingtonCountyRegistry.cs`
- `backend/src/TerraFusion.API/Services/CountyResolver.cs`
- `backend/src/TerraFusion.API/Auth/HttpContextRequestUserContextAccessor.cs`
- `backend/TerraFusion.API.Tests/CountyResolverTests.cs`
- `backend/TerraFusion.API.Tests/Auth/HttpContextRequestUserContextAccessorTests.cs`

## Environment Reservation

`wal004a-local-in-memory` is reserved for deterministic unit and API-component tests only. It
contains synthetic county rows and claims. No network, live identity provider, database migration,
county system, credential, secret, production resource or external assessor interaction is allowed.

## Completion Contract

1. The registry contains exactly the 39 Washington counties with unique key, slug, name and
   five-digit FIPS values.
2. Key, slug, name, `<name> county`, full FIPS and Washington three-digit county code resolve to
   one canonical identity; unknown input returns no identity and no default.
3. The database resolver maps canonical identities to existing persisted GUIDs through matching
   Washington FIPS or canonical name. It never fabricates a GUID.
4. Duplicate or conflicting persisted identity rows are excluded from resolution instead of being
   selected by ordering.
5. A known, unambiguous Washington persisted GUID remains accepted; an unknown, non-Washington,
   conflicting or duplicate-identity GUID fails closed.
6. Authenticated request context canonicalizes equivalent Washington aliases, accepts one normalized
   county claim (including repeated equal values) and returns no county authority when `countyId`,
   `county_id` or `countyCode` claims conflict.
7. Focused tests prove all 39 identities, alias behavior, no Benton fallback, ambiguity denial,
   claim conflict denial and deterministic case-insensitive normalization.

## Denials

- no database schema, migration, seed-data or production-data mutation;
- no controller, route, upload, Sync, canonical-row, TerraForge or Workbench integration;
- no frontend header or local-storage authority;
- no public/private trust-mode or activation-state implementation;
- no adoption, write-back, source-system DML/DDL or external call;
- no default county, including Benton, for missing, unknown or ambiguous input.

## Validation

- focused `TerraFusion.API.Tests` tests for county registry, resolver and request-user context;
- `dotnet build` for the affected API test graph when the local SDK/dependency cache permits it;
- `git diff --check` and exact-path review;
- protected remote checks, exact-head review and zero unresolved substantive threads.

## Rollback

Revert this exact child PR. No persisted schema or external state is introduced, so rollback removes
the registry and restores the prior resolver/claim extraction behavior without data repair.
