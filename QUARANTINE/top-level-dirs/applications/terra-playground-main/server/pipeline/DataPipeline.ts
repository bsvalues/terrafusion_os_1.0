import { EventEmitter } from 'events';
import { z } from 'zod';
import { Agent } from '../agents/core/Agent';
import { Redis } from 'ioredis';

const PipelineConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.any(),
  outputSchema: z.any(),
  batchSize: z.number().min(1).default(100),
  processingInterval: z.number().min(1000).default(5000),
  agentConfig: z.object({
    name: z.string(),
    description: z.string(),
    model: z.enum(['claude-3-opus', 'claude-3-sonnet', 'gpt-4-turbo']),
    temperature: z.number().min(0).max(1).default(0.7),
    maxTokens: z.number().min(1).max(4000).default(2000),
    memoryEnabled: z.boolean().default(true),
    tools: z.array(z.string()).default([])
  })
});

type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

export class DataPipeline extends EventEmitter {
  private config: PipelineConfig;
  private agent: Agent;
  private redis: Redis;
  private processing: boolean;
  private queue: any[];

  constructor(config: PipelineConfig) {
    super();
    this.config = PipelineConfigSchema.parse(config);
    this.agent = new Agent(this.config.agentConfig);
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.processing = false;
    this.queue = [];
  }

  async initialize(): Promise<void> {
    await this.agent.initialize();
    this.startProcessing();
  }

  private startProcessing(): void {
    setInterval(async () => {
      if (!this.processing && this.queue.length > 0) {
        await this.processBatch();
      }
    }, this.config.processingInterval);
  }

  async addToQueue(data: any): Promise<void> {
    try {
      const validatedData = this.config.inputSchema.parse(data);
      this.queue.push(validatedData);
      this.emit('queued', { data: validatedData, queueLength: this.queue.length });
    } catch (error) {
      this.emit('error', { error, data });
      throw error;
    }
  }

  private async processBatch(): Promise<void> {
    this.processing = true;
    const batch = this.queue.splice(0, this.config.batchSize);

    try {
      const results = await Promise.all(
        batch.map(async (data) => {
          const context = {
            inputSchema: this.config.inputSchema,
            outputSchema: this.config.outputSchema,
            timestamp: new Date().toISOString()
          };

          const response = await this.agent.process(JSON.stringify(data), context);
          const processedData = JSON.parse(response);

          const validatedOutput = this.config.outputSchema.parse(processedData);
          return validatedOutput;
        })
      );

      await this.saveResults(results);
      this.emit('processed', { count: results.length, results });
    } catch (error) {
      this.emit('error', { error, batch });
      this.queue.unshift(...batch);
    } finally {
      this.processing = false;
    }
  }

  private async saveResults(results: any[]): Promise<void> {
    const pipelineKey = `pipeline:${this.config.name}:results`;
    await this.redis.lpush(pipelineKey, ...results.map(r => JSON.stringify(r)));
    await this.redis.ltrim(pipelineKey, 0, 9999);
  }

  async getResults(limit: number = 100): Promise<any[]> {
    const pipelineKey = `pipeline:${this.config.name}:results`;
    const results = await this.redis.lrange(pipelineKey, 0, limit - 1);
    return results.map(r => JSON.parse(r));
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    this.emit('queueCleared');
  }

  async clearResults(): Promise<void> {
    const pipelineKey = `pipeline:${this.config.name}:results`;
    await this.redis.del(pipelineKey);
    this.emit('resultsCleared');
  }
} 