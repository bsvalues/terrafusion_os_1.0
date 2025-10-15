import { EventEmitter } from 'events';

export interface AIProvider {
  id: string;
  name: string;
  type: 'cloud' | 'local' | 'hybrid';
  status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  apiEndpoint?: string;
  apiKey?: string;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    concurrentRequests: number;
  };
  pricing: {
    inputTokenCost: number;
    outputTokenCost: number;
    currency: string;
  };
  capabilities: string[];
  metadata: {
    region?: string;
    version: string;
    lastUpdated: Date;
    deploymentModel: 'sovereign' | 'federated';
    isolationLevel: 'county' | 'regional' | 'shared';
  };
}

export interface AIModel {
  id: string;
  name: string;
  providerId: string;
  type: 'language' | 'vision' | 'embedding' | 'classification' | 'generation';
  status: 'available' | 'unavailable' | 'deprecated' | 'beta';
  specifications: {
    maxTokens: number;
    contextWindow: number;
    trainingCutoff?: string;
    languages: string[];
    specializations: string[];
  };
  performance: {
    accuracy: number;
    speed: number; // tokens per second
    reliability: number;
    costEfficiency: number;
  };
  usageStats: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
    errorRate: number;
  };
  configuration: {
    temperature: number;
    topP: number;
    maxTokens: number;
    stopSequences: string[];
  };
}

export interface ModelRequest {
  id: string;
  modelId: string;
  prompt: string;
  parameters?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  retryCount: number;
  metadata: {
    userId?: string;
    sessionId?: string;
    taskType?: string;
    jurisdiction?: string;
  };
}

export interface ModelResponse {
  requestId: string;
  modelId: string;
  response: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  };
  performance: {
    responseTime: number;
    queueTime: number;
    processingTime: number;
  };
  metadata: {
    timestamp: Date;
    model: string;
    provider: string;
    confidence?: number;
  };
}

export interface LoadBalancingStrategy {
  type: 'round_robin' | 'least_loaded' | 'cost_optimized' | 'performance_optimized' | 'intelligent';
  parameters: Record<string, any>;
}

export class AIModelHub extends EventEmitter {
  private providers: Map<string, AIProvider> = new Map();
  private models: Map<string, AIModel> = new Map();
  private requestQueue: ModelRequest[] = [];
  private activeRequests: Map<string, ModelRequest> = new Map();
  private loadBalancingStrategy: LoadBalancingStrategy;
  private isInitialized = false;

  constructor() {
    super();
    this.loadBalancingStrategy = {
      type: 'intelligent',
      parameters: {
        costWeight: 0.3,
        performanceWeight: 0.4,
        reliabilityWeight: 0.3
      }
    };
  }

