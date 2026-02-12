import { z } from 'zod';
import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';

const AgentConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  model: z.enum(['claude-3-opus', 'claude-3-sonnet', 'gpt-4-turbo']),
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().min(1).max(4000).default(2000),
  memoryEnabled: z.boolean().default(true),
  tools: z.array(z.string()).default([])
});

type AgentConfig = z.infer<typeof AgentConfigSchema>;

export class Agent extends EventEmitter {
  private config: AgentConfig;
  private anthropic: Anthropic;
  private openai: OpenAI;
  private redis: Redis;
  private memory: Map<string, any>;

  constructor(config: AgentConfig) {
    super();
    this.config = AgentConfigSchema.parse(config);
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.memory = new Map();
  }

  async initialize(): Promise<void> {
    if (this.config.memoryEnabled) {
      await this.loadMemory();
    }
  }

  private async loadMemory(): Promise<void> {
    const keys = await this.redis.keys(`agent:${this.config.name}:*`);
    for (const key of keys) {
      const value = await this.redis.get(key);
      if (value) {
        this.memory.set(key, JSON.parse(value));
      }
    }
  }

  private async saveMemory(): Promise<void> {
    for (const [key, value] of this.memory.entries()) {
      await this.redis.set(key, JSON.stringify(value));
    }
  }

  async process(input: string, context?: Record<string, any>): Promise<string> {
    try {
      const prompt = this.buildPrompt(input, context);
      let response: string;

      if (this.config.model.startsWith('claude')) {
        response = await this.processWithClaude(prompt);
      } else {
        response = await this.processWithGPT(prompt);
      }

      if (this.config.memoryEnabled) {
        this.memory.set(`interaction:${Date.now()}`, { input, response, context });
        await this.saveMemory();
      }

      this.emit('response', { input, response, context });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private buildPrompt(input: string, context?: Record<string, any>): string {
    let prompt = `You are ${this.config.name}, ${this.config.description}\n\n`;
    
    if (context) {
      prompt += `Context: ${JSON.stringify(context)}\n\n`;
    }

    if (this.config.memoryEnabled && this.memory.size > 0) {
      prompt += 'Previous interactions:\n';
      for (const [_, value] of this.memory.entries()) {
        prompt += `Input: ${value.input}\nResponse: ${value.response}\n\n`;
      }
    }

    prompt += `Current input: ${input}`;
    return prompt;
  }

  private async processWithClaude(prompt: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [{ role: 'user', content: prompt }]
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  private async processWithGPT(prompt: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content || '';
  }

  async clearMemory(): Promise<void> {
    this.memory.clear();
    const keys = await this.redis.keys(`agent:${this.config.name}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
} 