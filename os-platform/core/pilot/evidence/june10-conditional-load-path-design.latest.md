# Conditional Load-Path Design

Generated: 2026-05-22T19:46:52.051Z

## Summary

- Counties designed: 2
- Counties: Cowlitz, Yakima
- No production DB mutation: true
- Runtime claim allowed: false
- Dry-run only: true
- Rollback mode: no_op_no_transaction_opened
- Receipt version: june10-conditional-load-dry-run-v1
- Passed: true

## Staging Table Shape

- Table: staging_county_seed.conditional_parcel_source_dry_run
- Required fields: county_token, source_parcel_id, source_lineage_receipt_id
- Nullable fields: owner_name, situs_address, assessed_value_components, land_area, property_use, geometry_reference, source_payload_hash, source_updated_at
- Uniqueness: county_token + source_parcel_id + source_lineage_receipt_id

## County Designs

| County | Parcel field | Owner | Address | Value | Projection status | DB write |
|---|---|---|---|---|---|---:|
Cowlitz | PARCNO | DEED_HOLDER_NAME | SITUS_STREET_NUMBER, SITUS_STREET_DIRECTION, SITUS_STREET_NAME, SITUS_STREET_SUFFIX, SITUS_STREET_UNIT, SITUS_CITY, SITUS_ZIP_CODE | LAND_ASSESSED_VALUE, IMPR_ASSESSED_VALUE | blocked_until_terms_and_row_validation | false
Yakima | parcel_number | owner_name | line_1 | current_assessed_value | blocked_until_terms_and_row_validation | false

## Validation Before Any DB Write

- terms_access_review_approved
- adapter_receipt_status_verified
- adapter_receipt_has_zero_production_rows
- source_parcel_id_present_and_unique_in_batch
- county_token_present_and_allowed
- normalized_payload_matches_staging_schema
- dry_run_receipt_hash_matches_normalized_payload
- operator_explicitly_disables_no_op_mode_in_a_later_authorized_slice

## Projection Eligibility Rules

- Current status is blocked_until_terms_and_row_validation for both counties.
- Dry-run evidence can be generated.
- Production writes require a later authorized slice, terms/access approval, row-level validation, and explicit operator approval.

## Rollback / No-Op Mode

- No production transaction is opened.
- No staging table is created by this guard.
- No production rows are inserted, updated, deleted, merged, or upserted.
- Generated evidence can be regenerated without database rollback.

## Blockers

- none
