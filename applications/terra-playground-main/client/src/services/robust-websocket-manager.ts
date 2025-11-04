/**
 * Robust WebSocket Connection Manager
 *
 * A resilient WebSocket connection manager with advanced features:
 * - Automatic reconnection with exponential backoff
 * - Connection health monitoring
 * - Protocol handling for different environments
 * - Buffering for messages during disconnection
 * - Fallback to HTTP polling when WebSocket fails
 * - Detailed connection diagnostics
 * - Event-based API for easy integration
 * - Socket.IO compatibility layer
 */

// Type definitions
type MessageHandler = (data: any) => void;
type ErrorHandler = (error: any) => void;
type ConnectionHandler = () => void;

// Connection state constants
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
  USING_FALLBACK = 'using_fallback',
}

// Transport types
export enum TransportType {
  WEBSOCKET = 'websocket',
  POLLING = 'polling',
  SSE = 'sse',
  LONG_POLLING = 'long_polling',
  UNKNOWN = 'unknown',
}

// Message priority for queue management
export enum MessagePriority {
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

// Configuration options interface
export interface WebSocketManagerOptions {
  url?: string;
  protocols?: string | string[];
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  reconnectMultiplier?: number;
  maxReconnectInterval?: number;
  pingInterval?: number;
  pingTimeout?: number;
  connectionTimeout?: number;
  fallbackPolling?: boolean;
  fallbackPollingInterval?: number;
  fallbackPollingEndpoint?: string;
  headers?: Record<string, string>;
  onConnect?: ConnectionHandler;
  onDisconnect?: ConnectionHandler;
  onReconnect?: ConnectionHandler;
  onReconnectFailed?: ConnectionHandler;
  onMessage?: MessageHandler;
  onError?: ErrorHandler;
  debug?: boolean;
  useBinaryMessages?: boolean;
  autoJSONParse?: boolean;
  forcePolling?: boolean;
  clientId?: string;
}

// Connection statistics interface
export interface ConnectionStats {
  messagesReceived: number;
  messagesSent: number;
  messagesFailed: number;
  reconnectAttempts: number;
  successfulConnections: number;
  errors: number;
  averageLatency: number;
  connectionUptime: number;
  lastMessageTime: Date | null;
  lastConnectedTime: Date | null;
  lastDisconnectedTime: Date | null;
  transportType: TransportType;
  connectionState: ConnectionState;
  bufferedMessageCount: number;
}

// Interface for buffered messages
interface BufferedMessage {
  data: any;
  priority: MessagePriority;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  binary?: boolean;
}

/**
 * A robust WebSocket connection manager with advanced features
 */
export class RobustWebSocketManager {
  private socket: WebSocket | null = null;
  private options: WebSocketManagerOptions;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private transportType: TransportType = TransportType.UNKNOWN;
  private reconnectAttempt: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private pingTimeoutTimer: NodeJS.Timeout | null = null;
  private connectionTimeoutTimer: NodeJS.Timeout | null = null;
  private pollingTimer: NodeJS.Timeout | null = null;
  private messageBuffer: BufferedMessage[] = [];
  private lastPingSent: number = 0;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private connectionStartTime: number = 0;
  private totalUptime: number = 0;
  private clientId: string;
  private abortController: AbortController | null = null;

  // Performance metrics and statistics
  private stats: ConnectionStats = {
    messagesReceived: 0,
    messagesSent: 0,
    messagesFailed: 0,
    reconnectAttempts: 0,
    successfulConnections: 0,
    errors: 0,
    averageLatency: 0,
    connectionUptime: 0,
    lastMessageTime: null,
    lastConnectedTime: null,
    lastDisconnectedTime: null,
    transportType: TransportType.UNKNOWN,
    connectionState: ConnectionState.DISCONNECTED,
    bufferedMessageCount: 0,
  };

  // Latency tracking
  private latencyMeasurements: number[] = [];
  private maxLatencyRecords: number = 100;

