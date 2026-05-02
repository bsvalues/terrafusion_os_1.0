#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const scriptPath = path.resolve('scripts/truth/runtime-sale-qualification-lineage-proof.mjs');
const execFileAsync = promisify(execFile);

function makeTempRepo(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'generated', 'truth'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'generated', 'truth', 'runtime-row-source-lineage-proof.json'),
    JSON.stringify(
      {
        proofs: [
          {
            county: 'Benton',
            passed: true,
          },
        ],
      },
      null,
      2
    )
  );
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

function writeJson(response, payload) {
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(payload));
}

test('runtime sale qualification proof passes recommendation-backed qualified pool with warning', async () => {
  const root = makeTempRepo('tf-sale-qual-pass-');
  const countyId = '19190019-1919-1919-1919-191919191919';
  const server = await startServer((request, response) => {
    if (request.url === '/api/counties/benton/runtime-lineage') {
      writeJson(response, {
        county: 'Benton County',
        countyId,
        runtimeLineageClassification: 'pacs_mirror_projected_runtime_partial',
        runtimeMockDataEnabled: false,
        eliteOperationsMockDataEnabled: true,
        canonicalRuntime: {
          comparableSales: 259102,
          canonicalSaleQualifications: 0,
        },
        sourceMirror: {
          pacsSales: 440274,
        },
      });
      return;
    }
    if (request.url === `/api/sync/qualification-status/${countyId}?taxYear=2026`) {
      writeJson(response, {
        allTime: {
          totalSales: 259102,
          hasRecommendation: 259102,
          pendingDecision: 258721,
          staffConfirmed: 344,
          appraiserFinal: 37,
          decisionQualified: 266,
          recQualified: 243544,
          recommendationCoverage: 100,
        },
        ratioStudyWindow: {
          totalSales: 52,
          hasRecommendation: 52,
          pendingDecision: 36,
          effectiveQualified: 36,
          decisionQualified: 0,
          recQualifiedFallback: 36,
        },
      });
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
        path.join(root, 'generated', 'truth', 'runtime-sale-qualification-lineage-proof.json'),
        'utf8'
      )
    );
    assert.equal(report.summary.passed, 1);
    assert.equal(report.summary.warnings, 3);
    assert.equal(
      report.proofs[0].classification,
      'recommendation_backed_canonical_landing_missing'
    );
  } finally {
    await server.close();
  }
});

test('runtime sale qualification proof fails when no qualified runtime pool exists', async () => {
  const root = makeTempRepo('tf-sale-qual-fail-');
  const countyId = '19190019-1919-1919-1919-191919191919';
  const server = await startServer((request, response) => {
    if (request.url === '/api/counties/benton/runtime-lineage') {
      writeJson(response, {
        county: 'Benton County',
        countyId,
        runtimeMockDataEnabled: false,
        canonicalRuntime: {
          comparableSales: 5,
          canonicalSaleQualifications: 0,
        },
        sourceMirror: {
          pacsSales: 5,
        },
      });
      return;
    }
    if (request.url === `/api/sync/qualification-status/${countyId}?taxYear=2026`) {
      writeJson(response, {
        allTime: {
          totalSales: 5,
          hasRecommendation: 0,
          recommendationCoverage: 0,
        },
        ratioStudyWindow: {
          totalSales: 5,
          effectiveQualified: 0,
        },
      });
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
        TF_RUNTIME_SALE_QUALIFICATION_STRICT: '0',
      },
    });

    const report = JSON.parse(
      fs.readFileSync(
        path.join(root, 'generated', 'truth', 'runtime-sale-qualification-lineage-proof.json'),
        'utf8'
      )
    );
    assert.equal(report.summary.failed, 1);
    assert.ok(
      report.proofs[0].blockers.includes('No runtime qualification recommendations found.')
    );
    assert.ok(
      report.proofs[0].blockers.includes(
        'No effective qualified sales found in ratio-study window.'
      )
    );
  } finally {
    await server.close();
  }
});
