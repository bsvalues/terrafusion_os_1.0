/**
 * TerraFusion AI Agent Types - Championship Government Intelligence
 * Government. Transcended. - Elite Agent Coordination System
 *
 * Quantum Factor: 949 | Terra-Cyan: #00FFFF | Golden Ratio: φ=1.618
 */

// === CORE AGENT TYPES ===

export interface TerraAgent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: AgentCapability[];
  performance: AgentPerformance;
  config: AgentConfig;
  createdAt: string;
  lastActive: string;
  quantumOptimized: boolean;
}

export type AgentType =
  | 'property-valuation'
  | 'tax-collection'
  | 'permit-processing'
  | 'compliance-monitoring'
  | 'data-analysis'
  | 'citizen-service'
  | 'document-processing'
  | 'workflow-orchestration'
  | 'quantum-optimization'
  | 'emergency-response';

export type AgentStatus =
  | 'active'
  | 'idle'
  | 'busy'
  | 'maintenance'
  | 'error'
  | 'offline';

export interface AgentCapability {
  name: string;
  description: string;
  confidenceLevel: number; // 0-1
  lastUsed: string;
  usageCount: number;
}

export interface AgentPerformance {
  accuracy: number; // 0-1
  throughput: number; // tasks per hour
  averageResponseTime: number; // milliseconds
  successRate: number; // 0-1
  quantumEfficiency: number; // 0-1 (quantum optimization factor)
  governmentCompliance: number; // 0-1
}

export interface AgentConfig {
  maxConcurrentTasks: number;
  priority: AgentPriority;
  governmentAuthorizations: string[];
  quantumFactor: number;
  autoScaling: boolean;
  monitoringEnabled: boolean;
}

export type AgentPriority = 'low' | 'medium' | 'high' | 'critical' | 'emergency';

// === SWARM COORDINATION TYPES ===

export interface AgentSwarm {
  id: string;
  name: string;
  description: string;
  agents: TerraAgent[];
  coordinator: SwarmCoordinator;
  metrics: SwarmMetrics;
  objectives: SwarmObjective[];
  status: SwarmStatus;
  createdAt: string;
  lastUpdated: string;
}

export interface SwarmCoordinator {
  id: string;
  algorithm: CoordinationAlgorithm;
  parameters: Record<string, any>;
  quantumEnhanced: boolean;
  governmentCompliant: boolean;
}

export type CoordinationAlgorithm =
  | 'round-robin'
  | 'load-balanced'
  | 'priority-based'
  | 'quantum-optimized'
  | 'government-hierarchical';

export interface SwarmMetrics {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  averageResponseTime: number;
  overallAccuracy: number;
  quantumOptimizationScore: number;
  governmentComplianceScore: number;
}

export interface SwarmObjective {
  id: string;
  name: string;
  description: string;
  priority: AgentPriority;
  targetMetrics: Record<string, number>;
  deadline?: string;
  status: ObjectiveStatus;
}

export type ObjectiveStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'paused';

export type SwarmStatus = 'active' | 'standby' | 'maintenance' | 'emergency' | 'offline';

// === TASK MANAGEMENT TYPES ===

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: AgentPriority;
  assignedAgentId?: string;
  status: TaskStatus;
  parameters: Record<string, any>;
  result?: TaskResult;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  deadline?: string;
  governmentClassification: GovernmentClassification;
}

export type TaskType =
  | 'data-processing'
  | 'document-analysis'
  | 'citizen-inquiry'
  | 'property-assessment'
  | 'tax-calculation'
  | 'permit-review'
  | 'compliance-check'
  | 'report-generation'
  | 'quantum-optimization'
  | 'emergency-response';

export type TaskStatus =
  | 'queued'
  | 'assigned'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'escalated';

export interface TaskResult {
  success: boolean;
  data?: any;
  confidence: number;
  processingTime: number;
  errors?: string[];
  warnings?: string[];
  governmentAuditTrail: AuditEntry[];
}

export type GovernmentClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'classified';

