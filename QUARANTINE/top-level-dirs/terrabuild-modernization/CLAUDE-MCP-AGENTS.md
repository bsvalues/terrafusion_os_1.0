# CLAUDE MCP Agent Development Guide

This file provides comprehensive guidance for developing Model Content Protocol (MCP) agents in the TerraFusion TerraBuild platform.

## MCP Framework Overview

The Model Content Protocol (MCP) is the AI coordination layer for TerraFusion, enabling specialized AI agents to work together on complex tasks related to property assessment, cost analysis, and infrastructure optimization.

### MCP Architecture

```
server/mcp/
├── index.ts                    # MCP framework initialization
├── routes.ts                   # MCP API endpoints
├── orchestrator.ts             # Agent orchestration and routing
├── anthropic.ts                # Anthropic API integration
│
├── agents/                     # AI Agent implementations
│   ├── baseAgent.ts            # Base agent class
│   ├── customAgentBase.ts      # Custom agent utilities
│   ├── eventBus.ts             # Inter-agent communication
│   │
│   ├── conversionAgent.ts      # Benton County data conversion
│   ├── dataAnalysisAgent.ts    # Property data analysis
│   ├── costEstimationAgent.ts  # Building cost estimation
│   ├── costAnalysisAgent.ts    # Cost analysis and optimization
│   ├── dataQualityAgent.ts     # Data validation and quality
│   ├── complianceAgent.ts      # Regulatory compliance
│   ├── designAgent.ts          # Design recommendations
│   ├── developmentAgent.ts     # Development workflow
│   ├── documentProcessingAgent.ts  # Document extraction
│   └── geospatialAnalysisAgent.ts  # Geospatial analysis
│
├── experience/                 # Agent learning and coordination
│   ├── agentCoordinator.ts     # Central agent coordinator
│   ├── replayBuffer.ts         # Experience replay for learning
│   └── trainingCoordinator.ts  # Agent training coordination
│
├── functions/                  # MCP function registry
│   ├── functionRegistry.ts     # Function registration system
│   └── buildingCostFunctions.ts  # Building cost functions
│
├── monitoring/                 # Agent monitoring
│   └── dashboard.ts            # Monitoring dashboard
│
└── schemas/                    # Type definitions
    └── types.ts                # MCP types and interfaces
```

## Core MCP Concepts

### 1. Agent Identity
Each agent has:
- Unique `agentId` (e.g., 'data-analysis-agent')
- Descriptive name and purpose
- Capabilities and specializations
- Status tracked in `agentStatus` database table

### 2. MCP Request/Response Protocol

```typescript
// server/mcp/schemas/types.ts
export interface MCPRequest {
  agentId: string;
  operation: string;
  data: any;
  context?: {
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  };
}

export interface MCPResponse {
  status: 'success' | 'error' | 'pending';
  data?: any;
  error?: string;
  metadata?: {
    agentId: string;
    timestamp: string;
    processingTime?: number;
  };
}
```

### 3. Agent Lifecycle

1. **Initialization** - Agent loads configuration and resources
2. **Registration** - Agent registers with coordinator
3. **Processing** - Agent handles incoming requests
4. **Monitoring** - Status updates to database
5. **Coordination** - Inter-agent communication via event bus

## Creating a New MCP Agent

### Step 1: Create Agent Class

