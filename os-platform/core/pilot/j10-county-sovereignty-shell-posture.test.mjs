import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildCountySovereigntyShellPosture,
  writeCountySovereigntyShellPosture,
} from './j10-county-sovereignty-shell-posture.mjs';

test('county sovereignty shell posture represents all 39 Washington counties', () => {
  const packet = buildCountySovereigntyShellPosture({
    generatedAt: '2026-06-07T00:00:00.000Z',
  });

  assert.equal(packet.verdict, 'J10_COUNTY_SOVEREIGNTY_SHELL_POSTURE_LOCKED');
  assert.equal(packet.countyRegistry.length, 39);
  assert.equal(new Set(packet.countyRegistry.map(county => county.fips)).size, 39);
  assert.equal(new Set(packet.countyRegistry.map(county => county.slug)).size, 39);
});

test('Benton is the only runtime pilot and PACS is provenance only', () => {
  const packet = buildCountySovereigntyShellPosture({
    generatedAt: '2026-06-07T00:00:00.000Z',
  });
  const benton = packet.countyRegistry.find(county => county.slug === 'benton');
  const runtimePilots = packet.countyRegistry.filter(county => county.mode === 'runtime_pilot');

  assert.equal(runtimePilots.length, 1);
  assert.equal(benton.name, 'Benton County');
  assert.equal(benton.mode, 'runtime_pilot');
  assert.equal(benton.sourcePosture, 'PACS-derived');
  assert.equal(benton.runtimeOperationsAllowed, true);
  assert.equal(benton.runtimePath, 'TerraFusion DB -> TerraFusion API -> TerraFusion apps');
  assert.equal(benton.sourceSystemRuntimeDependencyAllowed, false);
});

test('non-Benton counties are onboarding/provenance workspaces with runtime operations blocked', () => {
  const packet = buildCountySovereigntyShellPosture({
    generatedAt: '2026-06-07T00:00:00.000Z',
  });
  const nonBenton = packet.countyRegistry.filter(county => county.slug !== 'benton');

  assert.equal(nonBenton.length, 38);
  assert.equal(nonBenton.every(county => county.runtimeOperationsAllowed === false), true);
  assert.equal(
    nonBenton.every((county) => ['onboarding', 'provenance_inventory'].includes(county.mode)),
    true
  );
  );
  assert.equal(
    nonBenton.every(county => county.runtimeGate === 'blocked_until_county_specific_db_api_proof'),
    true
  );
});

test('sovereignty shell defines role context and forbidden launch claims', () => {
  const packet = buildCountySovereigntyShellPosture({
    generatedAt: '2026-06-07T00:00:00.000Z',
  });

  assert.deepEqual(packet.roles, [
    'Assessor',
    'Appraiser',
    'GIS Tech',
    'Admin',
    'Auditor Read-Only',
    'Treasurer Read-Only',
    'Clerk Read-Only',
  ]);
  assert.deepEqual(packet.forbiddenClaims, [
    'All counties are live.',
    'All counties are certified.',
    'Hostinger is connected to PACS.',
    'TerraFusion Sync is fully productized.',
    'AI valuations are official.',
    'Unfinished modules are production-ready.',
  ]);
});

test('county sovereignty shell writes deterministic evidence', () => {
  const outDir = mkdtempSync(path.join(os.tmpdir(), 'j10-sov-posture-'));
  const result = writeCountySovereigntyShellPosture({
    outDir,
    generatedAt: '2026-06-07T00:00:00.000Z',
  });

  const json = JSON.parse(readFileSync(result.jsonPath, 'utf8'));
  const md = readFileSync(result.mdPath, 'utf8');

  assert.equal(json.verdict, 'J10_COUNTY_SOVEREIGNTY_SHELL_POSTURE_LOCKED');
  assert.equal(json.packetHash, result.packetHash);
  assert.match(md, /County Sovereignty Shell Posture/);
  assert.match(md, /Benton County/);
  assert.match(md, /Runtime Pilot/);
  assert.match(md, /blocked_until_county_specific_db_api_proof/);
});
