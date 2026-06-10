# Block-C Contract — v1.3 (Additive Addendum)

**Status:** binding doctrine. Version `v1.3`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.2.md` (v1.2, 2026-05-03).
**Layer:** 3.5 of the PACS doctrine stack.

```text
docs/pacs/block-c-contract-v1.md             (v1   — base freeze)
docs/pacs/block-c-contract-v1.1.md           (v1.1 — dict_neighborhood)
docs/pacs/block-c-contract-v1.2.md           (v1.2 — attribute_definition)
docs/pacs/block-c-contract-v1.3.md           (v1.3 — nullable AttributeId FKs) ← this doc
```

## 0. Versioning rule applied

This addendum adds **one nullable column** to two existing v1
entities (`tf_improvement_feature`, `tf_land`) plus the FK
relationships pointing them at v1.2's `attribute_definition`.

A nullable column on an existing entity is **strictly additive**:
no existing row needs backfill, no existing query breaks, no
existing consumer is forced to migrate. Therefore: `v1.3`, not
`v2`.

The non-null flip — turning `AttributeId` into a required column
on both tables — IS a breaking change and IS reserved for **E3b
(v2)**. v1.3 stops one step short of that on purpose: it lets
the dictionary spine become useful (projectors can populate
`AttributeId` when they have a resolution, leave it null when
they don't) without forcing a v2 bump in the same slice.

---

## 1. What changed since v1.2

```text
ADDED:
  + tf_improvement_feature.AttributeId    Guid? nullable
  + tf_land.AttributeId                   Guid? nullable
  + Navigation: tf_improvement_feature.AttributeDefinition
  + Navigation: tf_land.AttributeDefinition
  + FK fk_tf_improvement_feature_attribute_definition (NoAction)
  + FK fk_tf_land_attribute_definition                (NoAction)
  + Index ix_tf_improvement_feature_attribute_id
  + Index ix_tf_land_attribute_id
  + Migration AddAttributeIdNullableFkToFeatureAndLand

UNCHANGED FROM v1 / v1.1 / v1.2:
  · all v1 §§1-6 shapes (existing columns, keys, indexes,
    closed vocabularies)
  · tf_improvement_feature column-list invariant from v1 §3.4
    (the existing 11 columns are still present and unchanged;
    AttributeId is added on top, not in place of anything)
  · tf_land column-list invariant from v1 §3.5 (same — additive)
  · canonical_tf.dict_neighborhood    (v1.1 §3.7)
  · canonical_tf.attribute_definition (v1.2 §3.8)
  · QuarantineReason still NO_PARCEL_XREF only
  · No projector behavior change — no projector populates
    AttributeId yet
```

---

## 3.4 (updated) `canonical_tf.tf_improvement_feature` — v1.3 column added

The full v1 §3.4 shape is preserved verbatim. v1.3 adds:

```csharp
public sealed class TfImprovementFeature
{
    // ... v1 columns unchanged ...
    public Guid? AttributeId { get; set; }              // v1.3 NEW (nullable)
    public AttributeDefinition? AttributeDefinition { get; set; } // v1.3 NEW (navigation)
    // ... v1 columns unchanged ...
}
```

### v1.3 invariants

- **Nullable.** Existing feature rows have `AttributeId = NULL`.
  Future projector slices may set it; this contract does not
  force them to.
- **FK target:** `canonical_tf.attribute_definition.AttributeDefinitionId`.
- **Delete behavior:** `NoAction`. Any future hard-delete on
  `attribute_definition` (which is itself forbidden by v1.2 §3.8
  lifecycle — soft-retire only) MUST fail rather than orphan
  feature rows.
- **Index `ix_tf_improvement_feature_attribute_id`** for
  attribute-id scans (e.g. "all features pointing at this
  attribute definition").

### v1.3 does NOT do

- No projector populates `AttributeId`. The C3 projector
  continues to leave it null. Wiring projector logic that
  resolves PACS `i_attr_id` → canonical `AttributeDefinition`
  is a follow-up slice (likely E4 alongside the
  `UNKNOWN_ATTRIBUTE` quarantine path).
- No backfill of historical rows. Existing rows stay null.
- No constraint flip to NOT NULL. That is **E3b (v2)**.

---

## 3.5 (updated) `canonical_tf.tf_land` — v1.3 column added

Same pattern. v1.3 adds:

```csharp
public sealed class TfLand
{
    // ... v1 columns unchanged ...
    public Guid? AttributeId { get; set; }              // v1.3 NEW (nullable)
    public AttributeDefinition? AttributeDefinition { get; set; } // v1.3 NEW (navigation)
    // ... v1 columns unchanged ...
}
```

### v1.3 invariants

- **Nullable.** Existing land rows have `AttributeId = NULL`.
- **FK target:** `canonical_tf.attribute_definition.AttributeDefinitionId`.
- **Delete behavior:** `NoAction`.
- **Index `ix_tf_land_attribute_id`** for attribute-id scans.

### v1.3 does NOT do

- No projector populates `AttributeId`. L3 projector continues
  to leave it null.
- No backfill, no NOT NULL flip — both reserved for E3b (v2).

---

## 4. Why the FK navigation property is on the dependent side only

Both `TfImprovementFeature.AttributeDefinition` and
`TfLand.AttributeDefinition` are dependent-side navs. The
principal-side (`AttributeDefinition`) does NOT carry collection
nav properties pointing back. This is intentional:

- An `AttributeDefinition` could be referenced by many features
  AND many lands AND eventually other tables in E4+. A
  collection nav for each consumer creates EF cycles and
  query-shaping headaches without buying real ergonomics.
- Reverse queries ("which features reference this attribute?")
  are still trivially expressible:
  `_db.TfImprovementFeatures.Where(f => f.AttributeId == defId)`.

This shape is frozen in v1.3 §4 and applies to all future FK
relationships that target `AttributeDefinition`.

---

## 5. Migration name

```text
20260503035123_AddAttributeIdNullableFkToFeatureAndLand
```

Adds two nullable columns + two indexes + two FK constraints in
a single migration. No other tables touched. The down-migration
drops everything cleanly.

---

## 6. Path to v2 (when E3b lands)

For posterity, the v2 (BREAKING) bump that follows v1.3 will:

1. Add a backfill step that resolves every existing
   `tf_improvement_feature.AttributeId` and
   `tf_land.AttributeId` from PACS source rows + the
   `attribute_definition` table.
2. Verify zero null rows remain.
3. Flip the EF model property from `Guid?` to `Guid`.
4. Generate a migration that alters the columns to NOT NULL.
5. Update the H2 contract test §3.4 / §3.5 frozen shapes.
6. Publish `docs/pacs/block-c-contract-v2.md` with explicit
   consumer-migration guidance.

That is **not happening in this commit**. v1.3 is the staging
ground.

---

## 7. v1.3 doctrine frog status

> The doctrine frog now sits, has teeth, replays, recognizes
> hood_cd, has the i_attr_id mapping spine, AND knows where to
> point feature/land rows when a projector resolves an attribute.
> One slice from full E-block close: E4 adds the
> `UNKNOWN_ATTRIBUTE` quarantine ingestion gate. After E4, Block
> E closes and Block D (ArcGIS-only GIS lane) begins.
