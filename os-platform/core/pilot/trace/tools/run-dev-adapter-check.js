// Quick runner to validate dev-adapter persistence without node --test worker isolation
const fs = require('fs');
const path = require('path');

process.env.TF_DEV_AUDIT = process.env.TF_DEV_AUDIT || '1';
process.env.TF_DEV_AUDIT_STORE = process.env.TF_DEV_AUDIT_STORE || 'sqlite';

const traceServicePath = path.resolve(__dirname, '..', 'TraceService.js');
const { traceService } = require(traceServicePath);

const eventsPath = path.resolve(path.join(process.cwd(), 'dev-audit', 'events.log.jsonl'));
const payloadsPath = path.resolve(path.join(process.cwd(), 'dev-audit', 'payloads.json'));

try { fs.rmSync(eventsPath, { force: true }); } catch (_) {}
try { fs.rmSync(payloadsPath, { force: true }); } catch (_) {}

traceService.clear();

const correlationId = `manual-corr-${Date.now()}`;
traceService.emit({ type: 'tool_invoked', correlationId, toolId: 'manual-check', summary: 'invoked', context: {} });
const success = traceService.emitWithPiiHandling({ type: 'tool_succeeded', correlationId, toolId: 'manual-check', summary: 'success', context: {} }, 'payload_ref', { secret: 's' }, 'dev');

// wait briefly for sync writes
setTimeout(() => {
  try {
    const events = fs.readFileSync(eventsPath, 'utf8');
    const payloads = fs.readFileSync(payloadsPath, 'utf8');
    console.log('Events file exists, contains:', events.includes(correlationId));
    console.log('Payloads has ref:', payloads.includes(success.payloadRef));
    process.exit(0);
  } catch (err) {
    console.error('Check failed', err && err.message);
    process.exit(2);
  }
}, 200);
