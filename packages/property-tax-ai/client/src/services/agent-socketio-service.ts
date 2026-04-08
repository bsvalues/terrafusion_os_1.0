/**
 * Agent Socket.IO Service
 * 
 * This service provides Socket.IO communication for the agent system,
 * allowing real-time communication between the frontend and backend agents.
 * This replaces the raw WebSocket implementation with Socket.IO for better
 * reliability, especially in the Replit environment which has issues with
 * raw WebSockets.
 * 
 * Enhanced with connection resilience features including:
 * - Automatic fallback to REST API when WebSocket fails
 * - Connection metrics tracking and error logging
 * - Reconnection strategy with exponential backoff
 * - User notifications for connection status
 */

import { io, Socket } from 'socket.io-client';
import { connectionMetricsService } from './connection-metrics';

/**
 * Simple browser-compatible EventEmitter implementation
 * This replaces Node's EventEmitter with a browser-compatible version
 */
class BrowserEventEmitter {
  private events: Map<string, Array<(data: any) => void>> = new Map();

  /**
   * Register an event listener
   * 
   * @param event Event name
   * @param listener Function to call when event occurs
   * @returns Function to remove the listener
   */
  public on(event: string, listener: (data: any) => void): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event)!;
    listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.off(event, listener);
    };
  }

  /**
   * Remove an event listener
   * 
   * @param event Event name
   * @param listener Function to remove
   */
  public off(event: string, listener: (data: any) => void): void {
    if (!this.events.has(event)) {
      return;
    }

    const listeners = this.events.get(event)!;
    const index = listeners.indexOf(listener);

    if (index !== -1) {
      listeners.splice(index, 1);
    }

    // If no more listeners, remove the event
    if (listeners.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Emit an event
   * 
   * @param event Event name
   * @param data Data to pass to listeners
   */
  public emit(event: string, data: any): void {
    if (!this.events.has(event)) {
      return;
    }

    const listeners = this.events.get(event)!;

    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    }
  }

  /**
   * Remove all listeners for an event, or all events
   * 
   * @param event Optional event name, if not provided all listeners are removed
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

/**
 * Client type for agent communication
 */
export enum ClientType {
  FRONTEND = 'frontend',
  AGENT = 'agent',
  EXTENSION = 'extension'
}

/**
 * Connection status for agent communication
 */
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERRORED = 'errored'
}

/**
 * Agent Socket.IO Service
 * Provides Socket.IO-based real-time communication with the agent system
 */
export class AgentSocketIOService extends BrowserEventEmitter {
  private socket: Socket | null = null;
  private clientId: string;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private pollingInterval: ReturnType<typeof setTimeout> | null = null;
  private pollingFrequency: number = 3000; // 3 seconds
  private pendingMessages: any[] = [];
  private usingFallback: boolean = false;
  private statusChangeListeners: ((status: ConnectionStatus) => void)[] = [];
  private connectPromise: Promise<boolean> | null = null;
  private connectResolve: ((success: boolean) => void) | null = null;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private reconnectDelay: number = 1000;
  private pingInterval: ReturnType<typeof setTimeout> | null = null;

