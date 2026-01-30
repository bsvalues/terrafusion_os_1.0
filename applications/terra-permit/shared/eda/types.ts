/**
 * Event-Driven Architecture (EDA) Types
 * 
 * This file defines the core types for the event system, including event types,
 * priorities, and the structure of events.
 */

/**
 * Enum for event types in the system
 */
export enum EventType {
  // System events
  SYSTEM_STATUS = 'SYSTEM_STATUS',
  LOG = 'LOG',
  ALERT = 'ALERT',
  ERROR = 'ERROR',
  
  // Agent events
  AGENT_MESSAGE = 'AGENT_MESSAGE',
  AGENT_ACTIVATION = 'AGENT_ACTIVATION',
  AGENT_STATUS_CHANGE = 'AGENT_STATUS_CHANGE',
  AGENT_ERROR = 'AGENT_ERROR',
  
  // Circuit breaker events
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
  CIRCUIT_BREAKER_CLOSE = 'CIRCUIT_BREAKER_CLOSE',
  CIRCUIT_BREAKER_HALF_OPEN = 'CIRCUIT_BREAKER_HALF_OPEN',
  
  // MCP events
  MCP_MESSAGE = 'MCP_MESSAGE',
  MCP_WORKFLOW_START = 'MCP_WORKFLOW_START',
  MCP_WORKFLOW_COMPLETE = 'MCP_WORKFLOW_COMPLETE',
  MCP_WORKFLOW_ERROR = 'MCP_WORKFLOW_ERROR',
  
  // User interaction events
  USER_ACTION = 'USER_ACTION',
  NOTIFICATION = 'NOTIFICATION',
  
  // Data events
  DATA_CHANGE = 'DATA_CHANGE',
  UPLOAD_COMPLETE = 'UPLOAD_COMPLETE',
  PERMIT_PROCESSED = 'PERMIT_PROCESSED',
  
  // Custom events
  CUSTOM = 'CUSTOM'
}

/**
 * Enum for event priorities
 */
export enum EventPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Base event interface
 */
export interface Event<T = any> {
  id: string;
  type: EventType;
  timestamp: string;
  priority: EventPriority;
  payload: T;
  metadata?: Record<string, any>;
  correlationId?: string;
  causationId?: string;
}

/**
 * Event creation options
 */
export interface EventCreateOptions<T = any> {
  type: EventType;
  payload: T;
  priority?: EventPriority;
  metadata?: Record<string, any>;
  correlationId?: string;
  causationId?: string;
}

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (event: Event<T>) => void | Promise<void>;

/**
 * Subscription function return type - function to unsubscribe
 */
export type Unsubscribe = () => void;

/**
 * Event store interface
 */
export interface EventStore {
  add(event: Event): void;
  get(id: string): Event | undefined;
  getByType(type: EventType): Event[];
  getAll(): Event[];
  clear(): void;
  size(): number;
}

/**
 * Event query options
 */
export interface EventQueryOptions {
  type?: EventType;
  startTime?: string;
  endTime?: string;
  correlationId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Event middleware function type
 */
export type EventMiddleware = (event: Event) => Event | null;