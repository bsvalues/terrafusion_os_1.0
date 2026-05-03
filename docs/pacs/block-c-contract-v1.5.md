# Block-C Contract — v1.5 (Clarification + E4b Resolution Semantics)

**Status:** binding doctrine. Version `v1.5`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.4.md` (v1.4, 2026-05-03).
**Layer:** 3.5 of the PACS doctrine stack.

```text
docs/pacs/block-c-contract-v1.md             (v1   — base freeze)
docs/pacs/block-c-contract-v1.1.md           (v1.1 — dict_neighborhood)
docs/pacs/block-c-contract-v1.2.md           (v1.2 — attribute_definition)
docs/pacs/block-c-contract-v1.3.md           (v1.3 — nullable AttributeId FKs)
docs/pacs/block-c-contract-v1.4.md           (v1.4 — QuarantineReasons closed vocab)
docs/pacs/block-c-contract-v1.5.md           (v1.5 — attribute resolution semantics) ← this doc
```

## 0. What v1.5 is

Two things, in one minor bump:

1. **Clarification of `attribute_definition.IAttrId` semantics**
   (the v1.2 design used loose language; v1.5 fixes it).
2. **E4b runtime contract**: how the C3 projector resolves
   PACS attributes against `canonical_tf.attribute_definition`,
   and what happens on miss.

No v1 / v1.1 / v1.2 / v1.3 / v1.4 frozen shape changes. No new
entity, no new column, no migration. `attribute_definition` keeps
its existing column names exactly. v1.5 is documentation +
projector-level behavior only.

## 0.5 Doctrine integrity disclosure (carry-forward + new finding)

v1.4 disclosed that v1.0's QuarantineReason vocabulary was
incomplete (NO_OWNER_XREF + BOTH_MISSING were undocumented). The
E4b pre-implementation audit found:

```text
NEW FINDING (2026-05-03):
  PacsImprvAttrLandingService emits "UNKNOWN_I_ATTR_VAL_CD" as a
  LANDING-LAYER QuarantineReason. v1.4 missed it because v1.4's
  audit only walked canonical-layer projectors.

  Production impact: zero. Landing-layer quarantine continues to
  emit the value as it always has.

  Doctrine impact: QuarantineReasons.All in v1.4 does NOT include
  this value, so QuarantineReasons.IsKnown returns false for it.
  That is a documented gap, not a regression.

  Resolution: deferred to a future v1.6 cumulative bump. E4b
  scope is explicitly C3-canonical only — no landing-layer
  changes per the user's "no L3 goblin in disguise" rule.
```

No code is changed in v1.5 to address this finding. v1.5 simply
records that it exists.

---

## 1. v1.2 §3.8 clarification — what `IAttrId` actually models

### Background

v1.2 §3.8 froze `canonical_tf.attribute_definition` with this
column:

```csharp
public long IAttrId { get; set; }      // "PACS i_attr_id verbatim"
```

The accompanying prose said "PACS-side natural integer key."

### What v1.2 implied vs. what PACS reality is

PACS schema (real):

```text
imprv_attr               carries (i_attr_val_id, i_attr_val_cd, ...) — per attribute-VALUE
imprv_attr_val (dict)    carries (i_attr_val_id, i_attr_id, ...)    — joins value to family
   where:
     i_attr_id        identifies the attribute family (e.g. "ROOF_TYPE")
     i_attr_val_id    identifies one allowed value within that family (e.g. "TILE")
```

A v1.2 reader could reasonably interpret `attribute_definition.IAttrId`
as either family-grain (`i_attr_id`) or value-grain
(`i_attr_val_id`). The doc was ambiguous.

### v1.5 clarification

```text
canonical_tf.attribute_definition models the VALUE-GRAIN identity:

  attribute_definition.IAttrId  ↔  PACS imprv_attr.i_attr_val_id

The column NAME remains `IAttrId` (per v1.2 §3.8) for backward
compatibility — renaming would force a v2 migration. The
SEMANTICS are now formally value-grain.

