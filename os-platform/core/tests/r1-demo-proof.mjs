#!/usr/bin/env node
/**
 * TerraFusion OS — R1 Demo Proof Script
 *
 * One-command "government proof" that exercises the full R1 pipeline:
 *   1. Authenticate → acquire JWT token
 *   2. Discover a valuation-ready parcel
 *   3. Run CostForge valuation → verify 200 + schema
 *   4. Run levy calculation → verify 200 + schema
 *   5. Verify correlation ID propagation (X-Correlation-ID header)
 *   6. Print summary with correlationIds and key metrics
 *
 * Returns exit code 0 on full success, 1 on any failure.
 * Designed for stakeholder demos and incident-response verification.
 *
 * Usage:
 *   node os-platform/core/tests/r1-demo-proof.mjs
 *   TF_API_PORT=5046 node os-platform/core/tests/r1-demo-proof.mjs
 *
 * Environment:
 *   TF_API_PORT          Backend port (default: 5046)
 *   TF_API_BASE_URL      Full base URL override
 *   TF_PILOT_EMAIL       Auth email (default: admin@gov.)
 *   TF_PILOT_PASSWORD    Auth password (default: TerraFusion2026!)
 */

const PORT = process.env.TF_API_PORT || '5046';
const BASE = process.env.TF_API_BASE_URL?.replace(/\/+$/, '') || `http://localhost:${PORT}`;
const EMAIL = process.env.TF_PILOT_EMAIL || 'admin@gov.';
const PASSWORD = process.env.TF_PILOT_PASSWORD || 'TerraFusion2026!';

// ============================================================================
// Helpers
// ============================================================================

const failures = [];
let stepNum = 0;

function step(label) {
  stepNum++;
  process.stdout.write(`\n[${ stepNum }] ${label}\n`);
}

function pass(msg) {
  console.log(`    ✅ ${msg}`);
}

function fail(msg) {
  console.log(`    ❌ ${msg}`);
  failures.push(`Step ${stepNum}: ${msg}`);
}

function metric(key, value) {
  console.log(`    📊 ${key}: ${value}`);
}

async function httpPost(path, body, token) {
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* non-JSON response */ }
  const correlationId = res.headers.get('X-Correlation-ID') || data?.correlationId || null;
  return { status: res.status, ok: res.ok, data, raw: text, correlationId };
}

async function httpGet(path, token) {
  const url = `${BASE}${path}`;
  const headers = { 'Accept': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* non-JSON response */ }
  const correlationId = res.headers.get('X-Correlation-ID') || data?.correlationId || null;
  return { status: res.status, ok: res.ok, data, raw: text, correlationId };
}

