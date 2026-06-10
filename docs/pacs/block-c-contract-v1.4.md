# Block-C Contract — v1.4 (Cumulative Vocabulary Correction)

**Status:** binding doctrine. Version `v1.4`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.3.md` (v1.3, 2026-05-03).
**Layer:** 3.5 of the PACS doctrine stack.

```text
docs/pacs/block-c-contract-v1.md             (v1   — base freeze)
docs/pacs/block-c-contract-v1.1.md           (v1.1 — dict_neighborhood)
docs/pacs/block-c-contract-v1.2.md           (v1.2 — attribute_definition)
docs/pacs/block-c-contract-v1.3.md           (v1.3 — nullable AttributeId FKs)
docs/pacs/block-c-contract-v1.4.md           (v1.4 — QuarantineReasons closed vocab) ← this doc
```

## 0. Doctrine integrity disclosure

This addendum is published with a **co-founder-status-report-grade
disclosure** because it corrects an omission in the v1.0 freeze
itself, not just the additive change that triggered the audit.

The E4a slice was scoped to add `UNKNOWN_ATTRIBUTE` to the
`QuarantineReason` closed vocabulary. The pre-implementation
audit instead found that:

```text
v1.0 §5.2 claimed:    "NO_PARCEL_XREF — only reason emitted today."

Production reality:   Projectors were already emitting THREE values:
                        - NO_PARCEL_XREF   (Sale, Owner, Imprv, Land, Wsdor)
                        - NO_OWNER_XREF    (Wsdor only — owner missing)
                        - BOTH_MISSING     (Wsdor only — neither resolved)
```

The H2 schema-shape regression test did not catch the omission
because no closed-vocab class for `QuarantineReason` existed —
the vocabulary lived only as `private const string` per
projector. So nothing was enforced; nothing failed; the v1.0 doc
was free to be wrong.

v1.4 corrects this cumulatively (option A from the pre-E4a status
report) by:

1. Creating `TerraFusion.Core.Entities.SyncBridge.QuarantineReasons`
   as the single source of truth, mirroring `SourceFamilies`.
2. Documenting all four currently-valid values (the three
   pre-existing + `UNKNOWN_ATTRIBUTE`).
3. Refactoring all five canonical projectors to reference the
   central constants — removing five `private const string`
   declarations and three Wsdor-specific aliases.
4. Cleaning two entity XML doc files (`LegacyTfUnprovenSale.cs`,
   `LegacyTfUnprovenOwnerCurrent.cs`) that listed aspirational
   values (`AMBIGUOUS_PARCEL_XREF`, `PARCEL_XREF_INACTIVE`) which
   were never emitted in production. Those values are explicitly
   **NOT** part of the v1.4 vocabulary.

No emitted-string value changed. No projector behavior changed.
The doctrine band rebuilt 360→362 green; the only test additions
are the two new v1.4 contract asserts.

This disclosure is intentionally permanent in the doctrine stack
so that future contributors can see that the doctrine frog bit
its own author and the team owned the correction.

---

## 1. What changed since v1.3

```text
ADDED (new code artifact):
  + backend/src/TerraFusion.Core/Entities/SyncBridge/QuarantineReasons.cs

DOCUMENTED (already shipping, formerly undocumented):
  + QuarantineReasons.NoOwnerXref  = "NO_OWNER_XREF"
  + QuarantineReasons.BothMissing  = "BOTH_MISSING"

ADDED (truly new value):
  + QuarantineReasons.UnknownAttribute = "UNKNOWN_ATTRIBUTE"
    (no projector emits this yet — reserved for E4b)

REFACTORED (no behavior change):
  · 5 projector services dropped private const strings and now
    reference QuarantineReasons.{NoParcelXref|NoOwnerXref|BothMissing}
  · 2 entity XML doc files re-pointed at QuarantineReasons; aspirational
    AMBIGUOUS_PARCEL_XREF / PARCEL_XREF_INACTIVE references removed

