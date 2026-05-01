import assert from 'node:assert';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import os from 'node:os';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function runCli(repoRoot, ...args) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function runCliAsync(repoRoot, ...args) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('node', [cliPath, ...args], {
      cwd: repoRoot,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });
    child.on('error', rejectPromise);
    child.on('close', status => resolvePromise({ status, stdout, stderr }));
  });
}

async function withFakeModelServer(handler, run) {
  const server = createServer(handler);
  await new Promise((resolvePromise, rejectPromise) => {
    server.listen(0, '127.0.0.1', error => (error ? rejectPromise(error) : resolvePromise()));
  });

  try {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    return await run(`http://127.0.0.1:${port}/v1`);
  } finally {
    await new Promise((resolvePromise, rejectPromise) => {
      server.close(error => (error ? rejectPromise(error) : resolvePromise()));
    });
  }
}

function createTempRepo() {
  const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-doctor-'));
  writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');
  return root;
}

function ensureTf(root) {
  mkdirSync(resolve(root, '.terrafusion'), { recursive: true });
}

function writeLockedCard(root) {
  ensureTf(root);
  writeFileSync(resolve(root, '.terrafusion/current-work-card.json'), JSON.stringify({
    lockedAt: 1700000000,
    card: {
      id: 'local-agent-runtime',
      mode: 'Plan',
      task: 'Build local agent runtime',
      why: 'Stay inside the governed pilot surface.',
      readiness: 'R1',
      truthPosture: 'read-only',
      allowedFiles: ['os-platform/core/pilot/local-agent/**'],
      forbiddenFiles: ['backend/**'],
      proofGates: ['pnpm run test:local-agent'],
      successCriteria: ['Stay bounded.'],
      risks: ['Scope creep.'],
      confidence: 0.9,
      notes: ['Lock before patch mode.'],
    },
  }, null, 2), 'utf8');
}

function writeProof(root, ok = true) {
  ensureTf(root);
  writeFileSync(resolve(root, '.terrafusion/proof-results.json'), JSON.stringify({
    ok,
    workCardId: 'local-agent-runtime',
    task: 'Build local agent runtime',
    results: [{ command: 'pnpm run test:local-agent', ok, skipped: false }],
  }, null, 2), 'utf8');
}

function writeSaveState(root) {
  ensureTf(root);
  writeFileSync(resolve(root, '.terrafusion/save-state.md'), '# Save State\n', 'utf8');
}

describe('Local agent doctor mode', () => {
  it('writes doctor and model runtime artifacts without a configured model endpoint', () => {
    const root = createTempRepo();

    try {
      const result = runCli(root, 'doctor');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /TerraFusion Local Agent Doctor/);
      assert.ok(existsSync(resolve(root, '.terrafusion/doctor-report.json')));
      assert.ok(existsSync(resolve(root, '.terrafusion/model-runtime-status.json')));

      const doctor = JSON.parse(readFileSync(resolve(root, '.terrafusion/doctor-report.json'), 'utf8'));
      const model = JSON.parse(readFileSync(resolve(root, '.terrafusion/model-runtime-status.json'), 'utf8'));
      assert.ok(['warn', 'fail'].includes(doctor.overallStatus));
      assert.equal(model.healthy, false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reports healthier status when locked card, proof, and save state are present', () => {
    const root = createTempRepo();
    writeLockedCard(root);
    writeProof(root, true);
    writeSaveState(root);

    try {
      const result = runCli(root, 'doctor');
      assert.equal(result.status, 0);
      const doctor = JSON.parse(readFileSync(resolve(root, '.terrafusion/doctor-report.json'), 'utf8'));
      assert.equal(doctor.lockedCard, true);
      assert.equal(doctor.proofResults, true);
      assert.equal(doctor.saveState, true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('uses loopback-only model checks when available', async () => {
    const root = createTempRepo();

    try {
      await withFakeModelServer((request, response) => {
        if (request.url === '/health') {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ status: 'ok' }));
          return;
        }

        if (request.url === '/v1/models') {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ data: [{ id: 'local-coder', owned_by: 'county-it' }] }));
          return;
        }

        response.writeHead(404).end();
      }, async endpoint => {
        const result = await runCliAsync(root, 'doctor', '--model-endpoint', endpoint, '--model-name', 'local-coder');
        assert.equal(result.status, 0);
        assert.match(result.stdout, /Model Health: PASS/);
        const model = JSON.parse(readFileSync(resolve(root, '.terrafusion/model-runtime-status.json'), 'utf8'));
        assert.equal(model.healthy, true);
        assert.equal(model.model, 'local-coder');
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects non-loopback model endpoints', () => {
    const root = createTempRepo();

    try {
      const result = runCli(root, 'doctor', '--model-endpoint', 'http://example.com/v1');
      assert.equal(result.status, 0);
      const model = JSON.parse(readFileSync(resolve(root, '.terrafusion/model-runtime-status.json'), 'utf8'));
      assert.equal(model.healthy, false);
      assert.match(model.status, /loopback endpoints by default/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('writes audit events without sensitive content', () => {
    const root = createTempRepo();

    try {
      const result = runCli(root, 'doctor', '--model-endpoint', 'http://127.0.0.1:9/v1', '--model-name', 'sk-secret-demo');
      assert.equal(result.status, 0);
      const log = readFileSync(resolve(root, '.terrafusion/agent-events.jsonl'), 'utf8');
      assert.match(log, /doctor_report_written/);
      assert.ok(!log.includes('sk-secret-demo'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('wires doctor into help, command registry, and control-center actions', () => {
    const root = createTempRepo();

    try {
      const help = runCli(root, 'help-me');
      assert.equal(help.status, 0);
      assert.match(help.stdout, /doctor/);

      const registry = runCli(root, 'command-registry');
      assert.equal(registry.status, 0);
      const registryPayload = JSON.parse(readFileSync(resolve(root, '.terrafusion/command-registry.json'), 'utf8'));
      assert.ok(registryPayload.commands.some(command => command.name === 'doctor'));

      const controlCenter = runCli(root, 'control-center-state');
      assert.equal(controlCenter.status, 0);
      const controlCenterPayload = JSON.parse(readFileSync(resolve(root, '.terrafusion/control-center-state.json'), 'utf8'));
      assert.ok(controlCenterPayload.actions.some(action => action.id === 'doctor'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('is included in the local-agent test script', () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
    assert.match(packageJson.scripts['test:local-agent'], /run-local-agent-tests\.mjs/);
    const runner = readFileSync(resolve(process.cwd(), 'os-platform/core/pilot/run-local-agent-tests.mjs'), 'utf8');
    assert.ok(runner.includes('^local-agent-.*\\.test\\.mjs$'));
  });
});
