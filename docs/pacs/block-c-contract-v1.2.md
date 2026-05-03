# Block-C Contract — v1.2 (Additive Addendum)

**Status:** binding doctrine. Version `v1.2`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.1.md` (v1.1, 2026-05-03).
**Layer:** 3.5 of the PACS doctrine stack — same layer as v1 / v1.1.

```text
docs/pacs/block-c-contract-v1.md             (v1   — base freeze)
docs/pacs/block-c-contract-v1.1.md           (v1.1 — dict_neighborhood)
docs/pacs/block-c-contract-v1.2.md           (v1.2 — attribute_definition) ← this doc
```

## 0. Versioning rule applied

Per option (b) of the post-Block-C versioning policy, this is a
strictly additive change: one new entity, two new closed
vocabularies (`DataType`, `AppliesTo`) **on a new entity only**.
Nothing v1 or v1.1-frozen changed. Therefore: `v1.2`, not `v2`.

The H2 schema-shape regression test (`BlockCContractV1Tests`)
gains four new v1.2 assertions and one migration-name fragment.

---

## 1. What changed since v1.1

```text
ADDED:
  + canonical_tf.attribute_definition  (new entity, see §3.8)
  + DbSet<AttributeDefinition>         (named AttributeDefinitions)
  + Migration AddAttributeDefinition
  + Closed vocabulary AttributeDefinition.DataType: 'NUMERIC' |
    'STRING' | 'BOOLEAN' | 'DATE' | 'CODE'
  + Closed vocabulary AttributeDefinition.AppliesTo: 'IMPROVEMENT' |
    'LAND' | 'BOTH'

UNCHANGED FROM v1 / v1.1:
  · all v1 §§1-6 shapes
  · canonical_tf.dict_neighborhood     (v1.1 §3.7)
  · QuarantineReason vocabulary still NO_PARCEL_XREF only
    (UNKNOWN_ATTRIBUTE waits for E4)
```

No consumer of v1 or v1.1 should observe any behavior change.

---

## 3.8 `canonical_tf.attribute_definition` (new in v1.2)

File: `backend/src/TerraFusion.Core/Entities/CanonicalTf/AttributeDefinition.cs`

The i_attr_id mapping spine. Every per-attribute key/value row
in PACS that flows into TerraFusion gets exactly one row in this
table per county. Block C treats `i_attr_id` as opaque; E3 will
wire `tf_improvement_feature.AttributeId` and `tf_land.AttributeId`
as FKs onto this table; E4 adds the `UNKNOWN_ATTRIBUTE`
quarantine path on a dedicated future contract bump.

```csharp
public sealed class AttributeDefinition
{
    public Guid AttributeDefinitionId { get; set; }
    public Guid CountyId { get; set; }                 // sovereign isolation
    public long IAttrId { get; set; }                  // PACS i_attr_id verbatim
    public string AttributeCode { get; set; }          // varchar(20), required, e.g. "BEDROOMS"
    public string? AttributeName { get; set; }         // varchar(200)
    public string DataType { get; set; }               // varchar(20), closed vocab
    public string? ValueDomain { get; set; }           // varchar(50), free-text pointer to code list
    public string AppliesTo { get; set; }              // varchar(20), closed vocab
    public bool IsActive { get; set; } = true;
    public Guid LoadBatchId { get; set; }              // provenance — required
    public string SourceQueryHash { get; set; }        // varchar(64), required
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### Frozen invariants

- **Sovereign-county isolation:** `(CountyId, IAttrId)` is the
  PACS-side natural unique key. Same `IAttrId` in different
  counties may mean different attributes; never within one
  county.
- **Canonical-handle uniqueness:** `(CountyId, AttributeCode)`
  is also unique. Two `IAttrId` values must not collapse onto
  the same canonical short name within a county.
- **Provenance required:** every row carries `LoadBatchId` +
  `SourceQueryHash`.
- **No hard delete:** retired via `IsActive = false`, never
  `DELETE`.

### Frozen closed vocabularies (new in v1.2)

```text
AttributeDefinition.DataType     = 'NUMERIC' | 'STRING' | 'BOOLEAN' | 'DATE' | 'CODE'
AttributeDefinition.AppliesTo    = 'IMPROVEMENT' | 'LAND' | 'BOTH'
```

Adding a value to either vocab requires a v1.3+ contract bump.
These vocabs apply ONLY to `attribute_definition`. They do not
modify any v1 or v1.1 vocabulary.

### `ValueDomain` is intentionally free-text in v1.2

When `DataType = "CODE"`, consumers MAY interpret `ValueDomain`
as a pointer to a dictionary table name (e.g. `"dict_neighborhood"`).
A structured FK with a closed vocabulary of dictionary names is
deliberately deferred — the operator's full PACS dictionary
inventory is not yet enumerated, and locking a closed vocab now
would force a v2 bump as soon as a new dictionary lands. Treat
this as a known soft-spot to revisit post-E4.

### Frozen indexes

```text
ux_attribute_definition_county_iattr     UNIQUE (CountyId, IAttrId)
ux_attribute_definition_county_code      UNIQUE (CountyId, AttributeCode)
ix_attribute_definition_county_active    (CountyId, IsActive)
ix_attribute_definition_county_applies   (CountyId, AppliesTo)
ix_attribute_definition_load_batch       (LoadBatchId)
```

### What v1.2 explicitly does NOT do

- **No FK from `tf_improvement_feature` / `tf_land` onto
  `attribute_definition`.** That is E3 — and E3 is a v2 bump
  if it changes the v1 frozen shape of those tables (it would
  add a non-null `AttributeId` column → breaking change).
  Recommend E3 plans for v2 with explicit consumer migration
  guidance.
- **No `UNKNOWN_ATTRIBUTE` quarantine reason.** That is E4. Adding
  a new `QuarantineReason` value requires its own minor bump.
- **No projector consumes this table.** v1.2 is schema-only.
- **No new `TfEntityType`** (dictionary / mapping rows are
  reference data, not lineage entities).

### Migration name

```text
20260503034506_AddAttributeDefinition
```

Adds the `attribute_definition` table + its 5 indexes. Does not
modify any other table.

---

## 4. v1.2 status of the doctrine frog

> The doctrine frog now sits, has teeth, replays, recognizes the
> `hood_cd` domain, and as of v1.2 has the i_attr_id mapping
> spine. Two more E-block slices to go before the dictionary lock
> is operationally complete:
>
> - **E3** wires `tf_improvement_feature.AttributeId` /
>   `tf_land.AttributeId` FKs (v2 bump territory — breaking
>   change).
> - **E4** adds the `UNKNOWN_ATTRIBUTE` ingestion-time
>   quarantine gate (additive — minor bump).
>
> After E4, Block E closes and Block D (ArcGIS-only GIS lane)
> begins.
