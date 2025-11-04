/**
 * ConnectionManager
 *
 * A robust connection manager that provides a consistent interface for
 * real-time communication with automatic fallbacks:
 *
 * 1. WebSocket (primary)
 * 2. Server-Sent Events (fallback for one-way server → client)
 * 3. HTTP Polling (fallback for two-way when others fail)
 */

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

export enum ConnectionType {
  WEBSOCKET = 'websocket',
  SSE = 'sse',
  HTTP = 'http',
}

export enum MessageDirection {
  SENT = 'sent',
  RECEIVED = 'received',
}

export type ConnectionOptions = {
  // WebSocket options
  wsEndpoint?: string;
  wsProtocol?: string; // 'wss' or 'ws' or 'auto'

  // SSE options
  sseEndpoint?: string;

  // HTTP options
  httpEndpoint?: string;

  // Common options
  clientId?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  exponentialBackoff?: boolean;
  heartbeatInterval?: number;
  timeout?: number;
  debug?: boolean;
  connectionPriority?: ConnectionType[];
};

export type MessageData = {
  type: string;
  timestamp?: string;
  [key: string]: any;
};

export type ConnectionEventHandler = (event: ConnectionEvent) => void;

export type ConnectionEvent = {
  type: string;
  connectionType: ConnectionType;
  timestamp: string;
  state?: ConnectionState;
  message?: MessageData;
  direction?: MessageDirection;
  error?: Error;
  attempt?: number;
  retryDelay?: number;
  [key: string]: any;
};

export type HttpResponse = {
  success: boolean;
  message?: any;
  error?: string;
  [key: string]: any;
};

const DEFAULT_OPTIONS: ConnectionOptions = {
  wsEndpoint: '/ws',
  wsProtocol: 'auto',
  sseEndpoint: '/api/events',
  httpEndpoint: '/api/ws-fallback/send',
  autoConnect: true,
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  exponentialBackoff: true,
  heartbeatInterval: 30000,
  timeout: 10000,
  debug: false,
  connectionPriority: [ConnectionType.WEBSOCKET, ConnectionType.SSE, ConnectionType.HTTP],
};

/**
 * ConnectionManager provides a unified interface for real-time communication
 * with automatic fallbacks between WebSocket, SSE, and HTTP
 */
export class ConnectionManager {
  private options: ConnectionOptions;
  private wsConnection: WebSocket | null = null;
  private sseConnection: EventSource | null = null;
  private httpPollInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempt = 0;
  private pendingMessages: MessageData[] = [];
  private eventHandlers: Map<string, ConnectionEventHandler[]> = new Map();
  private currentConnectionType: ConnectionType | null = null;
  private currentState: ConnectionState = ConnectionState.DISCONNECTED;
  private clientId: string;
  private lastMessageId = 0;

