import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const BASE_URL = process.env.CODEX_BASE_URL ?? 'http://localhost:5000';
const ROUTES_FILE = process.env.CODEX_EXPECTED_ROUTES
  ?? path.resolve('os-platform/development/testing-suite/phase32-codex-routes.json');
const AUTH_TOKEN = process.env.CODEX_AUTH_TOKEN ?? '';
const RUN_CORRELATION_ID = process.env.CODEX_CORRELATION_ID
  ?? `codex-smoke-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function buildHeaders(extra = {}) {
  const headers = {
    'X-Correlation-ID': RUN_CORRELATION_ID,
    ...extra,
  };
  if (AUTH_TOKEN) {
    headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  }
  return headers;
}

function summarizeBody(body) {
  if (body == null) return 'null';
  if (Array.isArray(body)) return `array(${body.length})`;
  if (typeof body === 'object') return `object(${Object.keys(body).slice(0, 6).join(',')})`;
  return String(body).slice(0, 120);
}

const routes = JSON.parse(await fs.readFile(ROUTES_FILE, 'utf8'));
const results = [];
let failures = 0;

console.log('Phase 32 Codex REST smoke');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Routes file: ${ROUTES_FILE}`);
console.log(`Correlation ID: ${RUN_CORRELATION_ID}`);
console.log('');

for (const route of routes) {
  const started = performance.now();
  const url = `${BASE_URL}${route.path}`;
  let status = null;
  let contentType = '';
  let echoedCorrelationId = '';
  let summary = '';

  try {
    const init = {
      method: route.method,
      headers: buildHeaders(route.body ? { 'Content-Type': 'application/json' } : {}),
    };
    if (route.body) {
      init.body = JSON.stringify(route.body);
    }

    const response = await fetch(url, init);
    status = response.status;
    contentType = response.headers.get('content-type') ?? '';
    echoedCorrelationId = response.headers.get('x-correlation-id')
      ?? response.headers.get('correlation-id')
      ?? '';

    const text = await response.text();
    let parsed = text;
    if (contentType.includes('application/json')) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    summary = summarizeBody(parsed);

    const pass = route.expectedStatus.includes(status);
    if (!pass) failures++;

    results.push({
      name: route.name,
      method: route.method,
      path: route.path,
      status,
      expectedStatus: route.expectedStatus,
      durationMs: Math.round(performance.now() - started),
      contentType,
      echoedCorrelationId,
      summary,
      pass,
    });

    console.log(`${pass ? 'PASS' : 'FAIL'} ${route.method} ${route.path} -> ${status} (${summary})`);
  } catch (error) {
    failures++;
    results.push({
      name: route.name,
      method: route.method,
      path: route.path,
      status: 'ERROR',
      expectedStatus: route.expectedStatus,
      durationMs: Math.round(performance.now() - started),
      contentType,
      echoedCorrelationId,
      summary: error instanceof Error ? error.message : String(error),
      pass: false,
    });
    console.log(`FAIL ${route.method} ${route.path} -> ERROR (${results.at(-1).summary})`);
  }
}

console.log('');
console.log(JSON.stringify({
  baseUrl: BASE_URL,
  routesFile: ROUTES_FILE,
  correlationId: RUN_CORRELATION_ID,
  failures,
  results,
}, null, 2));

if (failures > 0) {
  process.exit(1);
}
