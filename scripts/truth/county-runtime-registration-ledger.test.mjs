#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const scriptPath = path.resolve('scripts/truth/county-runtime-registration-ledger.mjs');
const execFileAsync = promisify(execFile);

function makeTempRepo(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeInventory(root, rows) {
  const outDir = path.join(root, 'generated', 'truth');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'data-source-truth-inventory.json'),
    JSON.stringify({ rows }, null, 2)
  );
}

function inventoryRow(county, overrides = {}) {
  return {
    county,
    rowsLanded: 0,
    evidenceCount: 0,
    sourceUrlOrSystem: null,
    scraperOrAdapterExists: false,
    dbTableTargetExists: false,
    runtimeApiConsumesIt: false,
    uiSurfacePath: null,
    trustTier: 'unknown_untrusted',
    classification: 'unknown_untrusted',
    costForge: {
      costForgeReadinessTier: 'CF0_no_runtime_data',
      costForgeCountyMode: 'not_available',
    },
    ...overrides,
  };
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

async function runLedger(root, baseUrl, counties) {
  await execFileAsync('node', [scriptPath, root], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TF_RUNTIME_BASE_URL: baseUrl,
      TF_COUNTY_RUNTIME_LEDGER_COUNTIES: counties.join(','),
    },
  });
  return JSON.parse(
    fs.readFileSync(
      path.join(root, 'generated', 'truth', 'county-runtime-registration-ledger.json'),
      'utf8'
    )
  );
}

test('ledger classifies runtime-proven county and evidence-backed 404 county', async () => {
  const root = makeTempRepo('tf-county-ledger-');
  writeInventory(root, [
    inventoryRow('Benton', {
      rowsLanded: 241,
      evidenceCount: 81,
      dbTableTargetExists: true,
      runtimeApiConsumesIt: true,
      trustTier: 'public_source_seed',
      classification: 'public_data_seed',
      costForge: {
        costForgeReadinessTier: 'CF1_parcel_public_data',
        costForgeCountyMode: 'public_data_loaded',
      },
    }),
    inventoryRow('Pacific', {
      rowsLanded: 11,
      evidenceCount: 4,
      dbTableTargetExists: true,
      runtimeApiConsumesIt: true,
      trustTier: 'public_source_seed',
      classification: 'public_data_seed',
    }),
  ]);
  const server = await startServer((request, response) => {
    response.setHeader('content-type', 'application/json');

    if (request.url === '/api/counties/benton/parcels?limit=5') {
      response.end(
        JSON.stringify({
          county: 'Benton County',
          total: 241,
          semantics: {
            countyScoped: true,
            activeOnly: true,
            duplicateParcelVersionsCollapsed: true,
            currentParcelVersion: true,
          },
          rows: [{ id: 1 }, { id: 2 }],
        })
      );
      return;
    }
    if (request.url === '/api/counties/benton/sales?limit=5') {
      response.end(JSON.stringify({ county: 'Benton County', rows: [{ id: 'sale-1' }] }));
      return;
    }
    if (request.url?.startsWith('/api/counties/pacific/')) {
      response.statusCode = 404;
      response.end(JSON.stringify({ county: 'pacific', error: 'County not found.' }));
      return;
    }

    response.statusCode = 500;
    response.end(JSON.stringify({ error: 'unexpected' }));
  });

  try {
    const report = await runLedger(root, server.baseUrl, ['Benton', 'Pacific']);
    const benton = report.rows.find(row => row.county === 'Benton');
    const pacific = report.rows.find(row => row.county === 'Pacific');

    assert.equal(benton.readinessClass, 'runtime_proven');
    assert.equal(benton.recommendedAction, 'keep_runtime_candidate');
    assert.equal(benton.parcels.runtimeRows, 241);
    assert.equal(benton.parcels.activeCurrentSemanticsProven, true);
    assert.equal(benton.activeCurrentSemanticsProven, true);
    assert.equal(benton.sales.runtimeRows, 1);

    assert.equal(pacific.readinessClass, 'not_registered');
    assert.equal(pacific.recommendedAction, 'load_or_register_next');
    assert.equal(pacific.inventoryEvidence.rowsLanded, 11);
    assert.equal(pacific.candidateEvidenceClass, 'promotion_evidence_present');
    assert.equal(report.summary.runtimeProven, 1);
    assert.equal(report.summary.notRegistered, 1);
    assert.equal(report.summary.loadOrRegisterNext, 1);
  } finally {
    await server.close();
  }
});