  /**
   * Create a new agent Socket.IO service
   * 
   * @param options Configuration options
   */
  constructor(options: {
    clientId?: string;
    pollingFrequency?: number;
    maxReconnectAttempts?: number;
  } = {}) {
    super();
    this.clientId = options.clientId || `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (options.pollingFrequency) {
      this.pollingFrequency = options.pollingFrequency;
    }

    if (options.maxReconnectAttempts) {
      this.maxReconnectAttempts = options.maxReconnectAttempts;
    }
  }

  /**
   * Connect to the agent system
   * 
   * @returns Promise that resolves when connected
   */
  public connect(): Promise<boolean> {
    // If we already have a pending connect promise, return it
    if (this.connectPromise) {
      return this.connectPromise;
    }

    // Create a new connect promise
    this.connectPromise = new Promise((resolve) => {
      this.connectResolve = resolve;

      try {
        // Update connection status
        this.updateConnectionStatus(ConnectionStatus.CONNECTING);

        // Get the current host and protocol
        const host = window.location.host;
        const isSecure = window.location.protocol === 'https:';
        const path = '/api/agents/socket.io';
        
        // Construct base URL
        const baseUrl = isSecure ? 'https://' : 'http://';
        const wsUrl = `${baseUrl}${host}`;

        // Log connection attempt
        console.log(`[Agent SocketIO] Attempting to connect to: ${wsUrl} with path ${path}`);


        // Use the current host for both dev and prod
        const socketUrl = window.location.origin;


        // Create Socket.IO instance with robust configuration
        this.socket = io(socketUrl, {
          path: path,
          transports: ['polling', 'websocket'], // Start with polling, upgrade to WebSocket
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          forceNew: true,
          autoConnect: true,
          rejectUnauthorized: false,
          withCredentials: true
        });

        // Set up event handlers
        this.setupEventHandlers(this.socket);

        // Start fallback polling mechanism
        this.startPolling();
      } catch (error) {
        console.error('Error connecting to agent Socket.IO:', error);
        this.initFallbackPolling();
        this.connectResolve?.(false);
        this.connectPromise = null;
        this.connectResolve = null;
      }
    });

    return this.connectPromise;
  }

  /**
   * Disconnect from the Socket.IO server
   */
  public disconnect(): void {
    // Stop polling
    this.stopPolling();

    // Stop ping interval
    this.stopPingInterval();

    // Disconnect Socket.IO
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Update connection status
    this.updateConnectionStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Send message to an agent
   * 
   * @param recipientId ID of recipient agent
   * @param message Message to send
   * @returns Promise that resolves with message ID
   */
  public sendAgentMessage(recipientId: string, message: any): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // If using Socket.IO, send via socket
    if (this.socket && this.socket.connected && !this.usingFallback) {
      return new Promise((resolve, reject) => {
        try {
          this.socket!.emit('agent_message', {
            messageId,
            recipientId,
            message,
            clientId: this.clientId,
            timestamp: Date.now()
          });

          // Resolve with message ID
          resolve(messageId);
        } catch (error) {
          console.error('Error sending agent message via Socket.IO:', error);

          // Try fallback to REST
          this.sendAgentMessageViaRest(recipientId, message, messageId)
            .then(resolve)
            .catch(reject);
        }
      });
    }

    // If not connected, add to pending messages
    if (this.connectionStatus !== ConnectionStatus.CONNECTED && 
        this.connectionStatus !== ConnectionStatus.CONNECTING) {
      this.pendingMessages.push({
        type: 'agent_message',
        recipientId,
        message,
        messageId
      });

      // Return message ID
      return Promise.resolve(messageId);
    }

    // If using fallback or not connected to Socket.IO, send via REST
    return this.sendAgentMessageViaRest(recipientId, message, messageId);
  }

  /**
   * Send action request to an agent
   * 
   * @param targetAgent ID of target agent
   * @param action Action to request
   * @param params Action parameters
   * @returns Promise that resolves with action ID
   */
  public sendActionRequest(targetAgent: string, action: string, params: any = {}): Promise<string> {
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // If using Socket.IO, send via socket
    if (this.socket && this.socket.connected && !this.usingFallback) {
      return new Promise((resolve, reject) => {
        try {
          this.socket!.emit('action', {
            actionId,
            targetAgent,
            action,
            params,
            clientId: this.clientId,
            timestamp: Date.now()
          });

          // Resolve with action ID
          resolve(actionId);
        } catch (error) {
          console.error('Error sending action request via Socket.IO:', error);

          // Try fallback to REST
          this.sendActionRequestViaRest(targetAgent, action, params, actionId)
            .then(resolve)
            .catch(reject);
        }
      });
    }

    // If not connected, add to pending messages
    if (this.connectionStatus !== ConnectionStatus.CONNECTED && 
        this.connectionStatus !== ConnectionStatus.CONNECTING) {
      this.pendingMessages.push({
        type: 'action',
        targetAgent,
        action,
        params,
        actionId
      });

      // Return action ID
      return Promise.resolve(actionId);
    }

    // If using fallback or not connected to Socket.IO, send via REST
    return this.sendActionRequestViaRest(targetAgent, action, params, actionId);
  }

  /**
   * Get current connection status
   * 
   * @returns Current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Check if currently connected
   * 
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connectionStatus === ConnectionStatus.CONNECTED;
  }

  /**
   * Get client ID
   * 
   * @returns Client ID
   */
  public getClientId(): string {
    return this.clientId;
  }

  /**
   * Check if using fallback polling mechanism
   */
  public isUsingFallback(): boolean {
    return this.usingFallback;
  }

  /**
   * Register a listener for connection status changes
   * 
   * @param listener Function to call when connection status changes
   * @returns Function to remove the listener
   */
  public onConnectionStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    // Add listener to array
    this.statusChangeListeners.push(listener);

    // Call listener immediately with current status
    listener(this.connectionStatus);

    // Return function to remove listener
    return () => {
      const index = this.statusChangeListeners.indexOf(listener);
      if (index !== -1) {
        this.statusChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Set up Socket.IO event handlers
   * 
   * @param socket Socket.IO socket
   */
  private setupEventHandlers(socket: Socket) {
    // Handle connection
    socket.on('connect', () => {
      console.log('[Agent SocketIO] Connected');
      this.updateConnectionStatus(ConnectionStatus.CONNECTED);

      // Stop fallback polling
      this.stopPolling();

      // Stop using fallback
      this.usingFallback = false;

      // Reset reconnect attempts
      this.reconnectAttempts = 0;

      // Authenticate
      this.sendAuthMessage()
        .then(() => {
          // Send any pending messages
          this.sendPendingMessages();

          // Resolve connect promise if still pending
          if (this.connectResolve) {
            this.connectResolve(true);
            this.connectPromise = null;
            this.connectResolve = null;
          }

          // Start ping interval
          this.startPingInterval();
        })
        .catch((error) => {
          console.error('Authentication failed:', error);

          // Mark as disconnected
          this.updateConnectionStatus(ConnectionStatus.DISCONNECTED);

          // Using fallback
          this.initFallbackPolling();

          // Resolve connect promise if still pending
          if (this.connectResolve) {
            this.connectResolve(false);
            this.connectPromise = null;
            this.connectResolve = null;
          }
        });
    });

    // Handle connection error
    socket.on('connect_error', (error) => {
      console.error('[Agent SocketIO] Connection error:', error);

      // Update connection status
      this.updateConnectionStatus(ConnectionStatus.ERRORED);

      // Increment reconnect attempts
      this.reconnectAttempts++;

      // If max reconnect attempts reached, give up and use fallback
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('[Agent SocketIO] Maximum reconnect attempts reached, using fallback');
        this.socket?.disconnect();
        this.initFallbackPolling();

        // Resolve connect promise if still pending
        if (this.connectResolve) {
          this.connectResolve(false);
          this.connectPromise = null;
          this.connectResolve = null;
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[Agent SocketIO] Disconnected: ${reason}`);

