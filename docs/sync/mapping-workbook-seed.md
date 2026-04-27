# SyncAtlas Mapping Workbook Seed

> **Slice C1 — first reviewable mapping clipboard.** The atlas turned ghosts
> into a clipboard so the assessor goblins stop guessing.

This document is a human-reviewable starting point for the canonical
landing/mapping work that consumes `SyncProfileCodeCandidates`. It does
not propose final canonical schemas; it lists what the deep profiler
actually saw in the populated PACS source, with enough distribution
evidence to drive the next conversation.

The contents are derived from the most recent successful B2.7-OLTP
profile batch on the operator's local TerraFusion DB. To regenerate
against a fresh batch, see [Regeneration](#regeneration).

---

## Source Profile

| Field                   | Value                                                  |
| ----------------------- | ------------------------------------------------------ |
| Batch Id                | `6342a924-c235-43d5-b68c-0c0a70ead1e2`                 |
| Source connection       | `Benton PACS OLTP (tf-mssql)`                          |
| Source server / database | `localhost,1433` / `pacs_oltp`                        |
| Started                 | `2026-04-27 18:24:10 UTC`                              |
| Completed               | `2026-04-27 18:38:37 UTC`                              |
| Elapsed                 | `00:14:27` (structural pass dominates; deep pass ≈ 2:35) |
| Source `ReadCount`      | `107,909`                                              |
| `b2_table_stats`        | `10`                                                   |
| `b2_column_stats`       | `724`                                                  |
| `b2_code_candidates`    | `200`                                                  |
| Marker commit           | `9d6306397`                                            |
| LeakScan suspect rows   | `0`                                                    |

Tables included (canonical valuation set):

| Table                | Source Rows | Sample      | Method            |
| -------------------- | ----------- | ----------- | ----------------- |
| `dbo.imprv_detail`   | 8,890,175   | 9,338       | BernoulliSample   |
| `dbo.imprv_attr`     | 7,076,042   | 10,292      | BernoulliSample   |
| `dbo.owner`          | 2,539,100   | 11,435      | BernoulliSample   |
| `dbo.property_val`   | 2,539,028   | 10,365      | BernoulliSample   |
| `dbo.land_detail`    | 2,316,668   | 10,009      | BernoulliSample   |
| `dbo.imprv`          | 2,247,650   | 10,331      | BernoulliSample   |
| `dbo.sale`           |   425,251   | 9,779       | BernoulliSample   |
| `dbo.property`       |   128,949   | 9,458       | BernoulliSample   |
| `dbo.neighborhood`   |    27,876   | 27,876      | Full              |
| `dbo.property_use`   |        85   | 85          | Full              |

---

## Priority Mapping Candidates

Eight columns are flagged as **valuation-critical** for the Benton workbook.
They are the columns whose canonical mapping unblocks downstream work
(IAAO ratio studies, the Benton Method's %-of-BIV feature decomposition,
neighborhood / market-area analysis, and sales-comp qualification). The
top-5 values for each (drawn from the per-column top-N JSON) are public
codes — WA Administrative Code numbers, IAAO ratio-study type codes,
PACS use codes, quality grades. No PII.

### `dbo.property_val.property_use_cd` — primary classifier

63 distinct values over a 10,365-row sample (0.61% ratio).

| Top Value | Sample Count | % of sample |
| --------- | ------------ | ----------- |
| `11`      | 6,074        | 58.6%       |
| `18`      | 1,411        | 13.6%       |
| `83`      |   561        |  5.4%       |
| `81`      |   255        |  2.5%       |
| `63`      |   236        |  2.3%       |

**Suggested lane:** valuation classification. Top value `11` likely
maps to the residential lane; `18` to multi-family-ish; `83`/`81`
to mobile-home sub-lanes. The vocabulary is cross-referenced by
`land_detail.primary_use_cd` (same top values, same rough
distribution) and `sale.primary_use_cd` — canonical mapping should
unify the three.

### `dbo.sale.wac_cd` — sales qualification (real-estate excise tax)

55 distinct values over a 9,779-row sample (0.56% ratio).

| Top Value          | Sample Count | % of sample |
| ------------------ | ------------ | ----------- |
| `458-61A-203(1)`   | 131          |  1.3%       |
| `458-61A-217(1)`   |  59          |  0.6%       |
| `458-61A-201(b)(1)`|  44          |  0.5%       |
| `458-61A-203(2)`   |  35          |  0.4%       |
| `458-61A-109(2)(b)`|  34          |  0.3%       |

**Suggested lane:** sales qualification. These are Washington
Administrative Code citations for real-estate excise tax exemption
classes. The user-memory directive flagged "WacCd bug blocks all
comps" — the actual distribution shows the top entries are
exemption types, not arms-length transfers. Canonical mapping
should split sales by qualified-vs-not before they feed any IAAO
ratio study or comp analysis.

### `dbo.imprv_detail.imprv_det_class_cd` — Benton Method feature class

21 distinct values over a 9,338-row sample (0.22% ratio).

| Top Value | Sample Count | % of sample |
| --------- | ------------ | ----------- |
| `Avg `    | 2,838        | 30.4%       |
| `NONE`    | 1,771        | 19.0%       |
| `Fair`    | 1,340        | 14.4%       |
| `30  `    | 1,196        | 12.8%       |
| `Good`    |   613        |  6.6%       |

**Suggested lane:** improvement detail classification (Benton Method
%-of-BIV feature decomposition — patios 3%, basements 13%, shops
18%). The mixed shape of this column — quality words (`Avg`, `Fair`,
`Good`) interleaved with numeric codes (`30`) — is itself the
finding worth surfacing: this is two vocabularies sharing a column.
Canonical mapping needs to disambiguate before the Benton Method's
PRD/PRB/decile-equity loop can rely on it.

### `dbo.sale.sl_ratio_type_cd` — IAAO ratio-study qualification

24 distinct values over a 9,779-row sample (0.25% ratio).

| Top Value | Sample Count | % of sample |
| --------- | ------------ | ----------- |
| `00 `     | 2,464        | 25.2%       |
| `9  `     | 1,191        | 12.2%       |
| `27 `     |   394        |  4.0%       |
| `18 `     |   157        |  1.6%       |
| `12 `     |   103        |  1.1%       |

**Suggested lane:** IAAO ratio-study classification. `00` and `9`
together are 37.4% of the sample — likely "unqualified" / "default"
classes. Same scrutiny as `wac_cd`: a ratio-study run that
counts unqualified sales as if they were qualified is exactly
what the IAAO 1.4 standard cautions against.

### `dbo.land_detail.primary_use_cd` — land use classification

55 distinct values over a 10,009-row sample (0.55% ratio).

| Top Value | Sample Count | % of sample |
| --------- | ------------ | ----------- |
| `11`      | 2,550        | 25.5%       |
| `18`      |   669        |  6.7%       |
| `83`      |   256        |  2.6%       |
| `14`      |    89        |  0.9%       |
| `81`      |    81        |  0.8%       |

**Suggested lane:** land classification. Same numeric vocabulary as
`property_val.property_use_cd` — confirms cross-table use. Mapping
should canonicalize once.

### `dbo.land_detail.land_soil_code` — soil class (ag / land)

36 distinct values over a 10,009-row sample (0.36% ratio).

| Top Value | Sample Count | % of sample |
| --------- | ------------ | ----------- |
| `NONE`    | 7,702        | 76.9%       |
| `RANGE`   |    99        |  1.0%       |
| `DRAG1`   |    95        |  0.9%       |
| `RHS`     |    87        |  0.9%       |
| `IRAG1`   |    78        |  0.8%       |

**Suggested lane:** land classification (ag-specific). The 77%
`NONE` rate suggests the column is sparsely populated — most parcels
don't have a soil code on file. The non-NONE codes (`RANGE`, `DRAG1`
= dry agriculture grade 1, `IRAG1` = irrigated ag grade 1, etc.) are
actionable for ag valuation when present.

