# WO-WAL-004F — Authenticated Canonical Context Runtime Integration

| Field | Value |
| --- | --- |
| Status | `READY_AFTER_PROTECTED_000G` |
| Parent | `WO-WAL-004` |
| Program | Washington Assessor Launch V1 |
| Risk | R5 authenticated API request-scope integration |
| Contract | `wal.authenticated-canonical-county-runtime-context.v1` |
| Environment | `local-api-auth-context-persisted-guid-fixture-only` |
| Terminal condition | `AUTHENTICATED_CANONICAL_COUNTY_CONTEXT_API_SCOPE_FAIL_CLOSED_PROVEN` |

## Objective

Wire the protected authenticated county binding and canonical 39-county context contracts into the
real API dependency-injection graph. Expose one scoped provider that derives its target only from
the authenticated request context and returns established canonical context or uniform denial.

## Exact reservations

- `docs/brain/workorders/active/WO-WAL-004F-authenticated-canonical-context-runtime-integration.md`
- `backend/src/TerraFusion.Core/Counties/AuthenticatedCountyAuthorityBinding.cs`
- `backend/tests/TerraFusion.Unit.Tests/Counties/AuthenticatedCountyAuthorityBindingTests.cs`
- `backend/src/TerraFusion.API/Auth/AuthenticatedCanonicalCountyContextProvider.cs`
- `backend/src/TerraFusion.API/Program.cs`
- `backend/TerraFusion.API.Tests/Auth/AuthenticatedCanonicalCountyContextProviderTests.cs`

## Contract

1. Add a current-context binding operation that snapshots `IRequestUserContextAccessor.Current`
   once, accepts no route/body/header/selector county input, and resolves only that authenticated
   county identifier.
2. Compose the resulting protected binding with `AuthenticatedCanonicalCountyContext` through one
   scoped API provider.
3. Register the protected binding, canonical context, and provider in the real API service graph.
4. Return the same data-free denial for anonymous, malformed, unknown, ambiguous, missing, or
   non-canonical request county evidence.
5. Preserve all 39 canonical counties, exact persisted GUID agreement, cancellation, and exception
   propagation without retry or fallback.

## Denials

No role/capability grant, controller authorization decision, route/body/header authority, county
selector, default county, Benton fallback, activation, data access, persistence, credential, live
identity-provider integration, protected county data, deployment, or production claim.

## Validation

- focused Core binding tests for all canonical counties, malformed/anonymous evidence, one-snapshot
  behavior, cancellation, and zero-selector surface;
- API provider tests for established and uniform denied context plus scoped DI resolution;
- API and Core compile, exact six-path audit, and `git diff --check`.

## Completion

Completion wires canonical authenticated county identity into the real API request scope only. It
does not complete `WO-WAL-004`, make `WO-WAL-002F` ready, or authorize a protected resource action.
Protected `WO-WAL-000H` must verify this completion before releasing 002F.
