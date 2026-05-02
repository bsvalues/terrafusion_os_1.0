#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const scriptPath = path.resolve('scripts/truth/runtime-endpoint-discovery.mjs');
const execFileAsync = promisify(execFile);

function makeTempRepo(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'backend', 'src', 'TerraFusion.API', 'Controllers'), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, 'frontend', 'apps', 'os-shell', 'src', 'pages', 'forge'), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, 'generated', 'truth'), { recursive: true });
  return root;
}

function gitInit(root) {
  execFileSyncForTest('git', ['init'], root);
  execFileSyncForTest('git', ['config', 'user.email', 'test@example.invalid'], root);
  execFileSyncForTest('git', ['config', 'user.name', 'Test'], root);
  execFileSyncForTest('git', ['add', '.'], root);
  execFileSyncForTest('git', ['commit', '-m', 'fixture'], root);
}

function execFileSyncForTest(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${result.stderr}`);
  }
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

test('endpoint discovery extracts county controller routes and recommends live endpoint', async () => {
  const root = makeTempRepo('tf-endpoint-discovery-');
  fs.writeFileSync(
    path.join(root, 'backend', 'src', 'TerraFusion.API', 'Controllers', 'CountyDataController.cs'),
    `
      [Route("api/counties")]
      public class CountyDataController : ControllerBase
      {
        [HttpGet("{countyToken}/parcels")]
        public IActionResult Parcels(string countyToken) => Ok();
      }
    `
  );
  fs.writeFileSync(
    path.join(root, 'frontend', 'apps', 'os-shell', 'src', 'pages', 'forge', 'countyApi.ts'),
    `
      export async function loadCounty() {
        return fetch('/api/counties/benton/parcels');
      }
    `
  );
  gitInit(root);

  const server = await startServer((request, response) => {
    if (request.url === '/api/counties/benton/parcels') {
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ county: 'Benton', rows: [{ id: 1 }, { id: 2 }] }));
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
      fs.readFileSync(
        path.join(root, 'generated', 'truth', 'runtime-endpoint-discovery.json'),
        'utf8'
      )
    );
    assert.equal(report.summary.backendRoutesFound, 1);
    assert.equal(report.summary.liveEndpoints >= 1, true);
    assert.ok(
      report.candidateEndpoints.some(
        item =>
          item.candidateUrl.endsWith('/api/counties/benton/parcels') &&
          item.recommendation === 'use_for_track_1b'
      )
    );
  } finally {
    await server.close();
  }
});

test('endpoint discovery classifies test-only routes as not usable', async () => {
  const root = makeTempRepo('tf-endpoint-discovery-testonly-');
  fs.writeFileSync(
    path.join(
      root,
      'backend',
      'src',
      'TerraFusion.API',
      'Controllers',
      'CostForgeTestController.cs'
    ),
    `
      [Route("api/costforge-test")]
      public class CostForgeTestController : ControllerBase
      {
        [HttpGet("counties/{county}/data")]
        public IActionResult Data(string county) => Ok();
      }
    `
  );
  gitInit(root);

  const server = await startServer((request, response) => {
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ county: 'Benton', rows: [{ id: 1 }] }));
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
      fs.readFileSync(
        path.join(root, 'generated', 'truth', 'runtime-endpoint-discovery.json'),
        'utf8'
      )
    );
    const testEndpoint = report.candidateEndpoints.find(item =>
      item.filePath.endsWith('CostForgeTestController.cs')
    );
    assert.ok(testEndpoint);
    assert.equal(testEndpoint.appearsTestOnly, true);
    assert.equal(testEndpoint.recommendation, 'test_only_do_not_use');
  } finally {
    await server.close();
  }
});

test('county runtime row contract is usable even when it exposes mock-data config posture', async () => {
  const root = makeTempRepo('tf-endpoint-discovery-countyrows-runtime-');
  fs.writeFileSync(
    path.join(root, 'backend', 'src', 'TerraFusion.API', 'Controllers', 'CountyRowsController.cs'),
    `
      [Route("api/counties/{countyToken}")]
      public class CountyRowsController : ControllerBase
      {
        [HttpGet("parcels")]
        public IActionResult Parcels(string countyToken) =>
          Ok(new { county = "Benton County", runtimeMockDataEnabled = false, rows = new[] { new { id = 1 } } });
      }
    `
  );
  gitInit(root);

  const server = await startServer((request, response) => {
    if (request.url === '/api/counties/benton/parcels') {
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ county: 'Benton County', rows: [{ id: 1 }] }));
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
      fs.readFileSync(
        path.join(root, 'generated', 'truth', 'runtime-endpoint-discovery.json'),
        'utf8'
      )
    );
    const endpoint = report.candidateEndpoints.find(item =>
      item.filePath.endsWith('CountyRowsController.cs')
    );
    assert.ok(endpoint);
    assert.equal(endpoint.appearsTestOnly, false);
    assert.equal(endpoint.recommendation, 'use_for_track_1b');
  } finally {
    await server.close();
  }
});