  /**
   * Initialize the AI Model Hub
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧠 AI Model Hub initializing...');
    
    // Initialize providers
    await this.initializeProviders();
    
    // Initialize models
    await this.initializeModels();
    
    // Start monitoring
    this.startMonitoring();
    
    // Start request processing
    this.startRequestProcessor();
    
    this.isInitialized = true;
    console.log('✅ AI Model Hub ready');
    console.log(`   Providers: ${this.providers.size}`);
    console.log(`   Models: ${this.models.size}`);
    
    this.emit('initialized');
  }

  /**
   * Initialize AI providers
   */
  private async initializeProviders(): Promise<void> {
    const providerConfigs: Partial<AIProvider>[] = [
      {
        id: 'anthropic',
        name: 'Anthropic',
        type: 'cloud',
        status: 'connected',
        apiEndpoint: 'https://api.anthropic.com/v1',
        rateLimits: {
          requestsPerMinute: 1000,
          tokensPerMinute: 100000,
          concurrentRequests: 50
        },
        pricing: {
          inputTokenCost: 0.000008,
          outputTokenCost: 0.000024,
          currency: 'USD'
        },
        capabilities: ['text_generation', 'analysis', 'reasoning', 'coding'],
        metadata: {
          region: 'us-east-1',
          version: '2024-01-01',
          lastUpdated: new Date(),
          deploymentModel: 'sovereign',
          isolationLevel: 'county'
        }
      },
      {
        id: 'openai',
        name: 'OpenAI',
        type: 'cloud',
        status: 'connected',
        apiEndpoint: 'https://api.openai.com/v1',
        rateLimits: {
          requestsPerMinute: 3000,
          tokensPerMinute: 150000,
          concurrentRequests: 100
        },
        pricing: {
          inputTokenCost: 0.00001,
          outputTokenCost: 0.00003,
          currency: 'USD'
        },
        capabilities: ['text_generation', 'vision', 'embeddings', 'fine_tuning'],
        metadata: {
          region: 'us-west-2',
          version: '4.0',
          lastUpdated: new Date(),
          deploymentModel: 'sovereign',
          isolationLevel: 'county'
        }
      },
      {
        id: 'google',
        name: 'Google AI',
        type: 'cloud',
        status: 'connected',
        apiEndpoint: 'https://generativelanguage.googleapis.com/v1',
        rateLimits: {
          requestsPerMinute: 2000,
          tokensPerMinute: 120000,
          concurrentRequests: 75
        },
        pricing: {
          inputTokenCost: 0.000005,
          outputTokenCost: 0.000015,
          currency: 'USD'
        },
        capabilities: ['text_generation', 'vision', 'embeddings', 'multimodal'],
        metadata: {
          region: 'us-central-1',
          version: '2.1',
          lastUpdated: new Date(),
          deploymentModel: 'sovereign',
          isolationLevel: 'county'
        }
      },
      {
        id: 'local_llama',
        name: 'Local Llama',
        type: 'local',
        status: 'connected',
        apiEndpoint: 'http://localhost:11434/v1',
        rateLimits: {
          requestsPerMinute: 500,
          tokensPerMinute: 50000,
          concurrentRequests: 10
        },
        pricing: {
          inputTokenCost: 0,
          outputTokenCost: 0,
          currency: 'USD'
        },
        capabilities: ['text_generation', 'privacy_focused', 'offline'],
        metadata: {
          region: 'local',
          version: '1.0.0',
          lastUpdated: new Date(),
          deploymentModel: 'sovereign',
          isolationLevel: 'county'
        }
      },
      {
        id: 'azure_openai',
        name: 'Azure OpenAI',
        type: 'cloud',
        status: 'connected',
        apiEndpoint: 'https://terrafusion.openai.azure.com/openai/deployments',
        rateLimits: {
          requestsPerMinute: 2500,
          tokensPerMinute: 200000,
          concurrentRequests: 80
        },
        pricing: {
          inputTokenCost: 0.00001,
          outputTokenCost: 0.00003,
          currency: 'USD'
        },
        capabilities: ['text_generation', 'enterprise_grade', 'compliance'],
        metadata: {
          region: 'eastus',
          version: '2024-02-15',
          lastUpdated: new Date(),
          deploymentModel: 'federated',
          isolationLevel: 'regional'
        }
      }
    ];

    for (const config of providerConfigs) {
      const provider = await this.createProvider(config);
      this.providers.set(provider.id, provider);
    }

    console.log(`   Providers initialized: ${this.providers.size}`);
  }

  /**
   * Create a new AI provider
   */
  private async createProvider(config: Partial<AIProvider>): Promise<AIProvider> {
    const provider: AIProvider = {
      id: config.id!,
      name: config.name!,
      type: config.type!,
      status: 'disconnected',
      apiEndpoint: config.apiEndpoint,
      apiKey: process.env[`${config.id!.toUpperCase()}_API_KEY`],
      rateLimits: config.rateLimits!,
      pricing: config.pricing!,
      capabilities: config.capabilities!,
      metadata: config.metadata!
    };

    // Test connection
    try {
      await this.testProviderConnection(provider);
      provider.status = 'connected';
      console.log(`   ✅ Connected to ${provider.name}`);
    } catch (error) {
      provider.status = 'error';
      console.log(`   ❌ Failed to connect to ${provider.name}: ${error.message}`);
    }

    return provider;
  }

