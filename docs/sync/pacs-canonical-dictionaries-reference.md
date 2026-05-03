# PACS Canonical Dictionaries Reference

**Slice:** C21-A (docs-only — establishes architectural memory of
the canonical PACS dictionary tables that supply the controlled
vocabulary for almost every column the C13 → C20 series has been
Deferring).
**Lifecycle layer:** workbook-extension readiness — the operator
just shared schema reference files and a working code-table query
catalog that, taken together, reveal the Mapping Workbook has
been working with one half of the relation. The other half (the
canonical dictionary side) is sitting in PACS and was simply
never loaded.
**Status:** reference doc; no workbook mutations; no code
changes; future slices will use this to plan dictionary-loading
work.

## Provenance

- C13-A → C13-F: Sales lane review (sales lane 100% Deferred —
  no canonical-vocabulary table available at the time).
- C16-A → C16-D: Valuation lane review (62 Deferred property_use_cd
  rows — no canonical-vocabulary table available at the time).
- C17-A → C17-D + C17-A2 + C17-A3: Improvement lane review across
  three tiers (175 Deferred rows — Tier 3 i_attr_id mappings
  recorded in C17-A3 from the operator's working SQL).
- C19-A → C19-B: Land lane review (89 Deferred rows — soil
  mnemonics + primary_use_cd; no canonical-vocabulary table
  available at the time).
- C20-A → C20-A2: Neighborhood policy + hood_cd domain truth +
  workbook gap (nbhd_descr is dictionary-side text;
  property_val.hood_cd is the canonical membership column,
  not in the workbook).
- **2026-04-28: Operator shared 11 PACS schema reference files**
  including:
  - `D:\Library\Library\PACs\Queries for all Codes in PACS (1).doc`
    (the catalog of code-table queries that PACS clients
    typically explain in open-records requests — author
    `eflowers`, last saved by `Bill Spencer`, 2017-11-29)
  - `E:\PACS\Files of SQL\Files of SQL\schemas\PACS\SCHEMA_impv_imprv_attr.txt`
    (the imprv_attr-related table catalog, 159 rows)
  - `E:\PACS\Files of SQL\Files of SQL\schemas\PACS\SCHEMA_impv.txt`
    (the imprv table column catalog, 9,219 rows)
  - `E:\PACS\Files of SQL\Files of SQL\schemas\PACS\SCHEMA_impv_Details.txt`
    (the imprv_detail table column catalog, 3,971 rows)
  - `E:\PACS\Files of SQL\Files of SQL\schemas\PACS\SCHEMA_BASE TABLE.txt`
    (the base-table catalog, 2,154 rows)
  - `E:\PACS\Files of SQL\Files of SQL\schemas\foreign keys.csv`
    (FK relationships, 1,332 rows; identical to `sys.foreign_keys.csv`)
  - `E:\PACS\Files of SQL\Files of SQL\schemas\sys.indexes.csv`
    (index inventory, 738 rows)
  - `E:\PACS\Files of SQL\Files of SQL\schemas\INFORMATION_SCHEMA.VIEWS.csv`
    (views catalog, 1,719 rows)
  - `E:\PACS\Files of SQL\Files of SQL\schemas\ProcedureName.csv`
    (stored procedures, 2,126 rows)
  - `E:\PACS\Files of SQL\Files of SQL\schemas\sys tables.csv`
    (the full column-by-column table catalog, 58,613 rows)

## The architectural finding

For almost every column the C-series has been reviewing with
`Defer-by-default` decisions, **PACS already has a canonical
dictionary table** that lists the controlled vocabulary for that
code. The C3 profile loader populated the Mapping Workbook from
the *usage* side (which codes appear on which parcels, with
ObservedCount) but never joined the *dictionary* side (what each
code officially means).

The Defer-by-default posture has always been correct given the
information the workbook had. It is now correct in a different
way: the workbook needs the dictionary side loaded, and then a
large fraction of Deferred rows can convert to Mapped via
operator-confirmed dictionary lookup rather than per-row
guesswork.

## The code-table catalog (operator-supplied)

Reproduced from `Queries for all Codes in PACS (1).doc`. Each row
is `<dictionary table>` ↔ `<usage column(s)>` mapping in PACS.
Lane assignment is the C-series classification.

### Sales / ARB lane

| Dictionary table | Reviewable column(s) | Status in workbook |
|---|---|---|
| `_arb_inquiry_type` | inquiry-record type code | not in workbook |
| `_arb_inquiry_status` | inquiry-record status | not in workbook |
| `_arb_protest_type` | protest-record type code | not in workbook |
| `_arb_protest_status` | protest-record status | not in workbook |
| `deed_type` | `chg_of_owner.deed_type_cd` | informally referenced in C9-C / C11-C / C13-B notes; not in workbook as a reviewable column |
| `sale_type` | `sale.sl_type_cd` | not in workbook |
| `sl_financing` | `sale.sl_financing_cd` | not in workbook |

### Valuation lane

| Dictionary table | Reviewable column(s) | Status in workbook |
|---|---|---|
| **`property_use`** | `property_val.property_use_cd`, `property_profile.property_use_cd`, `land_detail.primary_use_cd` | **C16-A → C16-D reviewed 62 codes as Deferred**; canonical dictionary now identified |
| `region` | `property_val.rgn_cd` (in workbook, Other lane) | not yet reviewed |
| `sub_market` | `property_val.sub_market_cd` (in workbook, Other lane) | not yet reviewed |
| `state_code` | `land_detail.state_cd`, `property_val.prop_state` (in workbook, Other lane) | not yet reviewed |
| `tif_zone` | `property_val.tif_flag` (boolean, not coded) | n/a |

### Improvement lane

| Dictionary table | Reviewable column(s) | Status in workbook |
|---|---|---|
| `imprv_type` | `imprv.imprv_type_cd` (in workbook, Other lane, 6 codes) | not yet reviewed; lane-reclassification needed |
| `imprv_adj_type` | `imprv_adj.imprv_adj_type_cd` | likely not in workbook |
| **`imprv_attr_val` (where `imprv_yr = <year>`)** | `imprv_attr.i_attr_val_cd` | **C17-D Tier 3 reviewed 60 codes as Deferred**; canonical dictionary now identified; **C17-A3 has the i_attr_id mapping**; `imprv_attr_val` is per-attribute-id, per-year |
| **`imprv_det_class`** | `imprv_detail.imprv_det_class_cd` | **C17-C Tier 2 reviewed 21 codes as Deferred**; canonical dictionary now identified |
| `imprv_det_meth` | `imprv_detail.imprv_det_meth_cd` (in workbook, Other lane, 10 codes) | not yet reviewed |
| `imprv_det_sub_class` | `imprv_detail.imprv_det_sub_class_cd` (in workbook, Other lane, 2 codes) | not yet reviewed |
| `imprv_det_type` | `imprv_detail.imprv_det_type_cd` (NOT in workbook directly; but `MA / BSMT / U-BSMT / ATTGAR / DETGAR / carport / polebldg` documented in MEMORY.md) | C17-A3 cross-references but did not load |
| **(separate)** `attribute` table | `imprv_attr.i_attr_val_id` → joins to `attribute.imprv_attr_id`, gives `imprv_attr_desc` (Foundation, ExtWall, etc.) | C17-A3 has the values from operator SQL |
| **(separate)** `attribute_val` table | `imprv_attr.i_attr_val_id` + `imprv_attr.i_attr_val_cd` → composite key | not loaded; the per-attribute-id canonical value vocabulary lives here |

### Land lane

| Dictionary table | Reviewable column(s) | Status in workbook |
|---|---|---|
| `land_class` | `land_detail.land_class_code` (in workbook, Other lane, 12 codes) | not yet reviewed; lane-reclassification needed |
| `land_influence` | `land_detail.land_influence_code` (in workbook, Other lane, 0 codes) | not in active use |
| `land_meth` | `land_detail.mkt_val_source` / `ag_val_source` etc. | partial; in workbook Other lane |
| **`land_soil`** | `land_detail.land_soil_code` | **C19-B reviewed 35 codes as Deferred**; canonical dictionary now identified |
| `land_state_type` | `land_detail.state_cd` (state-code dimension on land) | not yet reviewed |
| `land_type` | `land_detail.land_type_cd` (in workbook, Other lane, 12 codes) | not yet reviewed |
| `land_adj_type` (where `land_adj_type_year = <year>`) | `land_adj.land_adj_type_cd` | likely not in workbook |
| `abs_subdv` | `property_val.abs_subdv_cd` | not in workbook as reviewable column (used as join in operator dashboard SQL) |

### Neighborhood lane

| Dictionary table | Reviewable column(s) | Status in workbook |
|---|---|---|
| **`nbhd_codes`** | `property_val.hood_cd` | **C20-A2 documented the workbook gap**; `nbhd_codes` is the canonical dictionary table for `hood_cd` |
| (no separate table) | `neighborhood.nbhd_descr` | C20-A reviewed as dictionary-side text (not coded vocabulary) |

### Other / supporting

| Dictionary table | Reviewable column(s) | Status |
|---|---|---|
| `bld_permit_type` | `building_permit.bldg_permit_type_cd` | not in workbook |
| `bld_permit_sub_type` | `building_permit.bldg_permit_sub_type_cd` | not in workbook |
| `chg_reason` | `account.chg_reason_cd` | not in workbook |
| `entity_type` | `entity.entity_type_cd` | not in workbook |
| `event_type` | `event.event_type_cd` | not in workbook |
| `exmpt_type` | exemption-record type code | not in workbook |
| `image_type` | `pacs_image.image_type` | not in workbook |
| `prop_group_code` | property group | not in workbook |
| `property_type` | `property.prop_type_cd` (R/P/etc.) | not in workbook (the operator SQL filters to `prop_type_cd='r'`) |
| `pp_appr_meth_cd`, `pp_class`, `pp_condition`, `pp_density`, `pp_qual`, `pp_table_meth`, `pp_type` | personal property — out of scope for the current real-property focus | n/a |
| `sic_code` | SIC industry codes | not in workbook |

## What this enables

### Workbook columns whose Deferred decisions have a path to Mapped

Counting just the dictionary tables explicitly named in the
operator's catalog:

| C-series slice | Workbook column | Deferred rows | Canonical dictionary | Path |
|---|---|---:|---|---|
| C16-D | `property_val.property_use_cd` | 62 | `property_use` | dictionary lookup |
| C17-C | `imprv_detail.imprv_det_class_cd` | 21 | `imprv_det_class` | dictionary lookup |
| C17-D | `imprv_attr.i_attr_val_cd` | 60 | `imprv_attr_val` (composite with `i_attr_val_id` per C17-A3) | dictionary lookup with attribute-id context |
| C19-B | `land_detail.land_soil_code` | 35 | `land_soil` | dictionary lookup |
| (future C20-D) | `property_val.hood_cd` | not yet in workbook | `nbhd_codes` | requires C3-loader extension first |

**178 of the 400 Deferred rows in the workbook have a known
canonical dictionary table** that, once joined, enables operator-
confirmed Mapped promotion. The remaining 222 Deferred rows
(sales-side WAC + ratio codes, plus other improvement / land
columns) need either:

- separate dictionary tables (e.g. WAC codes are a Washington
  state-statute-driven set, may not have a PACS-side dictionary
  table), OR
- assessor judgment per the original C13-A policy intent.

### Workbook columns that need lane reclassification

Several columns currently in `Other` lane have canonical
dictionary tables and arguably belong in their proper lanes:

- `imprv.imprv_type_cd` (Other → Improvement, dictionary `imprv_type`)
- `imprv_detail.imprv_det_meth_cd` (Other → Improvement, dictionary `imprv_det_meth`)
- `imprv_detail.imprv_det_sub_class_cd` (Other → Improvement, dictionary `imprv_det_sub_class`)
- `land_detail.land_class_code` (Other → Land, dictionary `land_class`)
- `land_detail.land_type_cd` (Other → Land, dictionary `land_type`)
- `property_val.rgn_cd` (Other → Valuation, dictionary `region`)
- `property_val.sub_market_cd` (Other → Valuation, dictionary `sub_market`)
- `property_val.prop_state` (Other → Valuation, dictionary `state_code`)

### Architectural memory: where the schema files live

The 11 reference files are operator-local on a separate drive
(`D:` and `E:`), not in the repo. Future slices that need to
inspect them should reference these absolute paths:

```text
D:\Library\Library\PACs\Queries for all Codes in PACS (1).doc
E:\PACS\Files of SQL\Files of SQL\schemas\foreign keys.csv
E:\PACS\Files of SQL\Files of SQL\schemas\INFORMATION_SCHEMA.VIEWS.csv
E:\PACS\Files of SQL\Files of SQL\schemas\ProcedureName.csv
E:\PACS\Files of SQL\Files of SQL\schemas\sys tables.csv
E:\PACS\Files of SQL\Files of SQL\schemas\sys.foreign_keys.csv
E:\PACS\Files of SQL\Files of SQL\schemas\sys.indexes.csv
E:\PACS\Files of SQL\Files of SQL\schemas\PACS\SCHEMA_BASE TABLE.txt
E:\PACS\Files of SQL\Files of SQL\schemas\PACS\SCHEMA_impv.txt
E:\PACS\Files of SQL\Files of SQL\schemas\PACS\SCHEMA_impv_Details.txt
E:\PACS\Files of SQL\Files of SQL\schemas\PACS\SCHEMA_impv_imprv_attr.txt
```

## Recommended next slices (forward references; not promoted here)

The decisions below are operator-driven; this doc records options
without picking.

### Path A: dictionary-loading slice series (C22-A onward)

Build a workbook-extension capability that loads a PACS canonical
dictionary table into a `SyncMappingDictionary*` shape. Each
loaded dictionary becomes available to the C-series Mapping
Workbook for join-time canonical resolution. Concrete first
slice: `C22-A — load property_use dictionary` (smallest blast
radius, valuation lane is already 100% Deferred awaiting this).

### Path B: bulk Mapped-promotion via dictionary lookup (C22-B
+ slices)