// ============================================================================
// Pipeline
// ============================================================================

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TerraFusion OS — R1 Pipeline Demo Proof');
  console.log(`  Backend: ${BASE}`);
  console.log(`  Time:    ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════');

  const correlationIds = [];

  // ── Step 1: Authenticate ──────────────────────────────────────────

  step('Authenticate (POST /api/auth/login)');
  let token;
  try {
    const auth = await httpPost('/api/auth/login', { email: EMAIL, password: PASSWORD });
    if (!auth.ok || !auth.data?.token) {
      fail(`Auth failed: HTTP ${auth.status} — ${auth.raw?.slice(0, 200)}`);
      return;
    }
    token = auth.data.token;
    pass(`JWT acquired (roles: ${auth.data.roles?.join(', ') || 'unknown'})`);
    if (auth.correlationId) {
      correlationIds.push({ step: 'auth', id: auth.correlationId });
      metric('correlationId', auth.correlationId);
    }
  } catch (err) {
    fail(`Auth unreachable: ${err.message}`);
    return;
  }

  // ── Step 2: Discover parcel ───────────────────────────────────────

  step('Discover valuation-ready parcel (GET /api/properties?pageSize=10)');
  let testParcel = '1-0531-100-0001-000';
  try {
    const props = await httpGet('/api/properties?pageSize=10', token);
    if (!props.ok) {
      fail(`Properties endpoint: HTTP ${props.status}`);
      console.log('    ⚠️  Using fallback parcel:', testParcel);
    } else {
      const items = props.data?.items ?? [];
      const viable = items.find(p => p.parcelNumber && p.improvementValue > 0);
      if (viable) {
        testParcel = viable.parcelNumber;
        pass(`Discovered: ${testParcel} (improvementValue=${viable.improvementValue})`);
      } else if (items.length > 0 && items[0].parcelNumber) {
        testParcel = items[0].parcelNumber;
        pass(`Using first available: ${testParcel} (no improvementValue > 0 found)`);
      } else {
        console.log('    ⚠️  0 properties returned — using fallback:', testParcel);
      }
    }
    if (props.correlationId) {
      correlationIds.push({ step: 'discover', id: props.correlationId });
    }
  } catch (err) {
    console.log(`    ⚠️  Discovery error: ${err.message} — using fallback: ${testParcel}`);
  }

  // ── Step 3: CostForge valuation ──────────────────────────────────

  step(`CostForge valuation (POST /api/costforge/calculate) — parcel: ${testParcel}`);
  try {
    const cf = await httpPost('/api/costforge/calculate', {
      parcelNumber: testParcel,
      countyCode: 'benton',
      region: 'benton',
      buildingType: 'SFR',
    }, token);
    if (cf.correlationId) {
      correlationIds.push({ step: 'costforge', id: cf.correlationId });
      metric('correlationId', cf.correlationId);
    }
    if (!cf.ok) {
      fail(`CostForge: HTTP ${cf.status} — ${cf.raw?.slice(0, 200)}`);
    } else {
      // Contract invariants
      const d = cf.data;
      const totalCost = d.totalCost ?? d.estimatedValue;
      const confidence = d.confidenceScore ?? d.confidence;
      const components = d.components;

      if (typeof totalCost !== 'number' || !Number.isFinite(totalCost) || totalCost <= 0) {
        fail(`totalCost invariant: expected finite > 0, got ${totalCost}`);
      } else {
        pass(`totalCost = $${totalCost.toFixed(2)}`);
      }

      if (typeof confidence !== 'number' || !Number.isFinite(confidence)) {
        fail(`confidence invariant: expected finite number, got ${confidence}`);
      } else {
        pass(`confidence = ${confidence}`);
      }

      if (!Array.isArray(components) && typeof components !== 'object') {
        fail(`components invariant: expected array or object, got ${typeof components}`);
      } else {
        const count = Array.isArray(components) ? components.length : Object.keys(components).length;
        pass(`components: ${count} entries`);
      }

      metric('estimatedValue', `$${totalCost?.toFixed?.(2) ?? 'N/A'}`);
    }
  } catch (err) {
    fail(`CostForge unreachable: ${err.message}`);
  }

  // ── Step 4: Levy calculation ─────────────────────────────────────

  step('Levy calculation (POST /api/levy-calculation/calculate-rate)');
  try {
    const levy = await httpPost('/api/levy-calculation/calculate-rate', {
      districtId: 'DIST-BENTON-DEMO',
      districtName: 'Benton Demo District',
      assessedValue: 1500000,
      budgetAmount: 45000,
      districtType: 'county-regular',
      measureType: 'regular',
      countyCode: 'BENTON',
    }, token);
    if (levy.correlationId) {
      correlationIds.push({ step: 'levy', id: levy.correlationId });
      metric('correlationId', levy.correlationId);
    }
    if (!levy.ok) {
      fail(`Levy: HTTP ${levy.status} — ${levy.raw?.slice(0, 200)}`);
    } else {
      const d = levy.data;
      if (typeof d.aiOptimalRate !== 'number' || !Number.isFinite(d.aiOptimalRate)) {
        fail(`aiOptimalRate invariant: expected finite number, got ${d.aiOptimalRate}`);
      } else {
        pass(`aiOptimalRate = ${d.aiOptimalRate}`);
      }
      metric('projectedRevenue', `$${d.projectedRevenue?.toFixed?.(0) ?? 'N/A'}`);
    }
  } catch (err) {
    fail(`Levy unreachable: ${err.message}`);
  }

  // ── Step 5: Correlation ID propagation ───────────────────────────

  step('Correlation ID propagation (X-Correlation-ID header check)');
  try {
    // Make a simple authenticated GET and check for correlation header
    const health = await httpGet('/api/properties?pageSize=1', token);
    if (health.correlationId) {
      pass(`X-Correlation-ID present: ${health.correlationId}`);
      correlationIds.push({ step: 'correlation-check', id: health.correlationId });
    } else {
      fail('X-Correlation-ID header not present on response');
    }
  } catch (err) {
    fail(`Correlation check failed: ${err.message}`);
  }

  // ── Step 6: Auth guard (unauthenticated → 401) ──────────────────

  step('Auth guard (unauthenticated request → 401)');
  try {
    const noAuth = await httpPost('/api/costforge/calculate', {
      parcelNumber: testParcel,
      countyCode: 'benton',
    });
    if (noAuth.status === 401) {
      pass('Unauthenticated CostForge returns 401');
    } else {
      fail(`Expected 401, got ${noAuth.status}`);
    }
  } catch (err) {
    fail(`Auth guard check failed: ${err.message}`);
  }

  // ══════════════════════════════════════════════════════════════════
  // Summary
  // ══════════════════════════════════════════════════════════════════

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');

  console.log(`\n  Steps:          ${stepNum}`);
  console.log(`  Passed:         ${stepNum - failures.length}`);
  console.log(`  Failed:         ${failures.length}`);

  if (correlationIds.length > 0) {
    console.log('\n  Correlation IDs collected:');
    for (const { step: s, id } of correlationIds) {
      console.log(`    ${s.padEnd(20)} ${id}`);
    }
  }

  if (failures.length > 0) {
    console.log('\n  ❌ FAILURES:');
    for (const f of failures) {
      console.log(`    • ${f}`);
    }
    console.log('\n  Result: FAIL');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exitCode = 1;
  } else {
    console.log('\n  Result: PASS — R1 pipeline fully operational');
    console.log('  Government. Transcended.');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exitCode = 0;
  }
}

// ============================================================================
// Entry
// ============================================================================

run().catch(err => {
  console.error('\n  💥 Unhandled error:', err.message);
  process.exitCode = 1;
});
