/**
 * Model Content Protocol (MCP) Routes
 * 
 * This file defines the Express routes for the Model Content Protocol API.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { 
  MCPCircuitBreakerSchema,
  MCPAgentSchema,
  MCPWorkflowDefinitionSchema,
  MCPWorkflowInstanceSchema,
  MCPEventSchema,
  MCPApiResponseSchema,
  MCPCircuitBreakerListResponseSchema,
  MCPAgentListResponseSchema,
  MCPWorkflowListResponseSchema,
  MCPWorkflowInstanceListResponseSchema,
  MCPEventListResponseSchema,
  type MCPCircuitBreaker,
  type MCPAgent,
  type MCPWorkflowDefinition,
  type MCPWorkflowInstance,
  type MCPEvent,
  type MCPApiResponse
} from '../../shared/mcp/schemas';

// Mock data stores (replace with actual persistence in a real implementation)
const circuitBreakers: Record<string, MCPCircuitBreaker> = {};
const agents: Record<string, MCPAgent> = {};
const workflowDefinitions: Record<string, MCPWorkflowDefinition> = {};
const workflowInstances: Record<string, MCPWorkflowInstance> = {};
const events: MCPEvent[] = [];

// Create a new router
const router = Router();

/**
 * Helper function to create API responses
 */
function createApiResponse<T>(success: boolean, data?: T, error?: string): MCPApiResponse {
  return {
    success,
    data,
    error,
    timestamp: Date.now()
  };
}

/**
 * Circuit Breaker API Routes
 */

// Get all circuit breakers
router.get('/circuit-breakers', (_req: Request, res: Response) => {
  const circuitBreakerList = Object.values(circuitBreakers);
  res.json(createApiResponse(true, circuitBreakerList));
});

// Get a specific circuit breaker
router.get('/circuit-breakers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const circuitBreaker = circuitBreakers[id];
  
  if (!circuitBreaker) {
    return res.status(404).json(createApiResponse(false, undefined, `Circuit breaker with ID ${id} not found`));
  }
  
  res.json(createApiResponse(true, circuitBreaker));
});

// Create a new circuit breaker
router.post('/circuit-breakers', (req: Request, res: Response) => {
  try {
    const circuitBreakerData = MCPCircuitBreakerSchema.parse({
      ...req.body,
      id: req.body.id || uuidv4()
    });
    
    circuitBreakers[circuitBreakerData.id] = circuitBreakerData;
    
    // Log circuit breaker creation event
    const event: MCPEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'circuit-breaker',
      severity: 'info',
      source: 'mcp-api',
      message: `Circuit breaker ${circuitBreakerData.serviceName} (${circuitBreakerData.id}) created`,
      metadata: { circuitBreakerId: circuitBreakerData.id }
    };
    events.push(event);
    
    res.status(201).json(createApiResponse(true, circuitBreakerData));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiResponse(
        false, 
        undefined,
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      ));
    }
    
    res.status(500).json(createApiResponse(false, undefined, 'Internal server error'));
  }
});

// Update a circuit breaker
router.patch('/circuit-breakers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const circuitBreaker = circuitBreakers[id];
  
  if (!circuitBreaker) {
    return res.status(404).json(createApiResponse(false, undefined, `Circuit breaker with ID ${id} not found`));
  }
  
  try {
    const updatedCircuitBreaker = {
      ...circuitBreaker,
      ...req.body,
      id // Ensure ID doesn't change
    };
    
    const validatedCircuitBreaker = MCPCircuitBreakerSchema.parse(updatedCircuitBreaker);
    circuitBreakers[id] = validatedCircuitBreaker;
    
    // Log circuit breaker update event
    const event: MCPEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'circuit-breaker',
      severity: 'info',
      source: 'mcp-api',
      message: `Circuit breaker ${validatedCircuitBreaker.serviceName} (${validatedCircuitBreaker.id}) updated`,
      metadata: { 
        circuitBreakerId: validatedCircuitBreaker.id,
        changes: req.body 
      }
    };
    events.push(event);
    
    res.json(createApiResponse(true, validatedCircuitBreaker));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiResponse(
        false, 
        undefined,
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      ));
    }
    
    res.status(500).json(createApiResponse(false, undefined, 'Internal server error'));
  }
});

