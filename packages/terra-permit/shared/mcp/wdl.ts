/**
 * Model Content Protocol (MCP) Workflow Definition Language (WDL)
 * 
 * This file defines the schema and utilities for the Workflow Definition Language (WDL)
 * used to standardize workflow descriptions across the Model Content Protocol.
 */

import { z } from 'zod';
import { 
  MCPWorkflowStepSchema, 
  MCPWorkflowDefinitionSchema, 
  MCPRegistrySchema,
  type MCPWorkflowStep,
  type MCPWorkflowDefinition,
  type MCPRegistry
} from './schemas';

/**
 * WDL Step Type Enum - defines the possible step types in a workflow
 */
export const WDLStepTypeEnum = z.enum([
  'agent',       // A step executed by an AI agent
  'function',    // A step calling a function
  'conditional', // A step with branching logic
  'parallel',    // Multiple steps executed in parallel
  'loop'         // A step that iterates
]);

export type WDLStepType = z.infer<typeof WDLStepTypeEnum>;

/**
 * WDL Step Schema - defines the structure of workflow steps in WDL
 */
export const WDLStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: WDLStepTypeEnum,
  config: z.object({
    agentId: z.string().optional(),
    functionName: z.string().optional(),
    condition: z.string().optional(),
    iterations: z.number().optional(),
    timeout: z.number().optional(),
    retry: z.object({
      attempts: z.number(),
      backoff: z.number(),
      maxDelay: z.number()
    }).optional(),
    eventKey: z.string().optional(),
    eventPattern: z.string().optional()
  }),
  next: z.array(z.object({
    stepId: z.string(),
    condition: z.string().optional(),
    description: z.string().optional()
  })).or(z.literal('end')).optional(),
  error: z.string().nullable(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type WDLStep = z.infer<typeof WDLStepSchema>;

/**
 * WDL Workflow Schema - defines the structure of workflow definitions in WDL
 */
export const WDLWorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  triggers: z.array(z.object({
    type: z.enum(['schedule', 'event', 'api', 'manual']),
    config: z.record(z.string(), z.any())
  })).optional(),
  steps: z.array(WDLStepSchema),
  variables: z.record(z.string(), z.object({
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
    description: z.string().optional(),
    default: z.any().optional()
  })).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type WDLWorkflow = z.infer<typeof WDLWorkflowSchema>;

/**
 * WDL Package Schema - defines the structure of a workflow package in WDL
 */
export const WDLPackageSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string(),
  author: z.string().optional(),
  workflows: z.record(z.string(), WDLWorkflowSchema),
  dependencies: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type WDLPackage = z.infer<typeof WDLPackageSchema>;

/**
 * Convert a WDLStep to MCPWorkflowStep
 */
export function convertWDLStepToMCPStep(wdlStep: WDLStep): MCPWorkflowStep {
  // Handle the 'next' field conversion from WDL format to MCP format
  let nextStep: string | null = null;
  
  if (wdlStep.next) {
    if (wdlStep.next === 'end') {
      nextStep = null;
    } else if (Array.isArray(wdlStep.next) && wdlStep.next.length > 0) {
      // If there are multiple next steps, use the first one by default
      // (In a more advanced implementation, this would need to handle conditions)
      nextStep = wdlStep.next[0].stepId;
    }
  }
  
  return {
    id: wdlStep.id,
    name: wdlStep.name,
    type: wdlStep.type,
    config: {
      agentId: wdlStep.config.agentId,
      functionName: wdlStep.config.functionName,
      condition: wdlStep.config.condition,
      iterations: wdlStep.config.iterations
    },
    next: nextStep,
    error: wdlStep.error
  };
}

/**
 * Convert a WDLWorkflow to MCPWorkflowDefinition
 */
export function convertWDLWorkflowToMCPWorkflow(wdlWorkflow: WDLWorkflow): MCPWorkflowDefinition {
  return {
    id: wdlWorkflow.id,
    name: wdlWorkflow.name,
    description: wdlWorkflow.description,
    version: wdlWorkflow.version,
    steps: wdlWorkflow.steps.map(step => convertWDLStepToMCPStep(step)),
    createdAt: wdlWorkflow.createdAt,
    updatedAt: wdlWorkflow.updatedAt
  };
}

/**
 * Convert an MCPWorkflowStep to WDLStep
 */
export function convertMCPStepToWDLStep(mcpStep: MCPWorkflowStep): WDLStep {
  // Convert the next field from a string to the WDL format
  const nextSteps = mcpStep.next === null ? 
    ('end' as const) : 
    ([{
      stepId: mcpStep.next,
      description: `Next step after ${mcpStep.name}`
    }]);
  
  return {
    id: mcpStep.id,
    name: mcpStep.name,
    type: mcpStep.type as WDLStepType,
    config: {
      agentId: mcpStep.config.agentId,
      functionName: mcpStep.config.functionName,
      condition: mcpStep.config.condition,
      iterations: mcpStep.config.iterations
    },
    next: nextSteps,
    error: mcpStep.error
  };
}

/**
 * Convert an MCPWorkflowDefinition to WDLWorkflow
 */
export function convertMCPWorkflowToWDLWorkflow(mcpWorkflow: MCPWorkflowDefinition): WDLWorkflow {
  return {
    id: mcpWorkflow.id,
    name: mcpWorkflow.name,
    description: mcpWorkflow.description,
    version: mcpWorkflow.version,
    steps: mcpWorkflow.steps.map(step => convertMCPStepToWDLStep(step)),
    createdAt: mcpWorkflow.createdAt,
    updatedAt: mcpWorkflow.updatedAt
  };
}

/**
 * Register WDL workflows in the MCP Registry
 */
export function registerWDLWorkflowsInRegistry(
  registry: MCPRegistry, 
  wdlPackage: WDLPackage
): MCPRegistry {
  const updatedWorkflows = { ...registry.workflows };
  
  Object.entries(wdlPackage.workflows).forEach(([key, wdlWorkflow]) => {
    updatedWorkflows[key] = convertWDLWorkflowToMCPWorkflow(wdlWorkflow);
  });
  
  return {
    ...registry,
    workflows: updatedWorkflows
  };
}

/**
 * Export WDL Schema as JSON Schema
 */
export function exportWDLSchemaAsJSONSchema() {
  // This is a placeholder for converting Zod schemas to JSON Schema
  // In a real implementation, you'd use a library like zod-to-json-schema
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "MCP Workflow Definition Language",
    description: "JSON Schema for the Model Content Protocol Workflow Definition Language",
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      version: { type: "string" },
      author: { type: "string" },
      workflows: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            version: { type: "string" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  type: { 
                    type: "string", 
                    enum: ["agent", "function", "conditional", "parallel", "loop"]
                  },
                  config: { type: "object" },
                  next: {
                    oneOf: [
                      { type: "string", enum: ["end"] },
                      {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            stepId: { type: "string" },
                            condition: { type: "string" }
                          },
                          required: ["stepId"]
                        }
                      }
                    ]
                  },
                  error: { type: ["string", "null"] }
                },
                required: ["id", "name", "type", "config"]
              }
            }
          },
          required: ["id", "name", "description", "version", "steps"]
        }
      }
    },
    required: ["name", "description", "version", "workflows"]
  };
}

