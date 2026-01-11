/**
 * Event System Core Implementation
 * 
 * This file implements the core event system functionality including:
 * - Event creation and validation
 * - Event publishing and subscription
 * - In-memory event store
 * - Event processing
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  Event,
  EventCreateOptions,
  EventHandler,
  EventPriority,
  EventType,
  EventStore,
  Unsubscribe,
  EventMiddleware,
  EventQueryOptions
} from './types';

// Re-export types for convenience
export { EventType, EventPriority } from './types';

// In-memory event store implementation
class InMemoryEventStore implements EventStore {
  private events: Map<string, Event> = new Map();
  
  add(event: Event): void {
    this.events.set(event.id, event);
  }
  
  get(id: string): Event | undefined {
    return this.events.get(id);
  }
  
  getByType(type: EventType): Event[] {
    return Array.from(this.events.values())
      .filter(event => event.type === type);
  }
  
  getAll(): Event[] {
    return Array.from(this.events.values());
  }
  
  clear(): void {
    this.events.clear();
  }
  
  size(): number {
    return this.events.size;
  }
}

// Create singleton instances
const eventStore = new InMemoryEventStore();
const eventEmitter = new Map<EventType | null, Set<EventHandler>>();
const middlewares: EventMiddleware[] = [];

/**
 * Get a reference to the event store (for testing and debugging)
 */
export function getEventStore(): EventStore {
  return eventStore;
}

/**
 * Reset the event system (for testing)
 */
export function resetEventSystem(): void {
  eventStore.clear();
  eventEmitter.clear();
  middlewares.length = 0;
}

/**
 * Create a new event with the provided options
 */
export function createEvent<T = any>(options: EventCreateOptions<T>): Event<T> {
  // Validate required fields
  if (!options.type) {
    throw new Error('Event type is required');
  }
  
  if (options.type && !Object.values(EventType).includes(options.type as any)) {
    throw new Error(`Invalid event type: ${options.type}`);
  }
  
  if (options.payload === undefined) {
    throw new Error('Event payload is required');
  }
  
  // Create the event
  const event: Event<T> = {
    id: uuidv4(),
    type: options.type,
    timestamp: new Date().toISOString(),
    priority: options.priority || EventPriority.NORMAL,
    payload: options.payload,
    metadata: options.metadata || {},
    correlationId: options.correlationId,
    causationId: options.causationId
  };
  
  return event;
}

/**
 * Validate an event against its schema
 */
export function validateEvent(event: Event): boolean {
  // Basic validation
  if (!event.id || !event.type || !event.timestamp || !event.priority) {
    return false;
  }
  
  // Type validation
  if (!Object.values(EventType).includes(event.type as any)) {
    return false;
  }
  
  // Priority validation
  if (!Object.values(EventPriority).includes(event.priority as any)) {
    return false;
  }
  
  return true;
}

/**
 * Register middleware to process events before they're published
 */
export function registerEventMiddleware(middleware: EventMiddleware): void {
  middlewares.push(middleware);
}

/**
 * Process an event through all registered middleware
 */
function processMiddleware(event: Event): Event | null {
  let processedEvent: Event | null = event;
  
  for (const middleware of middlewares) {
    if (!processedEvent) return null;
    processedEvent = middleware(processedEvent);
  }
  
  return processedEvent;
}

/**
 * Get all handlers for an event type, including universal handlers
 */
function getHandlersForType(type: EventType): EventHandler[] {
  const handlers: EventHandler[] = [];
  
  // Add type-specific handlers
  const typeHandlers = eventEmitter.get(type);
  if (typeHandlers) {
    Array.from(typeHandlers).forEach(handler => handlers.push(handler));
  }
  
  // Add universal handlers (null type)
  const universalHandlers = eventEmitter.get(null);
  if (universalHandlers) {
    Array.from(universalHandlers).forEach(handler => handlers.push(handler));
  }
  
  return handlers;
}

/**
 * Publish an event to all subscribers
 */
export function publishEvent<T = any>(event: Event<T>): boolean {
  // Validate the event
  if (!validateEvent(event)) {
    console.error('Invalid event:', event);
    return false;
  }
  
  // Process through middleware
  const processedEvent = processMiddleware(event);
  if (!processedEvent) {
    return false; // Event was filtered out by middleware
  }
  
  // Store the event
  eventStore.add(processedEvent);
  
  // Get all handlers for this event type
  const handlers = getHandlersForType(processedEvent.type);
  
  if (handlers.length === 0) {
    return true; // No handlers, but still successful
  }
  
  // Sort handlers by priority
  const sortedEvents = [processedEvent].sort((a, b) => {
    const priorityOrder = {
      [EventPriority.CRITICAL]: 0,
      [EventPriority.HIGH]: 1,
      [EventPriority.NORMAL]: 2,
      [EventPriority.LOW]: 3
    };
    
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Call all handlers with the event
  try {
    for (const e of sortedEvents) {
      for (const handler of handlers) {
        handler(e);
      }
    }
    return true;
  } catch (error) {
    console.error('Error publishing event:', error);
    return false;
  }
}

/**
 * Subscribe to events of a specific type, or all events if type is null
 */
export function subscribeToEvent<T = any>(
  type: EventType | null,
  handler: EventHandler<T>
): Unsubscribe {
  // Initialize set if not exists
  if (!eventEmitter.has(type)) {
    eventEmitter.set(type, new Set<EventHandler>());
  }
  
  // Add handler to the set
  const handlers = eventEmitter.get(type)!;
  handlers.add(handler as EventHandler);
  
  // Return unsubscribe function
  return () => {
    const handlers = eventEmitter.get(type);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        eventEmitter.delete(type);
      }
    }
  };
}

/**
 * Query events from the store with filtering options
 */
export function queryEvents(options: EventQueryOptions = {}): Event[] {
  let events = eventStore.getAll();
  
  // Filter by type
  if (options.type) {
    events = events.filter(event => event.type === options.type);
  }
  
  // Filter by time range
  if (options.startTime) {
    events = events.filter(
      event => new Date(event.timestamp) >= new Date(options.startTime!)
    );
  }
  
  if (options.endTime) {
    events = events.filter(
      event => new Date(event.timestamp) <= new Date(options.endTime!)
    );
  }
  
  // Filter by correlation ID
  if (options.correlationId) {
    events = events.filter(
      event => event.correlationId === options.correlationId
    );
  }
  
  // Apply limit and offset
  if (options.offset !== undefined) {
    events = events.slice(options.offset);
  }
  
  if (options.limit !== undefined) {
    events = events.slice(0, options.limit);
  }
  
  return events;
}

/**
 * Create and publish an event in one step
 */
export function emitEvent<T = any>(options: EventCreateOptions<T>): Event<T> {
  const event = createEvent(options);
  publishEvent(event);
  return event;
}

/**
 * Create a child event that maintains correlation with a parent event
 */
export function createChildEvent<T = any>(
  parentEvent: Event,
  options: Omit<EventCreateOptions<T>, 'correlationId'>
): Event<T> {
  return createEvent({
    ...options,
    correlationId: parentEvent.correlationId || parentEvent.id,
    causationId: parentEvent.id
  });
}