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
5. A known, unambiguous persisted county GUID remains accepted only when its row is Washington-scoped
   and both every present nonblank name/FIPS component resolves and those components identify the same
   canonical county.
6. With no GUID claim, authenticated request context requires every nonblank county alias to resolve
   to one canonical Washington county and returns that county's normalized lowercase canonical-name
   alias for compatibility with existing consumers; unknown or conflicting aliases return no county
   authority.
7. With exactly one distinct GUID claim, request context returns its normalized GUID while requiring
   any supplemental non-GUID aliases to be internally canonical and unambiguous. This persistence-free
   accessor does not prove GUID-to-alias equivalence; persisted resolution remains the boundary that
   validates the GUID's county mapping. Multiple distinct GUIDs return no county authority.
8. Focused tests lock the authoritative 39 county name/FIPS pairs and prove alias consistency,
   persisted-row unknown/conflicting-component denial including direct-GUID lookup, issued
   GUID-plus-code handling, and claim ambiguity denial.

## Denials

- no database schema, migration, seed-data or production-data mutation;
- no controller, route, upload, Sync, canonical-row, TerraForge or Workbench integration;
- no frontend header or local-storage authority;
- no public/private trust-mode or activation-state implementation;
- no adoption, write-back, source-system DML/DDL or external call;
- no claim that request-context inspection proves an opaque GUID and a supplemental alias identify
  the same persisted county; downstream persisted resolution must validate the preserved GUID;
- no default county, including Benton, for missing, unknown or ambiguous input.

## Validation

- focused `TerraFusion.API.Tests` tests for county registry, resolver and request-user context;
- `dotnet build` for the affected API test graph when the local SDK/dependency cache permits it;
- `git diff --check` and exact-path review;
- protected remote checks, exact-head review and zero unresolved substantive threads.

## Rollback

Revert this exact child PR. No persisted schema or external state is introduced, so rollback removes
the registry and restores the prior resolver/claim extraction behavior without data repair.
