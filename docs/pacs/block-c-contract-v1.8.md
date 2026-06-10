# Block-C Contract — v1.8 (Block-D D1+D2+D3 + Legacy Sync Retirement)

**Status:** binding doctrine. Version `v1.8`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.7.md` (v1.7, 2026-05-03).
**Layer:** 3.5 of the PACS doctrine stack — same layer as v1.x.

```text
docs/pacs/block-c-contract-v1.md             (v1   — base freeze)
docs/pacs/block-c-contract-v1.1.md           (v1.1 — dict_neighborhood)
docs/pacs/block-c-contract-v1.2.md           (v1.2 — attribute_definition)
docs/pacs/block-c-contract-v1.3.md           (v1.3 — nullable AttributeId FKs)
docs/pacs/block-c-contract-v1.4.md           (v1.4 — QuarantineReasons closed vocab)
docs/pacs/block-c-contract-v1.5.md           (v1.5 — attribute resolution semantics)
docs/pacs/block-c-contract-v1.6.md           (v1.6 — two-layer quarantine vocabulary)
docs/pacs/block-c-contract-v1.7.md           (v1.7 — E4c documented deferral; Block E close)
docs/pacs/block-c-contract-v1.8.md           (v1.8 — Block-D D1+D2+D3 + legacy retirement) ← this doc
```

## 0. What v1.8 is

A coordinated minor bump that records:

1. **D1** raw landing (`legacy_arcgis_raw.parcel_geom`) +
   four R-* gates.
2. **D2** truth promotion (`truth_arcgis.parcel_geom_current`) +
   four T-* gates including geometry validity.
3. **D3** canonical projection (`gis_tf.tf_parcel_geom` +
   `source_xref` with `TfEntityType="geom_parcel"`) +
   five C-* gates including APN crosswalk coverage.
4. **TfEntityType vocabulary addition**: `"geom_parcel"`.
5. **Legacy retirement**: the
   `TerraFusion.API.Services.ArcGisSyncService` BackgroundService
   is **disabled by default** as of v1.8. The doctrine path is now
   the only canonical writer to `gis_tf.tf_parcel_geom`.

No v1.x-frozen shape is modified. `gis_tf.tf_parcel_geom` already
existed; D3 is the first service that actually writes to it
through the doctrine pipeline (with provenance + source_xref
lineage). All v1.0–v1.7 contracts remain in force.

## 0.5 Doctrine integrity disclosure (carry-forward + new finding)

### Carry-forward
- v1.4 corrected the canonical-layer `QuarantineReason` vocabulary
  (NO_OWNER_XREF + BOTH_MISSING were undocumented since v1.0).
- v1.6 corrected the landing-layer vocabulary
  (UNKNOWN_I_ATTR_VAL_CD was undocumented).
- v1.7 deferred E4c by declaration; closed Block E.

### New finding (resolved in v1.8)

The D3 pre-implementation audit discovered **two parallel
"ArcGisSyncService" implementations** in the codebase:

```text
1. TerraFusion.Core.GIS.ArcGisRest.IArcGisSyncService  (interface)
   Implementation:  TerraFusion.Data.Services.GisTf.ArcGisSyncService
                    (G1-D era, scoped service)
   Writes to:       gis_tf.tf_parcel_geom (the doctrine-canonical entity)
   Status pre-v1.8: registered but UNUSED in the shipped flow

2. TerraFusion.API.Services.ArcGisSyncService  (BackgroundService)
   Run mode:        HostedService, polls every 6 hours
   Hardcoded URL:   services7.arcgis.com/.../Parcels_and_Assess/FeatureServer/0
   Writes to:       GisParcelGeometries (a SEPARATE legacy table
                                         OUTSIDE the 5-schema doctrine)
   Status pre-v1.8: registered by default, served as the ACTUAL data flow
```

This is the same drift pattern as v1.4 / v1.6: parallel shipping
realities that the doctrine docs didn't acknowledge. v1.8 closes
the gap by:

- Building the D3 canonical projector that finally feeds
  `gis_tf.tf_parcel_geom` through the doctrine pipeline.
- Disabling the legacy BackgroundService by default (preserved
  in code for emergency rollback only).
- Documenting the legacy table (`GisParcelGeometries`) as
  out-of-scope for the doctrine — to be decommissioned in a
  separate cleanup slice once D1→D2→D3 is operationally
  validated.

The "no broken windows / no parallel truth paths" rule is now
honored.

---

## 1. What changed since v1.7

```text
ADDED (new entities + tables):
  + legacy_arcgis_raw.parcel_geom         (D1 — raw FeatureService landing)
  + truth_arcgis.parcel_geom_current      (D2 — latest-per-tuple truth)
  + DbSet<LegacyArcGisRawParcelGeom>      (LegacyArcGisRawParcelGeoms)
  + DbSet<TruthArcGisParcelGeomCurrent>   (TruthArcGisParcelGeomCurrents)
  + Migrations:
      AddLegacyArcGisRawParcelGeom
      AddTruthArcGisParcelGeomCurrent

