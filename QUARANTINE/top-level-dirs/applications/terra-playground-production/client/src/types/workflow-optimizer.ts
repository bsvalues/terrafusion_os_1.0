// Types related to the workflow optimizer feature

// Enum aligned with backend WorkflowOptimizationType
export type OptimizationType =
  | 'code_quality'
  | 'performance'
  | 'architecture'
  | 'security'
  | 'best_practices'
  | 'developer_productivity'
  | 'documentation'
  | 'testing';

// Enum aligned with backend WorkflowOptimizationStatus
export type OptimizationStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

// Enum aligned with backend WorkflowOptimizationPriority
export type OptimizationPriority = 'low' | 'medium' | 'high';

// Interface aligned with workflowOptimizationRequests table in schema.ts
export interface WorkflowOptimizationRequest {
  id: number;
  requestId: string;
  userId: number;
  repositoryId?: number | null;
  title: string;
  description: string;
  codebase?: string | null;
  optimizationType: OptimizationType;
  status: OptimizationStatus;
  priority: OptimizationPriority;
  tags?: string[] | null;
  settings?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

// Optimization suggestion for workflow improvements
export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  code?: string | null;
  filePath?: string | null;
  lineNumbers?: [number, number] | null;
  impact: 'low' | 'medium' | 'high';
  effortEstimate: 'quick' | 'medium' | 'significant';
  category: string;
  implementationSteps?: string[] | null;
}

// Interface aligned with workflowOptimizationResults table in schema.ts
export interface WorkflowOptimizationResult {
  id: number;
  requestId: string;
  summary: string;
  recommendationsJson: OptimizationSuggestion[];
  improvementScore: number;
  runTime?: number | null;
  modelUsed?: string | null;
  createdAt: string;

  // Backwards compatibility fields for existing component
  resultId?: string;
  impactScore?: number;
  suggestions?: OptimizationSuggestion[];
}
