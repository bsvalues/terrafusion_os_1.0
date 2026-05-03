# PACS Knowledge Supplement — the QUARANTINE find

**Status:** supplement to `docs/pacs/pacs-knowledge-baseline.md`. The
operator pointed at four directories inside our own repo's
QUARANTINE area that contain the **canonical PACS schema as code**
plus ~280 of the operator's working SQL files. This doc captures
what those materials change about prior architectural decisions.

**Honest grade:** the BENTON-SYNC-* family was built without ever
opening these directories. The schema-as-code projects were sitting
inside our repo the whole time.

## 1. What's in the four directories

### `QUARANTINE/top-level-dirs/BS_PACS/PACS DATA/`

**282 operator-authored SQL files.** The complete working query
pile — every analytical, audit, and certification query the
operator has written or reused over the years. Examples by category:

- **Sales / comps**: `APCSALES.sql`, `AppraisalCardInfoSales.sql`,
  `CompSalesAddComp.sql`, `CompSalesAddGrid.sql`,
  `CompSalesAddPropGrid.sql` (and ~15 more `CompSales*`).
- **Calculate Taxable family**: 25+ files (`CalculateTaxable.sql`,
  `CalculateTaxableInsertEntityVal.sql`, etc.). The actual taxable-
  value computation pipeline.
- **Appraisal**: `AppraisalAnalysisExport.sql`,
  `AppraisalCardDataGenerator.sql`, several `AppraisalCard*`.
- **Audit / business**: `BusinessClosedOrSoldReportQuery.sql`.
- **Certification**: `Certified_Mailer_Qualify.sql`,
  `Certified_Mailer_QualifyEX.sql`.
- **Comp equity**: `CompEquityCorpSelect.sql`,
  `CompEquityGetCorpPropInfo.sql`.

### `QUARANTINE/top-level-dirs/BS_PACS/Database/`

A full Visual Studio solution with:
- `DatabaseProjectpacs_oltp.sqlproj` — SQL Server Database Project
  for `pacs_oltp` (the production DB).
- `Spectrum Schema.pdf`, `Files managment Schema.pdf` — additional
  schema documentation.
- `Spectrum copy.s3db`, `Contacts copy.s3db`,
  `FileManagement copy.s3db` — separate operational SQLite DBs.
- A .NET app structure (`Controllers/`, `Services/`, `Models/`,
  `Middleware/`) — looks like an earlier TerraFusion / CAMA
  service.
- Workspace files: `PACS.code-workspace`, `Saas.code-workspace`,
  `CIAPS.code-workspace`.

### `QUARANTINE/top-level-dirs/BS_PACS/DatabaseProjectpacs_oltp/`

Same project, multi-tenant variant with stub directories for other
counties (`CO_ANTHONYV`, `CO_ArcGis`, `CO_CC1`, `CO_FGP`, `CO_MDP`).
Probably an export structure for replicating to other counties.

### `QUARANTINE/top-level-dirs/workspaces/PACS/JCHARRISPACS/`

**The motherlode.** SQL Server Database Projects for the actual
JCHARRISPACS server's databases:

| Project | Purpose |
|---|---|
| `DatabaseProjectpacs_training` | The pacs_oltp schema (used as training mirror) |
| `DatabaseProjectSyncService` | The CamaCloud Sync Service database |
| `DatabaseProjectCIAPS` | CIAPS schema |
| `DatabaseProjectReportServer` | SSRS report server |
| `DatabaseProjectTAAppSvr` | TrueAutomation App Server |
| `DatabaseProjectweb_internet_benton` | **The public-access truth — the third truth from the doctrine** |
| `jcharrispacsSSISDB_project` | SSIS integration packages (ETL) |

For pacs_training (= pacs_oltp shape):

- **2,090 tables** (`dbo/Tables/*.sql` — full DDL with constraints, indexes, triggers)
- **2,086 stored procedures** (`dbo/StoredProcedures/*.sql`)
- **1,687 views** (`dbo/Views/*.sql`)
- **102 functions** (`dbo/Functions/*.sql`)

