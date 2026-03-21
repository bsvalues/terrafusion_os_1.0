/**
 * TC-F: PACS SQL Server Connection Smoke
 * Phase 33 — PACS Live Integration
 *
 * Reads TF_DEV_PACS_* environment variables, opens a SQL Server connection,
 * and verifies each of the six pacscontract.v1 views returns at least one row.
 *
 * Required env vars (set by SRE / county IT before running):
 *   TF_DEV_PACS_SERVER   — SQL Server hostname or IP
 *   TF_DEV_PACS_DATABASE — Database name (typically pacs_oltp)
 *   TF_DEV_PACS_USER     — SQL Server login
 *   TF_DEV_PACS_PASSWORD — SQL Server password
 *
 * Optional:
 *   TF_DEV_PACS_TRUST_CERT — set to "true" to add TrustServerCertificate=true
 *                             (required for self-signed dev certs)
 *   TF_DEV_PACS_TIMEOUT    — query timeout seconds (default: 30)
 *
 * Usage:
 *   node phase33-pacs-connection-smoke.mjs
 *
 * Prerequisite:
 *   pnpm add -w mssql   (or: npm install mssql)
 *   — OR run against the .NET health endpoint instead (see --http mode)
 *
 * Run against .NET API instead of direct SQL:
 *   TF_API_URL=http://localhost:5000 node phase33-pacs-connection-smoke.mjs --http
 *
 * Exit codes:
 *   0 — all assertions passed
 *   1 — one or more assertions failed or env vars missing
 */
'use strict';

import http from 'http';
import https from 'https';
import { URL } from 'url';

// ── Env vars ─────────────────────────────────────────────────────────────

const {
  TF_DEV_PACS_SERVER,
  TF_DEV_PACS_DATABASE,
  TF_DEV_PACS_USER,
  TF_DEV_PACS_PASSWORD,
  TF_DEV_PACS_TRUST_CERT,
  TF_DEV_PACS_TIMEOUT,
  TF_API_URL,
} = process.env;

const HTTP_MODE = process.argv.includes('--http');

// ── Assertions ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log('  PASS  ' + label);
    passed++;
  } else {
    console.error('  FAIL  ' + label + (detail ? ' -- ' + detail : ''));
    failed++;
  }
}

// ── pacscontract.v1 required views ────────────────────────────────────────

const REQUIRED_VIEWS = [
  'vw_TerraFusion_Property_Core',
  'vw_TerraFusion_Property_Ownership',
  'vw_TerraFusion_Assessment_History',
  'vw_TerraFusion_Comparable_Sales',
  'vw_TerraFusion_Cama_Characteristics',
  'vw_TerraFusion_Improvement_Cost_Matrices',
];

// ── HTTP helper (for --http mode) ─────────────────────────────────────────

function getJson(urlStr) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.get(urlStr, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(new Error('timeout')); });
  });
}

// ── HTTP mode: smoke against running .NET API ─────────────────────────────

