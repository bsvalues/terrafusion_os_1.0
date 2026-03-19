import { EventEmitter } from 'events';

export interface SwarmAgent {
  id: string;
  name: string;
  type: 'coordinator' | 'field-general' | 'micro-agent';
  status: 'active' | 'idle' | 'error' | 'offline';
  capabilities: string[];
  currentTask?: string;
  performance: {
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: number;
  };
}

export interface SwarmTask {
  id: string;
  type: 'property-analysis' | 'cost-calculation' | 'market-research' | 'compliance-check' | 'data-validation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  assignedAgents: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: any;
}

export class TerraFusionSwarmOrchestrator extends EventEmitter {
  private agents: Map<string, SwarmAgent> = new Map();
  private tasks: Map<string, SwarmTask> = new Map();
  private static readonly MAX_QUEUE_DEPTH = 1000;
  private taskQueue: SwarmTask[] = [];
  private isProcessing = false;

  constructor() {
    super();
    this.initializeSwarm();
    this.startTaskProcessor();
  }

  /**
   * Initialize the AI swarm with default agents
   */
  private initializeSwarm(): void {
    // Coordinators - High-level task management
    this.registerAgent({
      id: 'coord-001',
      name: 'Property Analysis Coordinator',
      type: 'coordinator',
      status: 'active',
      capabilities: ['property-analysis', 'task-coordination', 'result-aggregation'],
      performance: { tasksCompleted: 0, successRate: 100, avgResponseTime: 250 }
    });

    this.registerAgent({
      id: 'coord-002',
      name: 'Cost Analysis Coordinator',
      type: 'coordinator',
      status: 'active',
      capabilities: ['cost-calculation', 'market-analysis', 'financial-modeling'],
      performance: { tasksCompleted: 0, successRate: 100, avgResponseTime: 180 }
    });

    // Field Generals - Specialized task execution
    for (let i = 1; i <= 8; i++) {
      this.registerAgent({
        id: `fg-${i.toString().padStart(3, '0')}`,
        name: `Field General ${i}`,
        type: 'field-general',
        status: 'active',
        capabilities: ['property-analysis', 'cost-calculation', 'data-processing'],
        performance: { tasksCompleted: 0, successRate: 98, avgResponseTime: 120 }
      });
    }

    // Micro Agents - Rapid task execution
    for (let i = 1; i <= 147; i++) {
      this.registerAgent({
        id: `ma-${i.toString().padStart(3, '0')}`,
        name: `Micro Agent ${i}`,
        type: 'micro-agent',
        status: 'active',
        capabilities: ['data-validation', 'simple-calculations', 'pattern-recognition'],
        performance: { tasksCompleted: 0, successRate: 96, avgResponseTime: 50 }
      });
    }

    console.log(`🤖 AI Swarm initialized with ${this.agents.size} agents`);
  }

  /**
   * Register a new agent in the swarm
   */
  registerAgent(agent: SwarmAgent): void {
    this.agents.set(agent.id, agent);
    this.emit('agent-registered', agent);
  }

  /**
   * Submit a task to the swarm
   */
  async submitTask(task: Omit<SwarmTask, 'id' | 'status' | 'createdAt' | 'assignedAgents'>): Promise<string> {
    const swarmTask: SwarmTask = {
      ...task,
      id: this.generateTaskId(),
      status: 'pending',
      createdAt: new Date(),
      assignedAgents: []
    };

    this.tasks.set(swarmTask.id, swarmTask);

    if (this.taskQueue.length >= TerraFusionSwarmOrchestrator.MAX_QUEUE_DEPTH) {
      this.emit('task-rejected', {
        taskId: swarmTask.id,
        reason: `Queue at capacity (${TerraFusionSwarmOrchestrator.MAX_QUEUE_DEPTH}); task dropped`
      });
      return swarmTask.id;
    }

    this.taskQueue.push(swarmTask);
    this.emit('task-submitted', swarmTask);
    
    // Sort queue by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return swarmTask.id;
  }

