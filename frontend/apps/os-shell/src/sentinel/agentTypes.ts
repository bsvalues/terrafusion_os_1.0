export type AgentExecutionMode = 'Autonomous' | 'HumanInLoop' | 'Passive';
export type AgentEventLevel = 'Info' | 'Thinking' | 'Action' | 'Warn' | 'Error';

export type AgentSystemStatusResponse = {
  executionMode: AgentExecutionMode;
  totalAgents: number;
  activeAgents: number;
  queueDepth: number;
  lastActivityUtc: string | null;
  uptimeSeconds: number;
  provider: string;
  warnings: string[];
};

export type AgentEvent = {
  seq: number;
  id: string;
  tsUtc: string;
  level: AgentEventLevel;
  agent: string;
  topic: string;
  message: string;
  correlationId?: string;
  data?: Record<string, unknown>;
};

export type AgentEventsResponse = {
  events: AgentEvent[];
  nextCursor: string | null;
  /**
   * Sequence number to use as 'after' in next request.
   * - If events returned: equals last event's seq
   * - If no events: equals the 'after' param (or 0 if none)
   * Always present; use this for cursor-driven polling.
   */
  nextAfter: number;
  /**
   * Oldest available sequence in the ring buffer.
   * If client cursor < droppedBeforeSeq, they missed events.
   * Always present: 0 means buffer is empty.
   */
  droppedBeforeSeq: number;
};
