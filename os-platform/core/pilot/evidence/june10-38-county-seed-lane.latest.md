# June 10 38-County Seed Lane

Generated: 2026-05-14T19:44:05.865Z

Mode: RUN
Passed: true
Dry run: false

## Summary

- Commands planned: 6
- Commands run: 6
- Commands passed: 6
- Commands failed: 0
- Work orders: 5
- Receipts found: 0
- Runtime claim allowed: false
- Blockers: 0

## Commands

| Step | Script | Exit | Purpose |
|---|---|---:|---|
seed_receipts | `june10-seed-receipt-validator.mjs` | 0 | Validate real seed receipts if any exist.
seed_wave_plan | `june10-seed-wave-planner.mjs` | 0 | Refresh first-wave representative county plan.
seed_work_order_pack | `june10-seed-work-order-pack.mjs` | 0 | Refresh executable first-wave work orders.
seed_receipt_template_pack | `june10-seed-receipt-template-pack.mjs` | 0 | Refresh template-only receipt shapes.
seed_execution_status | `june10-seed-execution-status.mjs` | 0 | Refresh execution status from work orders and receipts.
seed_control_plane | `june10-seed-control-plane.mjs` | 0 | Verify seed control-plane artifacts agree.

## Blockers

- None

## Rules

- This lane runner refreshes seed control artifacts only.
- It must not access source systems, mutate TerraFusion DB, or imply runtime readiness.
- Runtime claims remain blocked unless separate load, API, and UI proof gates pass.
- Dry-run output is a command plan, not evidence.