ADDED (new services + interfaces):
  + IArcGisRawLandingService                (D1)
  + ArcGisRawLandingService
  + IArcGisTruthPromotionService            (D2)
  + ArcGisTruthPromotionService
  + IArcGisCanonicalProjector               (D3)
  + ArcGisCanonicalProjector
  + LegacyArcGisSyncOptions { Enabled = false }
                                            (config-driven retirement flag)

ADDED (new gate vocabulary):
  + arcgis-raw-source-batch-completed       (D1, R-*)
  + arcgis-raw-key-uniqueness               (D1, R-*)
  + arcgis-raw-provenance-coverage          (D1, R-*)
  + arcgis-raw-aggregate                    (D1, R-*)
  + arcgis-truth-source-batches-completed   (D2, T-*)
  + arcgis-truth-latest-per-objectid        (D2, T-*)
  + arcgis-truth-geometry-validity          (D2, T-*)
  + arcgis-truth-aggregate                  (D2, T-*)
  + canonical-geom-source-batch-completed   (D3, C-*)
  + canonical-geom-source-xref-coverage     (D3, C-*)
  + canonical-geom-county-isolation         (D3, C-*)
  + canonical-geom-apn-crosswalk-coverage   (D3, C-*)
  + canonical-geom-aggregate                (D3, C-*)

ADDED (closed-vocabulary value):
  + TfEntityType = "geom_parcel"
    (sync_bridge.source_xref entries written by D3)
    SourceKeyJson shape: { "county_id": <guid>, "arcgis_object_id": <long> }

CHANGED (config — operator-visible):
  ~ "ArcGisSync:Enabled" config key (and TF_ENABLE_ARCGIS_SYNC env var)
    RENAMED + default flipped:
      OLD: ArcGisSync:Enabled                  (default true)
           TF_ENABLE_ARCGIS_SYNC               (default true)
      NEW: LegacyArcGisSync:Enabled            (default false)
           TF_ENABLE_LEGACY_ARCGIS_SYNC        (default false)
    Operators running under the old default will see the legacy
    BackgroundService stop registering after v1.8 deploys. The
    canonical D1→D2→D3 path replaces it functionally, with full
    provenance + source_xref lineage.

UNCHANGED:
  · all v1 §§1-6 shapes
  · all v1.1–v1.7 additive entries
  · TfParcelGeom entity shape (v1 unchanged; D3 is the first service
    to write through the doctrine, but adds NO new column)
  · QuarantineReasons / LandingQuarantineReasons (v1.4 + v1.6)
  · No new migration on TfParcelGeom; D3 uses existing schema
