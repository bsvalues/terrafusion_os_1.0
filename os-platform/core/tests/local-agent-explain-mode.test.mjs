import assert from 'node:assert';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  const root = mkRepoRoot();
  writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');
  return root;
}

function mkRepoRoot() {
  return mkdirTemp('tf-local-agent-explain-');
}

function mkdirTemp(prefix) {
  return mkdtempSync(resolve(os.tmpdir(), prefix));
}

function writeLockedCard(root) {
  mkdirSync(resolve(root, '.terrafusion'), { recursive: true });
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

function writeProofResults(root) {
  mkdirSync(resolve(root, '.terrafusion'), { recursive: true });
  writeFileSync(resolve(root, '.terrafusion/proof-results.json'), JSON.stringify({
    ok: true,
    workCardId: 'local-agent-runtime',
    task: 'Build local agent runtime',
    startedAt: 1700000000,
    finishedAt: 1700000100,
    results: [
      {
        command: 'pnpm run test:local-agent',
        ok: true,
        skipped: false,
        decision: 'allow',
        exitCode: 0,
        output: 'all green',
        reason: 'command passed',
      },
    ],
  }, null, 2), 'utf8');
}

function writeSaveState(root) {
  mkdirSync(resolve(root, '.terrafusion'), { recursive: true });
  writeFileSync(resolve(root, '.terrafusion/save-state.json'), JSON.stringify({
    createdAt: 1700000200,
    summary: 'Explain mode checkpoint',
    nextExactStep: 'Run the focused explain-mode suite.',
    card: {
      available: true,
      id: 'local-agent-runtime',
      task: 'Build local agent runtime',
      mode: 'Plan',
      allowedFiles: ['os-platform/core/pilot/local-agent/**'],
      forbiddenFiles: ['backend/**'],
      proofGates: ['pnpm run test:local-agent'],
      risks: ['Scope creep.'],
    },
    proof: {
      available: true,
      ok: true,
      workCardId: 'local-agent-runtime',
      resultCount: 1,
      failedCommands: [],
      blockedCommands: [],
    },
    git: {
      branch: 'main',
      statusShort: 'M package.json',
      changedFiles: ['package.json'],
    },
    notes: ['Keep explain read-only.'],
  }, null, 2), 'utf8');
}

function writeAllowedFile(root, content = 'export const token = "sk-secret-demo";\n') {
  const path = resolve(root, 'os-platform/core/pilot/local-agent/demo.ts');
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, content, 'utf8');
  return 'os-platform/core/pilot/local-agent/demo.ts';
}

describe('Local agent explain mode', () => {
  it('works without model availability', () => {
    const root = createTempRepo();

    try {
      const result = runCli(root, 'explain');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Mode: Explain/);
      assert.match(result.stdout, /Requested: false/);
      assert.match(result.stdout, /Used: false/);
      assert.ok(!existsSync(resolve(root, '.terrafusion/current-work-card.json')));
      assert.ok(!existsSync(resolve(root, '.terrafusion/proof-results.json')));
      assert.ok(!existsSync(resolve(root, '.terrafusion/save-state.json')));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('can summarize a locked card', () => {
    const root = createTempRepo();
    writeLockedCard(root);

    try {
      const result = runCli(root, 'explain');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Locked Card/);
      assert.match(result.stdout, /local-agent-runtime/);
      assert.match(result.stdout, /Build local agent runtime/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('can summarize proof results', () => {
    const root = createTempRepo();
    writeProofResults(root);

    try {
      const result = runCli(root, 'explain');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Proof Results/);
      assert.match(result.stdout, /Overall: PASS/);
      assert.match(result.stdout, /pnpm run test:local-agent/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('can summarize save state', () => {
    const root = createTempRepo();
    writeSaveState(root);

    try {
      const result = runCli(root, 'explain');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Save State/);
      assert.match(result.stdout, /Explain mode checkpoint/);
      assert.match(result.stdout, /Run the focused explain-mode suite/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('uses loopback-only model assistance when available', async () => {
    const root = createTempRepo();
    writeLockedCard(root);

    try {
      await withFakeModelServer((request, response) => {
        assert.equal(request.method, 'POST');
        assert.equal(request.url, '/v1/chat/completions');
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({
          choices: [{
            finish_reason: 'stop',
            message: { role: 'assistant', content: 'Founder-safe advisory explanation.' },
          }],
        }));
      }, async endpoint => {
        const result = await runCliAsync(root, 'explain', '--assist-model', '--model-endpoint', endpoint);
        assert.equal(result.status, 0);
        assert.match(result.stdout, /Requested: true/);
        assert.match(result.stdout, /Used: true/);
        assert.match(result.stdout, /Founder-safe advisory explanation/);
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('treats unsafe model output as text only', async () => {
    const root = createTempRepo();

    try {
      await withFakeModelServer((_request, response) => {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({
          choices: [{
            finish_reason: 'tool_calls',
            message: {
              role: 'assistant',
              tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'apply_patch', arguments: '{}' } }],
            },
          }],
        }));
      }, async endpoint => {
        const result = await runCliAsync(root, 'explain', '--assist-model', '--model-endpoint', endpoint);
        assert.equal(result.status, 0);
        assert.match(result.stdout, /ToolCallsDetected: true/);
        assert.match(result.stdout, /advisory text only/i);
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('cannot write, patch, lock, proof, or finalize beyond event logging', () => {
    const root = createTempRepo();

    try {
      const result = runCli(root, 'explain');
      assert.equal(result.status, 0);
      assert.ok(existsSync(resolve(root, '.terrafusion/agent-events.jsonl')));
      assert.ok(!existsSync(resolve(root, '.terrafusion/current-work-card.md')));
      assert.ok(!existsSync(resolve(root, '.terrafusion/proof-results.md')));
      assert.ok(!existsSync(resolve(root, '.terrafusion/final-report.md')));
      assert.ok(!existsSync(resolve(root, '.terrafusion/patch-previews')));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects forbidden file paths', () => {
    const root = createTempRepo();

    try {
      const result = runCli(root, 'explain', '--file', 'backend/secret.ts');
      assert.equal(result.status, 2);
      assert.match(result.stderr, /explicit local-agent files under os-platform\/core\/pilot\/local-agent/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('logs redacted explain events without sensitive content', () => {
    const root = createTempRepo();
    const filePath = writeAllowedFile(root, 'export const token = "sk-secret-demo";\nexport const bearer = "Bearer abc.def.ghi";\n');

    try {
      const result = runCli(root, 'explain', '--file', filePath);
      assert.equal(result.status, 0);

      const logPath = resolve(root, '.terrafusion/agent-events.jsonl');
      const log = readFileSync(logPath, 'utf8');
      assert.match(log, /explain_mode_completed/);
      assert.ok(!log.includes('sk-secret-demo'));
      assert.ok(!log.includes('Bearer abc.def.ghi'));
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
