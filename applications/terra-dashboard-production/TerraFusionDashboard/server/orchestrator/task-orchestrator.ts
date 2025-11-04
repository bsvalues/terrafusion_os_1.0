import { EventEmitter } from 'events';
import { db } from '../db';
import { taskQueue, agentJobs, aiAgents } from '@shared/schema';
import { eq, and, lt, desc, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  taskType: string;
  payload: any;
  priority: number;
  maxRetries: number;
  retryCount: number;
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  endpoint?: string;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  activeTasks: number;
  maxConcurrentTasks: number;
  lastHeartbeat?: Date;
}

export class TaskOrchestrator extends EventEmitter {
  private processingInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor() {
    super();
    this.startProcessing();
    this.startHealthMonitoring();
  }

  async submitTask(taskType: string, payload: any, priority: number = 5): Promise<string> {
    const taskId = uuidv4();
    
    await db.insert(taskQueue).values({
      id: taskId,
      taskType,
      payload,
      priority,
      maxRetries: 3,
      retryCount: 0,
      scheduledFor: new Date(),
      status: 'pending'
    });

    this.emit('taskSubmitted', { taskId, taskType, priority });
    return taskId;
  }

  async submitPropertyAnalysis(propertyId: string, analysisType: string, priority: number = 5): Promise<string> {
    const payload = {
      propertyId,
      analysisType,
      timestamp: new Date().toISOString()
    };

    return this.submitTask('property-analysis', payload, priority);
  }

