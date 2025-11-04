/**
 * Agent API Router
 * 
 * Provides REST API endpoints for managing agents and workflows.
 */

import express from 'express';
import { z } from 'zod';
import * as WebSocket from 'ws';

import { AgentRegistryService } from '../services/agentRegistryService';
import { AgentCommunicationService } from '../services/agentCommunicationService';
import { log } from '../vite';

import {
  AgentRegistrationSchema,
  AgentCapability,
  AgentStatus,
  TaskRequestSchema,
  WorkflowDefinitionSchema
} from '@shared/mcp/agents/schemas';

// Create router
const router = express.Router();

// Initialize services
const agentRegistry = new AgentRegistryService();
const agentCommunication = new AgentCommunicationService();

// Create WebSocket server handler
export const handleAgentWebSocket = (ws: WebSocket.WebSocket, agentId: string) => {
  agentCommunication.registerWebSocketClient(agentId, ws);
};

/**
 * Agent Management Routes
 */

// Register a new agent
router.post('/agents', async (req, res) => {
  try {
    const agentData = AgentRegistrationSchema.parse(req.body);
    const agent = await agentRegistry.registerAgent(agentData);
    
    log(`Agent registered via API: ${agent.name} (${agent.id})`, 'agent-api');
    res.status(201).json(agent);
  } catch (error: any) {
    log(`Error registering agent: ${error.message}`, 'agent-api');
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid agent data', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to register agent', 
      message: error.message 
    });
  }
});

// Get an agent by ID
router.get('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await agentRegistry.getAgent(agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(agent);
  } catch (error: any) {
    log(`Error retrieving agent: ${error.message}`, 'agent-api');
    res.status(500).json({ error: 'Failed to retrieve agent', message: error.message });
  }
});

// List agents with optional filtering
router.get('/agents', async (req, res) => {
  try {
    const query = {
      capabilities: req.query.capabilities ? 
        (req.query.capabilities as string).split(',') as AgentCapability[] : undefined,
      status: req.query.status as AgentStatus | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };
    
    const agents = await agentRegistry.listAgents(query);
    res.json(agents);
  } catch (error: any) {
    log(`Error listing agents: ${error.message}`, 'agent-api');
    res.status(500).json({ error: 'Failed to list agents', message: error.message });
  }
});

// Update agent status
router.patch('/agents/:agentId/status', async (req, res) => {
  try {
    const { agentId } = req.params;
    const StatusUpdateSchema = z.object({
      status: z.nativeEnum(AgentStatus),
      load: z.number().min(0).max(1).optional()
    });
    
    const { status, load } = StatusUpdateSchema.parse(req.body);
    const agent = await agentRegistry.updateAgentStatus(agentId, status, load);
    
    log(`Agent ${agent.name} (${agentId}) status updated to ${status}`, 'agent-api');
    res.json(agent);
  } catch (error: any) {
    log(`Error updating agent status: ${error.message}`, 'agent-api');
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid status data', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update agent status', 
      message: error.message 
    });
  }
});

// Report agent metrics
router.post('/agents/:agentId/metrics', async (req, res) => {
  try {
    const { agentId } = req.params;
    const MetricsSchema = z.object({
      successRate: z.number().min(0).max(1).optional(),
      averageResponseTime: z.number().min(0).optional(),
      requestsProcessed: z.number().min(0).optional()
    });
    
    const metrics = MetricsSchema.parse(req.body);
    const agent = await agentRegistry.reportAgentMetrics(agentId, metrics);
    
    log(`Agent ${agent.name} (${agentId}) metrics updated`, 'agent-api');
    res.json(agent);
  } catch (error: any) {
    log(`Error updating agent metrics: ${error.message}`, 'agent-api');
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid metrics data', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update agent metrics', 
      message: error.message 
    });
  }
});

// Deregister an agent
router.delete('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const result = await agentRegistry.deregisterAgent(agentId);
    
    if (!result) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    log(`Agent ${agentId} deregistered via API`, 'agent-api');
    res.status(204).send();
  } catch (error: any) {
    log(`Error deregistering agent: ${error.message}`, 'agent-api');
    res.status(500).json({ error: 'Failed to deregister agent', message: error.message });
  }
});