```typescript
// server/mcp/agents/yourAgent.ts
import { BaseAgent } from './baseAgent';
import { MCPRequest, MCPResponse } from '../schemas/types';
import { db } from '../../db';
import { yourTable } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Your Agent - Brief description of what this agent does
 *
 * Capabilities:
 * - Specific capability 1
 * - Specific capability 2
 * - Specific capability 3
 */
export class YourAgent extends BaseAgent {
  constructor() {
    super(
      'your-agent',  // Unique agent ID
      'Brief description of your agent\'s purpose'
    );
  }

  /**
   * Initialize the agent
   * - Load configuration
   * - Connect to external services
   * - Prepare resources
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Your Agent');

    try {
      // Load any required configuration
      const config = await this.loadConfiguration();

      // Initialize external connections if needed
      // await this.connectToExternalService();

      // Update agent status in database
      await this.updateStatus('active', 'Agent initialized successfully');

      this.logger.info('Your Agent initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize agent', { error });
      await this.updateStatus('error', 'Initialization failed');
      throw error;
    }
  }

  /**
   * Process incoming MCP requests
   */
  async process(request: MCPRequest): Promise<MCPResponse> {
    const startTime = Date.now();
    this.logger.info('Processing request', { operation: request.operation });

    try {
      // Validate request
      this.validateRequest(request);

      // Route to appropriate handler based on operation
      let result: any;

      switch (request.operation) {
        case 'analyze':
          result = await this.analyze(request.data);
          break;

        case 'transform':
          result = await this.transform(request.data);
          break;

        case 'validate':
          result = await this.validate(request.data);
          break;

        default:
          throw new Error(`Unknown operation: ${request.operation}`);
      }

      // Return success response
      return {
        status: 'success',
        data: result,
        metadata: {
          agentId: this.agentId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error('Error processing request', { error });

      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          agentId: this.agentId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Validate incoming request
   */
  private validateRequest(request: MCPRequest): void {
    if (!request.operation) {
      throw new Error('Operation is required');
    }

    if (!request.data) {
      throw new Error('Request data is required');
    }

    // Add specific validation for your agent
  }

  /**
   * Analyze operation
   */
  private async analyze(data: any): Promise<any> {
    this.logger.info('Performing analysis', { data });

    // Your analysis logic here
    // Can query database
    const records = await db.query.yourTable.findMany({
      where: eq(yourTable.category, data.category),
    });

    // Process records
    const analysis = this.performAnalysis(records);

    return {
      recordCount: records.length,
      analysis,
      recommendations: this.generateRecommendations(analysis),
    };
  }

  /**
   * Transform operation
   */
  private async transform(data: any): Promise<any> {
    this.logger.info('Performing transformation', { data });

    // Your transformation logic
    const transformed = data.items.map((item: any) => ({
      ...item,
      transformed: this.transformItem(item),
    }));

    return transformed;
  }

  /**
   * Validate operation
   */
  private async validate(data: any): Promise<any> {
    this.logger.info('Performing validation', { data });

    const errors: string[] = [];
    const warnings: string[] = [];

    // Your validation logic
    if (!data.requiredField) {
      errors.push('requiredField is missing');
    }

    if (data.optionalField && data.optionalField.length < 3) {
      warnings.push('optionalField is too short');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Helper methods
   */
  private performAnalysis(records: any[]): any {
    // Analysis implementation
    return {
      totalRecords: records.length,
      averageValue: records.reduce((sum, r) => sum + r.value, 0) / records.length,
    };
  }

  private transformItem(item: any): any {
    // Transform implementation
    return {
      ...item,
      transformed: true,
      timestamp: new Date().toISOString(),
    };
  }

  private generateRecommendations(analysis: any): string[] {
    // Generate recommendations based on analysis
    const recommendations: string[] = [];

    if (analysis.averageValue > 1000) {
      recommendations.push('Consider cost optimization strategies');
    }

    return recommendations;
  }

  /**
   * Update agent status in database
   */
  private async updateStatus(status: string, message: string): Promise<void> {
    try {
      await db.insert(agentStatus).values({
        agentId: this.agentId,
        status,
        message,
        lastUpdate: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to update status', { error });
    }
  }

  /**
   * Load agent configuration
   */
  private async loadConfiguration(): Promise<any> {
    // Load configuration from database or environment
    return {
      maxConcurrentRequests: 10,
      timeout: 30000,
    };
  }
}

// Export singleton instance
export const yourAgent = new YourAgent();
```

### Step 2: Register Agent

