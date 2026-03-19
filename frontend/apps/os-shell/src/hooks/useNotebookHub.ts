/**
 * useNotebookHub - Real-Time Notebook Collaboration Hook
 *
 * React hook for managing real-time notebook collaboration with SignalR.
 * Handles connection lifecycle, event subscriptions, and state management.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 3
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { HubConnection } from '@microsoft/signalr';
import { signalRService, CellUpdate, CursorPosition } from '../services/SignalRService';

// ==================== TYPES ====================

export interface NotebookHubState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  activeUsers: string[];
  cellUpdates: CellUpdate[];
  cursors: Map<string, CursorPosition>;
}

export interface NotebookHubActions {
  updateCell: (cellIndex: number, content: string, cellType: string) => Promise<void>;
  executeCell: (cellIndex: number, code: string) => Promise<void>;
  addCell: (cellIndex: number, cellType: string) => Promise<void>;
  deleteCell: (cellIndex: number) => Promise<void>;
  updateCursor: (position: CursorPosition) => Promise<void>;
  addComment: (cellIndex: number, comment: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface UseNotebookHubReturn {
  state: NotebookHubState;
  actions: NotebookHubActions;
  connection: HubConnection | null;
}

// ==================== HOOK ====================

/**
 * Custom hook for real-time notebook collaboration
 *
 * @param notebookId - Notebook ID to connect to
 * @param userId - Current user ID
 * @param countyId - County ID for authorization
 * @param userName - Display name for user
 * @param enabled - Whether to connect (default: true)
 */
export function useNotebookHub(
  notebookId: number,
  userId: number,
  countyId: number,
  userName: string,
  enabled: boolean = true
): UseNotebookHubReturn {
  // ==================== STATE ====================

  const [state, setState] = useState<NotebookHubState>({
    connected: false,
    connecting: false,
    error: null,
    activeUsers: [],
    cellUpdates: [],
    cursors: new Map(),
  });

  const connectionRef = useRef<HubConnection | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // ==================== ACTIONS ====================

  const updateCell = useCallback(
    async (cellIndex: number, content: string, cellType: string) => {
      if (!connectionRef.current) {
        throw new Error('Not connected to NotebookHub');
      }

      await connectionRef.current.invoke(
        'UpdateCell',
        notebookId,
        cellIndex,
        content,
        cellType
      );
    },
    [notebookId]
  );

  const executeCell = useCallback(
    async (cellIndex: number, code: string) => {
      if (!connectionRef.current) {
        throw new Error('Not connected to NotebookHub');
      }

      await connectionRef.current.invoke('ExecuteCell', notebookId, cellIndex, code);
    },
    [notebookId]
  );

  const addCell = useCallback(
    async (cellIndex: number, cellType: string) => {
      if (!connectionRef.current) {
        throw new Error('Not connected to NotebookHub');
      }

      await connectionRef.current.invoke('AddCell', notebookId, cellIndex, cellType);
    },
    [notebookId]
  );

  const deleteCell = useCallback(
    async (cellIndex: number) => {
      if (!connectionRef.current) {
        throw new Error('Not connected to NotebookHub');
      }

      await connectionRef.current.invoke('DeleteCell', notebookId, cellIndex);
    },
    [notebookId]
  );

  const updateCursor = useCallback(
    async (position: CursorPosition) => {
      if (!connectionRef.current) {
        throw new Error('Not connected to NotebookHub');
      }

      await connectionRef.current.invoke('UpdateCursor', notebookId, position);
    },
    [notebookId]
  );

  const addComment = useCallback(
    async (cellIndex: number, comment: string) => {
      if (!connectionRef.current) {
        throw new Error('Not connected to NotebookHub');
      }

      await connectionRef.current.invoke('AddComment', notebookId, cellIndex, comment);
    },
    [notebookId]
  );

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      await signalRService.disconnectFromNotebook(notebookId, userName);
      connectionRef.current = null;
      setState((prev) => ({ ...prev, connected: false }));
    }
  }, [notebookId, userName]);

  // ==================== CONNECTION MANAGEMENT ====================

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const connect = async () => {
      try {
        setState((prev) => ({ ...prev, connecting: true, error: null }));

        // Connect to NotebookHub
        const connection = await signalRService.connectToNotebook(
          notebookId,
          userId,
          countyId,
          userName
        );

        if (!mounted) {
          await signalRService.disconnectFromNotebook(notebookId, userName);
          return;
        }

        connectionRef.current = connection;

        // ==================== EVENT HANDLERS ====================

        // User joined notebook
        connection.on('UserJoined', (data: { userName: string; joinedAt: string }) => {
          setState((prev) => ({
            ...prev,
            activeUsers: [...prev.activeUsers, data.userName],
          }));
        });

        // User left notebook
        connection.on('UserLeft', (data: { userName: string; leftAt: string }) => {
          setState((prev) => ({
            ...prev,
            activeUsers: prev.activeUsers.filter((u) => u !== data.userName),
          }));
        });

        // Cell updated
        connection.on('CellUpdated', (update: CellUpdate) => {
          setState((prev) => ({
            ...prev,
            cellUpdates: [...prev.cellUpdates, update],
          }));
        });

        // Cell executed
        connection.on(
          'CellExecuted',
          (data: {
            cellIndex: number;
            output: string;
            executionTime: number;
            executedBy: string;
          }) => {
          }
        );

        // Cell added
        connection.on(
          'CellAdded',
          (data: { cellIndex: number; cellType: string; addedBy: string }) => {
          }
        );

        // Cell deleted
        connection.on(
          'CellDeleted',
          (data: { cellIndex: number; deletedBy: string }) => {
          }
        );

        // Cursor updated
        connection.on(
          'CursorUpdated',
          (data: { userName: string; position: CursorPosition }) => {
            setState((prev) => {
              const newCursors = new Map(prev.cursors);
              newCursors.set(data.userName, data.position);
              return { ...prev, cursors: newCursors };
            });
          }
        );

        // Comment added
        connection.on(
          'CommentAdded',
          (data: {
            cellIndex: number;
            comment: string;
            userName: string;
            timestamp: string;
          }) => {
          }
        );

        // Active users list
        connection.on('ActiveUsers', (data: { users: string[] }) => {
          setState((prev) => ({ ...prev, activeUsers: data.users }));
        });

        setState((prev) => ({ ...prev, connected: true, connecting: false }));

        // Cleanup function
        cleanupRef.current = () => {
          connection.off('UserJoined');
          connection.off('UserLeft');
          connection.off('CellUpdated');
          connection.off('CellExecuted');
          connection.off('CellAdded');
          connection.off('CellDeleted');
          connection.off('CursorUpdated');
          connection.off('CommentAdded');
          connection.off('ActiveUsers');
        };
      } catch (error) {
        console.error('❌ Failed to connect to NotebookHub:', error);
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
      signalRService.disconnectFromNotebook(notebookId, userName).catch(console.error);
    };
  }, [notebookId, userId, countyId, userName, enabled]);

  // ==================== RETURN ====================

  return {
    state,
    actions: {
      updateCell,
      executeCell,
      addCell,
      deleteCell,
      updateCursor,
      addComment,
      disconnect,
    },
    connection: connectionRef.current,
  };
}

export default useNotebookHub;
