/**
 * WebSocket and Real-Time Connection Utilities for TerraFusion OS
 * 
 * Provides robust WebSocket connection management with automatic reconnection,
 * message queuing, state management, and event handling for real-time features.
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection state management (connecting, connected, disconnected, error)
 * - Message queuing when disconnected
 * - Event subscription/unsubscription system
 * - Heartbeat/ping-pong for connection health
 * - Room/group management for collaborative features
 * - Configurable retry policies
 * 
 * @module utils/websocket
 */

// =============================================================================
// Types
// =============================================================================

/**
 * WebSocket connection states
 */
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * Connection configuration options
 */
export interface WebSocketConfig {
  /** WebSocket URL */
  url: string;
  /** Protocols for WebSocket connection */
  protocols?: string | string[];
  /** Auto-connect on instantiation */
  autoConnect?: boolean;
  /** Auto-reconnect on connection loss */
  autoReconnect?: boolean;
  /** Maximum reconnection attempts (0 = infinite) */
  maxReconnectAttempts?: number;
  /** Initial reconnection delay in milliseconds */
  reconnectDelay?: number;
  /** Maximum reconnection delay in milliseconds */
  maxReconnectDelay?: number;
  /** Heartbeat interval in milliseconds (0 = disabled) */
  heartbeatInterval?: number;
  /** Heartbeat timeout in milliseconds */
  heartbeatTimeout?: number;
  /** Message queue size limit */
  messageQueueLimit?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Message structure for WebSocket communication
 */
export interface WebSocketMessage<T = any> {
  /** Message type/event name */
  type: string;
  /** Message payload */
  data?: T;
  /** Message timestamp */
  timestamp?: number;
  /** Message ID for tracking */
  id?: string;
}

/**
 * Event listener function type
 */
export type WebSocketEventListener<T = any> = (data: T) => void;

/**
 * Connection event callback type
 */
export type ConnectionEventCallback = (event?: any) => void;

/**
 * Reconnection context
 */
export interface ReconnectionContext {
  /** Number of previous reconnection attempts */
  attemptNumber: number;
  /** Time elapsed since first attempt */
  elapsedTime: number;
  /** Last error that caused disconnection */
  lastError?: Error;
}

// =============================================================================
// WebSocket Manager Class
// =============================================================================

/**
 * WebSocket connection manager with automatic reconnection and message queuing
 * 
 * @example
 * const ws = new WebSocketManager({
 *   url: 'ws://localhost:3000/ws',
 *   autoConnect: true,
 *   autoReconnect: true,
 *   heartbeatInterval: 30000
 * });
 * 
 * ws.on('propertyUpdate', (data) => {
 *   console.log('Property updated:', data);
 * });
 * 
 * ws.send({ type: 'subscribe', data: { channel: 'properties' } });
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempt: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private eventListeners = new Map<string, Set<WebSocketEventListener>>();
  private connectionEventListeners = new Map<string, Set<ConnectionEventCallback>>();
  private lastHeartbeatReceived: number = 0;
  private reconnectionStartTime: number = 0;
  
  constructor(config: WebSocketConfig) {
    // Merge with defaults
    this.config = {
      url: config.url,
      protocols: config.protocols || undefined,
      autoConnect: config.autoConnect ?? true,
      autoReconnect: config.autoReconnect ?? true,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 0, // 0 = infinite
      reconnectDelay: config.reconnectDelay ?? 1000,
      maxReconnectDelay: config.maxReconnectDelay ?? 30000,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      heartbeatTimeout: config.heartbeatTimeout ?? 5000,
      messageQueueLimit: config.messageQueueLimit ?? 100,
      debug: config.debug ?? false
    } as Required<WebSocketConfig>;

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------

  /**
   * Establishes WebSocket connection
   */
  public connect(): void {
    if (this.ws && (this.state === ConnectionState.CONNECTED || this.state === ConnectionState.CONNECTING)) {
      this.log('Already connected or connecting');
      return;
    }

    this.setState(ConnectionState.CONNECTING);
    this.log(`Connecting to ${this.config.url}`);

    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);
      this.setupEventHandlers();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Disconnects WebSocket connection
   * @param code - Close code (default: 1000 = normal closure)
   * @param reason - Close reason
   */
  public disconnect(code: number = 1000, reason: string = 'Normal closure'): void {
    this.log(`Disconnecting: ${reason}`);
    
    // Cancel reconnection attempts
    this.cancelReconnection();
    
    // Clear heartbeat
    this.stopHeartbeat();
    
    // Close connection
    if (this.ws) {
      try {
        this.ws.close(code, reason);
      } catch (error) {
        this.log('Error closing WebSocket:', error);
      }
      this.ws = null;
    }
    
    this.setState(ConnectionState.DISCONNECTED);
  }

