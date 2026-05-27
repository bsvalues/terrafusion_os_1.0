# Washington Authoritative Parcel Inventory Reconstruction

Generated: 2026-05-27T00:22:16.215Z

## Doctrine

- Authoritative parcel runtime lineage must come from official assessor/GIS/open-data parcel inventory sources.
- Sales, comparable, and transfer artifacts are secondary evidence only.
- Existing canonical rows may be real, but rows without receipt-grade source evidence are not production-certifiable.
- This gate is read-only. It performs no database mutation and does not allow production binding.

## Summary

- Counties checked: 39
- Official parcel inventory signals: 13
- GIS layer signals: 1
- ArcGIS REST signals: 0
- Downloadable export signals: 2
- Search-only signals: 7
- Certifiable counties: 3
- Production binding allowed: no

## Matrix

| County | FIPS | Official parcel inventory | GIS layer | ArcGIS REST | Downloadable export | Search only | Certifiable | Access posture | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Adams | 53001 | yes | no | no | no | yes | no | search_only_requires_export_policy | confirm_export_or_bulk_query_terms_before_capture |
| Asotin | 53003 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Benton | 53005 | yes | no | no | yes | no | no | authoritative_inventory_recapture_candidate | recapture_authoritative_parcel_inventory_source_and_emit_receipt |
| Chelan | 53007 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Clallam | 53009 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Clark | 53011 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Columbia | 53013 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Cowlitz | 53015 | yes | no | no | no | no | yes | authoritative_inventory_receipt_found | reconcile_receipt_counts_and_prepare_certification_gate |
| Douglas | 53017 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Ferry | 53019 | yes | no | no | no | yes | no | search_only_requires_export_policy | confirm_export_or_bulk_query_terms_before_capture |
| Franklin | 53021 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Garfield | 53023 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Grant | 53025 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Grays Harbor | 53027 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Island | 53029 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Jefferson | 53031 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| King | 53033 | yes | no | no | no | no | yes | authoritative_inventory_receipt_found | reconcile_receipt_counts_and_prepare_certification_gate |
| Kitsap | 53035 | yes | no | no | yes | no | no | authoritative_inventory_recapture_candidate | recapture_authoritative_parcel_inventory_source_and_emit_receipt |
| Kittitas | 53037 | yes | no | no | no | yes | no | search_only_requires_export_policy | confirm_export_or_bulk_query_terms_before_capture |
| Klickitat | 53039 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Lewis | 53041 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Lincoln | 53043 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Mason | 53045 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Okanogan | 53047 | yes | no | no | no | yes | no | search_only_requires_export_policy | confirm_export_or_bulk_query_terms_before_capture |
| Pacific | 53049 | yes | no | no | no | yes | no | search_only_requires_export_policy | confirm_export_or_bulk_query_terms_before_capture |
| Pend Oreille | 53051 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Pierce | 53053 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| San Juan | 53055 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Skagit | 53057 | yes | yes | no | no | no | no | authoritative_inventory_recapture_candidate | recapture_authoritative_parcel_inventory_source_and_emit_receipt |
| Skamania | 53059 | yes | no | no | no | yes | no | search_only_requires_export_policy | confirm_export_or_bulk_query_terms_before_capture |
| Snohomish | 53061 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Spokane | 53063 | yes | no | no | no | no | yes | authoritative_inventory_receipt_found | reconcile_receipt_counts_and_prepare_certification_gate |
| Stevens | 53065 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Thurston | 53067 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Wahkiakum | 53069 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Walla Walla | 53071 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Whatcom | 53073 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |
| Whitman | 53075 | yes | no | no | no | yes | no | search_only_requires_export_policy | confirm_export_or_bulk_query_terms_before_capture |
| Yakima | 53077 | no | no | no | no | no | no | secondary_evidence_only | replace_secondary_evidence_with_official_parcel_inventory_source |

## Blockers

- 36 counties lack receipt-grade authoritative parcel inventory proof.
