# Block-C Contract — v1 (Frozen)

**Status:** binding doctrine. Version `v1`. Frozen 2026-05-02.
**Layer:** 3.5 of the PACS doctrine stack — between the Sync Bridge
v1 spec (Layer 3) and the post-Block-C execution spine (Layer 4).

```text
docs/pacs/pacs-knowledge-baseline.md         (Layer 1)
docs/pacs/pacs-ingestion-spine.md            (Layer 2)
docs/pacs/pacs-source-provenance-doctrine.md (Layer 2.5)
docs/pacs/pacs-sync-bridge-v1-spec.md        (Layer 3)
docs/pacs/block-c-contract-v1.md             (Layer 3.5) ← this doc
docs/pacs/blocks-d-through-h-design.md       (Layer 4)
```

## 0. What this doc does

This doc freezes the post-Block-C state of TerraFusion's data
contract. It is the source-of-truth shape that the H2 schema-shape
regression test compares against, and the H3 replay harness assumes
when re-running promotion deterministically.

**Mutation rule:** any change to a shape recorded below requires
publishing `block-c-contract-v2.md` (or `vN+1`) and bumping the
regression baseline. There is no quiet drift path.

The freeze captures four things:

1. The 5-schema contract.
2. The Sync Bridge control-tower shapes (`source_xref`,
   `promotion_gate_result`, `load_batch`, `SourceFamilies`).
3. The four canonical lanes' shapes + their `SourceKeyJson`
   contracts.
4. Quarantine semantics (`legacy_tf_unproven.*`).

---

## 1. The five-schema contract

```text
legacy_pacs_raw      — raw, faithful, lineage-tagged extract from PACS
truth_pacs           — supp-aware-validated PACS truth, qualification-
                       filtered where doctrine requires, fully lineaged
                       back to legacy_pacs_raw
canonical_tf         — TerraFusion-native identity domain. Foreign keys
                       are TF GUIDs. Every row has a sync_bridge.source_xref.
sync_bridge          — control tower: lineage, batches, gates, conflicts
legacy_tf_unproven   — quarantine. Truth-pacs rows that could not be
                       safely linked to canonical_tf identity. Preserved,
                       not discarded.
```

Doctrine: data flows `legacy_pacs_raw → truth_pacs → canonical_tf`.
Every step records a `LoadBatchId`. Every canonical row has a
`source_xref`. Every quarantine row keeps full lineage.

---

## 2. Sync Bridge control-tower shapes (frozen)

### 2.1 `sync_bridge.source_xref`

File: `backend/src/TerraFusion.Core/Entities/SyncBridge/SourceXref.cs`

```csharp
public sealed class SourceXref
{
    public long XrefId { get; set; }                       // identity
    public string TfEntityType { get; set; }               // see §3
    public Guid   TfEntityId   { get; set; }               // canonical_tf id
    public string SourceSystem { get; set; }
    public string? SourceDatabase { get; set; }
    public string? SourceTable    { get; set; }
    public string SourceKeyJson   { get; set; }            // jsonb in PG
    public string SourceQueryHash { get; set; }
    public Guid   LoadBatchId     { get; set; }
    public DateTime FirstSeenAt   { get; set; }
    public DateTime LastSeenAt    { get; set; }
    public decimal ConfidenceScore { get; set; } = 1.00m;
    public bool   IsActive { get; set; } = true;
}
```

**Frozen invariants:**

- Every `canonical_tf.*` row MUST have a corresponding
  `source_xref` (exception: `tf_improvement_feature`, see §3.3).
- `TfEntityType` is a closed vocabulary — see §3.
- `SourceKeyJson` shape is per-lane, frozen per §3.

### 2.2 `sync_bridge.promotion_gate_result`

File: `backend/src/TerraFusion.Core/Entities/SyncBridge/PromotionGateResult.cs`

```csharp
public sealed class PromotionGateResult
{
    public long GateResultId { get; set; }
    public Guid LoadBatchId  { get; set; }
    public string GateName   { get; set; }      // e.g. "canonical-land-parcel-xref-coverage"
    public string GateStage  { get; set; }      // see closed vocab below
    public string Status     { get; set; }      // 'PASS' | 'FAIL' | 'WARN' | 'SKIP'
    public string? Expected  { get; set; }
    public string? Actual    { get; set; }
    public string? Detail    { get; set; }
    public DateTime ExecutedAt { get; set; }
}
```

**Frozen `GateStage` vocabulary:**

