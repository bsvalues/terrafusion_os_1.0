# WO-WAL-004E — Authenticated Canonical County Context

| Field | Value |
| --- | --- |
| Status | `IMPLEMENTED_VALIDATED_LOCALLY` |
| Parent | `WO-WAL-004` |
| Program | Washington Assessor Launch V1 |
| Base | `984018696738e437c91e5d197899e29e3867a2fd` |
| Risk | R5 local authenticated canonical-context fixture |
| Contract | `wal.authenticated-canonical-county-context.v1` |
| Environment | `local-auth-context-canonical-registry-fixture-only` |
| Terminal condition | `AUTHENTICATED_PERSISTED_GUID_AND_CANONICAL_39_COUNTY_CONTEXT_FAIL_CLOSED_PROVEN` |

## Objective

Consume only one protected `wal.authenticated-county-authority-binding.v1` result and establish an
immutable authenticated canonical county context only when its persisted county GUID is observed
against exactly one entry in the protected canonical 39-county registry. This child adds no county
selector and grants no resource authority.

## Exact reservations

Only these repository-relative paths may change:

- `docs/brain/workorders/active/WO-WAL-004E-authenticated-canonical-county-context.md`
- `backend/src/TerraFusion.Core/Counties/AuthenticatedCanonicalCountyContext.cs`
- `backend/tests/TerraFusion.Unit.Tests/Counties/AuthenticatedCanonicalCountyContextTests.cs`

The environment is a deterministic local auth-context and canonical-registry fixture only. It
reserves no live identity provider, county resource, credential, network, database, protected data,
or production system.

## Contract

1. Accept only the protected 004D binding result. No route, body, header, alias, caller county
   selector, raw request context, role, or capability input is admitted.
2. Observe pre-cancellation, then snapshot the decision, actor identifier, and persisted county GUID
   before the first asynchronous resolver call.
3. Deny with one immutable data-free singleton unless the decision is exactly `Bound`, the actor is
   nonblank, the GUID is non-null and non-empty, and the canonical registry contains exactly 39
   entries.
4. Resolve each of the exact 39 canonical county keys once, sequentially, with the caller's
   cancellation token. Establish a context only when exactly one observed key resolves to the bound
   GUID. Zero or multiple matches deny uniformly.
5. A successful result returns the snapshotted actor and GUID plus the exact identity instance owned
   by `WashingtonCountyRegistry`. Resolver cancellation and exceptions propagate without retry,
   fallback, partial success, or a secondary resolver.

## Proof boundary and denials

- The 004D result is necessary prior evidence; this child does not authenticate a token or re-read
  mutable request context.
- Resolver observations are a bounded local-fixture proof, not a transaction, freshness guarantee,
  persistence snapshot, live county lookup, or authorization grant.
- No role/capability grant, public/private decision, activation, adoption, resource policy,
  controller, middleware, routing, dependency-injection registration, UI, audit persistence,
  database mutation, default county, Benton fallback, protected data, or production integration.
- Completion proves only this child terminal. `WO-WAL-004` remains open, and `WO-WAL-005` and
  `WO-WAL-006` remain blocked on stable completed parent contracts.

## Validation

- every canonical county establishes from one unique matching persisted GUID and returns the exact
  registry identity;
- null, denied, malformed, empty-GUID, unknown-decision, zero-match, and multiple-match bindings
  return the same immutable data-free denial;
- successful and denied valid-binding scans use the exact 39 canonical keys sequentially with the
  caller token and no alias, GUID, selector, retry, or fallback;
- pre-cancellation, cancellation between resolutions, resolver cancellation, and resolver exception
  behavior;
- exact sealed Core-only public surface with only the protected binding result and cancellation
  token as operation inputs;
- focused `AuthenticatedCanonicalCountyContextTests` plus protected 004B/004C/004D compatibility;
- `git diff --check` and exact three-path audit.

## Local validation evidence

The host has no local `dotnet` executable. A disposable cached .NET 8 SDK container ran with
`--network none`, the repository and package cache mounted read-only, and `NuGetAudit=false`:

```powershell
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~AuthenticatedCanonicalCountyContextTests"
# Passed: 11, Failed: 0, Skipped: 0

dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~AuthenticatedCanonicalCountyContextTests|FullyQualifiedName~AuthenticatedCountyAuthorityBindingTests|FullyQualifiedName~CountyDataActivationPrerequisiteTests|FullyQualifiedName~CountyDataAuthorityBoundaryTests"
# Passed: 119, Failed: 0, Skipped: 0
```

The focused proof covers all 39 exact canonical identities, exact registry instance return, exact
key order and caller-token forwarding, invalid/unknown/data-bearing malformed binding refusal,
zero/two-match full scans, immutable singleton denial, cancellation before and between resolutions,
resolver cancellation/exception propagation, and the sealed Core-only surface.

## Completion

Local validation proves only the exact reserved deterministic fixture contract. Canonical completion
requires the reviewed implementation to reach protected main through the governed PR path.
