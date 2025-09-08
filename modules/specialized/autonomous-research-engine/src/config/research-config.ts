/**
 * ⚙️ Research Config - Configuration management for autonomous research
 * 
 * Comprehensive configuration system for managing AI research parameters,
 * domain settings, model configurations, and research objectives.
 */

export interface AutonomousResearchEngineConfig {
  researchDomains: string[];
  breakthroughThreshold: number;
  hypothesisGenerationRate: number;
  literatureUpdateInterval: number;
  validationCriteria: ValidationCriteria;
  knowledgeGraphConfig: KnowledgeGraphConfig;
  aiModelConfig: AIModelConfig;
  performanceConfig: PerformanceConfig;
  ethicsConfig: EthicsConfig;
}

export interface ValidationCriteria {
  statisticalSignificance: number;
  reproducibilityRequirement: number;
  noveltyThreshold: number;
  impactFactor: number;
  confidenceMinimum: number;
  evidenceRequirement: number;
}

export interface KnowledgeGraphConfig {
  maxNodes: number;
  relationshipTypes: string[];
  updateFrequency: number;
  clusteringAlgorithm: string;
  embeddingDimensions: number;
  similarityThreshold: number;
}

export interface AIModelConfig {
  primaryModel: string;
  backupModels: string[];
  temperatureSettings: TemperatureSettings;
  contextWindows: ContextWindows;
  tokensPerMinute: number;
  maxRetries: number;
}

export interface TemperatureSettings {
  hypothesis: number;
  analysis: number;
  synthesis: number;
  validation: number;
  creative: number;
}

export interface ContextWindows {
  literature: number;
  hypothesis: number;
  validation: number;
  synthesis: number;
  breakthrough: number;
}

export interface PerformanceConfig {
  maxConcurrentResearch: number;
  resourceAllocation: ResourceAllocation;
  timeoutSettings: TimeoutSettings;
  cachingConfig: CachingConfig;
}

export interface ResourceAllocation {
  cpuCores: number;
  memoryGB: number;
  gpuUnits: number;
  storageGB: number;
  networkBandwidth: number;
}

export interface TimeoutSettings {
  hypothesisGeneration: number;
  literatureAnalysis: number;
  validation: number;
  synthesis: number;
  breakthroughDetection: number;
}

export interface CachingConfig {
  enabled: boolean;
  ttlHours: number;
  maxSizeGB: number;
  compressionEnabled: boolean;
}

export interface EthicsConfig {
  humanValueAlignment: boolean;
  transparencyRequired: boolean;
  explainabilityLevel: number;
  riskAssessmentRequired: boolean;
  humanOversightThreshold: number;
}

/**
 * 🎛️ Research Config - Central configuration management
 */
export class ResearchConfig {
  private config: AutonomousResearchEngineConfig;
  private overrides: Map<string, any> = new Map();
  private configHistory: Array<{ timestamp: Date; config: Partial<AutonomousResearchEngineConfig> }> = [];

  constructor(config: AutonomousResearchEngineConfig) {
    this.config = this.validateAndMergeConfig(config);
    this.logConfigChange('Initial configuration loaded', config);
  }

  /**
   * 🎯 Get Research Domains - Retrieve configured research domains
   */
  getResearchDomains(): string[] {
    return this.getConfigValue('researchDomains') as string[];
  }

  /**
   * 🔄 Update Research Domains - Modify research focus areas
   */
  async updateResearchDomains(domains: string[]): Promise<void> {
    await this.updateConfig({ researchDomains: domains });
  }

  /**
   * 📊 Get Breakthrough Threshold - Retrieve breakthrough detection sensitivity
   */
  getBreakthroughThreshold(): number {
    return this.getConfigValue('breakthroughThreshold') as number;
  }

  /**
   * 🧠 Get AI Model Config - Retrieve AI model configuration
   */
  getAIModelConfig(): AIModelConfig {
    return this.getConfigValue('aiModelConfig') as AIModelConfig;
  }

  /**
   * ✅ Get Validation Criteria - Retrieve research validation requirements
   */
  getValidationCriteria(): ValidationCriteria {
    return this.getConfigValue('validationCriteria') as ValidationCriteria;
  }

