import type { Suite } from './index.js';

/**
 * Canonical payload used by swarm-to-trace bridge functions.
 * Kept minimal and county-scoped for multi-tenant safety.
 */
export interface SwarmEventPayload {
  taskId: string;
  countyId: string;
  correlationId?: string;
  agentId: string;
  suite?: Suite;
}
