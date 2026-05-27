# ArcGIS Candidate Field Validation

Generated: 2026-05-27T15:24:44.420Z
Source discovery access mode: anonymous

## Summary

- Counties checked: 36
- Unique candidate services checked: 6
- Receipt-ready candidates: 29
- Identity-ready candidates: 2
- Database mutation attempted: no
- Production binding allowed: no
- Certification allowed: no

## Matrix

| County | FIPS | Validation status | Scope | Parcel ID fields | County fields | Query | Extract | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Adams | 53001 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Asotin | 53003 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Benton | 53005 | candidate_layer_metadata_only | county_or_local | - | - | yes | yes | manual_official_assessor_gis_source_research_required |
| Chelan | 53007 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Clallam | 53009 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Clark | 53011 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Columbia | 53013 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Douglas | 53017 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Ferry | 53019 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Franklin | 53021 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Garfield | 53023 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Grant | 53025 | candidate_layer_identity_ready | county_or_local | PARCEL | - | yes | yes | capture_identity_only_then_adjudicate_export_or_county_scope |
| Grays Harbor | 53027 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Island | 53029 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Jefferson | 53031 | candidate_layer_not_arcgis_service | - | - | - | no | no | manual_official_assessor_gis_source_research_required |
| Kitsap | 53035 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Kittitas | 53037 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Klickitat | 53039 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Lewis | 53041 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Lincoln | 53043 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Mason | 53045 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Okanogan | 53047 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Pacific | 53049 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Pend Oreille | 53051 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Pierce | 53053 | candidate_layer_metadata_only | county_or_local | - | - | yes | yes | manual_official_assessor_gis_source_research_required |
| San Juan | 53055 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Skagit | 53057 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Skamania | 53059 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Snohomish | 53061 | candidate_layer_identity_ready | county_or_local | PARCEL_ID | - | yes | yes | capture_identity_only_then_adjudicate_export_or_county_scope |
| Stevens | 53065 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Thurston | 53067 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Wahkiakum | 53069 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Walla Walla | 53071 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
| Whatcom | 53073 | candidate_layer_not_arcgis_service | - | - | - | no | no | manual_official_assessor_gis_source_research_required |
| Whitman | 53075 | candidate_layer_metadata_only | county_or_local | - | - | yes | yes | manual_official_assessor_gis_source_research_required |
| Yakima | 53077 | candidate_layer_receipt_ready | statewide | PARCEL_ID_NR, ORIG_PARCEL_ID | FIPS_NR, COUNTY_NM | yes | yes | capture_county_slice_from_validated_arcgis_layer |
