/**
 * Production Terrafusion AI Service
 * Real AI provider integration replacing mock responses
 * 
 * Classification: Government AI Integration Platform
 * Security: Government-Grade Multi-Provider Architecture
 * Version: 2.0.0 Production Ready
 */

import { TerraFusionAIService } from './TerraFusionAIService';

interface AIProvider {
  name: string;
  endpoint: string;
  models: string[];
  security: string;
  dataClassification: string;
  isOperational: boolean;
}

interface AIRequest {
  prompt: string;
  model: string;
  provider: string;
  dataClassification: 'RED' | 'YELLOW' | 'GREEN';
  context?: any;
}

interface AIResponse {
  content: string;
  provider: string;
  model: string;
  latency: number;
  tokens: number;
  classification: string;
}

class OllamaProvider implements AIProvider {
  name = 'ollama';
  endpoint: string;
  models: string[];
  security: string;
  dataClassification: string;
  isOperational: boolean;

  constructor(config: { endpoint: string; models: string[]; security: string }) {
    this.endpoint = config.endpoint;
    this.models = config.models;
    this.security = config.security;
    this.dataClassification = 'RED';
    this.isOperational = false;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);
      if (response.ok) {
        this.isOperational = true;
        console.log('✅ Ollama provider initialized successfully');
      }
    } catch (error) {
      console.warn('⚠️ Ollama provider not available:', error);
    }
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (!this.isOperational) {
      throw new Error('Ollama provider is not operational');
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      return {
        content: data.response,
        provider: this.name,
        model: request.model,
        latency,
        tokens: data.eval_count || 0,
        classification: this.dataClassification
      };
    } catch (error) {
      throw new Error(`Ollama generation failed: ${error}`);
    }
  }
}

class OpenAIProvider implements AIProvider {
  name = 'openai';
  endpoint: string;
  models: string[];
  security: string;
  dataClassification: string;
  isOperational: boolean;
  private apiKey: string;

  constructor(config: { apiKey: string; model: string; compliance: string }) {
    this.apiKey = config.apiKey;
    this.endpoint = 'https://api.openai.com/v1';
    this.models = [config.model];
    this.security = config.compliance;
    this.dataClassification = 'YELLOW_GREEN_ONLY';
    this.isOperational = true;
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (request.dataClassification === 'RED') {
      throw new Error('OpenAI cannot process RED classified data');
    }

    const startTime = Date.now();

    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: request.model,
          messages: [{ role: 'user', content: request.prompt }],
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      return {
        content: data.choices[0].message.content,
        provider: this.name,
        model: request.model,
        latency,
        tokens: data.usage.total_tokens,
        classification: this.dataClassification
      };
    } catch (error) {
      throw new Error(`OpenAI generation failed: ${error}`);
    }
  }
}

class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  endpoint: string;
  models: string[];
  security: string;
  dataClassification: string;
  isOperational: boolean;
  private apiKey: string;

  constructor(config: { apiKey: string; model: string; dataClassification: string }) {
    this.apiKey = config.apiKey;
    this.endpoint = 'https://api.anthropic.com/v1';
    this.models = [config.model];
    this.security = 'FISMA_VALIDATED';
    this.dataClassification = config.dataClassification;
    this.isOperational = true;
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (request.dataClassification === 'RED' && this.dataClassification !== 'RED') {
      throw new Error('Anthropic cannot process RED classified data with current configuration');
    }

    const startTime = Date.now();

    try {
      const response = await fetch(`${this.endpoint}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: 4000,
          messages: [{ role: 'user', content: request.prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      return {
        content: data.content[0].text,
        provider: this.name,
        model: request.model,
        latency,
        tokens: data.usage.input_tokens + data.usage.output_tokens,
        classification: this.dataClassification
      };
    } catch (error) {
      throw new Error(`Anthropic generation failed: ${error}`);
    }
  }
}

export class ProductionTerraFusionAI extends TerraFusionAIService {
  private providers: Map<string, AIProvider> = new Map();
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor() {
    super();
    this.initializeProductionProviders();
  }

  private initializeProductionProviders(): void {
    console.log('🚀 Initializing Production AI Providers...');

    const ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    
    this.providers.set('local', new OllamaProvider({
      endpoint: ollamaEndpoint,
      models: ['llama3', 'mistral', 'codellama'],
      security: 'GOVERNMENT_GRADE'
    }));

    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo',
        compliance: 'FISMA_VALIDATED'
      }));
      console.log('✅ OpenAI provider initialized');
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicProvider({
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-opus',
        dataClassification: 'YELLOW_GREEN_ONLY'
      }));
      console.log('✅ Anthropic provider initialized');
    }

    console.log(`🎯 Production AI initialized with ${this.providers.size} providers`);
  }

  async processAIRequest(prompt: string, context?: any): Promise<string> {
    const request: AIRequest = {
      prompt,
      model: 'default',
      provider: 'auto',
      dataClassification: this.classifyData(prompt),
      context
    };

    const provider = this.selectOptimalProvider(request);
    const startTime = Date.now();

    try {
      const response = await provider.generateResponse(request);
      
      this.recordPerformanceMetrics(provider.name, response.latency);
      
      console.log(`🤖 AI Response generated in ${response.latency}ms via ${response.provider}`);
      
      return response.content;
    } catch (error) {
      console.error(`❌ AI request failed: ${error}`);
      return this.generateFallbackResponse(prompt);
    }
  }

  private classifyData(content: string): 'RED' | 'YELLOW' | 'GREEN' {
    const redKeywords = ['classified', 'secret', 'confidential', 'sensitive', 'personal'];
    const yellowKeywords = ['internal', 'proprietary', 'business', 'county'];
    
    const contentLower = content.toLowerCase();
    
    if (redKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'RED';
    }
    
    if (yellowKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'YELLOW';
    }
    
    return 'GREEN';
  }

  private selectOptimalProvider(request: AIRequest): AIProvider {
    if (request.dataClassification === 'RED') {
      const localProvider = this.providers.get('local');
      if (localProvider && localProvider.isOperational) {
        return localProvider;
      }
      throw new Error('No suitable provider for RED classified data');
    }

    const availableProviders = Array.from(this.providers.values())
      .filter(provider => provider.isOperational);

    if (availableProviders.length === 0) {
      throw new Error('No operational AI providers available');
    }

    return availableProviders[0];
  }

  private recordPerformanceMetrics(provider: string, latency: number): void {
    if (!this.performanceMetrics.has(provider)) {
      this.performanceMetrics.set(provider, []);
    }
    
    const metrics = this.performanceMetrics.get(provider)!;
    metrics.push(latency);
    
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  private generateFallbackResponse(prompt: string): string {
    return `I apologize, but I'm unable to process your request at the moment. Please try again later or contact support if the issue persists. Your request was: "${prompt.substring(0, 100)}..."`;
  }

  getPerformanceMetrics(): Record<string, { average: number; count: number }> {
    const metrics: Record<string, { average: number; count: number }> = {};
    
    for (const [provider, latencies] of this.performanceMetrics) {
      const average = latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
      metrics[provider] = {
        average: Math.round(average),
        count: latencies.length
      };
    }
    
    return metrics;
  }

  getProviderStatus(): Record<string, { operational: boolean; models: string[] }> {
    const status: Record<string, { operational: boolean; models: string[] }> = {};
    
    for (const [name, provider] of this.providers) {
      status[name] = {
        operational: provider.isOperational,
        models: provider.models
      };
    }
    
    return status;
  }
}