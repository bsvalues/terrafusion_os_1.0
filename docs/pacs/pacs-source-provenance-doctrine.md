# PACS Source Provenance Doctrine

**Status:** binding architecture. Layer above
`docs/pacs/pacs-ingestion-spine.md`. The ingestion spine answers
*how to ingest correctly*. This doctrine answers *how do we know
what we have is what we think it is*. Both are required; neither
is sufficient alone.

**Hard doctrine:**

> **`product.properties` is not allowed to mean "PACS parcel."**
> It may only mean "TerraFusion runtime parcel **derived from a
> proven PACS/source truth row.**"
>
> Until a row can answer:
> - Which source family?
> - Which database / file / restore?
> - Which query?
> - Which `(prop_id, prop_val_yr, sup_num)` triple?
> - Which load batch?
>
> …it is not truth. It is a row wearing county shoes.

---

## 1. PACS is not one pipeline. It is four different truths.

### 1.1 Operational CamaCloud truth

The daily-sync truth. Source: the CamaCloud Sync Service config
selection query (`E:\PACS\PACS\settings.xml`):

```sql
prop_supp_assoc → property → pacs_system → property_val → ccProperty
WHERE p.prop_type_cd IN ('R','MH')
  AND (pv.prop_inactive_dt IS NULL OR pv.udi_parent = 'T')
  AND pv.udi_parent_prop_id IS NULL
```

Owns: what gets pushed to CamaCloud nightly. Mobile-appraisal scope.

### 1.2 PACS valuation truth

The CAMA truth. Every valuation-side table keys on
`(prop_id, prop_val_yr, sup_num, sale_id=0)`. Source: the operator's
analytical SQL pile and the WSDOR DOR procedures.

Owns: appraisal values, depreciation, neighborhood factors,
classified/non-classified breakdowns. The audit-grade source for
ratio studies and assessment rolls.

### 1.3 Public / access / export truth

NOT the same as operational truth. PACS includes
`ExportPropertyAccess_backup` and similar procedures that build
separate `web_internet_<county>_auto` databases for the public
PropertyAccess website. Public-facing parcel exports are
transformed, flattened, filtered, or denormalized before reaching
end users.

Owns: what the public sees. **Different shape from internal
operational truth. Cannot be assumed equal to either CamaCloud or
WSDOR rolls.**

### 1.4 Legacy / loader truth

What's actually in our TF DB right now. The current `Properties`
table has 128k rows including 23k Personal Property, no `sup_num`,
no `prop_val_yr`, empty `OwnerName`, and 440k `pacs_sales` keyed
by a UUID column that doesn't even join correctly. That came from
**none of the three truth sources above**. It came from a `PacsData
Seeder` running `SELECT * FROM property` against `pacs_oltp`
without filters, against an unknown restore vintage.

Owns: nothing legitimate. Currently exists because it was already
there.

### 1.5 The doctrine implication

A TerraFusion runtime row claiming to be "a Benton parcel" must
declare which of these four truths it derives from. Without that
declaration, the row is not allowed to influence any product
behavior.

---

## 2. The five-schema architecture

Five named schemas. Promotion only flows downstream. Each schema
has a different contract.