/**
 * Agent Communication Routes
 */

// Send a task request to an agent
router.post('/messages/task-request', async (req, res) => {
  try {
    const taskRequest = TaskRequestSchema.parse(req.body);
    await agentCommunication.sendTaskRequest(taskRequest);
    
    log(`Task request sent to agent(s): ${taskRequest.recipients?.join(', ') || 'broadcast'}`, 'agent-api');
    res.status(201).json({ success: true, messageId: taskRequest.id });
  } catch (error: any) {
    log(`Error sending task request: ${error.message}`, 'agent-api');
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid task request data', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to send task request', 
      message: error.message 
    });
  }
});

// Get message history
router.get('/messages', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const correlationId = req.query.correlationId as string | undefined;
    
    let messages;
    if (correlationId) {
      messages = await agentCommunication.getMessagesByCorrelationId(correlationId);
    } else {
      messages = await agentCommunication.getMessageHistory(limit, offset);
    }
    
    res.json(messages);
  } catch (error: any) {
    log(`Error retrieving messages: ${error.message}`, 'agent-api');
    res.status(500).json({ error: 'Failed to retrieve messages', message: error.message });
  }
});

// Get a specific message by ID
router.get('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await agentCommunication.getMessageById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(message);
  } catch (error: any) {
    log(`Error retrieving message: ${error.message}`, 'agent-api');
    res.status(500).json({ error: 'Failed to retrieve message', message: error.message });
  }
});

/**
 * Workflow Management Routes
 */

// Register a workflow definition
router.post('/workflows', async (req, res) => {
  try {
    const workflowData = WorkflowDefinitionSchema.parse(req.body);
    const workflow = await agentRegistry.registerWorkflow(workflowData);
    
    log(`Workflow registered: ${workflow.name} (${workflow.id})`, 'agent-api');
    res.status(201).json(workflow);
  } catch (error: any) {
    log(`Error registering workflow: ${error.message}`, 'agent-api');
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid workflow data', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to register workflow', 
      message: error.message 
    });
  }
});

// Get a workflow by ID
router.get('/workflows/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const workflow = await agentRegistry.getWorkflow(workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.json(workflow);
  } catch (error: any) {
    log(`Error retrieving workflow: ${error.message}`, 'agent-api');
    res.status(500).json({ error: 'Failed to retrieve workflow', message: error.message });
  }
});

// List all workflows
router.get('/workflows', async (req, res) => {
  try {
    const workflows = await agentRegistry.listWorkflows();
    res.json(workflows);
  } catch (error: any) {
    log(`Error listing workflows: ${error.message}`, 'agent-api');
    res.status(500).json({ error: 'Failed to list workflows', message: error.message });
  }
});

// Start a workflow instance
router.post('/workflows/:workflowId/instances', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const InputSchema = z.object({
      input: z.record(z.string(), z.any())
    });
    
    const { input } = InputSchema.parse(req.body);
    const instance = await agentRegistry.startWorkflow(workflowId, input);
    
    log(`Workflow instance started: ${instance.id} for workflow ${workflowId}`, 'agent-api');
    res.status(201).json(instance);
  } catch (error: any) {
    log(`Error starting workflow: ${error.message}`, 'agent-api');
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid input data', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to start workflow', 
      message: error.message 
    });
  }
});

// Get a workflow instance by ID
router.get('/workflow-instances/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const instance = await agentRegistry.getWorkflowInstance(instanceId);
    
    if (!instance) {
      return res.status(404).json({ error: 'Workflow instance not found' });
    }
    
    res.json(instance);
  } catch (error: any) {
    log(`Error retrieving workflow instance: ${error.message}`, 'agent-api');
    res.status(500).json({ error: 'Failed to retrieve workflow instance', message: error.message });
  }
});

// List workflow instances
router.get('/workflow-instances', async (req, res) => {
  try {
    const workflowId = req.query.workflowId as string | undefined;
    const instances = await agentRegistry.listWorkflowInstances(workflowId);
    res.json(instances);
  } catch (error: any) {
    log(`Error listing workflow instances: ${error.message}`, 'agent-api');
    res.status(500).json({ error: 'Failed to list workflow instances', message: error.message });
  }
});

export default router;