// Reset a circuit breaker
router.post('/circuit-breakers/:id/reset', (req: Request, res: Response) => {
  const { id } = req.params;
  const circuitBreaker = circuitBreakers[id];
  
  if (!circuitBreaker) {
    return res.status(404).json(createApiResponse(false, undefined, `Circuit breaker with ID ${id} not found`));
  }
  
  const updatedCircuitBreaker: MCPCircuitBreaker = {
    ...circuitBreaker,
    state: 'CLOSED',
    lastStateChange: Date.now()
  };
  
  circuitBreakers[id] = updatedCircuitBreaker;
  
  // Log circuit breaker reset event
  const event: MCPEvent = {
    id: uuidv4(),
    timestamp: Date.now(),
    type: 'circuit-breaker',
    severity: 'info',
    source: 'mcp-api',
    message: `Circuit breaker ${updatedCircuitBreaker.serviceName} (${updatedCircuitBreaker.id}) reset to CLOSED state`,
    metadata: { circuitBreakerId: updatedCircuitBreaker.id }
  };
  events.push(event);
  
  res.json(createApiResponse(true, updatedCircuitBreaker));
});

// Delete a circuit breaker
router.delete('/circuit-breakers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!circuitBreakers[id]) {
    return res.status(404).json(createApiResponse(false, undefined, `Circuit breaker with ID ${id} not found`));
  }
  
  const deletedCircuitBreaker = circuitBreakers[id];
  delete circuitBreakers[id];
  
  // Log circuit breaker deletion event
  const event: MCPEvent = {
    id: uuidv4(),
    timestamp: Date.now(),
    type: 'circuit-breaker',
    severity: 'info',
    source: 'mcp-api',
    message: `Circuit breaker ${deletedCircuitBreaker.serviceName} (${deletedCircuitBreaker.id}) deleted`,
    metadata: { circuitBreakerId: deletedCircuitBreaker.id }
  };
  events.push(event);
  
  res.json(createApiResponse(true, { id }));
});

/**
 * Agent API Routes
 */

// Get all agents
router.get('/agents', (_req: Request, res: Response) => {
  const agentList = Object.values(agents);
  res.json(createApiResponse(true, agentList));
});

// Get a specific agent
router.get('/agents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const agent = agents[id];
  
  if (!agent) {
    return res.status(404).json(createApiResponse(false, undefined, `Agent with ID ${id} not found`));
  }
  
  res.json(createApiResponse(true, agent));
});

// Create a new agent
router.post('/agents', (req: Request, res: Response) => {
  try {
    const agentData = MCPAgentSchema.parse({
      ...req.body,
      id: req.body.id || uuidv4()
    });
    
    agents[agentData.id] = agentData;
    
    // Log agent creation event
    const event: MCPEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'agent-message',
      severity: 'info',
      source: 'mcp-api',
      message: `Agent ${agentData.name} (${agentData.id}) registered`,
      metadata: { agentId: agentData.id }
    };
    events.push(event);
    
    res.status(201).json(createApiResponse(true, agentData));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiResponse(
        false, 
        undefined,
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      ));
    }
    
    res.status(500).json(createApiResponse(false, undefined, 'Internal server error'));
  }
});

// Update an agent
router.patch('/agents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const agent = agents[id];
  
  if (!agent) {
    return res.status(404).json(createApiResponse(false, undefined, `Agent with ID ${id} not found`));
  }
  
  try {
    const updatedAgent = {
      ...agent,
      ...req.body,
      id // Ensure ID doesn't change
    };
    
    const validatedAgent = MCPAgentSchema.parse(updatedAgent);
    agents[id] = validatedAgent;
    
    // Log agent update event
    const event: MCPEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'agent-message',
      severity: 'info',
      source: 'mcp-api',
      message: `Agent ${validatedAgent.name} (${validatedAgent.id}) updated`,
      metadata: { 
        agentId: validatedAgent.id,
        changes: req.body 
      }
    };
    events.push(event);
    
    res.json(createApiResponse(true, validatedAgent));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiResponse(
        false, 
        undefined,
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      ));
    }
    
    res.status(500).json(createApiResponse(false, undefined, 'Internal server error'));
  }
});

