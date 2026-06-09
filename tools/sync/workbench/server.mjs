#!/usr/bin/env node
// ============================================================================
// TerraFusion Sync Workbench — Doctor Panel server
// ----------------------------------------------------------------------------
// Tiny read-only HTTP server. Serves the static Doctor Panel page and exposes
// one API endpoint that runs tf-sync-doctor.mjs and returns its output.
//
// Usage:
//   node tools/sync/workbench/server.mjs
//
// Optional env overrides (passed through to tf-sync-doctor.mjs):
//   PG_HOST, PG_PORT, PG_DB, PG_USER, PGPASSWORD
//
// No npm install needed — built-in Node modules only.
// ============================================================================

import { createServer, request as httpRequest } from 'node:http';
import { readFile }              from 'node:fs/promises';
import { spawn }                 from 'node:child_process';
import { fileURLToPath }         from 'node:url';
import { dirname, join, extname, resolve as resolvePath, normalize } from 'node:path';

const __dir          = dirname(fileURLToPath(import.meta.url));
const DOCTOR         = resolvePath(__dir, '..', 'tf-sync-doctor.mjs');
const PACK_VALIDATOR = resolvePath(__dir, '..', 'pack-validator-runner.mjs');
const SEAL_RUNNER       = resolvePath(__dir, '..', 'seal-runner.mjs');
const IDENTITY_RUNNER   = resolvePath(__dir, '..', 'identity-runner.mjs');
const REPO_ROOT         = resolvePath(__dir, '..', '..', '..');
const PUBLIC    = join(__dir, 'panel');
const HOST      = '127.0.0.1';
const PORT      = 7700;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
};

// Prevent concurrent runs per endpoint
let doctorRunning    = false;
let pvRunning        = false;
let sealRunning      = false;
let identityRunning  = false;
let drPreviewRunning = false;

// ── Body reader helper ────────────────────────────────────────────────────────
// Registers listeners synchronously (before any await) and returns a Promise.
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', d => chunks.push(d));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// ── API forward helper ────────────────────────────────────────────────────────
// Proxies a POST body to the .NET API at port 5000 and returns parsed JSON.
function forwardToApi(path, bodyStr) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };
    const apiReq = httpRequest(options, apiRes => {
      const parts = [];
      apiRes.on('data', d => parts.push(d));
      apiRes.on('end', () => {
        const raw = Buffer.concat(parts).toString('utf8');
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error('API returned non-JSON: ' + raw.slice(0, 120)));
        }
      });
    });
    apiReq.on('error', reject);
    apiReq.write(bodyStr);
    apiReq.end();
  });
}

// ── Doctor runner ─────────────────────────────────────────────────────────────
function runDoctor() {
  return new Promise(done => {
    const t0  = Date.now();
    const out = [];
    const err = [];

    const child = spawn(process.execPath, [DOCTOR], {
      env: { ...process.env },
      cwd: REPO_ROOT,
    });

    child.stdout.on('data', d => out.push(d));
    child.stderr.on('data', d => err.push(d));

    child.on('close', code => done({
      exitCode:   code ?? 0,
      stdout:     Buffer.concat(out).toString('utf8'),
      stderr:     Buffer.concat(err).toString('utf8'),
      durationMs: Date.now() - t0,
      timestamp:  new Date().toISOString(),
    }));

    child.on('error', e => done({
      exitCode:   2,
      stdout:     '',
      stderr:     'spawn error: ' + e.message,
      durationMs: Date.now() - t0,
      timestamp:  new Date().toISOString(),
    }));
  });
}

// ── Pack validator runner ─────────────────────────────────────────────────────
function runPackValidator() {
  return new Promise(done => {
    const t0  = Date.now();
    const out = [];
    const err = [];

    const child = spawn(process.execPath, [PACK_VALIDATOR], {
      env: { ...process.env },
      cwd: REPO_ROOT,
    });

    child.stdout.on('data', d => out.push(d));
    child.stderr.on('data', d => err.push(d));

    child.on('close', code => done({
      exitCode:   code ?? 0,
      stdout:     Buffer.concat(out).toString('utf8'),
      stderr:     Buffer.concat(err).toString('utf8'),
      durationMs: Date.now() - t0,
      timestamp:  new Date().toISOString(),
    }));

    child.on('error', e => done({
      exitCode:   2,
      stdout:     '',
      stderr:     'spawn error: ' + e.message,
      durationMs: Date.now() - t0,
      timestamp:  new Date().toISOString(),
    }));
  });
}

