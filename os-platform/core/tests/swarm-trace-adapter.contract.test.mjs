import assert from 'node:assert';
import { before, beforeEach, afterEach, describe, it } from 'node:test';

let onSwarmDispatch;
let onSwarmComplete;
let onSwarmFail;
let traceService;

const captured = [];
let originalEmit;

before(async () => {
  const adapterModule = await import('../pilot/swarmTraceAdapter.js');
  const traceModule = await import('../trace/TraceService.js');
  const adapter = adapterModule.default ?? adapterModule;

  onSwarmDispatch = adapter.onSwarmDispatch;
  onSwarmComplete = adapter.onSwarmComplete;
  onSwarmFail = adapter.onSwarmFail;
  traceService = traceModule.traceService;
});

beforeEach(() => {
  captured.length = 0;
  originalEmit = traceService.emit.bind(traceService);
  traceService.emit = input => {
    captured.push(input);
    return {
      ...input,
      eventId: `evt-${captured.length}`,
      timestamp: new Date().toISOString(),
      schemaVersion: '1.0.0',
    };
  };
});

afterEach(() => {
  traceService.emit = originalEmit;
});

describe('swarm trace adapter contract', () => {
  it('GATE 1: onSwarmDispatch returns a correlationId', () => {
    const correlationId = onSwarmDispatch({
      taskId: 'task-1',
      countyId: 'benton',
      agentId: 'agent-1',
      suite: 'os',
    });

    assert.equal(typeof correlationId, 'string');
    assert.ok(correlationId.length > 0);
  });

  it('GATE 2: onSwarmDispatch emits tool_invoked', () => {
    onSwarmDispatch({
      taskId: 'task-2',
      countyId: 'benton',
      agentId: 'agent-2',
      suite: 'os',
    });

    assert.equal(captured.length, 1);
    assert.equal(captured[0].type, 'tool_invoked');
    assert.equal(captured[0].context.countyId, 'benton');
  });

  it('GATE 3: onSwarmComplete emits tool_completed', () => {
    onSwarmComplete({
      taskId: 'task-3',
      countyId: 'benton',
      agentId: 'agent-3',
      correlationId: 'corr-3',
      suite: 'os',
    });

    assert.equal(captured.length, 1);
    assert.equal(captured[0].type, 'tool_completed');
    assert.equal(captured[0].correlationId, 'corr-3');
  });

  it('GATE 4: onSwarmFail emits tool_failed', () => {
    onSwarmFail({
      taskId: 'task-4',
      countyId: 'benton',
      agentId: 'agent-4',
      correlationId: 'corr-4',
      reason: 'deadline_exceeded',
      suite: 'os',
    });

    assert.equal(captured.length, 1);
    assert.equal(captured[0].type, 'tool_failed');
    assert.equal(captured[0].errorCode, 'SWARM_TASK_FAILED');
  });

  it('GATE 5: correlationId is shared dispatch -> complete', () => {
    const correlationId = onSwarmDispatch({
      taskId: 'task-5',
      countyId: 'benton',
      agentId: 'agent-5',
      suite: 'os',
    });

    onSwarmComplete({
      taskId: 'task-5',
      countyId: 'benton',
      agentId: 'agent-5',
      correlationId,
      suite: 'os',
    });

    assert.equal(captured.length, 2);
    assert.equal(captured[0].correlationId, captured[1].correlationId);
  });

  it('GATE 6: summaries are PII-safe', () => {
    onSwarmDispatch({
      taskId: 'task-6',
      countyId: 'benton',
      agentId: 'agent-6',
      suite: 'os',
    });

    onSwarmFail({
      taskId: 'task-6',
      countyId: 'benton',
      agentId: 'agent-6',
      correlationId: 'corr-6',
      reason: 'timeout',
      suite: 'os',
    });

    const serialized = JSON.stringify(captured);
    assert.equal(/\b\d{3}-\d{2}-\d{4}\b/.test(serialized), false);
    assert.equal(/\b\d{3}[-.]\d{3}[-.]\d{4}\b/.test(serialized), false);
    assert.equal(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized), false);
  });

  it('SECURITY: countyId is required', () => {
    assert.throws(() => {
      onSwarmDispatch({
        taskId: 'task-7',
        countyId: '   ',
        agentId: 'agent-7',
        suite: 'os',
      });
    }, /countyId is required/);
  });
});
