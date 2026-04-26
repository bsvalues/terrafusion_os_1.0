import assert from 'node:assert';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import os from 'node:os';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

const WORKSPACE_ROOT = process.cwd();
const CLI_PATH = resolve(WORKSPACE_ROOT, 'os-platform/core/pilot/local-agent/cli.js');
const PNPM = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const WINDOWS_SHELL = process.env.ComSpec || 'cmd.exe';

function createTempRepo(prefix = 'tf-local-agent-launch-smoke-') {
  const root = mkdtempSync(resolve(os.tmpdir(), prefix));
  writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');
  return root;
}

function runAlias(repoRoot, ...args) {
  const invocation = buildAliasInvocation(repoRoot, args);
  return process.platform === 'win32'
    ? spawnSync(WINDOWS_SHELL, ['/d', '/s', '/c', invocation.commandLine], {
        cwd: WORKSPACE_ROOT,
        encoding: 'utf8',
        windowsHide: true,
      })
    : spawnSync(PNPM, invocation.args, {
        cwd: WORKSPACE_ROOT,
        encoding: 'utf8',
        windowsHide: true,
      });
}

function runAliasAsync(repoRoot, ...args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const invocation = buildAliasInvocation(repoRoot, args);
    const child = process.platform === 'win32'
      ? spawn(WINDOWS_SHELL, ['/d', '/s', '/c', invocation.commandLine], {
          cwd: WORKSPACE_ROOT,
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      : spawn(PNPM, invocation.args, {
          cwd: WORKSPACE_ROOT,
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

function buildAliasInvocation(repoRoot, args) {
  const invocationArgs = ['run', 'tf:local-agent', '--', '--repo-root', repoRoot, ...args];
  return {
    args: invocationArgs,
    commandLine: [PNPM, ...invocationArgs].map(quoteWindowsArg).join(' '),
  };
}

function quoteWindowsArg(value) {
  if (!/[\s"]/u.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

function runDirect(cwd, repoRoot, ...args) {
  return spawnSync('node', [CLI_PATH, '--repo-root', repoRoot, ...args], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function readJson(root, relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'));
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

describe('Local agent launch smoke', () => {
  it('opens from the CLI alias, writes launch artifacts, and keeps writes inside the target repo', () => {
    const root = createTempRepo();
    const externalCwd = createTempRepo('tf-local-agent-launch-smoke-cwd-');

    try {
      const help = runAlias(root, 'help-me');
      assert.equal(help.status, 0);
      assert.match(help.stdout, /TerraFusion Local Agent Help/);

      const registry = runAlias(root, 'command-registry');
      assert.equal(registry.status, 0);
      assert.match(registry.stdout, /command-registry\.json/);
      assert.ok(existsSync(resolve(root, '.terrafusion/command-registry.json')));
      assert.ok(existsSync(resolve(root, '.terrafusion/command-registry.md')));

      const doctor = runAlias(root, 'doctor');
      assert.equal(doctor.status, 0);
      assert.match(doctor.stdout, /TerraFusion Local Agent Doctor/);
      assert.ok(existsSync(resolve(root, '.terrafusion/doctor-report.json')));
      assert.ok(existsSync(resolve(root, '.terrafusion/model-runtime-status.json')));

      const toolRead = runAlias(root, 'tool', 'read-file', 'package.json');
      assert.equal(toolRead.status, 0);
      assert.match(toolRead.stdout, /"ok"\s*:\s*true/);
      assert.match(toolRead.stdout, /package\.json/);

      const toolList = runAlias(root, 'tool', 'list-files', '.');
      assert.equal(toolList.status, 0);
      assert.match(toolList.stdout, /package\.json/);

      const redirectedWrite = runDirect(externalCwd, root, 'lock-card', 'Build local agent runtime');
      assert.equal(redirectedWrite.status, 0);
      assert.ok(existsSync(resolve(root, '.terrafusion/current-work-card.json')));
      assert.equal(existsSync(resolve(externalCwd, '.terrafusion/current-work-card.json')), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(externalCwd, { recursive: true, force: true });
    }
  });

  it('runs the founder workflow in a temp repo and enforces governance honestly', () => {
    const root = createTempRepo();

    try {
      const plan = runAlias(root, 'plan', 'Build local agent runtime');
      assert.equal(plan.status, 0);
      assert.match(plan.stdout, /Mode: Plan/);
      assert.match(plan.stdout, /Cloud: Blocked by default/);
      assert.equal(existsSync(resolve(root, '.terrafusion/current-work-card.json')), false);

      const lock = runAlias(root, 'lock-card', 'Build local agent runtime');
      assert.equal(lock.status, 0);
      assert.match(lock.stdout, /Work card locked\./);
      assert.ok(existsSync(resolve(root, '.terrafusion/current-work-card.json')));
      assert.ok(existsSync(resolve(root, '.terrafusion/current-work-card.md')));

      const current = runAlias(root, 'current-card');
      assert.equal(current.status, 0);
      assert.match(current.stdout, /# Work Card: local-agent-runtime/);

      const explain = runAlias(root, 'explain');
      assert.equal(explain.status, 0);
      assert.match(explain.stdout, /Mode: Explain/);
      assert.match(explain.stdout, /Locked Card/);

      const review = runAlias(root, 'review');
      assert.equal(review.status, 0);
      assert.match(review.stdout, /Mode: Review/);
      assert.match(review.stdout, /Locked Card/);

      const proof = runAlias(root, 'proof', '--timeout', '1');
      assert.notEqual(proof.status, 0);
      assert.match(proof.stdout, /TerraFusion Proof Results/);
      assert.doesNotMatch(proof.stdout, /Overall: PASS/);
      assert.match(proof.stdout, /Git unavailable: not a git repository/i);
      assert.doesNotMatch(proof.stdout, /Diff output format options|usage: git diff/i);
      assert.ok(existsSync(resolve(root, '.terrafusion/proof-results.json')));
      assert.ok(existsSync(resolve(root, '.terrafusion/proof-results.md')));

      const proofReport = readJson(root, '.terrafusion/proof-results.json');
      assert.equal(proofReport.ok, false);
      assert.equal(proofReport.workCardId, 'local-agent-runtime');
      assert.ok(proofReport.results.length >= 1);
      assert.ok(proofReport.results.some(result => result.ok === false));
      assert.ok(proofReport.results.every(result => typeof result.reason === 'string' && result.reason.length > 0));
      assert.ok(proofReport.results.some(result => result.command === 'git diff --check' && /git unavailable/i.test(result.reason)));

      const saveState = runAlias(
        root,
        'save-state',
        'Launch smoke captured honest proof failure',
        '--next-step',
        'Inspect failed proof gates before claiming finalize',
        '--note',
        'Temp repo intentionally lacks governed scripts',
      );
      assert.equal(saveState.status, 0);
      assert.match(saveState.stdout, /Save State written\./);
      assert.ok(existsSync(resolve(root, '.terrafusion/save-state.json')));
      assert.ok(existsSync(resolve(root, '.terrafusion/save-state.md')));
      const saveStateJson = readJson(root, '.terrafusion/save-state.json');
      assert.equal(saveStateJson.git.branch, 'git: unavailable');
      assert.deepEqual(saveStateJson.git.changedFiles, []);
      const saveStateMarkdown = readFileSync(resolve(root, '.terrafusion/save-state.md'), 'utf8');
      assert.match(saveStateMarkdown, /Branch: git: unavailable/);
      assert.doesNotMatch(saveStateMarkdown, /Diff output format options|usage: git diff|error: unknown option `cached`/i);

      const finalize = runAlias(root, 'finalize');
      assert.notEqual(finalize.status, 0);
      assert.match(finalize.stderr, /Proof did not pass/i);
      assert.doesNotMatch(finalize.stdout, /Overall: PASS/);
      assert.equal(existsSync(resolve(root, '.terrafusion/final-report.json')), false);

      assert.equal(existsSync(resolve(root, 'backend')), false);
      assert.equal(existsSync(resolve(root, 'frontend')), false);
      assert.equal(existsSync(resolve(root, 'applications')), false);
      assert.equal(existsSync(resolve(root, 'specialized')), false);
      assert.equal(existsSync(resolve(root, 'modules')), false);
      assert.equal(existsSync(resolve(root, 'marketplace')), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('keeps model runtime loopback-only and advisory-only', async () => {
    const root = createTempRepo();

    try {
      const blocked = runAlias(root, 'model-health', '--model-endpoint', 'http://example.com/v1');
      assert.notEqual(blocked.status, 0);
      assert.match(blocked.stdout, /loopback endpoints by default/i);

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

        if (request.url === '/v1/chat/completions' && request.method === 'POST') {
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({
            model: 'local-coder',
            choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'Advisory response only.' } }],
            usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 },
          }));
          return;
        }

        response.writeHead(404).end();
      }, async endpoint => {
        const health = await runAliasAsync(root, 'model-health', '--model-endpoint', endpoint, '--model-name', 'local-coder');
        assert.equal(health.status, 0);
        assert.match(health.stdout, /Overall:\s+PASS/);
        assert.match(health.stdout, /Status:\s+Local model health check succeeded\./i);
        assert.match(health.stdout, /Checked:\s+\/health/i);

        const models = await runAliasAsync(root, 'list-models', '--model-endpoint', endpoint, '--model-name', 'local-coder');
        assert.equal(models.status, 0);
        assert.match(models.stdout, /Overall:\s+PASS/);
        assert.match(models.stdout, /Models:\s+1/);
        assert.match(models.stdout, /local-coder/);

        const chat = await runAliasAsync(root, 'model-chat', '--model-endpoint', endpoint, '--model-name', 'local-coder', 'Explain readiness');
        assert.equal(chat.status, 0);
        assert.match(chat.stdout, /Overall:\s+PASS/);
        assert.match(chat.stdout, /Advisory:\s+true/);
        assert.match(chat.stdout, /ToolCalls:\s+false/);
        assert.match(chat.stdout, /Advisory response only\./);
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});