Every table, every view, every stored procedure, every UDF — fully
captured as version-controlled SQL. This is the canonical source
of truth for PACS schema.

## 2. What this supplements in the knowledge baseline

### 2.1 Table schemas confirmed verbatim

`property` (35 columns including `col_owner_id`, `col_agent_id`,
`mass_create_run_id`, `simple_geo_id`, `reference_flag`,
`penpad_run_id`, `state_cd`, etc.):

```sql
CREATE TABLE [dbo].[property] (
    [prop_id]             INT            NOT NULL,
    [prop_type_cd]        CHAR (5)       NOT NULL,
    [prop_create_dt]      DATETIME       NULL,
    [geo_id]              VARCHAR (50)   NULL,
    [dba_name]            VARCHAR (50)   NULL,
    [col_owner_id]        INT            NULL,
    [col_agent_id]        INT            NULL,
    -- + 28 more columns
    CONSTRAINT [CPK_property] PRIMARY KEY CLUSTERED ([prop_id] ASC),
    CONSTRAINT [CFK_property_prop_type_cd] FOREIGN KEY ([prop_type_cd])
        REFERENCES [dbo].[property_type] ([prop_type_cd]),
    CONSTRAINT [CFK_property_state_cd] FOREIGN KEY ([state_cd])
        REFERENCES [dbo].[state_code] ([state_cd])
);
```

`prop_supp_assoc` (the version selector):

```sql
CREATE TABLE [dbo].[prop_supp_assoc] (
    [prop_id]      INT         NOT NULL,
    [owner_tax_yr] NUMERIC (4) NOT NULL,
    [sup_num]      INT         NOT NULL,
    CONSTRAINT [CPK_prop_supp_assoc] PRIMARY KEY CLUSTERED
        ([owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC),
    CONSTRAINT [CFK_prop_supp_assoc_prop_id] FOREIGN KEY ([prop_id])
        REFERENCES [dbo].[property] ([prop_id]),
    -- THE binding constraint:
    CONSTRAINT [CUQ_prop_supp_assoc_owner_tax_yr_prop_id]
        UNIQUE NONCLUSTERED ([owner_tax_yr] ASC, [prop_id] ASC)
);
```

The UNIQUE constraint on `(owner_tax_yr, prop_id)` is the **formal
proof** of the supplement-versioning invariant: for any
`(prop_id, year)`, exactly one `sup_num` is current. This is what
the doctrine's "single accountable origin" guard depends on.

`wash_prop_owner_val` (the WSDOR audit-grade values, 4-key
composite PK, 30+ value columns):

```sql
CREATE TABLE [dbo].[wash_prop_owner_val] (
    [year]                                NUMERIC (4)   NOT NULL,
    [sup_num]                             INT           NOT NULL,
    [prop_id]                             INT           NOT NULL,
    [owner_id]                            INT           NOT NULL,
    [land_hstd_val] / [land_non_hstd_val]               NOT NULL,
    [imprv_hstd_val] / [imprv_non_hstd_val]             NOT NULL,
    [ag_use_val] / [ag_market] / [ag_loss]              NOT NULL,
    [ag_hs_use_val] / [ag_hs_market] / [ag_hs_loss]     NOT NULL,
    [timber_use_val] / [timber_market] / [timber_loss]  NOT NULL,
    [timber_hs_use_val] / [timber_hs_market] / [timber_hs_loss] NOT NULL,
    [new_val_hs] / [new_val_nhs] / [new_val_p]          NOT NULL,
    [appraised] / [market]                              NOT NULL,
    [snr_frz_imprv_hs] / [snr_frz_land_hs]              NOT NULL,
    [appraised_classified] / [appraised_non_classified] NOT NULL,
    [taxable_classified] / [taxable_non_classified]     NOT NULL,
    [state_assessed]                                    NOT NULL,
    [destroyed_prop] / [destroyed_jan1_value]           NOT NULL,
    [destroyed_prorate_pct] / [prorate_type] / …        NULL,
    [boe_status]                          BIT           NOT NULL,
    -- and more
    CONSTRAINT [CPK_wash_prop_owner_val] PRIMARY KEY CLUSTERED
        ([year] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC)
);
```

