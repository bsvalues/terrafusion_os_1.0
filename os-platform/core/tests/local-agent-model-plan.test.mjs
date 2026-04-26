import assert from 'node:assert';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { spawn, spawnSync } from 'node:child_process';

let LocalAgentModelGateway;
let LocalAgentWorkCardFactory;

before(async () => {
  const gatewayModule = await import('../pilot/local-agent/modelGateway.js');
  const workCardModule = await import('../pilot/local-agent/workCard.js');

  LocalAgentModelGateway = gatewayModule.LocalAgentModelGateway;
  LocalAgentWorkCardFactory = workCardModule.LocalAgentWorkCardFactory;
});

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
    child.on('close', status => {
      resolvePromise({ status, stdout, stderr });
    });
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

describe('Local agent model-assisted plan mode', () => {
  it('uses loopback model drafts but strips tool authority and invalid files', async () => {
    await withFakeModelServer((request, response) => {
      assert.equal(request.method, 'POST');
      assert.equal(request.url, '/v1/chat/completions');

      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                taskSummary: 'Draft the smallest safe Plan Mode slice before any lock or patch.',
                riskNotes: [
                  'Model suggestions can drift outside governed files if validation is skipped.',
                  'Tool authority must remain inside the harness.',
                ],
                candidateFiles: [
                  'os-platform/core/pilot/local-agent/modelGateway.ts',
                  'backend/secret.ts',
                  '../outside.txt',
                ],
                proofGates: ['rm -rf .'],
              }),
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: { name: 'apply_patch', arguments: '{}' },
                },
              ],
            },
          },
        ],
      }));
    }, async endpoint => {
      const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-model-plan-'));
      writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

      try {
        const gateway = new LocalAgentModelGateway({ endpoint, model: 'fake-local-planner' });
        const factory = new LocalAgentWorkCardFactory(root);
        const baseCard = factory.build('Build local agent runtime');
        const result = await gateway.draftPlan('Build local agent runtime', {
          allowedFiles: baseCard.allowedFiles,
          forbiddenFiles: baseCard.forbiddenFiles,
          proofGates: baseCard.proofGates,
          successCriteria: baseCard.successCriteria,
          risks: baseCard.risks,
        });

        const card = factory.build('Build local agent runtime', {
          requested: true,
          available: result.available,
          status: result.status,
          model: result.model,
          endpoint: result.endpoint,
          taskSummary: result.draft?.taskSummary,
          riskNotes: result.draft?.riskNotes,
          candidateFiles: result.draft?.candidateFiles,
          strippedUnsafeContent: result.draft?.strippedUnsafeContent,
        });

        assert.equal(card.modelAssistance?.used, true);
        assert.equal(card.modelAssistance?.source, 'model-gateway');
        assert.equal(card.modelAssistance?.strippedUnsafeContent, true);
        assert.ok(card.risks.includes('Tool authority must remain inside the harness.'));
        assert.deepEqual(card.candidateFiles, ['os-platform/core/pilot/local-agent/modelGateway.ts']);
        assert.ok(card.modelAssistance?.rejectedCandidateFiles.includes('backend/secret.ts'));
        assert.ok(card.modelAssistance?.rejectedCandidateFiles.includes('../outside.txt'));
        assert.deepEqual(card.proofGates, baseCard.proofGates);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });
  });

  it('keeps deterministic plan mode working when the model is unavailable', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-model-plan-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const result = runCli(
        root,
        'plan',
        '--assist-model',
        '--model-endpoint',
        'http://127.0.0.1:9/v1',
        'Build',
        'local',
        'agent',
        'runtime',
      );

      assert.equal(result.status, 0);
      assert.match(result.stdout, /# Work Card: local-agent-runtime/);
      assert.match(result.stdout, /## Model Assistance/);
      assert.match(result.stdout, /Used: false/);
      assert.match(result.stdout, /deterministic/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('can still lock only after the harness builds the validated card', async () => {
    await withFakeModelServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({
        taskSummary: 'Keep lock authority in the CLI harness.',
        riskNotes: ['Model help is advisory only.'],
        candidateFiles: ['os-platform/core/pilot/local-agent/cli.ts'],
      }));
    }, async endpoint => {
      const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-model-plan-'));
      writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

      try {
        const result = await runCliAsync(
          root,
          'plan',
          '--assist-model',
          '--model-endpoint',
          endpoint,
          '--lock',
          'Build',
          'local',
          'agent',
          'runtime',
        );

        assert.equal(result.status, 0);
        assert.match(result.stdout, /Work card locked:/);

        const payload = JSON.parse(readFileSync(resolve(root, '.terrafusion/current-work-card.json'), 'utf8'));
        assert.equal(payload.card.modelAssistance.used, true);
        assert.deepEqual(payload.card.candidateFiles, ['os-platform/core/pilot/local-agent/cli.ts']);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });
  });
});