import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildCountyDataIntakePosture, writeCountyDataIntakePosture } from './j10-county-data-intake-posture.mjs';

test('county data intake posture is a June 10 design MVP lane, not runtime import', () => {
  const packet = buildCountyDataIntakePosture({ generatedAt: '2026-06-07T00:00:00.000Z' });

  assert.equal(packet.verdict, 'J10_COUNTY_DATA_INTAKE_MVP_POSTURE_LOCKED');
  assert.equal(packet.status, 'DESIGN_MVP_GOVERNED_INTAKE_MODEL');
  assert.equal(packet.canonicalImportAllowed, false);
  assert.equal(packet.productionMutationAllowed, false);
  assert.equal(packet.productionDbBindingChangeAllowed, false);
  assert.equal(packet.syncProductClaimAllowed, false);
  assert.equal(packet.runtimeClaimAllowed, false);
  assert.equal(packet.runtimePromotionRule, 'validated_data_must_be_promoted_into_terrafusion_db_and_pass_api_proof_gates');
});

test('county data intake posture preserves the four-lane June 10 model', () => {
  const packet = buildCountyDataIntakePosture({ generatedAt: '2026-06-07T00:00:00.000Z' });
  const lanes = packet.june10OperatingModel.map(lane => lane.id);

  assert.deepEqual(lanes, [
    'runtime_lane',
    'sovereignty_lane',
    'provenance_onboarding_lane',
    'county_data_intake_lane',
  ]);
  assert.equal(packet.june10OperatingModel[0].scope, 'Benton County runtime pilot');
  assert.equal(packet.june10OperatingModel[3].status, 'Design/MVP lane only');
});

test('county data intake posture records allowed formats, lifecycle states, and evidence path', () => {
  const packet = buildCountyDataIntakePosture({ generatedAt: '2026-06-07T00:00:00.000Z' });

  assert.deepEqual(packet.acceptedSourcePackageTypes, [
    'csv',
    'txt',
    'xlsx',
    'fgdb_directory',
    'zipped_fgdb',
    'zip_generic',
  ]);
  assert.deepEqual(packet.stagingStates, [
    'UPLOADED',
    'VALIDATING',
    'VALIDATED',
    'PENDING_APPROVAL',
    'APPROVED_FOR_IMPORT',
    'REJECTED',
  ]);
  assert.equal(
    packet.evidencePathTemplate,
    'os-platform/core/pilot/evidence/county-data-intake/<intakeId>/'
  );
});

test('county data intake posture forbids production import claims', () => {
  const packet = buildCountyDataIntakePosture({ generatedAt: '2026-06-07T00:00:00.000Z' });

  assert.deepEqual(packet.forbiddenClaims, [
    'County Data Intake is production import.',
    'Uploaded files become live immediately.',
    'The intake lane mutates TerraFusion DB.',
    'All counties can upload and operate live on June 10.',
  ]);
});

test('county data intake posture writes deterministic JSON and Markdown evidence', () => {
  const outDir = mkdtempSync(path.join(os.tmpdir(), 'j10-intake-posture-'));
  const result = writeCountyDataIntakePosture({
    outDir,
    generatedAt: '2026-06-07T00:00:00.000Z',
  });

  const json = JSON.parse(readFileSync(result.jsonPath, 'utf8'));
  const md = readFileSync(result.mdPath, 'utf8');

  assert.equal(json.verdict, 'J10_COUNTY_DATA_INTAKE_MVP_POSTURE_LOCKED');
  assert.equal(json.packetHash, result.packetHash);
  assert.match(md, /County Data Intake MVP Posture/);
  assert.match(md, /canonicalImportAllowed: false/);
  assert.match(md, /No production DB mutation/);
});
