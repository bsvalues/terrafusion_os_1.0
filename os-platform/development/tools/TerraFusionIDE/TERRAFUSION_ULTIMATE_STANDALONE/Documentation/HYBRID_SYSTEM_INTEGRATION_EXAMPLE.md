# 🚀 Terrafusion Hybrid Agent System - Integration Examples

## Overview
This document provides practical examples of how to integrate and use the Terrafusion Hybrid Agent System in your applications.

## 🎯 Quick Start Example

### 1. Basic Integration

```typescript
import React from 'react';
import HybridAgentSystem from './components/HybridAgentSystem';
import { HybridAgentOrchestrator } from './orchestrator/HybridAgentOrchestrator';

const MyApp: React.FC = () => {
  const [orchestrator] = useState(() => new HybridAgentOrchestrator());
  const [showAgents, setShowAgents] = useState(false);

  const handleTask = async () => {
    // Create a task
    const task = await orchestrator.createTask({
      title: 'Analyze Property Data',
      description: 'Process and analyze property assessment data for Benton County',
      type: 'development',
      priority: 'high'
    });

    // The orchestrator will automatically assign it to the best agent
    console.log(`Task assigned to: ${task.assignedAgent}`);
  };

  return (
    <div>
      <button onClick={() => setShowAgents(true)}>
        Open AI Agents
      </button>
      
      {showAgents && (
        <div className="fixed inset-0 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg">
            <HybridAgentSystem />
          </div>
        </div>
      )}
    </div>
  );
};
```

### 2. Advanced Tool Integration

```typescript
import { AdvancedToolIntegration } from './orchestrator/AdvancedToolIntegration';

const ToolExample: React.FC = () => {
  const [toolSystem] = useState(() => new AdvancedToolIntegration());

  const executeAdvancedTask = async () => {
    try {
      // Execute a complex task using multiple tools
      const result = await toolSystem.executeToolChain([
        {
          toolId: 'advanced-code-search',
          parameters: { query: 'property assessment algorithm', context: 'benton county' }
        },
        {
          toolId: 'strategic-planning',
          parameters: { objective: 'optimize property valuation', constraints: ['fisma', 'performance'] }
        },
        {
          toolId: 'parallel-execution',
          parameters: { tasks: ['data-processing', 'ml-training', 'validation'] }
        }
      ]);

      console.log('Tool chain executed:', result);
    } catch (error) {
      console.error('Tool execution failed:', error);
    }
  };

  return (
    <button onClick={executeAdvancedTask}>
      Execute Advanced AI Task
    </button>
  );
};
```

## 🔧 Agent-Specific Examples

### Windsurf Agent - Web Development

```typescript
const WindsurfExample: React.FC = () => {
  const handleWebDevelopment = async () => {
    const task = await orchestrator.createTask({
      title: 'Create Property Dashboard',
      description: 'Build a responsive dashboard for property assessment data',
      type: 'development',
      priority: 'high',
      context: {
        framework: 'React',
        requirements: ['responsive', 'accessible', 'government-compliant']
      }
    });

    // Windsurf agent will handle this automatically
    console.log('Web development task created:', task.id);
  };

  return (
    <div>
      <h3>Windsurf Agent - Web Development</h3>
      <button onClick={handleWebDevelopment}>
        Create Property Dashboard
      </button>
    </div>
  );
};
```

### Devin AI - Strategic Planning

```typescript
const DevinExample: React.FC = () => {
  const handleStrategicPlanning = async () => {
    const task = await orchestrator.createTask({
      title: 'County Expansion Strategy',
      description: 'Develop a strategic plan for expanding to neighboring counties',
      type: 'planning',
      priority: 'critical',
      context: {
        currentCounties: ['Benton'],
        targetCounties: ['Franklin', 'Walla Walla'],
        constraints: ['budget', 'timeline', 'compliance']
      }
    });

    console.log('Strategic planning task created:', task.id);
  };

  return (
    <div>
      <h3>Devin AI - Strategic Planning</h3>
      <button onClick={handleStrategicPlanning}>
        Plan County Expansion
      </button>
    </div>
  );
};
```

### Cursor Agent - Code Optimization

```typescript
const CursorExample: React.FC = () => {
  const handleCodeOptimization = async () => {
    const task = await orchestrator.createTask({
      title: 'Performance Optimization',
      description: 'Optimize the property valuation algorithm for 379M× performance',
      type: 'optimization',
      priority: 'high',
      context: {
        currentPerformance: 'baseline',
        targetPerformance: '379M× improvement',
        constraints: ['accuracy', 'memory', 'latency']
      }
    });

    console.log('Code optimization task created:', task.id);
  };

  return (
    <div>
      <h3>Cursor Agent - Code Optimization</h3>
      <button onClick={handleCodeOptimization}>
        Optimize Performance
      </button>
    </div>
  );
};
```

## 🧠 Memory and Context Management

### Persistent Memory Example

```typescript
const MemoryExample: React.FC = () => {
  const handleMemoryOperations = async () => {
    // Store important information
    await orchestrator.storeMemory({
      title: 'Benton County Requirements',
      content: 'FISMA compliance, 99.9% uptime, real-time processing',
      category: 'compliance',
      priority: 'high',
      tags: ['benton', 'fisma', 'requirements']
    });

    // Retrieve relevant memories
    const memories = await orchestrator.searchMemories('benton county compliance');
    console.log('Relevant memories:', memories);

    // Use memory for task context
    const task = await orchestrator.createTask({
      title: 'Implement Compliance Features',
      description: 'Add FISMA compliance features based on stored requirements',
      type: 'development',
      priority: 'high',
      context: {
        complianceRequirements: memories.map(m => m.content),
        county: 'Benton'
      }
    });
  };

  return (
    <div>
      <h3>Memory Management</h3>
      <button onClick={handleMemoryOperations}>
        Manage AI Memories
      </button>
    </div>
  );
};
```

