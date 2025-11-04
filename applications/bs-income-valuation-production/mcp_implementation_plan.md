# MCP (Master Control Program) and Agent Army Implementation Plan

## Overview
This document outlines the implementation plan for enhancing our Benton County Assessor's Office platform with a Master Control Program (MCP) and coordinated agent army architecture. This approach will create a self-improving system where specialized agents collaborate through a central coordination mechanism.

## Current Architecture Assessment

Our platform currently has three primary AI agents:
- **ValuationAgent**: Analyzes income data and detects anomalies in valuations
- **DataCleanerAgent**: Performs data quality analysis and validation
- **ReportingAgent**: Generates insights and reports from valuations

These agents currently operate independently with no centralized coordination or shared learning mechanism. The new architecture will transform these into a coordinated agent army supervised by an MCP.

## Implementation Steps

### 1. Core Infrastructure Development

#### 1.1 Create the Shared Message Protocol

```typescript
// shared/agentProtocol.ts

export enum EventType {
  ACTION = 'action',
  ERROR = 'error',
  RESULT = 'result',
  STATUS_UPDATE = 'status_update',
  REQUEST_HELP = 'request_help'
}

export enum AgentType {
  MCP = 'mcp',
  VALUATION = 'valuation',
  DATA_CLEANER = 'data_cleaner',
  REPORTING = 'reporting',
  DATA_INTEGRATION = 'data_integration',
  NLP = 'nlp'
}

export interface AgentMessage {
  agentId: string;
  agentType: AgentType;
  timestamp: string;
  eventType: EventType;
  payload: any;
  metadata?: {
    performanceMetrics?: Record<string, number>;
    confidenceScore?: number;
    processingTimeMs?: number;
  };
}

export interface RequestHelpPayload {
  problemDescription: string;
  taskId: string;
  failedAttempts: number;
  lastError?: string;
  contextData?: any;
}

export interface AgentActionPayload {
  action: string;
  parameters: Record<string, any>;
  reason: string;
  expectedOutcome: string;
}

export interface AgentResultPayload {
  success: boolean;
  data: any;
  processingTimeMs: number;
  notes?: string[];
}
```

#### 1.2 Implement the Experience Replay Buffer

```typescript
// agents/ReplayBuffer.ts

import { AgentMessage } from '../shared/agentProtocol';

export interface Experience {
  message: AgentMessage;
  priority: number;
  timestamp: Date;
}

export class ReplayBuffer {
  private buffer: Experience[] = [];
  private maxSize: number;
  private priorityThreshold: number;
  
  constructor(maxSize: number = 1000, priorityThreshold: number = 0.7) {
    this.maxSize = maxSize;
    this.priorityThreshold = priorityThreshold;
  }
  
  public add(message: AgentMessage, priority: number = 0.5): void {
    const experience: Experience = {
      message,
      priority,
      timestamp: new Date()
    };
    
    this.buffer.push(experience);
    
    // Keep buffer size within limits
    if (this.buffer.length > this.maxSize) {
      // Remove lowest priority experience
      this.buffer.sort((a, b) => a.priority - b.priority);
      this.buffer.shift();
    }
    
    // Sort by priority (descending)
    this.buffer.sort((a, b) => b.priority - a.priority);
  }
  
  public getHighPriorityExperiences(): Experience[] {
    return this.buffer.filter(exp => exp.priority >= this.priorityThreshold);
  }
  
  public sample(count: number = 10): Experience[] {
    if (this.buffer.length <= count) {
      return [...this.buffer];
    }
    
    // Prioritized sampling
    const sampledIndices = new Set<number>();
    const result: Experience[] = [];
    
    // First add some high priority samples
    const highPriorityCount = Math.floor(count * 0.7);
    for (let i = 0; i < highPriorityCount && i < this.buffer.length; i++) {
      result.push(this.buffer[i]);
      sampledIndices.add(i);
    }
    
    // Then add some random samples
    while (result.length < count && sampledIndices.size < this.buffer.length) {
      const idx = Math.floor(Math.random() * this.buffer.length);
      if (!sampledIndices.has(idx)) {
        result.push(this.buffer[idx]);
        sampledIndices.add(idx);
      }
    }
    
    return result;
  }
  
  public size(): number {
    return this.buffer.length;
  }
  
  public clear(): void {
    this.buffer = [];
  }
}
```

