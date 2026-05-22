# Washington Runtime Expansion Phase A

Generated: 2026-05-22T22:24:16.274Z

Target: **Benton**
Verdict: **WAITING_SYNC_TERMINAL**

## Summary

- Sync terminal: false
- Canonical parcel proven: false
- Active/current parcel semantics proven: false
- Product-load lineage proven: true
- Endpoint runtime registration proven: true
- Workflow/domain usability proven: false
- Full-data-ready counties added: 0
- Expected full-production gate result: 0/39 ready until Benton Phase A passes

## Doctrine

- Target Benton only.
- Do not mutate production while Sync is active.
- Benton can become 1/39 full-data-ready only after terminal Sync and all runtime proof gates pass.
- 38 remaining counties stay blocked until their own acquisition/load/runtime proof is complete.

## Blockers

- **sync_terminal**: TerraFusion Sync is not terminal; production DB mutation and promotion remain blocked. (drainStillActive=true; terminalStatus=missing)
- **canonical_parcel**: Canonical Benton parcel table/projection is not proven.
- **parcel_semantics**: Active/current Benton parcel semantics are not proven.
- **workflow_domain**: Benton workflow/domain usability is not proven. (Expected 38 provenance-only counties; found 36.; Benton sale-qualification lineage proof did not pass.; Benton sale-qualification lineage is not_qualified_runtime_ready, expected canonical_landing_backed.; Benton CanonicalSaleQualifications landing table is empty.; Benton ratio-study window has no effective qualified sales.; Benton ratio-study window has no final-decision qualified sales.)
