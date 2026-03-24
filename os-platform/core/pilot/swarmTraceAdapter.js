// GENERATED - DO NOT EDIT
const { randomUUID } = require('crypto');
const { traceService } = require('../trace/TraceService.js');

function requireCounty(countyId) {
  if (typeof countyId !== 'string' || countyId.trim().length === 0) {
    throw new Error('swarmTraceAdapter: countyId is required');
  }
}

function buildToolContext(payload) {
  const countyId = payload.countyId.trim();
  return {
    countyId,
    userId: `swarm:${payload.agentId}`,
    roles: ['system'],
    mode: 'pilot',
  };
}

function buildToolId(kind, payload) {
  const suite = payload.suite ?? 'os';
  return `swarm.${suite}.${kind}`;
}

function onSwarmDispatch(payload) {
  requireCounty(payload.countyId);

  const correlationId = payload.correlationId ?? randomUUID();
  const context = buildToolContext(payload);

  try {
    traceService.emit({
      type: 'tool_invoked',
      toolId: buildToolId('dispatch', payload),
      correlationId,
      context,
      summary: `swarm.dispatch task:${payload.taskId}`,
      component: 'swarmTraceAdapter',
    });
  } catch {
    // Fire-and-forget by design: trace failures must not block swarm work.
  }

  return correlationId;
}

function onSwarmComplete(payload) {
  requireCounty(payload.countyId);

  const context = buildToolContext(payload);
  const correlationId = payload.correlationId ?? randomUUID();

  try {
    traceService.emit({
      type: 'tool_completed',
      toolId: buildToolId('complete', payload),
      correlationId,
      context,
      summary: `swarm.complete task:${payload.taskId}`,
      component: 'swarmTraceAdapter',
    });
  } catch {
    // Fire-and-forget by design: trace failures must not block swarm work.
  }
}

function onSwarmFail(payload) {
  requireCounty(payload.countyId);

  const context = buildToolContext(payload);
  const correlationId = payload.correlationId ?? randomUUID();
  const reason = payload.reason.trim();

  try {
    traceService.emit({
      type: 'tool_failed',
      toolId: buildToolId('fail', payload),
      correlationId,
      context,
      summary: `swarm.fail task:${payload.taskId} reason:${reason}`,
      errorCode: 'SWARM_TASK_FAILED',
      component: 'swarmTraceAdapter',
    });
  } catch {
    // Fire-and-forget by design: trace failures must not block swarm work.
  }
}

module.exports = {
  onSwarmDispatch,
  onSwarmComplete,
  onSwarmFail,
};
