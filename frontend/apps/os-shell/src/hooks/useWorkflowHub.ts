/**
 * useWorkflowHub - Real-Time Workflow Execution Monitoring Hook
 *
 * React hook for managing workflow execution monitoring and collaboration.
 * Handles connection lifecycle, execution tracking, and workflow locking.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 3
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { HubConnection } from '@microsoft/signalr';
import { signalRService, ExecutionProgress } from '../services/SignalRService';

// ==================== TYPES ====================

export interface WorkflowExecution {
  executionId: number;
  workflowId: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: ExecutionProgress;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface NodeExecution {
  nodeId: number;
  nodeName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  output?: string;
  error?: string;
}

export interface WorkflowLock {
  workflowId: number;
  userId: number;
  userName: string;
  connectionId: string;
  lockedAt: string;
}

export interface WorkflowHubState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  executions: Map<number, WorkflowExecution>;
  nodeExecutions: Map<number, Map<number, NodeExecution>>;
  workflowLock: WorkflowLock | null;
  isLocked: boolean;
  isLockedByMe: boolean;
}

export interface WorkflowHubActions {
  subscribeToWorkflow: (workflowId: number, userId: number, countyId: number) => Promise<void>;
  unsubscribeFromWorkflow: (workflowId: number) => Promise<void>;
  lockWorkflow: (workflowId: number, userId: number, userName: string) => Promise<void>;
  unlockWorkflow: (workflowId: number) => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface UseWorkflowHubReturn {
  state: WorkflowHubState;
  actions: WorkflowHubActions;
  connection: HubConnection | null;
}

// ==================== HOOK ====================

/**
 * Custom hook for real-time workflow execution monitoring
 *
 * @param enabled - Whether to connect (default: true)
 */
