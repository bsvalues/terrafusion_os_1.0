# Adaptive Learning Architecture

This document provides an overview of the adaptive learning architecture implemented in the CodeAgent CLI system.

## Overview

The Adaptive Learning Architecture enables agents in the CodeAgent CLI system to continuously learn and improve through experience. By leveraging advanced AI models and analyzing past performance, agents can adapt their behavior to better serve users over time.

## Architecture Components

![Adaptive Learning Architecture Diagram](../assets/adaptive-learning-architecture.svg)

### Core Components

- **LearningService**: Provides access to AI models (Anthropic Claude, Perplexity) for enhancing agent capabilities.
- **AdaptiveAgent**: Abstract base class that extends BaseAgent with learning capabilities.
- **LearningRepository**: Central repository for sharing and analyzing learning across agents.

### Specialized Adaptive Agents

The architecture includes specialized adaptive versions of domain-specific agents:

- **AdaptiveDatabaseAgent**: Database intelligence agent with learning capabilities.
- **AdaptiveGisAgent**: GIS specialist agent with learning capabilities.

### Learning Flow

1. **Task Analysis**: When a task is received, the agent analyzes its complexity and determines whether to apply learning.
2. **Context Collection**: The agent gathers relevant context, including past similar tasks and their outcomes.
3. **Learning Enhancement**: The agent calls the LearningService to enhance its task execution.
4. **Execution & Recording**: The agent executes the task and records the outcome for future learning.
5. **Feedback Integration**: User feedback is integrated to improve future performance.

## Usage

### Basic Usage

```typescript
import { AdaptiveDatabaseAgent, LearningRepository } from './agents/learning';

// Create and initialize an adaptive agent
const agent = new AdaptiveDatabaseAgent();
await agent.initialize();

// Execute tasks with learning enhancement
const result = await agent.executeTask({
  id: 'task-123',
  type: 'analyze_query',
  priority: 'high',
  payload: {
    query: 'SELECT * FROM users WHERE status = "active"',
  },
});

// Provide feedback on task execution
const learningRepository = LearningRepository.getInstance();
learningRepository.provideFeedback('learning-record-id', 'positive');
```

### Configuring AI Providers

```typescript
import { LearningService } from './agents/learning';

// Get the learning service instance
const learningService = LearningService.getInstance();

// Configure the Anthropic provider
learningService.configureProvider({
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
});

// Configure the Perplexity provider
learningService.configureProvider({
  provider: 'perplexity',
  model: 'llama-3.1-sonar-small-128k-online',
});
```

### Querying the Learning Repository

```typescript
import { LearningRepository } from './agents/learning';

// Get the learning repository instance
const learningRepository = LearningRepository.getInstance();

// Get a summary of all learning across agents
const summary = learningRepository.getSummary();
console.log(`Total learning records: ${summary.totalRecords}`);
console.log(`Success rate: ${(summary.byFeedback.positive / summary.totalRecords) * 100}%`);

// Query for specific learning records
const records = learningRepository.queryRecords({
  taskType: 'analyze_query',
  feedback: 'positive',
  timeRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
  },
  limit: 10,
  sortBy: 'timestamp',
  sortDirection: 'desc',
});
```

## Learning Capabilities

### Task Complexity Analysis

Agents automatically assess the complexity of tasks to determine when to apply learning:

```typescript
protected getTaskComplexity(task: AgentTask): number {
  // Example for a query analysis task
  const query = task.payload.query as string;
  let complexity = 0.1; // Base complexity

  // Add complexity for query length
  complexity += Math.min(0.3, query.length / 1000);

  // Add complexity for joins
  const joinCount = (query.match(/join/gi) || []).length;
  complexity += Math.min(0.2, joinCount * 0.05);

  // More complexity factors...

  return Math.min(1.0, complexity);
}
```

### Model Selection

Agents can select appropriate AI models based on the task requirements:

```typescript
protected selectModelForTask(task: AgentTask): 'anthropic' | 'perplexity' {
  // Check if task needs up-to-date information
  if (this.taskNeedsUpToDateInfo(task)) {
    return 'perplexity'; // Better for up-to-date information
  }

  // Default to Anthropic for most tasks
  return 'anthropic'; // Better for reasoning and analysis
}
```

### Learning Enhancement

Agents enhance their standard execution with learnings from previous tasks:

```typescript
protected async applyLearningToTask(
  task: AgentTask,
  learningOutput: string,
  context?: any
): Promise<any> {
  // First get standard analysis
  const standardResult = await this.executeTaskWithoutLearning(task, context);

  // Extract enhancements from learning
  const enhancements = this.extractEnhancements(learningOutput);

  // Combine standard result with enhancements
  return {
    ...standardResult,
    ...enhancements,
    learningEnhanced: true
  };
}
```

## Learning Feedback Loop

The system implements a feedback loop to continuously improve agent performance:

1. **Task Execution**: Agents execute tasks and record the process and outcome.
2. **Feedback Collection**: Users provide feedback on agent performance.
3. **Analysis**: The system analyzes feedback and identifies patterns.
4. **Adaptation**: Agents adapt their behavior based on the analyzed feedback.
5. **Continuous Improvement**: The cycle repeats, leading to continuously improving performance.

## Cross-Agent Learning

The LearningRepository enables sharing of insights across different agents:

```typescript
// Get insights for a specific task type across all agents
const taskInsights = learningRepository.getTaskInsights('analyze_query');

// Find similar historical records across all agents
const similarRecords = learningRepository.getSimilarRecords(currentRecord);
```

## Future Enhancements

The architecture is designed to be extensible, with planned future enhancements including:

- **Reinforcement Learning**: Implementing reinforcement learning to optimize agent behavior.
- **Federated Learning**: Enabling learning across distributed agent instances.
- **Active Learning**: Implementing active learning to identify and address knowledge gaps.
- **Multi-Modal Learning**: Extending learning capabilities to handle different data types.
- **Explainable AI**: Adding capabilities to explain the reasoning behind agent decisions.

## Example

See the `multi-agent-system.ts` example for a demonstration of the adaptive learning architecture in action.
