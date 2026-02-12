/**
 * Collaboration Types
 *
 * Types for the collaboration WebSocket service
 */

/**
 * Message types for collaboration WebSocket service
 */
export enum CollaborationMessageType {
  // Connection messages
  CONNECTION_ESTABLISHED = 'connection_established',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',

  // Session messages
  JOIN_SESSION = 'join_session',
  LEAVE_SESSION = 'leave_session',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  SESSION_INFO = 'session_info',
  SESSION_LIST = 'session_list',

  // Presence messages
  CURSOR_POSITION = 'cursor_position',
  USER_ACTIVITY = 'user_activity',
  USER_PRESENCE = 'user_presence',

  // Editing messages
  EDIT_OPERATION = 'edit_operation',
  EDIT_APPLIED = 'edit_applied',
  SYNC_STATE = 'sync_state',
  LOCK_SECTION = 'lock_section',
  UNLOCK_SECTION = 'unlock_section',
  SECTION_LOCKED = 'section_locked',
  SECTION_UNLOCKED = 'section_unlocked',

  // Communication messages
  CHAT_MESSAGE = 'chat_message',
  COMMENT = 'comment',
  NOTIFICATION = 'notification',
}

/**
 * Collaboration user role
 */
export type CollaborationUserRole = 'owner' | 'editor' | 'viewer';

/**
 * Collaboration user
 */
export interface CollaborationUser {
  userId: number;
  userName: string;
  role: CollaborationUserRole;
  isActive: boolean;
  lastSeen?: number;
  cursorPosition?: {
    x: number;
    y: number;
    section?: string;
  };
}

/**
 * Collaboration session
 */
export interface CollaborationSession {
  sessionId: string;
  name: string;
  ownerId: number;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'inactive' | 'archived';
  participants: CollaborationUser[];
  metadata?: Record<string, any>;
}

/**
 * Base message interface
 */
export interface CollaborationBaseMessage {
  type: CollaborationMessageType | string;
  sessionId?: string;
  userId?: number;
  userName?: string;
  timestamp: number;
  payload?: any;
}

/**
 * Session join message
 */
export interface JoinSessionMessage extends CollaborationBaseMessage {
  type: CollaborationMessageType.JOIN_SESSION;
  sessionId: string;
  userId: number;
  userName: string;
  payload: {
    role: CollaborationUserRole;
  };
}

/**
 * Session leave message
 */
export interface LeaveSessionMessage extends CollaborationBaseMessage {
  type: CollaborationMessageType.LEAVE_SESSION;
  sessionId: string;
  userId: number;
  userName: string;
}

/**
 * Cursor position message
 */
export interface CursorPositionMessage extends CollaborationBaseMessage {
  type: CollaborationMessageType.CURSOR_POSITION;
  sessionId: string;
  userId: number;
  userName: string;
  payload: {
    position: {
      x: number;
      y: number;
      section?: string;
    };
  };
}

/**
 * Edit operation message
 */
export interface EditOperationMessage extends CollaborationBaseMessage {
  type: CollaborationMessageType.EDIT_OPERATION;
  sessionId: string;
  userId: number;
  userName: string;
  payload: {
    operation: any;
    section: string;
  };
}

/**
 * Comment message
 */
export interface CommentMessage extends CollaborationBaseMessage {
  type: CollaborationMessageType.COMMENT;
  sessionId: string;
  userId: number;
  userName: string;
  payload: {
    text: string;
    position?: any;
  };
}

/**
 * Chat message
 */
export interface ChatMessage extends CollaborationBaseMessage {
  type: CollaborationMessageType.CHAT_MESSAGE;
  sessionId: string;
  userId: number;
  userName: string;
  payload: {
    text: string;
  };
}

/**
 * Error message
 */
export interface ErrorMessage extends CollaborationBaseMessage {
  type: CollaborationMessageType.ERROR;
  message: string;
}

/**
 * Union type of all collaboration message types
 */
export type CollaborationMessage =
  | JoinSessionMessage
  | LeaveSessionMessage
  | CursorPositionMessage
  | EditOperationMessage
  | CommentMessage
  | ChatMessage
  | ErrorMessage
  | CollaborationBaseMessage;
