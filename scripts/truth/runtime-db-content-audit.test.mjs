#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const scriptPath = path.resolve('scripts/truth/runtime-db-content-audit.mjs');
const execFileAsync = promisify(execFile);

function makeTempRepo(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'generated', 'truth'), { recursive: true });
  return root;
}

function startServer(handler) {
  const server = http.createServer(handler);
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise(done => {
            server.closeAllConnections?.();
            server.close(done);
          }),
      });
    });
  });
}

test('runtime DB content audit records TerraFusion row shape blocker', async () => {
  const root = makeTempRepo('tf-runtime-db-content-fail-');
  const server = await startServer((request, response) => {
    if (request.url === '/api/runtime/truth/db-content') {
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          expectedBentonParcelCount: 89447,
          totalCounties: 1,
          totalProperties: 128788,
          countySummaries: [
            {
              countyName: 'Benton County',
              fipsCode: '53005',
              propertyRows: 128788,
              distinctParcelIds: 128788,
              distinctParcelNumbers: 128788,
              distinctPropertyIds: 128788,
              duplicateParcelIdGroups: 0,
              duplicateParcelNumberGroups: 0,
              maxRowsPerParcelId: 1,
              taxYears: [{ taxYear: 2026, count: 128788 }],
            },
          ],
          bentonDecision: {
            expectedParcelCount: 89447,
            propertyRowsMatchExpected: false,
            distinctParcelIdsMatchExpected: false,
            distinctParcelNumbersMatchExpected: false,
            classification: 'configured_count_matches_neither_rows_nor_distinct_parcels',
          },
          passed: false,
          blockers: [
            'Configured Benton parcel count 89447 matches neither runtime property rows 128788 nor distinct parcel ids 128788.',
          ],
          warnings: [],
        })
      );
      return;
    }
    response.statusCode = 404;
    response.end('not found');
  });

  try {
    await execFileAsync('node', [scriptPath, root], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TF_RUNTIME_BASE_URL: server.baseUrl,
      },
    }).catch(error => {
      assert.equal(error.code, 1);
    });

    const report = JSON.parse(
      fs.readFileSync(
        path.join(root, 'generated', 'truth', 'runtime-db-content-audit.json'),
        'utf8'
      )
    );
    assert.equal(report.passed, false);
    assert.equal(report.content.totalProperties, 128788);
    assert.equal(report.content.bentonDecision.propertyRowsMatchExpected, false);
    assert.equal(report.blockers.length, 1);
  } finally {
    await server.close();
  }
});

test('runtime DB content audit passes when configured count matches property rows', async () => {
  const root = makeTempRepo('tf-runtime-db-content-pass-');
  const server = await startServer((request, response) => {
    if (request.url === '/api/runtime/truth/db-content') {
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          expectedBentonParcelCount: 89447,
          totalCounties: 1,
          totalProperties: 89447,
          countySummaries: [
            {
              countyName: 'Benton County',
              fipsCode: '53005',
              propertyRows: 89447,
              distinctParcelIds: 89447,
              distinctParcelNumbers: 89447,
              distinctPropertyIds: 89447,
              duplicateParcelIdGroups: 0,
              duplicateParcelNumberGroups: 0,
              maxRowsPerParcelId: 1,
              taxYears: [{ taxYear: 2026, count: 89447 }],
            },
          ],
          bentonDecision: {
            expectedParcelCount: 89447,
            propertyRowsMatchExpected: true,
            distinctParcelIdsMatchExpected: true,
            distinctParcelNumbersMatchExpected: true,
            classification: 'configured_count_matches_property_rows',
          },
          passed: true,
          blockers: [],
          warnings: [],
        })
      );
      return;
    }
    response.statusCode = 404;
    response.end('not found');
  });

  try {
    await execFileAsync('node', [scriptPath, root], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TF_RUNTIME_BASE_URL: server.baseUrl,
      },
    });

    const report = JSON.parse(
      fs.readFileSync(
        path.join(root, 'generated', 'truth', 'runtime-db-content-audit.json'),
        'utf8'
      )
    );
    assert.equal(report.passed, true);
    assert.equal(
      report.content.bentonDecision.classification,
      'configured_count_matches_property_rows'
    );
  } finally {
    await server.close();
  }
});
