# June 10 38-County Seed Execution Status

Generated: 2026-05-14T19:44:05.664Z

## Summary

- Work orders: 5
- Receipts found: 0
- Awaiting source capture: 5
- Receipt captured: 0
- Normalized ready: 0
- Loaded needs API proof: 0
- API proven needs UI smoke: 0
- Limited workflow ready: 0
- Blocked by receipt failure: 0
- Runtime claim allowed: false

## Work Orders

| Work order | County | Execution status | Receipt | Next action |
|---|---|---|---|---|
`J10-SEED-DIRECT-SALES-SEARCH-YAKIMA` | Yakima | AWAITING_SOURCE_CAPTURE | NO_RECEIPT | capture_source_snapshot
`J10-SEED-MONTHLY-REPORT-PARCEL-HISTORY-DOUGLAS` | Douglas | AWAITING_SOURCE_CAPTURE | NO_RECEIPT | capture_source_snapshot
`J10-SEED-MONTHLY-SALES-REPORT-KLICKITAT` | Klickitat | AWAITING_SOURCE_CAPTURE | NO_RECEIPT | capture_source_snapshot
`J10-SEED-PARCEL-TRANSFER-HISTORY-COWLITZ` | Cowlitz | AWAITING_SOURCE_CAPTURE | NO_RECEIPT | capture_source_snapshot
`J10-SEED-PARCEL-TRANSFER-HISTORY-OPEN-DATA-EXPORT-KITSAP` | Kitsap | AWAITING_SOURCE_CAPTURE | NO_RECEIPT | capture_source_snapshot

## Rules

- This status is a work-order control plane, not runtime readiness proof.
- Runtime claims remain blocked until receipts pass load, API proof, and UI smoke gates.
- Missing receipts mean acquisition work is pending, not complete.
- Failed receipts block promotion until corrected.
