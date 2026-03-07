# R1 Week 4 CX-16 HTTP Authorization Gate Validation (TestAuth Harness)

Date: 2026-03-04 (America/Los_Angeles)  
Branch: `codex/r1-week4-cx16-auth-pipeline`

## Scope

HTTP-level authorization and county-isolation validation for R1 endpoints using `WebApplicationFactory<TerraFusion.API.Program>` and real HTTP requests.

Implementation file:

- `backend/tests/TerraFusion.Unit.Tests/R1Week4/R1Week4Cx16AuthPipelineIntegrationTests.cs`

## Harness Boundary (Explicit)

- This lane uses a deterministic test auth scheme (`TestAuth`) and overrides default auth/challenge schemes in the test host.
- This lane validates endpoint protection, policy gating, routing, and county-isolation status behavior under that deterministic harness.
- This lane does **not** validate production JWT bearer token validation/signing configuration.
- CostForge service dependencies are stubbed in test host DI to keep assertions focused on HTTP gate + controller isolation behavior.

## Harness Assumptions

- Test host: `WebApplicationFactory<TerraFusion.API.Program>`.
- Unauthenticated cases omit `Authorization` header entirely.
- Authenticated claims emitted by test handler:
  - `sub`, `userId`, `countyId` (GUID), `countyCode`, `role`
- Authorization policies for `RequiresPermission_*` in this lane are mapped to authenticated-user policy to keep this lane deterministic and focused on gate/isolation invariants.
- Data store: EF Core InMemory override with unique per-run DB name (`cx16-auth-gate-<guid>`), plus seed-once fixture setup.

## Matrix and Results

| ID | Invariant | Expected | Result |
|---|---|---|---|
| 1 | `POST /api/costforge/calculate` unauthenticated | `401` | Pass |
| 2 | `POST /api/levy-calculation/calculate-rate` unauthenticated | `401` | Pass |
| 3 | `GET /api/atlas/parcels/{parcelId}` unauthenticated | `401` | Pass |
| 4 | `POST /api/dossier/{parcelId}/notes` unauthenticated | `401` | Pass |
| 5 | CostForge same-county (parcel-number path) authenticated | `200` | Pass |
| 6a | CostForge county token mismatched vs claims | `403` | Pass |
| 6b | CostForge county token matches claims but parcel in other county | `404` | Pass |
| 7 | Atlas cross-county parcel authenticated | `404` | Pass |
| 8 | Dossier cross-county notes read authenticated | `200` with `total: 0`, `notes: []` | Pass |

## Commands and Output

CX-16 lane filter:

```bash
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~R1Week4Cx16AuthorizationGateIntegrationTests" -nologo -v minimal
```

Result:

- Passed: `9`
- Failed: `0`
- Skipped: `0`

R1 Week4 aggregate sanity:

```bash
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~R1Week4" -nologo -v minimal
```

Result:

- Passed: `24`
- Failed: `0`
- Skipped: `0`
