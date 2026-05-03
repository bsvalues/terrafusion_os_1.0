# Block-C Contract — v1.7 (E4c Documented Deferral; Block E Close)

**Status:** binding doctrine. Version `v1.7`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.6.md` (v1.6, 2026-05-03).
**Layer:** 3.5 of the PACS doctrine stack.

```text
docs/pacs/block-c-contract-v1.md             (v1   — base freeze)
docs/pacs/block-c-contract-v1.1.md           (v1.1 — dict_neighborhood)
docs/pacs/block-c-contract-v1.2.md           (v1.2 — attribute_definition)
docs/pacs/block-c-contract-v1.3.md           (v1.3 — nullable AttributeId FKs)
docs/pacs/block-c-contract-v1.4.md           (v1.4 — QuarantineReasons closed vocab)
docs/pacs/block-c-contract-v1.5.md           (v1.5 — attribute resolution semantics)
docs/pacs/block-c-contract-v1.6.md           (v1.6 — two-layer quarantine vocabulary)
docs/pacs/block-c-contract-v1.7.md           (v1.7 — E4c deferral; Block E close) ← this doc
```

## 0. What v1.7 is

A **declaration**, not a code change. v1.7 records that:

1. The E4c slice — mirroring E4b's `i_attr_id` resolution onto
   `tf_land` — is **deferred** because its prerequisite source
   data (`legacy_pacs_raw.land_attr`) does not exist in the
   TerraFusion codebase today.
2. **Block E is closed by declaration.** Every E-block deliverable
   that has source data has shipped (E1, E2, E3a, E4a, E4b, plus
   the L3 runtime closure and the v1.6 vocabulary cleanup). E4c
   remains formally open at the doctrine level but cannot
   physically run until separate landing-layer work happens.
3. **Block D (ArcGIS-only GIS lane) is the next block to open.**

No schema change. No migration. No projector touched. v1.7 is
pure doctrine.

---

## 1. The E4c audit (2026-05-03)

A four-check read-only audit was run before any code was written:

| # | Check | Result |
|---|---|---|
| 1 | `LegacyPacsRaw/*LandAttr*` entity files | none |
| 2 | `TerraFusionDbContext` `LandAttr`/`land_attr` DbSet | none |
| 3 | Migration containing a `land_attr` table | none (one match was a false positive — `tf_land_attribute_id` is the v1.3 FK index on `canonical_tf.tf_land`, not a raw landing table) |
| 4 | `PacsLandDetailLandingService` `attr`/`attribute`/`i_attr` references | none |

**Outcome: C — `legacy_pacs_raw.land_attr` does not exist.**

### Why E4c can't mechanically mirror E4b

E4b was implementable because:
- `legacy_pacs_raw.imprv_attr` already existed as a landing entity.
- `PacsImprvAttrLandingService` already populated it from PACS.
- `LegacyTfUnprovenImprvAttr` already existed as a quarantine surface.

For tf_land none of those preconditions hold. There is no
landing entity, no landing service, no quarantine surface for
land-side per-attribute rows.

---

## 2. Prerequisite slices for future E4c proper

When the operator's workflow needs land-attribute resolution
(likely surfacing during F5 ratio-study skeleton or post-90-day
Benton Method calibration), three slices must run in order
before E4c becomes implementable:

### L1-B (notional) — Land attribute landing entity

```text
backend/src/TerraFusion.Core/Entities/LegacyPacsRaw/LegacyPacsRawLandAttr.cs

  PACS source identity (6-key composite):
    PropValYr, SupNum, PropId, LandSegId, LandAttrId
    + IAttrValId (or whatever PACS's actual value-grain key is on land_attr)

  Closed-vocabulary code (analogous to imprv_attr.IAttrValCd):
    IAttrValCd : string

  Provenance (non-negotiable):
    LoadBatchId, SourceQueryHash, SourceRowHash, LandedAt

backend/src/TerraFusion.Data/Configurations/LegacyPacsRaw/LegacyPacsRawLandAttrConfiguration.cs
  Schema legacy_pacs_raw, table land_attr.

backend/src/TerraFusion.Core/Entities/LegacyTfUnproven/LegacyTfUnprovenLandAttr.cs
  Quarantine surface for unknown-code rejection at landing time.

DbContext registration:
  DbSet<LegacyPacsRawLandAttr> LegacyPacsRawLandAttrs
  DbSet<LegacyTfUnprovenLandAttr> LegacyTfUnprovenLandAttrs

EF migration: AddLegacyPacsRawLandAttrAndQuarantine.
```

### L1-C (notional) — Land attribute landing service

```text
backend/src/TerraFusion.Data/Services/LegacyPacsRaw/PacsLandAttrLandingService.cs

  Same shape as PacsImprvAttrLandingService:
    - Input: raw PACS land_attr rows
    - Closed-vocab dictionary check on IAttrValCd
    - On hit: land into legacy_pacs_raw.land_attr
    - On miss: quarantine to legacy_tf_unproven.land_attr with
               LandingQuarantineReasons.UnknownIAttrValCd
               (v1.6 vocabulary — already exists, no addition needed)
    - Provenance + idempotency + dictionary-coverage gate

DI registration in Program.cs.

Tests: PacsLandAttrLandingServiceTests (mirror of
       PacsImprvAttrLandingServiceTests).
```

### E4c proper — L3 projector attribute resolution

```text
Modify PacsLandCanonicalProjector (no new entity needed):
  - Pre-fetch raw land_attr rows matching the truth batch's 4-key
  - Pre-fetch active AttributeDefinition rows by (CountyId, IAttrId)
    (same index already built for E4b — could be shared via a
    helper if both projectors were refactored together)
  - For each truth land projected: walk matching land_attr rows.
    On match: spawn ANOTHER tf_improvement_feature row? Or
    spawn into a NEW table tf_land_attribute? — design choice
    deferred to E4c proper.

Open design questions deferred to E4c proper:
  - Does land_attr resolution produce tf_improvement_feature rows
    (reusing the v1.5 §2.3 multi-source design) or a new entity
    tf_land_attribute? The improvement side conflates both
    physical-component features (BSMT, MA) and per-attribute
    rows (ROOF_TYPE, BEDROOMS) into one table. For land the
    physical-segment grain (homesite, ag, pasture) is already
    tf_land itself, so per-attribute rows would more naturally
    go into a sibling table. v1.7 does not pre-decide this.

  - tf_land already has v1.3 nullable AttributeId. If land_attr
    resolution produces a NEW table, what does tf_land.AttributeId
    represent then? Possibly: kept as-is (one optional pointer
    to the "primary" attribute for the segment), with the new
    sibling table holding all attributes including the primary.
    Again deferred.

  - The tf_improvement_feature reuse precedent in v1.5 §2.2 for
    SourceImprvDetailLandedRowId column reuse may or may not
    apply on the land side. E4c proper resolves this.

New gate: canonical-land-attribute-coverage (sister of v1.5's
canonical-imprv-attribute-coverage).

Doctrine bump: v1.x at the time E4c lands (likely v1.8 or v2,
depending on whether the design-question answers introduce a
breaking change).
```

### Estimated total cost when E4c is needed

```text
L1-B (entity + config + DbContext + migration + tests):     ~1.5 hours
L1-C (landing service + tests + DI):                        ~2.0 hours
E4c (projector resolution + gate + tests):                  ~2.0 hours
Doctrine doc (v1.8 or v2) + integration:                    ~0.5 hours
                                                            ─────────
                                                            ~6 hours total
```

---

## 3. Block E close declaration

```text
Block E was scoped (per docs/pacs/blocks-d-through-h-design.md §E)
as: "Dictionary lock + i_attr_id mapping."

Deliverables that shipped:
  ✓ E1   canonical_tf.dict_neighborhood
  ✓ E2   canonical_tf.attribute_definition
  ✓ E3a  tf_improvement_feature.AttributeId + tf_land.AttributeId
         (nullable FKs)
  ✓ E4a  QuarantineReasons closed vocabulary (with cumulative
         doctrine integrity correction for NO_OWNER_XREF +
         BOTH_MISSING)
  ✓ E4b  C3 projector i_attr_id resolution + UNKNOWN_ATTRIBUTE
         quarantine

Adjunct slices:
  ✓ L3 runtime    (DI + tests + replay harness — closed the
                  pre-existing schema/runtime gap)
  ✓ v1.6 cleanup  (LandingQuarantineReasons + disjointness
                  invariant)
  ✓ v1.7          (this doc — E4c documented deferral)

Deliverables NOT shipped, with rationale:
  ⊘ E3b   v2 BREAKING flip of AttributeId from nullable → non-null.
          Deferred until a real backfill source for historical
          tf_improvement_feature + tf_land rows is wired.
  ⊘ E4c   Sister of E4b for tf_land. Deferred per §2 — source
          landing-layer (legacy_pacs_raw.land_attr) does not
          exist; building it is properly Block C scope-creep
          and is queued for whenever land-attribute data
          becomes operationally needed.

Block E is therefore CLOSED by declaration. The remaining open
items (E3b, E4c) live in the queue with explicit prerequisites
and estimated costs documented above. They will be picked up by
their own scoped slices when their preconditions are met.
```

---

## 4. What v1.7 does NOT change

```text
- No projector behavior change.
- No new entity, no schema change, no migration.
- No new gate, no new Result-type field.
- No closed-vocabulary value added or removed.
- No frozen v1.x shape modified.
- LandingLoadBatchId rename still deferred per v1.6 §4.
```

---

## 5. v1.7 doctrine frog status

> The doctrine frog has scoped the dirt goblin's missing
> paperwork. The goblin gets no AttributeId privileges until
> proper land_attr documents are filed.
>
> Block E closes. Block D opens.
>
> Next: ArcGIS-only GIS lane per
> `docs/pacs/blocks-d-through-h-design.md` §D. ArcGIS REST only,
> no shapefile parser, no custom topology, no custom projection.
> The mechanical pattern from Block C reuses cleanly: D1 raw
> landing, D2 truth promotion, D3 canonical projection with
> NoParcelXref quarantine fallthrough, D4 read-models.
