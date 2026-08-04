# WO-SR-008E - Forge Canonical Kernel Consumer Boundary Preparation Evidence

## Result

`FORGE_CANONICAL_KERNEL_CONSUMER_DECOMPOSITION_REQUIRED`

The canonical Forge valuation kernel is locally staged, hash verified, registered, and callable by
the sovereign backend. The Property Workbench does not consume that path. Its current Forge tab uses
the broader database-backed `IValuationService` contract. A direct route switch would cross unresolved
county-identity, input-derivation, response-translation, failure-honesty, trace, and process-host
boundaries.

## Scope and method

- Base: `73c2d8afbddb3c77e36abf3d920b1ef3eab249af` (PR #1398).
- Three independent read-only lanes inspected the Workbench consumer, sovereign kernel integration,
  and WO-SR-006 ownership/rollback evidence.
- No product, runtime, test, workflow, Forge-repository, package, deployment, data, credential, or
  protected-resource state changed.

## Current Workbench contract

| Concern | Current truth | Evidence |
| --- | --- | --- |
| Request | `GET /api/forge/{parcelId}/{approach}?taxYear={year}`; approach reads do not retry | `frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts:165-181` |
| Approaches | Cost, sales, income, and reconciliation are separate rich DTOs | `frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts:16-153` |
| Backend | `ForgeController` delegates reads to DB-backed `IValuationService` | `backend/src/TerraFusion.API/Controllers/ForgeController.cs:21-121` |
| Authentication | Global fallback policy authenticates the request, but reads have no Forge-specific permission or local county guard | `backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs:131-147`; `ForgeController.cs:21-121` |
| County isolation | Valuation predicates use parcel ID and tax year without county ID | `backend/src/TerraFusion.API/Services/ValuationService.cs:33-72` |
| Missing parcel | HTTP 200 can contain zero-valued `Source = "stub"` data | `backend/src/TerraFusion.API/Services/ValuationService.cs:643-674` |
| UI honesty | Any truthy JSON response is classified as live without inspecting `source` | `frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts:191-208` |
| Correlation/timeout | Direct reads add no correlation header, timeout, or abort signal | `frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts:165-170` |

The current API is therefore not a thin kernel facade. It includes parcel/year discovery, detailed
characteristics, comparable sales, income facts, reconciliation, and assessor-governed writes.

## Canonical kernel contract

| Concern | Canonical truth | Evidence |
| --- | --- | --- |
| Endpoint | Authenticated `POST /api/Valuation/kernel-cost-approach` | `backend/src/TerraFusion.API/Controllers/ValuationController.cs:109-137` |
| Input | Explicit parcel ID, square footage, quality, condition, base rate, modifiers, land value, and factors; no county ID or tax year | `backend/src/TerraFusion.Core/DTOs/Kernel/KernelCostApproachRequest.cs:7-16` |
| Output | Cost totals plus source/input/binary hashes, audit IDs, and durations | `backend/src/TerraFusion.Core/DTOs/Kernel/KernelCostApproachResponse.cs:3-27` |
| Registration | Process host, client, and composite kernel valuation service are registered separately from `IValuationService` | `backend/src/TerraFusion.API/Program.cs:1598-1608` |
| Provenance | Exact Forge commit, source hashes, manifest, filename, and executable hash fail closed | `backend/src/TerraFusion.API/Services/Valuation/RustKernelProcessHost.cs:18-31,60-94,215-302` |
| Process failure | Missing executable, provenance mismatch, timeout, non-zero exit, invalid JSON, and kernel errors are typed failures | `backend/src/TerraFusion.API/Services/Valuation/RustKernelProcessHost.cs:52-208` |
| HTTP failure | Kernel service failures become HTTP 502 | `backend/src/TerraFusion.API/Controllers/ValuationController.cs:117-136` |

Forge owns the canonical `terraforge.kernel.valuation` source at commit
`24059c3642339f36877cb454ca63683180915b71`; the sovereign OS remains runtime consumer and
integration owner (`PATH_CANON_REGISTER.md:24-40`). WO-SR-006 proved local staging, provenance,
rollback, and duplicate-source retirement, but explicitly granted no successor consumer authority
(`WO-SR-006-FORGE-CANONICAL-RUNTIME-OWNERSHIP-CUTOVER.md:27-92`).

## Compatibility and translation matrix

| Boundary | Compatibility | Required proof before implementation |
| --- | --- | --- |
| Parcel identity | Partial | Bind authenticated county, parcel ID, and tax year to one canonical fact snapshot; reject mismatch or ambiguity |
| Kernel input | Missing | Define a pure deterministic projection from explicit canonical facts to `KernelCostApproachRequest`; no persistence inside the projection |
| Cost output | Partial | Map kernel totals and provenance into only the cost portion of `CostApproachResult`; define every unmapped field and source label |
| Sales/income/reconciliation | Incompatible | Remain on current DB services; the valuation kernel does not provide these contracts |
| Failure policy | Incompatible | Preserve typed kernel failure without silently returning DB or stub output as kernel success |
| County authorization | Missing | Require permission and county assertion before facts are projected; the kernel request alone is insufficient |
| Trace/correlation | Missing | Carry HTTP correlation through projection/invocation and define the TerraTrace event without query/content leakage |
| Timeout/cancellation | Partial | Distinguish caller cancellation from kernel deadline; preserve the five-second bound |
| Host bounds | Incomplete | Bound stdout/stderr and child environment; record the existing lack of a mechanical network sandbox |
| Rollback | Proven at runtime selection | Keep the current DB-backed Workbench response authoritative until a later shadow proof passes; route switch is a separate gate |

## Exact missing proof

1. A county-bound, tax-year-bound canonical input snapshot and pure projection contract.
2. A field-by-field kernel-to-Workbench cost response mapping with explicit nonclaims.
3. A fail-closed source/fallback vocabulary that cannot label `stub` or DB fallback as kernel success.
4. Correlation, TerraTrace, cancellation, output-bound, environment, and network-posture requirements.
5. A staged later sequence that proves projection first, host constraints second, and shadow comparison
   before any Workbench consumer switch.

## Verdict and successor

Direct implementation is not ready. `WO-SR-008F - Forge Kernel Cost Input and Identity Contract
Preparation` is the smallest dependency-cleared R2 successor. It remains docs/evidence-only and must
return an exact later R3 sequence or `NO_GO`; it does not authorize implementation.

## Rollback and nonclaims

Revert only this evidence and routing update. This Work Order does not prove live parcel readiness,
county isolation of the current read endpoints, binary reproducibility, Workbench kernel consumption,
runtime switching, production safety, or cutover.
