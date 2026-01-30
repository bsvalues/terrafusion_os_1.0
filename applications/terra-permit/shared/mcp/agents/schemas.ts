/**
 * Model Content Protocol - Agent Schemas
 * 
 * Defines standardized schemas for multi-agent systems within the MCP framework.
 */

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Agent capability/skill enum
export enum AgentCapability {
  // Basic capabilities
  TEXT_GENERATION = 'text_generation',
  TEXT_COMPLETION = 'text_completion',
  TEXT_SUMMARIZATION = 'text_summarization',
  TEXT_CLASSIFICATION = 'text_classification',
  
  // Domain-specific capabilities
  PERMIT_ANALYSIS = 'permit_analysis',
  PERMIT_CLASSIFICATION = 'permit_classification',
  PERMIT_EXTRACTION = 'permit_extraction',
  
  // Specialized capabilities
  QUERY_ANSWERING = 'query_answering',
  DATA_ANALYSIS = 'data_analysis',
  NEIGHBORHOOD_ANALYSIS = 'neighborhood_analysis',
  CONSISTENCY_CHECK = 'consistency_check',
  
  // Workflow capabilities
  ORCHESTRATION = 'orchestration',
  TASK_ROUTING = 'task_routing',
  RESULT_AGGREGATION = 'result_aggregation'
}

// Agent model providers
export enum AgentProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  INTERNAL = 'internal',
  MOCK = 'mock'
}

// Agent status enum
export enum AgentStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ERROR = 'error'
}

// Agent registration schema
export const AgentRegistrationSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  provider: z.nativeEnum(AgentProvider),
  model: z.string().min(1),
  version: z.string().min(1),
  capabilities: z.array(z.nativeEnum(AgentCapability)).min(1),
  apiEndpoint: z.string().url().optional(),
  authType: z.enum(['none', 'api_key', 'oauth', 'custom']).default('none'),
  maxContextLength: z.number().positive().optional(),
  costPerToken: z.number().min(0).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type AgentRegistration = z.infer<typeof AgentRegistrationSchema>;

// Agent state schema (extends registration with runtime info)
export const AgentStateSchema = AgentRegistrationSchema.extend({
  status: z.nativeEnum(AgentStatus).default(AgentStatus.OFFLINE),
  lastHeartbeat: z.date().optional(),
  currentLoad: z.number().min(0).max(1).default(0), // 0-1 representing load
  totalRequestsProcessed: z.number().min(0).default(0),
  successRate: z.number().min(0).max(1).default(1),
  averageResponseTime: z.number().min(0).optional(),
  activeWorkflows: z.array(z.string()).default([]),
});

export type AgentState = z.infer<typeof AgentStateSchema>;

// Message types for agent communication
export enum MessageType {
  TASK_REQUEST = 'task_request',
  TASK_RESPONSE = 'task_response',
  STATUS_UPDATE = 'status_update',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat',
  REGISTRATION = 'registration',
  DEREGISTRATION = 'deregistration',
  QUERY = 'query',
  RESULT = 'result',
  WORKFLOW_START = 'workflow_start',
  WORKFLOW_END = 'workflow_end',
  WORKFLOW_PROGRESS = 'workflow_progress'
}

// Base message schema
export const BaseMessageSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  timestamp: z.date().default(() => new Date()),
  type: z.nativeEnum(MessageType),
  sender: z.string().uuid(),
  recipients: z.array(z.string().uuid()).optional(),
  correlationId: z.string().uuid().optional(), // For linking related messages
  priority: z.number().min(1).max(10).default(5),
  ttl: z.number().min(0).optional(), // Time to live in seconds
});

export type BaseMessage = z.infer<typeof BaseMessageSchema>;

// Task request message schema
export const TaskRequestSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.TASK_REQUEST),
  task: z.object({
    type: z.string(),
    capability: z.nativeEnum(AgentCapability),
    input: z.record(z.string(), z.any()),
    deadline: z.date().optional(),
    maxTokens: z.number().positive().optional(),
  }),
  workflowId: z.string().uuid().optional(), // If part of a larger workflow
  context: z.record(z.string(), z.any()).optional(),
});

export type TaskRequest = z.infer<typeof TaskRequestSchema>;