New facts the doctrine should incorporate:

- **`destroyed_prop` + `destroyed_jan1_value` + `destroyed_jan1_classified_value` + `destroyed_jan1_non_classified_value` + `destroyed_prorate_pct` + `prorate_type` + `prorate_begin/end`** — disaster prorations for property destroyed mid-year. WSDOR rolls have to handle these.
- **`snr_frz_imprv_hs` / `snr_frz_land_hs`** — senior-citizen freeze values. Frozen at prior year for qualified seniors.
- **`boe_status`** — Board of Equalization status (whether under appeal).
- **`state_assessed`** — state-assessed values (for the state-utility exclusion the WSDOR Real Roll uses).

`sale` (60+ columns including the qualification axes, financing,
adjustments, descriptor fields):

```sql
CREATE TABLE [dbo].[sale] (
    [chg_of_owner_id]          INT             NOT NULL,
    [sl_dt]                    DATETIME        NULL,
    [sl_price]                 NUMERIC (14)    NULL,
    [adjusted_sl_price]        NUMERIC (14)    NULL,
    [sl_county_ratio_cd]       VARCHAR (10)    NULL,
    [sl_ratio_type_cd]         CHAR (5)        NULL,
    [sl_type_cd]               CHAR (5)        NULL,
    [sl_financing_cd]          CHAR (5)        NULL,
    [sl_adj_cd]                CHAR (5)        NULL,
    [sl_qualifier]             VARCHAR (10)    NULL,
    [include_no_calc]          CHAR (1)        NULL,
    [sales_exclude_calc_cd]    VARCHAR (10)    NULL,
    [wac_cd]                   VARCHAR (32)    NULL,
    -- 50+ other descriptor / financial columns
    CONSTRAINT [CPK_sale] PRIMARY KEY CLUSTERED ([chg_of_owner_id]),
    CONSTRAINT [CFK_sale_sl_county_ratio_cd] FOREIGN KEY ([sl_county_ratio_cd])
        REFERENCES [dbo].[county_ratio_code] ([ratio_cd]),
    CONSTRAINT [CFK_sale_reet_wac_code] FOREIGN KEY ([wac_cd])
        REFERENCES [dbo].[reet_wac_code] ([wac_cd]),
    CONSTRAINT [CFK_sale_sl_ratio_type_cd] FOREIGN KEY ([sl_ratio_type_cd])
        REFERENCES [dbo].[sale_ratio_type] ([sl_ratio_type_cd]),
    -- + sl_type_cd, sl_financing_cd, sl_adj_cd, sales_exclude_calc_cd FKs
);
```

New facts:

- **`sl_qualifier`** (varchar 10) — possibly an additional or
  alternate qualification axis. Operator's working SQL doesn't
  reference it; need to confirm with the operator.
- **`include_no_calc`** (char 1) — a flag whose semantic isn't
  documented. Likely "include in ratio study without per-axis
  calc."
- **`sales_exclude_calc_cd`** (varchar 10) — explicit exclusion code.
- **`wac_cd`** is a `VARCHAR(32)` (longer than I thought). FK is
  to `reet_wac_code` (REET = Real Estate Excise Tax — the tax
  associated with the sale).
- **`adjusted_sl_price`** — operator-adjusted sale price (e.g., for
  partial-interest sales).

### 2.2 The qualification-code correction (THIRD time we've found drift)

The doctrine had this rule:

```text
sl_county_ratio_cd IN ('01', '02')
```

That came from the operator's `appraise_hoods.sql` and
`res_condensed.sql`. **Live data refutes it.**

Production `dbo.sale` qualification-code distribution (Benton OLTP):

