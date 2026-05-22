# Yakima Dry-Run Row Validation

Generated: 2026-05-22T21:58:50.069Z

## Summary

- Terms/licensing state: not_approved
- Feature query attempted: false
- Extraction mode: metadata_config_only_no_feature_query
- Rows fetched: 0
- Rows examined: 0
- Parcel ID field: parcel_number
- Parcel ID presence: null
- Duplicate parcel IDs: 0
- Production rows written: 0
- Authorized for production load: false
- Authorized for projection: false
- Authorized for runtime registration: false
- Passed: true

## Rejected Row Report

- Version: june10-yakima-rejected-row-report-v1
- Rows rejected: 0
- Batch rejections: 1
- TERMS_LICENSE_NOT_APPROVED: Spatialest row extraction is blocked until Yakima terms/licensing approval is explicit.

## Dry-Run Lineage Receipt

- Version: june10-yakima-dry-run-lineage-v1
- Status: DRY_RUN_BLOCKED_PENDING_TERMS
- Runtime claim allowed: false
- DB mutation allowed: false

## Authorization Blockers

- Terms/licensing approval is not complete.
- Missing rollback plan receipt.
- Source parcel ID presence does not meet 100% threshold.
- Rejected row rate exceeds allowed threshold.
- Lineage receipt coverage does not meet 100% threshold.

## Rules

- No production DB write.
- No runtime promotion.
- No feature query or export download while terms/licensing state is not approved.
- Load authorization remains blocked unless every required receipt exists.

## Gate Blockers

- none
