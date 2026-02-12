/**
 * Team Collaboration WebSocket Service
 *
 * This service enables real-time collaboration between team members
 * via WebSockets. It handles:
 * - User presence and status updates
 * - Real-time chat messages
 * - Task assignment notifications
 * - Activity streaming for team dashboards
 */

import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IStorage } from '../storage';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from './notification-service';

// Message types for team collaboration
export enum TeamCollaborationMessageType {
  JOIN_SESSION = 'join_session',
  LEAVE_SESSION = 'leave_session',
  CHAT_MESSAGE = 'chat_message',
  STATUS_UPDATE = 'status_update',
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  COMMENT_ADDED = 'comment_added',
  USER_ACTIVITY = 'user_activity',
  MEETING_REMINDER = 'meeting_reminder',
  ERROR = 'error',
  AUTH_REQUIRED = 'auth_required',
  AUTH_SUCCESS = 'auth_success',
  SESSION_STATE = 'session_state',
}

// Base message interface
interface TeamCollaborationMessage {
  type: TeamCollaborationMessageType;
  timestamp: string;
  sessionId?: string;
  senderId?: number;
  senderName?: string;
}

// Authentication required message
interface AuthRequiredMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.AUTH_REQUIRED;
  connectionId: string;
}

// Authentication success message
interface AuthSuccessMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.AUTH_SUCCESS;
  userId: number;
  userName: string;
}

// Session state message
interface SessionStateMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.SESSION_STATE;
  activeUsers: Array<{
    userId: number;
    userName: string;
    userRole: string;
    status: string;
    lastActivity: Date;
  }>;
  recentMessages: any[];
  recentActivities: any[];
}

// Join session message
interface JoinSessionMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.JOIN_SESSION;
  userId: number;
  userName: string;
  userRole: string;
}

// Leave session message
interface LeaveSessionMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.LEAVE_SESSION;
  userId: number;
  userName: string;
}

// Chat message
interface ChatMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.CHAT_MESSAGE;
  content: string;
  threadId?: string; // For threaded conversations
}

// Status update message
interface StatusUpdateMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.STATUS_UPDATE;
  status: string;
  activity?: string;
}

// Task assigned message
interface TaskAssignedMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.TASK_ASSIGNED;
  taskId: string;
  taskTitle: string;
  assigneeId: number;
  assigneeName: string;
  priority: string;
}

// Task updated message
interface TaskUpdatedMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.TASK_UPDATED;
  taskId: string;
  taskTitle: string;
  updatedFields: string[];
  updatedBy: number;
  updatedByName: string;
}

// Comment added message
interface CommentAddedMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.COMMENT_ADDED;
  taskId: string;
  commentId: string;
  content: string;
}

// User activity message
interface UserActivityMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.USER_ACTIVITY;
  userId: number;
  userName: string;
  activityType: string;
  entityType: string;
  entityId: string;
  details?: any;
}

// Meeting reminder message
interface MeetingReminderMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.MEETING_REMINDER;
  meetingId: string;
  title: string;
  startTime: string;
  durationMinutes: number;
  participantIds: number[];
}

// Error message
interface ErrorMessage extends TeamCollaborationMessage {
  type: TeamCollaborationMessageType.ERROR;
  errorCode: string;
  errorMessage: string;
}

// Authentication message from client
interface AuthenticationMessage {
  type: 'authenticate';
  connectionId: string;
  sessionId: string;
  userId: number;
  userName: string;
  userRole: string;
}

// Union type for all team messages
type TeamMessage =
  | JoinSessionMessage
  | LeaveSessionMessage
  | ChatMessage
  | StatusUpdateMessage
  | TaskAssignedMessage
  | TaskUpdatedMessage
  | CommentAddedMessage
  | UserActivityMessage
  | MeetingReminderMessage
  | ErrorMessage
  | AuthRequiredMessage
  | AuthSuccessMessage
  | SessionStateMessage;

// Client connection information
interface ClientConnection {
  socket: WebSocket;
  userId: number;
  userName: string;
  userRole: string;
  sessionId: string;
  lastActivity: Date;
  status?: string;
}

/**
 * Team Collaboration WebSocket Service
 * Manages real-time communication between team members
 */
export class TeamCollaborationWebSocketService {
  private wss: WebSocketServer;
  private storage: IStorage;
  private notificationService: NotificationService;