test('ledger downgrades 404 county with no active inventory evidence', async () => {
  const root = makeTempRepo('tf-county-ledger-no-evidence-');
  writeInventory(root, [inventoryRow('Pacific')]);
  const server = await startServer((request, response) => {
    response.setHeader('content-type', 'application/json');

    if (request.url?.startsWith('/api/counties/pacific/')) {
      response.statusCode = 404;
      response.end(JSON.stringify({ county: 'pacific', error: 'County not found.' }));
      return;
    }

    response.statusCode = 500;
    response.end(JSON.stringify({ error: 'unexpected' }));
  });

  try {
    const report = await runLedger(root, server.baseUrl, ['Pacific']);
    const pacific = report.rows.find(row => row.county === 'Pacific');

    assert.equal(pacific.readinessClass, 'not_registered');
    assert.equal(pacific.recommendedAction, 'downgrade_from_runtime_candidate');
    assert.equal(pacific.candidateEvidenceClass, 'no_active_runtime_evidence');
    assert.equal(pacific.inventoryEvidence.rowsLanded, 0);
    assert.ok(
      pacific.blockers.some(reason => reason.includes('No active source/DB/runtime row evidence'))
    );
    assert.equal(report.summary.loadOrRegisterNext, 0);
    assert.equal(report.summary.downgradeFromRuntimeCandidate, 1);
  } finally {
    await server.close();
  }
});

test('ledger detects silent Benton fallback for non-Benton county', async () => {
  const root = makeTempRepo('tf-county-ledger-fallback-');
  const server = await startServer((_request, response) => {
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ county: 'Benton County', rows: [{ id: 1 }] }));
  });

  try {
    const report = await runLedger(root, server.baseUrl, ['Yakima']);
    const yakima = report.rows.find(row => row.county === 'Yakima');

    assert.equal(yakima.readinessClass, 'fallback_violation');
    assert.equal(yakima.recommendedAction, 'investigate_endpoint_error');
    assert.equal(yakima.silentBentonFallbackDetected, true);
    assert.equal(report.summary.fallbackViolations, 1);
  } finally {
    await server.close();
  }
});

test('ledger tolerates slow but valid county parcel endpoints by default', async () => {
  const root = makeTempRepo('tf-county-ledger-slow-parcel-');
  const server = await startServer((request, response) => {
    response.setHeader('content-type', 'application/json');

    if (request.url === '/api/counties/clark/parcels?limit=5') {
      setTimeout(() => {
        response.end(
          JSON.stringify({
            county: 'Clark County',
            total: 194316,
            semantics: {
              countyScoped: true,
              activeOnly: true,
              duplicateParcelVersionsCollapsed: true,
              currentParcelVersion: true,
            },
            rows: [{ id: 1 }],
          })
        );
      }, 5500);
      return;
    }
    if (request.url === '/api/counties/clark/sales?limit=5') {
      response.end(JSON.stringify({ county: 'Clark County', rows: [] }));
      return;
    }

    response.statusCode = 500;
    response.end(JSON.stringify({ error: 'unexpected' }));
  });

  try {
    const report = await runLedger(root, server.baseUrl, ['Clark']);
    const clark = report.rows.find(row => row.county === 'Clark');

    assert.equal(clark.readinessClass, 'runtime_proven');
    assert.equal(clark.recommendedAction, 'keep_runtime_candidate');
    assert.equal(clark.parcels.runtimeRows, 194316);
    assert.equal(clark.parcels.activeCurrentSemanticsProven, true);
    assert.equal(report.summary.endpointErrors, 0);
  } finally {
    await server.close();
  }
});

test('ledger classifies registered empty and endpoint error', async () => {
  const root = makeTempRepo('tf-county-ledger-empty-error-');
  const server = await startServer((request, response) => {
    response.setHeader('content-type', 'application/json');

    if (request.url === '/api/counties/adams/parcels?limit=5') {
      response.end(JSON.stringify({ county: 'Adams County', rows: [] }));
      return;
    }
    if (request.url === '/api/counties/adams/sales?limit=5') {
      response.end(JSON.stringify({ county: 'Adams County', rows: [] }));
      return;
    }

    response.statusCode = 500;
    response.end(JSON.stringify({ county: 'Asotin County', error: 'boom' }));
  });

  try {
    const report = await runLedger(root, server.baseUrl, ['Adams', 'Asotin']);
    const adams = report.rows.find(row => row.county === 'Adams');
    const asotin = report.rows.find(row => row.county === 'Asotin');

    assert.equal(adams.readinessClass, 'registered_empty');
    assert.equal(adams.recommendedAction, 'load_or_register_next');
    assert.equal(asotin.readinessClass, 'endpoint_error');
    assert.equal(asotin.recommendedAction, 'investigate_endpoint_error');
    assert.equal(report.summary.registeredEmpty, 1);
    assert.equal(report.summary.endpointErrors, 1);
  } finally {
    await server.close();
  }
});
