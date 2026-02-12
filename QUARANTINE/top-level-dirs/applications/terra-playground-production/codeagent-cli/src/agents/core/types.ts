/**
 * types.ts
 *
 * Type definitions for the agent system
 */

/**
 * Agent status enum
 */
export enum AgentStatus {
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  PAUSED = 'paused',
  SHUTTING_DOWN = 'shutting_down',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * Agent capability enum
 */
export enum AgentCapability {
  // Core capabilities
  TASK_EXECUTION = 'task_execution',
  STATE_PERSISTENCE = 'state_persistence',
  EVENT_EMISSION = 'event_emission',

  // Debugging capabilities
  CODE_ANALYSIS = 'code_analysis',
  ERROR_TRACKING = 'error_tracking',
  EXECUTION_TRACING = 'execution_tracing',
  PERFORMANCE_PROFILING = 'performance_profiling',

  // Deployment capabilities
  LOCAL_DEPLOYMENT = 'local_deployment',
  WEB_DEPLOYMENT = 'web_deployment',
  CONTAINER_GENERATION = 'container_generation',
  ENVIRONMENT_CHECKING = 'environment_checking',

  // Version control capabilities
  CHANGE_TRACKING = 'change_tracking',
  MERGE_MANAGEMENT = 'merge_management',
  DIFF_VISUALIZATION = 'diff_visualization',
  GIT_INTEGRATION = 'git_integration',

  // Database capabilities
  QUERY_OPTIMIZATION = 'query_optimization',
  SCHEMA_SUGGESTION = 'schema_suggestion',
  DATA_MIGRATION = 'data_migration',
  PERFORMANCE_MONITORING = 'performance_monitoring',

  // GIS capabilities
  GEOSPATIAL_PROCESSING = 'geospatial_processing',
  MAP_RENDERING = 'map_rendering',
  SPATIAL_QUERY = 'spatial_query',
  COORDINATE_TRANSFORMATION = 'coordinate_transformation',

  // Development capabilities
  BUILD_OPTIMIZATION = 'build_optimization',
  TEST_GENERATION = 'test_generation',
  CODE_QUALITY = 'code_quality',
  AGENT_ORCHESTRATION = 'agent_orchestration',
}

/**
 * Agent priority enum
 */
export enum AgentPriority {
  LOWEST = 0,
  LOW = 25,
  NORMAL = 50,
  HIGH = 75,
  HIGHEST = 100,
}

/**
 * Agent type enum
 */
export enum AgentType {
  COORDINATOR = 'coordinator',
  DOMAIN_SPECIFIC = 'domain_specific',
  TASK_SPECIFIC = 'task_specific',
  UTILITY = 'utility',
}

/**
 * Agent task interface
 */
export interface AgentTask {
  id: string;
  type: string;
  priority: AgentPriority;
  payload: any;
  metadata?: Record<string, any>;
  createdAt: Date;
  timeout?: number;
}

/**
 * Agent task result interface
 */
export interface AgentTaskResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: Error;
  processingTime: number;
  completedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Agent context interface
 */
export interface AgentContext {
  userId?: string;
  sessionId?: string;
  environment?: Record<string, any>;
  inputs?: Record<string, any>;
  state?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Agent event types
 */
export enum AgentEventType {
  INITIALIZED = 'agent.initialized',
  STARTED = 'agent.started',
  PAUSED = 'agent.paused',
  RESUMED = 'agent.resumed',
  SHUTDOWN = 'agent.shutdown',
  ERROR = 'agent.error',
  TASK_RECEIVED = 'agent.task.received',
  TASK_STARTED = 'agent.task.started',
  TASK_COMPLETED = 'agent.task.completed',
  TASK_FAILED = 'agent.task.failed',
  STATE_CHANGED = 'agent.state.changed',
  CAPABILITY_ADDED = 'agent.capability.added',
  CAPABILITY_REMOVED = 'agent.capability.removed',
}

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  name: string;
  type: AgentType;
  capabilities?: AgentCapability[];
  priority?: AgentPriority;
  metadata?: Record<string, any>;
  settings?: Record<string, any>;
}

/**
 * Agent registry entry interface
 */
export interface AgentRegistryEntry {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: AgentCapability[];
  priority: AgentPriority;
  lastActive: Date;
  metadata: Record<string, any>;
}

/**
 * Agent metric type
 */
export enum AgentMetricType {
  TASK_COUNT = 'task_count',
  SUCCESS_RATE = 'success_rate',
  AVERAGE_PROCESSING_TIME = 'average_processing_time',
  ERROR_RATE = 'error_rate',
  CPU_USAGE = 'cpu_usage',
  MEMORY_USAGE = 'memory_usage',
  UPTIME = 'uptime',
}

/**
 * Agent metric interface
 */
export interface AgentMetric {
  agentId: string;
  type: AgentMetricType;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}
