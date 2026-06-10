# Block-C Contract — v1.6 (Two-Layer Quarantine Vocabulary)

**Status:** binding doctrine. Version `v1.6`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.5.md` (v1.5, 2026-05-03).
**Layer:** 3.5 of the PACS doctrine stack.

```text
docs/pacs/block-c-contract-v1.md             (v1   — base freeze)
docs/pacs/block-c-contract-v1.1.md           (v1.1 — dict_neighborhood)
docs/pacs/block-c-contract-v1.2.md           (v1.2 — attribute_definition)
docs/pacs/block-c-contract-v1.3.md           (v1.3 — nullable AttributeId FKs)
docs/pacs/block-c-contract-v1.4.md           (v1.4 — QuarantineReasons closed vocab)
docs/pacs/block-c-contract-v1.5.md           (v1.5 — attribute resolution semantics)
docs/pacs/block-c-contract-v1.6.md           (v1.6 — two-layer quarantine vocabulary) ← this doc
```

## 0. What v1.6 is

A doctrine-debt cleanup. v1.5 §0.5 disclosed that
`UNKNOWN_I_ATTR_VAL_CD` was a fourth shipping quarantine reason
not covered by the v1.4 `QuarantineReasons` closed vocabulary,
because the v1.4 audit only walked canonical-layer projectors and
this value is emitted by a landing-layer service. v1.5 deferred
the cleanup; v1.6 closes it.

v1.6 makes the two-layer quarantine model an explicit doctrine
invariant, gives the landing-layer vocabulary its own closed-vocab
class (mirroring `QuarantineReasons`), and asserts the two
vocabularies are disjoint.

No projector or landing-service behavior changes. No emitted
string changes. No schema migration. v1.6 is naming + doctrine.

---

## 1. The two-layer quarantine model

```text
┌─────────────────────────────────────────────────────────────────┐
│  Landing layer                                                  │
│  legacy_pacs_raw → legacy_tf_unproven.*                         │
│                                                                 │
│  Reason class:  LandingQuarantineReasons                        │
│                  (TerraFusion.Core.Entities.LegacyPacsRaw)      │
│  v1.6 vocab:    UNKNOWN_I_ATTR_VAL_CD                           │
│                                                                 │
│  Producers:     services in                                     │
│                  TerraFusion.Data.Services.LegacyPacsRaw        │
│                 (today: PacsImprvAttrLandingService only)       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Canonical layer                                                │
│  truth_pacs → canonical_tf  (with quarantine fallthrough)       │
│                                                                 │
│  Reason class:  QuarantineReasons                               │
│                  (TerraFusion.Core.Entities.SyncBridge)         │
│  v1.4+ vocab:   NO_PARCEL_XREF, NO_OWNER_XREF,                  │
│                 BOTH_MISSING, UNKNOWN_ATTRIBUTE                 │
│                                                                 │
│  Producers:     services in                                     │
│                  TerraFusion.Data.Services.CanonicalTf          │
│                 (today: S3, B3, B4, C3, L3 projectors)          │
└─────────────────────────────────────────────────────────────────┘
```

A landed row in `legacy_tf_unproven.imprv_attr` (the only table
that today receives writes from BOTH layers — landing-layer at
landing time, canonical-layer at C3 projection per v1.5 §2.2)
can be classified back to its producing layer by looking at its
`QuarantineReason` value:

```text
LandingQuarantineReasons.IsKnown(reason)  →  landing-layer producer
QuarantineReasons.IsKnown(reason)         →  canonical-layer producer
```

The two predicates are mutually exclusive by doctrine.

---

## 2. New artifact — `LandingQuarantineReasons`

File: `backend/src/TerraFusion.Core/Entities/LegacyPacsRaw/LandingQuarantineReasons.cs`

```csharp
public static class LandingQuarantineReasons
{
    public const string UnknownIAttrValCd = "UNKNOWN_I_ATTR_VAL_CD";