  // Map of session IDs to user connections
  private sessions: Map<string, Map<number, ClientConnection>> = new Map();

  // Pending authentication connections
  private pendingAuthentication: Map<string, { socket: WebSocket; authTimeout: NodeJS.Timeout }> =
    new Map();

  // Session activity storage
  private sessionActivity: Map<
    string,
    {
      chatMessages: ChatMessage[];
      userActivities: UserActivityMessage[];
    }
  > = new Map();

  // Authentication timeout in milliseconds
  private readonly AUTH_TIMEOUT = 30000; // 30 seconds

  /**
   * Constructor
   * @param server The HTTP server
   * @param storage The storage instance
   */
  constructor(server: Server, storage: IStorage) {
    this.storage = storage;
    this.notificationService = new NotificationService();

    // Create WebSocket server with enhanced debugging
    try {
      this.wss = new WebSocketServer({
        server,
        path: '/ws/team-collaboration',
        // Add more permissive config options
        perMessageDeflate: false,
        clientTracking: true,
        maxPayload: 50 * 1024 * 1024, // 50MB max payload
        skipUTF8Validation: true, // Be more permissive with message formats
        verifyClient: (info, callback) => {
          // Log headers for debugging
          console.log('[TeamWS] New connection attempt from:', info.origin);
          // Always accept the connection at this stage
          // We'll handle authentication after connection is established
          if (callback) callback(true);
          return true;
        },
      });

      // Add error handler for the WebSocket server itself
      this.wss.on('error', error => {
        console.error('[TeamWS] Server error:', error);
      });
    } catch (error) {
      console.error('Failed to create Team Collaboration WebSocket server:', error);
      // Create a dummy WSS to prevent null reference errors
      this.wss = new WebSocketServer({ noServer: true });
    }

    // Initialize WebSocket server
    this.initializeWebSocketServer();
  }

  /**
   * Initialize the WebSocket server and set up event handlers
   */
  private initializeWebSocketServer() {
    try {
      // Handle incoming connections
      this.wss.on('connection', (socket: WebSocket, request) => {
        // Add socket ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            try {
              socket.ping();
            } catch (error) {
              console.error('[TeamWS] Error sending ping:', error);
            }
          } else {
            clearInterval(pingInterval);
          }
        }, 30000); // Send ping every 30 seconds

        // Generate a unique connection ID
        const connectionId = uuidv4();
        // Require authentication
        try {
          this.sendAuthRequiredMessage(socket, connectionId);
        } catch (error) {
          console.error(`[TeamWS] Error sending auth required message:`, error);
        }

        // Set authentication timeout
        const authTimeout = setTimeout(() => {
          this.handleAuthenticationTimeout(connectionId);
        }, this.AUTH_TIMEOUT);

        // Store pending authentication
        this.pendingAuthentication.set(connectionId, { socket, authTimeout });

        // Handle incoming messages
        socket.on('message', async (data: any) => {
          try {
            console.log(
              '[TeamWS] Received message:',
              data.toString().substring(0, 200) + (data.toString().length > 200 ? '...' : '')
            );

            // Handle ping/pong messages for some clients that use this pattern
            if (data.toString() === 'ping') {
              socket.send('pong');
              return;
            }

            // Parse the message
            let message;
            try {
              message = JSON.parse(data.toString());
            } catch (parseError) {
              console.error(`[TeamWS] Error parsing message: ${parseError}`, data.toString());
              this.sendErrorMessage(
                socket,
                'invalid_message',
                'Invalid message format - expected JSON'
              );
              return;
            }

            // Handle authentication message
            if (message.type === 'authenticate') {
              await this.handleAuthentication(connectionId, socket, message);
              return;
            }

            // For all other messages, find the user by socket and ensure they're authenticated
            const connection = this.findUserConnection(socket);
            if (!connection) {
              this.sendErrorMessage(socket, 'not_authenticated', 'User not authenticated');
              return;
            }

            // Update last activity timestamp
            connection.lastActivity = new Date();

            // Handle the message
            await this.handleMessage(connection, message);
          } catch (error) {
            console.error('[TeamWS] Error handling WebSocket message:', error);
            try {
              this.sendErrorMessage(
                socket,
                'message_processing_error',
                'Failed to process message'
              );
            } catch (sendError) {
              console.error('[TeamWS] Error sending error message:', sendError);
            }
          }
        });

