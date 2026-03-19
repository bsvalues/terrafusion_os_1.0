import { useCallback, useEffect, useRef, useState } from 'react';
import { getViteEnv } from '@/shared/viteEnv';
import {
  CollaborativeSession,
  ConflictResolution,
  SessionActivity,
  SessionParticipant,
} from '../types/BudgetTypes';

interface UseCollaborationOptions {
  sessionId: string;
  userId: string;
  userRole: string;
  department: string;
}

// Custom hook for managing collaborative budget planning sessions
export const useCollaboration = ({
  sessionId,
  userId,
  userRole,
  department,
}: UseCollaborationOptions) => {
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [activities, setActivities] = useState<SessionActivity[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to collaborative session
  const connectToSession = useCallback(async () => {
    try {
      setConnectionStatus('connecting');

      // Initialize WebSocket connection for real-time collaboration
      const wsUrl = `${getViteEnv().VITE_WS_URL || 'ws://localhost:8080'}/collaboration/${sessionId}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');

        // Send join message
        if (wsRef.current) {
          wsRef.current.send(
            JSON.stringify({
              type: 'join_session',
              sessionId,
              userId,
              userRole,
              department,
              timestamp: new Date().toISOString(),
            })
          );
        }

        // Setup heartbeat
        heartbeatRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'heartbeat', userId }));
          }
        }, 30000); // 30 seconds
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleCollaborativeMessage(message);
        } catch (err) {
          console.error('Error parsing collaboration message:', err);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Collaboration WebSocket error:', error);
        setConnectionStatus('error');
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        setIsConnected(false);

        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
        }

        // Attempt to reconnect after 5 seconds
        setTimeout(connectToSession, 5000);
      };
    } catch (err) {
      console.error('Failed to connect to collaborative session:', err);
      setConnectionStatus('error');
    }
  }, [sessionId, userId, userRole, department]);

  // Handle incoming collaborative messages
  const handleCollaborativeMessage = useCallback(
    (message: any) => {
      switch (message.type) {
        case 'session_update':
          setSession(message.session);
          break;

        case 'participant_joined':
          setParticipants((prev) => {
            const existing = prev.find((p) => p.userId === message.participant.userId);
            if (existing) {
              return prev.map((p) =>
                p.userId === message.participant.userId ? message.participant : p
              );
            }
            return [...prev, message.participant];
          });

          // Add activity
          setActivities((prev) => [
            ...prev,
            {
              id: `activity-${Date.now()}`,
              sessionId,
              userId: message.participant.userId,
              type: 'user_joined',
              description: `${message.participant.name} joined the session`,
              timestamp: new Date(),
              data: { participant: message.participant },
            },
          ]);
          break;

        case 'participant_left':
          setParticipants((prev) => prev.filter((p) => p.userId !== message.userId));

          setActivities((prev) => [
            ...prev,
            {
              id: `activity-${Date.now()}`,
              sessionId,
              userId: message.userId,
              type: 'user_left',
              description: `User left the session`,
              timestamp: new Date(),
              data: { userId: message.userId },
            },
          ]);
          break;

        case 'budget_change':
          setActivities((prev) => [
            ...prev,
            {
              id: `activity-${Date.now()}`,
              sessionId,
              userId: message.userId,
              type: 'budget_modified',
              description: `Modified ${message.categoryName}: ${message.field} changed to $${message.newValue.toLocaleString()}`,
              timestamp: new Date(),
              data: {
                categoryId: message.categoryId,
                categoryName: message.categoryName,
                field: message.field,
                oldValue: message.oldValue,
                newValue: message.newValue,
              },
            },
          ]);
          break;

        case 'conflict_detected':
          setConflicts((prev) => [
            ...prev,
            {
              id: `conflict-${Date.now()}`,
              sessionId,
              type: 'data_conflict',
              description: message.description,
              participants: message.conflictingUsers,
              data: message.conflictData,
              status: 'pending',
              detectedAt: new Date(),
              resolvedAt: null,
              resolvedBy: null,
              resolution: null,
            },
          ]);
          break;

        case 'conflict_resolved':
          setConflicts((prev) =>
            prev.map((conflict) =>
              conflict.id === message.conflictId
                ? {
                    ...conflict,
                    status: 'resolved',
                    resolvedAt: new Date(),
                    resolvedBy: message.resolvedBy,
                    resolution: message.resolution,
                  }
                : conflict
            )
          );
          break;

        case 'cursor_position':
          // Update participant cursor positions for real-time awareness
          setParticipants((prev) =>
            prev.map((p) =>
              p.userId === message.userId
                ? { ...p, cursorPosition: message.position, lastActivity: new Date() }
                : p
            )
          );
          break;

        default:
      }
    },
    [sessionId]
  );

  // Send budget change to other participants
  const broadcastBudgetChange = useCallback(
    (
      categoryId: string,
      categoryName: string,
      field: string,
      oldValue: number,
      newValue: number
    ) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'budget_change',
            sessionId,
            userId,
            categoryId,
            categoryName,
            field,
            oldValue,
            newValue,
            timestamp: new Date().toISOString(),
          })
        );
      }
    },
    [sessionId, userId]
  );

  // Send cursor position for awareness
  const updateCursorPosition = useCallback(
    (position: { x: number; y: number; element?: string }) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'cursor_position',
            sessionId,
            userId,
            position,
            timestamp: new Date().toISOString(),
          })
        );
      }
    },
    [sessionId, userId]
  );

  // Resolve conflict
  const resolveConflict = useCallback(
    (conflictId: string, resolution: any) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'resolve_conflict',
            sessionId,
            userId,
            conflictId,
            resolution,
            timestamp: new Date().toISOString(),
          })
        );
      }
    },
    [sessionId, userId]
  );

  // Leave session
  const leaveSession = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'leave_session',
          sessionId,
          userId,
          timestamp: new Date().toISOString(),
        })
      );
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
  }, [sessionId, userId]);

  // Create new collaborative session
  const createSession = useCallback(
    async (sessionName: string, description: string) => {
      try {
        // Mock session creation - would normally call TerraLevy API
        const newSession: CollaborativeSession = {
          id: `session-${Date.now()}`,
          name: sessionName,
          description,
          createdBy: userId,
          createdAt: new Date(),
          lastActivity: new Date(),
          hostJurisdiction: department,
          participants: [
            {
              userId,
              name: 'Current User', // Would get from user service
              role: userRole,
              department,
              joinedAt: new Date(),
              lastActivity: new Date(),
              permissions: [
                { resource: 'budget', action: 'view', granted: true },
                { resource: 'budget', action: 'edit', granted: true },
                { resource: 'budget', action: 'comment', granted: true },
              ],
              status: 'online',
              cursorPosition: null,
            },
          ],
          startTime: new Date(),
          status: 'active',
          budgetScope: {
            fiscalYear: '2025',
            departments: [department],
            categories: [],
          },
          permissions: {
            canEdit: [userRole],
            canView: ['all'],
            canComment: ['all'],
            canApprove: ['supervisor', 'manager'],
          },
          settings: {
            autoSave: true,
            conflictResolution: 'manual',
            notificationLevel: 'all',
          },
          sharedDocuments: [],
          chatHistory: [],
          modifications: [],
          conflictResolution: [],
        };

        setSession(newSession);
        return newSession;
      } catch (err) {
        console.error('Error creating collaborative session:', err);
        throw err;
      }
    },
    [userId, userRole, department]
  );

  // Initialize connection on mount
  useEffect(() => {
    if (sessionId) {
      connectToSession();
    }

    return () => {
      leaveSession();
    };
  }, [sessionId, connectToSession, leaveSession]);

  return {
    session,
    participants,
    activities,
    conflicts,
    isConnected,
    connectionStatus,
    connectToSession,
    createSession,
    leaveSession,
    broadcastBudgetChange,
    updateCursorPosition,
    resolveConflict,
  };
};
