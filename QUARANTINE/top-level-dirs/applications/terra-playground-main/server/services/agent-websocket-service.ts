/**
 * Agent WebSocket Service
 *
 * This service provides WebSocket communication channels for agents,
 * allowing real-time bidirectional communication between agents and the frontend.
 */

import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import {
  AgentMessage,
  AgentMessageType,
  MessagePriority,
  AgentProtocol,
} from '../extensions/agent-protocol';
import { logger } from '../utils/logger';

/**
 * Client connection type - represents different types of clients connecting to the WebSocket
 */
export enum ClientType {
  FRONTEND = 'frontend',
  AGENT = 'agent',
  EXTENSION = 'extension',
}

/**
 * WebSocket client information
 */
interface WSClient {
  ws: WebSocket;
  id: string;
  type: ClientType;
  isAuthenticated: boolean;
}

/**
 * Agent WebSocket Service
 * Provides WebSocket communication for the agent system
 */
export class AgentWebSocketService {
  private static instance: AgentWebSocketService;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WSClient> = new Map();
  private agentProtocol: AgentProtocol;
  private agentSubscriptions: Map<string, () => void> = new Map();

  /**
   * Create a new agent WebSocket service (private constructor for singleton)
   */
  private constructor() {
    this.agentProtocol = AgentProtocol.getInstance();
  }

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
   * Initialize the WebSocket server
   *
   * @param server HTTP server to attach to
   */
  public initialize(server: Server) {
    try {
      // Enhanced logging for WebSocket initialization
      // Create WebSocket server with path prefix option
      // This is more compatible with various hosting environments including Replit
      this.wss = new WebSocketServer({
        server: server,
        path: '/api/agents/ws',
        clientTracking: true,
        perMessageDeflate: false,
        // Add proper CORS handling for WebSocket connections
        verifyClient: (info, callback) => {
          // Log verify client info for debugging
          // Accept all connections at this stage, we'll authenticate later
          if (callback) {
            callback(true);
          }
          return true;
        },
      });

      // Log success
      // Set up event handlers
      this.setupEventHandlers();

      // Subscribe to agent protocol broadcast messages
      this.setupAgentProtocolSubscriptions();

      // Log detailed information about initialization
      logger.info('Agent WebSocket service initialized on path: /api/agents/ws');

      // Add listener for WebSocket server errors
      this.wss.on('error', error => {
        logger.error('WebSocket server error:', error);
      });

      // Add listener for upgrade events for logging purposes
      server.on('upgrade', (request, socket, head) => {
        try {
          const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

          // Specifically log WebSocket upgrade attempts for our agent path
          if (pathname === '/api/agents/ws') {
            logger.info(`[Agent WebSocket] Upgrade request received for agent WebSocket`, {
              pathname,
              headers: {
                origin: request.headers.origin,
                host: request.headers.host,
                upgrade: request.headers.upgrade,
                connection: request.headers.connection,
              },
            });

            // Import and use WebSocket CORS middleware
            try {
              // Dynamically import the WebSocket CORS middleware to avoid circular dependencies
              import('../middleware/websocket-cors')
                .then(({ verifyWebSocketRequest }) => {
                  // Use the WebSocket CORS middleware to verify the request
                  if (verifyWebSocketRequest(request, socket, head)) {
                    logger.info(`[Agent WebSocket] CORS verification passed for WebSocket upgrade`);
                  } else {
                    logger.warn(`[Agent WebSocket] CORS verification failed for WebSocket upgrade`);
                    // CORS middleware will handle rejection response
                  }
                })
                .catch(err => {
                  logger.error(`[Agent WebSocket] Error importing WebSocket CORS middleware:`, err);
                });
            } catch (corsError) {
              logger.error(`[Agent WebSocket] Error applying CORS middleware:`, corsError);
            }
          }
        } catch (error) {
          logger.error('Error handling upgrade event:', error);
        }
      });
    } catch (error) {
      logger.error('Error initializing WebSocket server:', error);
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers() {
    if (!this.wss) {
      logger.error('Cannot set up event handlers: WebSocket server not initialized');
      return;
    }

    // Handle server errors
    this.wss.on('error', error => {
      logger.error('WebSocket server error:', error);
    });

    // Handle new connections
    this.wss.on('connection', (ws: WebSocket, req) => {
      try {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Log the new connection
        logger.info(`New WebSocket connection established: ${clientId}`);

        // Send connection acknowledgment immediately
        ws.send(
          JSON.stringify({
            type: 'connection_established',
            clientId,
            message: 'Connection established',
            timestamp: Date.now(),
          })
        );

        logger.info(`New client connected to agent WebSocket service: ${clientId}`);

        // Store client information
        const client: WSClient = {
          ws,
          id: clientId,
          type: ClientType.FRONTEND, // Default to frontend - will be updated during auth
          isAuthenticated: false,
        };

        this.clients.set(clientId, client);

        // Handle WebSocket errors
        ws.on('error', err => {
          logger.error(`WebSocket client ${clientId} error:`, err);
        });

        // Handle messages from client
        ws.on('message', (message: string) => {
          try {
            const data = JSON.parse(message.toString());
            this.handleClientMessage(clientId, data);
          } catch (error) {
            logger.error(`Error handling WebSocket message from client ${clientId}:`, error);
          }
        });

        // Handle disconnections
        ws.on('close', () => {
          logger.info(`Client ${clientId} disconnected from agent WebSocket service`);
          this.clients.delete(clientId);
        });
      } catch (error) {
        logger.error('Error setting up WebSocket connection:', error);
      }
    });
  }

  /**
   * Set up subscriptions to agent protocol messages
   */
  private setupAgentProtocolSubscriptions() {
    // Subscribe to all coordination messages
    const coordinationSub = this.agentProtocol.subscribe(
      'websocket-bridge',
      'coordination',
      message => {
        this.broadcastToType(ClientType.FRONTEND, {
          type: 'agent_coordination',
          message,
        });
      }
    );

    this.agentSubscriptions.set('coordination', coordinationSub);

    // Subscribe to all agent activities
    const activitySub = this.agentProtocol.subscribe('websocket-bridge', 'activity', message => {
      this.broadcastToType(ClientType.FRONTEND, {
        type: 'agent_activity',
        message,
      });
    });

    this.agentSubscriptions.set('activity', activitySub);

    // Subscribe to capability announcements
    const capabilitySub = this.agentProtocol.subscribe(
      'websocket-bridge',
      'capability',
      message => {
        this.broadcastToType(ClientType.FRONTEND, {
          type: 'agent_capability',
          message,
        });
      }
    );

    this.agentSubscriptions.set('capability', capabilitySub);
  }

  /**
   * Handle messages from WebSocket clients
   *
   * @param clientId Client ID
   * @param data Message data
   */
  private handleClientMessage(clientId: string, data: any) {
    const client = this.clients.get(clientId);

    if (!client) {
      logger.error(`Received message from unknown client: ${clientId}`);
      return;
    }

    // Handle authentication message
    if (data.type === 'auth') {
      this.handleClientAuth(client, data);
      return;
    }

    // Check authentication for subsequent messages
    if (!client.isAuthenticated) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Not authenticated',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    // Handle agent messages
    if (data.type === 'agent_message') {
      this.handleAgentMessage(client, data);
      return;
    }

    // Handle action requests
    if (data.type === 'action') {
      this.handleActionRequest(client, data);
      return;
    }

    // Handle ping messages (heartbeat)
    if (data.type === 'ping') {
      this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
      return;
    }

    // Unknown message type
    logger.warn(`Unknown message type from client ${clientId}: ${data.type}`);
  }

  /**
   * Handle client authentication
   *
   * @param client Client information
   * @param data Authentication data
   */
  private handleClientAuth(client: WSClient, data: any) {
    // Very simple authentication for now - just identify client type
    if (data.clientType) {
      client.type = data.clientType;
      client.isAuthenticated = true;

      // Update client ID if provided
      if (data.clientId) {
        // Remove old client entry
        this.clients.delete(client.id);

        // Update client ID
        client.id = data.clientId;

        // Add client with new ID
        this.clients.set(client.id, client);
      }

      // Send success response
      this.sendToClient(client.id, {
        type: 'auth_success',
        message: `Authenticated as ${client.type}`,
        clientId: client.id,
      });

      logger.info(`Client ${client.id} authenticated as ${client.type}`);
    } else {
      // Failed authentication
      this.sendToClient(client.id, {
        type: 'auth_failed',
        message: 'Missing client type',
        code: 'INVALID_AUTH',
      });
    }
  }

  /**
   * Handle agent messages from clients
   *
   * @param client Client information
   * @param data Message data
   */
  private handleAgentMessage(client: WSClient, data: any) {
    if (!data.message || !data.message.recipientId) {
      this.sendToClient(client.id, {
        type: 'error',
        message: 'Invalid agent message',
        code: 'INVALID_MESSAGE',
      });
      return;
    }

    // Forward message to agent protocol
    this.agentProtocol
      .sendMessage({
        ...data.message,
        senderId: `ws-client-${client.id}`,
        timestamp: Date.now(),
        type: data.message.type || AgentMessageType.QUERY,
      })
      .then(messageId => {
        // Acknowledge message receipt
        this.sendToClient(client.id, {
          type: 'message_sent',
          messageId,
          originalMessage: data.message,
        });
      })
      .catch(error => {
        // Report error
        this.sendToClient(client.id, {
          type: 'error',
          message: 'Failed to send agent message',
          code: 'MESSAGE_SEND_FAILED',
          details: error.message,
        });
      });
  }

  /**
   * Handle action requests from clients
   *
   * @param client Client information
   * @param data Action data
   */
  private handleActionRequest(client: WSClient, data: any) {
    if (!data.action || !data.targetAgent) {
      this.sendToClient(client.id, {
        type: 'error',
        message: 'Invalid action request',
        code: 'INVALID_ACTION',
      });
      return;
    }

    // Create and send an action message to the target agent
    this.agentProtocol
      .sendMessage({
        type: AgentMessageType.ACTION,
        senderId: `ws-client-${client.id}`,
        recipientId: data.targetAgent,
        topic: 'action',
        priority: MessagePriority.NORMAL,
        payload: {
          action: data.action,
          params: data.params || {},
        },
      })
      .then(messageId => {
        // Acknowledge action request
        this.sendToClient(client.id, {
          type: 'action_sent',
          messageId,
          action: data.action,
          targetAgent: data.targetAgent,
        });
      })
      .catch(error => {
        // Report error
        this.sendToClient(client.id, {
          type: 'error',
          message: 'Failed to send action request',
          code: 'ACTION_SEND_FAILED',
          details: error.message,
        });
      });
  }

  /**
   * Send a message to a specific client
   *
   * @param clientId Client ID
   * @param message Message to send
   */
  private sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);

    if (!client) {
      logger.warn(`Attempted to send message to unknown client: ${clientId}`);
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      logger.error(`Error sending message to client ${clientId}:`, error);
    }
  }