```text
┌─────────────────────────────────────────────────────────────┐
│ raw_pacs.*                                                  │
│   Exact source extracts. Faithful to PACS column shape.     │
│   No transforms. No filters. No joins. No interpretation.   │
│   Carries source lineage on every row.                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ promotion gate: SOURCE_QUERY_HASH match,
                          │ load_batch_id present, row count assertion
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ truth_pacs.*                                                │
│   Versioned PACS truth. Per the ingestion-spine blueprint.  │
│   Joins applied per the operator's authoritative idiom.     │
│   prop_supp_assoc spine; (prop_id, prop_val_yr, sup_num).   │
│   No TerraFusion-product assumptions.                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ promotion gate: spine version uniqueness,
                          │ owner-name coverage, qualified-sale-axis
                          │ static check, all 11 truth gates green
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ canonical_tf.*                                              │
│   Transformed TerraFusion model. UI-shaped. Consumer-ready. │
│   Renames PACS columns to operator-meaningful labels.       │
│   Denormalizes per the truth views in spine §7.             │
│   Never references raw_pacs directly.                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ promotion gate: canonical contract test,
                          │ no PII bleed, county-isolation green
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ product.*                                                   │
│   County Studio / Valuation / Sales / GIS runtime tables.   │
│   The frontend reads these. Only these.                     │
│   Every row carries source lineage to truth_pacs.           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ legacy_tf_unproven.*                                        │
│   Existing TF DB tables whose lineage we cannot prove.      │
│   Quarantine, not deletion. Classified UNPROVEN/BLOCKED.    │
│   Read-only. Not promoted to product.* until proven.        │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Why five schemas

- **`raw_pacs`** preserves the ability to reload, reprove, and
  re-derive. If the operator finds a column we missed, we don't
  re-query PACS — we reproject from raw.
- **`truth_pacs`** isolates the operator's authoritative idiom from
  consumer convenience. The truth layer can be re-shaped without
  re-ingesting; consumer renames don't bleed into the audit trail.
- **`canonical_tf`** is the contract-stable layer. Frontend depends
  on it. Truth-layer changes don't break frontend.
- **`product`** is the actual API surface. It can have additional
  derived state (bookmarks, user annotations, county-specific
  computed columns) without polluting truth.
- **`legacy_tf_unproven`** quarantines the current `Properties` /
  `pacs_sales` / `CanonicalSaleQualifications` until each row can
  prove its lineage. Quarantine, not delete. Some rows might be
  re-classifiable as proven once we identify their loader source.

### 2.2 What can't cross what

- `product.*` cannot reference `raw_pacs.*`. Ever.
- `product.*` cannot reference `legacy_tf_unproven.*`. Ever.
- `canonical_tf.*` cannot reference `legacy_tf_unproven.*`.
- `truth_pacs.*` cannot reference `legacy_tf_unproven.*`.
- `raw_pacs.*` is write-only from ingestion services. Read-only to
  everything else.
- `legacy_tf_unproven.*` is read-only quarantine. No service writes
  to it after the initial classification.

---

## 3. The `source_provenance.load_batch` ledger

The first-class object that makes lineage real. Every row in every
`raw_pacs.*` / `truth_pacs.*` / `canonical_tf.*` / `product.*` table
must reference a `load_batch_id`. Without it, the row is not
provenanced.

### 3.1 Schema

```sql
CREATE TABLE source_provenance.load_batch (
    load_batch_id           uuid         PRIMARY KEY,
    source_family           varchar(64)  NOT NULL,    -- 'PACS_OLTP', 'CAMACLOUD', 'PACS_BACKUP', 'PROVAL', 'ASCEND', 'CIAPS', etc.
    source_system           varchar(128) NOT NULL,    -- 'JCHARRISPACS', 'tf-mssql', 'api.pacs.camacloud.com', etc.
    source_file_or_database varchar(256) NOT NULL,    -- 'pacs_oltp', 'pacs_oltp_backup_2026_01_15.bak', '/e/PACS/Asend and Proval/Real_tables1.mdb'
    source_query_name       varchar(256),             -- 'gold_active_real_parcels', 'wsdor_real_roll_2026', etc.
    source_query_hash       varchar(64)  NOT NULL,    -- SHA-256 of the executed query body
    restore_source          varchar(256),             -- if source_file is a .bak, where it came from
    operator                varchar(128) NOT NULL,    -- who triggered this load
    started_at              timestamptz  NOT NULL,
    completed_at            timestamptz,
    status                  varchar(32)  NOT NULL,    -- 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIAL'
    proof_gate_report_path  varchar(512),             -- where the truth gates output went
    rows_extracted          bigint,
    rows_promoted           bigint,
    error_summary           text,                     -- sanitized; no secrets
    created_at              timestamptz  NOT NULL DEFAULT now()
);
```

### 3.2 Source family enum (authoritative list)

```text
PACS_OLTP             — live read of pacs_oltp (Harris production DB)
PACS_BACKUP           — restore from a *.bak file
CAMACLOUD             — pulled from api.pacs.camacloud.com
PACS_SPATIAL          — from pacs_spatial DB
PACS_LISTS            — from pacs_lists DB
TAAPPSVR              — from TAAppSvr DB
PROVAL                — legacy ProVal Plus (.mdb files)
ASCEND                — legacy Ascend tax companion
CIAPS                 — Critical Improvement Analysis (third-party)
BENTON_DYNLOADER      — building permit DynLoader (third-party)
LEGACY_UNKNOWN        — pre-doctrine load with unknown source family
```

`LEGACY_UNKNOWN` is the bucket for the current `Properties` table.
Every row of the existing `Properties` becomes a `legacy_tf_unproven.
properties_snapshot` row with `source_family = 'LEGACY_UNKNOWN'`.

### 3.3 Required columns on every downstream row

Every table in `raw_pacs`, `truth_pacs`, `canonical_tf`, and
`product` carries:

```sql
load_batch_id        uuid    NOT NULL REFERENCES source_provenance.load_batch(load_batch_id),
source_table         varchar(128)  NOT NULL,    -- 'property', 'property_val', 'sale', etc.
source_prop_id       int,                       -- denormalized for join debugging
source_prop_val_yr   int,                       -- denormalized for join debugging
source_sup_num       int,                       -- denormalized for join debugging
source_query_hash    varchar(64)   NOT NULL,    -- per-row redundancy
loaded_at            timestamptz   NOT NULL DEFAULT now(),
```

Reading any table you can answer "who loaded this, when, from
what" in one query, no joins. The denormalized
`(source_prop_id, source_prop_val_yr, source_sup_num)` triple is
operator-debug shorthand: a row carrying these can always trace
back to PACS even if our internal IDs change.

---

## 4. The lineage status enum (for legacy quarantine)

Every row in `legacy_tf_unproven.*` carries:

```sql
lineage_status     varchar(32)  NOT NULL,
                   -- 'UNPROVEN', 'PROVING', 'PROVEN_RE_PROMOTABLE', 'DISPROVEN'
