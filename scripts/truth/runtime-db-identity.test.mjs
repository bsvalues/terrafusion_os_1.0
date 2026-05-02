#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const scriptPath = path.resolve('scripts/truth/runtime-db-identity.mjs');

function makeTempRepo(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'generated', 'truth'), { recursive: true });
  return root;
}

function writeFixture(root, payload) {
  const fixturePath = path.join(root, 'runtime-db-identity.fixture.json');
  fs.writeFileSync(fixturePath, `${JSON.stringify(payload, null, 2)}\n`);
  return fixturePath;
}

function runScript(root, fixturePath) {
  return spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      ...process.env,
      TF_RUNTIME_BASE_URL: 'http://127.0.0.1:1',
      TF_RUNTIME_DB_IDENTITY_FIXTURE: fixturePath,
    },
  });
}

function readReport(root) {
  return JSON.parse(
    fs.readFileSync(path.join(root, 'generated', 'truth', 'runtime-db-identity.json'), 'utf8')
  );
}

test('passes when runtime endpoint confirms expected TerraFusion DB', () => {
  const root = makeTempRepo('tf-runtime-db-identity-pass-');
  const fixturePath = writeFixture(root, {
    apiBaseUrl: 'http://127.0.0.1',
    environment: 'Development',
    provider: 'Npgsql.EntityFrameworkCore.PostgreSQL',
    connectionStringName: 'DefaultConnection',
    serverRedacted: 'localhost',
    database: 'terrafusion_june10',
    expectedJune10Database: 'terrafusion_june10',
    isExpectedJune10RuntimeDb: true,
    migrationState: { appliedCount: 10, pendingCount: 0, latestApplied: '20260502000000_Runtime' },
    rowCounts: {
      counties: 1,
      properties: 10,
      comparableSales: 5,
      canonicalSaleQualifications: 3,
    },
    passed: true,
    blockers: [],
    warnings: [],
  });

  const result = runScript(root, fixturePath);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = readReport(root);
  assert.equal(report.passed, true);
  assert.equal(report.identity.database, 'terrafusion_june10');
  assert.equal(report.identity.rowCounts.properties, 10);
});

test('fails closed when runtime endpoint cannot confirm expected DB', () => {
  const root = makeTempRepo('tf-runtime-db-identity-fail-');
  const fixturePath = writeFixture(root, {
    apiBaseUrl: 'http://127.0.0.1',
    environment: 'Development',
    provider: 'Microsoft.EntityFrameworkCore.InMemory',
    connectionStringName: 'DefaultConnection',
    serverRedacted: null,
    database: null,
    expectedJune10Database: null,
    isExpectedJune10RuntimeDb: false,
    migrationState: { appliedCount: null, pendingCount: null, latestApplied: null },
    rowCounts: {
      counties: 1,
      properties: 128788,
      comparableSales: 259102,
      canonicalSaleQualifications: 0,
    },
    passed: false,
    blockers: ['Expected June 10 TerraFusion DB name is not configured.'],
    warnings: [],
  });

  const result = runScript(root, fixturePath);
  assert.notEqual(result.status, 0);

  const report = readReport(root);
  assert.equal(report.passed, false);
  assert.ok(report.blockers.some(item => item.includes('Expected June 10 TerraFusion DB')));
});
