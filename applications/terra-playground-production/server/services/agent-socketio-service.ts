/**
 * Agent Socket.IO Service
 *
 * This service provides Socket.IO communication channels for agents,
 * allowing real-time bidirectional communication between agents and the frontend.
 * This is a drop-in replacement for agent-websocket-service.ts using Socket.IO
 * instead of raw WebSockets for better compatibility in various environments,
 * particularly Replit which may have issues with raw WebSockets.
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import {
  AgentMessage,
  AgentMessageType,
  MessagePriority,
  AgentProtocol,
} from '../extensions/agent-protocol';
import { logger } from '../utils/logger';

// Define LogOptions interface to fix TypeScript errors
interface LogOptions {
  [key: string]: any;
}

/**
 * Client connection type - represents different types of clients connecting to Socket.IO
 */
export enum ClientType {
  FRONTEND = 'frontend',
  AGENT = 'agent',
  EXTENSION = 'extension',
}

/**
 * Socket.IO client information
 */
interface IOClient {
  socket: Socket;
  id: string;
  type: ClientType;
  isAuthenticated: boolean;
}

/**
 * Agent Socket.IO Service
 * Provides Socket.IO communication for the agent system
 */
export class AgentSocketIOService {
  private static instance: AgentSocketIOService;
  private io: Server | null = null;
  private clients: Map<string, IOClient> = new Map();
  private agentProtocol: AgentProtocol;
  private agentSubscriptions: Map<string, () => void> = new Map();
  private pendingMessages: Map<string, any[]> = new Map();

  /**
   * Create a new agent Socket.IO service (private constructor for singleton)
   */
  private constructor() {
    this.agentProtocol = AgentProtocol.getInstance();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): AgentSocketIOService {
    if (!AgentSocketIOService.instance) {
      AgentSocketIOService.instance = new AgentSocketIOService();
    }
    return AgentSocketIOService.instance;
  }

