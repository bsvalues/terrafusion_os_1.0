# Canonical Sales Qualification Landing Schema Policy

**Slice:** C35-A (docs-only — defines the contract for the
*first* canonical landing table in TerraFusion's downstream
write surface. C35-B will land the EF Core entity + EF
configuration + migration. C36 will implement the
SalesQualificationTransform that writes to it. C37 will be
the first comp-filter end-to-end proof.).
**Lifecycle layer:** post-lock canonical write surface. Sits
between (a) the C34-locked Mapping Workbook + C7-B read-model
on the read side and (b) future sales-comp consumers
(comp-pool filter, ratio study, Forge sales-comp surface) on
the consume side.
**Status:** policy locked; implementation deferred to C35-B
(schema migration + entity); transform implementation deferred
to C36; end-to-end proof deferred to C37.

## Why this slice

The end-to-end audit (2026-04-28) identified that the
workbook's `(canonical_target, canonical_value)` surface has
nowhere to land. C32-B set `canonical_target=SalesQualification`
on `dbo.sale.wac_cd` and `dbo.sale.sl_ratio_type_cd`. C34
locked the workbook so transforms can read it. **C35 introduces
the canonical landing table** that the SalesQualificationTransform
(C36) writes to.

Per the locked sequence:
```
C34 ✓ lock workbook
C35-A    canonical sales qualification landing schema design  ← THIS SLICE
C35-B    schema migration + entity + EF configuration
C36      SalesQualificationTransform implementation (C8-B)
C37      first comp-filter end-to-end proof
```

C37 is the operator's "WacCd bug blocks all comps" containment
proof — the original Path 1 destination.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy**.
  Establishes the canonical sale identity composite + the
  read-only-PACS invariant.
- **C8-A — Sales Qualification Transform Policy**. Defines
  the transform's read-side semantics: workbook `Status='Mapped'`
  guard + the AND-logic exclusion rule + the per-axis lookup
  shape. C35-A defines the *write* side that C8-A's transform
  output lands in.
- **C13-A — Sales-lane Review Policy**. Establishes the sales
  lane's 2017 conversion caveat and the operator-authoritative
  semantics (what wac_cd means in the comp-pool eligibility
  context).
- **C30-A / C30-C — sale.primary_use_cd dictionary policy**.
  Established the "no sale-context inference" guard that this
  slice inherits: the canonical landing table's transform
  decision is mechanical from the locked workbook +
  per-sale-row PACS data; it does NOT cross-reference other
  canonical landing tables.
- **C32-A / C32-B / C33 / C34**. The lock-readiness chain.
  The workbook is now Mapped (locked) and consumable via the
  C7-B read-model.
- **Operator memory `project_benton_truth_pass.md`**:
  > "WacCd bug blocks all comps."
  The original failure mode this canonical landing table
  exists to fix.

## Purpose

Define the **canonical landing table** schema that the
C36 SalesQualificationTransform writes to per evaluated sale.
The schema captures:

1. **Sale identity** — which PACS sale this row describes.
2. **Decision** — qualified-for-comp-pool (yes/no).
3. **Per-axis reasoning** — why the decision came out the
   way it did (which axis excluded, which axis qualified).
4. **Workbook provenance** — which Mapped workbook produced
   this decision.
5. **Audit fields** — operator-stamped per the FISMA-HIGH
   pattern.

The schema is **idempotent re-write capable**: the same
sale evaluated twice (e.g. after a workbook re-lock with
different operator-confirmed mappings) produces the same
canonical row identity but updated decision values. The
write side preserves an audit trail of which workbook
produced each decision.

## Architectural shape

### Identity (the canonical sale primary key)

Per D0-D's PACS canonical sale identity policy:

```
Canonical sale identity = (CountyId, ChgOfOwnerId)
```

The PACS canonical sale identity is `chg_of_owner_id`,
which is unique per sale event in PACS. Combined with
`CountyId` (sovereign-county isolation per CLAUDE.md), this
gives the canonical landing table its primary key.

```sql
PRIMARY KEY (CountyId, ChgOfOwnerId)
```

### The decision

Per C8-A's AND-logic exclusion rule:

```
Decision = QUALIFIED iff
  wac_cd            evaluation = QUALIFIED  AND
  sl_ratio_type_cd  evaluation = QUALIFIED

Decision = EXCLUDED iff
  wac_cd            evaluation = EXCLUDED   OR
  sl_ratio_type_cd  evaluation = EXCLUDED
```