  /**
   * Create a new RobustWebSocketManager instance
   * @param options Configuration options
   */
  constructor(options: WebSocketManagerOptions = {}) {
    // Apply default options
    this.options = {
      url: options.url || this.getDefaultWebSocketUrl(),
      protocols: options.protocols || [],
      autoReconnect: options.autoReconnect !== undefined ? options.autoReconnect : true,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      reconnectInterval: options.reconnectInterval || 1000,
      reconnectMultiplier: options.reconnectMultiplier || 1.5,
      maxReconnectInterval: options.maxReconnectInterval || 30000,
      pingInterval: options.pingInterval || 25000, // 25 seconds
      pingTimeout: options.pingTimeout || 10000, // 10 seconds
      connectionTimeout: options.connectionTimeout || 10000, // 10 seconds
      fallbackPolling: options.fallbackPolling !== undefined ? options.fallbackPolling : true,
      fallbackPollingInterval: options.fallbackPollingInterval || 5000,
      fallbackPollingEndpoint: options.fallbackPollingEndpoint || '/api/ws-fallback/send',
      headers: options.headers || {},
      onConnect: options.onConnect || (() => {}),
      onDisconnect: options.onDisconnect || (() => {}),
      onReconnect: options.onReconnect || (() => {}),
      onReconnectFailed: options.onReconnectFailed || (() => {}),
      onMessage: options.onMessage || (() => {}),
      onError: options.onError || (() => {}),
      debug: options.debug || false,
      useBinaryMessages: options.useBinaryMessages || false,
      autoJSONParse: options.autoJSONParse !== undefined ? options.autoJSONParse : true,
      forcePolling: options.forcePolling || false,
    };

    // Generate a unique client ID if not provided
    this.clientId =
      options.clientId || `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Initialize event listeners
    this.eventListeners.set('connect', new Set());
    this.eventListeners.set('disconnect', new Set());
    this.eventListeners.set('reconnect', new Set());
    this.eventListeners.set('reconnect_failed', new Set());
    this.eventListeners.set('message', new Set());
    this.eventListeners.set('error', new Set());
    this.eventListeners.set('pong', new Set());
    this.eventListeners.set('state_change', new Set());

    // Auto connect if URL is provided
    if (this.options.url && !this.options.forcePolling) {
      this.connect();
    } else if (this.options.forcePolling) {
      this.initPolling();
    }
  }

  /**
   * Get the current connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get the current transport type
   */
  public getTransport(): TransportType {
    return this.transportType;
  }

  /**
   * Get connection statistics
   */
  public getStats(): ConnectionStats {
    // Calculate current uptime if connected
    if (this.state === ConnectionState.CONNECTED && this.connectionStartTime > 0) {
      const currentUptime = Date.now() - this.connectionStartTime;
      this.stats.connectionUptime = Math.floor(currentUptime / 1000); // Convert to seconds
    }

    // Update buffered message count
    this.stats.bufferedMessageCount = this.messageBuffer.length;

    return { ...this.stats };
  }

  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves on successful connection or rejects on failure
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // If already connected or connecting, don't try to connect again
      if (
        this.socket &&
        (this.socket.readyState === WebSocket.OPEN ||
          this.socket.readyState === WebSocket.CONNECTING)
      ) {
        this.log('Already connected or connecting');
        resolve();
        return;
      }

      // If we were using polling, stop it
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }

      // Update state
      this.updateState(ConnectionState.CONNECTING);
      this.transportType = TransportType.WEBSOCKET;

      // Set connection timeout
      this.connectionTimeoutTimer = setTimeout(() => {
        if (this.state === ConnectionState.CONNECTING) {
          this.log('Connection timeout reached');

          if (this.socket) {
            this.socket.close();
            this.socket = null;
          }

          // Attempt reconnect or fall back to polling
          if (
            this.options.autoReconnect &&
            this.reconnectAttempt < this.options.maxReconnectAttempts!
          ) {
            this.attemptReconnect();
          } else if (this.options.fallbackPolling) {
            this.log('Falling back to polling after connection timeout');
            this.initPolling();
          } else {
            this.updateState(ConnectionState.ERROR);
            reject(new Error('Connection timeout'));
          }
        }
      }, this.options.connectionTimeout);

      try {
        // Create WebSocket instance
        this.log(`Connecting to ${this.options.url}`);

        // Create websocket with protocols if provided
        if (typeof this.options.protocols === 'string' || Array.isArray(this.options.protocols)) {
          this.socket = new WebSocket(this.options.url!, this.options.protocols);
        } else {
          this.socket = new WebSocket(this.options.url!);
        }

        // Set up event handlers
        this.socket.onopen = event => this.handleOpen(event, resolve);
        this.socket.onclose = event => this.handleClose(event, reject);
        this.socket.onerror = event => this.handleError(event);
        this.socket.onmessage = event => this.handleMessage(event);
      } catch (error) {
        this.log('Error creating WebSocket connection:', error);

        // Clear timeout
        if (this.connectionTimeoutTimer) {
          clearTimeout(this.connectionTimeoutTimer);
          this.connectionTimeoutTimer = null;
        }

        // Update statistics
        this.stats.errors++;

        // Try to reconnect or fall back to polling
        if (
          this.options.autoReconnect &&
          this.reconnectAttempt < this.options.maxReconnectAttempts!
        ) {
          this.attemptReconnect();
        } else if (this.options.fallbackPolling) {
          this.log('Falling back to polling after connection error');
          this.initPolling();
        } else {
          this.updateState(ConnectionState.ERROR);
          reject(error);
        }
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.log('Manually disconnecting');

    // Clear all timers
    this.clearAllTimers();

    // Close socket if it exists
    if (this.socket) {
      try {
        // Only close if it's not already closing or closed
        if (
          this.socket.readyState === WebSocket.OPEN ||
          this.socket.readyState === WebSocket.CONNECTING
        ) {
          this.socket.close(1000, 'Manual disconnect');
        }
      } catch (error) {
        this.log('Error closing WebSocket connection:', error);
      }

      this.socket = null;
    }

    // Stop polling if active
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    // Abort any pending fetch requests
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Update state
    this.updateState(ConnectionState.DISCONNECTED);
    this.stats.lastDisconnectedTime = new Date();

    // Notify listeners
    this.emit('disconnect', { reason: 'manual' });
  }

  /**
   * Send a message over the WebSocket connection
   * @param data Data to send
   * @param options Optional send configuration
   * @returns Promise that resolves when message is sent or rejects on failure
   */
  public send(
    data: any,
    options: {
      binary?: boolean;
      priority?: MessagePriority;
      maxRetries?: number;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const priority = options.priority || MessagePriority.NORMAL;
      const maxRetries = options.maxRetries || 3;
      const binary = options.binary || false;

      // If connected and socket is open, send immediately
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          // Prepare data for sending
          let messageData = data;

          // Convert to JSON string if not already a string or binary data
          if (
            !binary &&
            typeof data !== 'string' &&
            !(data instanceof ArrayBuffer) &&
            !(data instanceof Blob)
          ) {
            messageData = JSON.stringify(data);
          }

          // Send the message
          this.socket.send(messageData);

          // Update statistics
          this.stats.messagesSent++;

          resolve();
        } catch (error) {
          this.log('Error sending WebSocket message:', error);
          this.stats.messagesFailed++;
          this.stats.errors++;

          // Buffer the message for retry
          this.bufferMessage(data, priority, maxRetries, binary);
          reject(error);
        }
      }
      // If using polling fallback, send via HTTP
      else if (this.state === ConnectionState.USING_FALLBACK) {
        this.sendViaHTTP(data)
          .then(resolve)
          .catch(error => {
            this.log('Error sending message via HTTP fallback:', error);
            this.stats.messagesFailed++;
            this.stats.errors++;

            // Buffer for retry
            this.bufferMessage(data, priority, maxRetries, binary);
            reject(error);
          });
      }
      // Otherwise buffer the message for later
      else {
        this.log('Connection not open, buffering message');
        this.bufferMessage(data, priority, maxRetries, binary);

        // Don't reject here, as the message might be sent later
        resolve();
      }
    });
  }

  /**
   * Register an event listener
   * @param event Event name
   * @param callback Function to call when event occurs
   * @returns this for chaining
   */
  public on(event: string, callback: Function): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(callback);
    return this;
  }

  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Function to remove
   * @returns this for chaining
   */
  public off(event: string, callback: Function): this {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.delete(callback);
    }

    return this;
  }

  /**
   * Manually trigger a reconnection attempt
   */
  public reconnect(): void {
    this.log('Manual reconnection requested');

    // Reset reconnect attempt counter
    this.reconnectAttempt = 0;

    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Stop polling if active
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    // Disconnect current socket if connected
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      this.socket.close(1000, 'Manual reconnect');
      this.socket = null;
    }

    // Connect again
    this.connect().catch(error => {
      this.log('Manual reconnection failed:', error);
    });
  }

  /**
   * Get the client ID used for this connection
   */
  public getClientId(): string {
    return this.clientId;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event, resolve: Function): void {
    this.log('WebSocket connection established');

    // Clear connection timeout
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }

    // Update state and statistics
    this.updateState(ConnectionState.CONNECTED);
    this.reconnectAttempt = 0;
    this.connectionStartTime = Date.now();
    this.stats.successfulConnections++;
    this.stats.lastConnectedTime = new Date();
    this.transportType = TransportType.WEBSOCKET;

    // Start ping interval
    this.startPingInterval();

    // Send initial identification message
    this.sendIdentification();

    // Send any buffered messages
    this.sendBufferedMessages();

    // Notify listeners
    this.emit('connect', { transportType: TransportType.WEBSOCKET });

    // Call onConnect callback
    if (this.options.onConnect) {
      this.options.onConnect();
    }

    resolve();
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent, reject: Function): void {
    // Count uptime if we were connected
    if (this.state === ConnectionState.CONNECTED && this.connectionStartTime > 0) {
      const sessionUptime = Date.now() - this.connectionStartTime;
      this.totalUptime += sessionUptime;
      this.connectionStartTime = 0;
    }

    this.log(
      `WebSocket connection closed: Code ${event.code}, Reason: ${event.reason || 'No reason provided'}, Clean: ${event.wasClean}`
    );

    // Stop ping interval
    this.stopPingInterval();

    // Clear connection timeout
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }

    // Update state and statistics
    this.updateState(ConnectionState.DISCONNECTED);
    this.stats.lastDisconnectedTime = new Date();

    // Handle reconnection logic based on close code
    if (event.code === 1000 || event.code === 1001) {
      // Normal closure or going away - don't reconnect
      this.log('Normal closure, not attempting reconnect');
    } else {
      if (
        this.options.autoReconnect &&
        this.reconnectAttempt < this.options.maxReconnectAttempts!
      ) {
        // Attempt to reconnect with exponential backoff
        this.attemptReconnect();
      } else if (this.options.fallbackPolling) {
        // Fall back to polling if max reconnect attempts reached
        this.log('Max reconnect attempts reached, falling back to polling');
        this.initPolling();
      } else {
        this.updateState(ConnectionState.ERROR);
        this.emit('reconnect_failed', {
          attempts: this.reconnectAttempt,
          closeCode: event.code,
          closeReason: event.reason,
        });

        if (this.options.onReconnectFailed) {
          this.options.onReconnectFailed();
        }
      }
    }

    // Notify listeners
    this.emit('disconnect', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });

    // Call onDisconnect callback
    if (this.options.onDisconnect) {
      this.options.onDisconnect();
    }

    reject(
      new Error(
        `WebSocket closed: Code ${event.code}, Reason: ${event.reason || 'No reason provided'}`
      )
    );
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    this.log('WebSocket error:', event);

    // Update statistics
    this.stats.errors++;

    // Emit error event
    this.emit('error', event);

    // Call onError callback
    if (this.options.onError) {
      this.options.onError(event);
    }
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    // Update statistics
    this.stats.messagesReceived++;
    this.stats.lastMessageTime = new Date();

    try {
      // Parse message if it's a string and autoJSONParse is enabled
      let data = event.data;

      if (typeof data === 'string' && this.options.autoJSONParse) {
        try {
          data = JSON.parse(data);

          // Handle pong message for latency calculation
          if (data.type === 'pong' && data.originalTimestamp) {
            const latency = Date.now() - data.originalTimestamp;
            this.recordLatency(latency);

            // Emit pong event
            this.emit('pong', {
              latency,
              timestamp: data.timestamp || Date.now(),
              originalTimestamp: data.originalTimestamp,
            });

            // Reset ping timeout
            if (this.pingTimeoutTimer) {
              clearTimeout(this.pingTimeoutTimer);
              this.pingTimeoutTimer = null;
            }
          }
        } catch (parseError) {
          // If parsing fails, use the raw string
          this.log('Error parsing message:', parseError);
          data = event.data;
        }
      }

      // Emit message event
      this.emit('message', data);

      // Call onMessage callback
      if (this.options.onMessage) {
        this.options.onMessage(data);
      }
    } catch (error) {
      this.log('Error handling WebSocket message:', error);
      this.stats.errors++;
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    // Don't attempt to reconnect if we've reached the max attempts
    if (this.reconnectAttempt >= this.options.maxReconnectAttempts!) {
      this.log('Maximum reconnect attempts reached');
      return;
    }

    // Update state and statistics
    this.updateState(ConnectionState.RECONNECTING);
    this.reconnectAttempt++;
    this.stats.reconnectAttempts++;

    // Calculate backoff delay with exponential backoff
    const delay = Math.min(
      this.options.reconnectInterval! *
        Math.pow(this.options.reconnectMultiplier!, this.reconnectAttempt - 1),
      this.options.maxReconnectInterval!
    );

    this.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempt}/${this.options.maxReconnectAttempts})`
    );