UNCHANGED:
  · all v1.x lane shapes
  · canonical_tf.dict_neighborhood     (v1.1)
  · canonical_tf.attribute_definition  (v1.2)
  · tf_improvement_feature / tf_land   AttributeId FK (v1.3)
  · all migrations, all tests pre-v1.4
```

---

## 5.2 (corrected, cumulative) `QuarantineReason` closed vocabulary

File: `backend/src/TerraFusion.Core/Entities/SyncBridge/QuarantineReasons.cs`

```csharp
public static class QuarantineReasons
{
    public const string NoParcelXref     = "NO_PARCEL_XREF";
    public const string NoOwnerXref      = "NO_OWNER_XREF";
    public const string BothMissing      = "BOTH_MISSING";
    public const string UnknownAttribute = "UNKNOWN_ATTRIBUTE";

    public static IReadOnlySet<string> All { get; }
    public static bool IsKnown(string value);
}
```

### Frozen vocabulary (v1.4)

| Value | Emitted by | Since |
|---|---|---|
| `NO_PARCEL_XREF` | S3 / B3 / B4 / C3 / L3 — every canonical projector | v1.0 (correctly documented) |
| `NO_OWNER_XREF` | B4 only (Wsdor — owner_id fails to resolve) | v1.0 (was undocumented) |
| `BOTH_MISSING` | B4 only (Wsdor — neither parcel nor owner resolves) | v1.0 (was undocumented) |
| `UNKNOWN_ATTRIBUTE` | (none yet — reserved for E4b) | v1.4 (new) |

Adding a new value requires a v1.5+ minor bump. There is no
runtime extensibility hook by design.

### Explicitly NOT in the vocabulary

The following strings appeared in entity XML doc comments before
v1.4 but were never emitted in production code. v1.4 removes
these references and excludes them from the closed vocab:

```text
"AMBIGUOUS_PARCEL_XREF"   (aspirational — never emitted)
"PARCEL_XREF_INACTIVE"    (aspirational — never emitted)
```

`QuarantineReasons.IsKnown` returns `false` for both. If a future
projector slice needs these distinctions, they can be added with
their own minor bump and corresponding implementation.

### Producer-side rule (v1.4)

Every code path that writes to a `legacy_tf_unproven.*.QuarantineReason`
column MUST reference a `QuarantineReasons.*` constant. String
literals are a doctrine violation. The v1.4 refactor removed all
remaining literals from production projectors; future projectors
must follow the same pattern.

Test code MAY use string literals when asserting behavior — the
test is checking the actual value emitted, not the constant
identifier, and a naked literal makes the test more honest about
what's being verified.

---

## 6. Why this is `v1.4` and not a v1.0 errata

Three reasons:

1. **Forward-only versioning.** The v1.0 doc remains as it was
   published — historians can see the original incomplete claim.
   v1.4 supersedes it. Editing v1.0 in place would erase the
   audit trail.
2. **No emitted-value change.** Production projectors emitted
   the same three values before and after v1.4. No consumer of
   v1.0 was relying on a vocabulary the doctrine claimed —
   they were either reading the actual emitted values or relying
   on `IsKnown()` (which didn't exist). Therefore: still
   strictly additive at the contract level.
3. **Versioning policy stays clean.** Option (b) of the
   versioning rule says minor bumps are for additive changes.
   This is additive — newly-disclosed truth is a strict
   superset of previously-disclosed truth. Calling it v2 would
   imply a breaking change where there is none.

---

## 7. v1.4 doctrine frog status

> The doctrine frog bit its own author. The team owned it. The
> contract is now honest.
>
> Block E remaining: **E4b** wires the C3 / L3 projector code
> path that resolves PACS i_attr_id → canonical AttributeId,
> falling through to the `UNKNOWN_ATTRIBUTE` quarantine when
> no canonical row exists. After E4b, Block E closes and Block
> D (ArcGIS-only GIS lane) begins.