Both axes must consent. Either axis can exclude.

The canonical landing row stores:

```
ComputedDecision         : enum { Qualified, Excluded, Inconclusive }
WacCdCanonicalValue      : the workbook's canonical_value for this sale's wac_cd
                            (or null if the workbook had no Mapped row for it)
WacCdAxisDecision        : enum { Qualified, Excluded, NotMapped }
SlRatioTypeCdCanonical   : same shape for sl_ratio_type_cd
SlRatioTypeAxisDecision  : enum { Qualified, Excluded, NotMapped }
```

`Inconclusive` is a third terminal state for sales where one
or both axes have `NotMapped` (workbook has no canonical_value
for the observed source value). C8-A's contract is "AND-logic
exclusion"; if the workbook is silent on either axis, the
transform refuses to declare qualified, but it also refuses
to declare excluded — the row is `Inconclusive` and the comp
consumer must treat it as not-yet-evaluated.

### Workbook provenance

Each canonical row carries the workbook id and lock-time of
the workbook that produced its decision:

```
SourceWorkbookId         : Guid     (FK → SyncMappingWorkbooks.Id)
SourceWorkbookLockedAt   : timestamp (snapshot of workbook UpdatedAt at lock time;
                                       the lock-stamp specifically, not later edits)
```

If a future operator re-locks a different workbook with new
mappings, the C36 transform overwrites this canonical row with
the new decision and updates `SourceWorkbookId` /
`SourceWorkbookLockedAt`. The previous decision is NOT
preserved by this table; the audit trail for "what was the
prior decision" lives in `AuditLogs` (FISMA-required) and in
the workbook's own version history.

### Audit fields (FISMA-HIGH, per CLAUDE.md)

```
CreatedAt        : DateTime  (auto-set on insert)
UpdatedAt        : DateTime  (auto-set on update)
CreatedBy        : string    (operator id; "c36-transform" for transform-driven writes)
UpdatedBy        : string    (operator id)
```

## Schema (proposed C35-B EF entity)

```csharp
namespace TerraFusion.Core.Entities.Canonical;

/// <summary>
/// Canonical landing row for a sale's qualification decision per
/// C8-A / C35-A. One row per (CountyId, ChgOfOwnerId). Written by
/// the C36 SalesQualificationTransform after reading a Mapped
/// workbook. Read by sales-comp / ratio-study / Forge consumers.
///
/// <para>Idempotent: re-evaluation of the same sale against a
/// re-locked workbook overwrites the row in place. Audit trail of
/// prior decisions lives in AuditLogs (FISMA-required) — NOT in
/// this table.</para>
/// </summary>
public sealed class CanonicalSaleQualification
{
    // Identity (PRIMARY KEY = (CountyId, ChgOfOwnerId))
    public Guid CountyId { get; set; }
    public int  ChgOfOwnerId { get; set; }

    // Decision
    public CanonicalSaleQualificationDecision ComputedDecision { get; set; }

    // Per-axis evaluation (for explainability and ratio-study debugging)
    public string?                         WacCdSourceValue { get; set; }
    public string?                         WacCdCanonicalValue { get; set; }
    public CanonicalSaleAxisDecision       WacCdAxisDecision { get; set; }
    public string?                         SlRatioTypeCdSourceValue { get; set; }
    public string?                         SlRatioTypeCdCanonicalValue { get; set; }
    public CanonicalSaleAxisDecision       SlRatioTypeCdAxisDecision { get; set; }

    // Workbook provenance
    public Guid     SourceWorkbookId { get; set; }
    public DateTime SourceWorkbookLockedAt { get; set; }

    // Sale provenance (PACS read-time snapshot, for ratio-study audit)
    public DateTime? SaleDate { get; set; }       // sale.sl_dt at evaluation time
    public decimal?  SalePrice { get; set; }      // sale.sl_price at evaluation time

    // Audit (FISMA-HIGH; AuditableEntityInterceptor auto-populates)
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string?  CreatedBy { get; set; }
    public string?  UpdatedBy { get; set; }
}

public enum CanonicalSaleQualificationDecision
{
    /// <summary>Both axes qualify; sale enters comp pool.</summary>
    Qualified    = 1,
    /// <summary>Either axis excludes; sale rejected from comp pool.</summary>
    Excluded     = 2,
    /// <summary>One or both axes have no Mapped row; consumer must treat as not-yet-evaluated.</summary>
    Inconclusive = 3,
}

public enum CanonicalSaleAxisDecision
{
    Qualified = 1,
    Excluded  = 2,
    /// <summary>The workbook has no Mapped canonical_value for this source value.</summary>
    NotMapped = 3,
}
```

