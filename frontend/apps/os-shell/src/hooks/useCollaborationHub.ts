/**
 * useCollaborationHub - Multi-User Collaboration Sessions Hook
 *
 * React hook for managing multi-user collaboration sessions with presence tracking,
 * chat communication, and activity broadcasting.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 3
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { HubConnection } from '@microsoft/signalr';
import { signalRService, ChatMessage as ChatMessageType } from '../services/SignalRService';

// ==================== TYPES ====================

export interface UserInfo {
  userId: number;
  userName: string;
  avatar?: string;
  role?: string;
}

export enum PresenceStatus {
  Active = 'Active',
  Away = 'Away',
  Busy = 'Busy',
  Offline = 'Offline',
}

export interface UserPresence extends UserInfo {
  connectionId: string;
  status: PresenceStatus;
  joinedAt: string;
  lastActivityAt: string;
}

export interface ChatMessage {
  messageId: string;
  sessionId: string;
  userId: number;
  userName: string;
  content: string;
  messageType: 'text' | 'code' | 'image' | 'file';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DirectMessage {
  messageId: string;
  fromUserId: number;
  fromUserName: string;
  content: string;
  timestamp: string;
}

export interface Notification {
  notificationId: string;
  sessionId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ActivityEvent {
  activityId: string;
  sessionId: string;
  userId: number;
  userName: string;
  activityType: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PointerPosition {
  userId: number;
  userName: string;
  x: number;
  y: number;
  context?: string;
  timestamp: string;
}

export interface TypingIndicator {
  userId: number;
  userName: string;
  isTyping: boolean;
  context?: string;
  timestamp: string;
}

export interface CollaborationHubState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  sessionId: string | null;
  activeUsers: UserInfo[];
  userPresence: Map<number, UserPresence>;
  chatMessages: ChatMessage[];
  directMessages: DirectMessage[];
  notifications: Notification[];
  activities: ActivityEvent[];
  pointers: Map<number, PointerPosition>;
  typingIndicators: Map<number, TypingIndicator>;
  sessionStats: {
    activeUsers: number;
    lastActivityAt: string | null;
  };
}

export interface CollaborationHubActions {
  joinSession: (sessionId: string, user: UserInfo) => Promise<void>;
  leaveSession: (sessionId: string) => Promise<void>;
  updatePresence: (sessionId: string, status: PresenceStatus) => Promise<void>;
  sendHeartbeat: (sessionId: string) => Promise<void>;
  sendChatMessage: (sessionId: string, content: string, messageType?: string) => Promise<void>;
  sendDirectMessage: (targetConnectionId: string, content: string) => Promise<void>;
  sendTypingIndicator: (sessionId: string, isTyping: boolean, context?: string) => Promise<void>;
  broadcastActivity: (
    sessionId: string,
    type: string,
    description: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  broadcastPointer: (sessionId: string, x: number, y: number, context?: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface UseCollaborationHubReturn {
  state: CollaborationHubState;
  actions: CollaborationHubActions;
  connection: HubConnection | null;
}

// ==================== HOOK ====================

/**
 * Custom hook for multi-user collaboration sessions
 *
 * @param enabled - Whether to connect (default: true)
 */
