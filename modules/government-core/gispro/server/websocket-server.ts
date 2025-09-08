import { WebSocketServer, WebSocket, RawData } from 'ws';
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

/**
 * Enum for WebSocket connection status
 */
export enum ConnectionStatusEnum {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

/**
 * Enum for WebSocket message types
 */
export enum MessageTypeEnum {
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  CHAT = 'chat',
  CURSOR_POSITION = 'cursor_position',
  DRAWING = 'drawing',
  FEATURE_EDIT = 'feature_edit',
  ANNOTATION = 'annotation',
  USER_PRESENCE = 'user_presence',
  SYSTEM = 'system',
  ERROR = 'error'
}

/**
 * Interface for WebSocket message structure
 */
export interface WebSocketMessage {
  type: MessageTypeEnum;
  roomId?: string;
  userId?: string;
  username?: string;
  timestamp?: number;
  payload?: any;
}

/**
 * Interface for WebSocket client with additional metadata
 */
interface EnhancedWebSocket extends WebSocket {
  id: string;
  isAlive: boolean;
  userId?: string;
  username?: string;
  rooms: Set<string>;
  lastActivity: number;
}

/**
 * Interface for a collaborative room
 */
export interface CollaborativeRoom {
  id: string;
  name: string;
  createdAt: Date;
  createdBy?: string;
  users: Set<string>;
  type: 'map' | 'document' | 'chat' | 'general';
  metadata?: any;
}

/**
 * WebSocket Server Manager
 * Handles WebSocket connections, rooms, and message routing
 */
export class WebSocketServerManager {
  private wss: WebSocketServer;
  private clients: Map<string, EnhancedWebSocket> = new Map();
  private rooms: Map<string, CollaborativeRoom> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private HEARTBEAT_INTERVAL = 30000; // 30 seconds
  
  constructor(server: HttpServer) {
    logger.info('Initializing WebSocket server');
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      clientTracking: true 
    });
    
    this.setupConnectionHandlers();
    this.startHeartbeat();
    
