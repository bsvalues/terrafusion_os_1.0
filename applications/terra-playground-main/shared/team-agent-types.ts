/**
 * Team Agent Types
 *
 * This file contains type definitions for team agents and related entities.
 */

/**
 * Team agent roles
 */
export enum TeamAgentRole {
  FRONTEND_DEVELOPER = 'frontend_developer',
  BACKEND_DEVELOPER = 'backend_developer',
  DESIGNER = 'designer',
  QA_TESTER = 'qa_tester',
  COUNTY_ASSESSOR = 'county_assessor',
}

/**
 * Team agent status
 */
export enum TeamAgentStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  AWAY = 'away',
  OFFLINE = 'offline',
}

/**
 * Team agent expertise level
 */
export enum ExpertiseLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  EXPERT = 'expert',
}

/**
 * Agent availability
 */
export interface AgentAvailability {
  hoursPerWeek: number;
  preferredWorkingHours: {
    start: string;
    end: string;
  };
  timeZone: string;
}

/**
 * Agent capabilities
 */
export interface AgentCapabilities {
  skills: string[];
  expertiseLevel: ExpertiseLevel;
  toolsAndFrameworks: string[];
  availability: AgentAvailability;
}

/**
 * Team agent model
 */
export interface TeamAgent {
  id: number;
  name: string;
  role: string;
  email: string;
  status: string;
  capabilities: AgentCapabilities;
  avatar: string | null;
  joinedAt: Date;
  lastActive: Date;
}

/**
 * Task priority levels
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Task status values
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

/**
 * Task model
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: number | null;
  dueDate: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  tags: string[];
  attachments: string[];
}

/**
 * Task comment model
 */
export interface TaskComment {
  id: string;
  taskId: string;
  userId: number;
  content: string;
  createdAt: Date;
}

/**
 * Team chat message model
 */
export interface TeamChatMessage {
  id: string;
  sessionId: string;
  fromUserId: number;
  content: string;
  timestamp: Date;
  threadId: string | null;
}

/**
 * Team collaboration session model
 */
export interface TeamCollaborationSession {
  id: string;
  name: string;
  description: string;
  createdBy: number;
  createdAt: Date;
  participants: number[];
  status: string;
  metadata: Record<string, any>;
}

/**
 * WebSocket message types
 */
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

/**
 * Base WebSocket message interface
 */
export interface BaseMessage {
  type: TeamCollaborationMessageType;
  timestamp: string;
}

/**
 * Authentication required message
 */
export interface AuthRequiredMessage extends BaseMessage {
  type: TeamCollaborationMessageType.AUTH_REQUIRED;
  connectionId: string;
}

/**
 * Authentication success message
 */
export interface AuthSuccessMessage extends BaseMessage {
  type: TeamCollaborationMessageType.AUTH_SUCCESS;
  userId: number;
  userName: string;
  sessionId: string;
}

/**
 * Session state message
 */
export interface SessionStateMessage extends BaseMessage {
  type: TeamCollaborationMessageType.SESSION_STATE;
  sessionId: string;
  participants: {
    userId: number;
    userName: string;
    userRole: string;
    status: string;
  }[];
  recentMessages: TeamChatMessage[];
}

/**
 * Chat message
 */
export interface ChatMessage extends BaseMessage {
  type: TeamCollaborationMessageType.CHAT_MESSAGE;
  sessionId: string;
  senderId: number;
  senderName: string;
  content: string;
}

/**
 * Status update message
 */
export interface StatusUpdateMessage extends BaseMessage {
  type: TeamCollaborationMessageType.STATUS_UPDATE;
  sessionId: string;
  senderId: number;
  senderName: string;
  status: string;
  activity: string;
}

/**
 * Task assigned message
 */
export interface TaskAssignedMessage extends BaseMessage {
  type: TeamCollaborationMessageType.TASK_ASSIGNED;
  sessionId: string;
  senderId: number;
  senderName: string;
  taskId: string;
  taskTitle: string;
  assigneeId: number;
  assigneeName: string;
  priority: string;
}

/**
 * Task updated message
 */
export interface TaskUpdatedMessage extends BaseMessage {
  type: TeamCollaborationMessageType.TASK_UPDATED;
  sessionId: string;
  senderId: number;
  senderName: string;
  taskId: string;
  taskTitle: string;
  updates: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

/**
 * Comment added message
 */
export interface CommentAddedMessage extends BaseMessage {
  type: TeamCollaborationMessageType.COMMENT_ADDED;
  sessionId: string;
  senderId: number;
  senderName: string;
  taskId: string;
  commentId: string;
  content: string;
}

/**
 * User activity message
 */
export interface UserActivityMessage extends BaseMessage {
  type: TeamCollaborationMessageType.USER_ACTIVITY;
  sessionId: string;
  userId: number;
  userName: string;
  activity: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Meeting reminder message
 */
export interface MeetingReminderMessage extends BaseMessage {
  type: TeamCollaborationMessageType.MEETING_REMINDER;
  sessionId: string;
  meetingId: string;
  title: string;
  startTime: string;
  participants: number[];
}

/**
 * Error message
 */
export interface ErrorMessage extends BaseMessage {
  type: TeamCollaborationMessageType.ERROR;
  errorCode: string;
  errorMessage: string;
}

/**
 * Authentication message
 * Sent from client to server to authenticate
 */
export interface AuthenticationMessage {
  type: 'authenticate';
  connectionId: string;
  sessionId: string;
  userId: number;
  userName: string;
  userRole: string;
}

/**
 * Union type of all message types
 */
export type TeamCollaborationMessage =
  | AuthRequiredMessage
  | AuthSuccessMessage
  | SessionStateMessage
  | ChatMessage
  | StatusUpdateMessage
  | TaskAssignedMessage
  | TaskUpdatedMessage
  | CommentAddedMessage
  | UserActivityMessage
  | MeetingReminderMessage
  | ErrorMessage;
