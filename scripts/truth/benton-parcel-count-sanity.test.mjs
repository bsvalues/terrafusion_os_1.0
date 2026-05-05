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
    sourceMirror: {
      pacsParcelRows: 128950,
      pacsParcelDistinctRows: 128950,
      propertyRowsMinusPacsParcelRows: -162,
    },
    topPropertyTypes: [{ propertyType: 'R', rows: 96716 }],
    topPropertyUseCodes: [{ propertyUseCode: '11', rows: 56312 }],
    topSitusCities: [{ situsCity: 'KENNEWICK', rows: 43846 }],
    fieldCompleteness: {
      totalRows: 128788,
      missingPropertyUseCodeRows: 33948,
      missingSitusCityRows: 28766,
      zeroMarketValueRows: 36840,
      zeroAssessedValueRows: 36840,
      zeroLandValueRows: 52084,
      zeroImprovementValueRows: 53349,
      missingYearBuiltRows: 33026,
      missingNeighborhoodRows: 41204,
    },
    temporalRange: {
      earliestLastUpdated: '2026-04-18T04:09:37Z',
      latestLastUpdated: '2026-04-28T05:27:22Z',
    },
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
  assert.equal(report.sourceMirror.pacsParcelRows, 128950);
  assert.equal(report.fieldCompleteness.missingPropertyUseCodeRows, 33948);
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
    sourceMirror: {
      pacsParcelRows: 89447,
      pacsParcelDistinctRows: 89447,
      propertyRowsMinusPacsParcelRows: 0,
    },
    topPropertyTypes: [{ propertyType: 'R', rows: 89447 }],
    topPropertyUseCodes: [{ propertyUseCode: '11', rows: 89447 }],
    topSitusCities: [{ situsCity: 'KENNEWICK', rows: 89447 }],
    fieldCompleteness: {
      totalRows: 89447,
      missingPropertyUseCodeRows: 0,
      missingSitusCityRows: 0,
      zeroMarketValueRows: 0,
      zeroAssessedValueRows: 0,
      zeroLandValueRows: 0,
      zeroImprovementValueRows: 0,
      missingYearBuiltRows: 0,
      missingNeighborhoodRows: 0,
    },
    temporalRange: {
      earliestLastUpdated: '2026-05-04T00:00:00Z',
      latestLastUpdated: '2026-05-04T00:00:00Z',
    },
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