// Delete an agent
router.delete('/agents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!agents[id]) {
    return res.status(404).json(createApiResponse(false, undefined, `Agent with ID ${id} not found`));
  }
  
  const deletedAgent = agents[id];
  delete agents[id];
  
  // Log agent deletion event
  const event: MCPEvent = {
    id: uuidv4(),
    timestamp: Date.now(),
    type: 'agent-message',
    severity: 'info',
    source: 'mcp-api',
    message: `Agent ${deletedAgent.name} (${deletedAgent.id}) deleted`,
    metadata: { agentId: deletedAgent.id }
  };
  events.push(event);
  
  res.json(createApiResponse(true, { id }));
});

/**
 * Workflow Definition API Routes
 */

// Get all workflow definitions
router.get('/workflows', (_req: Request, res: Response) => {
  const workflowList = Object.values(workflowDefinitions);
  res.json(createApiResponse(true, workflowList));
});

// Get a specific workflow definition
router.get('/workflows/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const workflow = workflowDefinitions[id];
  
  if (!workflow) {
    return res.status(404).json(createApiResponse(false, undefined, `Workflow definition with ID ${id} not found`));
  }
  
  res.json(createApiResponse(true, workflow));
});

// Create a new workflow definition
router.post('/workflows', (req: Request, res: Response) => {
  try {
    const workflowData = MCPWorkflowDefinitionSchema.parse({
      ...req.body,
      id: req.body.id || uuidv4(),
      createdAt: req.body.createdAt || Date.now(),
      updatedAt: req.body.updatedAt || Date.now()
    });
    
    workflowDefinitions[workflowData.id] = workflowData;
    
    // Log workflow creation event
    const event: MCPEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'workflow-transition',
      severity: 'info',
      source: 'mcp-api',
      message: `Workflow definition ${workflowData.name} (${workflowData.id}) created`,
      metadata: { workflowId: workflowData.id }
    };
    events.push(event);
    
    res.status(201).json(createApiResponse(true, workflowData));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiResponse(
        false, 
        undefined,
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      ));
    }
    
    res.status(500).json(createApiResponse(false, undefined, 'Internal server error'));
  }
});

// Update a workflow definition
router.patch('/workflows/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const workflow = workflowDefinitions[id];
  
  if (!workflow) {
    return res.status(404).json(createApiResponse(false, undefined, `Workflow definition with ID ${id} not found`));
  }
  
  try {
    const updatedWorkflow = {
      ...workflow,
      ...req.body,
      id, // Ensure ID doesn't change
      updatedAt: Date.now() // Update the updatedAt timestamp
    };
    
    const validatedWorkflow = MCPWorkflowDefinitionSchema.parse(updatedWorkflow);
    workflowDefinitions[id] = validatedWorkflow;
    
    // Log workflow update event
    const event: MCPEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'workflow-transition',
      severity: 'info',
      source: 'mcp-api',
      message: `Workflow definition ${validatedWorkflow.name} (${validatedWorkflow.id}) updated`,
      metadata: { 
        workflowId: validatedWorkflow.id,
        changes: req.body 
      }
    };
    events.push(event);
    
    res.json(createApiResponse(true, validatedWorkflow));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiResponse(
        false, 
        undefined,
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      ));
    }
    
    res.status(500).json(createApiResponse(false, undefined, 'Internal server error'));
  }
});

// Delete a workflow definition
router.delete('/workflows/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!workflowDefinitions[id]) {
    return res.status(404).json(createApiResponse(false, undefined, `Workflow definition with ID ${id} not found`));
  }
  
  const deletedWorkflow = workflowDefinitions[id];
  delete workflowDefinitions[id];
  
  // Log workflow deletion event
  const event: MCPEvent = {
    id: uuidv4(),
    timestamp: Date.now(),
    type: 'workflow-transition',
    severity: 'info',
    source: 'mcp-api',
    message: `Workflow definition ${deletedWorkflow.name} (${deletedWorkflow.id}) deleted`,
    metadata: { workflowId: deletedWorkflow.id }
  };
  events.push(event);
  
  res.json(createApiResponse(true, { id }));
});

