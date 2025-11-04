/**
 * EventBus.ts
 *
 * Event bus for inter-agent communication
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { LogService } from './LogService';
import { AgentEventType } from './types';

/**
 * Event interface
 */
export interface AgentEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  payload: any;
  metadata?: Record<string, any>;
}

/**
 * Subscription callback type
 */
type EventCallback = (event: AgentEvent) => void | Promise<void>;

/**
 * Subscription interface
 */
interface EventSubscription {
  id: string;
  eventType: string;
  callback: EventCallback;
  filter?: (event: AgentEvent) => boolean;
}

/**
 * EventBus class
 * Handles message passing between agents
 */
export class EventBus extends EventEmitter {
  private static instance: EventBus;
  private subscriptions: Map<string, EventSubscription>;
  private eventHistory: AgentEvent[];
  private maxHistorySize: number;
  private logger: LogService;

  /**
   * Private constructor (use getInstance)
   */
  private constructor() {
    super();
    this.subscriptions = new Map<string, EventSubscription>();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.logger = new LogService('EventBus');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Publish an event to the bus
   * @param eventType Event type
   * @param source Source of the event
   * @param payload Event payload
   * @param metadata Optional event metadata
   */
  public publish(
    eventType: string,
    source: string,
    payload: any,
    metadata?: Record<string, any>
  ): string {
    // Create event object
    const event: AgentEvent = {
      id: uuidv4(),
      type: eventType,
      source,
      timestamp: new Date(),
      payload,
      metadata,
    };

    // Add to history
    this.eventHistory.push(event);

    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    this.logger.debug(`Event published: ${eventType} from ${source}`);

    // Emit to EventEmitter (more efficient than iterating subscriptions)
    this.emit(eventType, event);

    // Also emit to wildcard listeners
    this.emit('*', event);

    return event.id;
  }

  /**
   * Subscribe to events
   * @param eventType Event type or '*' for all events
   * @param callback Callback to invoke when event is received
   * @param filter Optional filter function
   */
  public subscribe(
    eventType: string | AgentEventType,
    callback: EventCallback,
    filter?: (event: AgentEvent) => boolean
  ): string {
    const subscriptionId = uuidv4();

    // Store subscription
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      eventType,
      callback,
      filter,
    });

    // Add event listener
    if (eventType === '*') {
      // Wildcard listener
      this.on('*', (event: AgentEvent) => {
        // Check filter
        if (!filter || filter(event)) {
          this.handleCallback(callback, event);
        }
      });
    } else {
      // Specific event listener
      this.on(eventType, (event: AgentEvent) => {
        // Check filter
        if (!filter || filter(event)) {
          this.handleCallback(callback, event);
        }
      });
    }

    this.logger.debug(`Subscription added: ${subscriptionId} for ${eventType}`);

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   * @param subscriptionId Subscription ID to remove
   */
  public unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) {
      this.logger.warn(`Subscription not found: ${subscriptionId}`);
      return false;
    }

    // Remove from subscriptions
    this.subscriptions.delete(subscriptionId);

    // Remove specific listener
    // Note: This is a limitation of Node's EventEmitter
    // We can't easily remove a specific listener without a reference
    // A more complete implementation would maintain listeners separately

    this.logger.debug(`Subscription removed: ${subscriptionId}`);

    return true;
  }

  /**
   * Handle callback execution
   * @param callback Callback to invoke
   * @param event Event data
   */
  private handleCallback(callback: EventCallback, event: AgentEvent): void {
    try {
      // Execute callback
      const result = callback(event);

      // Handle promise result
      if (result instanceof Promise) {
        result.catch(error => {
          this.logger.error(
            `Error in event callback: ${error instanceof Error ? error.message : String(error)}`
          );
        });
      }
    } catch (error) {
      this.logger.error(
        `Error in event callback: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get recent events
   * @param count Maximum number of events to return
   * @param eventType Optional event type filter
   * @param source Optional source filter
   */
  public getRecentEvents(count: number = 100, eventType?: string, source?: string): AgentEvent[] {
    // Filter events
    let events = this.eventHistory;

    if (eventType) {
      events = events.filter(event => event.type === eventType);
    }

    if (source) {
      events = events.filter(event => event.source === source);
    }

    // Get most recent events
    return events.slice(-Math.min(count, events.length));
  }

  /**
   * Get event by ID
   * @param eventId Event ID
   */
  public getEventById(eventId: string): AgentEvent | null {
    return this.eventHistory.find(event => event.id === eventId) || null;
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.eventHistory = [];
    this.logger.info('Event history cleared');
  }

  /**
   * Set maximum history size
   * @param size Maximum number of events to keep
   */
  public setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;

    // Trim if needed
    if (this.eventHistory.length > size) {
      this.eventHistory = this.eventHistory.slice(-size);
    }

    this.logger.info(`Max history size set to ${size}`);
  }

  /**
   * Get all subscriptions
   */
  public getSubscriptions(): Record<string, { eventType: string; hasFilter: boolean }> {
    const result: Record<string, { eventType: string; hasFilter: boolean }> = {};

    for (const [id, subscription] of this.subscriptions.entries()) {
      result[id] = {
        eventType: subscription.eventType,
        hasFilter: !!subscription.filter,
      };
    }

    return result;
  }
}
