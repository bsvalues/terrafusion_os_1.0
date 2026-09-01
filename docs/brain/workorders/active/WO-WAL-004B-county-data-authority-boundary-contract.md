# WO-WAL-004B — County Data Mode and Authority Boundary Contract

| Field | Value |
| --- | --- |
| Status | `PROTECTED_COMPLETE` |
| Program | Washington Assessor Launch V1 |
| Goal | `GOAL-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Loop | `LOOP-WASHINGTON-ASSESSOR-LAUNCH-V1` |
| Parent | `WO-WAL-004` |
| Dependencies | Protected-complete `WO-WAL-000B` and `WO-WAL-004A` |
| Authority | Issue #1485 via `OWNER-WAL-V1-MISSION-AUTHORITY-20260827` |
| Risk | R5 bounded county data-mode and same-county authority boundary |
| Merge mode | Protected PR with required checks and zero unresolved review threads |
| Terminal condition | `COUNTY_DATA_MODE_VISIBILITY_AND_SAME_COUNTY_AUTHORITY_BOUNDARY_PROVEN` |

## Objective

Define a pure fail-closed county boundary that keeps launch data mode, data exposure and county
operational authority separate. Explicitly public reads may be anonymous, while protected reads and
all operations require an exact same-county canonical authority. This predicate is a necessary
county-scope gate only; it does not grant roles, capabilities, activation or broader authorization.

## Contract Reservation

`wal.county-data-authority-boundary.v1`

No other WAL child may redefine this contract. Later integration children may consume it only
through separately recorded exact reservations.

## Exact Path Reservations

- `docs/brain/workorders/active/WO-WAL-004B-county-data-authority-boundary-contract.md`
- `backend/src/TerraFusion.Core/Counties/CountyDataAuthorityBoundary.cs`
- `backend/tests/TerraFusion.Unit.Tests/Counties/CountyDataAuthorityBoundaryTests.cs`

## Environment Reservation

`local-memory-authority-predicate-only` is reserved for deterministic pure-object tests. No network,
filesystem, database, identity provider, credential, secret, county system, live/protected data or
production resource is allowed.

## Completion Contract

1. Launch data mode is limited to `PUBLIC`, `COUNTY_PROVIDED` and `CONNECTED`; unspecified or unknown
   values fail closed. `OFFICIAL_TERRAFUSION_ADOPTION` is not representable by this contract.
2. Data exposure is independently explicit as `PUBLIC` or `PROTECTED`; data mode never implies
   exposure, activation, capability or privilege.
3. Action is independently explicit as `READ` or `OPERATE`; unknown values fail closed.
4. Every decision requires a canonical resource county expressed as the `WashingtonCountyIdentity`
   type from `wal.county-identity.v1` and exactly matching the canonical 39-county registry.
5. Explicitly public reads may proceed anonymously or with matching canonical county context, but
   never create operational authority. A present mismatched authority fails closed rather than
   being ignored as stale context.
6. Protected reads and all operations require a present canonical authority county exactly equal to
   the resource county. Missing, malformed or mismatched authority fails closed.
7. Every denial returns the same data-free `Denied` value. It discloses no county, mismatch, target,
   existence, count or reason detail.
8. Exhaustive matrix tests cover every supported mode/exposure/action combination with anonymous,
   same-county and other-county authority, plus malformed identity and unknown-enum cases.

## Denials

- no raw claim, alias, header, route, request-body, session, selector or UI value as authority;
- no controller, endpoint, middleware, DI, frontend or product-surface integration;
- no persistence, schema, migration, cache, activation transition or evidence inference;
- no role, capability, adoption, write-back or general authorization grant;
- no external system, network, credential, live identity or protected county data;
- no default county, including Benton, for absent or malformed identity.

## Validation

- `dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter FullyQualifiedName~CountyDataAuthorityBoundaryTests`;
- `git diff --check`;
- exact three-path changed-file audit;
- protected remote checks and independent exact-head review.

## Rollback

Revert this exact child commit. The contract is pure and introduces no registration, persisted state
or external side effect, so no data repair or environment cleanup is required.

## Protected completion and continuation

This child reached protected main in PR #1496 as merge
`4fde39015c71fea20193207bfb7bf8878f870e0e` from exact integrated head
`e2dd95338f54a18f1aa6986699fc0a4c0699229e`. `WO-WAL-004C` separately owns the next data-free
activation-prerequisite contract. The broad `WO-WAL-004` parent remains open; no activation,
official adoption, identity-provider integration, persistence, protected-data access, or production
authority is implied by this completion.