## 📊 System Monitoring Integration

### Real-time Metrics

```typescript
const MonitoringExample: React.FC = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = orchestrator.getSystemMetrics();
      setMetrics(currentMetrics);
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    orchestrator.on('metrics-updated', updateMetrics);

    return () => {
      clearInterval(interval);
      orchestrator.removeListener('metrics-updated', updateMetrics);
    };
  }, [orchestrator]);

  return (
    <div>
      <h3>System Monitoring</h3>
      {metrics && (
        <div className="grid grid-cols-4 gap-4">
          <div>CPU: {metrics.cpu}%</div>
          <div>Memory: {metrics.memory}%</div>
          <div>Disk: {metrics.disk}%</div>
          <div>Network: {metrics.network}%</div>
        </div>
      )}
    </div>
  );
};
```

## 🚀 Production Deployment Example

### Complete Application Integration

```typescript
import React, { useState, useEffect } from 'react';
import HybridAgentSystem from './components/HybridAgentSystem';
import { HybridAgentOrchestrator } from './orchestrator/HybridAgentOrchestrator';
import { AdvancedToolIntegration } from './orchestrator/AdvancedToolIntegration';

const TerraFusionApp: React.FC = () => {
  const [orchestrator] = useState(() => new HybridAgentOrchestrator());
  const [toolSystem] = useState(() => new AdvancedToolIntegration());
  const [showAgents, setShowAgents] = useState(false);
  const [activeTasks, setActiveTasks] = useState([]);

  useEffect(() => {
    // Listen for task updates
    const handleTaskUpdate = () => {
      setActiveTasks(orchestrator.getAllTasks());
    };

    orchestrator.on('task-created', handleTaskUpdate);
    orchestrator.on('task-completed', handleTaskUpdate);
    orchestrator.on('task-failed', handleTaskUpdate);

    return () => {
      orchestrator.removeAllListeners();
    };
  }, [orchestrator]);

  const createDevelopmentTask = async () => {
    const task = await orchestrator.createTask({
      title: 'Build New Feature',
      description: 'Implement advanced property analytics dashboard',
      type: 'development',
      priority: 'high',
      context: {
        feature: 'advanced-analytics',
        target: 'property-dashboard',
        requirements: ['real-time', 'interactive', 'accessible']
      }
    });

    console.log('Development task created:', task);
  };

  const executeToolChain = async () => {
    try {
      const results = await toolSystem.executeToolChain([
        {
          toolId: 'advanced-code-search',
          parameters: { query: 'property analytics', context: 'dashboard' }
        },
        {
          toolId: 'strategic-planning',
          parameters: { objective: 'optimize user experience', constraints: ['performance', 'accessibility'] }
        }
      ]);

      console.log('Tool chain results:', results);
    } catch (error) {
      console.error('Tool chain failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4">
        <h1 className="text-2xl font-bold">Terrafusion Application</h1>
        <div className="flex gap-4 mt-4">
          <button
            onClick={createDevelopmentTask}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Create Development Task
          </button>
          <button
            onClick={executeToolChain}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Execute Tool Chain
          </button>
          <button
            onClick={() => setShowAgents(true)}
            className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
          >
            Open AI Agents
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Active Tasks ({activeTasks.length})</h2>
          <div className="space-y-2">
            {activeTasks.map(task => (
              <div key={task.id} className="bg-gray-800 p-4 rounded">
                <h3 className="font-semibold">{task.title}</h3>
                <p className="text-gray-300">{task.description}</p>
                <div className="flex gap-2 mt-2 text-sm">
                  <span>Status: {task.status}</span>
                  <span>Agent: {task.assignedAgent}</span>
                  <span>Priority: {task.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showAgents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-11/12 h-5/6 overflow-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Terrafusion Hybrid Agent System</h2>
                <button
                  onClick={() => setShowAgents(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              <HybridAgentSystem />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerraFusionApp;
```

## 🎯 Best Practices

### 1. Task Creation
- Always provide clear, descriptive task titles and descriptions
- Use appropriate task types and priorities
- Include relevant context for better agent assignment

### 2. Memory Management
- Store important information that agents might need later
- Use descriptive tags for better memory retrieval
- Regularly clean up outdated memories

### 3. Tool Integration
- Chain tools logically for complex operations
- Handle errors gracefully
- Monitor tool execution performance

### 4. Agent Coordination
- Let the orchestrator handle agent assignment automatically
- Monitor task progress and agent performance
- Use events for real-time updates

## 🔍 Troubleshooting

### Common Issues

1. **Task Not Assigned**: Check if agents are available and have the required capabilities
2. **Tool Execution Failed**: Verify tool parameters and handle errors appropriately
3. **Memory Not Found**: Ensure proper tags and search terms are used
4. **Performance Issues**: Monitor system metrics and agent workload

### Debug Mode

```typescript
// Enable debug logging
orchestrator.setDebugMode(true);

// Monitor all events
orchestrator.on('*', (event, data) => {
  console.log(`Event: ${event}`, data);
});
```

This integration example demonstrates how to effectively use the Terrafusion Hybrid Agent System in production applications. The system is designed to be flexible and powerful, allowing you to create sophisticated AI-powered workflows while maintaining clean, maintainable code.
