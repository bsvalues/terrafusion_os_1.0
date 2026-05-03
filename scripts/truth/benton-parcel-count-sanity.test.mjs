#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const scriptPath = path.resolve('scripts/truth/benton-parcel-count-sanity.mjs');
const execFileAsync = promisify(execFile);

function makeTempRepo(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'generated', 'truth'), { recursive: true });
  return root;
}

function writeFixture(root, fixture) {
  const fixturePath = path.join(root, 'fixture.json');
  fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
  return fixturePath;
}

test('Benton parcel sanity fails when endpoint returns unfiltered raw rows', async () => {
  const root = makeTempRepo('tf-benton-parcel-sanity-fail-');
  const fixturePath = writeFixture(root, {
    generatedAt: '2026-05-02T00:00:00.000Z',
    runtimeBaseUrl: 'fixture',
    totalPropertyRows: 128788,
    bentonRowsByCountyId: 128788,
    bentonRowsByCountyName: 128788,
    bentonRowsByCountyToken: 128788,
    activeRows: 0,
    inactiveRows: 0,
    unknownStatusRows: 128788,
    distinctParcelNumbers: 128788,
    distinctActiveParcelNumbers: 0,
    distinctCurrentYearParcelNumbers: 128784,
    currentTaxYear: 2026,
    rowsByTaxYear: [{ taxYear: 2026, rows: 128788, distinctParcels: 128788 }],
    rowsByPropertyStatus: [{ status: null, rows: 128788 }],
    rowsByCounty: [{ countyId: 'benton', countyName: 'Benton County', rows: 128788 }],
    nullCountyRows: 0,
    nonBentonRows: 0,
    propertyStatusColumns: [],
    endpointBehavior: {
      endpoint: '/api/counties/benton/parcels',
      endpointStatus: 200,
      returnedTotal: 128788,
      selectedCountyEchoed: true,
      appliesCountyFilter: true,
      appliesActiveFilter: false,
      appliesCurrentYearFilter: false,
      collapsesParcelVersions: true,
    },
    expectedActiveParcelRange: { min: 1, max: 100000, source: 'operator_expectation' },
  });

  await execFileAsync('node', [scriptPath, root], {
    cwd: process.cwd(),
    env: { ...process.env, TF_BENTON_PARCEL_SANITY_FIXTURE: fixturePath },
  }).catch(error => {
    assert.equal(error.code, 1);
  });

  const report = JSON.parse(
    fs.readFileSync(
      path.join(root, 'generated', 'truth', 'benton-parcel-count-sanity.json'),
      'utf8'
    )
  );

  assert.equal(report.passed, false);
  assert.ok(report.blockers.some(blocker => blocker.includes('active/current parcel filtering')));
  assert.ok(report.blockers.some(blocker => blocker.includes('unknown active/inactive status')));
  assert.ok(report.blockers.some(blocker => blocker.includes('current-year Benton parcel count')));
});

test('Benton parcel sanity passes for sane active parcel shape', async () => {
  const root = makeTempRepo('tf-benton-parcel-sanity-pass-');
  const fixturePath = writeFixture(root, {
    generatedAt: '2026-05-02T00:00:00.000Z',
    runtimeBaseUrl: 'fixture',
    totalPropertyRows: 89447,
    bentonRowsByCountyId: 89447,
    bentonRowsByCountyName: 89447,
    bentonRowsByCountyToken: 89447,
    activeRows: 89447,
    inactiveRows: 0,
    unknownStatusRows: 0,
    distinctParcelNumbers: 89447,
    distinctActiveParcelNumbers: 89447,
    distinctCurrentYearParcelNumbers: 89447,
    currentTaxYear: 2026,
    rowsByTaxYear: [{ taxYear: 2026, rows: 89447, distinctParcels: 89447 }],
    rowsByPropertyStatus: [{ status: 'active', rows: 89447 }],
    rowsByCounty: [{ countyId: 'benton', countyName: 'Benton County', rows: 89447 }],
    nullCountyRows: 0,
    nonBentonRows: 0,
    propertyStatusColumns: ['Status'],
    endpointBehavior: {
      endpoint: '/api/counties/benton/parcels',
      endpointStatus: 200,
      returnedTotal: 89447,
      selectedCountyEchoed: true,
      appliesCountyFilter: true,
      appliesActiveFilter: true,
      appliesCurrentYearFilter: true,
      collapsesParcelVersions: true,
    },
    expectedActiveParcelRange: { min: 1, max: 100000, source: 'operator_expectation' },
  });

  await execFileAsync('node', [scriptPath, root], {
    cwd: process.cwd(),
    env: { ...process.env, TF_BENTON_PARCEL_SANITY_FIXTURE: fixturePath },
  });

  const report = JSON.parse(
    fs.readFileSync(
      path.join(root, 'generated', 'truth', 'benton-parcel-count-sanity.json'),
      'utf8'
    )
  );

  assert.equal(report.passed, true);
  assert.equal(report.distinctActiveParcelNumbers, 89447);
});
