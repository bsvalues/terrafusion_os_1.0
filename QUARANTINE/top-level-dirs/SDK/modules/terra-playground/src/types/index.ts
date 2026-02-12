/**
 * TerraFusion Playground - Interactive Scenario Types
 * Government. Transcended.
 */

export interface PlaygroundScenario {
  id: string;
  name: string;
  description: string;
  category: 'tutorial' | 'sample' | 'advanced' | 'integration';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  tags: string[];
  codeTemplate: string;
  expectedOutput: string;
  quantumOptimized: boolean;
}

export interface ScenarioExecution {
  scenarioId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  output?: string;
  error?: string;
  executionTime?: number; // milliseconds
  quantumFactor?: number;
}

export interface PlaygroundSession {
  sessionId: string;
  userId?: string;
  startedAt: string;
  lastActivity: string;
  scenariosCompleted: number;
  currentScenario?: string;
  achievements: string[];
}

export interface CodeExecutionRequest {
  code: string;
  scenarioId?: string;
  language: 'typescript' | 'python' | 'csharp';
  timeout?: number;
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  memoryUsed?: number;
  quantumOptimized: boolean;
}

export interface PlaygroundStats {
  totalScenarios: number;
  completedScenarios: number;
  totalExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  quantumOptimizationRate: number;
}