    public static IReadOnlySet<string> All { get; }
    public static bool IsKnown(string value);
}
```

Mirrors the `QuarantineReasons` shape exactly. `All` returns a
single-element set today; future landing-layer reasons (e.g.
`DICTIONARY_REFRESH_REQUIRED` if/when partial-promotion logic
arrives) require a v1.x bump just like canonical-layer additions
do.

### Producer-side rule (v1.6)

Every code path in
`TerraFusion.Data.Services.LegacyPacsRaw` that writes to a
`legacy_tf_unproven.*.QuarantineReason` column MUST reference a
`LandingQuarantineReasons.*` constant. String literals are a
doctrine violation.

The v1.6 refactor removed the last private const string from
`PacsImprvAttrLandingService`. Future landing services must
follow the same pattern.

---

## 3. Frozen disjointness invariant

```text
QuarantineReasons.All  ∩  LandingQuarantineReasons.All  =  ∅
```

The H2 schema-shape regression test asserts this with two
checks:

```csharp
// canonical layer cannot recognize landing reasons
QuarantineReasons.IsKnown(LandingQuarantineReasons.UnknownIAttrValCd)
  .Should().BeFalse();

// landing layer cannot recognize canonical reasons
LandingQuarantineReasons.IsKnown(QuarantineReasons.UnknownAttribute)
  .Should().BeFalse();

// no string appears in both
QuarantineReasons.All.Intersect(LandingQuarantineReasons.All)
  .Should().BeEmpty();
```

This invariant is what makes v1.5 §2.4's filter-by-reason cleanup
strategy safe. As long as the two vocabularies stay disjoint:

- Landing-layer cleanup can never accidentally delete a
  canonical-layer quarantine row.
- Canonical-layer cleanup can never accidentally delete a
  landing-layer quarantine row.

Adding a value to either class without checking the other for
collision would break this invariant. The H2 contract test fails
the build immediately if it does.

---

## 4. Deferred — `LandingLoadBatchId` field rename

`legacy_tf_unproven.imprv_attr` has a column named
`LandingLoadBatchId` from its original landing-layer-only design.
Per v1.5 §2.2 the field is reused for canonical-layer quarantine
batches: it holds the canonical-projection batch id when the
quarantine row is written by C3, and the landing batch id when
written by `PacsImprvAttrLandingService`. Same column, different
semantics depending on the producing layer.

This is doctrinally awkward but **structurally fine**: the field
contains "the batch that produced this quarantine row," and that
batch's `SourceFamily` (via `sync_bridge.load_batch.SourceFamily`)
disambiguates which layer wrote the row.

**v1.6 chose to defer the rename.** A clean rename requires either:

- A schema migration that physically renames the column (forbidden
  by the v1.6 scope rule "no schema changes unless explicitly
  required"), OR
- An EF model-level property rename with `[Column("LandingLoadBatchId")]`
  attribute keeping the DB column name (migration-free, but
  introduces a code/SQL name disagreement that's worse than the
  current ambiguity).

The pragmatic answer is to keep the column name as-is and document
the dual meaning. A future v2-grade slice can do a clean column
rename when other breaking changes are queued.

The XML doc on `LegacyTfUnprovenImprvAttr.QuarantineReason`
points at both vocabulary classes; readers tracing back through
the field can self-classify the row.

---

## 5. What v1.6 does NOT do

```text
- No projector behavior change. Every emitted string is identical
  to v1.5.
- No new entity, no schema change, no migration.
- No new gate, no new Result-type field.
- No LandingLoadBatchId rename (deferred — see §4).
- No E4c land attribute resolution (separate slice).
- No new TfEntityType, no new SourceFamily.
```

---

## 6. Test coverage added in v1.6

```csharp
Contract_v1_6_LandingQuarantineReasons_AllContainsExpectedValues
  // single-value set: UNKNOWN_I_ATTR_VAL_CD

Contract_v1_6_QuarantineVocabularies_AreDisjoint
  // QuarantineReasons.All ∩ LandingQuarantineReasons.All = ∅
  // Cross-IsKnown checks: false in both directions
```

H2's existing v1.4 `Contract_v1_4_QuarantineReasons_*` tests were
already excluding `AMBIGUOUS_PARCEL_XREF` and
`PARCEL_XREF_INACTIVE`. v1.6 keeps those exclusions intact and
adds the cross-vocabulary disjointness checks.

---

## 7. v1.6 doctrine frog status

> The doctrine frog labeled the weird drawer.
>
> Block E remaining work:
>   - E4c (land AttributeId resolution + UNKNOWN_ATTRIBUTE behavior
>     for tf_land — pending audit of whether `legacy_pacs_raw.land_attr`
>     exists as a landing entity)
>
> After E4c (or its proper deferral if no land_attr source exists),
> Block E closes and Block D (ArcGIS-only GIS lane) begins.