#### 1.3 Develop the Master Control Program (MCP)

```typescript
// agents/MasterControlProgram.ts

import { AgentMessage, EventType, AgentType, RequestHelpPayload } from '../shared/agentProtocol';
import { ReplayBuffer } from './ReplayBuffer';
import { ValuationAgent } from './ValuationAgent';
import { DataCleanerAgent } from './DataCleanerAgent';
import { ReportingAgent } from './ReportingAgent';

export interface AgentPerformanceMetrics {
  successRate: number;
  averageProcessingTime: number;
  errorCount: number;
  lastUpdated: Date;
}

export interface AgentConfig {
  enabled: boolean;
  performanceThreshold: number;
  maxRetries: number;
  timeoutMs: number;
}

export class MasterControlProgram {
  private agents: Map<string, any> = new Map();
  private agentMetrics: Map<string, AgentPerformanceMetrics> = new Map();
  private replayBuffer: ReplayBuffer;
  private agentConfigs: Map<AgentType, AgentConfig> = new Map();
  
  constructor() {
    this.replayBuffer = new ReplayBuffer();
    this.initializeAgents();
    this.initializeConfigs();
  }
  
  private initializeAgents(): void {
    // Create and register our agent army
    const valuationAgent = new ValuationAgent();
    const dataCleanerAgent = new DataCleanerAgent();
    const reportingAgent = new ReportingAgent();
    
    this.registerAgent('valuation-agent-1', AgentType.VALUATION, valuationAgent);
    this.registerAgent('data-cleaner-agent-1', AgentType.DATA_CLEANER, dataCleanerAgent);
    this.registerAgent('reporting-agent-1', AgentType.REPORTING, reportingAgent);
    
    // Initialize agent metrics
    this.agents.forEach((agent, id) => {
      this.agentMetrics.set(id, {
        successRate: 1.0, // Start optimistic
        averageProcessingTime: 0,
        errorCount: 0,
        lastUpdated: new Date()
      });
    });
  }
  
  private initializeConfigs(): void {
    // Default configuration for all agent types
    const defaultConfig: AgentConfig = {
      enabled: true,
      performanceThreshold: 0.7,
      maxRetries: 3,
      timeoutMs: 30000
    };
    
    Object.values(AgentType).forEach(type => {
      this.agentConfigs.set(type as AgentType, { ...defaultConfig });
    });
  }
  
  public registerAgent(agentId: string, agentType: AgentType, agentInstance: any): void {
    this.agents.set(agentId, agentInstance);
    
    // Initialize metrics for this agent
    this.agentMetrics.set(agentId, {
      successRate: 1.0,
      averageProcessingTime: 0,
      errorCount: 0,
      lastUpdated: new Date()
    });
  }
  
  public handleAgentMessage(message: AgentMessage): void {
    // Log all messages to the replay buffer
    this.replayBuffer.add(message);
    
    // Process message based on event type
    switch (message.eventType) {
      case EventType.ERROR:
        this.handleErrorMessage(message);
        break;
      case EventType.REQUEST_HELP:
        this.handleHelpRequest(message);
        break;
      case EventType.RESULT:
        this.updateAgentMetrics(message);
        break;
      default:
        // Just store in replay buffer
        break;
    }
    
    // Check if we should trigger training
    this.checkAndTriggerTraining();
  }
  
  private handleErrorMessage(message: AgentMessage): void {
    const { agentId } = message;
    
    // Update error metrics
    const metrics = this.agentMetrics.get(agentId);
    if (metrics) {
      metrics.errorCount++;
      metrics.successRate = Math.max(0, metrics.successRate - 0.1);
      metrics.lastUpdated = new Date();
      this.agentMetrics.set(agentId, metrics);
    }
    
    // Log high-priority error for review
    this.replayBuffer.add(message, 0.9);
    
    console.error(`Agent ${agentId} reported error:`, message.payload);
  }
  
  private handleHelpRequest(message: AgentMessage): void {
    const payload = message.payload as RequestHelpPayload;
    
    console.log(`Help requested by ${message.agentId}:`, payload.problemDescription);
    
    // Determine which agent can best handle this request
    const helperAgentId = this.findBestHelperAgent(message);
    
    if (helperAgentId) {
      // Delegate the task to the helper agent
      const helperAgent = this.agents.get(helperAgentId);
      if (helperAgent && typeof helperAgent.handleHelpRequest === 'function') {
        helperAgent.handleHelpRequest(payload, message.agentId);
      }
    } else {
      console.warn(`No suitable agent found to help with request from ${message.agentId}`);
    }
  }
  
  private findBestHelperAgent(message: AgentMessage): string | null {
    // This would contain logic to match the problem to the best agent
    // For now, using simple mapping based on problem domain
    
    const payload = message.payload as RequestHelpPayload;
    
    // Simple keyword matching to find appropriate helper
    if (payload.problemDescription.includes('valuation') || 
        payload.problemDescription.includes('income')) {
      return 'valuation-agent-1';
    } else if (payload.problemDescription.includes('data quality') || 
               payload.problemDescription.includes('validation')) {
      return 'data-cleaner-agent-1';
    } else if (payload.problemDescription.includes('report') || 
               payload.problemDescription.includes('insight')) {
      return 'reporting-agent-1';
    }
    
    // No appropriate agent found
    return null;
  }
  
  private updateAgentMetrics(message: AgentMessage): void {
    const { agentId, metadata } = message;
    
    if (!metadata || !metadata.processingTimeMs) {
      return;
    }
    
    const metrics = this.agentMetrics.get(agentId);
    if (metrics) {
      // Update processing time with running average
      metrics.averageProcessingTime = metrics.averageProcessingTime === 0 
        ? metadata.processingTimeMs 
        : (metrics.averageProcessingTime * 0.7) + (metadata.processingTimeMs * 0.3);
      
      // Update success rate if the result was successful
      if (message.payload.success) {
        metrics.successRate = Math.min(1.0, metrics.successRate + 0.02);
      }
      
      metrics.lastUpdated = new Date();
      this.agentMetrics.set(agentId, metrics);
    }
  }
  
  private checkAndTriggerTraining(): void {
    // Check if we have enough experiences to trigger training
    if (this.replayBuffer.size() >= 100) {
      this.trainAgents();
    }
  }
  
  private trainAgents(): void {
    console.log('Triggering agent training...');
    
    // Get training sample from replay buffer
    const experiences = this.replayBuffer.sample(50);
    
    // Group experiences by agent type
    const experiencesByAgent: Map<AgentType, any[]> = new Map();
    
    experiences.forEach(exp => {
      const agentType = exp.message.agentType;
      if (!experiencesByAgent.has(agentType)) {
        experiencesByAgent.set(agentType, []);
      }
      experiencesByAgent.get(agentType)?.push(exp);
    });
    
    // Train each agent type with relevant experiences
    experiencesByAgent.forEach((agentExperiences, agentType) => {
      this.agents.forEach((agent, agentId) => {
        if (agent.agentType === agentType && typeof agent.learn === 'function') {
          agent.learn(agentExperiences);
        }
      });
    });
    
    console.log('Agent training completed');
  }
  
  public getAgentMetrics(): Record<string, AgentPerformanceMetrics> {
    const metrics: Record<string, AgentPerformanceMetrics> = {};
    this.agentMetrics.forEach((value, key) => {
      metrics[key] = value;
    });
    return metrics;
  }
}
```

