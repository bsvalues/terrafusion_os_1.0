# WO-WAL-004D — Authenticated County Authority Binding

| Field | Value |
| --- | --- |
| Status | `IMPLEMENTED_PENDING_PROTECTED_MERGE` |
| Parent | `WO-WAL-004` |
| Program | Washington Assessor Launch V1 |
| Base | `f21cfa6f61db0bac7d5da643c948991a14f459fd` |
| Risk | R5 local authority-boundary contract |
| Contract | `wal.authenticated-county-authority-binding.v1` |
| Environment | `local-auth-context-resolver-fixture-only` |
| Terminal condition | `AUTHENTICATED_CONTEXT_CANONICAL_COUNTY_BINDING_FAIL_CLOSED_PROVEN` |

## Objective

Prove one narrow county-authority step: snapshot the current authenticated actor and county claim,
resolve that claim and one requested target through the canonical persisted-county resolver, and bind
only exact persisted GUID equality. The target is a resource selector, never an authority source.

## Exact reservation

Only these repository-relative paths may change:

- `docs/brain/workorders/active/WO-WAL-004D-authenticated-county-authority-binding.md`
- `backend/src/TerraFusion.Core/Counties/AuthenticatedCountyAuthorityBinding.cs`
- `backend/tests/TerraFusion.Unit.Tests/Counties/AuthenticatedCountyAuthorityBindingTests.cs`

## Contract

- `IRequestUserContextAccessor.Current` is read exactly once after pre-cancellation is observed.
- `IsAuthenticated`, `UserId`, and `CountyId` are copied to locals before the first asynchronous
  resolution; roles are neither enumerated nor retained and grant nothing.
- Anonymous, missing, blank, malformed, unknown, and cross-county inputs all return the same
  data-free denied result.
- Authority claim and target are resolved independently through `ICountyResolver.TryResolveAsync`
  with the caller's cancellation token. A missing claim stops before target resolution.
- Success requires two non-null persisted county GUIDs with exact equality. No alias, route, body,
  header, display name, or Benton/default fallback can substitute for that equality.
- Resolver exceptions and cancellation propagate. There is no retry, fallback, secondary resolver,
  persistence, or integration side effect.
- A successful binding is necessary county-scope evidence only. It does not authenticate a token,
  grant a role or capability, authorize a resource operation, activate a county data mode, adopt
  data, or prove any protected-data access.

## Explicitly out of scope

- token/JWT validation or identity-provider integration;
- role, capability, public/private, activation, adoption, or resource-policy decisions;
- controllers, middleware, routing, dependency-injection registration, UI, audit persistence, or
  database mutation;
- live identity providers, credentials, protected county data, production, or external systems;
- authority derived from request selectors or any implicit/default county.

## Validation

```powershell
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter FullyQualifiedName~AuthenticatedCountyAuthorityBindingTests
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~CountyDataAuthorityBoundaryTests|FullyQualifiedName~CountyDataActivationPrerequisiteTests"
git diff --check
git status --short
```

Focused evidence covers same-GUID aliases, GUID/alias binding, cross-county and unknown denial,
hostile null or changing context, exactly one context read, no resolution for structurally invalid
inputs, no target resolution after an unknown claim, cancellation before and between resolutions,
resolver exception/cancellation propagation, ignored roles, immutable data-free refusal, exact Core
dependencies, and absence of grant/integration operations.

## Completion boundary

Completion requires the exact reviewed implementation head to reach protected `main` through a PR
with every required check green and no unresolved review thread. Even then only this binding child
is complete. `WO-WAL-004` remains open for trust/activation integration and adversarial cross-surface
isolation; `WO-WAL-005` and `WO-WAL-006` remain blocked on stable completed parent contracts.
