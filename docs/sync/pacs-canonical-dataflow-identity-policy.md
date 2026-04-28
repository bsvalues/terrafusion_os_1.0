# PACS Canonical Dataflow + Identity Policy

**Slice:** D0-D (docs-only — laminates the identity / dataflow / sync
patterns confirmed across the session's reference materials so future
slices can read this rather than re-discovering it).
**Lifecycle layer:** architectural-memory foundation — the C-series
slices below this one (C9-C through C21-A) operated on workbook rows
without an explicit identity-and-dataflow contract; D0-D records the
contract retroactively so dictionary-loading + transform-consumer +
sync-coexistence work above it can inherit a single source of truth.
**Status:** policy locked; reference doc; no workbook mutation; no
code changes.

## Provenance

This policy is synthesized from operator-supplied reference material
shared during the 2026-04-27 → 2026-04-28 session:

- **PACS Database Guide 9.0** (`E:\PACS\Files of SQL\Files of SQL\PACS-SQL\PACS database guide.docx`)
  — column-by-column data dictionary for 32 canonical PACS tables.
- **PACS Synchronization Service Installation Manual** (`E:\PACS\PACS\PACS Synchronization Service - Installation.docx`)
  — Harris Computer Systems / Kevin Lloyd / Ganesh Murugesan, Aug-Oct 2013.
  Describes the CamaCloud sync service architecture and operationally
  proven settings.
