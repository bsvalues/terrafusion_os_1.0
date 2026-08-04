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

Schedule hashes use SHA-256 over one UTF-8 byte sequence with no BOM, no trailing newline, and no
insignificant whitespace. JSON property order is the literal order shown in the known-answer vectors
below. Strings are Unicode NFC; GUIDs use lowercase `D` format. Cost-row class text is otherwise
byte-preserved; it is not trimmed or case-normalized. Version, author, and revaluation-cycle strings
preserve case and must already be trimmed.
JSON string escaping follows `System.Text.Json`. Null bounds and cycles are the JSON literal `null`.
Integers use invariant base-10 with no leading zero. Decimals remove insignificant trailing scale,
normalize every zero to `0`, and then use JSON string form from
`decimal.ToString("G29", InvariantCulture)`; exponent notation is forbidden. Therefore `1m`, `1.0m`,
and `1.00m` all encode as `"1"` and must hash identically.

Cost rows sort by class using `OrdinalIgnoreCase` with exact ordinal text as a tie-break, minimum
bound (`null` before integers), maximum bound (`null` after integers), unit-cost text ordinal, then
row GUID ordinal. Depreciation rows sort by minimum age,
maximum age, fraction text ordinal, then row GUID ordinal. Mutable audit timestamps and actors are
excluded. Schedule identity, county, year, opaque version, origin, author, revaluation cycle, and
every semantic row are included. Mutation of any included identity or semantic value must change the
hash.

### Known-answer vectors

Cost-factor canonical bytes:

```json
{"schema":"forge-cost-factor-set/v1","id":"11111111-1111-1111-1111-111111111111","countyId":"22222222-2222-2222-2222-222222222222","effectiveYear":2026,"version":"v1","origin":"TerraFusionOwned","author":"tf","revalCycle":null,"factors":[{"id":"33333333-3333-3333-3333-333333333333","class":"R1","minSqFt":null,"maxSqFt":null,"unitCost":"125.5"}]}
```

SHA-256: `a5eab9a2f0740cc1c16ba835654b41d97fa964e4aff5449de503b5cf479ca9f2`

Depreciation canonical bytes:

```json
{"schema":"forge-depreciation-schedule/v1","id":"44444444-4444-4444-4444-444444444444","countyId":"22222222-2222-2222-2222-222222222222","effectiveYear":2026,"version":"v1","origin":"TerraFusionOwned","author":"tf","revalCycle":null,"factors":[{"id":"55555555-5555-5555-5555-555555555555","minAge":0,"maxAge":10,"fraction":"0.1"}]}
```

SHA-256: `2902186c7f8bf833d4153de57f1ead1d2a16c39c1cc8da78689cb0cfa75197a4`

This hash proves the exact caller-supplied schedule snapshot. It does not replace invocation/audit
identity, sign content, or certify persistence provenance.

## Resolution contract

The pure projection receives the two schedule objects, exact pin, improvement class, positive size,
and nonnegative effective age. It must:

1. validate both exact pins and provenance before reading factors;
2. compare class text exactly as the live source does, using raw `OrdinalIgnoreCase` with no trim or
   other normalization;
3. match each nullable bound independently: a null minimum has no lower limit and a null maximum has
   no upper limit;
4. assign fully bounded rows width `max - min` and assign every one-sided or fully unbounded row
   `long.MaxValue`, matching the current specificity rule;
5. select the unique matching row with minimum width and reject two or more matches at that same
   minimum width, invalid bounds, missing matches, and non-positive `UnitCostPerSqFt`;
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
traps, order-independent hashes, mutation-sensitive hashes, equal-value/different-scale hash equality,
unique narrowest bands, unique minimum-only and maximum-only matches, all equal-specificity and
unbounded ambiguity failures, invalid numeric/provenance cases, deterministic output, and absence of
every excluded modifier/dependency.

Governance lifecycle files remain the exact E1 Work Order/evidence packet and the seven canonical
registry, queue, program, and command-routing records already used by this program.

## Rollback and terminal boundary

The R2 packet rolls back by reverting only its nine governance/evidence files. The proposed E1 stage
would roll back by reverting only its two new source/test files plus its bounded governance/evidence
records. It creates no persistence, configuration, external-resource, or runtime state.

E1 needs one bounded R3 authority envelope. Even after E1, full kernel DTO mapping remains blocked on
the separately unresolved numeric, identity/permission, trace, and broader valuation-fact contracts.
