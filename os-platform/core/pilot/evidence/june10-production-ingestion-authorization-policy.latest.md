# Governed Ingestion Authorization Model

Generated: 2026-05-22T21:21:42.131Z

## Summary

- Counties covered: 2
- Counties: Cowlitz, Yakima
- Authorization state: blocked_pending_evidence
- No production writes: true
- Runtime promotion allowed: false
- Projection promotion allowed: false
- Passed: true

## Authorizers

- County load authorizers: data_governance_lead, county_data_steward
- Terms/licensing approvers: legal_terms_reviewer, data_governance_lead
- Validation approvers: data_quality_lead, database_operator
- Projection approvers: data_governance_lead, platform_release_manager
- Runtime registration approvers: platform_release_manager, security_officer, data_governance_lead
- Rollback authorities: platform_release_manager, database_operator

## Required Evidence

- verified_read_only_adapter_receipt
- conditional_load_path_design_receipt
- terms_license_review_receipt
- row_validation_receipt
- rollback_plan_receipt
- dry_run_lineage_receipt

## Validation Thresholds

- Source parcel ID present: 100%
- Duplicate parcel ID rate: 0%
- Lineage receipt coverage: 100%
- Dry-run production rows written: 0
- Max rejected rows: 1%

## County Decisions

| County | Terms | Load | Projection | Runtime | Blockers |
|---|---|---:|---:|---:|---|
Cowlitz | not_approved | false | false | false | Terms/licensing approval is not complete.<br>Missing row validation receipt.<br>Missing rollback plan receipt.<br>Source parcel ID presence does not meet 100% threshold.<br>Duplicate parcel ID rate is above zero.<br>Rejected row rate exceeds allowed threshold.<br>Lineage receipt coverage does not meet 100% threshold.
Yakima | not_approved | false | false | false | Terms/licensing approval is not complete.<br>Missing row validation receipt.<br>Missing rollback plan receipt.<br>Source parcel ID presence does not meet 100% threshold.<br>Duplicate parcel ID rate is above zero.<br>Rejected row rate exceeds allowed threshold.<br>Lineage receipt coverage does not meet 100% threshold.

## Hard Stops

- No production writes in this slice.
- No runtime promotion in this slice.
- No projection promotion in this slice.
- No county load authorization without terms/licensing approval.
- No county load authorization without row validation receipt.
- No county load authorization without rollback plan receipt.

## Blockers

- none
