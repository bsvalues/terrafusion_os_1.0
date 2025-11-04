/**
 * WorkflowExecutionMonitor - Real-Time Workflow Execution Tracking Component
 *
 * Production-ready component for monitoring workflow execution with live progress,
 * node-level status, execution timeline, and workflow locking.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 4
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWorkflowHub } from '../../hooks/useWorkflowHub';
import { Alert } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Spinner } from '../ui/spinner';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

// ==================== TYPES ====================

export interface WorkflowExecutionMonitorProps {
  workflowId: number;
  userId: number;
  countyId: number;
  userName: string;
  showLocking?: boolean;
  showTimeline?: boolean;
  autoSubscribe?: boolean;
}

interface TimelineEvent {
  timestamp: string;
  type: 'execution' | 'node' | 'lock' | 'error';
  message: string;
  variant: 'default' | 'success' | 'warning' | 'destructive';
}

// ==================== COMPONENT ====================

export function WorkflowExecutionMonitor({
  workflowId,
  userId,
  countyId,
  userName,
  showLocking = true,
  showTimeline = true,
  autoSubscribe = true,
}: WorkflowExecutionMonitorProps) {
  // ==================== HOOKS ====================

  const { state, actions } = useWorkflowHub(true);

  // ==================== STATE ====================

  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<number | null>(null);

  // ==================== EFFECTS ====================

  // Auto-subscribe to workflow
  useEffect(() => {
    if (autoSubscribe) {
      actions.subscribeToWorkflow(workflowId, userId, countyId).catch(console.error);

      return () => {
        actions.unsubscribeFromWorkflow(workflowId).catch(console.error);
      };
    }
  }, [autoSubscribe, workflowId, userId, countyId, actions]);

  // Track timeline events
  useEffect(() => {
    const executions = Array.from(state.executions.values());
    if (executions.length > 0) {
      const latestExecution = executions[executions.length - 1];

      if (!selectedExecution) {
        setSelectedExecution(latestExecution.executionId);
      }

      // Add execution events to timeline
      const event: TimelineEvent = {
        timestamp: latestExecution.startedAt,
        type: 'execution',
        message: `Execution #${latestExecution.executionId} ${latestExecution.status}`,
        variant:
          latestExecution.status === 'completed'
            ? 'success'
            : latestExecution.status === 'failed'
              ? 'destructive'
              : 'default',
      };

      setTimeline((prev) => {
        // Avoid duplicates
        if (
          prev.some(
            (e) =>
              e.message === event.message && e.timestamp === event.timestamp
          )
        ) {
          return prev;
        }
        return [...prev, event].slice(-50); // Keep last 50 events
      });
    }
  }, [state.executions, selectedExecution]);

  // ==================== HANDLERS ====================

  const handleLockWorkflow = useCallback(async () => {
    try {
      await actions.lockWorkflow(workflowId, userId, userName);
    } catch (error) {
      console.error('Failed to lock workflow:', error);
    }
  }, [workflowId, userId, userName, actions]);

  const handleUnlockWorkflow = useCallback(async () => {
    try {
      await actions.unlockWorkflow(workflowId);
    } catch (error) {
      console.error('Failed to unlock workflow:', error);
    }
  }, [workflowId, actions]);

  // ==================== COMPUTED VALUES ====================

  const currentExecution = useMemo(() => {
    if (!selectedExecution) return null;
    return state.executions.get(selectedExecution);
  }, [state.executions, selectedExecution]);

  const currentNodeExecutions = useMemo(() => {
    if (!selectedExecution) return new Map();
    return state.nodeExecutions.get(selectedExecution) || new Map();
  }, [state.nodeExecutions, selectedExecution]);

  const executionList = useMemo(() => {
    return Array.from(state.executions.values()).sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }, [state.executions]);

  // ==================== RENDER ====================

  if (state.connecting) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Spinner className="mr-2" />
          <span>Connecting to workflow...</span>
        </CardContent>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Alert variant="destructive">
        <span className="font-semibold">Connection Error</span>
        <p>{state.error}</p>
      </Alert>
    );
  }

  return (
    <div className="workflow-execution-monitor space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workflow Execution Monitor</CardTitle>
              <CardDescription>Workflow ID: {workflowId}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <Badge variant={state.connected ? 'success' : 'secondary'}>
                {state.connected ? '🟢 Connected' : '🔴 Disconnected'}
              </Badge>

              {/* Lock Status */}
              {state.isLocked && (
                <Badge variant={state.isLockedByMe ? 'default' : 'warning'}>
                  {state.isLockedByMe
                    ? '🔒 Locked by you'
                    : `🔒 Locked by ${state.workflowLock?.userName}`}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Workflow Locking Controls */}
      {showLocking && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Workflow Editing</p>
                <p className="text-xs text-muted-foreground">
                  {state.isLocked
                    ? `Locked by ${state.workflowLock?.userName || 'Unknown'}`
                    : 'Workflow is available for editing'}
                </p>
              </div>
              <div className="flex space-x-2">
                {!state.isLocked && (
                  <Button onClick={handleLockWorkflow}>🔒 Lock for Editing</Button>
                )}
                {state.isLockedByMe && (
                  <Button onClick={handleUnlockWorkflow} variant="outline">
                    🔓 Unlock
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution List */}
      {executionList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {executionList.map((execution) => (
                <div
                  key={execution.executionId}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-accent ${
                    selectedExecution === execution.executionId
                      ? 'border-terra-cyan bg-accent'
                      : ''
                  }`}
                  onClick={() => setSelectedExecution(execution.executionId)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Execution #{execution.executionId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Started: {new Date(execution.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        execution.status === 'completed'
                          ? 'success'
                          : execution.status === 'failed'
                            ? 'destructive'
                            : execution.status === 'cancelled'
                              ? 'warning'
                              : 'default'
                      }
                    >
                      {execution.status}
                    </Badge>
                  </div>
                  {execution.durationMs && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration: {execution.durationMs}ms
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Execution Progress */}
      {currentExecution && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Execution #{currentExecution.executionId} Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {currentExecution.progress.currentNode}
                </span>
                <span className="text-sm text-muted-foreground">
                  {currentExecution.progress.progressPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={currentExecution.progress.progressPercentage} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {currentExecution.progress.nodesExecuted} /{' '}
                  {currentExecution.progress.totalNodes} nodes
                </span>
                {currentExecution.progress.nodesFailed > 0 && (
                  <span className="text-destructive">
                    {currentExecution.progress.nodesFailed} failed
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Node Execution Status */}
            <div>
              <p className="text-sm font-medium mb-2">Node Status</p>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {Array.from(currentNodeExecutions.entries()).map(([nodeId, node]) => (
                    <div key={nodeId} className="p-2 rounded border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{node.nodeName}</span>
                        <Badge
                          variant={
                            node.status === 'completed'
                              ? 'success'
                              : node.status === 'failed'
                                ? 'destructive'
                                : node.status === 'running'
                                  ? 'default'
                                  : 'secondary'
                          }
                        >
                          {node.status}
                        </Badge>
                      </div>
                      {node.output && (
                        <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                          {node.output}
                        </pre>
                      )}
                      {node.error && (
                        <div className="mt-2 text-xs text-destructive">
                          Error: {node.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {showTimeline && timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Execution Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {timeline.map((event, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-sm">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge variant={event.variant} className="text-xs">
                      {event.type}
                    </Badge>
                    <span className="flex-1">{event.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* No Executions */}
      {executionList.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No workflow executions detected. Waiting for execution to start...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default WorkflowExecutionMonitor;
