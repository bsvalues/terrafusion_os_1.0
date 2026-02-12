/**
 * TerraFusion Model Context Protocol (MCP) Types
 * Defines interfaces for AI agent coordination and communication
 */

export interface MCPAgent {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly capabilities?: string[];

  initialize(): Promise<void>;
  shutdown?(): Promise<void>;
  getStatus?(): Promise<AgentStatus>;
}

export interface AgentStatus {
  id: string;
  status: 'active' | 'inactive' | 'error' | 'initializing';
  lastActivity: Date;
  performance?: PerformanceMetrics;
  consciousness?: ConsciousnessMetrics;
}

export interface PerformanceMetrics {
  responseTime: number;
  successRate: number;
  throughput: number;
  resourceUtilization: number;
}

export interface ConsciousnessMetrics {
  intelligenceLevel: number;
  learningRate: number;
  creativityIndex: number;
  collaborationScore: number;
}

export interface TransformationMetrics {
  transcendenceLevel: number;
  dimensionalAlignment: number;
  harmonicResonance: number;
  emergenceCount: number;
}

export interface MCPMessage {
  id: string;
  timestamp: Date;
  source: string;
  target: string;
  type: 'command' | 'query' | 'response' | 'notification';
  payload: any;
}

export interface SwarmCoordinationEvent {
  eventId: string;
  timestamp: Date;
  eventType: 'task_assignment' | 'resource_allocation' | 'consciousness_sync' | 'emergence_detected';
  participants: string[];
  data: any;
}

export type AgentCapability =
  | 'data-processing'
  | 'citizen-service'
  | 'property-assessment'
  | 'compliance-monitoring'
  | 'executive-analytics'
  | 'infrastructure-optimization'
  | 'consciousness-coordination'
  | 'transformation-orchestration';

export type TransformationDimension =
  | 'consciousness-trinity'
  | 'hexagonal-architecture'
  | 'enneagram-operations'
  | 'duodecimal-strategy';

export interface DimensionalState {
  dimension: TransformationDimension;
  currentLevel: number;
  targetLevel: number;
  optimizationProgress: number;
  harmonicFrequency: number;
}