### `dbo.imprv.imprv_type_cd` — improvement type

6 distinct values over a 10,331-row sample (0.06% ratio).

| Top Value | Sample Count | % of sample |
| --------- | ------------ | ----------- |
| `R    `   | 6,697        | 64.8%       |
| `CONV `   | 1,668        | 16.1%       |
| `MHOME`   | 1,085        | 10.5%       |
| `C    `   |   685        |  6.6%       |
| `PERMC`   |   195        |  1.9%       |

**Suggested lane:** improvement classification. Clean, low-cardinality,
canonical-friendly. `R` = residential, `C` = commercial, `MHOME` =
mobile home, `CONV` = converted, `PERMC` = permanent commercial(?)
— short codes that map cleanly into a canonical improvement-type
lane.

### `dbo.imprv.imprv_state_cd` — improvement state code (heavy)

94 distinct values over a 10,331-row sample (0.91% ratio). Just under
the 5% candidate cap — the highest distinct-count of the priority
set. Mostly numeric (`520`, `513`, `541`, `548`, …). Likely a
PACS-internal categorical bin closer to a state-of-improvement-stage
code than a plain classifier — flagged as priority but the canonical
mapping needs the assessor's interpretation, not just frequency
statistics.

---

## Candidate Table (full priority set)

| Source Table     | Source Column          | Distinct | Ratio    | Suggested Lane                               | Review Status |
| ---------------- | ---------------------- | -------- | -------- | -------------------------------------------- | ------------- |
| `property_val`   | `property_use_cd`      | 63       | 0.61%    | Valuation classification (canonical primary) | pending       |
| `sale`           | `wac_cd`               | 55       | 0.56%    | Sales qualification (WA REET exemption)      | pending       |
| `imprv_detail`   | `imprv_det_class_cd`   | 21       | 0.22%    | Improvement detail / Benton Method           | pending       |
| `sale`           | `sl_ratio_type_cd`     | 24       | 0.25%    | IAAO ratio-study qualification               | pending       |
| `land_detail`    | `primary_use_cd`       | 55       | 0.55%    | Land use (cross-ref to property_use_cd)      | pending       |
| `land_detail`    | `land_soil_code`       | 36       | 0.36%    | Land classification (ag-specific)            | pending       |
| `imprv`          | `imprv_type_cd`        | 6        | 0.06%    | Improvement classification                   | pending       |
| `imprv`          | `imprv_state_cd`       | 94       | 0.91%    | Improvement state / stage (interpretation TBD) | pending     |
| `imprv_attr`     | `i_attr_val_cd`        | 60       | 0.58%    | Improvement attribute values                 | pending       |
| `neighborhood`   | `nbhd_descr`           | 95       | 0.34%    | Neighborhood / economic area                 | pending       |
| `property_val`   | `secondary_use_cd`     |  6       | 0.06%    | Valuation classification (secondary)         | pending       |
| `sale`           | `sl_type_cd`           | 18       | 0.18%    | Sales type (cash / contract / etc.)          | pending       |
| `sale`           | `sl_class_cd`          | 17       | 0.17%    | Sales class                                  | pending       |
| `sale`           | `sl_imprv_type_cd`     |  6       | 0.06%    | Sales improvement type (sale-snapshot)       | pending       |
| `sale`           | `sl_land_type_cd`      | 11       | 0.11%    | Sales land type (sale-snapshot)              | pending       |
| `sale`           | `primary_use_cd`       | 44       | 0.45%    | Sales primary use (sale-snapshot)            | pending       |
| `sale`           | `sl_county_ratio_cd`   |  9       | 0.09%    | County-specific ratio bucket                 | pending       |
| `imprv`          | `primary_use_cd`       | 45       | 0.44%    | Improvement primary use (cross-ref)          | pending       |
| `property`       | `state_cd`             | 42       | 0.44%    | Property state code                          | pending       |
| `imprv_detail`   | `condition_cd`         | 13       | 0.14%    | Improvement condition                        | pending       |
| `land_detail`    | `land_class_code`      | 13       | 0.13%    | Land class                                   | pending       |
| `land_detail`    | `land_type_cd`         | 12       | 0.12%    | Land type                                    | pending       |
| `imprv_detail`   | `imprv_det_meth_cd`    | 10       | 0.11%    | Improvement detail method                    | pending       |

