/**
 * Agent Activity Hook
 *
 * This hook provides a way to track and interact with AI agent activities.
 * It fetches active agent tasks, completed tasks, and provides methods to
 * interact with agents.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Agent Task interface
interface AgentTask {
  id: string;
  agentId: string;
  agentType: string;
  taskType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  data: any;
  result?: any;
  progress?: number;
  message?: string;
  startTime: Date;
  endTime?: Date;
}

// Simplified task for UI
interface UITask {
  id: string;
  type: 'analysis' | 'repair' | 'conversion' | 'enhancement' | 'search' | 'detection';
  agentType: string;
  status: 'working' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  startTime: Date;
  endTime?: Date;
  notified?: boolean; // Track if notification has been shown
}

/**
 * Hook for tracking and interacting with agent activities
 */
export function useAgentActivity() {
  const [activeTasks, setActiveTasks] = useState<UITask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<UITask[]>([]);

  // Fetch active agent tasks
  const { data: activeTasksData } = useQuery({
    queryKey: ['/api/agent-tasks/active'],
    queryFn: async () => {
      const response = await fetch('/api/agent-tasks/active');
      return (await response.json()) as AgentTask[];
    },
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  // Fetch recently completed tasks
  const { data: completedTasksData } = useQuery({
    queryKey: ['/api/agent-tasks/completed'],
    queryFn: async () => {
      const response = await fetch('/api/agent-tasks/completed');
      return (await response.json()) as AgentTask[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Map agent tasks to UI tasks
  const mapToUITask = useCallback((task: AgentTask): UITask => {
    return {
      id: task.id,
      type: mapTaskTypeToUIType(task.taskType),
      agentType: getAgentDisplayName(task.agentType),
      status:
        task.status === 'pending' || task.status === 'processing'
          ? 'working'
          : task.status === 'completed'
            ? 'completed'
            : 'failed',
      progress: task.progress,
      message: task.message || getDefaultMessage(task.taskType, task.status),
      startTime: new Date(task.startTime),
      endTime: task.endTime ? new Date(task.endTime) : undefined,
    };
  }, []);

  // Update UI tasks when data changes
  useEffect(() => {
    if (activeTasksData) {
      setActiveTasks(activeTasksData.map(mapToUITask));
    }

    if (completedTasksData) {
      setCompletedTasks(completedTasksData.map(mapToUITask));
    }
  }, [activeTasksData, completedTasksData, mapToUITask]);

  // Mutation for canceling a task
  const cancelTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/agent-tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/agent-tasks/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agent-tasks/completed'] });
    },
  });

  // Mutation for submitting a new task
  const submitTaskMutation = useMutation({
    mutationFn: async (taskData: { agentType: string; taskType: string; data: any }) => {
      const response = await fetch('/api/agent-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/agent-tasks/active'] });
    },
  });

  // Function to submit a new task
  const submitTask = useCallback(
    (agentType: string, taskType: string, data: any) => {
      return submitTaskMutation.mutate({ agentType, taskType, data });
    },
    [submitTaskMutation]
  );

  // Function to cancel a task
  const cancelTask = useCallback(
    (taskId: string) => {
      return cancelTaskMutation.mutate(taskId);
    },
    [cancelTaskMutation]
  );

  // Return the hook values
  return {
    activeTasks,
    completedTasks,
    isLoading: submitTaskMutation.isPending || cancelTaskMutation.isPending,
    submitTask,
    cancelTask,
  };
}

/**
 * Map task type to UI type
 */
function mapTaskTypeToUIType(
  taskType: string
): 'analysis' | 'repair' | 'conversion' | 'enhancement' | 'search' | 'detection' {
  // Map the task type to a UI type
  if (taskType.includes('analyze') || taskType.includes('check')) {
    return 'analysis';
  } else if (taskType.includes('repair') || taskType.includes('fix')) {
    return 'repair';
  } else if (taskType.includes('convert') || taskType.includes('transform')) {
    return 'conversion';
  } else if (taskType.includes('enhance') || taskType.includes('improve')) {
    return 'enhancement';
  } else if (taskType.includes('search') || taskType.includes('find')) {
    return 'search';
  } else if (taskType.includes('detect') || taskType.includes('identify')) {
    return 'detection';
  }

  // Default to analysis
  return 'analysis';
}

/**
 * Get a friendly display name for the agent type
 */
function getAgentDisplayName(agentType: string): string {
  // Map agent types to display names
  const agentDisplayNames: Record<string, string> = {
    gis_specialist: 'GIS Specialist',
    data_normalization: 'Data Normalizer',
    topology_repair: 'Topology Repairer',
    schema_conversion: 'Schema Converter',
    feature_detect: 'Feature Detector',
    spatial_relationship: 'Spatial Analyzer',
    valuation_analysis: 'Valuation Analyzer',
  };

  return agentDisplayNames[agentType] || agentType;
}

/**
 * Get a default message based on task type and status
 */
function getDefaultMessage(taskType: string, status: string): string {
  if (status === 'pending' || status === 'processing') {
    if (taskType.includes('analyze')) {
      return 'Analyzing data...';
    } else if (taskType.includes('repair')) {
      return 'Repairing issues...';
    } else if (taskType.includes('convert')) {
      return 'Converting data...';
    } else if (taskType.includes('enhance')) {
      return 'Enhancing data...';
    } else if (taskType.includes('detect')) {
      return 'Detecting features...';
    }
    return 'Processing...';
  } else if (status === 'completed') {
    if (taskType.includes('analyze')) {
      return 'Analysis completed';
    } else if (taskType.includes('repair')) {
      return 'Repairs completed';
    } else if (taskType.includes('convert')) {
      return 'Conversion completed';
    } else if (taskType.includes('enhance')) {
      return 'Enhancement completed';
    } else if (taskType.includes('detect')) {
      return 'Detection completed';
    }
    return 'Task completed';
  } else {
    return 'Task failed';
  }
}