// ── Seal-check runner ─────────────────────────────────────────────────────────
function runSealRunner() {
  return new Promise(done => {
    const t0  = Date.now();
    const out = [];
    const err = [];

    const child = spawn(process.execPath, [SEAL_RUNNER], {
      env: { ...process.env },
      cwd: REPO_ROOT,
    });

    child.stdout.on('data', d => out.push(d));
    child.stderr.on('data', d => err.push(d));

    child.on('close', code => done({
      exitCode:   code ?? 0,
      stdout:     Buffer.concat(out).toString('utf8'),
      stderr:     Buffer.concat(err).toString('utf8'),
      durationMs: Date.now() - t0,
      timestamp:  new Date().toISOString(),
    }));

    child.on('error', e => done({
      exitCode:   2,
      stdout:     '',
      stderr:     'spawn error: ' + e.message,
      durationMs: Date.now() - t0,
      timestamp:  new Date().toISOString(),
    }));
  });
}

// ── Identity-drift runner ─────────────────────────────────────────────────────
function runIdentityRunner() {
  return new Promise(done => {
    const t0  = Date.now();
    const out = [];
    const err = [];

    const child = spawn(process.execPath, [IDENTITY_RUNNER], {
      env: { ...process.env },
      cwd: REPO_ROOT,
    });

    child.stdout.on('data', d => out.push(d));
    child.stderr.on('data', d => err.push(d));

    child.on('close', code => done({
      exitCode:   code ?? 0,
      stdout:     Buffer.concat(out).toString('utf8'),
      stderr:     Buffer.concat(err).toString('utf8'),
      durationMs: Date.now() - t0,
      timestamp:  new Date().toISOString(),
    }));

    child.on('error', e => done({
      exitCode:   2,
      stdout:     '',
      stderr:     'spawn error: ' + e.message,
      durationMs: Date.now() - t0,
      timestamp:  new Date().toISOString(),
    }));
  });
}

