/**
 * WebSocket Connection Manager
 *
 * A robust client-side WebSocket connection manager that handles:
 * - Connection establishment and maintenance
 * - Automatic reconnection with exponential backoff
 * - Message serialization/deserialization
 * - Connection state management and monitoring
 * - Fallback to HTTP endpoints when WebSocket is unavailable
 *
 * This class works with the server's MainWebSocketServer implementation.
 */

import { logger } from '../utils/logger';

// WebSocket connection states
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

// Options for WebSocket connection
export interface WebSocketOptions {
  // URL to connect to (defaults to auto-detection based on window.location)
  url?: string;

  // Path for WebSocket connection (default: '/ws')
  path?: string;

  // Whether to automatically reconnect (default: true)
  autoReconnect?: boolean;

  // Reconnection strategy options
  reconnectStrategy?: {
    // Initial delay in ms (default: 1000)
    initialDelay?: number;
    // Maximum delay in ms (default: 30000)
    maxDelay?: number;
    // Multiplier for exponential backoff (default: 1.5)
    multiplier?: number;
    // Maximum reconnection attempts (default: 10)
    maxAttempts?: number;
  };

  // Heartbeat interval in ms (default: 30000)
  heartbeatInterval?: number;

  // Whether to use HTTP fallback when WebSocket is unavailable (default: true)
  useHttpFallback?: boolean;

  // HTTP endpoint for fallback (default: '/api/ws-fallback/send')
  httpFallbackEndpoint?: string;
}

// Message types
export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

// Handler types
export type MessageHandler = (message: any) => void;
export type StateChangeHandler = (state: ConnectionState, metadata?: any) => void;
export type ErrorHandler = (error: Error, context?: string) => void;

/**
 * WebSocketConnectionManager for client-side WebSocket management
 */
export class WebSocketConnectionManager {
  // WebSocket instance
  private socket: WebSocket | null = null;

  // Current connection state
  private state: ConnectionState = ConnectionState.DISCONNECTED;

  // Connection options
  private options: Required<WebSocketOptions>;

  // Default options
  private static readonly DEFAULT_OPTIONS: Required<WebSocketOptions> = {
    url: '',
    path: '/ws',
    autoReconnect: true,
    reconnectStrategy: {
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 1.5,
      maxAttempts: 10,
    },
    heartbeatInterval: 30000,
    useHttpFallback: true,
    httpFallbackEndpoint: '/api/ws-fallback/send',
  };

  // Reconnection state
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Heartbeat state
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastHeartbeatResponse: number | null = null;

  // Message handlers
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private defaultMessageHandlers: Set<MessageHandler> = new Set();

  // State change handlers
  private stateChangeHandlers: Set<StateChangeHandler> = new Set();

  // Error handlers
  private errorHandlers: Set<ErrorHandler> = new Set();

  // Client ID assigned by server
  private clientId: string | null = null;

  // Stats
  private stats = {
    messagesReceived: 0,
    messagesSent: 0,
    reconnects: 0,
    errors: 0,
    lastLatency: null as number | null,
    averageLatency: null as number | null,
    latencySamples: [] as number[],
  };

  /**
   * Create WebSocketConnectionManager instance
   * @param options Configuration options
   */
  constructor(options: WebSocketOptions = {}) {
    // Merge with default options
    this.options = {
      ...WebSocketConnectionManager.DEFAULT_OPTIONS,
      ...options,
      reconnectStrategy: {
        ...WebSocketConnectionManager.DEFAULT_OPTIONS.reconnectStrategy,
        ...(options.reconnectStrategy || {}),
      },
    };

    // Auto-generate URL if not provided
    if (!this.options.url) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.options.url = `${protocol}//${window.location.host}${this.options.path}`;
    }

    // Register internal message handlers
    this.registerInternalHandlers();
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    // Don't connect if already connected or connecting
    if (this.state === ConnectionState.CONNECTED || this.state === ConnectionState.CONNECTING) {
      logger.info('[WebSocketManager] Already connected or connecting');
      return;
    }

    // Update state
    this.updateState(ConnectionState.CONNECTING);

