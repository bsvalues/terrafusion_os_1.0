# Block D — Execution Plan (D0 Reconciliation)

**Status:** binding execution plan. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.7.md` (Block E close).
**Layer:** 4 of the PACS doctrine stack — same layer as
`blocks-d-through-h-design.md`, this doc supersedes that doc's
§D content with reality-aligned guidance.

```text
docs/pacs/blocks-d-through-h-design.md       (Layer 4 — original H1 plan; §D superseded by this doc)
docs/pacs/block-c-contract-v1.md...v1.7.md   (Layer 3.5 — Block-C frozen contracts)
docs/pacs/block-d-execution-plan.md          (Layer 4 — Block D specifics) ← this doc
```

## 0. Why this doc exists

The H1 doctrine doc (`blocks-d-through-h-design.md` §D) treated
Block D as virgin territory. The pre-D framing audit performed
2026-05-03 discovered substantial pre-existing GIS infrastructure
shipped under earlier "G1-A through G1-D" slice naming —
infrastructure that **does not follow the 5-schema doctrine**.

This is structurally identical to the v1.4 / v1.6 drift
discoveries: working code shipped before the doctrine was firm,
and the doctrine doc didn't reflect reality. The same response
applies — audit honestly, document the gap, choose a forward-only
correction path.

D0 is that correction. **No code change in D0.** D0 is a
written decision committed before any D1+ slice runs.

---

## 1. Audit findings (D0)

### 1.1 ArcGIS connectivity — works

Smoke test against Esri's public sample service:

```text
URL:       https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3
Query:     /query?f=geojson&where=1=1&outFields=*&outSR=4326&returnGeometry=true
Result:    HTTP 200, 18,520 bytes, 0.6s response
Body:      {"type":"FeatureCollection","features":[{"type":"Feature","id":1,
            "geometry":{"type":"MultiPolygon","coordinates":[[[[ ... ]]]]}, ...
```

Network path is clean. The query shape used by
`ArcGisFeatureServiceClient` matches Esri's public service
contract. No D0 spike beyond this is needed.

### 1.2 G1-* surface inventory

```text
PRODUCTION CODE (TerraFusion.Core/GIS/ArcGisRest/):
  ArcGisFeatureServiceClient.cs               (277 LOC) — REST adapter
  ArcGisFeatureServiceServiceCollectionExtensions.cs   — DI helpers
  ArcGisGeoJson.cs                                      — GeoJSON parsing
  ArcGisNightlySyncHostedService.cs                     — background sync
  ArcGisParcelFeature.cs                                — DTO
  IArcGisCrosswalkService.cs                            — APN ↔ TfParcelId
  IArcGisFeatureServiceClient.cs                        — interface
  IArcGisSyncService.cs                                 — interface
  IParcelGeometryReader.cs                              — read API
  ArcGisServiceCatalog.cs (Config/)                     — service catalog

PRODUCTION CODE (TerraFusion.Core/Configuration/):
  ArcGisFeatureServiceOptions.cs                        — per-county binding

PRODUCTION CODE (TerraFusion.API/):
  Services/ArcGisSyncService.cs               (422 LOC) — orchestrator
  Controllers/ParcelGeometryController.cs                — read endpoint

ENTITY (TerraFusion.Core/Entities/GisTf/):
  TfParcelGeom.cs                                        — canonical-grain table

MIGRATION (already in H2 required-fragments):
  20260502180230_AddGisTfParcelGeom

TESTS (TerraFusion.Unit.Tests/GisTf/):
  ArcGisFeatureServiceOptionsTests.cs
  ArcGisRest/ArcGisCrosswalkServiceTests.cs
  ArcGisRest/ArcGisFeatureServiceClientTests.cs
  ArcGisRest/ArcGisNightlySyncHostedServiceTests.cs
  ArcGisRest/ArcGisSyncServiceTests.cs
  ArcGisRest/ParcelGeometryControllerTests.cs
  TfParcelGeomSchemaTests.cs

TOTAL: ~700 LOC production + 7 dedicated test files.
```

### 1.3 G1-* vs 5-schema doctrine — gap analysis

| Doctrine requirement | G1-* state | Gap |
|---|---|---|
| `legacy_*_raw.*` landing layer | NONE — REST response writes directly to canonical | Missing layer |
| `truth_*.*` validation layer | NONE — no supp-aware or geometry validity gate | Missing layer |
| `canonical_tf.*` projection target with `source_xref` | TfParcelGeom EXISTS but no source_xref entries written | Missing lineage wiring |
| `sync_bridge.load_batch` row per ingest | NONE — no LoadBatchId on TfParcelGeom rows | Missing provenance |
| `SourceQueryHash` on every row | NONE — TfParcelGeom has `SourceServiceUrl` only | Missing query-fingerprint |
| `SourceRowHash` on raw rows | N/A (no raw layer) | Missing |
| Promotion gates (the 5-gate canonical pattern) | NONE — sync service writes without gate emission | Missing all gates |
| Quarantine surface for crosswalk failures | Partial — IArcGisCrosswalkService exists but no `legacy_tf_unproven.*` table | Missing quarantine entity |
| `SourceFamilies.ArcGisRest` reserved value | DECLARED in v1.4 vocab | No LoadBatch ever USES it |
| Idempotency by LoadBatchId | NONE | Missing replay support |

### 1.4 Geometry stack

```text
Packages:
  ✗ NetTopologySuite                                  NOT installed
  ✗ Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite  NOT installed
  ✓ Npgsql.EntityFrameworkCore.PostgreSQL             v8.0.0 (base)

Storage:
  ✓ TfParcelGeom.GeomWkt (string, WKT format)         intentional Phase-1 design
  ✓ Centroid + Area pre-computed (no spatial query needed)
  ✓ Comments document "PostGIS-native is Phase 2"     deferred deliberately
  ✓ data-migration-plan.sql references CREATE EXTENSION postgis  prod-ready

Decision: KEEP WKT-only for Block D. PostGIS package install +
spatial-index migration is a Phase-2 slice (post-Block-G).
Block D operates entirely on string-grain WKT.
```

### 1.5 DB provider

```text
Production:    PostgreSQL via Npgsql           PostGIS extension presumed available
Development:   SQLite                           WKT-only path works on both
Tests:         InMemory                         provider-agnostic
```

WKT storage is provider-portable; no per-provider branching needed
in Block D.

---

## 2. Chosen path — **Path A** (refactor existing G1 into doctrine)

### 2.1 Why Path A and not Path B

```text
Path B (rebuild clean):
  ✗ Throws away ~700 LOC of working production code
  ✗ Throws away 7 working test files
  ✗ Wastes ~3-4 hours rebuilding the REST client + parsing logic
  ✗ Risks breaking ParcelGeometryController consumers

Path A (refactor in place):
  ✓ Keeps working REST adapter, GeoJSON parser, options binding,
    DTO, hosted service, controller — all proven
  ✓ Re-routes the data flow through doctrine layers
  ✓ Adds provenance + lineage + gates as new slices on top
  ✓ Existing G1 tests stay green; new doctrine tests add to the band
```

### 2.2 Path A migration strategy — the rewiring

```text
BEFORE (G1-D as shipped):

  ArcGisFeatureServiceClient
        │
        ▼  (parses GeoJSON → ArcGisParcelFeature[])
  ArcGisSyncService.SyncCounty()
        │
        ▼  (direct insert)
  gis_tf.tf_parcel_geom


AFTER (Path A target shape, after D1+D2+D3+D4):

  ArcGisFeatureServiceClient            ← UNCHANGED, kept as-is
        │
        ▼  (parses GeoJSON → ArcGisParcelFeature[])
  D1 LandingService writes to:
  legacy_arcgis_raw.parcel_geom         ← NEW table
        │  (LoadBatchId, SourceQueryHash, SourceRowHash, GeomWkt verbatim)
        ▼
  D2 TruthPromoter writes to:
  truth_arcgis.parcel_geom_current      ← NEW table
        │  (geometry validity gate; latest-per-ObjectId; dual-batch lineage)
        ▼
  D3 CanonicalProjector projects to:
  gis_tf.tf_parcel_geom                 ← EXISTING table, now driven by D3
        │  (source_xref written with TfEntityType = "geom_parcel")
        │  (no-parcel-xref → quarantine)
        ▼
  legacy_tf_unproven.parcel_geom        ← NEW quarantine entity
                                          (when TfParcelId crosswalk fails)

  D4 reads from gis_tf.tf_parcel_geom   ← UNCHANGED controller
                                          (existing ParcelGeometryController
                                           continues to serve consumers
                                           transparently across the refactor)
```

### 2.3 What Path A keeps verbatim

```text
- ArcGisFeatureServiceClient.cs           (REST adapter — externally-facing)
- ArcGisGeoJson.cs                        (GeoJSON parsing)
- ArcGisParcelFeature.cs                  (DTO)
- ArcGisFeatureServiceOptions.cs          (per-county config binding)
- ArcGisServiceCatalog.cs                 (catalog)
- ArcGisFeatureServiceServiceCollectionExtensions.cs  (DI helpers)
- ParcelGeometryController.cs             (read endpoint, refactored to read D3)
- IParcelGeometryReader.cs                (read interface)
- TfParcelGeom entity shape               (column-by-column unchanged in Block D;
                                           may grow LoadBatchId + source_xref FK in D3
                                           but as additive nullable columns initially)
- All 7 existing test files               (continue to validate the unchanged
                                           pieces; new tests cover the new layers)
```

### 2.4 What Path A refactors

```text
- ArcGisSyncService.cs                    (422 LOC — split into D1 landing
                                           service + D2 truth promoter; the
                                           hosted service and crosswalk logic
                                           split into their respective slices)
- ArcGisNightlySyncHostedService.cs       (re-targeted to invoke the D1 landing
                                           service, then D2 truth promoter, then
                                           D3 canonical projector — orchestration
                                           layer over the three new slices)
- IArcGisCrosswalkService.cs              (moves into D3 canonical projector;
                                           unresolved crosswalks emit quarantine
                                           rows per the v1.4 NoParcelXref pattern)
```

---

## 3. Slice contracts — D1, D2, D3, D4

### 3.1 D1 — `legacy_arcgis_raw.parcel_geom` landing

**Pattern source:** mirror `legacy_pacs_raw.imprv_detail` shape
exactly. New entity, new EF config, new migration, new
landing-service that wraps the existing
`ArcGisFeatureServiceClient`.

**Shape:**

```csharp
public sealed class LegacyArcGisRawParcelGeom
{
    public Guid LandedRowId { get; set; }
    public Guid CountyId { get; set; }                  // sovereign isolation
    public long ArcGisObjectId { get; set; }            // OBJECTID from feature
    public string? ArcGisApn { get; set; }              // APN attribute verbatim
    public string GeomWkt { get; set; }                 // WKT verbatim from REST
    public double CentroidLat { get; set; }             // pre-computed
    public double CentroidLon { get; set; }             // pre-computed
    public double AreaSqFt { get; set; }                // pre-computed
    public string SourceServiceUrl { get; set; }        // FeatureService URL
    public Guid LoadBatchId { get; set; }               // provenance — required
    public string SourceQueryHash { get; set; }         // hash of query URL+filters
    public string SourceRowHash { get; set; }           // SHA-256 truncated 16-hex
    public DateTime LandedAt { get; set; }
}
```

**Indexes:**

```text
ux_legacy_arcgis_raw_parcel_geom_county_objectid    UNIQUE (CountyId, ArcGisObjectId, LoadBatchId)
ix_legacy_arcgis_raw_parcel_geom_load_batch         (LoadBatchId)
ix_legacy_arcgis_raw_parcel_geom_apn                (CountyId, ArcGisApn)
```

**Service:**

```text
PacsArcGisLandingService (or ArcGisRawLandingService)
  - Takes a CountyId
  - Looks up CountyArcGisOptions for that county (existing G1-B)
  - Invokes ArcGisFeatureServiceClient.FetchParcelsAsync (existing G1-C)
  - Writes each ArcGisParcelFeature to legacy_arcgis_raw.parcel_geom
    with full provenance
  - Records a LoadBatch row with SourceFamily = ARCGIS_REST
  - Emits R-* gates (4 gates per the doctrine pattern):
      arcgis-raw-source-batch-completed
      arcgis-raw-key-uniqueness     (no duplicate ObjectIds within batch)
      arcgis-raw-provenance-coverage (all rows have LoadBatchId + hashes)
      arcgis-raw-aggregate          (count + total area)
```

**Migration:** `AddLegacyArcGisRawParcelGeom`.

**Tests:** ~12 acceptance tests mirroring the imprv-detail landing test pattern.

### 3.2 D2 — `truth_arcgis.parcel_geom_current` promotion

**Shape:**

```csharp
public sealed class TruthArcGisParcelGeomCurrent
{
    public Guid TruthParcelGeomId { get; set; }
    public Guid CountyId { get; set; }
    public long ArcGisObjectId { get; set; }            // 2-key with CountyId
    public string? ArcGisApn { get; set; }
    public string GeomWkt { get; set; }
    public double CentroidLat { get; set; }
    public double CentroidLon { get; set; }
    public double AreaSqFt { get; set; }
    public string SourceServiceUrl { get; set; }
    public Guid SourceLandedRowId { get; set; }         // FK to D1 row
    public Guid LandingLoadBatchId { get; set; }        // D1 batch
    public Guid PromotionLoadBatchId { get; set; }      // D2 batch
    public DateTime PromotedAt { get; set; }
}
```

**Truth invariants:**

```text
- Latest-per-(CountyId, ArcGisObjectId) wins (most recent LoadBatchId).
- Geometry validity gate: WKT parses as a polygon (or multipolygon),
  ring count ≥ 1, vertex count ≥ 3 per ring. Invalid → not promoted.
- Single-batch lineage (no supp_assoc analog needed for ArcGIS).
```

**Service:** `ArcGisTruthPromoter`. Emits T-* gates (4 gates).

**Migration:** `AddTruthArcGisParcelGeomCurrent`.

### 3.3 D3 — `gis_tf.tf_parcel_geom` canonical projection (REFACTOR)

**Existing TfParcelGeom shape** is mostly fine. Path A adds **two
additive columns** (both nullable initially):

```csharp
public Guid? PromotionLoadBatchId { get; set; }   // NEW — D3 batch identity
// (LoadBatchId already implicit via source_xref join)
```

**Doctrine wiring:**

```text
- Every row gets a sync_bridge.source_xref entry with:
    TfEntityType = "geom_parcel"
    SourceKeyJson = { "county_id": "<guid>", "arcgis_object_id": <long> }
    LoadBatchId = D3 batch
- Crosswalk: TfParcelId resolved by APN match against canonical_tf.tf_parcel
  (existing IArcGisCrosswalkService logic, refactored into D3 projector).
- On crosswalk miss: TfParcelId stays NULL (existing nullable column).
  Optional v1.x extension can add quarantine to legacy_tf_unproven.parcel_geom
  if operator wants stricter behavior.
- Five C-* gates per the canonical-projector pattern:
    canonical-geom-source-batch-completed
    canonical-geom-source-xref-coverage
    canonical-geom-county-isolation
    canonical-geom-crosswalk-coverage     (% TfParcelId resolved)
    canonical-geom-aggregate              (count + total area)
```

**Migration:** `AddTfParcelGeomPromotionBatch` (one nullable
column, no FK changes, additive).

**TfEntityType vocabulary bump:** Block-C contract v1.7 §3.6 has
`"parcel" | "sale" | "improvement" | "land" | "owner" |
"assessment_wsdor"` plus reserved `"geom_*"`. D3 uses
`"geom_parcel"` — additive, **v1.8 minor bump**.

### 3.4 D4 — read-models

**Existing controller** `ParcelGeometryController` already serves
the read path. D4 verifies it remains green after the D3 refactor.
If new endpoints are needed (bbox query, neighbor lookup), they
add to the existing controller in additive endpoints — not a
rewrite.

**No new entity in D4.** Read-models are projections of existing
canonical state.

---

## 4. Doctrine bumps required for Block D

```text
v1.8   D3 introduces TfEntityType = "geom_parcel"    (additive minor bump)
v1.9   D1 introduces R-* gate names + new entity     (additive minor bump)
v1.10  D2 introduces T-* gate names + new entity     (additive minor bump)
       (D3 canonical-geom-* gate names also covered here or v1.8)

OR (preferred): single v1.8 bump that documents D1+D2+D3 contracts
together, since all three slices ship within the same block.
Recommend the single-bump approach — fewer doc files, easier
review.
```

---

## 5. Block D explicit non-goals (carry-forward)

```text
- No PostGIS package install. WKT-only stays through Block D.
- No NetTopologySuite. Same.
- No spatial index. Same.
- No Phase-2 PostGIS-native geometry migration.
- No shapefile parser. ArcGIS REST API only — H1 lockdown.
- No custom topology / projection math.
- No multi-county anything until Benton runs a live Tuesday on TF.
- No UI / dashboard work in Block D.
- No product_runtime writes.
- No ConversionEra (G) hardening for GIS — geometry has no
  pre-2017 conversion-era concept.
```

---

## 6. Estimated cost

```text
D0 (this doc — written, committed)       ~1 hour    (0 LOC)
D1 raw landing slice                     ~2 hours   (entity + config + service + tests + migration)
D2 truth promotion slice                 ~2 hours   (entity + config + promoter + tests + migration)
D3 canonical projection refactor         ~2 hours   (refactor sync service into projector + source_xref wiring + tests + migration)
D4 read-models                           ~0.5 hours (verify existing controller, add bbox/neighbor if needed)
v1.8 doctrine bump                       ~0.5 hours (docs/pacs/block-c-contract-v1.8.md OR docs/pacs/block-d-contract-v1.md)

                                         ─────────
Total                                    ~8 hours
```

---

## 7. D0 close — what's committed by this doc

```text
- This file (decision document)
- No code change
- No migration
- No schema change
- No package install
- No test added or removed
- No projector behavior change
- No working G1-* code touched

Doctrine band remains 386 / 386 green at this commit.
```

---

## 8. Resume signal for D1

```text
After PR #723 reviews and merges, the next slice is:

  D1 — legacy_arcgis_raw.parcel_geom landing
  Mirror legacy_pacs_raw.imprv_detail shape; wrap existing
  ArcGisFeatureServiceClient; emit 4 R-* gates.
  ~2 hours.

Until PR #723 merges:
  Block D opens are still in shovel jail per the
  user's "no shovel before merge" constraint.
  This doc itself is allowed because it's pure
  decision documentation, not Block-D code.
```

---

## 9. Doctrine frog status (Block D pre-flight)

> The doctrine frog read the existing maps before the map
> goblin grabbed the shovel. The expedition's prior buildings
> are catalogued. Path A is locked.
>
> Block D opens — when PR #723 merges — with reality-aligned
> doctrine, not v1.4-style after-the-fact discovery.
