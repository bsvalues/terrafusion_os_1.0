# WO-SR-008H - Forge Cost Schedule Version and Modifier Projection Contract Evidence

## Result

`IMPLEMENTATION_READY_AS_STAGED_SEQUENCE`

Two independent read-only lanes inspected schedule provenance/selection and kernel modifier behavior
at sovereign base `4ef8760fe36f6053d84eb0b7523c7d8f5bd787d5`. No product, test, backend,
runtime, Forge-repository, workflow, package, configuration, deployment, data, credential, or
protected-resource state changed.

## Current source truth

1. `CostFactorSet` and `DepreciationSchedule` carry ID, county, effective year, opaque version,
   TerraFusion origin, provenance author, factors, and audit fields
   (`CostFactorSet.cs:21-43`; `DepreciationSchedule.cs:24-45`).
2. Current catalogs filter exact county/year but choose the lexically greatest version instead of
   accepting an exact requested version (`ReferenceCatalog.cs:11-20`; `CostFactorCatalog.cs:3-16`).
3. Persistence has primary keys and child foreign-key indexes, but no unique
   `(CountyId, EffectiveYear, Version)` or factor-band constraint
   (`20260616060820_AddForgeCostReference.cs:35-75,143-183`).
4. Cost and depreciation lookup prefer the narrowest matching band and break equal-width ambiguity
   by generated GUID (`CostFactorSet.cs:68-94`; `DepreciationSchedule.cs:57-75`).
5. No production caller enforces either `EnsureTfProvenance` method before calculation, and the
   assembler checks county but not year, version, provenance, or content hash
   (`ParcelValuationAssembler.cs:55-99`).
6. The Rust cost kernel applies `quality` and `condition` modifier lookups, silently defaults missing
   values to `1.0`, accepts unknown keys, and defaults absent `DepreciationRate` to `0.10`
   (`packages/terrabuild/kernels/terraforge.kernel.cost/src/main.rs:85-129`).
7. `UnitCostPerSqFt` remains the canonical TerraFusion-owned RCN input and source candidate for
   `BaseRate` (`CostFactor.cs:3-24`; `CostApproach.cs:31-67`).

## Exact schedule pin

A future pure projection must require this caller-supplied identity; it must not select a latest
catalog record:

```text
ForgeCostSchedulePin
  CountyId
  EffectiveYear
  CostFactorSetId
  CostFactorSetVersion
  CostFactorSetContentSha256
  DepreciationScheduleId
  DepreciationScheduleVersion
  DepreciationScheduleContentSha256
```

Versions are opaque exact-match identifiers. The projection may not parse, rank, increment, or choose
one. It must reject empty IDs/versions/hashes; county, year, ID, version, origin, author, or hash
mismatch; and duplicate schedule identities.

## Stable content hash contract

Schedule hashes use UTF-8 canonical JSON with fixed property order and invariant decimal text.
Mutable audit timestamps and actors are excluded. Schedule identity, county, year, opaque version,
origin, author, revaluation cycle, and every semantic row are included. Rows are sorted by normalized
class or age bounds, bounds, invariant values, and row ID, so database load order cannot change the
hash. Mutation of any included identity or semantic value must change the hash.

This hash proves the exact caller-supplied schedule snapshot. It does not replace invocation/audit
identity, sign content, or certify persistence provenance.

## Resolution contract

The pure projection receives the two schedule objects, exact pin, improvement class, positive size,
and nonnegative effective age. It must:

1. validate both exact pins and provenance before reading factors;
2. normalize class only by trim plus ordinal-ignore-case comparison;
3. find matching bounded cost factors and select a unique narrowest band;
4. use exactly one unbanded factor only when no bounded factor matches;
5. reject equal-specificity ambiguity, duplicate fallback, invalid bounds, missing match, and
   non-positive `UnitCostPerSqFt`;
6. find a unique narrowest depreciation age band and reject equal-specificity ambiguity, gaps,
   invalid bounds, or a fraction outside `[0,1]`;
7. return decimal `BaseRate = UnitCostPerSqFt` and exactly one decimal modifier named
   `DepreciationRate`.

No catalog lookup, database, HTTP, provider, controller, DI, runtime consumer, fallback, or write is
permitted.

## Explicit exclusions

- quality and condition vocabulary, normalization, or modifiers;
- land value, land schedules, neighborhood or location factors;
- functional/economic obsolescence, complexity, region, or caller modifiers;
- legacy `BaseCost` and `CostPerSqFt`;
- full `KernelCostApproachRequest` construction;
- decimal-to-double conversion, kernel execution, response translation, or trace emission;
- persistence uniqueness, migrations, runtime wiring, deployment, and protected resources.

## Proposed R3 stage

`WO-SR-008H-E1 - Forge Pure Cost Schedule Resolution and Modifier Projection Foundation`

Exact implementation files:

```text
backend/src/TerraFusion.Core/Entities/Forge/ForgeCostScheduleProjection.cs
backend/tests/TerraFusion.Unit.Tests/Forge/ForgeCostScheduleProjectionTests.cs
```

The source file may contain the pin, result, canonical-hash helper, structural validation, and pure
projection. The test file must prove exact-pin success, every identity mismatch, lexical-version
traps, order-independent hashes, mutation-sensitive hashes, unique narrowest bands, fallback rules,
all duplicate/ambiguity failures, invalid numeric/provenance cases, deterministic output, and absence
of every excluded modifier/dependency.

Governance lifecycle files remain the exact E1 Work Order/evidence packet and the seven canonical
registry, queue, program, and command-routing records already used by this program.

## Rollback and terminal boundary

The R2 packet rolls back by reverting only its nine governance/evidence files. The proposed E1 stage
would roll back by reverting only its two new source/test files plus its bounded governance/evidence
records. It creates no persistence, configuration, external-resource, or runtime state.

E1 needs one bounded R3 authority envelope. Even after E1, full kernel DTO mapping remains blocked on
the separately unresolved numeric, identity/permission, trace, and broader valuation-fact contracts.
