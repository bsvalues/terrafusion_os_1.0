/**
 * MCP API Routes
 * 
 * This module defines API routes for interacting with the MCP and Agent Army.
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from './errorHandler';
import { 
  getMcp, 
  processAgentRequest, 
  getAgentMetrics, 
  getExperiences,
  broadcastAgentCommand
} from './mcpController';
import { AgentType } from '../shared/agentProtocol';

export const mcpRouter = Router();

/**
 * Get the current status of the MCP and all agents
 */
mcpRouter.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const metrics = getAgentMetrics();
  
  res.json({
    status: 'operational',
    agentMetrics: metrics,
    timestamp: new Date().toISOString()
  });
}));

/**
 * Process a request through a specific agent type
 */
mcpRouter.post('/process/:agentType', 
  asyncHandler(async (req: Request, res: Response) => {
    const { agentType } = req.params;
    const request = req.body;
    
    // Validate agent type
    if (!Object.values(AgentType).includes(agentType as AgentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`
      });
    }
    
    try {
      const result = await processAgentRequest(agentType as AgentType, request);
      
      res.json({
        success: true,
        result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  })
);

/**
 * Send a command to agents of a specific type
 */
mcpRouter.post('/command/:agentType', 
  asyncHandler(async (req: Request, res: Response) => {
    const { agentType } = req.params;
    const { commandName, parameters } = req.body;
    
    // Validate agent type
    if (!Object.values(AgentType).includes(agentType as AgentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`
      });
    }
    
    // Validate command
    if (!commandName) {
      return res.status(400).json({
        success: false,
        error: 'Command name is required'
      });
    }
    
    try {
      broadcastAgentCommand(agentType as AgentType, commandName, parameters);
      
      res.json({
        success: true,
        message: `Command ${commandName} sent to all ${agentType} agents`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  })
);

/**
 * Trigger training for all agents
 */
mcpRouter.post('/train', 
  asyncHandler(async (req: Request, res: Response) => {
    const mcp = getMcp();
    
    try {
      mcp.triggerAgentTraining();
      
      res.json({
        success: true,
        message: 'Training triggered for all agents'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  })
);

/**
 * Get experiences from the replay buffer
 */
mcpRouter.get('/experiences', 
  asyncHandler(async (req: Request, res: Response) => {
    const count = req.query.count ? parseInt(req.query.count as string) : 10;
    
    try {
      const experiences = getExperiences(count);
      
      res.json({
        success: true,
        experiences
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  })
);

/**
 * Get metrics for a specific agent
 */
mcpRouter.get('/agents/:agentId/metrics', 
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId } = req.params;
    const metrics = getAgentMetrics();
    
    if (!metrics[agentId]) {
      return res.status(404).json({
        success: false,
        error: `Agent ${agentId} not found`
      });
    }
    
    res.json({
      success: true,
      metrics: metrics[agentId]
    });
  })
);

/**
 * Get agents by type
 */
mcpRouter.get('/agents/type/:agentType', 
  asyncHandler(async (req: Request, res: Response) => {
    const { agentType } = req.params;
    const metrics = getAgentMetrics();
    
    // Filter metrics by agent type
    const filteredMetrics = Object.entries(metrics)
      .filter(([id, data]) => data.agentType === agentType)
      .reduce((acc, [id, data]) => {
        acc[id] = data;
        return acc;
      }, {} as Record<string, any>);
    
    res.json({
      success: true,
      agents: filteredMetrics
    });
  })
);