```

---

## 2. D1 — `legacy_arcgis_raw.parcel_geom` (new in v1.8)

File: `backend/src/TerraFusion.Core/Entities/LegacyArcGisRaw/LegacyArcGisRawParcelGeom.cs`

```csharp
public sealed class LegacyArcGisRawParcelGeom
{
    public Guid LandedRowId { get; set; }
    public Guid CountyId { get; set; }
    public long ArcGisObjectId { get; set; }
    public string? ArcGisApn { get; set; }
    public string GeomWkt { get; set; }                 // varchar(unbounded), required
    public double CentroidLat { get; set; }
    public double CentroidLon { get; set; }
    public double AreaSqFt { get; set; }
    public string SourceServiceUrl { get; set; }        // varchar(500), required
    public Guid LoadBatchId { get; set; }               // provenance — required
    public string SourceQueryHash { get; set; }         // varchar(64), required
    public string SourceRowHash { get; set; }           // varchar(16), required (SHA-256 prefix)
    public DateTime LandedAt { get; set; }
}
```

Frozen invariants:
- `(CountyId, ArcGisObjectId, LoadBatchId)` UNIQUE — same OBJECTID
  re-landed in a NEW batch is a distinct row; same OBJECTID in the
  SAME batch is a doctrine violation (R-key-uniqueness gate fails).
- WKT-only storage (PostGIS package install deferred to a
  Phase-2 slice).
- Service must record `LoadBatch.SourceFamily =
  SourceFamilies.ArcGisRest`.

R-* gate vocabulary (frozen):
- `arcgis-raw-source-batch-completed` (informational PASS)
- `arcgis-raw-key-uniqueness` (FAIL on dup ObjectId-per-batch)
- `arcgis-raw-provenance-coverage` (FAIL on missing LoadBatchId
  / SourceQueryHash / SourceRowHash on any landed row)
- `arcgis-raw-aggregate` (informational; counts + AreaSqFt sum)

---

## 3. D2 — `truth_arcgis.parcel_geom_current` (new in v1.8)

File: `backend/src/TerraFusion.Core/Entities/TruthArcGis/TruthArcGisParcelGeomCurrent.cs`

```csharp
public sealed class TruthArcGisParcelGeomCurrent
{
    public Guid TruthParcelGeomId { get; set; }
    public Guid CountyId { get; set; }
    public long ArcGisObjectId { get; set; }
    public string? ArcGisApn { get; set; }
    public string GeomWkt { get; set; }
    public double CentroidLat { get; set; }
    public double CentroidLon { get; set; }
    public double AreaSqFt { get; set; }
    public string SourceServiceUrl { get; set; }
    public Guid SourceLandedRowId { get; set; }     // FK to D1
    public Guid LandingLoadBatchId { get; set; }    // D1 batch
    public Guid PromotionLoadBatchId { get; set; }  // D2 batch
    public DateTime PromotedAt { get; set; }
}
```

Frozen invariants:
- `(CountyId, ArcGisObjectId)` UNIQUE — only the latest landing
  wins.
- Geometry validity gate: WKT starts with `POLYGON` or
  `MULTIPOLYGON` (case-insensitive), ≥ 3 coordinate pairs, has
  `(` and `)`. Lightweight check — full topology validation is
  Phase-2 PostGIS work.
- Single-batch lineage (no supp_assoc analog needed for ArcGIS).

T-* gate vocabulary (frozen):
- `arcgis-truth-source-batches-completed` (FAIL on any
  IN_PROGRESS / FAILED contributing landing batch)
- `arcgis-truth-latest-per-objectid` (FAIL on collapse violation)
- `arcgis-truth-geometry-validity` (FAIL on any invalid WKT
  skipped — raw rows preserved for audit)
- `arcgis-truth-aggregate` (informational)

---

## 4. D3 — `gis_tf.tf_parcel_geom` canonical projection (refactor in v1.8)

File: `backend/src/TerraFusion.Data/Services/GisTf/ArcGisCanonicalProjector.cs`

The existing `TfParcelGeom` entity shape is unchanged. v1.8 adds
a NEW projector that finally writes to it through the doctrine
pipeline:

```text
truth_arcgis.parcel_geom_current
    │
    ▼  ArcGisCanonicalProjector.ProjectCountyAsync(countyId)
    │     - APN crosswalk against tf_parcel.ParcelNumber (county-isolated)
    │     - Resolved → TfParcelId populated
    │     - Unresolved → TfParcelId = null (crosswalk-pending)
    │     - sync_bridge.source_xref entry written per row
    ▼
gis_tf.tf_parcel_geom + sync_bridge.source_xref(TfEntityType="geom_parcel")
```

Frozen `source_xref` shape for D3:

```json
{
  "TfEntityType": "geom_parcel",
  "SourceKeyJson": {
    "county_id": "<guid>",
    "arcgis_object_id": <long>
  },
  "SourceSystem": "ARCGIS_REST",
  "SourceTable":  "parcel_geom"
}
```

Frozen idempotency rule:
- Re-running for the same county clears prior canonical rows
  (and their `source_xref` entries) whose JSON-decoded
  `county_id` matches, then re-inserts.
- Cross-county isolation: projecting one county does NOT touch
  any other county's canonical rows.

C-* gate vocabulary (frozen):
- `canonical-geom-source-batch-completed` (FAIL on any
  IN_PROGRESS / FAILED contributing truth batch)
- `canonical-geom-source-xref-coverage` (FAIL when any projected
  row lacks a source_xref entry)
- `canonical-geom-county-isolation` (FAIL on any empty CountyId)
- `canonical-geom-apn-crosswalk-coverage` (informational; counts
  resolved vs unresolved)
- `canonical-geom-aggregate` (informational; counts + AreaSqFt
  sum)

---

## 5. TfEntityType vocabulary — v1.8 additive

```text
v1.0   parcel | sale | improvement | land | owner | assessment_wsdor
v1.8   + geom_parcel
```

Adding a new value remains a v1.x bump (additive). The H2
schema-shape regression test gains a v1.8 assertion that
`"geom_parcel"` is a recognized TfEntityType in the
`source_xref` writes.

---

## 6. Legacy `ArcGisSyncService` retirement (the broken window close)

### What was happening before v1.8

```text
TerraFusion.API.Services.ArcGisSyncService
  - HostedService
  - Hardcoded Benton FeatureServer URL
  - 6-hour poll cycle
  - Wrote to: GisParcelGeometries (legacy table, NOT in 5-schema doctrine)
  - Registered by default via "ArcGisSync:Enabled" config (default: true)