### EF Core configuration (proposed)

```csharp
public class CanonicalSaleQualificationConfiguration
    : IEntityTypeConfiguration<CanonicalSaleQualification>
{
    public void Configure(EntityTypeBuilder<CanonicalSaleQualification> b)
    {
        b.ToTable("CanonicalSaleQualifications");
        b.HasKey(x => new { x.CountyId, x.ChgOfOwnerId });

        b.Property(x => x.ComputedDecision).HasConversion<int>().IsRequired();
        b.Property(x => x.WacCdAxisDecision).HasConversion<int>().IsRequired();
        b.Property(x => x.SlRatioTypeCdAxisDecision).HasConversion<int>().IsRequired();

        b.Property(x => x.WacCdSourceValue).HasMaxLength(64);
        b.Property(x => x.WacCdCanonicalValue).HasMaxLength(256);
        b.Property(x => x.SlRatioTypeCdSourceValue).HasMaxLength(64);
        b.Property(x => x.SlRatioTypeCdCanonicalValue).HasMaxLength(256);

        b.Property(x => x.SourceWorkbookId).IsRequired();
        b.Property(x => x.SourceWorkbookLockedAt).IsRequired();

        b.Property(x => x.SalePrice).HasPrecision(14, 2);

        b.Property(x => x.CreatedBy).HasMaxLength(200);
        b.Property(x => x.UpdatedBy).HasMaxLength(200);

        b.HasIndex(x => new { x.SourceWorkbookId, x.ComputedDecision })
         .HasDatabaseName("IX_CanonSaleQual_Workbook_Decision");

        b.HasIndex(x => new { x.CountyId, x.ComputedDecision })
         .HasDatabaseName("IX_CanonSaleQual_County_Decision");
    }
}
```

The FK from `SourceWorkbookId` to `SyncMappingWorkbooks.Id`
is **NOT** declared as a hard FK constraint, because the
workbook may be Archived/replaced over time; treating
SourceWorkbookId as a soft reference (Guid + audit
LockedAt timestamp) preserves the historical decision row's
integrity even if the source workbook lifecycle moves on.

## Hard Guards

### 1. Locked-workbook-only writes

The C36 transform reads via `ISyncMappingWorkbookReadModel`
(C7-B). The read-model's `LoadMappedAsync` throws if
`Status != 'Mapped'`. C36 inherits this guard; nothing in
C35-B's schema or C36's transform allows a write driven from
a Draft workbook.

### 2. Per-sale-evaluation, not per-county-aggregation