  /**
   * Gets current connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Checks if connection is established
   */
  public isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED && this.ws?.readyState === WebSocket.OPEN;
  }

  // ---------------------------------------------------------------------------
  // Message Handling
  // ---------------------------------------------------------------------------

  /**
   * Sends a message through the WebSocket
   * @param message - Message to send
   * @returns True if sent, false if queued
   */
  public send<T = any>(message: WebSocketMessage<T>): boolean {
    // Add timestamp and ID if not present
    const enrichedMessage = {
      ...message,
      timestamp: message.timestamp || Date.now(),
      id: message.id || this.generateMessageId()
    };

    if (this.isConnected()) {
      try {
        this.ws!.send(JSON.stringify(enrichedMessage));
        this.log('Message sent:', enrichedMessage);
        return true;
      } catch (error) {
        this.log('Error sending message:', error);
        this.queueMessage(enrichedMessage);
        return false;
      }
    } else {
      this.log('Not connected, queuing message');
      this.queueMessage(enrichedMessage);
      return false;
    }
  }

  /**
   * Sends raw data through the WebSocket
   * @param data - Data to send (string, ArrayBuffer, Blob, etc.)
   */
  public sendRaw(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.isConnected()) {
      this.ws!.send(data);
    } else {
      throw new Error('Cannot send raw data: WebSocket not connected');
    }
  }

  // ---------------------------------------------------------------------------
  // Event Handling
  // ---------------------------------------------------------------------------

  /**
   * Registers an event listener for a specific message type
   * @param event - Event name/type
   * @param listener - Event listener function
   */
  public on<T = any>(event: string, listener: WebSocketEventListener<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener as WebSocketEventListener);
  }

  /**
   * Removes an event listener
   * @param event - Event name/type
   * @param listener - Event listener function to remove
   */
  public off<T = any>(event: string, listener: WebSocketEventListener<T>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener as WebSocketEventListener);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Removes all event listeners for a specific event or all events
   * @param event - Event name/type (optional, removes all if not specified)
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }

  /**
   * Registers a connection event listener
   * @param event - Connection event (open, close, error, reconnect)
   * @param callback - Callback function
   */
  public onConnectionEvent(event: 'open' | 'close' | 'error' | 'reconnect', callback: ConnectionEventCallback): void {
    if (!this.connectionEventListeners.has(event)) {
      this.connectionEventListeners.set(event, new Set());
    }
    this.connectionEventListeners.get(event)!.add(callback);
  }

  /**
   * Removes a connection event listener
   * @param event - Connection event
   * @param callback - Callback function to remove
   */
  public offConnectionEvent(event: 'open' | 'close' | 'error' | 'reconnect', callback: ConnectionEventCallback): void {
    const callbacks = this.connectionEventListeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      this.log('WebSocket connected');
      this.setState(ConnectionState.CONNECTED);
      this.reconnectAttempt = 0;
      
      // Flush message queue
      this.flushMessageQueue();
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Emit connection event
      this.emitConnectionEvent('open', event);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.log('Message received:', message);
        
        // Handle heartbeat pong
        if (message.type === 'pong' || message.type === 'heartbeat') {
          this.handleHeartbeatResponse();
          return;
        }
        
        // Emit to event listeners
        this.emitEvent(message.type, message.data);
      } catch (error) {
        this.log('Error parsing message:', error);
        // For non-JSON messages, emit as 'message' event
        this.emitEvent('message', event.data);
      }
    };

    this.ws.onerror = (event) => {
      this.log('WebSocket error:', event);
      const error = new Error('WebSocket error');
      this.handleError(error);
      this.emitConnectionEvent('error', error);
    };

    this.ws.onclose = (event) => {
      this.log(`WebSocket closed: ${event.code} - ${event.reason}`);
      this.stopHeartbeat();
      
      const wasConnected = this.state === ConnectionState.CONNECTED;
      this.setState(ConnectionState.DISCONNECTED);
      this.ws = null;
      
      // Emit close event
      this.emitConnectionEvent('close', event);
      
      // Attempt reconnection if enabled and not a normal closure
      if (this.config.autoReconnect && wasConnected && !event.wasClean) {
        this.scheduleReconnection();
      }
    };
  }

  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.log(`State changed: ${oldState} → ${newState}`);
    }
  }

  private scheduleReconnection(): void {
    if (this.reconnectTimer) return;
    
    const maxAttempts = this.config.maxReconnectAttempts;
    if (maxAttempts > 0 && this.reconnectAttempt >= maxAttempts) {
      this.log(`Max reconnect attempts (${maxAttempts}) reached`);
      this.setState(ConnectionState.ERROR);
      return;
    }

    this.setState(ConnectionState.RECONNECTING);
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempt),
      this.config.maxReconnectDelay
    );
    
    if (this.reconnectAttempt === 0) {
      this.reconnectionStartTime = Date.now();
    }
    
    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1}${maxAttempts > 0 ? `/${maxAttempts}` : ''})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempt++;
      
      const context: ReconnectionContext = {
        attemptNumber: this.reconnectAttempt,
        elapsedTime: Date.now() - this.reconnectionStartTime
      };
      
      this.emitConnectionEvent('reconnect', context);
      this.connect();
    }, delay);
  }

  private cancelReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempt = 0;
  }

  private startHeartbeat(): void {
    if (this.config.heartbeatInterval <= 0) return;
    
    this.lastHeartbeatReceived = Date.now();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        // Send ping
        this.send({ type: 'ping' });
        
        // Start timeout timer
        this.heartbeatTimeoutTimer = setTimeout(() => {
          this.log('Heartbeat timeout - connection appears dead');
          this.disconnect(1000, 'Heartbeat timeout');
        }, this.config.heartbeatTimeout);
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  private handleHeartbeatResponse(): void {
    this.lastHeartbeatReceived = Date.now();
    
    // Clear timeout timer
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= this.config.messageQueueLimit) {
      this.log('Message queue full, removing oldest message');
      this.messageQueue.shift();
    }
    this.messageQueue.push(message);
    this.log(`Message queued (${this.messageQueue.length}/${this.config.messageQueueLimit})`);
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;
    
    this.log(`Flushing ${this.messageQueue.length} queued messages`);
    
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()!;
      try {
        this.ws!.send(JSON.stringify(message));
      } catch (error) {
        this.log('Error sending queued message:', error);
        // Re-queue if send fails
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          this.log(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  private emitConnectionEvent(event: string, data?: any): void {
    const callbacks = this.connectionEventListeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.log(`Error in connection event callback for '${event}':`, error);
        }
      });
    }
  }

  private handleError(error: Error): void {
    this.log('Error:', error);
    this.setState(ConnectionState.ERROR);
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocketManager]', ...args);
    }
  }

  /**
   * Gets reconnection statistics
   */
  public getReconnectionStats(): {
    attemptNumber: number;
    elapsedTime: number;
    maxAttempts: number;
  } {
    return {
      attemptNumber: this.reconnectAttempt,
      elapsedTime: this.reconnectionStartTime > 0 ? Date.now() - this.reconnectionStartTime : 0,
      maxAttempts: this.config.maxReconnectAttempts
    };
  }

  /**
   * Gets message queue information
   */
  public getQueueInfo(): {
    size: number;
    limit: number;
    percentage: number;
  } {
    return {
      size: this.messageQueue.length,
      limit: this.config.messageQueueLimit,
      percentage: (this.messageQueue.length / this.config.messageQueueLimit) * 100
    };
  }

  /**
   * Clears the message queue
   */
  public clearQueue(): void {
    this.messageQueue = [];
    this.log('Message queue cleared');
  }

  /**
   * Gets last heartbeat timestamp
   */
  public getLastHeartbeat(): number {
    return this.lastHeartbeatReceived;
  }

  /**
   * Cleans up resources
   */
  public destroy(): void {
    this.disconnect();
    this.removeAllListeners();
    this.connectionEventListeners.clear();
    this.clearQueue();
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Creates a WebSocket connection with simplified API
 * @param url - WebSocket URL
 * @param options - Configuration options
 * @returns WebSocketManager instance
 */
export function createWebSocket(url: string, options?: Partial<WebSocketConfig>): WebSocketManager {
  return new WebSocketManager({ url, ...options });
}

/**
 * Calculates exponential backoff delay
 * @param attempt - Current attempt number (0-based)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Calculated delay
 */
export function calculateBackoffDelay(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
}

/**
 * Calculates jittered backoff delay (adds randomness to prevent thundering herd)
 * @param attempt - Current attempt number (0-based)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @param jitterFactor - Jitter factor (0-1, default: 0.1 = ±10%)
 * @returns Calculated delay with jitter
 */
export function calculateJitteredBackoff(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  jitterFactor: number = 0.1
): number {
  const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay);
  const jitter = delay * jitterFactor * (Math.random() * 2 - 1); // Random value between -jitterFactor and +jitterFactor
  return Math.max(0, delay + jitter);
}