promotion_status   varchar(32)  NOT NULL,
                   -- 'BLOCKED', 'PENDING_PROMOTION', 'PROMOTED', 'WITHDRAWN'
quarantine_reason  text,
classified_at      timestamptz NOT NULL,
classified_by      varchar(128) NOT NULL,
```

### 4.1 Lineage status semantics

- `UNPROVEN` — we have no confirmed source for this row. Default
  for any pre-doctrine TF DB row.
- `PROVING` — investigation in progress. Operator or agent is
  actively trying to identify the source.
- `PROVEN_RE_PROMOTABLE` — source identified, lineage matches a
  known load_batch, row is eligible for re-promotion to
  `truth_pacs` after re-running the gold query.
- `DISPROVEN` — source identified and confirmed wrong (e.g., row
  came from a one-shot test seed that should never have been
  promoted). Not eligible for re-promotion. Soft-delete.

### 4.2 Promotion status semantics

- `BLOCKED` — promotion is forbidden. Default for `UNPROVEN`.
- `PENDING_PROMOTION` — re-classified as `PROVEN_RE_PROMOTABLE`,
  awaiting next gold-query batch run.
- `PROMOTED` — successfully re-loaded into `truth_pacs` via a
  load_batch. The legacy snapshot stays for audit but is no longer
  authoritative.
- `WITHDRAWN` — `DISPROVEN` row that's been quarantined and will
  not promote.

### 4.3 The current TF DB's classification (binding)

```text
Table                                    | lineage_status | promotion_status | quarantine_reason
─────────────────────────────────────────┼────────────────┼──────────────────┼─────────────────────────────────────
Properties (128,788 Benton rows)         | UNPROVEN       | BLOCKED          | Missing prop_val_yr, missing sup_num,
                                         |                |                  | includes Personal Property, owner
                                         |                |                  | name uniformly NULL on R parcels,
                                         |                |                  | no source_query_hash, no load_batch