    try {
      logger.info(`[WebSocketManager] Connecting to ${this.options.url}`);

      // Create WebSocket connection
      this.socket = new WebSocket(this.options.url);

      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    // Clear timers
    this.clearTimers();

    // Only proceed if we have a socket
    if (!this.socket) {
      this.updateState(ConnectionState.DISCONNECTED);
      return;
    }

    try {
      // Close socket if open
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000, 'Client disconnected');
      }
    } catch (error) {
      logger.error('[WebSocketManager] Error while disconnecting', { error });
    }

    // Clean up
    this.socket = null;
    this.updateState(ConnectionState.DISCONNECTED);
  }

  /**
   * Reconnect to WebSocket server
   */
  public reconnect(): void {
    logger.info('[WebSocketManager] Manually reconnecting');

    // Disconnect if connected
    this.disconnect();

    // Reset reconnect attempts (for manual reconnect)
    this.reconnectAttempt = 0;

    // Connect again
    this.connect();
  }

  /**
   * Send a message to the server
   * @param message Message to send
   * @returns True if successful, false otherwise
   */
  public send(message: WebSocketMessage | string): boolean {
    // Check if connected
    if (this.state !== ConnectionState.CONNECTED || !this.socket) {
      logger.warn('[WebSocketManager] Cannot send message: not connected');

      // Try HTTP fallback if enabled
      if (this.options.useHttpFallback) {
        return this.sendViaHttpFallback(message);
      }

      return false;
    }

    try {
      // Convert message to string if needed
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);

      // Send message
      this.socket.send(messageStr);
      this.stats.messagesSent++;

      return true;
    } catch (error) {
      this.handleError(error as Error);

      // Try HTTP fallback if enabled
      if (this.options.useHttpFallback) {
        return this.sendViaHttpFallback(message);
      }

      return false;
    }
  }

  /**
   * Send a message via HTTP fallback
   * @param message Message to send
   * @returns True if successful, false otherwise
   */
  private sendViaHttpFallback(message: WebSocketMessage | string): boolean {
    if (!this.options.useHttpFallback) {
      return false;
    }

    try {
      // Convert message to object if needed
      const messageObj =
        typeof message === 'string' ? { type: 'message', content: message } : message;

      // Send via fetch
      fetch(this.options.httpFallbackEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageObj,
          clientId: this.clientId,
        }),
      })
        .then(response => response.json())
        .then(data => {
          logger.info('[WebSocketManager] HTTP fallback response:', { data });

          // Process response as if it came from WebSocket
          this.processReceivedMessage(data);
        })
        .catch(error => {
          logger.error('[WebSocketManager] HTTP fallback error:', { error });
          this.notifyErrorHandlers(error, 'http-fallback');
        });

      return true;
    } catch (error) {
      logger.error('[WebSocketManager] Error using HTTP fallback:', { error });
      this.notifyErrorHandlers(error as Error, 'http-fallback');
      return false;
    }
  }

  /**
   * Send a ping message
   * @returns True if successful, false otherwise
   */
  public ping(): boolean {
    return this.send({
      type: 'ping',
      timestamp: Date.now(),
    });
  }

  /**
   * Register a message handler for a specific message type
   * @param messageType Message type to handle
   * @param handler Handler function
   */
  public onMessage(messageType: string, handler: MessageHandler): void {
    // Get or create handler set for this message type
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }

    // Add handler
    this.messageHandlers.get(messageType)!.add(handler);
  }

  /**
   * Register a default message handler for all messages
   * @param handler Handler function
   */
  public onAnyMessage(handler: MessageHandler): void {
    this.defaultMessageHandlers.add(handler);
  }

  /**
   * Register a state change handler
   * @param handler Handler function
   */
  public onStateChange(handler: StateChangeHandler): void {
    this.stateChangeHandlers.add(handler);
  }

  /**
   * Register an error handler
   * @param handler Handler function
   */
  public onError(handler: ErrorHandler): void {
    this.errorHandlers.add(handler);
  }

  /**
   * Remove a message handler
   * @param messageType Message type
   * @param handler Handler to remove
   */
  public offMessage(messageType: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Remove a default message handler
   * @param handler Handler to remove
   */
  public offAnyMessage(handler: MessageHandler): void {
    this.defaultMessageHandlers.delete(handler);
  }

  /**
   * Remove a state change handler
   * @param handler Handler to remove
   */
  public offStateChange(handler: StateChangeHandler): void {
    this.stateChangeHandlers.delete(handler);
  }

  /**
   * Remove an error handler
   * @param handler Handler to remove
   */
  public offError(handler: ErrorHandler): void {
    this.errorHandlers.delete(handler);
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get statistics about the connection
   */
  public getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Get client ID assigned by server
   */
  public getClientId(): string | null {
    return this.clientId;
  }

  /**
   * Update connection options
   * @param options New options
   */
  public updateOptions(options: Partial<WebSocketOptions>): void {
    const oldUrl = this.options.url;
    const oldPath = this.options.path;

    // Update options
    this.options = {
      ...this.options,
      ...options,
      reconnectStrategy: {
        ...this.options.reconnectStrategy,
        ...(options.reconnectStrategy || {}),
      },
    };

    // Check if we need to reconnect
    const urlChanged = options.url !== undefined && options.url !== oldUrl;
    const pathChanged = options.path !== undefined && options.path !== oldPath;

    // Regenerate URL if path changed but URL not explicitly set
    if (pathChanged && !urlChanged && !options.url) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.options.url = `${protocol}//${window.location.host}${this.options.path}`;
    }

    // Reconnect if URL or path changed and we're connected
    if ((urlChanged || pathChanged) && this.state === ConnectionState.CONNECTED) {
      logger.info('[WebSocketManager] Connection options changed, reconnecting');
      this.reconnect();
    }

    // Restart heartbeat if interval changed
    if (options.heartbeatInterval !== undefined && this.state === ConnectionState.CONNECTED) {
      this.restartHeartbeat();
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    logger.info('[WebSocketManager] Connection established');

    // Update state
    this.updateState(ConnectionState.CONNECTED);

    // Reset reconnect attempts
    this.reconnectAttempt = 0;

    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    // Update stats
    this.stats.messagesReceived++;

    try {
      // Parse message
      const message = JSON.parse(event.data);
      this.processReceivedMessage(message);
    } catch (error) {
      logger.error('[WebSocketManager] Error parsing message', { error, data: event.data });
      this.notifyErrorHandlers(error as Error, 'parse');
    }
  }

  /**
   * Process a received message (from WebSocket or HTTP fallback)
   */
  private processReceivedMessage(message: any): void {
    // Store client ID if provided
    if (message.clientId && !this.clientId) {
      this.clientId = message.clientId;
      logger.info(`[WebSocketManager] Received client ID: ${this.clientId}`);
    }

    // Update heartbeat status if this is a pong
    if (message.type === 'pong') {
      this.handlePong(message);
    }

    // Notify specific message handlers
    if (message.type && this.messageHandlers.has(message.type)) {
      for (const handler of this.messageHandlers.get(message.type)!) {
        try {
          handler(message);
        } catch (error) {
          logger.error(`[WebSocketManager] Error in message handler for type '${message.type}'`, {
            error,
          });
        }
      }
    }

    // Notify default message handlers
    for (const handler of this.defaultMessageHandlers) {
      try {
        handler(message);
      } catch (error) {
        logger.error('[WebSocketManager] Error in default message handler', { error });
      }
    }
  }

  /**
   * Handle pong message
   */
  private handlePong(message: any): void {
    // Update last heartbeat response
    this.lastHeartbeatResponse = Date.now();

    // Calculate latency if timestamp is included
    if (message.timestamp) {
      const latency = Date.now() - message.timestamp;
      this.stats.lastLatency = latency;

      // Update average latency
      this.stats.latencySamples.push(latency);
      if (this.stats.latencySamples.length > 10) {
        this.stats.latencySamples.shift();
      }

      const sum = this.stats.latencySamples.reduce((a, b) => a + b, 0);
      this.stats.averageLatency = Math.round(sum / this.stats.latencySamples.length);

      logger.debug(
        `[WebSocketManager] Latency: ${latency}ms (avg: ${this.stats.averageLatency}ms)`
      );
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    logger.info(
      `[WebSocketManager] Connection closed (code: ${event.code}, reason: ${event.reason || 'No reason provided'})`
    );

    // Clean up
    this.socket = null;
    this.clearTimers();

    // Update state
    this.updateState(ConnectionState.DISCONNECTED, { code: event.code, reason: event.reason });

    // Attempt to reconnect if appropriate
    if (this.shouldReconnect(event.code)) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event | Error): void {
    const error = event instanceof Error ? event : new Error('WebSocket error');
    this.handleConnectionError(error);
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: Error): void {
    logger.error('[WebSocketManager] Connection error', { error });

    // Update stats
    this.stats.errors++;

    // Update state
    this.updateState(ConnectionState.ERROR, { error });

    // Notify error handlers
    this.notifyErrorHandlers(error, 'connection');

    // Attempt to reconnect if appropriate
    if (this.shouldReconnect()) {
      this.scheduleReconnect();
    }
  }

  /**
   * Determine if we should attempt to reconnect
   */
  private shouldReconnect(closeCode?: number): boolean {
    // Don't reconnect if auto-reconnect is disabled
    if (!this.options.autoReconnect) {
      return false;
    }

    // Don't reconnect if we've exceeded max attempts
    if (this.reconnectAttempt >= this.options.reconnectStrategy.maxAttempts) {
      logger.warn(
        `[WebSocketManager] Max reconnection attempts (${this.options.reconnectStrategy.maxAttempts}) reached`
      );
      return false;
    }

    // Don't reconnect on normal closure (1000) or going away (1001)
    if (closeCode === 1000 || closeCode === 1001) {
      return false;
    }

    return true;
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Increment attempt counter
    this.reconnectAttempt++;

    // Calculate delay using exponential backoff
    const { initialDelay, maxDelay, multiplier } = this.options.reconnectStrategy;
    const delay = Math.min(
      initialDelay * Math.pow(multiplier, this.reconnectAttempt - 1),
      maxDelay
    );

    // Update state
    this.updateState(ConnectionState.RECONNECTING, {
      attempt: this.reconnectAttempt,
      maxAttempts: this.options.reconnectStrategy.maxAttempts,
      delay,
    });

    logger.info(
      `[WebSocketManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt}/${this.options.reconnectStrategy.maxAttempts})`
    );

    // Schedule reconnection
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
      this.stats.reconnects++;
    }, delay);
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    // Clear any existing heartbeat timer
    this.clearHeartbeatTimer();

    // Only start if interval is positive
    if (this.options.heartbeatInterval <= 0) {
      return;
    }

    logger.debug(
      `[WebSocketManager] Starting heartbeat (interval: ${this.options.heartbeatInterval}ms)`
    );

    // Send initial ping
    this.ping();

    // Start heartbeat timer
    this.heartbeatTimer = setInterval(() => {
      this.ping();

      // Check if we've missed too many heartbeats
      if (this.lastHeartbeatResponse) {
        const elapsed = Date.now() - this.lastHeartbeatResponse;
        if (elapsed > this.options.heartbeatInterval * 3) {
          logger.warn(
            `[WebSocketManager] Missed heartbeats detected (${elapsed}ms since last response)`
          );
          this.reconnect();
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Restart heartbeat mechanism
   */
  private restartHeartbeat(): void {
    this.clearHeartbeatTimer();
    this.startHeartbeat();
  }

  /**
   * Update connection state and notify handlers
   */
  private updateState(state: ConnectionState, metadata?: any): void {
    // Only update if state has changed
    if (this.state === state) {
      return;
    }

    // Update state
    this.state = state;

    // Notify state change handlers
    for (const handler of this.stateChangeHandlers) {
      try {
        handler(state, metadata);
      } catch (error) {
        logger.error('[WebSocketManager] Error in state change handler', { error });
      }
    }
  }

  /**
   * Notify error handlers
   */
  private notifyErrorHandlers(error: Error, context?: string): void {
    for (const handler of this.errorHandlers) {
      try {
        handler(error, context);
      } catch (handlerError) {
        logger.error('[WebSocketManager] Error in error handler', { error: handlerError });
      }
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Clear heartbeat timer
   */
  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Register internal message handlers
   */
  private registerInternalHandlers(): void {
    // Register handler for system messages
    this.onMessage('system', message => {
      if (message.event === 'connected') {
        logger.info('[WebSocketManager] Received system connected message');

        // Store client ID if provided
        if (message.clientId) {
          this.clientId = message.clientId;
        }

        // Update heartbeat interval based on server config (if provided)
        if (message.config?.heartbeatInterval) {
          const serverHeartbeatInterval = message.config.heartbeatInterval;
          if (serverHeartbeatInterval !== this.options.heartbeatInterval) {
            logger.info(
              `[WebSocketManager] Updating heartbeat interval from ${this.options.heartbeatInterval}ms to ${serverHeartbeatInterval}ms (server config)`
            );
            this.options.heartbeatInterval = serverHeartbeatInterval;
            this.restartHeartbeat();
          }
        }
      }
    });

    // Register handler for config messages
    this.onMessage('config', message => {
      logger.info('[WebSocketManager] Received config message', { message });

      // Update heartbeat interval if provided
      if (message.keepaliveInterval) {
        const serverHeartbeatInterval = message.keepaliveInterval;
        if (serverHeartbeatInterval !== this.options.heartbeatInterval) {
          logger.info(
            `[WebSocketManager] Updating heartbeat interval from ${this.options.heartbeatInterval}ms to ${serverHeartbeatInterval}ms (server config)`
          );
          this.options.heartbeatInterval = serverHeartbeatInterval;
          this.restartHeartbeat();
        }
      }

      // Update reconnect strategy if provided
      if (message.reconnectStrategy) {
        logger.info('[WebSocketManager] Updating reconnect strategy from server config');
        this.options.reconnectStrategy = {
          ...this.options.reconnectStrategy,
          ...message.reconnectStrategy,
        };
      }
    });

    // Register handler for error messages
    this.onMessage('error', message => {
      logger.warn('[WebSocketManager] Received error message from server', { message });
      this.notifyErrorHandlers(new Error(message.message || 'Server error'), 'server');
    });
  }
}
