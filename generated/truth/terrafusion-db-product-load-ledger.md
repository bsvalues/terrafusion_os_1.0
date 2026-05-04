# TerraFusion DB Product Load Ledger

Generated: 2026-05-04T17:44:17.616Z
Database: `terrafusion`
Container: `terrafusion-postgres-dev`

## Summary

- Result: FAIL
- Product tables checked: 10
- Lineage proven: 0
- Rows exist, lineage unproven: 4
- Empty tables: 6
- Missing tables: 0
- Latest ETL completed at: 2026-04-19T04:18:21.199Z
- Product load receipt table exists: no
- Product load receipt rows: -

## Product Load Receipt Contract

- Receipt table: `ProductLoadReceipts`
- Table identity column detected: -
- Timestamp columns detected: -
- Accepted table identity columns: TableName, ProductTableName, TargetTableName, RuntimeTableName, ProductTable
- Accepted timestamp columns: LoadedAtUtc, LoadedAt, LoadCompletedAtUtc, CompletedAtUtc, CompletedAt, ReceiptAtUtc, ReceiptAt, CreatedAtUtc, CreatedAt, UpdatedAt
- Recommended columns: Id, TargetTableName, CountyId, RowCount, LoadedAtUtc, SourceSnapshotId, SourceSystem, LoadBatchId, TransformVersion, InputHash, OutputHash

## Receipt Blockers

- ProductLoadReceipts table is missing.

## Ledger

| Table | Domain | Rows | Product Updated | Source/Cache Sync | ETL Completed | Product Load Receipt | Status | Blockers |
|---|---|---:|---|---|---|---|---|---|
`Properties` | parcel | 128788 | 2026-04-28T05:27:22.933Z | 2026-04-17T01:43:32.918Z | 2026-04-19T04:18:21.199Z | - | rows_exist_lineage_unproven | Rows exist but no product load receipt proves lineage.
`ComparableSales` | sales | 259102 | 2026-04-27T17:53:31.310Z | 2026-04-18T08:59:47.183Z | 2026-04-19T04:18:21.199Z | - | rows_exist_lineage_unproven | Rows exist but no product load receipt proves lineage.
`CanonicalSaleQualifications` | qualified_sales | 0 | - | - | 2026-04-19T04:18:21.199Z | - | empty_table | Table exists but is empty.
`CamaCharacteristics` | costforge | 75907 | 2026-04-17T03:41:23.707Z | - | 2026-04-19T04:18:21.199Z | - | rows_exist_lineage_unproven | Rows exist but no product load receipt proves lineage.
`ImprovementDetails` | costforge | 0 | - | - | 2026-04-19T04:18:21.199Z | - | empty_table | Table exists but is empty.
`LandSegments` | costforge | 0 | - | 2026-04-05T00:51:27.641Z | 2026-04-19T04:18:21.199Z | - | empty_table | Table exists but is empty.
`GisParcelGeometries` | atlas | 76138 | 2026-05-02T01:25:36.552Z | - | 2026-04-19T04:18:21.199Z | - | rows_exist_lineage_unproven | Rows exist but no product load receipt proves lineage.
`DossierPackets` | dossier | 0 | - | - | 2026-04-19T04:18:21.199Z | - | empty_table | Table exists but is empty.
`CountyDownstreamClosureReceipts` | dais | 0 | - | - | 2026-04-19T04:18:21.199Z | - | empty_table | Table exists but is empty.
`CountyApplyHandoffReceipts` | dossier | 0 | - | - | 2026-04-19T04:18:21.199Z | - | empty_table | Table exists but is empty.

## Warnings

- Properties: Source/cache timestamp exists, but it is not a product-load receipt.
- Properties: ETL timestamp exists, but it is not linked to this product table load.
- ComparableSales: Source/cache timestamp exists, but it is not a product-load receipt.
- ComparableSales: ETL timestamp exists, but it is not linked to this product table load.
- CamaCharacteristics: ETL timestamp exists, but it is not linked to this product table load.
- GisParcelGeometries: ETL timestamp exists, but it is not linked to this product table load.


## Trust Rule

Rows in TerraFusion DB are runtime-present only when no product-load receipt exists. June 10 readiness must not treat runtime-present rows as lineage-proven rows.
