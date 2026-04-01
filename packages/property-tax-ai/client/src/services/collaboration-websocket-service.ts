/**
 * Collaboration WebSocket Service - Client Side
 * 
 * This service provides WebSocket communication for the frontend to interact with
 * the collaboration server. It establishes a connection to the server-side WebSocket
 * service and provides an API for sending messages and receiving notifications
 * about collaborative session activities.
 */

import { CollaborationMessageType } from '../../shared/types/collaboration-types';

type MessageHandler = (message: any) => void;
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Client-side WebSocket service for collaboration features
 */
export class CollaborationWebSocketService {
  private static instance: CollaborationWebSocketService;
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private clientId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // Start with 2 seconds
  private pingInterval: number | null = null;
  private statusHandlers: Set<(status: ConnectionStatus) => void> = new Set();
  private pendingMessages: Array<{ type: string, payload: any }> = [];
  private sessionId: string | null = null;
  private userId: number | null = null;
  private userName: string | null = null;
  private role: string | null = null;

  /**
   * Create a new collaboration WebSocket service (private constructor for singleton)
   */
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): CollaborationWebSocketService {
    if (!CollaborationWebSocketService.instance) {
      CollaborationWebSocketService.instance = new CollaborationWebSocketService();
    }
    return CollaborationWebSocketService.instance;
  }

  /**
   * Initialize the WebSocket connection
   */
  public connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
        console.log('WebSocket connection already established or in progress');
        resolve(true);
        return;
      }

      this.updateConnectionStatus('connecting');
      
      // Determine WebSocket URL based on the current protocol (HTTP/HTTPS)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname;
      const port = window.location.port || (protocol === 'wss:' ? '443' : '80');
      
      // Construct URL with explicit hostname and port to avoid 'undefined' issues
      const wsUrl = `${protocol}//${hostname}${port ? ':' + port : ''}/ws/collaboration`;
      
      // Add debug logging to help diagnose connection issues
      console.log(`[Collaboration WebSocket] Using URL: ${wsUrl}`);
      console.log(`[Collaboration WebSocket] hostname: ${hostname}`);
      console.log(`[Collaboration WebSocket] port: ${port}`);
      console.log(`[Collaboration WebSocket] protocol: ${protocol}`);
      
      console.log(`Connecting to collaboration WebSocket at ${wsUrl}`);
      
      try {
        this.socket = new WebSocket(wsUrl);
        
        // Add debug logging for WebSocket connection attempts
        console.log('WebSocket connection attempt initiated, readyState:', this.socket.readyState);
        
        // Setup event handlers
        this.socket.onopen = () => this.handleSocketOpen(resolve);
        this.socket.onmessage = (event) => this.handleSocketMessage(event);
        this.socket.onclose = (event) => this.handleSocketClose(event, reject);
        this.socket.onerror = (error) => this.handleSocketError(error, reject);
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        this.updateConnectionStatus('error');
        reject(error);
      }
    });
  }

  /**
   * Handle WebSocket open event
   */
  private handleSocketOpen(resolve: (value: boolean) => void): void {
    console.log('Collaboration WebSocket connection established');
    this.updateConnectionStatus('connected');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 2000; // Reset reconnect delay
    
    // Start ping interval to keep connection alive
    this.startPingInterval();
    
    // If we have session information, join the session
    if (this.sessionId && this.userId && this.userName) {
      this.joinSession(this.sessionId, this.userId, this.userName, this.role || 'viewer')
        .then(() => {
          console.log(`Rejoined session ${this.sessionId}`);
          this.sendPendingMessages();
          resolve(true);
        })
        .catch(error => {
          console.error('Failed to rejoin session:', error);
          resolve(false);
        });
    } else {
      // Otherwise, just resolve the promise
      this.sendPendingMessages();
      resolve(true);
    }
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
        console.log(`Connection established with client ID: ${this.clientId}`);
      }
      
      // Dispatch the message to registered handlers
      this.dispatchMessage(message);
    } catch (error) {
      console.error('Error handling WebSocket message:', error, event.data);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleSocketClose(event: CloseEvent, reject: (reason: any) => void): void {
    console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
    this.stopPingInterval();
    this.updateConnectionStatus('disconnected');
    
    // Attempt to reconnect if not a clean close
    if (event.code !== 1000 && event.code !== 1001) {
      this.attemptReconnect();
    }
    
    reject(new Error(`WebSocket connection closed: ${event.code} - ${event.reason}`));
  }

  /**
   * Handle WebSocket error event
   */
  private handleSocketError(error: Event, reject: (reason: any) => void): void {
    console.error('WebSocket error:', error);
    this.updateConnectionStatus('error');
    reject(error);
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnect attempts reached, giving up');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(30000, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1));
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.socket?.readyState === WebSocket.CLOSED) {
        console.log('Attempting reconnection...');
        this.connect()
          .then(success => {
            if (success) {
              console.log('Reconnection successful');
            } else {
              console.log('Reconnection failed');
            }
          })
          .catch(error => {
            console.error('Error during reconnection:', error);
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
        this.socket.send(JSON.stringify({ 
          type: 'ping', 
          timestamp: Date.now() 
        }));
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
   * Join a collaboration session
   * 
   * @param sessionId Unique identifier for the session
   * @param userId User ID of the joining user
   * @param userName Name of the joining user
   * @param role Role of the user in the session (owner, editor, viewer)
   * @returns Promise that resolves when successfully joined
   */
  public joinSession(
    sessionId: string, 
    userId: number, 
    userName: string, 
    role: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Store session info for reconnection
      this.sessionId = sessionId;
      this.userId = userId;
      this.userName = userName;
      this.role = role;
      
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.log('WebSocket not connected, queueing join session message');
        this.pendingMessages.push({ 
          type: 'join_session', 
          payload: { 
            sessionId,
            userId,
            userName,
            role
          }
        });
        
        // Try to connect
        this.connect().catch(error => {
          console.error('Failed to connect:', error);
        });
        
        reject(new Error('WebSocket not connected'));
        return;
      }
      
      try {
        // Create one-time handlers for session join responses
        const joinHandler = (message: any) => {
          if (message.type === 'user_joined' && 
              message.sessionId === sessionId && 
              message.userId === userId) {
            this.off('user_joined', joinHandler);
            this.off('error', errorHandler);
            resolve();
          }
        };
        
        const errorHandler = (message: any) => {
          if (message.type === 'error') {
            this.off('user_joined', joinHandler);
            this.off('error', errorHandler);
            reject(new Error(message.message || 'Failed to join session'));
          }
        };
        
        // Register handlers
        this.on('user_joined', joinHandler);
        this.on('error', errorHandler);
        
        // Send join message
        const joinMessage = {
          type: 'join_session',
          sessionId,
          userId,
          userName,
          timestamp: Date.now(),
          payload: {
            role
          }
        };
        
        console.log('Sending join session message:', joinMessage);
        this.socket.send(JSON.stringify(joinMessage));
      } catch (error) {
        console.error('Error joining session:', error);
        reject(error);
      }
    });
  }

  /**
   * Leave the current session
   * 
   * @returns Promise that resolves when successfully left
   */
  public leaveSession(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.sessionId || !this.userId || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('Not in a session or WebSocket not connected'));
        return;
      }
      
      try {
        // Create one-time handlers for session leave responses
        const leaveHandler = (message: any) => {
          if (message.type === 'user_left' && 
              message.sessionId === this.sessionId && 
              message.userId === this.userId) {
            this.off('user_left', leaveHandler);
            this.off('error', errorHandler);
            
            // Clear session info
            this.sessionId = null;
            this.userId = null;
            this.userName = null;
            this.role = null;
            
            resolve();
          }
        };
        
        const errorHandler = (message: any) => {
          if (message.type === 'error') {
            this.off('user_left', leaveHandler);
            this.off('error', errorHandler);
            reject(new Error(message.message || 'Failed to leave session'));
          }
        };
        
        // Register handlers
        this.on('user_left', leaveHandler);
        this.on('error', errorHandler);
        
        // Send leave message
        const leaveMessage = {
          type: 'leave_session',
          sessionId: this.sessionId,
          userId: this.userId,
          userName: this.userName,
          timestamp: Date.now()
        };
        
        console.log('Sending leave session message:', leaveMessage);
        this.socket.send(JSON.stringify(leaveMessage));
      } catch (error) {
        console.error('Error leaving session:', error);
        reject(error);
      }
    });
  }

  /**
   * Send cursor position update
   * 
   * @param position Cursor position (x, y, section)
   * @returns Promise that resolves when position is sent
   */
  public sendCursorPosition(position: { x: number, y: number, section?: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.sessionId || !this.userId || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('Not in a session or WebSocket not connected'));
        return;
      }
      
      try {
        // Send cursor position message
        const cursorMessage = {
          type: 'cursor_position',
          sessionId: this.sessionId,
          userId: this.userId,
          userName: this.userName,
          timestamp: Date.now(),
          payload: {
            position
          }
        };
        
        this.socket.send(JSON.stringify(cursorMessage));
        resolve();
      } catch (error) {
        console.error('Error sending cursor position:', error);
        reject(error);
      }
    });
  }

  /**
   * Send an edit operation
   * 
   * @param operation Edit operation details
   * @param section Section being edited
   * @returns Promise that resolves when edit is sent
   */
  public sendEditOperation(operation: any, section: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.sessionId || !this.userId || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('Not in a session or WebSocket not connected'));
        return;
      }
      
      // Check if user has edit permission
      if (this.role !== 'editor' && this.role !== 'owner') {
        reject(new Error('You do not have permission to edit'));
        return;
      }
      
      try {
        // Send edit operation message
        const editMessage = {
          type: 'edit_operation',
          sessionId: this.sessionId,
          userId: this.userId,
          userName: this.userName,
          timestamp: Date.now(),
          payload: {
            operation,
            section
          }
        };
        
        this.socket.send(JSON.stringify(editMessage));
        resolve();
      } catch (error) {
        console.error('Error sending edit operation:', error);
        reject(error);
      }
    });
  }

  /**
   * Send a comment
   * 
   * @param comment Comment text
   * @param position Position of the comment
   * @returns Promise that resolves when comment is sent
   */
  public sendComment(comment: string, position?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.sessionId || !this.userId || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('Not in a session or WebSocket not connected'));
        return;
      }
      
      try {
        // Send comment message
        const commentMessage = {
          type: 'comment',
          sessionId: this.sessionId,
          userId: this.userId,
          userName: this.userName,
          timestamp: Date.now(),
          payload: {
            comment,
            position
          }
        };
        
        this.socket.send(JSON.stringify(commentMessage));
        resolve();
      } catch (error) {
        console.error('Error sending comment:', error);
        reject(error);
      }
    });
  }

  /**
   * Send pending messages after reconnection
   */
  private sendPendingMessages(): void {
    if (this.pendingMessages.length === 0) {
      return;
    }
    
    console.log(`Sending ${this.pendingMessages.length} pending messages`);
    
    // Copy and clear pending messages
    const messages = [...this.pendingMessages];
    this.pendingMessages = [];
    
    // Send each message
    messages.forEach(({ type, payload }) => {
      if (type === 'join_session') {
        this.joinSession(
          payload.sessionId, 
          payload.userId, 
          payload.userName, 
          payload.role
        ).catch(error => console.error('Error sending pending join session:', error));
      } else if (type === 'cursor_position') {
        this.sendCursorPosition(payload.position)
          .catch(error => console.error('Error sending pending cursor position:', error));
      } else if (type === 'edit_operation') {
        this.sendEditOperation(payload.operation, payload.section)
          .catch(error => console.error('Error sending pending edit operation:', error));
      } else if (type === 'comment') {
        this.sendComment(payload.comment, payload.position)
          .catch(error => console.error('Error sending pending comment:', error));
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
   * Register a handler for connection status changes
   * 
   * @param handler Handler function to call when connection status changes
   * @returns Unsubscribe function
   */
  public onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.statusHandlers.delete(handler);
    };
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
          console.error('Error in status handler:', error);
        }
      });
    }
  }

  /**
   * Get current connection status
   * 
   * @returns Current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get current session information
   * 
   * @returns Current session information
   */
  public getSessionInfo(): { sessionId: string | null, userId: number | null, userName: string | null, role: string | null } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      userName: this.userName,
      role: this.role
    };
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    // Leave session first if in one
    if (this.sessionId && this.userId && this.socket?.readyState === WebSocket.OPEN) {
      this.leaveSession().catch(error => {
        console.error('Error leaving session during disconnect:', error);
      });
    }
    
    // Stop ping interval
    this.stopPingInterval();
    
    // Close socket
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.updateConnectionStatus('disconnected');
  }
}

// Create and export the singleton instance
export const collaborationWebSocketService = CollaborationWebSocketService.getInstance();