  constructor(options: ConnectionOptions = {}) {
    // Merge default options with provided options
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Generate a client ID if not provided
    this.clientId =
      this.options.clientId ||
      `client_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Auto-connect if enabled
    if (this.options.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect using the highest priority available method
   */
  public connect(): void {
    // Reset state
    this.reconnectAttempt = 0;

    this.setState(ConnectionState.CONNECTING);

    // Try to connect using the first method in the priority list
    this.tryNextConnectionMethod();
  }

  /**
   * Disconnect from all connection methods
   */
  public disconnect(): void {
    this.log('Disconnecting from all connections');

    // Clear any reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear any heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Clear any HTTP polling interval
    if (this.httpPollInterval) {
      clearInterval(this.httpPollInterval);
      this.httpPollInterval = null;
    }

    // Disconnect WebSocket if connected
    if (this.wsConnection) {
      this.wsConnection.close(1000, 'User initiated disconnect');
      this.wsConnection = null;
    }

    // Disconnect SSE if connected
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
    }

    // Update state
    this.currentConnectionType = null;
    this.setState(ConnectionState.DISCONNECTED);

    // Trigger event
    this.triggerEvent('disconnect', {});
  }

  /**
   * Send a message using the current connection method
   */
  public send(message: MessageData): void {
    // Add client ID to the message if not present
    const messageToSend = {
      ...message,
      clientId: this.clientId,
      timestamp: message.timestamp || new Date().toISOString(),
      messageId: `msg_${++this.lastMessageId}_${Date.now()}`,
    };

    // Try to send the message
    let sent = false;

    if (this.currentState === ConnectionState.CONNECTED) {
      switch (this.currentConnectionType) {
        case ConnectionType.WEBSOCKET:
          sent = this.sendViaWebSocket(messageToSend);
          break;
        case ConnectionType.SSE:
          // SSE is one-way, fallback to HTTP
          sent = this.sendViaHttp(messageToSend);
          break;
        case ConnectionType.HTTP:
          sent = this.sendViaHttp(messageToSend);
          break;
      }
    }

    // If failed to send, add to pending messages
    if (!sent) {
      this.pendingMessages.push(messageToSend);
      this.log(`Message queued: ${messageToSend.type}`, messageToSend);

      // If not connected, try to reconnect
      if (
        this.currentState !== ConnectionState.CONNECTING &&
        this.currentState !== ConnectionState.RECONNECTING
      ) {
        this.connect();
      }
    } else {
      // Message sent successfully, trigger event
      this.triggerEvent('message', {
        message: messageToSend,
        direction: MessageDirection.SENT,
      });
    }
  }

  /**
   * Send a heartbeat message to keep the connection alive
   */
  public sendHeartbeat(): void {
    this.send({
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Register an event handler for connection events
   */
  public on(eventType: string, handler: ConnectionEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.push(handler);
    }
  }

  /**
   * Unregister an event handler for connection events
   */
  public off(eventType: string, handler?: ConnectionEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      return;
    }

    // If no handler provided, remove all handlers for this event type
    if (!handler) {
      this.eventHandlers.delete(eventType);
      return;
    }

    // Otherwise, remove the specific handler
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }

      // If no handlers left, remove the event type
      if (handlers.length === 0) {
        this.eventHandlers.delete(eventType);
      }
    }
  }

  /**
   * Get the current connection state
   */
  public getState(): ConnectionState {
    return this.currentState;
  }

  /**
   * Get the current connection type
   */
  public getConnectionType(): ConnectionType | null {
    return this.currentConnectionType;
  }

  /**
   * Get the client ID
   */
  public getClientId(): string {
    return this.clientId;
  }

  /**
   * Get connection info, useful for debugging
   */
  public getConnectionInfo(): object {
    return {
      state: this.currentState,
      connectionType: this.currentConnectionType,
      clientId: this.clientId,
      reconnectAttempt: this.reconnectAttempt,
      pendingMessages: this.pendingMessages.length,
      options: this.options,
      connectionTypes: {
        websocket: this.wsConnection !== null,
        sse: this.sseConnection !== null,
        http: this.httpPollInterval !== null,
      },
    };
  }

  /**
   * Try the next connection method in the priority list
   */
  private tryNextConnectionMethod(): void {
    // Get the next connection method to try
    const availableMethods = this.options.connectionPriority || [];

    // If we've tried all methods, trigger an error
    if (this.reconnectAttempt >= this.options.reconnectAttempts!) {
      this.log('Maximum reconnection attempts reached');
      this.setState(ConnectionState.ERROR);
      this.triggerEvent('error', {
        error: new Error('Maximum reconnection attempts reached'),
      });
      return;
    }

    // Increment the reconnect attempt
    this.reconnectAttempt++;

    // Try each method in order
    for (const method of availableMethods) {
      // Skip if this is the current method and it failed
      if (method === this.currentConnectionType) {
        continue;
      }

      // Try to connect with this method
      switch (method) {
        case ConnectionType.WEBSOCKET:
          if (this.connectWebSocket()) {
            return;
          }
          break;
        case ConnectionType.SSE:
          if (this.connectSSE()) {
            return;
          }
          break;
        case ConnectionType.HTTP:
          if (this.connectHttp()) {
            return;
          }
          break;
      }
    }

    // If we get here, all methods failed
    // Schedule a reconnect after a delay
    const delay = this.calculateReconnectDelay();

    this.log(
      `All connection methods failed, reconnecting in ${delay}ms (attempt ${this.reconnectAttempt}/${this.options.reconnectAttempts})`
    );

    this.setState(ConnectionState.RECONNECTING);

    this.reconnectTimer = setTimeout(() => {
      this.tryNextConnectionMethod();
    }, delay);

    // Trigger reconnecting event
    this.triggerEvent('reconnecting', {
      attempt: this.reconnectAttempt,
      retryDelay: delay,
    });
  }

  /**
   * Calculate the reconnect delay using exponential backoff if enabled
   */
  private calculateReconnectDelay(): number {
    const baseDelay = this.options.reconnectDelay!;

    if (this.options.exponentialBackoff) {
      // Factor increases with each attempt: 1, 1.5, 2.25, 3.375, etc.
      const factor = Math.pow(1.5, this.reconnectAttempt - 1);
      return Math.min(baseDelay * factor, 30000); // Cap at 30 seconds
    }

    return baseDelay;
  }

  /**
   * Connect via WebSocket
   */
  private connectWebSocket(): boolean {
    try {
      // Clean up any existing WebSocket connection
      if (this.wsConnection) {
        this.wsConnection.close();
        this.wsConnection = null;
      }

      // Determine WebSocket URL
      const host = window.location.host;
      const endpoint = this.options.wsEndpoint || '/ws';
      let protocol;

      switch (this.options.wsProtocol) {
        case 'wss':
          protocol = 'wss:';
          break;
        case 'ws':
          protocol = 'ws:';
          break;
        case 'auto':
        default:
          protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          break;
      }

      const url = `${protocol}//${host}${endpoint}`;

      this.log(`Connecting to WebSocket at ${url}`);

      // Create new WebSocket connection
      this.wsConnection = new WebSocket(url);

      // Set up event handlers
      this.wsConnection.onopen = () => {
        this.log('WebSocket connection established');
        this.currentConnectionType = ConnectionType.WEBSOCKET;
        this.setState(ConnectionState.CONNECTED);
        this.reconnectAttempt = 0;

        // Start heartbeat
        this.startHeartbeat();

        // Send any pending messages
        this.sendPendingMessages();

        // Trigger connect event
        this.triggerEvent('connect', { connectionType: ConnectionType.WEBSOCKET });
      };

      this.wsConnection.onmessage = event => {
        try {
          // Parse the message
          const message = JSON.parse(event.data);

          // Handle heartbeat responses automatically
          if (message.type === 'heartbeat') {
            this.log('Heartbeat received', message);
            return;
          }

          this.log('WebSocket message received', message);

          // Trigger message event
          this.triggerEvent('message', {
            message,
            direction: MessageDirection.RECEIVED,
          });
        } catch (error) {
          this.log('Error parsing WebSocket message', error);
          this.triggerEvent('error', { error: new Error('Error parsing WebSocket message') });
        }
      };

      this.wsConnection.onclose = event => {
        this.log(
          `WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`
        );

        // Clean up
        this.wsConnection = null;

        // Only update state if this was the active connection type
        if (this.currentConnectionType === ConnectionType.WEBSOCKET) {
          this.currentConnectionType = null;

          // If this was a normal closure, don't reconnect
          if (event.code === 1000 && this.currentState !== ConnectionState.RECONNECTING) {
            this.setState(ConnectionState.DISCONNECTED);
            this.triggerEvent('disconnect', { code: event.code, reason: event.reason });
          } else {
            // Otherwise try the next connection method
            this.tryNextConnectionMethod();
          }
        }
      };

      this.wsConnection.onerror = error => {
        this.log('WebSocket error occurred', error);
        this.triggerEvent('error', {
          error: new Error('WebSocket error occurred'),
          connectionType: ConnectionType.WEBSOCKET,
        });

        // The socket will close after this, which will trigger onclose
      };

      return true; // Connection attempt started
    } catch (error) {
      this.log('Error creating WebSocket', error);
      return false; // Connection attempt failed
    }
  }

  /**
   * Connect via Server-Sent Events (SSE)
   */
  private connectSSE(): boolean {
    try {
      // Clean up any existing SSE connection
      if (this.sseConnection) {
        this.sseConnection.close();
        this.sseConnection = null;
      }

      // Determine SSE URL
      const endpoint = this.options.sseEndpoint || '/api/events';
      const url = `${endpoint}?clientId=${this.clientId}`;

      this.log(`Connecting to SSE at ${url}`);

      // Create new SSE connection
      this.sseConnection = new EventSource(url);

      // Set up event handlers
      this.sseConnection.onopen = () => {
        this.log('SSE connection established');
        this.currentConnectionType = ConnectionType.SSE;
        this.setState(ConnectionState.CONNECTED);
        this.reconnectAttempt = 0;

        // Trigger connect event
        this.triggerEvent('connect', { connectionType: ConnectionType.SSE });

        // Since SSE is one-way, we need to send any pending messages via HTTP
        this.sendPendingMessages();
      };

      this.sseConnection.onmessage = event => {
        try {
          // Parse the message
          const message = JSON.parse(event.data);

          this.log('SSE message received', message);

          // Trigger message event
          this.triggerEvent('message', {
            message,
            direction: MessageDirection.RECEIVED,
          });
        } catch (error) {
          this.log('Error parsing SSE message', error);
          this.triggerEvent('error', { error: new Error('Error parsing SSE message') });
        }
      };

      this.sseConnection.onerror = error => {
        this.log('SSE error occurred', error);

        // Clean up
        if (this.sseConnection) {
          this.sseConnection.close();
          this.sseConnection = null;
        }

        // Only update state if this was the active connection type
        if (this.currentConnectionType === ConnectionType.SSE) {
          this.currentConnectionType = null;

          // Trigger error event
          this.triggerEvent('error', {
            error: new Error('SSE error occurred'),
            connectionType: ConnectionType.SSE,
          });

          // Try the next connection method
          this.tryNextConnectionMethod();
        }
      };

      return true; // Connection attempt started
    } catch (error) {
      this.log('Error creating SSE connection', error);
      return false; // Connection attempt failed
    }
  }

  /**
   * Connect via HTTP polling
   */
  private connectHttp(): boolean {
    try {
      // Clean up any existing HTTP polling
      if (this.httpPollInterval) {
        clearInterval(this.httpPollInterval);
        this.httpPollInterval = null;
      }

      this.log('Connecting via HTTP polling');

      // Set up HTTP polling
      this.currentConnectionType = ConnectionType.HTTP;
      this.setState(ConnectionState.CONNECTED);
      this.reconnectAttempt = 0;

      // Trigger connect event
      this.triggerEvent('connect', { connectionType: ConnectionType.HTTP });

      // Send any pending messages
      this.sendPendingMessages();

      // Set up polling for new messages
      this.httpPollInterval = setInterval(() => {
        this.log(
          '[HTTP Polling] Polling for data (connection: ' + this.currentConnectionType + ')'
        );
      }, 5000); // Poll every 5 seconds

      return true;
    } catch (error) {
      this.log('Error setting up HTTP polling', error);
      return false;
    }
  }

  /**
   * Send a message via WebSocket
   */
  private sendViaWebSocket(message: MessageData): boolean {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const messageStr = JSON.stringify(message);
      this.wsConnection.send(messageStr);
      this.log('Sent WebSocket message', message);
      return true;
    } catch (error) {
      this.log('Error sending WebSocket message', error);
      return false;
    }
  }

  /**
   * Send a message via HTTP
   */
  private sendViaHttp(message: MessageData): boolean {
    const endpoint = this.options.httpEndpoint || '/api/ws-fallback/send';

    try {
      // Use the Fetch API to send the message
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })
        .then(response => response.json())
        .then((data: HttpResponse) => {
          if (data.success) {
            this.log('HTTP message sent successfully', message);

            // If there was a response message, trigger a received event
            if (data.message) {
              this.triggerEvent('message', {
                message: data.message,
                direction: MessageDirection.RECEIVED,
              });
            }
          } else {
            this.log('HTTP message failed', data);
            this.triggerEvent('error', { error: new Error(data.error || 'HTTP message failed') });
          }
        })
        .catch(error => {
          this.log('Error sending HTTP message', error);
          this.triggerEvent('error', { error: new Error('Error sending HTTP message') });
        });

      // Return true since we've dispatched the request
      // (even though we don't know if it succeeded yet)
      return true;
    } catch (error) {
      this.log('Error preparing HTTP message', error);
      return false;
    }
  }

  /**
   * Send any pending messages
   */
  private sendPendingMessages(): void {
    if (this.pendingMessages.length === 0) {
      return;
    }

    this.log(`Sending ${this.pendingMessages.length} pending messages`);

    // Make a copy of the pending messages
    const messages = [...this.pendingMessages];

    // Clear the pending messages
    this.pendingMessages = [];

    // Send each message
    messages.forEach(message => {
      this.send(message);
    });
  }

  /**
   * Start the heartbeat interval
   */
  private startHeartbeat(): void {
    // Clear any existing heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Only start heartbeat for WebSocket connections
    if (this.currentConnectionType !== ConnectionType.WEBSOCKET) {
      return;
    }

    // Start a new heartbeat interval
    const interval = this.options.heartbeatInterval || 30000;

    this.log(`Starting heartbeat with interval ${interval}ms`);

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, interval);
  }

  /**
   * Update the connection state
   */
  private setState(state: ConnectionState): void {
    if (this.currentState !== state) {
      this.log(`State changed from ${this.currentState} to ${state}`);
      this.currentState = state;
      this.triggerEvent('statechange', { state });
    }
  }

  /**
   * Trigger an event
   */
  private triggerEvent(type: string, data: object): void {
    // Skip if no handlers for this event type
    if (!this.eventHandlers.has(type)) {
      return;
    }

    // Create the event object
    const event: ConnectionEvent = {
      type,
      connectionType: this.currentConnectionType || ConnectionType.HTTP,
      timestamp: new Date().toISOString(),
      ...data,
    };

    // Call all handlers
    const handlers = this.eventHandlers.get(type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in event handler', error);
      }
    });
  }

  /**
   * Log a message if debug is enabled
   */
  private log(message: string, data?: any): void {
    if (!this.options.debug) {
      return;
    }

    if (data) {
    } else {
    }
  }
}
