import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
  nodes: any[];
  connections: any[];
  config: Record<string, any>;
}

interface ExecutionMetrics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  performance: {
    cpu: number;
    memory: number;
    throughput: number;
  };
  errors: Array<{
    timestamp: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface AIInsights {
  activeAgents: number;
  optimizationScore: number;
  recommendations: Array<{
    type: 'performance' | 'security' | 'optimization';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    impact: number;
  }>;
  predictions: {
    nextFailure: string | null;
    performanceTrend: 'improving' | 'stable' | 'declining';
    resourceUsage: number;
  };
}

interface WorkflowStore {
  // State
  workflows: Workflow[];
  activeWorkflow: Workflow | null;
  isExecuting: boolean;
  executionMetrics: ExecutionMetrics;
  aiInsights: AIInsights;

  // Actions
  loadWorkflows: () => Promise<void>;
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  setActiveWorkflow: (workflow: Workflow | null) => void;
  startExecution: (workflowId: string) => Promise<void>;
  pauseExecution: (workflowId: string) => Promise<void>;
  stopExecution: (workflowId: string) => Promise<void>;
  updateMetrics: (metrics: Partial<ExecutionMetrics>) => void;
  updateAIInsights: (insights: Partial<AIInsights>) => void;
}

export const useWorkflowStore = create<WorkflowStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      workflows: [],
      activeWorkflow: null,
      isExecuting: false,
      executionMetrics: {
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        performance: {
          cpu: 0,
          memory: 0,
          throughput: 0,
        },
        errors: [],
      },
      aiInsights: {
        activeAgents: 3,
        optimizationScore: 97,
        recommendations: [
          {
            type: 'performance',
            priority: 'medium',
            title: 'Optimize Parallel Processing',
            description: 'Enable parallel execution for steps 3-5 to improve performance',
            impact: 34,
          },
          {
            type: 'security',
            priority: 'high',
            title: 'Add Input Validation',
            description: 'Implement input validation for API endpoints',
            impact: 28,
          },
        ],
        predictions: {
          nextFailure: null,
          performanceTrend: 'improving',
          resourceUsage: 67,
        },
      },

      // Actions
      loadWorkflows: async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockWorkflows: Workflow[] = [
          {
            id: 'workflow-1',
            name: 'Data Processing Pipeline',
            description: 'Automated data processing with AI optimization',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes: [],
            connections: [],
            config: {},
          },
          {
            id: 'workflow-2',
            name: 'Report Generation',
            description: 'Automated report generation and distribution',
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes: [],
            connections: [],
            config: {},
          },
        ];

        set({ workflows: mockWorkflows, activeWorkflow: mockWorkflows[0] });
      },

      createWorkflow: workflowData => {
        const newWorkflow: Workflow = {
          ...workflowData,
          id: `workflow-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set(state => ({
          workflows: [...state.workflows, newWorkflow],
        }));
      },

      updateWorkflow: (id, updates) => {
        set(state => ({
          workflows: state.workflows.map(workflow =>
            workflow.id === id
              ? { ...workflow, ...updates, updatedAt: new Date().toISOString() }
              : workflow
          ),
          activeWorkflow:
            state.activeWorkflow?.id === id
              ? { ...state.activeWorkflow, ...updates, updatedAt: new Date().toISOString() }
              : state.activeWorkflow,
        }));
      },

      deleteWorkflow: id => {
        set(state => ({
          workflows: state.workflows.filter(workflow => workflow.id !== id),
          activeWorkflow: state.activeWorkflow?.id === id ? null : state.activeWorkflow,
        }));
      },

      setActiveWorkflow: workflow => {
        set({ activeWorkflow: workflow });
      },

      startExecution: async workflowId => {
        set({ isExecuting: true });

        // Update workflow status
        get().updateWorkflow(workflowId, { status: 'active' });

        // Simulate execution with metrics updates
        const updateInterval = setInterval(() => {
          const currentMetrics = get().executionMetrics;
          set({
            executionMetrics: {
              ...currentMetrics,
              totalExecutions: currentMetrics.totalExecutions + 1,
              performance: {
                cpu: Math.random() * 100,
                memory: Math.random() * 100,
                throughput: Math.random() * 1000,
              },
            },
          });
        }, 1000);

        // Simulate execution completion after 5 seconds
        setTimeout(() => {
          clearInterval(updateInterval);
          set({ isExecuting: false });
          get().updateWorkflow(workflowId, { status: 'completed' });

          // Update final metrics
          const currentMetrics = get().executionMetrics;
          set({
            executionMetrics: {
              ...currentMetrics,
              successRate: Math.min(currentMetrics.successRate + 0.1, 100),
              averageExecutionTime: 4.2,
            },
          });
        }, 5000);
      },

      pauseExecution: async workflowId => {
        set({ isExecuting: false });
        get().updateWorkflow(workflowId, { status: 'paused' });
      },

      stopExecution: async workflowId => {
        set({ isExecuting: false });
        get().updateWorkflow(workflowId, { status: 'draft' });
      },

      updateMetrics: metrics => {
        set(state => ({
          executionMetrics: { ...state.executionMetrics, ...metrics },
        }));
      },

      updateAIInsights: insights => {
        set(state => ({
          aiInsights: { ...state.aiInsights, ...insights },
        }));
      },
    }),
    {
      name: 'workflow-store',
    }
  )
);
