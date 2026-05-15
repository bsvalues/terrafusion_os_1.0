# June 10 Sync Evidence Intake

Generated: 2026-05-15T19:40:20.860Z

Intake status: WAITING_SYNC_DB_EVIDENCE
Can run Benton closure: false

## Summary

- Product-load ledger passed: false
- ProductLoadReceipts exist: false
- ProductLoadReceipt rows: unknown
- Lineage-proven tables: 0
- Unproven tables: 10
- Benton corpus sealed: false
- Benton corpus run status: Interrupted
- Failed corpus clauses: 4
- Drain still active: true
- Safe to regenerate runtime truth packets: false
- Blockers: 21

## Blockers

- Product-load ledger is not passing.
- ProductLoadReceipts evidence is missing.
- No product table has lineage-proven status.
- canonical_tf.tf_parcel: rows_exist_lineage_unproven.
- canonical_tf.tf_sale: rows_exist_lineage_unproven.
- CanonicalSaleQualifications: rows_exist_lineage_unproven.
- CamaCharacteristics: rows_exist_lineage_unproven.
- ImprovementDetails: empty_table.
- LandSegments: empty_table.
- GisParcelGeometries: rows_exist_lineage_unproven.
- DossierPackets: empty_table.
- CountyDownstreamClosureReceipts: empty_table.
- CountyApplyHandoffReceipts: empty_table.
- Benton full-corpus evidence is ATTEMPT or missing seal.
- Benton corpus run status is Interrupted.
- Benton corpus clause failed: all_six_lanes_executed.
- Benton corpus clause failed: reconciliation_artifacts_generated.
- Benton corpus clause failed: pacs_snapshot_identifier_preserved.
- Benton corpus clause failed: api_readback_verifies_promoted_truth.
- Sync drain observation says drain is still active.
- Runtime truth packets are not safe to regenerate yet.

## Next Commands

- `pnpm run truth:terrafusion-db-product-load-ledger`
- `pnpm run truth:june10-sync-evidence-intake`
- `pnpm run truth:june10-p0-burndown`

## Rules

- This gate accepts evidence artifacts only; it does not inspect upstream source systems.
- Benton closure may run only after product-load receipts and sealed corpus evidence pass.
- ATTEMPT artifacts are useful evidence, but they do not unblock launch-control closure.
- Runtime truth packets should not be regenerated while drain evidence says regeneration is unsafe.
