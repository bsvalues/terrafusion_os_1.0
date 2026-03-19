import { randomUUID } from 'crypto';
import { traceService } from '../trace/TraceService.js';
import type { SwarmEventPayload } from '../types/swarm.js';

type SwarmFailurePayload = SwarmEventPayload & { reason: string };

function requireCounty(countyId: string): void {
  if (typeof countyId !== 'string' || countyId.trim().length === 0) {
    throw new Error('swarmTraceAdapter: countyId is required');
  }
}

function buildToolContext(payload: SwarmEventPayload) {
  const countyId = payload.countyId.trim();
  return {
    countyId,
    userId: `swarm:${payload.agentId}`,
    roles: ['system'],
    mode: 'pilot' as const,
  };
}

function buildToolId(kind: 'dispatch' | 'complete' | 'fail', payload: SwarmEventPayload): string {
  const suite = payload.suite ?? 'os';
  return `swarm.${suite}.${kind}`;
}

/**
 * Emits a canonical invoke event for swarm dispatch and returns correlationId.
 */
export function onSwarmDispatch(payload: SwarmEventPayload): string {
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

/**
 * Emits a canonical completion event for a swarm task.
 */
export function onSwarmComplete(payload: SwarmEventPayload): void {
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

/**
 * Emits a canonical failure event for a swarm task.
 */
export function onSwarmFail(payload: SwarmFailurePayload): void {
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
