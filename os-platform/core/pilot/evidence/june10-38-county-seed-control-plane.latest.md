# June 10 38-County Seed Control Plane

Generated: 2026-05-14T19:14:09.250Z

Passed: true

## Summary

- Work orders: 5
- Templates: 5
- Receipts found: 0
- Awaiting source capture: 5
- Blocked by receipt failure: 0
- Runtime claim allowed: false
- Blockers: 0

## Work Orders

| Work order | County | Execution status | Receipt target |
|---|---|---|---|
`J10-SEED-DIRECT-SALES-SEARCH-YAKIMA` | Yakima | AWAITING_SOURCE_CAPTURE | `evidence/june10-38-county-seed/yakima/source-snapshot-receipt.json`
`J10-SEED-MONTHLY-REPORT-PARCEL-HISTORY-DOUGLAS` | Douglas | AWAITING_SOURCE_CAPTURE | `evidence/june10-38-county-seed/douglas/source-snapshot-receipt.json`
`J10-SEED-MONTHLY-SALES-REPORT-KLICKITAT` | Klickitat | AWAITING_SOURCE_CAPTURE | `evidence/june10-38-county-seed/klickitat/source-snapshot-receipt.json`
`J10-SEED-PARCEL-TRANSFER-HISTORY-COWLITZ` | Cowlitz | AWAITING_SOURCE_CAPTURE | `evidence/june10-38-county-seed/cowlitz/source-snapshot-receipt.json`
`J10-SEED-PARCEL-TRANSFER-HISTORY-OPEN-DATA-EXPORT-KITSAP` | Kitsap | AWAITING_SOURCE_CAPTURE | `evidence/june10-38-county-seed/kitsap/source-snapshot-receipt.json`

## Blockers

- None

## Rules

- This control plane reconciles seed artifacts only; it is not runtime readiness proof.
- Runtime claims remain blocked until validated receipts, API proof, and UI smoke exist.
- Receipt templates must never be counted as acquisition evidence.
- Work order, template, and execution status receipt targets must match exactly.
