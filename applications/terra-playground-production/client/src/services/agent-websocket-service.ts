/**
 * Agent WebSocket Service - Client Side
 *
 * This service provides WebSocket communication for the frontend to interact with agents.
 * It establishes a connection to the server-side WebSocket service and provides an API
 * for sending messages, receiving notifications, and handling agent updates.
 */

type MessageHandler = (message: any) => void;
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'errored';

/**
 * Client types for WebSocket connections
 */
export enum ClientType {
  FRONTEND = 'frontend',
  AGENT = 'agent',
  EXTENSION = 'extension',
}

export class AgentWebSocketService {
  private static instance: AgentWebSocketService;
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private clientId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // Start with 2 seconds
  private pingInterval: number | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private statusHandlers: Set<(status: ConnectionStatus) => void> = new Set();
  private pendingMessages: Array<{ type: string; payload: any }> = [];

  // Fallback mechanism
  private usingFallback: boolean = false;
  private pollingInterval: number | null = null;
  private pollingDelay: number = 3000; // 3 seconds between polls

  /**
   * Create a new agent WebSocket service (private constructor for singleton)
   */
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): AgentWebSocketService {
    if (!AgentWebSocketService.instance) {
      AgentWebSocketService.instance = new AgentWebSocketService();
    }
    return AgentWebSocketService.instance;
  }

  /**
   * Check if the service is using fallback polling instead of WebSockets
   */
  public isUsingFallback(): boolean {
    return this.usingFallback;
  }

  /**
   * Initialize the WebSocket connection
   */
  public connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (
        this.socket &&
        (this.socket.readyState === WebSocket.OPEN ||
          this.socket.readyState === WebSocket.CONNECTING)
      ) {
        resolve(true);
        return;
      }

      this.updateConnectionStatus('connecting');

      // Determine WebSocket URL (handle both HTTP and HTTPS)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      // Special handling for Replit environments
      const host = window.location.hostname;
      let baseUrl;

      // Get the current window location details
      const hostname = window.location.hostname;
      const port = window.location.port || (protocol === 'wss:' ? '443' : '80');

      // On Replit, we need to use the most direct approach
      // Just create a simple relative WebSocket URL from the current page
      const wsPath = '/api/agents/ws';

      // Construct protocol properly for WebSocket
      const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      const wsBaseUrl = wsProtocol + window.location.host;

      // Add debug logging to help diagnose connection issues
      // Primary WebSocket URL with proper protocol
      const primaryWsUrl = `${wsProtocol}${window.location.host}${wsPath}`;

      // Enhanced debug logging for WebSocket connection
      console.log(
        `[Agent WebSocket] Environment: ${
          window.location.hostname.includes('replit') ? 'Replit' : 'Local'
        }`
      );

      try {
        try {
          // Use a consistent approach for all environments
          // Just use the relative path approach which works in both local and Replit environments
          const relativePath = '/api/agents/ws';
          // Use the protocol from the current page
          const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${wsProtocol}//${window.location.host}${relativePath}`;

          this.socket = new WebSocket(wsUrl);
        } catch (wsError) {
          console.error('[Agent WebSocket] Error creating WebSocket connection:', wsError);
          // Immediately fall back to polling on error
          this.initPollingFallback();
          this.updateConnectionStatus('errored');
          reject(wsError);
          return;
        }

        // Add console logs for WebSocket events for debugging
        // Set a timeout for connection - if not successful within 5 seconds,
        // we'll treat this as a failed connection through this path
        this.connectionTimeout = setTimeout(() => {
          if (this.connectionStatus !== 'connected') {
            if (this.socket) {
              try {
                // Close the current connection attempt
                this.socket.close();
              } catch (closeError) {
                console.error('[Agent WebSocket] Error closing socket on timeout:', closeError);
              }
              this.socket = null;
            }

            // Mark timeout as handled by setting to null
            this.connectionTimeout = null;

            // Update status and use reject instead of throwing
            this.updateConnectionStatus('errored');
            reject(new Error('Connection timeout'));
          }
        }, 5000);

        // Setup event handlers
        this.socket.onopen = event => {
          this.handleSocketOpen(resolve);
        };

        this.socket.onmessage = event => {
          console.debug(`[Agent WebSocket] Received message: ${event.data}`);
          this.handleSocketMessage(event);
        };

        this.socket.onclose = event => {
          this.handleSocketClose(event, reject);
        };

        this.socket.onerror = error => {
          console.error('[Agent WebSocket] Connection error:', error);
          // Clear connection timeout if it exists
          if (this.connectionTimeout !== null) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.handleSocketError(error, reject);
        };
      } catch (error) {
        console.error('[Agent WebSocket] Error creating connection:', error);
        this.updateConnectionStatus('errored');
        reject(error);
      }
    });
  }

  /**
   * Handle WebSocket open event
   */
  private handleSocketOpen(resolve: (value: boolean) => void): void {
    this.updateConnectionStatus('connected');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 2000; // Reset reconnect delay

    // Clear connection timeout
    if (this.connectionTimeout !== null) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Start ping interval to keep connection alive
    this.startPingInterval();

    // Send authentication message
    this.sendAuthMessage()
      .then(() => {
        // Once authenticated, send any pending messages
        this.sendPendingMessages();
        resolve(true);
      })
      .catch(error => {
        console.error('Authentication failed:', error);
        this.updateConnectionStatus('errored');
        resolve(false);
      });
  }

  /**
   * Handle WebSocket message event
   */
  private handleSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      console.debug('Received WebSocket message:', message);

      // Handle connection acknowledgment
      if (message.type === 'connection_established') {
        this.clientId = message.clientId;
        console.log(`[Agent WebSocket] Client ID assigned: ${this.clientId}`);
      }

      // Handle authentication response
      if (message.type === 'auth_success') {
        console.log('[Agent WebSocket] Authentication successful');
      } else if (message.type === 'auth_failed') {
        console.error('Authentication failed:', message);
      }

      // Dispatch the message to registered handlers
      this.dispatchMessage(message);
    } catch (error) {
      console.error('Error handling WebSocket message:', error, event.data);
    }
  }

  /**
   * Handle WebSocket close event with enhanced diagnostics and recovery
   */
  private handleSocketClose(event: CloseEvent, reject: (reason: any) => void): void {
    // Log detailed close information with code meanings
    const codeInfo = this.getWebSocketCloseCodeInfo(event.code);
    console.log(
      `[Agent WebSocket] Connection closed: ${event.code} (${codeInfo.name}) - ${event.reason || 'No reason provided'}`
    );

    // Stop keeping the connection alive
    this.stopPingInterval();

    // Update connection status
    this.updateConnectionStatus('disconnected');

    // Clear connection timeout if it exists
    if (this.connectionTimeout !== null) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Log detailed diagnostics about the connection state
    this.dispatchMessage({
      type: 'connection_status',
      status: 'disconnected',
      closeEvent: {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        name: codeInfo.name,
        description: codeInfo.description,
      },
      timestamp: new Date().toISOString(),
    });

    // Handle different close codes appropriately
    switch (event.code) {
      case 1000: // Normal closure
        break;

      case 1001: // Going away (page refresh/navigation)
        break;

      case 1002: // Protocol error
      case 1003: // Unsupported data
      case 1007: // Invalid frame payload data
      case 1008: // Policy violation
      case 1010: // Mandatory extension missing
        // For these errors, try to reconnect a limited number of times with increasing delays
        console.log(
          `[Agent WebSocket] Protocol/Data error (${event.code}), attempting controlled reconnect`
        );
        this.attemptReconnect();
        break;

      case 1006: // Abnormal closure
        // This is the most common issue in real-world deployments
        console.log(
          `[Agent WebSocket] Abnormal closure detected (${event.code}), multiple reconnect strategy`
        );

        // For abnormal closures, try aggressive reconnection strategy
        // We'll try with shorter delays first, then fall back to polling if needed
        if (this.reconnectAttempts < 2) {
          // Quick reconnect for first couple of attempts (500ms)
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect().catch(() => {
              // If still failing after quick reconnect, try regular reconnect
              this.attemptReconnect();
            });
          }, 500);
        } else {
          // Regular reconnect with exponential backoff
          this.attemptReconnect();
        }
        break;

      case 1011: // Server error
      case 1012: // Server restart
      case 1013: // Try again later
        // For server-side issues, try reconnect with longer delays
        console.log(
          `[Agent WebSocket] Server error (${event.code}), delayed reconnect with backoff`
        );
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000); // Increase delay up to 10 seconds
        this.attemptReconnect();
        break;

      case 1015: // TLS handshake failure
        // For TLS errors, we may need to fall back to HTTP polling
        console.log(
          `[Agent WebSocket] TLS handshake failure (${event.code}), using polling fallback`
        );
        this.initPollingFallback();
        break;

      default:
        // For unknown close codes, attempt regular reconnect
        console.log(`[Agent WebSocket] Unknown close code (${event.code}), attempting reconnect`);
        this.attemptReconnect();
    }

    // For all non-normal closures, consider fallback if reconnect attempts are high
    if (
      event.code !== 1000 &&
      event.code !== 1001 &&
      this.reconnectAttempts >= this.maxReconnectAttempts - 1
    ) {
      console.log(
        '[Agent WebSocket] Max reconnect attempts reached, switching to polling fallback'
      );
      this.initPollingFallback();
    }

    reject(
      new Error(
        `WebSocket connection closed: ${event.code} - ${event.reason || 'No reason provided'}`
      )
    );
  }

  /**
   * Get information about WebSocket close codes
   */
  private getWebSocketCloseCodeInfo(code: number): { name: string; description: string } {
    const codeMap: Record<number, { name: string; description: string }> = {
      1000: {
        name: 'CLOSE_NORMAL',
        description: 'Normal closure; the connection successfully completed its purpose',
      },
      1001: {
        name: 'CLOSE_GOING_AWAY',
        description: 'Client is leaving (browser tab closing, page navigation, etc.)',
      },
      1002: {
        name: 'CLOSE_PROTOCOL_ERROR',
        description:
          'Protocol error, connection terminated due to malformed frame or other protocol violation',
      },
      1003: {
        name: 'CLOSE_UNSUPPORTED',
        description:
          'Unsupported data received; server/client cannot process the data type that was received',
      },
      1005: {
        name: 'CLOSE_NO_STATUS',
        description:
          'Reserved status; indicates no status code was provided even though one was expected',
      },
      1006: {
        name: 'CLOSE_ABNORMAL',
        description: 'Abnormal closure; connection was closed without a proper closing handshake',
      },
      1007: {
        name: 'CLOSE_INVALID_DATA',
        description: 'Invalid frame payload data; message contains inconsistent or invalid data',
      },
      1008: {
        name: 'CLOSE_POLICY_VIOLATION',
        description: 'Policy violation; message received violates policy',
      },
      1009: {
        name: 'CLOSE_TOO_LARGE',
        description: 'Message too large; data size exceeds limits',
      },
      1010: {
        name: 'CLOSE_MANDATORY_EXTENSION',
        description: "Client expected server to negotiate extension(s), but server didn't",
      },
      1011: {
        name: 'CLOSE_SERVER_ERROR',
        description: 'Server encountered an error and cannot continue processing the connection',
      },
      1012: {
        name: 'CLOSE_SERVICE_RESTART',
        description: 'Server is restarting',
      },
      1013: {
        name: 'CLOSE_TRY_AGAIN_LATER',
        description: 'Server temporarily cannot process request, try again later',
      },
      1015: {
        name: 'CLOSE_TLS_HANDSHAKE_FAIL',
        description: 'TLS handshake failed',
      },
    };

    return (
      codeMap[code] || {
        name: 'CLOSE_UNKNOWN',
        description: `Unknown close code (${code})`,
      }
    );
  }

  /**
   * Handle WebSocket error event
   */
  private handleSocketError(error: Event, reject: (reason: any) => void): void {
    // Log detailed error information
    console.error('[Agent WebSocket] Connection error:', error);

    // Additional diagnostics information
    // Update connection status
    this.updateConnectionStatus('errored');

    // Record error for monitoring
    this.dispatchMessage({
      type: 'connection_error',
      error: error.toString(),
      timestamp: new Date().toISOString(),
      reconnectAttempts: this.reconnectAttempts,
    });

    // Immediately attempt to reconnect with a shorter initial delay for errors
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const quickRetryDelay = 1000; // 1 second for first reconnect after error
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(err => {
          // Initialize polling fallback if immediate reconnect fails
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.initPollingFallback();
          }
        });
      }, quickRetryDelay);
    } else {
      // Initialize polling fallback if WebSocket fails after retries
      this.initPollingFallback();
    }

    reject(error);
  }

  /**
   * Initialize polling fallback when WebSocket fails
   */
  private initPollingFallback(): void {
    if (this.usingFallback) {
      return;
    }

    this.usingFallback = true;

    // Notify user that we're switching to fallback mode
    this.dispatchMessage({
      type: 'notification',
      title: 'Connection changed',
      message: 'Using polling fallback mode for agent communication',
      level: 'info',
      timestamp: Date.now(),
    });

    // Authenticate via REST since we're now in fallback mode
    this.authenticateViaRest().catch(err => {
      console.error('Failed to authenticate in fallback mode:', err);
    });

    // Start polling for messages at regular intervals
    this.startPollingInterval();
  }

  /**
   * Start polling interval for fallback mechanism
   */
  private startPollingInterval(): void {
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = window.setInterval(() => {
      this.pollForMessages();
    }, this.pollingDelay);
  }

  /**
   * Stop polling interval
   */
  private stopPollingInterval(): void {
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Poll for messages using REST API instead of WebSocket
   */
  private async pollForMessages(): Promise<void> {
    try {
      // Only log polling attempts when debugging is needed
      if (this.connectionStatus === 'connecting') {
        console.log('[Agent WebSocket] Starting polling attempt');
      }

      // Use the REST API to fetch any pending messages
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch('/api/agents/messages/pending', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to poll for messages: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.messages && Array.isArray(data.messages)) {
          // Process each message as if it came from WebSocket
          data.messages.forEach((message: any) => {
            this.dispatchMessage(message);
          });

          // If we received any messages, update connection status to reflect it's working
          if (data.messages.length > 0 && this.connectionStatus !== 'connected') {
            this.updateConnectionStatus('connected');
          }
        }

        // Successfully polled, so connection is at least functional at HTTP level
        if (this.connectionStatus === 'disconnected' || this.connectionStatus === 'errored') {
          this.updateConnectionStatus('connecting');

          // Notify the user that polling is working
          this.dispatchMessage({
            type: 'notification',
            title: 'Connection status',
            message: 'Using REST fallback for communication (WebSockets unavailable)',
            level: 'info',
            timestamp: Date.now(),
          });
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      // Only log errors occasionally to avoid flooding console
      if (Math.random() < 0.1) {
        // Log roughly 10% of errors
        console.error('Error polling for messages:', error);
      }

      // If polling fails repeatedly, mark as errored, but don't flood UI with notifications
      if (this.connectionStatus !== 'errored') {
        this.updateConnectionStatus('errored');
      }
    }
  }

  /**
   * Authenticate via REST API when WebSocket is not available
   */
  private async authenticateViaRest(): Promise<void> {
    try {
      const response = await fetch('/api/agents/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientType: ClientType.FRONTEND,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        this.clientId = data.clientId || 'rest-fallback-client';
        // Simulate authentication success message
        this.dispatchMessage({
          type: 'auth_success',
          clientId: this.clientId,
          timestamp: Date.now(),
        });

        return;
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Error authenticating via REST:', error);

      // Simulate authentication failure message
      this.dispatchMessage({
        type: 'auth_failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  /**
   * Send authentication message
   */
  private async sendAuthMessage(): Promise<void> {
    return new Promise((resolve, reject) => {
      // If using fallback, authenticate via REST API
      if (this.usingFallback) {
        this.authenticateViaRest()
          .then(() => resolve())
          .catch((error: Error) => reject(error));
        return;
      }

      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        // Setup a one-time handler for authentication response
        const authHandler = (message: any) => {
          if (message.type === 'auth_success') {
            this.off('auth_success', authHandler);
            this.off('auth_failed', authErrorHandler);
            resolve();
          }
        };

        const authErrorHandler = (message: any) => {
          if (message.type === 'auth_failed') {
            this.off('auth_success', authHandler);
            this.off('auth_failed', authErrorHandler);
            reject(new Error(message.message || 'Authentication failed'));
          }
        };

        this.on('auth_success', authHandler);
        this.on('auth_failed', authErrorHandler);

        // Send the authentication message
        const authMessage = {
          type: 'auth',
          clientType: ClientType.FRONTEND,
          clientId: this.clientId,
        };

        this.socket.send(JSON.stringify(authMessage));
      } catch (error) {
        console.error('Error sending authentication message:', error);
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect to the WebSocket server with enhanced strategy
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Initialize polling fallback when max reconnects are exhausted
      this.initPollingFallback();

      // Notify about connection failure and fallback
      this.dispatchMessage({
        type: 'connection_status',
        status: 'fallback_mode',
        attempts: this.reconnectAttempts,
        message: 'Switched to API polling after WebSocket reconnection failed',
        timestamp: new Date().toISOString(),
      });

      return;
    }

    this.reconnectAttempts++;

    // Implement exponential backoff with jitter for better connection dispersion
    // Base delay: 2 seconds, max delay: 30 seconds
    const baseDelay = this.reconnectDelay;
    const exponentialPart = baseDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
    const delay = Math.min(30000, exponentialPart + jitter);

    console.log(
      `[Agent WebSocket] Attempting reconnection, delay: ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    // Update connection status to show reconnecting
    this.updateConnectionStatus('connecting');

    // Dispatch reconnect attempt message
    this.dispatchMessage({
      type: 'connection_status',
      status: 'reconnecting',
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      nextAttemptIn: Math.round(delay),
      timestamp: new Date().toISOString(),
    });

    setTimeout(() => {
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        // Close any existing socket to ensure clean state
        if (this.socket) {
          try {
            this.socket.close();
          } catch (err) {
            console.error('[Agent WebSocket] Error closing existing socket:', err);
          }
          this.socket = null;
        }

        this.connect()
          .then(success => {
            if (success) {
              // Dispatch reconnect success message
              this.dispatchMessage({
                type: 'connection_status',
                status: 'reconnected',
                attempts: this.reconnectAttempts,
                timestamp: new Date().toISOString(),
              });

              // Reset the reconnect counter on success
              this.reconnectAttempts = 0;
            } else {
              // If not at max attempts, try again recursively
              if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.attemptReconnect();
              }
            }
          })
          .catch(error => {
            console.error('[Agent WebSocket] Error during reconnection:', error);

            // If not at max attempts, try again after error
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              this.attemptReconnect();
            } else {
              // Initialize polling fallback after all retries fail
              this.initPollingFallback();
            }
          });
      }
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.stopPingInterval(); // Clear any existing interval

    this.pingInterval = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop the ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Send a message to an agent
   *
   * @param recipientId Agent ID to send the message to
   * @param message Message payload
   * @returns Promise that resolves when the message is acknowledged
   */
  public sendAgentMessage(recipientId: string, message: any): Promise<string> {
    return new Promise((resolve, reject) => {
      // If using fallback, send via REST API instead
      if (this.usingFallback) {
        this.sendAgentMessageViaRest(recipientId, message)
          .then(messageId => resolve(messageId))
          .catch((error: Error) => reject(error));
        return;
      }

      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        this.pendingMessages.push({
          type: 'agent_message',
          payload: {
            message: {
              recipientId,
              ...message,
            },
          },
        });
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        // Create a handler for message acknowledgment
        const ackHandler = (response: any) => {
          if (
            response.type === 'message_sent' &&
            response.originalMessage?.recipientId === recipientId
          ) {
            this.off('message_sent', ackHandler);
            this.off('error', errorHandler);
            resolve(response.messageId);
          }
        };

        const errorHandler = (response: any) => {
          if (response.type === 'error' && response.code === 'MESSAGE_SEND_FAILED') {
            this.off('message_sent', ackHandler);
            this.off('error', errorHandler);
            reject(new Error(response.message));
          }
        };

        this.on('message_sent', ackHandler);
        this.on('error', errorHandler);

        // Send the message
        const messageToSend = {
          type: 'agent_message',
          message: {
            recipientId,
            ...message,
          },
        };

        this.socket.send(JSON.stringify(messageToSend));
      } catch (error) {
        console.error('Error sending agent message:', error);
        reject(error);
      }
    });
  }

  /**
   * Send an action request to an agent
   *
   * @param targetAgent Agent ID to send the action to
   * @param action Action to perform
   * @param params Parameters for the action
   * @returns Promise that resolves when the action is acknowledged
   */
  public sendActionRequest(targetAgent: string, action: string, params: any = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      // If using fallback, send via REST API instead
      if (this.usingFallback) {
        this.sendActionRequestViaRest(targetAgent, action, params)
          .then((messageId: string) => resolve(messageId))
          .catch((error: Error) => reject(error));
        return;
      }

      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        this.pendingMessages.push({
          type: 'action',
          payload: {
            targetAgent,
            action,
            params,
          },
        });
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        // Create a handler for action acknowledgment
        const ackHandler = (response: any) => {
          if (
            response.type === 'action_sent' &&
            response.targetAgent === targetAgent &&
            response.action === action
          ) {
            this.off('action_sent', ackHandler);
            this.off('error', errorHandler);
            resolve(response.messageId);
          }
        };

        const errorHandler = (response: any) => {
          if (response.type === 'error' && response.code === 'ACTION_SEND_FAILED') {
            this.off('action_sent', ackHandler);
            this.off('error', errorHandler);
            reject(new Error(response.message));
          }
        };

        this.on('action_sent', ackHandler);
        this.on('error', errorHandler);

        // Send the action request
        const actionRequest = {
          type: 'action',
          targetAgent,
          action,
          params,
        };

        this.socket.send(JSON.stringify(actionRequest));
      } catch (error) {
        console.error('Error sending action request:', error);
        reject(error);
      }
    });
  }

  /**
   * Send an agent message via REST API
   *
   * @param recipientId Agent ID to send the message to
   * @param message Message payload
   * @returns Promise that resolves when the message is acknowledged
   */
  private async sendAgentMessageViaRest(recipientId: string, message: any): Promise<string> {
    try {
      const response = await fetch('/api/agents/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send message via REST: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.success) {
        // Simulate message sent
        this.dispatchMessage({
          type: 'message_sent',
          messageId: data.messageId || `rest-${Date.now()}`,
          originalMessage: {
            recipientId,
            ...message,
          },
          timestamp: Date.now(),
        });

        return data.messageId || `rest-${Date.now()}`;
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending agent message via REST:', error);
      throw error;
    }
  }

  /**
   * Send an action request via REST API
   *
   * @param targetAgent Agent ID to send the action to
   * @param action Action to perform
   * @param params Parameters for the action
   * @returns Promise that resolves when the action is acknowledged
   */
  private async sendActionRequestViaRest(
    targetAgent: string,
    action: string,
    params: any = {}
  ): Promise<string> {
    try {
      const response = await fetch('/api/agents/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetAgent,
          action,
          params,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send action via REST: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.success) {
        // Simulate action sent
        this.dispatchMessage({
          type: 'action_sent',
          messageId: data.messageId || `rest-action-${Date.now()}`,
          targetAgent,
          action,
          params,
          timestamp: Date.now(),
        });

        return data.messageId || `rest-action-${Date.now()}`;
      } else {
        throw new Error(data.message || 'Failed to send action');
      }
    } catch (error) {
      console.error('Error sending action request via REST:', error);
      throw error;
    }
  }

  /**
   * Send pending messages after reconnection
   */
  private sendPendingMessages(): void {
    if (this.pendingMessages.length === 0) {
      return;
    }

    // Copy and clear pending messages
    const messages = [...this.pendingMessages];
    this.pendingMessages = [];

    // Send each message
    messages.forEach(({ type, payload }) => {
      if (type === 'agent_message') {
        this.sendAgentMessage(payload.message.recipientId, payload.message).catch(error =>
          console.error('Error sending pending agent message:', error)
        );
      } else if (type === 'action') {
        this.sendActionRequest(payload.targetAgent, payload.action, payload.params).catch(error =>
          console.error('Error sending pending action request:', error)
        );
      }
    });
  }

  /**
   * Register a handler for a specific message type
   *
   * @param type Message type to listen for
   * @param handler Handler function to call when a message of this type is received
   * @returns Unsubscribe function
   */
  public on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    this.messageHandlers.get(type)?.add(handler);

    // Return unsubscribe function
    return () => {
      this.off(type, handler);
    };
  }

  /**
   * Remove a handler for a specific message type
   *
   * @param type Message type
   * @param handler Handler function to remove
   */
  public off(type: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Dispatch a message to registered handlers
   *
   * @param message Message to dispatch
   */
  private dispatchMessage(message: any): void {
    if (!message.type) {
      console.warn('Received message without type:', message);
      return;
    }

    // Get handlers for this message type
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for ${message.type}:`, error);
        }
      });
    }

    // Also dispatch to wildcard handlers
    const wildcardHandlers = this.messageHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in wildcard message handler:`, error);
        }
      });
    }
  }

  /**
   * Update connection status and notify handlers
   *
   * @param status New connection status
   */
  private updateConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;

      // Notify status handlers
      this.statusHandlers.forEach(handler => {
        try {
          handler(status);
        } catch (error) {
          console.error('Error in connection status handler:', error);
        }
      });
    }
  }

  /**
   * Register a connection status handler
   *
   * @param handler Handler function to call when connection status changes
   * @returns Unsubscribe function
   */
  public onConnectionStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);

    // Call handler immediately with current status
    handler(this.connectionStatus);

    // Return unsubscribe function
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Close the WebSocket connection
   */
  public disconnect(): void {
    this.stopPingInterval();

    // Clear connection timeout if active
    if (this.connectionTimeout !== null) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.socket) {
      this.socket.close(1000, 'Client disconnected');
      this.socket = null;
    }

    this.updateConnectionStatus('disconnected');
  }
}

// Export singleton instance
export const agentWebSocketService = AgentWebSocketService.getInstance();
