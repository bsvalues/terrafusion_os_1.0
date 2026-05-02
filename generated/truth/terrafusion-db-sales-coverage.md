# Track 2F — TerraFusion DB Sales Coverage Audit

**Generated:** 2026-05-02T16:08:56.313Z
**County:** Benton (19190019-1919-1919-1919-191919191919)
**Hard guards:** TF DB only. No source reads. No credentials. No workbook. No invention.

## Verdict

**TERRAFUSION_DB_LANDING_GAP**

TerraFusion DB has zero pacs_sales rows for Benton. This is a Sync landing gap; readiness fails until upstream→TF DB sales sync runs.

**Next slice:** Wait for / fix TerraFusion Sync landing into TerraFusion DB.

## Metrics

| # | Metric | Value |
|---|---|---:|
| 1 | Parcel rows (Benton) | 128,788 |
| 2 | Parcel rows with sale fields on Properties row | 0 |
| 2a | Properties-table sale-shaped columns found | none |
| 3 | Standalone sale facts in pacs_sales (Benton) | 0 |
| 3b | SaleRecords (alternate canonical landing) | 0 |
| 4 | ComparableSales rows | 259,102 |
| 6 | Sales before 2018 (Benton) | 0 |
| 7 | Sales 2018+ (Benton) | 0 |
| 7b | Sales with no SaleDate | 0 |
| 8 | Rows missing WacCd | 0 |
| 8a | Rows with WacCd present | 0 |
| 9 | Rows missing SaleRatioTypeCd | 0 |
| 9a | Rows with SaleRatioTypeCd present | 0 |
| 10 | Rows with sale price (>0) AND date | 0 |
| 10a | Rows with sale price missing | 0 |
| 11 | Rows attached to valid Benton parcels | 0 |
| 11a | Sales with orphan ParcelId (any county) | 440,274 |
| 12 | Rows eligible for qualification before mapping (loose: ≥1 axis) | 0 |
| 12b | Rows strictly eligible (BOTH axes + date + price) | 0 |
| 13 | Rows already canonical-qualified | 0 |

## Sales by year (top 20, descending)

| Year | Sales |
|---:|---:|

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