```text
SOURCE_TO_RAW          — R-1..R-5 (raw landing)
RAW_TO_TRUTH           — T-1..T-10 (truth promotion)
TRUTH_TO_CANONICAL     — C-1..C-5 (canonical projection)
CANONICAL_TO_PRODUCT   — P-1..P-4 (product runtime; not used in Block C)
ARCH                   — schema-integrity gates
```

**Frozen `Status` vocabulary:** `PASS | FAIL | WARN | SKIP`.

### 2.3 `sync_bridge.load_batch`

File: `backend/src/TerraFusion.Core/Entities/SyncBridge/LoadBatch.cs`

```csharp
public sealed class LoadBatch
{
    public Guid   LoadBatchId       { get; set; }
    public string SourceFamily      { get; set; }   // closed vocab — see §2.4
    public string SourceSystem      { get; set; }
    public string SourceFileOrDatabase { get; set; }
    public string? SourceQueryName  { get; set; }
    public string  SourceQueryHash  { get; set; }
    public string? RestoreSource    { get; set; }
    public string  Operator         { get; set; }
    public DateTime  StartedAt      { get; set; }
    public DateTime? CompletedAt    { get; set; }
    public string  Status           { get; set; }   // 'IN_PROGRESS'|'COMPLETED'|'FAILED'|'PARTIAL'
    public string? ProofGateReportPath { get; set; }
    public long?   RowsExtracted    { get; set; }
    public long?   RowsPromoted     { get; set; }
    public string? ErrorSummary     { get; set; }
    public DateTime CreatedAt       { get; set; }
}
```

### 2.4 `SourceFamilies` (closed vocabulary)

File: `backend/src/TerraFusion.Core/Entities/SyncBridge/SourceFamilies.cs`

```text
PACS_OLTP             PacsOltp
PACS_BACKUP           PacsBackup
CAMACLOUD             CamaCloud
PACS_SPATIAL          PacsSpatial
PACS_LISTS            PacsLists
PACS_DBPROJECT        PacsDbProject
PACS_SYNCSERVICE_DB   PacsSyncServiceDb
WEB_INTERNET_BENTON   WebInternetBenton
TAAPPSVR              TaAppSvr
PROVAL                ProVal
ASCEND                Ascend
CIAPS                 Ciaps
BENTON_DYNLOADER      BentonDynLoader
ARCGIS_REST           ArcGisRest        (Block D)
LEGACY_UNKNOWN        LegacyUnknown
```

Adding a value is a code change in `SourceFamilies.All`. There is
no runtime-extensible hook by design.

---

## 3. Canonical lane shapes (frozen)

### 3.1 `canonical_tf.tf_parcel`

File: `backend/src/TerraFusion.Core/Entities/CanonicalTf/TfParcel.cs`

Identity: `TfParcelId : Guid`. County-isolated via `CountyId`.