      // Update connection status
      this.updateConnectionStatus(ConnectionStatus.DISCONNECTED);

      // Stop ping interval
      this.stopPingInterval();

      // If not closed cleanly, try to reconnect
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Use fallback
        this.initFallbackPolling();
      }
    });

    // Handle socket.io reconnect
    socket.io.on('reconnect', (attemptNumber) => {
      console.log(`[Agent SocketIO] Reconnected after ${attemptNumber} attempts`);
    });

    // Handle socket.io reconnect attempt
    socket.io.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[Agent SocketIO] Reconnect attempt ${attemptNumber}`);
    });

    // Handle reconnect error
    socket.io.on('reconnect_error', (error) => {
      console.error('[Agent SocketIO] Reconnect error:', error);
    });

    // Handle reconnect failed
    socket.io.on('reconnect_failed', () => {
      console.error('[Agent SocketIO] Failed to reconnect after max attempts');
      this.initFallbackPolling();
    });

    // Handle connection established
    socket.on('connection_established', (data) => {
      console.log(`[Agent SocketIO] Connection established: ${data.clientId}`);

      // If server assigned a different client ID
      if (data.clientId && data.clientId !== this.clientId) {
        this.clientId = data.clientId;
        console.log(`[Agent SocketIO] Using server-assigned client ID: ${this.clientId}`);
      }
    });

    // Handle auth success
    socket.on('auth_success', (data) => {
      console.log('[Agent SocketIO] Authentication successful');
      this.dispatchMessage({
        type: 'auth_success',
        clientId: data.clientId || this.clientId,
        timestamp: Date.now()
      });
    });

    // Handle auth failed
    socket.on('auth_failed', (data) => {
      console.error('[Agent SocketIO] Authentication failed:', data.message);
      this.dispatchMessage({
        type: 'auth_failed',
        error: data.message || 'Authentication failed',
        timestamp: Date.now()
      });
    });

    // Handle agent coordination
    socket.on('agent_coordination', (data) => {
      this.dispatchMessage({
        type: 'agent_coordination',
        message: data
      });
    });

    // Handle agent activity
    socket.on('agent_activity', (data) => {
      this.dispatchMessage({
        type: 'agent_activity',
        message: data
      });
    });

    // Handle agent capability
    socket.on('agent_capability', (data) => {
      this.dispatchMessage({
        type: 'agent_capability',
        message: data
      });
    });

    // Handle message sent acknowledgment
    socket.on('message_sent', (data) => {
      this.dispatchMessage({
        type: 'message_sent',
        messageId: data.messageId,
        originalMessage: data.originalMessage,
        timestamp: Date.now()
      });
    });

    // Handle action sent acknowledgment
    socket.on('action_sent', (data) => {
      this.dispatchMessage({
        type: 'action_sent',
        messageId: data.messageId,
        action: data.action,
        targetAgent: data.targetAgent,
        timestamp: Date.now()
      });
    });

    // Handle error
    socket.on('error', (data) => {
      console.error('[Agent SocketIO] Error from server:', data);
      this.dispatchMessage({
        type: 'error',
        message: data.message,
        code: data.code,
        details: data.details,
        timestamp: Date.now()
      });
    });

    // Handle notification
    socket.on('notification', (data) => {
      this.dispatchMessage(data);
    });

    // Handle pong (response to ping)
    socket.on('pong', (data) => {
      // No need to do anything, this is just to keep the connection alive
    });
  }

  /**
   * Update connection status and notify listeners
   * 
   * @param status New connection status
   */
  private updateConnectionStatus(status: ConnectionStatus) {
    if (this.connectionStatus === status) {
      return;
    }

    this.connectionStatus = status;

    // Notify status change listeners
    this.statusChangeListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });

    // For error status, emit a notification message
    if (status === ConnectionStatus.ERRORED) {
      this.dispatchMessage({
        type: 'notification',
        title: 'Connection error',
        message: 'Error connecting to agent system. Some features may be unavailable.',
        level: 'error',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Dispatch a message to event listeners
   * 
   * @param message Message to dispatch
   */
  private dispatchMessage(message: any) {
    if (message.type) {
      this.emit(message.type, message);
    }

    // Also emit generic message event
    this.emit('message', message);
  }

  /**
   * Initialize fallback polling mechanism
   */
  private initFallbackPolling() {
    if (this.usingFallback) {
      console.log('Already using polling fallback, not initializing again');
      return;
    }

    console.log('Initializing polling fallback mechanism');
    this.usingFallback = true;

    // Try to authenticate via REST API
    this.authenticateViaRest()
      .then(() => {
        // Start polling if not already
        this.startPolling();
      })
      .catch((error) => {
        console.error('Failed to authenticate via REST API:', error);

        // Set connection status to errored
        this.updateConnectionStatus(ConnectionStatus.ERRORED);
      });
  }

  /**
   * Start polling for messages
   */
  private startPolling() {
    // Already polling, stop first
    this.stopPolling();

    console.log(`[Agent UI] Setting up polling with connection status: ${this.connectionStatus}`);

    // Start new polling interval
    this.pollingInterval = setInterval(() => {
      this.pollForMessages();
    }, this.pollingFrequency);

    // Poll immediately
    this.pollForMessages();
  }

  /**
   * Stop polling for messages
   */
  private stopPolling() {
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Poll for messages using REST API instead of Socket.IO
   */
  private async pollForMessages(): Promise<void> {
    try {
      // Only log polling attempts when debugging is needed
      if (this.connectionStatus === ConnectionStatus.CONNECTING) {
        console.log('[Agent UI] Polling for data (connection: ' + this.connectionStatus + ')');
      }

      // Determine API endpoint - either regular or Socket.IO
      const endpoint = this.usingFallback ? 
        `/api/agents/socketio/messages/pending?clientId=${this.clientId}` : 
        `/api/agents/messages/pending?clientId=${this.clientId}`;

      // Use the REST API to fetch any pending messages
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to poll for messages: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.messages && Array.isArray(data.messages)) {
          // Process each message as if it came from Socket.IO
          data.messages.forEach((messageData: any) => {
            if (messageData.event && messageData.data) {
              // Handle structured message with event type
              this.dispatchMessage(messageData.data);
            } else {
              // Handle direct message
              this.dispatchMessage(messageData);
            }
          });

          // If we received any messages, update connection status to reflect it's working
          if (data.messages.length > 0 && this.connectionStatus !== ConnectionStatus.CONNECTED) {
            this.updateConnectionStatus(ConnectionStatus.CONNECTED);
          }
        }

        // Successfully polled, so connection is at least functional at HTTP level
        if (this.connectionStatus === ConnectionStatus.DISCONNECTED || this.connectionStatus === ConnectionStatus.ERRORED) {
          this.updateConnectionStatus(ConnectionStatus.CONNECTING);

          // Notify the user that polling is working
          this.dispatchMessage({
            type: 'notification',
            title: 'Connection status',
            message: 'Using REST fallback for communication (Socket.IO/WebSockets unavailable)',
            level: 'info',
            timestamp: Date.now()
          });
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      // Only log errors occasionally to avoid flooding console
      if (Math.random() < 0.1) { // Log roughly 10% of errors
        console.error('Error polling for messages:', error);
      }

      // If polling fails repeatedly, mark as errored, but don't flood UI with notifications
      if (this.connectionStatus !== ConnectionStatus.ERRORED) {
        this.updateConnectionStatus(ConnectionStatus.ERRORED);
      }
    }
  }

  /**
   * Authenticate via REST API when Socket.IO is not available
   */
  private async authenticateViaRest(): Promise<void> {
    try {
      console.log('Authenticating via REST API');

      const response = await fetch('/api/agents/socketio/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: this.clientId,
          clientType: ClientType.FRONTEND,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      // If server assigned a different client ID
      if (data.clientId && data.clientId !== this.clientId) {
        this.clientId = data.clientId;
      }

      console.log('REST authentication successful, client ID:', this.clientId);

      this.dispatchMessage({
        type: 'auth_success',
        clientId: this.clientId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('REST authentication failed:', error);

      this.dispatchMessage({
        type: 'auth_failed',
        error: error instanceof Error ? error.message : 'Authentication failed',
        timestamp: Date.now()
      });

      throw error;
    }
  }

  /**
   * Send auth message to Socket.IO
   */
  private async sendAuthMessage(): Promise<void> {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Socket not connected');
    }

    return new Promise((resolve, reject) => {
      try {
        // Set up timeout - if we don't get a response in 5 seconds, fail
        const timeoutId = setTimeout(() => {
          reject(new Error('Authentication timed out'));
        }, 5000);

        // Set up one-time auth success handler
        const authSuccessHandler = (data: any) => {
          clearTimeout(timeoutId);
          if (this.socket) {
            this.socket.off('auth_success', authSuccessHandler);
            this.socket.off('auth_failed', authFailedHandler);
          }
          resolve();
        };

        // Set up one-time auth failed handler
        const authFailedHandler = (data: any) => {
          clearTimeout(timeoutId);
          if (this.socket) {
            this.socket.off('auth_success', authSuccessHandler);
            this.socket.off('auth_failed', authFailedHandler);
          }
          reject(new Error(data.message || 'Authentication failed'));
        };

        // We already checked that socket exists and is connected at the beginning of the method,
        // but TypeScript needs reassurance
        if (this.socket) {
          // Register temporary handlers
          this.socket.on('auth_success', authSuccessHandler);
          this.socket.on('auth_failed', authFailedHandler);

          // Send authentication message
          this.socket.emit('auth', {
            clientId: this.clientId,
            clientType: ClientType.FRONTEND,
            timestamp: Date.now()
          });
        } else {
          reject(new Error('Socket became disconnected'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval() {
    // Already pinging, stop first
    this.stopPingInterval();

    // Start new ping interval - every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      } else {
        // If socket is no longer connected, stop ping interval
        this.stopPingInterval();
      }
    }, 30000);
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Send pending messages after reconnection
   */
  private async sendPendingMessages() {
    if (this.pendingMessages.length === 0) {
      return;
    }

    console.log(`Sending ${this.pendingMessages.length} pending messages`);

    // Copy pending messages and clear the queue
    const messagesToSend = [...this.pendingMessages];
    this.pendingMessages = [];

    // Send each message
    for (const payload of messagesToSend) {
      try {
        if (payload.type === 'agent_message') {
          await this.sendAgentMessage(payload.message.recipientId, payload.message);
        } else if (payload.type === 'action') {
          await this.sendActionRequest(payload.targetAgent, payload.action, payload.params);
        }
      } catch (error) {
        console.error('Error sending pending message:', error);

        // Add back to pending messages queue
        this.pendingMessages.push(payload);
      }
    }
  }

  /**
   * Send agent message via REST API
   * 
   * @param recipientId ID of recipient agent
   * @param message Message to send
   * @param messageId Optional message ID
   * @returns Promise that resolves with message ID
   */
  private async sendAgentMessageViaRest(
    recipientId: string, 
    message: any, 
    messageId: string = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  ): Promise<string> {
    try {
      const response = await fetch('/api/agents/socketio/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId,
          recipientId,
          message,
          clientId: this.clientId,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to send message');
      }

      return messageId;
    } catch (error) {
      console.error('Error sending message via REST:', error);

      // If REST fails, add to pending messages and try again later
      this.pendingMessages.push({
        type: 'agent_message',
        recipientId,
        message,
        messageId
      });

      throw error;
    }
  }

  /**
   * Send action request via REST API
   * 
   * @param targetAgent ID of target agent
   * @param action Action to request
   * @param params Action parameters
   * @param actionId Optional action ID
   * @returns Promise that resolves with action ID
   */
  private async sendActionRequestViaRest(
    targetAgent: string, 
    action: string, 
    params: any = {},
    actionId: string = `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  ): Promise<string> {
    try {
      const response = await fetch('/api/agents/socketio/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actionId,
          targetAgent,
          action,
          params,
          clientId: this.clientId,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send action request: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to send action request');
      }

      return actionId;
    } catch (error) {
      console.error('Error sending action request via REST:', error);

      // If REST fails, add to pending messages and try again later
      this.pendingMessages.push({
        type: 'action',
        targetAgent,
        action,
        params,
        actionId
      });

      throw error;
    }
  }
}

// Create a singleton instance
export const agentSocketIOService = new AgentSocketIOService();