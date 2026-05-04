#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const scriptPath = path.resolve('scripts/truth/washington-39-county-data-crosswalk.mjs');

const counties = [
  'Adams',
  'Asotin',
  'Benton',
  'Chelan',
  'Clallam',
  'Clark',
  'Columbia',
  'Cowlitz',
  'Douglas',
  'Ferry',
  'Franklin',
  'Garfield',
  'Grant',
  'Grays Harbor',
  'Island',
  'Jefferson',
  'King',
  'Kitsap',
  'Kittitas',
  'Klickitat',
  'Lewis',
  'Lincoln',
  'Mason',
  'Okanogan',
  'Pacific',
  'Pend Oreille',
  'Pierce',
  'San Juan',
  'Skagit',
  'Skamania',
  'Snohomish',
  'Spokane',
  'Stevens',
  'Thurston',
  'Wahkiakum',
  'Walla Walla',
  'Whatcom',
  'Whitman',
  'Yakima',
];

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-wa-crosswalk-'));
  fs.mkdirSync(path.join(root, 'os-platform/core/pilot/evidence'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs/Washington Counties/implementation/reports/payloads'), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, 'data/benton'), { recursive: true });
  fs.mkdirSync(path.join(root, 'generated/truth'), { recursive: true });

  fs.writeFileSync(
    path.join(root, 'os-platform/core/pilot/evidence/washington-39-county-coverage.latest.json'),
    JSON.stringify({
      counties: counties.map(county => ({
        county,
        status: county === 'Whitman' ? 'not-started' : 'adapter-ready',
        priority: 'P1',
        acquisitionFamily: county === 'Skamania' ? 'Unknown' : 'Direct sales search',
        officialAssessorBaseUrl: `https://example.test/${county}`,
        primarySalesSource: 'Public source',
      })),
    })
  );

  fs.writeFileSync(
    path.join(root, 'docs/Washington Counties/implementation/reports/payloads/kitsap-sales.csv'),
    'county,parcel,sale_price\nKitsap,1,100\nKitsap,2,200\n'
  );

  fs.writeFileSync(
    path.join(root, 'data/benton/parcels.csv'),
    'county,parcel\nBenton,1\nBenton,2\nBenton,3\n'
  );

  fs.writeFileSync(
    path.join(root, 'generated/truth/county-runtime-registration-ledger.json'),
    JSON.stringify({
      rows: [
        {
          county: 'Benton',
          readinessClass: 'runtime_proven',
          parcelRows: 3,
          recommendedAction: 'keep_runtime_candidate',
          blockers: [],
        },
      ],
    })
  );

  return root;
}

test('crosswalk emits all 39 counties and keeps runtime proof separate from registry proof', () => {
  const root = makeRepo();

  execFileSync('node', [scriptPath, root], { cwd: process.cwd(), stdio: 'pipe' });

  const report = JSON.parse(
    fs.readFileSync(
      path.join(root, 'generated/truth/washington-39-county-data-crosswalk.json'),
      'utf8'
    )
  );
  const benton = report.rows.find(row => row.county === 'Benton');
  const kitsap = report.rows.find(row => row.county === 'Kitsap');
  const whitman = report.rows.find(row => row.county === 'Whitman');

  assert.equal(report.rows.length, 39);
  assert.equal(benton.classification, 'runtime_proven');
  assert.equal(kitsap.classification, 'public_source_seed');
  assert.equal(whitman.classification, 'provenance_inventory_only');
  assert.ok(whitman.blockers.includes('Registry status is not-started.'));
  assert.equal(report.summary.prohibit39CountyRuntimeClaim, true);
});
