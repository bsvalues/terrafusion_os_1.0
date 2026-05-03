# Block-C Contract — v1.1 (Additive Addendum)

**Status:** binding doctrine. Version `v1.1`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.md` (v1, 2026-05-02).
**Layer:** 3.5 of the PACS doctrine stack — same layer as v1; v1.1
is an additive minor bump.

```text
docs/pacs/block-c-contract-v1.md             (v1   — base freeze)
docs/pacs/block-c-contract-v1.1.md           (v1.1 — additive addendum) ← this doc
```

## 0. Versioning rule applied

Per option (b) of the post-Block-C versioning policy ratified
2026-05-02:

> **Minor version bumps (`v1.1`, `v1.2`, …) are reserved for
> strictly additive changes** — new entities, new closed-vocabulary
> values, new optional columns. Anything that would break a
> consumer of `v1` requires a **major bump** (`v2`).

This addendum adds **one new entity** and **zero changes to any
v1-frozen shape**. Therefore: `v1.1`, not `v2`.

The H2 schema-shape regression test (`BlockCContractV1Tests`)
adds the v1.1 assertions inline rather than forking the test
class, since v1.1 is a strict superset of v1.

---

## 1. What changed since v1

```text
ADDED:
  + canonical_tf.dict_neighborhood   (new entity, see §3.7)
  + DbSet<DictNeighborhood>          (named DictNeighborhoods)
  + Migration AddDictNeighborhood    (also closes the tf_land
                                      schema gap from pre-H3 fix)

UNCHANGED FROM v1:
  · 5-schema contract                 (§1)
  · sync_bridge.source_xref shape     (§2.1)
  · sync_bridge.promotion_gate_result shape + closed vocabs (§2.2)
  · sync_bridge.load_batch shape      (§2.3)
  · SourceFamilies vocabulary         (§2.4)
  · canonical_tf.tf_parcel            (§3.1)
  · canonical_tf.tf_sale              (§3.2)
  · canonical_tf.tf_improvement       (§3.3)
  · canonical_tf.tf_improvement_feature (§3.4)
  · canonical_tf.tf_land              (§3.5)
  · TfEntityType vocabulary           (§3.6)
  · truth_pacs.* lane shapes          (§4)
  · legacy_tf_unproven.* quarantine   (§5)
  · QuarantineReason vocabulary       (§5.2 — still NO_PARCEL_XREF only)
  · 5-gate canonical-projector pattern (§6)
```

No consumer of v1 should observe any behavior change. Anything
relying on a v1 shape continues to work unchanged.

---

## 3.7 `canonical_tf.dict_neighborhood` (new in v1.1)

File: `backend/src/TerraFusion.Core/Entities/CanonicalTf/DictNeighborhood.cs`

The first canonical dictionary table. Locks the `hood_cd` domain
(neighborhood / market-area code) recognized by the operator.
Downstream slices in Block F (operator dashboard panels —
specifically F5 ratio-study skeleton) and post-90-day Benton
Method calibration loops will dereference this dictionary.

```csharp
public sealed class DictNeighborhood
{
    public Guid DictNeighborhoodId { get; set; }
    public Guid CountyId { get; set; }                 // sovereign isolation
    public string HoodCd { get; set; }                 // varchar(10), required
    public string? HoodName { get; set; }              // varchar(200)
    public string? HoodDescription { get; set; }       // varchar(1000)
    public string? HoodGroupCd { get; set; }           // varchar(20) — URBAN|RURAL|AG|...
    public bool IsActive { get; set; } = true;
    public Guid LoadBatchId { get; set; }              // provenance — required
    public string SourceQueryHash { get; set; }        // varchar(64), required
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### Frozen invariants

- **Sovereign-county isolation:** `(CountyId, HoodCd)` is the
  unique natural key. The same `HoodCd` may exist in multiple
  counties with different meanings; cross-county joins on
  `HoodCd` alone are a doctrine violation.
- **Provenance required:** every row carries `LoadBatchId` +
  `SourceQueryHash` matching the SourceFamilies / load_batch
  contract from v1 §2.3-2.4.
- **No hard delete:** rows are retired via `IsActive = false`,
  never `DELETE FROM`. Historical references (pre-2017
  conversion-era data, retroactive sales / valuations) must
  continue to resolve.
- **`HoodCd` length cap:** `varchar(10)` — chosen to fit Benton's
  longest hood codes plus headroom for other counties; tighter
  caps risk silent truncation on import.

### Frozen indexes

```text
ux_dict_neighborhood_county_hoodcd   UNIQUE (CountyId, HoodCd)
ix_dict_neighborhood_county_active   (CountyId, IsActive)        — active-codes lookup
ix_dict_neighborhood_county_group    (CountyId, HoodGroupCd)     — ratio-study scan
ix_dict_neighborhood_load_batch      (LoadBatchId)               — provenance lookup
```

### What v1.1 explicitly does NOT do

- **No projector consumes this dictionary yet.** The
  closed-vocabulary quarantine path (`UNKNOWN_NEIGHBORHOOD` in
  `legacy_tf_unproven.*`) is deferred to a future slice that
  wires a `hood_cd`-aware projector. v1.1 is a schema lock, not
  a runtime gate.
- **No new `QuarantineReason` value added.** `NO_PARCEL_XREF`
  remains the only frozen reason. The v1.2 (or v2) bump that
  introduces a hood_cd-aware projector will add
  `UNKNOWN_NEIGHBORHOOD` at that time.
- **No new `TfEntityType` value added.** Dictionary rows are not
  canonical entities in the `source_xref` sense — they are
  reference data, not lineage-tracked TerraFusion identities.
- **No write to existing tables.** `tf_improvement.*`,
  `tf_land.*`, `tf_parcel.*` are unchanged. E3 will later wire
  FKs onto `attribute_definition` (E2); no FK from those tables
  onto `dict_neighborhood` exists in v1.1.

### Migration name

```text
20260503033812_AddDictNeighborhood
```

Note: this single migration also creates the `tf_land` +
`legacy_tf_unproven.land_current` tables. Those entities were
committed in the pre-H3 fix (`0415df46a`) but had no migration
of their own at the time. The H3 commit message and the
`AddDictNeighborhood` migration body call this out. Future
contract regression tests treat `AddDictNeighborhood` as the
canonical migration name for both the dict-neighborhood land
and the L3 schema scaffold.

---

## 4. Versioning rule (re-affirmed)

Future additive changes follow the same pattern: publish
`block-c-contract-vN.M.md` referencing `vN.M-1`, list what's
added, restate that nothing v1-frozen changed.

A breaking change — modifying any v1 column, removing any
closed-vocab value, renaming any DbSet, etc — requires `v2.0.0`
and **explicit consumer migration guidance**. v1 → v2 is a
co-founder-status-report event, not a quiet bump.

---

## 5. The doctrine frog (v1.1 status)

> The doctrine frog now sits, has teeth, replays — and as of
> v1.1, recognizes its first dictionary code domain. The next
> additive bump (v1.2) will introduce `attribute_definition`
> (E2), the i_attr_id mapping spine.