  /**
   * Get task status and result
   */
  getTask(taskId: string): SwarmTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get swarm statistics
   */
  getSwarmStats(): {
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    completedTasks: number;
    averageResponseTime: number;
    successRate: number;
  } {
    const activeAgents = Array.from(this.agents.values()).filter(a => a.status === 'active').length;
    const completedTasks = Array.from(this.tasks.values()).filter(t => t.status === 'completed').length;
    const allAgents = Array.from(this.agents.values());
    
    const avgResponseTime = allAgents.reduce((sum, agent) => sum + agent.performance.avgResponseTime, 0) / allAgents.length;
    const successRate = allAgents.reduce((sum, agent) => sum + agent.performance.successRate, 0) / allAgents.length;

    return {
      totalAgents: this.agents.size,
      activeAgents,
      totalTasks: this.tasks.size,
      completedTasks,
      averageResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100) / 100
    };
  }

  /**
   * Process tasks from the queue
   */
  private async startTaskProcessor(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    setInterval(async () => {
      if (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift()!;
        await this.processTask(task);
      }
    }, 100); // Process every 100ms
  }

  /**
   * Process a single task
   */
  private async processTask(task: SwarmTask): Promise<void> {
    // Find suitable agents for the task
    const suitableAgents = this.findSuitableAgents(task);
    
    if (suitableAgents.length === 0) {
      task.status = 'failed';
      this.emit('task-failed', task, 'No suitable agents available');
      return;
    }

    // Assign agents to task
    const assignedAgents = suitableAgents.slice(0, this.getOptimalAgentCount(task));
    task.assignedAgents = assignedAgents.map(a => a.id);
    task.status = 'in-progress';

    // Mark agents as busy
    assignedAgents.forEach(agent => {
      agent.currentTask = task.id;
      agent.status = 'active';
    });

    this.emit('task-started', task);

    try {
      // Simulate task processing
      const result = await this.executeTask(task, assignedAgents);
      
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;

      // Update agent performance
      assignedAgents.forEach(agent => {
        agent.performance.tasksCompleted++;
        agent.currentTask = undefined;
        agent.status = 'idle';
      });

      this.emit('task-completed', task);

    } catch (error) {
      task.status = 'failed';
      task.result = { error: error.message };

      // Update agent performance (failure)
      assignedAgents.forEach(agent => {
        agent.performance.successRate = Math.max(0, agent.performance.successRate - 1);
        agent.currentTask = undefined;
        agent.status = 'idle';
      });

      this.emit('task-failed', task, error.message);
    }
  }

  /**
   * Find agents suitable for a task
   */
  private findSuitableAgents(task: SwarmTask): SwarmAgent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.status === 'idle' && 
      agent.capabilities.some(cap => task.type.includes(cap.replace('-', '-')))
    );
  }

  /**
   * Determine optimal number of agents for a task
   */
  private getOptimalAgentCount(task: SwarmTask): number {
    switch (task.priority) {
      case 'critical': return 5;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  /**
   * Execute a task with assigned agents
   */
  private async executeTask(task: SwarmTask, agents: SwarmAgent[]): Promise<any> {
    // Simulate processing time based on task complexity and agent capabilities
    const baseTime = 100;
    const agentMultiplier = Math.max(0.2, 1 / agents.length);
    const processingTime = baseTime * agentMultiplier;

    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Generate mock results based on task type
    switch (task.type) {
      case 'property-analysis':
        return {
          propertyId: task.payload.propertyId,
          assessedValue: Math.round(Math.random() * 500000 + 100000),
          marketValue: Math.round(Math.random() * 600000 + 120000),
          confidence: 0.85 + Math.random() * 0.14,
          factors: ['location', 'size', 'condition', 'market-trends'],
          processedBy: agents.map(a => a.id),
          processingTime: processingTime
        };

      case 'cost-calculation':
        return {
          totalCost: Math.round(Math.random() * 50000 + 10000),
          breakdown: {
            materials: Math.round(Math.random() * 20000 + 5000),
            labor: Math.round(Math.random() * 15000 + 3000),
            permits: Math.round(Math.random() * 5000 + 1000),
            overhead: Math.round(Math.random() * 10000 + 1000)
          },
          confidence: 0.90 + Math.random() * 0.09,
          processedBy: agents.map(a => a.id),
          processingTime: processingTime
        };

      case 'market-research':
        return {
          marketTrends: {
            priceChange: (Math.random() - 0.5) * 20,
            volumeChange: (Math.random() - 0.5) * 30,
            demandLevel: Math.random() * 100
          },
          comparables: Math.floor(Math.random() * 20 + 5),
          confidence: 0.80 + Math.random() * 0.19,
          processedBy: agents.map(a => a.id),
          processingTime: processingTime
        };

      default:
        return {
          status: 'completed',
          message: 'Task processed successfully',
          processedBy: agents.map(a => a.id),
          processingTime: processingTime
        };
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown the swarm
   */
  shutdown(): void {
    this.isProcessing = false;
    this.agents.clear();
    this.tasks.clear();
    this.taskQueue = [];
    this.emit('swarm-shutdown');
  }
}

// Export singleton instance
export const swarmOrchestrator = new TerraFusionSwarmOrchestrator();