```text
sl_county_ratio_cd  | count   | meaning
--------------------+---------+-----------------------------------------
'100'               | 21,715  | Valid Sale         ← qualifies for ratio study
'200'               | 10,445  | Invalid Sale       ← excluded
'300'               |  3,363  | Land Only Sale
'400'               |    557  | Omitted Current Year; Review
'500'               |     33  | Dark Sales (Commercial)
'27'                |    260  | OTHER (legacy code, rarely used)
'0'                 |    219  | VALID SALE (legacy code from 2-digit era)
'9'                 |    115  | QUIT CLAIM DEED (legacy)
… (sparse tail)
```

The codes `'01'` and `'02'` **don't exist in production data**. The
operator's SQL was written when Benton used 2-digit codes; the
codes migrated to 3-digit at some point (likely when more counties
adopted PACS and 2-digit space wasn't enough).

**The corrected qualification rule, empirically validated:**

```sql
WHERE s.sl_county_ratio_cd = '100'   -- Valid Sale
  AND s.sl_price > 100
  AND YEAR(s.sl_dt) = TAXYEAR - 1    -- prior-year for ratio study window
```

If land-only or omitted-current-year sales are also wanted by the
operator, the rule becomes `IN ('100', '300', '400')`. Operator
confirmation needed.

**Lesson formalized**: when operator-supplied SQL references code
values, **always cross-check against the live `*_code` lookup
tables AND the actual distribution in the data**. SQL files are
operator memory; the lookup tables + data are operator truth. We
have now found three cases of drift:

1. C48 schema catalog claimed 13k tables when there are 2,154 base
   tables (we counted `_*` and `dbo_*` and similar internals).
2. Sales-axis confusion (`wac_cd` vs `sl_county_ratio_cd`).
3. Code-value drift (`'01','02'` vs `'100'`).

### 2.3 The fourth-truth confirmation

The doctrine listed four PACS truths: operational CamaCloud, PACS
valuation, public/access export, and legacy/loader. The
**`DatabaseProjectweb_internet_benton`** project confirms the
public-access truth as a real, independently-defined database with
its own schema. Its `dbo/` tree is an explicit data product, not
the same shape as `pacs_oltp`. Anyone comparing TerraFusion parcel
counts against the public-access website is comparing against a
**transformed export**, not against the operational truth.

### 2.4 The SyncService schema is captured

`DatabaseProjectSyncService/dbo/` exists as a separate Database
Project. The CamaCloud Sync Service has its own database (`SyncService`
per `settings.xml`'s `ServiceConnectionString`) where it tracks
which prop-year-sup tuples have been pushed to the cloud. We can
inspect this schema to understand exactly what gets synced and at
what cadence — without needing to reverse-engineer it.

### 2.5 The `BS_PACS/PACS DATA/` files are the operator's working library

282 SQL files. Including a complete `CompSales*` family that's
PACS's own comp-sales analysis system. The C8-A → C36 →
BENTON-SYNC-7 family was effectively reinventing what PACS's
`CompSales*` procedures already do natively. Reading those
procedures should be a hard prerequisite before designing any TF
comp engine.

## 3. What this changes about the doctrine

### 3.1 Updates to source-provenance doctrine

- The list of source families gains explicit confidence: **PACS
  schema-as-code projects exist in our repo** (under QUARANTINE),
  meaning the "PACS_BACKUP" source family doesn't have to wait on
  a `.bak` restore — we can derive table shape directly from the
  Database Projects.
- **`web_internet_benton` is the canonical name for the
  public-access truth.** Adding it to the source_family enum:
  `WEB_INTERNET_BENTON`.
- **`SyncService` is the canonical name for the CamaCloud bridge
  database.** Already covered by the `CAMACLOUD` source family in
  spirit; should add `PACS_SYNCSERVICE_DB` as a separate enum
  value if we ever ingest from it directly.

### 3.2 Updates to ingestion-spine

- **The Gold Query in §2** is correct on join shape but should be
  amended to reflect the discovered code reality:

  ```sql
  -- Existing:
  WHERE p.prop_type_cd IN ('R','MH')
    AND (pv.prop_inactive_dt IS NULL OR pv.udi_parent = 'T')
    AND pv.udi_parent_prop_id IS NULL
  -- (These remain correct; matched the Database Project DDL.)
  ```

- **The qualified-sale view (`vw_qualified_sales`) MUST use
  `sl_county_ratio_cd = '100'`**, not `IN ('01','02')`. The spine
  doc's §7.6 SQL body needs amendment when it reaches
  implementation.

- **Add `wash_prop_owner_val.destroyed_prop` and
  `boe_status` handling** to the `vw_parcel_current_value` view
  contract. Disaster proration and BOE-under-appeal status are
  WSDOR-required reporting axes.

### 3.3 Updates to v1 spec

The Sync Bridge v1 schema is unchanged — the control tower is
domain-agnostic by design. The `field_authority` seed row for
`property_type` should NOTE that the `R/MH/P` enum is
sourced from `dbo.property_type` (FK declared on `property`), so
authority for that enum is locked at the lookup-table level.

The `source_family` enum in v1's `LoadBatch` table should be
extended to recognize:

```text
WEB_INTERNET_BENTON   -- public-access export truth
PACS_SYNCSERVICE_DB   -- the CamaCloud bridge tracking DB
PACS_DBPROJECT        -- schema-as-code derived (when we ingest from
                         the .sqlproj files instead of live DB)
```

These can be added to the existing varchar column without a
migration.

## 4. What's still unread (honest)

- **The 2,086 stored procedures.** I read 2 (`MonitorDORAssessmentRollReal`,
  `MonitorDORAssessmentRollPersonal`). The rest are unread. The
  procedure names alone (per `ProcedureName.csv`, 2,126 entries)
  hint at families: `Monitor*` (assessment monitors), `_monitor_*`
  (operational monitors), `dor_*` (DOR-related), `LevyCalc*`
  (levy calculations), `_CertMail*` (certified mailing), etc.
- **The 1,687 views.** Including `____aSalesRatio_shape` (note
  the leading underscores — likely an analyst's draft/ratio-study
  view).
- **The 102 functions.** Including `dbo.fn_GetExemptions` already
  referenced in `Real_Prop_Monitor.txt`.
- **The 282 BS_PACS/PACS DATA files.** Including the full
  `CompSales*` family.
- **The web_internet_benton schema.** A separate truth product.
- **The SyncService schema.** What CamaCloud actually tracks.
- **The CIAPS schema.** Critical Improvement Analysis Process Sales.
- **The TAAppSvr schema.** TrueAutomation App Server.
- **The SSIS packages** in `jcharrispacsSSISDB_project`. ETL between
  these databases.

To be honest about expertise: I'm now at maybe 40-50% PACS
expertise vs the user's 85% bar. The schema-as-code projects make
it possible to get to 85% by mechanical reading rather than live
queries, but it's still hours of work.

## 5. What I should NOT do until the next directive

- Edit the doctrine doc, the ingestion spine doc, or the v1 spec
  (those are signed; supplement here, amend in a follow-up slice).
- Touch the v1 control-tower schema (it's fine).
- Start ingesting from any source.
- Read more files in this session — I have enough to commit, and
  any further reading without operator direction risks drift.

## 6. What I commit to do AFTER the next directive

- Read the `Monitor*` and `_monitor_*` stored procedure family —
  these encode the assessor's daily workflow.
- Read the `web_internet_benton` schema to understand what the
  public-access truth's shape is.
- Read the `SyncService` schema to understand the CamaCloud
  bridge tracking model.
- Read enough of the `CompSales*` SQL family to either consume
  PACS's existing comp engine OR document why TF needs its own.
- Then propose Phase 1.5 (raw_pacs.* schema + first real load_batch
  using the corrected qualification rule).

The schema-as-code projects in QUARANTINE are now the canonical
reference for any future PACS work. The 60-second answer to
"what's the schema of `<table>`?" is `cat
QUARANTINE/top-level-dirs/workspaces/PACS/JCHARRISPACS/DatabaseProjectpacs_training/dbo/Tables/<table>.sql`,
not "let me query the DB." That's a 60-second improvement we
should have made on day one.
