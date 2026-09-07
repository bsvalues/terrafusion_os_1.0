import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { request } from 'node:http';

test(
  'actual conference runtime rejects direct callers and executes a real local Canon ping behind host authentication',
  { timeout: 40000 },
  async () => {
    const reservation = createServer();
    await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
    const port = reservation.address().port;
    await new Promise(resolve => reservation.close(resolve));
    const token = 'synthetic-test-host-credential-0123456789';
    const child = spawn(process.execPath, ['os-platform/core/pilot/dev-pilot-runtime.mjs'], {
      cwd: fileURLToPath(new URL('../../../', import.meta.url)),
      env: {
        ...process.env,
        TF_CANON_CONFERENCE_ONLY: '1',
        TF_PILOT_PORT: String(port),
        LOCALOPS_PILOT_HOST_TOKEN: token,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', chunk => (output += chunk));
    child.stderr.on('data', chunk => (output += chunk));
    try {
      const start = Date.now();
      while (!output.includes('runtime listening')) {
        assert.equal(child.exitCode, null, output);
        assert.ok(Date.now() - start < 10000, output);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      const post = (path, headers = {}) =>
        fetch(`http://127.0.0.1:${port}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: '{}',
          signal: AbortSignal.timeout(15000),
        });
      assert.equal((await post('/pilot/canon/ping')).status, 403);
      const malformedStatus = await new Promise((resolve, reject) => {
        const malformed = request({host:'127.0.0.1',port,path:'http://[invalid',method:'POST'}, response => {
          response.resume(); resolve(response.statusCode);
        });
        malformed.setTimeout(3000,()=>malformed.destroy(new Error('Malformed request timed out')));
        malformed.on('error',reject);
        malformed.end();
      });
      assert.equal(malformedStatus,400);
      const headers = {
        'X-TerraFusion-LocalOps-Host': token,
        'X-TerraFusion-County-Id': 'b7c9fef3-cf48-45f4-967f-d3b9d265876d',
        'X-TerraFusion-User-Id': 'conference-test',
      };
      for (const path of ['/pilot/invoke', '/pilot/canon/write', '/pilot/canon/git-status']) {
        assert.equal((await post(path, headers)).status, 404);
      }
      const ping = await post('/pilot/canon/ping', headers);
      assert.equal(ping.status, 200);
      const result = await ping.json();
      assert.equal(result.overallOk, true, JSON.stringify(result));
      assert.equal(result.dryRun, false);
      assert.equal(result.normalized.toolId, 'explain_model_inputs');
      assert.ok(result.normalized.inputCount > 0);
      const corpus = await post('/pilot/canon/corpus', headers);
      assert.equal((await corpus.json()).ok, true);
    } finally {
      const stopped = new Promise(resolve => child.once('exit', resolve));
      if (child.exitCode === null) {
        child.kill();
        await stopped;
      }
    }
  }
);