/**
 * Workflow Instance API Routes
 */

// Get all workflow instances
router.get('/workflow-instances', (_req: Request, res: Response) => {
  const instanceList = Object.values(workflowInstances);
  res.json(createApiResponse(true, instanceList));
});

// Get a specific workflow instance
router.get('/workflow-instances/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const instance = workflowInstances[id];
  
  if (!instance) {
    return res.status(404).json(createApiResponse(false, undefined, `Workflow instance with ID ${id} not found`));
  }
  
  res.json(createApiResponse(true, instance));
});

// Create a new workflow instance (start a workflow)
router.post('/workflow-instances', (req: Request, res: Response) => {
  try {
    const { definitionId } = req.body;
    
    if (!definitionId || !workflowDefinitions[definitionId]) {
      return res.status(400).json(createApiResponse(
        false, 
        undefined,
        `Workflow definition with ID ${definitionId} not found`
      ));
    }
    
    const workflowDef = workflowDefinitions[definitionId];
    const firstStep = workflowDef.steps.length > 0 ? workflowDef.steps[0].id : null;
    
    const instanceData: MCPWorkflowInstance = {
      id: uuidv4(),
      definitionId,
      name: req.body.name || `${workflowDef.name} #${Date.now()}`,
      status: 'running',
      progress: 0,
      startTime: Date.now(),
      endTime: null,
      currentStep: firstStep,
      executionHistory: []
    };
    
    const validatedInstance = MCPWorkflowInstanceSchema.parse(instanceData);
    workflowInstances[validatedInstance.id] = validatedInstance;
    
    // Log workflow instance creation event
    const event: MCPEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'workflow-transition',
      severity: 'info',
      source: 'mcp-api',
      message: `Workflow instance ${validatedInstance.name} (${validatedInstance.id}) created and started`,
      metadata: { 
        workflowInstanceId: validatedInstance.id,
        definitionId 
      }
    };
    events.push(event);
    
    res.status(201).json(createApiResponse(true, validatedInstance));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiResponse(
        false, 
        undefined,
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      ));
    }
    
    res.status(500).json(createApiResponse(false, undefined, 'Internal server error'));
  }
});

// Update a workflow instance state
router.patch('/workflow-instances/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const instance = workflowInstances[id];
  
  if (!instance) {
    return res.status(404).json(createApiResponse(false, undefined, `Workflow instance with ID ${id} not found`));
  }
  
  try {
    const updatedInstance = {
      ...instance,
      ...req.body,
      id // Ensure ID doesn't change
    };
    
    const validatedInstance = MCPWorkflowInstanceSchema.parse(updatedInstance);
    workflowInstances[id] = validatedInstance;
    
    // Log workflow instance update event
    const event: MCPEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'workflow-transition',
      severity: 'info',
      source: 'mcp-api',
      message: `Workflow instance ${validatedInstance.name} (${validatedInstance.id}) updated`,
      metadata: { 
        workflowInstanceId: validatedInstance.id,
        changes: req.body 
      }
    };
    events.push(event);
    
    res.json(createApiResponse(true, validatedInstance));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiResponse(
        false, 
        undefined,
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      ));
    }
    
    res.status(500).json(createApiResponse(false, undefined, 'Internal server error'));
  }
});

// Pause a workflow instance
router.post('/workflow-instances/:id/pause', (req: Request, res: Response) => {
  const { id } = req.params;
  const instance = workflowInstances[id];
  
  if (!instance) {
    return res.status(404).json(createApiResponse(false, undefined, `Workflow instance with ID ${id} not found`));
  }
  
  if (instance.status !== 'running') {
    return res.status(400).json(createApiResponse(
      false, 
      undefined,
      `Workflow instance with ID ${id} is not in a running state and cannot be paused.`
    ));
  }
  
  const updatedInstance = {
    ...instance,
    status: 'paused' as const
  };
  
  workflowInstances[id] = updatedInstance;
  
  // Log workflow pause event
  const event: MCPEvent = {
    id: uuidv4(),
    timestamp: Date.now(),
    type: 'workflow-transition',
    severity: 'info',
    source: 'mcp-api',
    message: `Workflow instance ${updatedInstance.name} (${updatedInstance.id}) paused`,
    metadata: { workflowInstanceId: updatedInstance.id }
  };
  events.push(event);
  
  res.json(createApiResponse(true, updatedInstance));
});