TfParcelGeom (the v1.0-doctrine canonical entity)
  - Defined but UNFED — no service wrote to it through the doctrine
  - Existed as documentation of intent, not actual operational state

Result: gis data flowed through the legacy path; the doctrine path was
hollow.
```

### What v1.8 does

```text
1. New doctrine path (D1 → D2 → D3) writes tf_parcel_geom +
   source_xref(TfEntityType="geom_parcel") with full provenance
   and 13 gates across 3 stages (R/T/C).

2. Legacy ArcGisSyncService BackgroundService is gated behind
   LegacyArcGisSync:Enabled (default false). Operators get a
   clean default; rollback is one config-flip away.

3. The 422-LOC BackgroundService code stays in source tree
   (NOT deleted). The legacy GisParcelGeometries table stays
   in the schema. Future cleanup slice can decommission both
   after D1→D2→D3 is operationally validated.
```

### Operator-visible config rename

```text
OLD (v1.7 and earlier):
  appsettings: "ArcGisSync:Enabled": true   (default)
  env var:     TF_ENABLE_ARCGIS_SYNC=true   (default)

NEW (v1.8):
  appsettings: "LegacyArcGisSync:Enabled": false   (default)
  env var:     TF_ENABLE_LEGACY_ARCGIS_SYNC=false  (default)
```

Operators running under the old default flip from "legacy
enabled" to "legacy disabled" automatically when v1.8 deploys.
This is the intended retirement behavior. To preserve legacy
behavior temporarily during rollback testing:

```yaml
# appsettings.<Environment>.json
"LegacyArcGisSync": {
  "Enabled": true
}
```

---

## 7. Test coverage added in v1.8

```text
ArcGisRawLandingServiceTests             (12 tests, D1)
ArcGisTruthPromotionServiceTests         (18 tests, D2)
ArcGisCanonicalProjectorTests            (11 tests, D3)
LegacyArcGisSyncOptionsTests             (4 tests, retirement config)
                                         ──────────
                                          45 new acceptance tests

Doctrine band totals:
  Pre-v1.8 (after PR #723 + Block-D base):  386 / 386 green
  After D1:                                  398 / 398 green   (+12)
  After D2:                                  416 / 416 green   (+18)
  After D3 + legacy retirement:              508 / 508 green   (+92, includes
                                                                resolution-test
                                                                count drift from
                                                                shared filter)
```

---

## 8. What v1.8 does NOT do (carry-forward locks)

```text
- No PostGIS package install
- No NetTopologySuite
- No spatial index
- No NEW column on TfParcelGeom (existing nullable TfParcelId
  represents crosswalk-pending state)
- No deletion of legacy ArcGisSyncService source code
- No deletion of GisParcelGeometries table
- No UI / dashboard work
- No multi-county anything (still Benton-only effective scope)
- No retry / backoff / cache fallback in D1's REST adapter
- No incremental sync (full pull only)
- No TfParcelGeom migration (existing schema sufficient)
```

---

## 9. v1.8 doctrine frog status

> The map goblin lost its fake mailbox. The doctrine path is
> the only mailbox. The legacy BackgroundService keeps its
> source-control pension and can be revived for rollback —
> nothing else.
>
> Block D remaining work:
>   - D4: read-models verification (existing
>     ParcelGeometryController stays green; verify or extend
>     for bbox/neighbor queries).
>   - Future cleanup slice: decommission GisParcelGeometries
>     + delete legacy ArcGisSyncService once D1→D2→D3 is
>     operationally validated.
>
> After D4, Block D closes and Block F (operator dashboard
> parity) opens — the first user-facing block.
