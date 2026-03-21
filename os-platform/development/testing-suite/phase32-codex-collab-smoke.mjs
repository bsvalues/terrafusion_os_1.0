/**
 * TC-E: Codex369Hub Collaboration Session Smoke
 * Phase 32 — TerraCanon Live Wiring
 *
 * Hub: /hubs/codex369
 * Methods verified against TerraFusion.AI/Hubs/Codex369Hub.cs
 */

import { HubConnectionBuilder, LogLevel, HubConnectionState } from '../../../node_modules/@microsoft/signalr/dist/cjs/index.js';

const BASE = 'http://localhost:5000';
const HUB_PATH = '/hubs/codex369';

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('TC-E: Codex369Hub SignalR Smoke');
  console.log(`Hub: ${BASE}${HUB_PATH}`);
  console.log('');

  const connection = new HubConnectionBuilder()
    .withUrl(`${BASE}${HUB_PATH}`)
    .configureLogging(LogLevel.Warning)
    .withAutomaticReconnect()
    .build();

  // Collect server-pushed messages
  const received = {};
  connection.on('FrameworkUpdate', (data) => { received.frameworkUpdate = data; });
  connection.on('CurrentStatus', (data) => { received.currentStatus = data; });
  connection.on('FoundationMetrics', (data) => { received.foundationMetrics = data; });
  connection.on('AmplificationMetrics', (data) => { received.amplificationMetrics = data; });
  connection.on('UltimatePower', (data) => { received.ultimatePower = data; });

  // TC-E-1: Connect to hub
  try {
    await connection.start();
    assert('TC-E-1: Hub connection established', connection.state === HubConnectionState.Connected,
      `state=${connection.state}`);
  } catch (err) {
    assert('TC-E-1: Hub connection established', false, err.message);
    console.error('Cannot continue — connection failed.');
    process.exit(1);
  }

  // TC-E-2: SubscribeToFrameworkUpdates
  try {
    await connection.invoke('SubscribeToFrameworkUpdates', 'benton');
    assert('TC-E-2: SubscribeToFrameworkUpdates(benton) invoked without throw', true);
  } catch (err) {
    assert('TC-E-2: SubscribeToFrameworkUpdates(benton) invoked without throw', false, err.message);
  }

  // TC-E-3: GetCurrentStatus
  let statusResult = null;
  try {
    statusResult = await connection.invoke('GetCurrentStatus');
    assert('TC-E-3: GetCurrentStatus returns non-null', statusResult !== null && statusResult !== undefined,
      JSON.stringify(statusResult));
  } catch (err) {
    assert('TC-E-3: GetCurrentStatus returns non-null', false, err.message);
  }

  // TC-E-4: GetFoundationMetrics
  let foundationResult = null;
  try {
    foundationResult = await connection.invoke('GetFoundationMetrics');
    assert('TC-E-4: GetFoundationMetrics returns non-null', foundationResult !== null && foundationResult !== undefined,
      JSON.stringify(foundationResult));
  } catch (err) {
    assert('TC-E-4: GetFoundationMetrics returns non-null', false, err.message);
  }

  // TC-E-5: GetAmplificationMetrics
  let ampResult = null;
  try {
    ampResult = await connection.invoke('GetAmplificationMetrics');
    assert('TC-E-5: GetAmplificationMetrics returns non-null', ampResult !== null && ampResult !== undefined,
      JSON.stringify(ampResult));
  } catch (err) {
    assert('TC-E-5: GetAmplificationMetrics returns non-null', false, err.message);
  }

  // TC-E-6: GetUltimatePower
  let ultimateResult = null;
  try {
    ultimateResult = await connection.invoke('GetUltimatePower');
    assert('TC-E-6: GetUltimatePower returns non-null', ultimateResult !== null && ultimateResult !== undefined,
      JSON.stringify(ultimateResult));
  } catch (err) {
    assert('TC-E-6: GetUltimatePower returns non-null', false, err.message);
  }

  // TC-E-7: RequestBalanceRecalculation
  try {
    await connection.invoke('RequestBalanceRecalculation');
    assert('TC-E-7: RequestBalanceRecalculation invoked without throw', true);
  } catch (err) {
    assert('TC-E-7: RequestBalanceRecalculation invoked without throw', false, err.message);
  }

  // TC-E-8: UnsubscribeFromFrameworkUpdates
  try {
    await connection.invoke('UnsubscribeFromFrameworkUpdates');
    assert('TC-E-8: UnsubscribeFromFrameworkUpdates invoked without throw', true);
  } catch (err) {
    assert('TC-E-8: UnsubscribeFromFrameworkUpdates invoked without throw', false, err.message);
  }

  // Wait briefly for any server-push events
  await sleep(1500);

  // TC-E-9: Graceful disconnect
  try {
    await connection.stop();
    assert('TC-E-9: Hub connection stopped cleanly',
      connection.state === HubConnectionState.Disconnected,
      `state=${connection.state}`);
  } catch (err) {
    assert('TC-E-9: Hub connection stopped cleanly', false, err.message);
  }

  console.log('');
  console.log(`TC-E Results: ${passed} passed / ${failed} failed / 9 total`);

  if (failed > 0) {
    console.error('TC-E: FAIL');
    process.exit(1);
  } else {
    console.log('TC-E: LIVE PASS 9/9');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
