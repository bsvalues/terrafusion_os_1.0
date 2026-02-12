/**
 * Model Content Protocol (MCP) Schemas
 * 
 * This file defines the core schemas used throughout the Model Content Protocol.
 */

import { z } from 'zod';

/**
 * Circuit Breaker State Enum
 */
export const MCPCircuitBreakerStateEnum = z.enum(['CLOSED', 'OPEN', 'HALF_OPEN']);
export type MCPCircuitBreakerState = z.infer<typeof MCPCircuitBreakerStateEnum>;

/**
 * Circuit Breaker Schema
 */
export const MCPCircuitBreakerSchema = z.object({
  id: z.string(),
  serviceName: z.string(),
  methodName: z.string().optional(),
  state: MCPCircuitBreakerStateEnum,
  failureThreshold: z.number(),
  resetTimeout: z.number(),
  successThreshold: z.number().optional(),
  lastFailure: z.number().nullable(),
  failureCount: z.number(),
  successCount: z.number(),
  lastStateChange: z.number(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type MCPCircuitBreaker = z.infer<typeof MCPCircuitBreakerSchema>;

/**
 * Agent Capability Schema
 */
export const MCPAgentCapabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
    required: z.boolean().optional(),
    description: z.string().optional(),
    defaultValue: z.any().optional()
  })).optional(),
  returnType: z.enum(['string', 'number', 'boolean', 'object', 'array']).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type MCPAgentCapability = z.infer<typeof MCPAgentCapabilitySchema>;

/**
 * Agent Status Enum
 */
export const MCPAgentStatusEnum = z.enum(['offline', 'online', 'busy', 'error']);
export type MCPAgentStatus = z.infer<typeof MCPAgentStatusEnum>;

/**
 * Agent Schema
 */
export const MCPAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string(),
  status: MCPAgentStatusEnum,
  capabilities: z.array(MCPAgentCapabilitySchema),
  metadata: z.record(z.string(), z.any()).optional(),
  lastPing: z.number().optional(),
  createdAt: z.number().optional().default(() => Date.now()),
  updatedAt: z.number().optional().default(() => Date.now())
});

export type MCPAgent = z.infer<typeof MCPAgentSchema>;

/**
 * Workflow Step Schema
 */
export const MCPWorkflowStepTypeEnum = z.enum([
  'function',
  'agent',
  'conditional',
  'parallel',
  'loop'
]);

export type MCPWorkflowStepType = z.infer<typeof MCPWorkflowStepTypeEnum>;

export const MCPWorkflowStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: MCPWorkflowStepTypeEnum,
  config: z.object({
    agentId: z.string().optional(),
    functionName: z.string().optional(),
    condition: z.string().optional(),
    iterations: z.number().optional()
  }),
  next: z.string().nullable(),
  error: z.string().nullable()
});

export type MCPWorkflowStep = z.infer<typeof MCPWorkflowStepSchema>;

/**
 * Workflow Definition Schema
 */
export const MCPWorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  steps: z.array(MCPWorkflowStepSchema),
  createdAt: z.number(),
  updatedAt: z.number()
});

export type MCPWorkflowDefinition = z.infer<typeof MCPWorkflowDefinitionSchema>;

/**
 * Workflow Status Enum
 */
export const MCPWorkflowStatusEnum = z.enum(['created', 'running', 'paused', 'completed', 'failed', 'cancelled']);
export type MCPWorkflowStatus = z.infer<typeof MCPWorkflowStatusEnum>;

/**
 * Workflow Execution Item Schema
 */
export const MCPWorkflowExecutionItemSchema = z.object({
  stepId: z.string(),
  startTime: z.number(),
  endTime: z.number().nullable(),
  status: z.enum(['success', 'failure', 'skipped']),
  output: z.any().optional(),
  error: z.string().nullable()
});

export type MCPWorkflowExecutionItem = z.infer<typeof MCPWorkflowExecutionItemSchema>;

/**
 * Workflow Instance Schema
 */
export const MCPWorkflowInstanceSchema = z.object({
  id: z.string(),
  definitionId: z.string(),
  name: z.string(),
  status: MCPWorkflowStatusEnum,
  progress: z.number().min(0).max(100),
  startTime: z.number(),
  endTime: z.number().nullable(),
  currentStep: z.string().nullable(),
  executionHistory: z.array(MCPWorkflowExecutionItemSchema)
});

export type MCPWorkflowInstance = z.infer<typeof MCPWorkflowInstanceSchema>;

/**
 * Event Severity Enum
 */
export const MCPEventSeverityEnum = z.enum(['debug', 'info', 'warn', 'error', 'critical']);
export type MCPEventSeverity = z.infer<typeof MCPEventSeverityEnum>;

/**
 * Event Type Enum
 */
export const MCPEventTypeEnum = z.enum([
  'workflow-transition', 
  'agent-message', 
  'circuit-breaker',
  'function-call',
  'system'
]);
export type MCPEventType = z.infer<typeof MCPEventTypeEnum>;

/**
 * Event Schema
 */
export const MCPEventSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  type: MCPEventTypeEnum,
  severity: MCPEventSeverityEnum,
  source: z.string(),
  message: z.string(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type MCPEvent = z.infer<typeof MCPEventSchema>;

/**
 * Registry Schema
 */
export const MCPRegistrySchema = z.object({
  agents: z.record(z.string(), MCPAgentSchema),
  workflows: z.record(z.string(), MCPWorkflowDefinitionSchema),
  circuitBreakers: z.record(z.string(), MCPCircuitBreakerSchema)
});

export type MCPRegistry = z.infer<typeof MCPRegistrySchema>;

/**
 * API Response Schemas
 */
export const MCPApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.number()
});

export type MCPApiResponse = z.infer<typeof MCPApiResponseSchema>;

export const MCPCircuitBreakerListResponseSchema = MCPApiResponseSchema.extend({
  data: z.array(MCPCircuitBreakerSchema).optional()
});

export const MCPAgentListResponseSchema = MCPApiResponseSchema.extend({
  data: z.array(MCPAgentSchema).optional()
});

export const MCPWorkflowListResponseSchema = MCPApiResponseSchema.extend({
  data: z.array(MCPWorkflowDefinitionSchema).optional()
});

export const MCPWorkflowInstanceListResponseSchema = MCPApiResponseSchema.extend({
  data: z.array(MCPWorkflowInstanceSchema).optional()
});

export const MCPEventListResponseSchema = MCPApiResponseSchema.extend({
  data: z.array(MCPEventSchema).optional()
});