# R1 Week 4 Backend Validation Suite (CX-15)

Date: 2026-03-04 (America/Los_Angeles)  
Branch: `codex/r1-week4-cx15-validation-suite`

## Scope

Single contract-level validation suite for R1 backend endpoints:

- CostForge (`POST /api/costforge/calculate`)
- Levy (`POST /api/levy-calculation/calculate-rate`, `POST /api/levy-calculation/calculate-batch`)
- Atlas (`GET /api/atlas/parcels/{parcelId}/layers`, county-context rejection)
- Dossier (`POST/GET notes`, `GET casefile`)

Implementation file:

- `backend/tests/TerraFusion.Unit.Tests/R1Week4/R1Week4Cx15BackendValidationSuiteTests.cs`

## Test Matrix

| Test | Endpoint/Behavior | Expected Result |
|---|---|---|
| `CostForge_ByParcelNumber_SameCounty_ReturnsOkAndInvokesService` | CostForge same-county parcel-number path | `200 OK`, service invoked once |
| `CostForge_ByParcelNumber_CrossCounty_ReturnsNotFound` | CostForge cross-county parcel lookup | `404 NotFound`, service not invoked |
| `Levy_Batch_AnyCrossCountyItem_ReturnsForbid` | Levy batch contains cross-county item | `403 Forbid` |
| `Atlas_Layers_SameCounty_ReturnsExpectedContractShape` | Atlas layers contract shape | `200 OK`, expected layer ids/availability |
| `Atlas_MissingCountyClaims_ReturnsForbid` | Atlas without county context claims | `403 Forbid` |
| `Dossier_CreateThenGetNotesAndCasefile_ReturnsPersistedData` | Dossier create/get/casefile same-county flow | `201 Created`, `200 OK`, persisted note visible |
| `Dossier_CrossCountyGetNotes_ReturnsEmptySet` | Dossier notes cross-county isolation | `200 OK`, empty notes list |
| `Dossier_InvalidParcelId_ReturnsBadRequest` | Dossier parcel id guardrail | `400 BadRequest` |

## Gate Commands and Results

Lane-filter command (CX-15):

```bash
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~R1Week4Cx15BackendValidationSuiteTests" -nologo -v minimal
```

Result:

- Passed: `8`
- Failed: `0`
- Skipped: `0`

Week 4 aggregate sanity command:

```bash
dotnet test backend/tests/TerraFusion.Unit.Tests/TerraFusion.Unit.Tests.csproj --filter "FullyQualifiedName~R1Week4" -nologo -v minimal
```

Result:

- Passed: `15`
- Failed: `0`
- Skipped: `0`

## Notes

- This suite validates controller-level contract/isolation behavior.
- `401 Unauthorized` middleware behavior is covered by API auth configuration, not direct controller invocation in this unit suite.
