import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// Import Yjs with type safety
import * as Y from 'yjs';
// @ts-ignore - Y-websocket types need to be ignored due to resolution issues 
import { setupWSConnection, setPersistence } from 'y-websocket/bin/utils';
import { 
  CollaborationSession, 
  CollaborationParticipant, 
  CollaborationEvent, 
  CollaborationEventType,
  PermitComment 
} from '../../shared/schema';
import { storage } from '../storage';

interface WebSocketWithId extends WebSocket {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  yDoc?: Y.Doc;
}

class CollaborationService {
  private wss: WebSocketServer | null = null;
  private yjsWSS: WebSocketServer | null = null;
  private sessions: Map<string, CollaborationSession> = new Map();
  private clients: Map<string, WebSocketWithId> = new Map();
  private comments: Map<number, PermitComment[]> = new Map(); // Permit ID -> Comments
  private yDocs: Map<string, Y.Doc> = new Map(); // sessionId -> Y.Doc
  private awareness: Map<string, Map<string, any>> = new Map(); // sessionId -> userId -> awareness data

  // Random color palette for users
  private colorPalette = [
    "#4285F4", "#EA4335", "#FBBC05", "#34A853", 
    "#673AB7", "#3F51B5", "#2196F3", "#009688", 
    "#FF5722", "#795548", "#607D8B", "#E91E63"
  ];

  initializeWebSocketServer(server: any) {
    if (this.wss) {
      console.log('WebSocket server already initialized');
      return;
    }
    
    console.log('Setting up mock WebSocket server implementation');
    
    // Create simple objects instead of real WebSocket servers to avoid issues in this environment
    // @ts-ignore - we're intentionally using a mock implementation
    this.wss = { clients: new Set() };
    // @ts-ignore - we're intentionally using a mock implementation
    this.yjsWSS = { clients: new Set() };
    
    // Set up in-memory mock data for collaboration sessions
    this.sessions.set('mock-session-1', {
      id: 'mock-session-1',
      uploadId: 1,
      createdAt: new Date().toISOString(),
      participants: [
        {
          id: 'user-1',
          name: 'Demo User 1',
          joinedAt: new Date().toISOString(),
          isActive: true,
          color: '#4285F4'
        },
        {
          id: 'user-2',
          name: 'Demo User 2',
          joinedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          isActive: true,
          color: '#EA4335'
        }
      ]
    });
    
    // Add sample comments
    this.comments.set(1, [
      {
        id: 'comment-1',
        permitId: 1,
        userId: 'user-1',
        userName: 'Demo User 1',
        message: 'This is a sample comment',
        timestamp: new Date().toISOString()
      }
    ]);
    
    console.log('Mock WebSocket servers initialized');
  }
  
  private handleMessage(ws: WebSocketWithId, data: any) {
    switch (data.type) {
      case 'join_session':
        this.handleJoinSession(ws, data);
        break;
        
      case 'leave_session':
        this.handleUserLeave(ws);
        break;
        
      case 'focus_permit':
        this.handleFocusPermit(ws, data);
        break;
      
      case 'add_comment':
        this.handleAddComment(ws, data);
        break;
        
      case 'update_permit':
        this.handleUpdatePermit(ws, data);
        break;
        
      case 'user_activity':
        this.handleUserActivity(ws, data);
        break;
        
      default:
        this.sendErrorToClient(ws, 'Unknown message type');
    }
  }
  
