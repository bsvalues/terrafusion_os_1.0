/**
 * Agent Protocol - Standardized Communication Format
 * 
 * This module defines the protocol used for communication between agents
 * and the Master Control Program (MCP). It establishes message formats,
 * event types, and error codes to ensure consistent communication.
 */

/**
 * Agent types supported by the system
 */
export enum AgentType {
  // Core operational agents
  VALUATION = 'VALUATION',
  DATA_CLEANER = 'DATA_CLEANER',
  REPORTING = 'REPORTING',
  
  // Command structure agents
  ARCHITECT_PRIME = 'ARCHITECT_PRIME',
  INTEGRATION_COORDINATOR = 'INTEGRATION_COORDINATOR',
  COMPONENT_LEAD = 'COMPONENT_LEAD',
  
  // System agents
  SYSTEM = 'SYSTEM'
}

/**
 * Event types for message communication
 */
export enum EventType {
  // Core events
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  ERROR = 'ERROR',
  BROADCAST = 'BROADCAST',
  
  // System management events
  REGISTRATION = 'REGISTRATION',
  UNREGISTRATION = 'UNREGISTRATION',
  HEARTBEAT = 'HEARTBEAT',
  SHUTDOWN = 'SHUTDOWN',
  
  // Coordination events
  ASSISTANCE_REQUESTED = 'ASSISTANCE_REQUESTED',
  ASSISTANCE_RESPONSE = 'ASSISTANCE_RESPONSE',
  ASSISTANCE_PROVIDED = 'ASSISTANCE_PROVIDED',
  
  // Learning events
  EXPERIENCE_ADDED = 'EXPERIENCE_ADDED',
  LEARNING_TRIGGERED = 'LEARNING_TRIGGERED',
  
  // Status events
  STATUS_UPDATE = 'STATUS_UPDATE',
  METRIC_REPORT = 'METRIC_REPORT',
  
  // Command events
  COMMAND = 'COMMAND',
  COMMAND_RESULT = 'COMMAND_RESULT'
}

/**
 * Standard error codes
 */
export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  
  // Communication errors
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  UNKNOWN_AGENT = 'UNKNOWN_AGENT',
  AGENT_UNREACHABLE = 'AGENT_UNREACHABLE',
  
  // System errors
  SYSTEM_OVERLOAD = 'SYSTEM_OVERLOAD',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  
  // Agent errors
  AGENT_ERROR = 'AGENT_ERROR',
  CAPABILITY_MISMATCH = 'CAPABILITY_MISMATCH',
  
  // Security errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN'
}

/**
 * Standardized agent message format
 */
export interface AgentMessage {
  messageId: string;             // Unique ID for this message
  correlationId: string;         // ID to correlate related messages (e.g., request/response)
  sourceAgentId: string;         // ID of the agent sending this message
  targetAgentId: string;         // ID of the intended recipient ('MCP' for broadcast/system)
  timestamp: string;             // ISO timestamp of message creation
  eventType: EventType;          // Type of event this message represents
  payload: any;                  // Message payload (specific to event type)
}

/**
 * Agent configuration settings interface
 */
export interface AgentConfig {
  [key: string]: any;            // Dynamic configuration properties
}

/**
 * Agent experience record for learning
 */
export interface AgentExperience {
  experienceId: string;          // Unique ID for this experience
  agentId: string;               // ID of the agent that had this experience
  timestamp: string;             // When this experience occurred
  taskId: string;                // ID of the task/request that generated this experience
  metadata: {                    // Metadata about the experience
    messageType: EventType;      // Type of message that generated this experience
    processingTime: number;      // Time taken to process in ms
    successRate?: number;        // Success rate (0-1) if applicable
  };
  request: any;                  // The original request
  result: any;                   // The result (could be success or error)
  tags: string[];                // Tags for categorization
}

/**
 * Agent status for health checks
 */
export interface AgentStatus {
  agentId: string;               // ID of the agent
  agentType: AgentType;          // Type of the agent
  status: 'healthy' | 'degraded' | 'error'; // Current health status
  lastActivity: string;          // Timestamp of last activity
  activeRequests: number;        // Number of active requests
  metrics: {                     // Performance metrics
    avgResponseTime: number;     // Average response time in ms
    successRate: number;         // Success rate (0-1)
    errorRate: number;           // Error rate (0-1)
    requestsProcessed: number;   // Total requests processed
  };
  errors?: string[];             // Recent errors if status is degraded/error
}

/**
 * System health status
 */
export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'error';
  timestamp: string;
  components: {
    mcp: {
      status: 'healthy' | 'degraded' | 'error';
      metrics: {
        messageQueueSize: number;
        messagesProcessed: number;
        activeAgents: number;
      }
    },
    agents: Record<string, AgentStatus>;
  };
  issues?: string[];
}

/**
 * Practice severity levels for best practices and compliance rules
 */
export type PracticeSeverity = 'critical' | 'high' | 'medium' | 'low';