pacs_sales (440k rows)                   | UNPROVEN       | BLOCKED          | Missing source query identification,
                                         |                |                  | UUID ParcelId column does not match
                                         |                |                  | Properties.Id (joins via PacsPropId
                                         |                |                  | only), no load_batch
CanonicalSaleQualifications (0 rows)     | DISPROVEN      | WITHDRAWN        | Built around wac_cd / sl_ratio_type_cd
                                         |                |                  | qualification axis. PACS truth uses
                                         |                |                  | sl_county_ratio_cd. Empty by accident,
                                         |                |                  | not by design.
SyncMappingWorkbook + family             | DISPROVEN      | WITHDRAWN        | Authored canonical values for codes
                                         |                |                  | PACS already canonicalizes via lookup
                                         |                |                  | tables (sale_ratio_type, sale_type,
                                         |                |                  | sl_financing, deed_type). Solving a
                                         |                |                  | non-problem.
ComparableSales (259,102 rows)           | UNPROVEN       | BLOCKED          | Origin pipeline unknown. Possibly
                                         |                |                  | from an older one-shot seeder.
SaleRecords (0 rows)                     | DISPROVEN      | WITHDRAWN        | Empty alternate canonical landing.
                                         |                |                  | Vestigial.
```

---

## 5. The "row wearing county shoes" doctrine

A row can claim to represent a Benton parcel if and only if:

1. It carries `load_batch_id` referencing a real
   `source_provenance.load_batch`.
2. The load_batch's `source_family` is one of the recognized PACS
   sources (PACS_OLTP, PACS_BACKUP, CAMACLOUD).
3. The row carries `source_prop_id`, `source_prop_val_yr`, and
   `source_sup_num`.
4. The triple `(source_prop_id, source_prop_val_yr,
   source_sup_num)` is unique within the row's table for the
   load_batch's effective year.
5. The row carries `source_query_hash` matching the
   `load_batch.source_query_hash`.

If any of these five conditions fails, the row is:

- A flat parcel-shaped record that came from somewhere
- Not a verifiable PACS parcel
- "A row wearing county shoes"

`product.*` MUST refuse to render or expose such rows.

### 5.1 What this catches

- Personal Property rows in a Real Roll (gate 5: query hash
  declares R+MH; row was actually from an unfiltered SELECT).
- Duplicate rows from supplement collisions (gate 4: triple
  uniqueness).
- Orphan sale rows (gate 1: no load_batch).
- Test seed rows (gate 2: no recognized source family).
- Rows from the building permit import path leaking into the parcel
  pipeline (gate 2: `BENTON_DYNLOADER` is not a parcel source).
- Rows from CIAPS or PropertyAccess exports (gate 2: those are
  separate truth families with their own quarantine rules).

---

## 6. The promotion gates (per stage)

Every promotion is a gate-sequence. Failing any gate aborts the
promotion and surfaces the failure in the load_batch's
`error_summary`.

### 6.1 Source → `raw_pacs`

```text
Gate R-1: source_family in {PACS_OLTP, PACS_BACKUP, CAMACLOUD, ...}
Gate R-2: source_query_hash matches a known query manifest
Gate R-3: row count within ±5% of operator-supplied expected range
          for this source_family + source_query_name
