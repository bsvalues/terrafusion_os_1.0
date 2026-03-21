#!/usr/bin/env node

function hasArg(flag) {
  return process.argv.includes(flag);
}

function classifySignalRError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized')) {
    return { code: 'AUTH_PATH_UNRESOLVED', exitCode: 3, message };
  }
  if (
    lower.includes('404') ||
    lower.includes('405') ||
    lower.includes('unknown hub') ||
    lower.includes('unknown method') ||
    lower.includes('does not exist')
  ) {
    return { code: 'CONTRACT_MISMATCH', exitCode: 2, message };
  }
  if (
    lower.includes('econnrefused') ||
    lower.includes('fetch failed') ||
    lower.includes('timed out') ||
    lower.includes('enotfound') ||
    lower.includes('network')
  ) {
    return { code: 'LIVE_DEPENDENCY_MISSING', exitCode: 1, message };
  }
  return { code: 'COLLAB_RUNTIME_FAILURE', exitCode: 1, message };
}

async function loadSignalR() {
  return import('@microsoft/signalr');
}

async function run() {
  const dryRun = hasArg('--dry-run');
  const hubUrl = process.env.TF_PHASE32_COLLAB_URL || '';
  const joinMethod = process.env.TF_PHASE32_COLLAB_JOIN_METHOD || '';
  const leaveMethod = process.env.TF_PHASE32_COLLAB_LEAVE_METHOD || '';
  const sendMethod = process.env.TF_PHASE32_COLLAB_SEND_METHOD || '';
  const sessionId = process.env.TF_PHASE32_COLLAB_SESSION_ID || `phase32-${Date.now()}`;
  const userJson = process.env.TF_PHASE32_COLLAB_USER_JSON || '{"userId":"phase32-smoke","displayName":"Phase 32 Smoke","role":"assessor"}';
  const sendPayloadJson = process.env.TF_PHASE32_COLLAB_SEND_PAYLOAD_JSON || '{"kind":"phase32-smoke"}';

  console.log('Phase 32 Collaboration Smoke');
  console.log(`dryRun=${dryRun}`);
  console.log(`hubUrl=${hubUrl || '<missing>'}`);
  console.log(`joinMethod=${joinMethod || '<missing>'}`);
  console.log(`leaveMethod=${leaveMethod || '<missing>'}`);
  console.log(`sendMethod=${sendMethod || '<not-set>'}`);
  console.log('contract=explicit live hub input required');
  console.log('');

  if (dryRun) {
    console.log(`DRY-RUN connect ${hubUrl || '<TF_PHASE32_COLLAB_URL required>'}`);
    console.log(`DRY-RUN invoke ${joinMethod || '<TF_PHASE32_COLLAB_JOIN_METHOD required>'}(${sessionId}, <user>)`);
    if (sendMethod) {
      console.log(`DRY-RUN invoke ${sendMethod}(${sessionId}, <payload>)`);
    } else {
      console.log('DRY-RUN invoke <optional TF_PHASE32_COLLAB_SEND_METHOD omitted>');
    }
    console.log(`DRY-RUN invoke ${leaveMethod || '<TF_PHASE32_COLLAB_LEAVE_METHOD required>'}(${sessionId})`);
    process.exitCode = 0;
    return;
  }

  if (!hubUrl || !joinMethod || !leaveMethod) {
    console.log('BLOCKED class=CONTRACT_TRUTH_MISSING detail=hub url and join/leave methods must be supplied explicitly');
    process.exitCode = 2;
    return;
  }

  let user;
  let sendPayload;
  try {
    user = JSON.parse(userJson);
    sendPayload = JSON.parse(sendPayloadJson);
  } catch (error) {
    const failure = classifySignalRError(error);
    console.log(`FAIL class=${failure.code} detail=${JSON.stringify(failure.message)}`);
    process.exitCode = failure.exitCode;
    return;
  }

  let signalR;
  try {
    signalR = await loadSignalR();
  } catch (error) {
    const failure = classifySignalRError(error);
    console.log(`FAIL class=${failure.code} detail=${JSON.stringify(failure.message)}`);
    process.exitCode = failure.exitCode;
    return;
  }

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, { withCredentials: true })
    .withAutomaticReconnect([0])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  try {
    await connection.start();
    console.log(`PASS connect url=${hubUrl}`);

    await connection.invoke(joinMethod, sessionId, user);
    console.log(`PASS invoke method=${joinMethod}`);

    if (sendMethod) {
      await connection.invoke(sendMethod, sessionId, sendPayload);
      console.log(`PASS invoke method=${sendMethod}`);
    }

    await connection.invoke(leaveMethod, sessionId);
    console.log(`PASS invoke method=${leaveMethod}`);

    await connection.stop();
    console.log('PASS disconnect');
    console.log('RESULT PASS');
    process.exitCode = 0;
  } catch (error) {
    const failure = classifySignalRError(error);
    console.log(`FAIL class=${failure.code} detail=${JSON.stringify(failure.message)}`);
    try {
      await connection.stop();
    } catch {
      // ignore shutdown failure on already-broken connection
    }
    process.exitCode = failure.exitCode;
  }
}

await run();