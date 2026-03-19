/**
 * CollaborationProvider - Real-Time Collaboration Context
 *
 * Production-ready context provider for managing collaborative editing sessions,
 * presence awareness, and real-time synchronization.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 7 Day 2
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

// ==================== TYPES ====================

export interface User {
  userId: string;
  userName: string;
  color: string;
  avatar?: string;
}

export interface CursorPosition {
  line: number;
  column: number;
  cellId?: string;
}

export interface TextSelection {
  start: CursorPosition;
  end: CursorPosition;
}

export interface RemoteCursor {
  userId: string;
  userName: string;
  color: string;
  position: CursorPosition;
  selection?: TextSelection;
  lastUpdate: Date;
}

export interface SessionParticipant {
  userId: string;
  userName: string;
  connectionId: string;
  color: string;
  joinedAt: Date;
  lastSeenAt: Date;
  cursor?: CursorPosition;
  selection?: TextSelection;
  isActive: boolean;
}

export interface ChangeOperation {
  type: 'insert' | 'delete' | 'replace';
  position: number;
  newText?: string;
  deleteLength?: number;
  cellId?: string;
}

export interface CollaborationContextValue {
  // Connection state
  isConnected: boolean;
  sessionId: string | null;
  currentUser: User | null;

  // Session management
  createSession: (documentId: string, user: User) => Promise<string>;
  joinSession: (sessionId: string, user: User) => Promise<void>;
  leaveSession: () => Promise<void>;

  // Participants
  participants: SessionParticipant[];
  remoteCursors: RemoteCursor[];

  // Content synchronization
  applyChanges: (operations: ChangeOperation[]) => Promise<void>;
  updateCursor: (position: CursorPosition) => void;
  updateSelection: (selection: TextSelection) => void;

  // Events
  onContentChange: (handler: (operations: ChangeOperation[], userId: string) => void) => void;
  onCursorMove: (handler: (cursor: RemoteCursor) => void) => void;
  onUserJoined: (handler: (participant: SessionParticipant) => void) => void;
  onUserLeft: (handler: (userId: string) => void) => void;

  // Version tracking
  localVersion: number;
  serverVersion: number;
  pendingChanges: ChangeOperation[];
}

// ==================== CONTEXT ====================

const CollaborationContext = createContext<CollaborationContextValue | undefined>(undefined);

export function useCollaboration(): CollaborationContextValue {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider');
  }
  return context;
}

// ==================== PROVIDER ====================

export interface CollaborationProviderProps {
  children: React.ReactNode;
  hubUrl?: string;
}

export function CollaborationProvider({ children, hubUrl = '/hubs/collaboration' }: CollaborationProviderProps) {
  // ==================== STATE ====================

  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [localVersion, setLocalVersion] = useState(0);
  const [serverVersion, setServerVersion] = useState(0);
  const [pendingChanges, setPendingChanges] = useState<ChangeOperation[]>([]);

  // Event handlers
  const contentChangeHandlers = useRef<((operations: ChangeOperation[], userId: string) => void)[]>([]);
  const cursorMoveHandlers = useRef<((cursor: RemoteCursor) => void)[]>([]);
  const userJoinedHandlers = useRef<((participant: SessionParticipant) => void)[]>([]);
  const userLeftHandlers = useRef<((userId: string) => void)[]>([]);

  // SignalR connection
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // ==================== CONNECTION SETUP ====================

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0s, 2s, 10s, 30s
          if (retryContext.elapsedMilliseconds < 60000) {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
          return null; // Stop retrying after 1 minute
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    // Connection lifecycle events
    connection.onreconnecting(() => {
      setIsConnected(false);
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      // Re-sync with server after reconnection
      if (sessionId && currentUser) {
        joinSession(sessionId, currentUser);
      }
    });

    connection.onclose(() => {
      setIsConnected(false);
    });

    // Setup event handlers
    setupEventHandlers(connection);

    // Start connection
    connection
      .start()
      .then(() => {
        setIsConnected(true);
      })
      .catch((error) => {
      });

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [hubUrl]);

  // ==================== EVENT HANDLERS SETUP ====================

  const setupEventHandlers = (connection: signalR.HubConnection) => {
    // Receive content changes from other users
    connection.on('ReceiveChanges', (data: { userId: string; operations: ChangeOperation[]; version: number }) => {
      setServerVersion(data.version);

      // Notify handlers
      contentChangeHandlers.current.forEach((handler) => {
        handler(data.operations, data.userId);
      });
    });

    // Remote cursor movement
    connection.on('CursorMoved', (data: { userId: string; position: CursorPosition }) => {
      const participant = participants.find((p) => p.userId === data.userId);
      if (!participant) return;

      const cursor: RemoteCursor = {
        userId: data.userId,
        userName: participant.userName,
        color: participant.color,
        position: data.position,
        lastUpdate: new Date(),
      };

      setRemoteCursors((prev) => {
        const filtered = prev.filter((c) => c.userId !== data.userId);
        return [...filtered, cursor];
      });

      cursorMoveHandlers.current.forEach((handler) => handler(cursor));
    });

    // Remote selection change
    connection.on('SelectionChanged', (data: { userId: string; selection: TextSelection }) => {
      const participant = participants.find((p) => p.userId === data.userId);
      if (!participant) return;

      setRemoteCursors((prev) => {
        return prev.map((cursor) =>
          cursor.userId === data.userId ? { ...cursor, selection: data.selection, lastUpdate: new Date() } : cursor
        );
      });
    });

    // User joined
    connection.on('UserJoined', (data: { userId: string; userName: string }) => {
    });

    // User left
    connection.on('UserLeft', (data: { userId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
      setRemoteCursors((prev) => prev.filter((c) => c.userId !== data.userId));
      userLeftHandlers.current.forEach((handler) => handler(data.userId));
    });

    // User typing indicator
    connection.on('UserTyping', (data: { userId: string; isTyping: boolean }) => {
      // Update participant typing state
      setParticipants((prev) =>
        prev.map((p) => (p.userId === data.userId ? { ...p, isActive: data.isTyping } : p))
      );
    });

    // Receive notification
    connection.on('ReceiveNotification', (data: { type: string; message: string }) => {
    });
  };

  // ==================== SESSION MANAGEMENT ====================

  const createSession = useCallback(
    async (documentId: string, user: User): Promise<string> => {
      if (!connectionRef.current) throw new Error('Not connected');

      const response = await fetch('/api/collaboration/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, userId: user.userId, userName: user.userName }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const session = await response.json();

      setSessionId(session.sessionId);
      setCurrentUser(user);
      setServerVersion(session.version);

      return session.sessionId;
    },
    []
  );

  const joinSession = useCallback(
    async (newSessionId: string, user: User): Promise<void> => {
      if (!connectionRef.current) throw new Error('Not connected');

      try {
        const session = await connectionRef.current.invoke('JoinSession', newSessionId, {
          userId: parseInt(user.userId),
          userName: user.userName,
          avatar: user.avatar,
        });

        setSessionId(newSessionId);
        setCurrentUser(user);
        setParticipants(session.participants || []);
        setServerVersion(session.version || 0);

      } catch (error) {
        throw error;
      }
    },
    []
  );

  const leaveSession = useCallback(async (): Promise<void> => {
    if (!connectionRef.current || !sessionId) return;

    try {
      await connectionRef.current.invoke('LeaveSession', sessionId, currentUser?.userId);

      setSessionId(null);
      setCurrentUser(null);
      setParticipants([]);
      setRemoteCursors([]);
      setPendingChanges([]);

    } catch (error) {
    }
  }, [sessionId, currentUser]);

  // ==================== CONTENT SYNCHRONIZATION ====================

  const applyChanges = useCallback(
    async (operations: ChangeOperation[]): Promise<void> => {
      if (!connectionRef.current || !sessionId || !currentUser) return;

      try {
        // Add to pending changes
        setPendingChanges((prev) => [...prev, ...operations]);

        // Send to server
        const response = await connectionRef.current.invoke(
          'SyncChanges',
          sessionId,
          localVersion,
          operations,
          currentUser.userId
        );

        setLocalVersion(response.currentVersion);
        setServerVersion(response.currentVersion);

        // Clear sent changes from pending
        setPendingChanges((prev) => prev.slice(operations.length));
      } catch (error) {
      }
    },
    [sessionId, currentUser, localVersion]
  );

  const updateCursor = useCallback(
    (position: CursorPosition): void => {
      if (!connectionRef.current || !sessionId || !currentUser) return;

      // Throttle cursor updates to avoid flooding the network
      connectionRef.current
        .invoke('UpdateCursor', sessionId, currentUser.userId, position)
        .catch((error) => console.error('Failed to update cursor:', error));
    },
    [sessionId, currentUser]
  );

  const updateSelection = useCallback(
    (selection: TextSelection): void => {
      if (!connectionRef.current || !sessionId || !currentUser) return;

      connectionRef.current
        .invoke('UpdateSelection', sessionId, currentUser.userId, selection)
        .catch((error) => console.error('Failed to update selection:', error));
    },
    [sessionId, currentUser]
  );

  // ==================== EVENT SUBSCRIPTIONS ====================

  const onContentChange = useCallback((handler: (operations: ChangeOperation[], userId: string) => void) => {
    contentChangeHandlers.current.push(handler);
  }, []);

  const onCursorMove = useCallback((handler: (cursor: RemoteCursor) => void) => {
    cursorMoveHandlers.current.push(handler);
  }, []);

  const onUserJoined = useCallback((handler: (participant: SessionParticipant) => void) => {
    userJoinedHandlers.current.push(handler);
  }, []);

  const onUserLeft = useCallback((handler: (userId: string) => void) => {
    userLeftHandlers.current.push(handler);
  }, []);

  // ==================== CONTEXT VALUE ====================

  const value: CollaborationContextValue = {
    isConnected,
    sessionId,
    currentUser,
    createSession,
    joinSession,
    leaveSession,
    participants,
    remoteCursors,
    applyChanges,
    updateCursor,
    updateSelection,
    onContentChange,
    onCursorMove,
    onUserJoined,
    onUserLeft,
    localVersion,
    serverVersion,
    pendingChanges,
  };

  return <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>;
}

export default CollaborationProvider;