Gate R-4: every row carries the five lineage columns
Gate R-5: leak scan zero-match across (Password, Pwd, SYNCATLAS_SECRET_, raw SA password)
```

### 6.2 `raw_pacs` → `truth_pacs`

```text
Gate T-1: spine version uniqueness — every (prop_id, prop_val_yr) has exactly one (sup_num)
Gate T-2: spine version coverage — every truth_pacs.parcel_spine row has a matching raw_pacs.prop_supp_assoc row
Gate T-3: active-parcel filter applied — no rows where prop_inactive_dt IS NOT NULL AND udi_parent != 'T'
Gate T-4: type filter applied — no Personal Property rows in real-property spine (and vice versa)
Gate T-5: owner-name coverage — vw_parcel_owner.owner_name non-NULL for ≥99% of rows
Gate T-6: sale-axis static check — vw_qualified_sales filters on sl_county_ratio_cd, NOT wac_cd / sl_ratio_type_cd
Gate T-7: junction coverage — every sale row resolves through chg_of_owner_prop_assoc to ≥1 property
Gate T-8: utility exclusion — vw_wsdor_real_roll has zero state/local-assessed utility rows
Gate T-9: county isolation — every row carries CountyId matching the load_batch's county scope
Gate T-10: prop_supp_assoc roundtrip — sample of 100 parcels matches live PACS via gold query (CI / on-demand)
```

### 6.3 `truth_pacs` → `canonical_tf`

```text
Gate C-1: contract test — every canonical_tf table emits the columns its consumer expects
Gate C-2: no raw_pacs reference — canonical_tf views/tables reference only truth_pacs
Gate C-3: PII redaction applied where required
Gate C-4: county isolation preserved
```

### 6.4 `canonical_tf` → `product`

```text
Gate P-1: every product row carries lineage to canonical_tf row
Gate P-2: no UNPROVEN / DISPROVEN row enters product
Gate P-3: product schema versioned — frontend contract test green
Gate P-4: no legacy_tf_unproven references
```

---

## 7. The relationship to the ingestion-spine blueprint

`docs/pacs/pacs-ingestion-spine.md` defines:

- The eight ingestion phases (which raw_pacs tables to populate
  and in what order).
- The truth-view SQL bodies (which become `truth_pacs.*` views).
- The eleven quality gates (which become `truth:pacs-*` scripts).

This doctrine adds:

- The `raw_pacs` layer that the spine's ingest phases write to
  (the spine assumed direct SQL Server → TF DB; the doctrine
  inserts a faithful raw layer in between).
- The `source_provenance.load_batch` ledger that every ingest
  must register against.
- The `legacy_tf_unproven` quarantine for current TF DB rows.
- The lineage_status / promotion_status enums.
- The five-stage promotion sequence (source → raw → truth →
  canonical → product) instead of the spine's three-stage
  (source → mirror → truth-view).
- The four-truths framing (operational vs valuation vs public/
  access vs legacy/loader).

Where the spine and doctrine disagree, the doctrine wins. The
spine is implementation guidance for the truth_pacs layer; the
doctrine is binding architecture for everything around it.

### 7.1 What the spine document needs to be amended to reflect

When implementation starts:

- Insert `raw_pacs.*` ingest tables between PACS source and
  `truth_pacs.*` (the spine's tier-1 mirrors are renamed
  `raw_pacs.*` and become non-public).
- Add `source_provenance.load_batch` references on every spine
  table.
- Re-frame the spine's "Phase A → Phase E migration" against the
  five-schema architecture.

(The spine document itself is not edited here. Implementation
slices will reconcile.)

---

## 8. Doctrine implications for prior work

| Asset | Pre-doctrine status | Post-doctrine classification |
|---|---|---|
| `Properties` table (128,788 rows) | "Benton parcel data" | `legacy_tf_unproven.properties_snapshot`, UNPROVEN/BLOCKED |
| `pacs_sales` (440k rows) | "Benton sale data" | `legacy_tf_unproven.pacs_sales_snapshot`, UNPROVEN/BLOCKED |
| `CanonicalSaleQualifications` | "Comp pool" | `legacy_tf_unproven.canonical_sale_qualifications_snapshot`, DISPROVEN/WITHDRAWN |
| `ComparableSales` (259k) | "Comparable sales" | `legacy_tf_unproven.comparable_sales_snapshot`, UNPROVEN/BLOCKED |
| `SyncMappingWorkbook` family | "Authoring substrate" | DISPROVEN/WITHDRAWN — solves a non-problem (PACS canonicalizes already) |
| C8-A → C36 → BENTON-SYNC-7 | "Sales qualification pipeline" | DISPROVEN — wrong column for qualification |
| C50-CONV era manifest | "Conversion era boundary" | UNPROVEN — speculative without ProVal/Ascend reading |
| C51-PII manifest | "PII classification" | UNPROVEN — not aligned with actual PII surface |
| OPS-1 console | "Operator control surface" | Read-only quarantine viewer until truth_pacs lands |
| Truth-script audit pattern | "Quality gates" | PROVEN — survives, becomes the gate machinery for raw → truth |
| `wash_prop_owner_val` understanding | New | Required for `truth_pacs.parcel_value` |
| Two-tier mirror+truth-view design | "Just a design" | Subsumed by five-schema doctrine |

---

## 9. What this architecture eliminates permanently

If §6 promotion gates are enforced:

- **No `Properties` row without lineage.** The frontend cannot
  render anything for which the API cannot answer "where did this
  come from?"
- **No silent re-ingest of bad data.** A future seeder cannot
  re-create 128k flattened rows because the load_batch must declare
  source_query_hash; the gold query's hash is fixed and known.
- **No accidental schema drift between four truths.** Each truth
  has its own load_batch family. CamaCloud-derived truth never
  pretends to be WSDOR-derived truth.
- **No untraceable test seeds in production.** A test seed needs
  its own `LEGACY_UNKNOWN` load_batch and gets quarantined the
  moment it lands.
- **No "is it 128k or 89k or 24k parcels"** confusion. Each count
  derives from a load_batch's source_query_hash. Every count is
  named by what it counts.
- **No cross-truth contamination.** A row from
  `BENTON_DYNLOADER` (building permits) cannot leak into the
  parcel pipeline because its source_family is forbidden upstream.

---

## 10. What survives (consolidated)

From the BENTON-SYNC / OPS-1 era, the following survives the doctrine:

- **The truth-script pattern** (`pnpm run truth:*`). Repurposed as
  the gate machinery for raw → truth → canonical → product.
- **County isolation discipline.** Every load_batch is county-scoped.
- **The OPS-1 console concept.** Becomes the operator-facing
  viewer of `source_provenance.load_batch` plus the truth gate
  reports.
- **The leak-scan discipline** (pattern + raw-value scans on
  artifacts). Becomes Gate R-5.
- **The `wash_prop_owner_val` discovery.** Becomes part of the
  spine's truth-layer required tables.
- **The sup_num / prop_supp_assoc understanding** (just acquired).
  Becomes the foundation of every spine table.
- **The five-question OPS-1 readiness model.** Becomes the
  five-schema-promotion-status panel.

---

## 11. What dies (consolidated)

- **`PacsDataSeeder.SeedAllAsync` and `SeedSalesOnlyAsync`** as
  currently implemented. Replaced by load_batch-aware ingestion
  services per source_family.
- **`DevPropertySeeder` projection from `PacsParcel` to
  `Properties`.** Replaced by truth_pacs → canonical_tf →
  product promotion gates.
- **C8-A sales qualification transform.** Replaced by
  `vw_qualified_sales` with `sl_county_ratio_cd` axis.
- **C36 canonical sales runner.** Replaced by
  `truth_pacs.qualified_sale` view + canonical_tf promotion.
- **The C50-CONV era manifest family.** Quarantined as DISPROVEN
  pending ProVal/Ascend reading.
- **The C51-PII manifest family.** Quarantined as UNPROVEN
  pending real PII surface enumeration (`account.file_as_name`,
  `address.addr_line*`, `owner.owner_id` SSN, etc.).
- **The C52-OVR exported FK family.** Premature scaling; survives
  conceptually but not as live machinery until raw_pacs lands.
- **The ad-hoc `Properties` API endpoints.** Frontend refactored to
  read from canonical_tf views.

---

## 12. Definition of done for this doctrine

This doctrine is signed when:

1. **Operator confirms the four-truths framing** — operational vs
   valuation vs public/access vs legacy/loader.
2. **Operator confirms the five-schema architecture** — raw_pacs,
   truth_pacs, canonical_tf, product, legacy_tf_unproven.
3. **Operator approves the `source_provenance.load_batch` schema**
   in §3.1, or supplies amendments.
4. **Operator approves the source_family enum** in §3.2, or
   supplies amendments (additions only — not removals).
5. **Operator approves the legacy classification table** in §4.3 —
   particularly the DISPROVEN judgments on C8-A / C36 / SyncMapping
   Workbook / SaleRecords.

After those five confirmations, the doctrine is binding. The next
slice is mechanical: create the schemas, write the migrations,
classify the legacy snapshots, run the first proven load_batch.

---

## 13. What I commit to NOT do until this is signed off

- No `raw_pacs.*`, `truth_pacs.*`, `canonical_tf.*`, or
  `legacy_tf_unproven.*` schema creation.
- No `source_provenance.load_batch` table.
- No new EF migrations.
- No edits to `PacsDataSeeder` or `DevPropertySeeder`.
- No deletion or rename of the current `Properties`, `pacs_sales`,
  `CanonicalSaleQualifications`, `SyncMappingWorkbook` family.
- No further BENTON-SYNC-* / OPS-* / Track-2F slices.
- No code that would write to product runtime.

This doctrine is the gate. The five operator confirmations in §12
unlock the schema-creation phase. Without them, every code change
is more sand on the same foundation.

---

## 14. Concrete next move (after sign-off)

Per the operator's directive:

1. Create `source_provenance.load_batch` table.
2. Create `raw_pacs.*` schema (empty).
3. Create `truth_pacs.parcel_spine` (empty, schema only).
4. Create `legacy_tf_unproven.properties_snapshot` table by COPY
   of current `Properties` with all rows classified as
   UNPROVEN/BLOCKED, `quarantine_reason = 'Missing prop_val_yr/
   sup_num/source_query_hash'`.