// ── Static file server ────────────────────────────────────────────────────────
async function serveStatic(req, res) {
  const url      = new URL(req.url, `http://${HOST}:${PORT}`);
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;

  // Prevent path traversal
  const safe = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');
  const file = join(PUBLIC, safe);
  if (!file.startsWith(PUBLIC)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  try {
    const data = await readFile(file);
    const mime = MIME[extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  // CORS headers for local dev (same-origin in practice)
  res.setHeader('Access-Control-Allow-Origin', `http://${HOST}:${PORT}`);

  // ── POST /api/doctor/run ──────────────────────────────────────────────────
  if (url.pathname === '/api/doctor/run' && req.method === 'POST') {
    if (doctorRunning) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Doctor is already running — please wait.' }));
      return;
    }

    doctorRunning = true;
    console.log('  [' + new Date().toISOString() + '] Running tf-sync doctor...');
    try {
      const result = await runDoctor();
      const verdict = result.exitCode === 0 ? 'PASS/WARN'
                    : result.exitCode === 1 ? 'FAIL'
                    : 'ERROR';
      console.log('  [' + new Date().toISOString() + '] Done — exit ' + result.exitCode +
                  ' (' + verdict + ') · ' + (result.durationMs / 1000).toFixed(1) + 's');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } finally {
      doctorRunning = false;
    }
    return;
  }

  // ── GET /api/doctor/status ────────────────────────────────────────────────
  if (url.pathname === '/api/doctor/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ running: doctorRunning }));
    return;
  }

  // ── POST /api/pack-validator/run ──────────────────────────────────────────
  if (url.pathname === '/api/pack-validator/run' && req.method === 'POST') {
    if (pvRunning) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Pack validator already running — please wait.' }));
      return;
    }

    pvRunning = true;
    console.log('  [' + new Date().toISOString() + '] Running pack validator...');
    try {
      const result = await runPackValidator();
      console.log('  [' + new Date().toISOString() + '] Pack validator done — exit ' +
                  result.exitCode + ' · ' + (result.durationMs / 1000).toFixed(1) + 's');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } finally {
      pvRunning = false;
    }
    return;
  }

  // ── GET /api/doc ─────────────────────────────────────────────────────────
  // Serves files from REPO_ROOT/docs/sync/ only — restricted to prevent traversal.
  if (url.pathname === '/api/doc' && req.method === 'GET') {
    const p = url.searchParams.get('p') || '';

    // Reject anything outside docs/sync/ or containing path-traversal sequences
    if (!p.startsWith('docs/sync/') || p.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    const filePath = join(REPO_ROOT, p);
    const docRoot  = join(REPO_ROOT, 'docs', 'sync');

    // Double-check resolved path stays inside docs/sync/
    if (!filePath.startsWith(docRoot)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    try {
      const content = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(content);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
    return;
  }

  // ── POST /api/identity-drift/run ─────────────────────────────────────────
  if (url.pathname === '/api/identity-drift/run' && req.method === 'POST') {
    if (identityRunning) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Identity drift check already running — please wait.' }));
      return;
    }

    identityRunning = true;
    console.log('  [' + new Date().toISOString() + '] Running identity drift detector...');
    try {
      const result = await runIdentityRunner();
      console.log('  [' + new Date().toISOString() + '] Identity drift done — exit ' +
                  result.exitCode + ' · ' + (result.durationMs / 1000).toFixed(1) + 's');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } finally {
      identityRunning = false;
    }
    return;
  }

  // ── POST /api/seal-check/run ──────────────────────────────────────────────
  if (url.pathname === '/api/seal-check/run' && req.method === 'POST') {
    if (sealRunning) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Seal check already running — please wait.' }));
      return;
    }

    sealRunning = true;
    console.log('  [' + new Date().toISOString() + '] Running seal check...');
    try {
      const result = await runSealRunner();
      console.log('  [' + new Date().toISOString() + '] Seal check done — exit ' +
                  result.exitCode + ' · ' + (result.durationMs / 1000).toFixed(1) + 's');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } finally {
      sealRunning = false;
    }
    return;
  }

  // ── POST /api/dry-run-preview/run ────────────────────────────────────────────
  // Proxies to the .NET API at port 5000:
  //   POST /api/sync/workbench/dry-run-preview
  // Lane is fixed to "improvement" in Slice H Step 3.
  // dryRun is always set to true — the API rejects false.
  if (url.pathname === '/api/dry-run-preview/run' && req.method === 'POST') {
    if (drPreviewRunning) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Dry-run preview already running — please wait.' }));
      return;
    }

    drPreviewRunning = true;
    // Register body listeners synchronously before any yield.
    const bodyPromise = readBody(req);
    try {
      const rawBody = await bodyPromise;
      let params;
      try { params = JSON.parse(rawBody || '{}'); } catch { params = {}; }

      const payload = JSON.stringify({
        lane:            'improvement',
        dryRun:          true,
        operationalYear: params.operationalYear ?? null,
        topN:            params.topN ?? null,
        requestedBy:     'operator',
      });

      console.log('  [' + new Date().toISOString() + '] Forwarding dry-run preview to API...');
      const result = await forwardToApi('/api/sync/workbench/dry-run-preview', payload);
      console.log('  [' + new Date().toISOString() + '] Dry-run preview done — ' +
                  (result.durationMs ?? 0) + 'ms');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error('  [dry-run-preview] Error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Preview request failed: ' + err.message }));
    } finally {
      drPreviewRunning = false;
    }
    return;
  }

  // ── Static files ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    await serveStatic(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method not allowed');
});

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, HOST, () => {
  const db   = process.env.PG_DB   || 'terrafusion';
  const host = process.env.PG_HOST || '127.0.0.1';
  const port = process.env.PG_PORT || '5432';
  console.log('');
  console.log('  TerraFusion Sync Workbench — Doctor Panel');
  console.log('  ─────────────────────────────────────────');
  console.log(`  Listening:  http://127.0.0.1:${PORT}`);
  console.log(`  Doctor:     tools/sync/tf-sync-doctor.mjs`);
  console.log(`  Database:   ${db} @ ${host}:${port}`);
  console.log('');
  console.log('  Open http://127.0.0.1:7700 in your browser.');
  console.log('  Ctrl+C to stop.');
  console.log('');
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error(`  Error: port ${PORT} is already in use.`);
    console.error(`  Stop the other process or use a different PORT env var.`);
  } else {
    console.error('  Server error:', e.message);
  }
  process.exit(1);
});