async function runHttpMode() {
  const base = (TF_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  console.log('TC-F (HTTP mode): PACS health via .NET API');
  console.log('API: ' + base);
  console.log('');

  // TC-F-H-1: health endpoint reachable
  let healthRes;
  try {
    healthRes = await getJson(base + '/api/pacs/health');
    assert('TC-F-H-1: GET /api/pacs/health reachable',
      healthRes.status === 200 || healthRes.status === 503,
      'HTTP ' + healthRes.status);
  } catch (err) {
    assert('TC-F-H-1: GET /api/pacs/health reachable', false, err.message);
    return;
  }

  // TC-F-H-2: PACS connected (200+connected = live, degraded/503 = not yet provisioned)
  const pacsLive = healthRes.status === 200 && healthRes.body?.status === 'connected';
  assert('TC-F-H-2: PACS status is connected (SQL Server provisioned)',
    pacsLive,
    healthRes.status === 503
      ? 'PACS not configured — SQL Server not yet provisioned'
      : 'status=' + healthRes.body?.status);

  if (!pacsLive) {
    console.log('');
    console.log('  NOTE: "degraded" or 503 is expected before SQL Server is provisioned.');
    console.log('  Endpoint wiring is correct. Re-run this smoke once SRE provisions the server.');
    console.log('  Expected pre-provisioning result: 1 passed / 1 failed');
    return;
  }

  // TC-F-H-3: latency reasonable
  const latency = healthRes.body?.latencyMs;
  assert('TC-F-H-3: PACS latency < 2000ms',
    typeof latency === 'number' && latency < 2000,
    'latencyMs=' + latency);

  // TC-F-H-4: properties endpoint returns data
  let propsRes;
  try {
    propsRes = await getJson(base + '/api/pacs/properties?page=1&pageSize=5');
    assert('TC-F-H-4: GET /api/pacs/properties returns 200',
      propsRes.status === 200, 'HTTP ' + propsRes.status);
    assert('TC-F-H-5: /api/pacs/properties items array present',
      Array.isArray(propsRes.body?.items), 'body=' + JSON.stringify(propsRes.body).slice(0, 80));
    assert('TC-F-H-6: /api/pacs/properties has at least 1 item',
      propsRes.body?.items?.length > 0, 'count=' + propsRes.body?.items?.length);
  } catch (err) {
    assert('TC-F-H-4: GET /api/pacs/properties returns 200', false, err.message);
  }
}

// ── Direct SQL mode ───────────────────────────────────────────────────────

async function runSqlMode() {
  // Check required env vars
  const missing = [];
  if (!TF_DEV_PACS_SERVER)   missing.push('TF_DEV_PACS_SERVER');
  if (!TF_DEV_PACS_DATABASE) missing.push('TF_DEV_PACS_DATABASE');
  if (!TF_DEV_PACS_USER)     missing.push('TF_DEV_PACS_USER');
  if (!TF_DEV_PACS_PASSWORD) missing.push('TF_DEV_PACS_PASSWORD');

  if (missing.length > 0) {
    console.error('TC-F: Missing required env vars: ' + missing.join(', '));
    console.error('Set TF_DEV_PACS_* variables and re-run.');
    console.error('');
    console.error('Alternative: run in HTTP mode against the .NET API:');
    console.error('  node phase33-pacs-connection-smoke.mjs --http');
    process.exit(1);
  }

  let sql;
  try {
    // Dynamic import — requires mssql to be installed
    const mod = await import('mssql');
    sql = mod.default ?? mod;
  } catch {
    console.error('TC-F: mssql package not installed.');
    console.error('Run: pnpm add -w mssql  OR use --http mode instead.');
    process.exit(1);
  }

  const config = {
    server:   TF_DEV_PACS_SERVER,
    database: TF_DEV_PACS_DATABASE,
    user:     TF_DEV_PACS_USER,
    password: TF_DEV_PACS_PASSWORD,
    requestTimeout: parseInt(TF_DEV_PACS_TIMEOUT || '30', 10) * 1000,
    options: {
      encrypt:              true,
      trustServerCertificate: TF_DEV_PACS_TRUST_CERT === 'true',
      appName:              'TerraFusion-OS-Smoke',
    },
  };

  console.log('TC-F: PACS SQL Server Connection Smoke (direct SQL)');
  console.log('Server:   ' + TF_DEV_PACS_SERVER);
  console.log('Database: ' + TF_DEV_PACS_DATABASE);
  console.log('User:     ' + TF_DEV_PACS_USER);
  console.log('');

  // TC-F-1: Connect
  let pool;
  try {
    pool = await sql.connect(config);
    assert('TC-F-1: SQL Server connection established', true);
  } catch (err) {
    assert('TC-F-1: SQL Server connection established', false, err.message);
    console.error('Cannot continue — connection failed.');
    process.exit(1);
  }

  // TC-F-2 through TC-F-7: Each pacscontract.v1 view returns >= 1 row
  for (let i = 0; i < REQUIRED_VIEWS.length; i++) {
    const view = REQUIRED_VIEWS[i];
    const label = 'TC-F-' + (i + 2) + ': SELECT TOP 1 FROM ' + view;
    try {
      const result = await pool.request().query('SELECT TOP 1 * FROM dbo.[' + view + ']');
      assert(label + ' returns row',
        result.recordset.length > 0,
        'rowCount=' + result.recordset.length);
    } catch (err) {
      assert(label + ' returns row', false, err.message);
    }
  }

  // TC-F-8: Row count on Property Core > 0
  try {
    const result = await pool.request()
      .query('SELECT COUNT(*) AS cnt FROM dbo.[vw_TerraFusion_Property_Core]');
    const cnt = result.recordset[0]?.cnt ?? 0;
    assert('TC-F-8: vw_TerraFusion_Property_Core row count > 0',
      cnt > 0, 'count=' + cnt);
    if (cnt > 0) {
      console.log('  INFO  Property_Core rows: ' + cnt);
    }
  } catch (err) {
    assert('TC-F-8: vw_TerraFusion_Property_Core row count > 0', false, err.message);
  }

  await pool.close();
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  if (HTTP_MODE) {
    await runHttpMode();
  } else {
    await runSqlMode();
  }

  console.log('');
  console.log('TC-F Results: ' + passed + ' passed / ' + failed + ' failed');

  if (failed > 0) {
    console.error('TC-F: FAIL');
    process.exit(1);
  } else {
    console.log('TC-F: LIVE PASS');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