  /**
   * Broadcast a message to all clients of a specific type
   *
   * @param clientType Client type to broadcast to
   * @param message Message to send
   */
  private broadcastToType(clientType: ClientType, message: any) {
    // Convert clients.values() to an array for direct iteration
    Array.from(this.clients.values())
      .filter(client => client.type === clientType && client.isAuthenticated)
      .forEach(client => {
        try {
          client.ws.send(JSON.stringify(message));
        } catch (error) {
          logger.error(`Error broadcasting to client ${client.id}:`, error);
        }
      });
  }

  /**
   * Broadcast a message to all authenticated clients
   *
   * @param message Message to send
   */
  public broadcast(message: any) {
    // Convert clients.values() to an array for direct iteration
    Array.from(this.clients.values())
      .filter(client => client.isAuthenticated)
      .forEach(client => {
        try {
          client.ws.send(JSON.stringify(message));
        } catch (error) {
          logger.error(`Error broadcasting to client ${client.id}:`, error);
        }
      });
  }

  /**
   * Send a notification to all clients of a specific type
   *
   * @param clientType Client type to notify
   * @param title Notification title
   * @param message Notification message
   * @param level Notification level (info, warning, error)
   * @param data Additional data
   */
  public notify(
    clientType: ClientType,
    title: string,
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    data?: any
  ) {
    this.broadcastToType(clientType, {
      type: 'notification',
      title,
      message,
      level,
      timestamp: Date.now(),
      data,
    });
  }
}

// Export singleton instance
export const agentWebSocketService = AgentWebSocketService.getInstance();