```typescript
// server/mcp/index.ts
import { yourAgent } from './agents/yourAgent';

export function initMCP(app: Express): void {
  console.log('Initializing MCP framework...');

  try {
    // Register MCP routes
    app.use('/mcp', mcpRouter);

    // Initialize agents
    initializeAgents();

    // Initialize orchestrator
    mcpOrchestrator.initialize();

    console.log('MCP framework initialized successfully');
  } catch (error) {
    console.error('Error initializing MCP framework:', error);
    throw error;
  }
}

function initializeAgents(): void {
  // Agents auto-register through coordinator
  // Import ensures agent is loaded
  agentCoordinator.updateAgentRegistry();

  console.log('All agents registered');
}
```

### Step 3: Add API Routes (Optional)

```typescript
// server/mcp/routes.ts
import { Router } from 'express';
import { yourAgent } from './agents/yourAgent';

const router = Router();

// Direct agent endpoint
router.post('/your-agent/:operation', async (req, res) => {
  try {
    const result = await yourAgent.process({
      agentId: 'your-agent',
      operation: req.params.operation,
      data: req.body,
      context: {
        userId: req.session?.user?.id,
      },
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
```

## BaseAgent Class

The `BaseAgent` class provides common functionality for all agents:

```typescript
// server/mcp/agents/baseAgent.ts
export abstract class BaseAgent {
  protected agentId: string;
  protected description: string;
  protected logger: Logger;

  constructor(agentId: string, description: string) {
    this.agentId = agentId;
    this.description = description;
    this.logger = createLogger(agentId);
  }

  // Abstract methods that must be implemented
  abstract initialize(): Promise<void>;
  abstract process(request: MCPRequest): Promise<MCPResponse>;

  // Common utility methods
  protected log(level: string, message: string, meta?: any): void {
    this.logger.log(level, message, meta);
  }

  protected async emitEvent(event: string, data: any): Promise<void> {
    await eventBus.emit(event, {
      agentId: this.agentId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  protected async callAgent(
    targetAgentId: string,
    operation: string,
    data: any
  ): Promise<MCPResponse> {
    return await mcpOrchestrator.routeRequest({
      agentId: targetAgentId,
      operation,
      data,
    });
  }

  // Getters
  public getAgentId(): string {
    return this.agentId;
  }

  public getDescription(): string {
    return this.description;
  }
}
```

## Inter-Agent Communication

### Event Bus Pattern

```typescript
// server/mcp/agents/eventBus.ts
import { EventEmitter } from 'events';

class AgentEventBus extends EventEmitter {
  async emit(event: string, data: any): Promise<boolean> {
    super.emit(event, data);

    // Also persist to database for audit
    await this.persistEvent(event, data);

    return true;
  }

  private async persistEvent(event: string, data: any): Promise<void> {
    // Store event in database for replay/audit
    await db.insert(agentEvents).values({
      event,
      data,
      timestamp: new Date(),
    });
  }
}

export const eventBus = new AgentEventBus();

// Usage in agents
export class YourAgent extends BaseAgent {
  async initialize(): Promise<void> {
    // Subscribe to events from other agents
    eventBus.on('data-updated', async (data) => {
      await this.handleDataUpdate(data);
    });
  }

  async process(request: MCPRequest): Promise<MCPResponse> {
    const result = await this.performWork(request.data);

    // Emit event for other agents
    await this.emitEvent('work-completed', {
      result,
      requestId: request.context?.metadata?.requestId,
    });

    return { status: 'success', data: result };
  }

  private async handleDataUpdate(data: any): Promise<void> {
    this.logger.info('Received data update event', { data });
    // React to update
  }
}
```

### Direct Agent Calls

```typescript
// Agent A calling Agent B
export class AgentA extends BaseAgent {
  async process(request: MCPRequest): Promise<MCPResponse> {
    // Do some work
    const intermediateResult = await this.doWork(request.data);

    // Call another agent for specialized processing
    const agentBResponse = await this.callAgent(
      'agent-b',
      'specialize',
      intermediateResult
    );

    if (agentBResponse.status !== 'success') {
      throw new Error('Agent B processing failed');
    }

    // Combine results
    return {
      status: 'success',
      data: {
        fromAgentA: intermediateResult,
        fromAgentB: agentBResponse.data,
      },
    };
  }
}
```

