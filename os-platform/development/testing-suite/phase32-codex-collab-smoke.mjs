import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function resolveSignalRModule() {
  const pnpmRoot = path.resolve('node_modules/.pnpm');
  const candidate = fs.readdirSync(pnpmRoot)
    .filter((name) => name.startsWith('@microsoft+signalr@'))
    .sort()
    .at(-1);

  if (!candidate) {
    throw new Error('Unable to locate @microsoft/signalr in node_modules/.pnpm');
  }

  return pathToFileURL(path.join(pnpmRoot, candidate, 'node_modules/@microsoft/signalr/dist/cjs/index.js')).href;
}

const signalr = await import(resolveSignalRModule());
const { HubConnectionBuilder, LogLevel, HubConnectionState } = signalr;

const BASE_URL = process.env.CODEX_BASE_URL ?? 'http://localhost:5000';
const HUB_PATH = process.env.CODEX_HUB_PATH ?? '/hubs/codex369';
const TEST_SESSION = process.env.CODEX_TEST_SESSION ?? 'phase32-smoke';
const AUTH_TOKEN = process.env.CODEX_AUTH_TOKEN ?? '';
const RUN_CORRELATION_ID = process.env.CODEX_CORRELATION_ID
  ?? `codex-hub-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const events = [];
let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`PASS ${label}`);
    passed++;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function negotiate() {
  const response = await fetch(
    `${BASE_URL}${HUB_PATH}/negotiate?negotiateVersion=1`,
    {
      method: 'POST',
      headers: {
        'X-Correlation-ID': RUN_CORRELATION_ID,
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      },
    },
  );

  return {
    status: response.status,
    body: await response.text(),
  };
}

async function main() {
  console.log('Phase 32 Codex hub smoke');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Hub path: ${HUB_PATH}`);
  console.log(`Correlation ID: ${RUN_CORRELATION_ID}`);
  console.log('');

  try {
    const negotiation = await negotiate();
    assert('negotiate endpoint reachable', negotiation.status === 200, `status=${negotiation.status}`);
  } catch (error) {
    assert('negotiate endpoint reachable', false, error instanceof Error ? error.message : String(error));
  }

  const connection = new HubConnectionBuilder()
    .withUrl(`${BASE_URL}${HUB_PATH}`, {
      headers: {
        'X-Correlation-ID': RUN_CORRELATION_ID,
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      },
    })
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on('FrameworkStatusUpdate', (data) => events.push({ event: 'FrameworkStatusUpdate', summary: !!data }));
  connection.on('DivineBalanceAchieved', (data) => events.push({ event: 'DivineBalanceAchieved', summary: !!data }));
  connection.on('HealthSummaryUpdate', (data) => events.push({ event: 'HealthSummaryUpdate', summary: !!data }));
  connection.on('SafeguardWarning', (data) => events.push({ event: 'SafeguardWarning', summary: !!data }));

  try {
    await connection.start();
    assert('hub connection established', connection.state === HubConnectionState.Connected, `state=${connection.state}`);
  } catch (error) {
    assert('hub connection established', false, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  try {
    await connection.invoke('SubscribeToFrameworkUpdates', TEST_SESSION);
    assert('subscribe invoked', true);
  } catch (error) {
    assert('subscribe invoked', false, error instanceof Error ? error.message : String(error));
  }

  try {
    const status = await connection.invoke('GetCurrentStatus', TEST_SESSION);
    assert('GetCurrentStatus returned payload', !!status, JSON.stringify(status));
  } catch (error) {
    assert('GetCurrentStatus returned payload', false, error instanceof Error ? error.message : String(error));
  }

  try {
    await connection.invoke('RequestBalanceRecalculation', TEST_SESSION);
    assert('recalculation invoked', true);
  } catch (error) {
    assert('recalculation invoked', false, error instanceof Error ? error.message : String(error));
  }

  await sleep(1500);
  assert('at least one server event observed', events.length > 0, JSON.stringify(events));

  try {
    await connection.invoke('UnsubscribeFromFrameworkUpdates', TEST_SESSION);
    assert('unsubscribe invoked', true);
  } catch (error) {
    assert('unsubscribe invoked', false, error instanceof Error ? error.message : String(error));
  }

  try {
    await connection.stop();
    assert('disconnect clean', connection.state === HubConnectionState.Disconnected, `state=${connection.state}`);
  } catch (error) {
    assert('disconnect clean', false, error instanceof Error ? error.message : String(error));
  }

  console.log('');
  console.log(JSON.stringify({
    baseUrl: BASE_URL,
    hubPath: HUB_PATH,
    testSession: TEST_SESSION,
    correlationId: RUN_CORRELATION_ID,
    passed,
    failed,
    events,
  }, null, 2));

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