    // Set up reconnect timer
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;

      // Try to connect again
      this.connect()
        .then(() => {
          this.log('Reconnection successful');

          // Notify listeners
          this.emit('reconnect', { attempt: this.reconnectAttempt });

          // Call onReconnect callback
          if (this.options.onReconnect) {
            this.options.onReconnect();
          }
        })
        .catch(error => {
          this.log('Reconnection failed:', error);

          // If max attempts reached and fallback enabled, switch to polling
          if (
            this.reconnectAttempt >= this.options.maxReconnectAttempts! &&
            this.options.fallbackPolling
          ) {
            this.log('Max reconnect attempts reached, falling back to polling');
            this.initPolling();
          }
        });
    }, delay);
  }

  /**
   * Initialize polling fallback
   */
  private initPolling(): void {
    this.log('Initializing polling fallback');

    // Update state and transport type
    this.updateState(ConnectionState.USING_FALLBACK);
    this.transportType = TransportType.POLLING;

    // Set up polling interval
    this.pollingTimer = setInterval(() => {
      this.pollForMessages();
    }, this.options.fallbackPollingInterval);

    // Poll immediately
    this.pollForMessages();

    // Emit state change event
    this.emit('state_change', {
      state: ConnectionState.USING_FALLBACK,
      transportType: TransportType.POLLING,
    });
  }

  /**
   * Poll for messages using HTTP
   */
  private pollForMessages(): void {
    // Create a new abort controller for this request
    this.abortController = new AbortController();

    fetch(`${this.getBaseUrl()}/api/events?clientId=${this.clientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.options.headers,
      },
      signal: this.abortController.signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Polling failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
      })
      .then(data => {
        if (data) {
          // Update statistics
          this.stats.messagesReceived++;
          this.stats.lastMessageTime = new Date();

          // Emit message event
          this.emit('message', data);

          // Call onMessage callback
          if (this.options.onMessage) {
            this.options.onMessage(data);
          }
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          this.log('Error polling for messages:', error);
          this.stats.errors++;
        }
      });
  }

  /**
   * Send message via HTTP fallback
   * @param data Data to send
   * @returns Promise that resolves when message is sent
   */
  private sendViaHTTP(data: any): Promise<void> {
    // Create a new abort controller for this request
    this.abortController = new AbortController();

    return fetch(`${this.getBaseUrl()}${this.options.fallbackPollingEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.options.headers,
      },
      body: JSON.stringify({
        message: data,
        clientId: this.clientId,
        timestamp: Date.now(),
      }),
      signal: this.abortController.signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP send failed: ${response.status} ${response.statusText}`);
        }

        // Update statistics
        this.stats.messagesSent++;

        return response.json();
      })
      .then(data => {
        if (data) {
          // Emit message event for the response
          this.emit('message', data);

          // Call onMessage callback
          if (this.options.onMessage) {
            this.options.onMessage(data);
          }
        }
      });
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.log('Starting ping interval');

    // Clear any existing interval
    this.stopPingInterval();

    // Set up new interval
    this.pingTimer = setInterval(() => {
      this.sendPing();
    }, this.options.pingInterval);

    // Send initial ping
    this.sendPing();
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.pingTimeoutTimer) {
      clearTimeout(this.pingTimeoutTimer);
      this.pingTimeoutTimer = null;
    }
  }

  /**
   * Send ping message to server
   */
  private sendPing(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        const pingMessage = {
          type: 'ping',
          timestamp: Date.now(),
          clientId: this.clientId,
        };

        this.log('Sending ping');
        this.lastPingSent = pingMessage.timestamp;
        this.socket.send(JSON.stringify(pingMessage));

        // Set timeout for pong response
        if (this.pingTimeoutTimer) {
          clearTimeout(this.pingTimeoutTimer);
        }

        this.pingTimeoutTimer = setTimeout(() => {
          this.log('Ping timeout reached, connection may be dead');

          // If still connected, force close and reconnect
          if (
            this.socket &&
            (this.socket.readyState === WebSocket.OPEN ||
              this.socket.readyState === WebSocket.CONNECTING)
          ) {
            this.log('Forcing close due to ping timeout');
            this.socket.close(4000, 'Ping timeout');
            this.socket = null;

            // Attempt reconnect
            if (this.options.autoReconnect) {
              this.attemptReconnect();
            }
          }
        }, this.options.pingTimeout);
      } catch (error) {
        this.log('Error sending ping:', error);
      }
    }
  }

  /**
   * Send identification message to server
   */
  private sendIdentification(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        const identMessage = {
          type: 'identification',
          clientId: this.clientId,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          connectionType: 'robust-websocket-manager',
        };

        this.log('Sending identification');
        this.socket.send(JSON.stringify(identMessage));
      } catch (error) {
        this.log('Error sending identification:', error);
      }
    }
  }

  /**
   * Buffer a message for later sending
   */
  private bufferMessage(
    data: any,
    priority: MessagePriority,
    maxRetries: number,
    binary: boolean
  ): void {
    // Add to buffer
    this.messageBuffer.push({
      data,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
      binary,
    });

    // Sort buffer by priority (high first)
    this.messageBuffer.sort((a, b) => {
      const priorityMap: Record<MessagePriority, number> = {
        [MessagePriority.HIGH]: 0,
        [MessagePriority.NORMAL]: 1,
        [MessagePriority.LOW]: 2,
      };

      return priorityMap[a.priority] - priorityMap[b.priority];
    });

    // Update statistics
    this.stats.bufferedMessageCount = this.messageBuffer.length;
  }

  /**
   * Send buffered messages
   */
  private sendBufferedMessages(): void {
    if (this.messageBuffer.length === 0) {
      return;
    }

    this.log(`Sending ${this.messageBuffer.length} buffered messages`);

    // Clone the buffer to avoid modification during iteration
    const messages = [...this.messageBuffer];
    this.messageBuffer = [];

    // Update statistics
    this.stats.bufferedMessageCount = 0;

    // Send each message
    for (const message of messages) {
      this.send(message.data, {
        priority: message.priority,
        maxRetries: message.maxRetries - message.retryCount,
        binary: message.binary,
      }).catch(() => {
        // If sending fails, increment retry count
        message.retryCount++;

        // If max retries not reached, buffer again
        if (message.retryCount < message.maxRetries) {
          this.bufferMessage(message.data, message.priority, message.maxRetries, message.binary);
        } else {
          this.log(`Message dropped after ${message.retryCount} failed attempts`);
        }
      });
    }
  }

  /**
   * Clear all timers
   */
  private clearAllTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.pingTimeoutTimer) {
      clearTimeout(this.pingTimeoutTimer);
      this.pingTimeoutTimer = null;
    }

    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }

    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Update connection state and emit state change event
   */
  private updateState(state: ConnectionState): void {
    if (this.state !== state) {
      this.log(`State changed: ${this.state} -> ${state}`);
      this.state = state;
      this.stats.connectionState = state;

      // Emit state change event
      this.emit('state_change', {
        state,
        transportType: this.transportType,
        reconnectAttempt: this.reconnectAttempt,
      });
    }
  }

  /**
   * Record latency measurement
   */
  private recordLatency(latency: number): void {
    // Add to measurements, keeping only the last N
    this.latencyMeasurements.push(latency);

    if (this.latencyMeasurements.length > this.maxLatencyRecords) {
      this.latencyMeasurements.shift();
    }

    // Calculate average latency
    const sum = this.latencyMeasurements.reduce((a, b) => a + b, 0);
    this.stats.averageLatency = Math.round(sum / this.latencyMeasurements.length);
  }

  /**
   * Emit an event to all registered listeners
   */
  private emit(event: string, data: any): void {
    if (this.eventListeners.has(event)) {
      for (const callback of this.eventListeners.get(event)!) {
        try {
          callback(data);
        } catch (error) {
          this.log(`Error in ${event} event handler:`, error);
        }
      }
    }
  }

  /**
   * Get default WebSocket URL based on current location
   */
  private getDefaultWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  /**
   * Get base URL for HTTP requests
   */
  private getBaseUrl(): string {
    // Use current location as base
    return window.location.origin;
  }

  /**
   * Log message with optional data
   */
  private log(message: string, ...data: any[]): void {
    if (this.options.debug) {
      if (data.length > 0) {
      } else {
      }
    }
  }
}

// Create a singleton instance for easy importing
let defaultInstance: RobustWebSocketManager | null = null;

/**
 * Get the default WebSocket manager instance
 * @param options Optional configuration options
 * @returns RobustWebSocketManager instance
 */
export function getWebSocketManager(options: WebSocketManagerOptions = {}): RobustWebSocketManager {
  if (!defaultInstance) {
    defaultInstance = new RobustWebSocketManager(options);
  }

  return defaultInstance;
}

export default RobustWebSocketManager;