export function useWorkflowHub(enabled: boolean = true): UseWorkflowHubReturn {
  // ==================== STATE ====================

  const [state, setState] = useState<WorkflowHubState>({
    connected: false,
    connecting: false,
    error: null,
    executions: new Map(),
    nodeExecutions: new Map(),
    workflowLock: null,
    isLocked: false,
    isLockedByMe: false,
  });

  const connectionRef = useRef<HubConnection | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const currentUserRef = useRef<{ userId: number; userName: string } | null>(null);

  // ==================== ACTIONS ====================

  const subscribeToWorkflow = useCallback(
    async (workflowId: number, userId: number, countyId: number) => {
      if (!connectionRef.current) {
        throw new Error('Not connected to WorkflowHub');
      }

      await connectionRef.current.invoke('SubscribeToWorkflow', workflowId, userId, countyId);
    },
    []
  );

  const unsubscribeFromWorkflow = useCallback(async (workflowId: number) => {
    if (!connectionRef.current) {
      throw new Error('Not connected to WorkflowHub');
    }

    await connectionRef.current.invoke('UnsubscribeFromWorkflow', workflowId);
  }, []);

  const lockWorkflow = useCallback(
    async (workflowId: number, userId: number, userName: string) => {
      if (!connectionRef.current) {
        throw new Error('Not connected to WorkflowHub');
      }

      currentUserRef.current = { userId, userName };
      await connectionRef.current.invoke('LockWorkflow', workflowId, userId, userName);
    },
    []
  );

  const unlockWorkflow = useCallback(async (workflowId: number) => {
    if (!connectionRef.current) {
      throw new Error('Not connected to WorkflowHub');
    }

    await connectionRef.current.invoke('UnlockWorkflow', workflowId);
  }, []);

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      await signalRService.disconnectFromWorkflow(0); // Will be handled by cleanup
      connectionRef.current = null;
      setState((prev) => ({ ...prev, connected: false }));
    }
  }, []);

  // ==================== CONNECTION MANAGEMENT ====================

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const connect = async () => {
      try {
        setState((prev) => ({ ...prev, connecting: true, error: null }));

        // Connect to WorkflowHub
        const connection = await signalRService.connectToWorkflow(0, 0, 0); // Will subscribe later

        if (!mounted) {
          await signalRService.disconnectFromWorkflow(0);
          return;
        }

        connectionRef.current = connection;

        // ==================== EVENT HANDLERS ====================

        // Workflow status
        connection.on(
          'WorkflowStatus',
          (data: { workflowId: number; runningExecutions: any[]; subscribedAt: string }) => {
          }
        );

        // Execution started
        connection.on(
          'ExecutionStarted',
          (data: {
            workflowId: number;
            executionId: number;
            totalNodes: number;
            startedAt: string;
            status: string;
          }) => {
            setState((prev) => {
              const newExecutions = new Map(prev.executions);
              newExecutions.set(data.executionId, {
                executionId: data.executionId,
                workflowId: data.workflowId,
                status: 'running',
                progress: {
                  nodesExecuted: 0,
                  nodesFailed: 0,
                  totalNodes: data.totalNodes,
                  progressPercentage: 0,
                  currentNode: 'Starting...',
                },
                startedAt: data.startedAt,
              });
              return { ...prev, executions: newExecutions };
            });
          }
        );

        // Execution progress
        connection.on(
          'ExecutionProgress',
          (data: {
            workflowId: number;
            executionId: number;
            progress: ExecutionProgress;
            updatedAt: string;
          }) => {
            setState((prev) => {
              const newExecutions = new Map(prev.executions);
              const existing = newExecutions.get(data.executionId);
              if (existing) {
                newExecutions.set(data.executionId, {
                  ...existing,
                  progress: data.progress,
                });
              }
              return { ...prev, executions: newExecutions };
            });
          }
        );

        // Node started
        connection.on(
          'NodeStarted',
          (data: {
            workflowId: number;
            executionId: number;
            nodeId: number;
            nodeName: string;
            startedAt: string;
          }) => {
            setState((prev) => {
              const newNodeExecutions = new Map(prev.nodeExecutions);
              const executionNodes = newNodeExecutions.get(data.executionId) || new Map();
              executionNodes.set(data.nodeId, {
                nodeId: data.nodeId,
                nodeName: data.nodeName,
                status: 'running',
                startedAt: data.startedAt,
              });
              newNodeExecutions.set(data.executionId, executionNodes);
              return { ...prev, nodeExecutions: newNodeExecutions };
            });
          }
        );

        // Node completed
        connection.on(
          'NodeCompleted',
          (data: {
            workflowId: number;
            executionId: number;
            nodeId: number;
            result: { output: string; durationMs: number; metadata?: any };
            completedAt: string;
          }) => {
            setState((prev) => {
              const newNodeExecutions = new Map(prev.nodeExecutions);
              const executionNodes = newNodeExecutions.get(data.executionId);
              if (executionNodes) {
                const existing = executionNodes.get(data.nodeId);
                if (existing) {
                  executionNodes.set(data.nodeId, {
                    ...existing,
                    status: 'completed',
                    output: data.result.output,
                    completedAt: data.completedAt,
                  });
                }
                newNodeExecutions.set(data.executionId, executionNodes);
              }
              return { ...prev, nodeExecutions: newNodeExecutions };
            });
          }
        );

        // Node failed
        connection.on(
          'NodeFailed',
          (data: {
            workflowId: number;
            executionId: number;
            nodeId: number;
            error: string;
            stackTrace?: string;
            failedAt: string;
          }) => {
            console.error(`❌ Node failed: ${data.error}`);
            setState((prev) => {
              const newNodeExecutions = new Map(prev.nodeExecutions);
              const executionNodes = newNodeExecutions.get(data.executionId);
              if (executionNodes) {
                const existing = executionNodes.get(data.nodeId);
                if (existing) {
                  executionNodes.set(data.nodeId, {
                    ...existing,
                    status: 'failed',
                    error: data.error,
                    completedAt: data.failedAt,
                  });
                }
                newNodeExecutions.set(data.executionId, executionNodes);
              }
              return { ...prev, nodeExecutions: newNodeExecutions };
            });
          }
        );

        // Execution completed
        connection.on(
          'ExecutionCompleted',
          (data: {
            workflowId: number;
            executionId: number;
            status: string;
            durationMs: number;
            completedAt: string;
          }) => {
            setState((prev) => {
              const newExecutions = new Map(prev.executions);
              const existing = newExecutions.get(data.executionId);
              if (existing) {
                newExecutions.set(data.executionId, {
                  ...existing,
                  status: data.status as WorkflowExecution['status'],
                  completedAt: data.completedAt,
                  durationMs: data.durationMs,
                });
              }
              return { ...prev, executions: newExecutions };
            });
          }
        );

        // Execution cancelled
        connection.on(
          'ExecutionCancelled',
          (data: {
            workflowId: number;
            executionId: number;
            reason: string;
            cancelledAt: string;
          }) => {
            setState((prev) => {
              const newExecutions = new Map(prev.executions);
              const existing = newExecutions.get(data.executionId);
              if (existing) {
                newExecutions.set(data.executionId, {
                  ...existing,
                  status: 'cancelled',
                  completedAt: data.cancelledAt,
                });
              }
              return { ...prev, executions: newExecutions };
            });
          }
        );

        // Workflow locked
        connection.on('WorkflowLocked', (lockInfo: WorkflowLock) => {
          setState((prev) => ({
            ...prev,
            workflowLock: lockInfo,
            isLocked: true,
            isLockedByMe:
              currentUserRef.current?.userId === lockInfo.userId &&
              currentUserRef.current?.userName === lockInfo.userName,
          }));
        });

        // Lock acquired
        connection.on('LockAcquired', (data: { workflowId: number }) => {
        });

        // Lock denied
        connection.on('LockDenied', (data: { workflowId: number; currentLock: WorkflowLock }) => {
          setState((prev) => ({
            ...prev,
            workflowLock: data.currentLock,
            isLocked: true,
            isLockedByMe: false,
          }));
        });

        // Workflow unlocked
        connection.on(
          'WorkflowUnlocked',
          (data: { workflowId: number; reason?: string; unlockedAt: string }) => {
            setState((prev) => ({
              ...prev,
              workflowLock: null,
              isLocked: false,
              isLockedByMe: false,
            }));
          }
        );

        setState((prev) => ({ ...prev, connected: true, connecting: false }));

        // Cleanup function
        cleanupRef.current = () => {
          connection.off('WorkflowStatus');
          connection.off('ExecutionStarted');
          connection.off('ExecutionProgress');
          connection.off('NodeStarted');
          connection.off('NodeCompleted');
          connection.off('NodeFailed');
          connection.off('ExecutionCompleted');
          connection.off('ExecutionCancelled');
          connection.off('WorkflowLocked');
          connection.off('LockAcquired');
          connection.off('LockDenied');
          connection.off('WorkflowUnlocked');
        };
      } catch (error) {
        console.error('❌ Failed to connect to WorkflowHub:', error);
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
      signalRService.disconnectFromWorkflow(0).catch(console.error);
    };
  }, [enabled]);

  // ==================== RETURN ====================

  return {
    state,
    actions: {
      subscribeToWorkflow,
      unsubscribeFromWorkflow,
      lockWorkflow,
      unlockWorkflow,
      disconnect,
    },
    connection: connectionRef.current,
  };
}

export default useWorkflowHub;
