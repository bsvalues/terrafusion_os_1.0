# Readback Defect F1 — Parcel-Identity Fork: Root-Cause Trace

_Date: 2026-06-08 · Read-only trace (no mutation, no schema change, no drain). Follows the readback
results `benton-current-year-production-readback-results.md`._

## Conclusion (evidenced)

Land, improvement, and geometry canonical rows are projected against a **prior parcel-identity
generation** whose `TfParcelId` values are now absent from both `canonical_tf.tf_parcel` and
`sync_bridge.source_xref`. The current identity used by every other surface is a **different,
83,326-parcel** generation. The two populations are disjoint — hence the empty land/improvement/
geometry cards on all six readback parcels.

This is a **projection / identity-wiring** defect (cross-lane identity drift), **not** a data-seal
failure: the land/improvement/geometry data exists and was sealed within its own (now-orphaned)
identity space, and the prop_id-keyed landing/truth sources are intact.

## Evidence

**Current identity = 83,326, internally consistent:**
```
source_xref parcel (active)      = 83,326   (inactive = 0)
truth_pacs.parcel_spine          = 83,326
assessment distinct parcels      = 83,326
xref ⊆ tf_parcel                 = 83,326   (all active xref are tf_parcel rows)
```

**Orphaned lanes — disjoint identity:**
```
tf_land distinct parcels         = 82,012   → in tf_parcel: 0 · in any source_xref: 0
tf_improvement distinct parcels  = 71,440
tf_parcel_geom distinct parcels  = 79,096
```
No land `TfParcelId` appears in `tf_parcel` (any of its 3.2M rows) or in `source_xref` (active **or**
inactive — there are 0 inactive). The references are dangling, not merely deactivated.

**`tf_parcel` inflation (F2):** 3,198,979 rows / 3,198,949 distinct `ParcelNumber`; only the 83,326
live ones match the spine. ~3.1M are stale prior-generation debris (does not affect current
resolution, which goes through `source_xref`).

**Re-projection feasibility (the repair lever):**
- `tf_land` / `tf_improvement` carry **no natural key** (only the dead `TfParcelId`) → cannot be
  guid-crosswalked. BUT their sources are intact and **prop_id-keyed**:
  `legacy_pacs_raw.land_detail` (PropId, PropValYr, SupNum, LandSegId, …), `truth_pacs.land_current`,
  `legacy_pacs_raw.imprv_detail` (PropId, ImprvId, ImprvDetId, …). So they are **re-projectable** onto
  the current spine **without re-draining PACS**.
- `tf_parcel_geom` carries `ArcGisApn` (char-padded) → crosswalks to `parcel_spine.GeoId` after TRIM
  (11,420 match even untrimmed; expect far more trimmed). Geometry is **crosswalkable**, no re-drain.

## What is NOT yet proven

The exact historical event that orphaned the lanes (which migration/when re-keyed `tf_parcel`).
Structurally the orphaning is certain; the precise trigger is a hypothesis (an identity-repair /
renumber — `tf_parcel.IdentityRepairReceiptId` exists, `backup.arcgis_wave1_*_identity_20260527…`
snapshots exist). Not required for the repair, but worth confirming before pruning `tf_parcel` (F2).

## Repair options (for decision — NOT executed)

| Option | Land | Improvement | Geometry | Verdict |
|---|---|---|---|---|
| **A. Re-project from truth/landing onto current spine** (prop_id → parcel_spine/source_xref) | ✅ from `truth_pacs.land_current` / `legacy_pacs_raw.land_detail` | ✅ from `legacy_pacs_raw.imprv_detail` | ✅ or by GeoId crosswalk | **Recommended** — robust, re-keys to live identity, no PACS re-drain |
| B. Guid/APN crosswalk in place | ❌ no natural key on canonical rows | ❌ no natural key | ⚠️ possible (APN→GeoId) | Geometry-only; insufficient for land/improvement |

**Recommended repair (requires explicit go — mutation of canonical land/improvement/geometry):**
re-run the land / improvement / geometry **projection** step, resolving parcels via the current
`source_xref → parcel_spine` identity (prop_id-keyed), replacing the orphaned canonical rows. This is
a projection re-key, not a drain reopen — `legacy_pacs_raw` and `truth_pacs` sources are untouched.
Prerequisite: confirm the land/improvement/geometry projector services resolve via the current
identity (they likely predate it and used the old parcel resolution — that wiring is the actual fix).

F2 (`tf_parcel` debris pruning) is a separate, lower-urgency cleanup; do not prune until the F1
re-projection is complete and the live 83,326 identity is confirmed sole-survivor-safe.

## Boundary

Trace is read-only. No mutation performed. The repair (Option A) mutates sealed canonical
land/improvement/geometry tables and must not start without explicit go. Revenue / assessment /
exemption / jurisdiction lanes are unaffected by this defect and remain sealed.
