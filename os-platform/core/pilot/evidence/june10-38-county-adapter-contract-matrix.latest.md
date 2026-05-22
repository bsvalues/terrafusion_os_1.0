# June 10 38-County Adapter Contract Matrix

Generated: 2026-05-22T16:31:41.259Z

## Summary

- Counties: 10
- Candidate adapters: 10
- Implemented adapters: 0
- Verified adapters: 0
- Runtime claim allowed: false
- DB mutation allowed: false

## Matrix

| County | Source type | Access method | Expected format | Parcel ID | Owner/address/value fields | Cadence | Terms risk | Adapter status |
|---|---|---|---|---|---|---|---|---|
Clark | county_property_portal_plus_gis | manual_snapshot_or_playwright_capture | html_or_json_network_capture_plus_optional_gis_layer | parcel_id_or_account_number | owner_name_if_available<br>situs_address_if_available<br>assessed_value_if_available<br>sale_date_if_available<br>sale_price_if_available<br>geometry_or_map_reference_if_available | on_demand_snapshot | medium_terms_review_required | candidate
Cowlitz | county_property_portal_plus_gis | manual_snapshot_or_playwright_capture | html_or_json_network_capture_plus_optional_gis_layer | parcel_id_or_account_number | owner_name_if_available<br>situs_address_if_available<br>assessed_value_if_available<br>sale_date_if_available<br>sale_price_if_available<br>geometry_or_map_reference_if_available | on_demand_snapshot | low_public_portal_terms_review_required | candidate
Grant | county_property_portal_plus_gis | manual_snapshot_or_playwright_capture | html_or_json_network_capture_plus_optional_gis_layer | parcel_id_or_account_number | owner_name_if_available<br>situs_address_if_available<br>assessed_value_if_available<br>sale_date_if_available<br>sale_price_if_available<br>geometry_or_map_reference_if_available | on_demand_snapshot | medium_terms_review_required | candidate
King | county_property_portal_plus_gis | manual_snapshot_or_playwright_capture | html_or_json_network_capture_plus_optional_gis_layer | parcel_id_or_account_number | owner_name_if_available<br>situs_address_if_available<br>assessed_value_if_available<br>sale_date_if_available<br>sale_price_if_available<br>geometry_or_map_reference_if_available | on_demand_snapshot | medium_terms_review_required | candidate
Kitsap | downloadable_assessor_export_plus_parcel_history | download_snapshot | txt_csv_or_fixed_width_download | parcel_number_or_tax_account_id | owner_name_if_available<br>situs_address_if_available<br>assessed_value_if_available<br>sale_date_if_available<br>sale_price_if_available<br>geometry_or_map_reference_if_available | weekly_if_download_available | medium_terms_review_required | candidate
Pierce | downloadable_assessor_export_plus_parcel_history | download_snapshot | txt_csv_or_fixed_width_download | parcel_number_or_tax_account_id | owner_name_if_available<br>situs_address_if_available<br>assessed_value_if_available<br>sale_date_if_available<br>sale_price_if_available<br>geometry_or_map_reference_if_available | on_demand_snapshot | medium_terms_review_required | candidate
Snohomish | downloadable_assessor_export_plus_parcel_history | download_snapshot | txt_csv_or_fixed_width_download | parcel_number_or_tax_account_id | owner_name_if_available<br>situs_address_if_available<br>assessed_value_if_available<br>sale_date_if_available<br>sale_price_if_available<br>geometry_or_map_reference_if_available | on_demand_snapshot | medium_terms_review_required | candidate
Spokane | county_property_portal_plus_gis | manual_snapshot_or_playwright_capture | html_or_json_network_capture_plus_optional_gis_layer | parcel_id_or_account_number | owner_name_if_available<br>situs_address_if_available<br>assessed_value_if_available<br>sale_date_if_available<br>sale_price_if_available<br>geometry_or_map_reference_if_available | on_demand_snapshot | medium_terms_review_required | candidate
Whatcom | county_property_portal_plus_gis | manual_snapshot_or_playwright_capture | html_or_json_network_capture_plus_optional_gis_layer | parcel_id_or_account_number | owner_name_if_available<br>situs_address_if_available<br>assessed_value_if_available<br>sale_date_if_available<br>sale_price_if_available<br>geometry_or_map_reference_if_available | on_demand_snapshot | medium_terms_review_required | candidate
Yakima | spatialest_property_portal | manual_snapshot_or_playwright_capture | html_or_json_network_capture | parcel_id_or_account_number | owner_name_if_available<br>situs_address_if_available<br>assessed_value_if_available<br>sale_date_if_available<br>sale_price_if_available<br>geometry_or_map_reference_if_available | on_demand_snapshot | low_public_portal_terms_review_required | candidate

## Claim Rules

Allowed:
- adapter contract candidate defined
- source snapshot can be captured under receipt rules

Forbidden:
- runtime-ready
- full county data loaded
- official county-certified valuation
- adapter verified
- database loaded

## Rules

- No runtime claims.
- No DB mutation.
- No scraping beyond allowed source behavior.
- Adapter status remains candidate until a receipt proves raw capture, normalized artifact, and contract verification.
- License and terms risk must be resolved before automated capture or load.