// Resume a workflow instance
router.post('/workflow-instances/:id/resume', (req: Request, res: Response) => {
  const { id } = req.params;
  const instance = workflowInstances[id];
  
  if (!instance) {
    return res.status(404).json(createApiResponse(false, undefined, `Workflow instance with ID ${id} not found`));
  }
  
  if (instance.status !== 'paused') {
    return res.status(400).json(createApiResponse(
      false, 
      undefined,
      `Workflow instance with ID ${id} is not in a paused state and cannot be resumed.`
    ));
  }
  
  const updatedInstance = {
    ...instance,
    status: 'running' as const
  };
  
  workflowInstances[id] = updatedInstance;
  
  // Log workflow resume event
  const event: MCPEvent = {
    id: uuidv4(),
    timestamp: Date.now(),
    type: 'workflow-transition',
    severity: 'info',
    source: 'mcp-api',
    message: `Workflow instance ${updatedInstance.name} (${updatedInstance.id}) resumed`,
    metadata: { workflowInstanceId: updatedInstance.id }
  };
  events.push(event);
  
  res.json(createApiResponse(true, updatedInstance));
});

// Cancel a workflow instance
router.post('/workflow-instances/:id/cancel', (req: Request, res: Response) => {
  const { id } = req.params;
  const instance = workflowInstances[id];
  
  if (!instance) {
    return res.status(404).json(createApiResponse(false, undefined, `Workflow instance with ID ${id} not found`));
  }
  
  if (instance.status === 'completed' || instance.status === 'failed') {
    return res.status(400).json(createApiResponse(
      false, 
      undefined,
      `Workflow instance with ID ${id} is already in a terminal state (${instance.status}).`
    ));
  }
  
  const updatedInstance = {
    ...instance,
    status: 'failed' as const,
    endTime: Date.now()
  };
  
  workflowInstances[id] = updatedInstance;
  
  // Log workflow cancellation event
  const event: MCPEvent = {
    id: uuidv4(),
    timestamp: Date.now(),
    type: 'workflow-transition',
    severity: 'info',
    source: 'mcp-api',
    message: `Workflow instance ${updatedInstance.name} (${updatedInstance.id}) cancelled`,
    metadata: { workflowInstanceId: updatedInstance.id }
  };
  events.push(event);
  
  res.json(createApiResponse(true, updatedInstance));
});

/**
 * Event API Routes
 */

// Get all events
router.get('/events', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || events.length;
  const filteredEvents = events
    .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp descending (newest first)
    .slice(0, limit);
    
  res.json(createApiResponse(true, filteredEvents));
});

// Get events filtered by type
router.get('/events/type/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const limit = parseInt(req.query.limit as string) || events.length;
  
  const filteredEvents = events
    .filter(event => event.type === type)
    .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp descending (newest first)
    .slice(0, limit);
    
  res.json(createApiResponse(true, filteredEvents));
});

// Add a new event
router.post('/events', (req: Request, res: Response) => {
  try {
    const eventData = MCPEventSchema.parse({
      ...req.body,
      id: req.body.id || uuidv4(),
      timestamp: req.body.timestamp || Date.now()
    });
    
    events.push(eventData);
    
    res.status(201).json(createApiResponse(true, eventData));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiResponse(
        false, 
        undefined,
        `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      ));
    }
    
    res.status(500).json(createApiResponse(false, undefined, 'Internal server error'));
  }
});

/**
 * Register MCP routes with the Express app.
 */
export function registerMCPRoutes(app: import('express').Express) {
  // Mount the router under the /api/mcp prefix
  app.use('/api/mcp', router);
  
  return router;
}

export default router;