5. Set the existing `Properties` table to read-only or rename it
   `legacy_tf_unproven.properties_active_view` so any code
   accidentally querying it gets the quarantine signal.

Then — and only then — author the gold-query load_batch and run
the first promotion source → raw_pacs → truth_pacs.parcel_spine.

---

## Appendix — sample row, end to end

A canonical Benton parcel for the 2026 roll, viewed through every
schema:

```text
raw_pacs.property
  load_batch_id: 7a2f3c9e-…
  source_table: 'property'
  source_family: 'PACS_OLTP'
  source_query_hash: a3f1…
  source_prop_id: 303405
  source_prop_val_yr: 2026
  source_sup_num: 0
  prop_id: 303405
  prop_type_cd: 'R'
  geo_id: '109884040000015'
  col_owner_id: 4521
  loaded_at: 2026-05-02T16:30:00Z
  …

raw_pacs.property_val
  load_batch_id: 7a2f3c9e-…
  source_table: 'property_val'
  source_prop_id: 303405
  source_prop_val_yr: 2026
  source_sup_num: 0
  prop_inactive_dt: NULL
  hood_cd: 'WK01'
  market: 425000
  imprv_val: 285000
  …

truth_pacs.parcel_spine
  load_batch_id: 7a2f3c9e-…
  prop_id: 303405
  prop_val_yr: 2026
  sup_num: 0
  geo_id: '109884040000015'
  prop_type_cd: 'R'
  property_use_cd: '11'
  market: 425000
  is_active: true
  is_udi_parent: false
  …

canonical_tf.parcel
  load_batch_id: 7a2f3c9e-…
  parcel_id: '109884040000015'         -- operator-meaningful
  prop_id: 303405
  prop_val_yr: 2026
  sup_num: 0
  total_market_value: 425000
  improvement_value: 285000
  land_value: 140000
  hood_cd: 'WK01'
  is_active: true
  source_family: 'PACS_OLTP'
  …

product.parcel
  load_batch_id: 7a2f3c9e-…
  parcel_id: '109884040000015'
  county_id: 19190019-1919-1919-1919-191919191919
  prop_id: 303405
  prop_val_yr: 2026
  sup_num: 0
  display_address: '123 Main St, Kennewick, WA'
  display_owner: 'Smith, John'
  total_market_value: 425000
  …
```

Five schemas. One row of truth. Every layer answers "where did
this come from?" in one query. **That is what the doctrine
requires.**

The loader confessed in crayon. The doctrine is the eraser, the
notebook, the fountain pen, and the locked filing cabinet.