Each attribute_definition row represents ONE PACS attribute
value (e.g. "TILE" within "ROOF_TYPE"), not a whole attribute
family.
```

### Why this is `v1.5` and not `v2`

- No column renamed.
- No type changed (`long` stays `long`).
- No migration generated.
- No existing producer of `attribute_definition` rows is broken
  — there are no v1.2 producers yet (E2 was schema-only).

The column name is loose; the documented semantics are now
precise. Strictly additive at the contract level.

### Future family-grain identity (informational)

If a later slice needs to reason about attribute *families*
(e.g. ratio studies grouped by "all ROOF_TYPE values"), it can
add a sibling `canonical_tf.attribute_family` entity in a
future v1.x bump. v1.5 does not require or precommit to that
shape.

---

## 2. E4b — C3 attribute resolution contract

### 2.1 Source of truth

Each `legacy_pacs_raw.imprv_attr` row carries:

```text
PropValYr, SupNum, PropId, ImprvId, ImprvDetId    — 5-key
IAttrValId                                         — value-grain id
IAttrValCd                                         — value-grain code
AttrValueText, AttrValueNumeric                    — payload
```

### 2.2 Resolution rule (v1.5)

For every raw `imprv_attr` row whose 4-key
`(PropValYr, SupNum, PropId, ImprvId)` matches a truth-pacs
imprv being projected by the current C3 batch:

```text
1. Resolve PropId → TfParcelId + CountyId via parcel xref.
   If no parcel xref, the parent improvement is already going
   to NoParcelXref quarantine (v1.0 path). Skip the imprv_attr
   row (it has no canonical destination).

2. Look up canonical_tf.attribute_definition WHERE
     CountyId == parcel.CountyId
     AND IAttrId == imprv_attr.IAttrValId
     AND IsActive == true
   (cross-county isolation is mandatory: an i_attr_val_id
    that resolves in Benton must NOT resolve via a Franklin
    AttributeDefinition row.)

3. ON MATCH:
   spawn ONE tf_improvement_feature row per imprv_attr row, with:
     TfImprovementId   = parent improvement (just projected)
     FeatureCode       = imprv_attr.IAttrValCd     (verbatim PACS code)
     Area              = NULL                       (imprv_attr does not carry area)
     Value             = imprv_attr.AttrValueNumeric (when numeric payload)
     AttributeId       = AttributeDefinitionId      ← the v1.3 FK lights up
     SourceImprvDetailLandedRowId = imprv_attr.LandedRowId
       (NB: the column name says "ImprvDetail" but in the imprv_attr
        case it points at the imprv_attr LandedRowId. This is
        deliberately reused to keep tf_improvement_feature schema
        unchanged; future v1.x may add a discriminator column
        if needed.)
     PromotionLoadBatchId = canonical projection batch
     CreatedAt / UpdatedAt = now

4. ON MISS:
   spawn ONE legacy_tf_unproven.imprv_attr row, with:
     PropValYr, SupNum, PropId, ImprvId, ImprvDetId, IAttrValId,
       IAttrValCd, AttrValueText, AttrValueNumeric (all verbatim)
     LandingLoadBatchId = canonical projection batch.LoadBatchId
       (NB: column is named LandingLoadBatchId for the original
        landing-layer use case. v1.5 reuses it for canonical-layer
        quarantine; the field semantics are "the batch that
        produced this quarantine row", regardless of layer.
        A future v1.x may rename or split this column.)
     QuarantineReason = QuarantineReasons.UnknownAttribute
     CreatedAt = now