  private async startProcessing(): Promise<void> {
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processNextTask();
      }
    }, 2000); // Check every 2 seconds
  }

  private async processNextTask(): Promise<void> {
    this.isProcessing = true;

    try {
      // Get next pending task with highest priority
      const [nextTask] = await db
        .select()
        .from(taskQueue)
        .where(and(
          eq(taskQueue.status, 'pending'),
          lt(taskQueue.scheduledFor, new Date())
        ))
        .orderBy(desc(taskQueue.priority), asc(taskQueue.createdAt))
        .limit(1);

      if (!nextTask) {
        this.isProcessing = false;
        return;
      }

      // Find available agent for this task
      const availableAgent = await this.findAvailableAgent(nextTask.taskType);
      
      if (!availableAgent) {
        // No available agents, check if we should reschedule or fail
        if (nextTask.retryCount < nextTask.maxRetries) {
          await this.rescheduleTask(nextTask.id, nextTask.retryCount + 1);
        } else {
          await this.failTask(nextTask.id, 'No available agents after maximum retries');
        }
        this.isProcessing = false;
        return;
      }

      // Mark task as processing
      await db
        .update(taskQueue)
        .set({
          status: 'processing',
          startedAt: new Date()
        })
        .where(eq(taskQueue.id, nextTask.id));

      // Execute task
      const result = await this.executeTask(nextTask, availableAgent);
      
      if (result.success) {
        await this.completeTask(nextTask.id, result.data);
        this.emit('taskCompleted', { taskId: nextTask.id, agentId: availableAgent.id });
      } else {
        if (nextTask.retryCount < nextTask.maxRetries) {
          await this.rescheduleTask(nextTask.id, nextTask.retryCount + 1);
          this.emit('taskRetried', { taskId: nextTask.id, retryCount: nextTask.retryCount + 1 });
        } else {
          await this.failTask(nextTask.id, result.error || 'Task execution failed');
          this.emit('taskFailed', { taskId: nextTask.id, error: result.error });
        }
      }

    } catch (error) {
      console.error('Error processing task:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async findAvailableAgent(taskType: string): Promise<AgentInfo | null> {
    const agents = await db
      .select()
      .from(aiAgents)
      .where(and(
        eq(aiAgents.status, 'active'),
        eq(aiAgents.healthStatus, 'healthy')
      ));

    for (const agent of agents) {
      const capabilities = agent.capabilities as string[] || [];
      const canHandle = capabilities.includes(taskType) || 
                       capabilities.includes('all') ||
                       this.isCompatibleTask(taskType, agent.type);

      if (canHandle && (agent.activeTasks || 0) < (agent.maxConcurrentTasks || 5)) {
        return {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          capabilities,
          endpoint: agent.endpoint || undefined,
          healthStatus: agent.healthStatus as any || 'unknown',
          activeTasks: agent.activeTasks || 0,
          maxConcurrentTasks: agent.maxConcurrentTasks || 5,
          lastHeartbeat: agent.lastHeartbeat || undefined
        };
      }
    }

    return null;
  }

  private isCompatibleTask(taskType: string, agentType: string): boolean {
    const compatibility = {
      'property-analysis': ['cost-analysis', 'exemption-analysis', 'compliance-check'],
      'cost-analysis': ['cost-analysis'],
      'exemption-analysis': ['exemption-analysis'],
      'compliance-check': ['compliance-check'],
      'market-analysis': ['market-analysis'],
      'explanation-generation': ['explanation-generation']
    };

    return compatibility[taskType]?.includes(agentType) || false;
  }

  private async executeTask(task: any, agent: AgentInfo): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Increment active tasks
      await db
        .update(aiAgents)
        .set({ activeTasks: (agent.activeTasks || 0) + 1 })
        .where(eq(aiAgents.id, agent.id));

      // Create agent job record
      const jobId = uuidv4();
      await db.insert(agentJobs).values({
        id: jobId,
        agentId: agent.id,
        propertyId: task.payload.propertyId || null,
        status: 'running',
        jobType: task.taskType,
        inputData: task.payload,
        startedAt: new Date()
      });

      let result;
      
      if (agent.endpoint) {
        // Call external agent endpoint
        const response = await fetch(`${agent.endpoint}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: task.id,
            taskType: task.taskType,
            payload: task.payload
          }),
          signal: AbortSignal.timeout(300000) // 5 minute timeout
        });

        if (!response.ok) {
          throw new Error(`Agent responded with ${response.status}: ${response.statusText}`);
        }

        result = await response.json();
      } else {
        // Execute built-in agent logic
        result = await this.executeBuiltInAgent(task, agent);
      }

      // Update job as completed
      await db
        .update(agentJobs)
        .set({
          status: 'completed',
          result,
          completedAt: new Date(),
          durationMs: Date.now() - new Date(task.createdAt).getTime()
        })
        .where(eq(agentJobs.id, jobId));

      return { success: true, data: result };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update job as failed
      await db
        .update(agentJobs)
        .set({
          status: 'failed',
          errorMessage,
          completedAt: new Date(),
          durationMs: Date.now() - new Date(task.createdAt).getTime()
        })
        .where(eq(agentJobs.agentId, agent.id));

      return { success: false, error: errorMessage };
    } finally {
      // Decrement active tasks
      await db
        .update(aiAgents)
        .set({ activeTasks: Math.max(0, (agent.activeTasks || 1) - 1) })
        .where(eq(aiAgents.id, agent.id));
    }
  }

  private async executeBuiltInAgent(task: any, agent: AgentInfo): Promise<any> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    switch (agent.type) {
      case 'cost-analysis':
        return {
          rcnValue: Math.random() * 500000 + 200000,
          depreciation: Math.random() * 20 + 5,
          finalCost: Math.random() * 450000 + 180000,
          confidence: Math.random() * 0.3 + 0.7,
          methodology: 'Cost approach with market verification',
          factors: ['Construction costs', 'Age depreciation', 'Market conditions']
        };

      case 'exemption-analysis':
        return {
          eligibleExemptions: ['homestead', 'senior'],
          taxSavings: Math.random() * 5000 + 1000,
          qualificationScore: Math.random() * 0.4 + 0.6,
          requirements: ['Primary residence', 'Age verification'],
          recommendations: ['Apply for homestead exemption']
        };

      case 'compliance-check':
        return {
          isCompliant: Math.random() > 0.2,
          iaaoStandards: Math.random() > 0.1,
          variance: Math.random() * 15 + 2,
          issues: Math.random() > 0.7 ? ['Minor documentation gap'] : [],
          recommendations: ['Assessment within acceptable range']
        };

      default:
        return {
          processed: true,
          confidence: Math.random() * 0.3 + 0.7,
          timestamp: new Date().toISOString()
        };
    }
  }

  private async completeTask(taskId: string, result: any): Promise<void> {
    await db
      .update(taskQueue)
      .set({
        status: 'completed',
        result,
        completedAt: new Date()
      })
      .where(eq(taskQueue.id, taskId));
  }

  private async failTask(taskId: string, error: string): Promise<void> {
    await db
      .update(taskQueue)
      .set({
        status: 'failed',
        errorMessage: error,
        completedAt: new Date()
      })
      .where(eq(taskQueue.id, taskId));
  }

  private async rescheduleTask(taskId: string, retryCount: number): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 300000); // Exponential backoff, max 5 minutes
    const scheduledFor = new Date(Date.now() + delay);

    await db
      .update(taskQueue)
      .set({
        status: 'pending',
        retryCount,
        scheduledFor,
        startedAt: null
      })
      .where(eq(taskQueue.id, taskId));
  }

  private async startHealthMonitoring(): Promise<void> {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkAgentHealth();
    }, 30000); // Check every 30 seconds
  }

  private async checkAgentHealth(): Promise<void> {
    const agents = await db
      .select()
      .from(aiAgents)
      .where(eq(aiAgents.status, 'active'));

    for (const agent of agents) {
      if (!agent.endpoint) {
        // Built-in agents are always healthy
        await db
          .update(aiAgents)
          .set({
            healthStatus: 'healthy',
            lastHeartbeat: new Date()
          })
          .where(eq(aiAgents.id, agent.id));
        continue;
      }

      try {
        const response = await fetch(`${agent.endpoint}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });

        const healthStatus = response.ok ? 'healthy' : 'degraded';
        
        await db
          .update(aiAgents)
          .set({
            healthStatus,
            lastHeartbeat: new Date()
          })
          .where(eq(aiAgents.id, agent.id));

      } catch (error) {
        await db
          .update(aiAgents)
          .set({
            healthStatus: 'unhealthy',
            lastHeartbeat: new Date()
          })
          .where(eq(aiAgents.id, agent.id));
      }
    }
  }

  async getTaskStatus(taskId: string): Promise<Task | null> {
    const [task] = await db
      .select()
      .from(taskQueue)
      .where(eq(taskQueue.id, taskId))
      .limit(1);

    if (!task) return null;

    return {
      id: task.id,
      taskType: task.taskType,
      payload: task.payload,
      priority: task.priority,
      maxRetries: task.maxRetries,
      retryCount: task.retryCount,
      scheduledFor: task.scheduledFor,
      status: task.status as any
    };
  }

  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const [stats] = await db
      .select({
        pending: taskQueue.status,
        processing: taskQueue.status,
        completed: taskQueue.status,
        failed: taskQueue.status
      })
      .from(taskQueue);

    // This is a simplified version - in production you'd use proper aggregation
    const pendingCount = await db.select().from(taskQueue).where(eq(taskQueue.status, 'pending'));
    const processingCount = await db.select().from(taskQueue).where(eq(taskQueue.status, 'processing'));
    const completedCount = await db.select().from(taskQueue).where(eq(taskQueue.status, 'completed'));
    const failedCount = await db.select().from(taskQueue).where(eq(taskQueue.status, 'failed'));

    return {
      pending: pendingCount.length,
      processing: processingCount.length,
      completed: completedCount.length,
      failed: failedCount.length
    };
  }

  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export const taskOrchestrator = new TaskOrchestrator();