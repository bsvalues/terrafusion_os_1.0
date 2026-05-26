-- King proposed case-correction SQL. Dry-run artifact only.
-- This script intentionally ends with ROLLBACK.
BEGIN;

CREATE TEMP TABLE king_case_correction_target (
  tf_parcel_id uuid not null,
  current_parcel_number text not null,
  proposed_parcel_number text not null,
  proposed_terrafusion_key text not null
) ON COMMIT DROP;

INSERT INTO king_case_correction_target
  (tf_parcel_id, current_parcel_number, proposed_parcel_number, proposed_terrafusion_key)
VALUES
  ('a893e85f-ee9f-e43e-c84e-4c33c964b493', '012303TR-B', '012303tr-B', '53033:012303tr-B'),
  ('520d1633-98e9-f4ba-eb59-44c4f5352b38', '012605TR-X', '012605TR-x', '53033:012605TR-x'),
  ('01ca2f1c-dbbe-1351-03de-8aa4cb4254a6', '022206TR-B', '022206Tr-B', '53033:022206Tr-B'),
  ('76dbb7a2-c109-d545-db23-d51e617cc01f', '022206TR-C', '022206Tr-C', '53033:022206Tr-C'),
  ('b7a8628a-c2c0-76be-1b55-8ee8e1ea82e2', '022605TR-A', '022605TR-a', '53033:022605TR-a'),
  ('2a10cc3c-0e2b-72f9-4c09-07050738fd2c', '142605TR-B', '142605tr-B', '53033:142605tr-B'),
  ('41027c8c-5e2b-8a1e-af69-2b3facbf6bbe', '162605TR-A', '162605tr-a', '53033:162605tr-a'),
  ('f11a39e5-0d22-8cab-66d0-1266ef18331d', '162606TR_A', '162606TR_a', '53033:162606TR_a'),
  ('4143daaa-9894-924e-5295-674441f85949', '212406TR-A', '212406TR-a', '53033:212406TR-a'),
  ('4825d424-457d-734c-5b2f-957a08a8fc9f', '300180TR A', '300180tr a', '53033:300180tr a'),
  ('c2617328-002b-b381-e84c-25f09dfe7250', '340170TR-B', '340170tr-B', '53033:340170tr-B'),
  ('41594dfc-ce26-d324-3e08-be81fe435517', '352306TR-A', '352306tr-A', '53033:352306tr-A');

UPDATE canonical_tf.tf_parcel p
SET
  "LegacyImportedParcelKey" = COALESCE(p."LegacyImportedParcelKey", p."ParcelNumber"),
  "ParcelNumber" = t.proposed_parcel_number,
  "TerraFusionParcelKey" = t.proposed_terrafusion_key,
  "IdentityRepairReceiptId" = 'king_public_parcel_shell_correction_dry_run_2026_05_26',
  "UpdatedAt" = now()
FROM king_case_correction_target t
WHERE p."TfParcelId" = t.tf_parcel_id
  AND p."ParcelNumber" = t.current_parcel_number
  AND p."CountyId" = '3cb43a41-480a-bbaf-cfd3-f62d403225b7'
  AND p."ParcelStatus" = 'ACTIVE';

ROLLBACK;
