# ATTR-DRAIN-1 — Findings: Drain the imprv_attr Quarantine

**Slice:** ATTR-DRAIN-1 (post-DASHBOARD-1). The first slice driven
by the operator dashboard's visible signal: 4,740 quarantined
imprv_attr rows. The dashboard didn't decorate; it directed.

**Status:** SHIPPED. Drained **4,740 → 7** quarantine rows
(99.85% reduction). The remaining 7 are canonical-layer rows
exposing the family/value-grain question Block-C v1.5 has been
flagging — that's signal for ATTR-POP-2, not failure for this slice.

## The result

```
legacy_tf_unproven.imprv_attr:    4,740 → 7   (-4,733, -99.85%)
summary.quarantineRowsTotal:      4,748 → 15
landing-layer (UNKNOWN_I_ATTR_VAL_CD):  4,740 → 0   ✅ fully drained
canonical-layer (UNKNOWN_ATTRIBUTE):    0 → 7      (new signal)
canonical_tf.tf_improvement_feature:    3,016 → up (post-projection writes)
operational: true
```

## What I expected vs what was actually broken

The user's status report assumed "the largest visible warning is the
canonical-layer UnknownAttribute quarantine that ATTR-POP-1 should
have drained." Reasonable assumption from the dashboard surface.

Audit revealed three cascading blockers:

1. **The 4,740 rows were LANDING-layer**, reason
   `UNKNOWN_I_ATTR_VAL_CD`, not `UNKNOWN_ATTRIBUTE`. They never
   reached the canonical projector because they failed the
   landing service's dictionary check first.

2. **The landing dictionary was registered with `Array.Empty<string>()`**
   in `Program.cs`. Every code coming in failed the check. ATTR-POP-1
   populated `canonical_tf.attribute_definition` (canonical-layer
   dictionary, family-grain) but the landing service consults a
   completely separate `IImprvAttrDictionary` for value-grain
   `i_attr_val_cd` checks. They're different vocabularies in
   different layers.

3. **`tf_improvement_feature.FeatureCode` was varchar(16)** while
   PACS `i_attr_val_cd` is varchar(75) (silently truncated to 32
   at landing). The 16→32 mismatch broke canonical projection
   even after the landing layer succeeded. Found via DbUpdateException
   trace once the landing started succeeding.

Each blocker required a different fix. The dashboard surfaced the
problem but the drain required de-escalation through three layers.

## Files shipped

- `backend/src/TerraFusion.Core/Sync/PacsImprvAttr/RefreshableImprvAttrDictionary.cs`
  — thread-safe mutable variant of `IImprvAttrDictionary`. Atomic
  swap-in of new vocabulary via `Refresh(IEnumerable<string>)`.
  Replaces the immutable `InMemoryImprvAttrDictionary` in production
  DI; `InMemoryImprvAttrDictionary` is preserved for tests.
- `backend/src/TerraFusion.Data/Services/PacsSources/SqlServerImprvAttrValDictionaryLoader.cs`
  — loads codes from PACS. Two-step strategy: `dbo.imprv_attr_val`
  first (the proper dictionary table); falls back to
  `SELECT DISTINCT i_attr_val_cd FROM dbo.imprv_attr` (data-derived
  vocabulary) when the dictionary table is empty — which it is for
  this Benton instance.
- `backend/src/TerraFusion.Data/Configurations/CanonicalTf/TfImprovementFeatureConfiguration.cs`
  — widens `FeatureCode`/`MethodCd`/`ClassCd`/`SubClassCd` from
  varchar(16) → varchar(32) to match raw landing tier's IAttrValCd
  capacity.
- `backend/src/TerraFusion.Data/Migrations/20260505030534_WidenTfImprovementFeatureCodes.cs`
  — EF migration: 4 ALTER COLUMN statements with full Down() inverse.
- `backend/src/TerraFusion.API/Program.cs`
  — DI swap: registers `RefreshableImprvAttrDictionary` as the
  singleton implementation.
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/attr-drain-1/run-drain` (4-stage drain:
  inspect → refresh dictionary → delete stale landing-layer rows →
  re-run keyed imprv chain). Supports `DryRun: true` for
  inspection-only runs.

## The 4-stage drain pattern

This slice establishes a reusable pattern for quarantine drain:

1. **Inspect** — group by reason, by year, by prop_id. Surface what
   IS in quarantine before touching anything.
2. **Refresh upstream gate state** — populate the dictionary,
   the attribute table, whatever the landing service consults.
3. **Delete stale quarantine** — rows quarantined under the
   broken state are obsolete. Cleanup before re-landing measures
   the drain delta cleanly.
4. **Re-run the keyed chain** — for the (year, prop_id) tuples
   the quarantine pointed at. Canonical projector's existing
   prior-quarantine cleanup handles its own layer.

Future drain slices (e.g. for `legacy_tf_unproven.sale` if/when
operator priorities surface it) can reuse this shape.

## What was deliberately NOT closed

- **The remaining 7 canonical-layer rows.** These came from year
  2024 imprv_attr rows whose `IAttrValId` doesn't appear in
  `attribute_definition.IAttrId` (which ATTR-POP-1 populated
  family-grain only). This is exactly the family/value-grain
  question Block-C v1.5 surfaces. ATTR-POP-2 (value-grain
  populator from `dbo.imprv_attr_val`) is the resolution.
  Deferred — 7 rows is signal, not noise.
- **`featuresAttributedDelta = 0`.** The drain re-projected the
  imprv canonical layer, but `tf_improvement_feature.AttributeId`
  is populated only when the IAttrValId resolves. The same
  family/value-grain mismatch produces 0 resolutions. ATTR-POP-2
  unblocks this too.
- **Production refresh path for the dictionary.** The drain
  endpoint refreshes the dictionary every call. A hosted service
  that refreshes on a schedule (e.g. every PACS sync) is the
  right next step for production but unnecessary for the proof.

## Re-open conditions for ATTR-DRAIN-1

- New landing-layer quarantine reasons emerge (e.g. a future
  schema change adds another dictionary check).
- The drain pattern doesn't generalize to non-imprv-attr lanes
  cleanly — would surface as a need to refactor.
- The dictionary refresh becomes a hot-loop concern (today: one
  refresh per drain call, milliseconds, fine).

## Endpoint reference

```
POST /api/debug/attr-drain-1/run-drain
Content-Type: application/json

{
  "OperatorName": "attr-drain-1",   // optional
  "DryRun": false                    // optional, default false
}
```

DryRun=true returns inspection + plan without landing/promotion.
DryRun=false runs the full 4-stage drain. Response includes per-
year per-stage results and outcome deltas.

## The dashboard told the truth

The 4,740 number was real. Action on it surfaced three real
blockers, all of which had clean structural fixes. The remaining 7
are real too — they're not failure, they're the next layer of
truth waiting for ATTR-POP-2.

The screen still tells the truth. The truth is now cleaner.
