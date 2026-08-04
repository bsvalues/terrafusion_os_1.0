# WO-SR-008F - Forge Kernel Cost Input and Identity Contract Preparation Evidence

## Result

`FORGE_KERNEL_COST_CONTRACT_DECOMPOSITION_REQUIRED`

A pure county-bound kernel projection is architecturally definable, and the process-host hardening
work can be staged. Implementation is not ready because the repository does not yet establish one
canonical rate field, tax-year schedule-selection rule, modifier vocabulary, quality/condition
normalization, land/factor provenance rule, or county/parcel alias-uniqueness rule. Guessing any of
those would change valuation semantics rather than merely adapt the canonical kernel.

## Scope and method

- Base: `b4eed4c13c8e509f613bdce51145a06acd3ae7ca` (PR #1400).
- Three independent read-only lanes inspected identity/input semantics, response/failure semantics,
  and process-host/trace/rollback semantics.
- No product, runtime, test, workflow, Forge-repository, package, configuration, deployment, data,
  credential, or protected-resource state changed.

## Current Workbench cost boundary

| Concern | Current truth | Evidence |
| --- | --- | --- |
| Request identity | Workbench sends parcel ID and tax year; it supplies no explicit county, permission, correlation, timeout, or cancellation contract | `frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts:155-185` |
| Response | Rich cost DTO includes parcel/year, cost/depreciation totals, characteristics, segments, source, confidence, and input labels | `frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts:16-66`; `backend/src/TerraFusion.Core/DTOs/ForgeValuationDtos.cs:10-55` |
| Authentication | Global fallback policy authenticates the request, but the cost read has no Forge-specific permission or local county guard | `backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs:131-147`; `backend/src/TerraFusion.API/Controllers/ForgeController.cs:57-70` |
| County isolation | Property, valuation, CAMA, and segment reads predicate on parcel and sometimes year, but not county | `backend/src/TerraFusion.API/Services/ValuationService.cs:33-61` |
| Missing data | Missing parcels return HTTP 200 with zero-valued `Source = "stub"` | `backend/src/TerraFusion.API/Services/ValuationService.cs:40-44,643-660` |
| UI honesty | Any truthy response becomes `live`, while the shared badge vocabulary already supports `fallback` | `frontend/apps/os-shell/src/hooks/forge/useForgeValuation.ts:191-197`; `frontend/apps/os-shell/src/components/workbench/WorkbenchSourceBadge.tsx:17-33` |

## Canonical kernel boundary

| Concern | Canonical truth | Evidence |
| --- | --- | --- |
| Input | Parcel, square feet, quality, condition, base rate, modifiers, land value, and optional factors; no county, tax year, source-fact identity, authorization, or trace identity | `backend/src/TerraFusion.Core/DTOs/Kernel/KernelCostApproachRequest.cs:3-16` |
| Output | Aggregate replacement cost, depreciation, RCNLD, land/building/total values, and kernel provenance | `backend/src/TerraFusion.Core/DTOs/Kernel/KernelCostApproachResponse.cs:3-23` |
| Invocation identity | Kernel client generates a new request GUID rather than accepting the HTTP correlation identity | `backend/src/TerraFusion.API/Services/Valuation/ValuationKernelClient.cs:27-43` |
| Failure vocabulary | Executable missing, timeout, non-zero exit, invalid JSON, and kernel-reported error | `backend/src/TerraFusion.API/Services/Valuation/KernelContracts/KernelFailureMode.cs:3-10` |
| Cancellation | Caller cancellation and configured deadline share one linked token and both become `Timeout` | `backend/src/TerraFusion.API/Services/Valuation/RustKernelProcessHost.cs:126-142` |
| Output/environment | Stdout/stderr use unbounded `ReadToEndAsync`; the child environment is not constrained; no mechanical network sandbox is present | `backend/src/TerraFusion.API/Services/Valuation/RustKernelProcessHost.cs:96-107,118-155` |
| Provenance | Manifest, Forge commit, source hashes, filename, and executable hash fail closed before execution | `backend/src/TerraFusion.API/Services/Valuation/RustKernelProcessHost.cs:60-94,214-302` |

## Required pure projection contract

The smallest safe later projector is pure and unwired:

```text
Project(identity, facts) -> projected kernel request or typed projection failure
```

`identity` must contain authenticated county ID, canonical parcel ID, property ID, explicit tax
year, source record IDs/versions, authorization principal and permission, and validated correlation
ID. `facts` must contain the exact approved schedule identity, square feet, normalized quality and
condition, land value, certified rate, sorted allowlisted modifiers, optional factors, and source
hashes. The result retains the identity envelope beside the frozen `KernelCostApproachRequest` and a
deterministic fact-snapshot hash.

The projector must have no database, authentication, clock, network, logging, fallback, DI, or
runtime dependency. The eventual caller must resolve authorization and facts server-side; a naked
client-supplied kernel request is never sufficient.

## Fail-closed invariants

1. Require authenticated county, exact Forge permission, canonical parcel, and explicit tax year.
2. Require every fact to share county, parcel, tax year, and source version; reject ambiguity or
   duplicate aliases.
3. Reject latest/current-year, Benton, zero-stub, caller-rate, or caller-modifier fallback.
4. Reject unknown quality, condition, schedule, status, selector, or modifier vocabulary.
5. Reject duplicate modifier keys, missing source IDs/hashes, non-finite values, non-positive area or
   rate, negative land value, and out-of-range factors.
6. Sort modifiers ordinally and require identical facts to produce identical projected input and
   snapshot hash.
7. Require returned parcel identity and nonempty provenance/audit IDs to match the projected
   identity; reject `unknown` provenance.
8. Never label `stub`, malformed, inconsistent, or unverified output as live canonical output.
9. Preserve caller cancellation separately from kernel deadline and operational failure.
10. Exclude owner/address/query/full-text/provider/model/token/credential and raw process output.

## Response and fallback contract

- Validate finite nonnegative amounts and the invariants `replacementCost - depreciation = rcnld`
  and `landValue + buildingValue = totalValue` under an explicit rounding tolerance.
- Map replacement cost, RCNLD, land, building, and total only after identity and provenance validation.
- Do not infer physical, functional, or external depreciation from the kernel aggregate.
- Do not fabricate improvement value, confidence, characteristics, segments, or percentages.
- `stub` and all-zero no-data responses are `unavailable`, never `live`.
- A later approved canonical-data fallback must be labeled `fallback` and retain the original kernel
  failure. Identity, county, authorization, and provenance failures never fall back.

## Synthetic proof plan

Accepted cases cover complete identity/provenance, deterministic modifier ordering, absent optional
factors, and a separately disclosed canonical fallback after an operational failure. Negative cases
cover missing or mismatched county/parcel/year/source/trace identity, duplicate facts or modifiers,
unknown vocabulary, invalid numeric bounds, inconsistent totals, missing audit or binary hashes,
every kernel failure mode, caller cancellation versus deadline, oversized output, unexpected stderr,
and fallback that suppresses failure or presents itself as live.

## Staged implementation map after semantic proof

This map is preparatory only and grants no implementation authority.

1. **Pure input/response projection:** new pure Core projection records and focused synthetic unit
   tests; no controller, persistence, DI, route, or frontend files.
2. **Process-host bounds:** `RustKernelsOptions.cs`, `KernelFailureMode.cs`,
   `RustKernelProcessHost.cs`, and `RustKernelProcessHostTests.cs` only, to bound/sanitize output,
   distinguish cancellation/deadline/output-limit failures, constrain child environment, and prove
   cleanup. Mechanical network isolation remains an explicit nonclaim unless separately designed.
3. **Correlation and trace contract:** kernel execution context plus client/service/controller contract
   tests; metadata only, with no fact, query, stdout/stderr, or credential leakage.
4. **Unwired synthetic shadow proof:** projection/translation plus host tests only. The DB-backed
   Workbench route remains authoritative; no consumer switch, DI change, frontend adoption, or
   configuration change.

## Exact missing semantic proof

1. Which field is canonical: `BaseRate`, `BaseCost`, or legacy `CostPerSqFt`.
2. How one approved cost schedule is selected for an exact assessment year and version instead of
   using a latest-record rule.
3. Modifier names, formulas, normalization, ordering, bounds, and unknown-value behavior.
4. Quality and condition vocabulary normalization.
5. Tax-year-specific land-value source and neighborhood/location-factor provenance.
6. Unique county/parcel identity and alias-resolution semantics.
7. Exact Forge permission, correlation/TerraTrace event contract, deterministic hashing, rounding,
   and precision rules.

## Verdict and successor

Implementation is not ready. `WO-SR-008G - Forge Cost Fact and Schedule Semantics Audit` is the
smallest same-risk docs/evidence successor. It is dependency-interlocked until WO-SR-008F merges and
receives post-merge verification. It must resolve the exact missing semantic proof or return `NO_GO`;
it does not authorize product, test, backend, runtime, or host implementation.

## Rollback and nonclaims

Revert only this packet, evidence, and routing update. This Work Order does not prove current read
county isolation, a canonical rate or modifier policy, Workbench kernel consumption, host network
isolation, binary reproducibility, runtime switching, production safety, or cutover.
