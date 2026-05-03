#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const scriptPath = path.resolve('scripts/truth/runtime-row-source-lineage-proof.mjs');
const execFileAsync = promisify(execFile);

function makeTempRepo(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'generated', 'truth'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'generated', 'truth', 'runtime-row-path-proof.json'),
    JSON.stringify(
      {
        proofs: [
          {
            county: 'Benton',
            passed: true,
            endpoint: 'http://example.test/api/counties/benton/parcels',
          },
        ],
      },
      null,
      2
    )
  );
  return root;
}

function writeDbIdentity(root, overrides = {}) {
  fs.writeFileSync(
    path.join(root, 'generated', 'truth', 'runtime-db-identity.json'),
    JSON.stringify(
      {
        passed: true,
        blockers: [],
        identity: {
          database: 'terrafusion',
          provider: 'Npgsql.EntityFrameworkCore.PostgreSQL',
          expectedJune10Database: 'terrafusion',
          isExpectedJune10RuntimeDb: true,
        },
        ...overrides,
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

test('runtime source lineage proof passes source mirror and canonical runtime counts', async () => {
  const root = makeTempRepo('tf-runtime-source-lineage-pass-');
  writeDbIdentity(root);
  const server = await startServer((request, response) => {
    if (request.url === '/api/counties/benton/runtime-lineage') {
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          county: 'Benton County',
          runtimeLineageClassification: 'pacs_mirror_canonicalized_runtime',
          databaseProvider: 'Microsoft.EntityFrameworkCore.SqlServer',
          developmentSeedersSkipped: true,
          runtimeMockDataEnabled: false,
          canonicalRuntime: {
            properties: 276,
            comparableSales: 42,
            canonicalSaleQualifications: 36,
          },
          sourceMirror: {
            pacsParcels: 128788,
            pacsSales: 259102,
          },
          posture: {
            noSilentFallback: true,
            exposesCountsOnly: true,
            containsOwnerOrPartyPii: false,
          },
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
        path.join(root, 'generated', 'truth', 'runtime-row-source-lineage-proof.json'),
        'utf8'
      )
    );
    assert.equal(report.summary.passed, 1);
    assert.equal(report.proofs[0].canonicalRows, 354);
    assert.equal(report.proofs[0].sourceRows, 387890);
  } finally {
    await server.close();
  }
});

test('runtime source lineage proof blocks mock runtime or missing source mirror', async () => {
  const root = makeTempRepo('tf-runtime-source-lineage-fail-');
  writeDbIdentity(root);
  const server = await startServer((request, response) => {
    if (request.url === '/api/counties/benton/runtime-lineage') {
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          county: 'Benton County',
          runtimeLineageClassification: 'canonical_runtime_rows_without_source_mirror_proof',
          runtimeMockDataEnabled: true,
          canonicalRuntime: {
            properties: 1,
            comparableSales: 0,
            canonicalSaleQualifications: 0,
          },
          sourceMirror: {
            pacsParcels: 0,
            pacsSales: 0,
          },
          posture: {
            noSilentFallback: true,
            exposesCountsOnly: true,
            containsOwnerOrPartyPii: false,
          },
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
        TF_RUNTIME_SOURCE_LINEAGE_STRICT: '0',
      },
    });

    const report = JSON.parse(
      fs.readFileSync(
        path.join(root, 'generated', 'truth', 'runtime-row-source-lineage-proof.json'),
        'utf8'
      )
    );
    assert.equal(report.summary.failed, 1);
    assert.ok(report.proofs[0].blockers.includes('No source mirror rows counted.'));
    assert.ok(report.proofs[0].blockers.includes('Runtime mock data is enabled.'));
  } finally {
    await server.close();
  }
});

test('runtime source lineage proof fails when runtime DB identity is not trusted', async () => {
  const root = makeTempRepo('tf-runtime-source-lineage-db-identity-fail-');
  writeDbIdentity(root, {
    passed: false,
    blockers: [
      'Runtime Properties count 128788 does not match configured Benton parcel count 89447.',
    ],
    identity: {
      database: 'terrafusion',
      provider: 'Npgsql.EntityFrameworkCore.PostgreSQL',
      expectedJune10Database: 'terrafusion',
      isExpectedJune10RuntimeDb: true,
    },
  });
  const server = await startServer((request, response) => {
    if (request.url === '/api/counties/benton/runtime-lineage') {
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          county: 'Benton County',
          runtimeLineageClassification: 'source_mirror_canonicalized_runtime',
          runtimeMockDataEnabled: false,
          canonicalRuntime: {
            properties: 276,
            comparableSales: 42,
            canonicalSaleQualifications: 36,
          },
          sourceMirror: {
            pacsParcels: 128788,
            pacsSales: 259102,
          },
          posture: {
            noSilentFallback: true,
            exposesCountsOnly: true,
            containsOwnerOrPartyPii: false,
          },
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
        TF_RUNTIME_SOURCE_LINEAGE_STRICT: '0',
      },
    });

    const report = JSON.parse(
      fs.readFileSync(
        path.join(root, 'generated', 'truth', 'runtime-row-source-lineage-proof.json'),
        'utf8'
      )
    );
    assert.equal(report.summary.failed, 1);
    assert.equal(report.summary.runtimeDbIdentityPassed, false);
    assert.equal(report.proofs[0].runtimeDbIdentityPassed, false);
    assert.ok(
      report.proofs[0].blockers.some(blocker =>
        blocker.includes('Runtime DB identity proof is not trusted')
      )
    );
  } finally {
    await server.close();
  }
});