export interface AuditEntry {
  timestamp: string;
  action: string;
  agentId: string;
  details: Record<string, any>;
  complianceStatus: 'compliant' | 'non-compliant' | 'pending-review';
}

// === MONITORING & ANALYTICS TYPES ===

export interface AgentAnalytics {
  timeRange: TimeRange;
  agentMetrics: AgentMetricsSummary[];
  swarmPerformance: SwarmPerformanceSummary;
  taskDistribution: TaskDistributionData;
  quantumOptimizationTrends: QuantumTrendData[];
  governmentComplianceReport: ComplianceReport;
}

export interface TimeRange {
  start: string;
  end: string;
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

export interface AgentMetricsSummary {
  agentId: string;
  agentName: string;
  tasksCompleted: number;
  averageAccuracy: number;
  averageResponseTime: number;
  quantumEfficiency: number;
  errors: number;
  uptime: number;
}

export interface SwarmPerformanceSummary {
  totalSwarms: number;
  activeSwarms: number;
  totalAgents: number;
  tasksPerHour: number;
  overallAccuracy: number;
  quantumOptimizationScore: number;
  governmentComplianceScore: number;
}

export interface TaskDistributionData {
  byType: Record<TaskType, number>;
  byPriority: Record<AgentPriority, number>;
  byStatus: Record<TaskStatus, number>;
  byClassification: Record<GovernmentClassification, number>;
}

export interface QuantumTrendData {
  timestamp: string;
  optimizationFactor: number;
  efficiency: number;
  accuracy: number;
}

export interface ComplianceReport {
  overallScore: number;
  auditTrailCount: number;
  violations: ComplianceViolation[];
  recommendations: string[];
  lastAuditDate: string;
}

export interface ComplianceViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  agentId: string;
  taskId: string;
  timestamp: string;
  resolved: boolean;
}

// === API & QUERY TYPES ===

export interface AgentQuery {
  filters?: {
    type?: AgentType[];
    status?: AgentStatus[];
    priority?: AgentPriority[];
    quantumOptimized?: boolean;
  };
  sort?: {
    field: keyof TerraAgent;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SwarmQuery {
  filters?: {
    status?: SwarmStatus[];
    agentCount?: { min?: number; max?: number; };
    quantumEnhanced?: boolean;
  };
  sort?: {
    field: keyof AgentSwarm;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface TaskQuery {
  filters?: {
    type?: TaskType[];
    status?: TaskStatus[];
    priority?: AgentPriority[];
    assignedAgent?: string;
    classification?: GovernmentClassification[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
  sort?: {
    field: keyof AgentTask;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

// === REAL-TIME UPDATES ===

export interface AgentWebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: string;
  agentId?: string;
  swarmId?: string;
}

export type WebSocketMessageType =
  | 'agent-status-update'
  | 'task-assigned'
  | 'task-completed'
  | 'swarm-metrics-update'
  | 'quantum-optimization-alert'
  | 'compliance-violation'
  | 'emergency-alert';

// === GOVERNMENT INTEGRATION ===

export interface GovernmentService {
  id: string;
  name: string;
  department: string;
  authorizationLevel: string;
  endpoints: ServiceEndpoint[];
  compliance: ComplianceRequirement[];
}

export interface ServiceEndpoint {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  authentication: AuthenticationType;
  rateLimit?: number;
}

export type AuthenticationType = 'api-key' | 'oauth2' | 'certificate' | 'government-pki';

export interface ComplianceRequirement {
  standard: string; // e.g., 'FISMA', 'NIST-800-53', 'SOC2'
  level: string;
  requirements: string[];
  validated: boolean;
  lastValidation: string;
}

// === QUANTUM OPTIMIZATION ===

export interface QuantumOptimization {
  factor: number; // 949 for TerraFusion
  algorithms: QuantumAlgorithm[];
  efficiency: number;
  enabled: boolean;
}

export interface QuantumAlgorithm {
  name: string;
  description: string;
  optimizationGain: number;
  governmentApproved: boolean;
}