/**
 * Validate WDL Package
 */
export function validateWDLPackage(packageData: unknown): { isValid: boolean; errors?: string[] } {
  try {
    WDLPackageSchema.parse(packageData);
    return { isValid: true };
  } catch (error) {
    let errors: string[] = [];
    if (error instanceof z.ZodError) {
      errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    } else if (error instanceof Error) {
      errors = [error.message];
    } else {
      errors = ['Unknown validation error'];
    }
    return {
      isValid: false,
      errors
    };
  }
}

/**
 * Create a simple workflow from a list of step names and types
 */
export function createSimpleWorkflow(
  workflowId: string,
  workflowName: string,
  description: string,
  steps: Array<{ name: string; type: WDLStepType; config?: any }>
): WDLWorkflow {
  const workflowSteps: WDLStep[] = steps.map((step, index) => {
    const nextIndex = index + 1;
    const next = nextIndex < steps.length 
      ? [{ stepId: `step-${nextIndex + 1}`, description: `Next step after ${step.name}` }]
      : 'end' as const;
      
    return {
      id: `step-${index + 1}`,
      name: step.name,
      type: step.type,
      config: step.config || {},
      next,
      error: index === steps.length - 1 ? null : `error-handler`
    };
  });
  
  // Add an error handler step if there are multiple steps
  if (steps.length > 1) {
    workflowSteps.push({
      id: 'error-handler',
      name: 'Error Handler',
      type: 'function',
      config: {
        functionName: 'handleWorkflowError'
      },
      next: 'end',
      error: null
    });
  }
  
  return {
    id: workflowId,
    name: workflowName,
    description,
    version: '1.0.0',
    steps: workflowSteps,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}