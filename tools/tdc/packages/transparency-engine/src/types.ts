/**
 * TerraFusion Transparency Engine - Core Types
 *
 * Implements "Elegant Transparency" - progressive disclosure of system complexity
 * based on user sophistication and operational context.
 *
 * Philosophy: Government systems must be transparent, but not overwhelming.
 * Surface layer for citizens, Expert layer for engineers.
 */

/**
 * Four layers of progressive disclosure
 *
 * - surface: High-level summaries only ("Build succeeded")
 * - hint: Light contextual details ("Build succeeded in 2.3s, 0 warnings")
 * - depth: Technical details visible ("15 projects compiled, 3 warnings in TerraFusion.Core")
 * - expert: Full telemetry exposed ("All compiler output, agent coordination logs, performance metrics")
 */
export type TransparencyLayer = 'surface' | 'hint' | 'depth' | 'expert';

/**
 * Agent execution phases
 */
export type AgentPhase =
  | 'planning' // Agent determining what to do
  | 'executing' // Agent performing work
  | 'waiting' // Agent blocked on external resource
  | 'idle' // Agent available but not tasked
  | 'error' // Agent encountered failure
  | 'complete'; // Agent finished successfully

/**
 * TerraFusion services that can publish agent actions
 */
export type TerraFusionService =
  | 'dotnet-backend' // .NET 8 microservices (API, Consciousness, etc.)
  | 'rust-ide' // Rust IDE backend (Command Portal)
  | 'portal-ui' // React frontend (Command Portal)
  | 'tdc-cli' // TerraFusion Developer Console
  | 'sync' // TerraFusion.Sync service
  | 'levy' // TerraFusion.Levy service
  | 'costforge' // CostForge AI service
  | 'consciousness' // AI Swarm Consciousness Engine
  | 'workspace' // Workspace orchestrator
  | 'other';

/**
 * Single agent action (unit of work in the transparency system)
 *
 * Every significant operation publishes an AgentAction to the TransparencyBus.
 * UI components subscribe and display based on current transparency layer.
 */
export interface AgentAction {
  /** UTC timestamp */
  timestamp: string;

  /** Unique identifier for the agent (e.g., "api-gateway-worker-3") */
  agentId: string;

  /** Human-readable role (e.g., "Property Assessment Agent", "Build Coordinator") */
  agentRole: string;

  /** Which workspace this action relates to */
  workspace: string;

  /** Which TerraFusion service published this action */
  service: TerraFusionService;

  /** Current phase of execution */
  phase: AgentPhase;

  /** Brief summary visible at all transparency layers */
  summary: string;

  /** Optional detailed information (shown at depth/expert layers) */
  details?: Record<string, unknown>;

  /** Optional correlation ID for tracing related actions */
  correlationId?: string;

  /** Optional duration in milliseconds (for completed actions) */
  durationMs?: number;

  /** Optional error details (for error phase) */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * User capability profile
 *
 * Determines initial transparency layer and affects progressive disclosure.
 * More sophisticated users start at deeper layers.
 */
export interface UserCapabilityModel {
  /** Unique user identifier */
  userId: string;

  /** Experience level with TerraFusion OS */
  experienceLevel: 'novice' | 'intermediate' | 'power';

  /** How long user has been using the system */
  weeksOfUse: number;

  /** User preference for minimal vs. detailed interfaces */
  prefersMinimalUI: boolean;

  /** Last transparency layer user explicitly selected */
  lastLayer?: TransparencyLayer;

  /** User's role (affects default layer) */
  role?: 'citizen' | 'staff' | 'developer' | 'admin';
}

/**
 * Operational context
 *
 * What the user is doing RIGHT NOW affects transparency needs.
 * Building? Show build details. Exploring? Show high-level overview.
 */
export interface OperationalContext {
  /** Current workspace */
  workspace: string;

  /** Environment */
  environment: 'local' | 'dev' | 'staging' | 'prod';

  /** Type of task being performed */
  taskType: 'build' | 'deploy' | 'analysis' | 'support' | 'exploration';

  /** Active service (if focused on one) */
  focusedService?: TerraFusionService;

  /** Time pressure (affects layer - errors during production incident need expert layer) */
  urgency?: 'routine' | 'elevated' | 'critical';
}

/**
 * System decision log entry
 *
 * Records high-level decisions made by the AI swarm.
 * Used for audit trails and expert-level transparency.
 */
export interface SystemDecisionLog {
  /** Unique decision identifier */
  id: string;

  /** When decision was made */
  timestamp: string;

  /** Which agents participated in the decision */
  agentsInvolved: string[];

  /** Type of decision */
  decisionType: string;

  /** Outcome */
  outcome: 'success' | 'failure' | 'degraded';

  /** Human-readable explanation */
  explanation?: string;

  /** Input factors that influenced decision */
  inputs?: Record<string, unknown>;

  /** Resulting actions taken */
  actions?: string[];
}

/**
 * Performance metrics aggregation
 *
 * Rolled-up statistics shown at depth/expert layers.
 */
export interface PerformanceMetrics {
  /** Service-level metrics */
  byService: Record<TerraFusionService, ServiceMetrics>;

  /** Agent pool utilization */
  agentUtilization: {
    total: number;
    active: number;
    idle: number;
    errorState: number;
  };

  /** Recent error rate */
  errorRate: {
    last1Minute: number;
    last5Minutes: number;
    last15Minutes: number;
  };

  /** Response time percentiles (ms) */
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface ServiceMetrics {
  /** Request count */
  requestCount: number;

  /** Error count */
  errorCount: number;

  /** Average response time (ms) */
  avgResponseTime: number;

  /** Current health status */
  health: 'healthy' | 'degraded' | 'unhealthy';
}

/**
 * Transparency plugin interface
 *
 * Allows extending the transparency system with custom visualizations
 * and metrics for specific contexts.
 */
export interface TransparencyPlugin {
  /** Unique plugin identifier */
  id: string;

  /** Which transparency layers this plugin applies to */
  layers: TransparencyLayer[];

  /** Which contexts this plugin is relevant for */
  contexts: string[];

  /** Render function (returns UI component or data) */
  render: (actions: AgentAction[], layer: TransparencyLayer) => unknown;

  /** Optional metrics collection */
  collectMetrics?: (actions: AgentAction[]) => Record<string, unknown>;

  /** Optional configuration schema */
  configSchema?: Record<string, unknown>;
}