// Task response message schema
export const TaskResponseSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.TASK_RESPONSE),
  requestId: z.string().uuid(), // ID of the original task request
  result: z.object({
    data: z.any(),
    format: z.string().default('json'),
    confidence: z.number().min(0).max(1).optional(),
    processingTime: z.number().min(0).optional(), // in milliseconds
  }),
  metrics: z.object({
    tokensUsed: z.number().min(0).optional(),
    cost: z.number().min(0).optional(),
  }).optional(),
});

export type TaskResponse = z.infer<typeof TaskResponseSchema>;

// Error message schema
export const ErrorMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.ERROR),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
    recoverable: z.boolean().default(true),
    retryable: z.boolean().default(false),
  }),
  relatedMessageId: z.string().uuid().optional(),
});

export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;

// Heartbeat message schema
export const HeartbeatMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.HEARTBEAT),
  status: z.nativeEnum(AgentStatus),
  load: z.number().min(0).max(1),
});

export type HeartbeatMessage = z.infer<typeof HeartbeatMessageSchema>;

// Agent workflow definition schema
export const WorkflowStepSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  name: z.string().min(1),
  description: z.string().optional(),
  capabilityRequired: z.nativeEnum(AgentCapability),
  inputMapping: z.record(z.string(), z.string()).optional(), // Maps from previous steps
  timeout: z.number().min(0).optional(), // in milliseconds
  retryCount: z.number().min(0).default(0),
  fallbackStep: z.string().uuid().optional(),
  isRequired: z.boolean().default(true),
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

// Workflow definition schema
export const WorkflowDefinitionSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  steps: z.array(WorkflowStepSchema).min(1),
  connections: z.array(z.object({
    fromStep: z.string().uuid(),
    toStep: z.string().uuid(),
    condition: z.string().optional(), // Conditional expression
  })).optional(),
  inputSchema: z.record(z.string(), z.any()).optional(),
  outputSchema: z.record(z.string(), z.any()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

// Workflow instance schema (running workflow)
export const WorkflowInstanceSchema = z.object({
  id: z.string().uuid().default(() => uuidv4()),
  workflowId: z.string().uuid(), // Reference to workflow definition
  status: z.enum(['running', 'completed', 'failed', 'paused']).default('running'),
  currentSteps: z.array(z.string().uuid()), // Currently executing step IDs
  completedSteps: z.array(z.object({
    stepId: z.string().uuid(),
    agentId: z.string().uuid(),
    startTime: z.date(),
    endTime: z.date(),
    result: z.any(),
  })).default([]),
  input: z.record(z.string(), z.any()).default({}),
  intermediateResults: z.record(z.string(), z.any()).default({}),
  output: z.any().optional(),
  errors: z.array(z.object({
    stepId: z.string().uuid(),
    error: z.string(),
    timestamp: z.date(),
  })).default([]),
  startTime: z.date().default(() => new Date()),
  endTime: z.date().optional(),
  timeout: z.number().min(0).optional(), // Overall workflow timeout
  priority: z.number().min(1).max(10).default(5),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type WorkflowInstance = z.infer<typeof WorkflowInstanceSchema>;

// Workflow event schema for monitoring workflow progress
export const WorkflowEventSchema = BaseMessageSchema.extend({
  type: z.enum([
    MessageType.WORKFLOW_START,
    MessageType.WORKFLOW_END,
    MessageType.WORKFLOW_PROGRESS
  ]),
  workflowInstanceId: z.string().uuid(),
  eventType: z.enum([
    'workflow_started',
    'workflow_completed',
    'workflow_failed',
    'workflow_paused',
    'workflow_resumed',
    'step_started',
    'step_completed',
    'step_failed',
    'agent_assigned',
    'agent_failed'
  ]),
  step: z.object({
    id: z.string().uuid(),
    name: z.string(),
    status: z.enum(['pending', 'running', 'completed', 'failed']),
  }).optional(),
  agentId: z.string().uuid().optional(),
  details: z.record(z.string(), z.any()).optional(),
});

export type WorkflowEvent = z.infer<typeof WorkflowEventSchema>;

// Definition of agent registry search parameters
export const AgentQuerySchema = z.object({
  capabilities: z.array(z.nativeEnum(AgentCapability)).optional(),
  provider: z.nativeEnum(AgentProvider).optional(),
  status: z.nativeEnum(AgentStatus).optional(),
  minSuccessRate: z.number().min(0).max(1).optional(),
  maxResponseTime: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().positive().default(10),
  offset: z.number().min(0).default(0),
});

export type AgentQuery = z.infer<typeof AgentQuerySchema>;