Each `CanonicalSaleQualification` row describes ONE sale. The
schema does NOT carry county-wide aggregates (e.g. "median
qualified price"). Aggregations are downstream consumer
concerns (ratio study, sales-comp surface).

### 3. AND-logic exclusion is the only decision rule

C8-A's AND-logic exclusion is the canonical decision rule.
C35-B's entity does NOT carry per-row decision-rule overrides.
If a future county wants different decision semantics, that's
a separate canonical landing table for that county's transform
flavor — NOT a knob on this table.

### 4. PACS read-only

The C36 transform reads PACS sale rows. It does NOT write
PACS. C35-B's entity is in TerraFusion DB, not in PACS. The
PACS sale row is the input; the canonical landing row is the
output.

### 5. Idempotent re-write, not append-only

Re-evaluating a sale (e.g. after a workbook re-lock) overwrites
the row in place. Append-only history lives in AuditLogs
(FISMA-required) and the workbook's own lock-version history.
This avoids unbounded growth of the canonical table while
preserving the audit trail.

### 6. No cross-table inference

C36's transform writes to ONLY this table. It does not read
or write any other canonical landing table. Cross-canonical
joins (e.g. linking a sale's canonical decision to its
parcel's canonical property_use mapping) are downstream
consumer concerns.

### 7. No-PII safeguard

`CanonicalSaleQualification` carries no PII. Sale rows in PACS
include grantor/grantee names, addresses, and other personal
data; this canonical table carries only the qualification
decision + the PACS sale identity (which is an opaque integer
id) + the price snapshot (a number, not personal data).
Downstream consumers requiring PII must read PACS directly
under their own access controls; this table is not a PII
surface.

## Mismatch / null-handling

### Sale source value not in workbook code-values

The transform reads a sale's `wac_cd` value, then looks it up
in the workbook's `(canonical_target=SalesQualification,
source_column=wac_cd, source_value=<observed>)` rows. If no
matching code-value row exists in the workbook (the Mapped
workbook didn't observe this value at profile time), the
axis decision is `NotMapped` and the overall decision is
`Inconclusive`.

### Workbook code-value is Deferred (terminal but no canonical_value)

The transform treats Deferred axis values as `NotMapped` —
the operator chose to defer canonical-value commitment, so
the transform refuses to make a qualification decision based
on a non-committed mapping. Consumer treats `Inconclusive`
sales as not-yet-evaluated.

### Workbook code-value is Excluded

C8-A's read-model already filters Excluded code-values out of
the snapshot. The transform never sees Excluded rows. If a
sale's source_value matches an Excluded canonical-value, the
axis decision is `NotMapped` (because the read-model didn't
return it) and the overall decision is `Inconclusive`.

## Audit Expectations

### What C35-B produces

```text
backend/src/TerraFusion.Core/Entities/Canonical/CanonicalSaleQualification.cs
backend/src/TerraFusion.Core/Entities/Canonical/CanonicalSaleQualificationDecision.cs
backend/src/TerraFusion.Core/Entities/Canonical/CanonicalSaleAxisDecision.cs
backend/src/TerraFusion.Data/Configurations/CanonicalSaleQualificationConfiguration.cs
backend/src/TerraFusion.Data/Migrations/<timestamp>_AddCanonicalSaleQualifications.cs
+ DbSet<CanonicalSaleQualification> on TerraFusionDbContext
```

Tests:

- `CanonicalSaleQualificationConfigurationTests` — entity
  configuration round-trips through EF Core
- `TerraFusionDbContextTests` (new test) — DbSet present;
  AuditableEntityInterceptor stamps audit fields on insert/update

### What C36 produces (separate slice)

The transform implementation:

```text
backend/src/TerraFusion.Sync/Workbench/Transforms/Sales/SalesQualificationTransform.cs
backend/src/TerraFusion.Sync/Workbench/Transforms/Sales/ISalesQualificationTransform.cs
... (already exist as design skeletons per C8-A)
+ tests
+ a CLI mode or background worker registration for invocation
```

C36 implements the read (workbook + PACS sale rows) → decide
(per C8-A AND-logic) → write (CanonicalSaleQualification)
flow.

### What C37 produces (separate slice)

End-to-end proof: sample some Benton sales, run them through
C36, verify the canonical landing table contains the expected
Qualified / Excluded / Inconclusive distribution. The proof's
acceptance criterion is the operator's recorded memory:
"WacCd bug blocks all comps" — sales whose wac_cd is one of
the WA REET exemption codes (`458-61A-203(1)` etc.) should
land as Excluded.

## Hard Non-Goals (this slice)

| Non-goal | Rationale |
|---|---|
| Add the EF entity / migration | C35-B. |
| Implement the transform | C36. |
| Run a transform pass | C37. |
| Define other canonical landing tables (property_use, imprv_det_class, land_soil, etc.) | Each gets its own design slice; this one is sales-qualification-specific. |
| Mutate the locked workbook | C34 closed the lock; C35 reads only. |
| Mutate PACS | Read-only by policy. |
| Add PII | The canonical table is decision-only; no grantor/grantee/address data. |
| Define cross-canonical joins | Consumer concern. |
| Define ratio-study aggregations | Consumer concern. |
| Define sales-comp ranking / scoring | Consumer concern. |
| Cross-county vocabulary import | Per-PACS-instance + per-county isolation per CLAUDE.md. |

## Success Gates for C35-A (this slice)

| Gate | Pass criterion |
|---|---|
| **Policy doc lands** | `docs/sync/canonical-sales-qualification-landing-schema-policy.md` (NEW). |
| **Identity defined** | `(CountyId, ChgOfOwnerId)` documented as primary key with provenance to D0-D. |
| **Decision schema defined** | `ComputedDecision` enum + per-axis decision enums + per-axis source/canonical value fields. |
| **Workbook provenance defined** | `SourceWorkbookId` + `SourceWorkbookLockedAt`. |
| **Idempotent re-write contract** | Documented — append-only history is in AuditLogs, not this table. |
| **Hard Guards documented** | Lock-only writes; per-sale not aggregate; AND-logic only; PACS read-only; idempotent re-write; no cross-canonical inference; no-PII safeguard. |
| **Mismatch / null handling defined** | NotMapped → Inconclusive overall. |
| **C35-B success gates defined** | Entity + configuration + migration + DbSet + tests. |
| **C36 success gates defined** | Read-locked-workbook → write per-sale → CanonicalSaleQualification roundtrip. |
| **C37 success gates defined** | WA REET exemption sales land as Excluded. |

## Success Gates for C35-B (next slice)

| Gate | Pass criterion |
|---|---|
| **Entity lands** | `CanonicalSaleQualification.cs` + decision enums in `TerraFusion.Core/Entities/Canonical/`. |
| **EF configuration lands** | `CanonicalSaleQualificationConfiguration.cs` in `TerraFusion.Data/Configurations/` with primary key + indices + audit field length limits. |
| **DbSet on TerraFusionDbContext** | `public DbSet<CanonicalSaleQualification> CanonicalSaleQualifications { get; set; }`. |
| **Migration generated and applied** | `dotnet ef migrations add AddCanonicalSaleQualifications` produces the expected `CREATE TABLE` (with primary key, indices, audit fields, no FK to SyncMappingWorkbooks). |
| **AuditableEntityInterceptor stamps fields** | Insert sets CreatedAt + CreatedBy; update bumps UpdatedAt + UpdatedBy. |
| **Test: roundtrip** | Insert + load via DbContext → fields match. |
| **Test: audit interceptor** | Insert without explicit audit values still gets fields populated. |
| **No regression** | Existing 260+ tests still green. |
| **No PACS mutation** | Migration is TerraFusion-DB-only. |
| **No workbook mutation** | The workbook is locked at `Mapped`; nothing in C35-B touches it. |

## Recommended pacing

- **C35-B** (next slice) — entity + EF config + migration +
  tests. ~2-3 files NEW + 1 modification to TerraFusionDbContext
  + 1 migration. ~5-7 unit tests. **No new service class. No
  PACS reads. No workbook mutation.**
- **C36** — SalesQualificationTransform implementation
  (per C8-A + this slice). Reads via `ISyncMappingWorkbookReadModel`
  + `ISalesRowReader`; writes to
  `DbSet<CanonicalSaleQualification>`. ~2-3 files NEW + tests.
- **C37** — end-to-end proof: run C36 against the Mapped
  workbook + a sample of real Benton sales; verify the
  Excluded distribution matches the WA REET exemption pattern.

## What This Slice Is

The first canonical landing table policy in TerraFusion. The
twelfth sync-side policy after 10 dictionary-loader policies +
1 column-terminalization policy. Defines the contract for the
write surface that C36's transform produces and that downstream
sales-comp / ratio-study consumers read.

## What This Slice Is Not

A schema migration. An entity class. A transform implementation.
A consumer of the canonical table. A specification for any
other canonical landing table (property_use, imprv_det_class,
land_soil, imprv_det_meth, imprv_det_sub_class —
each gets its own design slice when its transform is introduced).
A PII surface. A ratio-study definition.

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/sales-review-csv-policy.md` (C13-A + amendment) | sales-lane review intent + 2017 caveat — informs decision-rule semantics |
| `docs/sync/sales-qualification-transform-policy.md` (C8-A) | the transform's read-side semantics — **this slice's parent for the transform contract** |
| `docs/sync/mapping-workbook-batch-edit-policy.md` (C11-A) | the batch-edit grammar — informs how source values flow from PACS to workbook to here |
| `docs/sync/mapping-workbook-lock-cli-policy.md` (C10-A) | lock contract — informs the "locked-workbook-only writes" Hard Guard |
| `docs/sync/mapping-workbook-column-terminalization-policy.md` (C32-A) | column-row terminalization — informs how `canonical_target=SalesQualification` ends up on workbook columns |
| `docs/sync/pacs-canonical-dataflow-identity-policy.md` (D0-D) | PACS canonical sale identity — informs `(CountyId, ChgOfOwnerId)` primary key |
| **`docs/sync/canonical-sales-qualification-landing-schema-policy.md` (C35-A)** | **this doc — first canonical landing table policy** |