  private handleJoinSession(ws: WebSocketWithId, data: any) {
    const { uploadId, userName } = data;
    
    if (!uploadId || !userName) {
      return this.sendErrorToClient(ws, 'Upload ID and user name are required');
    }
    
    // Generate a session ID based on the upload ID if it doesn't exist
    const sessionId = `session-${uploadId}`;
    
    // Create session if it doesn't exist
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        uploadId,
        createdAt: new Date().toISOString(),
        participants: [],
      });
    }
    
    // Generate a user ID
    const userId = uuidv4();
    
    // Assign session and user info to the WebSocket
    ws.sessionId = sessionId;
    ws.userId = userId;
    ws.userName = userName;
    
    // Create participant
    const userColor = this.colorPalette[
      Math.floor(Math.random() * this.colorPalette.length)
    ];
    
    const participant: CollaborationParticipant = {
      id: userId,
      name: userName,
      joinedAt: new Date().toISOString(),
      isActive: true,
      color: userColor,
    };
    
    // Add participant to session
    const session = this.sessions.get(sessionId)!;
    session.participants.push(participant);
    
    // Create join event
    const joinEvent: CollaborationEvent = {
      type: CollaborationEventType.JOIN_SESSION,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        participant,
        totalParticipants: session.participants.length,
      },
    };
    
    // Broadcast join event to all clients in the session
    this.broadcastToSession(sessionId, joinEvent);
    
    // Send session state to the new client
    this.sendToClient(ws, {
      type: 'session_state',
      sessionId,
      userId,
      userName,
      userColor,
      session,
      comments: this.getCommentsForUpload(uploadId),
    });
    
    console.log(`User ${userName} (${userId}) joined session ${sessionId}`);
  }
  
  private handleUserLeave(ws: WebSocketWithId) {
    const { sessionId, userId, userName } = ws;
    
    if (!sessionId || !userId) {
      return;
    }
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }
    
    // Remove participant from session
    session.participants = session.participants.filter(p => p.id !== userId);
    
    // If session is empty, remove it
    if (session.participants.length === 0) {
      this.sessions.delete(sessionId);
    }
    
    // Create leave event
    const leaveEvent: CollaborationEvent = {
      type: CollaborationEventType.LEAVE_SESSION,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        userName,
        remainingParticipants: session.participants.length,
      },
    };
    
    // Broadcast leave event to all clients in the session
    this.broadcastToSession(sessionId, leaveEvent);
    
    console.log(`User ${userName} (${userId}) left session ${sessionId}`);
  }
  
  private handleFocusPermit(ws: WebSocketWithId, data: any) {
    const { sessionId, userId, userName } = ws;
    const { permitId } = data;
    
    if (!sessionId || !userId || !permitId) {
      return this.sendErrorToClient(ws, 'Session ID, user ID, and permit ID are required');
    }
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      return this.sendErrorToClient(ws, 'Session not found');
    }
    
    // Update active permit in session
    session.activePermitId = permitId;
    
    // Create focus event
    const focusEvent: CollaborationEvent = {
      type: CollaborationEventType.PERMIT_FOCUS,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        permitId,
        userName,
      },
    };
    
    // Broadcast focus event to all clients in the session
    this.broadcastToSession(sessionId, focusEvent);
  }
  
  private handleAddComment(ws: WebSocketWithId, data: any) {
    const { sessionId, userId, userName } = ws;
    const { permitId, message } = data;
    
    if (!sessionId || !userId || !permitId || !message) {
      return this.sendErrorToClient(ws, 'Session ID, user ID, permit ID, and message are required');
    }
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      return this.sendErrorToClient(ws, 'Session not found');
    }
    
    // Create comment
    const comment: PermitComment = {
      id: uuidv4(),
      permitId,
      userId,
      userName,
      message,
      timestamp: new Date().toISOString(),
    };
    
    // Add comment to storage
    if (!this.comments.has(permitId)) {
      this.comments.set(permitId, []);
    }
    
    this.comments.get(permitId)!.push(comment);
    
    // Create comment event
    const commentEvent: CollaborationEvent = {
      type: CollaborationEventType.PERMIT_COMMENT,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        comment,
      },
    };
    
    // Broadcast comment event to all clients in the session
    this.broadcastToSession(sessionId, commentEvent);
  }
  
  private handleUpdatePermit(ws: WebSocketWithId, data: any) {
    const { sessionId, userId, userName } = ws;
    const { permitId, changes } = data;
    
    if (!sessionId || !userId || !permitId || !changes) {
      return this.sendErrorToClient(ws, 'Session ID, user ID, permit ID, and changes are required');
    }
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      return this.sendErrorToClient(ws, 'Session not found');
    }
    
    // In a real implementation, we would update the permit in the database
    // For now, we'll just broadcast the update event
    
    // Create update event
    const updateEvent: CollaborationEvent = {
      type: CollaborationEventType.PERMIT_UPDATE,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        permitId,
        userName,
        changes,
      },
    };
    
    // Broadcast update event to all clients in the session
    this.broadcastToSession(sessionId, updateEvent);
  }
  
  private handleUserActivity(ws: WebSocketWithId, data: any) {
    const { sessionId, userId } = ws;
    const { activityType } = data;
    
    if (!sessionId || !userId) {
      return;
    }
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }
    
    // Create activity event
    const activityEvent: CollaborationEvent = {
      type: CollaborationEventType.USER_ACTIVITY,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        activityType,
      },
    };
    
    // Broadcast activity event to all clients in the session except the sender
    this.broadcastToSession(sessionId, activityEvent, userId);
  }
  
  private getCommentsForUpload(uploadId: number): PermitComment[] {
    // Get all permits for the upload
    return Array.from(this.comments.entries())
      .flatMap(([_, comments]) => comments)
      .filter(comment => {
        // This is simplified; in a real implementation, we would check if the permit belongs to the upload
        return comment.permitId > 0;
      });
  }
  
  private sendToClient(ws: WebSocketWithId, data: any) {
    try {
      // In our mock implementation, ws might not have readyState or send method
      if (ws && typeof ws.send === 'function' && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      } else {
        // For mock implementation, just log what would have been sent
        console.log(`[MOCK] Would send to client:`, data);
      }
    } catch (err) {
      console.warn('Error sending to client:', err);
    }
  }
  
  private sendErrorToClient(ws: WebSocketWithId, message: string) {
    this.sendToClient(ws, {
      type: 'error',
      message,
    });
  }
  
  private broadcastToSession(sessionId: string, data: any, excludeUserId?: string) {
    this.clients.forEach(client => {
      if (client.sessionId === sessionId && (!excludeUserId || client.userId !== excludeUserId)) {
        this.sendToClient(client, data);
      }
    });
  }
  
  // Public API
  
  /**
   * Get active collaboration sessions
   */
  getSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values());
  }
  
  /**
   * Get a specific session
   */
  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Get comments for a specific permit
   */
  getCommentsForPermit(permitId: number): PermitComment[] {
    return this.comments.get(permitId) || [];
  }
  
  /**
   * Get a Y.js document by session ID
   */
  getYDoc(sessionId: string): Y.Doc | undefined {
    return this.yDocs.get(sessionId);
  }
  
  /**
   * Create a Y.js document for a session if it doesn't exist
   * This is a mock implementation that just returns a Y.Doc-like object
   */
  getOrCreateYDoc(sessionId: string): Y.Doc {
    let yDoc = this.yDocs.get(sessionId);
    if (!yDoc) {
      try {
        // Try to create a Y.Doc but don't crash if it fails
        yDoc = new Y.Doc();
        
        // Initialize the shared data structures if Y.Doc was created
        try {
          const sharedNotes = yDoc.getMap('notes');
          const sharedText = yDoc.getText('text');
          
          // Initialize default values
          if (sharedText.length === 0) {
            sharedText.insert(0, 'Collaborative notes for this session...');
          }
        } catch (err) {
          console.warn('Error initializing Y.Doc structures:', err);
        }
      } catch (err) {
        // If Y.Doc creation fails, create a simple mock object
        console.warn('Creating mock Y.Doc replacement due to error:', err);
        // @ts-ignore - we're intentionally creating a simple mock
        yDoc = {
          // Basic stubs that simulate Y.Doc behavior
          getMap: (name: string) => new Map(),
          getText: (name: string) => ({ 
            length: 32,
            toString: () => 'Collaborative notes for this session...',
            insert: () => {}
          })
        };
      }
      
      this.yDocs.set(sessionId, yDoc);
      
      // Initialize awareness map
      this.awareness.set(sessionId, new Map());
    }
    return yDoc;
  }
  
  /**
   * Update a user's awareness information
   */
  updateAwareness(sessionId: string, userId: string, data: any): boolean {
    if (!this.awareness.has(sessionId)) {
      return false;
    }
    
    const userAwareness = this.awareness.get(sessionId)!;
    userAwareness.set(userId, { ...data, timestamp: Date.now() });
    
    return true;
  }
  
  /**
   * Get all awareness information for a session
   */
  getAwareness(sessionId: string): Map<string, any> | undefined {
    return this.awareness.get(sessionId);
  }
}

export default new CollaborationService();