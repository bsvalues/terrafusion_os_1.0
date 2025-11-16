/**
 * TerraFusion Transparency Bus
 *
 * Central pub/sub system for agent actions.
 * All TerraFusion services publish their activities here.
 * UI components and transparency engine subscribe to updates.
 *
 * Current implementation: In-memory (Node.js process)
 * Future: Upgrade to Redis Pub/Sub or WebSocket for cross-process
 */

import { AgentAction } from './types';

/**
 * Handler function for agent actions
 */
export type AgentActionHandler = (action: AgentAction) => void;

/**
 * Unsubscribe function returned by subscribe()
 */
export type UnsubscribeFunction = () => void;

/**
 * TransparencyBus interface
 *
 * Provides pub/sub functionality for agent actions.
 */
export interface TransparencyBus {
  /**
   * Publish an agent action to all subscribers
   *
   * @param action - The agent action to publish
   */
  publish(action: AgentAction): void;

  /**
   * Subscribe to agent actions
   *
   * @param handler - Function called for each published action
   * @returns Unsubscribe function
   */
  subscribe(handler: AgentActionHandler): UnsubscribeFunction;

  /**
   * Get current number of subscribers (for diagnostics)
   */
  getSubscriberCount(): number;

  /**
   * Get total actions published (for diagnostics)
   */
  getTotalActionsPublished(): number;
}

/**
 * In-memory implementation of TransparencyBus
 *
 * Fast, simple, works in single-process environments (TDC CLI, Portal backend).
 * Does NOT work across multiple processes (use Redis for that).
 */
export class InMemoryTransparencyBus implements TransparencyBus {
  private handlers: AgentActionHandler[] = [];
  private totalPublished: number = 0;

  /**
   * Publish action to all subscribers
   */
  publish(action: AgentAction): void {
    this.totalPublished++;

    // Call each handler, catching errors to prevent one bad subscriber
    // from breaking others
    for (const handler of this.handlers) {
      try {
        handler(action);
      } catch (error) {
        console.error('[TransparencyBus] Handler error:', error);
        console.error('[TransparencyBus] Failed action:', action);
      }
    }
  }

  /**
   * Subscribe to action stream
   */
  subscribe(handler: AgentActionHandler): UnsubscribeFunction {
    this.handlers.push(handler);

    // Return unsubscribe function
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  /**
   * Get subscriber count
   */
  getSubscriberCount(): number {
    return this.handlers.length;
  }

  /**
   * Get total actions published since bus creation
   */
  getTotalActionsPublished(): number {
    return this.totalPublished;
  }

  /**
   * Clear all subscribers (useful for testing)
   */
  clear(): void {
    this.handlers = [];
    this.totalPublished = 0;
  }
}

/**
 * Default global transparency bus instance
 *
 * Use this for simple single-process scenarios.
 * For multi-process, create your own bus instance.
 */
export const DefaultTransparencyBus = new InMemoryTransparencyBus();

/**
 * Helper: Publish a simple action
 *
 * Convenience function for common publish scenarios.
 */
export function publishAction(
  bus: TransparencyBus,
  params: {
    agentId: string;
    agentRole: string;
    workspace: string;
    service: string;
    phase: string;
    summary: string;
    details?: Record<string, unknown>;
  }
): void {
  bus.publish({
    timestamp: new Date().toISOString(),
    agentId: params.agentId,
    agentRole: params.agentRole,
    workspace: params.workspace,
    service: params.service as any,
    phase: params.phase as any,
    summary: params.summary,
    details: params.details,
  });
}