export function useCollaborationHub(enabled: boolean = true): UseCollaborationHubReturn {
  // ==================== STATE ====================

  const [state, setState] = useState<CollaborationHubState>({
    connected: false,
    connecting: false,
    error: null,
    sessionId: null,
    activeUsers: [],
    userPresence: new Map(),
    chatMessages: [],
    directMessages: [],
    notifications: [],
    activities: [],
    pointers: new Map(),
    typingIndicators: new Map(),
    sessionStats: {
      activeUsers: 0,
      lastActivityAt: null,
    },
  });

  const connectionRef = useRef<HubConnection | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // ==================== ACTIONS ====================

  const joinSession = useCallback(async (sessionId: string, user: UserInfo) => {
    if (!connectionRef.current) {
      throw new Error('Not connected to CollaborationHub');
    }

    await connectionRef.current.invoke('JoinSession', sessionId, user);
    setState((prev) => ({ ...prev, sessionId }));
  }, []);

  const leaveSession = useCallback(async (sessionId: string) => {
    if (!connectionRef.current) {
      throw new Error('Not connected to CollaborationHub');
    }

    await connectionRef.current.invoke('LeaveSession', sessionId);
    setState((prev) => ({ ...prev, sessionId: null }));
  }, []);

  const updatePresence = useCallback(async (sessionId: string, status: PresenceStatus) => {
    if (!connectionRef.current) {
      throw new Error('Not connected to CollaborationHub');
    }

    await connectionRef.current.invoke('UpdatePresence', sessionId, status);
  }, []);

  const sendHeartbeat = useCallback(async (sessionId: string) => {
    if (!connectionRef.current) {
      throw new Error('Not connected to CollaborationHub');
    }

    await connectionRef.current.invoke('SendHeartbeat', sessionId);
  }, []);

  const sendChatMessage = useCallback(
    async (sessionId: string, content: string, messageType: string = 'text') => {
      if (!connectionRef.current) {
        throw new Error('Not connected to CollaborationHub');
      }

      const message: ChatMessageType = {
        content,
        messageType,
        metadata: undefined,
      };

      await connectionRef.current.invoke('SendChatMessage', sessionId, message);
    },
    []
  );

  const sendDirectMessage = useCallback(async (targetConnectionId: string, content: string) => {
    if (!connectionRef.current) {
      throw new Error('Not connected to CollaborationHub');
    }

    const message = { content };
    await connectionRef.current.invoke('SendDirectMessage', targetConnectionId, message);
  }, []);

  const sendTypingIndicator = useCallback(
    async (sessionId: string, isTyping: boolean, context?: string) => {
      if (!connectionRef.current) {
        throw new Error('Not connected to CollaborationHub');
      }

      await connectionRef.current.invoke('SendTypingIndicator', sessionId, isTyping, context);
    },
    []
  );

  const broadcastActivity = useCallback(
    async (
      sessionId: string,
      type: string,
      description: string,
      metadata?: Record<string, any>
    ) => {
      if (!connectionRef.current) {
        throw new Error('Not connected to CollaborationHub');
      }

      const activity = { type, description, metadata };
      await connectionRef.current.invoke('BroadcastActivity', sessionId, activity);
    },
    []
  );

  const broadcastPointer = useCallback(
    async (sessionId: string, x: number, y: number, context?: string) => {
      if (!connectionRef.current) {
        throw new Error('Not connected to CollaborationHub');
      }

      const position = { x, y, context };
      await connectionRef.current.invoke('BroadcastPointer', sessionId, position);
    },
    []
  );

  const disconnect = useCallback(async () => {
    if (connectionRef.current && state.sessionId) {
      await signalRService.disconnectFromCollaboration(state.sessionId);
      connectionRef.current = null;
      setState((prev) => ({ ...prev, connected: false, sessionId: null }));
    }
  }, [state.sessionId]);

  // ==================== CONNECTION MANAGEMENT ====================

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const connect = async () => {
      try {
        setState((prev) => ({ ...prev, connecting: true, error: null }));

        // Connect to CollaborationHub (will join session separately)
        const connection = await signalRService.connectToCollaboration('temp', {
          userId: 0,
          userName: 'temp',
        });

        if (!mounted) {
          await signalRService.disconnectFromCollaboration('temp');
          return;
        }

        connectionRef.current = connection;

        // ==================== EVENT HANDLERS ====================

        // User joined
        connection.on(
          'UserJoined',
          (data: { sessionId: string; user: UserInfo; connectionId: string; joinedAt: string }) => {
            setState((prev) => ({
              ...prev,
              activeUsers: [...prev.activeUsers, data.user],
            }));
          }
        );

        // User left
        connection.on(
          'UserLeft',
          (data: { sessionId: string; user: UserInfo; connectionId: string; leftAt: string }) => {
            setState((prev) => ({
              ...prev,
              activeUsers: prev.activeUsers.filter((u) => u.userId !== data.user.userId),
            }));
          }
        );

        // Active users
        connection.on(
          'ActiveUsers',
          (data: { sessionId: string; users: UserInfo[]; totalUsers: number }) => {
            setState((prev) => ({
              ...prev,
              activeUsers: data.users,
              sessionStats: {
                ...prev.sessionStats,
                activeUsers: data.totalUsers,
              },
            }));
          }
        );

        // User disconnected
        connection.on(
          'UserDisconnected',
          (data: {
            sessionId: string;
            user: UserInfo;
            connectionId: string;
            disconnectedAt: string;
          }) => {
            setState((prev) => ({
              ...prev,
              activeUsers: prev.activeUsers.filter((u) => u.userId !== data.user.userId),
            }));
          }
        );

        // Presence updated
        connection.on(
          'PresenceUpdated',
          (data: {
            connectionId: string;
            userId: number;
            userName: string;
            status: PresenceStatus;
            updatedAt: string;
          }) => {
            setState((prev) => {
              const newPresence = new Map(prev.userPresence);
              const existing = newPresence.get(data.userId);
              if (existing) {
                newPresence.set(data.userId, {
                  ...existing,
                  status: data.status,
                  lastActivityAt: data.updatedAt,
                });
              }
              return { ...prev, userPresence: newPresence };
            });
          }
        );

        // Typing indicator
        connection.on('TypingIndicator', (indicator: TypingIndicator) => {
          setState((prev) => {
            const newIndicators = new Map(prev.typingIndicators);
            if (indicator.isTyping) {
              newIndicators.set(indicator.userId, indicator);
            } else {
              newIndicators.delete(indicator.userId);
            }
            return { ...prev, typingIndicators: newIndicators };
          });
        });

        // Chat message received
        connection.on('ChatMessageReceived', (message: ChatMessage) => {
          setState((prev) => ({
            ...prev,
            chatMessages: [...prev.chatMessages, message],
          }));
        });

        // Direct message received
        connection.on('DirectMessageReceived', (message: DirectMessage) => {
          setState((prev) => ({
            ...prev,
            directMessages: [...prev.directMessages, message],
          }));
        });

        // Notification received
        connection.on('NotificationReceived', (notification: Notification) => {
          setState((prev) => ({
            ...prev,
            notifications: [...prev.notifications, notification],
          }));
        });

        // Activity broadcast
        connection.on('ActivityBroadcast', (activity: ActivityEvent) => {
          setState((prev) => ({
            ...prev,
            activities: [...prev.activities, activity],
          }));
        });

        // Pointer update
        connection.on('PointerUpdate', (pointer: PointerPosition) => {
          setState((prev) => {
            const newPointers = new Map(prev.pointers);
            newPointers.set(pointer.userId, pointer);
            return { ...prev, pointers: newPointers };
          });
        });

        // Session stats updated
        connection.on(
          'SessionStatsUpdated',
          (stats: { sessionId: string; activeUsers: number; lastActivityAt: string }) => {
            setState((prev) => ({
              ...prev,
              sessionStats: {
                activeUsers: stats.activeUsers,
                lastActivityAt: stats.lastActivityAt,
              },
            }));
          }
        );

        setState((prev) => ({ ...prev, connected: true, connecting: false }));

        // Cleanup function
        cleanupRef.current = () => {
          connection.off('UserJoined');
          connection.off('UserLeft');
          connection.off('ActiveUsers');
          connection.off('UserDisconnected');
          connection.off('PresenceUpdated');
          connection.off('TypingIndicator');
          connection.off('ChatMessageReceived');
          connection.off('DirectMessageReceived');
          connection.off('NotificationReceived');
          connection.off('ActivityBroadcast');
          connection.off('PointerUpdate');
          connection.off('SessionStatsUpdated');
        };
      } catch (error) {
        console.error('❌ Failed to connect to CollaborationHub:', error);
        if (mounted) {
          setState((prev) => ({
            ...prev,
            connecting: false,
            error: error instanceof Error ? error.message : 'Connection failed',
          }));
        }
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      if (state.sessionId) {
        signalRService.disconnectFromCollaboration(state.sessionId).catch(console.error);
      }
    };
  }, [enabled, state.sessionId]);

  // ==================== RETURN ====================

  return {
    state,
    actions: {
      joinSession,
      leaveSession,
      updatePresence,
      sendHeartbeat,
      sendChatMessage,
      sendDirectMessage,
      sendTypingIndicator,
      broadcastActivity,
      broadcastPointer,
      disconnect,
    },
    connection: connectionRef.current,
  };
}

export default useCollaborationHub;
