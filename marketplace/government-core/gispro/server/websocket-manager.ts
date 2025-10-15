import { Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './logger';

/**
 * WebSocket server manager for collaborative features
 * 
 * This class manages WebSocket connections, rooms, and messages for
 * real-time collaboration.
 */
export class WebSocketServerManager {
  private wss: WebSocketServer;
  private rooms: Map<string, Set<WebSocket>> = new Map();
  private clientRooms: Map<WebSocket, string> = new Map();
  private clientUsers: Map<WebSocket, string> = new Map(); // Maps WebSocket connections to user IDs
  private roomUsers: Map<string, Set<string>> = new Map(); // Maps room IDs to sets of user IDs
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    // Initialize WebSocket server with a specific path
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws'
    });
    
    logger.info('Initializing WebSocket server');
    
    // Set up connection handlers
    this.setupConnectionHandlers();
    
    // Start ping interval for connection health checks
    this.startPingInterval();
    
    logger.info('WebSocket server initialized');
  }
  
  private setupConnectionHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('New WebSocket connection established');
      
      // Handle messages from clients
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          logger.error(`Error parsing WebSocket message: ${error}`);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });
      
      // Handle client disconnection
      ws.on('close', () => {
        logger.info('WebSocket connection closed');
        this.handleDisconnect(ws);
      });
      
      // Handle connection errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error: ${error}`);
      });
      
      // Send initial connection confirmation
      ws.send(JSON.stringify({ 
        type: 'connected', 
        message: 'Connected to BentonGeoPro collaborative server' 
      }));
    });
    
    logger.info('WebSocket connection handlers set up');
  }
  
  private handleMessage(ws: WebSocket, data: any): void {
    const { type, roomId, payload, features, annotations, userId, activityType } = data;
    
    // If we have a userId, track it
    if (userId && userId !== this.clientUsers.get(ws)) {
      this.clientUsers.set(ws, userId);
      logger.info(`Associated userId ${userId} with WebSocket connection`);
    }
    
    // Automatically join room if roomId is specified but client is not in that room yet
    if (roomId && this.clientRooms.get(ws) !== roomId) {
      this.joinRoom(ws, roomId, userId || "anonymous");
    }
    
    switch (type) {
      case 'join':
        this.joinRoom(ws, roomId, userId || "anonymous");
        break;
        
      case 'leave':
        this.leaveRoom(ws);
        break;
        
      case 'map-event':
        this.broadcastToRoom(ws, roomId, {
          type: 'map-event',
          payload
        });
        break;
        
      case 'chat':
        this.broadcastToRoom(ws, roomId, {
          type: 'chat',
          sender: payload?.sender,
          message: payload?.message,
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'features':
        // Handle collaborative features update
        this.broadcastToRoom(ws, roomId, {
          type: 'features',
          features,
          userId
        });
        break;
        
      case 'annotations':
        // Handle annotations update
        this.broadcastToRoom(ws, roomId, {
          type: 'annotations',
          annotations,
          userId
        });
        break;
        
      case 'activity':
        // Handle user activity update
        this.broadcastToRoom(ws, roomId, {
          type: 'activity',
          activityType,
          userId,
          data: data.data
        });
        break;
        
      case 'heartbeat':
        // Process heartbeat to keep user active in the room
        break;
        
      case 'sync_request':
        // Client is requesting the current state
        // For now just acknowledge - in the future we could send actual state
        ws.send(JSON.stringify({
          type: 'sync_response',
          features: [], // In a real implementation, we'd get this from storage
          annotations: [] // In a real implementation, we'd get this from storage
        }));
        break;
        
      case 'pong':
        // Handle pong response from client
        break;
        
      default:
        logger.info(`Received unknown message type: ${type}`);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Unknown message type' 
        }));
    }
  }
  
  private joinRoom(ws: WebSocket, roomId: string, userId?: string): void {
    if (!roomId) {
      logger.warn('Attempted to join room with no roomId specified');
      return;
    }
    
    // Leave current room if client is in one
    this.leaveRoom(ws);
    
    // Get or create the room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
      this.roomUsers.set(roomId, new Set());
    }
    
    // Add client to room
    const room = this.rooms.get(roomId)!;
    room.add(ws);
    this.clientRooms.set(ws, roomId);
    
    // Track userId in room if provided
    if (userId) {
      const roomUsers = this.roomUsers.get(roomId)!;
      roomUsers.add(userId);
      
      // Keep the association between WebSocket and userId
      this.clientUsers.set(ws, userId);
    }
    
    // Notify client they've joined
    ws.send(JSON.stringify({ 
      type: 'joined', 
      roomId,
      userCount: room.size
    }));
    
    // Notify other clients in the room
    this.broadcastToRoom(ws, roomId, {
      type: 'user-joined',
      roomId,
      userId,
      userCount: room.size
    });
    
    logger.info(`Client joined room: ${roomId}, total clients in room: ${room.size}`);
    
    // Trigger room users update
    this.updateRoomUsers(roomId);
  }
  
  private leaveRoom(ws: WebSocket): void {
    const roomId = this.clientRooms.get(ws);
    const userId = this.clientUsers.get(ws);
    
    if (roomId && this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId)!;
      
      // Remove client from room
      room.delete(ws);
      
      // Remove userId from room users if tracked
      if (userId && this.roomUsers.has(roomId)) {
        const roomUsers = this.roomUsers.get(roomId)!;
        roomUsers.delete(userId);
        logger.info(`Removed user ${userId} from room ${roomId}`);
      }
      
      // Delete room if empty
      if (room.size === 0) {
        this.rooms.delete(roomId);
        this.roomUsers.delete(roomId);
        logger.info(`Room deleted (empty): ${roomId}`);
      } else {
        // Notify others in the room
        this.broadcastToRoom(ws, roomId, {
          type: 'user-left',
          roomId,
          userId,
          userCount: room.size
        });
        
        // Update the user list for remaining clients
        this.updateRoomUsers(roomId);
      }
      
      logger.info(`Client left room: ${roomId}, remaining clients: ${room.size}`);
    }
    
    // Remove client tracking references
    this.clientRooms.delete(ws);
  }
  
  private handleDisconnect(ws: WebSocket): void {
    // Handle proper room cleanup on disconnect
    this.leaveRoom(ws);
    
    // Remove user tracking reference
    this.clientUsers.delete(ws);
  }
  
  private broadcastToRoom(sender: WebSocket, roomId: string, message: any): void {
    if (!roomId || !this.rooms.has(roomId)) {
      logger.warn(`Attempt to broadcast to non-existent room: ${roomId}`);
      return;
    }
    
    const room = this.rooms.get(roomId)!;
    const messageStr = JSON.stringify(message);
    
    // Keep track of active users for this room
    const activeUsers = new Set<string>();
    
    if (message.userId) {
      activeUsers.add(message.userId);
    }
    
    room.forEach((client) => {
      // Don't send back to the sender
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
    
    // Broadcast list of active users after certain types of messages
    if (['join', 'features', 'activity', 'heartbeat'].includes(message.type)) {
      // In a full implementation, we'd gather all active users from a store
      this.updateRoomUsers(roomId);
    }
  }
  
  /**
   * Updates all clients in a room with the current list of active users
   */
  private updateRoomUsers(roomId: string): void {
    if (!this.rooms.has(roomId)) {
      return;
    }
    
    const room = this.rooms.get(roomId)!;
    const roomUsers = this.roomUsers.get(roomId);
    
    // Collect all userIds that are in this room
    const activeUserIds: string[] = [];
    
    if (roomUsers && roomUsers.size > 0) {
      // Convert Set to Array
      roomUsers.forEach(userId => {
        activeUserIds.push(userId);
      });
    } else {
      // Fallback: Try to extract userIds from WebSocket connections
      room.forEach(client => {
        const userId = this.clientUsers.get(client);
        if (userId) {
          activeUserIds.push(userId);
        }
      });
    }
    
    // Send the updated user list to all clients in the room
    room.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'users',
          users: activeUserIds,
          userCount: room.size
        }));
      }
    });
    
    logger.info(`Updated users for room ${roomId}: ${activeUserIds.length} active users`);
  }
  
  private startPingInterval(): void {
    // Send ping to all clients every 30 seconds to keep connections alive
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
      });
    }, 30000);
  }
  
  /**
   * Gets information about all active rooms
   */
  public getRoomsStatus(): { roomId: string; userCount: number }[] {
    const status: { roomId: string; userCount: number }[] = [];
    
    this.rooms.forEach((clients, roomId) => {
      status.push({
        roomId,
        userCount: clients.size
      });
    });
    
    return status;
  }
  
  /**
   * Gets the total number of active connections
   */
  public getActiveConnectionsCount(): number {
    return this.wss.clients.size;
  }
  
  /**
   * Shuts down the WebSocket server
   */
  public shutdown(): void {
    // Clean up interval on shutdown
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Close all connections
    this.wss.close();
  }
}