For each of the 4 Deferred-and-dictionary-available column sets
(`property_use_cd`, `imprv_det_class_cd`, `i_attr_val_cd`,
`land_soil_code`), run a one-shot promotion that:
1. Reads the canonical dictionary table.
2. For each Deferred row whose SourceValue matches a dictionary
   entry, sets `canonical_value` = dictionary's canonical label
   and promotes `review_status` to `Mapped`.
3. Operator confirms the promotion in dry-run before apply.

This is operator-driven mass promotion, not autodetection: the
operator confirms the dictionary table is correct *once*, then
the dictionary lookup applies *that* operator decision to every
matching row.

### Path C: lane reclassification slice (C22-C)

Move the 8 Other-lane columns identified above into their proper
lanes (Improvement / Land / Valuation). Either:
- C3-loader configuration change (durable, retroactive on next
  reload), OR
- one-shot SQL update on `SyncMappingColumn.MappingLane` for
  those 8 rows (smaller blast radius, immediate dashboard
  reflection).

### Path D: workbook extension for hood_cd + sales-side codes

Per C20-A2, `property_val.hood_cd` is missing from the workbook.
The same is true for several sales-side codes (`sale.sl_type_cd`,
`sl_financing_cd`, etc.). A C20-C / C20-D / C13-G slice family
would extend the workbook to include those columns, then review
them with the dictionary-aware policy.

## Hard Non-Goals

This doc explicitly does NOT:

- Modify any workbook row.
- Change C3-loader behavior.
- Promote any Deferred row to Mapped.
- Pick which dictionary-loading path to take.
- Reclassify any lane.
- Add columns to the workbook.

It is a reference doc. The 11 schema files and the codes-queries
catalog are now memorialized. Future slices read this doc and
the source files when they're ready to act.

## What this slice is

Architectural memory: the C-series finally has the receipts on
which canonical dictionary tables exist for every reviewed
column. The Defer-by-default posture was correct without these
dictionaries. With them, a much larger fraction of Deferred rows
becomes promotable to Mapped through operator-confirmed
dictionary lookup rather than per-row guesswork.

## What this slice is not

A schema audit of all 11 reference files. The full content of
`SCHEMA_impv.txt` (9,219 lines), `SCHEMA_impv_Details.txt` (3,971
lines), `sys tables.csv` (58,613 lines), etc. is not transcribed
here. Future slices that need column-level detail on a specific
table should query the workbook's PACS connection directly or
read the relevant schema file as needed.
