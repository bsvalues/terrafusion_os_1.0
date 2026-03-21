/**
 * TC-E: Codex369Hub Collaboration Session Smoke
 * Phase 32 — TerraCanon Live Wiring
 *
 * SignalR JSON Long Polling via Node.js http module.
 * No @microsoft/signalr client library — avoids pnpm hoisting issues.
 *
 * Hub: /hubs/codex369
 * Methods verified against TerraFusion.AI/Hubs/Codex369Hub.cs
 *
 * Key insight: All hub methods take `string? countyId = null` — SignalR does NOT
 * apply C# default values. Client must pass [null] not [].
 */
'use strict';

const http = require('http');

const HOST = 'localhost';
const PORT = 5000;
const HUB = '/hubs/codex369';
const RS = '\x1e'; // SignalR record separator

let passed = 0;
let failed = 0;
let nextId = 1;

function assert(label, condition, detail) {
  if (condition) {
    console.log('  PASS  ' + label);
    passed++;
  } else {
    console.error('  FAIL  ' + label + (detail ? ' -- ' + detail : ''));
    failed++;
  }
}

function postRaw(path, body) {
  return new Promise(function(resolve, reject) {
    var buf = Buffer.from(body, 'utf8');
    var req = http.request({
      host: HOST, port: PORT, method: 'POST', path: path,
      headers: { 'Content-Type': 'application/json', 'Content-Length': buf.length }
    }, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() { resolve({ status: res.statusCode, body: data }); });
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

function getRaw(path, timeoutMs) {
  return new Promise(function(resolve) {
    var done = false;
    var req = http.request({
      host: HOST, port: PORT, method: 'GET', path: path,
      headers: { 'Content-Length': 0 }
    }, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        if (!done) { done = true; resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', function() {
      if (!done) { done = true; resolve({ status: 0, body: '' }); }
    });
    // Use setTimeout to force-resolve — but do NOT destroy the request.
    // req.destroy() can corrupt the server-side connection token.
    // Instead, just resolve early with partial data — the server will
    // send the response naturally and the socket will drain on its own.
    setTimeout(function() {
      if (!done) { done = true; resolve({ status: 0, body: '' }); }
    }, timeoutMs || 5000);
    req.end();
  });
}

function parseMessages(body) {
  return body.split(RS).filter(Boolean).map(function(s) {
    try { return JSON.parse(s); } catch(e) { return null; }
  }).filter(Boolean);
}

async function negotiate() {
  var res = await postRaw(HUB + '/negotiate?negotiateVersion=1', '');
  if (res.status !== 200) throw new Error('Negotiate HTTP ' + res.status);
  var parsed = JSON.parse(res.body);
  if (!parsed.connectionToken) throw new Error('No connectionToken');
  return parsed.connectionToken;
}

async function openSession() {
  // 1. Negotiate
  var token = await negotiate();
  var qid = '?id=' + encodeURIComponent(token);

  // 2. Send handshake
  await postRaw(HUB + qid, JSON.stringify({ protocol: 'json', version: 1 }) + RS);

  // 3. First GET poll — consumes handshake ACK ({}\x1e)
  await getRaw(HUB + qid, 3000);

  return { token: token, qid: qid };
}

async function invokeAndPoll(qid, method, args, pollTimeoutMs) {
  var id = String(nextId++);
  var msg = JSON.stringify({ type: 1, invocationId: id, target: method, arguments: args }) + RS;
  var sendRes = await postRaw(HUB + qid, msg);
  if (sendRes.status !== 200 && sendRes.status !== 204) {
    return { error: 'Send HTTP ' + sendRes.status, invocationId: id };
  }

  // Poll for completion — all hub methods invoke async service methods; allow generous timeout
  var pollRes = await getRaw(HUB + qid, pollTimeoutMs || 15000);
  if (!pollRes.body) return { error: 'Empty poll body', invocationId: id };

  var msgs = parseMessages(pollRes.body);
  var completion = msgs.find(function(m) { return m && m.type === 3 && m.invocationId === id; });
  if (!completion) return { error: 'No completion in poll', invocationId: id, rawBody: pollRes.body.slice(0, 200) };

  return completion; // { type:3, invocationId, result or error }
}

async function sendVoid(qid, method, args) {
  // Fire-and-forget: invocationId null, no result expected
  var msg = JSON.stringify({ type: 1, invocationId: null, target: method, arguments: args }) + RS;
  var res = await postRaw(HUB + qid, msg);
  return res.status;
}

async function main() {
  console.log('TC-E: Codex369Hub SignalR Smoke (Long Polling / raw HTTP)');
  console.log('Hub: http://' + HOST + ':' + PORT + HUB);
  console.log('');

  // TC-E-1: Negotiate (proves hub is mounted and responding)
  var token1;
  try {
    token1 = await negotiate();
    assert('TC-E-1: Hub negotiate returns connectionToken',
      token1 && token1.length > 0, 'token=' + token1);
  } catch (err) {
    assert('TC-E-1: Hub negotiate returns connectionToken', false, err.message);
    console.error('Cannot continue -- negotiate failed.');
    process.exit(1);
  }

  // TC-E-2: Handshake (establishes SignalR JSON protocol)
  try {
    var qid1 = '?id=' + encodeURIComponent(token1);
    var hsRes = await postRaw(HUB + qid1, JSON.stringify({ protocol: 'json', version: 1 }) + RS);
    assert('TC-E-2: Handshake accepted (HTTP 200/204)',
      hsRes.status === 200 || hsRes.status === 204, 'HTTP ' + hsRes.status);
    // Consume handshake ACK
    await getRaw(HUB + qid1, 3000);
  } catch (err) {
    assert('TC-E-2: Handshake accepted', false, err.message);
  }

  // TC-E-3: SubscribeToFrameworkUpdates — void, sends 'benton' county
  try {
    var s3 = await openSession();
    var sub3 = await sendVoid(s3.qid, 'SubscribeToFrameworkUpdates', ['benton']);
    assert('TC-E-3: SubscribeToFrameworkUpdates(benton) accepted',
      sub3 === 200 || sub3 === 204, 'HTTP ' + sub3);
  } catch (err) {
    assert('TC-E-3: SubscribeToFrameworkUpdates(benton) accepted', false, err.message);
  }

  // TC-E-4: GetCurrentStatus — returns Codex369StatusDto
  try {
    var s4 = await openSession();
    var r4 = await invokeAndPoll(s4.qid, 'GetCurrentStatus', [null]);
    assert('TC-E-4: GetCurrentStatus returns result (no error)',
      !r4.error, r4.error || 'keys=' + Object.keys(r4.result || {}).slice(0, 5).join(','));
  } catch (err) {
    assert('TC-E-4: GetCurrentStatus returns result (no error)', false, err.message);
  }

  // TC-E-5: GetFoundationMetrics — returns List<FoundationMetric>
  try {
    var s5 = await openSession();
    var r5 = await invokeAndPoll(s5.qid, 'GetFoundationMetrics', [null]);
    var isArray = Array.isArray(r5.result);
    assert('TC-E-5: GetFoundationMetrics returns non-empty list',
      !r5.error && isArray && r5.result.length > 0,
      r5.error || 'length=' + (isArray ? r5.result.length : typeof r5.result));
  } catch (err) {
    assert('TC-E-5: GetFoundationMetrics returns non-empty list', false, err.message);
  }

  // TC-E-6: GetAmplificationMetrics — returns List<AmplificationMetric>
  // Uses longer poll timeout — chains MeasureFoundation + Amplify
  try {
    var s6 = await openSession();
    var r6 = await invokeAndPoll(s6.qid, 'GetAmplificationMetrics', [null], 15000);
    var isArray6 = Array.isArray(r6.result);
    assert('TC-E-6: GetAmplificationMetrics returns non-empty list',
      !r6.error && isArray6 && r6.result.length > 0,
      r6.error || 'length=' + (isArray6 ? r6.result.length : typeof r6.result));
  } catch (err) {
    assert('TC-E-6: GetAmplificationMetrics returns non-empty list', false, err.message);
  }

  // TC-E-7: GetUltimatePower — returns UltimatePowerMetric
  // Uses longest poll timeout — chains MeasureFoundation + Amplify + CalculateUltimate
  try {
    var s7 = await openSession();
    var r7 = await invokeAndPoll(s7.qid, 'GetUltimatePower', [null], 20000);
    assert('TC-E-7: GetUltimatePower returns result with score',
      !r7.error && r7.result && typeof r7.result.ultimatePowerScore === 'number',
      r7.error || JSON.stringify(r7.result).slice(0, 120));
  } catch (err) {
    assert('TC-E-7: GetUltimatePower returns result with score', false, err.message);
  }

  // TC-E-8: RequestBalanceRecalculation — void
  try {
    var s8 = await openSession();
    var rb8 = await sendVoid(s8.qid, 'RequestBalanceRecalculation', [null]);
    assert('TC-E-8: RequestBalanceRecalculation accepted',
      rb8 === 200 || rb8 === 204, 'HTTP ' + rb8);
  } catch (err) {
    assert('TC-E-8: RequestBalanceRecalculation accepted', false, err.message);
  }

  // TC-E-9: UnsubscribeFromFrameworkUpdates — void
  try {
    var s9 = await openSession();
    await sendVoid(s9.qid, 'SubscribeToFrameworkUpdates', ['benton']); // subscribe first
    var un9 = await sendVoid(s9.qid, 'UnsubscribeFromFrameworkUpdates', [null]);
    assert('TC-E-9: UnsubscribeFromFrameworkUpdates accepted',
      un9 === 200 || un9 === 204, 'HTTP ' + un9);
  } catch (err) {
    assert('TC-E-9: UnsubscribeFromFrameworkUpdates accepted', false, err.message);
  }

  console.log('');
  console.log('TC-E Results: ' + passed + ' passed / ' + failed + ' failed / 9 total');

  if (failed > 0) {
    console.error('TC-E: FAIL');
    process.exit(1);
  } else {
    console.log('TC-E: LIVE PASS 9/9');
    process.exit(0);
  }
}

main().catch(function(err) {
  console.error('Unhandled error:', err);
  process.exit(1);
});
