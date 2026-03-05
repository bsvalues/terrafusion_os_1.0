#!/usr/bin/env node
/**
 * TerraFusion OS - R1 B2 Demo Proof Script
 *
 * Operator-grade proof runner:
 *  1) Acquire auth token
 *  2) Discover parcel
 *  3) Valuation success path (200)
 *  4) Levy summary success path (200)
 *  5) Trace lookup by correlationId
 *  6) Unauthenticated guard (401)
 *  7) Write-governance block (missing confirmation must fail)
 *
 * Output contract:
 *   STEP <n> <name>: OK correlationId=<id> key=value
 *   STEP <n> <name>: FAIL correlationId=<id> error=<message>
 *   RESULT: PASS|FAIL
 *
 * Exit codes:
 *   0 pass
 *   1 fail
 */

const DEFAULT_PORT = process.env.TF_API_PORT || '5046';
const BASE_URL = (process.env.TF_BASE_URL || `http://localhost:${DEFAULT_PORT}`).replace(/\/+$/, '');
const COUNTY = (process.env.TF_COUNTY || 'benton').toLowerCase();
const DISTRICT_ID = process.env.TF_DISTRICT_ID || process.env.TF_R1_FIXTURE_DISTRICT_ID || 'DIST-BENTON-SMOKE';
const PARCEL_OVERRIDE = (process.env.TF_PARCEL_ID || process.env.TF_R1_FIXTURE_PARCEL_NUMBER || '').trim();
const TAX_YEAR = Number(process.env.TF_TAX_YEAR || new Date().getUTCFullYear());

const stepRecords = [];

function cleanValue(value) {
  return String(value).replace(/\s+/g, '_');
}

function formatDetails(details) {
  const entries = Object.entries(details || {});
  if (entries.length === 0) {
    return '';
  }
  return ` ${entries.map(([k, v]) => `${k}=${cleanValue(v)}`).join(' ')}`;
}

function makeStepError(message, correlationId) {
  const error = new Error(message);
  error.correlationId = correlationId || 'none';
  return error;
}

function fail(message, correlationId) {
  throw makeStepError(message, correlationId);
}

function correlationFromBody(body) {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const candidates = [
    body.correlationId,
    body.CorrelationId,
    body?.error?.correlationId,
    body?.error?.CorrelationId,
    body?.result?.correlationId,
    body?.metadata?.correlationId,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
}

function extractCorrelationId(response, body) {
  const headerCandidates = ['x-correlation-id', 'correlation-id', 'x-correlationid', 'x-request-id'];
  for (const header of headerCandidates) {
    const value = response.headers.get(header);
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return correlationFromBody(body);
}

async function requestJson(method, path, options = {}) {
  const headers = {};
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  } else {
    headers.Accept = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(options.timeoutMs || 15_000),
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
    raw: text,
    correlationId: extractCorrelationId(response, body),
  };
}

function normalizeProperties(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object' && Array.isArray(payload.items)) {
    return payload.items;
  }
  return [];
}

async function runStep(stepNumber, stepName, executor, options = {}) {
  const allowMissingCorrelation = options.allowMissingCorrelation === true;
  try {
    const outcome = await executor();
    const correlationId = typeof outcome?.correlationId === 'string' ? outcome.correlationId : null;
    if (!allowMissingCorrelation && (!correlationId || correlationId.trim().length === 0)) {
      throw makeStepError('missing correlationId', 'none');
    }

    const normalizedCorrelation = correlationId && correlationId.trim().length > 0 ? correlationId.trim() : 'none';
    stepRecords.push({ step: stepNumber, name: stepName, correlationId: normalizedCorrelation });
    console.log(`STEP ${stepNumber} ${stepName}: OK correlationId=${normalizedCorrelation}${formatDetails(outcome?.details)}`);
    return outcome;
  } catch (error) {
    const correlationId =
      typeof error?.correlationId === 'string' && error.correlationId.trim().length > 0
        ? error.correlationId.trim()
        : 'none';
    const message = (error?.message || String(error)).replace(/\s+/g, ' ').trim();
    console.log(`STEP ${stepNumber} ${stepName}: FAIL correlationId=${correlationId} error=${cleanValue(message)}`);
    throw error;
  }
}

function printCorrelationSummary() {
  console.log('CORRELATION_ID_SUMMARY');
  for (const record of stepRecords.sort((a, b) => a.step - b.step)) {
    console.log(`CID step${record.step} ${record.name}=${record.correlationId}`);
  }
}