        // Handle pong responses to our ping messages
        socket.on('pong', () => {});

        // Handle disconnection
        socket.on('close', (code, reason) => {
          try {
            this.handleDisconnect(socket);

            // Clean up pending authentication if needed
            if (this.pendingAuthentication.has(connectionId)) {
              const pendingAuth = this.pendingAuthentication.get(connectionId);
              if (pendingAuth) {
                clearTimeout(pendingAuth.authTimeout);
                this.pendingAuthentication.delete(connectionId);
              }
            }

            // Clear ping interval
            clearInterval(pingInterval);
          } catch (error) {
            console.error('[TeamWS] Error handling WebSocket close event:', error);
          }
        });

        // Handle errors
        socket.on('error', error => {
          console.error('[TeamWS] WebSocket connection error:', error);
          try {
            // Try to send error to client
            this.sendErrorMessage(socket, 'connection_error', 'WebSocket connection error');
          } catch (sendError) {
            console.error(
              '[TeamWS] Failed to send error message after connection error:',
              sendError
            );
          }
        });
      });
    } catch (error) {
      console.error('[TeamWS] Error initializing WebSocket server:', error);
    }
  }

  /**
   * Send authentication required message to client
   * @param socket The WebSocket connection
   * @param connectionId The connection ID
   */
  private sendAuthRequiredMessage(socket: WebSocket, connectionId: string) {
    const message: AuthRequiredMessage = {
      type: TeamCollaborationMessageType.AUTH_REQUIRED,
      connectionId,
      timestamp: new Date().toISOString(),
    };

    socket.send(JSON.stringify(message));
  }

  /**
   * Handle authentication timeout
   * @param connectionId The connection ID
   */
  private handleAuthenticationTimeout(connectionId: string) {
    const pendingAuth = this.pendingAuthentication.get(connectionId);
    if (pendingAuth) {
      this.sendErrorMessage(pendingAuth.socket, 'auth_timeout', 'Authentication timeout');
      pendingAuth.socket.close();
      this.pendingAuthentication.delete(connectionId);
    }
  }

  /**
   * Handle authentication message
   * @param connectionId The connection ID
   * @param socket The WebSocket connection
   * @param message The authentication message
   */
  private async handleAuthentication(
    connectionId: string,
    socket: WebSocket,
    message: AuthenticationMessage
  ) {
    try {
      // Validate authentication message
      if (!message.userId || !message.userName || !message.sessionId) {
        this.sendErrorMessage(socket, 'invalid_auth', 'Invalid authentication data');
        return;
      }

      // Get pending authentication
      const pendingAuth = this.pendingAuthentication.get(connectionId);
      if (!pendingAuth) {
        this.sendErrorMessage(socket, 'invalid_connection', 'Connection not found');
        return;
      }

      // Clear authentication timeout
      clearTimeout(pendingAuth.authTimeout);
      this.pendingAuthentication.delete(connectionId);

      // Verify user exists in the database
      try {
        const user = await this.storage.getTeamMemberById(message.userId);
        if (!user) {
          this.sendErrorMessage(socket, 'user_not_found', 'User not found');
          return;
        }
      } catch (error) {
        console.error('Error verifying user:', error);
      }

      // Create session if it doesn't exist
      if (!this.sessions.has(message.sessionId)) {
        this.sessions.set(message.sessionId, new Map());
        this.sessionActivity.set(message.sessionId, {
          chatMessages: [],
          userActivities: [],
        });
      }

      // Get session
      const session = this.sessions.get(message.sessionId)!;

      // Check if user is already connected to the session
      if (session.has(message.userId)) {
        // Close the existing connection
        const existingConnection = session.get(message.userId)!;
        this.sendErrorMessage(
          existingConnection.socket,
          'session_taken',
          'Another client has connected with your user ID'
        );
        existingConnection.socket.close();
        session.delete(message.userId);
      }

      // Create new client connection
      const clientConnection: ClientConnection = {
        socket,
        userId: message.userId,
        userName: message.userName,
        userRole: message.userRole,
        sessionId: message.sessionId,
        lastActivity: new Date(),
        status: 'online',
      };

      // Add to session
      session.set(message.userId, clientConnection);

      // Send authentication success
      const successMessage: AuthSuccessMessage = {
        type: TeamCollaborationMessageType.AUTH_SUCCESS,
        userId: message.userId,
        userName: message.userName,
        timestamp: new Date().toISOString(),
      };
      socket.send(JSON.stringify(successMessage));

      // Send session state to the user
      await this.sendSessionState(message.sessionId, message.userId);

      // Broadcast join message to other users in the session
      const joinMessage: JoinSessionMessage = {
        type: TeamCollaborationMessageType.JOIN_SESSION,
        sessionId: message.sessionId,
        userId: message.userId,
        userName: message.userName,
        userRole: message.userRole,
        timestamp: new Date().toISOString(),
      };

      this.broadcastToSession(message.sessionId, joinMessage, [message.userId]);

      // Log user activity
      try {
        await this.storage.createSystemActivity({
          activity_type: 'team_collaboration',
          component: 'websocket',
          activity: 'user_joined',
          status: 'success',
          details: {
            userId: message.userId,
            userName: message.userName,
            sessionId: message.sessionId,
          },
        });
      } catch (error) {
        console.error('Error logging user activity:', error);
      }

      console.log(`[TeamWS] User ${message.userName} joined session ${message.sessionId}`);
    } catch (error) {
      console.error('Authentication error:', error);
      this.sendErrorMessage(socket, 'auth_error', 'Authentication failed');
    }
  }

  /**
   * Send the current session state to a user
   * @param sessionId The session ID
   * @param userId The user ID
   */
  private async sendSessionState(sessionId: string, userId: number) {
    try {
      // Get session
      const session = this.sessions.get(sessionId);
      if (!session) {
        return;
      }

      // Get user connection
      const userConnection = session.get(userId);
      if (!userConnection) {
        return;
      }

      // Get active users in the session
      const activeUsers = Array.from(session.values()).map(connection => ({
        userId: connection.userId,
        userName: connection.userName,
        userRole: connection.userRole,
        status: connection.status || 'online',
        lastActivity: connection.lastActivity,
      }));

      // Get recent session activity
      const { recentMessages, recentActivities } = await this.getRecentSessionActivity(sessionId);

      // Send session state
      const stateMessage: SessionStateMessage = {
        type: TeamCollaborationMessageType.SESSION_STATE,
        sessionId,
        activeUsers,
        recentMessages,
        recentActivities,
        timestamp: new Date().toISOString(),
      };

      userConnection.socket.send(JSON.stringify(stateMessage));
    } catch (error) {
      console.error('Error sending session state:', error);
    }
  }

  /**
   * Get recent activity for a session
   * @param sessionId The session ID
   */
  private async getRecentSessionActivity(sessionId: string) {
    const recentMessages: ChatMessage[] = [];
    const recentActivities: UserActivityMessage[] = [];

    // Get session activity
    const sessionActivity = this.sessionActivity.get(sessionId);
    if (sessionActivity) {
      // Get the 50 most recent chat messages
      recentMessages.push(...sessionActivity.chatMessages.slice(-50));

      // Get the 20 most recent user activities
      recentActivities.push(...sessionActivity.userActivities.slice(-20));
    }

    return { recentMessages, recentActivities };
  }

  /**
   * Handle a message from a client
   * @param connection The client connection
   * @param message The message
   */
  private async handleMessage(connection: ClientConnection, message: any) {
    // Set session ID, sender ID, and sender name if not provided
    if (!message.sessionId) {
      message.sessionId = connection.sessionId;
    }

    if (!message.senderId) {
      message.senderId = connection.userId;
    }

    if (!message.senderName) {
      message.senderName = connection.userName;
    }

    // Handle message based on type
    switch (message.type) {
      case TeamCollaborationMessageType.CHAT_MESSAGE:
        await this.handleChatMessage(connection.sessionId, message);
        break;

      case TeamCollaborationMessageType.STATUS_UPDATE:
        await this.handleStatusUpdate(connection.sessionId, message);
        break;

      case TeamCollaborationMessageType.TASK_ASSIGNED:
        await this.handleTaskAssigned(connection.sessionId, message);
        break;

      case TeamCollaborationMessageType.TASK_UPDATED:
        await this.handleTaskUpdated(connection.sessionId, message);
        break;

      case TeamCollaborationMessageType.COMMENT_ADDED:
        await this.handleCommentAdded(connection.sessionId, message);
        break;

      case TeamCollaborationMessageType.USER_ACTIVITY:
        await this.handleUserActivity(connection.sessionId, message);
        break;

      default:
        console.warn(`Unhandled message type: ${message.type}`);
    }
  }

  /**
   * Handle a chat message
   * @param sessionId The session ID
   * @param message The chat message
   */
  private async handleChatMessage(sessionId: string, message: ChatMessage) {
    try {
      // Broadcast the message to all users in the session
      this.broadcastToSession(sessionId, message);

      // Store the message in session activity
      const sessionActivity = this.sessionActivity.get(sessionId);
      if (sessionActivity) {
        sessionActivity.chatMessages.push(message);

        // Keep only the last 200 messages
        if (sessionActivity.chatMessages.length > 200) {
          sessionActivity.chatMessages = sessionActivity.chatMessages.slice(-200);
        }
      }

      // Record the message in the database
      try {
        // TODO: Implement chat message storage when the method is available
        // await this.storage.createTeamChatMessage({
        //   id: uuidv4(),
        //   sessionId,
        //   fromUserId: message.senderId!,
        //   content: message.content,
        //   timestamp: new Date(),
        //   threadId: message.threadId || null,
        // });
      } catch (error) {
        console.error('Error storing chat message:', error);
      }
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  }

  /**
   * Handle a status update
   * @param sessionId The session ID
   * @param message The status update message
   */
  private async handleStatusUpdate(sessionId: string, message: StatusUpdateMessage) {
    try {
      // Get the session
      const session = this.sessions.get(sessionId);
      if (!session) {
        return;
      }

      // Update the user's status
      const userConnection = session.get(message.senderId!);
      if (userConnection) {
        userConnection.status = message.status;
      }

      // Broadcast the status update to all users in the session
      this.broadcastToSession(sessionId, message);
    } catch (error) {
      console.error('Error handling status update:', error);
    }
  }

  /**
   * Handle a task assigned message
   * @param sessionId The session ID
   * @param message The task assigned message
   */
  private async handleTaskAssigned(sessionId: string, message: TaskAssignedMessage) {
    try {
      // Broadcast the task assignment to all users in the session
      this.broadcastToSession(sessionId, message);

      // Create user activity
      const activityMessage: UserActivityMessage = {
        type: TeamCollaborationMessageType.USER_ACTIVITY,
        sessionId,
        senderId: message.senderId,
        senderName: message.senderName,
        userId: message.senderId!,
        userName: message.senderName!,
        activityType: 'task_assigned',
        entityType: 'task',
        entityId: message.taskId,
        details: {
          taskTitle: message.taskTitle,
          assigneeId: message.assigneeId,
          assigneeName: message.assigneeName,
          priority: message.priority,
        },
        timestamp: new Date().toISOString(),
      };

      // Store the activity
      const sessionActivity = this.sessionActivity.get(sessionId);
      if (sessionActivity) {
        sessionActivity.userActivities.push(activityMessage);

        // Keep only the last 100 activities
        if (sessionActivity.userActivities.length > 100) {
          sessionActivity.userActivities = sessionActivity.userActivities.slice(-100);
        }
      }

      // Send notification
      try {
        await this.notificationService.sendUserNotification(
          message.assigneeId,
          'task_assigned',
          `Task assigned: ${message.taskTitle}`,
          {
            taskId: message.taskId,
            taskTitle: message.taskTitle,
            assignedBy: message.senderId,
            assignedByName: message.senderName,
            priority: message.priority,
          }
        );
      } catch (error) {
        console.error('Error sending task assigned notification:', error);
      }
    } catch (error) {
      console.error('Error handling task assigned:', error);
    }
  }

  /**
   * Handle a task updated message
   * @param sessionId The session ID
   * @param message The task updated message
   */
  private async handleTaskUpdated(sessionId: string, message: TaskUpdatedMessage) {
    try {
      // Broadcast the task update to all users in the session
      this.broadcastToSession(sessionId, message);

      // Create user activity
      const activityMessage: UserActivityMessage = {
        type: TeamCollaborationMessageType.USER_ACTIVITY,
        sessionId,
        senderId: message.senderId,
        senderName: message.senderName,
        userId: message.senderId!,
        userName: message.senderName!,
        activityType: 'task_updated',
        entityType: 'task',
        entityId: message.taskId,
        details: {
          taskTitle: message.taskTitle,
          updatedFields: message.updatedFields,
        },
        timestamp: new Date().toISOString(),
      };

      // Store the activity
      const sessionActivity = this.sessionActivity.get(sessionId);
      if (sessionActivity) {
        sessionActivity.userActivities.push(activityMessage);

        // Keep only the last 100 activities
        if (sessionActivity.userActivities.length > 100) {
          sessionActivity.userActivities = sessionActivity.userActivities.slice(-100);
        }
      }
    } catch (error) {
      console.error('Error handling task updated:', error);
    }
  }

  /**
   * Handle a comment added message
   * @param sessionId The session ID
   * @param message The comment added message
   */
  private async handleCommentAdded(sessionId: string, message: CommentAddedMessage) {
    try {
      // Broadcast the comment to all users in the session
      this.broadcastToSession(sessionId, message);

      // Create user activity
      const activityMessage: UserActivityMessage = {
        type: TeamCollaborationMessageType.USER_ACTIVITY,
        sessionId,
        senderId: message.senderId,
        senderName: message.senderName,
        userId: message.senderId!,
        userName: message.senderName!,
        activityType: 'comment_added',
        entityType: 'task',
        entityId: message.taskId,
        details: {
          commentId: message.commentId,
          content:
            message.content.length > 50
              ? message.content.substring(0, 50) + '...'
              : message.content,
        },
        timestamp: new Date().toISOString(),
      };

      // Store the activity
      const sessionActivity = this.sessionActivity.get(sessionId);
      if (sessionActivity) {
        sessionActivity.userActivities.push(activityMessage);

        // Keep only the last 100 activities
        if (sessionActivity.userActivities.length > 100) {
          sessionActivity.userActivities = sessionActivity.userActivities.slice(-100);
        }
      }

      // Get the task
      try {
        const task = await this.storage.getTask(message.taskId);
        if (task && task.assignedTo) {
          // Send notification to the assignee
          await this.notificationService.sendUserNotification(
            task.assignedTo,
            'comment_added',
            `New comment on task: ${task.title}`,
            {
              taskId: message.taskId,
              taskTitle: task.title,
              commentId: message.commentId,
              commentByUserId: message.senderId,
              commentByUserName: message.senderName,
              commentPreview:
                message.content.length > 50
                  ? message.content.substring(0, 50) + '...'
                  : message.content,
            }
          );
        }
      } catch (error) {
        console.error('Error sending comment notification:', error);
      }
    } catch (error) {
      console.error('Error handling comment added:', error);
    }
  }

  /**
   * Handle a user activity message
   * @param sessionId The session ID
   * @param message The user activity message
   */
  private async handleUserActivity(sessionId: string, message: UserActivityMessage) {
    try {
      // Broadcast the activity to all users in the session
      this.broadcastToSession(sessionId, message);

      // Store the activity
      const sessionActivity = this.sessionActivity.get(sessionId);
      if (sessionActivity) {
        sessionActivity.userActivities.push(message);

        // Keep only the last 100 activities
        if (sessionActivity.userActivities.length > 100) {
          sessionActivity.userActivities = sessionActivity.userActivities.slice(-100);
        }
      }
    } catch (error) {
      console.error('Error handling user activity:', error);
    }
  }

  /**
   * Handle client disconnection
   * @param socket The WebSocket connection
   */
  private handleDisconnect(socket: WebSocket) {
    try {
      // Find the user connection
      const connection = this.findUserConnection(socket);
      if (!connection) {
        return;
      }

      // Get the session
      const session = this.sessions.get(connection.sessionId);
      if (!session) {
        return;
      }

      // Remove the user from the session
      session.delete(connection.userId);

      // If the session is empty, remove it
      if (session.size === 0) {
        this.sessions.delete(connection.sessionId);
        this.sessionActivity.delete(connection.sessionId);
      } else {
        // Broadcast leave message to other users in the session
        const leaveMessage: LeaveSessionMessage = {
          type: TeamCollaborationMessageType.LEAVE_SESSION,
          sessionId: connection.sessionId,
          userId: connection.userId,
          userName: connection.userName,
          timestamp: new Date().toISOString(),
        };

        this.broadcastToSession(connection.sessionId, leaveMessage);
      }

      // Log user activity
      try {
        this.storage.createSystemActivity({
          activity_type: 'team_collaboration',
          component: 'websocket',
          status: 'user_left',
          details: {
            userId: connection.userId,
            userName: connection.userName,
            sessionId: connection.sessionId,
          },
        });
      } catch (error) {
        console.error('Error logging user disconnect:', error);
      }

      console.log(`[TeamWS] User ${connection.userName} left session ${connection.sessionId}`);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }

  /**
   * Broadcast a message to all users in a session
   * @param sessionId The session ID
   * @param message The message to broadcast
   * @param excludeUserIds User IDs to exclude from the broadcast
   */
  private broadcastToSession(
    sessionId: string,
    message: TeamMessage,
    excludeUserIds: number[] = []
  ) {
    try {
      // Get the session
      const session = this.sessions.get(sessionId);
      if (!session) {
        return;
      }

      // Ensure the message has a timestamp
      if (!message.timestamp) {
        message.timestamp = new Date().toISOString();
      }

      // Broadcast to all users in the session except excluded ones
      const messageString = JSON.stringify(message);

      for (const [userId, connection] of session.entries()) {
        if (excludeUserIds.includes(userId)) {
          continue;
        }

        if (connection.socket.readyState === WebSocket.OPEN) {
          connection.socket.send(messageString);
        }
      }
    } catch (error) {
      console.error('Error broadcasting message:', error);
    }
  }

  /**
   * Find a user connection by socket
   * @param socket The WebSocket connection
   * @returns The user connection or undefined if not found
   */
  private findUserConnection(socket: WebSocket): ClientConnection | undefined {
    for (const [sessionId, session] of this.sessions.entries()) {
      for (const [userId, connection] of session.entries()) {
        if (connection.socket === socket) {
          return connection;
        }
      }
    }

    return undefined;
  }

  /**
   * Send a message to a specific user
   * @param sessionId The session ID
   * @param userId The user ID
   * @param message The message to send
   */
  public sendMessageToUser(sessionId: string, userId: number, message: any) {
    try {
      // Get the session
      const session = this.sessions.get(sessionId);
      if (!session) {
        return false;
      }

      // Get the user connection
      const connection = session.get(userId);
      if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
        return false;
      }

      // Ensure the message has a timestamp
      if (!message.timestamp) {
        message.timestamp = new Date().toISOString();
      }

      // Send the message
      connection.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message to user:', error);
      return false;
    }
  }

  /**
   * Send an error message to a client
   * @param socket The WebSocket connection
   * @param errorCode The error code
   * @param errorMessage The error message
   */
  private sendErrorMessage(socket: WebSocket, errorCode: string, errorMessage: string) {
    try {
      if (socket.readyState !== WebSocket.OPEN) {
        return;
      }

      const message: ErrorMessage = {
        type: TeamCollaborationMessageType.ERROR,
        errorCode,
        errorMessage,
        timestamp: new Date().toISOString(),
      };

      socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending error message:', error);
    }
  }

  /**
   * Broadcast a system message to all users in a session
   * @param sessionId The session ID
   * @param messageType The message type
   * @param messageData Additional message data
   */
  public broadcastSystemMessage(
    sessionId: string,
    messageType: TeamCollaborationMessageType,
    messageData: any
  ) {
    try {
      const message = {
        type: messageType,
        ...messageData,
        sessionId,
        timestamp: new Date().toISOString(),
      };

      this.broadcastToSession(sessionId, message as TeamMessage);
      return true;
    } catch (error) {
      console.error('Error broadcasting system message:', error);
      return false;
    }
  }

  /**
   * Get active sessions
   * @returns Map of session IDs to user counts
   */
  public getActiveSessions() {
    const activeSessions = new Map<string, number>();

    for (const [sessionId, session] of this.sessions.entries()) {
      activeSessions.set(sessionId, session.size);
    }

    return activeSessions;
  }

  /**
   * Get active users in a session
   * @param sessionId The session ID
   * @returns Array of active user information
   */
  public getActiveUsersInSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    return Array.from(session.values()).map(connection => ({
      userId: connection.userId,
      userName: connection.userName,
      userRole: connection.userRole,
      status: connection.status || 'online',
      lastActivity: connection.lastActivity,
    }));
  }
}