    logger.info('WebSocket server initialized');
  }
  
  /**
   * Set up connection handlers for the WebSocket server
   */
  private setupConnectionHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const enhancedWs = this.enhanceWebSocket(ws);
      this.clients.set(enhancedWs.id, enhancedWs);
      
      logger.info(`Client connected: ${enhancedWs.id}`);
      
      // Send welcome message
      this.sendToClient(enhancedWs, {
        type: MessageTypeEnum.SYSTEM,
        timestamp: Date.now(),
        payload: {
          message: 'Connected to WebSocket server',
          clientId: enhancedWs.id
        }
      });
      
      // Set up message handler
      enhancedWs.on('message', (data: RawData) => {
        enhancedWs.lastActivity = Date.now();
        this.handleMessage(enhancedWs, data);
      });
      
      // Set up pong handler for heartbeat
      enhancedWs.on('pong', () => {
        enhancedWs.isAlive = true;
      });
      
      // Handle client disconnection
      enhancedWs.on('close', () => {
        this.handleClose(enhancedWs);
      });
      
      // Handle errors
      enhancedWs.on('error', (error) => {
        logger.error(`WebSocket error for client ${enhancedWs.id}: ${error.message || 'Unknown error'}`);
        
        // Notify client about the error
        try {
          this.sendToClient(enhancedWs, {
            type: MessageTypeEnum.ERROR,
            timestamp: Date.now(),
            payload: {
              message: 'An error occurred with your connection'
            }
          });
        } catch (e) {
          // Ignore errors that might occur when trying to send to a broken connection
        }
      });
    });
    
    // Handle server errors
    this.wss.on('error', (error) => {
      logger.error(`WebSocket server error: ${error.message || 'Unknown error'}`);
    });
    
    logger.info('WebSocket connection handlers set up');
  }
  
  /**
   * Enhance a WebSocket with additional properties
   */
  private enhanceWebSocket(ws: WebSocket): EnhancedWebSocket {
    const enhancedWs = ws as EnhancedWebSocket;
    enhancedWs.id = uuidv4();
    enhancedWs.isAlive = true;
    enhancedWs.rooms = new Set();
    enhancedWs.lastActivity = Date.now();
    return enhancedWs;
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(ws: EnhancedWebSocket, data: RawData): void {
    let message: WebSocketMessage;
    
    try {
      message = JSON.parse(data.toString());
      
      // Store user information from the message
      if (message.userId && !ws.userId) {
        ws.userId = message.userId;
      }
      
      if (message.username && !ws.username) {
        ws.username = message.username;
      }
      
      // Route the message based on type
      switch (message.type) {
        case MessageTypeEnum.JOIN_ROOM:
          this.handleJoinRoom(ws, message);
          break;
          
        case MessageTypeEnum.LEAVE_ROOM:
          this.handleLeaveRoom(ws, message);
          break;
          
        case MessageTypeEnum.USER_PRESENCE:
          this.updateUserPresence(ws, message);
          break;
          
        case MessageTypeEnum.CHAT:
        case MessageTypeEnum.CURSOR_POSITION:
        case MessageTypeEnum.DRAWING:
        case MessageTypeEnum.FEATURE_EDIT:
        case MessageTypeEnum.ANNOTATION:
          // For these message types, broadcast to the room
          if (message.roomId && ws.rooms.has(message.roomId)) {
            this.broadcastToRoom(message.roomId, message, ws.id);
          } else {
            this.sendToClient(ws, {
              type: MessageTypeEnum.ERROR,
              timestamp: Date.now(),
              payload: {
                message: 'You must join a room before sending messages to it',
                originalType: message.type
              }
            });
          }
          break;
          
        default:
          logger.warn(`Unknown message type received: ${message.type}`);
          this.sendToClient(ws, {
            type: MessageTypeEnum.ERROR,
            timestamp: Date.now(),
            payload: {
              message: `Unknown message type: ${message.type}`
            }
          });
      }
    } catch (error) {
      logger.error(`Error handling WebSocket message: ${String(error)}`);
      this.sendToClient(ws, {
        type: MessageTypeEnum.ERROR,
        timestamp: Date.now(),
        payload: {
          message: 'Failed to process message: invalid format'
        }
      });
    }
  }
  
  /**
   * Handle client joining a room
   */
  private handleJoinRoom(ws: EnhancedWebSocket, message: WebSocketMessage): void {
    if (!message.roomId) {
      this.sendToClient(ws, {
        type: MessageTypeEnum.ERROR,
        timestamp: Date.now(),
        payload: {
          message: 'Room ID is required to join a room'
        }
      });
      return;
    }
    
    const roomId = message.roomId;
    const roomName = message.payload?.roomName || `Room-${roomId}`;
    const roomType = message.payload?.roomType || 'general';
    
    // Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.createRoom(roomId, roomName, roomType, ws.userId);
    }
    
    const room = this.rooms.get(roomId)!;
    
    // Add client to room
    ws.rooms.add(roomId);
    room.users.add(ws.id);
    
    logger.info(`Client ${ws.id} joined room ${roomId} (${roomName})`);
    
    // Notify client they joined
    this.sendToClient(ws, {
      type: MessageTypeEnum.SYSTEM,
      roomId,
      timestamp: Date.now(),
      payload: {
        action: 'joined',
        roomId,
        roomName: room.name,
        roomType: room.type,
        userCount: room.users.size
      }
    });
    
    // Notify other room users
    this.broadcastToRoom(roomId, {
      type: MessageTypeEnum.USER_PRESENCE,
      roomId,
      userId: ws.userId,
      username: ws.username,
      timestamp: Date.now(),
      payload: {
        action: 'joined',
        userId: ws.userId,
        username: ws.username
      }
    }, ws.id);
  }
  
  /**
   * Handle client leaving a room
   */
  private handleLeaveRoom(ws: EnhancedWebSocket, message: WebSocketMessage): void {
    if (!message.roomId) {
      this.sendToClient(ws, {
        type: MessageTypeEnum.ERROR,
        timestamp: Date.now(),
        payload: {
          message: 'Room ID is required to leave a room'
        }
      });
      return;
    }
    
    const roomId = message.roomId;
    
    this.removeClientFromRoom(ws, roomId);
  }
  
  /**
   * Update user presence information
   */
  private updateUserPresence(ws: EnhancedWebSocket, message: WebSocketMessage): void {
    if (!message.roomId) {
      this.sendToClient(ws, {
        type: MessageTypeEnum.ERROR,
        timestamp: Date.now(),
        payload: {
          message: 'Room ID is required for presence updates'
        }
      });
      return;
    }
    
    const roomId = message.roomId;
    
    if (!ws.rooms.has(roomId)) {
      this.sendToClient(ws, {
        type: MessageTypeEnum.ERROR,
        timestamp: Date.now(),
        payload: {
          message: 'You must join a room before sending presence updates to it'
        }
      });
      return;
    }
    
    // Broadcast presence update to room
    this.broadcastToRoom(roomId, message, ws.id);
  }
  
  /**
   * Handle client disconnection
   */
  private handleClose(ws: EnhancedWebSocket): void {
    logger.info(`Client disconnected: ${ws.id}`);
    
    // Remove client from all rooms
    for (const roomId of ws.rooms) {
      this.removeClientFromRoom(ws, roomId);
    }
    
    // Remove client from tracked clients
    this.clients.delete(ws.id);
  }
  
  /**
   * Remove a client from a room and notify others
   */
  private removeClientFromRoom(ws: EnhancedWebSocket, roomId: string): void {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return;
    }
    
    // Remove from room
    ws.rooms.delete(roomId);
    room.users.delete(ws.id);
    
    logger.info(`Client ${ws.id} left room ${roomId}`);
    
    // Notify other room users
    this.broadcastToRoom(roomId, {
      type: MessageTypeEnum.USER_PRESENCE,
      roomId,
      userId: ws.userId,
      username: ws.username,
      timestamp: Date.now(),
      payload: {
        action: 'left',
        userId: ws.userId,
        username: ws.username
      }
    }, ws.id);
    
    // If room is empty, remove it
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      logger.info(`Room ${roomId} removed (empty)`);
    }
  }
  
  /**
   * Create a new collaborative room
   */
  private createRoom(
    roomId: string,
    roomName: string,
    roomType: 'map' | 'document' | 'chat' | 'general' = 'general',
    createdBy?: string
  ): void {
    const room: CollaborativeRoom = {
      id: roomId,
      name: roomName,
      createdAt: new Date(),
      createdBy,
      users: new Set(),
      type: roomType
    };
    
    this.rooms.set(roomId, room);
    logger.info(`Room created: ${roomId} (${roomName})`);
  }
  
  /**
   * Send a message to a specific client
   */
  private sendToClient(ws: EnhancedWebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`Error sending message to client ${ws.id}: ${String(error)}`);
      }
    }
  }
  
  /**
   * Broadcast a message to all clients in a room
   */
  private broadcastToRoom(roomId: string, message: WebSocketMessage, excludeClientId?: string): void {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      logger.warn(`Attempted to broadcast to non-existent room: ${roomId}`);
      return;
    }
    
    for (const clientId of room.users) {
      if (excludeClientId && clientId === excludeClientId) {
        continue;
      }
      
      const client = this.clients.get(clientId);
      
      if (client) {
        this.sendToClient(client, message);
      }
    }
  }
  
  /**
   * Broadcast a message to all connected clients
   */
  private broadcastToAll(message: WebSocketMessage, excludeClientId?: string): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (excludeClientId && clientId === excludeClientId) {
        continue;
      }
      
      this.sendToClient(client, message);
    }
  }
  
  /**
   * Start the heartbeat interval to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, id) => {
        if (!client.isAlive) {
          logger.warn(`Client ${id} failed heartbeat, terminating connection`);
          client.terminate();
          return;
        }
        
        client.isAlive = false;
        client.ping();
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Get statistics about the WebSocket server
   */
  public getStats(): any {
    return {
      clients: this.clients.size,
      rooms: Array.from(this.rooms.entries()).map(([id, room]) => ({
        id,
        name: room.name,
        users: room.users.size,
        type: room.type
      }))
    };
  }
  
  /**
   * Get information about all rooms
   */
  public getRoomsStatus(): any[] {
    return Array.from(this.rooms.entries()).map(([id, room]) => ({
      id,
      name: room.name,
      userCount: room.users.size,
      type: room.type,
      createdAt: room.createdAt,
      createdBy: room.createdBy
    }));
  }
  
  /**
   * Get the count of active connections
   */
  public getActiveConnectionsCount(): number {
    return this.clients.size;
  }

  /**
   * Clean up resources when shutting down
   */
  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Close all connections gracefully
    this.clients.forEach(client => {
      client.close();
    });
    
    this.wss.close();
    logger.info('WebSocket server shut down');
  }
}