## Agent Orchestrator

The orchestrator routes requests to appropriate agents and manages load balancing:

```typescript
// server/mcp/orchestrator.ts
export class MCPOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();

  initialize(): void {
    // Load agents from registry
    this.loadAgents();
  }

  async routeRequest(request: MCPRequest): Promise<MCPResponse> {
    const agent = this.agents.get(request.agentId);

    if (!agent) {
      return {
        status: 'error',
        error: `Agent not found: ${request.agentId}`,
      };
    }

    // Update metrics
    await this.recordRequest(request.agentId);

    // Process request
    const response = await agent.process(request);

    // Update metrics
    await this.recordResponse(request.agentId, response.status);

    return response;
  }

  private loadAgents(): void {
    // Agents are auto-loaded through imports
    // The agentCoordinator manages the registry
  }

  private async recordRequest(agentId: string): Promise<void> {
    // Record in monitoring system
  }

  private async recordResponse(agentId: string, status: string): Promise<void> {
    // Record in monitoring system
  }
}

export const mcpOrchestrator = new MCPOrchestrator();
```

## Agent Coordination

The coordinator manages the agent registry and facilitates communication:

```typescript
// server/mcp/experience/agentCoordinator.ts
export class AgentCoordinator {
  private registry: Map<string, AgentMetadata> = new Map();

  updateAgentRegistry(): void {
    // Scan for available agents
    // Register metadata
    this.logger.info('Agent registry updated', {
      agentCount: this.registry.size,
    });
  }

  getAgent(agentId: string): AgentMetadata | undefined {
    return this.registry.get(agentId);
  }

  getAllAgents(): AgentMetadata[] {
    return Array.from(this.registry.values());
  }

  async routeToCapableAgent(
    capability: string,
    request: MCPRequest
  ): Promise<MCPResponse> {
    // Find agent with matching capability
    const agent = this.findByCapability(capability);

    if (!agent) {
      throw new Error(`No agent found with capability: ${capability}`);
    }

    return await mcpOrchestrator.routeRequest({
      ...request,
      agentId: agent.agentId,
    });
  }

  private findByCapability(capability: string): AgentMetadata | undefined {
    return Array.from(this.registry.values()).find((agent) =>
      agent.capabilities.includes(capability)
    );
  }
}

export const agentCoordinator = new AgentCoordinator();
```

## Example: Benton County Conversion Agent

Real-world example from the codebase:

```typescript
// server/mcp/agents/conversionAgent.ts
export class BentonCountyConversionAgent extends BaseAgent {
  constructor() {
    super(
      'benton-county-conversion-agent',
      'Converts Benton County property data from Marshall Swift to Cost per Square Foot format'
    );
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Benton County Conversion Agent');

    // Load Marshall Swift lookup tables
    await this.loadMarshallSwiftTables();

    // Load regional adjustment factors
    await this.loadRegionalFactors();

    this.logger.info('Benton County Conversion Agent initialized');
  }

  async process(request: MCPRequest): Promise<MCPResponse> {
    const startTime = Date.now();

    try {
      switch (request.operation) {
        case 'convert':
          return await this.convertProperty(request.data);

        case 'batch-convert':
          return await this.batchConvert(request.data);

        case 'validate-conversion':
          return await this.validateConversion(request.data);

        default:
          throw new Error(`Unknown operation: ${request.operation}`);
      }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Conversion failed',
        metadata: {
          agentId: this.agentId,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  private async convertProperty(data: any): Promise<MCPResponse> {
    const { marshallSwiftCode, squareFootage, yearBuilt, quality } = data;

    // Lookup Marshall Swift base cost
    const msData = await this.lookupMarshallSwift(marshallSwiftCode);

    // Apply adjustments
    const qualityFactor = this.getQualityFactor(quality);
    const depreciation = this.calculateDepreciation(yearBuilt);
    const regionalFactor = await this.getRegionalFactor(data.region);

    // Calculate CFT
    const costPerSqFt =
      msData.baseCost * qualityFactor * depreciation * regionalFactor;

    return {
      status: 'success',
      data: {
        costPerSqFt,
        totalCost: costPerSqFt * squareFootage,
        breakdown: {
          baseCost: msData.baseCost,
          qualityFactor,
          depreciation,
          regionalFactor,
        },
      },
      metadata: {
        agentId: this.agentId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async batchConvert(data: any): Promise<MCPResponse> {
    const { properties } = data;

    const results = await Promise.all(
      properties.map((prop: any) => this.convertProperty(prop))
    );

    return {
      status: 'success',
      data: {
        converted: results.filter((r) => r.status === 'success').length,
        failed: results.filter((r) => r.status === 'error').length,
        results,
      },
      metadata: {
        agentId: this.agentId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Helper methods
  private async lookupMarshallSwift(code: string): Promise<any> {
    // Query database for Marshall Swift data
    const data = await db.query.marshallSwiftCodes.findFirst({
      where: eq(marshallSwiftCodes.code, code),
    });

    if (!data) {
      throw new Error(`Marshall Swift code not found: ${code}`);
    }

    return data;
  }

  private getQualityFactor(quality: string): number {
    const factors: Record<string, number> = {
      LOW: 0.85,
      STANDARD: 1.0,
      HIGH: 1.2,
      LUXURY: 1.5,
    };

    return factors[quality] || 1.0;
  }

  private calculateDepreciation(yearBuilt: number): number {
    const age = new Date().getFullYear() - yearBuilt;
    const depreciationRate = 0.01; // 1% per year
    return Math.max(0.5, 1 - age * depreciationRate);
  }
}

export const bentonCountyConversionAgent = new BentonCountyConversionAgent();
```

## Agent Monitoring

Track agent performance and status:

```typescript
// Database schema for agent monitoring
export const agentStatus = pgTable('agent_status', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  status: text('status').notNull(),  // 'active', 'error', 'idle'
  message: text('message'),
  requestCount: integer('request_count').default(0),
  errorCount: integer('error_count').default(0),
  lastRequest: timestamp('last_request'),
  lastUpdate: timestamp('last_update').defaultNow(),
});

// Monitoring dashboard endpoint
router.get('/mcp/status', async (req, res) => {
  const agents = await db.query.agentStatus.findMany({
    orderBy: (agentStatus, { desc }) => [desc(agentStatus.lastUpdate)],
  });

  res.json({
    totalAgents: agents.length,
    active: agents.filter((a) => a.status === 'active').length,
    errors: agents.filter((a) => a.status === 'error').length,
    agents,
  });
});
```

## Best Practices

### 1. Agent Design
- **Single Responsibility**: Each agent should have one clear purpose
- **Stateless Processing**: Agents should not maintain request state between calls
- **Idempotency**: Operations should be idempotent when possible
- **Error Handling**: Always return structured error responses

### 2. Performance
- **Async Operations**: Use async/await for all I/O operations
- **Batch Processing**: Support batch operations for efficiency
- **Caching**: Cache frequently accessed data
- **Timeouts**: Implement timeouts for external calls

### 3. Monitoring
- **Status Updates**: Regularly update agent status in database
- **Metrics**: Track request counts, error rates, processing times
- **Logging**: Use structured logging with context
- **Alerts**: Implement alerting for critical failures

### 4. Security
- **Input Validation**: Always validate request data
- **Authentication**: Respect user context in requests
- **Authorization**: Check permissions before sensitive operations
- **Data Sanitization**: Sanitize outputs to prevent data leaks

---

**Last Updated**: October 2025
**Related**: CLAUDE.md, CLAUDE-BACKEND.md
**MCP Version**: 1.0
**Agent Count**: 10+ specialized agents