  /**
   * Test provider connection
   */
  private async testProviderConnection(provider: AIProvider): Promise<void> {
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    if (Math.random() < 0.9) { // 90% success rate
      return;
    } else {
      throw new Error(`Connection timeout to ${provider.name}`);
    }
  }

  /**
   * Initialize AI models
   */
  private async initializeModels(): Promise<void> {
    const modelConfigs: Partial<AIModel>[] = [
      // Anthropic Models
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        providerId: 'anthropic',
        type: 'language',
        status: 'available',
        specifications: {
          maxTokens: 4096,
          contextWindow: 200000,
          trainingCutoff: '2024-04-01',
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
          specializations: ['reasoning', 'analysis', 'coding', 'writing']
        },
        performance: {
          accuracy: 0.95,
          speed: 25,
          reliability: 0.98,
          costEfficiency: 0.75
        },
        configuration: {
          temperature: 0.7,
          topP: 0.9,
          maxTokens: 4096,
          stopSequences: []
        }
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        providerId: 'anthropic',
        type: 'language',
        status: 'available',
        specifications: {
          maxTokens: 4096,
          contextWindow: 200000,
          trainingCutoff: '2024-04-01',
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
          specializations: ['balanced', 'general', 'speed']
        },
        performance: {
          accuracy: 0.92,
          speed: 45,
          reliability: 0.97,
          costEfficiency: 0.88
        },
        configuration: {
          temperature: 0.7,
          topP: 0.9,
          maxTokens: 4096,
          stopSequences: []
        }
      },
      // OpenAI Models
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        providerId: 'openai',
        type: 'language',
        status: 'available',
        specifications: {
          maxTokens: 4096,
          contextWindow: 128000,
          trainingCutoff: '2024-04-01',
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
          specializations: ['creative', 'coding', 'problem_solving']
        },
        performance: {
          accuracy: 0.94,
          speed: 35,
          reliability: 0.96,
          costEfficiency: 0.80
        },
        configuration: {
          temperature: 0.7,
          topP: 0.9,
          maxTokens: 4096,
          stopSequences: []
        }
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        providerId: 'openai',
        type: 'language',
        status: 'available',
        specifications: {
          maxTokens: 4096,
          contextWindow: 16385,
          trainingCutoff: '2021-09-01',
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
          specializations: ['speed', 'general', 'cost_effective']
        },
        performance: {
          accuracy: 0.88,
          speed: 80,
          reliability: 0.95,
          costEfficiency: 0.95
        },
        configuration: {
          temperature: 0.7,
          topP: 0.9,
          maxTokens: 4096,
          stopSequences: []
        }
      },
      // Google Models
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        providerId: 'google',
        type: 'language',
        status: 'available',
        specifications: {
          maxTokens: 8192,
          contextWindow: 32768,
          trainingCutoff: '2024-02-01',
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
          specializations: ['multimodal', 'reasoning', 'factual']
        },
        performance: {
          accuracy: 0.91,
          speed: 40,
          reliability: 0.94,
          costEfficiency: 0.85
        },
        configuration: {
          temperature: 0.7,
          topP: 0.9,
          maxTokens: 8192,
          stopSequences: []
        }
      },
      // Local Models
      {
        id: 'llama-2-70b',
        name: 'Llama 2 70B',
        providerId: 'local_llama',
        type: 'language',
        status: 'available',
        specifications: {
          maxTokens: 4096,
          contextWindow: 4096,
          trainingCutoff: '2023-07-01',
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
          specializations: ['privacy', 'offline', 'open_source']
        },
        performance: {
          accuracy: 0.85,
          speed: 15,
          reliability: 0.92,
          costEfficiency: 1.0
        },
        configuration: {
          temperature: 0.7,
          topP: 0.9,
          maxTokens: 4096,
          stopSequences: []
        }
      }
    ];

    for (const config of modelConfigs) {
      const model = await this.createModel(config);
      this.models.set(model.id, model);
    }

    console.log(`   Models initialized: ${this.models.size}`);
  }

  /**
   * Create a new AI model
   */
  private async createModel(config: Partial<AIModel>): Promise<AIModel> {
    const model: AIModel = {
      id: config.id!,
      name: config.name!,
      providerId: config.providerId!,
      type: config.type!,
      status: config.status!,
      specifications: config.specifications!,
      performance: config.performance!,
      usageStats: {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        averageResponseTime: 0,
        errorRate: 0
      },
      configuration: config.configuration!
    };

    return model;
  }

  /**
   * Submit a request to the model hub
   */
  async submitRequest(request: Omit<ModelRequest, 'id'>): Promise<string> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullRequest: ModelRequest = {
      id: requestId,
      ...request
    };

    // Add to queue
    this.requestQueue.push(fullRequest);
    
    console.log(`📨 Request ${requestId} queued for model ${request.modelId}`);
    
    this.emit('request-queued', fullRequest);
    
    // Process queue
    this.processRequestQueue();
    
    return requestId;
  }

  /**
   * Submit request with intelligent model selection
   */
  async submitIntelligentRequest(
    prompt: string,
    requirements: {
      taskType: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      maxCost?: number;
      minAccuracy?: number;
      maxResponseTime?: number;
    }
  ): Promise<string> {
    const optimalModel = this.selectOptimalModel(requirements);
    
    if (!optimalModel) {
      throw new Error('No suitable model found for requirements');
    }

    return this.submitRequest({
      modelId: optimalModel.id,
      prompt,
      priority: requirements.priority,
      timeout: requirements.maxResponseTime || 30000,
      retryCount: 3,
      metadata: {
        taskType: requirements.taskType
      }
    });
  }

  /**
   * Select optimal model based on requirements
   */
  private selectOptimalModel(requirements: any): AIModel | null {
    const availableModels = Array.from(this.models.values())
      .filter(model => {
        const provider = this.providers.get(model.providerId);
        return model.status === 'available' && provider?.status === 'connected';
      });

    if (availableModels.length === 0) return null;

    // Apply filters
    let filteredModels = availableModels;

    if (requirements.minAccuracy) {
      filteredModels = filteredModels.filter(m => m.performance.accuracy >= requirements.minAccuracy);
    }

    if (requirements.maxCost) {
      filteredModels = filteredModels.filter(m => {
        const provider = this.providers.get(m.providerId)!;
        const estimatedCost = (provider.pricing.inputTokenCost + provider.pricing.outputTokenCost) * 1000; // Estimate for 1000 tokens
        return estimatedCost <= requirements.maxCost;
      });
    }

    if (filteredModels.length === 0) return availableModels[0]; // Fallback

    // Score models based on strategy
    const scoredModels = filteredModels.map(model => {
      const provider = this.providers.get(model.providerId)!;
      
      const costScore = 1 - ((provider.pricing.inputTokenCost + provider.pricing.outputTokenCost) / 0.0001); // Normalize
      const performanceScore = (model.performance.accuracy + model.performance.reliability) / 2;
      const speedScore = Math.min(model.performance.speed / 100, 1);

      const totalScore = 
        (costScore * this.loadBalancingStrategy.parameters.costWeight) +
        (performanceScore * this.loadBalancingStrategy.parameters.performanceWeight) +
        (speedScore * this.loadBalancingStrategy.parameters.reliabilityWeight);

      return { model, score: totalScore };
    });

    // Sort by score and return best
    scoredModels.sort((a, b) => b.score - a.score);
    return scoredModels[0].model;
  }

  /**
   * Process request queue
   */
  private processRequestQueue(): void {
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      this.processRequest(request);
    }
  }

  /**
   * Process individual request
   */
  private async processRequest(request: ModelRequest): Promise<void> {
    const model = this.models.get(request.modelId);
    const provider = model ? this.providers.get(model.providerId) : null;

    if (!model || !provider) {
      this.emit('request-failed', { 
        requestId: request.id, 
        error: 'Model or provider not found' 
      });
      return;
    }

    if (provider.status !== 'connected') {
      this.emit('request-failed', { 
        requestId: request.id, 
        error: 'Provider not connected' 
      });
      return;
    }

    this.activeRequests.set(request.id, request);
    
    const startTime = Date.now();
    
    try {
      // Simulate API call
      const response = await this.callModelAPI(model, provider, request);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Update usage stats
      this.updateUsageStats(model, response, responseTime);

      this.emit('request-completed', response);
      
    } catch (error) {
      this.emit('request-failed', { 
        requestId: request.id, 
        error: error.message 
      });
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  /**
   * Call model API (simulated)
   */
  private async callModelAPI(model: AIModel, provider: AIProvider, request: ModelRequest): Promise<ModelResponse> {
    // Simulate API call delay
    const baseDelay = 1000 / model.performance.speed; // Convert speed to delay
    const actualDelay = baseDelay + (Math.random() * baseDelay);
    
    await new Promise(resolve => setTimeout(resolve, actualDelay));

    // Simulate occasional failures
    if (Math.random() < 0.02) { // 2% failure rate
      throw new Error('API request failed');
    }

    // Generate mock response
    const inputTokens = Math.floor(request.prompt.length / 4); // Rough estimate
    const outputTokens = Math.floor(Math.random() * 1000 + 200);
    const totalTokens = inputTokens + outputTokens;
    const cost = (inputTokens * provider.pricing.inputTokenCost) + (outputTokens * provider.pricing.outputTokenCost);

    const response: ModelResponse = {
      requestId: request.id,
      modelId: model.id,
      response: this.generateMockResponse(request),
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        cost
      },
      performance: {
        responseTime: actualDelay,
        queueTime: 0,
        processingTime: actualDelay
      },
      metadata: {
        timestamp: new Date(),
        model: model.name,
        provider: provider.name,
        confidence: 0.8 + Math.random() * 0.2
      }
    };

    return response;
  }

  /**
   * Generate mock response based on request
   */
  private generateMockResponse(request: ModelRequest): string {
    const responses = [
      'Based on the analysis, I recommend implementing the proposed solution with careful consideration of the identified risk factors.',
      'The data indicates strong potential for revenue optimization through the suggested approach.',
      'After reviewing the requirements, the most effective strategy would be to focus on the high-priority items first.',
      'The assessment reveals several opportunities for improvement that align with government best practices.',
      'Implementation should proceed in phases to ensure proper validation and risk mitigation.'
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Update model usage statistics
   */
  private updateUsageStats(model: AIModel, response: ModelResponse, responseTime: number): void {
    model.usageStats.totalRequests++;
    model.usageStats.totalTokens += response.usage.totalTokens;
    model.usageStats.totalCost += response.usage.cost;
    
    // Update average response time
    const totalTime = model.usageStats.averageResponseTime * (model.usageStats.totalRequests - 1) + responseTime;
    model.usageStats.averageResponseTime = totalTime / model.usageStats.totalRequests;
  }

  /**
   * Start monitoring system
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.updateProviderStatus();
      this.updateModelPerformance();
      this.optimizeLoadBalancing();
    }, 60000); // Every minute

    console.log('   Model hub monitoring started');
  }

  /**
   * Start request processor
   */
  private startRequestProcessor(): void {
    setInterval(() => {
      this.processRequestQueue();
    }, 1000); // Every second

    console.log('   Request processor started');
  }

  /**
   * Update provider status
   */
  private updateProviderStatus(): void {
    for (const provider of this.providers.values()) {
      // Simulate occasional provider issues
      if (Math.random() < 0.01) { // 1% chance of temporary issue
        provider.status = 'maintenance';
        setTimeout(() => {
          provider.status = 'connected';
        }, 30000); // 30 seconds maintenance
      }
    }
  }

  /**
   * Update model performance metrics
   */
  private updateModelPerformance(): void {
    for (const model of this.models.values()) {
      // Simulate performance fluctuations
      model.performance.speed += (Math.random() - 0.5) * 2;
      model.performance.speed = Math.max(1, Math.min(100, model.performance.speed));
      
      model.performance.reliability += (Math.random() - 0.5) * 0.02;
      model.performance.reliability = Math.max(0.8, Math.min(1.0, model.performance.reliability));
    }
  }

  /**
   * Optimize load balancing strategy
   */
  private optimizeLoadBalancing(): void {
    // Analyze recent performance and adjust weights
    const recentPerformance = this.analyzeRecentPerformance();
    
    if (recentPerformance.costEffectiveness < 0.7) {
      this.loadBalancingStrategy.parameters.costWeight += 0.05;
    }
    
    if (recentPerformance.averageAccuracy < 0.9) {
      this.loadBalancingStrategy.parameters.performanceWeight += 0.05;
    }

    // Normalize weights
    const totalWeight = Object.values(this.loadBalancingStrategy.parameters).reduce((sum, weight) => sum + weight, 0);
    for (const key in this.loadBalancingStrategy.parameters) {
      this.loadBalancingStrategy.parameters[key] /= totalWeight;
    }
  }

  /**
   * Analyze recent performance
   */
  private analyzeRecentPerformance(): any {
    const models = Array.from(this.models.values());
    
    const avgAccuracy = models.reduce((sum, m) => sum + m.performance.accuracy, 0) / models.length;
    const avgCostEfficiency = models.reduce((sum, m) => sum + m.performance.costEfficiency, 0) / models.length;
    
    return {
      averageAccuracy: avgAccuracy,
      costEffectiveness: avgCostEfficiency
    };
  }

  /**
   * Get hub status
   */
  getHubStatus(): any {
    const providersByStatus = {
      connected: 0,
      disconnected: 0,
      error: 0,
      maintenance: 0
    };

    const modelsByStatus = {
      available: 0,
      unavailable: 0,
      deprecated: 0,
      beta: 0
    };

    for (const provider of this.providers.values()) {
      providersByStatus[provider.status]++;
    }

    for (const model of this.models.values()) {
      modelsByStatus[model.status]++;
    }

    return {
      totalProviders: this.providers.size,
      totalModels: this.models.size,
      providersByStatus,
      modelsByStatus,
      requestQueue: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      loadBalancingStrategy: this.loadBalancingStrategy
    };
  }

  /**
   * Get provider details
   */
  getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get model details
   */
  getModel(modelId: string): AIModel | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all providers
   */
  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all models
   */
  getAllModels(): AIModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get usage statistics
   */
  getUsageStatistics(): any {
    const totalStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0
    };

    const modelStats: Record<string, any> = {};

    for (const model of this.models.values()) {
      totalStats.totalRequests += model.usageStats.totalRequests;
      totalStats.totalTokens += model.usageStats.totalTokens;
      totalStats.totalCost += model.usageStats.totalCost;
      
      modelStats[model.id] = { ...model.usageStats };
    }

    if (totalStats.totalRequests > 0) {
      totalStats.averageResponseTime = Array.from(this.models.values())
        .reduce((sum, m) => sum + m.usageStats.averageResponseTime, 0) / this.models.size;
    }

    return {
      total: totalStats,
      byModel: modelStats
    };
  }
}

// Export singleton instance
export const aiModelHub = new AIModelHub();