```csharp
public sealed class TfParcel
{
    public Guid TfParcelId          { get; set; }
    public Guid CountyId            { get; set; }
    public string? ParcelNumber     { get; set; }
    public string? SitusAddress     { get; set; }
    public string? LegalDescription { get; set; }
    public string ParcelStatus      { get; set; }    // 'ACTIVE'|'INACTIVE'|'WITHDRAWN'|'UNDER_REVIEW'
    public string? PropertyType     { get; set; }    // 'R'|'MH'|'P' (P = explicitly authorized only)
    public Guid?  CurrentOwnerId      { get; set; }  // nullable in v1
    public Guid?  CurrentAssessmentId { get; set; }  // nullable in v1
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**`source_xref` contract:**

```json
{
  "TfEntityType": "parcel",
  "SourceKeyJson": { "prop_id": <int>, "prop_val_yr": <short>, "sup_num": <short> }
}
```

### 3.2 `canonical_tf.tf_sale`

Identity: `TfSaleId : Guid`. (Confirmed via L0/S3 codepath; full
shape governed by S3 promoter.)

**`source_xref` contract:**

```json
{
  "TfEntityType": "sale",
  "SourceKeyJson": { "chg_of_owner_id": <long>, "prop_id": <int>,
                     "prop_val_yr": <short>, "sup_num": <short> }
}
```

### 3.3 `canonical_tf.tf_improvement`

File: `backend/src/TerraFusion.Core/Entities/CanonicalTf/TfImprovement.cs`

```csharp
public sealed class TfImprovement
{
    public Guid TfImprovementId  { get; set; }
    public Guid CountyId         { get; set; }   // sourced from parcel
    public Guid TfParcelId       { get; set; }   // canonical FK
    public string? ImprvTypeCd   { get; set; }
    public string? ImprvClassCd  { get; set; }
    public bool   IsHomesite     { get; set; }
    public decimal? ImprvVal     { get; set; }
    public string?  ImprvDesc    { get; set; }
    public short?  YearBuilt          { get; set; }
    public short?  EffectiveYearBuilt { get; set; }
    public short?  ActualYearBuilt    { get; set; }
    public Guid PromotionLoadBatchId  { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**`source_xref` contract:**

```json
{
  "TfEntityType": "improvement",
  "SourceKeyJson": { "prop_id": <int>, "prop_val_yr": <short>,
                     "sup_num": <short>, "imprv_id": <long> }
}
```

### 3.4 `canonical_tf.tf_improvement_feature` (xref exception)

File: `backend/src/TerraFusion.Core/Entities/CanonicalTf/TfImprovementFeature.cs`

```csharp
public sealed class TfImprovementFeature
{
    public Guid TfImprovementFeatureId { get; set; }
    public Guid TfImprovementId        { get; set; }   // canonical FK to parent
    public string FeatureCode { get; set; }            // BSMT|ATTGAR|COVPATIO|MA|POLEBLDG|POOL|...
    public string? MethodCd   { get; set; }
    public string? ClassCd    { get; set; }
    public string? SubClassCd { get; set; }
    public string? ConditionCd { get; set; }
    public decimal? Area       { get; set; }
    public decimal? Value      { get; set; }
    public int?    NumUnits    { get; set; }
    public short?  YrBuilt     { get; set; }
    public Guid SourceImprvDetailLandedRowId { get; set; }   // lineage column
    public Guid PromotionLoadBatchId         { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**Frozen exception:** feature rows do NOT carry their own
`source_xref`. They are derived edges from the truth-pacs imprv
parent + their raw `imprv_detail` children, traceable via
`SourceImprvDetailLandedRowId` + `TfImprovementId.source_xref`.
This is the **only** documented exception to the "every canonical
row has a source_xref" rule.

### 3.5 `canonical_tf.tf_land`

File: `backend/src/TerraFusion.Core/Entities/CanonicalTf/TfLand.cs`

```csharp
public sealed class TfLand
{
    public Guid TfLandId       { get; set; }
    public Guid CountyId       { get; set; }   // sourced from parcel
    public Guid TfParcelId     { get; set; }   // canonical FK
    public string? LandSegTypeCd  { get; set; }
    public string? LandSegStateCd { get; set; }
    public string? LandSegClassCd { get; set; }
    public string? LandSegUseCd   { get; set; }
    public string? SoilCd         { get; set; }
    public bool   IsHomesite       { get; set; }
    public decimal? SizeAcres        { get; set; }
    public decimal? SizeSquareFeet   { get; set; }
    public decimal? LandSegMarketVal { get; set; }
    public decimal? LandSegAgValue   { get; set; }
    public decimal? LandSegAssessedVal { get; set; }
    public short?  LandSegEffAge       { get; set; }
    public Guid PromotionLoadBatchId   { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**`source_xref` contract:**

```json
{
  "TfEntityType": "land",
  "SourceKeyJson": { "prop_id": <int>, "prop_val_yr": <short>,
                     "sup_num": <short>, "land_seg_id": <long> }
}
```

### 3.6 Closed `TfEntityType` vocabulary (Block-C frozen subset)

```text
"parcel"
"sale"
"improvement"
"land"
"owner"           (B3 lineage; canonical authority deferred)
"assessment_wsdor" (B-* lane)
```

Block D will add `"geom_*"`. Adding a value is a v2 contract bump.

---

## 4. Truth-PACS lane shapes (frozen)

The truth_pacs lanes are stepping stones; they preserve PACS
identity (the supp-aware-validated 4-key) plus dual-batch lineage.

### 4.1 `truth_pacs.sale` (4-key)

`(chg_of_owner_id, prop_id, prop_val_yr, sup_num)` — qualification-
filtered to `sl_county_ratio_cd = '100'` by construction.
Dual lineage: `SourceSaleLandedRowId` + `SourceSuppAssocLandedRowId`.

### 4.2 `truth_pacs.imprv_current` (4-key)

`(prop_val_yr, sup_num, prop_id, imprv_id)` — supp-aware.
Dual lineage: `SourceImprvLandedRowId` + `SourceSuppAssocLandedRowId`.

### 4.3 `truth_pacs.land_current` (4-key)

`(prop_val_yr, sup_num, prop_id, land_seg_id)` — supp-aware.
Dual lineage: `SourceLandLandedRowId` + `SourceSuppAssocLandedRowId`.

### 4.4 `truth_pacs.wash_prop_owner_val` (B-lane)

(Frozen by B2 promoter; out of scope for granular shape capture
here. Treated as a peer of the other truth lanes for §6 purposes.)

**Common truth invariants:**

- `SupNum` matches the active supp pointer at promotion time.
- Both source `LoadBatchId`s preserved (e.g. `SaleLoadBatchId`
  + `SuppAssocLoadBatchId`) plus the truth-`PromotionLoadBatchId`.
- `truth_pacs.*` is NOT canonical. Normalization, dictionary
  joins, and identity translation happen at canonical layer.

---

## 5. Quarantine semantics (frozen)

When a truth_pacs row is correct in itself but cannot be safely
linked to canonical TF identity, it is preserved in
`legacy_tf_unproven.*` rather than dropped.

### 5.1 Shape contract

Every `legacy_tf_unproven.*` row carries:

```text
- UnprovenRowId       : Guid (identity)
- <PACS-side identity> : verbatim from truth_pacs (4-key)
- <a small set of value columns> : enough to recognize the row
- SourceTruth<Lane>Id : Guid pointer back to truth_pacs row
- PromotionLoadBatchId : the canonical batch that produced the quarantine
- QuarantineReason    : closed vocabulary (§5.2)
- CreatedAt           : DateTime
```

Reference: `LegacyTfUnprovenImprvCurrent.cs`,
`LegacyTfUnprovenLandCurrent.cs`, `LegacyTfUnprovenSale.cs`,
`LegacyTfUnprovenOwnerCurrent.cs`, `LegacyTfUnprovenImprvAttr.cs`,
`LegacyTfUnprovenWashPropOwnerVal.cs`.

### 5.2 Frozen `QuarantineReason` vocabulary

```text
"NO_PARCEL_XREF"      — truth row exists; its parcel cannot be resolved
                        through source_xref to a TfParcelId.
```

Block-C only emits `NO_PARCEL_XREF`. Block E may add
`"UNKNOWN_ATTRIBUTE"`. Each new reason requires a vN+1 contract bump.

### 5.3 Idempotency rule

The same truth row promoted twice must produce a single canonical
row OR a single quarantine row, never both, never duplicates.
Implementation: delete-then-insert keyed by the truth batch's
4-tuple set, parsed from `source_xref.SourceKeyJson` for
canonical and from PACS columns for quarantine.

---

## 6. The canonical-projector five-gate pattern (frozen)

Every canonical projector (`tf_*` projector — C3, L3, S3, Block D's
D3) MUST emit exactly five gates, in this stage:

```text
GateStage = TRUTH_TO_CANONICAL
```

```text
1. <lane>-source-batch-completed       — the upstream truth batch is COMPLETED
2. <lane>-parcel-xref-coverage         — every truth row resolves to a TfParcelId
                                         OR is quarantined (no silent loss)
3. <lane>-source-xref-coverage         — every projected canonical row has a
                                         matching sync_bridge.source_xref
4. <lane>-county-isolation             — no canonical row crosses CountyId
                                         boundary; CountyId derives from parcel
5. <lane>-aggregate                    — domain-specific tally (sum of values
                                         / area / count) matches truth-side
                                         expectation post-projection
```

Block D's D3 inherits this pattern unchanged; the §5 quarantine
applies on the parcel-xref miss path.

---

## 7. Versioning rule

This contract is `v1`. Any of the following requires a vN+1
contract doc:

- New column added/removed on any frozen entity in §2/§3/§4/§5.
- New value added to any closed vocabulary (`SourceFamilies`,
  `Status`, `GateStage`, `TfEntityType`, `QuarantineReason`).
- New `TfEntityType` introduced.
- New `legacy_tf_unproven.*` table.
- Change to the five-gate pattern in §6.

The H2 schema-shape regression test fails the build whenever a
shape differs from this doc and the contract version has not been
bumped.

---

## 8. What this contract does NOT freeze

- The **count** of canonical rows. Block-C lanes are free to grow.
- The **content** of dictionary tables. Block E will populate them.
- The **specific gate thresholds** (Block G adds
  `pre-conversion-row-share` thresholds in operator config).
- The **product runtime layer** (`product.*`). That's
  `CANONICAL_TO_PRODUCT` — Block F territory.
- ArcGIS / GIS shapes (§3.6 reserves `"geom_*"` — Block D fills it).

---

## 9. The doctrine frog

> The doctrine frog sits on the keyboard. Block C is locked.
> Drift now requires a v2 doc, a regression-baseline bump, and a
> co-founder status report. There is no quiet path forward.