  /**
   * 🌐 Get Knowledge Graph Config - Retrieve knowledge graph settings
   */
  getKnowledgeGraphConfig(): KnowledgeGraphConfig {
    return this.getConfigValue('knowledgeGraphConfig') as KnowledgeGraphConfig;
  }

  /**
   * ⚡ Get Performance Config - Retrieve performance settings
   */
  getPerformanceConfig(): PerformanceConfig {
    return this.getConfigValue('performanceConfig') as PerformanceConfig;
  }

  /**
   * 🛡️ Get Ethics Config - Retrieve ethical guidelines
   */
  getEthicsConfig(): EthicsConfig {
    return this.getConfigValue('ethicsConfig') as EthicsConfig;
  }

  /**
   * 🔧 Update Config - Update specific configuration values
   */
  async updateConfig(updates: Partial<AutonomousResearchEngineConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };
    
    this.logConfigChange('Configuration updated', updates);
    this.validateConfig(this.config);
  }

  /**
   * 🎚️ Set Override - Temporarily override configuration values
   */
  setOverride(key: string, value: any): void {
    this.overrides.set(key, value);
  }

  /**
   * 🗑️ Clear Override - Remove configuration override
   */
  clearOverride(key: string): void {
    this.overrides.delete(key);
  }

  /**
   * 📋 Get Full Config - Retrieve complete configuration
   */
  getFullConfig(): AutonomousResearchEngineConfig {
    const config = { ...this.config };
    
    // Apply overrides
    for (const [key, value] of this.overrides) {
      (config as any)[key] = value;
    }
    
    return config;
  }

  /**
   * 📈 Get Config History - Retrieve configuration change history
   */
  getConfigHistory(): Array<{ timestamp: Date; config: Partial<AutonomousResearchEngineConfig> }> {
    return [...this.configHistory];
  }

  /**
   * 🔍 Validate Research Domain - Check if domain is configured
   */
  isValidResearchDomain(domain: string): boolean {
    return this.getResearchDomains().includes(domain);
  }

  /**
   * 📊 Get Domain Specific Config - Retrieve domain-specific settings
   */
  getDomainSpecificConfig(domain: string): {
    hypothesisRate: number;
    validationStrict: boolean;
    breakthroughSensitivity: number;
  } {
    // Domain-specific configuration logic
    const baseConfig = {
      hypothesisRate: this.config.hypothesisGenerationRate,
      validationStrict: this.config.validationCriteria.reproducibilityRequirement > 0.8,
      breakthroughSensitivity: this.config.breakthroughThreshold
    };

    // Customize based on domain
    switch (domain.toLowerCase()) {
      case 'quantum_physics':
        return {
          ...baseConfig,
          breakthroughSensitivity: baseConfig.breakthroughSensitivity * 1.2,
          validationStrict: true
        };
      case 'ai_consciousness':
        return {
          ...baseConfig,
          hypothesisRate: baseConfig.hypothesisRate * 0.8,
          validationStrict: true
        };
      case 'biotechnology':
        return {
          ...baseConfig,
          validationStrict: true,
          breakthroughSensitivity: baseConfig.breakthroughSensitivity * 1.1
        };
      default:
        return baseConfig;
    }
  }

  // Private implementation methods

  private getConfigValue(key: keyof AutonomousResearchEngineConfig): any {
    // Check for override first
    if (this.overrides.has(key)) {
      return this.overrides.get(key);
    }
    
    return this.config[key];
  }

  private validateAndMergeConfig(config: AutonomousResearchEngineConfig): AutonomousResearchEngineConfig {
    const defaultConfig = this.getDefaultConfig();
    const mergedConfig = { ...defaultConfig, ...config };
    
    this.validateConfig(mergedConfig);
    return mergedConfig;
  }

  private getDefaultConfig(): AutonomousResearchEngineConfig {
    return {
      researchDomains: [
        'artificial_intelligence',
        'quantum_computing',
        'biotechnology',
        'nanotechnology',
        'consciousness_studies',
        'theoretical_physics',
        'computational_biology',
        'machine_learning',
        'cognitive_science',
        'complexity_science'
      ],
      breakthroughThreshold: 0.75,
      hypothesisGenerationRate: 10, // hypotheses per hour
      literatureUpdateInterval: 3600000, // 1 hour in milliseconds
      validationCriteria: {
        statisticalSignificance: 0.95,
        reproducibilityRequirement: 0.85,
        noveltyThreshold: 0.7,
        impactFactor: 0.6,
        confidenceMinimum: 0.8,
        evidenceRequirement: 0.75
      },
      knowledgeGraphConfig: {
        maxNodes: 1000000,
        relationshipTypes: [
          'causes',
          'influences',
          'correlates_with',
          'contradicts',
          'supports',
          'extends',
          'applies_to',
          'derived_from',
          'similar_to',
          'part_of'
        ],
        updateFrequency: 300000, // 5 minutes
        clusteringAlgorithm: 'leiden',
        embeddingDimensions: 768,
        similarityThreshold: 0.8
      },
      aiModelConfig: {
        primaryModel: 'gpt-4-turbo',
        backupModels: ['claude-3-opus', 'gemini-pro'],
        temperatureSettings: {
          hypothesis: 0.9,
          analysis: 0.3,
          synthesis: 0.7,
          validation: 0.1,
          creative: 1.0
        },
        contextWindows: {
          literature: 32000,
          hypothesis: 16000,
          validation: 24000,
          synthesis: 20000,
          breakthrough: 40000
        },
        tokensPerMinute: 10000,
        maxRetries: 3
      },
      performanceConfig: {
        maxConcurrentResearch: 10,
        resourceAllocation: {
          cpuCores: 16,
          memoryGB: 64,
          gpuUnits: 4,
          storageGB: 1000,
          networkBandwidth: 1000 // Mbps
        },
        timeoutSettings: {
          hypothesisGeneration: 300000, // 5 minutes
          literatureAnalysis: 1800000, // 30 minutes
          validation: 900000, // 15 minutes
          synthesis: 600000, // 10 minutes
          breakthroughDetection: 120000 // 2 minutes
        },
        cachingConfig: {
          enabled: true,
          ttlHours: 24,
          maxSizeGB: 10,
          compressionEnabled: true
        }
      },
      ethicsConfig: {
        humanValueAlignment: true,
        transparencyRequired: true,
        explainabilityLevel: 0.8,
        riskAssessmentRequired: true,
        humanOversightThreshold: 0.9
      }
    };
  }

  private validateConfig(config: AutonomousResearchEngineConfig): void {
    // Validate research domains
    if (!config.researchDomains || config.researchDomains.length === 0) {
      throw new Error('At least one research domain must be configured');
    }

    // Validate thresholds
    if (config.breakthroughThreshold < 0 || config.breakthroughThreshold > 1) {
      throw new Error('Breakthrough threshold must be between 0 and 1');
    }

    // Validate validation criteria
    const vc = config.validationCriteria;
    if (vc.statisticalSignificance < 0 || vc.statisticalSignificance > 1) {
      throw new Error('Statistical significance must be between 0 and 1');
    }

    // Validate AI model config
    if (!config.aiModelConfig.primaryModel) {
      throw new Error('Primary AI model must be specified');
    }

    // Validate performance config
    if (config.performanceConfig.maxConcurrentResearch <= 0) {
      throw new Error('Max concurrent research must be positive');
    }

    // Validate ethics config
    if (config.ethicsConfig.explainabilityLevel < 0 || config.ethicsConfig.explainabilityLevel > 1) {
      throw new Error('Explainability level must be between 0 and 1');
    }
  }

  private logConfigChange(reason: string, changes: Partial<AutonomousResearchEngineConfig>): void {
    this.configHistory.push({
      timestamp: new Date(),
      config: changes
    });

    // Keep only last 100 changes
    if (this.configHistory.length > 100) {
      this.configHistory = this.configHistory.slice(-100);
    }

    console.log(`⚙️ Config Change: ${reason}`, Object.keys(changes));
  }
}

export default ResearchConfig;