### 2. Agent Interface Modifications

To make our existing agents compatible with the MCP system, we need to modify them to implement a consistent interface for communication and learning.

#### 2.1 Create Base Agent Interface

```typescript
// agents/BaseAgent.ts

import { AgentMessage, AgentType, EventType } from '../shared/agentProtocol';
import { Experience } from './ReplayBuffer';

export interface IAgent {
  // Core functionality
  processRequest(request: any): Promise<any>;
  
  // MCP integration
  sendMessage(message: AgentMessage): void;
  handleHelpRequest(helpRequest: any, requestingAgentId: string): Promise<void>;
  learn(experiences: Experience[]): Promise<void>;
  
  // Metadata
  getAgentType(): AgentType;
  getAgentId(): string;
  getCapabilities(): string[];
}

export abstract class BaseAgent implements IAgent {
  protected agentId: string;
  protected agentType: AgentType;
  protected mcpCallback?: (message: AgentMessage) => void;
  
  constructor(agentId: string, agentType: AgentType) {
    this.agentId = agentId;
    this.agentType = agentType;
  }
  
  public abstract processRequest(request: any): Promise<any>;
  
  public setMcpCallback(callback: (message: AgentMessage) => void): void {
    this.mcpCallback = callback;
  }
  
  public sendMessage(message: AgentMessage): void {
    if (this.mcpCallback) {
      this.mcpCallback(message);
    } else {
      console.warn(`Agent ${this.agentId} attempted to send message but no MCP callback is set`);
    }
  }
  
  public requestHelp(problemDescription: string, taskId: string, contextData?: any): void {
    const message: AgentMessage = {
      agentId: this.agentId,
      agentType: this.agentType,
      timestamp: new Date().toISOString(),
      eventType: EventType.REQUEST_HELP,
      payload: {
        problemDescription,
        taskId,
        failedAttempts: 1,
        contextData
      }
    };
    
    this.sendMessage(message);
  }
  
  public async handleHelpRequest(helpRequest: any, requestingAgentId: string): Promise<void> {
    // Default implementation - override in specific agents
    console.warn(`Agent ${this.agentId} cannot handle help request from ${requestingAgentId}`);
  }
  
  public async learn(experiences: Experience[]): Promise<void> {
    // Default implementation - override in specific agents
    console.log(`Agent ${this.agentId} received ${experiences.length} experiences for learning`);
  }
  
  public getAgentType(): AgentType {
    return this.agentType;
  }
  
  public getAgentId(): string {
    return this.agentId;
  }
  
  public getCapabilities(): string[] {
    return [];
  }
  
  protected reportResult(result: any, processingTimeMs: number, notes?: string[]): void {
    const message: AgentMessage = {
      agentId: this.agentId,
      agentType: this.agentType,
      timestamp: new Date().toISOString(),
      eventType: EventType.RESULT,
      payload: {
        success: true,
        data: result,
        processingTimeMs,
        notes
      },
      metadata: {
        processingTimeMs
      }
    };
    
    this.sendMessage(message);
  }
  
  protected reportError(error: Error, taskId?: string): void {
    const message: AgentMessage = {
      agentId: this.agentId,
      agentType: this.agentType,
      timestamp: new Date().toISOString(),
      eventType: EventType.ERROR,
      payload: {
        message: error.message,
        stack: error.stack,
        taskId
      }
    };
    
    this.sendMessage(message);
  }
}
```

