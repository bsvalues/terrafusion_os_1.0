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
  const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-review-'));
  writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');
  return root;
}

function ensureTfDir(root) {
  mkdirSync(resolve(root, '.terrafusion'), { recursive: true });
}

function writeLockedCard(root) {
  ensureTfDir(root);
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

function writeProofResults(root, ok = true) {
  ensureTfDir(root);
  writeFileSync(resolve(root, '.terrafusion/proof-results.json'), JSON.stringify({
    ok,
    workCardId: 'local-agent-runtime',
    task: 'Build local agent runtime',
    startedAt: 1700000000,
    finishedAt: 1700000100,
    results: [
      {
        command: 'pnpm run test:local-agent',
        ok,
        skipped: false,
        decision: 'allow',
        exitCode: ok ? 0 : 1,
        output: ok ? 'all green' : 'failure',
        reason: ok ? 'command passed' : 'command failed',
      },
    ],
  }, null, 2), 'utf8');
}

function writeSaveState(root) {
  ensureTfDir(root);
  writeFileSync(resolve(root, '.terrafusion/save-state.json'), JSON.stringify({
    createdAt: 1700000200,
    summary: 'Review mode checkpoint',
    nextExactStep: 'Run the focused review-mode suite.',
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
    notes: ['Keep review read-only.'],
  }, null, 2), 'utf8');
  writeFileSync(resolve(root, '.terrafusion/save-state.md'), '# Save State\n', 'utf8');
}

function writePatchProposal(root, path = 'os-platform/core/pilot/local-agent/reviewMode.ts') {
  mkdirSync(resolve(root, '.terrafusion/patches'), { recursive: true });
  writeFileSync(resolve(root, '.terrafusion/patches/patch_demo.json'), JSON.stringify({
    proposal: {
      id: 'patch_demo',
      path,
      oldSha256: 'old',
      newSha256: 'new',
      createdAt: 1700000300,
      diff: `--- a/${path}\n+++ b/${path}`,
    },
    newContent: 'export const nextValue = 2;\n',
  }, null, 2), 'utf8');
}

function writeEvents(root) {
  ensureTfDir(root);
  writeFileSync(resolve(root, '.terrafusion/agent-events.jsonl'), [
    JSON.stringify({ ts: 1700000400, type: 'work_card_locked', payload: { id: 'local-agent-runtime' } }),
    JSON.stringify({ ts: 1700000500, type: 'patch_preview_created', payload: { id: 'patch_demo', path: 'os-platform/core/pilot/local-agent/reviewMode.ts' } }),
    JSON.stringify({ ts: 1700000600, type: 'save_state_written', payload: { summary: 'Review mode checkpoint' } }),
  ].join('\n') + '\n', 'utf8');
}

describe('Local agent review mode', () => {
  it('works without model availability', () => {
    const root = createTempRepo();

    try {
      const result = runCli(root, 'review');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Mode: Review/);
      assert.match(result.stdout, /Requested: false/);
      assert.match(result.stdout, /Used: false/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('detects missing locked card', () => {
    const root = createTempRepo();

    try {
      const result = runCli(root, 'review');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Locked Card: missing/);
      assert.match(result.stdout, /Missing locked card/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reads locked card metadata', () => {
    const root = createTempRepo();
    writeLockedCard(root);

    try {
      const result = runCli(root, 'review');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Locked Card/);
      assert.match(result.stdout, /local-agent-runtime/);
      assert.match(result.stdout, /Build local agent runtime/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('summarizes proof pass and fail', () => {
    const root = createTempRepo();
    writeLockedCard(root);
    writeProofResults(root, true);

    try {
      const passResult = runCli(root, 'review');
      assert.equal(passResult.status, 0);
      assert.match(passResult.stdout, /Proof Results/);
      assert.match(passResult.stdout, /Overall: PASS/);

      writeProofResults(root, false);
      const failResult = runCli(root, 'review');
      assert.equal(failResult.status, 0);
      assert.match(failResult.stdout, /Overall: FAIL/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('detects failed proof gates', () => {
    const root = createTempRepo();
    writeLockedCard(root);
    writeProofResults(root, false);

    try {
      const result = runCli(root, 'review');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Failed Proof Gates/);
      assert.match(result.stdout, /pnpm run test:local-agent/);
      assert.match(result.stdout, /Finalize Blocked: true/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('detects pending patch metadata without applying it', () => {
    const root = createTempRepo();
    writeLockedCard(root);
    writePatchProposal(root);

    try {
      const result = runCli(root, 'review');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Pending Patches/);
      assert.match(result.stdout, /patch_demo/);
      assert.ok(existsSync(resolve(root, '.terrafusion/patches/patch_demo.json')));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('detects missing save state', () => {
    const root = createTempRepo();
    writeLockedCard(root);
    writeProofResults(root, true);

    try {
      const result = runCli(root, 'review');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Save State: missing/);
      assert.match(result.stdout, /Missing save state/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reports finalize blocked when proof or save state is missing', () => {
    const root = createTempRepo();
    writeLockedCard(root);

    try {
      const missingProof = runCli(root, 'review');
      assert.equal(missingProof.status, 0);
      assert.match(missingProof.stdout, /Finalize Blocked: true/);

      writeProofResults(root, true);
      const missingSaveState = runCli(root, 'review');
      assert.equal(missingSaveState.status, 0);
      assert.match(missingSaveState.stdout, /Finalize Blocked: true/);

      writeSaveState(root);
      const unblocked = runCli(root, 'review');
      assert.equal(unblocked.status, 0);
      assert.match(unblocked.stdout, /Finalize Blocked: false/);
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
            message: { role: 'assistant', content: 'Founder-safe advisory review.' },
          }],
        }));
      }, async endpoint => {
        const result = await runCliAsync(root, 'review', '--assist-model', '--model-endpoint', endpoint);
        assert.equal(result.status, 0);
        assert.match(result.stdout, /Requested: true/);
        assert.match(result.stdout, /Used: true/);
        assert.match(result.stdout, /Founder-safe advisory review/);
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('treats unsafe model output as advisory text only', async () => {
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
        const result = await runCliAsync(root, 'review', '--assist-model', '--model-endpoint', endpoint);
        assert.equal(result.status, 0);
        assert.match(result.stdout, /ToolCallsDetected: true/);
        assert.match(result.stdout, /advisory text only/i);
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('cannot write, patch, lock, proof, or finalize', () => {
    const root = createTempRepo();
    writeLockedCard(root);
    writePatchProposal(root);

    try {
      const result = runCli(root, 'review');
      assert.equal(result.status, 0);
      assert.ok(existsSync(resolve(root, '.terrafusion/agent-events.jsonl')));
      assert.ok(existsSync(resolve(root, '.terrafusion/patches/patch_demo.json')));
      assert.ok(!existsSync(resolve(root, '.terrafusion/final-report.md')));
      assert.ok(!existsSync(resolve(root, '.terrafusion/proof-results.md')));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('logs redacted review events without sensitive content', () => {
    const root = createTempRepo();
    writeLockedCard(root);
    writePatchProposal(root, 'os-platform/core/pilot/local-agent/reviewMode.ts?token=sk-secret-demo');
    writeEvents(root);

    try {
      const result = runCli(root, 'review');
      assert.equal(result.status, 0);
      const logPath = resolve(root, '.terrafusion/agent-events.jsonl');
      const log = readFileSync(logPath, 'utf8');
      assert.match(log, /review_mode_completed/);
      assert.ok(!log.includes('sk-secret-demo'));
      assert.ok(!log.includes('Bearer abc.def.ghi'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('is included in the local-agent test script', () => {
    const packageJson = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8');
    assert.match(packageJson, /local-agent-review-mode\.test\.mjs/);
  });
});