- **Live install of PACS Sync Service** (`E:\PACS\PACS\`) — running on
  the operator's machine, last config-touched 2026-01-06; settings.xml
  reveals the *operator-tuned* values 11+ years after the manual's
  defaults.
- **Operator's working sales-dashboard SQL** (shared 2026-04-28) —
  daily-run query that drives the assessor's Excel sales dashboard.
- **PACS stored procedure catalog** (`E:\PACS\dbo (2)\dbo\StoredProcedures\`)
  — 2,086 procs revealing the canonical join shapes used by DOR
  reporting, comp-grid scoring, and tax-statement generation.
- **PACS canonical dictionaries reference** (C21-A,
  `docs/sync/pacs-canonical-dictionaries-reference.md`) — the catalog
  of code-table queries that supplies controlled vocabulary for the
  columns the C-series has been reviewing.

The four sources are internally consistent. This doc records the
intersection of all four as the canonical-truth set future TerraFusion
work should inherit.

## Purpose

Freeze the identity, year/supplement semantics, sale-event identity,
property-profile cache boundary, sync operational patterns, and
GIS-source delineation that PACS uses, so that future TerraFusion
slices (dictionary loaders, transform consumers, sales-comp scoring,
ratio-study features, multi-county onboarding) read this one document
rather than re-discovering the same facts from scratch.

## Canonical Property Identity

PACS per-year tables are identified by a **three-part composite key**:

| Field | Type | Meaning |
|---|---|---|
| `prop_id` | `int NOT NULL` | Permanent PACS property identifier. Never changes. Set from `dbo.next_property_id`. |
| `prop_val_yr` | `numeric(4,0) NOT NULL` | Appraisal/value year (e.g. 2026). |
| `sup_num` | `int NOT NULL` | Supplement number within the year. `sup_num=0` is the base roll; supplements are state-required revisions to a year layer. |

Tables this composite key applies to (per PACS DB Guide 9.0 + Harris
sync service install manual):

- `property_val`
- `imprv`, `imprv_detail`, `imprv_attr`
- `land_detail`
- `pers_prop_seg`
- `prop_supp_assoc`
- `wash_prop_owner_val`, `wash_prop_val`
- and ~25 other per-year tables

**Universal joining rule:** when two per-year tables are joined, all
three keys must match. The Harris sync service's `PACSPropertySelectionString`
and the operator's working dashboard SQL both join on
`(prop_id, prop_val_yr, sup_num)` triples; future TerraFusion
consumers must do the same.

Tables that do **NOT** carry the composite key:

- `property` (just `prop_id` — non-year-versioned facts)
- `account` (just `acct_id`)
- `address` (`acct_id` + `addr_type_cd`)
- `chg_of_owner` (just `chg_of_owner_id` — sale events are not
  per-year-keyed; they're per-event-keyed)

## Property Type Filter Universe

`property.prop_type_cd` defines the property universe and is the
first-class filter every consumer applies:

| Code | Meaning |
|---|---|
| `R` | Real (the C-series workbook focus) |
| `MH` | Mobile Home |
| `MN` | Mineral |
| `P` | Personal |
| `A` | Auto |

The operator's daily dashboard SQL filters to `R` only. The Harris
sync service's default filter is `R` + `MH` (real + manufactured
housing — the field-assessor mobile use case). Future TerraFusion
consumers must pick their universe explicitly and document the
choice; defaulting to "all property types" surfaces personal-property
records most assessors don't want in their working set.

## Current Appraisal Year

`pacs_system.appr_yr` is the canonical "current appraisal year"
pointer. The Harris sync service's property selector joins
`psa.owner_tax_yr = ps.appr_yr` to filter to the active year. The
operator's dashboard SQL does the same.

`pacs_system.tax_yr` is the parallel "current tax year" pointer —
typically `appr_yr - 1` because the year being assessed (`appr_yr`) is
the *next* year's tax bill. Both are single-row facts in the
`pacs_system` table; consumers read them once per session/run.

## Base Roll vs Supplements

`sup_num=0` is the base roll. Higher `sup_num` values are state-required
revisions (corrections, BOE rulings, owner protests, etc.). The
operator's dashboard SQL filters to `pv.sup_num=0` because it operates
on the base roll; the sync service's `PACSPropertySelectionString` joins
through `prop_supp_assoc` which already returns the latest active
supplement per property-year.

Future TerraFusion consumers must pick their supplement strategy
explicitly:

- **Base-roll only** (`sup_num=0`) — what the operator's dashboard does;
  faster, simpler, ignores in-flight revisions.
- **Latest active per property-year** — what `prop_supp_assoc` returns;
  reflects the current state of record including supplements.

The choice depends on the consumer's purpose. Sales-comp scoring
generally wants the latest active supplement (current state of comps);
historical analysis may want a snapshot at a specific supplement.

## UDI Parcel Filter (operator-tuned, 2026)

The Harris sync service's 2013 default filter was simply
`p.prop_type_cd in ('R','MH')`. The 2026 operator-tuned filter has
evolved to:

```sql
WHERE p.prop_type_cd in ('R', 'MH')
  AND (pv.prop_inactive_dt IS NULL OR udi_parent = 'T')
  AND udi_parent_prop_id IS NULL
```

UDI = **Undivided Interest** — parcels with multiple owners sharing
one parcel ID via parent/child structure. The filter:

- Includes active parcels (`prop_inactive_dt IS NULL`).
- **Includes UDI parents even if inactive** (`udi_parent='T'`).
- **Excludes UDI children entirely** (`udi_parent_prop_id IS NULL`).

Future TerraFusion consumers must replicate this filter or they will
surface ghost parcels (UDI children that should be invisible at the
working level) and miss UDI parents the operator considers
authoritative.

## Sale Identity

`sale.chg_of_owner_id` is the sale primary key (per PACS DB Guide 9.0:
*"Records will only exist in this table once the Create Sales button has
been clicked within the Deed"*). Sale records are 1-to-1 with
`chg_of_owner` records.

Property → sale resolution requires the bridge table
`chg_of_owner_prop_assoc`:

```sql
property.prop_id
  ← chg_of_owner_prop_assoc.prop_id
                            .chg_of_owner_id
  → chg_of_owner.chg_of_owner_id
  → sale.chg_of_owner_id
```

A single change-of-owner event can affect multiple properties (e.g.
multi-parcel transfers); a property can have many change-of-owner
events over time. The composite is many-to-many through the bridge.

The DOR reporting procs (`DORReportSales`, `DORReportStratification`)
also use `chg_of_owner_id` as the canonical sale identifier, confirming
this is the WSDOR-blessed path.

**Future sales-side TerraFusion work must carry `chg_of_owner_id` as the
provenance pointer for every sale-derived record.**

## Neighborhood Model

Neighborhood is a year-keyed dictionary (per PACS DB Guide 9.0):

| Layer | Table | Identity |
|---|---|---|
| Membership | `property_val.hood_cd` | Per-property-per-year code |
| Dictionary | `neighborhood` | `(hood_cd, hood_yr)` composite |
| Cache | `property_profile.neighborhood` | Denormalized varchar(10) read copy |

The dictionary join is `neighborhood.hood_yr = property_val.prop_val_yr`
— **the dictionary itself is year-versioned**. Neighborhood definitions
can change year-over-year (boundary revisions, name changes, splits,
merges).

This was the gap C20-A2 documented: the C3 profile loader did not
include `property_val.hood_cd` in the workbook. Future C20-C work
will add the membership column AND the year-keyed dictionary.

The historical typo `nbhd_cd` is documented in
`backend/src/TerraFusion.API/Controllers/SyncController.cs` line 298 —
the canonical column is `hood_cd`, not `nbhd_cd`.

## Property Profile — Cache, not Canon

`property_profile` is an **operator-friendly cache / read surface**,
not the canonical source for any of the values it carries. It exists
as a denormalized join of `property_val` + `imprv` + `imprv_detail` +
`imprv_attr` + `land_detail` + `neighborhood` for query performance.
It is recalculated by PACS recalc procs and the
`Calculate*` family, not authored directly.

Columns that appear in BOTH `property_val` and `property_profile`
(e.g. `property_use_cd`, `neighborhood`, `state_cd`, `class_cd`):

- The `property_val` (or `imprv` / `land_detail`) table is **canonical**.
- The `property_profile` value is a **denormalized cache** that may
  lag canonical until the next recalc.

Future TerraFusion transform consumers should:

- **Prefer base PACS tables** for canonical reads (`property_val`,
  `imprv`, `imprv_detail`, `imprv_attr`, `land_detail`).
- Use `property_profile` only for performance-critical dashboards or
  parity checks against operator-built tooling.
- Document explicitly when a slice reads from `property_profile`
  (operator-friendly cache) vs base tables (canonical).

The operator's daily dashboard SQL reads from both — `pp` (property_profile)
for `living_area`, `class_cd`, `condition_cd`, `actual_age`, etc.; `pv`
(property_val) for `market`, `imprv_hstd_val`, `land_hstd_val`,
`hood_cd`, etc. The convention: cache for reading, canon for deciding.

## Sale Date and the 2017 Conversion Caveat

`sale.sl_dt` is the canonical sale date. The Benton pre-2017 PACS data
conversion caveat (recorded in C13-A amendment) means:

- Pre-conversion `sale.wac_cd` and `sale.sl_ratio_type_cd` may carry
  semantics that differ from current PACS code-table interpretation.
- Pre-conversion improvement-state and property-use codes may also
  drift.
- The conversion was effected by `CreatePropertyLayer.sql` (see PACS
  stored-procedure catalog) at the time the schema migration ran.

Future sales-comp / ratio-study transforms must either:

- Filter to `sl_dt >= 2017-01-01`, OR
- Carry an explicit `PreConversionData` reason on records dated
  earlier and require operator review.

## GIS via ArcGIS REST, not via PACS

GIS / spatial overlays (parcel boundaries, school districts, FEMA
flood zones, AVAs, zoning, fire districts) are **out of scope for the
PACS dataflow** and arrive through a separate canonical surface.

In Benton County the operator-confirmed source is
`Benton_spatial_data` — a separate database the operator's dashboard
SQL joins directly:

```sql
LEFT JOIN [Benton_spatial_data].[dbo].[PARCEL_FEMA] fema ON pv.prop_id = fema.prop_id
LEFT JOIN [Benton_spatial_data].[dbo].[PARCEL_SCHOOLDISTRICT] sd ON pv.prop_id = sd.prop_id
LEFT JOIN [Benton_spatial_data].[dbo].[parcel] coords ...
```

In the **production multi-county TerraFusion target** the canonical
surface is the **county's ArcGIS REST API** — `MapServer` /
`FeatureServer` endpoints exposing `query`, `identify`, `geometry`
operations. Most US counties operate ArcGIS Server installations for
their public GIS portal; the same endpoints serve internal county
applications.

### Why ArcGIS REST is the default GIS surface

- **Universality** — the majority of US counties run ArcGIS Server.
  Building a custom shapefile parser would be solo-dev-weeks of work
  for zero unique value over a stable REST API.
- **Currency** — ArcGIS REST returns the live published layer; a
  shapefile cache requires explicit refresh cycles and goes stale.
- **Authentication** — ArcGIS Server's auth model (token-based or
  Windows-integrated) is already understood by county IT.
- **Composition** — `MapServer/<id>/query` accepts spatial filters
  (intersects, contains, within) directly, returning JSON. Local
  shapefile parsing requires a spatial-indexing library and a query
  engine.

### Local shapefile cache (out of scope)

The shapefiles in `E:\PACS\xml\xml` (26× `.shp/.dbf/.prj` sets) are
the operator's local prototype cache from earlier exploration, not a
production delivery channel. Future TerraFusion work should:

- Read GIS data from ArcGIS REST endpoints, not from shapefile files.
- Document the `MapServer` / `FeatureServer` URL per county as
  configuration, not bundled data.
- Tolerate ArcGIS unavailability gracefully (counties' GIS servers
  occasionally restart) rather than failing hard.

## Old Harris Sync Service — Operational Patterns

### Vendor defaults vs operator-tuned (the 11-year delta)

The 2013 install manual specified default values. The 2026 operator
`settings.xml` shows what's actually been running for ~10 years.
Where they differ, **the operator-tuned values are the
operationally-proven baseline**.

| Setting | Vendor default (2013) | Operator-tuned (2026) | Lesson |
|---|---|---|---|
| `PageSize` | 2000 | **250** | Smaller batches, fewer timeout failures |
| `LookupItemsPerPage` | 5000 | **50000** | Code tables ship in bigger chunks |
| `PhotosPerPage` | 10 | 10 (split into Upload/Download) | Stable |
| `RecalculateOnSync` | false | **true** | Auto-recalc on sync |
| `LogRequests` | false | **true** | Full API logging on |
| `EnableDebugging` | (not present) | **true** | Debug mode persistent |
| `MaxPCILogCount` | (not present) | 250000 | Log-rotation threshold |
| `PACSDBConnectionTimeoutInMinutes` | 20 | **50** | Longer timeouts for big tables |
| `MaxImageWidth` | (not present) | 800 | Photo downscaling for sync |
| `MaxImageHeight` | (not present) | 600 | Photo downscaling for sync |
| `EventTypeCodeFilters` | (not present) | `appr_note` | Sync only appraisal-relevant events |
| `MarshallAndSwiftEnabled` | (not present) | false | M&S cost manual integration disabled |

### Sync architecture patterns (from manual + live install)

| Pattern | Lesson |
|---|---|
| **Windows Service** | County IT shops accept service-on-PACS-server deployment. No Kubernetes literacy required. |
| **Separate sync-state DB** (`SyncService` alongside `pacs_oltp`) | Vendor convention; not required, but a clean boundary. TerraFusion's choice to keep sync state in the kernel DB is a different defensible call. |
| **`cc*` tables added to `pacs_oltp`** | The vendor sync service installs metadata tables INTO the production DB (`ccProperty` carrying `mobile_assignment_group_id`, etc.) and uses them as the watermark. **TerraFusion's coexistence story must read these tables to know what's already been touched.** |
| **Time-window chunking** | 15-minute change windows from `last_sync_time` forward to `now()`. Resumable after failure. |
| **Property selection SQL** | Operator-customizable; expect counties to refine the default over years. |
| **Retry policy** | 3 attempts × 10-second interval × 8-minute API timeout; proven shape. |
| **Daily 12:01 AM scheduling** | Runs in the maintenance window; doesn't fight production. |
| **Separate Push / Down / Refresh / Reassociate / Relink / PurgeHistory tasks** | Lifecycle is explicit. The "Uninstall" task is a first-class cleanup mode. |

### Credential model (operator-norm, not aspirational)

The live `settings.xml` carries plaintext SQL credentials and
plaintext CamaCloud API keys. **This is the existing operating norm**
on the assessor's machine — county IT secured at the OS / network /
endpoint layer, not at the file-content layer.

Future TerraFusion deployment should match-or-improve this
operational simplicity. Adding a HashiCorp Vault or Azure Key Vault
dependency without a county-IT use case to justify it is a step
backward in operational simplicity. The credential-handling story
should be:

- Match the existing model by default (config file with restricted
  ACLs).
- Offer an opt-in upgrade path to managed secrets (KMS / Vault) for
  counties that have the IT investment.
- Never require the upgrade path for baseline deployment.

## What This Enables (non-binding)

The following are *implications* — what future slices reading this
policy may build on. None of them is a forward commitment; each
remains subject to the slice card pattern's own design + approval
cycle when its time comes.

- **C22-A — `property_use` dictionary loader**: inherits the
  composite-key + UDI-filter + paging-pattern from this policy. Loads
  the `property_use` dictionary table from PACS into a workbook-side
  shape that supports operator-confirmed Mapped promotion of the 62
  Deferred valuation rows from C16-D.

- **C20-C — `hood_cd` workbook extension**: inherits the year-keyed
  neighborhood dictionary semantics from this policy. Adds
  `property_val.hood_cd` membership column AND the
  `(hood_cd, hood_yr)` dictionary to the workbook.

- **Sales-comp scoring engine**: inherits `chg_of_owner_id` as the
  sale-provenance pointer; inherits the 2017 conversion caveat as a
  filter / reason-flag input; inherits property identity composite
  for join shape.

- **Ratio-study features (matching `DORReportStratification` /
  `ProfileSaleStats`)**: inherits the DOR strata flags
  (`is_sample`, `senior_flag`, `forestland_flag`,
  `dor_use_singlefamily_flag`, etc.) as canonical-value vocabulary.

- **ArcGIS REST connector**: inherits the GIS-via-REST architectural
  decision from this policy. Per-county configuration captures the
  `MapServer` / `FeatureServer` URL and per-layer field mappings.

- **Multi-county onboarding template**: inherits the property-type
  filter universe + UDI filter + sup-num strategy as per-county
  customization points; documents what's universal vs what varies.

- **CamaCloud coexistence read layer**: inherits the `cc*` tables
  inventory from the live install observation; reads, never writes,
  the vendor's metadata tables.

## Hard Non-Goals

This doc does NOT:

- Modify any workbook row.
- Change C3-loader behavior.
- Promote any Deferred row to Mapped.
- Build or change any code.
- Touch the running PACS Sync Service install.
- Pick which county to onboard next.
- Pick which sub-project from the brainstorm to advance first.
- Mandate a credential-management approach.
- Mandate a frontend / native-shell architecture.

It is a reference document. The C-series's slice card discipline
remains the gate for any slice that *consumes* this policy.

## What This Slice Is

Architectural lamination. The C-series moved from "we don't know the
canonical identity rules" to "we have them in versioned policy
memory" without writing any code. Future-Claude reading this doc
inherits the shape of the system without re-discovering it from
chat-history fragments.

## What This Slice Is Not

A schema migration. A C3-loader rewrite. A sync-service replacement.
A CamaCloud coexistence implementation. An ArcGIS REST client. A
dictionary loader. None of those are this slice. Each is a future
slice that will read this doc as input and produce its own design
through the slice card pattern.

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/sales-review-csv-policy.md` (C13-A + amendment) | sales-lane review contract + 2017 conversion caveat |
| `docs/sync/valuation-review-csv-policy.md` (C16-A) | valuation-lane review contract |
| `docs/sync/improvement-review-csv-policy.md` (C17-A + A2 + A3) | improvement-lane three-tier contract + i_attr_id mappings |
| `docs/sync/land-review-csv-policy.md` (C19-A) | land-lane review contract + RCW 84.34 awareness |
| `docs/sync/neighborhood-review-csv-policy.md` (C20-A + A2) | neighborhood-lane contract + hood_cd domain truth |
| `docs/sync/mapping-workbook-edit-cli-policy.md` (C9-A) | single-row edit contract |
| `docs/sync/mapping-workbook-batch-edit-policy.md` (C11-A) | batch edit grammar + atomicity |
| `docs/sync/mapping-workbook-lock-cli-policy.md` (C10-A) | lock CLI contract |
| `docs/sync/mapping-workbook-review-progress-policy.md` (C14-A) | review-progress dashboard contract |
| `docs/sync/pacs-canonical-dictionaries-reference.md` (C21-A) | PACS dictionary table catalog |
| **`docs/sync/pacs-canonical-dataflow-identity-policy.md` (D0-D)** | **this doc — identity / dataflow / sync patterns** |

D0-D sits one layer below the C-series review policies: the C-series
documents *what we review*; D0-D documents *the identity and dataflow
rules underneath the review*. Both are versioned in `docs/sync/`.