/**
 * Checks if a WebSocket is in a specific state
 * @param ws - WebSocket instance
 * @param state - State to check (CONNECTING, OPEN, CLOSING, CLOSED)
 * @returns True if in specified state
 */
export function isWebSocketState(ws: WebSocket | null, state: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'): boolean {
  if (!ws) return false;
  return ws.readyState === WebSocket[state];
}

/**
 * Gets WebSocket ready state as string
 * @param ws - WebSocket instance
 * @returns State string
 */
export function getWebSocketState(ws: WebSocket | null): string {
  if (!ws) return 'NULL';
  
  switch (ws.readyState) {
    case WebSocket.CONNECTING: return 'CONNECTING';
    case WebSocket.OPEN: return 'OPEN';
    case WebSocket.CLOSING: return 'CLOSING';
    case WebSocket.CLOSED: return 'CLOSED';
    default: return 'UNKNOWN';
  }
}

/**
 * Waits for WebSocket to reach a specific state
 * @param ws - WebSocket instance
 * @param targetState - Target ready state
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves when state is reached
 */
export function waitForWebSocketState(
  ws: WebSocket,
  targetState: number,
  timeout: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws.readyState === targetState) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout waiting for WebSocket state ${targetState}`));
    }, timeout);

    const checkState = () => {
      if (ws.readyState === targetState) {
        clearTimeout(timeoutId);
        resolve();
      }
    };

    ws.addEventListener('open', checkState);
    ws.addEventListener('close', checkState);
    ws.addEventListener('error', () => {
      clearTimeout(timeoutId);
      reject(new Error('WebSocket error while waiting for state'));
    });
  });
}
