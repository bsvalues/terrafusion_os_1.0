#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const scriptPath = path.resolve('scripts/truth/runtime-row-path-proof.mjs');
const execFileAsync = promisify(execFile);

function makeTempRepo(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'generated', 'truth'), { recursive: true });
  return root;
}

function writeInventory(root) {
  fs.writeFileSync(
    path.join(root, 'generated', 'truth', 'data-source-truth-inventory.json'),
    JSON.stringify(
      {
        rows: [
          {
            county: 'Benton',
            sourceUrlOrSystem: 'data/benton/source.json',
            scraperOrAdapterExists: true,
            dbTableTargetExists: true,
            rowsLanded: 2,
            runtimeApiConsumesIt: true,
            uiSurfacePath: 'frontend/benton.tsx',
            costForge: {
              costForgeReadinessTier: 'CF1_parcel_public_data',
              costForgeCountyMode: 'public_data_loaded',
              allowedWorkflows: ['open_county'],
              blockedWorkflows: ['claim_county_certified_value'],
            },
          },
          {
            county: 'Pacific',
            sourceUrlOrSystem: 'data/pacific/source.json',
            scraperOrAdapterExists: true,
            dbTableTargetExists: true,
            rowsLanded: 1,
            runtimeApiConsumesIt: true,
            uiSurfacePath: 'frontend/pacific.tsx',
            costForge: {
              costForgeReadinessTier: 'CF0_no_runtime_data',
              costForgeCountyMode: 'not_available',
              allowedWorkflows: [],
              blockedWorkflows: ['run_costforge_workflow'],
            },
          },
          {
            county: 'Walla Walla',
            sourceUrlOrSystem: null,
            scraperOrAdapterExists: true,
            dbTableTargetExists: false,
            rowsLanded: 0,
            runtimeApiConsumesIt: false,
            uiSurfacePath: 'frontend/walla-walla.tsx',
            costForge: {
              costForgeReadinessTier: 'CF0_no_runtime_data',
              costForgeCountyMode: 'not_available',
              allowedWorkflows: [],
              blockedWorkflows: ['run_costforge_workflow'],
            },
          },
        ],
      },
      null,
      2
    )
  );
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

test('runtime row path proof passes selected county rows without fallback', async () => {
  const root = makeTempRepo('tf-runtime-proof-pass-');
  writeInventory(root);
  const server = await startServer((request, response) => {
    if (request.url === '/api/counties/benton/data') {
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ county: 'Benton', rows: [{ parcelId: '1' }] }));
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
        TF_RUNTIME_ROW_CANDIDATES: 'Benton',
      },
    });

    const report = JSON.parse(
      fs.readFileSync(path.join(root, 'generated', 'truth', 'runtime-row-path-proof.json'), 'utf8')
    );
    assert.equal(report.summary.passed, 1);
    assert.equal(report.proofs[0].selectedCountyEchoed, true);
    assert.equal(report.proofs[0].silentBentonFallbackDetected, false);
  } finally {
    await server.close();
  }
});

test('runtime row path proof fails silent Benton fallback for non-Benton candidate', async () => {
  const root = makeTempRepo('tf-runtime-proof-fallback-');
  writeInventory(root);
  const server = await startServer((request, response) => {
    if (request.url === '/api/counties/pacific/data') {
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ county: 'Benton', rows: [{ parcelId: 'B-1' }] }));
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
        TF_RUNTIME_ROW_CANDIDATES: 'Pacific',
        TF_RUNTIME_ROW_PROOF_STRICT: '0',
      },
    });

    const report = JSON.parse(
      fs.readFileSync(path.join(root, 'generated', 'truth', 'runtime-row-path-proof.json'), 'utf8')
    );
    assert.equal(report.summary.failed, 1);
    assert.equal(report.proofs[0].silentBentonFallbackDetected, true);
    assert.ok(report.proofs[0].blockers.includes('Silent Benton fallback detected.'));
  } finally {
    await server.close();
  }
});
