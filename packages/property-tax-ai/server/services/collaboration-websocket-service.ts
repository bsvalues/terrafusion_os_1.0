import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IStorage } from '../storage';
import { randomUUID } from 'crypto';
import { 
  CollaborationRole, 
  WorkflowSession, 
  InsertSharedWorkflowActivity 
} from '@shared/schema';

// Define message types for collaboration
export enum CollaborationMessageType {
  JOIN_SESSION = 'join_session',
  LEAVE_SESSION = 'leave_session',
  SESSION_UPDATE = 'session_update',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  CURSOR_POSITION = 'cursor_position',
  EDIT_OPERATION = 'edit_operation',
  COMMENT = 'comment',
  VALIDATION_RESULT = 'validation_result',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong'
}

// Define message interface for type safety
export interface CollaborationMessage {
  type: CollaborationMessageType;
  sessionId: string;
  userId: number;
  userName?: string;
  timestamp: number;
  payload?: any;
}

interface ClientConnection {
  socket: WebSocket;
  userId: number;
  userName: string;
  sessionId: string;
  role: CollaborationRole;
  lastActivity: Date;
}

interface SessionParticipant {
  userId: number;
  userName: string;
  role: CollaborationRole;
  cursorPosition?: {
    x: number;
    y: number;
    section?: string;
  };
  lastActivity: Date;
}

interface CollaborationSession {
  sessionId: string;
  sharedWorkflowId: number;
  participants: Map<number, SessionParticipant>;
  startTime: Date;
  lastActivity: Date;
  connections: WebSocket[];
}