#### 2.2 Modify Existing Agents to Implement the Base Interface

Below is an example of how we would modify the ValuationAgent to integrate with our MCP system:

```typescript
// agents/ValuationAgent.ts (modified version)

import { Income, Valuation } from '../shared/schema';
import { AgentType } from '../shared/agentProtocol';
import { BaseAgent } from './BaseAgent';
import { Experience } from './ReplayBuffer';

// ... existing interfaces remain the same ...

export class ValuationAgent extends BaseAgent {
  private confidenceThreshold: number = 0.7;
  private learningRate: number = 0.1;
  
  constructor(agentId: string = 'valuation-agent-1') {
    super(agentId, AgentType.VALUATION);
  }
  
  public async processRequest(request: any): Promise<any> {
    const startTime = Date.now();
    let result: any;
    
    try {
      // Determine which method to call based on request type
      if (request.type === 'analyze-income') {
        result = await this.analyzeIncome(request.incomeData);
      } else if (request.type === 'detect-anomalies') {
        result = await this.detectAnomalies(request.valuationHistory);
      } else {
        throw new Error(`Unknown request type: ${request.type}`);
      }
      
      const processingTime = Date.now() - startTime;
      this.reportResult(result, processingTime);
      return result;
    } catch (error) {
      this.reportError(error as Error, request.id);
      
      // If confidence is low, request help
      if (error instanceof Error && error.message.includes('confidence')) {
        this.requestHelp(
          `Low confidence in valuation analysis: ${error.message}`,
          request.id,
          { incomeData: request.incomeData }
        );
      }
      
      throw error;
    }
  }
  
  // Existing method implementations remain the same...
  
  public async analyzeIncome(incomeData: Income[]): Promise<IncomeAnalysis> {
    // Existing implementation remains...
    
    // Add confidence check
    if (result.suggestedValuation.confidenceScore < this.confidenceThreshold) {
      console.warn(`Low confidence score: ${result.suggestedValuation.confidenceScore}`);
      
      // If extremely low confidence, request help
      if (result.suggestedValuation.confidenceScore < 0.4) {
        this.requestHelp(
          "Extremely low confidence in valuation result",
          "income-analysis-" + Date.now(),
          { incomeData, initialResult: result }
        );
      }
    }
    
    return result;
  }
  
  public async detectAnomalies(valuationHistory: Valuation[]): Promise<AnomalyDetection> {
    // Existing implementation remains...
    
    return result;
  }
  
  public override async handleHelpRequest(helpRequest: any, requestingAgentId: string): Promise<void> {
    console.log(`ValuationAgent handling help request from ${requestingAgentId}`);
    
    // We can only help with valuation-related tasks
    if (helpRequest.problemDescription.includes('data quality')) {
      console.log('Cannot help with data quality issues, this requires DataCleanerAgent');
      return;
    }
    
    // Check if we have the required context data
    if (!helpRequest.contextData || !helpRequest.contextData.incomeData) {
      console.log('Insufficient context data to provide help');
      return;
    }
    
    try {
      // Try to analyze the income with different parameters
      const incomeData = helpRequest.contextData.incomeData;
      
      // Temporarily lower our confidence threshold for this analysis
      const originalThreshold = this.confidenceThreshold;
      this.confidenceThreshold = 0.4;
      
      // Perform analysis
      const result = await this.analyzeIncome(incomeData);
      
      // Restore original threshold
      this.confidenceThreshold = originalThreshold;
      
      // Send back result as suggestion
      this.sendMessage({
        agentId: this.agentId,
        agentType: this.agentType,
        timestamp: new Date().toISOString(),
        eventType: EventType.RESULT,
        payload: {
          success: true,
          data: result,
          processingTimeMs: 0,
          notes: [`Assistance provided to ${requestingAgentId}`],
          requestingAgentId,
          helpRequestId: helpRequest.taskId
        }
      });
      
    } catch (error) {
      console.error('Error providing help:', error);
    }
  }
  
  public override async learn(experiences: Experience[]): Promise<void> {
    console.log(`ValuationAgent learning from ${experiences.length} experiences`);
    
    // Extract successful valuation results to learn from
    const valuationResults = experiences
      .filter(exp => 
        exp.message.eventType === EventType.RESULT && 
        exp.message.payload.success &&
        exp.message.agentType === AgentType.VALUATION
      )
      .map(exp => exp.message.payload.data);
    
    if (valuationResults.length === 0) {
      console.log('No relevant experiences to learn from');
      return;
    }
    
    // Update confidence threshold based on successful results
    const confidenceScores = valuationResults
      .filter(result => result.suggestedValuation && result.suggestedValuation.confidenceScore)
      .map(result => result.suggestedValuation.confidenceScore);
    
    if (confidenceScores.length > 0) {
      const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
      
      // Adjust confidence threshold (with limits)
      this.confidenceThreshold = Math.max(0.5, Math.min(0.9, 
        this.confidenceThreshold * (1 - this.learningRate) + avgConfidence * this.learningRate
      ));
      
      console.log(`Adjusted confidence threshold to ${this.confidenceThreshold}`);
    }
    
    // Learn from error experiences as well
    const errorExperiences = experiences.filter(exp => exp.message.eventType === EventType.ERROR);
    if (errorExperiences.length > 0) {
      console.log(`Analyzing ${errorExperiences.length} error experiences to improve robustness`);
      // Implementation would analyze common errors and adjust parameters
    }
  }
  
  public override getCapabilities(): string[] {
    return [
      'income_analysis',
      'valuation_calculation',
      'anomaly_detection',
      'multiplier_optimization'
    ];
  }
}
```

