import type {
  AgentEventsResponse,
  AgentSystemStatusResponse,
  AgentEvent,
  AgentExecutionMode,
  AgentEventLevel,
} from './agentTypes';

export type AgentStatusProbeResult = {
  ok: boolean;
  status: AgentSystemStatusResponse | null;
  warnings: string[];
};

export type AgentEventsProbeResult = {
  ok: boolean;
  response: AgentEventsResponse | null;
  warnings: string[];
};

const EXECUTION_MODES = new Set<AgentExecutionMode>(['Autonomous', 'HumanInLoop', 'Passive']);
const EVENT_LEVELS = new Set<AgentEventLevel>(['Info', 'Thinking', 'Action', 'Warn', 'Error']);

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseStatus(payload: any): AgentSystemStatusResponse | null {
  if (!payload || typeof payload !== 'object') return null;

  const executionMode = payload.executionMode as AgentExecutionMode;
  if (!EXECUTION_MODES.has(executionMode)) return null;

  const totalAgents = asNumber(payload.totalAgents);
  const activeAgents = asNumber(payload.activeAgents);
  const queueDepth = asNumber(payload.queueDepth);
  const uptimeSeconds = asNumber(payload.uptimeSeconds);

  if (
    totalAgents === null ||
    activeAgents === null ||
    queueDepth === null ||
    uptimeSeconds === null
  ) {
    return null;
  }

  const lastActivityUtc =
    typeof payload.lastActivityUtc === 'string' ? payload.lastActivityUtc : null;

  const provider = typeof payload.provider === 'string' ? payload.provider : 'unknown';
  const warnings = Array.isArray(payload.warnings)
    ? payload.warnings.filter((item: unknown) => typeof item === 'string')
    : [];

  return {
    executionMode,
    totalAgents,
    activeAgents,
    queueDepth,
    lastActivityUtc,
    uptimeSeconds,
    provider,
    warnings,
  };
}

function parseEvents(payload: any): AgentEventsResponse | null {
  if (!payload || typeof payload !== 'object') return null;
  if (!Array.isArray(payload.events)) return null;

  const events: AgentEvent[] = payload.events
    .map((event: any) => {
      if (!event || typeof event !== 'object') return null;
      if (typeof event.id !== 'string') return null;
      if (typeof event.tsUtc !== 'string') return null;
      if (typeof event.agent !== 'string') return null;
      if (typeof event.topic !== 'string') return null;
      if (typeof event.message !== 'string') return null;

      const level = event.level as AgentEventLevel;
      if (!EVENT_LEVELS.has(level)) return null;

      const parsed: AgentEvent = {
        id: event.id,
        tsUtc: event.tsUtc,
        level,
        agent: event.agent,
        topic: event.topic,
        message: event.message,
      };

      if (typeof event.correlationId === 'string') parsed.correlationId = event.correlationId;
      if (event.data && typeof event.data === 'object') {
        parsed.data = event.data as Record<string, unknown>;
      }

      return parsed;
    })
    .filter((event: AgentEvent | null): event is AgentEvent => Boolean(event));

  const nextCursor =
    typeof payload.nextCursor === 'string' ? payload.nextCursor : payload.nextCursor ?? null;

  return { events, nextCursor };
}

export async function probeAgentStatus(endpoint: string, timeoutMs = 1500): Promise<AgentStatusProbeResult> {
  const warnings: string[] = [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      warnings.push(`Agent status returned ${response.status}`);
      return { ok: false, status: null, warnings };
    }

    const data = await response.json();
    const status = parseStatus(data);
    if (!status) {
      warnings.push('Agent status payload invalid');
      return { ok: false, status: null, warnings };
    }

    if (status.activeAgents > status.totalAgents) {
      warnings.push(
        `Invariant violation: activeAgents (${status.activeAgents}) exceeds totalAgents (${status.totalAgents})`
      );
    }

    if (status.queueDepth < 0) {
      warnings.push('Invariant violation: queueDepth cannot be negative');
    }

    return { ok: true, status, warnings };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    warnings.push(`Agent status probe failed: ${reason}`);
    return { ok: false, status: null, warnings };
  } finally {
    clearTimeout(timeout);
  }
}

export async function probeAgentEvents(
  endpoint: string,
  cursor: string | null,
  limit = 100,
  timeoutMs = 1500
): Promise<AgentEventsProbeResult> {
  const warnings: string[] = [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set('limit', String(limit));
    if (cursor) url.searchParams.set('after', cursor);

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      warnings.push(`Agent events returned ${response.status}`);
      return { ok: false, response: null, warnings };
    }

    const data = await response.json();
    const parsed = parseEvents(data);
    if (!parsed) {
      warnings.push('Agent events payload invalid');
      return { ok: false, response: null, warnings };
    }

    // Validate ascending timestamps if any events are present
    for (let i = 1; i < parsed.events.length; i += 1) {
      const prev = Date.parse(parsed.events[i - 1].tsUtc);
      const next = Date.parse(parsed.events[i].tsUtc);
      if (Number.isNaN(prev) || Number.isNaN(next)) continue;
      if (next < prev) {
        warnings.push('Event ordering violation: events are not ascending by tsUtc');
        break;
      }
    }

    return { ok: true, response: parsed, warnings };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    warnings.push(`Agent events probe failed: ${reason}`);
    return { ok: false, response: null, warnings };
  } finally {
    clearTimeout(timeout);
  }
}