```

### 2.3 What v1.5 does NOT change

- `tf_improvement_feature` rows derived from raw `imprv_detail`
  (v1.0 behavior — BSMT, ATTGAR, COVPATIO, MA, POOL, etc) keep
  `AttributeId = NULL`. They are NOT re-routed through the
  attribute_definition dictionary. The two row sources coexist
  in `tf_improvement_feature`, distinguishable by:

  ```text
  AttributeId IS NULL   →  imprv_detail-derived (structural breakdown)
  AttributeId IS NOT NULL → imprv_attr-derived (per-attribute key/value)
  ```

- `legacy_tf_unproven.imprv_attr` schema is unchanged. The
  `LandingLoadBatchId` column is reused for canonical-layer
  quarantine batch identity; field naming is a known awkwardness
  flagged for a future cleanup slice.

- No projector touches `imprv_attr` rows whose 4-key parent
  improvement is itself missing a parcel xref. Those parents
  go to `NoParcelXref` quarantine (v1.0); their `imprv_attr`
  children are simply not considered for projection.

### 2.4 Idempotency

Re-running C3 on the same truth batch must:

- Delete any prior `tf_improvement_feature` rows (existing v1.0
  behavior — already in place via `priorFeatures` cleanup).
- **NEW**: Delete any prior `legacy_tf_unproven.imprv_attr`
  rows whose `(PropValYr, SupNum, PropId, ImprvId)` matches
  the truth batch's 4-keys AND whose `QuarantineReason ==
  QuarantineReasons.UnknownAttribute`. The reason filter is
  required to avoid touching landing-layer quarantine rows
  (which use `UNKNOWN_I_ATTR_VAL_CD`).

The replay harness in H3 (`BlockCReplayHarnessTests`) already
covers `tf_improvement_feature` idempotency. v1.5 extends that
expectation implicitly to imprv_attr-derived features and
canonical-layer quarantine rows; new tests in
`PacsImprvCanonicalProjectorTests` cover the new paths
explicitly.

---

## 3. New gate — `canonical-imprv-attribute-coverage`

```text
GateStage = TRUTH_TO_CANONICAL
GateName  = canonical-imprv-attribute-coverage
Status    = PASS  (always — informational, not a fail gate)
Expected  = "informational"
Actual    = <attributes_resolved>
Detail    = "considered=N resolved=R quarantined=Q"
```

The gate is informational by design — an unresolved attribute is
real PACS data that has no canonical mapping yet, which is a
data-cleanup concern (the operator needs to add the missing
`attribute_definition` row), not a projector-failure concern.
Future slices may promote this to WARN at thresholds; that
upgrade is its own contract bump.

The gate name `canonical-imprv-attribute-coverage` joins the
existing five C3 gates as the **sixth gate** for the C3 lane.
This is a closed-vocabulary addition to the gate-name set
emitted by C3 — H2's regression test asserts the new gate name
is reachable in the EF model via promotion_gate_result writes.

---

## 4. Result type extension (v1.5)

`PacsImprvCanonicalResult` gains three new counters:

```csharp
public required int AttributesConsidered    { get; init; }  // raw imprv_attr rows in scope
public required int AttributesResolved      { get; init; }  // → tf_improvement_feature
public required int AttributesQuarantined   { get; init; }  // → legacy_tf_unproven.imprv_attr
public required int PriorAttrQuarantineRowsRemoved { get; init; }  // idempotency proof
```

Adding fields to a `record` with `required` initializers is a
binary-breaking change for any external consumer of the type.
Inside this repo there are no external consumers — the type is
constructed only by `PacsImprvCanonicalProjector` and consumed
only by C3 tests. Per the v1.4 disclosure pattern, this is
called out explicitly: any future slice that adds an
out-of-repo consumer of `PacsImprvCanonicalResult` must
revisit this decision.

---

## 5. v1.5 doctrine frog status

> The doctrine frog now sits, has teeth, replays, recognizes
> hood_cd, has the i_attr_id mapping spine, knows where to
> point feature/land rows, has the QuarantineReasons closed
> vocab — and as of v1.5, knows how to RESOLVE PACS attribute
> values against the canonical dictionary.
>
> Block E remaining work:
>   - L3-runtime (deferred — local WIP, not bundled with E4b)
>   - E4c (Land AttributeId resolution — sister of E4b)
>   - v1.6 cumulative cleanup (UNKNOWN_I_ATTR_VAL_CD landing-
>     layer reason + LandingLoadBatchId field rename or split)
>
> After Block E closes, Block D (ArcGIS-only GIS lane) begins.