### 3. Controller Layer for Agent Coordination

We need a controller to facilitate the interaction between our API endpoints and the MCP system.

```typescript
// server/mcpController.ts

import { MasterControlProgram } from '../agents/MasterControlProgram';

// Singleton instance
const mcp = new MasterControlProgram();

export const getMcp = () => mcp;

export const processAgentRequest = async (agentType: string, request: any): Promise<any> => {
  // Find an appropriate agent of the requested type
  const agent = findAgentByType(agentType);
  
  if (!agent) {
    throw new Error(`No agent available for type: ${agentType}`);
  }
  
  // Process the request through the agent
  return await agent.processRequest(request);
};

export const getAgentMetrics = () => {
  return mcp.getAgentMetrics();
};

// Helper function to find an agent by type
const findAgentByType = (agentType: string) => {
  // This would look up an appropriate agent in the MCP
  // Implementation would depend on how agents are registered
  
  // For now, this is a placeholder
  return null;
};
```

### 4. Agent API Routes

```typescript
// server/mcpRoutes.ts

import { Router, Request, Response } from 'express';
import { asyncHandler } from './utils/asyncHandler';
import { getMcp, processAgentRequest, getAgentMetrics } from './mcpController';

export const mcpRouter = Router();

// Get agent system status
mcpRouter.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const metrics = getAgentMetrics();
  
  res.json({
    status: 'operational',
    agentMetrics: metrics,
    timestamp: new Date().toISOString()
  });
}));

// Process an agent request
mcpRouter.post('/process/:agentType', 
  asyncHandler(async (req: Request, res: Response) => {
    const { agentType } = req.params;
    const request = req.body;
    
    const result = await processAgentRequest(agentType, request);
    
    res.json({
      success: true,
      result
    });
  })
);

// View replay buffer experiences (admin only)
mcpRouter.get('/experiences', 
  asyncHandler(async (req: Request, res: Response) => {
    // This would be restricted to admin users in production
    const mcp = getMcp();
    
    // Implementation would depend on MCP exposing this functionality
    res.json({
      message: 'This would return experiences from the replay buffer',
      count: 0
    });
  })
);
```

## Implementation Timeline

### Phase 1: Infrastructure Development (2 weeks)
- Week 1: Implement message protocol and replay buffer
- Week 2: Develop MCP core functionality

### Phase 2: Agent Integration (2 weeks)
- Week 3: Modify existing agents to implement BaseAgent interface
- Week 4: Implement learning mechanisms for all agents

### Phase 3: Controller and API Development (1 week)
- Week 5: Develop controller layer and API routes for agent coordination

### Phase 4: Testing and Refinement (1 week)
- Week 6: Comprehensive testing and performance optimization

## Benefits of This Architecture

1. **Continuous Improvement**: Agents learn from experience and improve over time.
2. **Collaborative Problem Solving**: Agents can request help from each other when facing challenging tasks.
3. **Centralized Coordination**: The MCP provides oversight and ensures efficient resource allocation.
4. **Scalability**: New agent types can be easily added to the system without changing the core architecture.
5. **Robustness**: The system becomes more resilient through learning from errors and experiences.

## Next Steps

1. Begin implementing the core message protocol and agent interfaces
2. Develop and test the replay buffer system
3. Modify existing agents to implement the new interfaces
4. Create the MCP implementation
5. Connect the system through controller layer and API routes