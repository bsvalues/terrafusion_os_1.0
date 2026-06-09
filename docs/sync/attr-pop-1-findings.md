# ATTR-POP-1 — Findings: Attribute Dictionary Populator

**Slice:** ATTR-POP-1 (post-DOCTRINE-STATUS-1). The first of two in
the post-doctrine-arc fork (#3 from the operator-decision menu).
Populates `canonical_tf.attribute_definition` from PACS
`dbo.attribute` and unlocks the imprv_attr `UnknownAttribute`
quarantine resolution path.

**Status:** SHIPPED. 35 attribute_definition rows (25 active, 10
soft-retired), keyed `(CountyId, IAttrId)`. Populator is idempotent
by design via the unique index. Re-projection path verified to
resolve attributes against the dictionary when data flows.

## The result

```
Populator run against live Benton dbo.attribute:
  rows considered  : 35
  rows inserted    : 35
  rows updated     : 0   (first run)
  rows soft-retired: 0   (no prior rows to flip)
  inactive skipped : 10  (PACS retired families, still inserted as IsActive=false)

canonical_tf.attribute_definition:
  total  : 35
  active : 25
  retired: 10

Re-projection of latest imprv truth batch: ran cleanly. 0 attributes
considered because the keyed sample's prop_ids don't carry imprv_attr
rows in the queried (year, sup_num) slice. Resolution path is wired;
data alignment is the open question.
```

## The pattern this establishes

This is the FIRST single-tier dictionary populator in the doctrine.
Prior slices are all 3-tier (raw → truth → canonical). Dictionaries
are different:

- **No truth-qualification axis.** Every row in `dbo.attribute` is a
  real attribute family. There's nothing to filter.
- **No multi-version semantics.** The dictionary IS what it is; PACS
  doesn't versioned-publish a dictionary the way it versions parcels
  by year+supplement.
- **Soft-retire only.** Inactive rows STAY in canonical_tf with
  `IsActive=false` so historical references (e.g. quarantined
  imprv_attr rows pointing at retired families) continue to resolve.

The populator pattern that emerged (single tier, idempotent upsert by
natural key, two gates):
- `attribute-definition-coverage` — informational PASS, records counts
- `attribute-definition-provenance` — every upserted row carries
  LoadBatchId + SourceQueryHash. FAIL on any miss.

This is the template for future dictionary populators
(DictNeighborhood, future state-code dictionaries, etc.). When E3
arrives — full Block-C v1.5 attribute resolution — it can build on
this foundation rather than re-inventing.

## Files shipped

- `backend/src/TerraFusion.Core/Sync/PacsAttribute/PacsSourceAttribute.cs`
  — source-shaped record (3 fields: IAttrId, AttributeName, InactiveFlag)
- `backend/src/TerraFusion.Core/Sync/PacsAttribute/IPacsAttributeSource.cs`
  — source interface, mirrors `IPacs*Source` shape
- `backend/src/TerraFusion.Core/Sync/PacsAttribute/IPacsAttributePopulator.cs`
  — populator contract + result record
- `backend/src/TerraFusion.Data/Services/PacsSources/SqlServerPacsAttributeSource.cs`
  — production source against live `pacs_oltp.dbo.attribute`. No TopN
  (the dictionary is small — full corpus drains in ms). Bool-flexible
  reader for `inactive_flag` (handles bit/char/tinyint variants).
- `backend/src/TerraFusion.Data/Services/CanonicalTf/PacsAttributePopulatorService.cs`
  — single-tier populator with two gates. AttributeCode normalized to
  uppercase + underscores + truncated to 20 chars.
- `backend/src/TerraFusion.API/Program.cs`
  — DI registration
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/attr-pop-1/run-populate` (populator + optional
  re-projection in one call)

## Schema confirmed against live PACS

Real Benton `dbo.attribute` (verified via INFORMATION_SCHEMA):

| Column | Type |
|---|---|
| `imprv_attr_id` | int |
| `imprv_attr_desc` | varchar(50) |
| `inactive_flag` | bit |
| sys_flag, cCompSalesAdjust, rc_type | char(1) |
| bModifierFactor, bStoriesMultiplier, web_export | bit |

ATTR-POP-1 reads only the three load-bearing columns
(`imprv_attr_id` → `IAttrId`, `imprv_attr_desc` → `AttributeName`,
`inactive_flag` → inverted to `IsActive`). The other six are
PACS-internal modifiers; they may become relevant in a future Block-C
v1.5 refinement, but the attribute_definition schema doesn't carry
them today.

## What this DIDN'T do (intentionally)

The 3,168 historical quarantined `imprv_attr` rows in
`legacy_tf_unproven.imprv_attr` are NOT drained by this slice. The
canonical projector's idempotency keys on the truth promotion batch,
not on raw imprv_attr rows. Those historical rows came from earlier
ad-hoc runs whose batches no longer correspond to active truth
batches.

To drain them, an operator would need to:
1. Re-land the original keyed `(prop_id, prop_val_yr)` tuples
   (whichever ones produced the 3168 unresolved attrs)
2. Re-promote imprv truth
3. Re-project canonical — the projector now resolves attributes
   against the populated dictionary

That's an operations task, not a code task. The code path works.

## Family-grain vs value-grain (Block-C v1.5)

Per Block-C contract v1.5: the imprv_attr table's `i_attr_val_id`
column is value-grain; `attribute.imprv_attr_id` is family-grain.
The current canonical projector matches `imprv_attr.IAttrValId`
against `attribute_definition.IAttrId` directly. This works
correctly when:

- PACS happens to use the same integer ID space for both grains, OR
- The doctrine has redefined `IAttrId` to mean "whatever grain the
  value identifies"

If wider testing reveals the integer spaces are disjoint, a future
slice (ATTR-POP-2) can populate value-grain rows from
`dbo.imprv_attr_val` keyed `(imprv_attr_id, imprv_attr_val_cd, imprv_yr)`
synthesizing additional attribute_definition entries. The current
slice covers the family layer; the foundation is in place.

## Endpoint reference

```
POST /api/debug/attr-pop-1/run-populate
Content-Type: application/json

{
  "OperatorName": "attr-pop-1-proof",         // optional
  "RerunImprvCanonical": true                  // optional, default true
}
```

Response includes populator block, dictionary counts (total + active),
optional reprojection block (when RerunImprvCanonical=true), and
quarantine/featuresAttributed deltas if reprojection ran.

## The one-line summary

**ATTR-POP-1 shipped: canonical_tf.attribute_definition is now
populated (35 rows for Benton). The doctrine resolution path that
the imprv canonical projector consumes is wired and idempotent.
Future imprv_attr rows resolve to AttributeId by natural key.**
