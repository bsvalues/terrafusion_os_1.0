// GENERATED - DO NOT EDIT
// Simple emitter for local dev-audit verification
const path = require('path');
const { traceService } = require(path.resolve(__dirname, '..', 'TraceService.js'));

async function run() {
  const correlationId = `dev-corr-${Date.now()}`;

  console.log('TF_DEV_AUDIT=', process.env.TF_DEV_AUDIT || 'undefined');

  const invoked = traceService.emit({
    type: 'tool_invoked',
    correlationId,
    toolId: 'dev-emitter',
    summary: 'Dev emitter invocation',
    context: { environment: 'local' },
  });

  const succeeded = traceService.emitWithPiiHandling({
    type: 'tool_succeeded',
    correlationId,
    toolId: 'dev-emitter',
    summary: 'Dev emitter success',
    context: { environment: 'local' },
  }, 'payload_ref', { secret: 'sensitive-value', note: 'for-dev-only' }, 'dev');

  console.log('emitted', invoked.eventId, succeeded.eventId, 'payloadRef=', succeeded.payloadRef);
}

run().catch(err => {
  // eslint-disable-next-line no-console
  console.error('emit-dev-traces failed', err && err.stack ? err.stack : err);
  process.exit(1);
});