(Top 23 of 200 candidates. Full set lives in `SyncProfileCodeCandidates`
for the listed batch — query is in [Regeneration](#regeneration).)

---

## Recommended Next Mapping Lanes

These are the lane groupings the priority columns naturally fall into.
Each lane is the smallest canonical surface that unblocks one piece of
downstream Benton-County valuation work.

1. **Valuation classification (primary)** — unifies
   `property_val.property_use_cd`, `land_detail.primary_use_cd`,
   `imprv.primary_use_cd`, and `sale.primary_use_cd` (all sharing the
   numeric `11/18/83/…` vocabulary). One canonical use-code lookup;
   mappings recorded once. Unblocks the property-by-use rollup queries
   the dashboard suite needs.

2. **Sales qualification** — `sale.wac_cd` (REET exemption class) +
   `sale.sl_ratio_type_cd` (IAAO study type) + `sale.sl_type_cd` +
   `sale.sl_class_cd`. Canonical mapping should mark each entry as
   *qualified-for-comps* / *unqualified* / *exempt-transfer*, so any
   ratio study or comp pull filters at the source. Directly addresses
   the "WacCd bug blocks all comps" finding.

3. **Improvement detail / Benton Method** — `imprv.imprv_type_cd`,
   `imprv_detail.imprv_det_class_cd`, `imprv_detail.condition_cd`,
   `imprv_detail.imprv_det_meth_cd`, `imprv_attr.i_attr_val_cd`.
   The %-of-BIV feature decomposition (patios 3% / basements 13% /
   shops 18%) needs canonical class + method codes before it can run
   reliably. Note the mixed-vocabulary finding on
   `imprv_det_class_cd` (quality words AND numeric grades) — that's
   a data-cleanup mapping decision, not a pure lookup.

4. **Land classification** — `land_detail.land_class_code`,
   `land_detail.land_type_cd`, `land_detail.land_soil_code`. Soil
   codes are sparse (76.9% NONE); the workbook should record both
   the canonical lookup AND a "missing data" policy.

5. **Neighborhood / economic area** — `neighborhood.nbhd_descr`
   (95 distinct). Single high-cardinality vocabulary; canonical
   mapping should produce stable economic-area identifiers usable
   by the Studio, Forge, and Dais lanes.

---

## What This Document Is Not

- **Not a final canonical schema.** It does not propose tables,
  columns, or migration shape. Slice C2+ owns the authoring of the
  canonical landing tables; this seed only enumerates the inputs.
- **Not a complete inventory.** It surfaces 23 of the 200 candidates
  the deep profiler flagged. Lower-distinct-count and supplementary
  candidates live in the database for the assessor to review when
  the C2 mapping authoring begins.
- **Not a code-value catalog.** Top-5 values per priority column are
  public WA tax statute / IAAO type codes / classification grades —
  shown to make the seed actionable, not to publish a full lookup.

---

## Regeneration

The seed is local to the operator's TerraFusion DB. To regenerate
against a fresh B2.7-OLTP batch:

```bash
docker exec -i terrafusion-postgres-dev psql -U postgres -d terrafusion <<'SQL'
WITH latest AS (
    SELECT b."Id" AS batch_id
    FROM "SyncBatches" b
    WHERE b."CountyId" = '19190019-1919-1919-1919-191919191919'
      AND b."Mode" = 'profile'
      AND EXISTS (SELECT 1 FROM "SyncProfileTableStats" s WHERE s."SyncBatchId" = b."Id")
    ORDER BY b."StartedAtUtc" DESC LIMIT 1
)
SELECT
    c."SchemaName",
    c."TableName",
    c."ColumnName",
    c."DistinctCount",
    c."DistinctRatio",
    c."Reason",
    c."CandidateCodesJson"
FROM "SyncProfileCodeCandidates" c, latest
WHERE c."SyncBatchId" = latest.batch_id
ORDER BY c."DistinctCount" DESC, c."SchemaName", c."TableName", c."ColumnName";
SQL
```

The `CandidateCodesJson` column carries the top-N frequency per column,
serialized as a JSON array of `{"Value": "…", "Count": N}` rows. Every
column-stats row in `SyncProfileColumnStats` for the same batch carries
its own `SampleValuesJson` (10 random rows) and `TopValuesJson` (top-N
frequency for code-candidates only).

---

## Provenance

- Slice authority: B2.7-OLTP marker `9d6306397`.
- B2 stats schema: `20260427133359_Slice_B2_1_AddProfileStats`
  (`SyncProfileTableStats`, `SyncProfileColumnStats`,
  `SyncProfileCodeCandidates`).
- Skip policies in effect: BIT (FIX-B2.7A), spatial (FIX-B2.7B),
  rowversion/timestamp (FIX-B2.7C). See `atlas-profile.md` for the
  architectural rationale.
- Sampling shape: `BernoulliSample` for tables > 100K rows (page-based
  via `TABLESAMPLE SYSTEM` per FIX-B2.7D); `Full` for ≤ 100K rows.
- Connection lifecycle: per-table session isolation (FIX-B2.7E).
- Suite boundary: GIS truth lives in TerraAtlas (SHP / geodatabase /
  ArcGIS API), not in PACS. PACS spatial columns are policy-skipped.
