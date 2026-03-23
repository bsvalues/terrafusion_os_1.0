import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

test('dev-audit persistence writes events and payloads', async () => {
  // Ensure dev audit toggle is set before loading TraceService
  process.env.TF_DEV_AUDIT = '1';

  const require = createRequire(import.meta.url);
  const traceServicePath = path.resolve('os-platform/core/pilot/trace/TraceService.js');
  // Clear require cache to force new instance that reads TF_DEV_AUDIT
  try {
    delete require.cache[require.resolve(traceServicePath)];
  }
  catch (_) { }

  const { traceService } = require(traceServicePath);

  // Cleanup prior artifacts
  const eventsPath = path.resolve('dev-audit/events.log.jsonl');
  const payloadsPath = path.resolve('dev-audit/payloads.json');
  await fs.rm(eventsPath, { force: true }).catch(() => { });
  await fs.rm(payloadsPath, { force: true }).catch(() => { });

  // Emit an invocation + success with payload_ref
  const correlationId = `test-corr-${Date.now()}`;
  traceService.clear();
  traceService.emit({
    type: 'tool_invoked',
    correlationId,
    toolId: 'test-emitter',
    summary: 'test invocation',
    context: { env: 'test' },
  });

  const successEvent = traceService.emitWithPiiHandling({
    type: 'tool_succeeded',
    correlationId,
    toolId: 'test-emitter',
    summary: 'test success',
    context: { env: 'test' },
  }, 'payload_ref', { secret: 'xxx', note: 'dev-only' }, 'dev');

  // allow async writes to settle
  await new Promise(r => setTimeout(r, 100));

  // Verify events file exists and contains our correlationId
  const eventsData = await fs.readFile(eventsPath, 'utf8');
  assert(eventsData.includes(correlationId), 'events.log.jsonl must contain correlationId');

  // Verify payloads file contains the payloadRef
  const payloadsJson = JSON.parse(await fs.readFile(payloadsPath, 'utf8'));
  assert(payloadsJson[successEvent.payloadRef], 'payloads.json must contain payloadRef entry');
});
