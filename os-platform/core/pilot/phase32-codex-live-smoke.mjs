#!/usr/bin/env node

const DEFAULT_PORT = process.env.TF_PILOT_PORT || '4317';
const DEFAULT_BASE_URL = `http://127.0.0.1:${DEFAULT_PORT}`;

function trimSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function resolveBaseUrl() {
  return trimSlash(
    process.env.TF_PHASE32_BASE_URL ||
      process.env.TF_PILOT_BASE_URL ||
      process.env.TF_API_URL ||
      DEFAULT_BASE_URL
  );
}

function hasArg(flag) {
  return process.argv.includes(flag);
}

function classifyHttp(status) {
  if (status === 401 || status === 403) {
    return { code: 'AUTH_PATH_UNRESOLVED', exitCode: 3 };
  }
  if (status === 404 || status === 405) {
    return { code: 'CONTRACT_MISMATCH', exitCode: 2 };
  }
  if (status >= 500) {
    return { code: 'LIVE_RUNTIME_FAILURE', exitCode: 1 };
  }
  return { code: 'HTTP_FAILURE', exitCode: 1 };
}

function classifyError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (
    lower.includes('econnrefused') ||
    lower.includes('fetch failed') ||
    lower.includes('timed out') ||
    lower.includes('enotfound') ||
    lower.includes('network')
  ) {
    return { code: 'LIVE_DEPENDENCY_MISSING', exitCode: 1, message };
  }
  return { code: 'REQUEST_FAILURE', exitCode: 1, message };
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  return { response, text, parsed };
}

function validateCanonWrapper(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return 'response body is not a JSON object';
  }
  const requiredFields = ['tool', 'version', 'startedAt', 'dryRun', 'overallOk'];
  for (const field of requiredFields) {
    if (!(field in parsed)) {
      return `missing required field: ${field}`;
    }
  }
  if (typeof parsed.tool !== 'string') return 'tool must be string';
  if (typeof parsed.version !== 'number') return 'version must be number';
  if (typeof parsed.startedAt !== 'string') return 'startedAt must be string';
  if (typeof parsed.dryRun !== 'boolean') return 'dryRun must be boolean';
  if (typeof parsed.overallOk !== 'boolean') return 'overallOk must be boolean';
  return null;
}

async function run() {
  const baseUrl = resolveBaseUrl();
  const dryRun = hasArg('--dry-run');
  const echo = process.env.TF_PHASE32_CANON_ECHO || 'phase32-smoke';

  const checks = [
    {
      id: 'canon_ping',
      path: '/pilot/canon/ping',
      body: { echo },
      expectedTool: 'terracanon-ping',
    },
    {
      id: 'canon_doctor',
      path: '/pilot/canon/doctor',
      body: {},
      expectedTool: 'terracanon-doctor',
    },
    {
      id: 'canon_gatefast',
      path: '/pilot/canon/gatefast',
      body: {},
      expectedTool: 'terracanon-gatefast',
    },
  ];

  console.log('Phase 32 REST Smoke');
  console.log(`baseUrl=${baseUrl}`);
  console.log(`dryRun=${dryRun}`);
  console.log('contract=Pilot canon adapter routes');
  console.log('correlationIdInPayload=false (current contract truth)');
  console.log('');

  if (dryRun) {
    for (const check of checks) {
      console.log(`DRY-RUN ${check.id} ${check.path} expectedTool=${check.expectedTool}`);
    }
    process.exitCode = 0;
    return;
  }

  let exitCode = 0;

  for (const check of checks) {
    const url = `${baseUrl}${check.path}`;
    try {
      const { response, parsed, text } = await postJson(url, check.body);

      if (!response.ok) {
        const failure = classifyHttp(response.status);
        exitCode = Math.max(exitCode, failure.exitCode);
        console.log(
          `FAIL ${check.id} status=${response.status} class=${failure.code} path=${check.path}`
        );
        continue;
      }

      const wrapperError = validateCanonWrapper(parsed);
      if (wrapperError) {
        exitCode = Math.max(exitCode, 2);
        console.log(
          `FAIL ${check.id} status=${response.status} class=CONTRACT_MISMATCH path=${check.path} detail=${wrapperError}`
        );
        continue;
      }

      if (parsed.tool !== check.expectedTool) {
        exitCode = Math.max(exitCode, 2);
        console.log(
          `FAIL ${check.id} status=${response.status} class=CONTRACT_MISMATCH path=${check.path} detail=tool=${parsed.tool}`
        );
        continue;
      }

      if (parsed.correlationId !== undefined) {
        exitCode = Math.max(exitCode, 2);
        console.log(
          `FAIL ${check.id} status=${response.status} class=CONTRACT_MISMATCH path=${check.path} detail=unexpected-correlationId` 
        );
        continue;
      }

      if (parsed.overallOk !== true) {
        exitCode = Math.max(exitCode, 1);
        const detail = typeof parsed.error === 'string' && parsed.error ? parsed.error : 'overallOk=false';
        console.log(
          `FAIL ${check.id} status=${response.status} class=LIVE_RUNTIME_FAILURE path=${check.path} detail=${JSON.stringify(detail)}`
        );
        continue;
      }

      const normalizedKind =
        parsed.normalized && typeof parsed.normalized === 'object' ? Object.keys(parsed.normalized).join(',') : 'none';
      console.log(
        `PASS ${check.id} status=${response.status} path=${check.path} tool=${parsed.tool} normalized=${normalizedKind}`
      );
    } catch (error) {
      const failure = classifyError(error);
      exitCode = Math.max(exitCode, failure.exitCode);
      console.log(
        `FAIL ${check.id} class=${failure.code} path=${check.path} detail=${JSON.stringify(failure.message)}`
      );
    }
  }

  console.log('');
  if (exitCode === 0) {
    console.log('RESULT PASS');
  } else if (exitCode === 2) {
    console.log('RESULT FAIL class=CONTRACT_MISMATCH');
  } else if (exitCode === 3) {
    console.log('RESULT FAIL class=AUTH_PATH_UNRESOLVED');
  } else {
    console.log('RESULT FAIL class=LIVE_DEPENDENCY_OR_RUNTIME');
  }

  process.exitCode = exitCode;
}

await run();