  /**
   * Initialize the Socket.IO server
   *
   * @param server HTTP server to attach to
   */
  public initialize(server: HttpServer) {
    try {
      // Create Socket.IO server with path prefix and CORS options
      this.io = new Server(server, {
        path: '/api/agents/socket.io',
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
          credentials: true,
          allowedHeaders: ['content-type'],
        },
        allowEIO3: true,
        connectTimeout: 45000,
        // Add these settings for better compatibility with various proxies and improved connection stability
        transports: ['websocket', 'polling'], // Enable polling as fallback
        allowUpgrades: true,
        pingTimeout: 60000, // Increased ping timeout for better reliability
        pingInterval: 25000,
        cookie: false,
      });

      if (!this.io) {
        throw new Error('Failed to create Socket.IO server');
      }

      // Set up event handlers
      this.setupEventHandlers();

      // Subscribe to agent protocol broadcast messages
      this.setupAgentProtocolSubscriptions();

      // Log initialization
      logger.info('Agent Socket.IO service initialized on path: /api/agents/socket.io');
    } catch (error) {
      logger.error('Error initializing Socket.IO server:', error);
    }
  }

  /**
   * Set up Socket.IO event handlers
   */
  private setupEventHandlers() {
    if (!this.io) {
      logger.error('Cannot set up event handlers: Socket.IO server not initialized');
      return;
    }

    // Handle connection event
    this.io.on('connection', (socket: Socket) => {
      try {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Log the new connection
        logger.info(`New Socket.IO connection established: ${clientId}`);

        // Send connection acknowledgment immediately
        socket.emit('connection_established', {
          clientId,
          message: 'Connection established',
          timestamp: Date.now(),
        });

        // Store client information
        const client: IOClient = {
          socket,
          id: clientId,
          type: ClientType.FRONTEND, // Default to frontend - will be updated during auth
          isAuthenticated: false,
        };

        this.clients.set(clientId, client);

        // Add pending messages array for this client
        this.pendingMessages.set(clientId, []);

        // Set up event handlers for this client

        // Authentication
        socket.on('auth', (data, callback) => {
          try {
            // Handle authentication
            const result = this.handleClientAuth(client, data);

            // Call the callback with the result if provided
            if (typeof callback === 'function') {
              callback(result);
            }
          } catch (error) {
            logger.error(`Error handling auth event for client ${clientId}:`, error);
            // Call the callback with error if provided
            if (typeof callback === 'function') {
              callback({ success: false, error: String(error) });
            }
          }
        });

        // Agent messages
        socket.on('agent_message', (data, callback) => {
          try {
            // Check authentication
            if (!client.isAuthenticated) {
              const result = {
                success: false,
                error: 'Not authenticated',
                code: 'AUTH_REQUIRED',
              };

              if (typeof callback === 'function') {
                callback(result);
              }
              return;
            }

            // Handle agent message
            this.handleAgentMessage(client, data, callback);
          } catch (error) {
            logger.error(`Error handling agent_message event for client ${clientId}:`, error);
            // Call the callback with error if provided
            if (typeof callback === 'function') {
              callback({ success: false, error: String(error) });
            }
          }
        });

        // Action requests
        socket.on('action', (data, callback) => {
          try {
            // Check authentication
            if (!client.isAuthenticated) {
              const result = {
                success: false,
                error: 'Not authenticated',
                code: 'AUTH_REQUIRED',
              };

              if (typeof callback === 'function') {
                callback(result);
              }
              return;
            }

            // Handle action request
            this.handleActionRequest(client, data, callback);
          } catch (error) {
            logger.error(`Error handling action event for client ${clientId}:`, error);
            // Call the callback with error if provided
            if (typeof callback === 'function') {
              callback({ success: false, error: String(error) });
            }
          }
        });

        // Ping messages (heartbeat)
        socket.on('ping', (data, callback) => {
          try {
            // Send pong response
            const response = { type: 'pong', timestamp: Date.now() };

            if (typeof callback === 'function') {
              callback(response);
            } else {
              socket.emit('pong', response);
            }
          } catch (error) {
            logger.error(`Error handling ping event for client ${clientId}:`, error);
          }
        });

        // Get pending messages
        socket.on('get_pending_messages', (data, callback) => {
          try {
            // Check authentication
            if (!client.isAuthenticated) {
              const result = {
                success: false,
                error: 'Not authenticated',
                code: 'AUTH_REQUIRED',
              };

              if (typeof callback === 'function') {
                callback(result);
              }
              return;
            }

            // Get pending messages for this client
            const pendingMsgs = this.pendingMessages.get(clientId) || [];

            // Clear pending messages after sending
            this.pendingMessages.set(clientId, []);

            // Send response
            const response = {
              success: true,
              messages: pendingMsgs,
            };

            if (typeof callback === 'function') {
              callback(response);
            } else {
              socket.emit('pending_messages', response);
            }
          } catch (error) {
            logger.error(
              `Error handling get_pending_messages event for client ${clientId}:`,
              error
            );
            // Call the callback with error if provided
            if (typeof callback === 'function') {
              callback({ success: false, error: String(error) });
            }
          }
        });

        // Disconnection
        socket.on('disconnect', reason => {
          logger.info(`Client ${clientId} disconnected from Socket.IO: ${reason}`);

          // Clean up client resources
          this.clients.delete(clientId);
          this.pendingMessages.delete(clientId);
        });
      } catch (error) {
        logger.error('Error handling Socket.IO connection:', error);
      }
    });
  }

  /**
   * Set up subscriptions to agent protocol messages
   */
  private setupAgentProtocolSubscriptions() {
    // Subscribe to all coordination messages
    const coordinationSub = this.agentProtocol.subscribe(
      'socketio-bridge',
      'coordination',
      message => {
        this.broadcastToType(ClientType.FRONTEND, 'agent_coordination', message);
      }
    );

    this.agentSubscriptions.set('coordination', coordinationSub);

    // Subscribe to all agent activities
    const activitySub = this.agentProtocol.subscribe('socketio-bridge', 'activity', message => {
      this.broadcastToType(ClientType.FRONTEND, 'agent_activity', message);
    });

    this.agentSubscriptions.set('activity', activitySub);

    // Subscribe to capability announcements
    const capabilitySub = this.agentProtocol.subscribe('socketio-bridge', 'capability', message => {
      this.broadcastToType(ClientType.FRONTEND, 'agent_capability', message);
    });

    this.agentSubscriptions.set('capability', capabilitySub);
  }

  /**
   * Handle client authentication
   *
   * @param client Client information
   * @param data Authentication data
   * @return Authentication result
   */
  private handleClientAuth(client: IOClient, data: any): any {
    try {
      // Very simple authentication for now - just identify client type
      if (data.clientType) {
        client.type = data.clientType;
        client.isAuthenticated = true;

        // Update client ID if provided
        if (data.clientId) {
          // Remove old client entry and pending messages
          this.clients.delete(client.id);
          const pendingMsgs = this.pendingMessages.get(client.id) || [];
          this.pendingMessages.delete(client.id);

          // Update client ID
          client.id = data.clientId;

          // Add client with new ID and restore pending messages
          this.clients.set(client.id, client);
          this.pendingMessages.set(client.id, pendingMsgs);
        }

        const result = {
          success: true,
          type: 'auth_success',
          message: `Authenticated as ${client.type}`,
          clientId: client.id,
        };

        logger.info(`Client ${client.id} authenticated as ${client.type}`);
        return result;
      } else {
        // Failed authentication
        const result = {
          success: false,
          type: 'auth_failed',
          message: 'Missing client type',
          code: 'INVALID_AUTH',
        };

        return result;
      }
    } catch (error) {
      logger.error(`Error authenticating client ${client.id}:`, error);
      return {
        success: false,
        type: 'auth_failed',
        message: String(error),
        code: 'AUTH_ERROR',
      };
    }
  }

  /**
   * Handle agent messages from clients
   *
   * @param client Client information
   * @param data Message data
   * @param callback Optional callback function
   */
  private handleAgentMessage(client: IOClient, data: any, callback?: Function) {
    if (!data.message || !data.message.recipientId) {
      const response = {
        success: false,
        type: 'error',
        message: 'Invalid agent message',
        code: 'INVALID_MESSAGE',
      };

      if (typeof callback === 'function') {
        callback(response);
      } else {
        client.socket.emit('error', response);
      }
      return;
    }

    // Forward message to agent protocol
    this.agentProtocol
      .sendMessage({
        ...data.message,
        senderId: `socket-client-${client.id}`,
        timestamp: Date.now(),
        type: data.message.type || AgentMessageType.QUERY,
      })
      .then(messageId => {
        // Acknowledge message receipt
        const response = {
          success: true,
          type: 'message_sent',
          messageId,
          originalMessage: data.message,
        };

        if (typeof callback === 'function') {
          callback(response);
        } else {
          client.socket.emit('message_sent', response);
        }
      })
      .catch(error => {
        // Report error
        const response = {
          success: false,
          type: 'error',
          message: 'Failed to send agent message',
          code: 'MESSAGE_SEND_FAILED',
          details: error.message,
        };

        if (typeof callback === 'function') {
          callback(response);
        } else {
          client.socket.emit('error', response);
        }
      });
  }

  /**
   * Handle action requests from clients
   *
   * @param client Client information
   * @param data Action data
   * @param callback Optional callback function
   */
  private handleActionRequest(client: IOClient, data: any, callback?: Function) {
    if (!data.action || !data.targetAgent) {
      const response = {
        success: false,
        type: 'error',
        message: 'Invalid action request',
        code: 'INVALID_ACTION',
      };

      if (typeof callback === 'function') {
        callback(response);
      } else {
        client.socket.emit('error', response);
      }
      return;
    }

    // Create and send an action message to the target agent
    this.agentProtocol
      .sendMessage({
        type: AgentMessageType.ACTION,
        senderId: `socket-client-${client.id}`,
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
        const response = {
          success: true,
          type: 'action_sent',
          messageId,
          action: data.action,
          targetAgent: data.targetAgent,
        };

        if (typeof callback === 'function') {
          callback(response);
        } else {
          client.socket.emit('action_sent', response);
        }
      })
      .catch(error => {
        // Report error
        const response = {
          success: false,
          type: 'error',
          message: 'Failed to send action request',
          code: 'ACTION_SEND_FAILED',
          details: error.message,
        };

        if (typeof callback === 'function') {
          callback(response);
        } else {
          client.socket.emit('error', response);
        }
      });
  }

  /**
   * Send a message to a specific client
   *
   * @param clientId Client ID
   * @param eventName Event name
   * @param message Message to send
   */
  private sendToClient(clientId: string, eventName: string, message: any) {
    const client = this.clients.get(clientId);

    if (!client) {
      logger.warn(`Attempted to send message to unknown client: ${clientId}`);

      // Store message in pending messages if client reconnects
      this.storePendingMessage(clientId, eventName, message);
      return;
    }

    try {
      client.socket.emit(eventName, message);
    } catch (error) {
      logger.error(`Error sending message to client ${clientId}:`, error);

      // Store message in pending messages in case of error
      this.storePendingMessage(clientId, eventName, message);
    }
  }

  /**
   * Store a message for a client to retrieve later
   *
   * @param clientId Client ID
   * @param eventName Event name
   * @param message Message content
   */
  private storePendingMessage(clientId: string, eventName: string, message: any) {
    let pendingMsgs = this.pendingMessages.get(clientId);

    if (!pendingMsgs) {
      pendingMsgs = [];
      this.pendingMessages.set(clientId, pendingMsgs);
    }

    pendingMsgs.push({
      event: eventName,
      data: message,
      timestamp: Date.now(),
    });

    // Limit the number of pending messages to 100
    if (pendingMsgs.length > 100) {
      pendingMsgs.shift(); // Remove oldest message
    }
  }

  /**
   * Broadcast a message to all clients of a specific type
   *
   * @param clientType Client type to broadcast to
   * @param eventName Event name
   * @param message Message to send
   */
  private broadcastToType(clientType: ClientType, eventName: string, message: any) {
    if (!this.io) {
      logger.error('Cannot broadcast: Socket.IO server not initialized');
      return;
    }

    // Convert clients.values() to an array for direct iteration
    Array.from(this.clients.values())
      .filter(client => client.type === clientType && client.isAuthenticated)
      .forEach(client => {
        try {
          client.socket.emit(eventName, message);
        } catch (error) {
          logger.error(`Error broadcasting to client ${client.id}:`, error);

          // Store message in pending messages
          this.storePendingMessage(client.id, eventName, message);
        }
      });
  }

  /**
   * Broadcast a message to all authenticated clients
   *
   * @param eventName Event name
   * @param message Message to send
   */
  public broadcast(eventName: string, message: any) {
    if (!this.io) {
      logger.error('Cannot broadcast: Socket.IO server not initialized');
      return;
    }

    // Convert clients.values() to an array for direct iteration
    Array.from(this.clients.values())
      .filter(client => client.isAuthenticated)
      .forEach(client => {
        try {
          client.socket.emit(eventName, message);
        } catch (error) {
          logger.error(`Error broadcasting to client ${client.id}:`, error);

          // Store message in pending messages
          this.storePendingMessage(client.id, eventName, message);
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
    const notificationData = {
      type: 'notification',
      title,
      message,
      level,
      timestamp: Date.now(),
      data,
    };

    this.broadcastToType(clientType, 'notification', notificationData);
  }

  /**
   * Get routes handler for Express app
   *
   * This method provides the REST API fallback routes for the agent WebSocket service
   *
   * @returns Express router handlers
   */
  public getRestRoutes() {
    return {
      // POST /api/agents/auth - REST API authentication
      auth: async (req: any, res: any) => {
        try {
          const { clientType, clientId } = req.body;

          if (!clientType) {
            return res.status(400).json({
              success: false,
              message: 'Missing required fields',
            });
          }

          // Generate a client ID if not provided
          const actualClientId =
            clientId || `rest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

          // Store in pending messages map
          if (!this.pendingMessages.has(actualClientId)) {
            this.pendingMessages.set(actualClientId, []);
          }

          // Return success
          return res.json({
            success: true,
            clientId: actualClientId,
          });
        } catch (error) {
          logger.error('Error in REST auth endpoint:', error);
          return res.status(500).json({
            success: false,
            message: 'Server error processing authentication',
          });
        }
      },

      // POST /api/agents/message - Send agent message via REST API
      message: async (req: any, res: any) => {
        try {
          const { recipientId, message } = req.body;

          if (!recipientId || !message) {
            return res.status(400).json({
              success: false,
              message: 'Missing required fields',
            });
          }

          // Send message through agent protocol
          const messageId = await this.agentProtocol.sendMessage({
            ...message,
            senderId: `rest-client-${req.body.clientId || 'anonymous'}`,
            recipientId,
            timestamp: Date.now(),
            type: message.type || AgentMessageType.QUERY,
          });

          // Return success
          return res.json({
            success: true,
            messageId,
          });
        } catch (error) {
          logger.error('Error in REST message endpoint:', error);
          return res.status(500).json({
            success: false,
            message: 'Server error processing message',
          });
        }
      },

      // POST /api/agents/action - Send agent action via REST API
      action: async (req: any, res: any) => {
        try {
          const { targetAgent, action, params } = req.body;

          if (!targetAgent || !action) {
            return res.status(400).json({
              success: false,
              message: 'Missing required fields',
            });
          }

          // Send action through agent protocol
          const messageId = await this.agentProtocol.sendMessage({
            type: AgentMessageType.ACTION,
            senderId: `rest-client-${req.body.clientId || 'anonymous'}`,
            recipientId: targetAgent,
            topic: 'action',
            priority: MessagePriority.NORMAL,
            payload: {
              action,
              params: params || {},
            },
          });

          // Return success
          return res.json({
            success: true,
            messageId,
          });
        } catch (error) {
          logger.error('Error in REST action endpoint:', error);
          return res.status(500).json({
            success: false,
            message: 'Server error processing action',
          });
        }
      },

      // GET /api/agents/messages/pending - Get pending messages via REST API
      pendingMessages: async (req: any, res: any) => {
        try {
          const clientId = req.query.clientId as string;

          if (!clientId) {
            return res.status(400).json({
              success: false,
              message: 'Missing clientId query parameter',
            });
          }

          // Get pending messages for this client
          const pendingMsgs = this.pendingMessages.get(clientId) || [];

          // Clear pending messages after sending
          this.pendingMessages.set(clientId, []);

          // Return messages
          return res.json({
            success: true,
            messages: pendingMsgs,
          });
        } catch (error) {
          logger.error('Error in REST pending messages endpoint:', error);
          return res.status(500).json({
            success: false,
            message: 'Server error retrieving pending messages',
          });
        }
      },
    };
  }
}

// Export singleton instance
export const agentSocketIOService = AgentSocketIOService.getInstance();