class CollaborationWebSocketService {
  private wss: WebSocketServer | null = null;
  private storage: IStorage;
  private clients: Map<string, ClientConnection> = new Map();
  private sessions: Map<string, CollaborationSession> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval = 30000; // 30 seconds
  private debug = process.env.NODE_ENV !== 'production';

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  public initialize(server: HTTPServer): void {
    // Create WebSocket server with a specific path for collaboration
    console.log('Initializing Collaboration WebSocket service at path: /ws/collaboration');
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws/collaboration'
    });

    // Debug: Log WebSocket server instance details
    console.log('WebSocket server created:', {
      path: this.wss.options.path,
      clients: this.wss.clients.size,
    });

    // Set up event handlers
    this.wss.on('connection', (socket, request) => {
      console.log('New WebSocket connection received:', {
        url: request.url,
        headers: request.headers,
        method: request.method
      });
      this.handleConnection(socket);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
      this.handleWSServerError(error);
    });

    // Set up a ping interval to keep connections alive
    this.pingInterval = setInterval(() => {
      this.sendPingToAllClients();
    }, this.heartbeatInterval);

    console.log('Collaboration WebSocket service initialized');
  }

  private handleConnection(socket: WebSocket): void {
    const clientId = randomUUID();

    // Set up event handlers for this client
    socket.on('message', (data) => this.handleMessage(clientId, socket, data));
    socket.on('close', () => this.handleDisconnect(clientId));
    socket.on('error', (error) => this.handleClientError(clientId, error));

    // Log the connection if in debug mode
    if (this.debug) {
      console.log(`[CollabWS] Client connected: ${clientId}`);
    }

    // Send welcome message
    socket.send(JSON.stringify({
      type: 'connection_established',
      clientId,
      timestamp: Date.now(),
      message: 'Connected to collaboration server'
    }));
  }

  private async handleMessage(clientId: string, socket: WebSocket, data: WebSocket.Data): Promise<void> {
    try {
      const message = JSON.parse(data.toString()) as CollaborationMessage;
      
      if (!message || !message.type) {
        return this.sendErrorToClient(socket, 'Invalid message format');
      }

      // Process message based on type
      switch (message.type) {
        case CollaborationMessageType.JOIN_SESSION:
          await this.handleJoinSession(clientId, socket, message);
          break;
          
        case CollaborationMessageType.LEAVE_SESSION:
          await this.handleLeaveSession(clientId, message);
          break;
          
        case CollaborationMessageType.CURSOR_POSITION:
          this.handleCursorPosition(clientId, message);
          break;
          
        case CollaborationMessageType.EDIT_OPERATION:
          await this.handleEditOperation(clientId, message);
          break;
          
        case CollaborationMessageType.COMMENT:
          await this.handleComment(clientId, message);
          break;
          
        case CollaborationMessageType.PONG:
          this.handlePong(clientId);
          break;
          
        default:
          if (this.debug) {
            console.log(`[CollabWS] Unhandled message type: ${message.type}`);
          }
      }
    } catch (error) {
      console.error('[CollabWS] Error handling message:', error);
      this.sendErrorToClient(socket, 'Error processing message');
    }
  }

  private async handleJoinSession(
    clientId: string, 
    socket: WebSocket, 
    message: CollaborationMessage
  ): Promise<void> {
    const { sessionId, userId, userName, payload } = message;
    
    if (!sessionId || !userId) {
      return this.sendErrorToClient(socket, 'Session ID and User ID are required');
    }

    try {
      // Validate that the session exists
      const session = await this.storage.getWorkflowSessionById(sessionId);
      
      if (!session) {
        return this.sendErrorToClient(socket, 'Session not found');
      }
      
      // Check if user has permission to join this session
      const collaborator = await this.storage.getCollaboratorByUserAndWorkflow(
        userId, 
        session.sharedWorkflowId
      );
      
      // If user is not a collaborator and not the owner, deny access
      const sharedWorkflow = await this.storage.getSharedWorkflowById(session.sharedWorkflowId);
      if (!collaborator && sharedWorkflow?.createdBy !== userId) {
        return this.sendErrorToClient(socket, 'You do not have permission to join this session');
      }
      
      // Determine user role
      const role = collaborator?.role || 
        (sharedWorkflow?.createdBy === userId ? CollaborationRole.OWNER : CollaborationRole.VIEWER);
      
      // Register client connection
      const clientConnection: ClientConnection = {
        socket,
        userId,
        userName: userName || `User ${userId}`,
        sessionId,
        role,
        lastActivity: new Date()
      };
      
      this.clients.set(clientId, clientConnection);
      
      // Create or update session
      let collaborationSession = this.sessions.get(sessionId);
      
      if (!collaborationSession) {
        collaborationSession = {
          sessionId,
          sharedWorkflowId: session.sharedWorkflowId,
          participants: new Map(),
          startTime: new Date(),
          lastActivity: new Date(),
          connections: []
        };
        this.sessions.set(sessionId, collaborationSession);
      }
      
      // Add participant to session
      collaborationSession.participants.set(userId, {
        userId,
        userName: clientConnection.userName,
        role,
        lastActivity: new Date()
      });
      
      // Add socket to session connections
      collaborationSession.connections.push(socket);
      collaborationSession.lastActivity = new Date();
      
      // Update session participants in database
      const participantsList = Array.from(collaborationSession.participants.values())
        .map(p => ({
          userId: p.userId,
          userName: p.userName,
          role: p.role
        }));
      
      await this.storage.updateWorkflowSessionParticipants(sessionId, participantsList);
      
      // Log activity
      await this.logSessionActivity(session.sharedWorkflowId, userId, 'user_joined', {
        userName: clientConnection.userName,
        role
      });
      
      // Notify all participants in the session
      this.broadcastToSession(sessionId, {
        type: CollaborationMessageType.USER_JOINED,
        sessionId,
        userId,
        userName: clientConnection.userName,
        timestamp: Date.now(),
        payload: {
          participants: participantsList,
          role
        }
      });
      
      if (this.debug) {
        console.log(`[CollabWS] User ${userId} (${clientConnection.userName}) joined session ${sessionId}`);
      }
      
    } catch (error) {
      console.error('[CollabWS] Error joining session:', error);
      this.sendErrorToClient(socket, 'Failed to join collaboration session');
    }
  }

  private async handleLeaveSession(clientId: string, message: CollaborationMessage): Promise<void> {
    const client = this.clients.get(clientId);
    
    if (!client) {
      return;
    }
    
    const { sessionId, userId } = message;
    
    try {
      await this.removeParticipantFromSession(client.sessionId, client.userId, clientId);
      
      if (this.debug) {
        console.log(`[CollabWS] User ${client.userId} (${client.userName}) left session ${client.sessionId}`);
      }
    } catch (error) {
      console.error('[CollabWS] Error leaving session:', error);
    }
  }

  private handleCursorPosition(clientId: string, message: CollaborationMessage): void {
    const client = this.clients.get(clientId);
    
    if (!client) {
      return;
    }
    
    const { sessionId, userId, payload } = message;
    
    if (!payload || !payload.position) {
      return;
    }
    
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return;
    }
    
    // Update participant cursor position
    const participant = session.participants.get(userId);
    
    if (participant) {
      participant.cursorPosition = payload.position;
      participant.lastActivity = new Date();
      session.lastActivity = new Date();
    }
    
    // Broadcast cursor position to all session participants except sender
    this.broadcastToSession(sessionId, {
      type: CollaborationMessageType.CURSOR_POSITION,
      sessionId,
      userId,
      userName: client.userName,
      timestamp: Date.now(),
      payload: {
        position: payload.position
      }
    }, userId); // Exclude sender
  }

  private async handleEditOperation(clientId: string, message: CollaborationMessage): Promise<void> {
    const client = this.clients.get(clientId);
    
    if (!client) {
      return;
    }
    
    const { sessionId, userId, payload } = message;
    
    if (!payload || !payload.operation) {
      return;
    }
    
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return;
    }
    
    // Check if user has edit permission
    const participant = session.participants.get(userId);
    
    if (!participant || (participant.role !== CollaborationRole.EDITOR && participant.role !== CollaborationRole.OWNER)) {
      return this.sendErrorToClient(client.socket, 'You do not have permission to edit');
    }
    
    try {
      // Log edit activity
      await this.logSessionActivity(session.sharedWorkflowId, userId, 'workflow_edit', {
        operation: payload.operation,
        section: payload.section
      });
      
      // Update session last activity
      participant.lastActivity = new Date();
      session.lastActivity = new Date();
      
      // Broadcast edit operation to all session participants
      this.broadcastToSession(sessionId, {
        type: CollaborationMessageType.EDIT_OPERATION,
        sessionId,
        userId,
        userName: client.userName,
        timestamp: Date.now(),
        payload: {
          operation: payload.operation,
          section: payload.section
        }
      });
    } catch (error) {
      console.error('[CollabWS] Error processing edit operation:', error);
    }
  }

  private async handleComment(clientId: string, message: CollaborationMessage): Promise<void> {
    const client = this.clients.get(clientId);
    
    if (!client) {
      return;
    }
    
    const { sessionId, userId, payload } = message;
    
    if (!payload || !payload.comment) {
      return;
    }
    
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return;
    }
    
    try {
      // Log comment activity
      await this.logSessionActivity(session.sharedWorkflowId, userId, 'comment_added', {
        comment: payload.comment,
        position: payload.position
      });
      
      // Update participant last activity
      const participant = session.participants.get(userId);
      
      if (participant) {
        participant.lastActivity = new Date();
        session.lastActivity = new Date();
      }
      
      // Broadcast comment to all session participants
      this.broadcastToSession(sessionId, {
        type: CollaborationMessageType.COMMENT,
        sessionId,
        userId,
        userName: client.userName,
        timestamp: Date.now(),
        payload: {
          comment: payload.comment,
          position: payload.position
        }
      });
    } catch (error) {
      console.error('[CollabWS] Error processing comment:', error);
    }
  }

  private async removeParticipantFromSession(
    sessionId: string, 
    userId: number, 
    clientId: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return;
    }
    
    const client = this.clients.get(clientId);
    
    // Remove participant from session
    session.participants.delete(userId);
    
    // Remove socket from session connections
    const socketIndex = session.connections.findIndex(s => 
      s === (client ? client.socket : null)
    );
    
    if (socketIndex !== -1) {
      session.connections.splice(socketIndex, 1);
    }
    
    // Update session last activity
    session.lastActivity = new Date();
    
    // Remove client
    this.clients.delete(clientId);
    
    // If session is empty, remove it
    if (session.participants.size === 0) {
      this.sessions.delete(sessionId);
      
      // Update session status in database
      await this.storage.endWorkflowSession(sessionId);
    } else {
      // Update participants in database
      const participantsList = Array.from(session.participants.values())
        .map(p => ({
          userId: p.userId,
          userName: p.userName,
          role: p.role
        }));
      
      await this.storage.updateWorkflowSessionParticipants(sessionId, participantsList);
      
      // Notify remaining participants
      this.broadcastToSession(sessionId, {
        type: CollaborationMessageType.USER_LEFT,
        sessionId,
        userId,
        userName: client?.userName || `User ${userId}`,
        timestamp: Date.now(),
        payload: {
          participants: participantsList
        }
      });
    }
    
    // Log activity
    if (session.sharedWorkflowId) {
      await this.logSessionActivity(session.sharedWorkflowId, userId, 'user_left', {
        userName: client?.userName || `User ${userId}`
      });
    }
  }

  private handlePong(clientId: string): void {
    const client = this.clients.get(clientId);
    
    if (client) {
      client.lastActivity = new Date();
    }
  }

  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    
    if (client) {
      // Remove from any sessions
      this.removeParticipantFromSession(client.sessionId, client.userId, clientId)
        .catch(err => console.error('[CollabWS] Error removing participant on disconnect:', err));
      
      if (this.debug) {
        console.log(`[CollabWS] Client disconnected: ${clientId}`);
      }
    }
    
    // Remove client
    this.clients.delete(clientId);
  }

  private handleClientError(clientId: string, error: Error): void {
    console.error(`[CollabWS] Client error (${clientId}):`, error);
    
    // Attempt to disconnect the client
    this.handleDisconnect(clientId);
  }

  private handleWSServerError(error: Error): void {
    console.error('[CollabWS] WebSocket server error:', error);
  }

  private sendPingToAllClients(): void {
    const now = new Date();
    const staleTimeout = 2 * this.heartbeatInterval; // 2x heartbeat interval
    
    // Clean up stale connections
    this.clients.forEach((client, clientId) => {
      if (now.getTime() - client.lastActivity.getTime() > staleTimeout) {
        // Client hasn't responded in too long
        if (client.socket.readyState === 1) { // WebSocket.OPEN = 1
          client.socket.terminate();
        }
        this.handleDisconnect(clientId);
      } else if (client.socket.readyState === 1) { // WebSocket.OPEN = 1
        // Send ping
        client.socket.send(JSON.stringify({
          type: CollaborationMessageType.PING,
          timestamp: Date.now()
        }));
      }
    });
    
    // Clean up stale sessions
    this.sessions.forEach((session, sessionId) => {
      if (now.getTime() - session.lastActivity.getTime() > staleTimeout && session.participants.size === 0) {
        this.sessions.delete(sessionId);
        
        // End session in database
        this.storage.endWorkflowSession(sessionId)
          .catch(err => console.error('[CollabWS] Error ending stale session:', err));
      }
    });
  }

  private sendErrorToClient(socket: WebSocket, message: string): void {
    if (socket.readyState === 1) { // WebSocket.OPEN = 1
      socket.send(JSON.stringify({
        type: CollaborationMessageType.ERROR,
        timestamp: Date.now(),
        payload: {
          message
        }
      }));
    }
  }

  private broadcastToSession(
    sessionId: string, 
    message: CollaborationMessage, 
    excludeUserId?: number
  ): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return;
    }
    
    const messageString = JSON.stringify(message);
    
    session.connections.forEach(socket => {
      if (socket.readyState === 1) { // WebSocket.OPEN = 1
        // Find the client for this socket
        const clientEntry = Array.from(this.clients.entries())
          .find(([_, client]) => client.socket === socket && client.sessionId === sessionId);
        
        // Skip if this client should be excluded
        if (clientEntry && excludeUserId && clientEntry[1].userId === excludeUserId) {
          return;
        }
        
        socket.send(messageString);
      }
    });
  }

  private async logSessionActivity(
    sharedWorkflowId: number, 
    userId: number, 
    activityType: string, 
    details: any
  ): Promise<void> {
    try {
      const activity: InsertSharedWorkflowActivity = {
        sharedWorkflowId,
        userId,
        activityType,
        details,
        timestamp: new Date()
      };
      
      await this.storage.logWorkflowActivity(activity);
    } catch (error) {
      console.error('[CollabWS] Error logging activity:', error);
    }
  }

  // Public methods for external use

  public getActiveSessions(): any[] {
    return Array.from(this.sessions.values()).map(session => ({
      sessionId: session.sessionId,
      sharedWorkflowId: session.sharedWorkflowId,
      participantCount: session.participants.size,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      participants: Array.from(session.participants.values()).map(p => ({
        userId: p.userId,
        userName: p.userName,
        role: p.role,
        lastActivity: p.lastActivity
      }))
    }));
  }

  public getSessionInfo(sessionId: string): any | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    return {
      sessionId: session.sessionId,
      sharedWorkflowId: session.sharedWorkflowId,
      participantCount: session.participants.size,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      participants: Array.from(session.participants.values()).map(p => ({
        userId: p.userId,
        userName: p.userName,
        role: p.role,
        lastActivity: p.lastActivity
      }))
    };
  }

  public notifySessionUpdate(sessionId: string, updateData: any): void {
    this.broadcastToSession(sessionId, {
      type: CollaborationMessageType.SESSION_UPDATE,
      sessionId,
      userId: 0, // System user
      timestamp: Date.now(),
      payload: updateData
    });
  }

  public shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    
    this.sessions.clear();
    
    // Close all client connections
    this.clients.forEach(client => {
      if (client.socket.readyState === 1) { // WebSocket.OPEN = 1
        client.socket.close();
      }
    });
    
    this.clients.clear();
    
    console.log('Collaboration WebSocket service shutdown');
  }
}

export const collaborationWebSocketService = new CollaborationWebSocketService(null!);

// Method to initialize with storage
export function initializeCollaborationWebSocketService(storage: IStorage): void {
  (collaborationWebSocketService as any).storage = storage;
}