async function main() {
  let authToken = '';
  let parcelId = PARCEL_OVERRIDE;

  await runStep(1, 'acquire_auth_token', async () => {
    const envToken = (process.env.TF_AUTH_TOKEN || '').trim();
    if (envToken) {
      authToken = envToken;
      const probe = await requestJson('GET', '/api/properties?pageSize=1', { token: authToken });
      if (!probe.ok) {
        fail(`env token probe failed status=${probe.status}`, probe.correlationId);
      }
      return {
        correlationId: probe.correlationId,
        details: { source: 'env', status: probe.status },
      };
    }

    const email = process.env.TF_USERNAME || process.env.TF_PILOT_EMAIL || 'admin@gov.';
    const password = process.env.TF_PASSWORD || process.env.TF_PILOT_PASSWORD || 'TerraFusion2026!';
    const login = await requestJson('POST', '/api/auth/login', {
      body: { email, password },
    });

    if (!login.ok) {
      fail(`login failed status=${login.status}`, login.correlationId);
    }

    const token = login.body?.token;
    if (typeof token !== 'string' || token.length < 20) {
      fail('login response missing token', login.correlationId);
    }

    authToken = token;
    return {
      correlationId: login.correlationId,
      details: { source: 'login', status: login.status },
    };
  });

  await runStep(2, 'parcel_discovery', async () => {
    const discovery = await requestJson('GET', '/api/properties?pageSize=25', { token: authToken });
    if (!discovery.ok) {
      fail(`parcel discovery failed status=${discovery.status}`, discovery.correlationId);
    }

    const items = normalizeProperties(discovery.body);
    const firstViable = items.find(
      item =>
        typeof item?.parcelNumber === 'string' &&
        item.parcelNumber.trim().length > 0 &&
        Number(item?.improvementValue ?? 0) > 0
    );
    const firstAny = items.find(item => typeof item?.parcelNumber === 'string' && item.parcelNumber.trim().length > 0);

    if (!parcelId) {
      parcelId = (firstViable?.parcelNumber || firstAny?.parcelNumber || '').trim();
    }

    if (!parcelId) {
      fail('no parcel discovered and no TF_PARCEL_ID override provided', discovery.correlationId);
    }

    return {
      correlationId: discovery.correlationId,
      details: {
        source: PARCEL_OVERRIDE ? 'env_override' : firstViable ? 'discovered_viable' : 'discovered_first',
        parcelId,
        itemCount: items.length,
      },
    };
  });

  await runStep(3, 'run_valuation_model', async () => {
    const valuation = await requestJson('POST', '/api/costforge/calculate', {
      token: authToken,
      body: {
        parcelNumber: parcelId,
        countyCode: COUNTY,
        region: COUNTY,
        buildingType: 'cost',
      },
    });

    if (!valuation.ok) {
      fail(`valuation failed status=${valuation.status}`, valuation.correlationId);
    }

    const totalCost = Number(valuation.body?.totalCost ?? NaN);
    if (!Number.isFinite(totalCost) || totalCost <= 0) {
      fail('valuation response missing positive totalCost', valuation.correlationId);
    }

    return {
      correlationId: valuation.correlationId,
      details: { status: valuation.status, totalCost: totalCost.toFixed(2) },
    };
  });

  await runStep(4, 'summarize_levy_rate_components', async () => {
    const levy = await requestJson('POST', '/api/levy-calculation/calculate-rate', {
      token: authToken,
      body: {
        districtId: DISTRICT_ID,
        districtName: 'Benton Smoke District',
        assessedValue: 1500000,
        budgetAmount: 45000,
        districtType: 'county-regular',
        measureType: 'regular',
        countyCode: COUNTY.toUpperCase(),
      },
    });

    if (!levy.ok) {
      fail(`levy summary failed status=${levy.status}`, levy.correlationId);
    }

    const totalRate = Number(levy.body?.aiOptimalRate ?? levy.body?.totalRate ?? NaN);
    if (!Number.isFinite(totalRate)) {
      fail('levy response missing numeric rate', levy.correlationId);
    }

    return {
      correlationId: levy.correlationId,
      details: { status: levy.status, totalRate: totalRate.toFixed(4) },
    };
  });

  await runStep(5, 'trace_lookup', async () => {
    const pilotMod = await import('../pilot/index.js');
    const traceMod = await import('../trace/index.js');
    const pilot = pilotMod.default || pilotMod;
    const trace = traceMod.default || traceMod;

    const registry = new pilot.ToolRegistry();
    await registry.initialize();

    const runner = new pilot.ToolRunner({ registry });
    pilot.registerPhase84Handlers(runner);
    pilot.registerR1Handlers(runner, trace.traceService);

    const invokeResult = await runner.execute({
      toolId: 'run_valuation_model',
      params: {
        county: COUNTY,
        parcelId,
        taxYear: TAX_YEAR,
      },
      context: {
        countyId: COUNTY,
        userId: 'r1-demo-proof',
        roles: ['appraiser'],
        mode: 'pilot',
        confirmation: true,
        reasonCode: 'annual_certification',
      },
    });

    if (!invokeResult.ok) {
      fail(`trace seed invoke failed: ${invokeResult.error || 'unknown'}`, invokeResult.correlationId);
    }

    const traceResult = await runner.execute({
      toolId: 'search_trace_by_correlation',
      params: {
        county: COUNTY,
        correlationId: invokeResult.correlationId,
        limit: 25,
      },
      context: {
        countyId: COUNTY,
        userId: 'r1-demo-proof',
        roles: ['administrator'],
        mode: 'pilot',
      },
    });

    if (!traceResult.ok) {
      fail(`trace lookup failed: ${traceResult.error || 'unknown'}`, traceResult.correlationId);
    }

    const eventCount = Array.isArray(traceResult.result?.events) ? traceResult.result.events.length : 0;
    if (!traceResult.result?.found || eventCount === 0) {
      fail('trace lookup returned no events', traceResult.correlationId);
    }

    return {
      correlationId: traceResult.correlationId,
      details: {
        tracedCorrelationId: invokeResult.correlationId,
        eventCount,
      },
    };
  });

  await runStep(
    6,
    'unauthenticated_401_guard',
    async () => {
      const unauth = await requestJson('POST', '/api/costforge/calculate', {
        body: {
          parcelNumber: parcelId,
          countyCode: COUNTY,
          region: COUNTY,
          buildingType: 'cost',
        },
      });

      if (unauth.status !== 401) {
        fail(`expected 401, got ${unauth.status}`, unauth.correlationId);
      }

      return {
        correlationId: unauth.correlationId || 'none',
        details: { status: unauth.status },
      };
    },
    { allowMissingCorrelation: true }
  );

  // Step 7: Write-gate enforcement proof (C3)
  // Attempts assemble_boe_packet WITHOUT confirmation — must be blocked.
  await runStep(7, 'write_block_proof', async () => {
    const pilotMod = await import('../pilot/index.js');
    const traceMod = await import('../trace/index.js');
    const pilot = pilotMod.default || pilotMod;
    const trace = traceMod.default || traceMod;

    const registry = new pilot.ToolRegistry();
    await registry.initialize();

    const traceStore = new trace.InMemoryTraceStore({ maxEvents: 100 });
    const traceService = new trace.TraceService({ store: traceStore });
    const runner = new pilot.ToolRunner({ registry, trace: traceService });
    pilot.registerPhase84Handlers(runner);
    pilot.registerWriteGateHandlers(runner);

    // Deliberately omit confirmation + reasonCode → must be blocked
    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: {
        county: COUNTY,
        caseId: 'BOE-2026-PROOF',
        sections: ['cover_sheet'],
      },
      context: {
        countyId: COUNTY,
        userId: 'r1-demo-proof',
        roles: ['viewer'],
        mode: 'pilot',
      },
    });

    if (result.ok) {
      fail('write_high tool should have been BLOCKED but succeeded — enforcement is broken', result.correlationId);
    }

    const errorCode = result.errorCode || '';
    const hasExpectedCode = (
      errorCode === 'CONFIRMATION_REQUIRED' ||
      errorCode === 'PERMISSION_DENIED' ||
      errorCode === 'REASON_CODE_REQUIRED'
    );

    if (!hasExpectedCode) {
      fail(`blocked but unexpected errorCode: ${errorCode}`, result.correlationId);
    }

    return {
      correlationId: result.correlationId,
      details: { errorCode, blocked: 'true' },
    };
  });
}

main()
  .then(() => {
    printCorrelationSummary();
    console.log('RESULT: PASS');
    process.exit(0);
  })
  .catch(() => {
    printCorrelationSummary();
    console.log('RESULT: FAIL');
    process.exit(1);
  });
