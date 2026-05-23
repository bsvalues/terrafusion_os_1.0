# Benton Projection Uniqueness Repair Plan

Generated: 2026-05-23T01:05:30.895Z

Verdict: **FAIL**

## Summary

- County: Benton
- Table: canonical_tf.tf_parcel
- Root cause: projection_upsert_or_uniqueness_defect
- Duplicate active parcel-number groups: 1503
- Extra active rows: 1503
- Max rows per parcel number: 2
- Dry-run sample groups: 50
- Dry-run sampled loser rows: 50
- Certification blocked until dry-run zero: true
- Sync active: false
- Database mutation taken: false
- Certification granted: false

## Active Uniqueness Rule

```sql
CREATE UNIQUE INDEX CONCURRENTLY "ux_tf_parcel_active_county_parcel_number" ON canonical_tf.tf_parcel ("CountyId", "ParcelNumber") WHERE "ParcelStatus" = 'ACTIVE' AND nullif("ParcelNumber", '') IS NOT NULL;
```

## Deterministic Upsert Behavior

- Conflict target: `ON CONFLICT ("CountyId", "ParcelNumber") WHERE "ParcelStatus" = 'ACTIVE' AND nullif("ParcelNumber", '') IS NOT NULL DO UPDATE`
- Rule: Projection writes ACTIVE parcels by CountyId + ParcelNumber. Inserts create a row only when no active row exists; otherwise projection updates the existing canonical row in place and preserves the winning TfParcelId.
- CreatedAt: Preserve CreatedAt from the winning canonical row on update.
- UpdatedAt: Set UpdatedAt to the projection/write timestamp on update.
- Lineage: Every projection run must emit a product-load receipt that records source snapshot, load batch, affected table, inserted count, updated count, superseded duplicate count, and validation counts.

## Duplicate Resolution Rule

- Winner order: latest UpdatedAt -> latest CreatedAt -> lowest TfParcelId as deterministic tie-breaker
- Loser action: Do not delete. Mark loser rows non-active with a governed duplicate-superseded status only inside an authorized repair transaction after recording full row snapshots in a rollback receipt.
- Certification requirement: Benton cannot certify until active/current parcel identity is one row per parcel number or a documented legitimate multi-row identity key exists.

## Dry-Run Sample

| Parcel number | Rows | Winner TfParcelId | Loser TfParcelIds |
|---|---:|---|---|
101843020124000 | 2 | 6ed2aa6d-c472-45e1-aa2c-68dfa3f4f4e0 | 348428e8-6100-4d49-badd-59db50470449
101843020125001 | 2 | ff4cfd44-d22f-4c60-ac16-e2ddb90b8208 | d7cb8cde-0505-4564-9dd1-06637f57ff03
101843020125002 | 2 | 0771e638-7b49-4c20-93e4-baa7e008d655 | 0c6431f6-1ec8-4ad8-ac7b-30f0ac452fda
101843020125003 | 2 | a637a2da-3b2f-4cd7-840a-bd289d524ae9 | c815fc21-b6a5-4e41-958f-9cee9899a484
101843020125004 | 2 | 064383e5-c811-48da-9549-ff4f7eed42cf | d716f702-73a5-497b-ad58-55ef51da6098
101843020125005 | 2 | 09273a95-feda-413b-b7d9-dbe85afdb886 | 6b6149d4-2ffb-4921-8853-e3bc8346562f
101843020125006 | 2 | f3aa4752-137d-497d-8755-6dce8e0cb1d7 | 924dc77e-5ac2-41ff-811b-0bf3699240e6
101843020125007 | 2 | b77cf929-b239-4ce2-834d-eeb8fe3c40cb | 4db6edb1-b42c-4072-bb09-0ab5005ad507
101843020125008 | 2 | 1579ff32-705d-46ac-95bc-bef5c158874d | 9a9830b5-a0c9-40b3-94b8-2a34ec248207
101843020125011 | 2 | 042d9cf0-62b7-498f-b6df-213aa71d0180 | 6046601f-7c74-4bcc-b45a-44e7c1254c8e
101843020125013 | 2 | 627fafb2-86a3-4159-a1ad-271fd470011e | 11f539c8-9d8e-42e4-b129-87d28c9dbccd
101843020125014 | 2 | a8692a98-0d9d-4667-a2d3-ce1c1c987438 | 9bbe82ce-09ff-44f4-aa1f-51d089e3ba26
101843020125017 | 2 | fe885d5b-cea1-421b-8838-97cf57d84d93 | 2a42d9f8-c76c-4be2-afff-9709114dd581
101843020126006 | 2 | c25005ee-95c0-4300-8d3d-08d360278071 | 38624b6d-6a6e-4b2d-9eb4-7cd6cbe09847
101843020126009 | 2 | 5d90adbb-c2ad-49fb-9100-854ec947e6cb | cb8932c3-9319-4de6-8048-081c768cd905
101843020126011 | 2 | 543aa789-e4e6-4b27-894f-ab81354e92c4 | 11fa75e3-f4f7-4502-b300-0ac0162cd0a0
101843020126012 | 2 | 4f2aedcb-883a-4b57-9c5c-ab63905751aa | c9de2bc8-1010-4721-8a5c-7f9197ace10d
101843020126014 | 2 | 892a9c05-4f0d-409c-b09b-76a27cc45573 | 28c35819-234b-4d20-81f9-1be52306ce12
101843020126015 | 2 | ce87a4d2-65df-4fa7-ab01-92beddd6e99e | b4899a47-01b3-44c5-b51a-bf40728cfc58
101843020144001 | 2 | 4dca77a0-c237-4e37-9888-0a57390648b4 | 85cc8f4a-7107-470b-8276-b4ac963299c5
101843020144006 | 2 | 9ba35324-7da9-44ae-a599-8cf4ce4f1f8b | 9fcf2d26-c5c1-4732-bc15-83f90cb3ed1d
101843020145001 | 2 | 16743b43-a945-4faa-9757-5639156ed35b | 8634e346-6ea8-4fe9-9ad4-f9b923515ae0
101843020145003 | 2 | 1095e6d2-9720-439e-a202-d51ad0f3e214 | d02f53e0-d0b8-4932-8f14-39be40ccfb84
101843020145004 | 2 | c026bef9-2127-49eb-8f7f-5f27bec96d4a | fac704b7-bf29-44b3-950e-67613bb7c84b
101843020145005 | 2 | a3e8f17d-15ab-4f23-b259-d5e4d99bef25 | 7b28f33c-14a8-477b-ae65-fb3bc200e00d

## Rollback Plan

- Receipt required: true
- Receipt tables: sync_bridge.projection_repair_receipt, sync_bridge.projection_repair_row_snapshot
- Rule: Rollback restores every loser row to its prior ParcelStatus and field values from the row snapshot receipt, then drops the active uniqueness index if it was created.

## Blockers

- active_duplicates_remaining: 1503 active/current Benton duplicate parcel-number groups remain. Certification stays blocked until dry-run shows 0.
