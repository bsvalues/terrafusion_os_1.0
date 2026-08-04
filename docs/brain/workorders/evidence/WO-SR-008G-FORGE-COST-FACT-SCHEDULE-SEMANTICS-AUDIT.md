# WO-SR-008G - Forge Cost Fact and Schedule Semantics Audit Evidence

## Result

`DECOMPOSITION_REQUIRED`

WO-SR-008G corrected the overstated WO-SR-008F rate ambiguity and separated source-backed cost facts
from unresolved valuation policy. Three independent read-only lanes inspected rate and schedule
selection, modifier and land semantics, and identity, trace, hashing, and numeric behavior. No
product, test, backend, runtime, Forge-repository, workflow, package, configuration, deployment,
data, credential, or protected-resource state changed.

## Corrected rate disposition

| Field | Disposition | Source evidence |
| --- | --- | --- |
| `UnitCostPerSqFt` | Canonical TerraFusion-owned RCN unit input and source candidate for kernel `BaseRate` | `backend/src/TerraFusion.Core/Entities/Forge/CostFactor.cs:3-24`; `backend/src/TerraFusion.Core/Entities/Forge/CostApproach.cs:31-67` |
| `BaseRate` | Kernel transport field; must receive the checked projection of the selected `UnitCostPerSqFt` | `backend/src/TerraFusion.Core/DTOs/Kernel/KernelCostApproachRequest.cs:3-16`; `backend/src/TerraFusion.API/Services/Valuation/KernelValuationService.cs:38-46` |
| `BaseCost` | Legacy/parallel cost-matrix model; not the canonical projector source | `backend/src/TerraFusion.Core/Entities/CostMatrix.cs:13-35` |
| `CostPerSqFt` | Legacy field; not the canonical projector source | `backend/src/TerraFusion.Core/Entities/CostMatrix.cs:13-35` |

The canonical TF-native calculator computes replacement cost new as selected unit cost multiplied by
size. Kernel integration tests prove that `BaseRate` participates in the corresponding kernel
formula, but no focused test currently proves the source-to-kernel projection.

## Source-backed semantics

1. Cost-factor sets are county scoped, effective-year scoped, version labeled, and TerraFusion-owned.
   Missing provenance is invalid (`CostFactorSet.cs:16-65`).
2. Catalog selection filters by exact county and effective year and never falls back to another
   county or year (`CostFactorCatalog.cs:3-16`).
3. Within one set, factor lookup matches class case-insensitively, applies inclusive size bands,
   prefers the narrowest band, and returns an explicit miss (`CostFactorSet.cs:68-94`).
4. Physical depreciation is a county/year/version-scoped schedule with explicit misses and a
   narrowest-band rule (`DepreciationSchedule.cs:24-75`).
5. Land rates are county/year/version-scoped and neighborhood keyed with explicit misses
   (`LandScheduleSet.cs:24-71`).
6. Canonical quality vocabulary is `ECONOMY`, `FAIR`, `STANDARD`, `GOOD`, `EXCELLENT`, `LUXURY`;
   condition vocabulary is `POOR`, `FAIR`, `GOOD`, `EXCELLENT` (`CamaCharacteristic.cs:38-56`).
7. `TfParcelId` is the canonical parcel identity; PACS identifiers are lineage only
   (`CanonicalTf/TfParcel.cs:5-21`).

## Unresolved semantics

| Concern | Exact gap |
| --- | --- |
| Version pinning | Catalog selection accepts no requested version and chooses the lexically greatest version for a county/year. Version syntax, exact-match behavior, and uniqueness are not enforced. |
| Duplicate factors | Equally specific bands can be selected by generated GUID; overlapping or duplicate bands are not rejected. |
| Modifier policy | The kernel silently defaults unknown quality/condition to `1.0`, defaults depreciation, ignores unknown keys, and permits reserved-key collisions. The TF-native calculator does not consume quality or condition. |
| Quality/condition | Current legacy and kernel paths use different defaults, ordering, and rounding. Adopting either would invent policy. |
| Land/factors | `LandScheduleSet` is canonical, but Workbench land values do not carry schedule provenance. Non-neutral neighborhood/location multipliers have no canonical versioned source. |
| Parcel aliases | `(CountyId, ParcelNumber)` is indexed but not unique; current read paths accept aliases without a single fail-closed normalization contract. |
| Permission | Existing Forge and CostForge routes use different permission vocabularies; no exact consumer-read permission is canonical. |
| Trace | HTTP correlation identity, kernel request identity, and TerraTrace events are disconnected. |
| Fact hash | Current process hash includes a fresh invocation GUID and unsorted modifier JSON; it is audit identity, not deterministic fact identity. |
| Numeric rules | Decimal persistence and public DTOs cross a double-based kernel without a canonical conversion, scale, midpoint, overflow, or tolerance contract. |

## Safe first-projection boundary

The source supports a future projection only after a narrower contract proves these invariants:

1. map selected `UnitCostPerSqFt` to kernel `BaseRate` through an explicit checked conversion;
2. require an exact cost-set and depreciation-schedule identity containing county, effective year,
   opaque version, source ID, and content hash;
3. reject missing, duplicate, overlapping, or ambiguous factor matches;
4. restrict the first projection to physical depreciation from the exact schedule;
5. omit quality, condition, and non-neutral neighborhood/location modifiers until separately
   source-backed;
6. preserve every unresolved identity, permission, trace, hash, and numeric rule as a fail-closed
   interlock rather than choosing a default.

## Successor

`WO-SR-008H - Forge Cost Schedule Version and Modifier Projection Contract` is admitted as the next
R2 docs/evidence node. It must define exact schedule identity and the safe first-projection subset,
then return either a further bounded R2 decomposition or one exact R3 implementation envelope. It
does not authorize product, test, backend, runtime, process-host, Forge-repository, workflow,
deployment, protected-resource, or cutover changes.

## Validation and nonclaims

Validation requires JSON parsing, Work Order query and planner tests, exact changed-path inspection,
secret-pattern scanning, `git diff --check`, remote required checks, zero unresolved substantive
threads, and independent exact-head assurance.

This audit does not prove a projection implementation, a runtime consumer, permission selection,
trace propagation, deterministic hashing, numeric parity, network isolation, deployment, production
readiness, or cutover.
