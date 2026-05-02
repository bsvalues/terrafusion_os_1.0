# Track 2F — TerraFusion DB Sales Coverage Audit

**Generated:** 2026-05-02T16:16:51.144Z
**County:** Benton (19190019-1919-1919-1919-191919191919)
**Hard guards:** TF DB only. No source reads. No credentials. No workbook. No invention.

## Verdict

**TF_DB_HAS_QUALIFIABLE_SALES**

TerraFusion DB has sales with both qualification axes (WacCd + SaleRatioTypeCd) plus date + price. A TF-DB-only canonical qualification materializer is feasible without source reads.

**Next slice:** Author qualification mapping (policy/table) → TF-DB-only materializer.

## Metrics

| # | Metric | Value |
|---|---|---:|
| 1 | Parcel rows (Benton) | 128,788 |
| 2 | Parcel rows with sale fields on Properties row | 0 |
| 2a | Properties-table sale-shaped columns found | none |
| 3 | Standalone sale facts in pacs_sales (Benton) | 440,272 |
| 3b | SaleRecords (alternate canonical landing) | 0 |
| 4 | ComparableSales rows | 259,102 |
| 6 | Sales before 2018 (Benton) | 361,481 |
| 7 | Sales 2018+ (Benton) | 75,676 |
| 7b | Sales with no SaleDate | 3,115 |
| 8 | Rows missing WacCd | 406,268 |
| 8a | Rows with WacCd present | 34,004 |
| 9 | Rows missing SaleRatioTypeCd | 237,706 |
| 9a | Rows with SaleRatioTypeCd present | 202,566 |
| 10 | Rows with sale price (>0) AND date | 259,037 |
| 10a | Rows with sale price missing | 181,107 |
| 11 | Rows attached to valid Benton parcels | 440,272 |
| 11a | Sales with orphan PacsPropId (no matching Property anywhere) | 2 |
| 11b | Authoritative join key | Authoritative join: pacs_sales.PacsPropId::text = Properties.PropertyId. UUID ParcelId column not used. |
| 12 | Rows eligible for qualification before mapping (loose: ≥1 axis) | 130,633 |
| 12b | Rows strictly eligible (BOTH axes + date + price) | 2,460 |
| 13 | Rows already canonical-qualified | 0 |

## Sales by year (top 20, descending)

| Year | Sales |
|---:|---:|
| 2026 | 64 |
| 2025 | 7,897 |
| 2024 | 8,216 |
| 2023 | 7,628 |
| 2022 | 9,566 |
| 2021 | 12,110 |
| 2020 | 9,975 |
| 2019 | 10,138 |
| 2018 | 10,082 |
| 2017 | 9,213 |
| 2016 | 8,732 |
| 2015 | 8,307 |
| 2014 | 7,097 |
| 2013 | 7,565 |
| 2012 | 7,045 |
| 2011 | 6,820 |
| 2010 | 7,468 |
| 2009 | 7,119 |
| 2008 | 7,382 |
| 2007 | 8,944 |

## Notes

- WacCd is not strictly enforced in PACS even where applied; treat WAC presence as a hint, not ground truth.
- Pre-2018 sales are largely uncoded for WacCd by historical reality, not data corruption.
- Properties table carries zero sale-attached columns; sales live in pacs_sales joined by ParcelId.
- CanonicalSaleQualifications is the comp-pool-pre-qualified pipeline; empty means no ratio-study has been prepared, not that sales are missing.

## Provenance

- Postgres container: `terrafusion-postgres-dev`
- Database: `terrafusion`
- Source-system reads: 0
- HTTP API calls: 0
- Workbook lookups: 0
- Mapped CodeValue dependency: 0
