# King Post-Repair Delta Adjudication

Generated: 2026-05-26T15:54:00.982Z

## Verdict

- Decision: require_bounded_reimport_and_supersede_plan
- Recommended next action: Do not certify King. Build a King-only correction plan: preserve the existing repaired rows, acquire the full allowed source payload if needed, load or account for the 1,173 source-only PINs, and separately adjudicate the 463 canonical-only rows before any mutation.
- Source-only PINs: 1173
- Canonical-only ParcelNumbers: 463
- Case-only source/canonical edges: 12
- Exact source/canonical overlap: 634723
- Source duplicate extra rows: 2580
- Source capture complete: yes
- Database mutation allowed: no
- Production binding allowed: no

## Source Facts

- Source URL: https://gisdata.kingcounty.gov/arcgis/rest/services/OpenDataPortal/property__parcel_area/MapServer/439
- Parcel ID field: PIN
- Terms posture: public_parcel_id_only
- Geometry captured: no
- Owner fields captured: no
- Placeholder polygons documented: yes
- Stacked geometry documented: yes
- PIN index unique: no

## Classification

| Class | Count | Disposition |
| --- | ---: | --- |
| duplicate_source_geometry_semantics | 2580 | Source raw row count includes duplicate PIN rows from documented stacked polygon / vertical parcel geometry; this explains raw-row surplus, not source/canonical identity drift. |
| source_update_drift_or_canonical_import_gap | 1173 | Current complete source artifact contains distinct PINs that are absent from canonical export; King cannot certify until these are loaded, intentionally filtered with evidence, or mapped by an approved crosswalk. |
| canonical_stale_or_unproven_seed_rows | 463 | Canonical ParcelNumber values are absent from the current complete source PIN artifact; they require DB-row detail and source recapture/probe before any supersede or rollback decision. |
| identifier_case_normalization_edge_cases | 12 | Some source-only and canonical-only values differ only by letter case. Source-native ParcelNumber policy must decide whether exact source case is preserved or whether uppercase normalization is an approved transform. |
| placeholder_polygon_terms_risk | - | King source explicitly includes placeholder polygons that do not represent tax parcels; load rules must decide whether those are excluded from runtime parcel identity. |

## Samples

### Source-Only PINs

- 0009100000
- 012303tr-B
- 0126049178
- 0126049179
- 0126049180
- 0126049181
- 0126049182
- 0126049288
- 0126049289
- 0126049290
- 012605TR-x
- 012605Tr-A
- 0133000276
- 0133000277
- 013300TR-A
- 022206Tr-A
- 022206Tr-B
- 022206Tr-C
- 022605TR-a
- 0235700000
- 0254000655
- 0299960000
- 0321069089
- 0323049680
- 0323049681
- 0394500051
- 0394500052
- 0394500053
- 0394500054
- 0425079110
- 0510000844
- 0510000846
- 0510001181
- 0510001182
- 0510001183
- 0510002086
- 0510002087
- 0510002088
- 0510002089
- 0510002090
- 0510004686
- 0517000000
- 0526059320
- 0526059321
- 0564700010
- 0564700020
- 0564700030
- 0564700040
- 0564700050
- 0564700060

### Canonical-Only ParcelNumbers

- 0007200168
- 0037000275
- 0040001046
- 0066000200
- 0084000045
- 0106000300
- 012303TR-B
- 0126039343
- 012605TR-X
- 0179000420
- 0179001660
- 0203900200
- 022206TR-B
- 022206TR-C
- 0223039338
- 0225059037
- 0225059064
- 0225059073
- 0225059076
- 022605TR-A
- 0323049058
- 0422049287
- 0423059063
- 0423059067
- 0423059099
- 0423059100
- 0423059101
- 0423059140
- 0423059247
- 0439000525
- 0452001760
- 0486000484
- 0486000485
- 0510004585
- 0519000175
- 0603000360
- 0621069149
- 0621069291
- 0720069049
- 0723049502
- 0748000230
- 0748000325
- 0802000140
- 0829000065
- 0856001600
- 0886000160
- 0913000300
- 0945000500
- 0946000010
- 0952003695

### Case-Only Edge Cases

- 012303tr-B -> 012303TR-B
- 012605TR-x -> 012605TR-X
- 022206Tr-B -> 022206TR-B
- 022206Tr-C -> 022206TR-C
- 022605TR-a -> 022605TR-A
- 142605tr-B -> 142605TR-B
- 162605tr-a -> 162605TR-A
- 162606TR_a -> 162606TR_A
- 212406TR-a -> 212406TR-A
- 300180tr a -> 300180TR A
- 340170tr-B -> 340170TR-B
- 352306tr-A -> 352306TR-A

## Blockers

- 1173 current source PINs are missing from canonical ParcelNumber.
- 463 canonical ParcelNumber values are absent from the current source PIN artifact.
- 12 source/canonical identifier pairs differ only by case or casing style.
