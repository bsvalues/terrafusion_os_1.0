/**
 * Event Bus Implementation for Model Content Protocol
 * 
 * This system provides a centralized event bus for publishing and subscribing to events
 * across the application, following the publish-subscribe pattern.
 */

/**
 * Type definitions for the event system
 */
export type EventType = string;

export interface Event<T = any> {
  type: EventType;
  data: T;
  timestamp: string;
}

export type EventCallback<T = any> = (event: Event<T>) => void;
export type EventFilter<T = any> = (event: Event<T>) => boolean;

export interface EventSubscription {
  id: string;
  type: EventType;
  callback: EventCallback;
  filter?: EventFilter;
}

export interface EventBusOptions {
  persistEvents?: boolean;
  maxPersistedEvents?: number;
  remoteSync?: boolean;
  apiEndpoint?: string;
}

/**
 * EventBus class - Core implementation of the event system
 */
export class EventBus {
  private subscribers: EventSubscription[] = [];
  private registeredEventTypes: Set<EventType> = new Set();
  private eventHistory: Event[] = [];
  private options: EventBusOptions;

  constructor(options: EventBusOptions = {}) {
    this.options = {
      persistEvents: false,
      maxPersistedEvents: 100,
      remoteSync: false,
      ...options
    };
  }

  /**
   * Register an event type
   * @param eventType The type of event to register
   */
  registerEventType(eventType: EventType): void {
    this.registeredEventTypes.add(eventType);
  }

  /**
   * Get all registered event types
   * @returns Array of registered event types
   */
  getRegisteredEvents(): EventType[] {
    return Array.from(this.registeredEventTypes);
  }

  /**
   * Subscribe to an event
   * @param type The event type to subscribe to
   * @param callback Function to call when event occurs
   * @param filter Optional filter function to determine if the callback should be called
   * @returns Subscription object that can be used to unsubscribe
   */
  subscribe<T = any>(
    type: EventType,
    callback: EventCallback<T>,
    filter?: EventFilter<T>
  ): EventSubscription {
    const subscription: EventSubscription = {
      id: generateId(),
      type,
      callback,
      filter
    };

    this.subscribers.push(subscription);
    return subscription;
  }

  /**
   * Unsubscribe from an event
   * @param subscription The subscription object returned from subscribe
   */
  unsubscribe(subscription: EventSubscription): void {
    this.subscribers = this.subscribers.filter(s => s.id !== subscription.id);
  }

  /**
   * Publish an event
   * @param type The event type
   * @param data The event data
   */
  publish<T = any>(type: EventType, data: T): void {
    const event: Event<T> = {
      type,
      data,
      timestamp: new Date().toISOString()
    };

    // Register the event type if it's new
    if (!this.registeredEventTypes.has(type)) {
      this.registerEventType(type);
    }

    // Store event if persistence is enabled
    if (this.options.persistEvents) {
      this.persistEvent(event);
    }

    // Notify subscribers
    this.notifySubscribers(event);

    // Sync with remote if enabled
    if (this.options.remoteSync && this.options.apiEndpoint) {
      this.syncWithRemote(event);
    }
  }

  /**
   * Get persisted events
   * @param eventType Optional event type to filter by
   * @returns Array of persisted events
   */
  getPersistedEvents<T = any>(eventType?: EventType): Event<T>[] {
    if (!eventType) {
      return this.eventHistory as Event<T>[];
    }
    
    return this.eventHistory.filter(e => e.type === eventType) as Event<T>[];
  }

  /**
   * Clear all persisted events
   */
  clearPersistedEvents(): void {
    this.eventHistory = [];
  }

  /**
   * Connect the event bus to a WebSocket
   * @param socket WebSocket connection
   */
  connectWebSocket(socket: WebSocket): void {
    socket.addEventListener('message', (event) => {
      try {
        const eventData = JSON.parse(event.data);
        if (eventData && eventData.type) {
          // Don't persist events received from WebSocket to avoid duplication
          this.notifySubscribers(eventData);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
  }

  /**
   * Private: Persist an event to history
   */
  private persistEvent<T>(event: Event<T>): void {
    this.eventHistory.unshift(event);
    
    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.options.maxPersistedEvents!) {
      this.eventHistory = this.eventHistory.slice(0, this.options.maxPersistedEvents!);
    }
  }

  /**
   * Private: Notify subscribers of an event
   */
  private notifySubscribers<T>(event: Event<T>): void {
    const relevantSubscribers = this.subscribers.filter(
      s => s.type === event.type
    );

    for (const subscriber of relevantSubscribers) {
      try {
        // Apply filter if one exists
        if (!subscriber.filter || subscriber.filter(event)) {
          subscriber.callback(event);
        }
      } catch (error) {
        console.error(`Error in event subscriber for ${event.type}:`, error);
      }
    }
  }

  /**
   * Private: Sync event with remote API
   */
  private syncWithRemote<T>(event: Event<T>): void {
    if (!this.options.apiEndpoint) return;

    fetch(this.options.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }).catch(error => {
      console.error('Error syncing event with remote:', error);
    });
  }
}

/**
 * Generate a unique ID for subscriptions
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Global EventBus instance for application-wide use
 */
export const globalEventBus = new EventBus({ persistEvents: true });