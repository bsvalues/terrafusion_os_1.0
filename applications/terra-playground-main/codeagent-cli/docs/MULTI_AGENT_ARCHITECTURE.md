# Multi-Agent Architecture

This document provides an overview of the multi-agent architecture implemented in the CodeAgent CLI system.

## Overview

The Multi-Agent Architecture is designed to provide a flexible and extensible framework for intelligent agents that can collaborate to perform complex tasks. The architecture is organized around specialized agents that focus on specific domains or tasks, coordinated through a central system.

## Architecture Components

![Multi-Agent Architecture Diagram](../assets/multi-agent-architecture.svg)

### Core Components

- **BaseAgent**: Abstract base class that all specialized agents inherit from, providing common functionality and interfaces.
- **AgentRegistry**: Maintains a catalog of all available agents and their capabilities.
- **AgentCoordinator**: Manages task assignment and agent collaboration.
- **EventBus**: Facilitates communication between agents through an event-driven architecture.
- **StateManager**: Handles persistence and loading of agent state.
- **LogService**: Provides structured logging for all agent activities.

### Domain-Specific Agents

Agents specializing in particular knowledge domains:

- **DatabaseIntelligenceAgent**: Specializes in database operations, query optimization, and schema recommendations.
- **GisSpecialistAgent**: Focuses on geospatial data processing, map rendering, and spatial queries.
- **DevelopmentPipelineAgent**: Manages build processes, testing, and code quality.

### Task-Specific Agents

Agents specializing in particular types of tasks:

- **DebuggingAgent**: Analyzes code, tracks errors, and suggests fixes.
- **LocalDeploymentAgent**: Manages local deployment environments and containerization.
- **VersionControlAgent**: Handles version control operations and branch management.
- **WebDeploymentAgent**: Facilitates deployment to cloud platforms and manages associated resources.

### Agent Integration

The **AgentSystem** class serves as the main entry point for the multi-agent architecture, providing:

- Initialization of the entire agent ecosystem
- Task submission and routing
- Centralized management and monitoring

## Usage

### Basic Usage

```typescript
import { AgentSystem, LogLevel } from './agents';

// Create and initialize the agent system
const agentSystem = new AgentSystem({
  logLevel: LogLevel.INFO,
  autoInitialize: true,
});

// Submit a task to the appropriate agent
const result = await agentSystem.submitTask({
  id: 'task-123',
  type: 'analyze_query',
  priority: 'high',
  payload: {
    query: 'SELECT * FROM users WHERE status = "active"',
  },
});

// Work with the result
console.log(result);
```

### Agent Selection

You can either:

1. **Let the system decide**: Submit a task without specifying an agent, and the AgentCoordinator will route it based on capabilities and load.
2. **Specify an agent**: If you know which agent should handle the task, provide its ID when submitting.

```typescript
// Automatic agent selection
const result1 = await agentSystem.submitTask(task);

// Manual agent selection
const result2 = await agentSystem.submitTask(task, 'database-agent-123');
```

### Finding Agents

```typescript
// Get all agents
const allAgents = agentSystem.getAllAgents();

// Get agents by type
const domainAgents = agentSystem.getAgentsByType(AgentType.DOMAIN_SPECIFIC);

// Find agents by capability
const debuggingAgents = agentSystem.findAgentsByCapability('CODE_ANALYSIS');
```

## Extending the Architecture

### Creating a Custom Agent

1. Create a new class extending `BaseAgent`
2. Implement the required methods: `initialize()`, `executeTask()`, and `onShutdown()`
3. Register the agent with the system

Example:

```typescript
import { BaseAgent, AgentType, AgentCapability, AgentTask } from './agents/core';

class CustomAgent extends BaseAgent {
  constructor() {
    super(
      'CustomAgent',
      AgentType.DOMAIN_SPECIFIC,
      [AgentCapability.CUSTOM_CAPABILITY],
      AgentPriority.NORMAL
    );
  }

  async initialize(): Promise<boolean> {
    // Initialization logic
    return true;
  }

  async executeTask(task: AgentTask): Promise<any> {
    // Task execution logic
    return { result: 'success' };
  }

  protected async onShutdown(force: boolean): Promise<void> {
    // Shutdown logic
  }
}

// Register with the system
const customAgent = new CustomAgent();
await customAgent.initialize();
agentSystem.registry.registerAgent(customAgent);
```

## Task Execution Flow

1. A task is submitted to the AgentSystem
2. The AgentCoordinator determines which agent(s) should handle the task
3. The selected agent executes the task
4. Results are returned to the caller
5. Events are published for monitoring and coordination

## State Persistence

Agents can persist their state between sessions using the StateManager:

```typescript
// Save state
await this.stateManager.saveAgentState(this.id, { key: 'value' });

// Load state
const savedState = await this.stateManager.loadAgentState(this.id);
```

## Event-Based Communication

Agents can communicate with each other through the EventBus:

```typescript
// Publish an event
this.eventBus.publish('data:updated', {
  agentId: this.id,
  data: { resource: 'users', action: 'update' },
});

// Subscribe to events
this.eventBus.subscribe('data:updated', event => {
  // Handle the event
});
```

## Performance Considerations

- Agents are designed to be lightweight and focused on specific tasks
- The AgentCoordinator can balance task load across agents
- State persistence should be used judiciously to avoid memory issues
- Consider using the priority system to ensure critical tasks are handled promptly

## Future Extensions

The architecture is designed to be extensible, with potential future additions including:

- **Agent Learning**: Incorporating machine learning to improve agent performance over time
- **Complex Workflows**: Building multi-stage workflows across multiple agents
- **Remote Agents**: Distributing agents across different machines for scaling
- **Specialized User Agents**: Creating agents focused on user interaction and task planning

## Example

See the [multi-agent-system.ts](../examples/multi-agent-system.ts) example for a comprehensive demonstration of the architecture in action.
